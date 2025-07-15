---
weight: 89
title: Kubernetes 中的用户与身份认证授权
linktitle: 用户与身份认证
date: '2022-05-21T00:00:00+08:00'
type: book
description: 深入了解 Kubernetes 集群中的用户管理和身份认证机制，包括普通用户与 Service Account 的区别、各种认证策略的配置与使用，以及认证流程的详细实现。
keywords:
- api
- header
- server
- token
- 使用
- 用户
- 认证
- 证书
- 请求
- 身份验证
---

在 Kubernetes 集群运维过程中，我们会接触到各种认证方式：在 master 节点上生成的证书和 token、kubelet 配置中的 bootstrap token、为应用创建的 service account，以及 Dashboard 中使用的 kubeconfig 或 token 登录等。这些都属于什么认证方式？如何区分用户？本文将深入解析 Kubernetes 的身份认证机制。

## 理解 Kubernetes 中的用户类型

Kubernetes 集群中包含两类用户：

1. **Service Account（服务账户）**：由 Kubernetes 管理的账户
2. **普通用户**：由外部独立服务管理的账户

### 普通用户

普通用户被假定为由外部独立服务管理，如：

- 管理员分发的私钥
- 用户存储系统（如 Keystone 或 Google 账户）
- 包含用户名和密码列表的文件

**重要特点**：

- Kubernetes 没有代表普通用户账户的对象
- 无法通过 API 调用向集群中添加普通用户
- 必须通过外部系统进行管理

### Service Account

Service Account 是由 Kubernetes API 管理的账户：

- 绑定到特定的 namespace
- 由 API server 自动创建或通过 API 调用手动创建
- 关联一套凭证，存储在 Secret 中
- 这些凭证可挂载到 Pod 中，允许 Pod 与 Kubernetes API 通信

### 请求身份绑定

API 请求会被绑定到以下身份之一：

- 普通用户
- Service Account
- 匿名请求

集群内外的每个进程（从工作站上的 `kubectl` 用户到节点上的 `kubelet`，再到控制平面组件）都必须在向 API Server 发出请求时进行身份验证，或者被视为匿名用户。

## 认证策略详解

Kubernetes 使用多种身份认证插件来验证 API 请求，包括客户端证书、bearer token、身份验证代理和 HTTP 基本身份验证。

### 认证属性

当 HTTP 请求发送到 API server 时，认证插件会尝试将以下属性关联到请求：

- **用户名**：标识最终用户的字符串（如 `kube-admin` 或 `jane@example.com`）
- **UID**：比用户名更一致且唯一的用户标识符
- **组**：将用户与常规用户组关联的字符串组
- **额外字段**：包含其他有用认证信息的键值映射

### 多重认证

- 可以同时启用多种身份验证方式
- 通常至少使用两种：Service Account token 和至少一种其他用户认证方式
- 启用多个认证模块时，第一个成功认证的模块会短路后续认证
- `system:authenticated` 组包含所有已验证用户

## 主要认证方法

### X509 客户端证书

**启用方式**：

```bash
--client-ca-file=SOMEFILE
```

**工作原理**：

- 引用文件必须包含一个或多个证书颁发机构
- 使用证书 subject 的 Common Name（CN）作为用户名
- 使用证书的 organization 字段指示用户组成员身份
- 支持多个 organization 字段实现多组成员身份

**示例**：

```bash
openssl req -new -key jbeda.pem -out jbeda-csr.pem -subj "/CN=jbeda/O=app1/O=app2"
```

### 静态 Token 文件

**启用方式**：

```bash
--token-auth-file=SOMEFILE
```

**文件格式**：

```text
token,user,uid,"group1,group2,group3"
```

**特点**：

- Token 无限期持续
- 需要重启 API server 才能更改 token 列表

**在请求中使用**：

```http
Authorization: Bearer 31ada4fd-adec-460c-809a-9e56ceb75269
```

### Bootstrap Token

Bootstrap Token 是动态管理的 bearer token，用于简化新集群的初始化。

**格式**：`[a-z0-9]{6}.[a-z0-9]{16}`

