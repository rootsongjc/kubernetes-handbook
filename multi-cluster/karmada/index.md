---
title: Karmada
weight: 3
date: 2024-08-22
description: "Karmada 是一个开源的 Kubernetes 多集群管理系统，通过原生 API 和先进调度功能实现跨多个集群和云的应用统一管理，无需修改应用程序即可实现真正的开放式多云 Kubernetes 部署。"
keywords:
- api
- apiserver
- karmada
- kubernetes
- 多集群
- 云原生
- 调度
- 管理
---

Karmada 是一个开源的 Kubernetes 多集群管理系统，让您能够在多个 Kubernetes 集群和云环境中运行云原生应用程序，而无需修改应用程序本身。通过使用 Kubernetes 原生 API 并提供先进的调度功能，Karmada 实现了真正的开放式多云 Kubernetes 管理。

{{< callout note "Karmada 名称的由来" >}}

`Karmada` 是由 "Kubernetes" 和 "Armada" 组合而来的。`Armada` 在英语中意味着"舰队"，通常指由许多船只组成的大型水面作战力量。在这里，它象征着多个集群的集合，每个集群如同一艘强大的战舰，共同组成了一个强大的"舰队"，协同工作以提高效率和资源利用率。

{{< /callout >}}

更多关于 Karmada 的详细信息，请访问 [Karmada 官方文档](https://karmada.io/zh/docs/)。

## 核心架构与组件

下图展示了 Karmada 的整体架构以及各组件之间的关系。

![Karmada 中的各个组件及其关系](https://assets.jimmysong.io/images/book/kubernetes-handbook/multi-cluster/karmada/arch.webp)
{width=1706 height=1127}

### 控制平面组件

**karmada-apiserver**

- 扩展了 Kubernetes API 的 Karmada API 服务器
- 作为 Karmada 控制平面的前端入口
- 支持使用 `kubectl` 直接操作 Karmada 资源

**karmada-aggregated-apiserver**

- 基于 Kubernetes API 聚合层技术的聚合 API 服务器
- 提供集群 API 和相关子资源
- 支持通过 karmada-apiserver 代理访问成员集群

**kube-controller-manager**

- 继承自 Kubernetes 的控制器管理器
- 保持与原生 Kubernetes 一致的用户体验和行为
- 负责处理标准的 Kubernetes 资源控制逻辑

**karmada-controller-manager**

- 运行多个 Karmada 自定义控制器
- 监视 Karmada 对象并与成员集群 API 交互
- 负责在成员集群中创建和管理 Kubernetes 资源

### 调度与策略组件

**karmada-scheduler**

- 负责将 Kubernetes 原生 API 资源（包括 CRD）调度到成员集群
- 根据调度策略、资源约束和集群可用性确定最佳部署位置
- 支持多种调度算法和策略

**karmada-descheduler**

- 定期检测集群中的资源分布状态
- 根据成员集群状态变化触发重新调度
- 优化资源分配和集群负载均衡

**karmada-scheduler-estimator**

- 提供精确的集群资源估算服务
- 为调度器提供实时的集群资源信息
- 提高调度决策的准确性

### 扩展与管理组件

**karmada-webhook**

- HTTP 回调服务，处理 Karmada 和 Kubernetes API 请求
- 支持验证（Validating）和变更（Mutating）webhook
- 用于执行自定义策略和对象修改

**karmada-agent**

- 在 Pull 模式下部署在成员集群的代理组件
- 负责将集群注册到 Karmada 控制平面
- 处理资源清单的同步和状态上报

**karmada-search**

- 提供全局搜索和资源代理功能
- 支持跨多个集群的资源查询和访问
- 简化多云环境下的资源管理

### 存储与工具

**etcd**

- Karmada 控制平面的后端存储
- 存储所有 Karmada 和 Kubernetes API 对象
- 提供高可用和一致性保证

**karmadactl**

- Karmada 官方命令行工具
- 支持集群注册、资源管理等操作
- 提供完整的 Karmada 管理功能

**kubectl karmada**

- 以 kubectl 插件形式提供的工具
- 功能与 `karmadactl` 完全相同
- 便于集成到现有的 kubectl 工作流中

## 集群注册与管理

Karmada 支持将多个 Kubernetes 集群注册到控制平面进行统一管理。集群注册提供了两种模式来适应不同的网络环境和安全需求。

### Push 模式

在 Push 模式下，Karmada 控制平面直接访问成员集群的 `kube-apiserver` 来获取集群状态和部署应用清单。

**特点：**

- 控制平面主动连接成员集群
- 实时性更好，延迟更低
- 适用于网络连通性良好的环境

**操作方法：**

```bash
# 注册集群
kubectl karmada join <cluster-name> --kubeconfig=<member-cluster-kubeconfig>

# 取消注册集群
kubectl karmada unjoin <cluster-name> --kubeconfig=<member-cluster-kubeconfig>
```

### Pull 模式

在 Pull 模式下，控制平面不直接访问成员集群，而是通过部署在成员集群中的 `karmada-agent` 组件来处理任务委派。

**特点：**

- 成员集群主动连接控制平面
- 适用于网络受限或安全要求较高的环境
- 支持 NAT 和防火墙后的集群

**操作方法：**

```bash
# 在控制平面生成注册令牌
karmadactl token create --print-register-command

# 在成员集群执行注册
karmadactl register <cluster-name> --token=<bootstrap-token> --discovery-token-ca-cert-hash=<hash>
```

### 集群标识与管理

**集群对象表示**

- 每个注册的集群都表示为一个 `Cluster` 对象
- 对象名称（`.metadata.name`）为注册时指定的集群名称
- 每个集群分配唯一标识符（`.spec.id`）防止重复注册

**集群状态监控**

- 实时监控集群健康状态和资源使用情况
- 支持集群标签和污点管理
- 提供集群准入控制和调度策略配置

通过这些机制，Karmada 能够有效管理大规模的多集群环境，为云原生应用提供统一、高效的部署和运维体验。
