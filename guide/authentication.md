# Kubernetes 中的用户与身份认证授权

在安装集群的时候我们在 master 节点上生成了一堆证书、token，还在 kubelet 的配置中用到了 bootstrap token，安装各种应用时，为了能够与 API server 通信创建了各种 service account，在 Dashboard 中使用了 kubeconfig 或 token 登陆，那么这些都属于什么认证方式？如何区分用户的？我特地翻译了下这篇官方文档，想你看了之后你将找到答案。

重点查看 bearer token 和 HTTP 认证中的 token 使用，我们已经有所应用，如 [使用kubeconfig或token进行用户身份认证](auth-with-kubeconfig-or-token.md)。

## 认识 Kubernetes 中的用户

Kubernetes 集群中包含两类用户：一类是由 Kubernetes 管理的 service account，另一类是普通用户。

普通用户被假定为由外部独立服务管理。管理员分发私钥，用户存储（如 Keystone 或 Google 帐户），甚至包含用户名和密码列表的文件。在这方面，_Kubernetes 没有代表普通用户帐户的对象_。无法通过 API 调用的方式向集群中添加普通用户。

相对的，service account 是由 Kubernetes API 管理的帐户。它们都绑定到了特定的 namespace，并由 API server 自动创建，或者通过 API 调用手动创建。Service account 关联了一套凭证，存储在 `Secret`，这些凭证同时被挂载到 pod 中，从而允许 pod 与 kubernetes API 之间的调用。

API 请求被绑定到普通用户或 serivce account 上，或者作为匿名请求对待。这意味着集群内部或外部的每个进程，无论从在工作站上输入 `kubectl` 的人类用户到节点上的 `kubelet`，到控制平面的成员，都必须在向 API Server 发出请求时进行身份验证，或者被视为匿名用户。

## 认证策略

Kubernetes 使用客户端证书、bearer token、身份验证代理或者 HTTP 基本身份验证等身份认证插件来对 API 请求进行身份验证。当有 HTTP 请求发送到 API server 时，插件会尝试将以下属性关联到请求上：

- 用户名：标识最终用户的字符串。常用值可能是 `kube-admin` 或 `jane@example.com`。
- UID：标识最终用户的字符串，比用户名更加一致且唯一。
- 组：一组将用户和常规用户组相关联的字符串。
- 额外字段：包含其他有用认证信息的字符串列表的映射。

