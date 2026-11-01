---
weight: 34
title: "Job 高级特性与批处理生态：Indexed Job、失败/成功策略、JobSet 与 Kueue"
linktitle: Job 高级特性与批处理生态
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: job-advanced
description: "深入 Kubernetes Job 在 v1.29–v1.35 间 GA 的高级特性：Indexed Job 与弹性索引、Pod 失败策略、成功策略、按索引退避、suspend 与 managedBy，并介绍 JobSet、Kueue 以及核心调度器的成组调度如何在这些原语之上构建分布式训练与多租户批处理平台。"
---

> 把失败分成"值得重试"和"不必重试"、把成功定义为"关键分片完成"，Job 这几年补上的正是批处理最需要的那点语义。

Job 控制器的基本模型很简单：按 `completions` 与 `parallelism` 创建 Pod，直到足够数量的 Pod 成功。但真实的批处理与 AI 训练负载远比这复杂：几百个 worker 需要稳定的身份互相发现；一次被抢占不该消耗宝贵的重试次数；配置错误应当立即失败而非重试六次；只要 leader 完成就应判定整个作业成功；集群资源紧张时作业应排队而不是把 Pod 堆在 Pending。Kubernetes 在 v1.29 到 v1.35 之间陆续让这些能力 GA，并由 JobSet、Kueue 等 SIG 项目在其上构建完整的批处理平台。本文假定读者已了解 [Job](../job) 的基本用法。

## Job 高级特性一览

{{< table title="Job 高级特性及其 GA 版本" >}}

| 特性                 | 字段                                        | GA 版本 | 解决的问题                                   |
|----------------------|---------------------------------------------|---------|----------------------------------------------|
| Indexed Job          | `completionMode: Indexed`                   | v1.24   | 为每个 Pod 分配稳定索引，支持分片与集合通信   |
| 弹性 Indexed Job     | 同时修改 `parallelism` 与 `completions`     | v1.31   | 训练中途按资源伸缩 worker 数量                |
| Pod 失败策略         | `podFailurePolicy`                          | v1.31   | 按退出码/Pod 条件区分重试、忽略、直接失败      |
| 按索引退避           | `backoffLimitPerIndex`、`maxFailedIndexes`  | v1.33   | 单个索引的失败不影响其他索引的重试预算        |
| 成功策略             | `successPolicy`                             | v1.33   | 指定索引或数量成功即判定 Job 成功             |
| Pod 替换策略         | `podReplacementPolicy: Failed`              | v1.34   | 等旧 Pod 完全终止后再创建替代 Pod，避免并发超额 |
| 外部管理             | `managedBy`                                 | v1.35   | 把 Job 的状态同步交给 Kueue 等外部控制器       |
| 挂起                 | `suspend`                                   | v1.24   | 创建后暂不启动，供排队系统控制开始时机         |

{{< /table >}}

## Indexed Job 与弹性索引

`completionMode: Indexed` 让 Job 为每个成功完成的 Pod 分配一个 0 到 `completions-1` 的唯一索引。索引通过 `batch.kubernetes.io/job-completion-index` 注解、`JOB_COMPLETION_INDEX` 环境变量以及 Pod 主机名（`<job-name>-<index>`）暴露给容器。配合无头 Service，worker 之间即可通过 `<job>-<index>.<service>` 稳定寻址，这是 PyTorch、MPI 等分布式训练框架建立通信组的基础：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: trainer
spec:
  clusterIP: None
  selector:
    job-name: trainer
---
apiVersion: batch/v1
kind: Job
metadata:
  name: trainer
spec:
  completionMode: Indexed
  completions: 4
  parallelism: 4
  template:
    spec:
      subdomain: trainer          # 与无头 Service 同名，使主机名可解析
      restartPolicy: Never
      containers:
      - name: worker
        image: my-trainer:1.0
        env:
        - name: MASTER_ADDR
          value: trainer-0.trainer
        - name: RANK
          valueFrom:
            fieldRef:
              fieldPath: metadata.annotations['batch.kubernetes.io/job-completion-index']
