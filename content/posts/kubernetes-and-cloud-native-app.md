---
title: "Kubernetes与云原生应用"
date: 2017-10-10T16:49:51+08:00
draft: true
tags: ["kubernetes","cloud-native"]
categories: "cloud-native"
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/banners/cloud-computing.jpg", desc: "Cloud Computing"}]
description: "从云计算和容器生态开始引出kubernetes和cloud native云原生的概念"
---

## 云计算介绍

云计算包含的内容十分繁杂，也有很多技术和公司牵强赴会说自己是云计算公司，说自己是做云的，实际上可能风马牛不相及。说白了，云计算就是一种配置资源的方式，根据方式的不同我们可以把云计算从宏观上分为以下三种类型：

- IaaS：这是为了想要建立自己的商业模式并进行自定义的客户，例如亚马逊的EC2、S3存储、Rackspace虚拟机等都是IaaS。
- PaaS：工具和服务的集合，对于想用它来构建自己的应用程序或者想快速得将应用程序部署到生产环境而不必关心底层硬件的用户和开发者来说是特别有用的，比如Cloud Foundry、Google App Engine、Heroku等。
- SaaS：终端用户可以直接使用的应用程序。这个就太多，我们生活中用到的很多软件都是SaaS服务，只要基于互联网来提供的服务基本都是SaaS服务，有的服务是免费的，比如Google Docs，还有更多的是根据我们购买的Plan和使用量付费，比如GitHub、各种云存储。

## 云原生概念

