---
linktitle: Kubernetes 基础教程
description: "本书起始于 2017 年 3 月，记录了本人从零开始学习和使用 Kubernetes 的心路历程，着重于经验分享和总结。"
weight: 1
category: "Handbook 系列"
icon: book
icon_pack: fa
featured: true
type: book
title: Kubernetes 基础教程
date: '2022-05-21T00:00:00+08:00'
aliases:
 - /guide-to-cloud-native-app
cascade:
  comment: true
  tags: ["Kubernetes"]
  type: book
  categories: ["Kubernetes"]
  level: 1
---

{{<callout note 关于本教程>}}
本教程迁移自[《Kubernetes 中文指南——云原生应用架构实战手册》](https://jimmysong.io/kubernetes-handbook)，原手册使用 Gitbook 发布，内容涵盖 容器、Kubernetes、服务网格、Serverless 等云元生的多个领域，因内容过于宽泛，且 Gitbook 项目已停止维护，现将其中的 Kubernetes 教程部分独立成书，并使用 Hugo 重新构建。
{{</callout>}}

云原生是一种行为方式和设计理念，究其本质，凡是能够提高云上资源利用率和应用交付效率的行为或方式都是云原生的。云计算的发展史就是一部云原生化的历史。Kubernetes 开启了云原生的序幕，服务网格 Istio 的出现，引领了后 Kubernetes 时代的微服务，Serverless 的兴起，使得云原生从基础设施层不断向应用架构层挺进，我们正处于一个云原生的新时代。

{{< figure src="cover.jpg" alt="封面" title="《Kubernetes 基础教程》封面" width="50%" >}}

[Kubernetes](http://kubernetes.io) 是 Google 于 [2014 年 6 月](https://jimmysong.io/cloud-native/note/open-source/)基于其内部使用的 [Borg](https://research.google.com/pubs/pub43438.html) 系统开源出来的容器编排调度引擎，Google 将其作为初始和核心项目贡献给 [CNCF](https://cncf.io)（云原生计算基金会），近年来逐渐发展出了云原生生态。

Kubernetes 的目标不仅仅是一个编排系统，而是提供一个规范用以描述集群的架构，定义服务的最终状态，使系统自动地达到和维持该状态。Kubernetes 作为云原生应用的基石，相当于一个云原生操作系统，其重要性不言而喻。

云原生技术有利于各组织在公有云、私有云和混合云等新型动态环境中，构建和运行可弹性扩展的应用。云原生的代表技术包括 **容器**、**服务网格**、**微服务**、**不可变基础设施** 和 **声明式 API**。这些技术能够构建容错性好、易于管理和便于观察的松耦合系统。结合可靠的自动化手段，云原生技术使工程师能够轻松地对系统作出频繁和可预测的重大变更。——CNCF（云原生计算基金会）。

## 关于本书

Kubernetes Handbook 项目始于 2016 年底，开源于 2017 年 3 月，作为第一本系统介绍 Kubernetes 的中文电子书，其后经过不断完善。写作本书的过程中，笔者记录了从零开始学习和使用 Kubernetes 的历程，着重于经验总结和资料分享，亦有 Kubernetes 核心概念解析，希望能够帮助大家少走弯路，为大家介绍 Kubernetes 周边生态，如微服务、DevOps、大数据应用、服务网格、云原生应用、Serverless 等领域。

## 本书大纲

{{< list_children show_summary="false">}}

## 许可证

您可以使用[署名 - 非商业性使用 - 相同方式共享 4.0 (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)  协议共享。

## 交流群

欢迎加入[云原生社区](https://cloudnative.to/)微信讨论群，加入前请先填写[入群申请问卷](https://wj.qq.com/s2/5479026/bf82)后联系 [Jimmy Song](https://jimmysong.io/contact/) 入群。

{{< cta cta_text="开始阅读" cta_link="architecture" >}}
