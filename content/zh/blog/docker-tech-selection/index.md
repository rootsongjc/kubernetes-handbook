---
date: "2017-03-08T10:37:01+08:00"
title: "如何选择 Docker 版本？"
description: "本文讲述如何进行 Docker 的版本选择。"
draft: false
categories: ["容器"]
tags: ["docker"]
type: "post"
aliases: "/posts/docker-tech-selection"
image: "images/banner/docker-logo.jpg"
---

## 回顾历史

> *多少次我回过头看看走过的路，你还在小村旁。*

去年基于 docker1.11 对 Hadoop yarn 进行了 docker 化改造，我将这个项目命名为 [magpie](https://github.com/rootsongjc/magpie) ，因为它就像是喜鹊一样收集着各种各样的资源搭建自己的小窝。**magpie** 还是有很多事情可以做的，大数据集群的虚拟化也不会止步，它仅仅是对其做了初步的探索，对于资源利用率和管理方面的优化还有很长的路要走，**Yarn** 本身就是做为大数据集群的资源管理调度角色出现的，一开始是为调度 **MapReduce**，后来的 spark、hive、tensrflow、slide 等等不一而足陆续出现。但是用它来管理 docker 似乎还是有点过重，还不如用 kubernetes、marathon、nomad、swarm 等。

但是在微服务方面 docker1.11 的很多弊端或者说缺点就暴露了出来，首先 docker1.11 原生并不带 cluster 管理，需要配合 docker swarm、kubernetes、marathon 等才能管理 docker 集群。之前的对于 docker 的使用方式基本就是按照虚拟机的方式使用的，固定 IP 有悖于微服务的原则。

我们基于 docker1.11 和 [shrike](http://localhost:1313/blog/docker-tech-selection/github.com/talkingdata/shrike) 二层网络模式，还有 [shipyard](https://github.com/shipyard/shipyard) 来做集群管理，shipyard 只是一个简单的 docker 集群管理的 WebUI，基本都是调用 docker API，唯一做了一点 docker 原生没有的功能就是 **scale** 容器，而且只支持到 docker1.11，早已停止开发。我抛弃了 **shipyard**，它的页面功能基本可有可无，我自己开发的 [magpie](https://github.com/rootsongjc/magpie) 一样可以管理 `yarn on docker` 集群。

**Docker Swarm 有如下几个缺点**

1. 对于大规模集群的管理效率太低，当管理上百个 node 的时候经常出现有节点状态不同步的问题，比如主机重启后容器已经 **Exited** 了，但是 master 让然认为是 **Running** 状态，必须重启所有 master 节点才行。
2. 没有中心化 Node 管理功能，必须登录到每台 node 上手动启停 `swarm-agent`。
3. 集群管理功能实在**太太太**简陋，查看所有 node 状态只能用 `docker info` 而且那个格式就不提了，shipyard 里有处理这个格式的代码，我 copy 到了 magpie 里，彻底抛弃 shipyard 了。
4. Docker swarm 的集群管理概念缺失，因为 docker 一开始设计的时候就不是用来管理集群的，所以出现了 swarm，但是只能使用 **docker-compose** 来编排服务，但是无法在 swarm 集群中使用我们自定义的 **mynet** 网络，[compose issue-4233](https://github.com/docker/compose/issues/4233) ，**compose** 也已经被 docker 官方废弃（最近一年 docker 发展的太快了，原来用 python 写的 compose 已经被用 go 重构为 **libcompose** 直接集成到 swarm mode 里了），而且 docker1.11 里也没有像 kubernetes 那样 `service` 的单位，在 docker1.11 所有的管理都是基于 docker 容器的。

Docker Swarm 的问题也是 shipyard 的问题，谁让 shipyard 直接调用 docker 的 API 呢。当然，在后续版本的 docker 里以上问题都已经不是问题，docker 已经越来越像 kubernetes，不论是在设计理念上还是在功能上，甚至还发行了企业版，以后每个月发布一个版本。

## 技术选型

主要对比 `Docker1.11` 和 `Docker17.03-ce` 版本。

首先有一点需要了解的是，docker1.12 + 带来的 [swarm mode](https://rootsongjc.github.io/docker-practice/docs/swarm_mode.html) ，你可以使用一个命令直接启动一个复杂的 **stack** ，其中包括了服务编排和所有的服务配置，这是一个[投票应用的例子](https://rootsongjc.github.io/docker-practice/docs/create_swarm_app.html) 。

下表对比了 docker1.11 和 docker17.03-ce

| 版本     | docker1.11                                     | docker17.03-ce                                               |
| :------- | :--------------------------------------------- | :----------------------------------------------------------- |
| 基本单位 | docker 容器                                    | docker 容器、service、stack                                  |
| 服务编排 | compose，不支持 docker swarm 的 mynet 网络     | 改造后的 compose，支持 stack 中完整的服务编排                |
| 网络模型 | Host、bridge、overlay、mynet                   | 默认支持跨主机的 overlay 网络，创建单个容器时也可以 attach 到已有的 overla 网络中 |
| 插件     | 没有插件管理命令，但是可以手动创建和管理       | 有插件管理命令，可以手动创建和从 docker hub 中下载，上传插件到自己的私有镜像仓库 |
| 升级     | 不支持平滑升级，重启 docker 原来的容器也会停掉 | 可以停止 docker engine 但不影响已启动的容器                  |
| 弹性伸缩 | 不支持                                         | service 内置功能                                             |
| 服务发现 | 监听 docker event 增删 DNS                     | 内置服务发现，根据 DNS 负载均衡                              |
| 节点管理 | 手动启停                                       | 中心化管理 node 节点                                         |
| 服务升级 | 手动升级                                       | service 内置功能                                             |
| 负载均衡 | 本身不支持                                     | Swarm mode 内部 DNS 轮寻                                     |

基于以上对比，使用 docker17.03-ce 不仅可以兼容以前的 mynet 网络模式，只需要重构以前的 shrike 为 **docker plugin**，在创建 service 的时候指定为 mynet 即可。也可以同时使用 docker mode 的 overlay 网络，而且还可以安装其它 docker plugin 首先更高级网络和 volume 功能。

Docker17.03-ce 借鉴了很多 kubernetes 的设计理念，docker 发力企业级市场，相信新版的才符合微服务的方向，既能兼容以前的**虚拟机式**的使用模式，也能兼容**微服务**架构。

## 下一步

之前考虑过使用 docker1.11 + compose + shipyard + eureka + nginx 等做微服务架构，但是考虑到最新版 docker 的重大升级，从长远的眼光来看，不能一直限定于之前的那一套，我更倾向于新版本。

- 调研 Docker17.03-ce 的新特性，尤其是服务治理方面
- 结合具体业务试用
- 重构 shrike 为 docker plugin

> *Don't speak, I'll try to save us from ourselves*
>
> *If were going down, we're going down in flames*
