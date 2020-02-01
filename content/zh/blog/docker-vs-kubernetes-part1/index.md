---
date: "2017-03-10T21:09:47+08:00"
title: "Docker对比Kubernetes第一部分"
draft: false
description: "这一系列文章是对比kubernetes 和docker两者之间的差异。"
categories: ["容器"]
tags: ["docker"]
type: "post"
bg_image: "images/backgrounds/page-title.jpg"
aliases: "/posts/docker-vs-kubernetes-part1"
image: "images/banner/docker-logo.jpg"
---

### 前言

这一系列文章是对比kubernetes 和docker两者之间的差异，鉴于我之前从docker1.10.3起开始使用docker，对原生docker的了解比较多，最近又正在看**Kunernetes权威指南（第二版）**这本书（P.S感谢<u>电子工业出版社</u>的编辑朋友赠送此书）。这系列文章不是为了比较孰优孰劣，**适合自己的才是最好的**。

此系列文章中所说的**docker**指的是*17.03-ce*版本。

### 概念性的差别

**Kubernetes**

了解一样东西首先要高屋建瓴的了解它的概念，kubernetes包括以下几种资源对象：

- [Pod](https://kubernetes.io/docs/concepts/abstractions/pod/)
- Service
- Volume
- Namespace
- ReplicaSet
- Deployment
- [StatefulSet](https://kubernetes.io/docs/concepts/abstractions/controllers/statefulsets/)
- DaemonSet
- Job

**Docker**

Docker的资源对象相对于kubernetes来说就简单多了，只有以下几个：

- Service
- Node
- Stack
- Docker

就这么简单，使用一个*docker-compose.yml*即可以启动一系列服务。当然简单的好处是便于理解和管理，但是在功能方面就没有kubernetes那么强大了。

### 功能性差别

- Kubernetes 资源限制 CPU 100m千分之一核为单位，绝对值，requests 和limits，超过这个值可能被杀掉，资源限制力度比docker更细。
- Pod中有个最底层的pause 容器，其他业务容器共用他的IP，docker因为没有这层概念，所以没法共用IP，而是使用overlay网络同处于一个网络里来通信。
- Kubernetes在rc中使用环境变量传递配置（1.3版本是这样的，后续版本还没有研究过）
- Kuberentes Label 可以在开始和动态的添加修改，所有的资源对象都有，这一点docker也有，但是资源调度因为没有kubernetes那么层级，所有还是相对比较弱一些。
- Kubernetes对象选择机制继续通过label selector，用于对象调度。
- Kubernetes中有一个比较特别的镜像，叫做`google_containers/pause`，这个镜像是用来实现Pod概念的。
- HPA horizontal pod autoscaling 横向移动扩容，也是一种资源对象，根据负载变化情况针对性的调整pod目标副本数。
- Kubernetes中有三个IP，Node,Pod,Cluster IP的关系比较复杂，docker中没有Cluster IP的概念。
- 持久化存储，在Kubernetes中有Persistent volume 只能是网络存储，不属于任何node，独立于pod之外，而docker只能使用`volume plugin`。
- 多租户管理，kubernetes中有`Namespace，docker暂时没有多租户管理功能。

总体来说Docker架构更加简单，使用起来也没有那么多的配置，只需要每个结点都安装docker即可，调度和管理功能没kubernetes那么复杂。但是kubernetes本身就是一个通用的数据中心管理工具，不仅可以用来管理docker，*pod*这个概念里就可以运行不仅是docker了。

> 以后的文章中将结合docker着重讲Kubernetes，基于1.3版本。
