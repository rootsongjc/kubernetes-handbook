---
title: "Kubernetes Handbook v1.4发布同时后Kubernetes时代大幕拉启"
subtitle: "这是一篇后Kubernetes时代的檄文"
date: 2018-09-04T10:23:23+08:00
bigimg: [{src: "/img/banners/006tNbRwgy1fuxayjq7oej30n30ammzp.jpg", desc: "Breaking Chains|Beijing|Sept 4,2018"}]
draft: false
notoc: true
description: "这是一篇后Kubernetes时代的檄文，Kubernetes handbook by Jimmy Song v1.4发布，云原生的下一个重心是Service Mesh！"
tags: ["kubernetes","service mesh"]
categories: ["kubernetes"]
---

这是一篇后**Kubernetes**时代的檄文。就在今天傍晚我看到了一篇 Bilgin Ibryam的文章 *[Microservices in a Post-Kuberentes Era](https://www.infoq.com/articles/microservices-post-kubernetes)* 有感而发。

2017年4月9日，[Kubernetes Handbook - Kubernetes中文指南/云原生应用架构实践手册](https://github.com/rootsongjc/kubernetes-handbook)第一次提交。在过去的16个月的时间里，有53位贡献者参与，1088次commit，共写了23,9014个汉字，同时在**Kubernetes&Cloud Native实战群**里也聚集了几千名爱好者。

![Kubernetes handbook by Jimmy Song 贡献者](https://ws4.sinaimg.cn/large/006tNbRwly1fuxb4kaa7jj315o0g2di3.jpg)

![Kuberentes handbook Github 宋净超 Jimmy Song](https://ws1.sinaimg.cn/large/006tNbRwly1fuxassrncej31ec0n0acc.jpg)

距离上一版本发布已经有4个多月的时间了，在此期间[Kubernetes](https://kubernetes.io/)和[Prometheus](https://prometheus.io/)分别从CNCF中毕业，已经在商业上成熟，这两个项目基本成型，未来也不会有太大的变动。而当初为容器编排而开发，为了解决微服务部署问题的Kubernetes已经深入人心，目前的微服务已经逐步进入**后Kubernetes时代**，Service Mesh和云原生重新定义微服务和分布式应用。

本版本发布时PDF大小为108M，共239,014个汉字，建议[在线浏览](https://jimmysong.io/kubernetes-handbook/)，或克隆本项目安装Gitbook命令后自行编译。

本版本主要有以下改进：

- 增加了[Istio Service Mesh教程](https://jimmysong.io/kubernetes-handbook/usecases/istio-tutorial.html)
- 增加了
  [使用Vagrant和VirtualBox在本地搭建分布式Kubernetes集群和Istio Service Mesh](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster/blob/master/README-cn.md)
- 增加了对云原生编程语言[Ballerina](https://jimmysong.io/kubernetes-handbook/cloud-native/cloud-native-programming-language-ballerina.html)和[Pulumi](https://jimmysong.io/kubernetes-handbook/cloud-native/cloud-native-programming-language-pulumi.html)的介绍
- 增加了[快速开始指南](https://jimmysong.io/kubernetes-handbook/cloud-native/cloud-native-local-quick-start.html)
- 增加了对Kubernetes 1.11的支持
- 增加了[企业级Service Mesh采用路径指南](https://jimmysong.io/kubernetes-handbook/usecases/the-enterprise-path-to-service-mesh-architectures.html)
- 增加了[SOFAMesh章节](https://jimmysong.io/kubernetes-handbook/usecases/sofamesh.html)
- 增加了对[云原生未来的展望](https://jimmysong.io/kubernetes-handbook/cloud-native/the-future-of-cloud-native.html)
- 增加了[CNCF章程](https://jimmysong.io/kubernetes-handbook/cloud-native/cncf-charter.html)和参与事项
- 增加了Docker镜像仓库的注意事项
- 增加了[Envoy章节](https://jimmysong.io/kubernetes-handbook/usecases/envoy.html)
- 增加了[KCSP（Kubernetes认证服务提供商）](https://jimmysong.io/kubernetes-handbook/appendix/about-kcsp.html)和[CKA（认证Kubernetes管理员）](https://jimmysong.io/kubernetes-handbook/appendix/about-cka-candidate.html)相关说明
- 更新了一些配置文件、YAML和参考链接
- 更新了[CRI章节](https://jimmysong.io/kubernetes-handbook/concepts/cri.html)
- 删除了过时的描述
- 改进了etcdctl的命令使用教程
- 修复了一些笔误

## 浏览与下载

- 在线浏览 <https://jimmysong.io/kubernetes-handbook>

- 为了方便大家下载，我放了一份在[微云](https://share.weiyun.com/5YbhTIG)上，提供PDF（108MB）、MOBI（42MB）、EPUB（53MB）格式下载。

本书中更多的是实践教程，为了大家更好的理解 Kubernetes 原理，我推荐学习**[深入剖析Kubernetes by 张磊，极客时间出品](https://jimmysong.io/posts/kubernetes-tutorial-recommendation/)**。

感谢 Kubernetes 热心用户对本书的支持，感谢各位[Contributors](https://github.com/rootsongjc/kubernetes-handbook/graphs/contributors)，在该版本发布之前的几个月内又合作成立了[ServiceMesher社区](http://www.servicemesher.com/)，作为**后Kubernetes时代**的一支生力军，欢迎[联系我](http://www.servicemesher.com/contact)加入社区，共同开创**云原生新时代**。

![Service Mesh社区](https://ws3.sinaimg.cn/large/006tNbRwly1fuxavgzshwj315o0dw40m.jpg)

目前**ServiceMesher社区**微信群也有几千名成员，Kubernete Handbook仍然会继续下去，但是Service Mesh已然是一颗冉冉上升的新星，在对Kubernetes已了然于胸的情况下，欢迎加入ServiceMesher社区，和关注我们社区的公众号（也是我管理的😄）。

<p align="center">
  <img src="https://ws1.sinaimg.cn/large/00704eQkgy1fshv989hhqj309k09k0t6.jpg" alt="ServiceMesher微信公众号二维码"/>
</p>
