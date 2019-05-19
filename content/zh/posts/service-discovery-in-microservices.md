---
date: "2017-06-30T18:32:19+08:00"
draft: false
title: "微服务中的服务发现方式对比"
categories: "Microservices"
tags: ["microservices"]
---

在单体架构时，因为服务不会经常和动态迁移，所有服务地址可以直接在配置文件中配置，所以也不会有服务发现的问题。但是对于微服务来说，应用的拆分，服务之间的解耦，和服务动态扩展带来的服务迁移，服务发现就成了微服务中的一个关键问题。

服务发现分为**客户端服务发现**和**服务端服务发现**两种，架构如下图所示。

![微服务中的服务发现](https://res.cloudinary.com/jimmysong/image/upload/images/service-discovery-in-microservices.png)

这两种架构都各有利弊，我们拿客户端服务发现软件Eureka和服务端服务发现架构Kubernetes/SkyDNS+Ingress LB+Traefik+PowerDNS为例说明。

| 服务发现方案     | Pros                                | Cons                                     |
| :--------- | ----------------------------------- | ---------------------------------------- |
| Eureka     | 使用简单，适用于java语言开发的项目，比服务端服务发现少一次网络跳转 | 对非Java语言的支持不够好，Consumer需要内置特定的服务发现客户端和发现逻辑 |
| Kubernetes | Consumer无需关注服务发现具体细节，只需知道服务的DNS域名即可 | 需要基础设施支撑，多了一次网络跳转，可能有性能损失                |

## 参考

[谈服务发现的背景、架构以及落地方案](http://www.infoq.com/cn/articles/background-architecture-and-solutions-of-service-discovery)
