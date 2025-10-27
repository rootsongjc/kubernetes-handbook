---
weight: 26
title: Taint 和 Toleration（污点和容忍）
linktitle: 污点和容忍
date: 2022-05-21T00:00:00+08:00
description: 深入了解 Kubernetes 中的 Taint 和 Toleration 机制，学习如何通过污点和容忍优化 Pod 在集群中的调度策略，包括实际配置示例和最佳实践。
lastmod: 2025-10-27T15:51:23.881Z
---

> 污点（Taint）与容忍（Toleration）机制为 Kubernetes 提供了灵活的节点隔离与调度控制能力，是实现多租户和资源专用场景的关键手段。

Taint（污点）和 Toleration（容忍）是 Kubernetes 中用于控制 Pod 调度的重要机制。它们通过在 Node 和 Pod 上分别设置排斥与容忍规则，实现资源的精细分配和节点隔离。

## 工作机制

Taint 和 Toleration 相互配合，决定 Pod 是否能被调度到某个节点：

1. **Node Taint**：节点可设置一个或多个 Taint，表示该节点排斥无法容忍这些污点的 Pod。
2. **Pod Toleration**：Pod 通过配置 Toleration，可以容忍特定的 Taint，从而允许被调度到带有该污点的节点。

与节点亲和性（Node Affinity）不同，Taint 和 Toleration 采用排斥机制，而亲和性是吸引机制。

## Node Taint 管理

通过命令行为节点添加、删除和查看污点，实现节点级的调度控制。

### 设置 Taint

以下命令为节点添加不同类型的污点：

```bash
# 禁止调度新 Pod
kubectl taint nodes node1 key1=value1:NoSchedule

# 驱逐现有 Pod 并禁止调度新 Pod
kubectl taint nodes node1 key1=value1:NoExecute

# 尽量避免调度（软限制）
kubectl taint nodes node1 key2=value2:PreferNoSchedule
```

### 删除 Taint

通过在键名后添加减号删除污点：

```bash
kubectl taint nodes node1 key1:NoSchedule-
kubectl taint nodes node1 key1:NoExecute-
kubectl taint nodes node1 key2:PreferNoSchedule-
```

### 查看 Taint

可通过以下命令检查节点上的所有污点：

```bash
kubectl describe nodes node1
# 或者使用 jsonpath 获取特定信息
kubectl get nodes node1 -o jsonpath='{.spec.taints}'
```

## Pod Toleration 配置

在 Pod 的 `spec.tolerations` 字段中配置容忍规则，使 Pod 能调度到带有特定污点的节点。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: example-pod
spec:
  tolerations:
  - key: "key1"
    operator: "Equal"
    value: "value1"
    effect: "NoSchedule"
  - key: "key1"
    operator: "Equal"
    value: "value1"
    effect: "NoExecute"
    tolerationSeconds: 3600
  - key: "maintenance"
    operator: "Exists"
    effect: "NoExecute"
    tolerationSeconds: 300
  containers:
  - name: app
    image: nginx
```

### Toleration 字段说明

下表总结了 Toleration 主要字段及含义。

{{< table title="Toleration 字段说明" >}}

| 字段              | 说明                                   |
|-------------------|----------------------------------------|
| key               | 对应 Taint 的键名                      |
| operator          | 匹配操作符（Equal/Exists）             |
| value             | 对应 Taint 的值（Exists 时可省略）      |
| effect            | 污点效果类型（NoSchedule/PreferNoSchedule/NoExecute） |
| tolerationSeconds | 容忍宽限时间，仅对 NoExecute 有效       |

{{< /table >}}

- `operator: Equal` 精确匹配键值对，`Exists` 只要键存在即匹配。
- `effect` 控制调度或驱逐行为，`tolerationSeconds` 控制 Pod 被驱逐前的宽限时间。

## 常见使用场景

合理配置 Taint 和 Toleration，可实现多种调度隔离和资源专用场景。

### 专用节点

为特定工作负载预留节点：

```bash
# 标记节点为 GPU 专用
kubectl taint nodes gpu-node dedicated=gpu:NoSchedule
```

### 节点维护

临时隔离节点进行维护：

```bash
# 设置维护污点
kubectl taint nodes node1 maintenance=true:NoExecute
```

### 问题节点处理

处理有问题的节点：

```bash
# 标记问题节点
kubectl taint nodes problematic-node problem=disk-pressure:NoSchedule
```

## 内置 Taint

Kubernetes 会自动为节点添加一些内置污点，用于反映节点健康和资源状态。

{{< table title="Kubernetes 内置 Taint 列表" >}}

| 污点键                                 | 说明           |
|----------------------------------------|----------------|
| node.kubernetes.io/not-ready           | 节点未就绪     |
| node.kubernetes.io/unreachable         | 节点不可达     |
| node.kubernetes.io/disk-pressure       | 磁盘压力       |
| node.kubernetes.io/memory-pressure     | 内存压力       |
| node.kubernetes.io/pid-pressure        | PID 压力       |
| node.kubernetes.io/network-unavailable | 网络不可用     |

{{< /table >}}

## 最佳实践

- 合理使用 Effect 类型：长期隔离用 `NoSchedule`，软限制用 `PreferNoSchedule`，`NoExecute` 谨慎用于关键服务。
- 设置合适的 tolerationSeconds：关键应用可设置较长宽限时间，临时任务可设置较短宽限时间。
- 结合节点亲和性、Pod 反亲和性等调度策略，提升资源利用率和业务弹性。
- 配合资源限制和优先级类（PriorityClass）使用，实现多维度调度控制。

## 总结

Taint 和 Toleration 机制为 Kubernetes 提供了强大的节点隔离与调度灵活性。通过合理配置，可以实现资源专用、节点维护、故障隔离等多种场景，提升集群的弹性和可维护性。

## 参考文献

- [Taints and Tolerations - kubernetes.io](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)
- [Assigning Pods to Nodes - kubernetes.io](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/)
