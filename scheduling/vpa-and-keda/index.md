---
weight: 39
title: "VPA 与 KEDA：纵向扩缩与事件驱动扩缩"
linktitle: VPA 与 KEDA
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: vpa-and-keda
description: "介绍 HPA 之外的两类工作负载自动扩缩：Vertical Pod Autoscaler 的推荐器/更新器/准入控制器架构、Off/Initial/Recreate/InPlaceOrRecreate/InPlace 更新模式及与原地资源调整的结合；KEDA 的 ScaledObject/ScaledJob 模型、70+ 事件源 Scaler、缩容到零与 HPA 的协作；以及三者的组合策略与冲突规避。"
---

> HPA 回答"要几个副本"，VPA 回答"每个副本该多大"，KEDA 回答"该不该从零唤醒"——三者合在一起才是完整的工作负载弹性。

[HPA](../hpa) 是 Kubernetes 内置的水平扩缩器，但它依赖 CPU/内存等资源指标或需要自建指标适配器，且副本数最少为 1（`HPAScaleToZero` 在 v1.37 仍为 Beta 且默认关闭）。两个 SIG Autoscaling 与 CNCF 项目补足了这些空白：Vertical Pod Autoscaler（VPA）自动校准容器的资源 requests，KEDA 以事件源驱动水平扩缩并支持缩容到零。本文介绍两者的原理、配置与组合方式。

## Vertical Pod Autoscaler

资源 requests 决定调度、驱逐顺序、配额与节点扩缩的一切计算，但大多数团队要么凭经验填写、要么长期不更新，导致集群整体利用率普遍只有 20% – 40%。VPA 通过观察容器的历史用量持续生成推荐值，并可选地自动应用。

### 架构

VPA 由三个组件组成：

- **Recommender**：从 metrics-server（或 Prometheus）读取各容器的 CPU/内存用量，用衰减直方图计算 P50/P90/P95 等分位数，生成 `target`（推荐值）、`lowerBound`、`upperBound` 与 `uncappedTarget`；OOM 事件会使内存推荐立即上调
- **Updater**：比较运行中 Pod 的 requests 与推荐值，偏差超出阈值时驱逐 Pod（或在新模式下原地调整），遵守 PDB 与最小副本限制
- **Admission Controller**：变更准入 Webhook，在 Pod 创建时把推荐值写入 requests（与 limits 按原比例缩放）

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  updatePolicy:
    updateMode: "InPlaceOrRecreate"       # Off | Initial | Recreate | InPlaceOrRecreate | InPlace
    minReplicas: 2                         # 至少保留 2 个副本不被同时驱逐
  resourcePolicy:
    containerPolicies:
    - containerName: "*"
      minAllowed: { cpu: 100m, memory: 128Mi }
      maxAllowed: { cpu: "4", memory: 8Gi }
      controlledResources: ["cpu", "memory"]
      controlledValues: RequestsAndLimits  # 或 RequestsOnly，保留手工设置的 limits
    - containerName: istio-proxy
      mode: "Off"                          # 排除 Sidecar
