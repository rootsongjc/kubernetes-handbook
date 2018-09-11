---
date: "2017-08-15T22:58:37+08:00"
draft: false
description: "Cloud Native Python 中文版 - 使用python和react构建云原生应用"
title: "Cloud Native Python中文版（Python云原生）"
subtitle: "使用Python和React构建云原生应用"
categories: "cloud-native"
tags: ["cloud-native","book","python","microservices"]
bigimg: [{src: "https://ws1.sinaimg.cn/large/00704eQkly1fs4sw7kgs4j30mo0aj46b.jpg", desc: "北京大栅栏 Mar 13,2016"}]
postmeta: false
nocomment: true
---

继 [Cloud Native Go](https://rootsongjc.github.io/cloud-native-go/) 之后又一本关于 Cloud Native 的力作已经登上了我的写作日程，这次是基于 Python 构建微服务和云原生 Web 应用程序，书名叫作 Cloud Native Python。

下面是它的英文原版书（感谢电子工业出版社）跟它已出版的好兄弟 Cloud Native Go 在一起的合影。

![Cloud Native Python 和 Cloud Native Go 合影](https://ws1.sinaimg.cn/large/00704eQkly1fs4swoeyzxj334022o4qw.jpg)

这本书跟 Cloud Native Go 的内容由很大部分的重合，目录结构也基本一致，所用的技术栈也很类似，不过内容更详实，图片和步骤介绍更多一些，跟我看的另一本由印度人写的 [Kubernetes Management Design Patterns: With Docker, CoreOS Linux, and Other Platforms](https://jimmysong.io/talks/book-kubernetes-management-design-patterns/) 的风格很像。

## Cloud Native Python 介绍

随着当今商业的迅速发展，企业为了支撑自身的迅速扩张，仅仅通过自有的基础设施是远远不够的。因此，他们一直在追求利用云的弹性来构建支持高度可扩展应用程序的平台。

这本书能够帮助您一站式的了解使用Python构建云原生应用架构的所有信息。本书中我们首先向您介绍云原生应用架构和他们能够帮助您解决哪些问题。然后您将了解到如何使用REST API和Python构建微服务，通过事件驱动的方式构建Web层。接下来，您将了解到如何与数据服务进行交互，并使用React构建Web视图，之后我们将详细介绍应用程序的安全性和性能。然后，您还将了解到如何Docker容器化您的服务。最后，您将学习如何在AWS和Azure平台上部署您的应用程序。在您部署了应用程序后，我们将围绕关于应用程序故障排查的一系列概念和技术来结束这本书。

## 本书中涵盖哪些内容

- 第1章  介绍云原生应用架构和微服务，讨论云原生架构的基本概念和构建应用程序开发环境。
- 第2章  使用Python构建微服务，构建自己的微服务知识体系并根据您的用例进行扩展。
- 第3章  使用Python构建Web应用程序，构建一个初始的Web应用程序并与微服务集成。
- 第4章  与数据服务交互，教您如何将应用程序迁移到不同的数据库服务。
- 第5章  使用React构建Web视图。
- 第6章  使用Flux创建可扩展UI，帮助您理解如何使用Flux创建可扩展的应用程序。
- 第7章  事件溯源和CQRS，讨论如何以事件形式存储合约（transaction）。
- 第8章  保护Web应用程序，让您的应用程序免于受到外部威胁。
- 第9章  持续交付，应用程序频繁发布的相关知识。
- 第10章 Docker容器化您的服务，讨论容器服务和在Docker中运行应用程序。
- 第11章 将应用程序部署到AWS平台上，教您如何在AWS上构建基础设施并建立应用程序的生产环境。
- 第12章 将应用程序部署到Azure平台上，讨论如何在Azure上构建基础设施并建立应用程序的生产环境。
- 第13章 监控云应用，了解不同的基础设施和应用的监控工具。

## 使用本书您需要哪些工具和环境

您需要在系统上安装Python。一个文本编辑器，最好是Vim、Sublime或者Notepad++。在有一个章节中您需要下载POSTMAN，这是一个功能强大的API测试套件，可以作为作为Chrome扩展插件来安装。您可以从[这里下载](https://chrome.google.com/webstore/detail/postman/fhbjgbiflinjbdggehcddcbncdddomop?hl=en)。

除此之外，如果您还有如下网站的账号那就更好了：

-  Jenkins
-  Docker
-  Amazon Web Services
-  Terraform

## 目标读者

本书适用于具有Python基础知识、熟悉命令行和基于HTTP的应用程序基本原理的开发人员。对于那些想要了解如何构建、测试和扩展Python开发的应用程序的人员来说本书是个理想选择。不需要有使用Python构建微服务的经验。

## 更多资料

- 关于 Cloud Native Go 的更多信息请参阅：[Cloud Native Go - 基于Go和React的Web云服务构建指南](https://jimmysong.io/posts/cloud-native-go/)
- 关于云原生（Cloud Native）的更多资料请参考我翻译的这本 Pivotal 的小册子 [迁移到云原生应用架构-中文版](https://jimmysong.io/migrating-to-cloud-native-application-architectures)
- 关于 Cloud Native 生态请参考我整理的 [awesome-cloud-native](https://jimmysong.io/awesome-cloud-native)

## 翻译日志

- 2017-08-15 完成了序言的翻译
- 2017-10-19 完成了第一章云原生应用与微服务的翻译
- 2017-10-23 完成了整本书的markdown文档化并使用gitbook管理，同时备份到gitee
- 2017-10-26 完成了第二章的翻译，使用Python构建微服务
- 2017-10-27 完成了第三章的翻译，使用Python构建Web UI
- 2017-10-30 完成了第四章的翻译，与数据服务交互
- 2017-10-31 完成了第五章的翻译，使用React构建Web视图
- 2017-11-02 完成了第六章的翻译，使用Flux构建可扩展UI
- 2017-11-22 完成了第十一章的翻译，部署到AWS云平台
- 2017-12-18 完成了第十二章的翻译，部署到微软Azure云平台
- 2018-01-06 完成了第十章的翻译，应用容器化
- 2018-01-06 完成了第十三章的翻译，监控云应用
- 2018-01-09 完成了第九章的翻译，持续交付
- 2018-01-14 完成了第七章的翻译，事件溯源与CQRS
- 2018-01-14 完成了第八章的翻译，Web应用的安全性

---

致此全书第一遍完整翻译完成，接下来就是要等待编辑的修改后我再对文章进行修正。

![Cloud Native Python 云原生 Python(宋净超 译)](https://ws1.sinaimg.cn/large/00704eQkgy1fruogrylm6j30gf0lkjxn.jpg)

本书已于 2018 年 6 月由**电子工业出版社**出版。[购买链接](http://item.jd.com/12365097.html)

扫码购买

![Cloud Native Python 云原生](https://ws2.sinaimg.cn/large/0069RVTdgy1fv5vhe3vkvj307s07sdfq.jpg)