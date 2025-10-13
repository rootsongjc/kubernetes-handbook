---
weight: 93
title: 使用 kubeconfig 文件配置跨集群认证
linktitle: kubeconfig 与跨集群访问
date: 2022-05-21T00:00:00+08:00
description: 详细介绍 Kubernetes kubeconfig 文件的结构、组成和使用方法，包括集群、用户、上下文的配置，以及跨集群认证的最佳实践。
lastmod: 2025-10-13T05:09:43.994Z
---

在 Kubernetes 环境中，不同的组件和用户可能需要不同的认证方式：

- **kubelet** 使用证书进行认证
- **用户** 可能使用令牌（token）或证书
- **管理员** 管理多个用户的证书列表
- **多集群场景** 需要统一的配置管理

为了简化多集群、多用户环境下的认证管理，Kubernetes 提供了 kubeconfig 文件机制。该文件集中管理集群连接信息、用户认证凭据和上下文配置，让用户能够轻松地在不同集群和身份之间切换。

## kubeconfig 文件组成

### 文件结构示例

下面是一个完整的 kubeconfig 文件示例：

```yaml
apiVersion: v1
kind: Config
current-context: production-context
preferences:
  colors: true
clusters:
- cluster:
    certificate-authority: /path/to/ca.crt
    server: https://k8s-api.example.com:6443
  name: production-cluster
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTi...
    server: https://staging.k8s.local:6443
  name: staging-cluster
- cluster:
    insecure-skip-tls-verify: true
    server: https://dev.k8s.local:8443
  name: dev-cluster
contexts:
- context:
    cluster: production-cluster
    namespace: default
    user: admin-user
  name: production-context
- context:
    cluster: staging-cluster
    namespace: testing
    user: developer-user
  name: staging-context
- context:
    cluster: dev-cluster
    namespace: development
    user: dev-user
  name: dev-context
users:
- name: admin-user
  user:
    client-certificate: /path/to/admin.crt
    client-key: /path/to/admin.key
- name: developer-user
  user:
    token: eyJhbGciOiJSUzI1NiIsImtpZCI6IjlrOXAy...
- name: dev-user
  user:
    username: developer
    password: dev-password
```

### 核心组件详解

#### Cluster 配置

集群配置定义了 Kubernetes API 服务器的连接信息：

```yaml
clusters:
- cluster:
    # API 服务器地址
    server: https://k8s-api.example.com:6443
    # CA 证书文件路径
    certificate-authority: /path/to/ca.crt
    # 或者使用 base64 编码的证书数据
    certificate-authority-data: LS0tLS1CRUdJTi...
  name: production-cluster
- cluster:
    server: https://dev.k8s.local:8443
    # 跳过 TLS 验证（仅用于开发环境）
    insecure-skip-tls-verify: true
  name: dev-cluster
```

**关键字段说明：**

- `server`: Kubernetes API 服务器的完整 URL
- `certificate-authority`: CA 证书文件路径
- `certificate-authority-data`: base64 编码的 CA 证书数据
- `insecure-skip-tls-verify`: 跳过 TLS 证书验证（不推荐用于生产环境）

使用 `kubectl config set-cluster` 命令管理集群配置：

```bash
kubectl config set-cluster production \
  --server=https://k8s-api.example.com:6443 \
  --certificate-authority=/path/to/ca.crt
```

#### User 配置

用户配置定义了身份认证凭据：

```yaml
users:
- name: cert-user
  user:
    client-certificate: /path/to/client.crt
    client-key: /path/to/client.key
- name: token-user
  user:
    token: eyJhbGciOiJSUzI1NiIsImtpZCI6IjlrOXAy...
- name: basic-user
  user:
    username: developer
    password: secret-password
- name: exec-user
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: aws
      args:
      - eks
      - get-token
      - --cluster-name
      - my-cluster
```

**认证方式说明：**

- **证书认证**: 使用客户端证书和私钥
- **Token 认证**: 使用 Bearer Token
- **基本认证**: 使用用户名和密码（已废弃）
- **Exec 认证**: 通过外部命令获取认证信息（如 AWS EKS）

使用 `kubectl config set-credentials` 命令管理用户凭据：

```bash
# 设置证书认证
kubectl config set-credentials admin \
  --client-certificate=/path/to/admin.crt \
  --client-key=/path/to/admin.key

# 设置 token 认证
kubectl config set-credentials developer --token=your-token-here
```

#### Context 配置

上下文将集群、用户和命名空间组合在一起：

```yaml
contexts:
- context:
    cluster: production-cluster
    user: admin-user
    namespace: kube-system
  name: prod-admin
- context:
    cluster: staging-cluster
    user: developer-user
    namespace: development
  name: staging-dev
```

使用 `kubectl config set-context` 命令管理上下文：

