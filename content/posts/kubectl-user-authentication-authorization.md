---
title: "kubectl的用户认证授权"
subtitle: "使用kubeconfig或者token进行权限认证"
date: 2017-08-31T14:44:32+08:00
description: "为kubernetes集群创建用户和使用kubeconfig或token进行权限认证"
draft: false
categories: kubernetes
tags: ["kubernetes"]
---

当我们安装好集群后，如果想要把 kubectl 命令交给用户使用，就不得不对用户的身份进行认证和对其权限做出限制。

下面以创建一个 devuser 用户并将其绑定到 dev 和 test 两个 namespace 为例说明。

## 创建 CA 证书和秘钥

**创建 devuser-csr.json 文件**

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

**生成 CA 证书和私钥**

在 [创建 TLS 证书和秘钥](http://jimmysong.io/kubernetes-handbook/practice/create-tls-and-secret-key.html) 一节中我们将生成的证书和秘钥放在了所有节点的 `/etc/kubernetes/ssl` 目录下，下面我们再在 master 节点上为 devuser 创建证书和秘钥，在 `/etc/kubernetes/ssl` 目录下执行以下命令：

执行该命令前请先确保该目录下已经包含如下文件：

```bash
ca-key.pem  ca.pem ca-config.json  devuser-csr.json
```

```bash
$ cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes devuser-csr.json | cfssljson -bare devuser
2017/08/31 13:31:54 [INFO] generate received request
2017/08/31 13:31:54 [INFO] received CSR
2017/08/31 13:31:54 [INFO] generating key: rsa-2048
2017/08/31 13:31:55 [INFO] encoded CSR
2017/08/31 13:31:55 [INFO] signed certificate with serial number 43372632012323103879829229080989286813242051309
2017/08/31 13:31:55 [WARNING] This certificate lacks a "hosts" field. This makes it unsuitable for
websites. For more information see the Baseline Requirements for the Issuance and Management
of Publicly-Trusted Certificates, v.1.1.6, from the CA/Browser Forum (https://cabforum.org);
specifically, section 10.2.3 ("Information Requirements").
```

这将生成如下文件：

```bash
devuser.csr  devuser-key.pem  devuser.pem
```

## 创建 kubeconfig 文件

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

我们现在查看 kubectl 的 context：

```bash
kubectl config get-contexts
CURRENT   NAME              CLUSTER           AUTHINFO        NAMESPACE
*         kubernetes        kubernetes        admin
          default-context   default-cluster   default-admin
```

显示的用户仍然是 admin，这是因为 kubectl 使用了 `$HOME/.kube/config` 文件作为了默认的 context 配置，我们只需要将其用刚生成的 `devuser.kubeconfig` 文件替换即可。

```bash
cp -f ./devuser.kubeconfig /root/.kube/config
```

关于 kubeconfig 文件的更多信息请参考 [使用 kubeconfig 文件配置跨集群认证](http://jimmysong.io/kubernetes-handbook/guide/authenticate-across-clusters-kubeconfig.html)。

## ClusterRoleBinding

如果我们想限制 devuser 用户的行为，需要使用 RBAC 将该用户的行为限制在某个或某几个 namespace 空间范围内，例如：

```bash
kubectl create rolebinding devuser-admin-binding --clusterrole=admin --user=devuser --namespace=dev
kubectl create rolebinding devuser-admin-binding --clusterrole=admin --user=devuser --namespace=test
```

这样 devuser 用户对 dev 和 test 两个 namespace 具有完全访问权限。

让我们来验证以下，现在我们在执行：

```bash
# 获取当前的 context
kubectl config get-contexts
CURRENT   NAME         CLUSTER      AUTHINFO   NAMESPACE
*         kubernetes   kubernetes   devuser    dev
*         kubernetes   kubernetes   devuser    test

# 无法访问 default namespace
kubectl get pods --namespace default
Error from server (Forbidden): User "devuser" cannot list pods in the namespace "default". (get pods)

# 默认访问的是 dev namespace，您也可以重新设置 context 让其默认访问 test namespace
kubectl get pods
No resources found.
```

现在 kubectl 命令默认使用的 context 就是 devuser 了，且该用户只能操作 dev 和 test 这两个 namespace，并拥有完全的访问权限。

关于角色绑定的更多信息请参考 [RBAC——基于角色的访问控制](http://jimmysong.io/kubernetes-handbook/guide/rbac.html)。

### 生成 token

需要创建一个admin用户并授予admin角色绑定，使用下面的yaml文件创建admin用户并赋予他管理员权限，然后可以通过token访问kubernetes，该文件见[admin-role.yaml](https://github.com/rootsongjc/kubernetes-handbook/tree/master/manifests/dashboard-1.7.1/admin-role.yaml)。

#### 生成kubernetes集群最高权限admin用户的token

以下是为集群最高权限的admin用户生成token的步骤。

首先创建一个如下名为`admin-role.yaml`文件。

```yaml
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: admin
  annotations:
    rbac.authorization.kubernetes.io/autoupdate: "true"
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
subjects:
- kind: ServiceAccount
  name: admin
  namespace: kube-system
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin
  namespace: kube-system
  labels:
    kubernetes.io/cluster-service: "true"
    addonmanager.kubernetes.io/mode: Reconcile
```

然后执行下面的命令创建 serviceaccount 和角色绑定，

```bash
kubectl create -f admin-role.yaml
```

创建完成后获取secret中token的值。

```bash
# 获取admin-token的secret名字
$ kubectl -n kube-system get secret|grep admin-token
admin-token-nwphb                          kubernetes.io/service-account-token   3         6m
# 获取token的值
$ kubectl -n kube-system describe secret admin-token-nwphb
Name:		admin-token-nwphb
Namespace:	kube-system
Labels:		<none>
Annotations:	kubernetes.io/service-account.name=admin
		kubernetes.io/service-account.uid=f37bd044-bfb3-11e7-87c0-f4e9d49f8ed0

Type:	kubernetes.io/service-account-token

Data
====
namespace:	11 bytes
token:		非常长的字符串
ca.crt:		1310 bytes
```

也可以使用 jsonpath 的方式直接获取 token 的值，如：

```bash
kubectl -n kube-system get secret admin-token-nwphb -o jsonpath={.data.token}|base64 -d
```

**注意**：yaml 输出里的那个 token 值是进行 base64 编码后的结果，一定要将 kubectl 的输出中的 token 值进行 `base64` 解码，在线解码工具 [base64decode](https://www.base64decode.org/)，Linux 和 Mac 有自带的 `base64` 命令也可以直接使用，输入  `base64` 是进行编码，Linux 中`base64 -d` 表示解码，Mac 中使用 `base64 -D`。

我们使用了 base64 对其重新解码，因为 secret 都是经过 base64 编码的，如果直接使用 kubectl 中查看到的 `token` 值会认证失败，详见 [secret 配置](../guide/secret-configuration.md)。关于 JSONPath 的使用请参考 [JSONPath 手册](https://kubernetes.io/docs/user-guide/jsonpath/)。

更简单的方式是直接使用`kubectl describe`命令获取token的内容（经过base64解码之后）：

```bash
kubectl describe secret admin-token-nwphb 
```

#### 为普通用户生成token

为指定namespace分配该namespace的最高权限，这通常是在为某个用户（组织或者个人）划分了namespace之后，需要给该用户创建token登陆kubernetes dashboard或者调用kubernetes API的时候使用。

每次创建了新的namespace下都会生成一个默认的token，名为`default-token-xxxx`。`default`就相当于该namespace下的一个用户，可以使用下面的命令给该用户分配该namespace的管理员权限。

```bash
kubectl create rolebinding $ROLEBINDING_NAME --clusterrole=admin --serviceaccount=$NAMESPACE:default --namespace=$NAMESPACE
```

- `$ROLEBINDING_NAME`必须是该namespace下的唯一的
- `admin`表示用户该namespace的管理员权限，关于使用`clusterrole`进行更细粒度的权限控制请参考[RBAC——基于角色的访问控制](https://jimmysong.io/kubernetes-handbook/concepts/rbac)。
- 我们给默认的serviceaccount `default`分配admin权限，这样就不要再创建新的serviceaccount，当然你也可以自己创建新的serviceaccount，然后给它admin权限

## 参考

- [JSONPath 手册](https://kubernetes.io/docs/user-guide/jsonpath/)
- [Kubernetes 中的认证](https://kubernetes.io/docs/admin/authentication/)

**注意：**本文已归档到 [kubernetes-handbook](http://jimmysong.io/kubernetes-handbook)，所有更新请以 handbook 为准。
