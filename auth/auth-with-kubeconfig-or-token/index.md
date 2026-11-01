---
weight: 7
title: "为用户签发证书与 kubeconfig：证书用户与 ServiceAccount token 认证实践"
linktitle: kubeconfig 与 token 认证实践
date: 2022-05-21T00:00:00+08:00
type: book
description: "动手实践 Kubernetes 的两种常用用户认证方式：用 CertificateSigningRequest API 为普通用户签发客户端证书并生成受限的 kubeconfig、用 RBAC 把用户绑定到指定命名空间并验证；以及为自动化与 Dashboard 场景创建 ServiceAccount 并获取短期或长期 token，附安全实践与常见问题。"
lastmod: 2026-11-01T00:00:00+08:00
aliases:
  - /book/kubernetes-handbook/security/auth-with-kubeconfig-or-token/
  - /book/kubernetes-handbook/security/kubectl-user-authentication-authorization/
  - /book/kubernetes-handbook/auth/kubectl-user-authentication-authorization/
---

> 把 kubectl 交给同事之前，先想清楚他是"一个人"还是"一段程序"——前者用证书 + kubeconfig，后者用 ServiceAccount token，混用是大多数权限事故的起点。

Kubernetes 本身不管理"用户"对象：普通用户（人）由外部身份体系或客户端证书表示，程序化身份则由 ServiceAccount 表示。本文以创建一个只能操作 `dev` 与 `test` 两个命名空间的 `devuser` 为例，完整演示证书签发、kubeconfig 生成与 RBAC 绑定的流程；再演示为自动化脚本与 Kubernetes Dashboard 创建 ServiceAccount 并获取 token。认证体系的整体概念见 [认证与鉴权](../authn-and-authz) 与 [用户与身份认证](../authentication)，kubeconfig 文件本身的结构见 [kubeconfig 与跨集群访问](../../access/authenticate-across-clusters-kubeconfig)。

## 两种方式的选择

{{< table title="证书用户与 ServiceAccount token 的适用场景" >}}

| 维度 | 客户端证书 + kubeconfig | ServiceAccount token |
|------|------------------------|----------------------|
| 身份类型 | 人（普通用户） | 程序、Pod、CI、Dashboard 登录 |
| 身份来源 | 证书的 CN 为用户名、O 为组 | `system:serviceaccount:<ns>:<name>` |
| 有效期 | 签发时确定，到期需重新签发；不能吊销（除非更换 CA） | `kubectl create token` 默认 1 小时，可指定；长期 Secret token 可随时删除 |
| 生产建议 | 小团队或临时访问；大团队应改用 OIDC（见 [结构化认证配置](../structured-authentication-authorization)） | 自动化场景的标准做法；优先短期 token |

{{< /table >}}

## 为普通用户签发证书

Kubernetes 提供了 `certificates.k8s.io/v1` 的 CertificateSigningRequest（CSR）API，由集群 CA 为用户签发客户端证书，无需在控制面节点上直接操作 CA 私钥，也无需 cfssl 等外部工具。

### 生成私钥与 CSR

```bash
openssl genrsa -out devuser.key 2048
# CN 为用户名，O 为组（可多个 -subj "/CN=devuser/O=dev-team/O=qa-team"）
openssl req -new -key devuser.key -out devuser.csr -subj "/CN=devuser/O=dev-team"
```

### 提交并批准 CSR

```bash
cat <<EOT | kubectl apply -f -
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
  name: devuser
spec:
  request: $(base64 < devuser.csr | tr -d '\n')
  signerName: kubernetes.io/kube-apiserver-client
  expirationSeconds: 7776000        # 90 天；最小 600 秒，实际上限受 CA 与签名者配置约束
  usages:
  - client auth
EOT

kubectl certificate approve devuser
kubectl get csr devuser -o jsonpath='{.status.certificate}' | base64 -d > devuser.crt
```

`kubernetes.io/kube-apiserver-client` 签名者不会被控制器自动批准，必须由持有 `certificatesigningrequests/approval` 权限的管理员显式批准，这正是审批环节的意义所在。批准后 `status.certificate` 中即为签好的 PEM 证书。

## 生成受限的 kubeconfig

用 `kubectl config` 子命令把集群信息、用户凭据与上下文写入独立文件，`--embed-certs=true` 把证书内容内嵌，便于分发单个文件：

```bash
APISERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
kubectl config view --minify --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}' | base64 -d > ca.crt

kubectl config set-cluster kubernetes \
  --server="$APISERVER" --certificate-authority=ca.crt --embed-certs=true \
  --kubeconfig=devuser.kubeconfig

kubectl config set-credentials devuser \
  --client-certificate=devuser.crt --client-key=devuser.key --embed-certs=true \
  --kubeconfig=devuser.kubeconfig

kubectl config set-context devuser@kubernetes \
  --cluster=kubernetes --user=devuser --namespace=dev \
  --kubeconfig=devuser.kubeconfig

kubectl config use-context devuser@kubernetes --kubeconfig=devuser.kubeconfig
```

把 `devuser.kubeconfig` 交给用户后，对方通过 `export KUBECONFIG=~/devuser.kubeconfig` 或 `kubectl --kubeconfig` 使用；不建议直接覆盖 `~/.kube/config`。

## 用 RBAC 限定权限

证书只解决"你是谁"，此时 `devuser` 没有任何权限。用 RoleBinding 把内置的 `admin` ClusterRole 绑定到两个命名空间：

```bash
kubectl create rolebinding devuser-admin --clusterrole=admin --user=devuser --namespace=dev
kubectl create rolebinding devuser-admin --clusterrole=admin --user=devuser --namespace=test
```

