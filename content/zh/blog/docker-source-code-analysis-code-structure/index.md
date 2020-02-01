---
date: "2017-03-19T23:00:29+08:00"
title: "Docker源码分析第一篇——代码结构"
description: "之前陆陆续续看过一点docker的源码，都未成体系，最近在研究Docker-17.03-CE，趁此机会研究下docker的源码。"
draft: false
categories: ["容器"]
tags: ["docker"]
type: "post"
bg_image: "images/backgrounds/page-title.jpg"
aliases: "/posts/docker-source-code-analysis-code-structure"
image: "images/banner/docker-logo.jpg"
---

## 前言

之前陆陆续续看过一点**docker**的源码，都未成体系，最近在研究**Docker-17.03-CE**，趁此机会研究下docker的源码，在网上找到一些相关资料，都比较过时了，发现**孙宏亮**写过一本书叫《Docker源码分析》，而且之前也在**InfoQ**上陆续发过一些文章，虽然文章都比较老了，基于老的docker版本，但我认为依然有阅读的价值。起码能有这三方面收获：

- 一是培养阅读源码的思维方式，为自己阅读docker源码提供借鉴。
- 二是可以了解docker版本的来龙去脉。
- 三还可以作为Go语言项目开发作为借鉴。

### 下载地址

鉴于截止本文发稿时这本书已经发行一年半了了，基于的docker版本还是**1.2.0**，而如今都到了**1.13.0**（docker17.03的老版本号），应该很少有人买了吧，可以说这本书的纸质版本的生命周期也差不多了吧。如果有人感兴趣可以到网上找找看看，Docker源码解析-机械工业出版社-孙宏亮著-2015年8月（完整文字版，大小25.86M），Docker源码解析-看云整理版（文字版，有缩略，大小7.62M）。

## Out-of-date

有一点必须再次强调一下，这本书中的docker源码分析是基于**docker1.2.0**，而这个版本的docker源码在github上已经无法下载到了，github上available的最低版本的docker源码是**1.4.1**。

> 顺便感叹一句，科技行业发展实在太快了，尤其是互联网，一本书能连续用上三年都不过时，如果这样的话那么这门技术恐怕都就要被淘汰了吧？

## 总体架构

Docker总体上是用的是**Client/Server**模式，所有的命令都可以通过RESTful接口传递。

整个Docker软件的架构中可以分成三个角色：

- **Daemon**：常驻后台运行的进程，接收客户端请求，管理docker容器。
- **Clien**t：命令行终端，包装命令发送API请求。
- **Engine**：真正处理客户端请求的后端程序。

## 代码结构

Docker的代码结构比较清晰，分成的目录比较多，有以下这些：

- **api**：定义API，使用了**Swagger2.0**这个工具来生成API，配置文件在`api/swagger.yaml`
- **builder**：用来build docker镜像的包，看来历史比较悠久了
- **bundles**：这个包是在进行[docker源码编译和开发环境搭建](https://jimmysong.io/posts/docker-dev-env/)的时候用到的，编译生成的二进制文件都在这里。
- **cli**：使用[cobra](http://www.github.com/spf13/cobra)工具生成的docker客户端命令行解析器。
- **client**：接收`cli`的请求，调用RESTful API中的接口，向server端发送http请求。
- **cmd**：其中包括`docker`和`dockerd`两个包，他们分别包含了客户端和服务端的main函数入口。
- **container**：容器的配置管理，对不同的platform适配。
- **contrib**：这个目录包括一些有用的脚本、镜像和其他非docker core中的部分。
- **daemon**：这个包中将docker deamon运行时状态expose出来。
- **distribution**：负责docker镜像的pull、push和镜像仓库的维护。
- **dockerversion**：编译的时候自动生成的。
- **docs**：文档。这个目录已经不再维护，文档在[另一个仓库里](https://github.com/docker/docker.github.io/)。
- **experimental**：从docker1.13.0版本起开始增加了实验特性。
- **hack**：创建docker开发环境和编译打包时用到的脚本和配置文件。
- **image**：用于构建docker镜像的。
- **integration-cli**：集成测试
- **layer**：管理 union file system driver上的read-only和read-write mounts。
- **libcontainerd**：访问内核中的容器系统调用。
- **man**：生成man pages。
- **migrate**：将老版本的graph目录转换成新的metadata。
- **oci**：Open Container Interface库
- **opts**：命令行的选项库。
- **pkg**：
- **plugin**：docker插件后端实现包。
- **profiles**：里面有apparmor和seccomp两个目录。用于内核访问控制。
- **project**：项目管理的一些说明文档。
- **reference**：处理docker store中镜像的reference。
- **registry**：docker registry的实现。
- **restartmanager**：处理重启后的动作。
- **runconfig**：配置格式解码和校验。
- **vendor**：各种依赖包。
- **volume**：docker volume的实现。

下一篇将讲解docker的各个功能模块和原理。
