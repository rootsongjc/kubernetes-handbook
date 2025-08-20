---
weight: 42
title: Gateway API
date: '2022-05-21T00:00:00+08:00'
type: book
description: >-
  深入介绍 Kubernetes Gateway API 的核心概念、资源模型和最佳实践。作为 Ingress 的现代化替代方案，Gateway API
  提供更强大的流量管理能力，支持多协议路由、角色分离和灵活的策略配置，已于 2023 年达到 GA 状态。
keywords:
  - gateway api
  - kubernetes
  - ingress
  - 流量管理
  - 路由
  - 负载均衡
  - 服务网格
  - 网络策略
lastmod: '2025-08-20'
---

{{< callout note 注意 >}}

Gateway API 作为替代 [Ingress](../../service-discovery/ingress/) 的下一代资源，既可以处理南北向流量，还可以处理东西向流量。关于 Gateway API 的详细介绍和发展趋势，请参考 [Gateway API：Kubernetes 和服务网格入口中网关的未来](/blog/why-gateway-api-is-the-future-of-ingress-and-mesh/)。

{{< /callout >}}

[Gateway API](https://github.com/kubernetes-sigs/gateway-api) 是由 Kubernetes SIG-NETWORK 管理的开源项目，旨在为 Kubernetes 生态系统提供现代化的服务网络 API。该项目在 2023 年 10 月[宣布 GA](https://kubernetes.io/blog/2023/10/31/gateway-api-ga/)，并在 2024 年 5 月[发布 v1.1](https://kubernetes.io/blog/2024/05/09/gateway-api-v1-1/)，将多项功能升级为正式可用，特别是对服务网格和 GRPCRoute 的支持。

Gateway API 提供了一套完整的资源对象来暴露 Kubernetes 应用：

- `GatewayClass` - 网关类定义
- `Gateway` - 网关实例
- `HTTPRoute` - HTTP 路由规则
- `TLSRoute` - TLS 路由规则
- `TCPRoute` / `UDPRoute` - 四层路由规则
- `GRPCRoute` - gRPC 路由规则

目前已有大量网关和服务网格项目支持 Gateway API，详细的[支持状况](https://gateway-api.sigs.k8s.io/implementations/)可在官方文档中查看。

## 设计理念

Gateway API 通过提供表现性强、可扩展且面向角色的接口来改善服务网络管理。其核心设计理念包括：

### 分层架构

Gateway API 采用分层架构，将网络配置分解为不同的关注点，实现配置解耦和角色分离：

![Gateway API 的分层架构](https://assets.jimmysong.io/images/book/kubernetes-handbook/service-discovery/gateway/gateway-api.svg)
{width=609 height=452}

### 面向角色的设计

Gateway API 为不同的使用场景定义了四类角色：

- **基础设施提供方**：云服务提供商或基础设施厂商，负责提供 GatewayClass 实现
- **集群运维人员**：管理集群资源，创建和维护 Gateway 实例
- **应用程序开发者**：开发和部署应用程序，定义应用的路由需求
- **应用管理员**：管理复杂应用系统，负责应用级别的策略配置

![Gateway API 管理时的角色划分](https://assets.jimmysong.io/images/book/kubernetes-handbook/service-discovery/gateway/gateway-roles.webp)
{width=2735 height=1519}

## 相比 Ingress 的优势

### 核心改进

Gateway API 相比 Ingress 有以下关键改进：

**表现力更强**

- 支持基于 Header 的匹配
- 内置流量权重分配
- 原生支持多种协议（HTTP/HTTPS/TLS/TCP/UDP/gRPC）

**扩展性更好**  

- 允许在 API 各层次链接自定义资源
- 支持更精细的定制化配置
- 提供标准化的策略附件机制

**角色分离**

- 不同 API 资源映射到不同的管理角色
- 实现关注点分离和权责明确

**通用性强**

- 设计为可移植的通用规范
- 支持多厂商实现和互操作性

**共享基础设施**

- 支持独立路由资源绑定到同一网关
- 实现负载均衡器和 VIP 的安全共享

**类型化后端引用**

- 支持引用 Kubernetes Service 和其他自定义资源
- 提供更灵活的后端配置能力

**跨命名空间支持**

- 支持跨命名空间的路由绑定
- 在保持工作负载隔离的同时共享网络基础设施

## 资源模型详解

### GatewayClass

`GatewayClass` 是集群级别的资源，定义了一组具有共同配置和行为的网关。它类似于 `IngressClass` 或 `StorageClass`，由基础设施提供方创建。

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: cloud-gateway
spec:
  controllerName: "example.com/gateway-controller"
  description: "云服务提供商的网关实现"
```

**参数化配置**

GatewayClass 支持通过 `parametersRef` 字段进行参数化配置：

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: premium-gateway
spec:
  controllerName: "example.com/gateway-controller"
  parametersRef:
    group: example.com/v1alpha1
    kind: GatewayConfig
    name: premium-config
---
apiVersion: example.com/v1alpha1
kind: GatewayConfig
metadata:
  name: premium-config
spec:
  loadBalancerType: "premium"
  ipAddressPool: "premium-pool"
  enableDDoSProtection: true
```

### Gateway

`Gateway` 描述如何将外部流量路由到集群内的服务。它定义了网络入口点的具体配置：

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

**监听器配置**

每个监听器可以配置：

- **端口和协议**：定义监听的端口和协议类型
- **主机名**：指定处理的域名（支持通配符）
- **TLS 设置**：配置 SSL/TLS 证书和终止策略
- **路由限制**：控制哪些路由可以附加到此监听器

### Route 资源

#### HTTPRoute

`HTTPRoute` 是最常用的路由类型，用于处理 HTTP 和 HTTPS 流量：

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

**GRPCRoute**

用于 gRPC 流量路由，支持基于 gRPC 方法的匹配：

```yaml
apiVersion: gateway.networking.k8s.io/v1alpha2
kind: GRPCRoute
metadata:
  name: grpc-route
spec:
  parentRefs:
  - name: production-gateway
  hostnames:
  - grpc.example.com
  rules:
  - matches:
    - method:
        service: com.example.User
        method: GetUser
    backendRefs:
    - name: user-service
      port: 9090
```

**TLSRoute**

用于基于 SNI 的 TLS 路由：

```yaml
apiVersion: gateway.networking.k8s.io/v1alpha2
kind: TLSRoute
metadata:
  name: tls-route
spec:
  parentRefs:
  - name: production-gateway
  hostnames:
  - secure.example.com
  rules:
  - backendRefs:
    - name: secure-service
      port: 8443
```

**TCPRoute 和 UDPRoute**

用于四层流量路由：

```yaml
apiVersion: gateway.networking.k8s.io/v1alpha2
kind: TCPRoute
metadata:
  name: database-route
spec:
  parentRefs:
  - name: production-gateway
    sectionName: database
  rules:
  - backendRefs:
    - name: postgres-service
      port: 5432
```

#### 路由类型对比

| 路由类型      | OSI 层     | 路由鉴别器              | TLS 支持   | 主要用途                    |
|:-------------|:-----------|:-----------------------|:-----------|:---------------------------|
| `HTTPRoute`  | 第 7 层    | HTTP 协议中的任何内容    | 仅终止     | HTTP/HTTPS 应用路由        |
| `GRPCRoute`  | 第 7 层    | gRPC 方法和服务         | 仅终止     | gRPC 应用路由              |
| `TLSRoute`   | 第 4-7 层  | SNI 和其他 TLS 属性     | 直通或终止 | 基于 SNI 的 TLS 路由       |
| `TCPRoute`   | 第 4 层    | 目的端口               | 直通或终止 | TCP 流量转发               |
| `UDPRoute`   | 第 4 层    | 目的端口               | 不支持     | UDP 流量转发               |

### ReferenceGrant

`ReferenceGrant` 用于启用跨命名空间引用，提供细粒度的访问控制：

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

## 路由绑定机制

### 绑定过程

路由附加到网关需要满足以下条件：

1. **路由引用**：Route 在 `parentRefs` 字段中引用 Gateway
2. **监听器允许**：Gateway 至少有一个监听器允许该路由附加
3. **命名空间策略**：符合 Gateway 的命名空间访问策略
4. **主机名匹配**：路由的主机名与监听器的主机名匹配

![路由绑定示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/service-discovery/gateway/gateway-api-route-binding.webp)
{width=2299 height=772}

### 限制机制

**主机名限制**

```yaml
listeners:
- name: api
  hostname: api.example.com  # 只接受匹配的主机名
  protocol: HTTPS
  port: 443
```

**命名空间限制**

```yaml
listeners:
- name: production
  allowedRoutes:
    namespaces:
      from: Selector
      selector:
        matchLabels:
          environment: production
```

**路由类型限制**

```yaml
listeners:
- name: grpc-only
  allowedRoutes:
    kinds:
    - group: gateway.networking.k8s.io
      kind: GRPCRoute
```

## 策略附件系统

### 策略附件概念

策略附件（Policy Attachment）允许将自定义策略（如超时、重试、限流等）附加到 Gateway API 资源上：

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

### 策略继承层次

策略支持 `default` 和 `override` 两种模式，其优先级如下：

![策略优先级](https://assets.jimmysong.io/images/book/kubernetes-handbook/service-discovery/gateway/policy-attachment-level.svg)
{width=698 height=345}

**优先级规则**：

- **Override 值**：上层覆盖下层
- **Default 值**：下层覆盖上层

### 常见策略类型

**超时策略**

```yaml
apiVersion: networking.example.com/v1alpha1
kind: TimeoutPolicy
metadata:
  name: api-timeout
spec:
  default:
    request: 30s
    backend: 10s
  targetRef:
    group: gateway.networking.k8s.io
    kind: HTTPRoute
    name: api-route
```

**重试策略**

```yaml
apiVersion: networking.example.com/v1alpha1
kind: RetryPolicy
metadata:
  name: api-retry
spec:
  default:
    maxRetries: 3
    backoffPolicy: exponential
    retryOn: ["5xx", "gateway-error"]
  targetRef:
    group: gateway.networking.k8s.io
    kind: HTTPRoute
    name: api-route
```

## TLS 配置

### 概念说明

在 Gateway API 中，TLS 配置涉及两个方向：

- **下游**：客户端到网关的连接
- **上游**：网关到后端服务的连接

在 Gateway API 的 TLS 配置中：

- **下游 TLS**：指从客户端到网关的连接，网关作为 TLS 服务器，负责处理客户端的 TLS 握手和证书验证
- **上游 TLS**：指从网关到后端服务的连接，网关作为 TLS 客户端，与后端服务建立加密连接

这种双向的 TLS 配置使得可以实现端到端的加密通信，确保数据在传输过程中的安全性。

### 下游 TLS 配置

**基本 HTTPS 配置**

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: https-gateway
spec:
  gatewayClassName: standard
  listeners:
  - name: https
    port: 443
    protocol: HTTPS
    hostname: api.example.com
    tls:
      mode: Terminate
      certificateRefs:
      - kind: Secret
        name: api-tls-cert
```

**通配符证书配置**

```yaml
listeners:
- name: wildcard-https
  port: 443
  protocol: HTTPS
  hostname: "*.example.com"
  tls:
    mode: Terminate
    certificateRefs:
    - kind: Secret
      name: wildcard-cert
- name: specific-https
  port: 443
  protocol: HTTPS
  hostname: api.example.com
  tls:
    mode: Terminate
    certificateRefs:
    - kind: Secret
      name: api-specific-cert
```

**跨命名空间证书引用**

```yaml
# Gateway 配置
listeners:
- name: https
  port: 443
  protocol: HTTPS
  tls:
    certificateRefs:
    - kind: Secret
      name: shared-cert
      namespace: cert-manager
---
# ReferenceGrant 配置
apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
  name: allow-cert-access
  namespace: cert-manager
spec:
  from:
  - group: gateway.networking.k8s.io
    kind: Gateway
    namespace: gateway-system
  to:
  - group: ""
    kind: Secret
    name: shared-cert
```

### TLS 模式对比

| 监听器协议 | TLS 模式 | 支持的路由类型 | 使用场景                    |
|:----------|:---------|:--------------|:---------------------------|
| HTTPS     | Terminate| HTTPRoute     | 标准 Web 应用               |
| TLS       | Terminate| TCPRoute      | 需要 TLS 终止的 TCP 应用    |
| TLS       | Passthrough| TLSRoute    | 端到端 TLS 加密             |

## 流量管理

### 请求流程

典型的请求处理流程：

1. **DNS 解析**：客户端解析域名到 Gateway 地址
2. **监听器匹配**：Gateway 根据 Host header 匹配监听器
3. **路由匹配**：根据路径、Header 等条件匹配 Route 规则
4. **过滤器处理**：应用请求/响应过滤器
5. **后端转发**：将请求转发到匹配的后端服务

![Gateway API 流程图](https://assets.jimmysong.io/images/book/kubernetes-handbook/service-discovery/gateway/gateway-api-request-flow.webp)
{width=2050 height=926}

### 高级流量管理

**流量分割**

```yaml
rules:
- matches:
  - path:
      type: PathPrefix
      value: /api/
  backendRefs:
  - name: api-v1
    port: 8080
    weight: 80
  - name: api-v2
    port: 8080
    weight: 20
```

**请求过滤**

```yaml
rules:
- matches:
  - path:
      type: PathPrefix
      value: /api/
  filters:
  - type: RequestHeaderModifier
    requestHeaderModifier:
      add:
      - name: X-Service-Version
        value: v2
      remove:
      - X-Internal-Header
  - type: URLRewrite
    urlRewrite:
      path:
        type: ReplacePrefixMatch
        replacePrefixMatch: /v2/api/
  backendRefs:
  - name: api-service
    port: 8080
```

**请求重定向**

```yaml
rules:
- matches:
  - path:
      type: PathPrefix
      value: /old-api/
  filters:
  - type: RequestRedirect
    requestRedirect:
      scheme: https
      hostname: new-api.example.com
      path:
        type: ReplacePrefixMatch
        replacePrefixMatch: /api/
      statusCode: 301
```

## 扩展机制

### 自定义后端

Gateway API 支持引用非标准的后端资源：

```yaml
backendRefs:
- group: networking.example.com
  kind: S3Bucket
  name: static-assets
- group: networking.example.com  
  kind: LambdaFunction
  name: api-handler
```

### 自定义过滤器

实现可以提供自定义的 HTTP 过滤器：

```yaml
filters:
- type: ExtensionRef
  extensionRef:
    group: networking.example.com
    kind: AuthFilter
    name: oauth2-filter
```

### 自定义路由类型

对于 Gateway API 不支持的协议，可以创建自定义路由类型：

```yaml
apiVersion: networking.example.com/v1alpha1
kind: WebSocketRoute
metadata:
  name: chat-route
spec:
  parentRefs:
  - name: production-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /chat/
    backendRefs:
    - name: chat-service
      port: 8080
```

## 最佳实践

### 生产环境部署

**网关分层部署**

```yaml
# 边缘网关 - 处理外部流量
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: edge-gateway
  namespace: gateway-system
spec:
  gatewayClassName: edge-class
  listeners:
  - name: https
    port: 443
    protocol: HTTPS
    allowedRoutes:
      namespaces:
        from: All
---
# 内部网关 - 处理内部服务通信  
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: internal-gateway
  namespace: gateway-system
spec:
  gatewayClassName: internal-class
  listeners:
  - name: http
    port: 80
    protocol: HTTP
    allowedRoutes:
      namespaces:
        from: Selector
        selector:
          matchLabels:
            network-policy: internal
```

**安全配置**

```yaml
# 限制路由访问
listeners:
- name: production
  allowedRoutes:
    namespaces:
      from: Selector
      selector:
        matchLabels:
          environment: production
          security-level: high
    kinds:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
```

**可观测性配置**

```yaml
# 通过注解启用监控
metadata:
  annotations:
    gateway.networking.k8s.io/enable-metrics: "true"
    gateway.networking.k8s.io/enable-tracing: "true"
    gateway.networking.k8s.io/log-level: "info"
```

### 迁移策略

**从 Ingress 迁移**

1. **并行部署**：同时运行 Ingress 和 Gateway API
2. **逐步迁移**：按服务逐步迁移到 Gateway API
3. **验证测试**：确保功能一致性
4. **切换流量**：完成迁移后切换流量
5. **清理资源**：移除旧的 Ingress 资源

**配置转换示例**

```yaml
# 原 Ingress 配置
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 8080
---
# 对应的 Gateway API 配置
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api-route
spec:
  parentRefs:
  - name: production-gateway
  hostnames:
  - api.example.com
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: api-service
      port: 8080
```

## 总结

Gateway API 作为 Kubernetes 网络的下一代标准，提供了比 Ingress 更强大、更灵活的流量管理能力。通过其面向角色的设计、丰富的路由类型和强大的扩展机制，Gateway API 能够满足从简单 Web 应用到复杂微服务架构的各种网络需求。

随着越来越多的实现支持和社区采用，Gateway API 正在成为 Kubernetes 集群网络入口的标准选择。对于新项目，建议直接采用 Gateway API；对于现有项目，可以考虑逐步从 Ingress 迁移到 Gateway API，以获得更好的功能和扩展性。

## 参考资料

- [Gateway API 官方文档](https://gateway-api.sigs.k8s.io/)
- [Gateway API GitHub 仓库](https://github.com/kubernetes-sigs/gateway-api)
- [Gateway API 实现列表](https://gateway-api.sigs.k8s.io/implementations/)
- [Kubernetes Gateway API 博客](https://kubernetes.io/blog/2023/10/31/gateway-api-ga/)
