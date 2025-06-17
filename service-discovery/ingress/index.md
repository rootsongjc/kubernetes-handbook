---
weight: 41
title: Ingress
date: '2022-05-21T00:00:00+08:00'
type: book
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
---


{{<callout warning "注意">}}
虽然 Ingress 在 Kubernetes 1.9 正式发布，但是目前 Ingress 资源已不再维护，推荐使用 [Gateway API](../gateway/) 代替。
{{</callout>}}

## 什么是 Ingress？

Ingress 提供从集群外部到集群内部服务的 HTTP 和 HTTPS 路由。通过 Ingress 资源定义的规则控制流量路由。

下图展示了 Ingress 是如何运作的。

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
{width=627 height=203}

通过配置，Ingress 可为 Service 提供外部可访问的 URL、对其流量作负载均衡、终止 SSL/TLS，以及基于名称的虚拟托管等能力。 [Ingress 控制器](../../controllers/ingress-controller) 负责完成 Ingress 的工作，具体实现上通常会使用某个负载均衡器，不过也可以配置边缘路由器或其他前端来帮助处理流量。

## Ingress 功能

- 提供外部可访问的 URL
- 流量负载均衡
- SSL/TLS 终止
- 基于名称的虚拟托管

## 环境准备

要使用 Ingress，你必须部署一个 [Ingress 控制器](../../controllers/ingress-controller)。仅创建 Ingress 资源本身没有效果。

## Ingress 资源示例

一个最简单的 Ingress 资源示例：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: example-ingress
spec:
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: example-service
            port:
              number: 80
```

### Ingress 规则

- `host`：可选，指定主机名。
- `paths`：路径列表，每个路径关联一个后端服务。
- `backend`：定义服务和端口。

### 默认后端

未匹配任何规则的请求将被路由到默认后端。

### 路径类型

- `ImplementationSpecific`：由 IngressClass 决定匹配方法。
- `Exact`：精确匹配 URL 路径。
- `Prefix`：基于 URL 路径前缀匹配。

## Ingress 类 {#ingress-class}

Ingress 可以由不同的控制器实现，每个 Ingress 应指定一个类（IngressClass），包含额外配置，如控制器名称。

### IngressClass 参数

`.spec.parameters` 字段可引用其他资源以提供相关配置。参数的具体类型取决于 `.spec.controller` 字段中指定的 Ingress 控制器。

### IngressClass 作用域

IngressClass 参数可以是集群作用域或命名空间作用域。

#### 集群作用域

默认情况下，IngressClass 参数是集群范围的。如果未设置 `.spec.parameters.scope` 或将其设置为 `Cluster`，则 IngressClass 引用集群范围的资源。

```yaml
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: external-lb-1
spec:
  controller: example.com/ingress-controller
  parameters:
    scope: Cluster
    apiGroup: k8s.example.net
    kind: ClusterIngressParameter
    name: external-config-1
```

#### 命名空间作用域

如果 `.spec.parameters.scope` 设置为 `Namespace`，则 IngressClass 引用命名空间范围的资源，并需设置 `.spec.parameters.namespace` 字段。

```yaml
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: external-lb-2
spec:
  controller: example.com/ingress-controller
  parameters:
    scope: Namespace
    apiGroup: k8s.example.com
    kind: IngressParameter
    namespace: external-configuration
    name: external-config
```

### 已废弃的注解 {#deprecated-annotation}

在 Kubernetes 1.18 之前，Ingress 类通过 `kubernetes.io/ingress.class` 注解指定。现在使用 `ingressClassName` 字段替代该注解，引用 IngressClass 资源。

### 默认 Ingress 类 {#default-ingress-class}

可以将一个 IngressClass 标记为集群默认类。设置 `ingressclass.kubernetes.io/is-default-class` 注解为 `true` 确保新的 Ingress 使用默认 IngressClass。

```yaml
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: default-ingress-class
  annotations:
    ingressclass.kubernetes.io/is-default-class: "true"
spec:
  controller: example.com/ingress-controller
```

如果集群中有多个默认 IngressClass，准入控制器会阻止创建新的 Ingress。确保最多只有一个默认 IngressClass。

## Ingress 类型

### 单个服务支持的 Ingress

通过设置无规则的默认后端来暴露单个服务。

### 简单扇出

根据请求的 HTTP URI，将来自同一 IP 地址的流量路由到多个服务。

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fanout-example
spec:
  rules:
  - host: example.com
    http:
      paths:
      - path: /foo
        pathType: Prefix
        backend:
          service:
            name: foo-service
            port:
              number: 80
      - path: /bar
        pathType: Prefix
        backend:
          service:
            name: bar-service
            port:
              number: 80
```

### 基于名称的虚拟主机服务

将针对多个主机名的 HTTP 流量路由到同一 IP 地址上。

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: name-based-example
spec:
  rules:
  - host: foo.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: foo-service
            port:
              number: 80
  - host: bar.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: bar-service
            port:
              number: 80
```

## TLS

你可以通过设定包含 TLS 私钥和证书的 Secret 来保护 Ingress。TLS 配置示例：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tls-example
spec:
  tls:
  - hosts:
    - example.com
    secretName: tls-secret
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: example-service
            port:
              number: 80
```

## 更新 Ingress

要更新 Ingress 以添加新的主机，可以通过 `kubectl edit ingress` 命令编辑资源：

```yaml
spec:
  rules:
  - host: foo.example.com
    http:
      paths:
      - backend:
          service:
            name: foo-service
            port:
              number: 80
        path: /foo
        pathType: Prefix
  - host: bar.example.com
    http:
      paths:
      - backend:
          service:
            name: bar-service
            port:
              number: 80
        path: /bar
        pathType: Prefix
```

## 替代方案

- 使用 `Service.Type=LoadBalancer`
- 使用 `Service.Type=NodePort`

## 参考

- [Ingress - kubernetes.io](https://kubernetes.io/docs/concepts/services-networking/ingress/)
