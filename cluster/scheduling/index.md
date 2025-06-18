---
weight: 71
title: 资源调度
date: '2022-05-21T00:00:00+08:00'
type: book
description: 深入探讨 Kubernetes 中的资源调度机制，包括 kube-scheduler 组件的工作原理、调度策略、高级调度功能以及相关的扩展工具。
keywords:
- kube
- kubernetes
- node
- pod
- scheduler
- 调度
- 资源
- 组件
- 节点
- 调度策略
---

## 概述

Kubernetes 作为现代容器编排调度平台，资源调度是其核心功能之一。本节将深入探讨 Kubernetes 中的资源调度机制，包括调度器的工作原理、调度策略以及高级调度场景。

## 调度器组件

### kube-scheduler 工作原理

`kube-scheduler` 是 Kubernetes 集群中负责 Pod 调度的核心组件，其主要职责包括：

- 监听 `kube-apiserver` 中未调度的 Pod
- 根据调度算法为 Pod 选择合适的节点
- 通过预选和优选两个阶段完成调度决策

### 调度流程

1. **预选阶段（Filtering）**：过滤掉不满足 Pod 运行条件的节点
2. **优选阶段（Scoring）**：对候选节点进行评分，选择最优节点
3. **绑定阶段（Binding）**：将 Pod 分配到选定的节点上

## 调度策略

### 默认调度策略

Kubernetes 中的各种工作负载资源都定义了相应的调度策略：

- **Deployment**：支持副本分散调度
- **DaemonSet**：确保每个节点运行一个 Pod 副本
- **StatefulSet**：支持有状态应用的有序调度

### 高级调度功能

通过为节点和 Pod 添加标签（Labels）和污点（Taints），可以实现更精细的调度控制：

- **节点选择器（NodeSelector）**
- **节点亲和性（Node Affinity）**
- **Pod 亲和性和反亲和性（Pod Affinity/Anti-Affinity）**
- **污点和容忍（Taints and Tolerations）**

## 动态调度扩展

### 重调度场景

当需要对已调度的 Pod 进行重新分配时，考虑以下场景：

#### 集群负载均衡

当集群中新增节点时，可能需要重新平衡各节点的资源利用率。原生 kube-scheduler 不支持 Pod 的重调度，需要使用专门的工具：

- **[Descheduler](https://github.com/kubernetes-sigs/descheduler)**：用于驱逐过载节点上的 Pod，实现集群负载重平衡

#### 数据本地性优化

对于大数据和批处理应用，Pod 的调度需要考虑数据分布：

- **[Volcano](https://volcano.sh/)**（原 kube-batch）：专为批处理和机器学习工作负载设计的调度器，支持队列管理、资源配额和任务调度

### 扩展调度器

除了默认调度器外，Kubernetes 还支持：

- **多调度器**：同时运行多个调度器实例
- **调度器扩展**：通过 Scheduler Framework 自定义调度逻辑
- **调度器配置**：通过配置文件自定义调度策略

## 最佳实践

1. **合理设置资源请求和限制**：确保调度器能够做出正确的调度决策
2. **使用节点标签和选择器**：实现精确的节点选择
3. **配置 Pod 反亲和性**：避免单点故障
4. **监控调度性能**：及时发现和解决调度瓶颈
