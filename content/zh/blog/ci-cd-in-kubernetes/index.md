---
title: "Kubernetes中的CI/CD"
description: "TheNewStack 的报告解读，介绍了 Kubernetes 中 CI/CD 的现状。"
date: 2018-06-14T20:33:24+08:00
tags: ["图书","TheNewStack"]
categories: ["kubernetes"]
draft: false
type: "post"
bg_image: "images/backgrounds/page-title.jpg"
image: "images/banner/ci-cd-with-kubernetes.jpg"
aliases: "/posts/ci-cd-in-kubernetes"
---

众所周知 Kubernetes 并不提供代码构建、发布和部署，所有的这些工作都是由 CI/CD 工作流完成的，最近 TheNewStack 又出了本小册子（117 页）介绍了 Kubernetes 中 CI/CD 的现状，[下载本书的 PDF](https://thenewstack.io/ebooks/kubernetes/ci-cd-with-kubernetes/)。

## 关于本书

本书的作者有：

- Rob Scott：ReactiveOps 公司的 SRE
- Janakiram MSV：Janakiram & Associates 的首席分析师
- Craig Martin：Kenzan 的高级副总裁
- Container Solutions

这本小册子里主要主要介绍了以下几点：

- DevOps 模式
- 云原生应用模式
- 使用 Spinnaker 做持续交付
- 云原生时代的监控

## DevOps 模式

这一章从一些流行的自动化运维工具讲起，比如 Chef、Puppet 等，引申出 CI/CD 流水线，进而引出 Docker 和 DevOps，将容器如何解除开发和运维之间的隔阂，但同时也带来了一些挑战，比如频繁的发布变更如何控制，如何控制容器集群的行为，如何拆分应用到容器之中等。这是一个专门用于容器编排调度的工具呼之欲出，Kubernetes 的出现彻底改变了局面，可以说它直接改变了应用的基础架构。

Kubernetes 细化的应用程序的分解粒度，同时将服务发现、配置管理、负载均衡和健康检查等作为基础设施的功能，简化了应用程序的开发。

而Kubernetes这种声明式配置尤其适合CI/CD流程，况且现在还有如Helm、Draft、Spinnaker、Skaffold等开源工具可以帮助我们发布Kuberentes应用。

有了基于Kubernetes的CI/CD流程后，又诞生了GitOps（[WeaveWorks](http://weave.works) 的博客中有很多相关文章）和 SecOps（Security Operation）。

## 云原生应用模式

> 云原生是通过构建团队、文化和技术，利用自动化和架构来管理系统的复杂性和解放生产力。——Joe Beda，Heptio CTO，联合创始人

这一章的重点是给出了云原生应用的 10 条关键属性。

1. 使用轻量级的容器打包
2. 使用最合适的语言和框架开发
3. 以松耦合的微服务方式设计
4. 以 API 为中心的交互和协作
5. 无状态和有状态服务在架构上界限清晰
6. 不依赖于底层操作系统和服务器
7. 部署在自服务、弹性的云基础设施上
8. 通过敏捷的 DevOps 流程管理
9. 自动化能力
10. 通过定义和策略驱动的资源分配

作者然后将应用程序架构中的不同组件映射到云原生的工作负载中。

这也是 DevOps 需要关注的部分，如何将云原生的组件映射为 Kubernetes 的原语（即 Kubernetes 里的各种资源对象和概念组合）呢？

总结概括为以下 10 条：

1. 不要直接部署裸的 Pod。
2. 为工作负载选择合适的 Controller。
3. 使用 Init 容器确保应用程序被正确的初始化。
4. 在应用程序工作负载启动之前先启动 service。
5. 使用 Deployment history 来回滚到历史版本。
6. 使用 ConfigMap 和 Secret 来存储配置。
7. 在 Pod 里增加 Readiness 和 Liveness 探针。
8. 给 Pod 这只 CPU 和内存资源限额。
9. 定义多个 namespace 来限制默认 service 范围的可视性。
10. 配置 HPA 来动态扩展无状态工作负载。

## 使用 Spinnaker 进行持续交付

作者首先讲到了 Spinnaker 的各种特性，比如面向微服务啦，云原生的交付工具啦，可视化的交付和基础设施啦，支持多个 region，支持容器和 Kubernetes 等等，不一而足，感兴趣大家可以自己看下报告或者登陆[Spinnaker 官网](https://www.spinnaker.io)查看。

总之作者就是想说 Spinnaker 很好很强大啦，足以满足您对云原生应用 CI/CD 的需求。

## 云原生时代的监控

监控是为了实现系统的可观察性，不要以为监控就是简单的出个监控页面，监控其实包括以下部分：

- 日志收集
- 监控和指标度量
- 追踪
- 告警和可视化

要把其中任何一个方面做好都不容易。作者主要讲述的 Prometheus 和 Grafana 的开源监控方案。这一章我不详述，感兴趣大家可以查看报告原文。
