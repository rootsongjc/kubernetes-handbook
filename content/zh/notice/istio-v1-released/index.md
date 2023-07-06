---
title: "Istio 1.0 发布，生态逐步壮大，且可用于生产！"
description: "中文文档同时释出！"
date: 2018-08-01T14:42:36+08:00
draft: false
type: "notice"
link: "https://istio.io"
aliases: "/posts/istio-v1-released"
image: "images/backgrounds/notification.jpg"
---

今天，我们很高兴地宣布 [Istio 1.0](https://istio.io/zh/about/notes/1.0)。这距离最初的 0.1 版本发布以来已经过了一年多时间了。从 0.1 起，Istio 就在蓬勃发展的社区、贡献者和用户的帮助下迅速发展。现在已经有许多公司成功将 Istio 应用于生产，并通过 Istio 提供的洞察力和控制力获得了真正的价值。我们帮助大型企业和快速发展的创业公司，如 [eBay](https://www.ebay.com/)、[Auto Trader UK](https://www.autotrader.co.uk/)、[Descartes Labs](http://www.descarteslabs.com/)、[HP FitStation](https://www.fitstation.com/)、[Namely](https://www.namely.com/)、[PubNub](https://www.pubnub.com/) 和 [Trulia](https://www.trulia.com/) 使用 Istio 从头开始连接、管理和保护他们的服务。将此版本作为 1.0 发布是对我们构建了一组核心功能的认可，用户们可以依赖这些功能进行生产。

## 生态系统

去年，我们看到了 Istio 生态系统的大幅增长。[Envoy](https://www.envoyproxy.io/) 继续其令人印象深刻的增长，并增加了许多对生产级别服务网格至关重要的功能。像 [Datadog](https://www.datadoghq.com/)、
[SolarWinds](https://www.solarwinds.com/)、 [Sysdig](https://sysdig.com/blog/monitor-istio/)、[Google Stackdriver](https://cloud.google.com/stackdriver/) 和 [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/) 这样的可观察性提供商也编写了插件来将 Istio 与他们的产品集成在一起。[Tigera](https://www.tigera.io/resources/using-network-policy-concert-istio-2/)、[Aporeto](https://www.aporeto.com/)、[Cilium](https://cilium.io/)
和 [Styra](https://styra.com/) 为我们的策略实施和网络功能构建了扩展。[Red Hat](https://www.redhat.com/en) 构建的 Kiali 为网格管理和可观察性提供了良好的用户体验。[Cloud Foundry](https://www.cloudfoundry.org/) 正在为 Istio 建立下一代流量路由堆栈，最近宣布的 [Knative](https://github.com/knative/docs) 无服务器项目也正在做同样的事情，[Apigee](https://apigee.com/) 宣布计划在他们的 API 管理解决方案中使用它。这些只是社区去年增加的项目的一些汇总。

## 功能

自 0.8 发布以来，我们添加了一些重要的新功能，更重要的是将许多现有的功能标记为 Beta 表明它们可以用于生产。这在[发行说明](https://istio.io/zh/about/notes/1.0/)中有更详细的介绍，但值得一提是：

- 现在可以将多个 Kubernetes 集群[添加到单个网格中](https://istio.io/zh/docs/setup/kubernetes/multicluster-install)，并启用跨集群通信和一致的策略实施。多集群支持现在是 Beta。
- 通过网格实现对流量的细粒度控制的网络 API 现在是 Beta。使用网关显式建模 ingress 和 egress 问题，允许运维人员[控制网络拓扑](https://istio.io/zh/blog/2018/v1alpha3-routing/)并满足边缘的访问安全要求。
- 现在可以[增量上线](https://istio.io/zh/docs/tasks/security/mtls-migration)双向 TLS，而无需更新服务的所有客户端。这是一项关键功能，可以解除在现有生产上部署采用 Istio 的障碍。
- Mixer 现在支持[开发进程外适配器](https://github.com/istio/istio/wiki/Out-Of-Process-gRPC-Adapter-Dev-Guide)。这将成为在即将发布的版本中扩展 Mixer 的默认方式，这将使构建适配器更加简单。
- 现在，Envoy 在本地完全评估了控制服务访问的[授权策略](https://istio.io/zh/docs/concepts/security/#认证)，从而提高了它们的性能和可靠性。
- [Helm chart 安装](https://istio.io/zh/docs/setup/kubernetes/helm-install/) 现在是推荐的安装方法，提供丰富的自定义选项，以便根据您的需求配置 Istio。
- 我们在性能方面投入了大量精力，包括连续回归测试、大规模环境模拟和目标修复。我们对结果非常满意，并将在未来几周内详细分享。

## 下一步

虽然这是该项目的一个重要里程碑，但还有很多工作要做。在与采用者合作时，我们已经获得了很多关于下一步要关注的重要反馈。我们已经听到了关于支持混合云、安装模块化、更丰富的网络功能和大规模部署可扩展性的一致主题。我们在 1.0 版本中已经考虑到了一些反馈，在未来几个月内我们将继续积极地处理这些工作。

## 快速开始

如果您是 Istio 的新手，并希望将其用于部署，我们很乐意听取您的意见。查看我们的[文档](https://istio.io/zh/docs/)，访问我们的[聊天论坛](https://istio.rocket.chat)或访问[邮件列表](https://groups.google.com/forum/#!forum/istio-dev)。如果您想更深入地为该项目做出贡献，请参加我们的[社区会议](https://istio.io/zh/about/community)并打个招呼。

## 最后

Istio 团队非常感谢为项目做出贡献的每个人。没有你们的帮助，它不会有今天的成就。去年的成就非常惊人，我们期待未来与我们社区成员一起实现更伟大的成就。

---

[ServiceMesher 社区](http://www.servicemesher.com)负责了 Istio 官网中文内容的翻译和维护工作，目前中文内容还未完全与英文内容同步，需要手动输入 URL 切换为中文（<https://istio.io/zh>），还有很多工作要做，欢迎大家加入和参与进来。

