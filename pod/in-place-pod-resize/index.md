---
weight: 10
title: "Pod 原地资源调整与 Pod 级资源"
linktitle: 原地资源调整
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: in-place-pod-resize
description: "介绍 Kubernetes v1.35 GA 的 Pod 原地资源调整（In-place Pod Resize）：resizePolicy、resize 子资源、PodResizePending/PodResizeInProgress 条件、与 QoS 和 VPA 的关系，以及 v1.34 起 Beta 的 Pod 级资源（spec.resources）。"
---

> "改一下 CPU 就得重建 Pod"曾是 Kubernetes 最反直觉的限制之一，原地资源调整的 GA 让垂直扩缩容终于成为一等公民。

长期以来，Pod 的 `spec.containers[].resources` 在创建后不可修改，任何资源调整都意味着删除并重建 Pod。对有状态服务、长连接网关、JVM 这类启动缓慢或不能随意中断的工作负载而言，这使得垂直扩缩容在实践中几乎不可用。Kubernetes v1.27 以 Alpha 形式引入原地 Pod 资源调整（In-place Pod Resize，KEP-1287），v1.33 进入 Beta 并默认开启，v1.35 正式 GA。与之配套的 Pod 级资源（Pod-level Resources，KEP-2837）则在 v1.34 进入 Beta，为多容器 Pod 提供了共享资源预算的新模型。

## 原地资源调整

原地资源调整允许直接修改运行中 Pod 的容器 `requests` 与 `limits`（目前限于 `cpu` 与 `memory`），由 kubelet 在不重建 Pod、默认也不重启容器的前提下更新 cgroup 配置。

### 基本用法

资源修改必须通过 Pod 的 `resize` 子资源提交，直接 `kubectl edit pod` 修改 `resources` 仍会被拒绝。以下命令把容器 `app` 的 CPU 请求从 500m 调整为 1：

```bash
kubectl patch pod web-0 --subresource=resize --patch \
  '{"spec":{"containers":[{"name":"app","resources":{"requests":{"cpu":"1"},"limits":{"cpu":"2"}}}]}}'
```

`kubectl apply`、`kubectl edit` 同样支持 `--subresource=resize`。把 `resize` 做成独立子资源的好处是可以通过 RBAC 单独授权：VPA 或平台控制器可以只拥有调整资源的权限，而无法修改 Pod 的其他字段。

### 重启策略

并非所有运行时都能在线接受新的资源配置，例如 JVM 的堆大小通常在启动时固定。`resizePolicy` 字段允许按资源类型声明调整时是否需要重启容器：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-0
spec:
  containers:
  - name: app
    image: my-app:1.0
    resources:
      requests:
        cpu: "500m"
        memory: "512Mi"
      limits:
        cpu: "1"
        memory: "1Gi"
    resizePolicy:
    - resourceName: cpu
      restartPolicy: NotRequired      # 默认值：直接更新 cgroup，不重启
    - resourceName: memory
      restartPolicy: RestartContainer # 内存变更需要重启该容器
