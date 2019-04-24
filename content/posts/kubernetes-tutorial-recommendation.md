---
title: "Kubernetes精品教程推荐——深入剖析Kubernetes"
subtitle: "by 张磊，极客时间出品"
date: 2018-08-31T20:59:34+08:00
bigimg: [{src: "/img/banners/006tNbRwgy1fut7l89g7kj30go09ft9j.jpg", desc: "Kubernetes|Beijing|Aug 31,2018"}]
draft: false
notoc: true
description: "本文推荐了张磊在极客时间上的Kubernetes课程。"
tags: ["cloud native","kubernetes"]
categories: ["kubernetes"]
---

我接触Kubernetes已经有快2年时间了，期间从零开始编写的了[Kubernetes Handbook——Kubernetes中文指南/云原生应用架构实践手册](https://github.com/rootsongjc/kubernetes-handbook)，对于很多人接触Kubernetes和云原生起到的启蒙作用，包括我翻译的这三本云原生书籍。

![Cloud Native 云原生应用架构，Cloud Native Go/Cloud Native Python/Cloud Native Java 云原生Java/Python云原生](https://ws1.sinaimg.cn/large/00704eQkgy1frnpjmx3lyj31bc12xe2v.jpg)

- [Cloud Native Go](https://jimmysong.io/posts/cloud-native-go/) - 基于Go和React的web云原生应用构建指南（Kevin Hoffman & Dan Nemeth著 宋净超 吴迎松 徐蓓 马超 译），电子工业出版社，2017年6月出版

- [Python云原生](https://jimmysong.io/posts/cloud-native-python/) - 使用Python和React构建云原生应用（Manish Sethi著，宋净超译），电子工业出版社，2018年6月出版
- [云原生Java](https://jimmysong.io/posts/cloud-native-java/) - Spring Boot、Spring Cloud与Cloud Foundry弹性系统设计（Josh Long & Kenny Bastani著，张若飞 宋净超译 ），电子工业出版社，2018年7月出版

![Kubernetes handbook 宋净超(Jimmy Song) Kubernetes中文指南/云原生应用架构时间手册](https://ws1.sinaimg.cn/large/006tNbRwly1fut6ptsa4wj31e01tkk33.jpg)

_Kubernetes中文指南/云原生应用架构实践手册 by [Jimmy Song](htts://jimmysong.io)_

[Kubernetes handbook](https://github.com/rootsongjc/kubernetes-handbook)自2017年4月开源以来收获的GitHub star数。

![Kubernetes handbook by Jimmy Song Stargazers over time](https://starcharts.herokuapp.com/rootsongjc/kubernetes-handbook.svg)

但因为个人精力有限势必无法对于Kuberentes和云原生的各个领域都研究的那么透彻。但是随着整个云原生生态的崛起，关于Kubernetes和Cloud Native的教程不断涌现，但是质量也参差不齐，今天给大家推荐的教程来自张磊，Kubernetes社区的一位资深成员和项目维护者。

## 关于云原生


云原生是随着云计算基础设施的成熟，微服务大行其道而发展起来的。云原生的基础是基础设施即代码和不可变基础设施，它将原先过程式的基础设施创建转换为显示声明的方式，再辅以敏捷开发和DevOps流程，可以极大程度上的提高研发效率。同时云原生也是一种文化或者说是潮流，它改变了原有的公司组织结构和分工，使得开发人员可以更大限度的掌握自己的服务，新一代的开发人员是云原生的一代，云原生将一切资源抽象为API，开发人员不需要再申请所谓的服务器，而是由云原生来统一提调配和管理。

云原生生态已基本确定以容器作为核心打包和运行时，Kubernetes则作为管理容器的编排系统，解决了应用程序的部署和交付服务之后，接下来随着微服务的增多服务之间的管理会愈发复杂，亟需一套为微服务的管理控制平面，用来协调服务之间的流量，处理服务的安全性问题，所以Service Mesh将是云原生的下一个重要方向，微服务的治理也是通过云原生的方式来构建，通过策略和可编程的方式来将服务治理功能抽象出来形成一套统一的API，为将来的更高层级的抽象serverless打下基础。

基于Kubernetes的日渐成熟，和对云原生未来的展望，见[云原生应用的下一站第四届南京全球技术周演讲文字版](https://jimmysong.io/posts/the-next-stage-of-cloud-native-apps/)，我将自己的全部精力投入到了Service Mesh领域，因此我合作成立了[ServiceMesher社区](http://www.servicemesher.com)和ServiceMesher微信公众号，着重参与[Isito](https://istio.io/zh/)社区，同时也作为[CNCF Ambassador](https://www.cncf.io/people/ambassadors/)肩负在中国推广云原生的责任，见[Cloud Native and me - the past, current and futureSince I became a CNCF Ambassador](https://jimmysong.io/posts/cloud-native-and-me-the-past-current-and-future/)。

![ServiceMesher Service Mesh ç±å¥½è](https://ws1.sinaimg.cn/large/00704eQkly1fswhfttyooj3076076q3r.jpg)

## 关于张磊

2012 年，他还在浙大读书的时候，就组建了一个云计算与 PaaS 基础设施相关的科研团队，从早期的 Cloud Foundry 社区开始，正式与容器结缘。

之后的几年，全职在Kubernetes和Kata Containers社区从事上游开发工作，先后发起了容器镜像亲密性调度、基于等价类的调度优化等多个核心特性，参与了容器运行时接口、安全容器沙盒等多个基础特性的设计和研发。还作为主要的研发人员和维护者之一，亲历了Serverless Container概念的诞生与崛起。

他还发起和组织撰写了《Docker容器与容器云》一书，受到了广大希望进阶容器技术的读者的好评。

2018年去西雅图的微软研究院（MSR）云计算与存储研究组，专门从事基于Kubernetes的深度学习基础设施相关的研究工作。

可以说，这 6 年里，张磊参与和亲历了容器技术从“初出茅庐”到“尘埃落定”的全过程。

## 极客时间专栏

通过学习该专栏，您将清楚容器背后的技术本质与设计思想，并结合着对核心特性的剖析与实践，加深对容器技术的理解。该专栏划分成了4大模块：

1. **“白话”容器技术基础**：用饶有趣味的解说，梳理容器技术生态的发展脉络，用最通俗易懂的语言描述容器底层技术的实现方式，让您知其然，并且知其所以然。
2. **Kubernetes 集群的搭建与实践**：Kubernetes集群号称“非常复杂”，但是如果明白了其中的架构和原理，选择了正确的工具和方法，它的搭建却也可以“一键安装”，它的应用部署也可以浅显易懂。
3. **容器编排与Kubernetes核心特性剖析**：这是专栏最主要的内容。“编排”永远都是容器云项目的灵魂所在，也是 Kubernetes 社区持久生命力的源泉。在这一模块，从分布式系统设计的视角出发，抽象和归纳出这些特性中体现出来的普遍方法，然后带着这些指导思想去逐一阐述Kubernetes项目关于编排、调度和作业管理的各项核心特性。
4. **Kubernetes 开源社区与生态**：“开源生态”永远都是容器技术和 Kubernetes 项目成功的关键。在这个模块，和您一起探讨容器社区现代开源软件工程指导下的技术演进之路，带你思考如何同团队一起平衡内外部需求，逐渐成为社区中不可或缺的一员。

本专栏最开始首先准备了4篇预习文章，详细地梳理了容器技术自兴起到现在的发展历程，同时也回答了“**Kubernetes 为什么会赢**”这个重要的问题，算是一份开学礼物。

![Kubernetes教程-极客时间](https://ws3.sinaimg.cn/large/006tNbRwly1fut6ju5i7uj30oe17gdlz.jpg)

_扫码可购买该专栏_

## 专栏目录

![深入剖析Kubernetes](https://ws2.sinaimg.cn/large/006tNbRwly1fut74e450aj30ku2uidsp.jpg)

学习Kubernetes将打开您的云原生应用架构的大门，下面是【云原生应用架构】的微信公众号，我将时不时发些云原生相关文章，欢迎大家关注。

![云原生应用架构微信公众号](https://ws1.sinaimg.cn/large/00704eQkgy1frnpro3wcjj3076076aar.jpg)
