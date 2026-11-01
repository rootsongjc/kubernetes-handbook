---
weight: 71
title: 资源调度
date: 2022-05-21T00:00:00+08:00
description: 深入探讨 Kubernetes 中的资源调度机制，包括 kube-scheduler 组件的工作原理、调度策略、高级调度功能以及相关的扩展工具。
lastmod: 2026-11-01T00:00:00+08:00
---

> 资源调度是 Kubernetes 实现弹性伸缩与高效资源利用的核心能力，合理配置调度策略可显著提升集群稳定性与业务连续性。

Kubernetes 作为现代容器编排调度平台，资源调度是其核心功能之一。本节将深入探讨 Kubernetes 中的资源调度机制，包括调度器的工作原理、调度策略以及高级调度场景。

## 调度器组件

Kubernetes 的调度器（kube-scheduler）负责将新建的 Pod 分配到合适的节点上。理解其工作原理有助于优化资源分配和业务弹性。

### kube-scheduler 工作原理

`kube-scheduler` 是 Kubernetes 集群中负责 Pod 调度的核心组件，其主要职责包括：

- 监听 `kube-apiserver` 中未调度的 Pod
- 根据调度算法为 Pod 选择合适的节点
- 通过预选和优选两个阶段完成调度决策

### 调度流程

Kubernetes 调度流程分为以下三个阶段：

1. **预选阶段（Filtering）**：过滤掉不满足 Pod 运行条件的节点
2. **优选阶段（Scoring）**：对候选节点进行评分，选择最优节点
3. **绑定阶段（Binding）**：将 Pod 分配到选定的节点上

## 调度策略

Kubernetes 支持多种调度策略，适配不同类型的工作负载和业务需求。下表总结了常见工作负载的调度特性。

{{< table title="Kubernetes 工作负载调度策略对比" >}}

| 资源类型      | 调度特性                   | 典型场景           |
|---------------|----------------------------|--------------------|
| Deployment    | 副本分散调度               | 无状态服务         |
| DaemonSet     | 每节点运行一个 Pod 副本     | 节点级守护进程     |
| StatefulSet   | 有序调度，稳定标识         | 有状态服务         |

{{< /table >}}

### 高级调度功能

通过为节点和 Pod 添加标签（Labels）和污点（Taints），可以实现更精细的调度控制。常见高级调度机制包括：

- **节点选择器（NodeSelector）**：通过标签选择目标节点
- **节点亲和性（Node Affinity）**：表达更复杂的节点选择规则
- **Pod 亲和性和反亲和性（Pod Affinity/Anti-Affinity）**：控制 Pod 之间的调度关系
- **污点和容忍（Taints and Tolerations）**：实现节点隔离与专用资源分配
- **拓扑分布约束（Topology Spread Constraints）**：按可用区、节点等拓扑域均匀分布 Pod，是跨可用区高可用的首选手段
- **优先级与抢占（PriorityClass）**：高优先级 Pod 在资源不足时可抢占低优先级 Pod
- **调度门控（Scheduling Gates，v1.30 GA）**：Pod 创建时带有 `spec.schedulingGates`，在外部控制器移除门控前调度器不会处理它，为配额、预算等外部准入提供挂钩
- **动态资源分配（DRA，v1.34 GA）**：调度器根据 `ResourceClaim` 为 Pod 挑选同时满足 CPU/内存与 GPU 等设备约束的节点
- **成组调度（Gang Scheduling）**：`Workload`/`PodGroup` API（v1.35 Alpha，v1.37 Beta 但默认关闭）让一组 Pod 要么全部调度、要么全部等待，面向分布式训练等场景

以下示例展示了拓扑分布约束与调度门控的用法：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web
  labels:
    app: web
spec:
  schedulingGates:
  - name: example.com/quota-check    # 由外部控制器在校验通过后移除
  topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: web
  containers:
  - name: web
    image: nginx:1.27
```

## 动态调度扩展

在实际生产环境中，调度需求常常随着业务变化而动态调整。Kubernetes 支持多种扩展方式以满足复杂场景。

### 重调度场景

当需要对已调度的 Pod 进行重新分配时，常见场景包括集群负载均衡和数据本地性优化。

#### 集群负载均衡

当集群中新增节点时，可能需要重新平衡各节点的资源利用率。原生 kube-scheduler 不支持 Pod 的重调度，可借助如下工具：

- **[Descheduler](https://github.com/kubernetes-sigs/descheduler)**：用于驱逐过载节点上的 Pod，实现集群负载重平衡

#### 数据本地性优化

对于大数据和批处理应用，Pod 的调度需要考虑数据分布：

- **[Volcano](https://volcano.sh/)**（原 kube-batch）：专为批处理和机器学习工作负载设计的调度器，支持队列管理、资源配额和任务调度
- **[Kueue](https://kueue.sigs.k8s.io/)**：Kubernetes SIG 维护的作业排队系统，不替换调度器，而是通过调度门控控制 Job/JobSet 何时进入调度，实现配额与公平共享
- **[Karpenter](https://karpenter.sh/)**：按待调度 Pod 的实际需求实时创建合适规格的节点，取代传统 Cluster Autoscaler 的节点组模型

### 扩展调度器

Kubernetes 支持多调度器和调度器扩展，便于自定义调度逻辑和策略。

- **多调度器**：同时运行多个调度器实例，Pod 通过 `spec.schedulerName` 选择
- **调度器扩展**：通过 Scheduler Framework 插件机制在 PreFilter、Filter、Score、Bind 等扩展点自定义调度流程
- **调度器配置**：通过 `KubeSchedulerConfiguration`（`kubescheduler.config.k8s.io/v1`）启用/禁用插件、配置多个 profile

调度器框架与插件开发详见 [调度架构与 Framework 扩展](../../extend/scheduler-extension)。

## 最佳实践

为提升调度效率和集群稳定性，建议遵循以下实践：

- 合理设置资源请求和限制，确保调度器能够做出正确的调度决策
- 使用节点标签和选择器，实现精确的节点选择
- 跨可用区部署优先使用拓扑分布约束，而不是只靠 Pod 反亲和性
- 为关键系统组件设置 PriorityClass，保证资源紧张时优先运行
- 监控 `scheduler_pending_pods`、`scheduler_scheduling_attempt_duration_seconds` 等指标，及时发现和解决调度瓶颈

## 总结

Kubernetes 资源调度机制通过灵活的调度策略和可扩展的调度框架，实现了高效的资源分配与业务弹性。掌握调度原理与高级功能，有助于构建稳定、可扩展的云原生集群环境。

## 参考文献

- [Kubernetes Scheduler - kubernetes.io](https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/)
- [Pod Scheduling Readiness - kubernetes.io](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-scheduling-readiness/)
- [Pod Topology Spread Constraints - kubernetes.io](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/)
