---
date: "2017-08-16T22:27:32+08:00"
draft: false
title: "Kubernetes TLS bootstrap引导程序"
categories: "kubernetes"
tags: ["kubernetes"]
---

![WTF](https://res.cloudinary.com/jimmysong/image/upload/images/whats-the-fuck.jpg)

按照 [kubernetes-handbook](https://github.com/rootsongjc/kubernetes-handbook) 安装 kubernetes 集群的第一步是什么？没错，创建 TLS 证书和秘钥！作为第一步已经这么繁琐和容易出错，很多人就望而却步了，单纯的按照说明执行命令而不了解这样做的目录和命令的含义无法帮助我们进行问题排查和纠错。

Bootstrap 是很多系统中都存在的程序，比如 Linux 的bootstrap，bootstrap 一般都是作为预先配置在开启或者系统启动的时候加载，这可以用来生成一个指定环境。Kubernetes 的 kubelet 的启动时同样可以加载一个这样的配置文件，这个文件的内容类似如下形式：

```ini
02b50b05283e98dd0fd71db496ef01e8,kubelet-bootstrap,10001,"system:kubelet-bootstrap"
```

下面将为您详细解释 TLS bootstrap 是如何配置和生成的（下文是 kubernetes 官方文档的中文版）。

## TLS Bootstrap

本文档介绍如何为 kubelet 设置 TLS 客户端证书引导（bootstrap）。

Kubernetes 1.4 引入了一个用于从集群级证书颁发机构（CA）请求证书的 API。此 API 的原始目的是为 kubelet 提供 TLS 客户端证书。可以在 [这里](https://github.com/kubernetes/kubernetes/pull/20439) 找到该提议，在 [feature #43](https://github.com/kubernetes/features/issues/43) 追踪该功能的进度。

## kube-apiserver 配置

您必须提供一个 token 文件，该文件中指定了至少一个分配给 kubelet 特定 bootstrap 组的 “bootstrap token”。

该组将作为 controller manager 配置中的默认批准控制器而用于审批。随着此功能的成熟，您应该确保 token 被绑定到基于角色的访问控制（RBAC）策略上，该策略严格限制了与证书配置相关的客户端请求（使用 bootstrap token）。使用 RBAC，将 token 范围划分为组可以带来很大的灵活性（例如，当您配置完成节点后，您可以禁用特定引导组的访问）。

### Token 认证文件

Token 可以是任意的，但应该可以表示为从安全随机数生成器（例如大多数现代操作系统中的 /dev/urandom）导出的至少128位熵。生成 token 有很多中方式。例如：

`head -c 16 /dev/urandom | od -An -t x | tr -d ' '`

产生的 token 类似于这样： `02b50b05283e98dd0fd71db496ef01e8`。

Token 文件应该类似于以下示例，其中前三个值可以是任何值，引用的组名称应如下所示：

```ini
02b50b05283e98dd0fd71db496ef01e8,kubelet-bootstrap,10001,"system:kubelet-bootstrap"
```

在 kube-apiserver 命令中添加 `--token-auth-file=FILENAME` 标志（可能在您的 systemd unit 文件中）来启用 token 文件。

查看 [该文档](https://kubernetes.io/docs/admin/authentication/#static-token-file) 获取更多详细信息。

### 客户端证书 CA 包

在 kube-apiserver 命令中添加 `--client-ca-file=FILENAME` 标志启用客户端证书认证，指定包含签名证书的证书颁发机构包（例如 `--client-ca-file=/var/lib/kubernetes/ca.pem`）。

### kube-controller-manager 配置

请求证书的 API 向 Kubernetes controller manager 中添加证书颁发控制循环。使用磁盘上的 [cfssl](https://blog.cloudflare.com/introducing-cfssl/) 本地签名文件的形式。目前，所有发型的证书均为一年有效期和并具有一系列关键用途。

### 签名文件

您必须提供证书颁发机构，这样才能提供颁发证书所需的密码资料。

kube-apiserver 通过指定的 `--client-ca-file=FILENAME` 标志来认证和采信该 CA。CA 的管理超出了本文档的范围，但建议您为 Kubernetes 生成专用的 CA。

假定证书和密钥都是 PEM 编码的。

Kube-controller-manager 标志为：

```Ini
--cluster-signing-cert-file="/etc/path/to/kubernetes/ca/ca.crt" --cluster-signing-key-file="/etc/path/to/kubernetes/ca/ca.key"
```

### 审批控制器

在 kubernetes 1.7 版本中，实验性的 “组自动批准” 控制器被弃用，新的 `csrapproving` 控制器将作为 [kube-controller-manager](https://kubernetes.io/docs/admin/kube-controller-manager) 的一部分，被默认启用。

控制器使用 [`SubjectAccessReview` API](https://kubernetes.io/docs/admin/authorization/#checking-api-access) 来确定给定用户是否已被授权允许请求 CSR，然后根据授权结果进行批准。为了防止与其他批准者冲突，内置审批者没有明确地拒绝 CSR，只是忽略未经授权的请求。

控制器将 CSR 分为三个子资源：

1. `nodeclient` ：用户的客户端认证请求 `O=system:nodes`， `CN=system:node:(node name)`。
2. `selfnodeclient`：更新具有相同 `O` 和 `CN` 的客户端证书的节点。
3. `selfnodeserver`：更新服务证书的节点（ALPHA，需要 feature gate）。

当前，确定 CSR 是否为 `selfnodeserver` 请求的检查与 kubelet 的凭据轮换实现（Alpha 功能）相关联。因此，`selfnodeserver` 的定义将来可能会改变，并且需要 Controller Manager 上的`RotateKubeletServerCertificate` feature gate。该功能的进展可以在 [kubernetes/feature/#267](https://github.com/kubernetes/features/issues/267) 上追踪。

```ini
--feature-gates=RotateKubeletServerCertificate=true
```

以下 RBAC `ClusterRoles` 代表 `nodeClient`、`selfnodeclient` 和 `selfnodeserver` 功能。在以后的版本中可能会自动创建类似的角色。

```yaml
# A ClusterRole which instructs the CSR approver to approve a user requesting
# node client credentials.
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: approve-node-client-csr
rules:
- apiGroups: ["certificates.k8s.io"]
  resources: ["certificatesigningrequests/nodeclient"]
  verbs: ["create"]
---
# A ClusterRole which instructs the CSR approver to approve a node renewing its
# own client credentials.
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: approve-node-client-renewal-csr
rules:
- apiGroups: ["certificates.k8s.io"]
  resources: ["certificatesigningrequests/selfnodeclient"]
  verbs: ["create"]
---
# A ClusterRole which instructs the CSR approver to approve a node requesting a
# serving cert matching its client cert.
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: approve-node-server-renewal-csr
rules:
- apiGroups: ["certificates.k8s.io"]
  resources: ["certificatesigningrequests/selfnodeserver"]
  verbs: ["create"]
```

这些权力可以授予给凭证，如 bootstrap token。例如，要复制由已被移除的自动批准标志提供的行为，由单个组批准所有的 CSR：

```ini
# REMOVED: This flag no longer works as of 1.7.
--insecure-experimental-approve-all-kubelet-csrs-for-group="kubelet-bootstrap-token"
```

管理员将创建一个 `ClusterRoleBinding` 来定位该组。

```yaml
# Approve all CSRs for the group "kubelet-bootstrap-token"
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: auto-approve-csrs-for-group
subjects:
- kind: Group
  name: kubelet-bootstrap-token
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: approve-node-client-csr
  apiGroup: rbac.authorization.k8s.io
```

要让节点更新自己的凭据，管理员可以构造一个 `ClusterRoleBinding` 来定位该节点的凭据。

```yaml
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: node1-client-cert-renewal
subjects:
- kind: User
  name: system:node:node-1 # Let "node-1" renew its client certificate.
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: approve-node-client-renewal-csr
  apiGroup: rbac.authorization.k8s.io
```

删除该绑定将会阻止节点更新客户端凭据，一旦其证书到期，实际上就会将其从集群中删除。

## kubelet 配置

要向 kube-apiserver 请求客户端证书，kubelet 首先需要一个包含 bootstrap 身份验证 token 的 kubeconfig 文件路径。您可以使用 `kubectl config set-cluster`，`set-credentials` 和 `set-context` 来构建此 kubeconfig 文件。为 `kubectl config set-credentials` 提供 `kubelet-bootstrap` 的名称，并包含 `--token = <token-value>`，如下所示：

```bash
kubectl config set-credentials kubelet-bootstrap --token=${BOOTSTRAP_TOKEN} --kubeconfig=bootstrap.kubeconfig
```

启动 kubelet 时，如果 `--kubeconfig` 指定的文件不存在，则使用 bootstrap kubeconfig 向 API server 请求客户端证书。在批准 `kubelet` 的证书请求和回执时，将包含了生成的密钥和证书的 kubeconfig 文件写入由 `-kubeconfig` 指定的路径。证书和密钥文件将被放置在由 `--cert-dir` 指定的目录中。

启动 kubelet 时启用 bootstrap 用到的标志：

```ini
--experimental-bootstrap-kubeconfig="/path/to/bootstrap/kubeconfig"
```

此外，在1.7中，kubelet 实现了 **Alpha** 功能，使其客户端和/或服务器都能轮转提供证书。

可以分别通过 kubelet 中的 `RotateKubeletClientCertificate` 和 `RotateKubeletServerCertificate` 功能标志启用此功能，但在未来版本中可能会以向后兼容的方式发生变化。

```ini
--feature-gates=RotateKubeletClientCertificate=true,RotateKubeletServerCertificate=true
```

`RotateKubeletClientCertificate` 可以让 kubelet 在其现有凭据到期时通过创建新的 CSR 来轮换其客户端证书。 `RotateKubeletServerCertificate` 可以让 kubelet 在其引导客户端凭据后还可以请求服务证书，并轮换该证书。服务证书目前不要求 DNS 或 IP SANs。

## kubectl 审批

签名控制器不会立即签署所有证书请求。相反，它会一直等待直到适当特权的用户被标记为 “已批准” 状态。这最终将是由外部审批控制器来处理的自动化过程，但是对于 alpha 版本的 API 来说，可以由集群管理员通过 kubectl 命令手动完成。

管理员可以使用 `kubectl get csr` 命令列出所有的 CSR，使用 `kubectl describe csr <name>` 命令描述某个 CSR的详细信息。在 1.6 版本以前，[没有直接的批准/拒绝命令](https://github.com/kubernetes/kubernetes/issues/30163) ，因此审批者需要直接更新 Status 信息（[查看如何实现](https://github.com/gtank/csrctl)）。此后的 Kubernetes 版本中提供了 `kubectl certificate approve <name>` 和 `kubectl certificate deny <name>` 命令。

