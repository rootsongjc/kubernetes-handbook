---
weight: 85
title: Kubelet 的认证授权
date: '2022-05-21T00:00:00+08:00'
type: book
description: 详细介绍 Kubelet HTTPS 端点的认证和授权机制，包括匿名访问控制、X.509 证书认证、Bearer Token 认证以及基于 Webhook 的授权配置方法。
keywords:
- api
- client
- https
- kubelet
- nodes
- server
- token
- verb
- 请求
- 身份验证
---

Kubelet 作为 Kubernetes 集群中的关键组件，其 HTTPS 端点暴露了访问敏感数据的 API，并允许在节点和容器内执行各种权限级别的操作。为了确保集群安全，必须对这些端点进行适当的认证和授权配置。

本文档详细介绍如何配置 Kubelet 的认证和授权机制，以保护集群的安全性。

## Kubelet 认证配置

### 匿名访问控制

默认情况下，Kubelet 会将所有未通过其他身份验证方法的请求视为匿名请求，并授予 `system:anonymous` 用户名和 `system:unauthenticated` 组。

**禁用匿名访问：**

如需禁用匿名访问并对未经身份验证的请求返回 `401 Unauthorized` 响应：

```bash
kubelet --anonymous-auth=false
```

### X.509 客户端证书认证

启用基于 X.509 客户端证书的身份验证：

**Kubelet 配置：**

```bash
kubelet --client-ca-file=/path/to/ca-bundle.crt
```

**API Server 配置：**

```bash
kube-apiserver --kubelet-client-certificate=/path/to/client.crt \
               --kubelet-client-key=/path/to/client.key
```

### Bearer Token 认证

启用 API Bearer Token（包括 Service Account Token）认证：

**前置条件：**

- 确保 API Server 中启用了 `authentication.k8s.io/v1` API 组

**Kubelet 配置：**

```bash
kubelet --authentication-token-webhook \
        --kubeconfig=/path/to/kubeconfig \
        --require-kubeconfig
```

配置完成后，Kubelet 会通过调用 API Server 的 `TokenReview` API 来验证 Bearer Token 并获取用户信息。

## Kubelet 授权配置

### 默认授权模式

Kubelet 默认使用 `AlwaysAllow` 授权模式，允许所有经过身份验证的请求（包括匿名请求）。

### Webhook 授权模式

为了实现细粒度的访问控制，建议将授权委托给 API Server：

**前置条件：**

- 确保 API Server 中启用了 `authorization.k8s.io/v1` API 组

**Kubelet 配置：**

```bash
kubelet --authorization-mode=Webhook \
        --kubeconfig=/path/to/kubeconfig \
        --require-kubeconfig
```

配置完成后，Kubelet 会通过调用 API Server 的 `SubjectAccessReview` API 来确定每个请求的授权状态。

## 请求属性映射

### HTTP 动词映射

Kubelet 使用与 API Server 相同的请求属性方法进行授权，HTTP 动词映射如下：

| HTTP 动词 | Request 动词 |
|-----------|-------------|
| POST      | create      |
| GET, HEAD | get         |
| PUT       | update      |
| PATCH     | patch       |
| DELETE    | delete      |

### 资源路径映射

不同的 Kubelet API 路径对应不同的资源和子资源：

| Kubelet API 路径 | 资源  | 子资源  |
|------------------|-------|---------|
| /stats/*         | nodes | stats   |
| /metrics/*       | nodes | metrics |
| /logs/*          | nodes | log     |
| /spec/*          | nodes | spec    |
| 其他所有路径     | nodes | proxy   |

**注意事项：**

- Namespace 和 API 组属性始终为空字符串
- 资源名称始终为 Kubelet 对应的 Node API 对象名称

## 授权权限配置

当使用 Webhook 授权模式时，需要确保为 API Server 配置适当的客户端证书，并为相关用户授予以下权限：

```yaml
# 必需的 RBAC 权限
- verb: "*"
  resource: "nodes"
  subresource: "proxy"
- verb: "*"
  resource: "nodes"
  subresource: "stats"
- verb: "*"
  resource: "nodes"
  subresource: "log"
- verb: "*"
  resource: "nodes"
  subresource: "spec"
- verb: "*"
  resource: "nodes"
  subresource: "metrics"
```

## 最佳实践建议

1. **生产环境中禁用匿名访问**：设置 `--anonymous-auth=false`
2. **使用 Webhook 授权模式**：实现细粒度的访问控制
3. **定期轮换证书**：确保客户端证书的安全性
4. **监控访问日志**：及时发现异常访问行为
5. **最小权限原则**：仅授予必要的权限

通过合理配置 Kubelet 的认证和授权机制，可以有效保护 Kubernetes 集群的安全性，防止未经授权的访问和操作。
