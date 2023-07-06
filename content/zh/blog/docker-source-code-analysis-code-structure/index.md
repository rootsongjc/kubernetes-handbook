---
date: "2017-03-19T23:00:29+08:00"
title: "Docker 源码分析第一篇——代码结构"
description: "之前陆陆续续看过一点 docker 的源码，都未成体系，最近在研究 Docker-17.03-CE，趁此机会研究下 docker 的源码。"
draft: false
categories: ["容器"]
tags: ["docker"]
type: "post"
bg_image: "images/backgrounds/page-title.jpg"
aliases: "/posts/docker-source-code-analysis-code-structure"
image: "images/banner/docker-logo.jpg"
---

## 前言

之前陆陆续续看过一点**docker**的源码，都未成体系，最近在研究**Docker-17.03-CE**，趁此机会研究下 docker 的源码，在网上找到一些相关资料，都比较过时了，发现**孙宏亮**写过一本书叫《Docker 源码分析》，而且之前也在**InfoQ**上陆续发过一些文章，虽然文章都比较老了，基于老的 docker 版本，但我认为依然有阅读的价值。起码能有这三方面收获：

- 一是培养阅读源码的思维方式，为自己阅读 docker 源码提供借鉴。
- 二是可以了解 docker 版本的来龙去脉。
- 三还可以作为 Go 语言项目开发作为借鉴。

### 下载地址

鉴于截止本文发稿时这本书已经发行一年半了了，基于的 docker 版本还是**1.2.0**，而如今都到了**1.13.0**（docker17.03 的老版本号），应该很少有人买了吧，可以说这本书的纸质版本的生命周期也差不多了吧。如果有人感兴趣可以到网上找找看看，Docker 源码解析 - 机械工业出版社 - 孙宏亮著 -2015 年 8 月（完整文字版，大小 25.86M），Docker 源码解析 - 看云整理版（文字版，有缩略，大小 7.62M）。

## Out-of-date

有一点必须再次强调一下，这本书中的 docker 源码分析是基于**docker1.2.0**，而这个版本的 docker 源码在 github 上已经无法下载到了，github 上 available 的最低版本的 docker 源码是**1.4.1**。

> 顺便感叹一句，科技行业发展实在太快了，尤其是互联网，一本书能连续用上三年都不过时，如果这样的话那么这门技术恐怕都就要被淘汰了吧？

## 总体架构

Docker 总体上是用的是**Client/Server**模式，所有的命令都可以通过 RESTful 接口传递。

整个 Docker 软件的架构中可以分成三个角色：

- **Daemon**：常驻后台运行的进程，接收客户端请求，管理 docker 容器。
- **Clien**t：命令行终端，包装命令发送 API 请求。
- **Engine**：真正处理客户端请求的后端程序。

## 代码结构

Docker 的代码结构比较清晰，分成的目录比较多，有以下这些：

- **api**：定义 API，使用了**Swagger2.0**这个工具来生成 API，配置文件在`api/swagger.yaml`
- **builder**：用来 build docker 镜像的包，看来历史比较悠久了
- **bundles**：这个包是在进行[docker 源码编译和开发环境搭建](https://jimmysong.io/posts/docker-dev-env/)的时候用到的，编译生成的二进制文件都在这里。
- **cli**：使用[cobra](http://www.github.com/spf13/cobra)工具生成的 docker 客户端命令行解析器。
- **client**：接收`cli`的请求，调用 RESTful API 中的接口，向 server 端发送 http 请求。
- **cmd**：其中包括`docker`和`dockerd`两个包，他们分别包含了客户端和服务端的 main 函数入口。
- **container**：容器的配置管理，对不同的 platform 适配。
- **contrib**：这个目录包括一些有用的脚本、镜像和其他非 docker core 中的部分。
- **daemon**：这个包中将 docker deamon 运行时状态 expose 出来。
- **distribution**：负责 docker 镜像的 pull、push 和镜像仓库的维护。
- **dockerversion**：编译的时候自动生成的。
- **docs**：文档。这个目录已经不再维护，文档在[另一个仓库里](https://github.com/docker/docker.github.io/)。
- **experimental**：从 docker1.13.0 版本起开始增加了实验特性。
- **hack**：创建 docker 开发环境和编译打包时用到的脚本和配置文件。
- **image**：用于构建 docker 镜像的。
- **integration-cli**：集成测试
- **layer**：管理 union file system driver 上的 read-only 和 read-write mounts。
- **libcontainerd**：访问内核中的容器系统调用。
- **man**：生成 man pages。
- **migrate**：将老版本的 graph 目录转换成新的 metadata。
- **oci**：Open Container Interface 库
- **opts**：命令行的选项库。
- **pkg**：
- **plugin**：docker 插件后端实现包。
- **profiles**：里面有 apparmor 和 seccomp 两个目录。用于内核访问控制。
- **project**：项目管理的一些说明文档。
- **reference**：处理 docker store 中镜像的 reference。
- **registry**：docker registry 的实现。
- **restartmanager**：处理重启后的动作。
- **runconfig**：配置格式解码和校验。
- **vendor**：各种依赖包。
- **volume**：docker volume 的实现。

下一篇将讲解 docker 的各个功能模块和原理。
