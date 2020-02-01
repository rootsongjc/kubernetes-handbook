---
title: "迁移到云原生应用架构"
date: 2017-07-11T12:00:00+08:00
draft: false
subtitle : "最早的云原生指导手册"
# page title background image
bg_image: "images/backgrounds/page-title.jpg"
# meta description
description : "本书是 Migrating to Cloud Native Application Architectures 的中文版，本书英文版发布于 2015 年 2 月，中文版由 Jimmy Song 翻译，发布于 2017 年 7 月。"
# book thumbnail
image: "images/books/migrating-to-cloud-native-application-architectures.jpg"
# page banner
banner: "images/banner/cloud-native.jpg"
# taxonomy
category: "电子书"
# page count
pages : "13"
# book price
price : "免费"
# apply url
apply_url : "/migrating-to-cloud-native-application-architectures"
# type
type: "book"
aliases:
- "/posts/migrating-to-cloud-native-architecture"
- "/posts/what-is-cloud-native-application-architecture"
---

本书是 [Migrating to Cloud Native Application Architectures](https://content.pivotal.io/ebooks/migrating-to-cloud-native-application-architectures) 的中文版，本书英文版发布于 2015 年 2 月，中文版由 [Jimmy Song](https://jimmysong.io/) 翻译，发布于 2017 年 7 月。

- 本书GitHub托管地址：<https://github.com/rootsongjc/migrating-to-cloud-native-application-architectures>
- Gitbook 阅读地址：<https://jimmysong.io/migrating-to-cloud-native-application-architectures>

### 译者序

云时代的云原生应用大势已来，将传统的单体架构应用迁移到云原生架构，你准备好了吗？

俗话说“意识决定行动”，在迁移到云原生应用之前，我们大家需要先对 Cloud Native（云原生）的概念、组织形式并对实现它的技术有一个大概的了解，这样才能指导我们的云原生架构实践。

[Pivotal](https://pivotal.io/) 是云原生应用的提出者，并推出了 [Pivotal Cloud Foundry](https://pivotal.io/platform) 云原生应用平台和 [Spring](https://spring.io/) 开源 Java 开发框架，成为云原生应用架构中先驱者和探路者。

原书作于2015年，其中的示例主要针对 Java 应用，实际上也适用于任何应用类型，云原生应用架构适用于异构语言的程序开发，不仅仅是针对 Java 语言的程序开发。截止到本人翻译本书时，云原生应用生态系统已经初具规模，[CNCF](https://cncf.io/) 成员不断发展壮大，基于 Cloud Native 的创业公司不断涌现，[kubernetes](https://kubernetes.io/) 引领容器编排潮流，和 Service Mesh 技术（如 [Linkerd](https://linkerd.io/) 和 [Istio](https://istio.io/)） 的出现，Go 语言的兴起（参考另一本书 [Cloud Native Go](/book/cloud-native-go)）等为我们将应用迁移到云原生架构的提供了更多的方案选择。

### 简介

当前很多企业正在采用云原生应用架构，这可以帮助其IT转型，成为市场竞争中真正敏捷的力量。 O'Reilly 的报告中定义了云原生应用架构的特性，如微服务和十二因素应用程序。

本书中作者Matt Stine还探究了将传统的单体应用和面向服务架构（SOA）应用迁移到云原生架构所需的文化、组织和技术变革。本书中还有一个迁移手册，其中包含将单体应用程序分解为微服务，实施容错模式和执行云原生服务的自动测试的方法。

本书中讨论的应用架构包括：

- 十二因素应用程序：云原生应用架构模式的集合
- 微服务：独立部署的服务，每个服务只做一件事情
- 自助服务的敏捷基础设施：快速，可重复和一致地提供应用环境和后台服务的平台
- 基于API的协作：发布和版本化的API，允许在云原生应用架构中的服务之间进行交互
- 抗压性：根据压力变强的系统

### 关于作者

Matt Stine，Pivotal的技术产品经理，拥有15年企业IT和众多业务领域的经验。Matt 强调精益/敏捷方法、DevOps、架构模式和编程范例，他正在探究使用技术组合帮助企业IT部门能够像初创公司一样工作。
