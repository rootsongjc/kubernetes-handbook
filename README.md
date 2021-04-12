# Kubernetes Handbook——Kubernetes 中文指南/云原生应用架构实践手册

> 云原生是一种行为方式和设计理念，究其本质，凡是能够提高云上资源利用率和应用交付效率的行为或方式都是云原生的。云计算的发展史就是一部云原生化的历史。Kubernetes 开启了云原生 1.0 的序幕，服务网格 Istio 的出现，引领了后 Kubernetes 时代的微服务，serverless 的再次兴起，使得云原生从基础设施层不断向应用架构层挺进，我们正处于一个云原生 2.0 的新时代。—— [Jimmy Song](https://jimmysong.io)

[Kubernetes](http://kubernetes.io) 是 Google 于 [2014 年 6 月](https://jimmysong.io/cloud-native/note/open-source/)基于其内部使用的 [Borg](https://research.google.com/pubs/pub43438.html) 系统开源出来的容器编排调度引擎，Google 将其作为初始和核心项目贡献给 [CNCF](https://cncf.io)（云原生计算基金会），近年来逐渐发展出了云原生生态。

Kubernetes 的目标不仅仅是一个编排系统，而是提供一个规范用以描述集群的架构，定义服务的最终状态，使系统自动地达到和维持该状态。Kubernetes 作为云原生应用的基石，相当于一个云原生操作系统，其重要性不言而喻。

云原生技术有利于各组织在公有云、私有云和混合云等新型动态环境中，构建和运行可弹性扩展的应用。云原生的代表技术包括 **容器**、**服务网格**、**微服务**、**不可变基础设施** 和 **声明式 API**。这些技术能够构建容错性好、易于管理和便于观察的松耦合系统。结合可靠的自动化手段，云原生技术使工程师能够轻松地对系统作出频繁和可预测的重大变更。——CNCF（云原生计算基金会）。

## 关于本书

<p align="left">
  <a href="https://circleci.com/gh/rootsongjc/kubernetes-handbook/tree/master">
    <img src="https://circleci.com/gh/rootsongjc/kubernetes-handbook/tree/master.svg?style=svg" alt="CircleCI"/>
  </a>
</p>

<p align="center">
  <a href="https://jimmysong.io/kubernetes-handbook">
    <img src="cover.jpg" width="50%" height="50%" alt="Kubernetes Handbook——Kubernetes 中文指南 / 云原生应用架构实践手册 by Jimmy Song (宋净超）">
  </a>
</p>

Kubernetes Handbook 开源于 2017 年 3 月并在其后不断完善，是第一本系统介绍 Kubernetes 的中文书籍。写作本书的过程中，笔者记录了从零开始学习和使用 Kubernetes 的历程，着重于经验总结和资料分享，亦有 Kubernetes 核心概念解析，希望能够帮助大家少走弯路，为大家介绍 Kubernetes 周边生态，如微服务、DevOps、大数据应用、[Service Mesh](https://jimmysong.io/blog/what-is-a-service-mesh/)、云原生应用、Serverless 等领域。

### 开始之前

在阅读本书之前希望您掌握以下知识和准备以下环境：

- 阅读[云原生新手指南](cloud-native/quick-start.md)
- Linux 操作系统原理
- Linux 常用命令
- Docker 容器原理及基本操作
- 一台可以上网的电脑，Mac/Windows/Linux 皆可
- 安装 Docker

### 本书主题

本书的主题不局限于 Kubernetes，还包括以下几大主题：

- 云原生开源组件
- 云原生应用与微服务架构
- 基于 Kubernetes 的 Service Mesh 架构

本书中的说明、安装的所有组件、所用示例和操作要求至少 **Kubernetes 1.6+** 版本。

### 使用方式

您可以通过以下方式使用本书：

- GitHub 地址：https://github.com/rootsongjc/kubernetes-handbook
- GitBook 在线浏览：https://jimmysong.io/kubernetes-handbook/
- 下载本书的发行版：https://github.com/rootsongjc/kubernetes-handbook/releases
- 按照[说明](https://github.com/rootsongjc/kubernetes-handbook/blob/master/CODE_OF_CONDUCT.md)自行编译成离线版本
- Fork 一份添加你自己的笔记自行维护，有余力者可以一起参与进来

## 快速开始

如果您想要学习 Kubernetes 和云原生应用架构但是又不想自己从头开始搭建和配置一个集群，推荐以下几种方式：

- [使用虚拟机安装的拥有三个节点的 Kubernetes 集群](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster)：项目直接在本地部署一个 3 节点的分布式集群及其他如 Heapster、EFK、Istio 等可选组件
- [Cloud Native Sandbox](https://github.com/rootsongjc/cloud-native-sandbox)：更加轻量级，在个人电脑上使用 Docker 运行单节点的 Kubernetes、Istio 等组件
- [Katacoda 提供的 Kubernetes 环境](https://katacoda.com/kubernetes)：免费的在线学习平台，无需注册，拥有 GitHub 账号即可登录

## 贡献与致谢

感谢大家对本书做出的贡献！

- [查看贡献者列表](https://github.com/rootsongjc/kubernetes-handbook/graphs/contributors)
- [查看如何贡献](https://github.com/rootsongjc/kubernetes-handbook/blob/master/CONTRIBUTING.md)
- [查看文档的组织结构与使用方法](https://github.com/rootsongjc/kubernetes-handbook/blob/master/CODE_OF_CONDUCT.md)

## 云原生出版物

以下为笔者参与出版的云原生相关图书。

- [Cloud Native Go](https://jimmysong.io/book/cloud-native-go/) - 基于 Go 和 React 的 web 云原生应用构建指南（Kevin Hoffman & Dan Nemeth 著 宋净超 吴迎松 徐蓓 马超 译），电子工业出版社，2017 年 6 月出版
- [Python 云原生](https://jimmysong.io/book/cloud-native-python/) - 使用 Python 和 React 构建云原生应用（Manish Sethi 著，宋净超译），电子工业出版社，2018 年 6 月出版
- [云原生 Java](https://jimmysong.io/book/cloud-native-java/) - Spring Boot、Spring Cloud 与 Cloud Foundry 弹性系统设计（Josh Long & Kenny Bastani 著，张若飞 宋净超译 ），电子工业出版社，2018 年 7 月出版
- [未来架构 —— 从服务化到云原生](https://jimmysong.io/book/future-architecture/) - 张亮 吴晟 敖小剑 宋净超 著，电子工业出版社，2019 年 3 月出版
- [云原生模式](https://jimmysong.io/book/cloud-native-patterns) - 设计拥抱变化的软件（Cornelia Davis 著，张若飞 宋净超 译），电子工业出版社，2020 年 8 月出版
- [Quarkus 实战](https://jimmysong.io/book/quarkus-cookbook/) - 专为 Kubernetes 而优化的 Java 解决方案（Alex Soto Bueno、Jason Porter 著，张晓宇 刘岩 宋净超 译），机械工业出版社，2021 年 3 月出版

## 版权与许可证

本书版权归 Jimmy Song 所有， 您可以使用[署名 - 非商业性使用 - 相同方式共享 4.0 (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)  协议共享。

## 云原生社区

<p align="center">
  <a href="https://cloudnative.to">
    <img src="https://res.cloudinary.com/jimmysong/image/upload/v1594445787/images/github-banner.jpg" alt="加入云原生社区" title="加入云原生社区">
  </a>
</p>

云原生社区是一个中立的云原生终端用户社区，始与作者于 2016 年成立的 Kubernetes & CloudNative 实战群，覆盖了上千名早期云原生拥护者。在此基础上于 2020 年 5 月，由 CNCF 大使、开源领域意见领袖共同发起将原社群升级为云原生社区，旨在推广云原生技术，构建开发者生态。

官方网站 <https://cloudnative.to>，关注云原生社区微信公众号，[申请加入社区](https://mp.weixin.qq.com/s/vWlSdzz2MNdXRr0sd2-LFg)。
