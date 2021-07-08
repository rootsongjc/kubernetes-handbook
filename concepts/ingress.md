# Ingress 解析

Ingress 是从 Kubernetes 集群外部访问集群内部服务的入口，这篇文章部分译自 Kubernetes 官方文档 [Ingress Resource](https://kubernetes.io/docs/concepts/services-networking/ingress/)，后面的章节会讲到使用 [Traefik](https://github.com/containous/traefik) 来做 Ingress controller，文章末尾给出了几个相关链接。

**术语 **

在本篇文章中你将会看到一些在其他地方被交叉使用的术语，为了防止产生歧义，我们首先来澄清下。

- 节点：Kubernetes 集群中的一台物理机或者虚拟机。
- 集群：位于 Internet 防火墙后的节点，这是 kubernetes 管理的主要计算资源。
- 边界路由器：为集群强制执行防火墙策略的路由器。 这可能是由云提供商或物理硬件管理的网关。
- 集群网络：一组逻辑或物理链接，可根据 Kubernetes [网络模型](https://kubernetes.io/docs/admin/networking/) 实现群集内的通信。 集群网络的实现包括 Overlay 模型的 [flannel](https://github.com/coreos/flannel#flannel) 和基于 SDN 的 OVS。
- 服务：使用标签选择器标识一组 pod 成为的 Kubernetes [服务](https://kubernetes.io/docs/user-guide/services/)。 除非另有说明，否则服务假定在集群网络内仅可通过虚拟 IP 访问。

## 什么是 Ingress？

通常情况下，service 和 pod 仅可在集群内部网络中通过 IP 地址访问。所有到达边界路由器的流量或被丢弃或被转发到其他地方。从概念上讲，可能像下面这样：

```
    internet
        |
  ------------
  [Services]
```

Ingress 是授权入站连接到达集群服务的规则集合。

```
    internet
        |
   [Ingress]
   --|-----|--
   [Services]
```

你可以给 Ingress 配置提供外部可访问的 URL、负载均衡、SSL、基于名称的虚拟主机等。用户通过 POST Ingress 资源到 API server 的方式来请求 ingress。 [Ingress controller](https://kubernetes.io/docs/concepts/services-networking/ingress/#ingress-controllers) 负责实现 Ingress，通常使用负载均衡器，它还可以配置边界路由和其他前端，这有助于以高可用的方式处理流量。

## 先决条件

在使用 Ingress 资源之前，有必要先了解下面几件事情。

- Ingress 资源对象在 Kubernetes 1.1 之前还没有。
- 你需要一个 `Ingress Controller` 来实现 `Ingress`，单纯的创建一个 `Ingress` 没有任何意义。
- GCE/GKE 会在 master 节点上部署一个 ingress controller。你可以在一个 pod 中部署任意个自定义的 ingress controller。你必须正确地注解每个 ingress，比如运行多个 ingress controller 和关闭 glbc。
- 在非 GCE/GKE 的环境中，你需要在 pod 中 部署一个 controller，例如 [Nginx Ingress Controller](https://github.com/kubernetes/ingress-nginx/blob/master/README.md)。

## Ingress 资源

最简化的 Ingress 配置如下。

```yaml
1: apiVersion: extensions/v1beta1
2: kind: Ingress
3: metadata:
4:   name: test-ingress
5: spec:
6:   rules:
7:   - http:
8:       paths:
9:       - path: /testpath
10:        backend:
11:           serviceName: test
12:           servicePort: 80
```

如果你没有配置 Ingress controller 就将其 POST 到 API server 不会有任何用处。

**配置说明**

**1-4 行 **：跟 Kubernetes 的其他配置一样，ingress 的配置也需要 `apiVersion`，`kind` 和 `metadata` 字段。配置文件的详细说明请查看 [部署应用](https://kubernetes.io/docs/user-guide/deploying-applications)，[配置容器](https://kubernetes.io/docs/user-guide/configuring-containers) 和使用资源。

**5-7 行 **: Ingress spec 中包含配置一个 loadbalancer 或 proxy server 的所有信息。最重要的是，它包含了一个匹配所有入站请求的规则列表。目前 ingress 只支持 http 规则。

**8-9 行 **：每条 http 规则包含以下信息：一个 `host` 配置项（比如 for.bar.com，在这个例子中默认是 *），`path` 列表（比如：/testpath），每个 path 都关联一个 `backend`(比如 test:80)。在 loadbalancer 将流量转发到 backend 之前，所有的入站请求都要先匹配 host 和 path。

**10-12 行 **：正如 [services doc](https://kubernetes.io/docs/user-guide/services) 中描述的那样，backend 是一个 `service:port` 的组合。Ingress 的流量被转发到它所匹配的 backend。

**全局参数**：为了简单起见，Ingress 示例中没有全局参数，请参阅资源完整定义的 [API 参考](https://releases.k8s.io/master/staging/src/k8s.io/api/extensions/v1beta1/types.go)。 在所有请求都不能跟 spec 中的 path 匹配的情况下，请求被发送到 Ingress controller 的默认后端，可以指定全局缺省 backend。

## Ingress controller

为了使 Ingress 正常工作，集群中必须运行 Ingress controller。 这与其他类型的控制器不同，其他类型的控制器通常作为 `kube-controller-manager` 二进制文件的一部分运行，在集群启动时自动启动。 你需要选择最适合自己集群的 Ingress controller 或者自己实现一个。
- Kubernetes 当前支持并维护 [GCE](https://github.com/kubernetes/ingress-gce/blob/master/README.md) 和 [nginx](https://github.com/kubernetes/ingress-nginx/blob/master/README.md) 两种 controller
- F5（公司）[支持并维护](https://support.f5.com/csp/article/K86859508) [F5 BIG-IP Controller for Kubernetes](http://clouddocs.f5.com/products/connectors/k8s-bigip-ctlr/latest)
- [Kong](https://konghq.com/) 同时支持并维护 [社区版](https://discuss.konghq.com/c/kubernetes) 与 [企业版](https://konghq.com/api-customer-success/) 的 [Kong Ingress Controller for Kubernetes](https://konghq.com/blog/kubernetes-ingress-controller-for-kong/)
- [Traefik](https://github.com/containous/traefik) 是功能齐全的 ingress controller（[Let’s Encrypt](https://letsencrypt.org/), secrets, http2, websocket…）, Containous 也对其提供商业支持。
- [Istio](https://istio.io) 使用 CRD Gateway 来 [控制 Ingress 流量](https://istio.io/docs/tasks/traffic-management/ingress/)。


## 在你开始前

以下文档描述了 Ingress 资源中公开的一组跨平台功能。 理想情况下，所有的 Ingress controller 都应该符合这个规范，但是我们还没有实现。 GCE 和 Nginx 控制器的文档分别在 [这里](https://github.com/kubernetes/ingress-gce/blob/master/README.md) 和 [这里](https://github.com/kubernetes/ingress-nginx/blob/master/README.md)。如果您使用 F5 BIG-IP controller，请参看 [这里](http://clouddocs.f5.com/containers/latest/kubernetes/kctlr-k8s-ingress-ctlr.html)。

**确保您查看控制器特定的文档，以便您了解每个文档的注意事项。**

## Ingress 类型

### 单 Service Ingress

Kubernetes 中已经存在一些概念可以暴露单个 service（查看 [替代方案](https://kubernetes.io/docs/concepts/services-networking/ingress/#alternatives)），但是你仍然可以通过 Ingress 来实现，通过指定一个没有 rule 的默认 backend 的方式。

ingress.yaml 定义文件：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: test-ingress
spec:
  backend:
    serviceName: testsvc
    servicePort: 80
```

使用`kubectl create -f`命令创建，然后查看 ingress：

```bash
$ kubectl get ing
NAME                RULE          BACKEND        ADDRESS
test-ingress        -             testsvc:80     107.178.254.228
```

`107.178.254.228` 就是 Ingress controller 为了实现 Ingress 而分配的 IP 地址。`RULE` 列表示所有发送给该 IP 的流量都被转发到了 `BACKEND` 所列的 Kubernetes service 上。

### 简单展开

如前面描述的那样，kubernetes pod 中的 IP 只在集群网络内部可见，我们需要在边界设置一个东西，让它能够接收 ingress 的流量并将它们转发到正确的端点上。这个东西一般是高可用的 loadbalancer。使用 Ingress 能够允许你将 loadbalancer 的个数降低到最少，例如，假如你想要创建这样的一个设置：

```
foo.bar.com -> 178.91.123.132 -> /foo    s1:80
                                 /bar    s2:80
```

你需要一个这样的 ingress：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: test
spec:
  rules:
  - host: foo.bar.com
    http:
      paths:
      - path: /foo
        backend:
          serviceName: s1
          servicePort: 80
      - path: /bar
        backend:
          serviceName: s2
          servicePort: 80
```

使用 `kubectl create -f` 创建完 ingress 后：

```bash
$ kubectl get ing
NAME      RULE          BACKEND   ADDRESS
test      -
					foo.bar.com
					/foo          s1:80
					/bar          s2:80
```

只要服务（s1，s2）存在，Ingress controller 就会将提供一个满足该 Ingress 的特定 loadbalancer 实现。 这一步完成后，您将在 Ingress 的最后一列看到 loadbalancer 的地址。

### 基于名称的虚拟主机

Name-based 的虚拟主机在同一个 IP 地址下拥有多个主机名。

```
foo.bar.com --|                 |-> foo.bar.com s1:80
              | 178.91.123.132  |
bar.foo.com --|                 |-> bar.foo.com s2:80
```

下面这个 ingress 说明基于 [Host header](https://tools.ietf.org/html/rfc7230#section-5.4) 的后端 loadbalancer 的路由请求：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: test
spec:
  rules:
  - host: foo.bar.com
    http:
      paths:
      - backend:
          serviceName: s1
          servicePort: 80
  - host: bar.foo.com
    http:
      paths:
      - backend:
          serviceName: s2
          servicePort: 80
```

**默认 backend**：一个没有 rule 的 ingress，如前面章节中所示，所有流量都将发送到一个默认 backend。你可以用该技巧通知 loadbalancer 如何找到你网站的 404 页面，通过制定一些列 rule 和一个默认 backend 的方式。如果请求 header 中的 host 不能跟 ingress 中的 host 匹配，并且 / 或请求的 URL 不能与任何一个 path 匹配，则流量将路由到你的默认 backend。

### TLS

你可以通过指定包含 TLS 私钥和证书的 [secret](https://kubernetes.io/docs/user-guide/secrets) 来加密 Ingress。 目前，Ingress 仅支持单个 TLS 端口 443，并假定 TLS termination。 如果 Ingress 中的 TLS 配置部分指定了不同的主机，则它们将根据通过 SNI TLS 扩展指定的主机名（假如 Ingress controller 支持 SNI）在多个相同端口上进行复用。 TLS secret 中必须包含名为 `tls.crt` 和 `tls.key` 的密钥，这里面包含了用于 TLS 的证书和私钥，例如：

```yaml
apiVersion: v1
data:
  tls.crt: base64 encoded cert
  tls.key: base64 encoded key
kind: Secret
metadata:
  name: testsecret
  namespace: default
type: Opaque
```

在 Ingress 中引用这个 secret 将通知 Ingress controller 使用 TLS 加密从将客户端到 loadbalancer 的 channel：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: no-rules-map
spec:
  tls:
    - secretName: testsecret
  backend:
    serviceName: s1
    servicePort: 80
```

请注意，各种 Ingress controller 支持的 TLS 功能之间存在差距。 请参阅有关 [nginx](https://git.k8s.io/ingress-nginx/README.md#https)，[GCE](https://git.k8s.io/ingress-gce/README.md#frontend-https) 或任何其他平台特定 Ingress controller 的文档，以了解 TLS 在你的环境中的工作原理。

Ingress controller 启动时附带一些适用于所有 Ingress 的负载平衡策略设置，例如负载均衡算法，后端权重方案等。更高级的负载平衡概念（例如持久会话，动态权重）尚未在 Ingress 中公开。 你仍然可以通过 service loadbalancer 获取这些功能。 随着时间的推移，我们计划将适用于跨平台的负载平衡模式加入到 Ingress 资源中。

还值得注意的是，尽管健康检查不直接通过 Ingress 公开，但 Kubernetes 中存在并行概念，例如 [准备探查](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/)，可以使你达成相同的最终结果。 请查看特定控制器的文档，以了解他们如何处理健康检查（[nginx](https://git.k8s.io/ingress-nginx/README.md)，[GCE](https://git.k8s.io/ingress-gce/README.md#health-checks)）。

## 更新 Ingress

假如你想要向已有的 ingress 中增加一个新的 Host，你可以编辑和更新该 ingress：

```bash
$ kubectl get ing
NAME      RULE          BACKEND   ADDRESS
test      -                       178.91.123.132
          foo.bar.com
          /foo          s1:80
$ kubectl edit ing test
```

这会弹出一个包含已有的 yaml 文件的编辑器，修改它，增加新的 Host 配置。

```yaml
spec:
  rules:
  - host: foo.bar.com
    http:
      paths:
      - backend:
          serviceName: s1
          servicePort: 80
        path: /foo
  - host: bar.baz.com
    http:
      paths:
      - backend:
          serviceName: s2
          servicePort: 80
        path: /foo
..
```

保存它会更新 API server 中的资源，这会触发 ingress controller 重新配置 loadbalancer。

```bash
$ kubectl get ing
NAME      RULE          BACKEND   ADDRESS
test      -                       178.91.123.132
          foo.bar.com
          /foo          s1:80
          bar.baz.com
          /foo          s2:80
```

在一个修改过的 ingress yaml 文件上调用`kubectl replace -f` 命令一样可以达到同样的效果。

## 跨可用域故障

在不同云供应商之间，跨故障域的流量传播技术有所不同。 有关详细信息，请查看相关 Ingress controller 的文档。 有关在 federation 集群中部署 Ingress 的详细信息，请参阅 federation 文档。

## 未来计划

- 多样化的 HTTPS/TLS 模型支持（如 SNI，re-encryption）
- 通过声明来请求 IP 或者主机名
- 结合 L4 和 L7 Ingress
- 更多的 Ingress controller

请跟踪 [L7 和 Ingress 的 proposal](https://github.com/kubernetes/kubernetes/pull/12827)，了解有关资源演进的更多细节，以及 [Ingress repository](https://github.com/kubernetes/ingress/tree/master)，了解有关各种 Ingress controller 演进的更多详细信息。

## 替代方案

你可以通过很多种方式暴露 service 而不必直接使用 ingress：

- 使用 [Service.Type=LoadBalancer](https://kubernetes.io/docs/user-guide/services/#type-loadbalancer)
- 使用 [Service.Type=NodePort](https://kubernetes.io/docs/user-guide/services/#type-nodeport)
- 使用 [Port Proxy](https://git.k8s.io/contrib/for-demos/proxy-to-service)
- 部署一个 [Service loadbalancer](https://github.com/kubernetes/contrib/tree/master/service-loadbalancer) 这允许你在多个 service 之间共享单个 IP，并通过 Service Annotations 实现更高级的负载平衡。

## 参考

- [Kubernetes Ingress Resource - kubernetes.io](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [使用 NGINX Plus 负载均衡 Kubernetes 服务 - dockone.io](http://dockone.io/article/957)
- [使用 NGINX 和 NGINX Plus 的 Ingress Controller 进行 Kubernetes 的负载均衡 - cnblogs.com](http://www.cnblogs.com/276815076/p/6407101.html)

