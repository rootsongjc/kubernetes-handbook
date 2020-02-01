---
date: "2017-03-10T22:06:32+08:00"
title: "Docker对比Kubernetes第二部分"
draft: false
description: "这一系列文章是对比kubernetes 和docker两者之间的差异。"
categories: ["容器"]
tags: ["docker"]
type: "post"
bg_image: "images/backgrounds/page-title.jpg"
aliases: "/posts/docker-vs-kubernetes-part1"
image: "images/banner/docker-logo.jpg"
---

本文是`Docker v.s Kubernetes `系列第二篇，续接上文[Docker对比Kuberntes第一部分](/blog/docker-vs-kubernetes-part1/)。

Kubernetes是典型的**Master/Slave**架构模式，本文简要的介绍kubenetes的架构和组件构成。

## Kubernetes核心架构

### master节点

- apiserver：作为kubernetes系统的入口，封装了核心对象的增删改查操作，以RESTFul接口方式提供给外部客户和内部组件调用。它维护的REST对象将持久化到etcd（一个分布式强一致性的key/value存储）。
- scheduler：负责集群的资源调度，为新建的Pod分配机器。这部分工作分出来变成一个组件，意味着可以很方便地替换成其他的调度器。
- controller-manager：负责执行各种控制器，目前有两类：
  1. endpoint-controller：定期关联service和Pod(关联信息由endpoint对象维护)，保证service到Pod的映射总是最新的。
  2. replication-controller：定期关联replicationController和Pod，保证replicationController定义的复制数量与实际运行Pod的数量总是一致的。

### node节点

- kubelet：负责管控docker容器，如启动/停止、监控运行状态等。它会定期从etcd获取分配到本机的Pod，并根据Pod信息启动或停止相应的容器。同时，它也会接收apiserver的HTTP请求，汇报Pod的运行状态。
- proxy：负责为Pod提供代理。它会定期从etcd获取所有的service，并根据service信息创建代理。当某个客户Pod要访问其他Pod时，访问请求会经过本机proxy做转发。

![master slave架构](https://res.cloudinary.com/jimmysong/image/upload/images/kubernetes-masterslave.png)

## Kubernetes组件详细介绍

### etcd

虽然不是Kubernetes的组件但是有必要提一下，etcd是一个分布式协同数据库，基于Go语言开发，`CoreOS`公司出品，使用raft一致性算法协同。Kubernetes的主数据库，在安装kubernetes之前就要先安装它，很多开源下项目都用到，老版本的`docker swarm`也用到了它。目前主要使用的是`2.7.x`版本，`3.0+`版本的API变化太大。

### APIServer

APIServer负责对外提供kubernetes API服务，它运行在master节点上。任何对资源的增删改查都要交给APIServer处理后才能提交给etcd。APIServer总体上由两部分组成：HTTP/HTTPS服务和一些功能性插件。这些功能性插件又分为两种：一部分与底层IaaS平台（Cloud Provide）相关；另一部分与资源管理控制（Admission Control）相关。

### Scheduler

Scheduler的作用是**根据特定的调度算法将pod调度到node节点上**，这一过程也被称为绑定。Scheduler调度器的输入是待调度的pod和可用的工作节点列表，输出则是一个已经绑定了pod的节点，这个节点是通过调度算法在工作节点列表中选择的最优节点。

工作节点从哪里来？工作节点并不是由Kubernetes创建，它是由IaaS平台创建，或者就是由用户管理的物理机或者虚拟机。但是Kubernetes会创建一个Node对象，用来描述这个工作节点。描述的具体信息由创建Node对象的配置文件给出。一旦用户创建节点的请求被成功处理，Kubernetes又会立即在内部创建一个node对象，再去检查该节点的健康状况。只有那些当前可用的node才会被认为是一个有效的节点并允许pod调度到上面运行。       

工作节点可以通过资源配置文件或者kubectl命令行工具来创建。Kubernetes主要维护工作节点的两个属性：spec和status来描述一个工作节点的期望状态和当前状态。其中，所谓的当前状态信息由3个信息组成：`HostIp`、`NodePhase`和`Node Condition`。        

工作节点的动态维护过程依靠**Node Controller**来完成，它是`Kubernetes Controller Manager`下属的一个控制器。它会一直不断的检查Kubernetes已知的每台node节点是否正常工作，如果一个之前已经失败的节点在这个检查循环中被检查为可以工作的，那么Node Controller会把这个节点添加到工作节点中，Node Controller会从工作节点中删除这个节点。        

### Controller Manager

Controller Manager运行在集群的Master节点上，是基于pod API的一个独立服务，它**重点实现service Endpoint（服务端点）的动态更新**。管理着Kubernetes集群中各种控制节点，包括**replication Controller**和**node Controller**。        

**与APIServer相比，APIServer负责接受用户请求并创建对应的资源，而Controller Manager在系统中扮演的角色是在一旁旁默默的管控这些资源，确保他们永远保持在预期的状态**。它采用各种管理器定时的对pod、节点等资源进行预设的检查，然后判断出于预期的是否一致，若不一致，则通知APIServer采取行动，比如重启、迁移、删除等。

### kubelet

kubelet组件工作在Kubernetes的node上，**负责管理和维护在这台主机上运行着的所有容器**。 kubelet与cAdvisor交互来抓取docker容器和主机的资源信息。 kubelet垃圾回收机制，包括容器垃圾回收和镜像垃圾回收。 kubelet工作节点状态同步。

### kube-proxy

kube-proxy提供两种功能:

- 提供算法将客服端流量负载均衡到service对应的一组后端pod。
- 使用etcd的watch机制，实现服务发现功能，维护一张从service到endpoint的映射关系，从而保证后端pod的IP变化不会对访问者的访问造成影响。

