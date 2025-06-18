---
weight: 31
title: DaemonSet
date: '2022-05-21T00:00:00+08:00'
type: book
description: 'DaemonSet 是 Kubernetes 中的一种控制器，确保在集群中的每个（或特定）节点上运行一个 Pod 副本。本文详细介绍 DaemonSet 的概念、使用场景、配置方法以及管理策略。'
keywords:
- controller
- daemon
- daemonset
- node
- pod
- selector
- spec
- 创建
- 指定
- 模板
---

## DaemonSet 概述

**DaemonSet** 是 Kubernetes 中的一种控制器，它确保在集群中的每个（或特定）节点上运行一个 Pod 副本。当有新节点加入集群时，DaemonSet 会自动在新节点上创建 Pod；当节点从集群中移除时，对应的 Pod 也会被回收。删除 DaemonSet 时，它创建的所有 Pod 都会被删除。

## 典型使用场景

DaemonSet 适用于需要在每个节点上运行系统级服务的场景：

- **存储服务**：在每个节点上运行分布式存储守护进程，如 `glusterd`、`ceph`
- **日志收集**：在每个节点上运行日志收集代理，如 `fluentd`、`filebeat`、`logstash`
- **监控代理**：在每个节点上运行监控组件，如 [Prometheus Node Exporter](https://github.com/prometheus/node_exporter)、`collectd`、Datadog Agent、New Relic Agent
- **网络组件**：运行网络插件或代理，如 CNI 网络插件

## DaemonSet 配置规范

### 基本结构

与其他 Kubernetes 资源一样，DaemonSet 需要包含以下必需字段：

- `apiVersion`：API 版本
- `kind`：资源类型
- `metadata`：元数据信息
- `spec`：规格定义

### Pod 模板配置

`.spec.template` 是 DaemonSet 的核心配置，定义了要创建的 Pod 模板：

- Pod 模板与标准 Pod 规范相同，但不需要 `apiVersion` 和 `kind` 字段
- 必须指定适当的标签以便选择器匹配
- `RestartPolicy` 必须设置为 `Always`（默认值）

### Pod 选择器

`.spec.selector` 用于选择管理的 Pod，支持两种匹配方式：

- **matchLabels**：简单的标签匹配
- **matchExpressions**：复杂的表达式匹配

选择器必须与 Pod 模板的标签匹配，否则 API 会拒绝创建。

### 节点选择

可以通过以下方式限制 Pod 运行的节点：

- **nodeSelector**：基于节点标签选择
- **nodeAffinity**：更灵活的节点亲和性规则
- **tolerations**：容忍节点污点

如果未指定任何节点选择条件，DaemonSet 将在所有节点上创建 Pod。

## 调度机制

DaemonSet 的调度机制与普通 Pod 不同：

- **预定调度**：Pod 创建时已指定目标节点（`.spec.nodeName`）
- **绕过调度器**：不依赖 Kubernetes 调度器
- **容忍不可调度**：忽略节点的 `unschedulable` 状态
- **集群启动友好**：可在调度器启动前创建 Pod

### 污点和容忍

DaemonSet Pod 自动添加以下容忍配置：

- `node.kubernetes.io/not-ready:NoExecute`
- `node.kubernetes.io/unreachable:NoExecute`
- `node.kubernetes.io/disk-pressure:NoSchedule`
- `node.kubernetes.io/memory-pressure:NoSchedule`
- `node.kubernetes.io/unschedulable:NoSchedule`

## 通信模式

与 DaemonSet 中的 Pod 通信有以下几种模式：

### Push 模式

Pod 主动向外部服务推送数据，如将监控指标推送到监控系统。

### NodeIP + 固定端口

使用 `hostNetwork: true` 或 `hostPort`，通过节点 IP 和固定端口访问服务。

### DNS 发现

创建 Headless Service，通过 DNS 查询获取所有 Pod 的 IP 地址。

### Service 负载均衡

创建普通 Service，随机访问某个节点上的 Pod（无法指定特定节点）。

## 更新和维护

### 滚动更新

Kubernetes 1.6+ 支持 DaemonSet 滚动更新：

```yaml
spec:
    updateStrategy:
        type: RollingUpdate
        rollingUpdate:
            maxUnavailable: 1
```

### 更新触发条件

以下情况会触发 DaemonSet 更新：

- 修改 Pod 模板规范
- 更改节点标签（影响节点选择）
- 修改选择器规则

### 手动管理

可以通过 `--cascade=orphan` 选项删除 DaemonSet 但保留 Pod，便于后续手动管理。

## 最佳实践

### 资源限制

为 DaemonSet Pod 设置适当的资源请求和限制：

```yaml
resources:
    requests:
        memory: "64Mi"
        cpu: "250m"
    limits:
        memory: "128Mi"
        cpu: "500m"
```

### 安全上下文

根据需要配置安全上下文，特别是需要访问主机资源时：

```yaml
securityContext:
    privileged: true
    hostNetwork: true
    hostPID: true
```

### 健康检查

配置适当的存活探针和就绪探针：

```yaml
livenessProbe:
    httpGet:
        path: /health
        port: 8080
    initialDelaySeconds: 30
readinessProbe:
    httpGet:
        path: /ready
        port: 8080
    initialDelaySeconds: 5
```

## 与其他控制器的比较

### vs Deployment/ReplicaSet

- **DaemonSet**：每个节点一个 Pod，关注节点覆盖
- **Deployment**：指定副本数量，关注高可用和负载分担

### vs StaticPod

- **DaemonSet**：通过 API Server 管理，支持标准 Kubernetes 操作
- **StaticPod**：由 kubelet 直接管理，配置简单但功能有限

### vs Job/CronJob

- **DaemonSet**：长期运行的守护进程
- **Job**：一次性任务或定时任务

选择合适的控制器类型对于构建稳定、高效的 Kubernetes 应用至关重要。DaemonSet 特别适合需要在每个节点上运行系统级服务的场景。
