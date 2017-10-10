---
draft: false
date: "2017-03-10T23:54:06+08:00"
title: "新浪微博开源的docker管理平台OpenDCP"
tags: ["docker"]
categories: "devops"
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/2016062561.jpg", desc: "青海湖 Jun 25,2016"}]
---

前几天看到微博开源的docker管理平台[opendcp](https://github.com/weibocom/opendcp)，今天抽空研究了一下。

OpenDCP是一个基于Docker的云资源管理与调度平台，集镜像仓库、多云支持、服务编排、服务发现等功能与一身，支持服务池的扩缩容，其技术体系源于微博用于支持节假日及热点峰值流量的弹性调度DCP系统。OpenDCP允许利用公有云服务器搭建起适应互联网应用的IT基础设置，并且将运维的工作量降到最低。

如果你clone这个项目的话你会觉得这个项目简直是**丧心病狂**😱，很多镜像的安装包都直接放在代码仓库里了，整个项目大小有130M。
