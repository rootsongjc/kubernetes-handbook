---
date: "2017-06-26T21:02:13+08:00"
draft: false
categories: "service-mesh"
title: "云原生微服务治理框架service mesh——Linkerd简介"
description: "Linkerd是一个用于云原生应用的开源、可扩展的service mesh。同时，Linkerd也是CNCF（云原生计算基金会）中的组件之一。"
tags: ["linkerd","cloud-native","service-mesh"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20170526021.jpg", desc: "青岛 May 26,2017"}]
---

[Linkerd](https://linkerd.io)是一个用于云原生应用的开源、可扩展的service mesh。同时，Linkerd也是[CNCF](https://cncf.io)（云原生计算基金会）中的组件之一。

P.S 本文已归档到[kubernetes-handbook](https://github.com/rootsongjc/kubernetes-handbook/)中的【领域应用—微服务架构】章节中。

## Linkerd是什么

Linkerd的出现是为了解决像twitter、google这类超大规模生产系统的复杂性问题。Linkerd不是通过控制服务之间的通信机制来解决这个问题，而是通过在服务实例之上添加一个抽象层来解决的。

![source https://linkerd.io](https://linkerd.io/images/diagram-individual-instance.png)

Linkerd负责跨服务通信中最困难、易出错的部分，包括延迟感知、负载均衡、连接池、TLS、仪表盘、请求路由等——这些都会影响应用程序伸缩性、性能和弹性。

## 如何运行

Linkerd作为独立代理运行，无需特定的语言和库支持。应用程序通常会在已知位置运行linkerd实例，然后通过这些实例代理服务调用——即不是直接连接到目标服务，服务连接到它们对应的linkerd实例，并将它们视为目标服务。

在该层上，linkerd应用路由规则，与现有服务发现机制通信，对目标实例做负载均衡——与此同时调整通信并报告指标。 

通过延迟调用linkerd的机制，应用程序代码与以下内容解耦：

- 生产拓扑
- 服务发现机制
- 负载均衡和连接管理逻辑

应用程序也将从一致的全局流量控制系统中受益。这对于多语言应用程序尤其重要，因为通过库来实现这种一致性是非常困难的。

Linkerd实例可以作为sidecar（既为每个应用实体或每个主机部署一个实例）来运行。 由于linkerd实例是无状态和独立的，因此它们可以轻松适应现有的部署拓扑。它们可以与各种配置的应用程序代码一起部署，并且基本不需要去协调它们。

## 参考

- [Buoyant发布服务网格Linkerd的1.0版本](http://www.infoq.com/cn/news/2017/05/buoyant-release-ver-1-of-linkerd)

- [Linkerd documentation](https://linkerd.io/documentation/)

- [Istio：一个用于微服务间通信的服务网格开源项目](http://www.infoq.com/cn/news/2017/05/istio)