```bash
kubectl config set-context prod-admin \
  --cluster=production-cluster \
  --user=admin-user \
  --namespace=kube-system
```

#### Current Context

使用 `current-context` 指定默认使用的上下文：

```yaml
current-context: prod-admin
```

使用 `kubectl config use-context` 切换当前上下文：

```bash
kubectl config use-context staging-dev
```

## kubeconfig 管理操作

### 查看配置

以下是相关的配置示例：

```bash
# 查看完整配置
kubectl config view

# 查看当前上下文的配置
kubectl config view --minify

# 查看特定 kubeconfig 文件
kubectl config view --kubeconfig=/path/to/config
```

### 管理集群

以下是相关的代码示例：

```bash
# 添加集群
kubectl config set-cluster my-cluster \
  --server=https://1.2.3.4:6443 \
  --certificate-authority=/path/to/ca.crt

# 删除集群
kubectl config delete-cluster my-cluster
```

### 管理用户

以下是相关的代码示例：

```bash
# 添加用户（证书认证）
kubectl config set-credentials my-user \
  --client-certificate=/path/to/client.crt \
  --client-key=/path/to/client.key

# 添加用户（token 认证）
kubectl config set-credentials my-user --token=bearer-token

# 删除用户
kubectl config delete-user my-user
```

### 管理上下文

以下是相关的代码示例：

```bash
# 创建上下文
kubectl config set-context my-context \
  --cluster=my-cluster \
  --user=my-user \
  --namespace=my-namespace

# 切换上下文
kubectl config use-context my-context

# 删除上下文
kubectl config delete-context my-context

# 查看当前上下文
kubectl config current-context

# 列出所有上下文
kubectl config get-contexts
```

## 配置文件加载机制

kubectl 按以下优先级加载和合并 kubeconfig 文件：

1. **命令行参数**: `--kubeconfig` 参数指定的文件
2. **环境变量**: `$KUBECONFIG` 环境变量指定的文件列表（用冒号分隔）
3. **默认位置**: `~/.kube/config` 文件

### 合并规则

当使用多个 kubeconfig 文件时：

- 第一个设置特定值的文件优先
- 集群、用户、上下文信息不会覆盖，只会补充
- `current-context` 使用第一个文件中的设置

### 环境变量示例

以下是相关的示例代码：

```bash
# 使用多个 kubeconfig 文件
export KUBECONFIG=$HOME/.kube/config:$HOME/.kube/config-cluster2

# 临时使用特定配置文件
kubectl --kubeconfig=/path/to/special-config get pods
```

## 最佳实践

### 文件组织

以下是相关的代码示例：

```bash
# 推荐的目录结构
~/.kube/
├── config                 # 默认配置
├── configs/
│   ├── production.yaml   # 生产环境配置
│   ├── staging.yaml      # 测试环境配置
│   └── development.yaml  # 开发环境配置
└── certificates/
    ├── prod-ca.crt
    ├── staging-ca.crt
    └── dev-ca.crt
```

### 安全考虑

本节将详细介绍安全考虑的相关内容，包括核心概念、实现方式和最佳实践。以下列表总结了主要要点：

- **保护私钥文件**: 设置适当的文件权限（600）
- **避免明文密码**: 使用证书或 token 认证
- **定期轮换凭据**: 特别是 token 和证书
- **使用不同的用户**: 为不同环境使用不同的认证身份

```bash
# 设置安全的文件权限
chmod 600 ~/.kube/config
chmod 600 ~/.kube/certificates/*
```

### 命名规范

使用清晰的命名约定：

```yaml
# 推荐的命名格式
clusters:
- name: prod-us-west-2
- name: staging-eu-central-1
- name: dev-local

users:
- name: john.doe-prod
- name: john.doe-staging
- name: service-account-monitoring

contexts:
- name: prod-us-west-2-admin
- name: staging-eu-central-1-developer
- name: dev-local-testing
```

### 自动化脚本示例

创建便捷的集群切换脚本：

```bash
#!/bin/bash
# 文件: switch-cluster.sh

case $1 in
  prod)
    kubectl config use-context prod-us-west-2-admin
    ;;
  staging)
    kubectl config use-context staging-eu-central-1-developer
    ;;
  dev)
    kubectl config use-context dev-local-testing
    ;;
  *)
    echo "Usage: $0 {prod|staging|dev}"
    echo "Current context: $(kubectl config current-context)"
    ;;
esac
```

### 验证配置

定期验证配置的有效性：

```bash
# 测试连接
kubectl cluster-info

# 验证权限
kubectl auth can-i get pods
kubectl auth can-i create deployments

# 检查配置
kubectl config view --validate
```

通过合理使用 kubeconfig 文件，你可以高效地管理多个 Kubernetes 集群的访问，提高运维效率并确保安全性。
