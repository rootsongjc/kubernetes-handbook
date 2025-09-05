---
weight: 41
title: Ingress
date: '2022-05-21T00:00:00+08:00'
type: book
description: >-
  Ingress 是 Kubernetes 中管理集群外部访问服务的资源对象，提供 HTTP 和 HTTPS 路由功能。本文介绍 Ingress
  的工作原理、配置方法、IngressClass 概念以及各种使用场景。
keywords:
  - ingress
  - ingressclass
  - spec
  - tls
  - url
  - 控制器
  - 资源
  - 路由
  - 集群
  - 默认
lastmod: '2025-08-20'
---

{{< callout note "重要提示" >}}
Ingress 在 Kubernetes 1.9 正式发布，目前仍被广泛使用。但对于新项目，建议考虑使用更现代的 [Gateway API](../gateway/) 作为替代方案，它提供更强大和灵活的流量管理能力。
{{< /callout >}}

## 什么是 Ingress？

Ingress 是 Kubernetes 的一个资源对象，用于管理集群外部到集群内服务的 HTTP 和 HTTPS 访问。它充当智能路由器，根据定义的规则将外部流量路由到集群内的不同服务。

### Ingress 架构图

下图展示了 Ingress 的工作原理：

```mermaid "Ingress 运作的架构图"
graph LR;
  client([客户端])-. Ingress-管理的 <br> 负载均衡器 .->ingress[Ingress];
  ingress-->|路由规则|service[Service];
  subgraph 集群
  ingress;
  service-->pod1[Pod];
  service-->pod2[Pod];
  end
```

![Ingress 运作的架构图](e0a8252231167704c4f15deeea858784.svg)
{width=1920 height=551}

## 核心功能

Ingress 提供以下核心功能：

- **外部 URL 访问**：为集群内服务提供外部可访问的 URL
- **负载均衡**：在多个 Pod 实例之间分发流量
- **SSL/TLS 终结**：处理 HTTPS 证书和加密
- **基于名称的虚拟主机**：根据主机名路由到不同服务
- **路径路由**：根据 URL 路径将请求路由到不同服务

## 前置条件

使用 Ingress 需要满足以下条件：

1. **部署 Ingress 控制器**：如 NGINX Ingress Controller、Traefik、HAProxy 等
2. **配置 IngressClass**：定义使用哪个控制器处理 Ingress 资源
3. **准备后端服务**：确保目标 Service 和 Pod 正常运行

{{< callout warning "注意" >}}
仅创建 Ingress 资源本身不会产生任何效果，必须配合 [Ingress 控制器](../../controllers/ingress-controller) 一起使用。
{{< /callout >}}

## 基本配置示例

### 最简单的 Ingress

以下是相关的代码示例：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: simple-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
```

### 路径类型说明

Kubernetes 支持三种路径类型：

- **`Exact`**：精确匹配 URL 路径（区分大小写）
- **`Prefix`**：基于 URL 路径前缀匹配，按 `/` 分隔
- **`ImplementationSpecific`**：匹配方法由 IngressClass 决定

## IngressClass 详解

IngressClass 是 Kubernetes 1.18 引入的资源，用于定义 Ingress 的实现类别。

### 基本 IngressClass 配置

以下是相关的配置示例：

```yaml
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: nginx
spec:
  controller: k8s.io/ingress-nginx
```

### 设置默认 IngressClass

以下是相关的代码示例：

```yaml
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: nginx
  annotations:
    ingressclass.kubernetes.io/is-default-class: "true"
spec:
  controller: k8s.io/ingress-nginx
```

### IngressClass 参数配置

#### 集群范围参数

以下是相关的代码示例：

```yaml
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: external-lb
spec:
  controller: example.com/ingress-controller
  parameters:
    scope: Cluster
    apiGroup: k8s.example.net
    kind: ClusterIngressParameter
    name: external-config
```

#### 命名空间范围参数

以下是相关的代码示例：

```yaml
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: internal-lb
spec:
  controller: example.com/ingress-controller
  parameters:
    scope: Namespace
    apiGroup: k8s.example.com
    kind: IngressParameter
    namespace: ingress-config
    name: internal-config
