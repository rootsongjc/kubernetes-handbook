---
weight: 42
title: Gateway API
date: 2022-05-21T00:00:00+08:00
description: 深入介绍 Kubernetes Gateway API 的核心概念、资源模型和最佳实践。作为 Ingress 的现代化替代方案，Gateway API 提供更强大的流量管理能力，支持多协议路由、角色分离和灵活的策略配置，已于 2023 年达到 GA 状态。
lastmod: 2025-10-27T17:50:41.500Z
---
  
> Gateway API 作为 Kubernetes 网络流量管理的现代标准，兼具协议多样性、角色分离和强大扩展性，已成为 Ingress 的理想替代方案。

## 概述

Gateway API 是由 Kubernetes SIG-NETWORK 管理的开源项目，旨在为 Kubernetes 生态系统提供现代化的服务网络 API。自 2023 年 GA 以来，Gateway API 已支持多协议路由、角色分离和灵活策略配置，成为 Ingress 的下一代替代方案。

{{< callout note 注意 >}}

Gateway API 作为替代 [Ingress](../../service-discovery/ingress/) 的下一代资源，既可以处理南北向流量，还可以处理东西向流量。关于 Gateway API 的详细介绍和发展趋势，请参考 [Gateway API：Kubernetes 和服务网格入口中网关的未来](/zh/blog/why-gateway-api-is-the-future-of-ingress-and-mesh/)。

{{< /callout >}}

