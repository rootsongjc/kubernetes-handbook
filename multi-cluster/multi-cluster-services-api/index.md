---
weight: 2
title: 多集群服务 API（Multicluster Services API）
linktitle: 多集群服务 API
date: '2022-05-21T00:00:00+08:00'
type: book
keywords:
- api
- clusterset
- kubernetes
- namespace
- sameness
- 命名
- 服务
- 用户
- 空间
- 集群
---
2020 年初，Kubernetes 社区提议 [Multicluster Services API](https://docs.google.com/document/d/1hFtp8X7dzVS-JbfA5xuPvI_DNISctEbJSorFnY-nz6o/edit#heading=h.u7jfy9wqpd2b)，旨在解决长久以来就存在的 Kubernetes 多集群服务管理问题。

Kubernetes 用户可能希望将他们的部署分成多个集群，但仍然保留在这些集群中运行的工作负载之间的相互依赖关系，这有[很多原因](https://docs.google.com/document/d/1G1lfIukib7Fy_LpLUoHZPhcZ5T-w52D2YT9W1465dtY/edit)。今天，集群是一个硬边界，一个服务对远程的 Kubernetes 消费者来说是不透明的，否则就可以利用元数据（如端点拓扑结构）来更好地引导流量。为了支持故障转移或在迁移过程中的临时性，用户可能希望消费分布在各集群中的服务，但今天这需要非复杂的定制解决方案。

## Multicluster Services API 概述

Multicluster Services API 是 Kubernetes 的一个扩展，用于跨多个集群提供服务。它建立在 Namespace Sameness 概念之上，通过使用相同的服务名称，可以让服务在集群之间保持可用。控制平面可以是集中式或分散式的，但消费者只依赖于本地数据。

该 API 的目的是使 ClusterIP 和 headless 服务能够在集群之间按预期工作。接下来，我将为你介绍 Multicluster API 中的一些基本概念。

## Namespace Sameness

Namespace Sameness 是 Kubernetes 集群中的一个重要概念，指的是在由单一管理机构治理的一组相关集群中，具有相同名称的命名空间被视为相同的命名空间。这意味着在这些集群中，用户在特定命名空间内的权限和特性是一致的。

Namespace Sameness 的关键特性如下：

1. **一致性**：所有具有相同名称的命名空间在不同集群中被视为相同，用户在这些命名空间中的权限相同。

2. **灵活性**：命名空间不必在每个集群中都存在，允许某些集群缺少特定命名空间，而不影响其他集群的操作。

3. **服务共享**：在多个集群中，具有相同名称的服务被视为同一服务。这使得跨集群的服务发现和负载均衡变得更加简单和一致。

4. **设计原则**：
   - 不同目的的命名空间不应在集群间使用相同名称。
   - 应为团队和集群分配或保留命名空间，以确保资源的合理管理。
   - 应严格控制用户对命名空间的访问权限，以防止未授权访问。

5. **避免默认命名空间的使用**：在生产环境中，建议避免使用默认命名空间或通用命名空间（如 "prod" 或 "dev"），以减少意外部署资源到默认命名空间的风险。

## ClusterSet

ClusterSet 是一组由单一管理机构治理的 Kubernetes 集群的集合。它具有以下特点:

- 集群之间存在高度信任。

- ClusterSet 中的集群应用 Namespace Sameness 原则:
  - 给定命名空间在集群间具有一致的权限和特征。 
  - 命名空间不必在每个集群中都存在，但在存在的集群中行为一致。

ClusterSet 是一个集群作用域的 ClusterProperty CRD，存储名称和值。这个属性可用于:

- 使用 clusterID 唯一标识集群
- 唯一标识集群在 ClusterSet 中的成员资格，直到成员资格结束
- 为构建在 ClusterSet 内的多集群工具提供参考点，例如 DNS 标签、日志记录和跟踪等
- 提供额外的元数据空间，存储可能以临时注释的形式实现的其他集群属性

## Service 和 ServiceExport

- 用户/管理员与 MCS 交互的主要接口
- 一种自定义资源，可用于创建并标记要导出的服务
- mcs-controller 使用这些资源

## ServiceImport 和 EndpointSlices

- 由 mcs-controller 在 ClusterSet 中的所有 namespace-same 集群中创建
- 代表导入的服务以及跨 ClusterSet 的所有可用后端
- 用于在消费集群中创建相关的 EndpointSlices

## 参考

- [KEP-1645: Multi-Cluster Services API - github.com](https://github.com/kubernetes/enhancements/tree/master/keps/sig-multicluster/1645-multi-cluster-services-api)
- [Mutlcluster API SIG](https://multicluster.sigs.k8s.io/concepts/multicluster-services-api/)