```

### 更新模式

{{< table title="VPA 更新模式" >}}

| 模式 | 行为 | 适用 |
|------|------|------|
| `Off` | 只生成推荐写入 `status.recommendation`，不改变 Pod | 观察与容量规划，所有工作负载的起点 |
| `Initial` | 仅在 Pod 创建时应用推荐，运行中不改 | 不能容忍重启但部署频繁的服务 |
| `Recreate` | 偏差过大时驱逐 Pod 让其以新 requests 重建 | 批处理、可容忍重启的无状态服务 |
| `InPlaceOrRecreate` | 优先通过 [原地资源调整](../../pod/in-place-pod-resize) 修改 requests，不可行时回退到驱逐（VPA 1.5+ Beta） | 大多数生产服务的推荐模式（Kubernetes 1.33+） |
| `InPlace` | 只做原地调整，永不驱逐，不可行时推迟重试（VPA 1.7+ Alpha，需 `--feature-gates=InPlace=true`） | 完全不能接受中断的有状态服务 |

{{< /table >}}

`InPlaceOrRecreate` 把 VPA 从"周期性重启应用的工具"变成了近乎无感的持续调优：对配置了 `resizePolicy: NotRequired` 的容器，CPU 与内存上调不需要重启；内存 limit 下调在 `PreferNoRestart` 策略下仍会回退到重建；若调整会改变 Pod 的 QoS 等级（如从 Burstable 变为 Guaranteed）、被 kubelet 判定不可行、推迟超过 5 分钟或进行中超过 1 小时，同样回退。`--in-place-skip-disruption-budget` 标志允许对所有容器都无需重启的调整跳过 PDB 检查。

### 使用要点

- VPA 与 HPA **不能同时控制同一资源维度**：HPA 按 CPU 利用率扩缩时，VPA 调整 CPU requests 会改变利用率计算基准导致震荡；常见组合是 HPA 用自定义指标（QPS、队列长度）或 KEDA 控制副本数，VPA 只管 requests
- JVM 等启动时按固定堆大小分配内存的应用，内存推荐应配合 `minAllowed` 并关注 `upperBound`
- 推荐值基于至少 8 天的历史（可配置），新部署的工作负载前几天的推荐不可靠
- Recommender 默认依赖 metrics-server，大集群建议改用 Prometheus 作为历史存储（`--storage=prometheus`）以在 Recommender 重启后保留历史
- `kubectl describe vpa api` 可查看推荐与各容器的上下界，Goldilocks 等工具提供集群级仪表盘

## KEDA：事件驱动扩缩

[KEDA](https://keda.sh/)（Kubernetes Event-driven Autoscaling，CNCF 毕业项目，当前 v2.21）让工作负载按外部事件源的指标扩缩——消息队列积压、数据库行数、HTTP 请求率、云监控指标、Cron 时间表等——并支持缩容到零与从零激活。它不替代 HPA，而是作为 HPA 的外部指标提供者：

1. KEDA Operator 监听 `ScaledObject`，为目标工作负载自动创建并管理一个 HPA（`minReplicaCount` 到 `maxReplicaCount` 区间）
2. KEDA Metrics Server 把各 Scaler 的指标通过 `external.metrics.k8s.io` 聚合 API 暴露给 HPA
3. 在 0 与 1 副本之间的切换由 KEDA 自己完成（HPA 不能管理 0 副本）：事件源出现待处理项时 KEDA 把副本从 0 拉到 1（激活），之后交给 HPA；无事件持续 `cooldownPeriod` 后再缩回 0

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: order-worker
  namespace: prod
spec:
  scaleTargetRef:
    name: order-worker                    # Deployment / StatefulSet / 任意带 scale 子资源的 CR
  pollingInterval: 30                     # 查询事件源的间隔（秒）
  cooldownPeriod: 300                     # 最后一次活跃后多久缩到 0
  idleReplicaCount: 0                     # 空闲时的副本数（必须小于 minReplicaCount）
  minReplicaCount: 1
  maxReplicaCount: 50
  fallback:                               # 事件源不可达时的保底副本数
    failureThreshold: 3
    replicas: 5
  advanced:
    horizontalPodAutoscalerConfig:
      behavior:                           # 直接透传给 HPA 的 behavior
        scaleDown:
          stabilizationWindowSeconds: 120
  triggers:
  - type: kafka
    metadata:
      bootstrapServers: kafka.prod.svc:9092
      consumerGroup: order-worker
      topic: orders
      lagThreshold: "100"                 # 每副本期望处理的积压量
      activationLagThreshold: "1"         # 积压 ≥ 1 即从 0 激活
    authenticationRef:
      name: kafka-creds
  - type: prometheus
    metadata:
      serverAddress: http://prometheus.monitoring.svc:9090
      query: sum(rate(http_requests_total{service="order-worker"}[2m]))
      threshold: "50"
---
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata:
  name: kafka-creds
  namespace: prod
spec:
  secretTargetRef:
  - parameter: sasl
    name: kafka-secret
    key: sasl
  - parameter: username
    name: kafka-secret
    key: username
  - parameter: password
    name: kafka-secret
    key: password
```

多个触发器默认取各自计算出的副本数的最大值，`advanced.scalingModifiers` 可用公式组合多个指标。`TriggerAuthentication`/`ClusterTriggerAuthentication` 把凭据从 ScaledObject 中分离，支持 Secret、环境变量、Vault、云 Pod 身份（AWS IRSA/Pod Identity、Azure Workload Identity、GCP Workload Identity）。

### ScaledJob

对"每条消息一个任务"的批处理模式，`ScaledJob` 按队列长度直接创建 Job 而非扩缩 Deployment：每个 Job 处理完即退出，不存在长驻消费者被缩容时打断处理的问题，适合视频转码、报表生成、AI 批量推理等长任务。

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledJob
metadata:
  name: transcode
