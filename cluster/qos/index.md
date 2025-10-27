---
weight: 72
title: 服务质量等级（QoS）
linktitle: 服务质量等级
date: 2022-05-21T00:00:00+08:00
description: 详细介绍 Kubernetes 中 Pod 的服务质量等级（QoS）机制，包括 Guaranteed、Burstable 和 BestEffort 三种等级的配置方法和使用场景。
lastmod: 2025-10-27T15:47:25.635Z
---

> 合理配置 QoS 等级是保障 Kubernetes 集群资源高效利用与关键业务稳定运行的基础。

在 Kubernetes 中，QoS（Quality of Service，服务质量等级）是作用于 Pod 的核心机制。Kubernetes 会根据容器的资源配置自动为 Pod 分配 QoS 等级，这直接影响调度优先级和资源回收策略。

## QoS 等级分类

Kubernetes 将 Pod 的 QoS 等级分为三类，分别适用于不同业务场景。下表总结了各等级的特征和适用场景。

{{< table title="Kubernetes QoS 等级对比" >}}

| 等级         | 配置要求                                               | 适用场景         |
|--------------|------------------------------------------------------|------------------|
| Guaranteed   | 每个容器都设置 `limits` 和 `requests`，且值相等         | 关键业务应用      |
| Burstable    | 至少有一个容器设置了 `requests` 或 `limits`，但不完全相等 | 一般业务、开发测试 |
| BestEffort   | 所有容器都未设置 `limits` 和 `requests`                | 非关键、批处理任务 |

{{< /table >}}

### Guaranteed（保证级）

Guaranteed 等级要求 Pod 中每个容器都同时设置 CPU 和内存的 `limits` 与 `requests`，且两者数值完全一致。

**配置示例：**

```yaml
spec:
  containers:
  - name: app
    resources:
      limits:
        cpu: 100m
        memory: 128Mi
      requests:
        cpu: 100m
        memory: 128Mi
```

### Burstable（突发级）

Burstable 等级适用于部分资源有保障、部分可突发的场景。只要有一个容器设置了 `requests` 或 `limits`，但不满足 Guaranteed 的全部要求，即为 Burstable。

**配置示例：**

```yaml
spec:
  containers:
  - name: app
    resources:
      limits:
        memory: 180Mi
      requests:
        memory: 100Mi
        cpu: 50m
```

### BestEffort（尽力而为级）

BestEffort 等级适用于资源要求最低的场景。所有容器都未设置任何 `limits` 或 `requests`，即为 BestEffort。

**配置示例：**

```yaml
spec:
  containers:
  - name: app
    resources: {}
```

## QoS 的作用机制

QoS 等级不仅影响调度优先级，还决定了资源回收的顺序。合理配置 QoS，有助于提升集群整体资源利用率和业务弹性。

### 调度优先级

- Guaranteed：最高优先级，优先分配到资源充足的节点
- Burstable：中等优先级，满足基本资源需求后调度
- BestEffort：最低优先级，通常调度到剩余资源较多的节点

### 资源回收策略

当节点资源不足时，Kubernetes 按以下顺序回收 Pod：

1. 首先回收 BestEffort 级别的 Pod
2. 其次回收超出 `requests` 资源使用量的 Burstable 级别 Pod
3. 最后回收 Guaranteed 级别的 Pod（仅在系统组件需要资源时）

## 查看 Pod 的 QoS 等级

可以通过以下命令查看 Pod 的 QoS 等级：

```bash
kubectl get pod <pod-name> -o yaml | grep qosClass
```

或使用 `describe` 命令：

```bash
kubectl describe pod <pod-name>
```

## 最佳实践

- 生产环境关键应用建议使用 Guaranteed 等级，确保资源稳定性
- 开发测试环境可采用 Burstable 等级，提高资源利用率
- 批处理任务适合使用 BestEffort 等级，充分利用集群闲置资源
- 合理设置资源请求，避免设置过高的 `requests` 值造成资源浪费

## 总结

Kubernetes QoS 机制通过资源配置自动分级，实现了资源分配的弹性与业务优先级保障。合理利用 QoS 等级，有助于提升集群资源利用率、保障关键业务稳定，并优化整体运维体验。

## 参考文献

- [配置 Pod 的服务质量 - kubernetes.io](https://kubernetes.io/zh-cn/docs/tasks/configure-pod-container/quality-service-pod/)
- [Resource Management for Pods and Containers - kubernetes.io](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
