---
title: "每位CTO都该知道的关于Kubernetes的三件事"
date: 2017-09-10T16:43:27+08:00
draft: false
categories: ["kubernetes"]
bg_image: "images/backgrounds/page-title.jpg"
description: "事前须知。"
type: "post"
image: "images/banner/kubernetes.jpg"
aliaes: "/posts/3-things-every-cto-should-know-about-kubernetes"
---

Kubernetes 是一个自动发布、扩缩容和管理容器化应用的开源软件。

尽管kubernetes非常强大，有如此多有用的技术特性，但是工具从来都不会被隔离起来单独使用，这要取决与底层基础架构，使用它的团队等等。

在将kubernetes应用到生产环境（如果想成功的引入生产的话）之前，每个CTO都应该了解这三件事。

### 1. 你需要有坚实的基础设施

大多数组织在运行kubernetes时遇到的第一个问题是在其下运行的平台。无论是基于VMware的私有云还是像AWS这样的公共云，您的平台需要稳定运行一段时间，并且具备以下基础设施基础知识：

- 配置：根据需要创建虚拟机，或者直接使用裸机
- 网络：DNS、负载均衡、VPC/VLAN、防火墙、安全组等
- 存储：NFS/EFS/EBS/Ceph等，通过API创建

如果这些基础设施建设不到位，那么在尝试部署和运行kubernetes群集时，您将会遇到许多问题。

根据经验，我们通常向客户推荐从像AWS这样的公共云提供商开始，然后配备了一些Hashicorp工具，如Terraform和Packer，以实现坚实的基础设施。

### 2. 您需要打造一支强大的团队

让企业内部实现容器编排的能力很一个很有挑战的事情。

打造是一个全面的团队，包括一些具有非常强大的Ops背景的成员，可以让他们去调试一些底层的东西，还有一些自动化工程师将负责设置和集群管理的日常工作，更多的研究人员将确保CI/CD流水线顺利运行以保证开发人员有一个很好的体验。

下面是构建团队的几个建议：

1. 找到已经在尝试使用容器的团队，也许他们以前用过Docker Swarm或Rancher。他们可能已经渴望使用Kubernetes，并且愿意努力实施。
2. 给您的开发和运维团队做关于容器和容器编排方面的培训。
3. 聘请新人才。有时候，您可能会发现，最好的选择是建立一个全新的团队，这样他们就不会被当前流程所淹没，还可以向其他团队展示未来的样子。

### 3. 依托社区

Kubernetes能够坐上了容器编排系统的头把交椅的主要原因是社区的支持。

Kubernetes最初是基于Google的borg，borg具有非常丰富的功能集，现在已经是一个成熟的框架——这对kubernetes来说是非常有利的 ，但其成功的主要原因是已经形成了积极支持它的社区。

下面是一些关于如何参与社区的小贴士：

- 加入kubernetes slack channel，现在里面已经有21,000人，http://slack.k8s.io
- 参与一个SIG（特别兴趣小组），这里面包括从在AWS上运行kubernetes到管理大数据集群。
- [参加meetup](https://www.meetup.com/topics/kubernetes/)
- [关注#kubernetes](https://twitter.com/hashtag/kubernetes) 关注那些主流传道者，有个人要特别关注下那就是[Kelsey Hightower](https://twitter.com/kelseyhightower)

### 走向成功

在拥有了坚如磐石的平台，熟练和多样化的团队，以及与Kubernetes社区不断增长的关系后，您将有处理通向成功道路上的遇到的任何问题的资本，克服成长过程中的痛苦。

[原文地址](https://www.contino.io/insights/3-things-every-cto-should-know-about-kubernets)

作者: Marcus Maxwell
