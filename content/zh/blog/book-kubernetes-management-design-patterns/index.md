---
date: "2017-07-20T18:21:18+08:00"
draft: false
title: "记一本关于 kubernetes management design patterns 的书"
description: "本书有两个优点，一个是每个章节都给出了问题的起因和 kubernetes 的解决方案，二是几乎所有的命令和操作都附有截图，说明很详细。"
categories: ["kubernetes"]
tags:  ["kubernetes","图书"]
image: "images/banner/kubernets-management-design-patterns.jpg"
type: "post"
aliases: "/posts/book-kubernetes-management-design-patterns"
---

下面是这本书的基本信息。

- 书名：Kubernetes Management Design Patterns: With Docker, CoreOS Linux, and Other Platforms
- Amazon 购买链接：[链接](https://www.amazon.com/Kubernetes-Management-Design-Patterns-Platforms-ebook/dp/B01MZDO0BD/ref=pd_sbs_351_4?_encoding=UTF8&psc=1&refRID=79F47CR67EEESD35S2VF)
- 作者：Deepak Vohra
- 发行日期：2017 年 1 月 20 日
- 出版社：Apress
- 页数：399

### 简介

Kubernetes 引领容器集群管理进入一个全新的阶段；学习如何在 CoreOS 上配置和管理 kubernetes 集群；使用适当的管理模式，如 ConfigMaps、Autoscaling、弹性资源使用和高可用性配置。讨论了 kubernetes 的一些其他特性，如日志、调度、滚动升级、volume、服务类型和跨多个云供应商 zone。

Kubernetes 中的最小模块化单位是 Pod，它是拥有共同的文件系统和网络的系列容器的集合。Pod 的抽象层可以对容器使用设计模式，就像面向对象设计模式一样。容器能够提供与软件对象（如模块化或包装，抽象和重用）相同的优势。

在大多数章节中使用的都是 CoreOS Linux，其他讨论的平台有 CentOS，OpenShift，Debian 8（jessie），AWS 和 Debian 7 for Google Container Engine。

使用 CoreOS 主要是因为 Docker 已经在 CoreOS 上开箱即用。CoreOS：

- 支持大多数云提供商（包括 Amazon AWS EC2 和 Google Cloud Platform）和虚拟化平台（如 VMWare 和 VirtualBox）
- 提供 Cloud-Config，用于声明式配置 OS，如网络配置（flannel），存储（etcd）和用户帐户
- 为容器化应用提供生产级基础架构，包括自动化，安全性和可扩展性
- 引领容器行业标准，并建立了应用程序标准
- 提供最先进的容器仓库，Quay

Docker 于 2013 年 3 月开源，现已称为最流行的容器平台。kubernetes 于 2014 年 6 月开源，现在已经成为最流行的容器集群管理平台。第一个稳定版 CoreOS Linux 于 2014 年 7 月发行，现已成为最流行的容器操作系统之一。

### 你将学到什么

- 使用 docker 和 kubernetes
- 在 AWS 和 CoreOS 上创建 kubernetes 集群
- 应用集群管理设计模式
- 使用多个云供应商 zone
- 使用 Ansible 管理 kubernetes
- 基于 kubernetes 的 PAAS 平台 OpenShift
- 创建高可用网站
- 构建高可用用的 kubernetes master 集群
- 使用 volume、configmap、serivce、autoscaling 和 rolling update
- 管理计算资源
- 配置日志和调度

### 谁适合读这本书

Linux 管理员、CoreOS 管理员、应用程序开发者、容器即服务（CAAS）开发者。阅读这本书需要 Linux 和 Docker 的前置知识。介绍 Kubernetes 的知识，例如创建集群，创建 Pod，创建 service 以及创建和缩放 replication controller。还需要一些关于使用 Amazon Web Services（AWS）EC2，CloudFormation 和 VPC 的必备知识。

### 关于作者

**Deepak Vohra** is an Oracle Certified Associate and a Sun Certified Java Programmer. Deepak has published in Oracle Magazine, OTN, IBM developerWorks, ONJava, DevSource,  WebLogic Developer’s Journal, XML Journal, Java Developer’s Journal, FTPOnline, and devx.

### 目录

- 第一部分：平台
  - 第 1 章：Kuberentes on AWS
  - 第 2 章：kubernetes on CoreOS on AWS
  - 第 3 章：kubernetes on Google Cloud Platform
- 第二部分：管理和配置
  - 第 4 章：使用多个可用区
  - 第 5 章：使用 Tectonic Console
  - 第 6 章：使用 volume
  - 第 7 章：使用 service
  - 第 8 章：使用 Rolling updte
  - 第 9 章：在 node 上调度 pod
  - 第 10 章：配置计算资源
  - 第 11 章：使用 ConfigMap
  - 第 12 章：使用资源配额
  - 第 13 章：使用 Autoscaling
  - 第 14 章：配置 logging
- 第三部分：高可用
  - 第 15 章：在 OpenShift 中使用 HA master
  - 第 16 章：开发高可用网站

### 个人评价

本书更像是一本参考手册，对于想在公有云中（如 AWS、Google Cloud Platform）中尝试 Kubernetes 的人会有所帮助，而对于想使用 kubernetes 进行自己的私有云建设，或想了解 kubernetes 的实现原理和技术细节的人来说，就不适合了。对我来说，本书中有个别几个章节可以参考，如高可用，但还是使用 OpenShift 实现的。总之，如果你使用 AWS 这样的公有云，对操作系统没有特别要求，可以接受 CoreOS 的话，那么可以看看这本书。本来本书会对 kubernetes 中的各种应用模式能够有个详解，但是从书中我并没有找到。

本书有两个优点，一个是每个章节都给出了问题的起因和 kubernetes 的解决方案，二是几乎所有的命令和操作都附有截图，说明很详细。

