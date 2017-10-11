---
title: "Kubernetes与云原生应用概览"
date: 2017-10-11T16:49:51+08:00
draft: true
tags: ["kubernetes","cloud-native","architecture"]
categories: "cloud-native"
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/banners/cloud-computing.jpg", desc: "Cloud Computing"}]
description: "从云计算和容器生态开始引出kubernetes和cloud native云原生的概念"
---

本文是我在公司内部的培训和分享的资料，去掉了其中的credential部分，分享给大家。文章深入浅出，高屋建瓴，没有深入到具体细节，而是给出了详细的说明链接可供读者参考。

## 概览

本文主要包括如下内容：

- [从云计算到微服务再到云原生计算](#从云计算到微服务再到云原生计算)
  - [云计算介绍](#云计算介绍)
  - [微服务介绍](#微服务介绍)
  - [云原生概念介绍](#云原生概念介绍)
- [Kubernetes与云原生的关系](#kubernetes与云原生的关系)
  - [Kubernetes介绍](#Kubernetes介绍)
  - [12因素应用](#12因素应用)
- [Kubernetes中的资源管理与容器设计模式](#Kubernetes中的资源管理与容器设计模式)
    - [容器的设计模式](#容器的设计模式)
    - [资源限制与配额](#资源限制与配额)
- [管理Kubernetes集群](#管理Kubernetes集群)
  - [部署Kubernetes集群](#部署Kubernetes集群)
  - [服务发现与负载均衡](#服务发现与负载均衡)
  - [持续集成与发布](#持续集成与发布)
  - [日志收集与监控](#日志收集与监控)
  - [安全性与权限管理](#安全性与权限管理)
- [如何开发Kubernetes原生应用步骤介绍](#如何开发Kubernetes原生应用步骤介绍)
  - [云原生应用开发示例](#云原生应用开发示例)
  - [上线与部署流程详解](#上线与部署流程详解)
- [如何迁移到云原生应用架构](#如何迁移到云原生应用架构)
  - [迁移到云原生应用架构指南](#迁移到云原生应用架构指南)
  - [迁移案例解析](#迁移案例解析)
- [Service mesh基本原理和示例介绍](#Service-mesh基本原理和示例介绍)
  - [什么是Service mesh](#什么是Service-mesh)
  - [Service mesh使用指南](#Service-mesh使用指南)

## 从云计算到微服务再到云原生计算

下面将从云计算的发展历程引入云原生计算，请先看下图：

![云计算演进历程](https://res.cloudinary.com/jimmysong/image/upload/images/cloud-computing-evolution-road.jpg)

### 云计算介绍

云计算包含的内容十分繁杂，也有很多技术和公司牵强赴会说自己是云计算公司，说自己是做云的，实际上可能风马牛不相及。说白了，云计算就是一种配置资源的方式，根据资源配置方式的不同我们可以把云计算从宏观上分为以下三种类型：

- IaaS：这是为了想要建立自己的商业模式并进行自定义的客户，例如亚马逊的EC2、S3存储、Rackspace虚拟机等都是IaaS。
- PaaS：工具和服务的集合，对于想用它来构建自己的应用程序或者想快速得将应用程序部署到生产环境而不必关心底层硬件的用户和开发者来说是特别有用的，比如Cloud Foundry、Google App Engine、Heroku等。
- SaaS：终端用户可以直接使用的应用程序。这个就太多，我们生活中用到的很多软件都是SaaS服务，只要基于互联网来提供的服务基本都是SaaS服务，有的服务是免费的，比如Google Docs，还有更多的是根据我们购买的Plan和使用量付费，比如GitHub、各种云存储。

### 微服务介绍

微服务（Microservices）这个词比较新颖，但是其实这种架构设计理念早就有了。微服务是一种分布式架构设计理念，为了推动细粒度服务的使用，这些服务要能协同工作，每个服务都有自己的生命周期。一个微服务就是一个独立的实体，可以独立的部署在PAAS平台上，也可以作为一个独立的进程在主机中运行。服务之间通过API访问，修改一个服务不会影响其它服务。

要想了解微服务的详细内容推荐阅读《微服务设计》（Sam Newman著），我写过这本书的读书笔记 - [微服务设计读书笔记](https://jimmysong.io/posts/microservice-reading-notes/)。

下文中会谈到kubernetes与微服务的关系，其中kubernetes的service天生就适合与微服务。

### 云原生概念介绍

云原生准确来说是一种文化，更是一种潮流，它是云计算的一个必然导向。它的意义在于让云成为云化战略成功的基石，而不是阻碍，如果业务应用上云之后开发和运维人员比原先还痛苦，成本高企的话，这样的云我们宁愿不不上。

自从云的概念开始普及，许多公司都部署了实施云化的策略，纷纷搭建起云平台，希望完成传统应用到云端的迁移。但是这个过程中会遇到一些技术难题，上云以后，效率并没有变得奇高，故障也没有迅速定位。

为了解决传统应用升级缓慢、架构臃肿、不能快速迭代、故障不能快速定位、问题无法快速解决等问题，云原生这一概念横空出世。云原生可以改进应用开发的效率，改变企业的组织结构，甚至会在文化层面上直接影响一个公司的决策。

另外，云原生也很好地解释了云上运行的应用应该具备什么样的架构特性——敏捷性、可扩展性、故障可恢复性。

综上所述，云原生应用应该具备以下几个关键词：

- 敏捷
- 可靠
- 高弹性
- 易扩展
- 故障隔离保护
- 不中断业务持续更新

以上特性也是云原生区别于传统云应用的优势特点。

从宏观概念上讲，云原生是不同思想的集合，集目前各种热门技术之大成，具体包括如下图所示的几个部分。

## Kubernetes与云原生的关系

Kuberentes可以说是乘着docker和微服务的东风，已经推出便迅速蹿红，它的很多设计思想都契合了微服务和云原生应用的设计法则，这其中最著名的就是开发了[Heroku](https://www.heroku.com) PaaS平台的工程师们总结的 [Twelve-factor App](https://12factor.net/)了。

下面我将讲解Kubernetes设计时是如何按照了十二因素应用法则，并给出kubernetes中的应用示例，并附上一句话简短的介绍。

### Kubernetes介绍

Kubernetes](http://kubernetes.io)是Google基于[Borg](https://research.google.com/pubs/pub43438.html)开源的容器编排调度引擎，作为[CNCF](http://cncf.io)（Cloud Native Computing Foundation）最重要的组件之一，它的目标不仅仅是一个编排系统，而是提供一个规范，可以让你来描述集群的架构，定义服务的最终状态，kubernetes可以帮你将系统自动得达到和维持在这个状态。

更直白的说，Kubernetes用户可以通过编写一个yaml或者json格式的配置文件，也可以通过工具/代码生成或直接请求kubernetes API创建应用，该配置文件中包含了用户想要应用程序保持的状态，不论整个kubernetes集群中的个别主机发生什么问题，都不会影响应用程序的状态，你还可以通过改变该配置文件或请求kubernetes API来改变应用程序的状态。

### 12因素应用

12因素应用提出已经有几年的时间了，每个人对其可能都有自己的理解，切不可生搬硬套，也不一定所有云原生应用都必须符合这12条法则，其中有几条法则可能还有点争议，有人对其的解释和看法不同。

![十二因素应用](https://res.cloudinary.com/jimmysong/image/upload/images/12-factor-app.png)

**1.基准代码**

每个代码仓库（repo）都生成docker image保存到镜像仓库中，并使用唯一的ID管理，在Jenkins中使用编译时的ID。

**2.依赖**

显式得声明代码中的依赖，使用软件包管理工具声明，比如Go中的Glide。

**3.配置**

将配置与代码分离，应用部署到kubernete中可以使用容器的环境变量或ConfigMap挂载到容器中。

**4.后端服务**

把后端服务当作附加资源，实质上是计算存储分离和降低服务耦合，分解单体应用。

**5.构建、发布、运行**

严格分离构建和运行，每次修改代码生成新的镜像，重新发布，不能直接修改运行时的代码和配置。

**6.进程**

应用程序进程应该是无状态的，这意味着再次重启后还可以计算出原先的状态。

**7.端口绑定**

在kubernetes中每个Pod都有独立的IP，每个运行在Pod中的应用不必关心端口是否重复，只需在service中指定端口，集群内的service通过配置互相发现。

**8.并发**

每个容器都是一个进程，通过增加容器的副本数实现并发。

**9.易处理**

快速启动和优雅终止可最大化健壮性，kuberentes优秀的[Pod生存周期控制](https://jimmysong.io/posts/pod-lifecycle/)。

**10.开发环境与线上环境等价**

在kubernetes中可以创建多个namespace，使用相同的镜像可以很方便的复制一套环境出来，镜像的使用可以很方便的部署一个后端服务。

**11.日志**

把日志当作事件流，使用stdout输出并收集汇聚起来，例如到ES中统一查看。

**12.管理进程**

后台管理任务当作一次性进程运行，`kubectl exec`进入容器内部操作。

另外，[Cloud Native Go](https://jimmysong.io/cloud-native-go) 这本书的作者，CapitalOne公司的Kevin Hoffman在TalkingData T11峰会上的[High Level Cloud Native](https://jimmysong.io/posts/high-level-cloud-native-from-kevin-hoffman/)的演讲中讲述了云原生应用的15个因素，在原先的12因素应用的基础上又增加了如下三个因素：

**API优先**

- 服务间的合约
- 团队协作的规约
- 文档化、规范化
- RESTful或RPC

**监控**

- 实时监控远程应用
- 应用性能监控（APM）
- 应用健康监控
- 系统日志
- 不建议在线Debug

**认证授权**

- 不要等最后才去考虑应用的安全性
- 详细设计、明确声明、文档化
- Bearer token、OAuth、OIDC认证
- 操作审计

详见[High Level Cloud Native From Kevin Hoffman](https://jimmysong.io/posts/high-level-cloud-native-from-kevin-hoffman/)。

## Kubernetes中的资源管理与容器设计模式

Kubernetes通过声明式配置，真正让开发人员能够理解应用的状态，并通过同一份配置可以立马启动一个一模一样的环境，大大提高了应用开发和部署的效率，其中kubernetes设计的多种资源类型可以帮助我们定义应用的运行状态，并使用资源配置来细粒度得明确限制应用的资源使用。

### 容器的设计模式

Kubernetes提供了多种资源对象，用户可以根据自己应用的特性加以选择。这些对象有：

| 类别   | 名称                                       |
| :--- | ---------------------------------------- |
| 资源对象 | Pod、ReplicaSet、ReplicationController、Deployment、StatefulSet、DaemonSet、Job、CronJob、HorizontalPodAutoscaling |
| 配置对象 | Node、Namespace、Service、Secret、ConfigMap、Ingress、Label、ThirdPartyResource、   ServiceAccount |
| 存储对象 | Volume、Persistent Volume                 |
| 策略对象 | SecurityContext、ResourceQuota、LimitRange |

在 Kubernetes 系统中，*Kubernetes 对象* 是持久化的条目。Kubernetes 使用这些条目去表示整个集群的状态。特别地，它们描述了如下信息：

- 什么容器化应用在运行（以及在哪个 Node 上）
- 可以被应用使用的资源
- 关于应用如何表现的策略，比如重启策略、升级策略，以及容错策略

Kubernetes 对象是 “目标性记录” —— 一旦创建对象，Kubernetes 系统将持续工作以确保对象存在。通过创建对象，可以有效地告知 Kubernetes 系统，所需要的集群工作负载看起来是什么样子的，这就是 Kubernetes 集群的 **期望状态**。

详见[Kubernetes Handbook - Objects](https://jimmysong.io/kubernetes-handbook/concepts/objects.html)。

### 资源限制与配额

## 管理Kubernetes集群

手工部署Kubernetes是一个很艰巨的活，你需要了解网络配置、docker的安装与使用、镜像仓库的构建、角色证书的创建、kubernetes的基本原理和构成、kubernetes应用程序的yaml文件编写等。

我编写了一本[kubernetes-handbook](https://jimmysong.io/kubernetes-handbook/)可供大家免费阅读，该书记录了本人从零开始学习和使用Kubernetes的心路历程，着重于经验分享和总结，同时也会有相关的概念解析，希望能够帮助大家少踩坑，少走弯路。

### 部署Kubernetes集群

使用二进制部署 `kubernetes` 集群的所有组件和插件，而不是使用 `kubeadm` 等自动化方式来部署集群，同时开启了集群的TLS安全认证，这样可以帮助我们解系统各组件的交互原理，进而能快速解决实际问题。详见[Kubernetes Handbook - 在CentOS上部署kubernetes1.6集群](https://jimmysong.io/kubernetes-handbook/practice/install-kbernetes1.6-on-centos.html)。

**集群详情**

- Kubernetes 1.6.0
- Docker 1.12.5（使用yum安装）
- Etcd 3.1.5
- Flanneld 0.7 vxlan 网络
- TLS 认证通信 (所有组件，如 etcd、kubernetes master 和 node)
- RBAC 授权
- kublet TLS BootStrapping
- kubedns、dashboard、heapster(influxdb、grafana)、EFK(elasticsearch、fluentd、kibana) 集群插件
- 私有docker镜像仓库[harbor](https://github.com/vmware/harbor)（请自行部署，harbor提供离线安装包，直接使用docker-compose启动即可）

**步骤介绍**

- [1 创建 TLS 证书和秘钥](https://jimmysong.io/kubernetes-handbook/practice/create-tls-and-secret-key.html)
- [2 创建kubeconfig 文件](https://jimmysong.io/kubernetes-handbook/practice/create-kubeconfig.html)
- [3 创建高可用etcd集群](https://jimmysong.io/kubernetes-handbook/practice/etcd-cluster-installation.html)
- [4 安装kubectl命令行工具](https://jimmysong.io/kubernetes-handbook/practice/kubectl-installation.html)
- [5 部署master节点](https://jimmysong.io/kubernetes-handbook/practice/master-installation.html)
- [6 部署node节点](https://jimmysong.io/kubernetes-handbook/practice/node-installation.html)
- [7 安装kubedns插件](https://jimmysong.io/kubernetes-handbook/practice/kubedns-addon-installation.html)
- [8 安装dashboard插件](https://jimmysong.io/kubernetes-handbook/practice/dashboard-addon-installation.html)
- [9 安装heapster插件](https://jimmysong.io/kubernetes-handbook/practice/heapster-addon-installation.html)
- [10 安装EFK插件](https://jimmysong.io/kubernetes-handbook/practice/efk-addon-installation.html)

### 服务发现与负载均衡

Kubernetes在设计之初就充分考虑了针对容器的服务发现与负载均衡机制，提供了Service资源，并通过kube-proxy配合cloud provider来适应不同的应用场景。随着kubernetes用户的激增，用户场景的不断丰富，又产生了一些新的负载均衡机制。目前，kubernetes中的负载均衡大致可以分为以下几种机制，每种机制都有其特定的应用场景：

- **Service**：直接用Service提供cluster内部的负载均衡，并借助cloud provider提供的LB提供外部访问
- **Ingress**：还是用Service提供cluster内部的负载均衡，但是通过自定义LB提供外部访问
- **Service Load Balancer**：把load balancer直接跑在容器中，实现Bare Metal的Service Load Balancer
- **Custom Load Balancer**：自定义负载均衡，并替代kube-proxy，一般在物理部署Kubernetes时使用，方便接入公司已有的外部服务

详见[Kubernetes Handbook - 服务发现与负载均衡](https://jimmysong.io/kubernetes-handbook/practice/service-discovery-and-loadbalancing.htmll)。

### 持续集成与发布

![使用Jenkins进行持续集成与发布流程图](https://res.cloudinary.com/jimmysong/image/upload/images/kubernetes-jenkins-ci-cd.png)

应用构建和发布流程说明：

1. 用户向Gitlab提交代码，代码中必须包含`Dockerfile`
2. 将代码提交到远程仓库
3. 用户在发布应用时需要填写git仓库地址和分支、服务类型、服务名称、资源数量、实例个数，确定后触发Jenkins自动构建
4. Jenkins的CI流水线自动编译代码并打包成docker镜像推送到Harbor镜像仓库
5. Jenkins的CI流水线中包括了自定义脚本，根据我们已准备好的kubernetes的YAML模板，将其中的变量替换成用户输入的选项
6. 生成应用的kubernetes YAML配置文件
7. 更新Ingress的配置，根据新部署的应用的名称，在ingress的配置文件中增加一条路由信息
8. 更新PowerDNS，向其中插入一条DNS记录，IP地址是边缘节点的IP地址。关于边缘节点，请查看[边缘节点配置](https://jimmysong.io/kubernetes-handbook/practice/edge-node-configuration.html)
9. Jenkins调用kubernetes的API，部署应用

### 日志收集与监控

基于现有的ELK日志收集方案，稍作改造，选用[filebeat](https://www.elastic.co/products/beats/filebeat)来收集日志，可以作为sidecar的形式跟应用运行在同一个Pod中，比较轻量级消耗资源比较少。

![filebeat日志收集架构图](https://res.cloudinary.com/jimmysong/image/upload/images/filebeat-log-collector-arch.png)

详见[Kubernetes Handbook - 应用日志收集](https://jimmysong.io/kubernetes-handbook/practice/app-log-collection.html)。

### 安全性与权限管理

Kubernetes是一个多租户的云平台，因此必须对用户的权限加以限制，对用户空间进行隔离。Kubernetes中的隔离主要包括这几种：

- 网络隔离：需要使用网络插件，比如[calico](https://www.projectcalico.org/)。
- 资源隔离：kubernetes原生支持资源隔离，pod就是资源就是隔离和调度的最小单位，同时使用[namespace](https://jimmysong.io/kubernetes-handbook/concepts/namespace.html)限制用户空间和资源限额。
- 身份隔离：使用[RBAC-基于角色的访问控制](https://jimmysong.io/kubernetes-handbook/guide/rbac.html)，多租户的身份认证和权限控制。

## 如何开发Kubernetes原生应用步骤介绍

当我们有了一个kubernetes集群后，如何在上面开发和部署应用，应该遵循怎样的流程？本次分享将向您展示如何使用go语言开发和部署一个kubernetes native应用，使用wercker进行持续集成与持续发布，我将以一个很简单的前后端访问，获取伪造数据并展示的例子来说明。（本文是我在DockOne社区分享的内容）

详见[如何开发部署kubernetes native应用](https://jimmysong.io/posts/creating-cloud-native-app-with-kubernetes/)。

### 云原生应用开发示例

详见[如何开发部署kubernetes native应用](https://jimmysong.io/posts/creating-cloud-native-app-with-kubernetes/)。

### 上线与部署流程详解

详见[使用Jenkins进行持续构建与发布应用到kubernetes集群中](https://jimmysong.io/posts/kubernetes-jenkins-ci-cd/)。

## 如何迁移到云原生应用架构



### 迁移到云原生应用架构指南

### 迁移案例解析

## Service mesh基本原理和示例介绍

### 什么是Service mesh

### Service mesh使用指南