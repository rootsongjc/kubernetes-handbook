---
weight: 89
title: Kubernetes 中的用户与身份认证授权
linktitle: 用户与身份认证
date: 2022-05-21T00:00:00+08:00
description: 深入了解 Kubernetes 集群中的用户管理和身份认证机制，包括普通用户与 Service Account 的区别、各种认证策略的配置与使用，以及认证流程的详细实现。
lastmod: 2025-10-27T17:10:53.912Z
---

> Kubernetes 用户与身份认证机制为集群安全提供了基础保障，合理区分用户类型并配置多重认证策略，是实现最小权限和合规访问的关键。

## 理解 Kubernetes 中的用户类型

在 Kubernetes 集群中，用户分为两大类，分别适用于不同的认证与授权场景。

- **Service Account（服务账户）**：由 Kubernetes 管理的账户，主要用于集群内部组件和 Pod 访问 API。
- **普通用户**：由外部独立服务管理的账户，适用于集群外部用户和管理员。

### 普通用户

普通用户通常由外部系统管理，例如：

- 管理员分发的私钥
- 用户存储系统（如 Keystone 或 Google 账户）
- 包含用户名和密码列表的文件

**注意事项**：

- Kubernetes 不存储普通用户对象
- 无法通过 API 创建普通用户
- 需通过外部系统管理

### Service Account

Service Account 由 Kubernetes API 管理，具备如下特性：

- 绑定到特定 namespace
- 可自动或手动创建
- 关联凭证存储于 Secret
- Pod 可挂载凭证与 API 通信

### 请求身份绑定

每个 API 请求都绑定到以下身份之一：

- 普通用户
- Service Account
- 匿名请求

集群内外的所有进程（如 kubectl、kubelet、控制平面组件）都需认证，否则视为匿名用户。

## 认证策略详解

Kubernetes 支持多种认证插件，常见方式包括客户端证书、bearer token、认证代理和 HTTP 基本认证。

### 认证属性

认证插件会为请求关联以下属性：

- **用户名**：如 `kube-admin`、`jane@example.com`
- **UID**：唯一用户标识符
- **组**：用户所属组
- **额外字段**：其他认证信息

### 多重认证

- 可同时启用多种认证方式
- 通常至少启用 Service Account token 和一种用户认证
- 多模块时，第一个成功认证即短路后续
- `system:authenticated` 组包含所有已验证用户

## 主要认证方法

Kubernetes 支持多种认证方式，适应不同场景需求。

### X509 客户端证书

通过配置 `--client-ca-file` 启用：

```bash
--client-ca-file=SOMEFILE
```

- 文件需包含一个或多个 CA
- 证书 subject 的 CN 作为用户名
- organization 字段为用户组，可多组

**示例**：

```bash
openssl req -new -key jbeda.pem -out jbeda-csr.pem -subj "/CN=jbeda/O=app1/O=app2"
```

### 静态 Token 文件

通过 `--token-auth-file` 启用：

```bash
--token-auth-file=SOMEFILE
```

- 文件格式：`token,user,uid,"group1,group2,group3"`
- Token 无限期有效，修改需重启 API server

**请求示例**：

```http
Authorization: Bearer 31ada4fd-adec-460c-809a-9e56ceb75269
```

### Bootstrap Token

Bootstrap Token 用于集群初始化，格式为 `[a-z0-9]{6}.[a-z0-9]{16}`。

**启用配置**：

```bash
--enable-bootstrap-token-auth
# Controller Manager
--controllers=*,tokencleaner
```

- 用户名：`system:bootstrap:<Token ID>`
- 组：`system:bootstrappers`

### 静态密码文件

通过 `--basic-auth-file` 启用：

```bash
--basic-auth-file=SOMEFILE
```

- 文件格式：`password,user,uid,"group1,group2,group3"`
- 不推荐生产环境使用

**请求示例**：

```http
Authorization: Basic BASE64ENCODED(USER:PASSWORD)
```

### Service Account Token

Service Account 认证自动启用，使用签名 bearer token。

- `--service-account-key-file`：签名 token 的 PEM 文件
- `--service-account-lookup`：启用后，API 删除的 token 会被撤销

**创建 Service Account**：

```bash
kubectl create serviceaccount jenkins
```

**查看 Secret**：

```bash
kubectl get secret jenkins-token-1yvwg -o yaml
```

