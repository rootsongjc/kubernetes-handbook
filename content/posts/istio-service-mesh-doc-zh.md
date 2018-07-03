---
title: "Istio Service Mesh官方文档中文版"
date: 2017-09-20T14:37:23+08:00
draft: false
categories: "cloud-native"
tags: ["istio","service-mesh","cloud-native"]
bigimg: [{src: "https://ws1.sinaimg.cn/large/00704eQkly1fswhnpm91wj30go08yn5p.jpg", desc: "Service Mesh|Sept 20,2017"}]
notoc: true
---

> 注意：本文档已经不再维护，请直接浏览 [Istio 官方文档](https://istio.io)，其中包含中文版本切换功能。

[Istio](https://istio.io)是由Google、IBM和Lyft开源的微服务管理、保护和监控框架。Istio为希腊语，意思是”起航“。官方中文文档地址：https://istio.doczh.cn/ ，Istio 同时也是 [kubernetes-handbook](https://jimmysong.io/kubernetes-handbook) 中领域应用章节重点关注的内容，其跟 [Linkerd](https://linkerd.io) 的对比也是一个很有趣的话题，而就在上个周 Istio 核心组件 [Envoy](https://envoyproxy.github.io/) 也进入了 [CNCF](https://cncf.io) 项目中。

**简介**

使用Istio可以很简单的创建具有负载均衡、服务间认证、监控等功能的服务网络，而不需要对服务的代码进行任何修改。你只需要在部署环境中，例如Kubernetes的pod里注入一个特别的sidecar proxy来增加对Istio的支持，用来截获微服务之间的网络流量。

目前版本的Istio只支持kubernetes，未来计划支持其他其他环境。

当前已经完成翻译内容，译文中还有很多需要优化的地方，欢迎大家提Issue和PR：

- [官方文档](https://istio.doczh.cn/docs/)
- 概念
    - [Istio是什么?](https://istio.doczh.cn/docs/concepts/what-is-istio/)
    - [概述](https://istio.doczh.cn/docs/concepts/what-is-istio/overview.html)
    - [设计目标](https://istio.doczh.cn/docs/concepts/what-is-istio/goals.html)
- 流量管理
    - [概述](https://istio.doczh.cn/docs/concepts/traffic-management/overview.html)
    - [Pilot](https://istio.doczh.cn/docs/concepts/traffic-management/pilot.html)
    - [请求路由](https://istio.doczh.cn/docs/concepts/traffic-management/request-routing.html)
    - [发现和负载均衡](https://istio.doczh.cn/docs/concepts/traffic-management/load-balancing.html)
    - [处理故障](https://istio.doczh.cn/docs/concepts/traffic-management/handling-failures.html)
    - [故障注入](https://istio.doczh.cn/docs/concepts/traffic-management/fault-injection.html)
    - [规则配置](https://istio.doczh.cn/docs/concepts/traffic-management/rules-configuration.html)
- 网络和认证
    - [认证](https://istio.doczh.cn/docs/concepts/network-and-auth/auth.html)
- 策略与控制
    - [属性](https://istio.doczh.cn/docs/concepts/policy-and-control/attributes.html)
    - [Mixer](https://istio.doczh.cn/docs/concepts/policy-and-control/mixer.html)
    - [Mixer配置](https://istio.doczh.cn/docs/concepts/policy-and-control/mixer-config.html)
    - [Mixer Aspect配置](https://istio.doczh.cn/docs/concepts/policy-and-control/mixer-aspect-config.html)

随着官方文档的更新，该中文版文档还在不断完善中。
