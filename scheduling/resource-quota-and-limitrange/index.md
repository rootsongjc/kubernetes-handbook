---
weight: 6
title: "ResourceQuota 与 LimitRange：命名空间级资源治理"
linktitle: ResourceQuota 与 LimitRange
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: resource-quota-and-limitrange
description: "介绍 Kubernetes 命名空间级资源治理的两大机制：ResourceQuota 限制命名空间内计算资源、存储、对象数量与扩展资源的总量，支持按 QoS、优先级类、跨命名空间 Pod 亲和等作用域；LimitRange 为单个 Pod/容器/PVC 设置默认值、最小/最大值与比例约束。涵盖配额与 LimitRange 的协作、对 GPU 等扩展资源的配额、常见错误与多租户实践。"
aliases:
  - /book/kubernetes-handbook/cluster/resource-quota-and-limitrange/
---

> 没有配额的多租户集群只是"大家一起用的集群"；ResourceQuota 划定每个团队的总盘子，LimitRange 保证每个 Pod 都带着合理的资源声明进来。

Kubernetes 用命名空间划分团队与环境，但命名空间本身并不限制资源使用——任何人都可以在自己的命名空间里创建无限多的 Pod、申请无限多的 CPU。ResourceQuota 与 LimitRange 这两个核心 API 对象补上了这块缺口：前者作用于**命名空间总量**，后者作用于**单个对象**。它们由同名的内建准入控制器实施，在对象创建或更新时同步校验，是多租户治理、成本控制与防止"吵闹邻居"的基础。

## ResourceQuota

ResourceQuota 为一个命名空间声明若干资源的硬上限，准入控制器在每次创建对象时累计已用量并拒绝超额请求。一个命名空间可以有多个 ResourceQuota，所有配额必须同时满足。

### 可限制的资源

{{< table title="ResourceQuota 可限制的资源类型" >}}

| 类别 | 资源名示例 | 说明 |
|------|------------|------|
| 计算资源 | `requests.cpu`、`requests.memory`、`limits.cpu`、`limits.memory`、`cpu`（等价于 `requests.cpu`）、`memory` | 统计所有非终态 Pod 的容器资源之和；Init 容器按最大值计入，Sidecar 容器按累加计入 |
| 扩展资源 | `requests.nvidia.com/gpu`、`requests.hugepages-2Mi` | 扩展资源只能限制 `requests.` 前缀（扩展资源不允许超售，requests 必等于 limits） |
| 存储 | `requests.storage`、`persistentvolumeclaims`、`<storageclass>.storageclass.storage.k8s.io/requests.storage`、`<storageclass>.storageclass.storage.k8s.io/persistentvolumeclaims`、`requests.ephemeral-storage` | 可按 StorageClass 分别限额，例如限制高性能 SSD 的总容量 |
| 对象数量 | `pods`、`services`、`services.loadbalancers`、`services.nodeports`、`configmaps`、`secrets`、`persistentvolumeclaims`、`replicationcontrollers`、`resourcequotas`；通用语法 `count/<resource>.<group>`，如 `count/deployments.apps`、`count/jobs.batch`、`count/widgets.example.com` | 对象数量配额可以作用于任何内建或自定义资源 |

{{< /table >}}

以下示例为一个团队命名空间设置了典型配额：

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-a-quota
  namespace: team-a
spec:
  hard:
    requests.cpu: "40"
    requests.memory: 160Gi
    limits.cpu: "80"
    limits.memory: 320Gi
    requests.nvidia.com/gpu: "8"
    requests.storage: 2Ti
    fast-ssd.storageclass.storage.k8s.io/requests.storage: 500Gi
    pods: "200"
    services.loadbalancers: "2"
    count/deployments.apps: "50"
    count/jobs.batch: "100"
