---
weight: 88
title: 使用 kubeconfig 或 token 进行用户身份认证
linktitle: kubeconfig 和 token 认证
date: '2022-05-21T00:00:00+08:00'
type: book
description: 详细介绍在 Kubernetes 集群中使用 kubeconfig 文件和 Service Account token 两种方式进行用户身份认证的方法，包括证书配置、token 生成和权限管理。
keywords:
- admin
- base64
- brand
- kubeconfig
- namespace
- token
- 创建
- 权限
- 用户
- 认证
---

在启用了 TLS 的 Kubernetes 集群中，身份认证是与集群交互的重要环节。使用 kubeconfig（基于证书）和 Service Account token 是最常用和通用的两种认证方式，广泛应用于 Kubernetes Dashboard 登录、kubectl 操作等场景。

本文将通过实际示例详细介绍这两种认证方式：

- 为特定命名空间用户创建 kubeconfig 文件
- 为集群管理员和普通用户生成 Service Account token

## 使用 kubeconfig 文件认证

### kubeconfig 文件生成

关于如何生成 kubeconfig 文件，请参考[创建用户认证授权的 kubeconfig 文件](../../security/kubectl-user-authentication-authorization)。

### Dashboard 认证的特殊要求

对于 Kubernetes Dashboard 的登录认证，kubeconfig 文件需要特殊处理。以 brand 命名空间下的 brand 用户为例，生成的 `brand.kubeconfig` 文件需要手动添加 `token` 字段：

![kubeconfig 文件](https://assets.jimmysong.io/images/book/kubernetes-handbook/security/auth-with-kubeconfig-or-token/brand-kubeconfig-yaml.webp)
{width=1798 height=1168}

**重要提示**：
- Dashboard 使用的 kubeconfig 文件**必须**包含 `token` 字段，否则认证失败
- kubectl 命令行工具使用的 kubeconfig 文件**不需要**包含 `token` 字段

## Service Account Token 认证

### 创建集群管理员 Token

为了创建具有集群最高权限的管理员 token，需要创建 ServiceAccount 并绑定 cluster-admin 角色。

创建以下 YAML 文件（admin-role.yaml）：

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

#### 方法一：使用 kubectl describe（推荐）

以下是具体的使用方法：

```bash
# 获取 ServiceAccount 的 Secret
kubectl -n kube-system get secret $(kubectl -n kube-system get sa admin-user -o jsonpath='{.secrets[0].name}') -o jsonpath='{.data.token}' | base64 -d
```

#### 方法二：创建临时 Token（Kubernetes 1.24+）

从 Kubernetes 1.24 开始，ServiceAccount 不再自动创建长期 token。推荐使用以下命令创建临时 token：

```bash
kubectl -n kube-system create token admin-user
```

#### 方法三：手动创建 Secret（长期 token）

以下是相关的定义示例：

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

然后获取 token：

```bash
kubectl -n kube-system get secret admin-user-secret -o jsonpath='{.data.token}' | base64 -d
```

### 为特定命名空间创建用户 Token

为指定命名空间的用户分配该命名空间的管理权限：

```bash
# 设置变量
NAMESPACE="your-namespace"
ROLEBINDING_NAME="namespace-admin"

# 创建 RoleBinding
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

### Base64 编码问题

Kubernetes Secret 中存储的 token 是经过 base64 编码的，**必须进行解码**才能使用：

- **Linux**: `echo "encoded-token" | base64 -d`
- **macOS**: `echo "encoded-token" | base64 -D`
- **在线工具**: [base64decode.org](https://www.base64decode.org/)

### 权限控制

- `cluster-admin`: 集群最高权限
- `admin`: 命名空间管理权限
- 更细粒度的权限控制请参考 [RBAC——基于角色的访问控制](../../auth/rbac)

### 安全最佳实践

1. **最小权限原则**：仅授予必要的最小权限
2. **定期轮换**：定期更新和轮换 token
3. **临时 token**：优先使用临时 token（有效期限制）
4. **安全存储**：妥善保管 kubeconfig 文件和 token

## 参考资料

- [JSONPath 手册](https://kubernetes.io/docs/reference/kubectl/jsonpath/) - kubernetes.io
- [Kubernetes 中的认证](https://kubernetes.io/docs/reference/access-authn-authz/authentication/) - kubernetes.io
- [Service Account Token](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/) - kubernetes.io
