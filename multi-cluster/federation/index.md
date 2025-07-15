---
weight: 2
title: 集群联邦（Cluster Federation）
linktitle: 集群联邦
date: '2023-01-17T10:40:00+08:00'
type: book
description: 介绍 Kubernetes 集群联邦的概念、用途和发展历程。虽然 Kubefed 项目已归档，但了解其设计理念和架构对理解多集群管理仍有价值。
keywords:
- api
- dns
- federation
- kubefed
- kubernetes
- nginx
- 服务
- 联邦
- 资源
- 集群
---

{{<callout warning 注意>}}

[Kubefed](https://github.com/kubernetes-sigs/kubefed) 项目已于 2023 年正式归档，详见 [Follow-up: discussion on archiving Kubefed](https://groups.google.com/g/kubernetes-sig-multicluster/c/lciAVj-_ShE?pli=1)。本文档仅作为历史参考和概念介绍。

对于当前的多集群管理解决方案，建议考虑：
- [Admiral](https://github.com/istio-ecosystem/admiral)
- [Submariner](https://submariner.io/)
- [Liqo](https://liqo.io/)
- [Virtual Kubelet](https://virtual-kubelet.io/)

{{</callout>}}

## 什么是集群联邦

Kubernetes 从 1.8 版本起声称单集群最多可支持 5000 个节点和 15 万个 Pod，现在单集群规模已经可以更大。但在实际生产环境中，由于各种原因（如地理分布、故障隔离、合规要求等），我们往往需要部署多个集群，同时又希望能够统一管理这些集群，这就需要用到集群联邦（Federation）技术。

集群联邦是一种将多个 Kubernetes 集群统一管理的技术方案，它允许用户通过单一控制平面管理分布在不同地理位置、不同云服务提供商的多个 Kubernetes 集群。

## 使用集群联邦的原因

### 核心功能

Federation 通过提供两个主要功能来简化多集群管理：

- **跨集群资源同步**：Federation 提供了在多个集群中保持资源同步的能力。例如，可以确保同一个 Deployment 在多个集群中存在。
- **跨集群服务发现**：Federation 提供了自动配置 DNS 服务以及在所有集群后端上进行负载均衡的能力。例如，可以提供一个全局 VIP 或者 DNS 记录，通过它可以访问多个集群后端。

### 使用场景

Federation 还可以支持以下用例：

- **高可用性**：通过在集群间分布负载并自动配置 DNS 服务和负载均衡，federation 最大限度地减少集群故障的影响。
- **避免厂商锁定**：通过更简单的跨集群应用迁移方式，federation 可以防止集群厂商锁定。
- **地理分布**：在不同地理位置部署服务，降低用户访问延迟。
- **合规要求**：满足数据本地化等法规要求。

### 多集群的必要性

基于以下原因，你可能需要多个集群：

- **低延迟**：通过在多个区域部署集群可以最大限度减少区域用户的延迟。
- **故障隔离**：拥有多个小集群可能比单个大集群更利于故障隔离（例如：在云服务提供商的不同可用区中的多个集群）。
- **可伸缩性**：虽然单个集群的可伸缩性限制对大多数用户不是问题，但某些场景下仍需要考虑。
- **混合云**：你可以在不同的云服务提供商或本地数据中心中拥有多个集群。

### 注意事项

虽然 federation 有很多吸引人的使用案例，但也有一些需要考虑的问题：

- **网络开销**：federation 控制平面需要监控所有集群以确保当前状态符合预期。如果集群分布在不同区域或云服务提供商，这将导致网络成本增加。
- **复杂性增加**：引入 federation 会增加系统的复杂性，需要额外的运维和管理工作。
- **集群间依赖**：federation 控制平面中的问题可能影响所有集群，需要谨慎设计以最小化风险。

## 集群规划策略

### 区域分布策略

在选择集群数量时，需要考虑以下因素：

1. **服务区域数量（R）**：根据用户分布确定需要覆盖的地理区域数量
2. **容错能力（U）**：确定可以同时承受多少个集群不可用
3. **负载均衡策略**：是否允许跨区域流量调度

根据这些因素，推荐的集群数量为：
- 允许跨区域流量：至少 max(R, U+1) 个集群
- 不允许跨区域流量：至少 R × (U+1) 个集群

### 单集群范围建议

对于单个集群的部署，建议：

- **同可用区部署**：将集群中的所有虚拟机部署在同一可用区，以减少单点故障和网络延迟
- **合理的集群规模**：虽然 Kubernetes 支持大规模集群，但要根据实际需求和运维能力确定合适的规模
- **安全隔离**：对于有严格安全要求的工作负载，考虑部署独立的集群

## Kubernetes 集群联邦的发展历程

### Federation v1 的问题

最初的 Federation v1 重用了 Kubernetes API 来降低用户的学习成本，但这种方式存在以下问题：

- **实现复杂**：在集群层面重新实现 Kubernetes API 非常困难，特定扩展只能存储在注释中
- **灵活性有限**：由于完全仿照 Kubernetes API，在类型定义、资源放置和调节方面缺乏灵活性
- **成熟度问题**：API 成熟度不一致，很多功能长期处于 Alpha 状态

### Federation v2 的改进

为了解决 v1 的问题，社区开发了 Federation v2（也称为 KubeFed），主要改进包括：

- **专用 API 设计**：采用 Federation 特定的 API 架构，而不是完全仿照 Kubernetes API
- **模块化设计**：支持联邦任意 Kubernetes 资源，包括 CRD
- **灵活的资源管理**：通过 Template、Placement 和 Override 机制实现灵活的资源分发

### 项目归档

由于多集群管理需求的多样性和复杂性，以及社区对不同解决方案的分歧，Kubefed 项目最终于 2023 年归档。这并不意味着多集群管理需求的消失，而是为新的、更专业化的解决方案让路。

## Federation v2 架构概览

虽然项目已归档，但了解其设计理念仍有价值。

![Kubernetes 集群联邦架构图](https://assets.jimmysong.io/images/book/kubernetes-handbook/multi-cluster/federation/federation-concepts.webp)
{width=960 height=720}

### 核心组件

Federation v2 通过 CRD 机制新增了四种 API 组：

| API Group                      | 用途                                                  |
| ------------------------------ | ----------------------------------------------------- |
| core.kubefed.k8s.io            | 集群配置、联邦资源配置、KubeFed Controller 设置等     |
| types.kubefed.k8s.io           | 被联邦的 Kubernetes API 资源                          |
| scheduling.kubefed.k8s.io      | 副本编排策略                                          |
| multiclusterdns.kubefed.k8s.io | 跨集群服务发现设置                                    |

### 集群配置

Federation 区分两种类型的集群：

- **Host 集群**：提供 KubeFed API 和控制平面的集群
- **Member 集群**：通过 KubeFed API 注册的集群，Host 集群也可以作为 Member 被管理

![KubeFed 基础架构](https://assets.jimmysong.io/images/book/kubernetes-handbook/multi-cluster/federation/sync-controller.webp)
{width=4199 height=2474}

### 资源管理模型

Federated 资源具备三个主要组成部分：

```yaml
apiVersion: types.kubefed.k8s.io/v1beta1
kind: FederatedDeployment
metadata:
  name: test-deployment
  namespace: test-namespace
spec:
  template:    # 定义资源模板
    metadata:
      labels:
        app: nginx
    spec:
      # Deployment 规格
  placement:   # 定义部署位置
    clusters:
    - name: cluster1
    - name: cluster2
  overrides:   # 定义集群特定配置
  - clusterName: cluster2
    clusterOverrides:
    - path: spec.replicas
      value: 5
```

- **Template**：定义要部署的 Kubernetes 资源的标准模板
- **Placement**：指定资源要部署到哪些集群
- **Override**：为特定集群定义配置覆盖

### 副本调度

通过 `ReplicaSchedulingPreference`（RSP）实现智能的副本分发：

```yaml
apiVersion: scheduling.kubefed.k8s.io/v1alpha1
kind: ReplicaSchedulingPreference
metadata:
  name: test-deployment
  namespace: test-ns
spec:
  targetKind: FederatedDeployment
  totalReplicas: 15 
  clusters: 
    "*":
      weight: 2
      maxReplicas: 12
    ap-northeast:
      minReplicas: 1
      maxReplicas: 3
      weight: 1
```

![RSP](https://assets.jimmysong.io/images/book/kubernetes-handbook/multi-cluster/federation/kubefed-rsp.webp)
{width=1707 height=948}

### 多集群 DNS

支持跨集群的服务发现和 DNS 管理：

![DNS](https://assets.jimmysong.io/images/book/kubernetes-handbook/multi-cluster/federation/kubefed-service-dns.webp)
{width=1572 height=912}

## 现代多集群管理方案

虽然 Kubefed 已归档，但多集群管理的需求依然存在。目前的主流方案包括：

### 服务网格方案
- **Istio 多集群**：通过 Istio 实现跨集群服务发现和流量管理
- **Linkerd 多集群**：轻量级的跨集群连接方案

### 专业化工具
- **Submariner**：专注于网络连接的多集群方案
- **Admiral**：基于 Istio 的多集群流量管理
- **Liqo**：动态的多集群资源共享

### 云厂商方案
- **Google Anthos**：Google 的混合云和多云管理平台
- **AWS EKS Anywhere**：AWS 的边缘和本地部署方案
- **Azure Arc**：Microsoft 的混合云管理方案

## 参考资料

- [Kubernetes Federation v2 归档公告](https://github.com/kubernetes-sigs/kubefed)
- [Kubernetes Federation Evolution](https://kubernetes.io/blog/2018/12/12/kubernetes-federation-evolution/)
- [SIG Multicluster](https://github.com/kubernetes/community/tree/master/sig-multicluster)
- [多集群管理最佳实践](https://kubernetes.io/docs/concepts/cluster-administration/networking/)

