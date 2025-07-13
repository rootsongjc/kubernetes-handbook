---
weight: 55
title: Secret
date: '2022-05-21T00:00:00+08:00'
type: book
description: Secret 是 Kubernetes 中用于存储敏感数据的对象，包括密码、token、密钥等，支持以 Volume 或环境变量方式使用，主要类型有 Opaque、Service Account 和 dockerconfigjson。
keywords:
- kubernetes
- secret
- 敏感数据
- 密码管理
- 配置管理
- base64 编码
- docker registry
- service account
---

Secret 是 Kubernetes 中专门用于存储和管理敏感数据的资源对象，如密码、OAuth token、SSH 密钥等。使用 Secret 可以避免将敏感信息直接写入容器镜像或 Pod 规范中，提高了应用的安全性。

## Secret 类型

Kubernetes 支持多种类型的 Secret：

- **Opaque**：用户定义的任意数据，最常用的类型
- **kubernetes.io/service-account-token**：Service Account 的认证令牌
- **kubernetes.io/dockerconfigjson**：Docker registry 认证信息
- **kubernetes.io/tls**：TLS 证书和私钥
- **kubernetes.io/basic-auth**：基本认证凭据

## Opaque Secret

Opaque 是最常用的 Secret 类型，用于存储任意的敏感数据。数据必须使用 base64 编码。

### 创建 Opaque Secret

首先准备需要编码的数据：

```bash
echo -n "admin" | base64
# 输出：YWRtaW4=

echo -n "mypassword123" | base64
# 输出：bXlwYXNzd29yZDEyMw==

以下是相关的代码示例：

```

创建 Secret 资源文件：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: user-credentials
  namespace: default
type: Opaque
data:
  username: YWRtaW4=
  password: bXlwYXNzd29yZDEyMw==
```

也可以使用 `kubectl` 命令直接创建：

```bash
kubectl create secret generic user-credentials \
  --from-literal=username=admin \
  --from-literal=password=mypassword123
```

应用 Secret：

```bash
kubectl apply -f secret.yaml
```

### 使用 Secret

Secret 可以通过两种方式在 Pod 中使用：

#### 方式一：挂载为 Volume

以下是相关的代码示例：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-volume-pod
spec:
  containers:
  - name: app
    image: nginx:1.20
    volumeMounts:
    - name: secret-volume
      mountPath: /etc/secrets
      readOnly: true
    ports:
    - containerPort: 80
  volumes:
  - name: secret-volume
    secret:
      secretName: user-credentials
      defaultMode: 0400  # 只读权限
```

挂载后，Secret 的每个键会成为一个文件：

- `/etc/secrets/username` 包含 `admin`
- `/etc/secrets/password` 包含 `mypassword123`

#### 方式二：作为环境变量

以下是相关的代码示例：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: web-app
        image: nginx:1.20
        ports:
        - containerPort: 80
        env:
        - name: DB_USERNAME
          valueFrom:
            secretKeyRef:
              name: user-credentials
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: user-credentials
              key: password
```

## Docker Registry Secret

当需要从私有 Docker Registry 拉取镜像时，需要创建认证 Secret。

### 使用命令创建

以下是相关的定义示例：

```bash
kubectl create secret docker-registry registry-secret \
  --docker-server=your-registry.com \
  --docker-username=your-username \
  --docker-password=your-password \
  --docker-email=your-email@example.com
```

### 使用 YAML 创建

以下是相关的定义示例：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: registry-secret
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: <base64-encoded-docker-config>
```

其中 `.dockerconfigjson` 的值可以通过以下方式获取：

```bash
cat ~/.docker/config.json | base64 -w 0
```

### 在 Pod 中使用

以下是具体的使用方法：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: private-app
spec:
  containers:
  - name: app
    image: your-registry.com/your-app:latest
    ports:
    - containerPort: 8080
  imagePullSecrets:
  - name: registry-secret
```

## Service Account 与 Secret

从 Kubernetes 1.24 开始，Service Account 不再自动创建对应的 Secret。如需手动创建：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: sa-token-secret
  annotations:
    kubernetes.io/service-account.name: my-service-account
type: kubernetes.io/service-account-token
```

查看 Service Account token：

```bash
kubectl create serviceaccount my-sa
kubectl apply -f sa-secret.yaml

# 查看 token
kubectl get secret sa-token-secret -o jsonpath='{.data.token}' | base64 -d
```

## 最佳实践

1. **最小权限原则**：只向需要的 Pod 暴露必要的 Secret
2. **使用 RBAC**：限制对 Secret 资源的访问权限
3. **定期轮换**：定期更新敏感数据，特别是密码和 token
4. **避免日志泄露**：确保应用不会将 Secret 内容输出到日志中
5. **使用外部密钥管理**：考虑集成 HashiCorp Vault、AWS Secrets Manager 等外部系统
6. **文件权限**：挂载 Secret 时设置适当的文件权限（如 0400）

## 监控和故障排查

查看 Secret 详情：

```bash
kubectl describe secret user-credentials
kubectl get secret user-credentials -o yaml
```

验证 Pod 中的 Secret：

```bash
# 检查环境变量
kubectl exec pod-name -- env | grep DB_

# 检查挂载的文件
kubectl exec pod-name -- ls -la /etc/secrets/
kubectl exec pod-name -- cat /etc/secrets/username
```

Secret 相关的常见问题包括编码错误、权限不足、Secret 不存在等，可通过 `kubectl describe pod` 查看详细的错误信息。
