---
weight: 38
title: 服务发现与路由
date: '2022-05-21T00:00:00+08:00'
type: book
description: 深入探讨 Kubernetes 集群中的服务发现机制与路由策略，涵盖 DNS 解析、负载均衡、Service 类型、Ingress 控制器以及在云原生微服务架构中的最佳实践。
---

在云原生微服务架构中，服务发现和路由是确保应用间高效通信的基础设施。Kubernetes 提供了完善的服务发现机制和灵活的路由策略，让分布式应用能够在动态环境中自动发现彼此并建立可靠连接。

## 核心概念与组件

### 服务发现基础

服务发现是指在动态容器化环境中，应用程序能够自动找到并连接到所需服务实例的机制。Kubernetes 通过以下核心组件实现：

- **Service**：为一组 Pod 提供稳定的网络端点和负载均衡
- **CoreDNS**：集群内置 DNS 服务，提供服务名称到 IP 地址的解析
- **Endpoints/EndpointSlices**：跟踪和维护服务后端 Pod 的实际网络地址
- **Ingress Controller**：管理集群外部流量的入口和路由规则

### 网络抽象层次

Kubernetes 构建了多层网络抽象，从底层的 Pod 网络到顶层的 Ingress 路由：

```text
Internet → Ingress → Service → Endpoints → Pods
```

## 服务发现机制

### DNS 服务发现

Kubernetes 默认使用 CoreDNS 作为集群 DNS 服务器，支持以下解析模式：

1. **服务记录**：`<service-name>.<namespace>.svc.cluster.local`
2. **无头服务**：直接解析到 Pod IP 地址
3. **外部服务**：通过 ExternalName 映射外部域名
4. **跨命名空间访问**：完整的 FQDN 解析

### 环境变量注入

容器启动时，Kubernetes 自动注入同命名空间内所有服务的环境变量：

- `<SERVICE_NAME>_SERVICE_HOST`
- `<SERVICE_NAME>_SERVICE_PORT`

### API 服务发现

应用程序可以通过 Kubernetes API 动态查询和监听服务变化，适用于需要实时感知拓扑变化的场景。

## Service 类型与路由策略

### ClusterIP

默认服务类型，仅在集群内部可访问：

- 提供稳定的虚拟 IP 地址
- 支持会话亲和性（Session Affinity）
- 适用于内部微服务通信

### NodePort

在每个节点上开放特定端口，将流量转发到服务：

- 端口范围：30000-32767（可配置）
- 适用于开发测试环境
- 生产环境建议配合负载均衡器使用

### LoadBalancer

集成云服务商的负载均衡器：

- 自动分配外部 IP 地址
- 提供高可用和自动故障转移
- 适用于生产环境的外部服务暴露

### ExternalName

将服务映射到外部 DNS 名称：

- 无需创建 Endpoints
- 支持数据库、缓存等外部依赖的抽象
- 便于服务迁移和环境切换

## 高级路由与流量管理

### Ingress 控制器

提供 HTTP/HTTPS 路由和负载均衡：

- 基于主机名和路径的路由规则
- SSL/TLS 终结
- 支持多种实现：NGINX、Traefik、Istio Gateway

### 服务网格集成

与 Istio、Linkerd 等服务网格配合：

- 细粒度的流量策略
- 熔断、重试、超时控制
- 分布式追踪和可观测性

## 本节内容

{{< list_children show_summary="false">}}
