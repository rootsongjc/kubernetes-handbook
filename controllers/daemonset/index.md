---
weight: 31
title: DaemonSet
date: 2022-05-21T00:00:00+08:00
description: DaemonSet 是 Kubernetes 中的一种控制器，确保在集群中的每个（或特定）节点上运行一个 Pod 副本。本文详细介绍 DaemonSet 的概念、使用场景、配置方法以及管理策略。
lastmod: 2025-10-27T15:56:40.044Z
---

> DaemonSet 控制器为 Kubernetes 提供了节点级系统服务的自动化部署能力，是集群可观测性与基础设施运维的关键保障。

## DaemonSet 概述

DaemonSet 是 Kubernetes 中的一种控制器，确保在集群中的每个（或特定）节点上运行一个 Pod 副本。当有新节点加入集群时，DaemonSet 会自动在新节点上创建 Pod；当节点从集群中移除时，对应的 Pod 也会被回收。删除 DaemonSet 时，它创建的所有 Pod 都会被删除。

## 典型使用场景

DaemonSet 适用于需要在每个节点上运行系统级服务的场景。常见用例如下：

- 存储服务：如在每个节点上运行分布式存储守护进程（glusterd、ceph）
- 日志收集：如 fluentd、filebeat、logstash 等日志代理
- 监控代理：如 [Prometheus Node Exporter](https://github.com/prometheus/node_exporter)、collectd、Datadog Agent、New Relic Agent
- 网络组件：如 CNI 网络插件或网络代理

## DaemonSet 配置规范

DaemonSet 资源定义包含必需字段和可选字段，合理配置可满足不同节点管理需求。

### 基本结构

- `apiVersion`：API 版本
- `kind`：资源类型
- `metadata`：元数据信息
- `spec`：规格定义

### Pod 模板配置

`.spec.template` 是 DaemonSet 的核心配置，定义要创建的 Pod 模板：

- Pod 模板与标准 Pod 规范相同，但不需要 `apiVersion` 和 `kind`
- 必须指定适当的标签以便选择器匹配
- `restartPolicy` 必须设置为 `Always`（默认值）

### Pod 选择器

`.spec.selector` 用于选择管理的 Pod，支持 matchLabels 和 matchExpressions 两种方式。选择器必须与 Pod 模板的标签匹配，否则 API 会拒绝创建。

### 节点选择

可通过以下方式限制 Pod 运行的节点：

- `nodeSelector`：基于节点标签选择
- `nodeAffinity`：更灵活的节点亲和性规则
- `tolerations`：容忍节点污点

如果未指定节点选择条件，DaemonSet 默认在所有节点上创建 Pod。

## 调度机制

DaemonSet 的调度机制与普通 Pod 不同，具备如下特点：

- 预定调度：Pod 创建时已指定目标节点（`.spec.nodeName`）
- 绕过调度器：不依赖 kube-scheduler
- 容忍不可调度：忽略节点的 `unschedulable` 状态
- 集群启动友好：可在调度器启动前创建 Pod

### 污点和容忍

DaemonSet Pod 自动添加以下容忍配置：

{{< table title="DaemonSet Pod 默认容忍的污点" >}}

| 污点键                                 | Effect         |
|----------------------------------------|---------------|
| node.kubernetes.io/not-ready           | NoExecute     |
| node.kubernetes.io/unreachable         | NoExecute     |
| node.kubernetes.io/disk-pressure       | NoSchedule    |
| node.kubernetes.io/memory-pressure     | NoSchedule    |
| node.kubernetes.io/unschedulable       | NoSchedule    |

{{< /table >}}

## 通信模式

DaemonSet Pod 的通信模式多样，常见方式如下：

- Push 模式：Pod 主动向外部服务推送数据（如监控指标）
- NodeIP + 固定端口：通过 `hostNetwork: true` 或 `hostPort`，结合节点 IP 和端口访问服务
- DNS 发现：通过 Headless Service 进行 DNS 查询，获取所有 Pod 的 IP
- Service 负载均衡：通过普通 Service 随机访问某节点上的 Pod（无法指定特定节点）

## 更新和维护

DaemonSet 支持多种更新与维护策略，便于系统级服务的平滑升级。

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

可通过 `--cascade=orphan` 选项删除 DaemonSet 但保留 Pod，便于后续手动管理。

## 最佳实践

- 为 DaemonSet Pod 设置适当的资源请求和限制：

  ```yaml
  resources:
    requests:
      memory: "64Mi"
      cpu: "250m"
    limits:
      memory: "128Mi"
      cpu: "500m"
  ```

- 配置安全上下文，特别是需要访问主机资源时：

  ```yaml
  securityContext:
    privileged: true
    hostNetwork: true
    hostPID: true
  ```

- 配置存活探针和就绪探针，提升服务可用性：

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

下表对比了 DaemonSet 与其他常见控制器的适用场景和特性。

{{< table title="DaemonSet 与其他控制器对比" >}}

| 控制器类型      | 主要特性                   | 适用场景           |
|----------------|----------------------------|--------------------|
| DaemonSet      | 每节点一个 Pod，节点覆盖    | 系统级守护进程     |
| Deployment     | 指定副本数，高可用与分担    | 无状态服务         |
| StaticPod      | kubelet 直接管理，配置简单  | 特殊场景、功能有限 |
| Job/CronJob    | 一次性/定时任务             | 批处理、定时任务   |

{{< /table >}}

## 总结

DaemonSet 控制器为 Kubernetes 提供了节点级服务的自动化部署能力，适用于日志收集、监控、网络等系统级场景。合理配置和管理 DaemonSet，有助于提升集群的可观测性、可维护性和基础设施弹性。
