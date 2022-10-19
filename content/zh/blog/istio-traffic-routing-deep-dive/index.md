---
title: "Istio 中流量管理机制详解"
description: "本文详述了从用户配置 Istio 流量管理资源对象到应用到配置下发并作用于 Envoy 的全过程。"
date: 2022-10-17T11:18:40+08:00
draft: true
tags: ["istio"]
categories: ["Istio"]
type: "post"
image: "images/banner/no-entry.jpg"
---

如今网上已经有很多教程和文章都说明了 Istio 配置的用法，但是没有说这些配置是怎样作用到 sidecar 上来操作流量的。下面我就以 Istio 官方 task [Requst routing](https://istio.io/latest/docs/tasks/traffic-management/request-routing/) 中的例子来说明，sidecar 模式下 VirtualService 是如何运作的。

我们先简要描述下这个例子在开始前的 Istio Mesh 状态：

1. 安装好 Istio，并为 `default` namespace 开启了自动 sidecar 注入；
2. 在 `default` namespace 下安装了 bookinfo 示例，Bookinfo 示例中的 Kubernetes Service 会自动注册到 Istio Mesh 的 Cluster 中，例如 `outbound|9080||details.default.svc.cluster.local`， 注意在其中没有 `subset` 信息；
3. 创建了一系列的 Istio CR，包括：
   1. Gateway ： `bookinfo-gateway` 用于选择 Istio 的 Ingress Gateway，作为 bookinfo 的对外流量入口；
   2. DestinationRule：`productpage`、`reviews`、`ratings`、`details` 将这些流量路径通过 `subset` 与 Kubernetes 的 Service 关联起来，将用于未来的分版本路由。实际上为了让 Bookinfo 可以运行起来，这些 DestinationRule 目前都是不必要的；但是你创建了这些 DestinationRule 之后，就会在 Istio Mesh 中创建新的 Cluster 配置，比如 `outbound|9080|v1|reviews.default.svc.cluster.local` 这些 `dynamic_active_clusters `，在创建 VirtualService 指定路由的时候，Istiod 就会下发 `dynamic_route_configs` 给 sidecar，其中会包含 `reviews.default.svc.cluster.local:9080` 路由，其中指定了将路由到的 cluster，这个 cluster 就是在 VirtualService 中配置的那个 host 的 `subset`；
   3. VirtualService：`bookinfo` 指定了流量在通过 `bookinfo-gateway` 进入 Istio Mesh 之后怎么走，其中指定了 URI 匹配的目的地是 `productpage`，请注意这里的 `productpage` 对应的是 Kubernetes 中的 Service。

要想实现在 bookinfo 示例的网页中每次刷新显示的书籍评分都显示星级，只需要创建并应用如下的 VirtualService 即可：

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

下面是部署了 VirtualService 之后 Istio 网格背后发生的事情。 

### 步骤一：流量拦截

当你为某个 namespace 开启了 sidecar 自动注入或者手动向 Deployment 的 pod 中注入了 sidecar，进出该 pod 的 TCP 服务流量经过 iptables 拦截到 Envoy 的 15006 端口，详细过程请见[Istio 中的 Sidecar 注入、透明流量劫持及流量路由过程详解](https://jimmysong.io/blog/sidecar-injection-iptables-and-traffic-routing/)。

### 步骤二：配置下发

你使用 kubectl 应用了 YAML 配置到 Istio Mesh，默认情况下，Istiod 使用 xDS 将配置下发到所有 namespace 下的 pod 中，除非你为 VirtualService 配置了 `exportTo` 字段。这些配置被应用到 pod 内的 Envoy 上，你可以用执行下面的命令查看某个 pod 中的 Envoy 的当前配置：

```bash
kubectl -n default port-forward deploy/productpage-v1 15000
```

然后在浏览器中打开 `http://localhost:15000` 就可以进入 Envoy 的 admin 页面，查看 Envoy 的当前配置。在应用新的 VirtualService 之前，你可以保存当前 Envoy 的配置，然后应用后的 Envoy 配置做对比。关于 sidecar 中各个端口的详细用法请见[Istio 中的各组件端口及功能详解](https://jimmysong.io/blog/istio-components-and-ports/)。

![Envoy admin 页面（局部）](https://tva1.sinaimg.cn/large/008vxvgGgy1h72l9to87tj30u013w79q.jpg)

### 步骤三：Envoy 处理流量

被拦截的流量在进入 Pod 的 Envoy Inbound Handler 后，然后进入 Envoy 的 Filter Chain，对于 HTTP 流量会进入 HttpConnectionManager（HCM）这个高级网络过滤器链，这里面有一系列的 HTTP 过滤器。Productpage 页面对 reviews 服务的访问究竟走哪个 subset，还得看 `prodcutpage` pod 中的 Envoy 配置。在步骤二的那个页面上查看 `config_dump`，你将看到 Envoy 的详细配置，其中的 `dynamic_route_configs` 中，可以看到对 `reviews.default.svc.cluster.local:9080` 服务的 Route 配置是 `outbound|9080|v2|reviews.default.svc.cluster.local` Cluster，再查看这个 Cluster 的配置，可以看到是用 EDS 来获取的，你可以使用 `istioctl proxy-config endpoint xxx` 查看该 pod 上可识别的所有 Endpoint。

## 更多资源

归根结底，在 Istio 网格中是 Envoy 处理的七层流量，要想了解更底层的原理，需要对 Envoy 有更详细的了解。推荐大家学习 Envoy 基础教程，