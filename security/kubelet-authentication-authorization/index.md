---
weight: 85
title: Kubelet 的认证授权
date: 2022-05-21T00:00:00+08:00
description: 详细介绍 Kubelet HTTPS 端点的认证和授权机制，包括匿名访问控制、X.509 证书认证、Bearer Token 认证以及基于 Webhook 的授权配置方法。
lastmod: 2025-10-27T17:08:01.890Z
---

> Kubelet 的认证与授权机制是保障 Kubernetes 节点安全的核心环节，合理配置可有效防止未授权访问和敏感操作风险。

## 概述

Kubelet 作为 Kubernetes 集群中的关键组件，其 HTTPS 端点暴露了访问敏感数据的 API，并允许在节点和容器内执行各种权限级别的操作。为了确保集群安全，必须对这些端点进行适当的认证和授权配置。

本文档详细介绍如何配置 Kubelet 的认证和授权机制，以保护集群的安全性。

## Kubelet 认证配置

Kubelet 支持多种认证方式，合理配置可有效防止未授权访问。

### 匿名访问控制

默认情况下，Kubelet 会将所有未通过其他身份验证方法的请求视为匿名请求，并授予 `system:anonymous` 用户名和 `system:unauthenticated` 组。

如需禁用匿名访问并对未经身份验证的请求返回 `401 Unauthorized` 响应：

```bash
kubelet --anonymous-auth=false
```

### X.509 客户端证书认证

通过 X.509 客户端证书可实现强身份认证。

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

Kubelet 支持 API Bearer Token（包括 Service Account Token）认证。

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

Kubelet 支持多种授权模式，推荐使用 Webhook 授权实现细粒度访问控制。

### 默认授权模式

Kubelet 默认使用 `AlwaysAllow` 授权模式，允许所有经过身份验证的请求（包括匿名请求）。

### Webhook 授权模式

为实现细粒度的访问控制，建议将授权委托给 API Server。

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

Kubelet 授权时会将 HTTP 请求映射为标准的 Kubernetes 资源操作属性。

### HTTP 动词映射

下表展示了 HTTP 动词与 Request 动词的对应关系：

{{< table title="Kubelet HTTP 动词与 Request 动词映射" >}}

| HTTP 动词 | Request 动词 |
|-----------|-------------|
| POST      | create      |
| GET, HEAD | get         |
| PUT       | update      |
| PATCH     | patch       |
| DELETE    | delete      |

{{< /table >}}

### 资源路径映射

不同的 Kubelet API 路径对应不同的资源和子资源：

{{< table title="Kubelet API 路径与资源映射" >}}

| Kubelet API 路径 | 资源  | 子资源  |
|------------------|-------|---------|
| /stats/*         | nodes | stats   |
| /metrics/*       | nodes | metrics |
| /logs/*          | nodes | log     |
| /spec/*          | nodes | spec    |
| 其他所有路径     | nodes | proxy   |

{{< /table >}}

**注意事项：**

- Namespace 和 API 组属性始终为空字符串
- 资源名称始终为 Kubelet 对应的 Node API 对象名称

## 授权权限配置

当使用 Webhook 授权模式时，需要为相关用户授予如下 RBAC 权限：

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

## 最佳实践

为保障 Kubelet 端点安全，建议遵循以下最佳实践：

{{< table title="Kubelet 认证与授权最佳实践" >}}

| 建议类别         | 具体建议                         |
|------------------|----------------------------------|
| 认证配置         | 生产环境禁用匿名访问              |
| 授权模式         | 使用 Webhook 授权实现细粒度控制   |
| 证书管理         | 定期轮换客户端证书                |
| 日志监控         | 监控访问日志，及时发现异常行为     |
| 权限分配         | 遵循最小权限原则，仅授予必要权限   |

{{< /table >}}

## 总结

通过合理配置 Kubelet 的认证和授权机制，可以有效保护 Kubernetes 集群的安全性，防止未经授权的访问和操作。建议结合实际业务需求，采用多重防护措施，持续优化节点安全策略。

## 参考文献

- [Kubelet authentication/authorization - kubernetes.io](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet-authentication-authorization/)
- [Kubernetes RBAC - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
