---
weight: 44
title: ServiceAccount
date: '2022-05-21T00:00:00+08:00'
type: book
description: 详细介绍 Kubernetes 中的 ServiceAccount 概念，包括其作用、配置方法和最佳实践，帮助理解 Pod 身份认证机制。
summary: ServiceAccount 为 Pod 中的进程提供身份信息。
keywords:
  - api
  - default
  - namespace
  - pod
  - serviceaccount
  - spec
  - token
  - 创建
  - 设置
  - 集群
lastmod: '2025-08-20'
---

ServiceAccount 为 Pod 中的进程提供身份信息，是 Kubernetes 集群中实现 Pod 身份认证的重要机制。

{{< callout note 注意 >}}
本文档描述的关于 ServiceAccount 的行为只有当你按照 Kubernetes 项目建议的方式搭建集群的情况下才有效。集群管理员可能在你的集群中进行了自定义配置，这种情况下该文档可能并不适用。
{{< /callout >}}

## ServiceAccount 基本概念

当你（真人用户）访问集群（例如使用 `kubectl` 命令）时，API 服务器会将你认证为一个特定的 User Account（目前通常是 `admin`，除非你的系统管理员自定义了集群配置）。Pod 容器中的进程也可以与 API 服务器联系。当它们在联系 API 服务器的时候，它们会被认证为一个特定的 ServiceAccount（例如 `default`）。

每个 namespace 都有一个默认的 ServiceAccount，名为 `default`。当 Pod 需要访问 Kubernetes API 时，它会使用 ServiceAccount 的凭证进行身份验证。

## 使用默认的 ServiceAccount

### 自动分配机制

当你创建 Pod 时，如果没有指定 ServiceAccount，系统会自动在与该 Pod 相同的 namespace 下为其指派一个 `default` ServiceAccount。

你可以通过以下命令查看 Pod 的 ServiceAccount 配置：

```bash
kubectl get pod <pod-name> -o yaml
```

在输出中，你会看到 `spec.serviceAccountName` 字段已经被设置为 `default`。

### 访问 API 权限

ServiceAccount 是否能够访问 API 取决于你使用的 RBAC（基于角色的访问控制）配置。Pod 中的应用程序可以使用自动挂载的 ServiceAccount 凭证来访问 Kubernetes API。

### 禁用自动挂载

从 Kubernetes v1.6 开始，你可以选择禁用 ServiceAccount 凭证的自动挂载。

在 ServiceAccount 级别禁用：

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: build-robot
  namespace: default
automountServiceAccountToken: false
```

在 Pod 级别禁用：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  serviceAccountName: build-robot
  automountServiceAccountToken: false
  # ... 其他配置
```

{{< callout note 优先级 >}}
如果在 Pod 和 ServiceAccount 中同时设置了 `automountServiceAccountToken`，Pod 设置中的优先级更高。
{{< /callout >}}

## 创建和管理 ServiceAccount

### 查看现有 ServiceAccount

列出当前 namespace 中的所有 ServiceAccount：

```bash
kubectl get serviceaccounts
```

输出示例：

```
NAME      SECRETS    AGE
default   0          1d
```

### 创建自定义 ServiceAccount

创建一个新的 ServiceAccount：

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: build-robot
  namespace: default
```

使用 kubectl 创建：

```bash
kubectl create -f serviceaccount.yaml
```

或者直接使用命令创建：

```bash
kubectl create serviceaccount build-robot
```

### 查看 ServiceAccount 详情

以下是相关的代码示例：

```bash
kubectl get serviceaccounts/build-robot -o yaml
```

### 在 Pod 中使用自定义 ServiceAccount

在 Pod 规范中指定 ServiceAccount：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  serviceAccountName: build-robot
  containers:
  - name: my-container
    image: nginx
```

{{< callout warning 重要提醒 >}}

- ServiceAccount 必须在 Pod 创建之前存在，否则创建将被拒绝
- 你不能更新已创建的 Pod 的 ServiceAccount
{{< /callout >}}

## Token 管理

### 现代 Token 机制

从 Kubernetes v1.24 开始，默认启用了 BoundServiceAccountTokenVolume 功能：

- Token 会定期自动轮换
- Token 存储在只读的投影卷中
- Token 具有时间限制和受众限制，提高了安全性

### 手动创建长期 Token（不推荐）

如果确实需要长期有效的 Token，可以手动创建 Secret：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: build-robot-secret
  annotations:
    kubernetes.io/service-account.name: build-robot
type: kubernetes.io/service-account-token
```

创建后查看 Token：

```bash
kubectl describe secret build-robot-secret
```

{{< callout warning 安全建议 >}}
手动创建的长期 Token 存在安全风险，建议使用 TokenRequest API 或短期 Token。
{{< /callout >}}

## 配置镜像拉取密钥

### 创建镜像拉取密钥

首先创建包含镜像仓库凭证的 Secret：

```bash
kubectl create secret docker-registry myregistrykey \
  --docker-server=<your-registry-server> \
  --docker-username=<your-name> \
  --docker-password=<your-password> \
  --docker-email=<your-email>
```

### 添加到 ServiceAccount

方法一：使用 patch 命令

```bash
kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "myregistrykey"}]}'
```

方法二：编辑 ServiceAccount YAML

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: default
  namespace: default
secrets:
- name: default-token-xxxxx
imagePullSecrets:
- name: myregistrykey
```

配置完成后，该 namespace 中新创建的所有 Pod 都会自动包含镜像拉取密钥。

## 最佳实践

### 安全建议

1. **最小权限原则**：为每个应用创建专用的 ServiceAccount，只授予必要的权限
2. **避免使用 default ServiceAccount**：为生产环境的应用创建专用 ServiceAccount
3. **定期轮换凭证**：利用自动 Token 轮换功能，避免使用长期 Token

### 管理建议

1. **命名规范**：使用描述性的 ServiceAccount 名称，如 `webapp-reader`、`backup-writer`
2. **权限分离**：不同功能的 Pod 使用不同的 ServiceAccount
3. **监控和审计**：定期检查 ServiceAccount 的权限和使用情况

### 清理资源

删除不再需要的 ServiceAccount：

```bash
kubectl delete serviceaccount build-robot
```

## 参考资料

- [Configure Service Accounts for Pods - Kubernetes 官方文档](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)
- [Managing Service Accounts - Kubernetes 官方文档](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)