```

## 常见使用场景

### 单服务暴露

适用于只需要暴露一个服务的简单场景：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: single-service
spec:
  ingressClassName: nginx
  defaultBackend:
    service:
      name: web-service
      port:
        number: 80
```

### 路径扇出

根据 URL 路径将流量路由到不同服务：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: path-fanout
spec:
  ingressClassName: nginx
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /v1
        pathType: Prefix
        backend:
          service:
            name: api-v1-service
            port:
              number: 80
      - path: /v2
        pathType: Prefix
        backend:
          service:
            name: api-v2-service
            port:
              number: 80
```

### 基于主机名的虚拟主机

根据不同主机名路由到不同服务：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: virtual-host
spec:
  ingressClassName: nginx
  rules:
  - host: blog.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: blog-service
            port:
              number: 80
  - host: shop.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: shop-service
            port:
              number: 80
```

## TLS/SSL 配置

### 单域名 TLS

以下是相关的代码示例：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tls-example
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - secure.example.com
    secretName: tls-secret
  rules:
  - host: secure.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: secure-service
            port:
              number: 443
```

### 多域名 TLS

以下是相关的代码示例：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: multi-tls
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.example.com
    - admin.example.com
    secretName: wildcard-tls-secret
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
              number: 80
  - host: admin.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: admin-service
            port:
              number: 80
```

### 创建 TLS Secret

以下是相关的定义示例：

```bash
kubectl create secret tls tls-secret \
  --cert=path/to/tls.cert \
  --key=path/to/tls.key
```

## 高级功能

### 注解配置

不同的 Ingress 控制器支持各种注解来配置高级功能：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: advanced-ingress
  annotations:
    # NGINX 特定注解
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/cors-allow-origin: "*"
spec:
  ingressClassName: nginx
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /api(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
```

### 默认后端

为未匹配任何规则的请求提供默认处理：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: default-backend
spec:
  ingressClassName: nginx
  defaultBackend:
    service:
      name: default-service
      port:
        number: 80
  rules:
  - host: example.com
    http:
      paths:
      - path: /app
        pathType: Prefix
        backend:
          service:
            name: app-service
            port:
              number: 80
```

## 管理和维护

### 更新 Ingress 配置

以下是相关的配置示例：

```bash
# 编辑现有 Ingress
kubectl edit ingress my-ingress

# 应用新配置
kubectl apply -f ingress.yaml

# 查看 Ingress 状态
kubectl get ingress
kubectl describe ingress my-ingress
```

### 故障排查

以下是相关的代码示例：

```bash
# 检查 Ingress 控制器日志
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# 检查 Ingress 事件
kubectl get events --field-selector involvedObject.kind=Ingress

# 验证后端服务
kubectl get svc
kubectl get endpoints
```

## 迁移说明

### 从注解到 IngressClass

在 Kubernetes 1.18 之前使用的 `kubernetes.io/ingress.class` 注解已被废弃：

```yaml
# 旧方式（已废弃）
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx

# 新方式（推荐）
spec:
  ingressClassName: nginx
```

## 替代方案比较

| 方案 | 适用场景 | 优势 | 劣势 |
|------|----------|------|------|
| Ingress | HTTP/HTTPS 流量管理 | 功能丰富，生态成熟 | 仅支持 7 层路由 |
| LoadBalancer Service | 简单负载均衡 | 配置简单 | 成本较高，功能有限 |
| NodePort Service | 开发测试环境 | 无需额外组件 | 端口管理复杂，安全性差 |
| Gateway API | 现代流量管理 | 功能更强大，设计更灵活 | 相对较新，生态待完善 |

## 最佳实践

1. **使用 IngressClass**：明确指定 `ingressClassName` 而不是依赖默认值
2. **TLS 配置**：为生产环境启用 HTTPS 并配置适当的 TLS 证书
3. **资源限制**：通过注解配置适当的速率限制和资源控制
4. **监控告警**：配置 Ingress 控制器的监控和告警
5. **安全配置**：启用适当的安全头和 CORS 策略
6. **版本管理**：使用标签和注解管理 Ingress 资源的版本信息

## 参考资料

- [Ingress - Kubernetes 官方文档](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [Ingress Controllers - Kubernetes 官方文档](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/)
- [Gateway API - Kubernetes SIG Network](https://gateway-api.sigs.k8s.io/)