**示例**：

```http
Authorization: Bearer 781292.db7bc3a58fc5f07e
```

**启用配置**：

```bash
# API server
--enable-bootstrap-token-auth

# Controller Manager
--controllers=*,tokencleaner
```

**认证信息**：

- 用户名：`system:bootstrap:<Token ID>`
- 组：`system:bootstrappers`

### 静态密码文件

**启用方式**：

```bash
--basic-auth-file=SOMEFILE
```

**文件格式**：

```text
password,user,uid,"group1,group2,group3"
```

**HTTP 请求格式**：

```http
Authorization: Basic BASE64ENCODED(USER:PASSWORD)
```

**注意**：基本身份认证的安全性较低，不推荐在生产环境使用。

### Service Account Token

Service Account 认证是自动启用的验证器，使用签名的 bearer token。

**相关参数**：

- `--service-account-key-file`：包含签名 bearer token 的 PEM 编码文件
- `--service-account-lookup`：启用后，从 API 中删除的 token 将被撤销

**创建 Service Account**：

```bash
kubectl create serviceaccount jenkins
```

**查看生成的 secret**：

```bash
kubectl get secret jenkins-token-1yvwg -o yaml
```

**认证信息**：

- 用户名：`system:serviceaccount:(NAMESPACE):(SERVICEACCOUNT)`
- 组：`system:serviceaccounts` 和 `system:serviceaccounts:(NAMESPACE)`

**在 Pod 中使用**：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  namespace: default
spec:
  replicas: 3
  template:
    spec:
      serviceAccountName: bob-the-bot
      containers:
      - name: nginx
        image: nginx:1.14.2
```

### OpenID Connect Token

[OpenID Connect](https://openid.net/connect/) 是基于 OAuth2 的身份认证协议，支持与外部身份提供商集成。

![Kubernetes OpenID Connect Flow](https://assets.jimmysong.io/images/book/kubernetes-handbook/security/authentication/kubernetes-oidc-login.webp)
{width=1116 height=517}

**认证流程**：

1. 登录到身份提供商
2. 获取 `access_token`、`id_token` 和 `refresh_token`
3. 使用 `id_token` 作为 bearer token
4. API server 验证 JWT 签名和有效性
5. 完成用户授权

**API Server 配置参数**：

| 参数 | 描述 | 是否必需 |
|------|------|----------|
| `--oidc-issuer-url` | 身份提供商的 URL | 是 |
| `--oidc-client-id` | 客户端 ID | 是 |
| `--oidc-username-claim` | JWT 中用作用户名的字段 | 否 |
| `--oidc-groups-claim` | JWT 中用作用户组的字段 | 否 |
| `--oidc-ca-file` | 身份提供商的 CA 证书路径 | 否 |

**kubectl 配置示例**：

```bash
kubectl config set-credentials mmosley \
    --auth-provider=oidc \
    --auth-provider-arg=idp-issuer-url=https://oidcidp.example.com \
    --auth-provider-arg=client-id=kubernetes \
    --auth-provider-arg=client-secret=1db158f6-177d-4d9c-8a8b-d36869918ec5 \
    --auth-provider-arg=refresh-token=q1bKLFOyUiosTfawzA93TzZ... \
    --auth-provider-arg=id-token=eyJraWQiOiJDTj1vaWRjaWRwLnRyZW1vbG8...
```

### Webhook Token 认证

Webhook 认证允许使用远程服务验证 bearer token。

**配置参数**：

- `--authentication-token-webhook-config-file`：描述远程 webhook 服务的 kubeconfig 文件
- `--authentication-token-webhook-cache-ttl`：缓存认证结果的时间（默认 2 分钟）

**配置文件示例**：

```yaml
clusters:
  - name: name-of-remote-authn-service
    cluster:
      certificate-authority: /path/to/ca.pem
      server: https://authn.example.com/authenticate

users:
  - name: name-of-api-server
    user:
      client-certificate: /path/to/cert.pem
      client-key: /path/to/key.pem

