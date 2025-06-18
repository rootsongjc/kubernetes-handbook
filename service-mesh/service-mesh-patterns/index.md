---
title: 服务网格的部署模式
linktitle: 服务网格的部署模式
date: '2022-05-03T00:00:00+08:00'
weight: 4
description: 探讨服务网格架构的演进路径，从传统的客户端库到完整的服务网格，包括 Ingress 代理、路由器网格、节点代理、Sidecar 模式等多种部署模式的特点和适用场景。
keywords:
- kubernetes
- sidecar
- 代理
- 使用
- 服务
- 架构
- 流量
- 网格
- 部署
- 集群
---

在微服务架构的演进过程中，我们通常从使用**客户端库**来治理服务开始，逐步向服务网格架构迁移。下图展示了采用服务网格架构后的最终形态。

![服务网格架构示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/service-mesh/service-mesh-patterns/arch.webp)
{width=1140 height=892}

为了达到这一最终形态，我们需要逐步演进架构。以下是常见的演进路径和各个阶段的特点。

## Ingress 或边缘代理模式

对于使用 Kubernetes 进行容器编排的环境，在演进到服务网格架构之前，通常会首先引入 Ingress Controller 来处理集群内外的流量反向代理，如 Traefik、Nginx Ingress Controller 或 Envoy Gateway 等。

![Ingress 或边缘代理架构示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/service-mesh/service-mesh-patterns/ingress.webp)
{width=1140 height=422}

**优势：**

- 充分利用 Kubernetes 原生能力
- 改造成本低，易于实施
- 适合需要 L7 代理的外部访问场景

**局限性：**

- 无法管理集群内服务间流量
- 缺乏细粒度的流量控制能力

## 路由器网格模式

为了解决 Ingress 模式无法管理服务间流量的问题，可以在集群内部增加一个路由器层，让所有服务间的通信都通过这个中心化的路由器。

![路由器网格架构示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/service-mesh/service-mesh-patterns/router.webp)
{width=1142 height=498}

**优势：**

- 无需改造现有应用
- 迁移成本低
- 集中管理路由规则

**局限性：**

- 存在单点故障风险
- 随着服务数量增长，管理复杂度上升
- 可能成为性能瓶颈

## 节点代理模式（Proxy per Node）

这种架构在每个节点上部署一个代理实例。在 Kubernetes 环境中，通常使用 `DaemonSet` 对象来实现。Linkerd 1.x 版本曾采用这种部署方式。

![Proxy per node 架构示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/service-mesh/service-mesh-patterns/proxy-per-node.webp)
{width=1142 height=408}

**优势：**

- 资源利用率高，每个节点只需一个代理
- 适合物理机/虚拟机环境的大型单体应用
- 运维复杂度相对较低

**局限性：**

- 故障影响范围大，节点级别的故障会影响该节点上的所有服务
- 流量控制粒度较粗
- 对应用不完全透明

## Sidecar 代理模式

在这个阶段，每个应用实例都会配备一个专用的代理容器，形成 Sidecar 模式。这种架构已经非常接近完整的服务网格形态。

![Sidecar 代理/Fabric 模型示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/service-mesh/service-mesh-patterns/sidecar.webp)
{width=1140 height=524}

**优势：**

- 实现细粒度的流量控制
- 故障隔离性好
- 支持配置热加载
- 为每个服务提供独立的代理功能

**局限性：**

- 缺乏统一的管理平面
- 配置管理分散，难以统一治理
- 通常只作为向完整服务网格演进的过渡阶段

## 完整服务网格模式（Sidecar + 控制平面）

这是目前主流服务网格产品（如 Istio、Linkerd、Consul Connect）采用的架构模式，也是服务网格演进的完整形态。

![Sidecar 代理/控制平面架构示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/service-mesh/service-mesh-patterns/control-plane.webp)
{width=1142 height=814}

**核心组件：**

- **数据平面**：由 Sidecar 代理组成，负责实际的流量处理
- **控制平面**：提供配置管理、服务发现、证书管理等功能

**优势：**

- 统一的配置管理和策略下发
- 完整的可观测性支持
- 细粒度的安全和流量控制
- 声明式的配置管理

**考量因素：**

- 每个服务都需要额外的代理容器，增加资源消耗
- 需要针对代理进行性能优化
- 架构复杂度相对较高

## 多集群和跨环境扩展

当业务规模扩大或需要支持多环境部署时，服务网格需要支持跨集群的服务发现和流量管理。现代服务网格产品通常提供以下扩展能力：

- **多集群互联**：支持跨 Kubernetes 集群的服务通信
- **混合云部署**：支持云原生和传统基础设施的混合场景
- **边缘计算集成**：将边缘节点纳入服务网格管理范围
- **外部服务集成**：将第三方服务和遗留系统纳入网格治理

选择合适的部署模式需要综合考虑当前的技术栈、团队能力、业务需求以及长期的架构演进目标。建议采用渐进式的迁移策略，逐步向更高级的服务网格架构演进。
