---
weight: 84
title: 管理集群中的 TLS
date: '2022-05-21T00:00:00+08:00'
type: book
---

在使用二进制文件部署 Kubernetes 集群的时候，很多人在进行到部署证书时遇到各种各样千奇百怪的问题，这一步是创建集群的基础，我们有必要详细了解一下其背后的流程和原理。

## 概览

每个 Kubernetes 集群都有一个集群根证书颁发机构（CA）。集群中的组件通常使用 CA 来验证 API server 的证书，由 API 服务器验证 kubelet 客户端证书等。为了支持这一点，CA 证书包被分发到集群中的每个节点，并作为一个 secret 附加分发到默认 service account 上。或者，你的 workload 可以使用此 CA 建立信任。你的应用程序可以使用类似于 [ACME 草案](https://github.com/ietf-wg-acme/acme/)的协议，使用 `certificates.k8s.io` API 请求证书签名。

## 集群中的 TLS 信任

让 Pod 中运行的应用程序信任集群根 CA 通常需要一些额外的应用程序配置。您将需要将 CA 证书包添加到 TLS 客户端或服务器信任的 CA 证书列表中。例如，您可以使用 golang TLS 配置通过解析证书链并将解析的证书添加到 [`tls.Config`](https://godoc.org/crypto/tls#Config)结构中的 `Certificates` 字段中，CA 证书捆绑包将使用默认服务账户自动加载到 pod 中，路径为 `/var/run/secrets/kubernetes.io/serviceaccount/ca.crt`。如果您没有使用默认服务账户，请请求集群管理员构建包含您有权访问使用的证书包的 configmap。

## 请求认证

以下部分演示如何为通过 DNS 访问的 Kubernetes 服务创建 TLS 证书。

### 下载安装 SSL

[下载 cfssl 工具](https://pkg.cfssl.org/)。

### 创建证书签名请求

通过运行以下命令生成私钥和证书签名请求（或 CSR）：

```bash
$ cat <<EOF | cfssl genkey - | cfssljson -bare server
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
  }
}
EOF
```

`172.168.0.24` 是 service 的 cluster IP，`my-svc.my-namespace.svc.cluster.local` 是 service 的 DNS 名称， `10.0.34.2` 是 Pod 的 IP， `my-pod.my-namespace.pod.cluster.local` 是 pod 的 DNS 名称，你可以看到以下输出：

```ini
2017/03/21 06:48:17 [INFO] generate received request
2017/03/21 06:48:17 [INFO] received CSR
2017/03/21 06:48:17 [INFO] generating key: ecdsa-256
2017/03/21 06:48:17 [INFO] encoded CSR
```

此命令生成两个文件；它生成包含 PEM 编码的 [pkcs #10](https://datatracker.ietf.org/doc/html/rfc2986) 认证请求的 `server.csr`，以及包含仍然要创建的证书的 PEM 编码密钥的 `server-key.pem`。

### 创建证书签名请求对象以发送到 Kubernetes API

使用以下命令创建 CSR yaml 文件，并发送到 API server：

```bash
$ cat <<EOF | kubectl create -f -
apiVersion: certificates.k8s.io/v1beta1
kind: CertificateSigningRequest
metadata:
  name: my-svc.my-namespace
spec:
  groups:
  - system:authenticated
  request: $(cat server.csr | base64 | tr -d '\n')
  usages:
  - digital signature
  - key encipherment
  - server auth
EOF
```

请注意，在步骤 1 中创建的 `server.csr` 文件是 base64 编码并存储在`.spec.request` 字段中。我们还要求提供“数字签名”，“密钥加密”和“服务器身份验证”密钥用途的证书。

在 API server 中可以看到这些 CSR 处于 pending 状态。执行下面的命令你将可以看到：

```bash
$ kubectl describe csr my-svc.my-namespace
Name:                   my-svc.my-namespace
Labels:                 <none>
Annotations:            <none>
CreationTimestamp:      Tue, 21 Mar 2017 07:03:51 -0700
Requesting User:        yourname@example.com
Status:                 Pending
Subject:
        Common Name:    my-svc.my-namespace.svc.cluster.local
        Serial Number:
Subject Alternative Names:
        DNS Names:      my-svc.my-namespace.svc.cluster.local
        IP Addresses:   172.168.0.24
                        10.0.34.2
Events: <none>
```

### 获取证书签名请求

批准证书签名请求是通过自动批准过程完成的，或由集群管理员一次完成。有关这方面涉及的更多信息，请参见下文。

### 下载签名并使用

一旦 CSR 被签署并获得批准，您应该看到以下内容：

```bash
$ kubectl get csr
NAME                  AGE       REQUESTOR               CONDITION
my-svc.my-namespace   10m       yourname@example.com    Approved,Issued
```

你可以通过运行以下命令下载颁发的证书并将其保存到 `server.crt` 文件中：

```bash
$ kubectl get csr my-svc.my-namespace -o jsonpath='{.status.certificate}' \
    | base64 -d > server.crt
```

现在你可以用 `server.crt` 和 `server-key.pem` 来做为 keypair 来启动 HTTPS server。

## 批准证书签名请求

Kubernetes 管理员（具有适当权限）可以使用 `kubectl certificate approve` 和 `kubectl certificate deny` 命令手动批准（或拒绝）证书签名请求。但是，如果您打算大量使用此 API，则可以考虑编写自动化的证书控制器。

如果上述机器或人类使用 kubectl，批准者的作用是验证 CSR 满足如下两个要求：

1. CSR 的主体控制用于签署 CSR 的私钥。这解决了伪装成授权主体的第三方的威胁。在上述示例中，此步骤将验证该 pod 控制了用于生成 CSR 的私钥。
2. CSR 的主体被授权在请求的上下文中执行。这解决了我们加入群集的我们不期望的主体的威胁。在上述示例中，此步骤将是验证该 pod 是否被允许加入到所请求的服务中。

当且仅当满足这两个要求时，审批者应该批准 CSR，否则拒绝 CSR。

## 给集群管理员的一个建议

本教程假设将 signer 设置为服务证书 API。Kubernetes controller manager 提供了一个 signer 的默认实现。要启用它，请将 `--cluster-signing-cert-file` 和 `--cluster-signing-key-file` 参数传递给 controller manager，并配置具有证书颁发机构的密钥对的路径。
