---
title: "OAM（开放应用模型）——定义云原生应用标准的野望"
description: "本文是对 OAM 及 Rudr 的初探，主要介绍了 OAM 诞生的背景和要解决的问题，同时介绍了它在云原生生态中的作用。"
date: 2020-03-22T14:34:40+08:00
draft: false
tags: ["oam"]
categories: ["cloud native"]
type: "post"
bg_image: "images/backgrounds/page-title.jpg"
image: "images/banner/oam.png"
---

[OAM（Open Application Model）](https://oam.dev/)是阿里巴巴和微软共同开源的云原生应用规范模型，同时开源了基于 OAM 的实现 [Rudr](https://github.com/oam-dev/rudr)。自去年 10 月宣布开源以来截止本文发稿已经有快半年时间了，除了官方文档及 GitHub 外很少看到有关它的详细资料，可能是开发者社区还发展起来。

当前可能大部分人才刚刚开始了解 OAM，所以这篇文章将从最基础出发，为大家介绍 OAM 的诞生背景和要解决的问题，以及它在云原生生态中的作用。

## Takeaways

如果你没有兴趣或者时间阅读下面的全文，那么建议阅读下面这些核心观点：

- OAM 的本质是根据软件设计的“兴趣点分离”原则对负责的 DevOps 流程的高度抽象和封装
- 

## 背景

OAM 全称是 Open Application Model，从名称上来看它所定义的就是一种模型，同时也实现了基于 OAM 的我认为这种模型旨在定义了云原生应用的标准。

- 开放（Open）：支持异构的平台、容器运行时、调度系统、云供应商、硬件配置等，总之与底层无关
- 应用（Application）：云原生应用
- 模型（Model）：定义标准，以使其与底层平台无关

> 顺便说下 CNCF 中的也有几个定义标准的「开源项目」，其中有的项目都已经毕业，但是这些项目你甚至可能都没听说过。
> - [SMI（Service Mesh Interface）](https://github.com/servicemeshinterface/smi-spec)
> - [Cloud Events](https://github.com/cloudevents/spec)
> - [TUF](https://github.com/theupdateframework/specification)
> - [SPIFFE](https://github.com/spiffe/spiffe)

当然既然要指定标准，自然要对不同平台和场景的逻辑做出更高级别的抽象（这也意味着你在掌握了底层逻辑的情况下还要学习更多的概念），这样才能屏蔽底层差异。本文将默认底层平台为 Kubernetes。

- 是从管理大量 CRD 中汲取的经验。
- 业务和研发的沟通成本，比如 YAML 配置中很多字段是开发人员不关心的。

## Rudr

请参考 [Rudr 文档](https://github.com/oam-dev/rudr/blob/master/docs/setup/install.md) 安装，主要依赖以下组件：

- kubectl
- helm 3
- Kubernetes 1.15+

## 参考

- [OAM 官方网站 - oam.dev](https://oam.dev)