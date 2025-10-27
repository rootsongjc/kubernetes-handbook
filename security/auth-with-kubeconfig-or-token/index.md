---
weight: 88
title: 使用 kubeconfig 或 token 进行用户身份认证
linktitle: kubeconfig 和 token 认证
date: 2022-05-21T00:00:00+08:00
type: book
description: 详细介绍在 Kubernetes 集群中使用 kubeconfig 文件和 Service Account token 两种方式进行用户身份认证的方法，包括证书配置、token 生成和权限管理。
lastmod: 2025-10-27T17:12:44.194Z
---

> kubeconfig 文件和 Service Account token 是 Kubernetes 集群中最常用的两种身份认证方式，合理配置可兼顾安全性与易用性，适用于多种管理和访问场景。

## 概述

在启用了 TLS 的 Kubernetes 集群中，身份认证是与集群交互的重要环节。使用 kubeconfig（基于证书）和 Service Account token 是最常用和通用的两种认证方式，广泛应用于 Kubernetes Dashboard 登录、kubectl 操作等场景。

本文将通过实际示例详细介绍这两种认证方式：

- 为特定命名空间用户创建 kubeconfig 文件
- 为集群管理员和普通用户生成 Service Account token

## 使用 kubeconfig 文件认证

kubeconfig 文件是 Kubernetes 客户端（如 kubectl）与集群安全通信的核心配置文件，支持基于证书的身份认证。

### kubeconfig 文件生成

关于如何生成 kubeconfig 文件，请参考 [创建用户认证授权的 kubeconfig 文件](../../security/kubectl-user-authentication-authorization)。

### Dashboard 认证的特殊要求

在 Kubernetes Dashboard 登录场景下，kubeconfig 文件需要特殊处理。以 brand 命名空间下的 brand 用户为例，生成的 `brand.kubeconfig` 文件需手动添加 `token` 字段。

![kubeconfig 文件结构示例](https://assets.jimmysong.io/images/book/kubernetes-handbook/security/auth-with-kubeconfig-or-token/brand-kubeconfig-yaml.webp)
{width=1798 height=1168}

**注意事项**：

- Dashboard 使用的 kubeconfig 文件**必须**包含 `token` 字段，否则认证失败
- kubectl 命令行工具使用的 kubeconfig 文件**不需要**包含 `token` 字段

## Service Account Token 认证

Service Account token 认证适用于自动化脚本、第三方工具和 Dashboard 等场景，便于权限隔离和细粒度控制。

### 创建集群管理员 Token

如需创建具有集群最高权限的管理员 token，需新建 ServiceAccount 并绑定 cluster-admin 角色。

以下为配置示例（admin-role.yaml）：

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kube-system
```

应用配置：

```bash
kubectl apply -f admin-role.yaml
```

### 获取管理员 Token

获取 ServiceAccount token 有多种方式，适配不同 Kubernetes 版本。

#### 方法一：kubectl describe（推荐）

```bash
kubectl -n kube-system get secret $(kubectl -n kube-system get sa admin-user -o jsonpath='{.secrets[0].name}') -o jsonpath='{.data.token}' | base64 -d
```

#### 方法二：创建临时 Token（Kubernetes 1.24+）

Kubernetes 1.24 起，ServiceAccount 不再自动创建长期 token，推荐使用：

```bash
kubectl -n kube-system create token admin-user
```

#### 方法三：手动创建 Secret（长期 token）

如需长期 token，可手动创建 Secret：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: admin-user-secret
  namespace: kube-system
  annotations:
    kubernetes.io/service-account.name: admin-user
type: kubernetes.io/service-account-token
```

获取 token：

```bash
kubectl -n kube-system get secret admin-user-secret -o jsonpath='{.data.token}' | base64 -d
```

### 为特定命名空间创建用户 Token

为指定命名空间的用户分配管理权限：

```bash
NAMESPACE="your-namespace"
ROLEBINDING_NAME="namespace-admin"
kubectl create rolebinding $ROLEBINDING_NAME \
  --clusterrole=admin \
  --serviceaccount=$NAMESPACE:default \
  --namespace=$NAMESPACE
```

获取该命名空间的 token：

```bash
kubectl -n $NAMESPACE get secret $(kubectl -n $NAMESPACE get sa default -o jsonpath='{.secrets[0].name}') -o jsonpath='{.data.token}' | base64 -d
```

## 重要注意事项

在实际使用 kubeconfig 和 token 认证时，需关注以下细节以确保安全与兼容性。

### Base64 编码问题

Kubernetes Secret 中存储的 token 是 base64 编码，**必须解码**后才能使用。

{{< table title="不同操作系统下 base64 解码命令" >}}

| 系统   | 解码命令示例                      |
|--------|-----------------------------------|
| Linux  | `echo "encoded-token" \| base64 -d` |
| macOS  | `echo "encoded-token" \| base64 -D` |
| 在线工具 | [base64decode.org](https://www.base64decode.org/) |

{{< /table >}}

### 权限控制

- `cluster-admin`：集群最高权限
- `admin`：命名空间管理权限
- 更细粒度权限请参考 [RBAC——基于角色的访问控制](../../auth/rbac)

### 安全最佳实践

- **最小权限原则**：仅授予必要的最小权限
- **定期轮换**：定期更新和轮换 token
- **临时 token**：优先使用临时 token（有效期限制）
- **安全存储**：妥善保管 kubeconfig 文件和 token

## 总结

kubeconfig 文件和 Service Account token 是 Kubernetes 集群中最常用的身份认证方式。通过合理配置和权限管理，可满足多样化的访问需求，兼顾安全性与易用性。建议结合实际场景选择合适的认证方式，并遵循最小权限和定期轮换等安全最佳实践。

## 参考文献

- [JSONPath 手册 - kubernetes.io](https://kubernetes.io/docs/reference/kubectl/jsonpath/)
- [Kubernetes 中的认证 - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/authentication/)
- [Service Account Token - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)
