---
weight: 40
title: 拓扑感知路由
date: '2022-05-21T00:00:00+08:00'
type: book
---

[拓扑感知路由](https://kubernetes.io/zh/docs/concepts/services-networking/service-topology/)指的是客户端对一个服务的访问流量，可以根据这个服务的端点拓扑，优先路由到与该客户端在同一个节点或者可用区的端点上的路由行为。

## 先决条件

为了开启服务感知路由，你需要：

- 开启 `TopologyAwareHints` 智能感知提示门控
- 开启 EndpointSlice 控制器
- 安装 kube-proxy

## 端点切片

我们知道 Endpoint 通常情况下是由 Service 资源自动创建和管理的，但是随着 Kubernetes 集群的规模越来越大和管理的服务越来越多，Endpoint API 的局限性变得越来越明显。 [端点切片](https://kubernetes.io/zh/docs/concepts/services-networking/endpoint-slices/)（EndpointSlices）提供了一种简单的方法来跟踪 Kubernetes 集群中的网络端点。它们为 Endpoint 提供了一种可伸缩和可拓展的替代方案，同时还可以被用到拓扑感知路由中。

EndpointSlices 示例如下：

```yaml
apiVersion: discovery.k8s.io/v1
kind: EndpointSlice
metadata:
  name: example-hints
  labels:
    kubernetes.io/service-name: example-svc
addressType: IPv4
ports:
  - name: http
    protocol: TCP
    port: 80
endpoints:
  - addresses:
      - "10.127.2.3"
    conditions:
      ready: true
    hostname: pod-1
    nodename: node-a
    zone: zone-a
```

EndpointSlice 中的每个端点都可以包含一定的拓扑信息。拓扑信息包括端点的位置，对应节点、可用区的信息。这些信息体现为 EndpointSlices 的如下端点字段：

- `nodeName` - 端点所在的 Node 名称
- `zone` - 端点所处的可用区
- `hostname` - 端点的 pod 名称

## 启用拓扑感知

请启用 kube-apiserver、kube-controller-manager、和 kube-proxy 的[特性门控](https://kubernetes.io/zh/docs/reference/command-line-tools-reference/feature-gates/) `TopologyAwareHints`。通过把 Service 中的注解 `service.kubernetes.io/topology-aware-hints` 的值设置为 `auto`，来激活服务的拓扑感知提示功能。这告诉 EndpointSlice 控制器在它认为安全的时候来设置拓扑提示。kube-proxy 组件依据 EndpointSlice 控制器设置的提示，过滤由它负责路由的端点。

由 EndpointSlice 控制器提供提示信息后 EndpointSlice 的示例如下：

```yaml
apiVersion: discovery.k8s.io/v1
kind: EndpointSlice
metadata:
  name: example-hints
  labels:
    kubernetes.io/service-name: example-svc
addressType: IPv4
ports:
  - name: http
    protocol: TCP
    port: 80
endpoints:
  - addresses:
      - "10.1.2.3"
    conditions:
      ready: true
    hostname: pod-1
    zone: zone-a
    hints:
      forZones:
        - name: "zone-a"
```

我们看到其中已注入了 `hints` 信息，对于上面这个示例，`zone-a` 的客户端访问会优先路由到该端点上。

## 管理

在大多数场合下，EndpointSlice 都由某个 Service 所有，因为端点切片正是为该服务跟踪记录其端点。这一属主关系是通过为每个 EndpointSlice 设置一个 属主（owner）引用，同时设置 `kubernetes.io/service-name` 标签来标明的，目的是方便查找隶属于某服务的所有 EndpointSlice。

控制面（尤其是端点切片的[控制器](https://kubernetes.io/zh/docs/concepts/architecture/controller/)）会创建和管理 EndpointSlice 对象。EndpointSlice 对象还有一些其他使用场景，例如作为服务网格（Service Mesh）的实现。这些场景都会导致有其他实体 或者控制器负责管理额外的 EndpointSlice 集合。

为了确保多个实体可以管理 EndpointSlice 而且不会相互产生干扰，Kubernetes 定义了[标签](https://kubernetes.io/zh/docs/concepts/overview/working-with-objects/labels/) `endpointslice.kubernetes.io/managed-by`，用来标明哪个实体在管理某个 EndpointSlice。端点切片控制器会在自己所管理的所有 EndpointSlice 上将该标签值设置 为 `endpointslice-controller.k8s.io`。管理 EndpointSlice 的其他实体也应该为此标签设置一个唯一值。

## 参考

- [使用拓扑键实现拓扑感知的流量路由 - kubernetes.io](https://kubernetes.io/zh/docs/concepts/services-networking/service-topology/)
- [端点切片 - kubernetes.io](https://kubernetes.io/zh/docs/concepts/services-networking/endpoint-slices/)
- [拓扑感知提示 - kubernetes.io](https://kubernetes.io/zh/docs/concepts/services-networking/topology-aware-hints/)

