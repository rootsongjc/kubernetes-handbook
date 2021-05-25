---
title: "Cloud Native Community Meetup #4 Guangzhou"
date: 2021-05-22T12:00:00+08:00
draft: false
# page title background image
bg_image: "images/backgrounds/page-title.jpg"
# meta description
description : "Cloud Native Community Meetup #4, Guangzhou, May 22,2021."
# Event image
image: "images/events/cloud-native-meetup-guangzhou-04.jpg"
# location
location: "Guangzhou, China"
# entry fee
fee: "Free"
topic: "Cloud Native"
sponsor : "[Coud Native Community](https://cloudnative.to)"
# apply url
apply_url : "https://cloudnative.huodongxing.com/event/9571346308700"
# event speaker
speaker:
  # speaker loop
  - name : "Jimmy Song"
    image : "images/event-speakers/jimmysong.jpg"
    designation : "Tetrate"

  # speaker loop
  - name : "Yuansheng Wang"
    image : "images/event-speakers/wangyuansheng.jpg"
    designation : "API7"

  # speaker loop
  - name : "Guofeng Huang"
    image : "images/event-speakers/huangguofeng.jpg"
    designation : "Tencent"

  # speaker loop
  - name : "Lingfeng Wu"
    image : "images/event-speakers/wulingfeng.jpg"
    designation : "37 Entertainment"
  # speaker loop
  - name : "Sky Ao"
    image : "images/event-speakers/aoxiaojian.jpg"
    designation : "Alibaba Cloud"
# type
type: "event"
---

### 开场致辞

讲师：宋净超（Tetrate 布道师、云原生社区创始人）

讲师介绍：Tetrate 云原生布道师，云原生社区创始人，CNCF Ambassador，作家和摄影师，热衷于开源和分享。

### 有了 Nginx 和 Kong，为什么还需要 Apache APISIX？

讲师：王院生

个人介绍：支流科技联合创始人 CTO

**演讲概要**

在云原生时代，k8s 和微服务已经成为主流，在带来巨大生产力提升的同时，也增加了系统的复杂度。如何发布、管理和可视化服务，成为了一个重要的问题。每次修改配置都要 reload 的 Nginx、依赖 postgres 才能工作的 Kong，都不是云原生时代的理想之选。这正是我们创造 Apache APISIX 的原因：没有 reload、毫秒内全集群生效、不依赖数据库、极致性能、支持 Java 和 Go 开发插件。

**听众收益**

更好的理解 API 网关、服务网格，以及各个开源项目的优劣势

### 云原生时代的研发效能

讲师：黄国峰

个人介绍：腾讯 PCG 工程效能专家。10 多年的软件和互联网从业经验；现任腾讯工程效能部，负责持续集成、研发流程和构建系统等平台；曾任职唯品会高级经理，负责架构团队。在云原生平台下的研发效能方向有丰富的理论知识和实践经验。

**演讲概要**

云原生时代，软件研发的逻辑彻底改变了。传统的软件开发在本机编码 / 调试、部署到测试环境测试、再发布到生产环境；而云原生时代的开发，基于不可变设施，研发流程从编码、构建、持续测试、持续集成到持续部署，整个过程几乎完全代码化。

**听众收益**

- 了解云原生开发的新挑战和难点
- 了解腾讯云原生开发实践的流程和思路
- 了解腾讯云原生开发中的遇到的坑和解决思路

### 37 手游 Go 微服务架构演进和云原生实践

讲师：吴凌峰

个人介绍：任职于三七互娱集团 37 手游技术部基础架构组，负责平台 golang 基础框架以及 DevOps、CI/CD 生态建设，从业以来一直专注于云原生、DevOps 和容器化等技术应用和推广，在 golang 工程化领域有一定的心得。

**演讲概要**

Golang 微服务应用和云原生的概念近年越来越火热，传统技术栈公司随着业务规模增长，在云原生技术应用落地探索和转型的过程中一定会遇到很多共通的问题以及有各自不同的思考，包括如何更好地提升我们的开发效率、提升服务稳定性、降低运维成本？面对不断增长的服务数量和不断变长变复杂的调用关系网，怎样才能更好地观测、管理和保证核心服务高可用，本次演讲分享将会围绕 37 手游转型为 Go 微服务架构以及建设云原生 DevOps 体系的历程、过程中的领悟和思考展开。

**听众收益**

- 了解 Golang 云原生微服务框架的关键技术和优化实践经验
- 了解云原生观测体系如链路追踪、监控等 Golang 微服务落地实践经验
- 了解混合云混合部署 DevOps 和 CI/CD 体系的企业实践经验

### 死生之地不可不察：论 API 标准化对 Dapr 的重要性

讲师：敖小剑

个人介绍：资深码农，十九年软件开发经验，微服务专家，Service Mesh 布道师，Servicemesher 社区联合创始人，Dapr Maintainer。专注于基础架构，Cloud Native 拥护者，敏捷实践者，坚守开发一线打磨匠艺的架构师。曾在亚信、爱立信、唯品会、蚂蚁金服等任职，对基础架构和微服务有过深入研究和实践。目前就职阿里云，在云原生应用平台全职从事 Dapr 开发。

**演讲概要**

Dapr 作为新兴的云原生项目，以 "应用运行时" 之名致力于围绕云原生应用的各种分布式需求打造一个通用而可移植的抽象能力层。这个愿景有着令人兴奋而向往的美好前景：一个受到普通认可和遵循的云原生业界标准，基于此开发的云原生应用可以在不同的厂家的云上自由的部署和迁移，恍惚间一派云原生下世界大同的美景。然而事情往往没这么简单，API 的标准化之路异常的艰辛而痛苦，Dapr 的分布式能力抽象在实践中会遇到各种挑战和困扰。

**听众收益**

- 了解 Dapr 的愿景和分布式能力抽象层的重要
- 了解 Dapr API 在抽象和实现时遇到的实际问题，尤其是取舍之间的艰难
- 了解目前 Dapr 在 API 抽象上正在进行的努力和新近准备增加的 API

### 幻灯片下载

本次活动的幻灯片已经归档到了云原生学院的 GitHub 仓库，[点击下载](https://github.com/cloudnativeto/academy/tree/master/meetup/04-guangzhou)。

### 视频回看

- [开场演讲 - 宋净超](https://b23.tv/FUOKDr)
- [为什么还需要 Apache APISIX？王院生](https://b23.tv/PEusrt)
- [云原生时代的研发效能 - 黄国锋](https://b23.tv/wHBJoc)
- [37 手游 Go 微服务架构演进和云原生实践 - 吴凌峰](https://b23.tv/Ny92do)
- [死生之地不可不察：论 API 标准化对 Dapr 的重要性 - 敖小剑](https://b23.tv/pFweVo)

### 关于云原生社区

云原生社区是一个中立的云原生终端用户社区，致力于推广云原生技术，构建开发者生态。

社区官网：[https://cloudnative.to](https://cloudnative.to/)