目前已有大量网关和服务网格项目支持 Gateway API，详细的[支持状况](https://gateway-api.sigs.k8s.io/implementations/)可在官方文档中查看。

## 设计理念

Gateway API 通过分层架构和面向角色的接口设计，提升了网络配置的表现力和可扩展性。

### 分层架构

Gateway API 将网络配置分解为不同关注点，实现配置解耦和角色分离。

![Gateway API 的分层架构](https://assets.jimmysong.io/images/book/kubernetes-handbook/service-discovery/gateway/gateway-api.svg)
{width=609 height=452}

### 面向角色的设计

为不同场景定义了四类角色：

- 基础设施提供方：提供 GatewayClass 实现
- 集群运维人员：管理 Gateway 实例
- 应用开发者：定义路由需求
- 应用管理员：配置应用级策略

![Gateway API 管理时的角色划分](https://assets.jimmysong.io/images/book/kubernetes-handbook/service-discovery/gateway/gateway-roles.webp)
{width=2735 height=1519}

## 相比 Ingress 的优势

Gateway API 在表现力、扩展性、角色分离、通用性、基础设施共享和类型化后端引用等方面均有显著提升，并支持跨命名空间路由绑定。

## 资源模型详解

Gateway API 由多种资源组成，分别承担不同的网络管理职责。

### GatewayClass

定义网关类，由基础设施提供方创建，支持参数化配置。

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: cloud-gateway
spec:
  controllerName: "example.com/gateway-controller"
  description: "云服务提供商的网关实现"
```

### Gateway

描述外部流量如何路由到集群服务，支持多监听器和灵活的 TLS 配置。

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: production-gateway
  namespace: gateway-system
spec:
  gatewayClassName: cloud-gateway
  listeners:
  - name: http
    port: 80
    protocol: HTTP
    allowedRoutes:
      namespaces:
        from: Selector
        selector:
          matchLabels:
            environment: production
  - name: https
    port: 443
    protocol: HTTPS
    hostname: "*.example.com"
    tls:
      mode: Terminate
      certificateRefs:
      - kind: Secret
        name: wildcard-tls-cert
  addresses:
  - type: NamedAddress
    value: "production-lb"
```

### Route 资源

#### HTTPRoute

用于 HTTP/HTTPS 流量的路由和流量分割。

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api-route
  namespace: production
spec:
  parentRefs:
  - name: production-gateway
    namespace: gateway-system
  hostnames:
  - api.example.com
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /v1/
    - headers:
      - name: X-API-Version
        value: v1
    filters:
    - type: RequestHeaderModifier
      requestHeaderModifier:
        add:
        - name: X-Forwarded-Host
          value: api.example.com
    backendRefs:
    - name: api-v1-service
      port: 8080
      weight: 90
    - name: api-v1-canary-service
      port: 8080
      weight: 10
  - matches:
    - path:
        type: PathPrefix
        value: /v2/
    backendRefs:
    - name: api-v2-service
      port: 8080
```

![流量经过网关和 HTTPRoute 发送到服务中的过程](https://assets.jimmysong.io/images/book/kubernetes-handbook/service-discovery/gateway/httproute-basic-example.svg)
{width=800 height=600}

#### 其他路由类型

- **GRPCRoute**：支持基于 gRPC 方法的匹配
- **TLSRoute**：基于 SNI 的 TLS 路由
- **TCPRoute/UDPRoute**：四层流量路由

{{< table title="Gateway API 路由类型对比" >}}

| 路由类型      | OSI 层     | 路由鉴别器              | TLS 支持   | 主要用途                    |
|:-------------|:-----------|:-----------------------|:-----------|:---------------------------|
| HTTPRoute    | 第 7 层    | HTTP 协议内容           | 仅终止     | HTTP/HTTPS 应用路由        |
| GRPCRoute    | 第 7 层    | gRPC 方法和服务         | 仅终止     | gRPC 应用路由              |
| TLSRoute     | 第 4-7 层  | SNI 和 TLS 属性         | 直通/终止  | 基于 SNI 的 TLS 路由       |
| TCPRoute     | 第 4 层    | 目的端口               | 直通/终止  | TCP 流量转发               |
| UDPRoute     | 第 4 层    | 目的端口               | 不支持     | UDP 流量转发               |

{{< /table >}}

### ReferenceGrant

用于启用跨命名空间引用，细粒度控制资源访问。

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
  name: allow-gateway-access
  namespace: production
spec:
  from:
  - group: gateway.networking.k8s.io
    kind: HTTPRoute
    namespace: app-team
  to:
  - group: ""
    kind: Service
    name: production-api
```

## 路由绑定与限制机制

路由绑定需满足 parentRefs、监听器允许、命名空间策略和主机名匹配等条件。可通过监听器配置主机名、命名空间和路由类型限制。

## 策略附件系统

策略附件（Policy Attachment）允许将自定义策略（如超时、重试、限流等）附加到 Gateway API 资源上，支持 default/override 层级继承。

```yaml
apiVersion: networking.example.com/v1alpha1
kind: RateLimitPolicy
metadata:
  name: api-rate-limit
spec:
  default:
    requestsPerSecond: 100
  override:
    requestsPerSecond: 1000
  targetRef:
    group: gateway.networking.k8s.io
    kind: HTTPRoute
    name: api-route
```

## TLS 配置

Gateway API 支持下游（客户端到网关）和上游（网关到后端服务）的 TLS 配置，支持终止、透传、通配符证书和跨命名空间证书引用。

## 流量管理与高级功能

支持流量分割、请求过滤、重定向等高级流量管理能力，并可通过自定义后端、过滤器和路由类型实现扩展。

## 最佳实践

- 网关分层部署，区分外部与内部流量
- 安全配置，限制路由访问和命名空间
- 启用可观测性，集成监控与日志
- 迁移建议：并行部署、逐步迁移、验证切换

## 总结

Gateway API 作为 Kubernetes 网络的下一代标准，提供了比 Ingress 更强大、更灵活的流量管理能力。通过其面向角色的设计、丰富的路由类型和强大的扩展机制，Gateway API 能满足从简单 Web 应用到复杂微服务架构的各种网络需求。建议新项目直接采用 Gateway API，现有项目可逐步迁移以获得更好功能和扩展性。

## 参考文献

- [Gateway API 官方文档 - gateway-api.sigs.k8s.io](https://gateway-api.sigs.k8s.io/)
- [Gateway API GitHub 仓库 - github.com](https://github.com/kubernetes-sigs/gateway-api)
- [Gateway API 实现列表 - gateway-api.sigs.k8s.io](https://gateway-api.sigs.k8s.io/implementations/)
- [Kubernetes Gateway API 博客 - kubernetes.io](https://kubernetes.io/blog/2023/10/31/gateway-api-ga/)
