---
title: "Kubernetes项目联合创始人Brendan Burns新书Managing Kubernetes介绍及评论"
subtitle: "本书作者Brendan Burns & Craig Tracey"
date: 2018-10-23T21:21:07+08:00
bigimg: [{src: "https://ws4.sinaimg.cn/large/006tNbRwly1fwihjc8qbaj30ku0afdjf.jpg", desc: "Photo Kubernetes"}]
draft: false
description: "本文是Kubernetes项目联合创始人Brendan Burns新书Managing Kubernetes介绍并发表了我个人对本书的评论。"
tags: ["kubernetes","book"]
categories: ["kubernetes"]
---

*`Managing Kubernetes - Operating Kubernetes Cluster in the Real World`* 《管理 Kubernetes ——运维真实的 Kubernetes 集群》这本书的作者是：

- **Brendan Burns**：Kubernetes 项目的三位联合创始人之一，现就职于微软 Azure。
- **Craig Tracey**：Heptio 公司的工程师，也是本书发行的赞助公司。

本书由 `O’Reilly` 出版，可以从网上免费获得（例如 `Heptio` 和 `O’Reilly` 的官网上），并在[亚马逊](https://www.amazon.com/Managing-Kubernetes-Operating-Clusters-World/dp/149203391X/ref=sr_1_1?ie=UTF8&qid=1540304199&sr=8-1&keywords=managing+kubernetes)上预售（2018年12月3日正式发售），该书已经由国内某出版社引进，将发行简体中文版。

英文电子版 PDF 下载，请翻页面底部关注`云原生应用架构`公众号并在后台回复`管理Kubernetes`即可获得下载地址。

<div class="gallery">
    <a href="https://ws2.sinaimg.cn/large/006tNbRwly1fwiggklt0xj30ni0uugpr.jpg" title="Managing Kubernetes">
    <img src="https://ws2.sinaimg.cn/large/006tNbRwly1fwiggklt0xj30ni0uugpr.jpg"></a>
</div>

Kubernetes 项目的另外两位联合创始人目前都就职在 [Heptio](https://heptio.com)。

<div class="gallery">
    <a href="https://ws2.sinaimg.cn/large/006tNbRwly1fwigl7mv8fj31kw14e7wh.jpg" title="Kubernetes 项目联合创始人">
    <img src="https://ws2.sinaimg.cn/large/006tNbRwly1fwigl7mv8fj31kw14e7wh.jpg">
    </a>
</div>

## 目录结构

本书一共划分为 14 章，分别为：

**第 1 章 简介**

- 集群是如何运行的
- 调整、加密和优化集群
- 出现错误时的反应
- 增加新功能以扩展系统
- 总结

**第 2 章 Kubernetes 概览**

- 容器
- 容器编排
- Kubernetes API
  - 基本对象：Pod、ReplicaSets、Service
  - 使用 Namespace、Label、Annotation 来组织集群
  - 高级概念：Deployment、Ingress、StatefulSet
  - 批处理负载：Job 和 ScheduledJob
  - 集群代理（Agent）和实用工具（Utility）：DaemonSet
- 总结

**第 3 章 Kubernetes 架构**

- 概念
  - 声明式配置
  - 协调（Reconciliation）和控制器
  - 隐式（Implicit）和动态分组
- 结构
  - 多组件的 Unix 哲学
  - API 驱动（API-Driven）接口
- 组件
  - Head Node 组件
  - All Node 组件
  - 调度组件
- 总结

**第 4 章 Kubernetes API Server**

- 可管理性的基本特征
- API Server 的构件
  - API 管理
  - API 路径
  - API 发现
  - OpenAPI Spec Serving
  - API 转义
- 请求管理
  - 请求类型
  - 请求的生命周期
- API Server 本质
  - CRD 控制环路
- 调试 API Server
  - 基本日志
  - 审计日志
  - 启用附加日志
  - 调试 kubectl 请求
- 总结

**第 5 章 调度器**

- 调度概览
- 调度过程
  - 判断（Predicate）
  - 优先级（Priority）
  - 高等级（High-Level）算法
  - 冲突（Conflict）
- 基于标签（Label）、亲和性（Affinity）、污点（Taint）和容忍（Toleration）的调度控制
  - 节点选择器（Node Selector）
  - 节点亲和性（Node Affinity）
  - 污点（Taint）和容忍（Toleration）
- 总结

**第 6 章 安装 Kubernetes**

- kubeadm
  - 要求
  - kubelet
- 安装控制平面
  - kubeadm 配置
  - 预检
  - 认证
  - etcd
  - kubeconfig
  - 污点（taint）
- 安装 worker 节点
- 附件（Add-On）
- 阶段（Phase）
- 高可用（HA）
- 升级
- 总结

**第 7 章 身份验证（Authentication）和用户管理**

- 用户
- 身份验证
- kubeconfig
- Service Account
- 总结

**第 8 章 授权（Authorization）**

- REST
- 授权
- 基于角色的访问控制（RBAC）
  - Role 和 ClusterRole
  - RoleBinding 和 ClusterRoleBinding
  - 测试授权
- 总结

**第 9 章 许可控制（Admission Control）**

- 配置
- 常用（Common）控制器
  - PodSecurityPolicies
  - ResourceQuota
  - LimitRange
- 动态许可控制器
  - 验证（Validating）许可控制器
  - 变更（Mutating）许可控制器

**第 10 章 网络**

- 容器网络接口（CNI）
  - 选择插件
- kube-proxy
- 服务发现
  - DNS
  - 环境变量
- 网络策略（Network Policy）
- 服务网格（Service Mesh）

**第 11 章 监控 Kubernetes**

- 监控的目标
- 日志和监控的区别
- 构件监控技术栈
  - 从集群和应用中获取数据
  - 从多个源中聚合 metric 和日志
  - 存储数据以用来检索和查询
  - 可视化及数据交互
- 哪些需要监控？
  - 监控机器
  - 监控 Kubernetes
  - 监控应用
  - 黑盒（Blackbox）监控
  - 日志流（Stream）
  - 告警（Alert）
  - 总结

**第 12 章 灾难恢复**

- 高可用（HA）
- 状态
- 应用数据
  - 持久化卷（Persistent Volume）
  - 本地数据（Local Data）
- Worker Node
- etcd
- Ark
- 总结

**第 13 章 扩展 Kubernetes**

- Kubernetes 扩展点
- 集群守护进程（Cluster Daemon）
  - Cluster Daemon 的用例
  - 安装 Cluster Daemon
  - Cluster Daemon 的运维注意事项
  - 实践：创建 Cluster Daemon 的示例
- 集群助理（Cluster Assistant）
  - Cluster Assistant 用力
  - 安装 Cluster Assistant
  - Cluster Assistant 的运维注意事项
  - 实践：Cluster Assistant 示例
- 扩展 API Server 的生命周期
  - 扩展 API Server 生命周期的用例
  - 安装 API 生命周期扩展
  - API 生命周期扩展的运维注意事项
  - 实践：API 生命周期扩展的示例
- 向 Kubernetes 中添加自定义 API
  - 添加新 API 的用例
  - 自定义资源定义（CRD）和聚合 API Server
  - CRD 架构
  - 安装 CRD
  - 自定义资源的运维注意事项
- 总结

**第 14 章 总结**

## 个人评论

以下是我个人看法。

如果你想通过本书看到很多生产上趟坑得实践，那么你会感到很失望。在看这本书的目录的时候我到是看的热血沸腾，但是本书只有寥寥 187 页却包含了如此多的内容，这就注定它不是一本参考书，你也不能指望通过它学到多少运维生产环境 Kubernetes 集群的知识。每一章中的每一节都是一两段总结性的话语，如果你看过 [Kubernetes 的官方文档](https://kubernetes.io)会觉得这本书写的太简略了，事实确实如此。因此可以将此书作为一个大纲，再结合官方文档和实践学习效果更佳。

另外对本书感兴趣的同学可以[联系我](https://jimmysong.io/about)加入读者交流群。