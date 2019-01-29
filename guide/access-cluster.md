## 访问集群

### 第一次使用 kubectl 访问

如果您是第一次访问 Kubernetes API 的话，我们建议您使用 Kubernetes 命令行工具：`kubectl`。

为了访问集群，您需要知道集群的地址，并且需要有访问它的凭证。通常，如果您完成了 [入门指南](https://kubernetes.io/docs/getting-started-guides) 那么这些将会自动设置，或者其他人为您部署的集群提供并给您凭证和集群地址。

使用下面的命令检查 kubectl 已知的集群的地址和凭证：

```bash
$ kubectl config view
```

### 直接访问 REST API

Kubectl 处理对 apiserver 的定位和认证。如果您想直接访问 REST API，可以使用像 curl、wget 或浏览器这样的 http 客户端，有以下几种方式来定位和认证：

- 以 proxy 模式运行 kubectl。
  - 推荐方法。
  - 使用已保存的 apiserver 位置信息。
  - 使用自签名证书验证 apiserver 的身份。 没有 MITM（中间人攻击）的可能。
  - 认证到 apiserver。
  - 将来，可能会做智能的客户端负载均衡和故障转移。
- 直接向 http 客户端提供位置和凭据。
  - 替代方法。
  - 适用于通过使用代理而混淆的某些类型的客户端代码。
  - 需要将根证书导入浏览器以防止 MITM。

#### 使用 kubectl proxy

以下命令作为反向代理的模式运行 kubectl。 它处理对 apiserver 的定位并进行认证。

像这样运行：

```bash
$ kubectl proxy --port=8080 &
```

然后您可以使用 curl、wget 或者浏览器来访问 API，如下所示：

```bash
$ curl http://localhost:8080/api/
{
  "versions": [
    "v1"
  ]
}
```

#### 不使用 kubectl proxy（1.3.x 以前版本）

通过将认证 token 直接传递给 apiserver 的方式，可以避免使用 kubectl proxy，如下所示：

```bash
$ APISERVER=$(kubectl config view | grep server | cut -f 2- -d ":" | tr -d " ")
$ TOKEN=$(kubectl config view | grep token | cut -f 2 -d ":" | tr -d " ")
$ curl $APISERVER/api --header "Authorization: Bearer $TOKEN" --insecure
{
  "versions": [
    "v1"
  ]
}
```

#### 不使用 kubectl proxy（1.3.x 以后版本）

在 Kubernetes 1.3 或更高版本中，`kubectl config view` 不再显示 token。 使用 `kubectl describe secret …` 获取 default service account 的 token，如下所示：

```bash
$ APISERVER=$(kubectl config view | grep server | cut -f 2- -d ":" | tr -d " ")
$ TOKEN=$(kubectl describe secret $(kubectl get secrets | grep default | cut -f1 -d ' ') | grep -E '^token' | cut -f2 -d':' | tr -d '\t')
$ curl $APISERVER/api --header "Authorization: Bearer $TOKEN" --insecure
{
  "kind": "APIVersions",
  "versions": [
    "v1"
  ],
  "serverAddressByClientCIDRs": [
    {
      "clientCIDR": "0.0.0.0/0",
      "serverAddress": "10.0.1.149:443"
    }
  ]
}
```

以上示例使用`--insecure` 标志。 这使得它容易受到 MITM 攻击。 当 kubectl 访问集群时，它使用存储的根证书和客户端证书来访问服务器。 （这些安装在`~/.kube`目录中）。 由于集群证书通常是自签名的，因此可能需要特殊配置才能让您的 http 客户端使用根证书。

对于某些群集，apiserver 可能不需要身份验证；可以选择在本地主机上服务，或者使用防火墙保护。 对此还没有一个标准。[配置对API的访问](https://kubernetes.io/docs/admin/accessing-the-api) 描述了群集管理员如何配置此操作。 这种方法可能与未来的高可用性支持相冲突。

### 编程访问 API

Kubernetes 支持 [Go](https://kubernetes.io/docs/tasks/access-application-cluster/access-cluster.md#go-client) 和 [Python](https://kubernetes.io/docs/tasks/access-application-cluster/access-cluster.md#python-client) 客户端库。

#### Go 客户端

- 要获取该库，请运行以下命令：`go get k8s.io/client-go/<version number>/kubernetes` 请参阅 [https://github.com/kubernetes/client-go](https://github.com/kubernetes/client-go) 以查看支持哪些版本。
- 使用 client-go 客户端编程。请注意，client-go 定义了自己的 API 对象，因此如果需要，请从 client-go 而不是从主存储库导入 API 定义，例如导入 `k8s.io/client-go/1.4/pkg/api/v1` 是正确的。

Go 客户端可以使用与 kubectl 命令行工具相同的 [kubeconfig 文件](https://kubernetes.io/docs/concepts/cluster-administration/authenticate-across-clusters-kubeconfig) 来定位和验证 apiserver。参考官方 [示例](https://git.k8s.io/client-go/examples/out-of-cluster-client-configuration/main.go) 和 [client-go 示例](../develop/client-go-sample.md)。

如果应用程序在群集中以 Pod 的形式部署，请参考 [下一节](https://kubernetes.io/docs/tasks/access-application-cluster/access-cluster.md#accessing-the-api-from-a-pod)。

#### Python 客户端

要使用 [Python client](https://github.com/kubernetes-incubator/client-python)，请运行以下命令：`pip install kubernetes`。查看 [Python 客户端库页面](https://github.com/kubernetes-incubator/client-python) 获取更多的安装选择。

Python 客户端可以使用与 kubectl 命令行工具相同的 [kubeconfig 文件](https://kubernetes.io/docs/concepts/cluster-administration/authenticate-across-clusters-kubeconfig) 来定位和验证 apiserver。参考该 [示例](https://github.com/kubernetes-incubator/client-python/tree/master/examples/example1.py)。

#### 其他语言

还有更多的客户端库可以用来访问 API。有关其他库的验证方式，请参阅文档。

### 在 Pod 中访问 API

在 Pod 中访问 API 时，定位和认证到 API server 的方式有所不同。在 Pod 中找到 apiserver 地址的推荐方法是使用kubernetes DNS 名称，将它解析为服务 IP，后者又将被路由到 apiserver。

向 apiserver 认证的推荐方法是使用 [service account](https://kubernetes.io/docs/user-guide/service-accounts) 凭据。通过 kube-system，pod 与 service account 相关联，并且将该 service account 的凭据（token）放入该 pod 中每个容器的文件系统树中，位于 `/var/run/secrets/kubernetes.io/serviceaccount/token`。

如果可用，证书包将位于每个容器的文件系统树的 `/var/run/secrets/kubernetes.io/serviceaccount/ca.crt` 位置，并用于验证 apiserver 的服务证书。

最后，用于 namespace API 操作的默认 namespace 放在每个容器中的 `/var/run/secrets/kubernetes.io/serviceaccount/namespace` 中。

在 pod 中，连接到 API 的推荐方法是：

- 将 kubectl proxy 作为 pod 中的一个容器来运行，或作为在容器内运行的后台进程。它将 Kubernetes API 代理到 pod 的本地主机接口，以便其他任何 pod 中的容器内的进程都可以访问它。

- 使用 Go 客户端库，并使用 `rest.InClusterConfig()` 和 `kubernetes.NewForConfig()` 函数创建一个客户端。

  他们处理对 apiserver 的定位和认证。[示例](https://git.k8s.io/client-go/examples/in-cluster-client-configuration/main.go)

在以上的几种情况下，都需要使用 pod 的凭据与 apiserver 进行安全通信。

## 访问集群中运行的 service

上一节是关于连接到 kubernetes API server。这一节是关于连接到 kubernetes 集群中运行的 service。在 Kubernetes 中，[node](https://kubernetes.io/docs/admin/node)、 [pod](https://kubernetes.io/docs/user-guide/pods) 和 [services](https://kubernetes.io/docs/user-guide/services) 都有它们自己的 IP。很多情况下，集群中 node 的 IP、Pod 的 IP、service 的 IP 都是不可路由的，因此在集群外面的机器就无法访问到它们，例如从您自己的笔记本电脑。

### 连接的方式

您可以选择以下几种方式从集群外部连接到 node、pod 和 service：

- 通过 public IP 访问 service。
  - 使用 `NodePort` 和 `LoadBalancer` 类型的 service，以使 service 能够在集群外部被访问到。
  - 根据您的群集环境，这可能会将服务暴露给您的公司网络，或者可能会将其暴露在互联网上。想想暴露的服务是否安全。它是否自己进行身份验证？
  - 将 pod 放在服务后面。 要从一组副本（例如为了调试）访问一个特定的 pod，请在 pod 上放置一个唯一的 label，并创建一个选择该 label 的新服务。
  - 在大多数情况下，应用程序开发人员不需要通过 node IP 直接访问节点。
- 通过 Proxy 规则访问 service、node、pod。
  - 在访问远程服务之前，请执行 apiserver 认证和授权。 如果服务不够安全，无法暴露给互联网，或者为了访问节点 IP 上的端口或进行调试，请使用这种方式。
  - 代理可能会导致某些 Web 应用程序出现问题。
  - 仅适用于 HTTP/HTTPS。
  - [见此描述](https://kubernetes.io/docs/tasks/access-application-cluster/access-cluster.md#manually-constructing-apiserver-proxy-urls)。
- 在集群内访问 node 和 pod。
  - 运行一个 pod，然后使用 kubectl exec 命令连接到 shell。从该 shell 中连接到其他 node、pod 和 service。
  - 有些集群可能允许 ssh 到集群上的某个节点。 从那个节点您可以访问到集群中的服务。这是一个非标准的方法，它可能将在某些集群上奏效，而在某些集群不行。这些节点上可能安装了浏览器和其他工具也可能没有。群集 DNS 可能无法正常工作。

### 访问内置服务

通常集群内会有几个在 kube-system 中启动的服务。使用 `kubectl cluster-info` 命令获取该列表：

```bash
$ kubectl cluster-info

  Kubernetes master is running at https://104.197.5.247
  elasticsearch-logging is running at https://104.197.5.247/api/v1/namespaces/kube-system/services/elasticsearch-logging/proxy
  kibana-logging is running at https://104.197.5.247/api/v1/namespaces/kube-system/services/kibana-logging/proxy
  kube-dns is running at https://104.197.5.247/api/v1/namespaces/kube-system/services/kube-dns/proxy
  grafana is running at https://104.197.5.247/api/v1/namespaces/kube-system/services/monitoring-grafana/proxy
  heapster is running at https://104.197.5.247/api/v1/namespaces/kube-system/services/monitoring-heapster/proxy
```

这显示了访问每个服务的代理 URL。

例如，此集群启用了集群级日志记录（使用Elasticsearch），如果传入合适的凭据，可以在该地址 `https://104.197.5.247/api/v1/namespaces/kube-system/services/elasticsearch-logging/proxy/` 访问到，或通过 kubectl 代理，例如：`http://localhost:8080/api/v1/namespaces/kube-system/services/elasticsearch-logging/proxy/`。

（有关如何传递凭据和使用 kubectl 代理，请 [参阅上文](https://kubernetes.io/docs/tasks/access-application-cluster/access-cluster.md#accessing-the-cluster-api)）

#### 手动构建 apiserver 代理 URL

如上所述，您可以使用 `kubectl cluster-info` 命令来检索服务的代理 URL。要创建包含服务端点、后缀和参数的代理 URL，您只需附加到服务的代理URL：

`http://`*kubernetes_master_address*`/api/v1/namespaces/`*namespace_name*`/services/`*service_name[:port_name]*`/proxy`

如果您没有指定 port 的名字，那么您不必在 URL 里指定 port_name。

##### 示例

- 要想访问 Elasticsearch 的服务端点 `_search?q=user:kimchy`，您需要使用：`http://104.197.5.247/api/v1/namespaces/kube-system/services/elasticsearch-logging/proxy/_search?q=user:kimchy`
- 要想访问 Elasticsearch 的集群健康信息 `_cluster/health?pretty=true`，您需要使用：`https://104.197.5.247/api/v1/namespaces/kube-system/services/elasticsearch-logging/proxy/_cluster/health?pretty=true`

```json
  {
    "cluster_name" : "kubernetes_logging",
    "status" : "yellow",
    "timed_out" : false,
    "number_of_nodes" : 1,
    "number_of_data_nodes" : 1,
    "active_primary_shards" : 5,
    "active_shards" : 5,
    "relocating_shards" : 0,
    "initializing_shards" : 0,
    "unassigned_shards" : 5
  }
```

#### 使用 web 浏览器来访问集群中运行的服务

您可以将 apiserver 代理网址放在浏览器的地址栏中。 然而：

- Web 浏览器通常不能传递 token，因此您可能需要使用基本（密码）认证。 Apiserver 可以配置为接受基本认证，但您的集群可能未配置为接受基本认证。
- 某些网络应用程序可能无法正常工作，特别是那些在不知道代理路径前缀的情况下构造 URL 的客户端 JavaScript。

## 请求重定向

重定向功能已被弃用和删除。 请改用代理（见下文）。

## 多种代理

在使用 kubernetes 的时候您可能会遇到许多种不同的代理：

1. [kubectl 代理](https://kubernetes.io/docs/tasks/access-application-cluster/access-cluster.md#directly-accessing-the-rest-api)：
   - 在用户桌面或 pod 中运行
   - 从 localhost 地址到 Kubernetes apiserver 的代理
   - 客户端到代理使用 HTTP
   - apiserver 的代理使用 HTTPS
   - 定位 apiserver
   - 添加身份验证 header
2. [apiserver 代理](https://kubernetes.io/docs/tasks/access-application-cluster/access-cluster.md#discovering-builtin-services)：
   - 将一个堡垒机作为 apiserver
   - 将群集之外的用户连接到群集IP，否则可能无法访问
   - 在 apiserver 进程中运行
   - 客户端到代理使用 HTTPS（或 http，如果 apiserver 如此配置）
   - 根据代理目标的可用信息由代理选择使用 HTTP 或 HTTPS
   - 可用于访问 node、pod 或 service
   - 用于访问 service 时进行负载均衡
3. [kube 代理](https://kubernetes.io/docs/user-guide/services/#ips-and-vips)：
   - 在每个节点上运行
   - 代理 UDP 和 TCP
   - 不支持 HTTP
   - 提供负载均衡
   - 只是用来访问 service
4. apiserver 前面的代理/负载均衡器：
   - 存在和实现因群集而异（例如 nginx）
   - 位于所有客户端和一个或多个 apiserver 之间
   - 作为负载均衡器，如果有多个 apiserver
5. 外部服务的云负载均衡器：
   - 由一些云提供商提供（例如 AWS ELB，Google Cloud Load Balancer）
   - 当 Kubernetes service 类型为 LoadBalancer 时，会自动创建
   - 仅使用 UDP/TCP
   - 实施方式因云提供商而异