```

`kubectl describe quota -n team-a` 可查看每项资源的已用/上限；`kubectl get quota -o yaml` 的 `status.used` 字段同样包含实时用量。

### 配额与资源请求的强制关系

一旦命名空间对 `requests.cpu`、`requests.memory`、`limits.cpu` 或 `limits.memory` 任一项设置了配额，**该命名空间内所有新建 Pod 的每个容器都必须显式声明对应的 requests/limits**，否则会被拒绝：

```text
Error from server (Forbidden): pods "web" is forbidden: failed quota: team-a-quota:
must specify limits.cpu for: app; limits.memory for: app
```

这正是 LimitRange 存在的理由之一——用默认值自动补齐，避免每个开发者都手写资源声明。

### 配额作用域

`scopes` 与 `scopeSelector` 让一个配额只统计特定类别的 Pod，从而实现差异化治理：

{{< table title="ResourceQuota 作用域" >}}

| 作用域 | 匹配的 Pod | 可限制的资源 |
|--------|------------|--------------|
| `Terminating` / `NotTerminating` | 设置了 / 未设置 `activeDeadlineSeconds` 的 Pod（通常对应 Job 与长期服务） | 计算资源、`pods` |
| `BestEffort` / `NotBestEffort` | QoS 为 / 不为 BestEffort 的 Pod | BestEffort 作用域只能限制 `pods` |
| `PriorityClass` | 通过 `scopeSelector` 按优先级类名匹配（`In`/`NotIn`/`Exists`/`DoesNotExist`） | 计算资源、`pods` |
| `CrossNamespacePodAffinity` | 使用了跨命名空间 Pod 亲和/反亲和（`namespaces` 或 `namespaceSelector`）的 Pod | `pods` |

{{< /table >}}

以下示例限制 `team-a` 中 BestEffort Pod 最多 20 个、批处理（Terminating）Pod 最多占用 10 核，并禁止使用跨命名空间亲和性：

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: besteffort-quota
  namespace: team-a
spec:
  hard:
    pods: "20"
  scopes: [BestEffort]
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: batch-quota
  namespace: team-a
spec:
  hard:
    requests.cpu: "10"
  scopes: [Terminating]
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: no-cross-ns-affinity
  namespace: team-a
spec:
  hard:
    pods: "0"
  scopeSelector:
    matchExpressions:
    - scopeName: CrossNamespacePodAffinity
      operator: Exists
```

`CrossNamespacePodAffinity` 作用域配合 API Server 准入配置中的 `limitedResources`，可以在集群层面要求所有使用跨命名空间亲和的 Pod 必须被配额覆盖，防止租户通过反亲和"霸占"其他团队的节点。

### 对象配额与 CRD

`count/<resource>.<group>` 语法对自定义资源同样有效，这让平台团队可以限制每个租户能创建多少 `Application`、`Certificate` 或 `InferencePool`：

```yaml
spec:
  hard:
    count/certificates.cert-manager.io: "20"
    count/inferencepools.inference.networking.k8s.io: "5"
```

## LimitRange

LimitRange 作用于命名空间内的**单个** Pod、容器或 PVC，提供三种能力：为未声明资源的容器填充默认 requests/limits、限制单个对象的最小/最大值、约束 limits 与 requests 的比例。

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: team-a-limits
  namespace: team-a
spec:
  limits:
  - type: Container
    default:                 # 未声明 limits 时的默认值
      cpu: "500m"
      memory: 512Mi
    defaultRequest:          # 未声明 requests 时的默认值
      cpu: "100m"
      memory: 128Mi
    min:
      cpu: "50m"
      memory: 64Mi
    max:
      cpu: "8"
      memory: 32Gi
    maxLimitRequestRatio:    # limits 不得超过 requests 的 4 倍，抑制过度超售
      cpu: "4"
      memory: "2"
  - type: Pod
    max:                     # 单个 Pod 所有容器之和的上限
      cpu: "16"
      memory: 64Gi
  - type: PersistentVolumeClaim
    min:
      storage: 1Gi
    max:
      storage: 1Ti
