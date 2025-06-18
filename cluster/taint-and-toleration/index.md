---
weight: 26
title: Taint 和 Toleration（污点和容忍）
linktitle: 污点和容忍
date: '2022-05-21T00:00:00+08:00'
type: book
description: 深入了解 Kubernetes 中的 Taint 和 Toleration 机制，学习如何通过污点和容忍优化 Pod 在集群中的调度策略，包括实际配置示例和最佳实践。
keywords:
- kubernetes
- node
- pod
- taint
- toleration
- 调度
- 节点亲和性
- 集群管理
---

## 概述

Taint（污点）和 Toleration（容忍）是 Kubernetes 中用于控制 Pod 调度的重要机制。它们可以作用于 Node 和 Pod 上，目的是优化 Pod 在集群中的调度策略。

与节点亲和性（Node Affinity）不同，Taint 和 Toleration 采用**排斥机制**：

- 具有 Taint 的 Node 会排斥不能容忍该污点的 Pod
- 具有节点亲和性的 Node 和 Pod 则是相互吸引的关系

## 工作机制

Taint 和 Toleration 相互配合工作：

1. **Node Taint**：每个节点可以应用一个或多个 Taint，表示该节点不接受无法容忍这些污点的 Pod
2. **Pod Toleration**：为 Pod 设置 Toleration 后，该 Pod 可以（但不强制）被调度到具有相应 Taint 的节点上

## Node Taint 管理

### 设置 Taint

为节点添加不同类型的污点：

```bash
# 禁止调度新 Pod
kubectl taint nodes node1 key1=value1:NoSchedule

# 驱逐现有 Pod 并禁止调度新 Pod
kubectl taint nodes node1 key1=value1:NoExecute

# 尽量避免调度（软限制）
kubectl taint nodes node1 key2=value2:PreferNoSchedule
```

### 删除 Taint

通过在键名后添加减号来删除污点：

```bash
kubectl taint nodes node1 key1:NoSchedule-
kubectl taint nodes node1 key1:NoExecute-
kubectl taint nodes node1 key2:PreferNoSchedule-
```

### 查看 Taint

检查节点上的所有污点：

```bash
kubectl describe nodes node1
# 或者使用 jsonpath 获取特定信息
kubectl get nodes node1 -o jsonpath='{.spec.taints}'
```

## Pod Toleration 配置

在 Pod 的 `spec.tolerations` 字段中配置容忍设置：

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

- **key**：对应 Taint 的键名
- **operator**：匹配操作符
  - `Equal`：精确匹配键值对
  - `Exists`：只要键存在即匹配（忽略 value）
- **value**：对应 Taint 的值（operator 为 Exists 时可省略）
- **effect**：污点效果类型
  - `NoSchedule`：不调度新 Pod
  - `PreferNoSchedule`：尽量不调度（软限制）
  - `NoExecute`：驱逐现有 Pod 并不调度新 Pod
- **tolerationSeconds**：Pod 被驱逐前的宽限时间（仅对 NoExecute 有效）

## 常见使用场景

### 1. 专用节点

为特定工作负载预留节点：

```bash
# 标记节点为 GPU 专用
kubectl taint nodes gpu-node dedicated=gpu:NoSchedule
```

### 2. 节点维护

临时隔离节点进行维护：

```bash
# 设置维护污点
kubectl taint nodes node1 maintenance=true:NoExecute
```

### 3. 问题节点处理

处理有问题的节点：

```bash
# 标记问题节点
kubectl taint nodes problematic-node problem=disk-pressure:NoSchedule
```

## 内置 Taint

Kubernetes 会自动为节点添加一些内置污点：

- `node.kubernetes.io/not-ready`：节点未就绪
- `node.kubernetes.io/unreachable`：节点不可达
- `node.kubernetes.io/disk-pressure`：磁盘压力
- `node.kubernetes.io/memory-pressure`：内存压力
- `node.kubernetes.io/pid-pressure`：PID 压力
- `node.kubernetes.io/network-unavailable`：网络不可用

## 最佳实践

1. **合理使用 Effect 类型**：
   - 使用 `NoSchedule` 进行长期规划
   - 使用 `PreferNoSchedule` 作为软限制
   - 谨慎使用 `NoExecute` 避免服务中断

2. **设置合理的 tolerationSeconds**：
   - 为关键应用设置较长的宽限时间
   - 为临时任务设置较短的宽限时间

3. **结合其他调度策略**：
   - 与节点亲和性、Pod 反亲和性结合使用
   - 配合资源限制和优先级类使用

## 参考资料

- [Taints and Tolerations - Kubernetes 官方文档](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)
- [Assigning Pods to Nodes - Kubernetes 官方文档](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/)
