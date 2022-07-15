---
date: "2017-07-20T18:21:18+08:00"
draft: false
title: "记一本关于kubernetes management design patterns的书"
description: "本书有两个优点，一个是每个章节都给出了问题的起因和kubernetes的解决方案，二是几乎所有的命令和操作都附有截图，说明很详细。"
categories: ["kubernetes"]
tags:  ["kubernetes","图书"]
image: "images/banner/kubernets-management-design-patterns.jpg"
type: "post"
aliases: "/posts/book-kubernetes-management-design-patterns"
---

下面是这本书的基本信息。

- 书名： Kubernetes Management Design Patterns: With Docker, CoreOS Linux, and Other Platforms
- Amazon购买链接：[链接](https://www.amazon.com/Kubernetes-Management-Design-Patterns-Platforms-ebook/dp/B01MZDO0BD/ref=pd_sbs_351_4?_encoding=UTF8&psc=1&refRID=79F47CR67EEESD35S2VF)
- 作者：Deepak Vohra
- 发行日期：2017年1月20日
- 出版社：Apress
- 页数：399

### 简介

Kubernetes引领容器集群管理进入一个全新的阶段；学习如何在CoreOS上配置和管理kubernetes集群；使用适当的管理模式，如ConfigMaps、Autoscaling、弹性资源使用和高可用性配置。讨论了kubernetes的一些其他特性，如日志、调度、滚动升级、volume、服务类型和跨多个云供应商zone。

Kubernetes中的最小模块化单位是Pod，它是拥有共同的文件系统和网络的系列容器的集合。Pod的抽象层可以对容器使用设计模式，就像面向对象设计模式一样。容器能够提供与软件对象（如模块化或包装，抽象和重用）相同的优势。

在大多数章节中使用的都是CoreOS Linux，其他讨论的平台有CentOS，OpenShift，Debian 8（jessie），AWS和Debian 7 for Google Container Engine。

使用CoreOS主要是因为Docker已经在CoreOS上开箱即用。CoreOS：

- 支持大多数云提供商（包括Amazon AWS EC2和Google Cloud Platform）和虚拟化平台（如VMWare和VirtualBox）
- 提供Cloud-Config，用于声明式配置OS，如网络配置（flannel），存储（etcd）和用户帐户
- 为容器化应用提供生产级基础架构，包括自动化，安全性和可扩展性
- 引领容器行业标准，并建立了应用程序标准
- 提供最先进的容器仓库，Quay

Docker于2013年3月开源，现已称为最流行的容器平台。kubernetes于2014年6月开源，现在已经成为最流行的容器集群管理平台。第一个稳定版CoreOS Linux于2014年7月发行，现已成为最流行的容器操作系统之一。

### 你将学到什么

- 使用docker和kubernetes
- 在AWS和CoreOS上创建kubernetes集群
- 应用集群管理设计模式
- 使用多个云供应商zone
- 使用Ansible管理kubernetes
- 基于kubernetes的PAAS平台OpenShift
- 创建高可用网站
- 构建高可用用的kubernetes master集群
- 使用volume、configmap、serivce、autoscaling和rolling update
- 管理计算资源
- 配置日志和调度

### 谁适合读这本书

Linux管理员、CoreOS管理员、应用程序开发者、容器即服务（CAAS）开发者。阅读这本书需要Linux和Docker的前置知识。介绍Kubernetes的知识，例如创建集群，创建Pod，创建service以及创建和缩放replication controller。还需要一些关于使用Amazon Web Services（AWS）EC2，CloudFormation和VPC的必备知识。

### 关于作者

**Deepak Vohra** is an Oracle Certified Associate and a Sun Certified Java Programmer. Deepak has published in Oracle Magazine, OTN, IBM developerWorks, ONJava, DevSource,  WebLogic Developer’s Journal, XML Journal, Java Developer’s Journal, FTPOnline, and devx.

### 目录

- 第一部分：平台
  - 第1章：Kuberentes on AWS
  - 第2章：kubernetes on CoreOS on AWS
  - 第3章：kubernetes on Google Cloud Platform
- 第二部分：管理和配置
  - 第4章：使用多个可用区
  - 第5章：使用Tectonic Console
  - 第6章：使用volume
  - 第7章：使用service
  - 第8章：使用Rolling updte
  - 第9章：在node上调度pod
  - 第10章：配置计算资源
  - 第11章：使用ConfigMap
  - 第12章：使用资源配额
  - 第13章：使用Autoscaling
  - 第14章：配置logging
- 第三部分：高可用
  - 第15章：在OpenShift中使用HA master
  - 第16章：开发高可用网站

### 个人评价

本书更像是一本参考手册，对于想在公有云中（如AWS、Google Cloud Platform）中尝试Kubernetes的人会有所帮助，而对于想使用kubernetes进行自己的私有云建设，或想了解kubernetes的实现原理和技术细节的人来说，就不适合了。对我来说，本书中有个别几个章节可以参考，如高可用，但还是使用OpenShift实现的。总之，如果你使用AWS这样的公有云，对操作系统没有特别要求，可以接受CoreOS的话，那么可以看看这本书。本来本书会对kubernetes中的各种应用模式能够有个详解，但是从书中我并没有找到。

本书有两个优点，一个是每个章节都给出了问题的起因和kubernetes的解决方案，二是几乎所有的命令和操作都附有截图，说明很详细。

