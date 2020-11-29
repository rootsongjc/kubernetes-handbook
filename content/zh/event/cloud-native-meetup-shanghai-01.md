---
title: "云原生社区 meetup 第一期上海站"
date: 2020-11-28T18:00:00+08:00
draft: false
# page title background image
bg_image: "images/backgrounds/page-title.jpg"
# meta description
description : "云原生社区技术沙龙贝壳专场，2020 年 11 月 22 日，中国北京。"
# Event image
image: "images/events/cloud-native-meetup-shanghai-01.jpg"
# location
location: "中国上海"
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
  - name : "高洪涛 "
    image : "images/event-speakers/gaohongtao.jpg"
    designation : "Tetrate 创始工程师"

  # speaker loop
  - name : "杨可奥"
    image : "images/event-speakers/yangkeao.jpg"
    designation : "PingCAP"

  # speaker loop
  - name : "侯诗军"
    image : "images/event-speakers/houshijun.jpg"
    designation : "同盾科技"
  # speaker loop
  - name : "程亮"
    image : "images/event-speakers/chengliang.jpg"
    designation : "VIPKID"
# type
type: "event"
---

## 关于本次活动

- 时间：2020年11月28日（星期六）
- 地点：上海市虹桥万科中心
- 主持人：郭旭东（云原生社区管委会成员、上海站站长）

下面是关于本次活动的介绍，欢迎关注云原生社区活动唯一报名渠道[活动行](https://cloudnative.huodongxing.com/)获取后续活动信息。

## 开场演讲

讲师：宋净超

公司：Tetrate

讲师介绍：Tetrate 云原生布道师，云原生社区创始人，CNCF Ambassador，作家和摄影师，热衷于开源和分享。

## Kubernetes 在 UCloud 内部的应用

讲师：高鹏

公司：UCloud

讲师介绍：高鹏 UCloud 后台研发工程师，负责内部云原生平台的建设。

演讲概要：在 Kubernetes 的实际应用中，我们会碰到各种各样的问题，比如复杂的网络结构、持久化存储的实现、多租户的权限模型、集群的升级、Istio 的使用、镜像仓库的高可用、CI/CD、监控告警、日志、Operator 等等等等。这次分享将介绍 UCloud 内部对 Kubernetes 以及云原生生态的应用实践，和大家分析每个选择背后的原因，碰到的问题以及解决方案。

## 使用 Apache SkyWalking Adapter 实现 K8s HPA

讲师：高洪涛

公司：Tetrate

讲师介绍：高洪涛 美国 servicemesh 服务商 Tetrate 创始工程师。原华为软件开发云技术专家，对云 APM 有深入的理解，并有丰富的 APM 产品设计，研发与实施经验。对分布式数据库，容器调度，微服务，ServicMesh 等技术有深入的了解。目前为 Apache SkyWalking 核心贡献者，参与该开源项目在软件开发云的商业化进程。前当当网系统架构师，开源达人，曾参与 Apache ShardingSphere，Elastic-Job 等知名开源项目。对开源项目的管理，推广和社区运营有丰富的经验。积极参与技术分享，曾在多个技术大会中做过分享，包括 ArchSummit， Top100，Oracle 嘉年华等。在多个媒体发表过文章，如 InfoQ。

演讲概要：Apache SkyWalking 作为云原生可观测性工具在 Kubernetes 领域内有诸多应用，包括监控微服务的性能，观测基于 ISTIO 的 Service Mesh 服务等。本次分享将带来使用 SkyWalking 的 Adapter 来实现 Kubernetes 的 HPA 功能。应用该能力后，应用或服务将会根据 SkyWalking 分析的指标进行横向扩展。

## Chaos Mesh - 让应用与混沌在 Kubernetes 上共舞

讲师：杨可奥

公司：PingCAP

讲师介绍：杨可奥，是 Chaos Mesh 的核心开发者之一；也是当前 Chaos Mesh 的 maintainer。在混沌工程的实践和实现上拥有一定经验和见解。除了 Chaos Mesh 之外还维护有多个受欢迎的开源项目，如 pprof-rs。他也曾多次主持或参与社区活动，对云环境下的应用有自己的见解和热爱。

演讲概要：在生产环境中，各种各样的故障随时会发生，一个稳健的应用应当时刻处于能够应对故障的状态。对于云环境下的应用来说，这一点尤为重要。近些年来，混沌工程逐渐成为了一个稳定性保障和测试的重要话题。而 Chaos Mesh 以 Kubernetes 为平台，提供了云环境下的混沌工程实践方案。在这次分享中将介绍混沌工程和 Chaos Mesh 这一实践方案，并对其动机、Operator 模式、部分实现进行讲解。

## **云原生技术在风控 SaaS 领域的踩坑与最佳实践**

讲师：侯诗军

公司：同盾科技

讲师介绍：侯诗军 -- 同盾科技云原生计算部门负责人，香港理工大学与华中科技大学双硕士，十几年来一直专注于云计算技术与管理领域，是 kube-router 等 kubernetes 组件的源代码贡献者，拥有多项云技术专利。16 年加入同盾科技，带领云原生团队从 0 到 N 进行了集团层面的自动化运维、K8S 云平台、DevOps 研发体系变革，将公司在线业务 100% 容器化。

演讲概要：同盾是国内智能风控领域的头部领军企业，全国独角兽 top50。在中国、印尼雅加达、北美、新加坡拥有 8 个混合云数据中心，共计服务器数量 5000 + 台，在线运转的容器数量 2 万 + 个。截至目前已有超过 1 万家客户选择了同盾的产品及服务，API 单日调用量最低 1 亿次以上，平均响应时间最高 200MS 以内。截止 2019 年，同盾科技全部 (1000 个 app) 在线业务已 100% 容器化。本次议题分别从自动化运维、CI/CD、镜像、云原生网络、域名切换、监控与日志、机器学习、容器安全、混合云弹性、多云管理等方面来讲述公司的踩坑与最佳实践。

## 云原生监控体系建设

讲师：程亮

公司：VIPKID

讲师介绍： VIPKID 资深架构师，曾任百度高级研发工程师，阿里巴巴技术专家。目前负责大班课后端总架构，VIPKID 监控系统。

演讲概要：

vipkid 的传统监控体系介绍：传统的机器监控，zabbix，falcon；日志监控，钉钉，邮件直接上报；业务监控

基于 k8s 发布之后的监控体系：从 19 开始，vipkid 开始基于 k8s 的发布流程改造，响应的基于 thanos 的监控体系升级。基于公司内部的 CMDBCMD 系统，开发 k8s 的 opertor，自动化适配 vm（虚拟机）发布项目及监控。

基于日志链路监控：基于流量 CDN-LB-WAF-NG 等链路信息的日志监控

业务监控的全新规划: 对于研发 RD 和测试 QA 同学来说，更加关注线上业务的正确性。构建业务监控平台，支持线上业务指标追踪。