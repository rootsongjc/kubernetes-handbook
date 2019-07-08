# 使用 kubeconfig 文件配置跨集群认证

Kubernetes 的认证方式对于不同的人来说可能有所不同。

- 运行 kubelet 可能有一种认证方式（即证书）。
- 用户可能有不同的认证方式（即令牌）。
- 管理员可能具有他们为个人用户提供的证书列表。
- 我们可能有多个集群，并希望在同一个地方将其全部定义——这样用户就能使用自己的证书并重用相同的全局配置。

所以为了能够让用户轻松地在多个集群之间切换，对于多个用户的情况下，我们将其定义在了一个 kubeconfig 文件中。

此文件包含一系列与昵称相关联的身份验证机制和集群连接信息。它还引入了一个（用户）认证信息元组和一个被称为上下文的与昵称相关联的集群连接信息的概念。

如果明确指定，则允许使用多个 kubeconfig 文件。在运行时，它们与命令行中指定的覆盖选项一起加载并合并（参见下面的 [规则](https://kubernetes.io/docs/tasks/access-application-cluster/authenticate-across-clusters-kubeconfig#loading-and-merging-rules)）。

## 相关讨论

<http://issue.k8s.io/1755>

## Kubeconfig 文件的组成

### Kubeconifg 文件示例

```yaml
current-context: federal-context
apiVersion: v1
clusters:
- cluster:
    api-version: v1
    server: http://cow.org:8080
  name: cow-cluster
- cluster:
    certificate-authority: path/to/my/cafile
    server: https://horse.org:4443
  name: horse-cluster
- cluster:
    insecure-skip-tls-verify: true
    server: https://pig.org:443
  name: pig-cluster
contexts:
- context:
    cluster: horse-cluster
    namespace: chisel-ns
    user: green-user
  name: federal-context
- context:
    cluster: pig-cluster
    namespace: saw-ns
    user: black-user
  name: queen-anne-context
kind: Config
preferences:
  colors: true
users:
- name: blue-user
  user:
    token: blue-token
- name: green-user
  user:
    client-certificate: path/to/my/client/cert
    client-key: path/to/my/client/key
```

### 各个组件的拆解/释意

#### Cluster

```yaml
clusters:
- cluster:
    certificate-authority: path/to/my/cafile
    server: https://horse.org:4443
  name: horse-cluster
- cluster:
    insecure-skip-tls-verify: true
    server: https://pig.org:443
  name: pig-cluster
```

`cluster` 中包含 kubernetes 集群的端点数据，包括 kubernetes apiserver 的完整 url 以及集群的证书颁发机构或者当集群的服务证书未被系统信任的证书颁发机构签名时，设置`insecure-skip-tls-verify: true`。

`cluster` 的名称（昵称）作为该 kubeconfig 文件中的集群字典的 key。 您可以使用 `kubectl config set-cluster`添加或修改 `cluster` 条目。

#### user

```yaml
users:
- name: blue-user
  user:
    token: blue-token
- name: green-user
  user:
    client-certificate: path/to/my/client/cert
    client-key: path/to/my/client/key
```

`user` 定义用于向 kubernetes 集群进行身份验证的客户端凭据。在加载/合并 kubeconfig 之后，`user` 将有一个名称（昵称）作为用户条目列表中的 key。 可用凭证有 `client-certificate`、`client-key`、`token` 和 `username/password`。 `username/password` 和 `token` 是二者只能选择一个，但 client-certificate 和 client-key 可以分别与它们组合。

您可以使用 `kubectl config set-credentials` 添加或者修改 `user` 条目。

#### context

```yaml
contexts:
- context:
    cluster: horse-cluster
    namespace: chisel-ns
    user: green-user
  name: federal-context
```

`context` 定义了一个命名的 [`cluster`](https://kubernetes.io/docs/tasks/access-application-cluster/authenticate-across-clusters-kubeconfig#cluster)、[`user`](https://kubernetes.io/docs/tasks/access-application-cluster/authenticate-across-clusters-kubeconfig#user)、[`namespace`](https://kubernetes.io/docs/user-guide/namespaces) 元组，用于使用提供的认证信息和命名空间将请求发送到指定的集群。 三个都是可选的；仅使用 `cluster`、`user`、`namespace` 之一指定上下文，或指定 none。 未指定的值或在加载的 kubeconfig 中没有相应条目的命名值（例如，如果为上述 kubeconfig 文件指定了 `pink-user` 的上下文）将被替换为默认值。 有关覆盖/合并行为，请参阅下面的 [加载和合并规则](https://kubernetes.io/docs/tasks/access-application-cluster/authenticate-across-clusters-kubeconfig#loading-and-merging)。

您可以使用 `kubectl config set-context` 添加或修改上下文条目。

#### current-context

```yaml
current-context: federal-context
```

`current-context` 是昵称或者说是作为 `cluster`、`user`、`namespace` 元组的 ”key“，当 kubectl 从该文件中加载配置的时候会被默认使用。您可以在 kubectl 命令行里覆盖这些值，通过分别传入 `—context=CONTEXT`、 `—cluster=CLUSTER`、`--user=USER` 和 `--namespace=NAMESPACE` 。

您可以使用 `kubectl config use-context` 更改 `current-context`。

```yaml
apiVersion: v1
kind: Config
preferences:
  colors: true
```

#### 杂项

`apiVersion` 和 `kind` 标识客户端解析器的版本和模式，不应手动编辑。 `preferences` 指定可选（和当前未使用）的 kubectl 首选项。

## 查看 kubeconfig 文件

`kubectl config view` 命令可以展示当前的 kubeconfig 设置。默认将为您展示所有的 kubeconfig 设置；您可以通过传入 `—minify` 参数，将视图过滤到与 `current-context` 有关的配额设置。有关其他选项，请参阅 `kubectl config view`。

## 构建您自己的 kubeconfig 文件

您可以使用上文 [示例 kubeconfig 文件](https://kubernetes.io/docs/tasks/access-application-cluster/authenticate-across-clusters-kubeconfig#example-kubeconfig-file) 作为

**注意：** 如果您是通过 `kube-up.sh` 脚本部署的 kubernetes 集群，不需要自己创建 kubeconfig 文件——该脚本已经为您创建过了。

当 api server 启动的时候使用了 `—token-auth-file=tokens.csv` 选项时，上述文件将会与 [API server](https://kubernetes.io/docs/admin/kube-apiserver/) 相关联，`tokens.csv` 文件看起来会像这个样子：

```bash
blue-user,blue-user,1
mister-red,mister-red,2
```

**注意：** 启动 API server 时有很多 [可用选项](https://kubernetes.io/docs/admin/kube-apiserver/)。请您一定要确保理解您使用的选项。

上述示例 kubeconfig 文件提供了 `green-user` 的客户端凭证。因为用户的 `current-user` 是 `green-user` ，任何该 API server 的客户端使用该示例 kubeconfig 文件时都可以成功登录。同样，我们可以通过修改 `current-context` 的值以 `blue-user` 的身份操作。

在上面的示例中，`green-user` 通过提供凭据登录，`blue-user` 使用的是 token。使用 `kubectl config set-credentials` 指定登录信息。想了解更多信息，请访问 "[示例文件相关操作命令](https://kubernetes.io/docs/tasks/access-application-cluster/authenticate-across-clusters-kubeconfig#commands-for-the-example-file)"。

## 加载和合并规则

加载和合并 kubeconfig 文件的规则很简单，但有很多。最终的配置按照以下顺序构建：

1. 从磁盘中获取 kubeconfig。这将通过以下层次结构和合并规则完成：

   如果设置了 `CommandLineLocation` （`kubeconfig` 命令行参数的值），将会只使用该文件，而不会进行合并。该参数在一条命令中只允许指定一次。

   或者，如果设置了 `EnvVarLocation` （`$KUBECONFIG` 的值），其将会被作为应合并的文件列表，并根据以下规则合并文件。空文件名被忽略。非串行内容的文件将产生错误。设置特定值或 map key 的第一个文件将优先使用，并且值或 map key 也永远不会更改。 这意味着设置 CurrentContext 的第一个文件将保留其上下文。 这也意味着如果两个文件同时指定一个 `red-user`，那么将只使用第一个文件中的 `red-user` 的值。 即使第二个文件的 `red-user` 中有非冲突条目也被丢弃。

   另外，使用 Home 目录位置（`~/.kube/config`）将不会合并。

2. 根据此链中的第一个命中确定要使用的上下文

   1. 命令行参数——`context` 命令行选项的值
   2. 来自合并后的 `kubeconfig` 文件的 `current-context`
   3. 在这个阶段允许空

3. 确定要使用的群集信息和用户。此时，我们可能有也可能没有上下文。他们是基于这个链中的第一次命中。 （运行两次，一次为用户，一次为集群）

   1. 命令行参数——`user` 指定用户，`cluster` 指定集群名称
   2. 如果上下文存在，则使用上下文的值
   3. 允许空

4. 确定要使用的实际群集信息。此时，我们可能有也可能没有集群信息。根据链条构建每个集群信息（第一次命中胜出）：

   1. 命令行参数——`server`，`api-version`，`certificate-authority` 和 `insecure-skip-tls-verify`
   2. 如果存在集群信息，并且存在该属性的值，请使用它。
   3. 如果没有服务器位置，则产生错误。

5. 确定要使用的实际用户信息。用户使用与集群信息相同的规则构建，除非，您的每个用户只能使用一种认证技术。

   1. 负载优先级为1）命令行标志 2）来自 kubeconfig 的用户字段
   2. 命令行标志是：`client-certificate`、`client-key`、`username`、`password` 和 `token`
   3. 如果有两种冲突的技术，则失败。

6. 对于任何仍然缺少的信息，将使用默认值，并可能会提示验证信息

7. Kubeconfig 文件中的所有文件引用都相对于 kubeconfig 文件本身的位置进行解析。当命令行上显示文件引用时，它们将相对于当前工作目录进行解析。当路径保存在 `~/.kube/config` 中时，相对路径使用相对存储，绝对路径使用绝对存储。

Kubeconfig 文件中的任何路径都相对于 kubeconfig 文件本身的位置进行解析。

## 使用 `kubectl config <subcommand>` 操作 kubeconfig

`kubectl config` 有一些列的子命令可以帮助我们更方便的操作 kubeconfig 文件。

请参阅 `kubectl/kubectl_config`。

### Example

```bash
$ kubectl config set-credentials myself --username=admin --password=secret
$ kubectl config set-cluster local-server --server=http://localhost:8080
$ kubectl config set-context default-context --cluster=local-server --user=myself
$ kubectl config use-context default-context
$ kubectl config set contexts.default-context.namespace the-right-prefix
$ kubectl config view
```

产生如下输出：

```yaml
apiVersion: v1
clusters:
- cluster:
    server: http://localhost:8080
  name: local-server
contexts:
- context:
    cluster: local-server
    namespace: the-right-prefix
    user: myself
  name: default-context
current-context: default-context
kind: Config
preferences: {}
users:
- name: myself
  user:
    password: secret
    username: admin
```

Kubeconfig 文件会像这样子：

```yaml
apiVersion: v1
clusters:
- cluster:
    server: http://localhost:8080
  name: local-server
contexts:
- context:
    cluster: local-server
    namespace: the-right-prefix
    user: myself
  name: default-context
current-context: default-context
kind: Config
preferences: {}
users:
- name: myself
  user:
    password: secret
    username: admin
```

#### 示例文件相关操作命令

```bash
$ kubectl config set preferences.colors true
$ kubectl config set-cluster cow-cluster --server=http://cow.org:8080 --api-version=v1
$ kubectl config set-cluster horse-cluster --server=https://horse.org:4443 --certificate-authority=path/to/my/cafile
$ kubectl config set-cluster pig-cluster --server=https://pig.org:443 --insecure-skip-tls-verify=true
$ kubectl config set-credentials blue-user --token=blue-token
$ kubectl config set-credentials green-user --client-certificate=path/to/my/client/cert --client-key=path/to/my/client/key
$ kubectl config set-context queen-anne-context --cluster=pig-cluster --user=black-user --namespace=saw-ns
$ kubectl config set-context federal-context --cluster=horse-cluster --user=green-user --namespace=chisel-ns
$ kubectl config use-context federal-context
```

### 最后将它们捆绑在一起

所以，将这一切绑在一起，快速创建自己的 kubeconfig 文件：

- 仔细看一下，了解您的 api-server 的启动方式：在设计 kubeconfig 文件以方便身份验证之前，您需要知道您自己的安全要求和策略。
- 将上面的代码段替换为您的集群的 api-server 端点的信息。
- 确保您的 api-server 至少能够以提供一个用户（即 `green-user`）凭据的方式启动。 当然您必须查看 api-server 文档，以了解当前关于身份验证细节方面的最新技术。