所有的值对于认证系统都是不透明的，只有 [授权人](https://kubernetes.io/docs/admin/authorization/) 才能解释这些值的重要含义。

您可以一次性启用多种身份验证方式。通常使用至少以下两种认证方式：

- 服务帐户的 service account token
- 至少一种其他的用户认证的方式

当启用了多个认证模块时，第一个认证模块成功认证后将短路请求，不会进行第二个模块的认证。API server 不会保证认证的顺序。

`system:authenticated` 组包含在所有已验证用户的组列表中。

与其他身份验证协议（LDAP、SAML、Kerberos、x509 方案等）的集成可以使用 [身份验证代理](#authenticating-proxy) 或 [身份验证 webhook](#webhook-token-authentication) 来实现。

### X509 客户端证书

通过将 `--client-ca-file=SOMEFILE` 选项传递给 API server 来启用客户端证书认证。引用的文件必须包含一个或多个证书颁发机构，用于验证提交给 API server 的客户端证书。如果客户端证书已提交并验证，则使用 subject 的 Common Name（CN）作为请求的用户名。从 Kubernetes 1.4开始，客户端证书还可以使用证书的 organization 字段来指示用户的组成员身份。要为用户包含多个组成员身份，请在证书中包含多个 organization 字段。

例如，使用 `openssl` 命令工具生成用于签名认证请求的证书：

```bash
openssl req -new -key jbeda.pem -out jbeda-csr.pem -subj "/CN=jbeda/O=app1/O=app2"
```

这将为一个用户名为 ”jbeda“ 的 CSR，属于两个组“app1”和“app2”。

如何生成客户端证书请参阅 [附录](#appendix)。

### 静态 Token 文件

当在命令行上指定 `--token-auth-file=SOMEFILE` 选项时，API server 从文件读取 bearer token。目前，token 会无限期地持续下去，并且不重新启动 API server 的话就无法更改令牌列表。

token 文件是一个 csv 文件，每行至少包含三列：token、用户名、用户 uid，其次是可选的组名。请注意，如果您有多个组，则该列必须使用双引号。

```ini
token,user,uid,"group1,group2,group3"
```

#### 在请求中放置 Bearer Token

当使用来自 http 客户端的 bearer token 时，API server 期望 `Authorization` header 中包含 `Bearer token` 的值。Bearer token 必须是一个字符串序列，只需使用 HTTP 的编码和引用功能就可以将其放入到 HTTP header 中。例如：如果 bearer token 是 `31ada4fd-adec-460c-809a-9e56ceb75269`，那么它将出现在 HTTP header 中，如下所示：

```http
Authorization: Bearer 31ada4fd-adec-460c-809a-9e56ceb75269
```

### Bootstrap Token

该功能仍处于 **alpha** 版本。

为了简化新集群的初始化引导过程，Kubernetes 中包含了一个名为 *Bootstrap Token* 的动态管理的 bearer token。这些 token 使用 Secret 存储在 `kube-system` namespace 中，在那里它们可以被动态管理和创建。Controller Manager 中包含了一个 TokenCleaner 控制器，用于在 bootstrap token 过期时删除将其删除。

这些 token 的形式是 `[a-z0-9]{6}.[a-z0-9]{16}`。第一部分是 Token ID，第二部分是 Token Secret。您在 HTTP header 中指定的 token 如下所示：

```http
Authorization: Bearer 781292.db7bc3a58fc5f07e
```

在 API server 的启动参数中加上  `--experimental-bootstrap-token-auth` 标志以启用 Bootstrap Token Authenticator。您必须通过 Controller Manager 上的 `--controllers` 标志启用 TokenCleaner 控制器，如 `--controllers=*,tokencleaner`。如果您使用它来引导集群， `kubeadm` 会为您完成。

认证者认证为 `system:bootstrap:<Token ID>` 。被包含在 `system:bootstrappers` 组中。命名和组是有意限制用户使用过去的 bootstap token。可以使用用户名和组（`kubeadm` 使用）来制定适当的授权策略以支持引导集群。 

有关 Bootstrap Token 身份验证器和控制器的更深入的文档，以及如何使用 `kubeadm` 管理这些令牌，请参阅 [Bootstrap Token](https://kubernetes.io/docs/admin/bootstrap-tokens/)。

### 静态密码文件

通过将 `--basic-auth-file=SOMEFILE` 选项传递给 API server 来启用基本身份验证。目前，基本身份验证凭证将无限期地保留，并且密码在不重新启动API服务器的情况下无法更改。请注意，为了方便起见，目前支持基本身份验证，而上述模式更安全更容易使用。

基本身份认证是一个 csv 文件，至少包含3列：密码、用户名和用户 ID。在 Kubernetes 1.6 和更高版本中，可以指定包含以逗号分隔的组名称的可选第四列。如果您有多个组，则必须将第四列值用双引号（“）括起来，请参阅以下示例：

```ini
password,user,uid,"group1,group2,group3"
```

当使用来自 HTTP 客户端的基本身份验证时，API server 需要` Authorization` header 中包含 `Basic BASE64ENCODED(USER:PASSWORD)` 的值。

### Service Account Token

Service account 是一个自动启用的验证器，它使用签名的 bearer token 来验证请求。该插件包括两个可选的标志：

- `--service-account-key-file`  一个包含签名 bearer token 的 PEM 编码文件。如果未指定，将使用 API server 的 TLS 私钥。
- `--service-account-lookup` 如果启用，从 API 中删除掉的 token 将被撤销。

Service account 通常 API server 自动创建，并通过 `ServiceAccount` [注入控制器](https://kubernetes.io/docs/admin/admission-controllers/) 关联到集群中运行的 Pod 上。Bearer token 挂载到 pod 中众所周知的位置，并允许集群进程与 API server 通信。 帐户可以使用 `PodSpec` 的 `serviceAccountName` 字段显式地与Pod关联。

注意： `serviceAccountName` 通常被省略，因为这会自动生成。

```yaml
apiVersion: apps/v1beta2
kind: Deployment
metadata:
  name: nginx-deployment
  namespace: default
spec:
  replicas: 3
  template:
    metadata:
    # ...
    spec:
      containers:
      - name: nginx
        image: nginx:1.7.9
        serviceAccountName: bob-the-bot
```

Service account bearer token 在集群外使用也是完全有效的，并且可以用于为希望与 Kubernetes 通信的长期运行作业创建身份。要手动创建 service account，只需要使用 `kubectl create serviceaccount (NAME)` 命令。这将在当前的 namespace 和相关连的 secret 中创建一个 service account。

```bash
$ kubectl create serviceaccount jenkins
serviceaccount "jenkins" created
$ kubectl get serviceaccounts jenkins -o yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  # ...
secrets:
- name: jenkins-token-1yvwg
```

创建出的 secret 中拥有 API server 的公共 CA 和前面的 JSON Web Token（JWT）。

```bash
$ kubectl get secret jenkins-token-1yvwg -o yaml
apiVersion: v1
data:
  ca.crt: (APISERVER'S CA BASE64 ENCODED)
  namespace: ZGVmYXVsdA==
  token: (BEARER TOKEN BASE64 ENCODED)
kind: Secret
metadata:
  # ...
type: kubernetes.io/service-account-token
```

注意：所有值是基于 base64 编码的，因为 secret 总是基于 base64 编码。

经过签名的 JWT 可以用作 bearer token 与给定的 service account 进行身份验证。请参阅 [上面](#putting-a-bearer-token-in-a-request) 关于如何在请求中放置 bearer token。通常情况下，这些 secret 被挂载到 pod 中，以便对集群内的 API server 进行访问，但也可以从集群外访问。

Service account 验证时用户名 `system:serviceaccount:(NAMESPACE):(SERVICEACCOUNT)`，被指定到组 `system:serviceaccounts` 和 `system:serviceaccounts:(NAMESPACE)`。

注意：由于 service account 的 token 存储在 secret 中，所以具有对这些 secret 的读取权限的任何用户都可以作为 service account 进行身份验证。授予 service account 权限和读取 secret 功能时要谨慎。

### OpenID Connect Token

[OpenID Connect](https://openid.net/connect/) 是由 OAuth2 供应商提供的 OAuth2，特别是 Azure Active Directory、Salesforce 和 Google。对 OAuth2 协议的主要扩展是返回一个称作 [ID Token](https://openid.net/specs/openid-connect-core-1_0.html#IDToken) 的格外字段。该 token 是一个 JSON Web Token (JWT) ，有服务器签名，具有众所周知的字段，如用户的电子邮件。

为了识别用户，认证者使用 OAuth2 [token 响应](https://openid.net/specs/openid-connect-core-1_0.html#TokenResponse) 中的 `id_token`（而不是 `access_token`）作为 bearer token。请参阅 [上面](#putting-a-bearer-token-in-a-request) 的关于将 token 置于请求中。

![Kubernetes OpenID Connect Flow](../images/kubernetes-oidc-login.jpg)

1. 登陆到您的身份提供商
2. 您的身份提供商将为您提供一个 `access_token`，一个 `id_token` 和一个 `refresh_token`
3. 当使用 `kubectl` 时，使用 `--token` 标志和  `id_token` ，或者直接加入到您的 `kubeconfig` 文件中
4. `kubectl` 在调用 API server 时将 `id_token` 置于 HTTP header 中
5. API server 将通过检查配置中指定的证书来确保 JWT 签名有效
6. 检查以确保 `id_token` 没有过期
7. 确保用户已授权
8. 授权 API server 后向 `kubectl` 
9. `kubectl` 向用户提供反馈

由于所有需要验证您身份的数据都在 `id_token` 中，Kubernetes 不需要向身份提供商 “phone home”。在每个请求都是无状态的模型中，这为认证提供了非常可扩展的解决方案。它确实提供了一些挑战：

1. Kubernetes 没有 ”web 接口“ 来出发验证进程。没有浏览器或界面来收集凭据，这就是为什么您需要首先认证您的身份提供商。
2. `id_token` 无法撤销，就像一个证书，所以它应该是短暂的（只有几分钟），所以每隔几分钟就得到一个新的令牌是非常烦人的。
3. 没有使用 `kubectl proxy` 命令或注入 `id_token` 的反向代理，无法简单地对 Kubernetes dashboard 进行身份验证。

#### 配置 API Server

要启用该插件，需要在 API server 中配置如下标志：

| 参数                      | 描述                                       | 示例                                       | 是否必需 |
| ----------------------- | ---------------------------------------- | ---------------------------------------- | ---- |
| `--oidc-issuer-url`     | 允许 API server 发现公共签名密钥的提供者的 URL。只接受使用 `https://` 的方案。通常是提供商的 URL 地址，不包含路径，例如“https://accounts.google.com” 或者 “https://login.salesforce.com”。这个 URL 应该指向下面的 .well-known/openid-configuration | 如果发现 URL 是 `https://accounts.google.com/.well-known/openid-configuration`，值应该是`https://accounts.google.com` | 是    |
| `--oidc-client-id`      | 所有的 token 必须为其颁发的客户端 ID                  | kubernetes                               | 是    |
| `--oidc-username-claim` | JWT声明使用的用户名。默认情况下，`sub` 是最终用户的唯一标识符。管理员可以选择其他声明，如` email` 或 `name`，具体取决于他们的提供者。不过，`email` 以外的其他声明将以发行者的 URL 作为前缀，以防止与其他插件命名冲突。 | sub                                      | 否    |
| `--oidc-groups-claim`   | JWT声明使用的用户组。如果生命存在，它必须是一个字符串数组。          | groups                                   | 否    |
| `--oidc-ca-file`        | 用来签名您的身份提供商的网络 CA 证书的路径。默认为主机的跟 CA。      | `/etc/kubernetes/ssl/kc-ca.pem`          | 否    |

如果为 `--oidc-username-claim` 选择了除 `email` 以外的其他声明，则该值将以 `--oidc-issuer-url` 作为前缀，以防止与现有 Kubernetes 名称（例如 `system:users`）冲突。例如，如果提供商网址是 https://accounts.google.com，而用户名声明映射到 `jane`，则插件会将用户身份验证为：

```http
https://accounts.google.com#jane
```

重要的是，API server 不是 OAuth2 客户端，而只能配置为信任单个发行者。这允许使用 Google 等公共提供者，而不必信任第三方发行的凭据。希望利用多个 OAuth 客户端的管理员应该探索支持 `azp`（授权方）声明的提供者，这是允许一个客户端代表另一个客户端发放令牌的机制。

Kubernetes不提供 OpenID Connect 身份提供商。您可以使用现有的公共 OpenID Connect 标识提供程序（例如Google 或 [其他](http://connect2id.com/products/nimbus-oauth-openid-connect-sdk/openid-connect-providers)）。或者，您可以运行自己的身份提供程序，例如 CoreOS [dex](https://github.com/coreos/dex)、[Keycloak](https://github.com/keycloak/keycloak)、CloudFoundry [UAA](https://github.com/cloudfoundry/uaa) 或 Tremolo Security 的 [OpenUnison](https://github.com/tremolosecurity/openunison)。

对于身份提供商能够适用于 Kubernetes，必须满足如下条件：Kubernetes it must:

1. 支持 [OpenID connect 发现](https://openid.net/specs/openid-connect-discovery-1_0.html)；不必是全部。
2. 使用非过时密码在TLS中运行
3. 拥有 CA 签名证书（即使 CA 不是商业 CA 或自签名）

有关上述要求3的说明，需要 CA 签名证书。如果您部署自己的身份提供商（而不是像 Google 或 Microsoft 之类的云提供商），则必须让您的身份提供商的 Web 服务器证书由 CA 标志设置为 TRUE 的证书签名，即使是自签名的。这是由于 GoLang 的 TLS 客户端实现对证书验证的标准非常严格。如果您没有 `CA`，可以使用 `CoreOS` 团队的 [这个脚本](https://github.com/coreos/dex/blob/1ee5920c54f5926d6468d2607c728b71cfe98092/examples/k8s/gencert.sh) 创建一个简单的 CA 和一个签名的证书和密钥对。

或者你可以使用 [这个类似的脚本](https://raw.githubusercontent.com/TremoloSecurity/openunison-qs-kubernetes/master/makecerts.sh) 来生成更长寿命和更长的 SHA256 证书密钥。

针对特定系统的安装说明：

- [UAA](http://apigee.com/about/blog/engineering/kubernetes-authentication-enterprise)
- [Dex](https://speakerdeck.com/ericchiang/kubernetes-access-control-with-dex)
- [OpenUnison](https://github.com/TremoloSecurity/openunison-qs-kubernetes)

#### 使用 kubectl

##### 选项 1 - OIDC 身份验证器

第一个选项是使用 `oidc` 身份验证器。此身份验证程序将您的 `id_token`、`refresh_token` 和您的 OIDC `client_secret` 自动刷新您的 token。一旦您对身份提供者进行了身份验证：

```bash
kubectl config set-credentials USER_NAME \
   --auth-provider=oidc \
   --auth-provider-arg=idp-issuer-url=( issuer url ) \
   --auth-provider-arg=client-id=( your client id ) \
   --auth-provider-arg=client-secret=( your client secret ) \
   --auth-provider-arg=refresh-token=( your refresh token ) \
   --auth-provider-arg=idp-certificate-authority=( path to your ca certificate ) \
   --auth-provider-arg=id-token=( your id_token ) \
   --auth-provider-arg=extra-scopes=( comma separated list of scopes to add to "openid email profile", optional )
```

例如，在向身份提供者进行身份验证之后运行以下命令：

```bash
kubectl config set-credentials mmosley  \
        --auth-provider=oidc  \
        --auth-provider-arg=idp-issuer-url=https://oidcidp.tremolo.lan:8443/auth/idp/OidcIdP  \
        --auth-provider-arg=client-id=kubernetes  \
        --auth-provider-arg=client-secret=1db158f6-177d-4d9c-8a8b-d36869918ec5  \
        --auth-provider-arg=refresh-token=q1bKLFOyUiosTfawzA93TzZIDzH2TNa2SMm0zEiPKTUwME6BkEo6Sql5yUWVBSWpKUGphaWpxSVAfekBOZbBhaEW+VlFUeVRGcluyVF5JT4+haZmPsluFoFu5XkpXk5BXqHega4GAXlF+ma+vmYpFcHe5eZR+slBFpZKtQA= \
        --auth-provider-arg=idp-certificate-authority=/root/ca.pem \
        --auth-provider-arg=extra-scopes=groups \
        --auth-provider-arg=id-token=eyJraWQiOiJDTj1vaWRjaWRwLnRyZW1vbG8ubGFuLCBPVT1EZW1vLCBPPVRybWVvbG8gU2VjdXJpdHksIEw9QXJsaW5ndG9uLCBTVD1WaXJnaW5pYSwgQz1VUy1DTj1rdWJlLWNhLTEyMDIxNDc5MjEwMzYwNzMyMTUyIiwiYWxnIjoiUlMyNTYifQ.eyJpc3MiOiJodHRwczovL29pZGNpZHAudHJlbW9sby5sYW46ODQ0My9hdXRoL2lkcC9PaWRjSWRQIiwiYXVkIjoia3ViZXJuZXRlcyIsImV4cCI6MTQ4MzU0OTUxMSwianRpIjoiMm96US15TXdFcHV4WDlHZUhQdy1hZyIsImlhdCI6MTQ4MzU0OTQ1MSwibmJmIjoxNDgzNTQ5MzMxLCJzdWIiOiI0YWViMzdiYS1iNjQ1LTQ4ZmQtYWIzMC0xYTAxZWU0MWUyMTgifQ.w6p4J_6qQ1HzTG9nrEOrubxIMb9K5hzcMPxc9IxPx2K4xO9l-oFiUw93daH3m5pluP6K7eOE6txBuRVfEcpJSwlelsOsW8gb8VJcnzMS9EnZpeA0tW_p-mnkFc3VcfyXuhe5R3G7aa5d8uHv70yJ9Y3-UhjiN9EhpMdfPAoEB9fYKKkJRzF7utTTIPGrSaSU6d2pcpfYKaxIwePzEkT4DfcQthoZdy9ucNvvLoi1DIC-UocFD8HLs8LYKEqSxQvOcvnThbObJ9af71EwmuE21fO5KzMW20KtAeget1gnldOosPtz1G5EwvaQ401-RPQzPGMVBld0_zMCAwZttJ4knw
```

将产生下面的配置：

```yaml
users:
- name: mmosley
  user:
    auth-provider:
      config:
        client-id: kubernetes
        client-secret: 1db158f6-177d-4d9c-8a8b-d36869918ec5
        extra-scopes: groups
        id-token: eyJraWQiOiJDTj1vaWRjaWRwLnRyZW1vbG8ubGFuLCBPVT1EZW1vLCBPPVRybWVvbG8gU2VjdXJpdHksIEw9QXJsaW5ndG9uLCBTVD1WaXJnaW5pYSwgQz1VUy1DTj1rdWJlLWNhLTEyMDIxNDc5MjEwMzYwNzMyMTUyIiwiYWxnIjoiUlMyNTYifQ.eyJpc3MiOiJodHRwczovL29pZGNpZHAudHJlbW9sby5sYW46ODQ0My9hdXRoL2lkcC9PaWRjSWRQIiwiYXVkIjoia3ViZXJuZXRlcyIsImV4cCI6MTQ4MzU0OTUxMSwianRpIjoiMm96US15TXdFcHV4WDlHZUhQdy1hZyIsImlhdCI6MTQ4MzU0OTQ1MSwibmJmIjoxNDgzNTQ5MzMxLCJzdWIiOiI0YWViMzdiYS1iNjQ1LTQ4ZmQtYWIzMC0xYTAxZWU0MWUyMTgifQ.w6p4J_6qQ1HzTG9nrEOrubxIMb9K5hzcMPxc9IxPx2K4xO9l-oFiUw93daH3m5pluP6K7eOE6txBuRVfEcpJSwlelsOsW8gb8VJcnzMS9EnZpeA0tW_p-mnkFc3VcfyXuhe5R3G7aa5d8uHv70yJ9Y3-UhjiN9EhpMdfPAoEB9fYKKkJRzF7utTTIPGrSaSU6d2pcpfYKaxIwePzEkT4DfcQthoZdy9ucNvvLoi1DIC-UocFD8HLs8LYKEqSxQvOcvnThbObJ9af71EwmuE21fO5KzMW20KtAeget1gnldOosPtz1G5EwvaQ401-RPQzPGMVBld0_zMCAwZttJ4knw
        idp-certificate-authority: /root/ca.pem
        idp-issuer-url: https://oidcidp.tremolo.lan:8443/auth/idp/OidcIdP
        refresh-token: q1bKLFOyUiosTfawzA93TzZIDzH2TNa2SMm0zEiPKTUwME6BkEo6Sql5yUWVBSWpKUGphaWpxSVAfekBOZbBhaEW+VlFUeVRGcluyVF5JT4+haZmPsluFoFu5XkpXk5BXq
      name: oidc
```

一旦您的 `id_token` 过期，`kubectl` 将使用 `refresh_token` 刷新 `id_token`，然后在 `kube/.config` 文件的`client_secret` 中存储 `id_token` 的值和`refresh_token` 的新值。

##### 选项 2 - 使用 `--token` 选项

可以在 `kubectl` 命令的 `--token` 选项中传入 token。简单的拷贝和复制 `id_token` 到该选项中：

```bash
kubectl --token=eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL21sYi50cmVtb2xvLmxhbjo4MDQzL2F1dGgvaWRwL29pZGMiLCJhdWQiOiJrdWJlcm5ldGVzIiwiZXhwIjoxNDc0NTk2NjY5LCJqdGkiOiI2RDUzNXoxUEpFNjJOR3QxaWVyYm9RIiwiaWF0IjoxNDc0NTk2MzY5LCJuYmYiOjE0NzQ1OTYyNDksInN1YiI6Im13aW5kdSIsInVzZXJfcm9sZSI6WyJ1c2VycyIsIm5ldy1uYW1lc3BhY2Utdmlld2VyIl0sImVtYWlsIjoibXdpbmR1QG5vbW9yZWplZGkuY29tIn0.f2As579n9VNoaKzoF-dOQGmXkFKf1FMyNV0-va_B63jn-_n9LGSCca_6IVMP8pO-Zb4KvRqGyTP0r3HkHxYy5c81AnIh8ijarruczl-TK_yF5akjSTHFZD-0gRzlevBDiH8Q79NAr-ky0P4iIXS8lY9Vnjch5MF74Zx0c3alKJHJUnnpjIACByfF2SCaYzbWFMUNat-K1PaUk5-ujMBG7yYnr95xD-63n8CO8teGUAAEMx6zRjzfhnhbzX-ajwZLGwGUBT4WqjMs70-6a7_8gZmLZb2az1cZynkFRj2BaCkVT3A2RrjeEwZEtGXlMqKJ1_I2ulrOVsYx01_yD35-rw get nodes
```

### Webhook Token 认证

Webhook 认证是用来认证 bearer token 的 hook。

- `--authentication-token-webhook-config-file` 是一个用来描述如何访问远程 webhook 服务的 kubeconfig 文件。
- `--authentication-token-webhook-cache-ttl` 缓存身份验证策略的时间。默认为两分钟。

配置文件使用 [kubeconfig](https://kubernetes.io/docs/concepts/cluster-administration/authenticate-across-clusters-kubeconfig/) 文件格式。文件中的 ”user“ 指的是 API server 的 webhook，”clusters“ 是指远程服务。见下面的例子：

```yaml
# clusters refers to the remote service.
clusters:
  - name: name-of-remote-authn-service
    cluster:
      certificate-authority: /path/to/ca.pem         # CA for verifying the remote service.
      server: https://authn.example.com/authenticate # URL of remote service to query. Must use 'https'.

# users refers to the API server's webhook configuration.
users:
  - name: name-of-api-server
    user:
      client-certificate: /path/to/cert.pem # cert for the webhook plugin to use
      client-key: /path/to/key.pem          # key matching the cert

# kubeconfig files require a context. Provide one for the API server.
current-context: webhook
contexts:
- context:
    cluster: name-of-remote-authn-service
    user: name-of-api-sever
  name: webhook
```

当客户端尝试使用 bearer token 与API server 进行认证是，如 [上](#putting-a-bearer-token-in-a-request) 论述，认证 webhook 用饱含该 token 的对象查询远程服务。Kubernetes 不会挑战缺少该 header 的请求。

请注意，webhook API对象与其他 Kubernetes API 对象具有相同的 [版本控制兼容性规则](https://kubernetes.io/docs/concepts/overview/kubernetes-api/)。实现者应该意识到 Beta 对象的宽松兼容性承诺，并检查请求的 “apiVersion” 字段以确保正确的反序列化。此外，API server 必须启用 `authentication.k8s.io/v1beta1` API 扩展组（`--runtime config =authentication.k8s.io/v1beta1=true`）。

The request body will be of the following format:

```json
{
  "apiVersion": "authentication.k8s.io/v1beta1",
  "kind": "TokenReview",
  "spec": {
    "token": "(BEARERTOKEN)"
  }
}
```

预计远程服务将填写请求的 `status` 字段以指示登录成功。响应主体的 `spec` 字段被忽略，可以省略。成功验证后的 bearer token 将返回：

```json
{
  "apiVersion": "authentication.k8s.io/v1beta1",
  "kind": "TokenReview",
  "status": {
    "authenticated": true,
    "user": {
      "username": "janedoe@example.com",
      "uid": "42",
      "groups": [
        "developers",
        "qa"
      ],
      "extra": {
        "extrafield1": [
          "extravalue1",
          "extravalue2"
        ]
      }
    }
  }
}
```

未成功的请求将返回：

```json
{
  "apiVersion": "authentication.k8s.io/v1beta1",
  "kind": "TokenReview",
  "status": {
    "authenticated": false
  }
}
```

HTTP状态代码可以用来提供额外的错误上下文。

### 认证代理

可以配置 API server 从请求 header 的值中识别用户，例如 `X-Remote-User`。这样的设计是用来与请求 header 值的验证代理结合使用。

- `--requestheader-username-headers` 必需，大小写敏感。按 header 名称和顺序检查用户标识。包含值的第一个 header 将被作为用户名。
- `--requestheader-group-headers` 1.6 以上版本。可选。大小写敏感。建议为 “X-Remote-Group”。按 header 名称和顺序检查用户组。所有指定的 header 中的所有值都将作为组名。 
- `--requestheader-extra-headers-prefix` 1.6 以上版本。可选，大小写敏感。建议为 “X-Remote-Extra-”。标题前缀可用于查找有关用户的额外信息（通常由配置的授权插件使用）。以任何指定的前缀开头的 header 都会删除前缀，header 名称的其余部分将成为额外的键值，而 header 值则是额外的值。

例如下面的配置：

```bash
--requestheader-username-headers=X-Remote-User
--requestheader-group-headers=X-Remote-Group
--requestheader-extra-headers-prefix=X-Remote-Extra-
```

该请求：

```http
GET / HTTP/1.1
X-Remote-User: fido
X-Remote-Group: dogs
X-Remote-Group: dachshunds
X-Remote-Extra-Scopes: openid
X-Remote-Extra-Scopes: profile
```

将产生如下的用户信息：

```yaml
name: fido
groups:
- dogs
- dachshunds
extra:
  scopes:
  - openid
  - profile
```

为了防止 header 欺骗，验证代理需要在验证请求 header 之前向 API server 提供有效的客户端证书，以对照指定的 CA 进行验证。

- `--requestheader-client-ca-file` 必需。PEM 编码的证书包。在检查用户名的请求 header 之前，必须针对指定文件中的证书颁发机构提交并验证有效的客户端证书。
- `--requestheader-allowed-names` 可选。Common Name （cn）列表。如果设置了，则在检查用户名的请求 header 之前， 必须提供指定列表中 Common Name（cn）的有效客户端证书。如果为空，则允许使用任何 Common Name。

### Keystone 密码

通过在启动过程中将 `--experimental-keystone-url=<AuthURL>` 选项传递给 API server 来启用 Keystone 认证。该插件在 `plugin/pkg/auth/authenticator/password/keystone/keystone.go` 中实现，目前使用基本身份验证通过用户名和密码验证用户。

如果您为 Keystone 服务器配置了自签名证书，则在启动 Kubernetes API server 时可能需要设置 `--experimental-keystone-ca-file=SOMEFILE` 选项。如果您设置了该选项，Keystone 服务器的证书将由`experimental-keystone-ca-file` 中的某个权威机构验证。否则，证书由主机的根证书颁发机构验证。

有关如何使用 keystone 来管理项目和用户的详细信息，请参阅 [Keystone 文档](http://docs.openstack.org/developer/keystone/)。请注意，这个插件仍处于试验阶段，正在积极开发之中，并可能在后续版本中进行更改。

请参考 [讨论](https://github.com/kubernetes/kubernetes/pull/11798#issuecomment-129655212)、[蓝图](https://github.com/kubernetes/kubernetes/issues/11626) 和 [提出的改变](https://github.com/kubernetes/kubernetes/pull/25536) 获取更多信息。

## 匿名请求

启用时，未被其他已配置身份验证方法拒绝的请求将被视为匿名请求，并给予 `system:anonymous` 的用户名和` system:unuthenticated` 的组名。

例如，在配置了令牌认证和启用了匿名访问的服务器上，提供无效的 bearer token 的请求将收到 `401 Unauthorized` 错误。提供 bearer token 的请求将被视为匿名请求。

在 1.5.1 - 1.5.x 版本中，默认情况下命名访问是被禁用的，可以通过传递 `--anonymous-auth=false` 选项给 API server 来启用。

在 1.6+ 版本中，如果使用 `AlwaysAllow` 以外的授权模式，则默认启用匿名访问，并且可以通过将 `--anonymous-auth=false`选项传递给API服务器来禁用。从 1.6 开始，ABAC 和 RBAC 授权人需要明确授权 `system:annoymous` 或 `system:unauthenticated` 组，因此授予对 `*` 用户或 `*` 组访问权的传统策略规则不包括匿名用户。

## 用户模拟

用户可以通过模拟 header 充当另一个用户。该请求会覆盖请求认证的用户信息。例如，管理员可以使用此功能通过暂时模拟其他用户并查看请求是否被拒绝来调试授权策略。

模拟请求首先认证为请求用户，然后切换到模拟的用户信息。

- 用户使用他们的凭证_和_模拟 header 进行 API 调用。
- API server 认证用户
- API server 确保经过身份验证的用户具有模拟权限。
- 请求用户的信息被替换为模拟值
- 请求被评估，授权作用于模拟的用户信息。

以下 HTTP header 可用户执行模拟请求：

- `Impersonate-User`：充当的用户名
- `Impersonate-Group`：作为组名。可以多次使用来设置多个组。可选的，需要 “Impersonate-User”
- `Impersonate-Extra-( extra name )`：用于将额外字段与用户关联的动态 header。可选。需要 “Impersonate-User”

一组示例 header：

```http
Impersonate-User: jane.doe@example.com
Impersonate-Group: developers
Impersonate-Group: admins
Impersonate-Extra-dn: cn=jane,ou=engineers,dc=example,dc=com
Impersonate-Extra-scopes: view
Impersonate-Extra-scopes: development
```

当使用 `kubectl` 的 `--as` 标志来配置 `Impersonate-User` header 时，可以使用 `--as-group` 标志来配置 `Impersonate-Group` header。

```bash
$ kubectl drain mynode
Error from server (Forbidden): User "clark" cannot get nodes at the cluster scope. (get nodes mynode)

$ kubectl drain mynode --as=superman --as-group=system:masters
node "mynode" cordoned
node "mynode" draine
```

为模仿用户、组或设置额外字段，模拟用户必须能够对正在模拟的属性的种类（“用户”，“组”等）执行“模拟”动词。对于启用了 RBAC 授权插件的集群，以下 ClusterRole 包含设置用户和组模拟 header 所需的规则：

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

额外的字段被评估为资源 “userextras” 的子资源。为了允许用户使用额外字段 “scope” 的模拟 header，应授予用户以下角色：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: scopes-impersonator
# Can set "Impersonate-Extra-scopes" header.
- apiGroups: ["authentication.k8s.io"]
  resources: ["userextras/scopes"]
  verbs: ["impersonate"]
```

模拟 header 的可用值可以通过设置 `resourceNames` 可以使用的资源来限制。

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: limited-impersonator
rules:
# Can impersonate the user "jane.doe@example.com"
- apiGroups: [""]
  resources: ["users"]
  verbs: ["impersonate"]
  resourceNames: ["jane.doe@example.com"]

# Can impersonate the groups "developers" and "admins"
- apiGroups: [""]
  resources: ["groups"]
- verbs: ["impersonate"]
  resourceNames: ["developers","admins"]

# Can impersonate the extras field "scopes" with the values "view" and "development"
- apiGroups: ["authentication.k8s.io"]
  resources: ["userextras/scopes"]
  verbs: ["impersonate"]
  resourceNames: ["view", "development"]
```

## 附录

### 创建证书

使用客户端证书进行身份验证时，可以使用现有的部署脚本或通过 `easyrsa` 或 `openssl` 手动生成证书。

#### 使用已有的部署脚本

**已有的部署脚本** 在 `cluster/saltbase/salt/generate-cert/make-ca-cert.sh`。

执行该脚本时需要传递两个参数。第一个参数是 API server 的 IP地址。第二个参数是 IP 形式的主题备用名称列表： `IP:<ip-address>` 或 `DNS:<dns-name>`。

该脚本将生成三个文件： `ca.crt`、`server.crt` 和 `server.key`。

最后，将一下参数添加到 API server 的启动参数中：

- `--client-ca-file=/srv/kubernetes/ca.crt`
- `--tls-cert-file=/srv/kubernetes/server.crt`
- `--tls-private-key-file=/srv/kubernetes/server.key`

#### easyrsa

**easyrsa** 可以用来手动为集群生成证书。

1. 下载，解压，并初始化修补版本的easyrsa3。

   ```bash
   curl -L -O https://storage.googleapis.com/kubernetes-release/easy-rsa/easy-rsa.tar.gz
   tar xzf easy-rsa.tar.gz
   cd easy-rsa-master/easyrsa3
   ./easyrsa init-pki
   ```

2. 生成 CA（使用 `--batch` 设置为自动模式。使用 `--req-cn` 设置默认的 CN）

   ```bash
   ./easyrsa --batch "--req-cn=${MASTER_IP}@`date +%s`" build-ca nopass
   ```

3. 生成服务器证书和密钥。（build-server-full [文件名]：生成一个键值对，在本地为客户端和服务器签名。）

   ```bash
   ./easyrsa --subject-alt-name="IP:${MASTER_IP}" build-server-full server nopass
   ```

4. 复制 `pki/ca.crt`, `pki/issued/server.crt` 和 `pki/private/server.key` 到您的目录下。

5. 将以下参数添加到 API server 的启动参数中：

   ```bash
   --client-ca-file=/yourdirectory/ca.crt
   --tls-cert-file=/yourdirectory/server.crt
   --tls-private-key-file=/yourdirectory/server.key
   ```

#### openssl

**openssl** 可以用来手动为集群生成证书。

1. 生成一个 2048 bit 的 ca.key：

   ```bash
   openssl genrsa -out ca.key 2048
   ```

2. 根据 ca.key 生成一个 ca.crt（使用 -days 设置证书的有效时间）：

   ```bash
   openssl req -x509 -new -nodes -key ca.key -subj "/CN=${MASTER_IP}" -days 10000 -out ca.crt
   ```

3. 生成一个 2048 bit 的 server.key：

   ```bash
   openssl genrsa -out server.key 2048
   ```

4. 根据 server.key 生成一个 server.csr：

   ```bash
   openssl req -new -key server.key -subj "/CN=${MASTER_IP}" -out server.csr
   ```

5. 根据 ca.key、ca.crt 和 server.csr 生成 server.crt：

   ```bash
   openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 10000
   ```

6. 查看证书：

   ```bash
   openssl x509  -noout -text -in ./server.crt
   ```

最后，不要忘了向 API server 的启动参数中增加配置。

#### 认证 API

您可以使用 `certificates.k8s.io` API将 x509 证书配置为用于身份验证，如 [此处](https://kubernetes.io/docs/tasks/tls/managing-tls-in-a-cluster) 所述。

官方v1.6文档地址：https://v1-6.docs.kubernetes.io/docs/admin/authentication/
官方最新文档地址：https://kubernetes.io/docs/admin/authentication/

译者：[Jimmy Song](https://jimmysong.io)
