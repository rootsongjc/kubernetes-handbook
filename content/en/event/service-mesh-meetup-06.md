---
title: "Service Mesh Meetup #6"
date: 2019-08-11T13:00:00+08:00
draft: false
# page title background image
bg_image: "images/backgrounds/page-title.jpg"
# meta description
description : "6th Service Mesh Meetup, Aug 11, 2019, Guangzhou, China."
# Event image
image: "images/events/service-mesh-meetup-06-guangzhou.jpg"
# location
location: "Guangzhou, China"
# entry fee
fee: "Free"
topic: "Service Mesh"
sponsor : "[ServiceMesher](https://www.servicemesher.com)"
# apply url
apply_url : "https://tech.antfin.com/activities/781/review"
# event speaker
speaker:
  # speaker loop
  - name : "张波"
    image : "images/event-speakers/zhangbo.png"
    designation : "虎牙基础保障部中间件团队负责人"

  # speaker loop
  - name : "彭泽文 "
    image : "images/event-speakers/pengzewen.jpg"
    designation : "蚂蚁金服高级开发工程师"

  # speaker loop
  - name : "涂小刚"
    image : "images/event-speakers/tuxiaogang.png"
    designation : "慧择网运维经理"
    
  # speaker loop
  - name : "敖小剑"
    image : "images/event-speakers/aoxiaojian.jpg"
    designation : "蚂蚁金服高级技术专家"

# type
type: "event"
---

## 关于本次活动

时间：2019年8月11日（星期日）

地点：广州市天河区广电云平广场

视频回放：<https://tech.antfin.com/activities/781/review>

PPT下载：https://github.com/servicemesher/meetup-slides

## 讲师与演讲话题

#### 虎牙直播在微服务改造方面的实践

张波 虎牙基础保障部中间件团队负责人

本次主要分享虎牙注册中心、名字服务、DNS 的改造实践，以及如何通过 Nacos 实现与 istio 打通实现，使微服务平滑过渡到 service mesh。

#### Service Mesh 在蚂蚁金服的生产级安全实践

彭泽文 蚂蚁金服高级开发工程师

介绍通过 Envoy SDS（Secret Discovery Service）实现 Sidecar 证书管理的落地方案；分享如何为可信身份服务构建敏感信息数据下发通道，以及 Service Mesh Sidecar 的 TLS 生产级落地实践。

#### 基于 Kubernetes 的微服务实践

涂小刚 慧择网运维经理

介绍如何跟据现有业务环境情况制定容器化整体解决方案，导入业务进入 K8S 平台，容器和原有业务环境互通。制订接入规范、配置中心对接 K8S 服务、网络互通方案、DNS 互通方案、jenkins-pipeline 流水线构建方案、日志采集方案、监控方案等。

#### Service Mesh 发展趋势（续）：棋到中盘路往何方

敖小剑 蚂蚁金服高级技术专家

继续探讨 Service Mesh 发展趋势：深度分析 Istio 的重大革新 Mixer v2，Envoy 支持 Web Assembly 的意义所在，以及在 Mixer v2 出来之前的权宜之计; 深入介绍 Google Traffic Director 对虚拟机模式的创新支持方式，以及最近围绕 SMI 发生的故事。
