# Envoy 的架构与基本术语

在了解一门技术之前一开始就要了解其中的基本概念和术语，只有融入了该语境才能理解这门技术。本文将为大家介绍 Envoy 中的基本术语和重点概念。

## 架构

下图是 Envoy proxy 的架构图，显示了 host B 经过 Envoy 访问 host A 的过程。每个 host 上都可能运行多个 service，Envoy 中也可能有多个 Listener，每个 Listener 中可能会有多个 filter 组成了 chain。

![Envoy proxy 架构图](../images/envoy-arch-v0.1.png)

其中的基本术语将在下面解释。

## 基本术语

**Host**：能够进行网络通信的实体（在手机或服务器等上的应用程序）。在 Envoy 中主机是指逻辑网络应用程序。只要每台主机都可以独立寻址，一块物理硬件上就运行多个主机。

**Downstream**：下游（downstream）主机连接到 Envoy，发送请求并或获得响应。

**Upstream**：上游（upstream）主机获取来自 Envoy 的链接请求和响应。

**Cluster**: 集群（cluster）是 Envoy 连接到的一组逻辑上相似的上游主机。Envoy 通过[服务发现](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/service_discovery#arch-overview-service-discovery)发现集群中的成员。Envoy 可以通过[主动运行状况检查](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/health_checking#arch-overview-health-checking)来确定集群成员的健康状况。Envoy 如何将请求路由到集群成员由[负载均衡策略](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/load_balancing#arch-overview-load-balancing)确定。

**Mesh**：一组互相协调以提供一致网络拓扑的主机。Envoy mesh 是指一组 Envoy 代理，它们构成了由多种不同服务和应用程序平台组成的分布式系统的消息传递基础。

**运行时配置**：与 Envoy 一起部署的带外实时配置系统。可以在无需重启 Envoy 或 更改 Envoy 主配置的情况下，通过更改设置来影响操作。

**Listener**: 侦听器（listener）是可以由下游客户端连接的命名网络位置（例如，端口、unix域套接字等）。Envoy 公开一个或多个下游主机连接的侦听器。一般是每台主机运行一个 Envoy，使用单进程运行，但是每个进程中可以启动任意数量的 Listener（监听器），目前只监听 TCP，每个监听器都独立配置一定数量的（L3/L4）网络过滤器。Listenter 也可以通过 Listener Discovery Service（**LDS**）动态获取。

**Listener filter**：Listener 使用 listener filter（监听器过滤器）来操作链接的元数据。它的作用是在不更改 Envoy 的核心功能的情况下添加更多的集成功能。Listener filter 的 API 相对简单，因为这些过滤器最终是在新接受的套接字上运行。在链中可以互相衔接以支持更复杂的场景，例如调用速率限制。Envoy 已经包含了多个监听器过滤器。

**Http Route Table**：HTTP 的路由规则，例如请求的域名，Path 符合什么规则，转发给哪个 Cluster。

**Health checking**：健康检查会与SDS服务发现配合使用。但是，即使使用其他服务发现方式，也有相应需要进行主动健康检查的情况。详见 [health checking](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/health_checking)。

## xDS

xDS 是一个关键概念，它是一类发现服务的统称，其包括如下几类：

- CDS：Cluster Discovery Service
- EDS：Endpoint Discovery Service
- SDS：Service Discovery Service
- RDS：Route Discovery Service
- LDS：Listener Discovery Service

正是通过对 xDS 的请求来动态更新 Envoy 配置。

## 参考

- [Terminology - www.envoyproxy.io](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/terminology)