---
weight: 84
title: 管理集群中的 TLS
date: '2022-05-21T00:00:00+08:00'
type: book
description: 详细介绍 Kubernetes 集群中 TLS 证书的管理机制，包括集群根证书颁发机构（CA）的工作原理、证书签名请求（CSR）的创建和批准流程，以及如何在 Pod 中建立 TLS 信任关系。
keywords:
- api
- ca
- cluster
- csr
- kubernetes
- pod
- server
- 使用
- 证书
- 集群
---

在使用二进制文件部署 Kubernetes 集群时，TLS 证书配置往往是最容易出错的环节。理解 Kubernetes 集群中 TLS 证书的管理机制，对于构建安全可靠的集群至关重要。

## 集群 TLS 架构概述

每个 Kubernetes 集群都有一个集群根证书颁发机构（CA），它是整个集群安全通信的基础。集群中的各个组件通过这个 CA 来建立相互信任：

- **API Server 验证**：集群组件使用 CA 来验证 API Server 的证书
- **客户端验证**：API Server 验证 kubelet 等客户端证书
- **证书分发**：CA 证书包被分发到集群中的每个节点
- **服务账户集成**：CA 证书作为 Secret 自动挂载到默认 Service Account

应用程序可以通过 `certificates.k8s.io` API 请求证书签名，这类似于 [ACME 协议](https://datatracker.ietf.org/doc/html/rfc8555)的工作方式。

## 在 Pod 中建立 TLS 信任

### 自动挂载的 CA 证书

Kubernetes 会自动将 CA 证书包挂载到每个 Pod 中：

- **挂载路径**：`/var/run/secrets/kubernetes.io/serviceaccount/ca.crt`
- **适用范围**：使用默认 Service Account 的 Pod
- **自动更新**：证书轮换时自动更新

### 在应用程序中使用 CA 证书

以 Go 语言为例，可以这样加载 CA 证书：

```go
package main

import (
  "crypto/tls"
  "crypto/x509"
  "io/ioutil"
  "log"
)

func loadCACert() *x509.CertPool {
  caCert, err := ioutil.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/ca.crt")
  if err != nil {
    log.Fatal(err)
  }
  
  caCertPool := x509.NewCertPool()
  caCertPool.AppendCertsFromPEM(caCert)
  
  return caCertPool
}

func main() {
  tlsConfig := &tls.Config{
    RootCAs: loadCACert(),
  }
  // 使用 tlsConfig 进行 HTTPS 通信
}
```

### 自定义 Service Account

如果不使用默认 Service Account，需要：

1. 创建包含 CA 证书的 ConfigMap
2. 将 ConfigMap 挂载到 Pod 中
3. 在应用程序中指定正确的证书路径

## 创建和管理证书签名请求

### 环境准备

安装必要的工具：

```bash
# 安装 cfssl
curl -L https://github.com/cloudflare/cfssl/releases/download/v1.6.4/cfssl_1.6.4_linux_amd64 -o cfssl
curl -L https://github.com/cloudflare/cfssl/releases/download/v1.6.4/cfssljson_1.6.4_linux_amd64 -o cfssljson
chmod +x cfssl cfssljson
sudo mv cfssl cfssljson /usr/local/bin/
```

### 生成私钥和证书签名请求

创建配置文件并生成 CSR：

```bash
cat <<EOF | cfssl genkey - | cfssljson -bare server
{
  "hosts": [
  "my-svc.my-namespace.svc.cluster.local",
  "my-pod.my-namespace.pod.cluster.local",
  "172.168.0.24",
  "10.0.34.2"
  ],
  "CN": "my-pod.my-namespace.pod.cluster.local",
  "key": {
  "algo": "ecdsa",
  "size": 256
  },
  "names": [
  {
    "C": "CN",
    "ST": "Beijing",
    "L": "Beijing",
    "O": "example",
    "OU": "example"
  }
  ]
}
EOF
```

**配置说明**：

- `hosts`：包含服务 DNS 名称、Pod DNS 名称和 IP 地址
- `CN`：通用名称，通常使用主要的 DNS 名称
- `key`：密钥算法和长度
- `names`：证书主体信息

生成成功后会看到类似输出：

```
2023/10/21 06:48:17 [INFO] generate received request
2023/10/21 06:48:17 [INFO] received CSR
2023/10/21 06:48:17 [INFO] generating key: ecdsa-256
2023/10/21 06:48:17 [INFO] encoded CSR
```

### 提交证书签名请求

创建 CSR 资源并提交到 Kubernetes API：

```bash
cat <<EOF | kubectl apply -f -
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
  name: my-svc.my-namespace
spec:
  request: $(cat server.csr | base64 | tr -d '\n')
  signerName: kubernetes.io/kubelet-serving
  usages:
  - digital signature
  - key encipherment
  - server auth
EOF
```

**重要变更**：

- 在 Kubernetes 1.19+ 版本中，必须指定 `signerName`
- 常用的 signer 包括：
  - `kubernetes.io/kube-apiserver-client`：客户端证书
  - `kubernetes.io/kubelet-serving`：服务端证书
  - `kubernetes.io/legacy-unknown`：兼容性 signer

### 查看证书签名请求状态

以下是相关的代码示例：

```bash
kubectl get csr my-svc.my-namespace

kubectl describe csr my-svc.my-namespace
```

输出示例：

```
Name:         my-svc.my-namespace
Labels:       <none>
Annotations:  <none>
CreationTimestamp:  Tue, 21 Oct 2023 07:03:51 +0800
Requesting User:    system:node:worker-1
Requested Signers:  kubernetes.io/kubelet-serving
Status:             Pending
Subject:
  Common Name:    my-pod.my-namespace.pod.cluster.local
  Serial Number:  
Subject Alternative Names:
  DNS Names:     my-svc.my-namespace.svc.cluster.local
         my-pod.my-namespace.pod.cluster.local
  IP Addresses:  172.168.0.24
         10.0.34.2
Events:          <none>
```

## 证书批准和使用

### 手动批准证书

具有适当权限的管理员可以手动批准或拒绝 CSR：

```bash
# 批准证书
kubectl certificate approve my-svc.my-namespace

# 拒绝证书
kubectl certificate deny my-svc.my-namespace
```

### 获取签名证书

证书批准后，可以提取签名证书：

```bash
kubectl get csr my-svc.my-namespace -o jsonpath='{.status.certificate}' | base64 -d > server.crt
```

### 验证证书

验证生成的证书内容：

```bash
openssl x509 -in server.crt -text -noout
```

### 使用证书

现在可以使用 `server.crt` 和 `server-key.pem` 启动 HTTPS 服务：

```bash
# 启动简单的 HTTPS 服务器
openssl s_server -cert server.crt -key server-key.pem -port 8443
```

## 自动化证书管理

### 自动批准策略

Kubernetes 提供了几种自动批准机制：

1. **内置批准器**：
   - `csrapproving` controller 自动批准符合条件的 CSR
   - 主要用于 kubelet 客户端证书

2. **自定义批准器**：
   - 基于策略的自动批准
   - 集成外部 CA 系统

### CSR 批准最佳实践

批准 CSR 时需要验证两个关键要求：

1. **私钥控制验证**：
   - 确认请求者拥有对应的私钥
   - 防止第三方伪造请求

2. **授权验证**：
   - 确认请求者有权获取该证书
   - 验证证书用途的合法性

### 示例：自动批准脚本

以下是相关的示例代码：

```bash
#!/bin/bash
# 简单的 CSR 批准脚本

CSR_NAME=$1
if [ -z "$CSR_NAME" ]; then
  echo "Usage: $0 <csr-name>"
  exit 1
fi

# 检查 CSR 状态
STATUS=$(kubectl get csr $CSR_NAME -o jsonpath='{.status.conditions[0].type}' 2>/dev/null)

if [ "$STATUS" = "Pending" ]; then
  echo "Approving CSR: $CSR_NAME"
  kubectl certificate approve $CSR_NAME
else
  echo "CSR $CSR_NAME is not in Pending state: $STATUS"
fi
```

## 集群管理员配置

### Controller Manager 配置

要启用内置的证书签名功能，需要配置 Controller Manager：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: kube-controller-manager
spec:
  containers:
  - name: kube-controller-manager
  image: k8s.gcr.io/kube-controller-manager:v1.28.0
  command:
  - kube-controller-manager
  - --cluster-signing-cert-file=/etc/kubernetes/pki/ca.crt
  - --cluster-signing-key-file=/etc/kubernetes/pki/ca.key
  - --cluster-signing-duration=8760h  # 1 年有效期
  volumeMounts:
  - name: ca-certs
    mountPath: /etc/kubernetes/pki
    readOnly: true
  volumes:
  - name: ca-certs
  hostPath:
    path: /etc/kubernetes/pki
```

### 证书轮换策略

建议配置合理的证书轮换策略：

- **证书有效期**：通常设置为 1 年
- **轮换时间**：在证书到期前 30 天开始轮换
- **自动化程度**：尽可能实现自动化轮换

## 故障排查

### 常见问题

1. **CSR 长时间处于 Pending 状态**：
   - 检查 Controller Manager 配置
   - 验证 CA 证书和私钥路径

2. **证书验证失败**：
   - 检查 SAN（Subject Alternative Names）配置
   - 确认 DNS 名称和 IP 地址正确

3. **权限问题**：
   - 确认用户有创建 CSR 的权限
   - 检查 RBAC 配置

### 调试命令

以下是相关的代码示例：

```bash
# 查看 CSR 详细信息
kubectl describe csr <csr-name>

# 查看 Controller Manager 日志
kubectl logs -n kube-system kube-controller-manager-<node-name>

# 验证证书链
openssl verify -CAfile /etc/kubernetes/pki/ca.crt server.crt
```

通过合理配置和管理 TLS 证书，可以确保 Kubernetes 集群的安全通信，为应用程序提供可靠的加密基础。
