---
weight: 87
title: 创建用户认证授权的 kubeconfig 文件
linktitle: Kubeconfig 用户认证授权
date: 2022-05-21T00:00:00+08:00
description: 详细介绍如何为 Kubernetes 集群创建用户认证授权的 kubeconfig 文件，包括 CA 证书生成、kubeconfig 配置和 RBAC 权限绑定的完整流程。
lastmod: 2025-10-27T17:05:45.385Z
---

当我们安装好 Kubernetes 集群后，如果想要把 kubectl 命令交给普通用户使用，就需要对用户的身份进行认证并对其权限做出限制。本文将以创建一个 `devuser` 用户并将其绑定到 `dev` 和 `test` 两个 namespace 为例，详细说明整个配置过程。

## 前置准备

在开始之前，请确保你已经：

- 拥有 Kubernetes 集群的管理员权限
- 安装了 `cfssl` 和 `cfssljson` 工具
- 准备好集群的 CA 证书和配置文件

## 创建用户证书

### 准备证书签名请求文件

创建 `devuser-csr.json` 文件，定义用户的证书信息：

```json
{
  "CN": "devuser",
  "hosts": [],
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "BeiJing",
      "L": "BeiJing",
      "O": "k8s",
      "OU": "System"
    }
  ]
}
```

### 生成用户证书和私钥

在 master 节点的 `/etc/kubernetes/ssl` 目录下，确保包含以下文件：

```text
ca-key.pem  ca.pem  ca-config.json  devuser-csr.json
```

执行以下命令生成用户证书：

```bash
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes devuser-csr.json | cfssljson -bare devuser
```

成功执行后将生成：

```text
devuser.csr  devuser-key.pem  devuser.pem
```

## 配置 kubeconfig 文件

### 创建用户的 kubeconfig

使用以下命令为 `devuser` 创建专用的 kubeconfig 文件：

```bash
# 设置集群参数
export KUBE_APISERVER="https://172.20.0.113:6443"
kubectl config set-cluster kubernetes \
  --certificate-authority=/etc/kubernetes/ssl/ca.pem \
  --embed-certs=true \
  --server=${KUBE_APISERVER} \
  --kubeconfig=devuser.kubeconfig

# 设置客户端认证参数
kubectl config set-credentials devuser \
  --client-certificate=/etc/kubernetes/ssl/devuser.pem \
  --client-key=/etc/kubernetes/ssl/devuser-key.pem \
  --embed-certs=true \
  --kubeconfig=devuser.kubeconfig

# 设置上下文参数
kubectl config set-context kubernetes \
  --cluster=kubernetes \
  --user=devuser \
  --namespace=dev \
  --kubeconfig=devuser.kubeconfig

# 设置默认上下文
kubectl config use-context kubernetes --kubeconfig=devuser.kubeconfig
```

### 应用新的 kubeconfig

将生成的 kubeconfig 文件设置为当前使用的配置：

```bash
# 备份原有配置（可选）
cp ~/.kube/config ~/.kube/config.backup

# 应用新配置
cp ./devuser.kubeconfig ~/.kube/config
```

## 配置 RBAC 权限

### 创建角色绑定

为了限制 `devuser` 用户的权限范围，使用 RBAC 将用户绑定到特定的 namespace：

```bash
# 为 dev namespace 创建角色绑定
kubectl create rolebinding devuser-admin-binding \
  --clusterrole=admin \
  --user=devuser \
  --namespace=dev

# 为 test namespace 创建角色绑定
kubectl create rolebinding devuser-admin-binding-test \
  --clusterrole=admin \
  --user=devuser \
  --namespace=test
```

这样配置后，`devuser` 用户将对 `dev` 和 `test` 两个 namespace 具有完全的管理权限。

## 验证配置

### 检查当前上下文

验证 kubectl 是否使用了正确的用户身份：

```bash
kubectl config get-contexts
```

输出示例：

```text
CURRENT   NAME         CLUSTER      AUTHINFO   NAMESPACE
*         kubernetes   kubernetes   devuser    dev
```

### 测试权限限制

验证用户权限是否按预期工作：

```bash
# 应该能正常访问 dev namespace
kubectl get pods --namespace=dev

# 应该能正常访问 test namespace  
kubectl get pods --namespace=test

# 应该被拒绝访问 default namespace
kubectl get pods --namespace=default
```

预期的错误输出：

```text
Error from server (Forbidden): pods is forbidden: User "devuser" cannot list resource "pods" in API group "" in the namespace "default"
```

## 最佳实践建议

### 安全考虑

1. **证书有效期管理**：定期轮换用户证书，避免长期有效的证书带来的安全风险
2. **最小权限原则**：根据用户实际需要分配最小必要权限，避免过度授权
3. **审计日志**：启用 Kubernetes 审计日志以追踪用户操作

### 管理建议

1. **命名规范**：建议使用统一的用户命名规范，如 `<team>-<role>-user`
2. **namespace 隔离**：为不同团队或项目创建独立的 namespace 进行资源隔离
3. **配置管理**：将 kubeconfig 文件和 RBAC 配置纳入版本控制系统

## 相关参考

- [基于角色的访问控制 (RBAC)](../../auth/rbac/)
- [网络策略](../network-policy/)

通过以上步骤，你已经成功为 Kubernetes 集群创建了一个具有受限权限的用户，该用户只能在指定的 namespace 中进行操作，有效提升了集群的安全性。
