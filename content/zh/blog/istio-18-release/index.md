---
title: "Istio 1.8——用户至上的选择"
description: "Istio 信守了年初的承诺，从 1.1 开始，几乎每三个月一个版本，更能体会用户的需求了。此次是 2020 年的最后一个版本，引入了 WorkloadGroup 和 DNS proxy，对如虚拟机的非 Kubernetes 负载的支持更进了一步。"
date: 2020-11-20T08:34:40+08:00
draft: false
tags: ["istio"]
categories: ["service mesh"]
type: "post"
bg_image: "images/backgrounds/page-title.jpg"
aliases: "/posts/istio-service-and-traffic-model"
image: "images/banner/istio18.jpg"
---

今天 [Istio 1.8](https://istio.io/latest/news/releases/1.8.x/announcing-1.8/) 发布了，这是 Istio 在 2020 年发布的最后一个版本，按照 Istio 社区在[今年初设定的目标](https://istio.io/latest/blog/2020/tradewinds-2020/)继续推进，该版本主要有以下更新：

- 支持使用 Helm 3 进行安装和升级
- 正式移除了 Mixer
- 新增了 Istio DNS proxy，透明地拦截应用程序的 DNS 查询，实现智能应答
- 新增了 `WorkloadGroup` 以简化对虚拟机的引入

`WorkloadGroup `是一个新的 API 对象，旨在与虚拟机等非 Kubernetes 工作负载一起使用，模仿现有的用于 Kubernetes 工作负载的 sidecar 注入和部署规范模型来引导 Istio 代理。

## 安装与升级

Istio 从 1.5 版本开始弃用了 Helm，使用 `istioctl manifest` 方式安装，后来又改成了 `istioctl install`，现在又重新回归了 Helm，Helm 作为 Kubernetes 环境下最常用的应用安装管理组件，此次回归也是倾听用户声音，优化安装体验的的反应吧，不过 Istio Operator 依然将是 Istio 安装的最终形式，从 1.8 版本开始 Istio 支持使用 [Helm](https://istio.io/latest/docs/setup/install/helm/) 进行 in-place 升级和 canary 升级。

## 增强 Istio 的易用性

`istioctl` 命令行工具新的了 bug reporting 功能（`istioctl bug-report`），可以用来收集调试信息和获取集群状态。

[安装 add-on](https://istio.io/latest/blog/2020/addon-rework/) 的方式变了，在 1.7 中已经不推荐使用 istioctl 来安装，在 1.8 中直接被移除了，这样有利于解决 add-on 落后于上游及难以维护的问题。

正式移除了 Mixer，推荐使用 [WebAssembly](https://istio.io/latest/blog/2020/wasm-announce/) 通过扩展 Envoy 的方式来扩展 Istio，也推荐大家使用 [GetEnvoy Toolkit](https://www.getenvoy.io/reference/getenvoy_extension_toolkit_reference/) 来进行 Envoy 的扩展开发。

## 对虚拟机的支持

在我[之前的博客](https://thenewstack.io/how-to-integrate-virtual-machines-into-istio-service-mesh/)中谈到 Istio 1.7 如何支持虚拟机，在 Istio 1.8 中新增了[智能 DNS 代理](https://istio.io/latest/blog/2020/dns-proxy/)，它是由 Go 编写的 Istio sidecar 代理，sidecar 上的 Istio agent 将附带一个由 Istiod 动态编程的缓存 DNS 代理。来自应用程序的 DNS 查询会被 pod 或 VM 中的 Istio 代理透明地拦截和服务，该代理会智能地响应 DNS 查询请求，可以实现虚拟机到服务网格的无缝多集群访问。

新增了 [WorkloadGroup](https://istio.io/latest/docs/reference/config/networking/workload-group/) ，它描述了工作负载实例的集合。提供了一个规范，工作负载实例可以用来引导它们的代理，包括元数据和身份。它只打算与虚拟机等非 Kubernetes 工作负载一起使用，旨在模仿现有的用于 Kubernetes 工作负载的 sidecar 注入和部署规范模型来引导 Istio 代理。

在 [Tetrate](https://tetrate.io)，我们在客户的多集群部署中广泛使用这种机制，以使 sidecar 能够为暴露在网格中所有集群的入口网关的主机解析 DNS，并通过 mTLS 访问。

## 总结

总而言之，Istio 团队履行了[年初的承诺](https://istio.io/latest/blog/2020/tradewinds-2020/)，自 2018 年发布 1.1 版本发布起，保持了固定的发布节奏，每 3 个月发布一个版本，在性能、用户体验上持续优化，以满足 brownfiled 应用与 greenfield 应用在 Istio 上的无缝体验。我们期待 Istio 在 2021 年可以给我们带来更多惊喜。

最后，感谢[马若飞](https://github.com/malphi)对本文的审阅。