---
weight: 86
title: TLS Bootstrap
date: 2022-05-21T00:00:00+08:00
description: 介绍如何为 Kubernetes kubelet 配置 TLS 客户端证书自动引导，包括 kube-apiserver、kube-controller-manager 和 kubelet 的详细配置步骤。
lastmod: 2025-10-27T17:04:15.260Z
---

> TLS Bootstrap 为 Kubernetes 节点自动化证书管理提供了安全、高效的解决方案，是大规模集群安全运维的基础能力。

## 概述

本文档详细介绍如何为 kubelet 设置 TLS 客户端证书引导（bootstrap）功能。

TLS Bootstrap 是 Kubernetes 1.4 引入的重要安全特性，它提供了一个从集群级证书颁发机构（CA）自动请求证书的 API。该功能主要为 kubelet 提供 TLS 客户端证书的自动化管理能力，大大简化了大规模集群的证书管理工作。

在实际部署中，TLS Bootstrap 涉及 kube-apiserver、kube-controller-manager 和 kubelet 的多组件协同配置。下面将分步骤详细说明。

## kube-apiserver 配置

在启用 TLS Bootstrap 前，需为 kube-apiserver 配置 Token 认证和客户端证书 CA。

### Token 认证配置

首先需要配置 bootstrap token 文件，该文件包含分配给 kubelet 特定 bootstrap 组的认证令牌。

#### 生成 Bootstrap Token

Token 应具有足够的随机性（至少 128 位熵）。推荐使用以下命令生成：

```bash
head -c 16 /dev/urandom | od -An -t x | tr -d ' '
```

生成的 token 示例：`02b50b05283e98dd0fd71db496ef01e8`

#### Token 文件格式

创建 token 文件，格式如下：

```text
02b50b05283e98dd0fd71db496ef01e8,kubelet-bootstrap,10001,"system:kubelet-bootstrap"
```

文件格式说明：

- 第一列：token 值
- 第二列：用户名
- 第三列：用户 ID
- 第四列：组名（多个组时需要用引号）

#### 启用 Token 认证

在 kube-apiserver 启动参数中添加：

```bash
--token-auth-file=/path/to/token-file
```

### 客户端证书 CA 配置

配置客户端证书认证，指定 CA 证书文件：

```bash
--client-ca-file=/var/lib/kubernetes/ca.pem
```

## kube-controller-manager 配置

kube-controller-manager 负责证书签发和 CSR 审批，需正确配置 CA 证书及相关控制器。

### 证书签名配置

Controller Manager 负责证书的签发，需要配置 CA 证书和私钥：

```bash
--cluster-signing-cert-file="/etc/kubernetes/pki/ca.crt"
--cluster-signing-key-file="/etc/kubernetes/pki/ca.key"
```

### CSR 审批控制器

从 Kubernetes 1.7 开始，内置的 `csrapproving` 控制器默认启用，替代了实验性的"组自动批准"控制器。

控制器将 CSR 分为三种类型：

1. **nodeclient**：节点客户端认证请求（`O=system:nodes`，`CN=system:node:<node-name>`）
2. **selfnodeclient**：节点更新自身客户端证书
3. **selfnodeserver**：节点更新服务端证书（需要启用 feature gate）

#### 启用服务端证书轮转

如需支持 kubelet 服务端证书自动轮转，需在 controller-manager 启动参数中启用相关特性：

```bash
--feature-gates=RotateKubeletServerCertificate=true
```

### RBAC 权限配置

为保证 CSR 能被自动审批，需配置相应的 ClusterRole 和 ClusterRoleBinding。

#### 创建 ClusterRole

以下为审批不同类型 CSR 的 ClusterRole 定义示例：

```yaml
# 审批节点客户端证书请求
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: approve-node-client-csr
rules:
- apiGroups: ["certificates.k8s.io"]
  resources: ["certificatesigningrequests/nodeclient"]
  verbs: ["create"]
---
# 审批节点客户端证书续期
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: approve-node-client-renewal-csr
rules:
- apiGroups: ["certificates.k8s.io"]
  resources: ["certificatesigningrequests/selfnodeclient"]
  verbs: ["create"]
---
# 审批节点服务端证书续期
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: approve-node-server-renewal-csr
rules:
- apiGroups: ["certificates.k8s.io"]
  resources: ["certificatesigningrequests/selfnodeserver"]
  verbs: ["create"]
```

#### 创建 ClusterRoleBinding