```

LimitRange 的生效规则需要特别留意：

- 默认值只在容器**完全未声明**对应字段时注入；若只声明了 `limits` 而没有 `requests`，Kubernetes 会把 `requests` 设为与 `limits` 相同，而不是使用 `defaultRequest`
- 校验与注入发生在准入阶段，LimitRange 的修改**不影响已存在的 Pod**
- `min`/`max` 同时对注入后的默认值生效，因此 `default` 必须落在 `[min, max]` 区间内，否则所有未声明资源的 Pod 都会被拒绝
- `type: Pod` 的约束按 Pod 内所有容器（含 Sidecar）之和计算
- 一个命名空间可以有多个 LimitRange，但多个 LimitRange 对同一字段设置不同默认值时行为未定义，应避免

## ResourceQuota 与 LimitRange 的协作

两者通常成对出现：LimitRange 保证每个 Pod 都带着合理的资源声明进入集群，ResourceQuota 则把这些声明累加起来与团队总盘子比对。一个常见的落地模式是命名空间供给流程（GitOps 或 Operator）在创建命名空间时同时下发三件套——ResourceQuota、LimitRange 与默认 NetworkPolicy：

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: team-a
  labels:
    pod-security.kubernetes.io/enforce: baseline
    team: a
---
apiVersion: v1
kind: LimitRange
metadata:
  name: defaults
  namespace: team-a
spec:
  limits:
  - type: Container
    defaultRequest: {cpu: 100m, memory: 128Mi}
    default: {cpu: 1, memory: 1Gi}
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute
  namespace: team-a
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 64Gi
    limits.cpu: "40"
    limits.memory: 128Gi
    pods: "100"
```

对集群级的层次化配额（例如"部门 → 团队"两级、团队之间可借用闲置配额），核心 API 没有提供，需要借助 Kueue 的 `ClusterQueue`/`Cohort`（面向批处理作业）、Hierarchical Namespace Controller 或 Capsule 等多租户项目（见 [多租户与虚拟集群](../../security/multi-tenancy)）。

## 常见问题

{{< table title="配额相关的常见问题与处理" >}}

| 现象 | 原因 | 处理 |
|------|------|------|
| Deployment 副本数不足但没有 Pending Pod | ReplicaSet 创建 Pod 被配额拒绝，错误只出现在 ReplicaSet 事件中 | `kubectl describe rs` 查看 `FailedCreate` 事件 |
| `must specify limits.cpu` | 命名空间有计算配额但 Pod 未声明资源 | 添加 LimitRange 默认值或在清单中声明 |
| 已删除 Pod 仍占用配额 | 配额控制器异步同步，终态 Pod 不计入但有短暂延迟；带 finalizer 的 Pod 未真正删除 | 等待同步或检查 finalizer |
| GPU 配额设置 `limits.nvidia.com/gpu` 无效 | 扩展资源只支持 `requests.` 前缀 | 改为 `requests.nvidia.com/gpu` |
| PVC 扩容被拒 | `requests.storage` 配额按 PVC 请求总量计算，扩容也计入 | 调整配额或清理闲置 PVC |
| Job 的 Pod 因 `Terminating` 作用域配额被拒 | 设置了 `activeDeadlineSeconds` 的 Pod 被归入 Terminating 作用域 | 检查作用域配额是否合理 |

{{< /table >}}

## 实践建议

- 所有业务命名空间都应有 LimitRange 默认值，避免 BestEffort Pod 泛滥导致节点 OOM
- 配额以 `requests` 为主、`limits` 为辅：调度与节点容量规划依据 requests，limits 配额主要用于抑制超售比例
- 按 StorageClass 单独限制昂贵存储的容量，按 `services.loadbalancers` 限制云负载均衡器数量以控制成本
- 用 `PriorityClass` 作用域配额防止租户滥用高优先级类
- 把配额用量（`kube_resourcequota` 指标）接入监控与告警，用量长期低于 50% 或接近 100% 都应触发容量评审
- 配额变更通过 GitOps 审批，避免在集群中手工调整

## 总结

ResourceQuota 与 LimitRange 是 Kubernetes 命名空间多租户的基石：LimitRange 在对象层面注入默认值并限定范围，ResourceQuota 在命名空间层面累计并设置上限，作用域机制则让配额可以按 QoS、优先级与作业类型差异化施策。二者配合 Pod 安全准入与 NetworkPolicy，构成了命名空间级隔离的"三件套"；更复杂的层次化与可借用配额，则交由 Kueue 等上层项目实现。

## 参考文献

- [Resource Quotas - kubernetes.io](https://kubernetes.io/docs/concepts/policy/resource-quotas/)
- [Limit Ranges - kubernetes.io](https://kubernetes.io/docs/concepts/policy/limit-range/)
- [Configure Memory and CPU Quotas for a Namespace - kubernetes.io](https://kubernetes.io/docs/tasks/administer-cluster/manage-resources/quota-memory-cpu-namespace/)
- [Resource Management for Pods and Containers - kubernetes.io](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
