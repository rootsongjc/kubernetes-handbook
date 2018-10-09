---
title: "Istio 流量管理的基本概念详解"
subtitle: "以 Bookinfo 为例详解其如何作用于 Kubernetes 中的 Pod"
date: 2018-10-09T20:00:02+08:00
bigimg: [{src: "https://ws2.sinaimg.cn/large/006tNbRwly1fw2899vaawj30pk0h142o.jpg", desc: "Photo: Ekaterina Minaeva/Getty Images"}]
draft: false
description: "本文是对 Istio 中流量管理的基本概念的解析，并以 Istio 官方文档中的部署在 Kubernetes 上的 bookinfo 示例服务来说明 Istio 流量管理的基本概念及其如何作用于 Kubernetes 中的 Pod，更多高级功能和配置请参考 Istio 官方文档。关于 Istio 如何实现流量管理的详细实现机制请参考赵化冰写的 Istio 流量管理实现机制深度解析。"
tags: ["istio","service mesh"]
categories: ["service mesh"]
---

本文是对 Istio 中流量管理的基本概念的解析，并以 Istio 官方文档中的部署在 Kubernetes 上的 `bookinfo` 示例服务来说明 Istio 流量管理的基本概念，更多高级功能和配置请参考 [Istio 官方文档](https://preliminary.istio.io/zh)。关于 Istio 如何实现流量管理的详细实现机制请参考赵化冰写的 [Istio 流量管理实现机制深度解析](http://www.servicemesher.com/blog/istio-traffic-management-impl-intro/)。

关于 Istio 的总体架构可以阅读 [Istio 是什么](https://preliminary.istio.io/zh/docs/concepts/what-is-istio/)这篇文档，言简意赅得讲述了[什么是 Service Mesh](https://jimmysong.io/posts/what-is-a-service-mesh/)，Istio 的基本组成这里不再赘述，读者可以直接浏览官方文档。

Istio 的核心功能包括：流量管理、安全性、可观察性、多平台支持、可定制和集成，在所有这些功能中最基础的功能就是**流量管理**，本文将对 Isito 中的流量管理的基本概念解析，详情请参考官方文档 [Istio 中的流量管理](https://preliminary.istio.io/zh/docs/concepts/traffic-management/)。

## 一点开胃菜

下面是以漫画的形式说明 Istio 是什么。

![Istio是什么](https://ws3.sinaimg.cn/large/006tNbRwly1fujrgeesk7j316c0tz10y.jpg)


该图中描绘了以下内容：

- Istio 可以在虚拟机和容器中运行
- Istio 的组成
  - Pilot：服务发现、流量管理
  - Mixer：访问控制、遥测
  - Citadel：终端用户认证、流量加密
- Service mesh 关注的方面
  - 可观察性
  - 安全性
  - 可运维性
- Istio 是可定制可扩展的，组建是可拔插的
- Istio 作为控制平面，在每个服务中注入一个 Envoy 代理以 sidecar 形式运行来拦截所有进出服务的流量，同时对流量加以控制
- 应用程序应该关注于业务逻辑（这才能生钱），非功能性需求交给service mesh

*图片来自Twitter [@daniseyu21](https://twitter.com/daniseyu21)*

## 前提条件

在开始阅读下面的内容之前，请确认您已了解[Istio 是什么](https://istio.io/zh/docs/concepts/what-is-istio/)，为了更好的理解 Istio 中的流量管理，我使用 [kubernetes-vagrant-centos-cluster](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster) 按照文档中的步骤，在我的 Mac 上一键部署了一个 Kubernetes + Istio 集群。然后将 `bookinfo` 示例部署在 `default` namespace 下。

下面是部署 Kubernetes + Istio + bookinfo 示例的命令。

```bash
# 启动虚拟机
$ vagrant up

# 部署 Istio
$ kubectl apply -f addon/istio/

# 部署 bookinfo 示例
$ kubectl apply -n default -f <(istioctl kube-inject -f yaml/istio-bookinfo/bookinfo.yaml)
$ istioctl create -n default -f yaml/istio-bookinfo/bookinfo-gateway.yaml
```

部署完成后，查看 `bookinfo` 示例的 pod。

```bash
$ kubectl -n default get pod
NAME                              READY     STATUS    RESTARTS   AGE
details-v1-68db89cdbc-l5lfs       2/2       Running   0          5h
productpage-v1-745ffc55b7-2l2lw   2/2       Running   0          5h
ratings-v1-55f949796c-7t7q7       2/2       Running   0          5h
reviews-v1-9f55c94fc-pz98z        2/2       Running   0          5h
reviews-v2-67b4d94655-9j94s       2/2       Running   0          5h
reviews-v3-67877d687c-fj56n       2/2       Running   0          5h
```

检查下当前 Service Mesh 的概况。

```bash
$ istioctl proxy-status
PROXY                                                 CDS        LDS        EDS               RDS          PILOT                            VERSION
details-v1-68db89cdbc-l5lfs.default                   SYNCED     SYNCED     SYNCED (100%)     SYNCED       istio-pilot-666cb48777-grdww     1.0.0
istio-egressgateway-857dd897db-gl2w4.istio-system     SYNCED     SYNCED     SYNCED (100%)     NOT SENT     istio-pilot-666cb48777-grdww     1.0.0
istio-ingressgateway-65c97fc65-2bxwl.istio-system     SYNCED     SYNCED     SYNCED (100%)     SYNCED       istio-pilot-666cb48777-grdww     1.0.0
productpage-v1-745ffc55b7-2l2lw.default               SYNCED     SYNCED     SYNCED (100%)     SYNCED       istio-pilot-666cb48777-grdww     1.0.0
ratings-v1-55f949796c-7t7q7.default                   SYNCED     SYNCED     SYNCED (100%)     SYNCED       istio-pilot-666cb48777-grdww     1.0.0
reviews-v1-9f55c94fc-pz98z.default                    SYNCED     SYNCED     SYNCED (100%)     SYNCED       istio-pilot-666cb48777-grdww     1.0.0
reviews-v2-67b4d94655-9j94s.default                   SYNCED     SYNCED     SYNCED (100%)     SYNCED       istio-pilot-666cb48777-grdww     1.0.0
reviews-v3-67877d687c-fj56n.default                   SYNCED     SYNCED     SYNCED (100%)     SYNCED       istio-pilot-666cb48777-grdww     1.0.0
```

- `SYNCED` 表示 Envoy 已经确认了 Pilot 上次发送给它的配置。
- `SYNCED (100%)` 表示 Envoy 已经成功同步了集群中的所有端点。
- `NOT SENT` 表示 Pilot 没有发送任何信息给 Envoy。这通常是因为 Pilot 没有任何数据可以发送。比如 `istio-egressgateway-857dd897db-gl2w4.istio-system` 这个 pod，因为 Pilot 没有信息要发送给出口网关的 RDS，因此该状态为 `NOT SENT`。
- `STALE` 表示 Pilot 已向 Envoy 发送更新但尚未收到确认。这通常表明 Envoy 和 Pilot 之间的网络存在问题或 Istio 本身的错误。

可以确定当前 Istio 和示例的状态正常。

## 组件功能

下图展示了官方的 Bookinfo 示例的部署结构及其与 Istio 各组件之间的关系。

<div id="lightgallery">
    <a href="https://jimmysong.io/istio-handbook/images/bookinfo-application-traffic-route-and-connections-within-istio-service-mesh.png">
    <img src="https://jimmysong.io/istio-handbook/images/bookinfo-application-traffic-route-and-connections-within-istio-service-mesh.png">
    </a>
</div>

Istio 中负责流量管理的核心组件是：

- 控制平面的 Pilot：负责管理 Service Mesh 中的所有 Envoy 实例，制定服务的规范模型，分配路由规则。
- 数据平面的 Envoy：负责路由、负载均衡和上报遥测信息。

Pilot 公开了以下三个与 Envoy 适配的 API。

| 服务       | Envoy API                         |
| ---------- | --------------------------------- |
| 服务发现   | EDS（Endpoint Discovery Service） |
| 负载均衡池 | CDS（Cluster Discovery Service）  |
| 路由表     | RDS（Route Discovery Service）    |

另外在 Envoy 中还有一个“发现服务”——LDS（Listener Discovery Service）。监听器发现服务（LDS）是一个可选的 API，Envoy 将调用它来动态获取监听器。Envoy 将协调 API 响应，并根据需要添加、修改或删除已知的监听器。以上几个“发现服务”合称为 **xDS**。

除此之外，Envoy v2 API 中还提供了一个 ADS（Aggregated Discovery Service）。ADS（聚合发现服务）允许管理服务器在一个单一的双向 gRPC 流上传递一个或多个 API 及其资源。没有它的话，RDS 、CDS 和 EDS 的 API 就可能需要管理多个流并连接到不同的管理服务器。参考 [Envoy v2 API 概览](http://www.servicemesher.com/envoy/configuration/overview/v2_overview.html)。

下面将分别介绍上面表格中的三个功能。关于 Envoy 中 xDS 的详细信息请访问 [Envoy 官方文档中文版](http://www.servicemesher.com/envoy/)。

### 服务发现

对应于 Envoy 中的[服务发现服务（EDS）](http://www.servicemesher.com/envoy/intro/arch_overview/service_discovery.html) API（在 Envoy v1 API 中叫做 SDS，v2 中改为 EDS），上游集群在[配置](https://www.envoyproxy.io/docs/envoy/latest/api-v1/route_config/route_config#config-http-conn-man-route-table/api-v1/cluster_manager/cluster#config-cluster-manager-cluster)中定义后，Envoy 需要知道如何解析集群中的成员。该过程被称为*服务发现*。

**注意**：Envoy 中的服务发现服务（EDS）API 提供更高级的服务发现动态配置机制，Envoy 可以通过该机制发现上游集群中的成员。SDS 已在 Envoy 的 v2 API 中重命名为 Endpoint Discovery Service（EDS）。所以下文中都以 EDS 来指代服务发现服务。

Envoy 通过一个_用于发现服务的服务_获取集群成员，这是一个 [REST 风格的 API](https://www.envoyproxy.io/docs/envoy/latest/api-v1/cluster_manager/sds#config-cluster-manager-sds-api)。对于每个 EDS 集群，Envoy 将定期从发现服务中获取集群成员。通常，为了进行负载均衡和路由决策，主动健康检查和最终一致的服务发现服务数据会结合使用。

对于 Kubernetes 集群，可以自动注册服务并检查服务的健康状况，将不健康的服务示例从流量中移除。

### 负载均衡池

对应于 Envoy 中的[集群发现服务（CDS）](http://www.servicemesher.com/envoy/configuration/cluster_manager/cds.html) API，Envoy 将调用该 API 来动态获取集群管理成员。Envoy 还将根据 API 响应协调集群管理，根据需要完成添加、修改或删除已知的集群。

目前 Istio 中支持的负载均衡模式有：轮循、随机和带权重的最少请求等。

### 路由表

对应于 Envoy 中的[路由发现服务（RDS）](http://www.servicemesher.com/envoy/configuration/http_conn_man/rds.html) API，用于动态获取[路由配置](https://www.envoyproxy.io/docs/envoy/latest/api-v1/route_config/route_config#config-http-conn-man-route-table)。路由配置包括 HTTP 头部修改、虚拟主机以及每个虚拟主机中包含的单个路由规则。每个 [HTTP 连接管理器](http://www.servicemesher.com/envoy/configuration/http_conn_man/http_conn_man.html#config-http-conn-man)都可以通过 API 独立地获取自身的路由配置。

## CRD

安装完 Istio 后我们再查看下 Istio 创建的与网络相关的 [Kubernetes CRD（自定义资源类型）](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)，请参考[使用自定义资源扩展 API](https://jimmysong.io/kubernetes-handbook/concepts/custom-resource.html)。Istio 创建的所有的 Kubernetes CRD 可以这样查看。

```bash
kubectl get customresourcedefinition|grep istio.io
```

你将会看到 50 个 CRD，其实要想了解 Istio 控制平面是怎样工作的，只需要了解这 50 个 CRD 是怎么工作的即可，很遗憾目前 Istio 还没有推出 API 文档。根据 API 的域名看到所有的 CRD 分为四类。

- authentication：策略管控
- config：配置分发与遥测
- networking：流量管理
- rbac：基于角色的访问控制

下图来是 Istio 创建的 50 个 CRD 分类图（原图来自沈旭光）。

<div id="lightgallery">
    <a href="https://ws2.sinaimg.cn/large/006tNc79gy1fvn341amlfj31kw1v1hdt.jpg">
    <img src="https://ws2.sinaimg.cn/large/006tNc79gy1fvn341amlfj31kw1v1hdt.jpg">
    </a>
</div>

CRD 详细列表如下：

```ini
# authentication，这两个 CRD 不是直接在 YAML 里定义的
meshpolicies.authentication.istio.io
policies.authentication.istio.io

# config
adapters.config.istio.io
apikeys.config.istio.io
attributemanifests.config.istio.io
authorizations.config.istio.io
bypasses.config.istio.io
checknothings.config.istio.io
circonuses.config.istio.io
deniers.config.istio.io
edges.config.istio.io
fluentds.config.istio.io
handlers.config.istio.io
httpapispecbindings.config.istio.io
httpapispecs.config.istio.io
instances.config.istio.io
kubernetesenvs.config.istio.io
kuberneteses.config.istio.io
listcheckers.config.istio.io
listentries.config.istio.io
logentries.config.istio.io
memquotas.config.istio.io
metrics.config.istio.io
noops.config.istio.io
opas.config.istio.io
prometheuses.config.istio.io
quotas.config.istio.io
quotaspecbindings.config.istio.io
quotaspecs.config.istio.io
rbacs.config.istio.io
redisquotas.config.istio.io
reportnothings.config.istio.io
rules.config.istio.io
servicecontrolreports.config.istio.io
servicecontrols.config.istio.io
signalfxs.config.istio.io
solarwindses.config.istio.io
stackdrivers.config.istio.io
statsds.config.istio.io
stdios.config.istio.io
templates.config.istio.io
tracespans.config.istio.io

# networking
destinationrules.networking.istio.io
envoyfilters.networking.istio.io
gateways.networking.istio.io
serviceentries.networking.istio.io
virtualservices.networking.istio.io

# rbac
rbacconfigs.rbac.istio.io
servicerolebindings.rbac.istio.io
serviceroles.rbac.istio.io
```

从中可以看出 `config` 类型的 CRD 是最多的，这是因为在 Mixer 中有众多的 [adapter](https://preliminary.istio.io/docs/reference/config/policy-and-telemetry/adapters/) 导致，几十个 adapter 分别创建自己的适配器来对接基础设施后端。

每个 API 都对应着一个资源类型，可以使用下面的命令查看与 `networking` 相关的资源。

```bash
# 使用 CRD 的单数形式
$ kubectl get gateway
NAME               AGE
bookinfo-gateway   5h

# 使用 CRD 的复数形式
$ kubectl get virtualservices
NAME       AGE
bookinfo   5h

# 使用 CRD 的全称
$ kubectl get destinationrules.networking.istio.io
No resources found.

# 不区分大小写
$ kubectl get EnvoyFilters
No resources found.

$ kubectl get serviceentries
No resources found.
```

在安装完 Istio 后我只创建了 `bookinfo-gateway` gateway 资源和 `bookinfo` 一个 `VirtualService` 资源。我们接下来要解析的就是以上几个 CRD。

## 流量管理资源配置

下面将带您了解 Istio 流量管理相关的基础概念与配置示例。

- [`VirtualService`](https://preliminary.istio.io/zh/docs/reference/config/istio.networking.v1alpha3/#virtualservice) 在 Istio 服务网格中定义路由规则，控制流量路由到服务上的各种行为。
- [`DestinationRule`](https://preliminary.istio.io/zh/docs/reference/config/istio.networking.v1alpha3/#destinationrule) 是 `VirtualService` 路由生效后，配置应用与请求的策略集。
- [`ServiceEntry`](https://preliminary.istio.io/zh/docs/reference/config/istio.networking.v1alpha3/#serviceentry) 通常用于在 Istio 服务网格之外启用的服务请求。
- [`Gateway`](https://preliminary.istio.io/zh/docs/reference/config/istio.networking.v1alpha3/#gateway) 为 HTTP/TCP 流量配置负载均衡器，最常见的是在网格边缘的操作，以启用应用程序的入口流量。
- [`EnvoyFilter`](https://preliminary.istio.io/zh/docs/reference/config/istio.networking.v1alpha3/#envoyfilter) 描述了针对代理服务的过滤器，用来定制由 Istio Pilot 生成的代理配置。一定要谨慎使用此功能。错误的配置内容一旦完成传播，可能会令整个服务网格陷入瘫痪状态。这一配置是用于对 Istio 网络系统内部实现进行变更的。

**注**：本文中的示例引用自 Istio 官方 Bookinfo 示例，见：[Istio 代码库](https://github.com/istio/istio/tree/master/samples/bookinfo/)，且对于配置的讲解都以在 Kubernetes 中部署的服务为准。

### VirtualService

`VirtualService` 故名思义，就是虚拟服务，在 Istio 1.0 以前叫做 RouteRule。`VirtualService` 中定义了一系列针对指定服务的流量路由规则。每个路由规则都是针对特定协议的匹配规则。如果流量符合这些特征，就会根据规则发送到服务注册表中的目标服务（或者目标服务的子集或版本）。VirtualService 的详细定义和配置请参考[通信路由](https://preliminary.istio.io/zh/docs/reference/config/istio.networking.v1alpha3/#virtualservice)。

**注意**：`VirtualService` 中的规则是按照在 YAML 文件中的顺序执行的，这就是为什么在存在多条规则时，需要慎重考虑优先级的原因。

**配置说明**

下面是 `VirtualService` 的配置说明。

| 字段       | 类型          | 描述                                                         |
| ---------- | ------------- | ------------------------------------------------------------ |
| `hosts`    | `string[]`    | 必要字段：流量的目标主机。可以是带有通配符前缀的 DNS 名称，也可以是 IP 地址。根据所在平台情况，还可能使用短名称来代替 FQDN。这种场景下，短名称到 FQDN 的具体转换过程是要靠下层平台完成的。**一个主机名只能在一个 VirtualService 中定义。**同一个 `VirtualService` 中可以用于控制多个 HTTP 和 TCP 端口的流量属性。Kubernetes 用户注意：当使用服务的短名称时（例如使用 `reviews`，而不是 `reviews.default.svc.cluster.local`），Istio 会根据规则所在的命名空间来处理这一名称，而非服务所在的命名空间。假设 “default” 命名空间的一条规则中包含了一个 `reviews` 的 `host` 引用，就会被视为 `reviews.default.svc.cluster.local`，而不会考虑 `reviews` 服务所在的命名空间。**为了避免可能的错误配置，建议使用 FQDN 来进行服务引用。** `hosts` 字段对 HTTP 和 TCP 服务都是有效的。网格中的服务也就是在服务注册表中注册的服务，必须使用他们的注册名进行引用；只有 `Gateway` 定义的服务才可以使用 IP 地址。 |
| `gateways` | `string[]`    | `Gateway` 名称列表，Sidecar 会据此使用路由。`VirtualService` 对象可以用于网格中的 Sidecar，也可以用于一个或多个 `Gateway`。这里公开的选择条件可以在协议相关的路由过滤条件中进行覆盖。保留字 `mesh` 用来指代网格中的所有 Sidecar。当这一字段被省略时，就会使用缺省值（`mesh`），也就是针对网格中的所有 Sidecar 生效。如果提供了 `gateways` 字段，这一规则就只会应用到声明的 `Gateway` 之中。要让规则同时对 `Gateway` 和网格内服务生效，需要显式的将 `mesh` 加入 `gateways` 列表。 |
| `http`     | `HTTPRoute[]` | HTTP 流量规则的有序列表。这个列表对名称前缀为 `http-`、`http2-`、`grpc-` 的服务端口，或者协议为 `HTTP`、`HTTP2`、`GRPC` 以及终结的 TLS，另外还有使用 `HTTP`、`HTTP2` 以及 `GRPC` 协议的 `ServiceEntry` 都是有效的。进入流量会使用匹配到的第一条规则。 |
| `tls`      | `TLSRoute[]`  | 一个有序列表，对应的是透传 TLS 和 HTTPS 流量。路由过程通常利用 `ClientHello` 消息中的 SNI 来完成。TLS 路由通常应用在 `https-`、`tls-` 前缀的平台服务端口，或者经 `Gateway` 透传的 HTTPS、TLS 协议端口，以及使用 HTTPS 或者 TLS 协议的 `ServiceEntry` 端口上。**注意：没有关联 VirtualService 的 https- 或者 tls- 端口流量会被视为透传 TCP 流量。** |
| `tcp`      | `TCPRoute[]`  | 一个针对透传 TCP 流量的有序路由列表。TCP 路由对所有 HTTP 和 TLS 之外的端口生效。进入流量会使用匹配到的第一条规则。 |

**示例**

下面的例子中配置了一个名为 `reviews` 的 `VirtualService`，该配置的作用是将所有发送给 `reviews` 服务的流量发送到 `v1` 版本的子集。

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
  - reviews
  http:
  - route:
    - destination:
        host: reviews
        subset: v1
```

- 该配置中流量的目标主机是 `reviews`，如果该服务和规则部署在 Kubernetes 的 `default` namespace 下的话，对应于 Kubernetes 中的服务的 DNS 名称就是 `reviews.default.svc.cluster.local`。
- 我们在 `hosts` 配置了服务的名字只是表示该配置是针对 `reviews.default.svc.cluster.local` 的服务的路由规则，但是具体将对该服务的访问的流量路由到哪些服务的哪些实例上，就是要通过 `destination` 的配置了。 
- 我们看到上面的 `VirtualService` 的 HTTP 路由中还定义了一个 `destination`。`destination` 用于定义在网络中可寻址的服务，请求或连接在经过路由规则的处理之后，就会被发送给 `destination`。`destination.host` 应该明确指向服务注册表中的一个服务。Istio 的服务注册表除包含平台服务注册表中的所有服务（例如 Kubernetes 服务、Consul 服务）之外，还包含了 [`ServiceEntry`](https://preliminary.istio.io/zh/docs/reference/config/istio.networking.v1alpha3/#serviceentry) 资源所定义的服务。`VirtualService` 中只定义流量发送给哪个服务的路由规则，但是并不知道要发送的服务的地址是什么，这就需要 `DestinationRule` 来定义了。
- `subset` 配置流量目的地的子集，下文会讲到。`VirtualService` 中其实可以除了 `hosts` 字段外其他什么都不配置，路由规则可以在 `DestinationRule` 中单独配置来覆盖此处的默认规则。

#### Subset

`subset` 不属于 Istio 创建的 CRD，但是它是一条重要的配置信息，有必要单独说明下。`subset` 是服务端点的集合，可以用于 A/B 测试或者分版本路由等场景。参考 [`VirtualService`](https://preliminary.istio.io/zh/docs/reference/config/istio.networking.v1alpha3/#virtualservice) 文档，其中会有更多这方面应用的例子。另外在 `subset` 中可以覆盖服务级别的即 `VirtualService` 中的定义的流量策略。

以下是`subset` 的配置信息。对于 Kubernetes 中的服务，一个 `subset` 相当于使用 label 的匹配条件选出来的 `service`。

| 字段            | 类型                                                         | 描述                                                         |
| --------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `name`          | `string`                                                     | 必要字段。服务名和 `subset` 名称可以用于路由规则中的流量拆分。 |
| `labels`        | `map<string, string>`                                        | 必要字段。使用标签对服务注册表中的服务端点进行筛选。         |
| `trafficPolicy` | [`TrafficPolicy`](https://preliminary.istio.io/zh/docs/reference/config/istio.networking.v1alpha3/#trafficpolicy) | 应用到这一 `subset` 的流量策略。缺省情况下 `subset` 会继承 `DestinationRule` 级别的策略，这一字段的定义则会覆盖缺省的继承策略。 |

### DestinationRule

`DestinationRule` 所定义的策略，决定了经过路由处理之后的流量的访问策略。这些策略中可以定义负载均衡配置、连接池大小以及外部检测（用于在负载均衡池中对不健康主机进行识别和驱逐）配置。

**配置说明**

下面是 `DestinationRule` 的配置说明。

| 字段            | 类型                                                         | 描述                                                         |
| --------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `name`          | `string`                                                     | 必要字段。服务名和 `subset` 名称可以用于路由规则中的流量拆分。 |
| `labels`        | `map<string, string>`                                        | 必要字段。使用标签对服务注册表中的服务端点进行筛选。         |
| `trafficPolicy` | [`TrafficPolicy`](https://preliminary.istio.io/zh/docs/reference/config/istio.networking.v1alpha3/#trafficpolicy) | 应用到这一子集的流量策略。缺省情况下子集会继承 `DestinationRule` 级别的策略，这一字段的定义则会覆盖缺省的继承策略。 |

**示例**

下面是一条对 `productpage` 服务的流量目的地策略的配置。

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: reviews
spec:
  host: reviews
  subsets:
  - name: v1
    labels:
      version: v1
```

该路由策略将所有对 `reviews` 服务的流量路由到 `v1` 的 subset。

### ServiceEntry

Istio 服务网格内部会维护一个与平台无关的使用通用模型表示的服务注册表，当你的服务网格需要访问外部服务的时候，就需要使用 `ServiceEntry` 来添加服务注册。

### EnvoyFilter

[`EnvoyFilter`](https://preliminary.istio.io/zh/docs/reference/config/istio.networking.v1alpha3/#envoyfilter) 描述了针对代理服务的过滤器，用来定制由 Istio Pilot 生成的代理配置。一定要谨慎使用此功能。错误的配置内容一旦完成传播，可能会令整个服务网格陷入瘫痪状态。这一配置是用于对 Istio 网络系统内部实现进行变更的，属于高级配置，用于扩展 Envoy 中的过滤器的。

### Gateway

[Gateway](https://preliminary.istio.io/zh/docs/reference/config/istio.networking.v1alpha3/#gateway) 为 HTTP/TCP 流量配置了一个负载均衡，多数情况下在网格边缘进行操作，用于启用一个服务的入口（ingress）流量，相当于前端代理。与 Kubernetes 的 Ingress 不同，Istio `Gateway` 只配置四层到六层的功能（例如开放端口或者 TLS 配置），而 Kubernetes 的 Ingress 是七层的。将 `VirtualService` 绑定到 `Gateway` 上，用户就可以使用标准的 Istio 规则来控制进入的 HTTP 和 TCP 流量。

Gateway 设置了一个集群外部流量访问集群中的某些服务的入口，而这些流量究竟如何路由到那些服务上则需要通过配置 `VirtualServcie` 来绑定。下面仍然以 `productpage` 这个服务来说明。

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: bookinfo-gateway
spec:
  selector:
    istio: ingressgateway # 使用默认的控制器
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "*"
---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: bookinfo
spec:
  hosts:
  - "*"
  gateways:
  - bookinfo-gateway
  http:
  - match:
    - uri:
        exact: /productpage
    - uri:
        exact: /login
    - uri:
        exact: /logout
    - uri:
        prefix: /api/v1/products
    route:
    - destination:
        host: productpage
        port:
          number: 9080
```

上面的例子中 `bookinfo` 这个 `VirtualService` 中绑定到了 `bookinfo-gateway`。`bookinfo-gateway` 使用了标签选择器选择对应的 Kubernetes pod，即下图中的 pod。

![istio ingress gateway pod](https://ws4.sinaimg.cn/large/0069RVTdgy1fv7xh71h8fj31fn0dyq9g.jpg)

我们再看下 `istio-ingressgateway` 的 YAML 安装配置。

```yaml
# Deployment 配置
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: istio-ingressgateway
  namespace: istio-system
  labels:
    app: ingressgateway
    chart: gateways-1.0.0
    release: RELEASE-NAME
    heritage: Tiller
    app: istio-ingressgateway
    istio: ingressgateway
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: istio-ingressgateway
        istio: ingressgateway
      annotations:
        sidecar.istio.io/inject: "false"
        scheduler.alpha.kubernetes.io/critical-pod: ""
    spec:
      serviceAccountName: istio-ingressgateway-service-account
      containers:
        - name: ingressgateway
          image: "gcr.io/istio-release/proxyv2:1.0.0" # 容器启动命令入口是 /usr/local/bin/pilot-agent，后面跟参数 proxy 就会启动一个 Envoy 进程
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 80
            - containerPort: 443
            - containerPort: 31400
            - containerPort: 15011
            - containerPort: 8060
            - containerPort: 15030
            - containerPort: 15031
          args:
          - proxy
          - router
          - -v
          - "2"
          - --discoveryRefreshDelay
          - '1s' #discoveryRefreshDelay
          - --drainDuration
          - '45s' #drainDuration
          - --parentShutdownDuration
          - '1m0s' #parentShutdownDuration
          - --connectTimeout
          - '10s' #connectTimeout
          - --serviceCluster
          - istio-ingressgateway
          - --zipkinAddress
          - zipkin:9411
          - --statsdUdpAddress
          - istio-statsd-prom-bridge:9125
          - --proxyAdminPort
          - "15000"
          - --controlPlaneAuthPolicy
          - NONE
          - --discoveryAddress
          - istio-pilot.istio-system:8080
          resources:
            requests:
              cpu: 10m           
          env:
          - name: POD_NAME
            valueFrom:
              fieldRef:
                apiVersion: v1
                fieldPath: metadata.name
          - name: POD_NAMESPACE
            valueFrom:
              fieldRef:
                apiVersion: v1
                fieldPath: metadata.namespace
          - name: INSTANCE_IP
            valueFrom:
              fieldRef:
                apiVersion: v1
                fieldPath: status.podIP
          - name: ISTIO_META_POD_NAME
            valueFrom:
              fieldRef:
                fieldPath: metadata.name
          volumeMounts:
      	  ...
# 服务配置
---
apiVersion: v1
kind: Service
metadata:
  name: istio-ingressgateway
  namespace: istio-system
  annotations:
  labels:
    chart: gateways-1.0.0
    release: RELEASE-NAME
    heritage: Tiller
    app: istio-ingressgateway
    istio: ingressgateway
spec:
  type: NodePort
  selector:
    app: istio-ingressgateway
    istio: ingressgateway
  ports:
    -
      name: http2 # 将 ingressgateway 的 80 端口映射到节点的 31380 端口以代理 HTTP 请求
      nodePort: 31380
      port: 80
      targetPort: 80
    -
      name: https
      nodePort: 31390
      port: 443
    -
      name: tcp
      nodePort: 31400
      port: 31400
    -
      name: tcp-pilot-grpc-tls
      port: 15011
      targetPort: 15011
    -
      name: tcp-citadel-grpc-tls
      port: 8060
      targetPort: 8060
    -
      name: http2-prometheus
      port: 15030
      targetPort: 15030
    -
      name: http2-grafana
      port: 15031
      targetPort: 15031
```

我们看到 `ingressgateway` 使用的是 `proxyv2` 镜像，该镜像容器的启动命令入口是 `/usr/local/bin/pilot-agent`，后面跟参数 proxy 就会启动一个 Envoy 进程，因此 Envoy 既作为 sidecar 也作为边缘代理，`egressgateway` 的情况也是类似，只不过它控制的是集群内部对外集群外部的请求。这正好验证了本文开头中所画的部署结构图。请求 `/productpage` 、`/login`、`/logout`、`/api/v1/products` 这些 URL 的流量转发给 `productpage` 服务的 9080 端口，而这些流量进入集群内又是经过 `ingressgateway` pod 代理的，通过访问 `ingressgateway` pod 所在的宿主机的 31380 端口进入集群内部的。

## 示例

我们以官方的 `bookinfo` 示例来解析流量管理配置。

在前提条件中我部署了该示例，并列出了该示例中的所有 pod，现在我们使用 [istioctl](https://preliminary.istio.io/zh/docs/reference/commands/istioctl) 命令来启动查看 `productpage-v1-745ffc55b7-2l2lw` pod 中的流量配置。

**查看 pod 中 Envoy sidecar 的启动配置信息**

[Bootstrap](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/bootstrap/v2/bootstrap.proto.html#envoy-api-msg-config-bootstrap-v2-bootstrap) 消息是 Envoy 配置的根本来源，[Bootstrap](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/bootstrap/v2/bootstrap.proto.html#envoy-api-msg-config-bootstrap-v2-bootstrap) 消息的一个关键的概念是静态和动态资源的之间的区别。例如 [Listener](https://www.envoyproxy.io/docs/envoy/latest/api-v2/api/v2/lds.proto.html#envoy-api-msg-listener) 或 [Cluster](https://www.envoyproxy.io/docs/envoy/latest/api-v2/api/v2/cds.proto.html#envoy-api-msg-cluster) 这些资源既可以从 [static_resources](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/bootstrap/v2/bootstrap.proto.html#envoy-api-field-config-bootstrap-v2-bootstrap-static-resources) 静态的获得也可以从 [dynamic_resources](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/bootstrap/v2/bootstrap.proto.html#envoy-api-field-config-bootstrap-v2-bootstrap-dynamic-resources) 中配置的  LDS 或 CDS 之类的 xDS 服务获取。关于 xDS 服务的详解请参考 [Envoy 中的 xDS REST 和 gRPC 协议详解](http://www.servicemesher.com/blog/envoy-xds-protocol/)。

```bash
$ istioctl proxy-config bootstrap productpage-v1-745ffc55b7-2l2lw -o json
{
    "bootstrap": {
        "node": {
            "id": "sidecar~172.33.78.10~productpage-v1-745ffc55b7-2l2lw.default~default.svc.cluster.local",
            "cluster": "productpage",
            "metadata": {
                    "INTERCEPTION_MODE": "REDIRECT",
                    "ISTIO_PROXY_SHA": "istio-proxy:6166ae7ebac7f630206b2fe4e6767516bf198313",
                    "ISTIO_PROXY_VERSION": "1.0.0",
                    "ISTIO_VERSION": "1.0.0",
                    "POD_NAME": "productpage-v1-745ffc55b7-2l2lw",
                    "istio": "sidecar"
                },
            "buildVersion": "0/1.8.0-dev//RELEASE"
        },
        "staticResources": { # Envoy 的静态配置，除非销毁后重设，否则不会改变，配置中会明确指定每个上游主机的已解析网络名称（ IP 地址、端口、unix 域套接字等）。
            "clusters": [
                {
                    "name": "xds-grpc",
                    "type": "STRICT_DNS",
                    "connectTimeout": "10.000s",
                    "hosts": [
                        {	# istio-pilot 的地址，指定控制平面地址，这个必须是通过静态的方式配置的
                            "socketAddress": {
                                "address": "istio-pilot.istio-system",
                                "portValue": 15010
                            }
                        }
                    ],
                    "circuitBreakers": { # 断路器配置
                        "thresholds": [
                            {
                                "maxConnections": 100000,
                                "maxPendingRequests": 100000,
                                "maxRequests": 100000
                            },
                            {
                                "priority": "HIGH",
                                "maxConnections": 100000,
                                "maxPendingRequests": 100000,
                                "maxRequests": 100000
                            }
                        ]
                    },
                    "http2ProtocolOptions": {

                    },
                    "upstreamConnectionOptions": { # 上游连接选项
                        "tcpKeepalive": {
                            "keepaliveTime": 300
                        }
                    }
                },
                { # zipkin 分布式追踪地址配置
                    "name": "zipkin",
                    "type": "STRICT_DNS",
                    "connectTimeout": "1.000s",
                    "hosts": [
                        {
                            "socketAddress": {
                                "address": "zipkin.istio-system",
                                "portValue": 9411
                            }
                        }
                    ]
                }
            ]
        }, # 以下是动态配置
        "dynamicResources": {
            "ldsConfig": { # Listener Discovery Service 配置，直接使用 ADS 配置，此处不用配置
                "ads": {

                }
            },
            "cdsConfig": { # Cluster Discovery Service 配置，直接使用 ADS 配置，此处不用配置
                "ads": {

                }
            },
            "adsConfig": { # Aggregated Discovery Service 配置，ADS 中集成了 LDS、RDS、CDS
                "apiType": "GRPC",
                "grpcServices": [
                    {
                        "envoyGrpc": {
                            "clusterName": "xds-grpc"
                        }
                    }
                ],
                "refreshDelay": "1.000s"
            }
        },
        "statsSinks": [ # metric 汇聚的地址
            {
                "name": "envoy.statsd",
                "config": {
                        "address": {
                                    "socket_address": {
                                                "address": "10.254.109.175",
                                                "port_value": 9125
                                            }
                                }
                    }
            }
        ],
        "statsConfig": {
            "useAllDefaultTags": false
        },
        "tracing": { # zipkin 地址
            "http": {
                "name": "envoy.zipkin",
                "config": {
                        "collector_cluster": "zipkin"
                    }
            }
        },
        "admin": {
            "accessLogPath": "/dev/stdout",
            "address": {
                "socketAddress": {
                    "address": "127.0.0.1",
                    "portValue": 15000
                }
            }
        }
    },
    "lastUpdated": "2018-09-04T03:38:45.645Z"
}
```

以上为初始信息。

创建一个名为 `reviews` 的 `VirtualService`。

```bash
$ cat<<EOF | istioctl create -f -
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
  - reviews
  http:
  - route:
    - destination:
        host: reviews
        subset: v1
EOF
```

上面的 `VirtualService` 定义只是定义了访问 `reviews` 服务的流量要全部流向 `reviews`服务的 `v1`子集，至于哪些实例是 `v1` 子集，`VirtualService` 中并没有定义，这就需要再创建个 `DestinationRule`。

```bash
$ cat <<EOF | istioctl create -f -
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: reviews
spec:
  host: reviews
  subsets:
  - name: v1
    labels:
      version: v1
EOF
```

同时还可以为每个 `subset` 设置负载均衡规则。这里面也可以同时创建多个子集，例如同时创建3个 `subset` 分别对应3个版本的实例。

```yaml
$ cat <<EOF | istioctl create -f -
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: reviews
spec:
  host: reviews
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
  - name: v3
    labels:
      version: v3
EOF
```

同时配置了三个 `subset` 当你需要切分流量时可以直接修改 `VirtualService` 中 `destination` 里的 `subset` 即可，还可以根据百分比拆分流量，配置超时和重试，进行错误注入等，详见[流量管理](https://istio.io/zh/docs/concepts/traffic-management/)

当然上面这个例子中只是简单的将流量全部导到某个 `VirtualService` 的 `subset` 中，还可以根据其他限定条件如 HTTP headers、pod 的 label、URL 等。

此时再查询 `productpage-v1-745ffc55b7-2l2lw` pod 的配置信息。

```bash
$ istioctl proxy-config clusters productpage-v1-8d69b45c-bcjqv|grep reviews
reviews.default.svc.cluster.local                           9080      -          outbound      EDS
reviews.default.svc.cluster.local                           9080      v1         outbound      EDS
reviews.default.svc.cluster.local                           9080      v2         outbound      EDS
reviews.default.svc.cluster.local                           9080      v3         outbound      EDS
```

可以看到 `reviews` 服务的 EDS 设置中包含了3个 `subset`，另外读者还可以自己运行 `istioctl proxy-config listeners` 和 `istioctl proxy-config route`  来查询 pod 的监听器和路由配置。

## 小结

本文讲解了 Istio 的流量配置的基本概念及其如何转换为 Pod 的配置，接下来读者需要了解服务之间是如何调用的，Pilot 是如何下发配置给 Sidecar 的以及 Sidecar 是如何处理流量的，下图展示了 `productpage` 服务调用 `details` 服务的请求流程图（图片来自[赵化冰的博客](https://zhaohuabing.com/post/2018-09-25-istio-traffic-management-impl-intro/)），详细信息请参考 [Istio 流量管理实现机制深度解析](http://www.servicemesher.com/blog/istio-traffic-management-impl-intro/)。

![Productpage 服务调用 Details 服务的请求流程图](https://ws4.sinaimg.cn/large/006tNbRwly1fw27rvdflvj30gy0e80uk.jpg)

## 参考

- [流量管理 - istio.io](https://istio.io/zh/docs/concepts/traffic-management/)
- [通信路由 - istio.io](https://istio.io/zh/docs/reference/config/istio.networking.v1alpha3/)
- [istioctl 指南 - istio.io](https://istio.io/zh/docs/reference/commands/istioctl/)
- [Envoy 官方文档中文版 - servicemesher.com](http://www.servicemesher.com/envoy/)
- [Envoy v2 API 概览 - servicemesher.com](http://www.servicemesher.com/envoy/configuration/overview/v2_overview.html)
- [Envoy 中的 xDS REST 和 gRPC 协议详解 - servicemesher.com](http://www.servicemesher.com/blog/envoy-xds-protocol/)
- [Istio 流量管理实现机制深度解析 - servicemesher.com](http://www.servicemesher.com/blog/istio-traffic-management-impl-intro/)