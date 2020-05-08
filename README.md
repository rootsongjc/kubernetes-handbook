# Kubernetes Handbook——Kubernetes中文指南/云原生应用架构实践手册

[Kubernetes](http://kubernetes.io)是Google基于其内部使用的[Borg](https://research.google.com/pubs/pub43438.html)系统开源出来的容器编排调度引擎，Google 将其作为初始和核心项目贡献给[CNCF](https://cncf.io)（云原生计算基金会），近年来逐渐发展出了云原生生态。

Kubernetes的目标不仅仅是一个编排系统，而是提供一个规范用以描述集群的架构，定义服务的最终状态，使系统自动地达到和维持该状态。Kubernetes作为云原生应用的基石，相当于一个云操作系统，其重要性不言而喻。

云原生技术有利于各组织在公有云、私有云和混合云等新型动态环境中，构建和运行可弹性扩展的应用。云原生的代表技术包括**容器**、**服务网格**、**微服务**、**不可变基础设施**和**声明式API**。这些技术能够构建容错性好、易于管理和便于观察的松耦合系统。结合可靠的自动化手段，云原生技术使工程师能够轻松地对系统作出频繁和可预测的重大变更。——CNCF（云原生计算基金会）。

## 关于本书

<p align="left">
  <a href="https://circleci.com/gh/rootsongjc/kubernetes-handbook/tree/master">
    <img src="https://circleci.com/gh/rootsongjc/kubernetes-handbook/tree/master.svg?style=svg" alt="CircleCI"/>
  </a>
</p>

<p align="center">
  <a href="https://jimmysong.io/kubernetes-handbook">
    <img src="cover.jpg" width="50%" height="50%" alt="Kubernetes Handbook——Kubernetes中文指南/云原生应用架构实践手册 by Jimmy Song(宋净超）">
  </a>
</p>

Kubernetes Handbook开源于2017年3月并在其后不断完善，是第一本系统介绍Kubernetes的中文书籍。写作本书的过程中，笔者记录了从零开始学习和使用Kubernetes的历程，着重于经验总结和资料分享，亦有Kubernetes核心概念解析，希望能够帮助大家少走弯路，为大家介绍Kubernetes周边生态，如微服务、DevOps、大数据应用、[Service Mesh](https://jimmysong.io/blog/what-is-a-service-mesh/)、[OAM](https://oam.dev)、Serverless等领域。

### 开始之前

在阅读本书之前希望您掌握以下知识和准备以下环境：

- Linux 操作系统原理
- Linux 常用命令
- Docker 容器原理及基本操作
- 一台可以上网的电脑，Mac/Windows/Linux 皆可
- 安装 Docker

### 本书主题

本书的主题不局限于Kubernetes，还包括以下几大主题：

- 云原生开源组件
- 云原生应用与微服务架构
- 基于Kubernetes的Service Mesh架构

起初写作本书时，安装的所有组件、所用示例和操作等皆基于 **Kubernetes 1.6+** 版本，同时我们也将密切关注Kubernetes的版本更新，随着它的版本更新升级，本书中的Kubernetes版本和示例也将随之更新。

### 使用方式

您可以通过以下方式使用本书：

- GitHub地址：https://github.com/rootsongjc/kubernetes-handbook
- GitBook在线浏览：https://jimmysong.io/kubernetes-handbook/
- 下载本书的发行版：https://github.com/rootsongjc/kubernetes-handbook/releases
- 按照[说明](https://github.com/rootsongjc/kubernetes-handbook/blob/master/CODE_OF_CONDUCT.md)自行编译成离线版本
- Fork 一份添加你自己的笔记自行维护，有余力者可以一起参与进来

## 快速开始

如果您想要学习Kubernetes和云原生应用架构但是又不想自己从头开始搭建和配置一个集群，那么可以直接使用[kubernetes-vagrant-centos-cluster](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster)项目直接在本地部署一个3节点的分布式集群及其他如Heapster、EFK、Istio等可选组件，或者使用更加轻量级的[cloud-native-sandbox](https://github.com/rootsongjc/cloud-native-sandbox)在个人电脑上使用Docker运行单节点的Kubernetes、Istio等组件。

## 贡献与致谢

感谢大家对本书做出的贡献！

- [查看贡献者列表](https://github.com/rootsongjc/kubernetes-handbook/graphs/contributors)
- [查看如何贡献](https://github.com/rootsongjc/kubernetes-handbook/blob/master/CONTRIBUTING.md)
- [查看文档的组织结构与使用方法](https://github.com/rootsongjc/kubernetes-handbook/blob/master/CODE_OF_CONDUCT.md)

## License

<p align="left">
  <img src="images/cc4-license.png" alt="CC4 License"/>
</p>

[署名-非商业性使用-相同方式共享 4.0 (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)

## Stargazers over time

[![Stargazers over time](https://starcharts.herokuapp.com/rootsongjc/kubernetes-handbook.svg)](https://starcharts.herokuapp.com/rootsongjc/kubernetes-handbook)

## 云原生社区

云原生社区是一个有技术、有温度、有情怀的开源社区，由 [Jimmy 和他的伙伴们](https://cloudnative.to/team)发起与 2020 年 2 月，秉持“共识、共治、共建、共享”的原则。立足中国，面向世界，企业中立，旨在借助开源打破企业的边界，关注技术人的成长，促进中国云原生开源的发展。

如果您也有志于投身云原生的历史洪流中，不要犹豫，[加入我们](https://cloudnative.to/contact/)！


## 云原生出版物

以下为本人参与出版的云原生相关图书。

- [Cloud Native Go](https://jimmysong.io/book/cloud-native-go/) - 基于Go和React的web云原生应用构建指南（Kevin Hoffman & Dan Nemeth著 宋净超 吴迎松 徐蓓 马超 译），电子工业出版社，2017年6月出版
- [Python云原生](https://jimmysong.io/book/cloud-native-python/) - 使用Python和React构建云原生应用（Manish Sethi著，宋净超译），电子工业出版社，2018年6月出版
- [云原生Java](https://jimmysong.io/book/cloud-native-java/) - Spring Boot、Spring Cloud与Cloud Foundry弹性系统设计（Josh Long & Kenny Bastani著，张若飞 宋净超译 ），电子工业出版社，2018年7月出版
- [未来架构——从服务化到云原生](https://jimmysong.io/book/future-architecture/) - 张亮 吴晟 敖小剑 宋净超 著，电子工业出版社，2019年3月出版

## 推荐

- [深入剖析 Kubernetes](https://tva1.sinaimg.cn/large/006y8mN6ly1g7vf4p12rpj30u01hdjwp.jpg)：极客时间推出的 Kubernetes 专栏
- [深入浅出云计算](https://time.geekbang.org/column/intro/292?code=EhFrzVKvIro8U06UyaeLCCdmbpk7g010iXprzDxW17I%3D&utm_term=SPoster)：云原生时代给开发者和架构师的云计算指南
- [《Istio Handbook——Istio 服务网格进阶实战》](https://www.servicemesher.com/istio-handbook/)：ServiceMesher 社区出品的开源电子书

## 支持本书

如果您觉得本书给您带来帮助，可以使用微信扫一扫请我喝杯☕️，谢谢！

<p align="center">
<img src="images/wechat-appreciate-qrcode.jpg" alt="微信赞赏码"/>
</p>