为 bootstrap 组和节点组授予自动审批权限：

```yaml
# 为 kubelet-bootstrap 组自动审批 CSR
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: auto-approve-csrs-for-group
subjects:
- kind: Group
  name: system:kubelet-bootstrap
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: approve-node-client-csr
  apiGroup: rbac.authorization.k8s.io
```

```yaml
# 为节点续期授予权限
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: auto-approve-renewals-for-nodes
subjects:
- kind: Group
  name: system:nodes
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: approve-node-client-renewal-csr
  apiGroup: rbac.authorization.k8s.io
```

## kubelet 配置

kubelet 作为节点代理，需要正确配置 bootstrap kubeconfig 及相关启动参数。

### 创建 Bootstrap Kubeconfig

使用 kubectl 创建 bootstrap kubeconfig 文件：

```bash
# 设置集群信息
kubectl config set-cluster kubernetes \
  --certificate-authority=/etc/kubernetes/pki/ca.crt \
  --embed-certs=true \
  --server=https://k8s-api:6443 \
  --kubeconfig=bootstrap.kubeconfig

# 设置认证信息
kubectl config set-credentials kubelet-bootstrap \
  --token=${BOOTSTRAP_TOKEN} \
  --kubeconfig=bootstrap.kubeconfig

# 设置上下文
kubectl config set-context default \
  --cluster=kubernetes \
  --user=kubelet-bootstrap \
  --kubeconfig=bootstrap.kubeconfig

# 使用默认上下文
kubectl config use-context default --kubeconfig=bootstrap.kubeconfig
```

### kubelet 启动参数

配置 kubelet 启动参数，启用自动证书轮转：

```bash
--bootstrap-kubeconfig="/path/to/bootstrap.kubeconfig"
--kubeconfig="/var/lib/kubelet/kubeconfig"
--cert-dir="/var/lib/kubelet/pki"
--rotate-certificates=true
--rotate-server-certificates=true
```

参数说明：

- `--bootstrap-kubeconfig`：bootstrap kubeconfig 文件路径
- `--kubeconfig`：生成的 kubeconfig 文件路径
- `--cert-dir`：证书存放目录
- `--rotate-certificates`：启用客户端证书自动轮转
- `--rotate-server-certificates`：启用服务端证书自动轮转

### 证书轮转功能

现代 Kubernetes 版本中，证书轮转功能已经稳定，不再需要 feature gate：

- **客户端证书轮转**：kubelet 会在证书即将过期时自动创建新的 CSR 请求续期
- **服务端证书轮转**：kubelet 可以自动更新用于对外提供服务的 TLS 证书

## 手动管理 CSR

在自动化流程之外，管理员也可以手动管理证书签名请求（CSR）。

### 查看证书请求

以下命令可用于查看和审查 CSR：

```bash
# 列出所有 CSR
kubectl get csr

# 查看特定 CSR 详情
kubectl describe csr <csr-name>
```

### 手动审批证书

如需手动批准或拒绝证书请求，可使用如下命令：

```bash
# 批准证书请求
kubectl certificate approve <csr-name>

# 拒绝证书请求
kubectl certificate deny <csr-name>
```

## 最佳实践

在生产环境中，建议遵循以下最佳实践以提升安全性和可维护性：

{{< table title="Kubernetes TLS Bootstrap 最佳实践" >}}

| 类别         | 建议与说明                                         | 具体举例或工具         |
|--------------|----------------------------------------------------|-----------------------|
| 安全性       | 定期轮转 bootstrap token，不同环境使用不同 token    | —                     |
| 监控         | 监控 CSR 请求和证书过期情况                        | Prometheus、Alertmanager |
| 自动化       | 使用自动审批控制器，减少手动操作                    | 内置 csrapproving 控制器 |
| 备份         | 定期备份 CA 证书和私钥                              | etcd、离线存储         |
| 权限控制     | 严格控制能审批 CSR 的用户和服务账号权限             | RBAC                  |

{{< /table >}}

## 总结

通过正确配置 TLS Bootstrap，可以大大简化 Kubernetes 集群中 kubelet 证书的管理工作，提高集群的安全性和可维护性。自动化证书签发与轮转机制，配合合理的权限与监控策略，是保障大规模集群安全运行的关键。

## 参考文献

- [TLS Bootstrapping for Kubelet - kubernetes.io](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet-tls-bootstrapping/)
- [Certificates API - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/certificate-signing-requests/)
- [Kubernetes RBAC - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
