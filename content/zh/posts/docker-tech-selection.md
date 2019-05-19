---
date: "2017-03-08T10:37:01+08:00"
title: "Docker技术选型"
description: "本文讲述如何做 Docker 的技术选型。"
draft: false
categories: "docker"
tags: ["docker"]
bigimg: [{src: "/img/banners/006tNc79ly1g22ijkeepuj31bu0oib29.jpg", desc: "Photo via Unsplash"}]
---

## 回顾历史

> *多少次我回过头看看走过的路，你还在小村旁。*

去年基于docker1.11对Hadoop yarn进行了docker化改造，详情请看[大数据集群虚拟化-Yarn on docker始末](https://rootsongjc.github.io/docker-practice/docs/td_yarn_on_docker.html)，我将这个事件命名为[magpie](https://github.com/rootsongjc/magpie)，因为它就像是喜鹊一样收集着各种各样的资源搭建自己的小窝。**magpie**还是有很多事情可以做的，大数据集群的虚拟化也不会止步，它仅仅是对其做了初步的探索，对于资源利用率和管理方面的优化还有很长的路要走，**Yarn**本身就是做为大数据集群的资源管理调度角色出现的，一开始是为调度**MapReduce**，后来的spark、hive、tensrflow、slide等等不一而足陆续出现。但是用它来管理docker似乎还是有点过重，还不如用kubernetes、marathon、nomad、swarm等。

但是在微服务方面docker1.11的很多弊端或者说缺点就暴露了出来，首先docker1.11原生并不带cluster管理，需要配合docker swarm、kubernetes、marathon等才能管理docker集群。<u>之前的对于docker的使用方式基本就是按照虚拟机的方式使用的，固定IP有悖于微服务的原则。</u>

我们基于docker1.11和[shrike](github.com/talkingdata/shrike)二层网络模式，还有[shipyard](https://github.com/shipyard/shipyard)来做集群管理，shipyard只是一个简单的docker集群管理的WebUI，基本都是调用docker API，唯一做了一点docker原生没有的功能就是**scale**容器，而且只支持到docker1.11，早已停止开发。我抛弃了**shipyard**，它的页面功能基本可有可无，我自己开发的[magpie](https://github.com/rootsongjc/magpie)一样可以管理``yarn on docker``集群。

**Docker Swarm有如下几个缺点**

1. 对于大规模集群的管理效率太低，当管理上百个node的时候经常出现有节点状态不同步的问题，比如主机重启后容器已经**Exited**了，但是master让然认为是**Running**状态，必须重启所有master节点才行。
2. 没有中心化Node管理功能，必须登录到每台node上手动启停``swarm-agent``。
3. 集群管理功能实在**太太太**简陋，查看所有node状态只能用``docker info``而且那个格式就不提了，shipyard里有处理这个格式的代码，我copy到了magpie里，彻底抛弃shipyard了。
4. Docker swarm的集群管理概念缺失，因为docker一开始设计的时候就不是用来管理集群的，所以出现了swarm，但是只能使用**docker-compose**来编排服务，但是无法在swarm集群中使用我们自定义的**mynet**网络，[compose issue-4233](https://github.com/docker/compose/issues/4233)，**compose**也已经被docker官方废弃（最近一年docker发展的太快了，原来用python写的compose已经被用go重构为**libcompose**直接集成到swarm mode里了），而且docker1.11里也没有像kubernetes那样``service``的单位，在docker1.11所有的管理都是基于docker容器的。

Docker Swarm的问题也是shipyard的问题，谁让shipyard直接调用docker的API呢。当然，在后续版本的docker里以上问题都已经不是问题，docker已经越来越像kubernetes，不论是在设计理念上还是在功能上，甚至还发行了企业版，以后每个月发布一个版本。

## 技术选型

主要对比``Docker1.11``和``Docker17.03-ce``版本。

首先有一点需要了解的是，docker1.12+带来的[swarm mode](https://rootsongjc.github.io/docker-practice/docs/swarm_mode.html)，你可以使用一个命令直接启动一个复杂的**stack**，其中包括了服务编排和所有的服务配置，这是一个[投票应用的例子](https://rootsongjc.github.io/docker-practice/docs/create_swarm_app.html)。

下表对比了docker1.11和docker17.03-ce

| 版本   | docker1.11                      | docker17.03-ce                           |
| ---- | ------------------------------- | ---------------------------------------- |
| 基本单位 | docker容器                        | docker容器、service、stack                   |
| 服务编排 | compose，不支持docker swarm的mynet网络 | 改造后的compose，支持stack中完整的服务编排              |
| 网络模型 | Host、bridge、overlay、mynet       | 默认支持跨主机的overlay网络，创建单个容器时也可以attach到已有的overla网络中 |
| 插件   | 没有插件管理命令，但是可以手动创建和管理            | 有插件管理命令，可以手动创建和从docker hub中下载，上传插件到自己的私有镜像仓库 |
| 升级   | 不支持平滑升级，重启docker原来的容器也会停掉       | 可以停止docker engine但不影响已启动的容器              |
| 弹性伸缩 | 不支持                             | service内置功能                              |
| 服务发现 | 监听docker event增删DNS             | 内置服务发现，根据DNS负载均衡                         |
| 节点管理 | 手动启停                            | 中心化管理node节点                              |
| 服务升级 | 手动升级                            | service内置功能                              |
| 负载均衡 | 本身不支持                           | Swarm mode内部DNS轮寻                        |

基于以上对比，使用docker17.03-ce不仅可以兼容以前的mynet网络模式，只需要重构以前的shrike为**docker plugin**，在创建service的时候指定为mynet即可。也可以同时使用docker mode的overlay网络，而且还可以安装其它docker plugin首先更高级网络和volume功能。

Docker17.03-ce借鉴了很多kubernetes的设计理念，docker发力企业级市场，相信新版的才符合微服务的方向，既能兼容以前的**虚拟机式**的使用模式，也能兼容**微服务**架构。

## 下一步

之前考虑过使用docker1.11 + compose + shipyard + eureka + nginx等做微服务架构，但是考虑到最新版docker的重大升级，从长远的眼光来看，不能一直限定于之前的那一套，我更倾向于新版本。

- 调研Docker17.03-ce的新特性，尤其是服务治理方面
- 结合具体业务试用
- 重构shrike为docker plugin

> *Don't speak, I'll try to save us from ourselves*

>*If were going down, we're going down in flames*
