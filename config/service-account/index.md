---
weight: 75
title: 配置 Pod 的 Service Account
date: '2022-05-21T00:00:00+08:00'
type: book
description: 详细介绍如何在 Kubernetes 中配置和使用 Service Account，包括默认配置、权限管理、创建自定义账户、配置 kubeconfig 以及管理 ImagePullSecret 等核心操作。
keywords:
- account
- api
- namespace
- pod
- service
- token
- 创建
- 集群
---

Service Account 为 Pod 中的进程提供身份信息，是 Kubernetes 中重要的安全机制。

*本文是关于 Service Account 的用户指南，管理指南另见 Service Account 的集群管理指南。*

*注意：本文档描述的关于 Service Account 的行为只有当你按照 Kubernetes 项目建议的方式搭建起集群的情况下才有效。你的集群管理员可能在你的集群中有自定义配置，这种情况下该文档可能并不适用。*

## Service Account 基础概念

当你（真人用户）访问集群（例如使用 `kubectl` 命令）时，apiserver 会将你认证为一个特定的 User Account（目前通常是 `admin`，除非你的系统管理员自定义了集群配置）。Pod 容器中的进程也可以与 apiserver 联系。当它们在联系 apiserver 的时候，它们会被认证为一个特定的 Service Account（例如 `default`）。

## 使用默认的 Service Account 访问 API Server

当你创建 Pod 的时候，如果你没有指定一个 Service Account，系统会自动在与该 Pod 相同的 namespace 下为其指派一个 `default` Service Account。如果你获取刚创建的 Pod 的原始 JSON 或 YAML 信息（例如使用 `kubectl get pods/podname -o yaml` 命令），你将看到 `spec.serviceAccountName` 字段已经被自动设置。

你可以在 Pod 中使用自动挂载的 Service Account 凭证来访问 API，如 Accessing the Cluster 中所描述。

Service Account 是否能够取得访问 API 的许可取决于你使用的授权插件和策略。

### 控制 API 凭证自动挂载

从 Kubernetes v1.6 开始，你可以选择取消为 Service Account 自动挂载 API 凭证，只需在 Service Account 中设置 `automountServiceAccountToken: false`：

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: build-robot
automountServiceAccountToken: false
```

从 Kubernetes v1.6 开始，你也可以选择只取消单个 Pod 的 API 凭证自动挂载：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  serviceAccountName: build-robot
  automountServiceAccountToken: false
```

**重要更新**：从 Kubernetes v1.24 起，BoundServiceAccountTokenVolume 已默认启用，Pod 所使用的 token 会周期性轮换并以只读方式挂载，增强了安全性。

如果在 Pod 和 Service Account 中同时设置了 `automountServiceAccountToken`，Pod 设置中的优先级更高。

## 使用 Service Account 配置 RBAC 权限管理

### 创建 ServiceAccount

```bash
kubectl create serviceaccount sample-sa
```

这时候我们将得到一个在 default namespace 的 ServiceAccount 账号。运行 `kubectl get serviceaccount sample-sa -o yaml` 将得到如下结果：

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  creationTimestamp: 2023-09-03T02:00:37Z
  name: sample-sa
  namespace: default
  resourceVersion: "18914458"
  uid: 26e129dc-af1d-11e8-9453-00163e0efab0
```

**重要变更**：从 Kubernetes v1.24 开始，ServiceAccount 不再自动创建长期有效的 Secret token。如需长期 token，需要手动创建。

### 获取 ServiceAccount Token

**对于 Kubernetes v1.24+**，推荐使用以下方式获取短期 token：

```bash
kubectl create token sample-sa
```

**如需长期 token**，需要手动创建 Secret：

```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: sample-sa-token
  annotations:
    kubernetes.io/service-account.name: sample-sa
type: kubernetes.io/service-account-token
EOF
```

### 创建 ClusterRole

创建一个只可以查看集群 `deployments`、`services`、`pods` 相关资源的角色：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: viewer-role
rules:
- apiGroups: [""]
  resources:
  - pods
  - pods/status
  - pods/log
  - services
  - services/status
  - endpoints
  - endpoints/status
  verbs:
  - get
  - list
  - watch
- apiGroups: ["apps"]
  resources:
  - deployments
  - deployments/status
  verbs:
  - get
  - list
  - watch
```

