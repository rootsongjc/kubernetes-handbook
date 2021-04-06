# 服务网格（Service Mesh ）

Service Mesh 又译作 ”服务网格“，作为服务间通信的基础设施层。Buoyant 公司的 CEO Willian Morgan 在他的这篇文章 [What's a service mesh? And why do I need one?](https://buoyant.io/2020/10/12/what-is-a-service-mesh/) 中解释了什么是 Service Mesh，为什么云原生应用需要 Service Mesh。

英文原文如下：

A服务网格is a dedicated infrastructure layer for handling service-to-service communication. It’s responsible for the reliable delivery of requests through the complex topology of services that comprise a modern, cloud native application. In practice, the服务网格is typically implemented as an array of lightweight network proxies that are deployed alongside application code, without the application needing to be aware.

中文版：

服务网格（Service Mesh）是处理服务间通信的基础设施层。它负责构成现代云原生应用程序的复杂服务拓扑来可靠地交付请求。在实践中，Service Mesh 通常以轻量级网络代理阵列的形式实现，这些代理与应用程序代码部署在一起，对应用程序来说无需感知代理的存在。

近年来以 [Istio](https://istio.io) 为代表的服务网格蓬勃发展，大有成为下一代语言异构微服务架构的王者之范，下图来自红帽的 [Burr Sutter](https://twitter.com/burrsutter) 在他的主题分享”8 Steps to Becoming Awesome with Kubernetes” 幻灯片中的图片。

![下一代异构微服务架构](../images/polyglot-microservices-serivce-mesh.png)

服务网格可以很好的解决了异构语言中的很多问题，而且是 Kuberentes service 上层的通用的服务间代理。关于 Istio 的更多内容请参考 [Istio 官方文档](https://istio.io)。

## 什么是服务网格？

服务网格有如下几个特点：

- 应用程序间通讯的中间层
- 轻量级网络代理
- 应用程序无感知
- 解耦应用程序的重试/超时、监控、追踪和服务发现

## 理解服务网格

如果用一句话来解释什么是服务网格，可以将它比作是应用程序或者说微服务间的 TCP/IP，负责服务之间的网络调用、限流、熔断和监控。对于编写应用程序来说一般无须关心 TCP/IP 这一层（比如通过 HTTP 协议的 RESTful 应用），同样使用服务网格也就无须关系服务之间的那些原来是通过应用程序或者其他框架实现的事情，比如 Spring Cloud、OSS，现在只要交给服务网格就可以了。

[Phil Calçado](http://philcalcado.com/) 在他的这篇博客 [Pattern: Service Mesh](http://philcalcado.com/2017/08/03/pattern_service_mesh.html) 中详细解释了服务网格的来龙去脉：

1. 从最原始的主机之间直接使用网线相连
2. 网络层的出现
3. 集成到应用程序内部的控制流
4. 分解到应用程序外部的控制流
5. 应用程序的中集成服务发现和断路器
6. 出现了专门用于服务发现和断路器的软件包/库，如 [Twitter 的 Finagle](https://finagle.github.io/) 和 [Facebook  的 Proxygen](https://code.facebook.com/posts/1503205539947302)，这时候还是集成在应用程序内部
7. 出现了专门用于服务发现和断路器的开源软件，如 [Netflix OSS](http://netflix.github.io/)、Airbnb 的 [synapse](https://github.com/airbnb/synapse) 和 [nerve](https://github.com/airbnb/nerve)
8. 最后作为微服务的中间层服务网格出现

服务网格的架构如下图所示：

![Service Mesh 架构图](../images/serivce-mesh-control-plane.png)

图片来自：[Pattern: Service Mesh](http://philcalcado.com/2017/08/03/pattern_service_mesh.html)

服务网格会在每个 pod 中注入一个 sidecar 代理，该代理对应用程序来说是透明，所有应用程序间的流量都会通过它，所以对应用程序流量的控制都可以在服务网格中实现。

## 服务网格如何工作？

下面是服务网格的工作流程。

1. 控制平面将整个网格中的服务配置推送到所有节点的 sidecar 代理中。
2. Sidecar 代理将服务请求路由到目的地址，根据中的参数判断是到生产环境、测试环境还是 staging 环境中的服务（服务可能同时部署在这三个环境中），是路由到本地环境还是公有云环境？所有的这些路由信息可以动态配置，可以是全局配置也可以为某些服务单独配置。
3. 当 sidecar 确认了目的地址后，将流量发送到相应服务发现端点，在 Kubernetes 中是 service，然后 service 会将服务转发给后端的实例。
4. Sidecar 根据它观测到最近请求的延迟时间，选择出所有应用程序的实例中响应最快的实例。
5. Sidecar 将请求发送给该实例，同时记录响应类型和延迟数据。
6. 如果该实例挂了、不响应了或者进程不工作了，sidecar 将把请求发送到其他实例上重试。
7. 如果该实例持续返回 error，sidecar 会将该实例从负载均衡池中移除，稍后再周期性得重试。
8. 如果请求的截止时间已过，sidecar 主动失败该请求，而不是再次尝试添加负载。
9. Sidecar 以 metric 和分布式追踪的形式捕获上述行为的各个方面，这些追踪信息将发送到集中 metric 系统。

## 为何使用服务网格？

服务网格并没有给我们带来新功能，它是用于解决其他工具已经解决过的问题，只不过这次是在云原生的 Kubernetes 环境下的实现。

在传统的 MVC 三层 Web 应用程序架构下，服务之间的通讯并不复杂，在应用程序内部自己管理即可，但是在现今的复杂的大型网站情况下，单体应用被分解为众多的微服务，服务之间的依赖和通讯十分复杂，出现了 Twitter 开发的 [Finagle](https://twitter.github.io/finagle/)、Netflix 开发的 [Hystrix](https://github.com/Netflix/Hystrix) 和 Google 的 Stubby 这样的 ”胖客户端“ 库，这些就是早期的服务网格，但是它们都近适用于特定的环境和特定的开发语言，并不能作为平台级的服务网格支持。

在云原生架构下，容器的使用给予了异构应用程序的更多可行性，Kubernetes 增强的应用的横向扩容能力，用户可以快速的编排出复杂环境、复杂依赖关系的应用程序，同时开发者又无须过分关心应用程序的监控、扩展性、服务发现和分布式追踪这些繁琐的事情而专注于程序开发，赋予开发者更多的创造性。

## 参考

- [What's a service mesh? And why do I need one? - buoyant.io](https://buoyant.io/2020/10/12/what-is-a-service-mesh/)
- [So what even is a Service Mesh? Hot take on Istio and Linkerd - hotmonk.com](http://redmonk.com/jgovernor/2017/05/31/so-what-even-is-a-service-mesh-hot-take-on-istio-and-linkerd)
- [Introducing Istio: A robust service mesh for microservices - istio.io](https://istio.io/latest/news/releases/0.x/announcing-0.1/)
- [Application Network Functions With ESBs, API Management, and Now.. Service Mesh? - blog.christianposta.com](http://blog.christianposta.com/microservices/application-network-functions-with-esbs-api-management-and-now-service-mesh/)
- [Pattern: Service Mesh](http://philcalcado.com/2017/08/03/pattern_service_mesh.html)
- [Istio 官方文档 - istio.io](https://istio.io)
