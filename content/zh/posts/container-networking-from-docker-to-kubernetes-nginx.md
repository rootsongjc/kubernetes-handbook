---
title: "从 Docker 到 Kubernetes 中的容器网络图书资料分享"
subtitle: "资料来自 Nginx，O'Reilly 出版"
description: "近日 Nginx 公司的 Michael Hausenblas 发布了一本关于 docker 和 kubernetes 中的容器网络的小册子。这份资料一共 72 页，是大家由浅入深的了解 Docker 和 Kubernetes 中的网络的很好的入门资料。"
date: 2018-04-21T10:07:20+08:00
tags: ["kubernetes","book"]
categories: "kubernetes"
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/2018042001.jpg", desc: "Sunset at Hangzhou Airport|Hangzhou|Apr 20,2018"}]
draft: false
---

TL;DR [点此下载本书 PDF](https://share.weiyun.com/5tGG1ya)。

![Docker 和 Kubernetes 中的容器网络图书封面](https://res.cloudinary.com/jimmysong/image/upload/images/Container-Networking-Docker-Kubernetes-cover.png)

近日 Nginx 公司的 *Michael Hausenblas* 发布了一本关于 docker 和 kubernetes 中的容器网络的小册子。这份资料一共 72 页，是大家由浅入深的了解 Docker 和 Kubernetes 中的网络的很好的入门资料。

### 目标读者

- 容器软件开发者
- SRE
- 网络运维工程师
- 想要把传统软件进行容器化改造的架构师

### 章节目录

- 第一章：本书的写作动机
  - 介绍“宠物模式” vs “牲畜模式"
  - Go Cattle！容器使用的是牲畜模式！
  - 容器网络技术栈
  - 我需要全盘押注容器吗？
- 第二章：介绍容器网络
  - 单主机的容器网络导读
  - 容器网络模式
  - 网络管理考量
  - 本章小结
- 第三章：介绍多主机的网络
  - 多主机容器网络导读
  - 多主机容器网络的选择
  - Docker 网络
  - 网络管理考量
  - 本章小结
- 第四章：编排
  - Scheduler 是做什么的？
  - Docker
  - Apache Mesos
  - Hashicorp Nomad
  - 社区很重要！
  - 本章小结
- 第五章：服务发现
  - 挑战
  - 技术
  - 负载均衡
  - 本章小结
- 第六章：容器网络接口
  - 历史
  - 规格和用法
  - 容器运行时和插件
  - 本章小结
- 第七章：Kubernetes 网络
  - Kubernetes 简介
  - Kubernetes 网络简介
  - Pod 内部网络通信
  - Pod 间网络通信
  - Kubernetes 中的服务发现
  - Ingress 和 Egress
  - Kubernetes 网络的高级主题
  - 本章小结
- 参考