### 创建 ClusterRoleBinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: sample-role-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: viewer-role
subjects:
- kind: ServiceAccount
  name: sample-sa
  namespace: default
```

### 配置 kubeconfig

经过以上步骤，我们创建的 ServiceAccount 就可以用来访问集群了。可以动态更改 `ClusterRole` 的授权来及时控制某个账号的权限。

配置示例如下：

```yaml
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: <BASE64_ENCODED_CA_CERT>
    server: https://your-k8s-api-server:6443
  name: my-cluster
contexts:
- context:
    cluster: my-cluster
    user: sample-user
  name: sample-context
current-context: sample-context
kind: Config
preferences: {}
users:
- name: sample-user
  user:
    token: <SERVICE_ACCOUNT_TOKEN>
```

## 管理多个 Service Account

### 列出 ServiceAccount

每个 namespace 中都有一个默认的叫做 `default` 的 Service Account 资源。

```bash
kubectl get serviceaccounts
```

输出示例：

```
NAME      SECRETS    AGE
default   0          1d
```

### 创建自定义 ServiceAccount

```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: build-robot
EOF
```

查看完整信息：

```bash
kubectl get serviceaccounts/build-robot -o yaml
```

### 在 Pod 中使用指定的 ServiceAccount

设置非默认的 Service Account，只需要在 Pod 的 `spec.serviceAccountName` 字段中将 name 设置为你想要用的 Service Account 名字即可：

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

**注意事项**：

- 在 Pod 创建之初 Service Account 就必须已经存在，否则创建将被拒绝
- 你不能更新已创建的 Pod 的 Service Account

### 清理 ServiceAccount

```bash
kubectl delete serviceaccount/build-robot
```

## 手动创建 Service Account 的 API Token

对于需要长期有效 token 的场景，可以手动创建 Secret：

```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: build-robot-secret
  annotations: 
    kubernetes.io/service-account.name: build-robot
type: kubernetes.io/service-account-token
EOF
```

验证创建结果：

```bash
kubectl describe secrets/build-robot-secret
```

输出示例：

```
Name:         build-robot-secret
Namespace:    default
Labels:       <none>
Annotations:  kubernetes.io/service-account.name: build-robot
              kubernetes.io/service-account.uid: 870ef2a5-35cf-11e5-8d06-005056b45392

Type:  kubernetes.io/service-account-token

Data
====
ca.crt:     1220 bytes
token:      <token-data>
namespace:  7 bytes
```

## 为 Service Account 添加 ImagePullSecret

### 创建 ImagePullSecret

首先，创建一个 ImagePullSecret：

```bash
kubectl create secret docker-registry myregistrykey \
  --docker-server=<your-registry-server> \
  --docker-username=<your-name> \
  --docker-password=<your-password> \
  --docker-email=<your-email>
```

验证创建：

```bash
kubectl get secrets myregistrykey
```

### 配置 ServiceAccount 使用 ImagePullSecret

**方法一：使用 kubectl patch**

```bash
kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "myregistrykey"}]}'
```

**方法二：编辑 YAML 文件**

```bash
kubectl get serviceaccounts default -o yaml > sa.yaml
```

编辑 `sa.yaml` 文件，添加 `imagePullSecrets` 部分：

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

应用更改：

```bash
kubectl replace serviceaccount default -f sa.yaml
```

### 验证配置

现在，所有当前 namespace 中新创建的 Pod 的 spec 中都会自动增加如下内容：

```yaml
spec:
  imagePullSecrets:
  - name: myregistrykey
```

## 最佳实践

1. **最小权限原则**：为每个应用创建专用的 ServiceAccount，只授予必要的权限
2. **定期轮换 Token**：利用 Kubernetes v1.24+ 的自动 token 轮换特性，避免使用长期 token
3. **命名规范**：使用有意义的 ServiceAccount 名称，便于管理和审计
4. **监控和审计**：定期检查 ServiceAccount 的权限和使用情况
5. **环境隔离**：在不同环境中使用不同的 ServiceAccount 和权限配置
