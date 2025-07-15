---
linktitle: Kubernetes 手册
description: "Kubernetes 基础教程 - 全面介绍容器编排技术的实战手册，涵盖核心架构、关键组件和实际应用。"
weight: 1
categories:
- 教程手册
category: 教程手册
featured: true
type: publication
layout: book-content
title: Kubernetes 基础教程
date: '2024-01-15T00:00:00+08:00'
aliases:
- /guide-to-cloud-native-app
cascade:
  comment: true
  type: book
  layout: book-content
book:
  title: "Kubernetes 手册"
  description: "Kubernetes 基础教程，全面掌握容器编排技术的实战手册，涵盖核心架构、关键组件和实际应用。"
  language: "zh-hans"
  author: "Jimmy Song"
  cover: cover.jpg
  date: 2025-07-13
  website: https://jimmysong.io/book/kubernetes-handbook/
  appendix: false
repository:
  url: https://github.com/rootsongjc/kubernetes-handbook
  branch: main
---

{{<callout note 关于本教程>}}
本教程迁移自[《Kubernetes 中文指南——云原生应用架构实战手册》](https://github.com/rootsongjc/kubernetes-handbook)，原手册使用 Gitbook 发布，内容涵盖容器、Kubernetes、服务网格、Serverless 等云原生的多个领域。由于内容过于宽泛，且 Gitbook 项目已停止维护，现将其中的 Kubernetes 教程部分独立成书，并使用 Hugo 重新构建和持续更新。本书采用[署名 - 非商业性使用 - 相同方式共享 4.0 (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh) 协议共享。
{{</callout>}}

## 什么是云原生

云原生是一种行为方式和设计理念，其本质是通过一系列技术和方法论来提高云上资源利用率和应用交付效率。云计算的发展史就是一部云原生化的历史。

从技术发展历程来看：

- **Kubernetes** 开启了云原生的序幕，提供了容器编排的标准
- **服务网格（如 Istio）** 引领了后 Kubernetes 时代的微服务治理
- **Serverless** 技术使云原生从基础设施层向应用架构层深入发展

我们正处于一个云原生技术快速演进的新时代。

{{<callout note "版本信息">}}
本书基于 Kubernetes v1.31+ 编写，持续更新最新的概念和 API，确保内容的时效性和准确性。
{{</callout>}}

## Kubernetes 简介

[Kubernetes](https://kubernetes.io) 是 Google 于 2014 年 6 月基于其内部使用的 [Borg](https://research.google/pubs/large-scale-cluster-management-at-google-with-borg/) 系统开源的容器编排调度引擎。Google 将其作为初始和核心项目贡献给 [CNCF](https://cncf.io)（云原生计算基金会），现已成为云原生生态的核心基石。

### Kubernetes 的使命

Kubernetes 的目标不仅仅是一个编排系统，而是：

- 提供规范来描述集群架构
- 定义服务的最终状态
- 使系统自动达到并维持该状态
- 作为云原生应用的操作系统

### 云原生技术栈

根据 CNCF 定义，云原生技术有利于各组织在公有云、私有云和混合云等新型动态环境中，构建和运行可弹性扩展的应用。

核心技术包括：

- **容器** - 应用打包和运行的标准单元
- **服务网格** - 微服务间通信的基础设施层
- **微服务** - 应用架构的设计模式
- **不可变基础设施** - 基础设施的管理理念
- **声明式 API** - 系统配置和管理的方式

这些技术能够构建容错性好、易于管理和便于观察的松耦合系统，结合可靠的自动化手段，使工程师能够轻松地对系统作出频繁和可预测的重大变更。

## 关于本书

### 项目历程

Kubernetes Handbook 项目始于 2016 年底，开源于 2017 年 3 月，作为第一本系统介绍 Kubernetes 的中文电子书，经过多年持续完善和更新。

### 内容特色

本书记录了从零开始学习和使用 Kubernetes 的完整历程，具有以下特点：

- **实战导向** - 着重于经验总结和最佳实践分享
- **深入浅出** - 详细解析 Kubernetes 核心概念
- **生态完整** - 涵盖微服务、DevOps、服务网格、Serverless 等相关领域
- **持续更新** - 跟进最新技术发展和社区动态

{{< list_children show_summary="true" style="cards" >}}

{{< cta cta_text="开始阅读" cta_link="architecture" >}}
