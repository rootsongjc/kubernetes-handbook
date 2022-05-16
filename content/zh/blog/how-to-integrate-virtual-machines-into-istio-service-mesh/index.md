---
title: "如何在 Istio Service Mesh 中集成虚拟机？"
date: 2020-11-02T16:43:27+08:00
draft: false
tags: ["istio"]
categories: ["Service Mesh"]
description: "将基于虚拟机的工作负载更好地集成到服务网格中，是 Istio 团队今年的一大重点。Tetrate 还通过其产品 Tetrate Service Bridge 提供了无缝的多云连接、安全性和可观察性，包括针对虚拟机的。本文将带您了解为什么 Istio 需要与虚拟机整合，以及如何整合。"
type: "post"
image: "images/banner/istio-logo.webp"
---

Istio 是目前最流行的服务网格，用于连接、保护、控制和观察服务。当其 2017 年开源时，Kubernetes 已赢得容器编排之战，Istio 为了满足组织转向微服务的需求。虽然 Istio 声称支持异构环境，如 Nomad、Consul、Eureka、Cloud Foundry、Mesos 等，但实际上，它一直与 Kubernetes 合作得最好–它的服务发现就是基于 Kubernetes。

Istio 在发展初期就因为一些问题而饱受诟病，比如组件数量多、安装和维护复杂、调试困难、由于引入了太多的新概念和对象（多达 50 个 CRD）而导致学习曲线陡峭，以及 Mixer 组件对性能的影响。但这些问题正在被 Istio 团队逐渐克服。从 2020 年初发布的[路线图](https://istio.io/latest/zh/blog/2020/tradewinds-2020/)中可以看出，Istio 已经取得了长足的进步。

将基于虚拟机的工作负载更好地集成到服务网格中，是 Istio 团队今年的一大重点。Tetrate 还通过其产品 [Tetrate Service Bridge](https://www.tetrate.io/tetrate-service-bridge/) 提供了无缝的多云连接、安全性和可观察性，包括针对虚拟机的。本文将带您了解为什么 Istio 需要与虚拟机整合，以及如何整合。

## Istio 为什么要支持虚拟机？

虽然现在容器和 Kubernetes 已经被广泛使用，但仍然有很多部署在虚拟机上的服务和 Kubernetes 集群之外的 API 需要由 Istio mesh 来管理。如何将棕地环境与绿地环境统一管理，这是一个巨大的挑战。

## 将虚拟机引入到网格中需要具备什么条件？

在介绍如何集成虚拟机之前，我先介绍一下将虚拟机添加到 Mesh 中需要什么条件。在支持虚拟机流量时，Istio 必须知道几件事：哪些虚拟机的服务要添加到 Mesh 中，以及如何访问虚拟机。每个虚拟机还需要一个身份，以便与服务网格的其他部分安全地通信。这些需求可以和 Kubernetes CRD 一起工作，也可以和 Consul 这样的完整的服务注册表一起工作。而基于服务账户的身份引导机制，为没有平台身份的虚拟机分配工作负载身份。对于有平台身份的虚拟机（如 EC2、GCP、Azure 等），Istio 正在进行这方面的工作，将平台身份与 Kubernetes 身份进行交换，方便设置 mTLS 通信。

## Istio 如何支持虚拟机？

Istio 对虚拟机的支持始于其服务注册表机制。Istio mesh 中的服务和实例信息来自 Istio 的服务注册表，到目前为止，Istio 的服务注册表只关注或跟踪 pod。在新的版本中，Istio 现在有资源类型来跟踪和观察虚拟机。网格内的 sidecar 无法观察和控制网格外服务的流量，因为它们没有任何信息。

Istio 社区和 [Tetrate](https://www.tetrate.io/) 在 Istio 对虚拟机的支持上做了[很多工作](https://www.tetrate.io/blog/istio-bringing-vms-into-the-mesh-with-cynthia-coan/)。1.6 版本中增加了 WorkloadEntry，它允许你像描述 Kubernetes 中运行的主机一样描述虚拟机。在 1.7 版本中，该版本开始增加了通过令牌将虚拟机自动引导到 service mesh 中的基础，Istio 做了大量的工作。Istio 1.8 将首次推出另一个名为 WorkloadGroup 的抽象，它类似于 Kubernetes Deployment 对象 —— 但适用于虚拟机。

下图显示了 Istio 如何在网格中对服务进行建模。最主要的信息来源来自于 Kubernetes 这样的平台服务注册表，或者 Consul 这样的系统。此外，ServiceEntry 作为用户定义的服务注册表，对虚拟机上的服务或组织外部的服务进行建模。

![Istio 中的服务注册发现模型](https://tva1.sinaimg.cn/large/0081Kckwly1gkc4ldbqzhj30p30ehwf5.jpg)

**为什么不直接使用 ServiceEntry 引入虚拟机中的服务，却还要大费周折在虚拟机中安装 Istio？**

使用 ServiceEntry，你可以让网格内部的服务发现和访问外部服务；此外，还可以管理这些外部服务的流量。结合 VirtualService，你还可以为相应的外部服务配置访问规则，比如请求超时、故障注入等，从而实现对指定外部服务的控制访问。 即便如此，它也只能控制客户端的流量，而不能控制引入的外部服务对其他服务的访问。也就是说，它不能控制作为调用发起者的服务的行为。在虚拟机中部署 sidecar，通过工作负载选择器引入虚拟机工作负载，可以像 Kubernetes 中的 pod 一样，对虚拟机进行无差别管理。

## Demo

在下面这个 demo 中我们将使在 GKE 中部署 Istio 并运行 bookinfo 示例，其中 ratings 服务的后端使用的是部署在虚拟机上的 MySQL，该示例可以在 [Istio 官方文档](https://istio.io/latest/docs/examples/virtual-machines/bookinfo/)中找到，我作出了部分改动，最终的流量路由如下图所示。

![Bookinfo 示例中的流量示意图](https://tva1.sinaimg.cn/large/0081Kckwly1gkc4lch5epj318g0avwfx.jpg)

### 安装流程

下面是示例的安装步骤：

1. 在 Google Cloud 中部署 Kubernetes 集群，Kubernetes 版本是 1.16.13；
2. 在 GKE 中安装 Istio 1.7.1；
3. 在 Google Cloud 中启动一台虚拟机并配置 Istio，将其加入到 Istio Mesh 中，这一步需要很多手动操作，生成证书、创建 token、配置 hosts 等；
4. 在 Istio Mesh 中部署 bookinfo 示例；
5. 在虚拟机中安装 MySQL；
6. 为虚拟机设置 VPC 防火箱规则；
7. 将虚拟机中的 MySQL 服务作为 ServiceEntry 引入到 Mesh 中并作为 rating 服务的后端；
8. 修改 MySQL 表中的数据，验证 bookinfo 中的 rating 相应的行为符合预期；

## 未来方向

从 [bookinfo](https://istio.io/latest/docs/examples/virtual-machines/bookinfo/) 的演示中可以看出，在这个过程中涉及到的人工工作太多，很容易出错。在未来，Istio 会改进虚拟机测试的可操作性，根据平台身份自动引导，改进 DNS 支持和 istioctl 调试等。大家可以关注 [Istio 环境工作组](https://github.com/istio/community/blob/master/WORKING-GROUPS.md)，了解更多关于虚拟机支持的细节。

## 参考阅读

- [Virtual Machine Installation](https://istio.io/latest/docs/setup/install/virtual-machine/)
- [Virtual Machines in Single-Network Meshes](https://istio.io/latest/docs/examples/virtual-machines/single-network/)
- [Istio: Bringing VMs into the Mesh (with Cynthia Coan)](https://www.tetrate.io/blog/istio-bringing-vms-into-the-mesh-with-cynthia-coan/)
- [Bridging Traditional and Modern Workloads](https://www.tetrate.io/blog/bridging-traditional-and-modern-workloads/)