```

`RestartContainer` 只重启对应的容器，Pod 本身、其 IP 与其他容器不受影响。需要注意的是，Pod 的 `restartPolicy: Never` 与容器的 `RestartContainer` 冲突，API Server 会拒绝这样的组合。

### 状态观察

调整请求并不保证立即生效：节点可能暂时没有足够资源，或请求根本超出节点容量。kubelet 通过两个 Pod 条件反馈进度，取代了 Beta 之前的 `status.resize` 字段：

{{< table title="原地资源调整相关的 Pod 条件" >}}

| 条件类型               | `reason`     | 含义                                                         |
|------------------------|--------------|--------------------------------------------------------------|
| `PodResizePending`     | `Deferred`   | 节点当前资源不足，kubelet 会在资源释放后重试                   |
| `PodResizePending`     | `Infeasible` | 请求超出节点可分配总量，除非修改请求否则不会生效                |
| `PodResizeInProgress`  | —            | kubelet 已接受请求并正在更新 cgroup/重启容器；若失败则带有 `Error` 原因 |

{{< /table >}}

与此同时，`status.containerStatuses[].resources` 反映容器**实际生效**的资源，`status.containerStatuses[].allocatedResources` 反映 kubelet 已经为该容器**预留**的资源（调度器据此计算节点剩余容量）。排障时可以对比这三组值：

```bash
kubectl get pod web-0 -o jsonpath='{range .status.conditions[?(@.type=="PodResizePending")]}{.reason}: {.message}{"\n"}{end}'
kubectl get pod web-0 -o jsonpath='{.status.containerStatuses[0].resources}'
```

### 与 QoS 的关系

Pod 的 QoS 等级在创建时确定且不可变，原地调整不能跨越 QoS 边界：

- Guaranteed Pod 调整后必须仍满足所有容器 `requests == limits`
- Burstable Pod 不能把所有资源都删掉变成 BestEffort，也不能变成 Guaranteed
- BestEffort Pod 不能新增 `requests`/`limits`

此外，使用静态 CPU 管理策略（独占 CPU 核）或内存管理器的 Guaranteed Pod，其独占资源的在线调整受独立的特性门控控制（`InPlacePodVerticalScalingExclusiveCPUs`、`InPlacePodVerticalScalingExclusiveMemory`），v1.37 仍为 Alpha。

### 当前限制

GA 并不意味着没有边界，官方文档列出的 v1.37 限制包括：

- 只支持 `cpu` 与 `memory`，不支持扩展资源、临时存储、hugepages
- 支持普通容器与原生 Sidecar 容器，不支持普通（不可重启的）Init 容器与临时容器
- 已设置的 `requests`/`limits` 只能改值，不能整个删除
- 内存 `limits` 调小时，若容器当前用量高于新上限，kubelet 会跳过本次调整并保持 `InProgress` 状态，属于尽力而为的 OOM 规避而非保证
- 使用静态 CPU 管理策略或内存管理器策略的 Pod 不能原地调整；使用 swap 的 Pod 调整内存请求时必须把 memory 的 `resizePolicy` 设为 `RestartContainer`
- 调整不会触发重新调度：若节点容量不足，Pod 停留在 `Deferred` 状态；由调度器抢占来腾出空间的能力（`InPlacePodVerticalScalingSchedulerPreemption`）在 v1.37 为 Alpha
- `medium: Memory` 的 emptyDir 卷可随内存一起原地调整，但要求 cgroup v2；磁盘型 emptyDir 与持久卷不能通过 `resize` 子资源调整
- Windows Pod 不支持原地调整
- 由 Deployment 等控制器管理的 Pod，若只修改单个 Pod 而不更新模板，下一次滚动更新会把资源复原；生产中应通过 VPA 或直接更新工作负载模板

### 与 VPA 的配合

垂直 Pod 自动扩缩器（Vertical Pod Autoscaler，VPA）是原地调整最自然的消费者。VPA 提供 `InPlaceOrRecreate` 更新模式：优先尝试原地调整，仅在原地调整不可行（例如需要跨 QoS、节点资源不足）时回退到驱逐重建。

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: StatefulSet
    name: web
  updatePolicy:
    updateMode: InPlaceOrRecreate
  resourcePolicy:
    containerPolicies:
    - containerName: app
      minAllowed:
        cpu: "250m"
        memory: "256Mi"
      maxAllowed:
        cpu: "4"
        memory: "8Gi"
```

同一工作负载上避免让 HPA 与 VPA 同时基于 CPU/内存做决策，否则二者会互相干扰；常见组合是 HPA 看业务指标、VPA 负责资源配额。

## Pod 级资源