若证书中声明了组（`O=dev-team`），更推荐按组绑定（`--group=dev-team`），新成员只需签发同组证书而无需改动 RBAC。内置 ClusterRole 的含义与自定义角色的写法见 [RBAC](../rbac)。

### 验证

```bash
# 以 devuser 身份查看权限
kubectl --kubeconfig=devuser.kubeconfig auth whoami
kubectl --kubeconfig=devuser.kubeconfig auth can-i list pods -n dev        # yes
kubectl --kubeconfig=devuser.kubeconfig auth can-i list pods -n default    # no

# 管理员也可以模拟用户检查
kubectl auth can-i create deployments -n test --as devuser
```

直接访问未授权命名空间会得到：

```text
Error from server (Forbidden): pods is forbidden: User "devuser" cannot list resource "pods" in API group "" in the namespace "default"
```

## ServiceAccount 与 token

自动化脚本、CI 流水线与 Dashboard 登录应使用 ServiceAccount。下面创建一个只在 `dev` 命名空间具有管理权限的 ServiceAccount，以及一个集群管理员 ServiceAccount（仅用于演示 Dashboard 登录，生产环境应避免授予 `cluster-admin`）。

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: dev-deployer
  namespace: dev
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: dev-deployer-admin
  namespace: dev
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: admin
subjects:
- kind: ServiceAccount
  name: dev-deployer
  namespace: dev
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: dashboard-admin
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: dashboard-admin
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: dashboard-admin
  namespace: kube-system
```

### 获取短期 token（推荐）

自 v1.24 起 ServiceAccount 不再自动生成长期 Secret token，标准做法是按需签发短期 token：

```bash
kubectl -n dev create token dev-deployer --duration=1h
kubectl -n kube-system create token dashboard-admin --duration=24h
```

输出即为可直接使用的 JWT，无需 base64 解码。token 到期后重新签发即可；需要受众限制时可加 `--audience`。

### 获取长期 token（谨慎使用）

确有需要（如无法定期刷新凭据的旧系统）时，可手动创建 `kubernetes.io/service-account-token` 类型的 Secret，控制器会为其填充 token：

```bash
kubectl -n dev apply -f - <<EOT
apiVersion: v1
kind: Secret
metadata:
  name: dev-deployer-token
  annotations:
    kubernetes.io/service-account.name: dev-deployer
type: kubernetes.io/service-account-token
EOT

kubectl -n dev get secret dev-deployer-token -o jsonpath='{.data.token}' | base64 -d
```

Secret 中的 token 是 base64 编码的，必须解码后使用（`base64 -d`，较老的 macOS 为 `base64 -D`）。删除该 Secret 即可吊销 token，这是长期 token 相对证书的一个优势。

### 用 token 生成 kubeconfig

```bash
kubectl config set-credentials dev-deployer --token="$(kubectl -n dev create token dev-deployer --duration=8h)" --kubeconfig=deployer.kubeconfig
kubectl config set-cluster kubernetes --server="$APISERVER" --certificate-authority=ca.crt --embed-certs=true --kubeconfig=deployer.kubeconfig
kubectl config set-context deployer --cluster=kubernetes --user=dev-deployer --namespace=dev --kubeconfig=deployer.kubeconfig
kubectl config use-context deployer --kubeconfig=deployer.kubeconfig
```

### Dashboard 登录

Kubernetes Dashboard 的登录页支持直接粘贴 Bearer token，或上传 kubeconfig；若使用 kubeconfig 登录，文件中的用户凭据必须是 `token` 字段（Dashboard 不会使用客户端证书），这与 kubectl 既支持证书也支持 token 不同。更多见 [Kubernetes Dashboard](../../access/kubernetes-dashboard)。

## 安全实践

- **最小权限**：优先绑定命名空间级的 `admin`/`edit`/`view`，避免 `cluster-admin`；需要跨命名空间只读时用 `view` 的 ClusterRoleBinding
- **按组授权**：证书用 `O=` 声明组、OIDC 用组声明，RBAC 绑定到组而非个人
- **短有效期**：证书 `expirationSeconds` 不超过 90 天，token 优先用 `create token`；记住客户端证书无法吊销，离职人员的证书只能等待过期或轮换 CA
- **审计**：开启 [审计日志](../../security/audit-logging) 追踪 `devuser` 与各 ServiceAccount 的操作
- **妥善分发**：kubeconfig 含私钥或 token，应通过密码管理器或密钥管理系统分发，不要放进聊天工具或 Git 仓库
- **规模化后迁移到 OIDC**：人员超过十余人时，证书的签发与过期管理会成为负担，应接入企业 IdP 并用 [结构化认证配置](../structured-authentication-authorization) 映射用户与组

## 总结

为普通用户签发客户端证书、生成独立的 kubeconfig、再用 RBAC 限定命名空间，是把 kubectl 安全地交给他人的标准流程；CSR API 让这一流程无需触碰 CA 私钥即可完成。程序化访问则应使用 ServiceAccount 并以 `kubectl create token` 签发短期 token，长期 Secret token 只在无法刷新凭据的场景保留。两种方式都只回答"你是谁"，权限边界始终由 RBAC 决定。

## 参考文献

- [Certificate Signing Requests: Normal user - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/certificate-signing-requests/#normal-user)
- [Configure Access to Multiple Clusters - kubernetes.io](https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/)
- [Managing Service Accounts - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)
- [Using RBAC Authorization - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [Kubernetes Dashboard: Access Control - github.com](https://github.com/kubernetes/dashboard/blob/master/docs/user/access-control/README.md)
