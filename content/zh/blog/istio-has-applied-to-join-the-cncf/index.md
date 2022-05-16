---
title: "Istio 捐献给 CNCF 意味着什么？"
draft: false
date: 2022-04-26T09:27:49+08:00
description: "来自 Tetrate CEO、Istio 联合创始人 Varun Talwar 的解读。"
categories: ["Istio"]
tags: ["Istio","Tetrate"]
type: "post"
image: "images/banner/istio-apply-cncf.webp"
---

在 2022 年 4 月 25 日， IstioCon 2022 开幕的当天，Istio 社区宣布正在[申请将项目捐献给 CNCF](https://istio.io/latest/blog/2022/istio-has-applied-to-join-the-cncf/)，这是 Istio 项目的一个里程碑，企业级服务网格公司 Tetrate 的 CEO/Istio 项目联合创始人 Varun Talwar 对此进行了解读。

以下是来自 Varun 对 Istio 捐献给 CNCF 的[解读](https://www.tetrate.io/blog/istio-has-applied-to-join-the-cncf/)。

------

将 Istio 纳入 CNCF，使得 Istio 和 Envoy 的发展更容易同步推进。它还有助于将 Istio 与 Envoy 一起定位为 CNCF 验证的 "云原生技术栈" 的一部分。根据 CNCF 的年度[调查](https://www.cncf.io/reports/cncf-annual-survey-2021/)，到目前为止，Istio 是生产中最受欢迎和使用最多的服务网格。有 20 多家不同的公司在推动 Istio 社区的发展，这一宣布为 CNCF 管理下的持续创新和增长创造了条件。

### 2016：Istio 的起源

我想借此机会解释一下 Istio 的起源。Istio 来自谷歌的 API 平台团队，名为 One Platform。(今天，具有讽刺意味的是，Istio 是美国政府项目 [Platform One](https://www.tetrate.io/blog/tetrate-first-to-provide-hardened-istio-to-dods-iron-bank/) 的一部分，它使用 Tetrate 产品和服务）。一个平台利用了谷歌所有的基础设施优势（stubby、monarch、loas 等），并增加了最初的服务管理经验，并将其全部暴露给应用团队。

每个团队都会编写他们的方案和方法，并定义他们的 "One Platform API"。一旦与 API 平台团队达成一致，各团队就不必再处理任何跨领域的问题，因为 Istio 处理了这些服务：流量管理、弹性、可观察性（使用具有一致名词的每个服务的预建仪表板）、认证、授权、速率限制等等。

Istio 的想法来自于此；我们基本上采用了 One Platform 的想法，将 Envoy 加入其中（作为一个更好的数据平面），并将其与 LOAS 服务身份概念相结合，也就是今天世人所知的 Spiffe）。我们把这个想法告诉了 12 家公司，他们都很喜欢这个想法。这些公司包括大型互联网公司、金融服务公司和科技公司，特别是 SaaS 供应商。

### 2017：形成核心

2017 年 5 月的，Istio 在 Gluecon 上[首次公布](https://cloud.google.com/blog/products/gcp/istio-modern-approach-to-developing-and)。0.1 展示了 Istio 的潜力，引发了大量的关注和讨论。

### 2018-2019：稳定核心，增加能力

接下来的两年里，我们收集了客户的需求，将使用反馈内化，并稳定了核心功能。此外，我们还做出了一些关键的架构决定，如定义多集群模型，并将代码重新架构为一个单一的二进制文件，以方便使用。

### 2020：团结社区

随着 Istio 的采用和用户生态系统的发展，人们对管理和商标保护的担忧也越来越大。然而，正如我们在[这里](https://www.tetrate.io/blog/istio-ouc/)所提到的，作为一个社区保持团结是项目成功的关键。我可以自豪地说，Istio 就是这样做的。因此，今天加入 CNCF 的行动是发展社区和建立最终用户信任的又一步骤。

### 2021：向 Wasm 和其他领域发展

人们对加入其他基础设施，如虚拟机、功能和裸机工作负载，以及使用 Wasm 等技术的定制和其他功能作为本地 API 的兴趣越来越大，这样用户就不必再使用 Envoy 过滤器了。2021 年见证了其中一些功能的建立和推广。

"Varun Talwar 是项目的创始人之一，他一直认为 Istio 是云原生生态系统的一个重要组成部分。今天的公告验证了他对项目的愿景，我要感谢 Tetrate 成为 Istio 和我们社区的有力支持者。"——Louis Ryan（Istio 联合创始人，谷歌工程负责人）

### 零信任的基础

关于零信任的话题已经有很多讨论，但很少有明确的说法。正如 Eric Brewer 今天在 IstioCon 的[主题演讲](https://events.istio.io/istiocon-2022/sessions/zero-trust-istio/)中提到的，Istio 正在成为零信任的一个重要组成部分。其中最主要的是面向身份的控制，而不是面向网络的控制。这方面的核心原则在谷歌白皮书[《BeyondProd：云原生安全的新方法》](https://cloud.google.com/blog/products/identity-security/beyondprod-whitepaper-discusses-cloud-native-security-at-google)。

然而，作为一个行业，这里有更多的事情要做。我们需要确保我们可以把应用用户和数据服务都带进来。如果我们能将身份概念扩展到用户，并为我们提供灵活而丰富的策略机制来指定、监控和跟踪访问控制，我们就能达到一个可操作的零信任结构 —— 一个将用户、服务和数据统一到一个管理层的结构。我在 2020 年为美国国家标准与技术研究院（NIST）举办的围绕信任云原生应用的主题演讲中也提到了这一点。这就是为什么我们在 Tetrate 创建了 [Tetrate Service Bridge](https://www.tetrate.io/tetrate-service-bridge/)—— 一个管理平面，使大型组织可操作。

Tetrate Service Bridge 的基础是：

- 用户、服务和数据的身份。每个人都有一个加密身份，构成所有政策的骨干。
- 策略和访问控制。定义 Istio 策略，也包括应用和组织策略，包括用户和设备，以及大规模管理它们的能力。
- 自动化。在运行时自动化、测量和持续监测策略的能力。

如果我们能让企业以这种方式为云原生工作负载部署和运营安全，我们就能作为一个行业取得巨大进步。

### 人才

归根结底，没有高素质、富有创造性的人才，任何项目或技术都不会成为主流。在 Tetrate，我们相信我们需要对社区进行有关这项技术的教育，并为负责任的采用路径做出贡献。因此，我们提供世界级的认证和免费的在线培训课程，使社区中的任何人都可以在 [academy.terate.io](https://academy.tetrate.io/) 轻松参加 Istio 和 Envoy 的初级和高级课程。

我们 Tetrate 的所有人，特别是我自己，都期待着下一步的发展，我们将始终支持 Istio 项目和社区。