- 用户名：`system:serviceaccount:(NAMESPACE):(SERVICEACCOUNT)`
- 组：`system:serviceaccounts`、`system:serviceaccounts:(NAMESPACE)`

**Pod 挂载示例**：

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

[OpenID Connect](https://openid.net/connect/)（OIDC）基于 OAuth2，可集成外部身份提供商。

下图展示了 OIDC 认证流程：

![Kubernetes OpenID Connect Flow](https://assets.jimmysong.io/images/book/kubernetes-handbook/security/authentication/kubernetes-oidc-login.webp)
{width=1116 height=517}

**认证流程**：

1. 登录身份提供商
2. 获取 `access_token`、`id_token`、`refresh_token`
3. 使用 `id_token` 作为 bearer token
4. API server 验证 JWT
5. 完成授权

**API Server 配置参数**：

{{< table title="OIDC 认证相关参数说明" >}}

| 参数 | 描述 | 是否必需 |
|------|------|----------|
| `--oidc-issuer-url` | 身份提供商 URL | 是 |
| `--oidc-client-id` | 客户端 ID | 是 |
| `--oidc-username-claim` | JWT 用户名字段 | 否 |
| `--oidc-groups-claim` | JWT 用户组字段 | 否 |
| `--oidc-ca-file` | 身份提供商 CA 证书 | 否 |

{{< /table >}}

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

Webhook 认证允许远程服务验证 bearer token。

- `--authentication-token-webhook-config-file`：webhook kubeconfig
- `--authentication-token-webhook-cache-ttl`：认证结果缓存时间

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

API server 可通过请求 header 识别用户身份。

- `--requestheader-username-headers`：用户名 header
- `--requestheader-group-headers`：用户组 header
- `--requestheader-extra-headers-prefix`：额外字段 header 前缀
- `--requestheader-client-ca-file`：代理证书 CA 文件

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

Kubernetes 还支持匿名请求和用户模拟等高级认证能力。

### 匿名请求

- 1.5.x：默认禁用，`--anonymous-auth=false` 启用
- 1.6+：默认启用（非 `AlwaysAllow` 授权模式），`--anonymous-auth=false` 禁用

- 用户名：`system:anonymous`
- 组名：`system:unauthenticated`

### 用户模拟

管理员可通过 header 模拟其他用户，便于调试授权策略。

- `Impersonate-User`：模拟用户名
- `Impersonate-Group`：模拟组名（可多次）
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

Kubernetes 支持多种证书管理方式，保障集群通信安全。

### 使用 OpenSSL 生成证书

**生成 CA 证书**：

```bash
openssl genrsa -out ca.key 2048
openssl req -x509 -new -nodes -key ca.key -subj "/CN=${MASTER_IP}" -days 10000 -out ca.crt
```

**生成服务器证书**：

```bash
openssl genrsa -out server.key 2048
openssl req -new -key server.key -subj "/CN=${MASTER_IP}" -out server.csr
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 10000
```

**API Server 配置**：

```bash
--client-ca-file=/path/to/ca.crt
--tls-cert-file=/path/to/server.crt
--tls-private-key-file=/path/to/server.key
```

### 使用 certificates.k8s.io API

Kubernetes 提供 `certificates.k8s.io` API 实现自动化证书生命周期管理。

## 最佳实践

为提升集群安全性，建议遵循以下最佳实践：

{{< table title="Kubernetes 身份认证最佳实践" >}}

| 类别         | 建议与说明                         |
|--------------|------------------------------------|
| 多重认证     | 结合多种认证方式提升安全性         |
| 最小权限原则 | 为不同用户和服务分配最小必需权限   |
| 定期轮换     | 定期更新证书和 token               |
| 审计日志     | 启用审计功能跟踪认证与授权活动     |
| 外部认证     | 企业环境集成 LDAP、OIDC 等系统     |

{{< /table >}}

## 总结

Kubernetes 用户与身份认证体系为集群安全提供了坚实基础。通过合理区分用户类型、配置多重认证方式、强化证书管理和最小权限原则，可有效防止未授权访问和权限滥用，保障云原生环境的合规与安全。

## 参考文献

- [Kubernetes Authentication Documentation - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/authentication/)
- [Managing TLS in a Cluster - kubernetes.io](https://kubernetes.io/docs/tasks/tls/managing-tls-in-a-cluster/)
- [使用 kubeconfig 或 token 进行用户身份认证](../auth-with-kubeconfig-or-token/)
