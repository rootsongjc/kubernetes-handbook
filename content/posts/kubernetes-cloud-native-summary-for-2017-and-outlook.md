---
title: "Kubernetes与云原生2017年年终总结及2018年展望"
date: 2017-12-26T16:26:28+08:00
subtitle: "Kubernetes - beyond containers, the future of Cloud Native"
tags: ["kubernetes","cloud-native"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20171222038.jpg", desc: "云冈石窟@山西大同 Dec 22,2017"}]
categories: "cloud-native"
draft: false
---

本文主要关于Kubernetes及云原生生态圈在2017年取得的进展，及对2018年的展望。

## Kubernetes

谈到[Kuberentes](https://kubernetes.io)就不得不谈到容器，容器从几年前的大热到现在的归于平淡，之前大家说容器通常是指Docker容器，甚至很多人就将容器等同于Docker，还有很多人像操作虚拟机一样得使用容器。Kubernetes是谷歌根据其内部使用的Borg改造成一个通用的容器编排调度器，于2014年将其发布到开源社区，并于2015年将其捐赠给Linux基金会的下属的[云原生计算基金会（CNCF）](https://cncf.io)，也是GIFEE（Google Infrastructure For Everyone Else）中的一员，其他还包括HDFS、Hbase、Zookeeper等，见<https://github.com/GIFEE/GIFEE>。

相信凡是关注容器生态圈的人都不会否认，Kubernetes已经成为容器编排调度的实际标准，不论Docker官方还是Mesos都已经支持Kubernetes，Docker公司在今年10月16日至19日举办的DockerCon EU 2017大会上宣布支持Kubernetes调度，就在这不久前Mesos的商业化公司Mesosphere的CTO Tobi Knaup也在官方博客中宣布[Kubernetes on DC/OS](kubectl get --raw=apis/|python -m json.tool)。而回想下2016年时，我们还在为Swarm、Mesos、Kubernetes谁能够在容器编排调度大战中胜出而猜测时，而经过不到一年的发展，Kubernetes就以超过70%的市场占有率（据[TheNewStack](https://www.thenewstack.io)的调研报告）将另外两者遥遥的甩在了身后，其已经在大量的企业中落地，还有一些重量级的客户也宣布将服务迁移到Kubernetes上，比如GitHub（见[Kubernetes at GitHub](https://githubengineering.com/kubernetes-at-github/)），还有eBay、彭博社等。

Kubernetes的架构做的足够开放，通过系列的接口，如CRI（Container Runtime Interface）作为Kubelet与容器之间的通信接口、CNI（Container Networking Interface)来管理网络、而持久化存储通过各种Volume Plugin来实现，同时Kubernetes的API本身也可以通过CRD（Custom Resource Define）来扩展，还可以自己编写[Operator](https://coreos.com/operators/)和[Service Catalog](https://github.com/kubernetes-incubator/service-catalog)来基于Kubernetes实现更高级和复杂的功能。

## Cloud Native

云已经可以为我们提供稳定可以唾手可得的基础设施，但是业务上云成了一个难题，Kubernetes的出现与其说是从最初的容器编排解决方案，倒不如说是为了解决应用上云（即云原生应用）这个难题。[CNCF](https://cncf.io)中的托管的一系列项目即致力于云原生应用整个生命周期的管理，从部署平台、日志收集、Service Mesh（服务网格）、服务发现、分布式追踪、监控以及安全等各个领域通过开源的软件为我们提供一揽子解决方案。

### 容器是云原生的基石

容器最初是通过开发者工具而流行，可以使用它来做隔离的开发测试环境和持续集成环境，这些都是因为容器轻量级，易于配置和使用带来的优势，docker和docker-compose这样的工具极大的方便的了应用开发环境的搭建，同时基于容器的CI/CD工具如雨后春笋般出现。

隔离的环境、良好的可移植性、模块化的组件、易于扩展和轻量级的特性，使得容器成为云原生的基石。但是容器不光是docker一种，还有[cri-o](http://cri-o.io/)、[rkt](https://github.com/rkt/rkt)等支持OCI标准的容器，以及OpenStack基金会推出的兼容容器标准的号称是轻量级虚拟机的[Kata Containers](https://katacontainers.io/)，Kubernetes并不绑定到某一容器引擎，而是支持所有满足OCI运行时标准的容器。

### 下一代云计算标准

Google通过将云应用进行抽象简化出的Kubernetes中的各种概念对象，如Pod、Deployment、Job、StatefulSet等，形成了Cloud Native应用的通用的可移植的模型，Kubernetes作为云应用的部署标准，直接面向业务应用，将大大提高云应用的可移植性，解决云厂商锁定的问题，让云应用可以在夸云之间无缝迁移，甚至用来管理混合云，成为企业IT云平台的新标准。

## 现状及影响

Kubernetes既然是下一代云计算的标准，那么它当前的现状如何，距离全面落地还有存在什么问题？

### 当前存在的问题

如果Kubernetes被企业大量采用，将会是对企业IT价值的重塑，IT将是影响业务速度和健壮性的中流砥柱，但是对于Kubernetes真正落地还存在诸多问题：

- 部署和运维起来复杂，需要有经过专业的培训才能掌握；
- 企业的组织架构需要面向DevOps转型，很多问题不是技术上的，而是管理和心态上的；
- 对于服务级别尤其是微服务的治理不足，暂没有一套切实可行可落地的完整微服务治理方案；
- 对于上层应用的支持不够完善，需要编写配置大量的YAML文件，难于管理；
- 当前很多传统应用可能不适合迁移到Kuberentes，或者是成本太高，因此可以落地的项目不多影响推广；

以上这些问题是企业真正落地Kubernetes时将会遇到的比较棘手的问题，针对这些问题，Kubernetes社区早就心领神会有多个[SIG](https://github.com/kubernetes/kubernetes/wiki/Special-Interest-Groups-(SIGs))（Special Interest Group）专门负责不同领域的问题，而初创公司和云厂商们也在虎视眈眈觊觎这份大蛋糕。

### 日益强大的社区

Kubernetes已成为GitHub上参与和讨论人数最多的开源项目，在其官方Slack上有超过两万多名注册用户（其中包括中文用户频道**cn-users**），而整个Kubernetes中文用户群可达数千名之众。目前关于Kubernetes和云原生图书也已经琳琳总总，让人眼花缭乱，英文版的讲解Kubernetes的有：The Kubernetes Book、Kubernetes in Action、Kubernetes Microservices with Docker，关于云原生架构的Cloud Native Infrastructure: Patterns for Scalable Infrastructure and Applications in a Dynamic Environment等已发行和2018年即将发行的有十几本之多，同时还有关于云原生开发的书籍也鳞次栉比，如[Cloud Native Go](https://jimmysong.io/cloud-native-go)（这本书已经被翻译成中文，由电子工业出版社引进出版）、[Cloud Native Python](https://jimmysong.io/cloud-native-python)（已由电子工业出版社引进，预计2018年推出中文版），Cloud Native Java等。中文版的有：Kubernetes权威指南:从Docker到Kubernetes实践全接触，Java云原生（预计2018年出版），还有一系列开源的电子书和教程，比如我写的[kubernetes-handbook](https://jimmysong.io/kubernetes-handbook)，同时Kubernetes官方官网文档也即将推出完整的汉化版本，该项目目前还在进行中，见[kubernetes-docs-cn](https://github.com/kubernetes/kubernetes-docs-cn)。

另外，除了图书和官方Slack外，在中国还有很多厂商、社区、爱好者组织的meetup、微信群推广Kubernetes，同时吸引了大量的用户关注和使用Kubernetes。

### 厂商支持

国外的Google的GKE、微软的Azure ACS、AWS的[Fargate](https://aws.amazon.com/fargate/)和2018年即将推出的EKS、Rancher联合Ubuntu推出的RKE，国内的华为云、腾讯云、阿里云等都已推出了公有云上的Kuberentes服务，Kubernetes已经成为公有云的容器部署的标配，私有云领域也有众多厂商在做基于Kubernetes的PaaS平台。随着企业落地Kubernetes的日益增长，相关的人才缺口也将日益显现。CNCF又就此推出了CKA（Certified Kubernetes Administrator）和CKD（Certified Kubernetes Developer），假若在Kubernetes的生态构建与市场发展顺利的情况下，该证书将会展现其含金量。

## 2018年展望

2017年可以说是Cloud Native蓬勃发展和大发异彩之年，Kuberentes在这一年中连续发布了4个版本，从1.6到1.9，[Containerd](https://github.com/containerd/containerd)、[Fluentd](https://github.com/fluent/fluentd/)、[CoreDNS](https://github.com/coredns/coredns)、[Jeager](https://github.com/jaegertracing/jaeger)分别发布自己的1.0版本。

在今年12月的KubeCon&CloudNativeCon Austin会议上，已经为2018年的云原生生态圈的发展确定几大关键词：

- 服务网格（Service Mesh），在Kubernetes上践行微服务架构进行服务治理所必须的组件；
- 无服务器架构（Serverless），以FaaS为代表的无服务器架构将会流行开来；
- 加强数据服务承载能力，例如在Kubernetes上运行大数据应用；
- 简化应用部署与运维，当前的Helm做的还远远不够；

这些功能是Kubernetes生态已有但是亟待加强的功能，它们能够解决我们在上文中提到的当前生态中存在的问题。

2018年的IaaS的运营商将主要提供基础架构服务，如虚拟机、存储和数据库等传统的基础架构和服务，仍然会使用现有的工具如Chef、Terraform、Ansible等来管理；Kubernetes则可能直接运行在裸机上运行，结合CI/CD成为DevOps的得力工具，并成为高级开发人员的应用部署首选；Kubernetes也将成为PaaS层的重要组成部分，为开发者提供应用程序部署的简单方法，但是开发者可能不会直接与Kubernetes或者PaaS交互，实际的应用部署流程很可能落在自动化CI工具如Jenkins上。