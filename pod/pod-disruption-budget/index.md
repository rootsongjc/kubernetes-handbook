---
weight: 20
title: Pod 中断与 PDB（Pod 中断预算）
linktitle: Pod 中断预算
date: '2022-05-21T00:00:00+08:00'
type: book
aliases:
  - /book/kubernetes-handbook/objects/pod-disruption-budget/
description: 了解 Kubernetes 中 Pod 的自愿和非自愿中断类型，以及如何使用 Pod 中断预算（PDB）来保护关键应用程序的可用性，确保在集群维护和扩缩容等操作中维持服务稳定性。
keywords:
- available
- deployment
- node
- pod
- 中断
- 应用程序
- 管理员
- 节点
- 集群
---

Pod 中断预算（Pod Disruption Budget，简称 PDB）是 Kubernetes 中用于保护应用程序可用性的重要机制。本文将帮助应用程序开发者构建高可用应用，同时为集群管理员提供安全执行自动化运维操作的指导。

## 中断类型：自愿与非自愿

Pod 的生命周期可能因各种原因而终止，我们将这些原因分为两大类：

### 非自愿中断

非自愿中断是指由于不可预见的硬件或系统故障导致的 Pod 终止，主要包括：

- **硬件故障**：节点物理机器故障
- **操作失误**：管理员意外删除虚拟机实例
- **基础设施问题**：云提供商故障、虚拟化层异常
- **系统故障**：内核崩溃（kernel panic）
- **网络分区**：节点因网络问题与集群失联
- **资源耗尽**：节点资源不足导致 Pod 被驱逐

> **注意**：除资源不足外，这些情况并非 Kubernetes 特有，而是分布式系统的常见挑战。

### 自愿中断

自愿中断是指由人为操作或自动化流程主动触发的 Pod 终止，分为以下几类：

**应用程序维护操作**：

- 删除或更新 Deployment 等工作负载控制器
- 修改 Pod 模板导致重新部署
- 直接删除 Pod（通常为误操作）

**集群运维操作**：

- [节点排空（drain）](https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/)进行维护或升级
- 集群缩容时移除节点
- 资源调度优化时迁移 Pod

这些操作可能由管理员手动执行，也可能通过自动化工具完成。建议向集群管理员或云服务提供商确认是否启用了相关自动化功能。

## 应对中断的策略

### 减轻非自愿中断的影响

1. **资源配置**：为 Pod [正确配置资源请求和限制](https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/)
2. **应用程序复制**：部署多副本应用程序（[无状态应用](https://kubernetes.io/docs/tasks/run-application/run-stateless-application-deployment/)和[有状态应用](https://kubernetes.io/docs/tasks/run-application/run-replicated-stateful-application/)）
3. **分布式部署**：使用反亲和性策略将副本分散到不同机架或可用区

### 管理自愿中断

不同集群的自愿中断频率差异很大。基础的 Kubernetes 集群可能很少发生自愿中断，但生产环境通常需要定期进行：

- 节点系统更新
- 集群版本升级
- 自动扩缩容操作

Kubernetes 通过 **Pod 中断预算** 机制来平衡运维需求与服务可用性。

## Pod 中断预算的工作机制

### 基本概念

Pod 中断预算（PDB）是一种 Kubernetes 资源对象，用于限制同时发生自愿中断的 Pod 数量。它通过以下方式保护应用程序：

- **最小可用副本数**：确保始终有足够数量的 Pod 运行
- **最大不可用副本数**：限制同时中断的 Pod 数量
- **标签选择器**：精确指定受保护的 Pod 范围

### 工作流程

1. **创建 PDB**：应用程序所有者为关键服务定义中断预算
2. **中断请求**：管理员或自动化工具通过 [Eviction API](https://kubernetes.io/docs/concepts/scheduling-eviction/api-eviction/) 请求驱逐 Pod
3. **预算检查**：Kubernetes 验证驱逐操作是否违反 PDB 约束
4. **执行或拒绝**：满足预算要求时执行驱逐，否则拒绝请求

### 重要特性

- **仅限自愿中断**：PDB 无法阻止非自愿中断
- **优雅终止**：通过 Eviction API 驱逐的 Pod 会按照 `terminationGracePeriodSeconds` 优雅关闭
- **滚动更新兼容**：控制器（如 Deployment）在滚动更新时不受 PDB 限制

## 实践示例：节点维护场景

假设我们有一个包含 3 个节点的集群，运行着一个 3 副本的应用程序：

### 初始状态

|       node-1       |      node-2       |      node-3       |
| :----------------: | :---------------: | :---------------: |
| pod-a  *available* | pod-b *available* | pod-c *available* |
| pod-x  *available* |                   |                   |

其中 pod-a、pod-b、pod-c 属于同一个 Deployment，配置了要求**至少 2 个副本可用**的 PDB。

### 第一步：排空 node-1

管理员执行 `kubectl drain node-1`：

|  node-1 *draining*   |      node-2       |      node-3       |
| :------------------: | :---------------: | :---------------: |
| pod-a  *terminating* | pod-b *available* | pod-c *available* |
| pod-x  *terminating* |                   |                   |

控制器检测到 pod 终止，创建替代 Pod：

|  node-1 *draining*   |      node-2       |      node-3       |
| :------------------: | :---------------: | :---------------: |
| pod-a  *terminating* | pod-b *available* | pod-c *available* |
| pod-x  *terminating* | pod-d *starting*  |       pod-y       |

### 第二步：等待新 Pod 就绪

| node-1 *drained* |      node-2       |      node-3       |
| :--------------: | :---------------: | :---------------: |
|                  | pod-b *available* | pod-c *available* |
|                  | pod-d *available* |       pod-y       |

### 第三步：尝试排空 node-2

当管理员尝试排空 node-2 时，系统会：

1. 成功驱逐 pod-b（仍有 2 个副本可用）
2. **拒绝**驱逐 pod-d（会导致可用副本少于 2 个）

最终状态可能是：

| node-1 *drained* | node-2 *draining* |      node-3       |    *no node*    |
| :--------------: | :---------------: | :---------------: | :-------------: |
|                  |                   | pod-c *available* | pod-e *pending* |
|                  | pod-d *available* |       pod-y       |                 |

此时需要增加集群容量或等待资源释放才能继续维护操作。

## 角色分离与最佳实践

### 职责划分

Pod 中断预算支持以下角色分离：

- **应用程序所有者**：定义业务可用性要求，创建 PDB
- **集群管理员**：执行基础设施维护，遵循 PDB 约束
- **平台团队**：提供自动化工具，集成 Eviction API

### 集群维护策略

根据不同需求选择合适的维护策略：

| 策略 | 停机时间 | 资源成本 | 自动化程度 | 适用场景 |
|------|----------|----------|------------|----------|
| 接受停机 | 有 | 低 | 高 | 测试环境 |
| 蓝绿部署 | 无 | 高 | 中 | 关键业务 |
| PDB + 滚动维护 | 无 | 低 | 高 | 生产推荐 |

## 配置建议

### PDB 最佳实践

1. **合理设置预算**：平衡可用性和维护效率
2. **测试验证**：在非生产环境验证 PDB 行为
3. **监控告警**：跟踪中断事件和预算使用情况
4. **文档记录**：明确记录中断容忍度要求

### 应用程序设计

- 实现优雅关闭处理
- 支持快速启动和健康检查
- 设计无状态或状态可恢复的架构

## 延伸阅读

- [Pod 中断预算配置指南](https://kubernetes.io/docs/tasks/run-application/configure-pdb/)
- [节点安全排空操作](https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/)
- [Kubernetes 官方中断文档](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/)
