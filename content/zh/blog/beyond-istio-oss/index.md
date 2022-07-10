---
title: "Istio 服务网格的现状及未来"
draft: true
date: 2022-07-06T12:27:49+08:00
description: "本文讲解 Istio 诞生的背景，在云原生技术栈中的地位，以及 Istio 的发展方向。"
categories: ["Istio"]
tags: ["eBPF","wasm","零信任","Service Mesh","Istio"]
type: "post"
image: "images/banner/beyond.jpg"
---

{{<callout note 关于本文>}}
本文根据笔者在 GIAC 深圳 2022 年大会上的的演讲[《Beyond Istio OSS —— Istio 的现状及未来》](https://giac.msup.com.cn/2022sz/course?id=16093)整理而成。
{{</callout>}}

本文回顾了 Istio 开源近五年来的发展，并展望了 Istio 的发展方向。主要阐述了以下观点：

- 因为 Kubernetes、微服务、DevOps 及云原生架构的流行，导致服务网格技术的兴起；
- 在中国 Istio 成为了服务网格的代名词；
- Kubernetes 和可编程代理的出现，为 Istio 的实现打好了技术基础；
- 虽然 eBPF 可以加速 Istio 中的透明流量劫持，但无法取代服务网格中的 sidecar；
- Istio 的未来是构建零信任网络；

接下来我们从 Istio 诞生的背景开始本文。

## Istio 诞生的前夜{#the-dawn-of-istio}

2013 年起，随着移动互联网的爆发，企业对应用迭代的效率要求更高，应用程序架构开始从单体转向微服务，DevOps 也开始变得流行。同年随着 Docker 的开源，解决了应用封装和隔离的问题，使得应用在编排系统中调度变得更容易。2014 年 Kubernetes、Spring Boot 开源，Spring 框架开发微服务应用开始流行，在接下来的几年间大批的 RPC 中间件开源项目出现，如 Google 在 2016 年发布 gRPC 1.0，蚂蚁在 2018 年开源 [SOFAStack](https://www.sofastack.tech/) 等，微服务框架百花齐放。为了节约成本，增加开发效率，使应用更具弹性，越来越多的企业正在迁移上云，但这不仅仅是将应用搬到云上那么简单，为了更高效地利用云计算，一套「云原生」方法和理念也呼之欲出。

## Istio 开源时间线{#istio-open-time-line}

Istio 开源发展时间线如下图所示。

![Istio 开源发展时间线示意图](istio-history.svg)

下面我们来简单回顾下 Istio 开源大事件：

- 2016 年 9 月：因为 Envoy 是 Istio 中的重要组成，Istio 的开源时间线应该有 Envoy 一部分。起初 Envoy 在 Lyft 内部仅作为边缘代理，在 Envoy 开源之前已在 Lyft 内部得到大规模生产验证。其实在 Envoy 开源之前就已经得到开源之后得到了 Google 工程师的注意 [^1]，那时候 Google 正打算推出一个服务网格的开源项目，一开始还是打算使用 Nginx 作为代理！ 2017 年，Envoy 捐献给了 [CNCF](https://cncf.io)。
- 2017 年 5 月：Istio 由 Google、IBM 和 Lyft 联合宣布开源 [^2]。一开始就使用了微服务架构，确定了数据平面和控制平面的组成以及 Sidecar 模式。
- 2018 年 3 月：Kubernetes 顺利的成为从 CNCF 中第一个毕业的项目，变得越来越「无聊」，基础 API 已经定型，CNCF 正式将服务网格（Service Mesh）写入到了云原生的第二版定义 [^3] 中。当年笔者当前就职的公司，由 Google Istio 初创团队创立的 [Tetrate](https://tetrate.io) 成立了。服务网格在中国开始爆发，ServiceMesher 社区也在蚂蚁集团的支持下成立，在中国布道服务网格技术。
- 2018 年 7 月：Istio 1.0 发布，号称「生产可用」，Istio 团队重组。
- 2020 年 3 月：Istio 1.5 发布，架构回归单体，发布周期确定，每三个月发布一个大版本，API 趋于稳定。
- 2020 年至今：Istio 的发展主要着重于 Day 2 Operation [^4]、性能优化和扩展性发面，多个围绕 Istio 生态的开源项目开始出现，例如 [Slime](https://github.com/slime-io/slime/)、[Areaki](https://github.com/aeraki-mesh/aeraki)、[Merbridge](https://github.com/merbridge/merbridge)。

## 为什么 Istio 会在 Kubernetes 之后出现？{#why-istio-born-after-kubernetes}

这里所说的出现，指的是「服务网格」概念的诞生。微服务和容器化之后，异构语言使用的增加，服务的数量激增，容器的生命周期变短是导致服务网格出现的根本原因。

为了使开发者最小成本地管理服务间的流量成为可能，Istio 需要解决三个问题：

1. 透明流量劫持应用间的流量，这一点对于开发者来说就意味着不需要修改应用程序就可以快速使用 Istio 带来的能力；
1. 另一点是运维层面，如何为每个应用注入一个代理，同时高效地管理这些分布式的 sidecar 代理；
1. 一个可以通过 API 配置的，高效可扩展的 sidecar 代理；

以上三个条件对于 Istio 服务网格来说缺一不可，而且，从中我们可以看到，这些要求基本都是对于 sidecar 代理的要求，这个代理的选择将直接影响该项目的走向与成败。

为了解决以上三个问题，Istio 选择了

1.  容器编排调度平台：Kubernetes
1.  可编程代理：Envoy

从下图中我们可以看到服务从 Kubernetes 到 Istio 部署架构的变迁，其中有诸多变与不变。

![Kubernetes 到 Istio 的架构改变示意图](kubernetes-to-istio.svg)

从 Kubernetes 到 Istio，概括的讲应用的部署架构有如下特点：

- Kubernetes 管理应用的生命周期，具体来说，就是应用的部署和管理（扩缩容、自动恢复、发布策略）。
- 基于 Kubernetes 的自动 sidecar 注入，实现了透明流量拦截。先通过 sidecar 代理拦截到微服务间流量，再通过控制平面配置管理微服务的行为。如今服务网格的部署模式也迎来了新的挑战，sidecar 已经不是 Istio 服务网格所必须的，基于 gRPC 的无代理的服务网格 [^5] 也在测试中。

- 服务网格将流量管理从 Kubernetes 中解耦，服务网格内部的流量无须 kube-proxy 组件的支持， 通过接近微服务应用层的抽象，管理服务间的流量，实现安全性和可观察性功能。
- 控制平面通过 xDS 协议发放代理配置给数据平面，已实现 xDS 的代理有 [Envoy](https://envoyproxy.io) 和蚂蚁开源的 [MOSN](https://mosn.io)。

- Kubernetes 集群外部的客户端访问集群内部服务时，原先是通过 Kubernetes [Ingress](https://lib.jimmysong.io/kubernetes-handbook/concepts/ingress/)，在有了 Istio 之后，会通过 Gateway 来访问 [^6]。

### 透明流量劫持{#traffic-intercept}

如果你使用的是如 gRPC 这类中间件开发微服务，在程序中集成 SDK 后，SDK 中的拦截器会自动为你拦截流量，如下图所示。

![gRPC 的拦截器示意图](grpc.svg)

如何让 Kubernetes  pod 中的流量都通过代理呢？答案是在每个应用程序 pod 中注入一个代理，与应用共享网络空间，再通过修改 pod 内的流量路径，让所有进出 pod 的流量都经过 sidecar，其架构如下图所示。

![Istio 中的透明流量劫持示意图](istio-route-iptables.svg)

从图中我们可以看到其中有一套非常复杂的 iptables 流量劫持逻辑，使用 iptables 的好处是适用于任何 Linux 操作系统。但是这也带来了一些副作用：

1. Istio 网格中所有的服务都需要在进出 pod 时都增加了一个网络跳跃点（hop），虽然每次 hop 可能只有两三毫秒，但是随着网格中服务和服务间的依赖增加，这种延迟可能会显著增加，对于那种追求低延迟的服务可能就不适用于服务网格了；
2. 因为 Istio 向数据平面中注入了大量的 sidecar，尤其是当服务数量增大时，控制平面需要下发更多的 Envoy 代理配置到数据平面，这样会使数据平面占用大量的系统内存和网络资源；

针对这两个问题，如何优化服务网格呢？

1. 使用 proxyless 模式：取消 sidecar 代理，重新回到 SDK；
2. 优化数据平面：减少下发到数据平面的配置的频率和大小；
3. eBPF：使用 eBPF 优化网络劫持；

本文将在后面[性能优化](#performance-optimizing)一节讲解这些细节。

### Sidecar 运维管理{#sidecar-management}

Istio 是在 Kubernetes 的基础上构建的，它可以利用 Kubernetes 的容器编排和生命周期管理，在 Kubernetes 创建 pod 时，通过准入控制器自动向 pod 中注入 sidecar。下图展示了

为了解决 Sidecar 的资源消耗问题，有人为服务网格提出了有四种部署模式，如下图所示。

![服务网格的四种部署模式示意图](deployment-model.svg)

下表中详细对比了这四种部署方式，它们各有优劣，具体选择哪种根据实际情况而定。

| **模式**                           | **内存开销**                                                 | **安全性**                                                   | **故障域**                                                   | **运维**                                                  |
| :--------------------------------- | :----------------------------------------------------------- | :----------------------------------------------------------- | :----------------------------------------------------------- | :-------------------------------------------------------- |
| **Sidecar 代理**                   | 因为为每个 pod 都注入一个代理，所以开销最大。                | 由于 sidecar 必须与工作负载一起部署，工作负载有可能绕过 sidecar。 | Pod 级别隔离，如果有代理出现故障，只影响到 Pod 中的工作负载。 | 可以单独升级某个工作负载的 sidecar 而不影响其他工作负载。 |
| **节点共享代理**                   | 每个节点上只有一个代理，为该节点上的所有工作负载所共享，开销小。 | 对加密内容和私钥的管理存在安全隐患。                         | 节点级别隔离，如果共享代理升级时出现版本冲突、配置冲突或扩展不兼容等问题，则可能会影响该节点上的所有工作负载。 | 不需要考虑注入 Sidecar 的问题。                           |
| **Service Account / 节点共享代理** | 服务账户 / 身份下的所有工作负载都使用共享代理，开销小。      | 工作负载和代理之间的连接的认证及安全性无法保障。             | 节点和服务账号之间级别隔离，故障同 “节点共享代理”。          | 同 “节点共享代理”。                                       |
| **带有微代理的共享远程代理**       | 因为为每个 pod 都注入一个微代理，开销比较大。                | 微代理专门处理 mTLS，不负责 L7 路由，可以保障安全性。        | 当需要应用 7 层策略时，工作负载实例的流量会被重定向到 L7 代理上，若不需要，则可以直接绕过。该 L7 代理可以采用共享节点代理、每个服务账户代理，或者远程代理的方式运行。 | 同 “Sidecar 代理”。                                       |

### 可编程代理{#programmable-proxy}

Flomesh 的张晓辉曾在 [为什么需要可编程代理](https://cloudnative.to/blog/what-and-why-programmable-proxy/) 博客中详细说明了代理软件的发展演化过程，我下面将引用他的一些观点，说明可编程代理 Envoy 在 Istio 中的关键作用。

下图展示了代理软件从配置到可编程模式的演化过程，及每个阶段中的代表性代理软件。

{{<figure title="代理软件的演化示意图" width=70%" alt="图片" src="proxy-evolution.svg">}}

整个代理演化过程都是随着应用从本地和单体，越来越走向大规模和分布式。下面我将简要概括代理软件的发展过程：

- **配置文件时代**：几乎所有软件都有配置文件，代理软件因为其相对复杂的功能，更离不开配置文件。该阶段的代理主要使用 C 语言开发，包括其扩展模块，突出的代理本身的能力。这也是我们使用代理最原始最基础的形式，这些代理包括 Nginx、Apache HTTP Server、[Squid](http://www.squid-cache.org/) 等；
- **配置语言时代**：这个时代的代理，更具扩展性和灵活性，比如动态数据获取和配套的逻辑判断。代表性软件包括扩 [Varnish](https://varnish-cache.org/) 和 HAProxy；
- **脚本语言时代**：从脚本语言的引入开始，代理软件才真正走向的可编程，我们可以更方便的使用脚本在代理中增加动态逻辑，增加了开发效率。代表性的软件是 Nginx 及其支持的脚本语言；
- **集群时代**：随着云计算的普及，大规模部署和动态配置 API 成了代理所必需的能力，而且随着网络流量的增加，大规模代理集群也应运而生。这个时代的代表性代理软件有 Envoy、Kong 等；
- **云原生时代**：多租户、弹性、异构混合云、多集群、安全和可观测，这些都是云原生时代对代理所提出的更高要求。这也会服务网格的历史机遇，代表性软件有 Istio、Linkerd、[Pypi](https://flomesh.io/)。

## 这些都是服务网格吗？{#are-they-service-mesh}

现在我将列举现有的服务网格项目，我们一起探索服务网格的发展规律和本质。下表对比了当前流行的开源的「服务网格」项目 [^7]。

{{<table 服务网格开源项目对比表>}}

| 对比项     | Istio                                                    | Linkerd                                                     | Consul Connect                                               | Traefik Mesh                                                 | Kuma                                | Open Service Mesh (OSM)             |
| :--------- | :------------------------------------------------------- | :---------------------------------------------------------- | :----------------------------------------------------------- | :----------------------------------------------------------- | :---------------------------------- | ----------------------------------- |
| 当前版本   | 1.14                                                     | 2.11                                                        | 1.12                                                         | 1.4                                                          | 1.5                                 | 1.0                                 |
| 许可证     | Apache License 2.0                                       | Apache License 2.0                                          | Mozilla License                                              | Apache License 2.0                                           | Apache License 2.0                  | Apache License 2.0                  |
| 发起者     | Google、IBM、Lyft                                        | Buoyant                                                     | HashiCorp                                                    | Traefik Labs                                                 | Kong                                | Microsoft                           |
| 服务代理   | Envoy，支持 gRPC 的 proxyless 模式                       | [Linkerd2-proxy](https://github.com/linkerd/linkerd2-proxy) | 默认为 [Envoy](https://www.envoyproxy.io/)，可替换           | [Traefik Proxy](https://traefik.io/traefik/)                 | [Envoy](https://www.envoyproxy.io/) | [Envoy](https://www.envoyproxy.io/) |
| 入口控制器 | Envoy，自定义的 Ingress，支持 Kubernetes  Gateway API    | 无内置                                                      | Envoy，支持 Kubernetes Gateway API                           | 无内置                                                       | Kong                                | 支持 Contour、Nginx，兼容其他       |
| 治理       | Istio Community 和 Open Usage Commons，已提议捐献给 CNCF | CNCF                                                        | 查看 [贡献指南](https://github.com/hashicorp/consul/blob/master/.github/CONTRIBUTING.md) | 查看 [贡献指南](https://github.com/traefik/mesh/blob/master/CONTRIBUTING.md) | CNCF                                | CNCF                                |

{{< /table >}}

下面总结一下上表中的开源项目，同时追加几个与服务网格息息相关的项目，如下：

- [Istio](https://istio.io)：目前最流行的服务网格项目之一，在中国几乎成为了服务网格的代名词；
- [Envoy](https://envoyproxy.io)：Envoy 本身只是代理，也经常被作为其他基于 Envoy 的服务网格的 sidecar，也经常被用来构建 API Gateway；
- [Linkerd](https://linkerd.io)：最早出现的服务网格，「Service Mesh」概念提出者，第一个进入 CNCF 的服务网格项目，使用自研的 Rust 语言编写轻量级 sidecar 代理；
- [Traefik Mesh](https://traefik.io/traefik-mesh/)：由 Traefik 推出的服务网格项目，使用 Treafik proxy 作为 sidecar，支持 SMI（接下来会提到），它的特点是对应用的无侵入性，不会在 pod 中注入 sidecar，
- [Kuma](https://kuma.io/)：由 Kong 推出的服务网格项目，使用 Envoy 作为 Sidecar 代理，特色是使用 Kong 自家的
- [Consul Connect](https://www.consul.io/docs/connect)：Consul 服务网格，使用 Envoy 作为 sidecar 代理；
- [Open Service Mesh](https://openservicemesh.io/)：由微软开源的服务网格，使用 Envoy 作为 sidecar，兼容 SMI（同样是微软提出）。
- [Service Mesh Performance（SMP）](https://smp-spec.io/)：标准化了服务网格值的指标，通过捕获基础设施容量、服务网格配置和工作负载元数据的细节来描述任何部署的性能；
- [Service Mesh Interface（SMI）](https://smi-spec.io/)：它不是服务网格，而只是一套服务网格实现标准，与 OAM、SPIFFE、CNI、CSI 等类似都是定义接口标准，具体实现就不一而足了。目前 Traefik Mesh 和 Open Service Mesh 声明支持该规范。
- [Network Service Mesh](https://networkservicemesh.io/)：有必要提一下这个项目，因为经常有人把它错认为是一个服务网格。实际上，它面向的是三层网络，使用它可以在不更换 CNI 插件的前提下，连接多云/混合云。它并不是我们所定义的「服务网格」，而是服务网格的一个有力补充（虽然名字里带有服务网格比较有迷惑性）。

纵观以上所谓的「服务网格」项目，我们可以看出大部分服务网格项目的发起者都是根据代理起家，然后做控制平面。而且 Istio、Consul Connect、Open Service Mesh、Kuma 都是使用 Envoy 作为 sidecar 代理。只有 Linkerd 和 Traefik Mesh 推出了自己的代理。而所有的服务网格项目都支持 sidecar 模式。除了 Istio、Linkerd、Consul Connect 已应用于生产上，其他服务网格项目目前还只能算是个「玩具」。

## 性能优化{#performance-optimizing}

在 Istio 1.5 版本确定了稳定的架构之后，社区的主要精力在于优化 Istio 的性能。下面我将向你详细介绍 Istio 中的性能优化方法，包括：

- 采用 Proxyless 模式；
- 使用 eBPF 优化流量劫持；
- 控制平面性能优化；
- 数据平面性能优化；

### Proxyless 模式{#proxyless-pattern}

Proxyless 模式是 Istio 在 1.11 版本中提出的实验特性 —— [基于 gRPC 和 Istio 的无 sidecar 代理的服务网格](https://lib.jimmysong.io/translation/grpc-proxyless-service-mesh/)。使用该模式可以直接将 gRPC 服务添加到 Istio 中，而不需要再向 Pod 中注入 Envoy 代理。下图展示了 sidecar 模式与 proxyless 模式的对比图。

{{<figure title="Sidecar 模式 vs Proxyless 模式" width="100%" alt="图片" src="sidecar-to-proxyless.svg">}}

从上图中我们可以看到，虽然 proxyless 模式不使用 proxy 进行数据面通信，但仍然需要一个 agent 来进行初始化和与控制面的通信。首先，agent 在启动时生成一个[引导文件](https://github.com/grpc/proposal/blob/master/A27-xds-global-load-balancing.md#xdsclient-and-bootstrap-file)，与为 Envoy 生成引导文件的方式相同。这告诉 gRPC 库如何连接到 istiod，在哪里可以找到用于数据平面通信的证书，向控制面发送什么元数据。接下来，agent 作为 xDS proxy，代表应用程序与 `istiod` 进行连接和认证。最后，agent 获取并轮换数据平面通信中使用的证书。

有人说 proxyless 模式又回到了基于 SDK 开发微服务的老路，服务网格的优势丧失殆尽，那还能叫做服务网格吗 [^9]？其实这也是一种对性能的妥协 —— 如果你主要使用 gRPC 来开发微服务的话，只需要维护不同语言的 gRPC 版本，即可以通过控制平面来管理微服务了。

### 使用 eBPF 优化流量劫持{#ebpf}

在[透明流量劫持](#traffic-intercept)一节，我们可以看到一个服务间的流量在到达目的地 pod 时经过的 iptables 规则和路径，其中需要经过多条 iptables 规则，如 `PREROUTING`、`ISTIO_INBOUND`、`ISTIO_IN_REDIRECT`、`OUTPUT`、`ISTIO_OUTPUT`、`POSTROUTING` 等。假设现在有一个服务 A 想要调用非本地主机上的另一个 pod 中的服务 B，经过的网络堆栈如下图所示。

![非同主机 Pod 间的服务访问路径（iptables 模式）](iptables-process.svg)

从图中我们可以看到整个调用流程中经过四次 iptables，其中 Pod A 中的从 Envoy 的出站（iptables2）和 Pod B 中的从 eth0 的入站（iptables3）的 iptables 路由是无法避免的，那么剩下的两个 iptables1 和 iptables4 是否可以优化呢？让两个 socket 直接通信，不就可以缩短网络路径了吗？这就需要通过 eBPF 编程，使得：

- Service A 的流量从直接发送到 Envoy 的 Inbound socket 上；
- Pod B 中 Envoy 接收到入站流量后，已经确定流量是要发送给本地的服务，直接对接 Outbound socket 与 Service B；

使用 eBPF 模式的透明流量拦截网络路径如下图所示。

![非同主机 Pod 间的服务访问路径（eBPF 模式）](ebpf-diff-node.svg)

如果要访问的服务 A 和服务 B 在同一个节点上，那么网络路径将更短。

![同主机 Pod 间的网络访问路径（eBPF 模式）](ebpf-same-node.svg)

同一个节点中的服务间访问完全绕过了 TCP/IP 堆栈，变成了 socket 间的直接访问。

{{<callout note "什么是 eBPF？">}}

我们知道修改 Linux 内核代码很难，新特性发布到内核中需要很长的周期。eBPF 是一个框架，允许用户在操作系统的内核内加载和运行自定义程序。也就是说，有了 eBPF，你不需要直接修改内核，就可以扩展和改变内核的行为。下面我将简要的为大家介绍一下 eBPF：

- eBPF 程序加载到内核中后需要通过验证器的验证才可以运行，验证器可以防止 eBPF 程序超越权限的访问，这样可以确保内核的安全；
- eBPF 程序是附着于内核事件上的，当有进入或退出内核函数时被触发；
- 内核空间的 eBPF 程序必须使用能够支持生成 eBPF 字节码格式的编译器的语言编写，目前你可以用 C 和 Rust 语言编写 eBPF 程序；
- eBPF 程序对于不同的 Linux 版本存在兼容性问题；

由于 eBPF 程序可以直接监听和操作 Linux 内核，具有对系统最底层的透视，就可以在流量管理、可观测性和安全发挥作用。有关 eBPF 的详细介绍请参考笔者翻译的[《什么是 eBPF》](https://lib.jimmysong.io/what-is-ebpf/)电子书。

{{</callout>}}

开源项目 [Merbridge](https://github.com/merbridge/merbridge) 正是利用 eBPF 缩短了透明流量劫持的路径，优化了服务网格的性能。关于 Merbridge 实现的一些细节，请参考 [Istio 博客](https://istio.io/latest/zh/blog/2022/merbridge/)。乍看上去 eBPF 似乎从更底层实现了 Istio 的功能，更大有取代 sidecar 的趋势。

### 控制平面性能优化{#control-plane-perf-optimizing}

以上两种优化都是针对数据平面进行的，我们再来看下控制平面的性能优化。你可以把服务网格想象成是一场演出，控制平面是总导演，数据平面是所有演员，导演不参与演出，但是负责指挥演员。如果这场演出的情节很简单，时长又很短，那要每个演员分配的戏份就会很少，排练起来就会很容易；如果是一个大型演出，演员的数量多，情节有很复杂，要想排练好这场演出，一个导演可能是不够的，他指挥不了这么多演员，因此我们需要多名副导演（扩大控制平面实例数量）；我们还需要给演员准备好台词和脚本，如果演员也可以一个镜头完成一连串的台词和场景的表演（减少都数据平面的打扰，批量推送更新），那我们的排练是不是更加高效？

从上面的类比中，你应该可以找到控制平面性能优化的方向了，那就是：

- 减少需要推送的配置大小；
- 批处理代理推送；
- 扩大控制平面规模；

#### 减少需要推送的配置{#reduce-config-size}

优化控制平面性能最简单也是最直接的方式就是减少要推送的配置大小。假设有工作负载 A，如果将与 A 相关的代理配置，即 A 需要访问的服务的配置推送到 A 上，而不是将网格内所有服务的配置都推送给 A，这样就可以大大压缩要推送的配置的大小及应用范围。Istio 中的 [Sidecar 资源](https://lib.jimmysong.io/istio-handbook/config-networking/sidecar/)可以帮助我们实现这一点。下面是 Sidecar 配置示例：

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: Sidecar
metadata:
  name: default
  namespace: cn-bj
spec:
  workloadSelector:
    labels:
      app: app-a
  egress:
  - hosts:
    - "cn-bj/*"
```

我们通过 `workloadSelector` 字段可以限制该 Sidecar 配置适用的工作负载范围，而 `egress` 字段可以确定该工作负载以来的服务范围，这样控制平面就可以仅向服务 A 推送其依的赖服务配置，大大减低要向数据平面推送的配置大小，减少了服务网格的内存和网络消耗。

#### 批处理代理配置推送{#batch-push-conf}

控制平面 Istiod 向数据平面推送代理配置的过程比较复杂，下图展示了其中的流程。

![Istiod 向数据平面推送代理配置的流程图](istiod-push.svg)

管理员配置 Istio 网格后，Istiod 中推送代理配置的流程是这样的：

1. 管理员更新配置的事件会触发数据平面的配置同步；
2. Istio 的 `DiscoveryServer` 组件监听到这些事件后不会立即将配置推送到数据平面，而是将这些事件添加到队列中，持续合并一段时间内的事件，这个过程叫做去抖动（debouncing），就是为了防止频繁的更新数据平面配置；
3. 在去抖动周期过后，这些事件将被推送到队列中；
4. Istiod 会限制同时推送的请求数量，以加快推送进度；
5. 事件被转换成 Envoy 的配置推送的数据平面的工作负载上；

从以上流程中我们可以看出，优化配置推送的关键就是步骤 2 中去抖动周期和步骤 4 中的限流设置。有这样几个环境变量可以帮助你设置控制平面的推送：

- `PILOT_DEBOUNCE_AFTER`：指定去抖动的时间，将事件添加到推送队列中。
- `PILOT_DEBOUNCE_MAX`：指定允许事件去抖动的最长时间。
- `PILOT_ENABLE_EDS_DEBOUNCE`：指定端点更新是否符合去抖动规则或具有优先权并立即落入推送队列。
- `PILOT_PUSH_THROTTLE`：指定同时处理的推送请求。

关于这些环境变量的默认值和具体配置请参考 [Istio 文档](https://istio.io/latest/docs/reference/commands/pilot-agent/#envvars)。

这些值究竟如何设置，可以遵循以下原则：

- 如果控制平面资源空闲，为了加快配置更新的传播速度，你可以：
  - 缩短去抖动周期，增加推送次数；
  - 增加同时处理的推送请求数量；
- 如果控制平面饱和，为了降低性能瓶颈，你可以：
  - 延迟去抖动周期，减少推送次数；
  - 增加同时处理的推送请求的数量；

至于如何设置最优解，需要结合你的可观测系统来调试。

#### 扩大控制平面规模{#scale-up-control-plane}

如果设置去抖动批处理和 Sidecar 还无法优化控制平面性能的话，最后的选择就是扩大控制平面的规模，包括扩大单个 Istiod 实例的资源和增加 Istiod 的实例个数，究竟采用哪种扩展方式视情况而定：

- 当单个 Istiod 的资源占用饱和时，优先推荐你扩大 Istiod 的实例大小，这通常是因为服务网格中有太多的资源（Istio 的自定义资源，如 VirtualService、DestinationRule 等）需要处理；
- 然后增加 Istiod 的实例个数，这样可以分散个实例要管理的工作负载数量；

### 数据平面性能优化

Apache SkyWalking 可以作为 Istio 提供可观测性工具，还可以帮助我们在进行服务动态调试和故障排除剖析服务的性能，其最新推出的 [Apache SkyWalking Rover](https://github.com/apache/skywalking-rover) 组件可以利用 eBPF 技术来准确定位 Istio 的关键性能问题 [^12]。

在数据平面，我们可以通过以下方式来增加 Envoy 的吞吐量以优化 Istio 的性能：

- 禁用 Zipkin 追踪或减少采样率
- 简化访问日志格式
- 禁用 Envoy 的访问日志服务（ALS）

以上优化方式对 Envoy 吞吐量的影响数据请参阅 [使用 eBPF 准确定位服务网格的关键性能问题](https://lib.jimmysong.io/blog/pinpoint-service-mesh-critical-performance-impact-by-using-ebpf/#introducing-skywalking-rover)。

## 服务网格的领衔主演  Envoy{#starring-envoy}

我们知道服务网格是由数据平面和控制平面组成的，从上面的服务网格开源项目列表中我们可以看到，服务网格开源项目大部分都是基于 Envoy，然后开发自己的控制平面。还记得我在本文前面将服务网格比作演出吗？在这场服务网格的演出中，毫无以为 Envoy 就是领衔主演 —— Envoy 发明的 xDS 协议，基本成为服务网格的通用 API，众多的服务网格开源项目都使用 Envoy 作为数据平面。下面展示的是 Envoy 的架构图。

![Envoy 架构图](envoy-arch.svg)

xDS 是 Envoy 区别于其他代理的核心，因为它的代码和解析流程十分复杂 [^10]，扩展起来也很有难度。下面展示的是 Istio 组件拓扑图，从图中我们可以看到 Istio 数据平面的 Sidecar 容器中不止有 `envoy` 这一个进程，还有一个 `pilot-agent` 进程。

![Istio 组件拓扑图](istio-component.svg)

`pilot-agent` 进程的作用如下：

- 作为 `envoy` 的父进程，负责 Envoy 的生命周期管理；
- 配置身份和证书；
- 收集 Envoy 统计信息，汇总 sidecar 的统计数据供 Prometheus 搜集；
- 内置本地 DNS 代理，用于解析 Kubernetes DNS 解析不了的集群内部域名的场景；
- 对 Envoy 和 DNS 代理进行健康检查；

从以上功能中我们可以看出 `pilot-agent` 进程主要是用于与 Istiod 交互，为 Envoy 起到指挥和辅助的作用，Istio 的核心组件是 Envoy。那么 Envoy 会不会「演而优则导」，不再配合 Istio，构建一套自己的控制平面呢？

{{<callout note 请读者思考一下>}}
`pilot-agent` 的功能能否直接内置到 Envoy 中，从而取消 `pilot-agent` 呢？
{{</callout>}}

## Envoy Gateway 统一服务网格网关{#envoy-gateway}

在 Kubernetes 中，除 Service 资源对象之外，最早用来暴露集群中服务的资源对象是 Ingress。使用 Ingress 你只需要为集群开放一个对外的访问点即可，通过 HTTP Hosts 和 `path` 来路由流量到具体的服务。相对于直接在 `service` 资源上暴露服务来说，可以减少集群的网络访问点（PEP）[^11] ，降低集群被网络攻击的风险。使用 Ingress 访问集群内的服务流程如下图所示。

![Kubernetes Ingress 流量访问流程图](ingress.svg)

在 Kubernetes 之前，API Gateway 软件就已经被广泛用作边缘路由了，在引用 Istio 时又增加了 Istio 自定义的 Gateway 资源，使得访问 Istio 服务网格中的资源又多了一种选择，如下图所示。

![访问 Istio 网格中的服务的方式](access-cluster.svg)

现在，要想暴露单个 Istio 网格中的服务，`NodePort`、`LoadBalance`、Istio 自定义 Gateway、Kubernetes Ingress 和 API Gateway 软件，如何选择？如果是多集群服务网格，客户端如何访问网格内的服务？我们的服务网格领衔主演 Envoy 已经在这方面做足了功夫，被以多种形式使用：

- Sidecar Proxy：正如在[前文中](#are-they-service-mesh)提到的，Istio、Kuma、Consul Connect 都使用了 Envoy 作为 sidecar 代理；
- Kubernetes Ingress Controller/API Gateway：[Contour](https://github.com/projectcontour/contour)、[Emissary](https://github.com/emissary-ingress/emissary)、[Hango](https://github.com/hango-io/hango-gateway)、[Gloo](https://github.com/solo-io/gloo)；

这些项目利用 Envoy 来实现服务网格和 API 网关，其中有很多功能重叠，同时又有很多专有功能，或者缺乏社区多样性，这种现状由于 Envoy 社区没有提供控制平面实现而导致的。为了改变现状，Envoy 社区发起了 [Envoy Gateway](https://github.com/envoyproxy/gateway) 项目，它不会更改 Envoy 核心代理、xDS 和 [go-control-plane](https://github.com/envoyproxy/go-control-plane)，该项目旨在结合现有的基于 Envoy 的 API Gateway 相关项目的经验 [^13]，利用带有一些 Envoy 特定扩展的  [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/) 降低 Envoy 用户使用网关的门槛。因为 Envoy Gateway 仍然通过 xDS 下发配置给 Envoy 代理，因此你还可以用它来管理支持 xDS 的网关，如 Istio Gateway。

我们现在所见的网关基本都是在单集群中作为入口网关，对于多集群和多网格就无能为力了。为了应对多集群，我们需要在 Istio 之上再添加一层网关，和一个全局的控制平面以在多集群间路由流量，如下图所示。

![多集群多网格的两级网关示意图](t2-gateway.svg)



{{<callout note 关于两级网关的简要介绍>}}
- 一级网关（下文简称 T1）位于应用边缘，用于多集群环境。同一应用会同时托管在不同的集群上，T1 网关将对该应用的请求流量在这些集群之间路由。
- 二级网关（下文简称 T2）位于一个的集群边缘，用于将流量路由到该集群内由服务网格管理的服务。
{{</callout>}}

通过在 Istio 控制平面以外增加一层全局控制平面和 API，来实现多集群服务网格管理。将 T1 网关部署为集群，可以防止单点故障。想要了解关于两级网关的更多内容，请参考[通过两级网关设计来路由服务网格流量](https://lib.jimmysong.io/blog/designing-traffic-flow-via-tier1-and-tier2-ingress-gateways/)。

T1 网关的配置如下所示：

```yaml
apiVersion: gateway.tsb.tetrate.io/v2
kind: Tier1Gateway
metadata:
  name: service1-tier1
  group: demo-gw-group
  organization: demo-org
  tenant: demo-tenant
  workspace: demo-ws
spec:
  workloadSelector:
    namespace: t1
    labels:
      app: gateway-t1
      istio: ingressgateway
  externalServers:
  - name: service1
    hostname: servicea.example.com
    port: 80
    tls: {}
    clusters:
    - name: cluster1
      weight: 75
    - name: cluster2
      weight: 25 
```

该配置将 `servicea.example.com` 同过 T1 网关暴露到网格外，并将网格外访问该服务的流量的 `75%` 转发到 `cluster1`，`25%` 的流量转发到 `cluster2`。

## Istio 开源生态{#ecosystem}

Istio 开源在至今已经五年都了，近两年来出现了很多开源项目，其中网易开源的 Slime 和腾讯开源的 Aeraki 在 Istio 之上构建了一层管理平面。

## 扩展 Istio



## 谁应该使用 Istio？

好了，说了这么说，这跟你有什么关系呢？Istio 跟你的关系取决于你的角色：

- 如果你是运维工程师，
- 如果是应用程序开发者，

下图展示了服务网格的采用路径。

![服务网格的采用路径](adopt.svg)

## 服务网格在云原生架构中的定位

技术的发展日新月异，近两年来有一些新技术出现，似乎挑战了服务网格的地位，更有人声称可以直接取代现有经典的 sidecar 模式的服务网格 [^8]，我们不要被外界嘈杂的声音所迷惑，端正服务网格在云原生技术栈中的定位。下图展示的是云原生技术堆栈。

{{<figure title="云原生技术堆栈示意图" alt="云原生技术堆栈示意图" src="cloud-native-stack.svg" width="60%">}}

解释。。。

## 服务网格将走向何处？

服务网格的两个未来趋势：

- 零信任
- 混合云

下面展示的是 Tetrate Service Bridge 的架构图。

![TSB 架构图](tsb.svg)

## 参考

[^1]: 有关 Envoy 开源的详细过程，推荐你阅读 Envoy 作者 Matt Klein 的这篇文章[网络代理 Envoy 开源五周年，创始人 Matt Klein 亲述开源心路历程及经验教训](https://lib.jimmysong.io/translation/envoy-oss-5-year/)。
[^2]: 后来 IBM 与 Google 反目，大举抨击 Google 没有遵守将 Istio 捐献给 CNCF 的约定，Google 对 Istio 商标的管理也受到了[质疑](https://thenewstack.io/googles-management-of-the-istio-service-mesh-raises-questions-in-the-cloud-native-community/)。
[^3]: 2018 年，CNCF 为云原生的重新定义是：云原生技术有利于各组织在公有云、私有云和混合云等新型动态环境中，构建和运行可弹性扩展的应用。云原生的代表技术包括容器、服务网格、微服务、不可变基础设施和声明式 API。 详见 [什么是云原生](https://lib.jimmysong.io/cloud-native-handbook/intro/what-is-cloud-native/)。
[^4]: Day-2 Operation 是系统为组织产生结果的地方。因此，要不断寻求 Day-2 Opeation 的改进，以实现效益最大化。参考 [什么是 Day-2 Operation](https://jimmysong.io/blog/what-is-day-2-operation/)。
[^5]: Istio 现已推出 proxyless 模式测试版，详见 [基于 gRPC 和 Istio 的无 sidecar 代理的服务网格](https://lib.jimmysong.io/translation/grpc-proxyless-service-mesh/)。
[^6]: Kubernetes 预计推出 [Gateway API](https://lib.jimmysong.io/kubernetes-handbook/concepts/gateway/)，Istio 也有计划使用 Kubernetes 的 Gateway API 替换当前 Istio 自定义的 [Gateway 资源](https://lib.jimmysong.io/istio-handbook/traffic-management/gateway/)。
[^7]: 表中列出的不都是真正的「服务网格」项目，比如 Network Service Mesh 和 SMI。有关服务网格项目的详细对比请参考 [servicemesh.es](https://servicemesh.es/) 网站。
[^8]: 《[告别 Sidecar—— 使用 eBPF 解锁内核级服务网格](https://lib.jimmysong.io/translation/ebpf-solve-service-mesh-sidecar/)》这篇文章在云原生社区里引起了一系列关于服务网格将被 eBPF 技术所取代的讨论。[请暂时抛弃使用 eBPF 取代服务网格和 sidecar 模式的幻想](https://jimmysong.io/blog/epbf-sidecar-and-service-mesh/)，不管有没有 eBPF，在可预见的未来，服务网格都会基于运行在用户空间的 sidecar 代理（proxyless 模式除外）。
[^9]: 在百度的服务网格团队分享的 [殊途同归，Proxyless Service Mesh 在百度的实践与思考](https://mp.weixin.qq.com/s/G8vmlJyaimux_K-548kFbA) 这篇文章里，详细介绍了百度的服务网格采用路径，以及对服务网格本质的探索。
[^10]: 关于 xDS 协议，请参考 [Envoy 中的 xDS REST 和 gRPC 协议详解](https://cloudnative.to/blog/envoy-xds-protocol/) 这篇文章。
[^11]: [PEP](https://www.oreilly.com/library/view/network-access-control/9780470398678/9780470398678_policy_enforcement_point.html)，全称 Policy Enforcement Point，策略执行点（PEP）是控制用户访问并确保策略决策点 (PDP) 做出授权决策的网络或安全设备。在一些 NAC 实现中，PDP 是有线交换机或无线接入点。在其他情况下，PEP 是防火墙、IPS、服务器或内联设备。根据实施情况，PEP 和 PDP 可以是独立设备，也可以合并为单个设备。
[^12]: Apache SkyWalking 的 Rover 组件利用 eBPF 技术改进了 SkyWalking 的剖析功能，可用于分析服务网格的性能问题，请参考 [使用 eBPF 准确定位服务网格的关键性能问题](https://lib.jimmysong.io/blog/pinpoint-service-mesh-critical-performance-impact-by-using-ebpf/)。
[^13]: 有多家公司正在合作开发 Envoy Gateway，包括 [Ambassador Labs](https://www.getambassador.io/)、[Fidelity Investments](https://www.fidelity.com/)、[Project Contour](https://projectcontour.io/) 和 [VMware](https://www.vmware.com/)。
