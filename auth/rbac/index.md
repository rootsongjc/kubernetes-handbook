---
weight: 45
title: 基于角色的访问控制（RBAC）
linktitle: RBAC
date: '2022-05-21T00:00:00+08:00'
type: book
description: 深入了解 Kubernetes RBAC（基于角色的访问控制）授权机制，包括 Role、ClusterRole、RoleBinding 和 ClusterRoleBinding 的概念与使用，以及默认角色、权限管理和最佳实践。
keywords:
- api
- clusterrole
- controller
- system
- 命名
- 授予
- 权限
- 用户
- 绑定
- 角色
- RBAC
- 授权
- 访问控制
---

基于角色的访问控制（Role-Based Access Control，简称 RBAC）是 Kubernetes 中的一种授权机制，使用 `rbac.authorization.k8s.io` API Group 实现授权决策。RBAC 允许管理员通过 Kubernetes API 动态配置访问策略，为集群安全提供细粒度的权限控制。

要启用 RBAC，需要在启动 API Server 时使用 `--authorization-mode=RBAC` 参数。

## RBAC API 概述

RBAC API 定义了四种核心资源类型，它们可以像其他 Kubernetes 资源一样通过 `kubectl` 或 API 调用进行管理。

### Role 与 ClusterRole

**Role** 和 **ClusterRole** 用于定义权限集合。权限采用累加形式（不支持"拒绝"规则）。

#### Role

`Role` 对象定义了命名空间范围内的权限规则。以下示例展示了一个允许读取 `default` 命名空间中 Pod 的 Role：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""] # 空字符串表示使用 core API group
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
```

#### ClusterRole

`ClusterRole` 对象定义集群范围的权限，可以授予以下资源的访问权限：

- 集群范围资源（如 Node）
- 非资源端点（如 `/healthz`）
- 跨所有命名空间的资源（如查看所有命名空间的 Pod）

以下示例展示了一个允许读取 Secret 的 ClusterRole：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: secret-reader
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "watch", "list"]
```

### RoleBinding 与 ClusterRoleBinding

**RoleBinding** 和 **ClusterRoleBinding** 用于将角色绑定到用户、用户组或服务账户。

#### RoleBinding

`RoleBinding` 在命名空间范围内授予权限。以下示例将 `pod-reader` 角色授予用户 `jane`：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: default
subjects:
- kind: User
  name: jane
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

`RoleBinding` 也可以引用 `ClusterRole`，但权限仅限于 RoleBinding 所在的命名空间：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-secrets
  namespace: development
subjects:
- kind: User
  name: dave
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: secret-reader
  apiGroup: rbac.authorization.k8s.io
```

#### ClusterRoleBinding

`ClusterRoleBinding` 在集群范围内授予权限。以下示例允许 `manager` 用户组读取集群中所有 Secret：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: read-secrets-global
subjects:
- kind: Group
  name: manager
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: secret-reader
  apiGroup: rbac.authorization.k8s.io
```

## 资源引用详解

### 子资源访问

RBAC 支持对子资源的权限控制。例如，访问 Pod 日志需要使用斜线分隔主资源和子资源：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: pod-and-pod-logs-reader
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list"]
```

### 资源名称限制

通过 `resourceNames` 字段可以限制对特定资源实例的访问：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: configmap-updater
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  resourceNames: ["my-configmap"]
  verbs: ["update", "get"]
```

> **注意**：当指定 `resourceNames` 时，不能使用 `list`、`watch`、`create` 或 `deletecollection` 动词。

### 权限规则示例

以下是一些常见的权限规则示例：

**读取 Pod 权限：**

```yaml
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
```

**管理 Deployment 权限：**

```yaml
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
```

**访问非资源端点：**

```yaml
rules:
- nonResourceURLs: ["/healthz", "/healthz/*"]
  verbs: ["get", "post"]
```

## 主体（Subject）类型

RBAC 支持三种主体类型：

### 用户（User）

```yaml
subjects:
- kind: User
  name: "alice@example.com"
  apiGroup: rbac.authorization.k8s.io
```

### 用户组（Group）

```yaml
subjects:
- kind: Group
  name: "frontend-admins"
  apiGroup: rbac.authorization.k8s.io
```

### 服务账户（ServiceAccount）

```yaml
subjects:
- kind: ServiceAccount
  name: default
  namespace: kube-system
```

### 特殊组

Kubernetes 定义了一些特殊的系统组：

- `system:serviceaccounts:qa` - qa 命名空间中的所有服务账户
- `system:serviceaccounts` - 集群中的所有服务账户
- `system:authenticated` - 所有已认证用户
- `system:unauthenticated` - 所有未认证用户

## 默认角色和角色绑定

Kubernetes 预定义了一系列默认角色，这些角色名称以 `system:` 前缀标识系统组件所有。

### 用户角色