```

v1.31 GA 的弹性 Indexed Job 允许在 Job 运行中**同时**把 `parallelism` 与 `completions` 改为相同的新值，用于根据可用 GPU 动态增减 worker 数量；只改其中一个会被 API Server 拒绝。

## Pod 失败策略

默认情况下 Job 对所有 Pod 失败一视同仁：每次失败计入 `backoffLimit`，用尽后 Job 失败。`podFailurePolicy`（v1.31 GA）允许按规则区分失败原因，规则按顺序匹配、首条命中生效：

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: etl
spec:
  completions: 10
  parallelism: 5
  backoffLimit: 6
  podFailurePolicy:
    rules:
    - action: FailJob             # 软件缺陷：立即失败，不浪费重试
      onExitCodes:
        containerName: main
        operator: In
        values: [42]
    - action: Ignore              # 基础设施打断：不计入 backoffLimit
      onPodConditions:
      - type: DisruptionTarget
    - action: Count               # 其他失败：按默认逻辑计数
      onExitCodes:
        operator: NotIn
        values: [0]
  template:
    spec:
      restartPolicy: Never        # 使用 podFailurePolicy 时必须为 Never
      containers:
      - name: main
        image: my-etl:1.0
```

四种动作的含义如下：

- `FailJob`：立即把整个 Job 标记为失败并终止所有 Pod
- `Ignore`：不计入 `backoffLimit`，直接创建替代 Pod；典型用于抢占、驱逐、节点维护等带有 `DisruptionTarget` 条件的场景
- `Count`：按默认方式计入失败次数
- `FailIndex`：仅把当前索引标记为失败（需配合 `backoffLimitPerIndex`）

`onExitCodes` 可以限定容器名并使用 `In`/`NotIn` 匹配退出码；`onPodConditions` 匹配 Pod 条件，目前最有价值的就是 Kubernetes 在抢占、驱逐、节点压力驱逐时自动添加的 `DisruptionTarget`。

## 按索引退避与成功策略

### backoffLimitPerIndex

Indexed Job 中某个数据分片有问题时，默认的全局 `backoffLimit` 会被这一个索引的反复失败耗尽，拖累所有健康分片。`backoffLimitPerIndex`（v1.33 GA）为每个索引单独设置重试上限，`maxFailedIndexes` 则限制允许失败的索引总数：

```yaml
spec:
  completionMode: Indexed
  completions: 100
  parallelism: 20
  backoffLimitPerIndex: 2      # 每个索引最多重试 2 次
  maxFailedIndexes: 5          # 超过 5 个索引失败则整个 Job 失败
```

失败的索引记录在 `status.failedIndexes` 中，其余索引照常运行并完成；Job 最终状态为 `Failed`，但已经成功的分片结果得以保留，便于只重跑失败分片。

### successPolicy

默认要求全部 `completions` 成功才算 Job 成功。在 leader-worker 模式中，leader 完成通常意味着任务已结束，worker 是否"正常退出"并不重要。`successPolicy`（v1.33 GA）允许声明"哪些索引成功即视为整体成功"，满足后 Job 立即进入 `Complete` 并终止剩余 Pod：

```yaml
spec:
  completionMode: Indexed
  completions: 8
  parallelism: 8
  successPolicy:
    rules:
    - succeededIndexes: "0"        # 索引 0（leader）成功即可
    - succeededCount: 6            # 或者任意 6 个索引成功
```

多条规则之间为"或"关系；同一规则内 `succeededIndexes` 与 `succeededCount` 同时出现时为"与"关系。满足成功策略后 Job 会带上 `SuccessCriteriaMet` 条件。

## suspend 与 managedBy

`spec.suspend: true` 让 Job 创建后不启动任何 Pod（已在运行的 Pod 会被删除并在恢复后重建），`status.startTime` 也会在恢复时重置。它是所有排队系统的基础原语：Kueue 以 `suspend: true` 接管 Job，等配额满足后再把它置为 `false`。

`spec.managedBy`（v1.35 GA）更进一步：当该字段不是默认的 `kubernetes.io/job-controller` 时，内建 Job 控制器完全不处理这个 Job，由字段指定的外部控制器负责创建 Pod 与同步状态。多集群场景下，Kueue 的 MultiKueue 借此在管理集群保留一个"影子 Job"（`managedBy: kueue.x-k8s.io/multikueue`），把实际执行调度到工作集群，并把远端状态回填到影子 Job 上。

