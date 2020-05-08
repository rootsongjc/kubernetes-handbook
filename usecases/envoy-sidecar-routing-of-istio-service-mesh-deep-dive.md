# 深入理解Istio Service Mesh中的Envoy Sidecar代理的路由转发

**注意：本文基于 Istio 1.5。**

本文以 Istio 官方的 bookinfo 示例来讲解在进入 Pod 的流量被 iptables 转交给 Envoy sidecar 后，Envoy 是如何做路由转发的，详述了 Inbound 和 Outbound 处理过程。关于流量拦截的详细分析请参考[理解 Istio Service Mesh 中 Envoy 代理 Sidecar 注入及流量劫持](understand-sidecar-injection-and-traffic-hijack-in-istio-service-mesh.md)。

下面是 Istio 官方提供的 bookinfo 的请求流程图，假设 bookinfo 应用的所有服务中没有配置 DestinationRule。

![Bookinfo 示例](../images/006tNbRwgy1fvlwjd3302j31bo0ro0x5.jpg)

请读者参考 ServiceMesher 社区出品的 Istio Handbook 中的 [Sidecar 流量路由机制分析](https://www.servicemesher.com/istio-handbook/concepts/sidecar-traffic-route.html)一节。