---
weight: 72
title: 服务质量等级（QoS）
linktitle: 服务质量等级
date: '2022-05-21T00:00:00+08:00'
type: book
description: 详细介绍 Kubernetes 中 Pod 的服务质量等级（QoS）机制，包括 Guaranteed、Burstable 和 BestEffort 三种等级的配置方法和使用场景。
keywords:
- burstable
- cpu
- pod
- qos
- 内存
- 容器
- 服务质量
- 调度
- 配置
---

## 什么是 QoS

QoS（Quality of Service）即服务质量等级，是 Kubernetes 中作用于 Pod 的重要配置机制。当 Kubernetes 创建 Pod 时，会根据容器的资源配置自动为其分配相应的 QoS 等级，这直接影响 Pod 的调度优先级和资源回收策略。

## QoS 等级分类

Kubernetes 中的 QoS 等级分为三种：

### Guaranteed（保证级）

**特征**：Pod 中的每个容器都必须同时设置 CPU 和内存的 `limits` 和 `requests`，且对应的值必须相等。

**适用场景**：关键业务应用，需要稳定的资源保证。

**配置示例**：

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

**特征**：Pod 中至少有一个容器设置了内存或 CPU 的 `requests` 或 `limits`，但不满足 Guaranteed 等级的要求。

**适用场景**：一般业务应用，允许资源使用量在一定范围内波动。

**配置示例**：

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

**特征**：Pod 中的所有容器都没有设置任何内存或 CPU 的 `limits` 和 `requests`。

**适用场景**：非关键应用，对资源要求不高，可以容忍被优先回收。

**配置示例**：

```yaml
spec:
  containers:
  - name: app
    resources: {}
```

## QoS 的作用机制

### 调度优先级

- **Guaranteed**：最高优先级，优先分配到资源充足的节点
- **Burstable**：中等优先级，在满足基本资源需求的前提下调度
- **BestEffort**：最低优先级，通常调度到剩余资源较多的节点

### 资源回收策略

当节点资源不足时，Kubernetes 会按照以下顺序回收 Pod：

1. 首先回收 **BestEffort** 级别的 Pod
2. 其次回收超出 `requests` 资源使用量的 **Burstable** 级别 Pod
3. 最后回收 **Guaranteed** 级别的 Pod（仅在系统组件需要资源时）

## 查看 Pod 的 QoS 等级

使用以下命令可以查看 Pod 的 QoS 等级：

```bash
kubectl get pod <pod-name> -o yaml | grep qosClass
```

或者使用 `describe` 命令：

```bash
kubectl describe pod <pod-name>
```

## 最佳实践

1. **生产环境关键应用**：建议使用 Guaranteed 等级，确保资源稳定性
2. **开发测试环境**：可以使用 Burstable 等级，提高资源利用率
3. **批处理任务**：适合使用 BestEffort 等级，充分利用集群闲置资源
4. **合理设置资源请求**：避免设置过高的 `requests` 值，造成资源浪费

## 参考资料

- [配置 Pod 的服务质量 - kubernetes.io](https://kubernetes.io/zh-cn/docs/tasks/configure-pod-container/quality-service-pod/)
- [Resource Management for Pods and Containers - kubernetes.io](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