## JobSet：多角色分布式作业

单个 Job 的所有 Pod 共享同一个模板，而分布式训练通常需要 driver/worker、parameter-server/worker 等多种角色，还要求"任一角色失败则整体重启"。[JobSet](https://jobset.sigs.k8s.io/)（`sigs.k8s.io/jobset`，当前 API `jobset.x-k8s.io/v1alpha2`，最新版本 v0.13）在 Job 之上提供了这一层抽象：

```yaml
apiVersion: jobset.x-k8s.io/v1alpha2
kind: JobSet
metadata:
  name: pytorch-ddp
spec:
  successPolicy:
    operator: All
    targetReplicatedJobs: [workers]   # workers 全部完成即成功，自动清理其他角色
  failurePolicy:
    maxRestarts: 3                    # 任一 Job 失败则整体重启，最多 3 次
  network:
    enableDNSHostnames: true          # 自动创建无头 Service，Pod 可通过 <jobset>-<job>-<replica>-<index> 寻址
  replicatedJobs:
  - name: leader
    replicas: 1
    template:
      spec:
        backoffLimit: 0
        completions: 1
        parallelism: 1
        template:
          spec:
            containers:
            - name: leader
              image: my-trainer:1.0
              args: ["--role=leader"]
  - name: workers
    replicas: 1
    template:
      spec:
        backoffLimit: 0
        completionMode: Indexed
        completions: 4
        parallelism: 4
        template:
          spec:
            containers:
            - name: worker
              image: my-trainer:1.0
              args: ["--role=worker", "--leader=pytorch-ddp-leader-0-0.pytorch-ddp"]
              resources:
                limits:
                  nvidia.com/gpu: 1
```

JobSet 的核心能力包括：多组 `replicatedJobs` 各自拥有独立模板与副本数；JobSet 级别的成功/失败策略与重启计数；自动管理的无头 Service 与可预测的主机名；`startupPolicy` 控制角色启动顺序；按拓扑域独占放置（exclusive placement）以保证一个训练切片落在同一机架或 TPU slice；以及与 Kueue 的原生集成。Kubeflow Trainer v2 已把 JobSet 作为底层运行时，PyTorch、JAX 等框架的训练作业最终都会落为 JobSet。

## Kueue：作业排队与配额

Job 本身只管"怎么跑"，不管"什么时候能跑"。当多个团队共享一个 GPU 集群时，需要一个排队层决定作业的准入顺序、公平配额与抢占。[Kueue](https://kueue.sigs.k8s.io/)（`sigs.k8s.io/kueue`，当前 API `kueue.x-k8s.io/v1beta2`，最新版本 v0.20）正是这一层。它不替换调度器，而是利用 Job 的 `suspend` 字段（以及 v1.30 GA 的 Pod 调度门控）控制作业何时进入 kube-scheduler。

Kueue 的核心对象如下：

```yaml
apiVersion: kueue.x-k8s.io/v1beta2
kind: ResourceFlavor
metadata:
  name: h100
spec:
  nodeLabels:
    gpu-type: h100
---
apiVersion: kueue.x-k8s.io/v1beta2
kind: ClusterQueue
metadata:
  name: ml-team
spec:
  namespaceSelector: {}
  cohort: shared-gpu              # 同一 cohort 内的队列可以互相借用闲置配额
  preemption:
    reclaimWithinCohort: Any
  resourceGroups:
  - coveredResources: ["cpu", "memory", "nvidia.com/gpu"]
    flavors:
    - name: h100
      resources:
      - name: cpu
        nominalQuota: 200
      - name: memory
        nominalQuota: 1600Gi
      - name: nvidia.com/gpu
        nominalQuota: 64
---
apiVersion: kueue.x-k8s.io/v1beta2
kind: LocalQueue
metadata:
  namespace: ml-team
  name: default
spec:
  clusterQueue: ml-team
```

用户只需在 Job（或 JobSet、RayJob、Pod 组等）上打标签即可进入队列：

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  generateName: train-
  namespace: ml-team
  labels:
    kueue.x-k8s.io/queue-name: default
spec:
  suspend: true                   # Kueue 的 Webhook 会自动设置，这里显式写出便于理解
  parallelism: 8
  completions: 8
  completionMode: Indexed
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: worker
        image: my-trainer:1.0
        resources:
          requests:
            cpu: "8"
            memory: "64Gi"
            nvidia.com/gpu: "1"
```

Kueue 为每个作业创建一个 `Workload` 对象，按 ClusterQueue 的配额、优先级与公平共享策略决定准入；准入时把 `suspend` 置为 `false` 并注入 `nodeSelector` 把 Pod 引导到对应 ResourceFlavor 的节点。它还支持借用与抢占、全有或全无（all-or-nothing）准入、拓扑感知调度、多集群分发（MultiKueue）以及对 Job 之外多种工作负载类型的集成。官方推荐在 Kubernetes 1.34+ 上运行。

## 核心调度器的成组调度

Kueue 的全有或全无准入解决的是"配额层面"的问题；在节点层面，调度器仍可能只把 8 个 worker 中的 6 个放到节点上，剩余 2 个 Pending 导致已启动的 6 个空转占着 GPU。核心调度器在 v1.35 引入、v1.37 升级为 Beta 的成组调度（Gang Scheduling，`Workload`/`PodGroup` API）正面解决这一问题：同一 PodGroup 中的 Pod 要么全部绑定，要么全部等待。v1.37 还引入了 PodGroup 级抢占策略（Alpha），使抢占可以整个 PodGroup 为单位进行。Job 可以通过 `spec` 中的成组调度字段（v1.36 Alpha）声明最小成组数量，JobSet 与 Kueue 已开始对接这一原生机制，长期看将减少对 Volcano、YuniKorn 等第三方批调度器的依赖。

## 实践建议

- 所有批处理作业设置 `ttlSecondsAfterFinished`，避免 Job 与 Pod 对象堆积
- 使用 `podFailurePolicy` 忽略 `DisruptionTarget`，让 Spot/抢占式节点上的训练不会因驱逐而耗尽重试
- 大规模分片处理用 Indexed Job + `backoffLimitPerIndex` + `maxFailedIndexes`，失败后只重跑 `status.failedIndexes`
- 多角色训练优先用 JobSet 而不是手写多个 Job 与 Service
- 共享集群先部署 Kueue 建立配额与排队，再考虑成组调度与抢占策略
- 需要跨集群调度 AI 作业时，评估 MultiKueue 与 `managedBy` 机制

## 总结

Indexed Job、失败策略、成功策略、按索引退避、`suspend` 与 `managedBy` 共同把 Job 从"跑完 N 个 Pod"升级为可表达复杂批处理语义的原语；JobSet 在其上定义多角色分布式作业，Kueue 负责配额与排队，核心调度器的成组调度则补齐节点层面的全有或全无保证。理解这几层的分工，是在 Kubernetes 上构建 AI 训练与大规模数据处理平台的基础。

## 参考文献

- [Jobs - kubernetes.io](https://kubernetes.io/docs/concepts/workloads/controllers/job/)
- [Handling retriable and non-retriable pod failures with Pod failure policy - kubernetes.io](https://kubernetes.io/docs/tasks/job/pod-failure-policy/)
- [Indexed Job for Parallel Processing with Static Work Assignment - kubernetes.io](https://kubernetes.io/docs/tasks/job/indexed-parallel-processing-static/)
- [JobSet - jobset.sigs.k8s.io](https://jobset.sigs.k8s.io/)
- [Kueue - kueue.sigs.k8s.io](https://kueue.sigs.k8s.io/)
- [Kubernetes v1.33: Octarine 发布说明（Job successPolicy 与 backoffLimitPerIndex GA）- kubernetes.io](https://kubernetes.io/blog/2025/04/23/kubernetes-v1-33-release/)
- [Kubernetes v1.31: Elli 发布说明（Pod 失败策略与弹性 Indexed Job GA）- kubernetes.io](https://kubernetes.io/blog/2024/08/13/kubernetes-v1-31-release/)
