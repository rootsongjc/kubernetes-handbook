---
weight: 74
title: "Pod 优先级与抢占"
linktitle: 优先级与抢占
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: priority-and-preemption
description: "介绍 PriorityClass 与 Pod 抢占机制：优先级如何影响调度队列顺序、资源不足时调度器如何选择牺牲者、preemptionPolicy: Never 的非抢占优先级、与 PDB 和优雅终止的交互、内建系统优先级类、异步抢占（v1.33 Beta）以及在批处理与多租户场景中的配额治理。"
---

> 优先级决定了资源紧张时谁先上车、谁被请下车；用好它能保护关键业务，用错了会让集群陷入互相抢占的内耗。

集群资源总有耗尽的时候。没有优先级机制时，Pod 只能按到达顺序排队，一个低价值的批处理任务可能占着节点让核心服务的新副本永远 Pending。Pod 优先级（Priority）与抢占（Preemption）为此提供了两层能力：**优先级**决定调度队列中的先后顺序，**抢占**允许高优先级 Pod 在没有可用节点时驱逐低优先级 Pod 腾出空间。该机制自 v1.14 GA，是生产集群容量治理的基础设施。

## PriorityClass

优先级通过集群级资源 `PriorityClass` 定义，Pod 用 `spec.priorityClassName` 引用，准入控制器据此填充 `spec.priority` 整数值：

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: business-critical
value: 1000000
globalDefault: false
preemptionPolicy: PreemptLowerPriority     # 默认值；设为 Never 则不抢占
description: "面向客户的核心服务，资源不足时可抢占低优先级工作负载"
---
apiVersion: v1
kind: Pod
metadata:
  name: checkout-api
spec:
  priorityClassName: business-critical
  containers:
  - name: api
    image: checkout-api:2.3
```

字段语义如下：

{{< table title="PriorityClass 字段说明" >}}

| 字段 | 说明 |
|------|------|
| `value` | 32 位整数，越大优先级越高；用户可用范围上限为 10 亿（1000000000），更高的值保留给系统 |
| `globalDefault` | 为 `true` 时作为未指定 `priorityClassName` 的 Pod 的默认优先级；集群中只能有一个，且只影响之后创建的 Pod |
| `preemptionPolicy` | `PreemptLowerPriority`（默认，可抢占）或 `Never`（只排队不抢占） |
| `description` | 供人阅读的用途说明 |

{{< /table >}}

未设置 `globalDefault` 时，没有指定优先级类的 Pod 优先级为 0。`PriorityClass` 创建后 `value` 不可修改；删除后已有 Pod 保留其整数优先级，新 Pod 引用该名称会被拒绝。

### 内建系统优先级类

Kubernetes 预置两个只允许在 `kube-system` 命名空间使用的优先级类，值高于用户上限，保证控制面组件与关键插件不会被业务 Pod 抢占：

{{< table title="内建 PriorityClass" >}}

| 名称 | 值 | 用途 |
|------|-----|------|
| `system-node-critical` | 2000001000 | 节点正常运行所必需：kube-proxy、CNI 插件、CSI 节点插件等 |
| `system-cluster-critical` | 2000000000 | 集群正常运行所必需：CoreDNS、metrics-server、云控制器等 |

{{< /table >}}

自建的 Operator、监控代理若确属关键组件，应在 `kube-system` 以外创建自己的高优先级类（如 `platform-critical: 900000000`），而不是直接复用系统类。

## 优先级对调度的影响

优先级首先影响**调度队列**：待调度 Pod 按优先级降序排列，高优先级 Pod 先被尝试调度。这意味着即便不发生抢占，关键服务的新副本也总是先于批处理任务拿到刚释放的资源。

其次影响**kubelet 的准入与驱逐**：节点资源压力驱逐时，kubelet 在用量超出请求的 Pod 中优先驱逐低优先级者；节点优雅关机（`GracefulNodeShutdownBasedOnPodPriority`）也按优先级分批终止 Pod，给关键 Pod 更长的宽限期。

## 抢占机制

当高优先级 Pod P 找不到任何可调度节点时，调度器进入抢占流程：

1. 遍历节点，模拟"移除该节点上优先级低于 P 的 Pod"后 P 是否可调度，筛出候选节点
2. 在候选节点中选择代价最小者：优先选择违反 PDB 最少、被驱逐 Pod 最高优先级最低、被驱逐 Pod 总优先级和最小、被驱逐 Pod 数量最少、最新启动 Pod 最晚的节点
3. 只驱逐**必要**的 Pod（按优先级从低到高，直到 P 能放下为止），对这些 Pod 发起优雅删除
4. 在 P 的 `status.nominatedNodeName` 记录提名节点，被抢占的 Pod 走正常的 `terminationGracePeriodSeconds`
5. 节点资源释放后 P 重新进入调度；若此时出现了更合适的节点，P 仍可能落到其他节点，提名并非绑定

下图展示了抢占的决策过程：

```text
P (priority 1000000) 无可用节点
  │
  ├─ 节点 A：驱逐 2 个 priority=100 的 Pod 可容纳 P，不违反 PDB
  ├─ 节点 B：驱逐 1 个 priority=500 的 Pod 可容纳 P，但违反 PDB
  └─ 节点 C：即使驱逐所有低优先级 Pod 也放不下
  → 选择节点 A，优雅删除 2 个 Pod，P.status.nominatedNodeName = A