| 角色 | 绑定 | 描述 |
|------|------|------|
| `cluster-admin` | `system:masters` 组 | 超级用户权限，可完全控制集群 |
| `admin` | 无 | 命名空间管理员权限，可创建角色和角色绑定 |
| `edit` | 无 | 允许读写大多数资源，但不能查看或修改角色 |
| `view` | 无 | 只读权限，不能查看角色或 Secret |

### 系统组件角色

| 角色 | 用途 |
|------|------|
| `system:kube-scheduler` | 调度器组件权限 |
| `system:kube-controller-manager` | 控制器管理器权限 |
| `system:node` | kubelet 组件权限 |
| `system:kube-proxy` | kube-proxy 组件权限 |

### 自动更新机制

API Server 在启动时会自动更新默认角色的权限和绑定关系。要禁用自动更新，可将角色的 `rbac.authorization.kubernetes.io/autoupdate` 注解设置为 `false`。

## 权限升级防护

RBAC API 实施权限升级防护策略：

1. **角色创建限制**：用户只能创建包含其已有权限的角色
2. **角色绑定限制**：用户只能绑定其有权限操作的角色，或拥有显式的 `bind` 权限

以下示例展示了如何授予用户绑定特定角色的权限：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: role-grantor
rules:
- apiGroups: ["rbac.authorization.k8s.io"]
  resources: ["rolebindings"]
  verbs: ["create"]
- apiGroups: ["rbac.authorization.k8s.io"]
  resources: ["clusterroles"]
  verbs: ["bind"]
  resourceNames: ["admin","edit","view"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: role-grantor-binding
  namespace: user-1-namespace
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: role-grantor
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: User
  name: user-1
```

## 命令行操作

### 创建 RoleBinding

```bash
# 在命名空间中授予 ClusterRole
kubectl create rolebinding bob-admin-binding \
  --clusterrole=admin \
  --user=bob \
  --namespace=acme

# 为服务账户授予权限
kubectl create rolebinding myapp-view-binding \
  --clusterrole=view \
  --serviceaccount=acme:myapp \
  --namespace=acme
```

### 创建 ClusterRoleBinding

```bash
# 在集群范围内授予权限
kubectl create clusterrolebinding root-cluster-admin-binding \
  --clusterrole=cluster-admin \
  --user=root

# 为跨命名空间的服务账户授予权限
kubectl create clusterrolebinding myapp-view-binding \
  --clusterrole=view \
  --serviceaccount=acme:myapp
```

## 服务账户权限管理

默认情况下，RBAC 策略不会为 `kube-system` 命名空间外的服务账户授予任何权限。以下是几种授权策略，按安全性从高到低排序：

### 1. 特定应用授权（推荐）

为特定应用的服务账户授予最小必要权限：

```bash
kubectl create rolebinding my-sa-view \
  --clusterrole=view \
  --serviceaccount=my-namespace:my-sa \
  --namespace=my-namespace
```

### 2. 默认服务账户授权

为命名空间的默认服务账户授予权限：

```bash
kubectl create rolebinding default-view \
  --clusterrole=view \
  --serviceaccount=my-namespace:default \
  --namespace=my-namespace
```

### 3. 命名空间级别授权

为命名空间中所有服务账户授予相同权限：

```bash
kubectl create rolebinding serviceaccounts-view \
  --clusterrole=view \
  --group=system:serviceaccounts:my-namespace \
  --namespace=my-namespace
```

### 4. 集群级别授权（不推荐）

为所有服务账户授予集群范围权限：

```bash
kubectl create clusterrolebinding serviceaccounts-view \
  --clusterrole=view \
  --group=system:serviceaccounts
```

## 最佳实践

1. **最小权限原则**：只授予完成任务所需的最小权限
2. **定期审核**：定期检查和清理不必要的权限绑定
3. **使用命名空间**：合理使用命名空间进行权限隔离
4. **避免通配符**：尽量避免使用 `*` 通配符授权
5. **监控权限使用**：启用审计日志监控权限使用情况

## 故障排除

### 查看权限

```bash
# 检查用户权限
kubectl auth can-i get pods --as=jane

# 检查服务账户权限
kubectl auth can-i get secrets --as=system:serviceaccount:default:my-sa
```

### 调试授权问题

启用详细日志查看 RBAC 拒绝信息：

```bash
--v=2  # 在 API Server 日志中显示 RBAC DENY 信息
```

## 版本升级注意事项

从早期版本升级到支持 RBAC 的版本时，可以采用以下策略：

1. **并行授权**：同时运行 RBAC 和旧的授权器
2. **逐步迁移**：逐步将权限从旧的授权方式迁移到 RBAC
3. **权限验证**：充分测试应用在新权限模型下的运行情况

## 参考资料

- [Using RBAC Authorization - Kubernetes Documentation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [Kubernetes API Reference - RBAC](https://kubernetes.io/docs/reference/kubernetes-api/authorization-resources/)
