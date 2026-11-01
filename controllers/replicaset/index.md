---
weight: 3
title: ReplicaSet
linktitle: ReplicaSet
date: 2022-05-21T00:00:00+08:00
description: "介绍 Kubernetes 中 ReplicaSet 的概念、配置与常用操作，说明其与遗留的 ReplicationController 的区别，以及为何应通过 Deployment 间接管理 ReplicaSet。"
lastmod: 2026-11-01T00:00:00+08:00
---

> ReplicaSet 是 Kubernetes 保证 Pod 副本数的最底层机制，理解它才能真正读懂 Deployment 每一次滚动更新背后发生了什么。

ReplicaSet（RS）是 Kubernetes 中用于管理 Pod 副本的控制器，确保指定数量的 Pod 副本始终在集群中运行。它的核心职责包括：

- 确保容器应用的副本数始终保持在用户定义的副本数
- 当有 Pod 异常退出或节点故障时，自动创建新的 Pod 来替代
- 当存在多余的 Pod 时，自动回收多出来的 Pod

## 遗留的 ReplicationController

ReplicationController（RC）是 Kubernetes 1.0 时代用于管理 Pod 副本的控制器，位于核心 `v1` API 组。它早已被 ReplicaSet 与 Deployment 取代：官方文档将其标记为遗留（legacy）资源，`kubectl` 相关子命令（如 `kubectl rolling-update`）已被移除，HPA 等新特性也不再面向 RC 做适配。如今仍可能在极老的集群或教程中见到 RC，新的工作负载不应再使用它。

## ReplicaSet

ReplicaSet 是 ReplicationController 的升级版本，属于 `apps/v1` API 组。

### 主要特性

ReplicaSet 继承了 RC 的核心能力，并在标签选择器和兼容性方面做了增强。

- **基本功能**：与 ReplicationController 相同，管理 Pod 副本数量
- **增强的选择器**：支持更灵活的标签选择器，包括集合式选择器
- **更好的兼容性**：与现代 Kubernetes 特性更好地集成

### 与 ReplicationController 的区别

下表总结了 ReplicaSet 与 ReplicationController 的主要区别，便于理解两者的演进关系。

{{< table title="ReplicationController 与 ReplicaSet 对比" >}}

| 特性         | ReplicationController      | ReplicaSet                       |
|--------------|---------------------------|----------------------------------|
| 标签选择器   | 仅支持相等性选择器        | 支持集合式选择器和相等性选择器   |
| API 版本     | v1（核心组）              | apps/v1                          |
| 滚动更新     | 依赖已移除的 `kubectl rolling-update` | 由 Deployment 编排           |
| 状态         | 遗留，不再演进            | 推荐，作为 Deployment 的底层实现 |

{{< /table >}}

## 使用建议

虽然 ReplicaSet 可以独立使用，但**强烈建议使用 Deployment 来自动管理 ReplicaSet**，原因如下：

- Deployment 提供了声明式更新功能
- 支持滚动更新（rolling update）
- 提供回滚功能
- 避免与其他控制器机制的兼容性问题

## ReplicaSet 配置示例

以下 YAML 示例展示了一个典型的 ReplicaSet 配置方式：

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: frontend-rs
  labels:
    app: guestbook
    tier: frontend
spec:
  # 指定副本数量
  replicas: 3
  # 标签选择器
  selector:
    matchLabels:
      tier: frontend
    matchExpressions:
      - key: tier
        operator: In
        values: [frontend]
  # Pod 模板
  template:
    metadata:
      labels:
        app: guestbook
        tier: frontend
    spec:
      containers:
      - name: php-redis
        image: gcr.io/google_samples/gb-frontend:v3
        resources:
          requests:
            cpu: 100m
            memory: 100Mi
          limits:
            cpu: 200m
            memory: 200Mi
        env:
        - name: GET_HOSTS_FROM
          value: dns
        ports:
        - containerPort: 80
          protocol: TCP
```

## 常用操作

在日常运维中，ReplicaSet 的管理操作主要包括创建、查询、扩缩容和删除等。

### 创建 ReplicaSet

以下命令用于创建 ReplicaSet 资源：

```bash
kubectl apply -f replicaset.yaml
```

### 查看 ReplicaSet 状态

可以通过如下命令查看 ReplicaSet 及其 Pod 的详细状态：

```bash
kubectl get rs
kubectl describe rs frontend-rs
```

### 扩缩容

通过如下命令调整副本数量，实现弹性伸缩：

```bash
kubectl scale rs frontend-rs --replicas=5
```

### 删除 ReplicaSet

删除 ReplicaSet 及其关联 Pod 的命令如下：

```bash
kubectl delete rs frontend-rs
```

## 最佳实践

在生产环境中，建议遵循以下最佳实践以提升副本管理的可靠性和可维护性。

- **优先使用 Deployment**：在生产环境中，建议使用 Deployment 而不是直接使用 ReplicaSet
- **合理设置资源限制**：为容器设置适当的 CPU 和内存限制
- **使用健康检查**：配置 livenessProbe 和 readinessProbe 确保 Pod 健康
- **标签规范**：使用清晰、一致的标签命名规范

## 总结

ReplicaSet 是 Kubernetes 保证 Pod 副本高可用的基础机制，ReplicationController 则是它已被取代的前身。日常使用中应通过 Deployment 间接管理 ReplicaSet，由 Deployment 负责声明式升级、滚动更新和回滚；直接操作 ReplicaSet 主要出现在排障和理解滚动更新原理的场景。合理配置资源、健康检查和标签，有助于提升集群的稳定性和运维效率。

## 参考文献

- [ReplicaSet 官方文档 - kubernetes.io](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/)
- [Deployment 官方文档 - kubernetes.io](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
