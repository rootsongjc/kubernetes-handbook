# Service Mesh 服务网格

**注意：本书中的 Service Mesh 章节已不再维护，请转到 [istio-handbook](https://jimmysong.io/istio-handbook) 中浏览。**

Service mesh 又译作 ”服务网格“，作为服务间通信的基础设施层。Buoyant 公司的 CEO Willian Morgan 在他的这篇文章 [WHAT’S A SERVICE MESH? AND WHY DO I NEED ONE?](https://buoyant.io/2017/04/25/whats-a-service-mesh-and-why-do-i-need-one/) 中解释了什么是 Service Mesh，为什么云原生应用需要 Service Mesh。

> A service mesh is a dedicated infrastructure layer for handling service-to-service communication. It’s responsible for the reliable delivery of requests through the complex topology of services that comprise a modern, cloud native application. In practice, the service mesh is typically implemented as an array of lightweight network proxies that are deployed alongside application code, without the application needing to be aware.

今年来以 [Istio](https://istio.io) 和 [Linkderd](https://linkerd.io) 为代表的 Service Mesh 蓬勃发展，大有成为下一代语言异构微服务架构的王者之范，今天又碰巧看到了 Red Hat 的 [Burr Sutter](https://twitter.com/burrsutter) 提出了**8 Steps to Becoming Awesome with Kubernetes**，整个PPT一共60多页，很有建设性，[点此](https://github.com/rootsongjc/cloud-native-slides-share/blob/master/kubernetes/8-Steps-to-Becoming-Awesome-with-Kubernetes-readhat-burrsutter.pdf)跳转到我的GitHub上下载，我将其归档到[cloud-native-slides-share](https://github.com/rootsongjc/cloud-native-slides-share)中了。

![下一代异构微服务架构](../images/polyglot-microservices-serivce-mesh.png)

自我6月份初接触Istio依赖就发觉service mesh很好的解决了异构语言中的很多问题，而且是kuberentes service 上层不可或缺的服务间代理。关于istio的更多内容请参考 [istio中文文档](https://istio.io/zh/)。

## 什么是 service mesh？

Service mesh 有如下几个特点：

- 应用程序间通讯的中间层
- 轻量级网络代理
- 应用程序无感知
- 解耦应用程序的重试/超时、监控、追踪和服务发现

目前两款流行的 service mesh 开源软件 [Istio](https://istio.io) 和 [Linkerd](https://linkerd.io) 都可以直接在 kubernetes 中集成，其中 Linkerd 已经成为 CNCF 成员。

## 理解 Service Mesh

如果用一句话来解释什么是 Service Mesh，可以将它比作是应用程序或者说微服务间的 TCP/IP，负责服务之间的网络调用、限流、熔断和监控。对于编写应用程序来说一般无须关心 TCP/IP 这一层（比如通过 HTTP 协议的 RESTful 应用），同样使用 Service Mesh 也就无须关系服务之间的那些原来是通过应用程序或者其他框架实现的事情，比如 Spring Cloud、OSS，现在只要交给 Service Mesh 就可以了。

[Phil Calçado](http://philcalcado.com/) 在他的这篇博客 [Pattern: Service Mesh](http://philcalcado.com/2017/08/03/pattern_service_mesh.html) 中详细解释了 Service Mesh 的来龙去脉：

1. 从最原始的主机之间直接使用网线相连
2. 网络层的出现
3. 集成到应用程序内部的控制流
4. 分解到应用程序外部的控制流
5. 应用程序的中集成服务发现和断路器
6. 出现了专门用于服务发现和断路器的软件包/库，如 [Twitter 的 Finagle](https://finagle.github.io/) 和 [Facebook  的 Proxygen](https://code.facebook.com/posts/1503205539947302)，这时候还是集成在应用程序内部
7. 出现了专门用于服务发现和断路器的开源软件，如 [Netflix OSS](http://netflix.github.io/)、Airbnb 的 [synapse](https://github.com/airbnb/synapse) 和 [nerve](https://github.com/airbnb/nerve)
8. 最后作为微服务的中间层 service mesh 出现

Service mesh 的架构如下图所示：

![Service Mesh 架构图](../images/serivce-mesh-control-plane.png)

图片来自：[Pattern: Service Mesh](http://philcalcado.com/2017/08/03/pattern_service_mesh.html)

Service mesh 作为 sidecar 运行，对应用程序来说是透明，所有应用程序间的流量都会通过它，所以对应用程序流量的控制都可以在 serivce mesh 中实现。

## Service mesh如何工作？

下面以 Linkerd 为例讲解 service mesh 如何工作，Istio 作为 service mesh 的另一种实现原理与 linkerd 基本类似，后续文章将会详解 Istio 和 Linkerd 如何在 kubernetes 中工作。

1. Linkerd 将服务请求路由到目的地址，根据中的参数判断是到生产环境、测试环境还是 staging 环境中的服务（服务可能同时部署在这三个环境中），是路由到本地环境还是公有云环境？所有的这些路由信息可以动态配置，可以是全局配置也可以为某些服务单独配置。
2. 当 Linkerd 确认了目的地址后，将流量发送到相应服务发现端点，在 kubernetes 中是 service，然后 service 会将服务转发给后端的实例。
3. Linkerd 根据它观测到最近请求的延迟时间，选择出所有应用程序的实例中响应最快的实例。
4. Linkerd 将请求发送给该实例，同时记录响应类型和延迟数据。
5. 如果该实例挂了、不响应了或者进程不工作了，Linkerd 将把请求发送到其他实例上重试。
6. 如果该实例持续返回 error，Linkerd 会将该实例从负载均衡池中移除，稍后再周期性得重试。
7. 如果请求的截止时间已过，Linkerd 主动失败该请求，而不是再次尝试添加负载。
8. Linkerd 以 metric 和分布式追踪的形式捕获上述行为的各个方面，这些追踪信息将发送到集中 metric 系统。

## 为何使用 service mesh？

Service mesh 并没有给我们带来新功能，它是用于解决其他工具已经解决过的问题，只不过这次是在 Cloud Native 的 kubernetes 环境下的实现。

在传统的 MVC 三层 Web 应用程序架构下，服务之间的通讯并不复杂，在应用程序内部自己管理即可，但是在现今的复杂的大型网站情况下，单体应用被分解为众多的微服务，服务之间的依赖和通讯十分复杂，出现了 twitter 开发的 [Finagle](https://twitter.github.io/finagle/)、Netflix 开发的 [Hystrix](https://github.com/Netflix/Hystrix) 和 Google 的 Stubby 这样的 ”胖客户端“ 库，这些就是早期的 service mesh，但是它们都近适用于特定的环境和特定的开发语言，并不能作为平台级的 service mesh 支持。

在 Cloud Native 架构下，容器的使用给予了异构应用程序的更多可行性，kubernetes 增强的应用的横向扩容能力，用户可以快速的编排出复杂环境、复杂依赖关系的应用程序，同时开发者又无须过分关心应用程序的监控、扩展性、服务发现和分布式追踪这些繁琐的事情而专注于程序开发，赋予开发者更多的创造性。

## Istio VS Linkerd

当前的Service Mesh实现主要有两大阵营，要给是Linkerd（也是最初提出该概念的），另一个是Istio，当然还有很多其他号称也是Service Mesh，比如Nginx出品的[Nginmesh](https://github.com/nginmesh/nginmesh)。

| **Feature** | **Istio**     | **Linkerd**                  |
| ----------- | ------------- | ---------------------------- |
| 部署架构        | Envoy/Sidecar | DaemonSets                   |
| 易用性         | 复杂            | 简单                           |
| 支持平台        | kuberentes    | kubernetes/mesos/Istio/local |
| 当前版本        | 0.3.0         | 1.3.3                        |
| 是否已有生产部署    | 否             | 是                            |

下图是Istio和Linkerd架构的不同，Istio是使用Sidecar模式，将Envoy植入到Pod中，而Linkerd则是在每台node上都以DaemonSet的方式运行。

![Istio vs linkerd](../images/istio-vs-linkerd.jpg)

关于Istio和Linkerd的详细信息请参考 [安装并试用Istio service mesh](istio-installation.md) 与 [Linkerd 使用指南](linkerd-user-guide.md)。

另外出品Linkerd的公司buoyant又推出了[conduit](https://conduit.io)，这是一种更轻量级的Service Mesh。

## 参考

- [WHAT’S A SERVICE MESH? AND WHY DO I NEED ONE?](https://buoyant.io/2017/04/25/whats-a-service-mesh-and-why-do-i-need-one/)
- [So what even is a Service Mesh? Hot take on Istio and Linkerd](http://redmonk.com/jgovernor/2017/05/31/so-what-even-is-a-service-mesh-hot-take-on-istio-and-linkerd)
- [linkerd: A service mesh for AWS ECS](https://medium.com/attest-engineering/linkerd-a-service-mesh-for-aws-ecs-937f201f847a)
- [Introducing Istio: A robust service mesh for microservices](https://istio.io/blog/istio-service-mesh-for-microservices.html)
- [Application Network Functions With ESBs, API Management, and Now.. Service Mesh?](http://blog.christianposta.com/microservices/application-network-functions-with-esbs-api-management-and-now-service-mesh/)
- [Pattern: Service Mesh](http://philcalcado.com/2017/08/03/pattern_service_mesh.html)
- [Istio官方中文文档](https://istio.io/zh/)