# 管理集群中的TLS

在本书的最佳实践部分，我们在CentOS上部署了kuberentes集群，其中最开始又重要的一步就是创建TLS认证的，查看[创建TLS证书和秘钥](../practice/create-tls-and-secret-key.md)。很多人在进行到这一步时都会遇到各种各样千奇百怪的问题，这一步是创建集群的基础，我们有必要详细了解一下其背后的流程和原理。

## 概览

每个Kubernetes集群都有一个集群根证书颁发机构（CA）。 集群中的组件通常使用CA来验证API server的证书，由API服务器验证kubelet客户端证书等。为了支持这一点，CA证书包被分发到集群中的每个节点，并作为一个secret附加分发到默认service account上。 或者，你的workload可以使用此CA建立信任。 你的应用程序可以使用类似于[ACME草案](https://github.com/ietf-wg-acme/acme/)的协议，使用`certificates.k8s.io` API请求证书签名。

## 集群中的TLS信任

让Pod中运行的应用程序信任集群根CA通常需要一些额外的应用程序配置。 您将需要将CA证书包添加到TLS客户端或服务器信任的CA证书列表中。 例如，您可以使用golang TLS配置通过解析证书链并将解析的证书添加到[`tls.Config`](https://godoc.org/crypto/tls#Config)结构中的`Certificates`字段中，CA证书捆绑包将使用默认服务账户自动加载到pod中，路径为`/var/run/secrets/kubernetes.io/serviceaccount/ca.crt`。 如果您没有使用默认服务账户，请请求集群管理员构建包含您有权访问使用的证书包的configmap。

## 请求认证

以下部分演示如何为通过DNS访问的Kubernetes服务创建TLS证书。

### 步骤0. 下载安装SSL

下载cfssl工具：[https://pkg.cfssl.org/](https://pkg.cfssl.org/).

### 步骤1. 创建证书签名请求

通过运行以下命令生成私钥和证书签名请求（或CSR）：

```Bash
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

 `172.168.0.24` 是 service 的 cluster IP，`my-svc.my-namespace.svc.cluster.local` 是 service 的 DNS 名称， `10.0.34.2` 是 Pod 的 IP， `my-pod.my-namespace.pod.cluster.local` 是pod 的 DNS 名称，你可以看到以下输出：

```ini
2017/03/21 06:48:17 [INFO] generate received request
2017/03/21 06:48:17 [INFO] received CSR
2017/03/21 06:48:17 [INFO] generating key: ecdsa-256
2017/03/21 06:48:17 [INFO] encoded CSR
```

此命令生成两个文件; 它生成包含PEM编码的[pkcs #10](https://tools.ietf.org/html/rfc2986)认证请求的`server.csr`，以及包含仍然要创建的证书的PEM编码密钥的`server-key.pem`。

### 步骤2. 创建证书签名请求对象以发送到Kubernetes API

使用以下命令创建CSR yaml文件，并发送到API server：

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

请注意，在步骤1中创建的`server.csr`文件是base64编码并存储在`.spec.request`字段中。 我们还要求提供“数字签名”，“密钥加密”和“服务器身份验证”密钥用途的证书。

在API server中可以看到这些CSR处于pending状态。执行下面的命令你将可以看到：

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

### 步骤3. 获取证书签名请求

批准证书签名请求是通过自动批准过程完成的，或由集群管理员一次完成。 有关这方面涉及的更多信息，请参见下文。

### 步骤4. 下载签名并使用

一旦CSR被签署并获得批准，您应该看到以下内容：

```bash
$ kubectl get csr
NAME                  AGE       REQUESTOR               CONDITION
my-svc.my-namespace   10m       yourname@example.com    Approved,Issued
```

你可以通过运行以下命令下载颁发的证书并将其保存到`server.crt`文件中：

```bash
$ kubectl get csr my-svc.my-namespace -o jsonpath='{.status.certificate}' \
    | base64 -d > server.crt
```

现在你可以用`server.crt`和`server-key.pem`来做为keypair来启动HTTPS server。

## 批准证书签名请求

Kubernetes 管理员（具有适当权限）可以使用 `kubectl certificate approve` 和`kubectl certificate deny` 命令手动批准（或拒绝）证书签名请求。但是，如果您打算大量使用此 API，则可以考虑编写自动化的证书控制器。

如果上述机器或人类使用 kubectl，批准者的作用是验证 CSR 满足如下两个要求：

1. CSR 的主体控制用于签署 CSR 的私钥。这解决了伪装成授权主体的第三方的威胁。在上述示例中，此步骤将验证该 pod 控制了用于生成 CSR 的私钥。
2. CSR 的主体被授权在请求的上下文中执行。这解决了我们加入群集的我们不期望的主体的威胁。在上述示例中，此步骤将是验证该 pod 是否被允许加入到所请求的服务中。

当且仅当满足这两个要求时，审批者应该批准 CSR，否则拒绝 CSR。

## 给集群管理员的一个建议

本教程假设将signer设置为服务证书API。Kubernetes controller manager提供了一个signer的默认实现。 要启用它，请将`--cluster-signing-cert-file`和`--cluster-signing-key-file`参数传递给controller manager，并配置具有证书颁发机构的密钥对的路径。
