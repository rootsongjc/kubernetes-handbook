---
date: "2017-03-10T21:09:47+08:00"
title: "Docker 对比 Kubernetes 第一部分"
draft: false
description: "这一系列文章是对比 kubernetes 和 docker 两者之间的差异。"
categories: ["容器"]
tags: ["docker"]
type: "post"
aliases: "/posts/docker-vs-kubernetes-part1"
image: "images/banner/docker-logo.jpg"
---

## 前言

这一系列文章是对比 kubernetes 和 docker 两者之间的差异，鉴于我之前从 docker1.10.3 起开始使用 docker，对原生 docker 的了解比较多，最近又正在看《Kunernetes 权威指南（第二版）》这本书（P.S 感谢电子工业出版社的编辑朋友赠送此书）。这系列文章不是为了比较孰优孰劣，**适合自己的才是最好的**。

此系列文章中所说的 Docker 指的是 `17.03-ce` 版本。

## 概念性的差别

**Kubernetes**

了解一样东西首先要高屋建瓴的了解它的概念，kubernetes 包括以下几种资源对象：

- Pod
- Service
- Volume
- Namespace
- ReplicaSet
- Deployment
- StatefulSet
- DaemonSet
- Job

**Docker**

Docker 的资源对象相对于 kubernetes 来说就简单多了，只有以下几个：

- Service
- Node
- Stack
- Docker

就这么简单，使用一个 *docker-compose.yml* 即可以启动一系列服务。当然简单的好处是便于理解和管理，但是在功能方面就没有 kubernetes 那么强大了。

## 功能性差别

- Kubernetes 资源限制 CPU 100m 千分之一核为单位，绝对值，requests 和 limits，超过这个值可能被杀掉，资源限制力度比 docker 更细。
- Pod 中有个最底层的 pause 容器，其他业务容器共用他的 IP，docker 因为没有这层概念，所以没法共用 IP，而是使用 overlay 网络同处于一个网络里来通信。
- Kubernetes 在 rc 中使用环境变量传递配置（1.3 版本是这样的，后续版本还没有研究过）
- Kuberentes Label 可以在开始和动态的添加修改，所有的资源对象都有，这一点 docker 也有，但是资源调度因为没有 kubernetes 那么层级，所有还是相对比较弱一些。
- Kubernetes 对象选择机制继续通过 label selector，用于对象调度。
- Kubernetes 中有一个比较特别的镜像，叫做 `google_containers/pause`，这个镜像是用来实现 Pod 概念的。
- HPA horizontal pod autoscaling 横向移动扩容，也是一种资源对象，根据负载变化情况针对性的调整 pod 目标副本数。
- Kubernetes 中有三个 IP，Node,Pod,Cluster IP 的关系比较复杂，docker 中没有 Cluster IP 的概念。
- 持久化存储，在 Kubernetes 中有 Persistent volume 只能是网络存储，不属于任何 node，独立于 pod 之外，而 docker 只能使用 `volume plugin`。
- 多租户管理，kubernetes 中有 `Namespace，docker 暂时没有多租户管理功能。

总体来说 Docker 架构更加简单，使用起来也没有那么多的配置，只需要每个结点都安装 docker 即可，调度和管理功能没 kubernetes 那么复杂。但是 kubernetes 本身就是一个通用的数据中心管理工具，不仅可以用来管理 docker，*pod* 这个概念里就可以运行不仅是 docker 了。

> 以后的文章中将结合 docker 着重讲 Kubernetes，基于 1.3 版本。
