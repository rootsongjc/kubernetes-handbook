---
title: "Istio Service Mesh官方中文文档及社区"
date: 2017-09-20T14:37:23+08:00
description: "ServiceMesher社区负责翻译和维护了Istio Service Mesh官方中文文档。"
draft: false
categories: "service mesh"
tags: ["istio","service-mesh","cloud-native"]
bigimg: [{src: "/img/banners/00704eQkly1fswhnpm91wj30go08yn5p.jpg", desc: "Service Mesh|Sept 20,2017"}]
notoc: true
---

[Istio](https://istio.io)是由Google、IBM和Lyft开源的微服务管理、保护和监控框架。Istio为希腊语，意思是”起航“。官方中文文档地址：https://istio.io/zh ，Istio 同时也是云原生领域的重要方向，[查看 Service Mesh 景观](http://www.servicemesher.com/awesome-servicemesh)。

## 服务网格

服务网格（Service Mesh）这个术语通常用于描述构成这些应用程序的微服务网络以及应用之间的交互。随着规模和复杂性的增长，服务网格越来越难以理解和管理。它的需求包括服务发现、负载均衡、故障恢复、指标收集和监控以及通常更加复杂的运维需求，例如 A/B 测试、金丝雀发布、限流、访问控制和端到端认证等。

## Istio简介

Istio 提供一种简单的方式来为已部署的服务建立网络，该网络具有负载均衡、服务间认证、监控等功能，只需要对服务的代码进行一点或不需要做任何改动。想要让服务支持 Istio，只需要在您的环境中部署一个特殊的 sidecar 代理，使用 Istio 控制平面功能配置和管理代理，拦截微服务之间的所有网络通信：

- HTTP、gRPC、WebSocket 和 TCP 流量的自动负载均衡。
- 通过丰富的路由规则、重试、故障转移和故障注入，可以对流量行为进行细粒度控制。
- 可插入的策略层和配置 API，支持访问控制、速率限制和配额。
- 对出入集群入口和出口中所有流量的自动度量指标、日志记录和跟踪。
- 通过强大的基于身份的验证和授权，在集群中实现安全的服务间通信。

Istio 旨在实现可扩展性，满足各种部署需求。

关于 Istio 的详细介绍请参考 [Istio 是什么](https://istio.io/zh/docs/concepts/what-is-istio/)。

## 中文社区

[ServiceMesher社区](http://www.servicemesher.com)负责翻译和维护了[Istio 官方中文文档](https://istio.io)。[查看如何参与](https://github.com/servicemesher/istio-official-translation)。