传统模型要求为**每个容器**分别声明 `requests`/`limits`，Pod 的总资源是容器之和。对包含多个容器（尤其是 Sidecar）的 Pod，这带来两个问题：各容器的峰值并不同时出现，分别预留会造成浪费；某个容器超限会被单独 OOM，即便 Pod 整体仍有余量。Pod 级资源（v1.32 Alpha，v1.34 Beta 并默认开启）允许在 `spec.resources` 中为整个 Pod 声明资源预算：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-sidecar
spec:
  resources:                 # Pod 级资源
    requests:
      cpu: "1"
      memory: "1Gi"
    limits:
      cpu: "2"
      memory: "2Gi"
  initContainers:
  - name: log-agent
    image: fluent/fluent-bit:3.2
    restartPolicy: Always    # 不单独声明资源，与主容器共享 Pod 预算
  containers:
  - name: app
    image: my-app:1.0
    resources:
      limits:
        memory: "1.5Gi"      # 可选：容器级 limits 仍可作为上限叠加
```

Pod 级资源的语义如下：

- **调度**：调度器以 Pod 级 `requests` 为准，不再累加容器请求
- **cgroup**：kubelet 把 Pod 级 `limits` 写入 Pod 的 cgroup，容器之间可以动态共享这部分额度；未声明 `limits` 的容器只受 Pod 级上限约束
- **与容器级资源共存**：容器级 `requests` 之和不得超过 Pod 级 `requests`，容器级 `limits` 不得超过 Pod 级 `limits`
- **QoS**：QoS 等级依据 Pod 级字段判断，`requests == limits` 即为 Guaranteed
- **支持的资源**：`cpu`、`memory` 与 hugepages；Windows Pod 不支持

Pod 级资源与原地调整的组合（`InPlacePodLevelResourcesVerticalScaling`）在 v1.37 仍为 Alpha，即 GA 的原地调整目前只针对容器级字段。把 Pod 级资源与 CPU 管理器、内存管理器、拓扑管理器打通的工作（`PodLevelResourceManagers`）在 v1.37 为 Beta 但默认关闭，未启用时这些管理器仍按容器级资源做对齐。

## 实践建议

- 需要垂直弹性的有状态服务，为内存设置 `RestartContainer`、为 CPU 保持 `NotRequired`，再交给 VPA 的 `InPlaceOrRecreate` 模式管理
- 监控 `PodResizePending` 条件，`Infeasible` 通常意味着需要更换节点规格或调整 VPA 的 `maxAllowed`
- 为 Sidecar 较多的 Pod 评估 Pod 级资源，通常可以显著降低总预留量
- 原地调整与 Pod 级资源都要求节点使用 cgroup v2 才能获得完整语义
- 通过 RBAC 把 `pods/resize` 子资源的 `patch` 权限单独授予自动化组件，避免把 Pod 的完整写权限下放

## 总结

原地资源调整把"修改资源 = 重建 Pod"这一长期限制彻底移除，`resizePolicy` 让应用按自身特性决定是否需要重启，`PodResizePending`/`PodResizeInProgress` 条件提供了清晰的可观测性；Pod 级资源则在多容器场景下用共享预算替代逐容器预留。二者共同为 VPA 等垂直弹性方案提供了可靠的底层能力，是 Kubernetes 资源模型近年来最重要的演进。

## 参考文献

- [Resize CPU and Memory Resources assigned to Containers - kubernetes.io](https://kubernetes.io/docs/tasks/configure-pod-container/resize-container-resources/)
- [Assign Pod-level CPU and memory resources - kubernetes.io](https://kubernetes.io/docs/tasks/configure-pod-container/assign-pod-level-resources/)
- [Kubernetes v1.33: In-Place Pod Resize Graduates to Beta - kubernetes.io](https://kubernetes.io/blog/2025/05/16/kubernetes-v1-33-in-place-pod-resize-beta/)
- [KEP-1287: In-Place Update of Pod Resources - github.com](https://github.com/kubernetes/enhancements/tree/master/keps/sig-node/1287-in-place-update-pod-resources)
- [KEP-2837: Pod Level Resources - github.com](https://github.com/kubernetes/enhancements/tree/master/keps/sig-node/2837-pod-level-resource-spec)
