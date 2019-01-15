---
title: "Service Mesh——后 Kubernetes 时代的微服务"
subtitle: "Kubernetes vs Envoy xDS vs Istio Service Mesh"
date: 2019-01-15T17:49:37+08:00
bigimg: [{src: "https://ws3.sinaimg.cn/large/006tNc79gy1fz7fb4zcklj31mm0s4x6p.jpg", desc: "Photo via unsplash"}]
draft: false
description: "本文假定您已经对 Kubernetes 有比较全面的了解，同时还使用过 Istio service mesh，但是对于 Kubernetes、Envoy 及 Istio 之间的关系不甚了解，及 Istio 如何使用 xDS 协议控制所有的 Sidecar 有浓厚的兴趣，那么推荐您继续阅读。"
tags: ["service mesh","istio","microservices","kubernetes"]
categories: ["service mesh"]
---

这不是一篇教程，本文试图带您梳理清楚 Kubernetes、Envoy（xDS 协议）以及 Istio Service Mesh 之间的关系及内在联系。本文介绍了 Kubernetes 中的负载均衡方式，Envoy 的 xDS 协议对于 Service Mesh 的意义以及为什么说有了 Kubernetes 还需要 Istio。

Envoy 对于 Service Mesh 或者说  Cloud Native 最大的贡献就是定义了 xDS，Envoy 虽然本质上是一个 proxy，但是它的配置协议被众多开源软件所支持，如 [Istio](https://github.com/istio/istio)、[Linkerd](https://linkerd.io)、[AWS App Mesh](https://aws.amazon.com/app-mesh/)、[SOFAMesh](https://github.com/alipay/sofa-mesh) 等。

**关于本文标题**

2018年9月1日，[Bilgin Ibryam](https://twitter.com/bibryam) 在 InfoQ 发表了一篇文章 [Microservices in a Post-Kubernetes Era](https://www.infoq.com/articles/microservices-post-kubernetes)，中文版见[后 Kubernetes 时代的微服务](https://www.infoq.cn/article/microservices-post-kubernetes)（译文有些错误，仅供参考）。本文标题中虽然没有明确指明”后 Kubernetes 时代的微服务“是什么，但是从文中可以看出作者的观点是：在后 Kubernetes 时代，服务网格（Service Mesh）技术已完全取代了使用软件库实现网络运维（例如 Hystrix 断路器）的方式。本文索性就借用该标题。

**本文中包含以下内容**

- 说明 kube-proxy 的作用。
- Kubernetes 在微服务管理上的局限性。
- 介绍下 Istio Service Mesh 的功能。
- 介绍下 xDS 包含哪些内容。
- 比较了 Kubernetes、Envoy 和 Istio Service Mesh 中的一些概念。

## 本文观点

如果你没有心里阅读下文的所有内容，那么可以先阅读看下下面列出的本文中的一些主要观点：

- Kubernetes 的本质是应用的生命周期管理，具体说是部署和管理（扩缩容、自动恢复、发布）。
- Kubernetes 为微服务提供了可扩展、高弹性的部署和管理平台。
- Service Mesh 的基础是透明代理，通过 sidecar proxy 拦截到微服务间流量后再通过控制平面配置管理微服务的行为。
- Service Mesh 将流量管理从 Kubernetes 中解耦，Service Mesh 内部的流量无需 `kube-proxy` 组件的支持，通过为更接近微服务应用层的抽象，管理服务间的流量、安全性和可观察性。
- Envoy xDS 定义了 Service Mesh 配置的协议标准。
- Service Mesh 是对 Kubernetes 中的 service 更上层的抽象，它的下一步是 serverless。

## 适用人群

本文假定您已经对 [Kubernetes](https://kubernetes.io) 有比较全面的了解，同时还使用过 [Istio](https://istio.io/zh) service mesh，但是对于 Kubernetes、Envoy 及 Istio 之间的关系不甚了解，及 Istio 如何使用 xDS 协议控制所有的 Sidecar 有浓厚的兴趣，那么推荐您继续阅读。

## 阅读本文之前

推荐大家在阅读本文之前希望您对微服务、容器和 Kubernetes 有一定认识，如果您已经阅读过以下几篇文章将对您理解本文更有帮助，本文中也引用过了下面文章中的部分观点。

- [深入解读 Service Mesh 背后的技术细节 by 刘超](https://www.cnblogs.com/163yun/p/8962278.html)
- [Istio流量管理实现机制深度解析 by 赵化冰](https://zhaohuabing.com/post/2018-09-25-istio-traffic-management-impl-intro/)
- [Service Mesh架构反思：数据平面和控制平面的界线该如何划定？by 敖小剑](https://skyao.io/post/201804-servicemesh-architecture-introspection/)
- [理解 Istio Service Mesh 中 Envoy 代理 Sidecar 注入及流量劫持 by 宋净超](https://jimmysong.io/posts/envoy-sidecar-injection-in-istio-service-mesh-deep-dive/)
- [Service Mesh 深度学习系列——Istio源码分析之pilot-agent模块分析 by 丁轶群](http://www.servicemesher.com/blog/istio-service-mesh-source-code-pilot-agent-deepin)

## 为什么走到这一步

使用 Service Mesh 并不是说与 Kubernetes 决裂，而是水到渠成的事情。Kubernetes 的本质是通过声明式配置对应用进行生命周期管理，而 Service Mesh 的本质是应用间的流量和安全性管理。假如你已经使用 Kubernetes 构建了稳定的微服务平台，那么如何设置服务间调用的负载均衡和流量控制？

## 在阅读本文前先问自己几个问题

我想听说过 Service Mesh 并试用过 [Istio](https://istio.io/zh) 的人可能都会有以下几个疑问：

1. 为什么 Istio 一定要绑定 Kubernetes 呢？
2. Kubernetes 和 Service Mesh 分别在云原生中扮演什么角色？
3. Istio 扩展了 Kubernetes 的哪些方面？解决了哪些问题？
4. Kubernetes、Envoy（xDS 协议）与 Istio 之间又是什么关系？
5. 到底该不该上 Service Mesh？

## 为什么写这篇文章

从 [ServiceMesher 社区](http://www.servicemesher.com)的反馈来看，很多初次接触 Istio 和 Service Mesh 的同学，跟着那个 [Istio 官方文档](https://istio.io)可以迅速的搭建和试用 Istio 的各种功能，了解 Service Mesh 能为你做什么，但用户所有的操作都仅是在控制平面完成的，至于 Istio 如何操作数据平面，即每个 Sidecar proxy 的呢？

[Kubernetes 1.13](https://jimmysong.io/kubernetes-handbook/appendix/kubernetes-1.13-changelog.html) 如期发布了，Kubernetes 依然按照四个月一个版本的速度迭代着，但是我们能看到的重大革新越来越少了，已经过了技术采纳的初级阶段，正在大规模落地，关于 Kubernetes 的书籍、演讲已经扎堆，我不会过多得讲到 Kubernetes。本文不一定能够回答以上所有问题，本文仅为我个人理解，抛砖引玉。

**注意：这篇文章中涉及大量的数据平面的细节。**

## Kubernetes vs Service Mesh

下图展示的是 Kubernetes 与 Service Mesh 中的的服务访问关系，本文仅针对 sidecar per-pod 模式，详情请参考[服务网格的实现模式](https://jimmysong.io/istio-handbook/concepts/service-mesh-patterns.html)。

![kubernetes vs service mesh](https://ws2.sinaimg.cn/large/006tNc79ly1fz6c7pj4sqj31hk0rejuz.jpg)

Kubernetes 集群的每个节点都部署了一个 `kube-proxy` 组件，该组件会与 Kubernetes API Server 通信，获取集群中的 [service](https://jimmysong.io/kubernetes-handbook/concepts/service.html) 信息，然后设置 iptables 规则，直接将对某个 service 的请求发送到对应的 Endpoint（属于同一组 service 的 pod）上。

Istio Service Mesh 中沿用了 Kubernetes 中的 service 做服务注册，通过 Control Plane 来生成数据平面的配置（使用 CRD 声明，保存在 etcd 中），数据平面的**透明代理**（transparent proxy）以 sidecar 容器的形式部署在每个应用服务的 pod 中，这些 proxy 都需要请求 Control Plane 来同步代理配置，之所以说是透明代理，是因为应用程序容器完全无感知代理的存在，该过程 kube-proxy 组件一样需要拦截流量，只不过 `kube-proxy` 拦截的是进出 Kubernetes 节点的流量，而 sidecar proxy 拦截的是进出该 Pod 的流量，详见[理解 Istio Service Mesh 中 Envoy Sidecar 代理的路由转发](https://jimmysong.io/posts/envoy-sidecar-routing-of-istio-service-mesh-deep-dive/)。

**Service Mesh 的劣势**

因为 Kubernetes 每个节点上都会运行众多的 Pod，将原先 `kube-proxy` 方式的路由转发功能置于每个 pod 中，这将导致大量的配置分发、同步和最终一致性问题。为了细粒度的机型流量管理，必将代理一系列新的抽象，增加了用户的心智负担，但随着技术的普及慢慢将得到缓解。

**Service Mesh 的优势**

`kube-proxy` 的设置都是全局生效的，无法对每个服务做细粒度的控制，而 Service Mesh 通过 sidecar proxy 的方式将 Kubernetes 中对流量的控制从 service 一层抽离出来，可以做更多的扩展。

## kube-proxy 组件

在 Kubernetes 集群中，每个 Node 运行一个 `kube-proxy` 进程。`kube-proxy` 负责为 `Service` 实现了一种 VIP（虚拟 IP）的形式。 在 Kubernetes v1.0 版本，代理完全在 userspace 实现。Kubernetes v1.1 版本新增了 [iptables 代理模式](https://jimmysong.io/kubernetes-handbook/concepts/service.html#iptables-%E4%BB%A3%E7%90%86%E6%A8%A1%E5%BC%8F)，但并不是默认的运行模式。从 Kubernetes v1.2 起，默认使用 iptables 代理。在 Kubernetes v1.8.0-beta.0 中，添加了 [ipvs 代理模式](https://jimmysong.io/kubernetes-handbook/concepts/service.html#ipvs-%E4%BB%A3%E7%90%86%E6%A8%A1%E5%BC%8F)。关于 kube-proxy 组件的更多介绍请参考 [kubernetes 简介：service 和 kube-proxy 原理](https://cizixs.com/2017/03/30/kubernetes-introduction-service-and-kube-proxy/) 和 [使用 IPVS 实现 Kubernetes 入口流量负载均衡](https://jishu.io/kubernetes/ipvs-loadbalancer-for-kubernetes/)。

### kube-proxy 的缺陷

在上面的链接中作者指出了 [kube-proxy 的不足之处](https://cizixs.com/2017/03/30/kubernetes-introduction-service-and-kube-proxy/)：

> 首先，如果转发的 pod 不能正常提供服务，它不会自动尝试另一个 pod，当然这个可以通过 [`liveness probes`](https://jimmysong.io/kubernetes-handbook/guide/configure-liveness-readiness-probes.html) 来解决。每个 pod 都有一个健康检查的机制，当有 pod 健康状况有问题时，kube-proxy 会删除对应的转发规则。另外，`nodePort` 类型的服务也无法添加 TLS 或者更复杂的报文路由机制。

Kube-proxy 实现了流量在 Kubernetes service 多个 pod 实例间的负载均衡，但是如何对这些 service 间的流量做细粒度的控制，比如按照百分比划分流量到不同的应用版本（这些应用都属于同一个  service，但位于不同的 deployment 上），做金丝雀发布（灰度发布）和蓝绿发布？Kubernetes 社区给出了 [使用 Deployment 做金丝雀发布的方法](https://kubernetes.io/docs/concepts/cluster-administration/manage-deployment/#canary-deployments)，该方法本质上就是通过修改 pod 的 [label](https://jimmysong.io/kubernetes-handbook/concepts/label.html) 来将不同的 pod 划归到 Deployment 的 Service 上。

## Kubernetes Ingress vs Istio Gateway

Kubernetes 中的 Ingress 资源对象跟 Istio Service Mesh 中的 Gateway 的功能类似，都是负责集群南北流量（从集群外部进入集群内部的流量）。

`kube-proxy` 只能路由 Kubernetes 集群内部的流量，而我们知道 Kubernetes 集群的 Pod 位于 [CNI](https://jimmysong.io/kubernetes-handbook/concepts/cni.html) 创建的外网络中，集群外部是无法直接与其通信的，因此 Kubernetes 中创建了 [ingress](https://jimmysong.io/kubernetes-handbook/concepts/ingress.html) 这个资源对象，它由位于 Kubernetes [边缘节点](https://jimmysong.io/kubernetes-handbook/practice/edge-node-configuration.html)（这样的节点可以是很多个也可以是一组）的 Ingress controller 驱动，负责管理**南北向流量**（从集群外部进入 Kubernetes 集群的流量），Ingress 必须对接各种个 Ingress Controller 才能使用，比如 [nginx ingress controller](https://github.com/kubernetes/ingress-nginx)、[traefik](https://traefik.io/)。Ingress 只适用于 HTTP 流量，使用方式也很简单，只能对 service、port、HTTP 路径等有限字段匹配来路由流量，这导致它无法路由如 MySQL、redis 和各种私有 RPC 等 TCP 流量。要想直接路由南北向的流量，只能使用 Service 的 LoadBalancer 或 NodePort，前者需要云厂商支持而且可能需要付费，后者需要进行额外的端口管理。有些 Ingress controller 支持暴露 TCP 和 UDP 服务，但是只能使用 Service 来暴露，Ingress 本身是不支持的，例如 [nginx ingress controller](https://kubernetes.github.io/ingress-nginx/user-guide/exposing-tcp-udp-services/)，服务的暴露的端口是通过创建 ConfigMap 的方式来配置的。

Istio `Gateway` 描述的负载均衡器用于承载进出网格边缘的连接。该规范中描述了一系列开放端口和这些端口所使用的协议、负载均衡的 SNI 配置等内容。Gateway 是一种 [CRD 扩展](https://jimmysong.io/kubernetes-handbook/concepts/crd.html)，它同时复用了 Envoy proxy 的能力，详细配置请参考 [Istio 官网](https://istio.io/zh/docs/reference/config/istio.networking.v1alpha3/#gateway)。

## xDS 协议

下面这张图大家在了解 Service Mesh 的时候可能都看到过，每个方块代表一个服务的示例，例如 Kubernetes 中的一个 Pod（其中包含了 sidecar proxy），xDS 协议控制了 Istio Service Mesh 中所有流量的具体行为，即将下图中的方块链接到了一起。

![Service Mesh 示意图](https://ws1.sinaimg.cn/large/006tNc79ly1fz73xstibij30b409cmyh.jpg)

xDS 协议是由 [Envoy](https://envoyproxy.io) 提出的，在 Envoy v2 版本 API 中最原始的 xDS 协议只指 CDS、EDS、LDS 和 RDS。

下面我们以两个 service，每个 service 都有两个实例的例子来看下 Envoy 的 xDS 协议。

![Envoy xDS 协议](https://ws4.sinaimg.cn/large/006tNc79ly1fz7auvvrjnj30s80j8gn6.jpg)

上图中的箭头不是流量在进入 Enovy Proxy 后的路径或路由，而是想象的一种 Envoy 中 xDS 接口处理的顺序并非实际顺序，其实 xDS 之间也是有交叉引用的。

Envoy 通过查询文件或管理服务器来动态发现资源。概括地讲，对应的发现服务及其相应的 API 被称作 *xDS*。Envoy 通过**订阅（*subscription*）**方式来获取资源，订阅方式有以下三种：

- **文件订阅**：监控指定路径下的文件，发现动态资源的最简单方式就是将其保存于文件，并将路径配置在 [ConfigSource](https://www.envoyproxy.io/docs/envoy/latest/api-v2/api/v2/core/config_source.proto#core-configsource) 中的 `path` 参数中。
- **gRPC 流式订阅**：每个 xDS API 可以单独配置 [`ApiConfigSource`](https://www.envoyproxy.io/docs/envoy/latest/api-v2/api/v2/core/config_source.proto#core-apiconfigsource)，指向对应的上游管理服务器的集群地址。
- **轮询 REST-JSON 轮询订阅**：单个 xDS API 可对 REST 端点进行的同步（长）轮询。

以上的 xDS 订阅方式详情请参考 [xDS 协议解析](https://jimmysong.io/istio-handbook/concepts/envoy-xds-protocol.html)。Istio  使用的 gRPC 流式订阅的方式配置所有的数据平面的 sidecar proxy。

关于 xDS 协议的详细分解请参考丁轶群博士的这几篇文章：

- [Service Mesh深度学习系列part1—istio源码分析之pilot-agent模块分析](http://www.servicemesher.com/blog/istio-service-mesh-source-code-pilot-agent-deepin)
- [Service Mesh深度学习系列part2—istio源码分析之pilot-discovery模块分析](http://www.servicemesher.com/blog/istio-service-mesh-source-code-pilot-discovery-module-deepin)
- [Service Mesh深度学习系列part3—istio源码分析之pilot-discovery模块分析（续）](http://www.servicemesher.com/blog/istio-service-mesh-source-code-pilot-discovery-module-deepin-part2)

文章中介绍了 Istio pilot 的总体架构、Envoy 配置的生成、pilot-discovery 模块的功能，以及 xDS 协议中的 CDS、EDS 及 ADS，关于 ADS 详情请参考 [Enovy 官方文档](https://www.envoyproxy.io/docs/envoy/latest/configuration/overview/v2_overview#aggregated-discovery-service)。

### xDS 协议要点

最后总结下关于 xDS 协议的要点：

- CDS、EDS、LDS、RDS 是最基础的 xDS 协议，它们可以分别独立更新的。
- 所有的发现服务（Discovery Service）可以连接不同的 Management Server，也就是说管理 xDS 的服务器可以是多个。
- Envoy 在原始 xDS 协议的基础上进行了一些列扩充，增加了 SDS（秘钥发现服务）、ADS（聚合发现服务）、HDS（健康发现服务）、MS（Metric 服务）、RLS（速率限制服务）等 API。
- 为了保证数据一致性，若直接使用 xDS 原始 API 的话，需要保证这样的顺序更新：CDS --> EDS --> LDS --> RDS，这是遵循电子工程中的**先合后断**（Make-Before-Break）原则，即在断开原来的连接之前先建立好新的连接，应用在路由里就是为了防止设置了新的路由规则的时候却无法发现上游集群而导致流量被丢弃的情况，类似于电路里的断路。
- CDS 设置 Service Mesh 中有哪些服务。
- EDS 设置哪些实例（Endpoint）属于这些服务（Cluster）。
- LDS 设置实例上监听的端口以配置路由。
- RDS 最终服务间的路由关系，应该保证最后更新 RDS。

## Envoy

Envoy 是 Istio Service Mesh 中默认的 Sidecar，Istio 在 Enovy 的基础上按照 Envoy 的 xDS 协议扩展了其控制平面，在讲到 Envoy xDS 协议之前还需要我们先熟悉下 Envoy 的基本术语。下面列举了 Envoy 里的基本术语及其数据结构解析，关于 Envoy 的详细介绍请参考 [Envoy 官方文档](http://www.servicemesher.com/envoy/)，至于 Envoy 在 Service Mesh（不仅限于 Istio） 中是如何作为转发代理工作的请参考网易云刘超的这篇[深入解读 Service Mesh 背后的技术细节 ](https://www.cnblogs.com/163yun/p/8962278.html)以及[理解 Istio Service Mesh 中 Envoy 代理 Sidecar 注入及流量劫持](https://jimmysong.io/posts/envoy-sidecar-injection-in-istio-service-mesh-deep-dive/)，本文引用其中的一些观点，详细内容不再赘述。

![Envoy proxy 架构图](https://ws2.sinaimg.cn/large/006tNc79ly1fz69bsaqk7j314k0tsq90.jpg)

### 基本术语

下面是您应该了解的 Enovy 里的基本术语：

- **Downstream（下游）**：下游主机连接到 Envoy，发送请求并接收响应，即发送请求的主机。
- **Upstream（上游）**：上游主机接收来自 Envoy 的连接和请求，并返回响应，即接受请求的主机。
- **Listener（监听器）**：监听器是命名网地址（例如，端口、unix domain socket 等)，下游客户端可以连接这些监听器。Envoy 暴露一个或者多个监听器给下游主机连接。
- **Cluster（集群）**：集群是指 Envoy 连接的一组逻辑相同的上游主机。Envoy 通过[服务发现](http://www.servicemesher.com/envoy/intro/arch_overview/service_discovery.html#arch-overview-service-discovery)来发现集群的成员。可以选择通过[主动健康检查](http://www.servicemesher.com/envoy/intro/arch_overview/health_checking.html#arch-overview-health-checking)来确定集群成员的健康状态。Envoy 通过[负载均衡策略](http://www.servicemesher.com/envoy/intro/arch_overview/load_balancing.html#arch-overview-load-balancing)决定将请求路由到集群的哪个成员。

Envoy 中可以设置多个 Listener，每个 Listener 中又可以设置 filter chain（过滤器链表），而且过滤器是可扩展的，这样就可以更方便我们操作流量的行为，例如设置加密、私有 RPC 等。

xDS 协议是由 Envoy 提出的，现在是 Istio 中默认的 sidecar proxy，但只要实现 xDS 协议理论上都是可以作为 Istio 中的 sidecar proxy 的，例如蚂蚁金服开源的 [SOFAMosn](https://github.com/alipay/sofa-mosn) 和 nginx 开源的 [nginmesh](https://github.com/nginxinc/nginmesh)。

## Istio Service Mesh

![Istio service mesh 架构图](https://ws2.sinaimg.cn/large/006tNc79ly1fz73sprcdlj31580u046j.jpg)

Istio 是一个功能十分丰富的 Service Mesh，它包括如下功能：

- 流量管理：这是 Istio 的最基本的功能。
- 策略控制：通过 Mixer 组件和各种适配器来实现，实现访问控制系统、遥测捕获、配额管理和计费等。
- 可观测性：通过 Mixer 来实现。
- 安全认证：Citadel 组件做密钥和证书管理。

### Istio 中的流量管理

Istio 中定义了如下的 [CRD](https://jimmysong.io/kubernetes-handbook/concepts/custom-resource.html) 来帮助用户进行流量管理：

- **Gateway**：Gateway 描述了在网络边缘运行的负载均衡器，用于接收传入或传出的HTTP / TCP连接。
- **VirtualService**：[VirtualService](https://istio.io/zh/docs/reference/config/istio.networking.v1alpha3/#virtualservice) 实际上将 Kubernetes 服务连接到 Istio Gateway。它还可以执行更多操作，例如定义一组流量路由规则，以便在主机被寻址时应用。
- **DestinationRule**：`DestinationRule` 所定义的策略，决定了经过路由处理之后的流量的访问策略。简单的说就是定义流量如何路由。这些策略中可以定义负载均衡配置、连接池尺寸以及外部检测（用于在负载均衡池中对不健康主机进行识别和驱逐）配置。
- **EnvoyFilter**：`EnvoyFilter` 对象描述了针对代理服务的过滤器，这些过滤器可以定制由 Istio Pilot 生成的代理配置。这个配置初级用户一般很少用到。
- **ServiceEntry**：默认情况下 Istio Service Mesh 中的服务是无法发现 Mesh 外的服务的，`ServiceEntry` 能够在 Istio 内部的服务注册表中加入额外的条目，从而让网格中自动发现的服务能够访问和路由到这些手工加入的服务。

## Kubernetes vs Envoy xDS vs Istio

在阅读完上文对 Kubernetes 的 `kube-proxy` 组件、Envoy xDS 和 Istio 中流量管理的抽象概念之后，下面将带您仅就流量管理方面比较下三者对应的组件/协议（注意，三者不可以完全等同）。

| Kubernetes | Envoy xDS | Istio Service Mesh |
| ---------- | --------- | ------------------ |
| Endpoint   | Endpoint  | -                  |
| Service    | Route     | VirtualService     |
| kube-proxy | Route     | DestinationRule    |
| kube-proxy | Listener  | EnvoyFilter        |
| Ingress    | Listener  | Gateway            |
| Service    | Cluster   | ServiceEntry       |

## 总结

如果说 Kubernetes 管理的对象是 Pod，那么 Service Mesh 中管理的对象就是一个个 Service，所以说使用 Kubernetes 管理微服务后再应用 Service Mesh 就是水到渠成了，如果连 Service 你也不像管了，那就用如 [knative](https://github.com/knative/) 这样的 serverless 平台，这就是后话了。

Envoy 的功能也不只是做流量转发，以上概念只不过是 Istio 在 Kubernetes 之上新增一层抽象层中的冰山一角，但因为流量管理是服务网格最基础也是最重要的功能，所以本文从这里开始，以后将给大家介绍更多关于服务网格的细节，请关注我的博客 [jimmysong.io](https://jimmysong.io) 和 [istio-handbook](https://jimmysong.io/isito-handbook/)。

## 参考

- [Istio 流量管理的基本概念详解 - jimmysong.io](https://jimmysong.io/posts/istio-traffic-management-basic-concepts/)
- [Kubernetes  kube-proxy 中的 iptables 代理模式 - jimmysong.io](https://jimmysong.io/kubernetes-handbook/concepts/service.html#iptables-%E4%BB%A3%E7%90%86%E6%A8%A1%E5%BC%8F)
- [Kubernetes kube-proxy 中的 ipvs 代理模式 - jimmysong.io](https://jimmysong.io/kubernetes-handbook/concepts/service.html#ipvs-%E4%BB%A3%E7%90%86%E6%A8%A1%E5%BC%8F)
- [Envoy v2 API 概览 - servicemesher.com](http://www.servicemesher.com/envoy/configuration/overview/v2_overview.html)
- [监听器发现服务（LDS）- servicemesher.com](http://www.servicemesher.com/envoy/configuration/listeners/lds.html)
- [路由发现服务（RDS）- servicemesher.com](http://www.servicemesher.com/envoy/configuration/http_conn_man/rds.html)
- [集群发现服务（CDS）- servicemesher.com](http://www.servicemesher.com/envoy/configuration/cluster_manager/cds.html)
- [Kubernetes service - jimmysong.io](https://jimmysong.io/kubernetes-handbook/concepts/service.html)
- [xDS 协议解析 - jimmysong.io](https://jimmysong.io/istio-handbook/concepts/envoy-xds-protocol.html)
- [深入解读 Service Mesh 背后的技术细节 - cnblogs.com](https://www.cnblogs.com/163yun/p/8962278.html)
- [理解 Istio Service Mesh 中 Envoy 代理 Sidecar 注入及流量劫持 - jimmysong.io](https://jimmysong.io/posts/envoy-sidecar-injection-in-istio-service-mesh-deep-dive/)
- [kubernetes 简介：service 和 kube-proxy 原理 - cizixs.com](https://cizixs.com/2017/03/30/kubernetes-introduction-service-and-kube-proxy/)
- [使用 IPVS 实现 Kubernetes 入口流量负载均衡 - jishu.io](https://jishu.io/kubernetes/ipvs-loadbalancer-for-kubernetes/)
- [Istio 流量管理实现机制深度解析 - zhaohuabing.com](https://zhaohuabing.com/post/2018-09-25-istio-traffic-management-impl-intro/)
- [企业级服务网格架构之路解读 - jimmysong.io](https://jimmysong.io/posts/the-enterprise-path-to-service-mesh-architectures/)
- [调试 Envoy 和 Pilot - istio.io](https://preliminary.istio.io/zh/help/ops/traffic-management/proxy-cmd/)