current-context: webhook
contexts:
- context:
    cluster: name-of-remote-authn-service
    user: name-of-api-server
  name: webhook
```

**请求格式**：

```json
{
  "apiVersion": "authentication.k8s.io/v1",
  "kind": "TokenReview",
  "spec": {
    "token": "(BEARERTOKEN)"
  }
}
```

**成功响应**：

```json
{
  "apiVersion": "authentication.k8s.io/v1",
  "kind": "TokenReview",
  "status": {
    "authenticated": true,
    "user": {
      "username": "janedoe@example.com",
      "uid": "42",
      "groups": ["developers", "qa"]
    }
  }
}
```

### 认证代理

API server 可以配置为从请求 header 中识别用户身份。

**配置参数**：

- `--requestheader-username-headers`：用户名 header（必需）
- `--requestheader-group-headers`：用户组 header（可选）
- `--requestheader-extra-headers-prefix`：额外字段 header 前缀（可选）
- `--requestheader-client-ca-file`：验证代理证书的 CA 文件（必需）

**配置示例**：

```bash
--requestheader-username-headers=X-Remote-User
--requestheader-group-headers=X-Remote-Group
--requestheader-extra-headers-prefix=X-Remote-Extra-
```

**请求示例**：

```http
GET / HTTP/1.1
X-Remote-User: fido
X-Remote-Group: dogs
X-Remote-Group: dachshunds
X-Remote-Extra-Scopes: openid
```

## 高级认证功能

### 匿名请求

**版本差异**：

- 1.5.x：默认禁用，使用 `--anonymous-auth=false` 启用
- 1.6+：默认启用（非 `AlwaysAllow` 授权模式），使用 `--anonymous-auth=false` 禁用

**匿名用户身份**：

- 用户名：`system:anonymous`
- 组名：`system:unauthenticated`

### 用户模拟

管理员可以通过模拟 header 充当其他用户，用于调试授权策略。

**模拟 Header**：

- `Impersonate-User`：模拟的用户名
- `Impersonate-Group`：模拟的组名（可多次使用）
- `Impersonate-Extra-*`：额外字段

**kubectl 使用**：

```bash
kubectl drain mynode --as=superman --as-group=system:masters
```

**RBAC 权限配置**：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: impersonator
rules:
- apiGroups: [""]
  resources: ["users", "groups", "serviceaccounts"]
  verbs: ["impersonate"]
```

## 证书管理

### 使用 OpenSSL 生成证书

**生成 CA 证书**：

```bash
# 生成 CA 私钥
openssl genrsa -out ca.key 2048

# 生成 CA 证书
openssl req -x509 -new -nodes -key ca.key -subj "/CN=${MASTER_IP}" -days 10000 -out ca.crt
```

**生成服务器证书**：

```bash
# 生成服务器私钥
openssl genrsa -out server.key 2048

# 生成证书签名请求
openssl req -new -key server.key -subj "/CN=${MASTER_IP}" -out server.csr

# 生成服务器证书
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 10000
```

**API Server 配置**：

```bash
--client-ca-file=/path/to/ca.crt
--tls-cert-file=/path/to/server.crt
--tls-private-key-file=/path/to/server.key
```

### 使用 certificates.k8s.io API

Kubernetes 提供了 `certificates.k8s.io` API 来管理 x509 证书，支持自动化证书生命周期管理。

## 最佳实践

1. **多重认证**：结合使用多种认证方式以提高安全性
2. **最小权限原则**：为不同用户和服务分配最小必需权限
3. **定期轮换**：定期更新证书和 token
4. **审计日志**：启用审计功能跟踪认证和授权活动
5. **外部身份提供商**：在企业环境中集成 LDAP、OIDC 等外部认证系统

## 参考资料

- [Kubernetes Authentication Documentation](https://kubernetes.io/docs/reference/access-authn-authz/authentication/)
- [Managing TLS in a Cluster](https://kubernetes.io/docs/tasks/tls/managing-tls-in-a-cluster/)
- [使用 kubeconfig 或 token 进行用户身份认证](../auth-with-kubeconfig-or-token/)