```

关于抢占的几个重要事实：

- 抢占**不会**驱逐优先级等于或高于 P 的 Pod
- 抢占只在 P 完全无法调度时触发；若 P 因亲和性无法满足而非资源不足，抢占也无济于事，事件中会显示 `Preemption is not helpful for scheduling`
- 被抢占的 Pod 若由 Deployment 等控制器管理，会在别处重建；裸 Pod 则直接消失
- 调度器**尽量**尊重 PDB，但 PDB 不是硬保证：当所有候选节点都会违反 PDB 时，仍会选择违反最少的那个
- v1.33 起 Beta 的异步抢占（`SchedulerAsyncPreemption`）把驱逐 API 调用移出调度主循环，避免大规模抢占阻塞其他 Pod 的调度

## 非抢占优先级

`preemptionPolicy: Never` 定义的优先级类让 Pod 在队列中享受高优先级，但不会抢占任何运行中的 Pod。这对批处理与数据科学场景尤为重要：一个高优先级的训练任务应该比其他任务先拿到空闲 GPU，但不该把正在运行的长任务踢掉而浪费其已完成的计算。

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority-nonpreempting
value: 500000
preemptionPolicy: Never
description: "高优先级排队但不抢占，用于批处理作业"
```

非抢占 Pod 自身仍可能**被**更高优先级的可抢占 Pod 驱逐。

## 与其他机制的交互

{{< table title="优先级与抢占同其他机制的交互" >}}

| 机制 | 交互方式 |
|------|----------|
| PodDisruptionBudget | 抢占尽量不违反 PDB，但不保证；PDB 的 `DisruptionTarget` 条件会标记被抢占的 Pod，Job 可据此不计入重试 |
| 优雅终止 | 被抢占 Pod 按 `terminationGracePeriodSeconds` 优雅退出，调度器会等待；因此抢占不是瞬时的 |
| ResourceQuota | `scopeSelector` 可按优先级类限制配额，例如禁止普通命名空间使用高优先级类 |
| 节点压力驱逐 | kubelet 驱逐与调度器抢占互相独立；两者都参考优先级 |
| Kueue / 批调度器 | Kueue 在配额层面实现基于优先级的排队与抢占（`preemption.reclaimWithinCohort`），通常把 Job 设为非抢占优先级，避免核心调度器与 Kueue 双重抢占 |
| 集群自动扩缩容 | Cluster Autoscaler 可配置 `--expendable-pods-priority-cutoff`，低于该优先级的 Pending Pod 不触发扩容；Karpenter 的调度模拟同样尊重优先级 |

{{< /table >}}

### 用配额限制优先级类的使用

若不加限制，任何用户都可以给自己的 Pod 指定最高优先级，抢占机制便失去意义。`ResourceQuota` 的 `scopeSelector` 可以把优先级类的使用权限定在特定命名空间：

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: critical-priority-quota
  namespace: payments            # 只有该命名空间可用 business-critical
spec:
  hard:
    pods: "50"
  scopeSelector:
    matchExpressions:
    - operator: In
      scopeName: PriorityClass
      values: [business-critical]
```

配合 API Server 的 `--admission-control-config-file` 中 `ResourceQuota` 插件的 `limitedResources` 配置，可以要求"凡使用 `business-critical` 的 Pod 所在命名空间必须存在覆盖该优先级类的配额"，未配置配额的命名空间将无法使用该类。更灵活的做法是用 `ValidatingAdmissionPolicy` 按命名空间标签校验 `priorityClassName`。

## 实践建议

- 为集群设计 3 – 5 个层次清晰的优先级类（如 `platform-critical`、`business-critical`、`default`、`batch`、`best-effort`），用 `globalDefault` 把未声明的 Pod 归入 `default`
- 批处理与训练任务使用 `preemptionPolicy: Never` 的类，由 Kueue 等排队系统负责配额层面的抢占
- 为所有关键工作负载配置 PDB，并把 `unhealthyPodEvictionPolicy` 设为 `AlwaysAllow`，降低抢占对可用性的影响
- 用 ResourceQuota 的 `scopeSelector` 或准入策略限制高优先级类的使用范围
- 监控 `scheduler_preemption_attempts_total` 与 `scheduler_preemption_victims` 指标，抢占频繁意味着容量规划不足，而不是靠抢占常态化运转
- 设计 `terminationGracePeriodSeconds` 时考虑被抢占的可能，让应用能在宽限期内完成检查点保存

## 总结

PriorityClass 让集群在资源紧张时有章可循：调度队列按优先级排序保证关键服务先行，抢占机制在必要时为其腾出空间，非抢占优先级则为批处理提供"先排队、不打断"的折中。优先级必须与 PDB、ResourceQuota、排队系统配合使用，并以容量规划为前提——抢占是最后的安全阀，而不是日常的调度手段。

## 参考文献

- [Pod Priority and Preemption - kubernetes.io](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/)
- [Resource Quotas: Resource Quota Per PriorityClass - kubernetes.io](https://kubernetes.io/docs/concepts/policy/resource-quotas/#resource-quota-per-priorityclass)
- [Guaranteed Scheduling For Critical Add-On Pods - kubernetes.io](https://kubernetes.io/docs/tasks/administer-cluster/guaranteed-scheduling-critical-addon-pods/)
- [Kubernetes v1.33: Asynchronous Preemption in the Scheduler - kubernetes.io](https://kubernetes.io/blog/2025/04/23/kubernetes-v1-33-release/)