spec:
  jobTargetRef:
    parallelism: 1
    completions: 1
    backoffLimit: 2
    template:
      spec:
        restartPolicy: Never
        containers:
        - name: worker
          image: registry.example.com/transcoder:1.0
  pollingInterval: 15
  maxReplicaCount: 100
  successfulJobsHistoryLimit: 5
  scalingStrategy:
    strategy: accurate                    # 按队列长度减去运行中 Job 数精确创建
  triggers:
  - type: aws-sqs-queue
    metadata:
      queueURL: https://sqs.us-west-2.amazonaws.com/123456789012/transcode
      queueLength: "1"
      awsRegion: us-west-2
    authenticationRef:
      name: aws-pod-identity
```

### 常用 Scaler

KEDA 内置 70 余种 Scaler，覆盖消息系统（Kafka、RabbitMQ、NATS、Pulsar、SQS、Azure Service Bus、Pub/Sub）、数据库（PostgreSQL、MySQL、MongoDB、Redis、Elasticsearch）、监控系统（Prometheus、Datadog、CloudWatch、Azure Monitor、Stackdriver）、CI 系统（GitHub Runner、GitLab Runner、Azure Pipelines）、以及 `cron`（按时间表预扩）、`cpu`/`memory`（与 HPA 相同的资源指标）和 `kubernetes-workload`（按另一个工作负载的 Pod 数）。HTTP 请求驱动的缩容到零需要额外的 [KEDA HTTP Add-on](https://github.com/kedacore/http-add-on)，它在请求路径上插入拦截器缓冲冷启动期间的请求——这与 Knative Serving 的 Activator 思路相同，后者在 [Serverless](../../serverless/knative) 章节介绍。

## 三者的组合策略

{{< table title="HPA、VPA 与 KEDA 的分工" >}}

| 需求 | 方案 |
|------|------|
| 按 CPU/内存利用率扩缩副本 | HPA（或 KEDA 的 cpu/memory Scaler，便于统一管理） |
| 按队列积压、请求率、业务指标扩缩 | KEDA（自动创建 HPA） |
| 空闲时缩到零 | KEDA（`idleReplicaCount: 0`）；HTTP 服务加 HTTP Add-on 或改用 Knative |
| 校准 requests、消除过度申请 | VPA（`Off` 观察 → `InPlaceOrRecreate` 自动） |
| 副本数与 requests 同时自动化 | KEDA/HPA 用非资源指标控制副本，VPA 控制 requests，避免同一维度冲突 |
| 批处理任务按事件创建 | KEDA ScaledJob，或 Kueue 配合 [Job](../job-advanced) |
| 定时预扩容应对可预期高峰 | KEDA `cron` Scaler 叠加其他触发器 |

{{< /table >}}

所有工作负载层的扩缩最终都要落到节点容量上，副本增加导致 Pending 时由 [节点自动扩缩](../../operation/node-autoscaling) 补充节点；VPA 上调 requests 同样可能触发节点扩容。把 VPA 的 `maxAllowed` 设在节点可分配资源以内，可以避免推荐出任何节点都放不下的 Pod。

## 总结

VPA 与 KEDA 分别从纵向与事件两个维度补全了 Kubernetes 的工作负载弹性：VPA 用持续观测取代手工估算 requests，借助原地资源调整在不重启的前提下自动校准；KEDA 让副本数跟随业务事件而非资源利用率变化，并补上 HPA 缺失的缩容到零能力。实践中应以"HPA/KEDA 控制副本数、VPA 控制单副本大小、两者不触碰同一指标"为原则，再由节点自动扩缩兜底容量，形成从事件到节点的完整弹性链路。

## 参考文献

- [Vertical Pod Autoscaler - github.com](https://github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler)
- [VPA Features: In-Place Updates - github.com](https://github.com/kubernetes/autoscaler/blob/master/vertical-pod-autoscaler/docs/features.md)
- [KEDA Documentation - keda.sh](https://keda.sh/docs/)
- [KEDA ScaledObject specification - keda.sh](https://keda.sh/docs/latest/reference/scaledobject-spec/)
- [KEDA Scalers - keda.sh](https://keda.sh/docs/latest/scalers/)
- [KEDA HTTP Add-on - github.com](https://github.com/kedacore/http-add-on)
- [Horizontal Pod Autoscaling - kubernetes.io](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
