---
title: "云原生社区 meetup 第三期杭州站"
date: 2021-04-17T12:00:00+08:00
draft: false
# page title background image
bg_image: "images/backgrounds/page-title.jpg"
# meta description
description : "云原生社区 meetup 第三期，杭州站，2021 年 4 月 17 日。"
# Event image
image: "images/events/cloud-native-meetup-hangzhou-03.jpg"
# location
location: "中国杭州"
# entry fee
fee: "免费"
topic: "Cloud Native"
sponsor : "[云原生社区](https://cloudnative.to)"
# apply url
apply_url : "https://cloudnative.huodongxing.com/event/9571346308700"
# event speaker
speaker:
  # speaker loop
  - name : "宋净超"
    image : "images/event-speakers/jimmysong.jpg"
    designation : "Tetrate 布道师，云原生社区创始人"

  # speaker loop
  - name : "周强"
    image : "images/event-speakers/zhouqiang.jpg"
    designation : "PingCAP 工程效率负责人"

  # speaker loop
  - name : "王佰平"
    image : "images/event-speakers/wangbaiping.jpg"
    designation : "网易数帆资深工程师"

  # speaker loop
  - name : "孙健波（天元）"
    image : "images/event-speakers/sunjianbo.jpg"
    designation : "阿里云技术专家"
  # speaker loop
  - name : "张义飞"
    image : "images/event-speakers/zhangyifei.jpg"
    designation : "阿里巴巴云原生高级工程师"
# type
type: "event"
---

### 开场致辞

讲师：宋净超（Tetrate 布道师、云原生社区创始人）

讲师介绍：Tetrate 云原生布道师，云原生社区创始人，CNCF Ambassador，作家和摄影师，热衷于开源和分享。

### 使用 Chaos Mesh 来保障云原生系统的健壮性

讲师：周强

公司：PingCAP

讲师介绍：周强，PingCAP 工程效率负责人，Chaos Mesh 负责人，专注稳定性和性能测试平台。在混沌工程领域有 4 年的从业经验，领导开发云原生混沌测试平台 Chaos Mesh。

演讲概要:

在云原生的世界中，错误无处不在，混沌工程在提高系统稳定性方面起着至关重要的作用。通过执行混沌工程实验，我们可以了解系统的弱点并主动解决。我们开发了云原生混沌工程平台 Chaos Mesh，并在内部使用 Chaos Mesh 来提升云原生分布式数据库 TiDB 的健壮性。目前 Chaos Mesh 已加入 CNCF Sandbox 项目，该平台依托于 k8s 基础设施，通过对 pod/container 进行诸如杀节点、IO 错误和延时注入、时间回退、内核分配内存失败等等来进行混沌测试。主题大纲:

1. 在分布式领域会遇到的质量和稳定性问题
2. 混沌工程在提升系统稳定性方面的作用和意义
3. Chaos Mesh 项目简介
4. 混沌工程主要的测试方式和使用案例
5. 混沌工程平台的构建实践

听众收益：

1. 了解在构建分布式系统可能出现的问题和风险
2. 了解混沌工程的使用经验和踩过的坑，观众后续可以通过混沌工程来进行相关实践，提升产品质量
3. 通过 case study 可以帮助大家构建分布式混沌测试平台

### Envoy 在轻舟微服务中落地实践

讲师：王佰平

公司：网易

讲师介绍：网易数帆资深工程师，负责轻舟 Envoy 网关与轻舟 Service Mesh 数据面开发、功能增强、性能优化等工作。对于 Envoy 数据面开发、增强、落地具有较为丰富的经验。

演讲概要：

Envoy 是由 Lyft 开源的高性能数据和服务代理，以其可观察性和高扩展性著称。如何充分利用 Envoy 的特性，为业务构建灵活易扩展、稳定高性能的基础设施（服务网格、API 网关）是 Envoy 落地生产实践必须考虑的问题。本次分享主要介绍 Envoy 在轻舟微服务网关与轻舟微服务网格中落地实践经验和构建此类基础设施时轻舟关注的核心问题。希望能够给大家带来一些帮助。

听众收益：

1. 了解 Envoy 本身架构与关键特性；
2. 在生产实践当中微服务网关与服务网格关注的核心问题以及轻舟 Envoy 的解决之道；
3. 为期望实现集群流量全方位治理和观察的听众提供些许借鉴。

### KubeVela：阿里巴巴新一代应用交付管理系统实践

讲师：孙健波

公司：阿里巴巴

讲师介绍：孙健波 (花名：天元) 阿里云技术专家，云原生应用模型 OAM (Open Application Model) 核心成员和主要制定者，KubeVela 项目作者，致力于推动云原生应用标准化，负责大规模云原生应用交付与应用管理相关工作。曾参与编写《Docker 容器与容器云》技术书籍。

演讲概要：

1. 云原生应用交付面临的问题与挑战
2. 社区中常见的应用交付解决方案对比
3. 基于 KubeVela 的标准化应用交付管理核心原理
4. 阿里巴巴基于 KubeVela 的应用交付实践

听众收益：

随着 “云原生” 的普及，基础设施逐渐成熟的今天，越来越多的应用开发者们开始追求快速的构建交付应用。然而使用场景的不同往往意味着应用交付的环境会有巨大的差异。就比如，K8s 中不同的工作负载类型需要对接不同的灰度发布、流量管理等实现方案，不同的部署环境（公有云、私有化部署等）也常常需要对接不同的日志监控体系。如何才能将应用管理和交付变得标准化，使得应用研发不再需要花大量精力对接不同的交付平台？这已经逐渐成为云原生应用管理领域的一大痛点。本次分享将针对这些问题为大家介绍如何基于 KubeVela 构建标准化的应用交付管理平台，介绍阿里巴巴在此基础上的实践经验。

### Envoy 在阿里巴巴内部的落地实践

讲师：张义飞

公司：阿里巴巴

讲师介绍：阿里巴巴云原生部门高级工程师，主要负责阿里巴巴内部 ServiceMesh 数据面的落地。Envoy/Istio 社区 Member，给 envoy 社区贡献了 Dubbo Proxy filter，metadata 优化等。

演讲概要：

1. 介绍 Envoy 在大规模场景下存在的问题以及如何优化

2. 介绍 Envoy 实现自定义协议的最佳实践

3. 1. 扩展自定义协议
   2. 扩展连接池
   3. 扩展 Cluster

4. 介绍 Envoy 在阿里巴巴内部落地遇到的一些困难

听众收益：

1. Envoy 在大规模场景下存在的一些问题
2. 机器数量过多导致的内存问题
3. 机器全量下发导致的 CPU 问题

### 关于云原生社区

云原生社区是一个中立的云原生终端用户社区，致力于推广云原生技术，构建开发者生态。

社区官网：[https://cloudnative.to](https://cloudnative.to/)

### 活动回顾

- 本次活动的 PPT 见：[GitHub](https://github.com/cloudnativeto/academy)
- 活动回顾视频见：[Bilibili](https://space.bilibili.com/515485124)