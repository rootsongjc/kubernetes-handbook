---
title: "什么是 Day-2 Operation？"
description: "在 IstioCon 2021 上，Istio 社区确定了 2021 年的社区的工作重点是 Day-2 Operation，很多人问我这个词是什么意思。我查了下中文互联网上，没有对这个词的解释，我在网上找到了一些解释，我发现大部分文章的源头都指向了这篇 Defining Day-2 Operations。因此，在此我将问翻译一下，同时再加上一些我自己的见解。"
date: 2021-03-20T21:56:04+08:00
draft: false
tags: ["文化"]
categories: ["culture"]
type: "post"
bg_image: "images/backgrounds/page-title.jpg"
image: "images/banner/day2.jpg"
---

在 IstioCon 2021 上，Istio 社区确定了 2021 年的社区的工作重点是 Day-2 Operation，很多人问我这个词是什么意思。我查了下中文互联网上，没有对这个词的解释，我在网上找到了一些解释，我发现大部分文章的源头都指向了这篇 [Defining Day-2 Operations](https://dzone.com/articles/defining-day-2-operations)。因此，在此我将问翻译一下，同时再加上一些我自己的见解。

## 定义 Day-2 Operation

Day-2 Operation 是系统为组织产生结果的地方。因此，要不断寻求 Day-2 Opeation 的改进，以实现效益最大化。

Day-2 Operation 不一定是指第2天的行动。一旦 "某物 "进入行动，"Day-2 Operation "是指在这个 "某物 "没有被杀死或被 "其他东西 "取代之前的剩余时间段。如下图中展示的软件的生命周期中，从软件被安装之后到被卸载之前的那段时间。

![Day-2 Operation](https://tva1.sinaimg.cn/large/008eGmZEly1gorlqmukkij31im0kote7.jpg)

当我们审视一个业务流程、应用程序或IT基础设施生命中的各个阶段时，有些人喜欢把它们描绘成一个循环过程。我相信这是因为人们倾向于使用 "应用程序的生命周期 "这个词，并以某种方式陷于相信图中必须循环回到起点。各个阶段通常是在时间上向前推进的，而不是把你带回起点。

假定 "X "称为一个组织或实体所需要的东西，可能是一个业务流程，一个应用程序，或者是一些IT基础设施。从技术上讲，每当有人设想X的时候，总会有一个起点——我们称它为 "零日"（这是高中物理的管理，时间的起点通常是T0）。 Day-Zero可能不是一天：它是提出并记录一套完整的X需求所需的时间段，这些活动可能包括高层设计、记录并向某人推销利益、撰写商业案例、寻求资金等。

这个过程的下一步是构建和部署。Day-1包括所有活动，从详细（或底层）设计开始，到构建、测试、提出任何所需的流程和人员，以支持X，使组织受益。在许多情况下，这里可能还涉及一些采购活动。一旦它被安装、设置、配置和批准（"好的开始"），X就被认为是 "上线 "或 "开放业务"。

从这一点开始，直到X退役、死亡或被替换，我们有Day-2操作。这包括保持X运行的一系列活动，照看和支持X，使其以最佳状态运行，确保X的运行和交付结果符合最初的意图和期望。监控利用率、确保可用性和成本优化是在通常的内务管理活动基础上增加的，以保持X以 "最佳 "的方式运行。

随着我们周围世界的要求发生变化，组织要决定对X的调整或升级，这些都是必然需要的，是被称为整个大修还是仅仅是升级。如果是整体大修，我们可以假设X已经退役并被新的系统Y所取代。如果新的X只是比以前的X有了更大的改进，那么Day-2 Operation将继续进行，并包含了所有的活动，以逐步改进X。

一个简短的补充说明："不可变系统 "的概念，即人们倾向于通过不允许变化但总是部署新系统来提高可用性，这与上述概念并不冲突。管理不可变系统的过程成为Day-2 Operation的一部分。

对于大多数企业来说，Day-2 Operation是重复性的。但这是系统为组织产生结果的地方。因此，在Day-2 Operation中不断寻求改进，一个能带来最大效益的改进应该是很自然的。

## 评论

Day-2 Operation 目前在中文中暂无统一翻译，我暂且将其翻译为“Day-2 运营”，这样可能会看起来更像是个敏捷词汇，跟“精益运营”比较像。这个命名方式可能来自物理（T0，T1，T2，这样来划分时间段），也可能是来自军事术语。[Day 0/Day 1/Day 2 - the software lifecycle in the cloud age](https://codilime.com/day-0-day-1-day-2-the-software-lifecycle-in-the-cloud-age/) 这篇文章中对云时代的软件生命周期 Day0、Day1、Day2 做了比较完整的解释。

在IT领域，Day0、Day1、Day2 指的是软件生命周期的不同阶段。在军事术语中，Day0 是训练的第一天，新兵进入成长阶段。在软件开发中，它代表着设计阶段，在这个阶段，项目需求被指定，解决方案的架构被决定。

Day1 涉及开发和部署在 Day0 阶段设计的软件。在这个阶段，我们不仅要创建应用程序本身，还要创建它的基础设施、网络、外部服务，并实现这一切的初始配置。

Day2 是产品发货或提供给客户的时间。在这里，大部分精力都集中在维护、监控和优化系统上。分析系统的行为并做出正确的反应是至关重要的，因为由此产生的反馈循环会一直应用到应用程序的寿命结束。在云时代这三个阶段跟云之前有很大的不同。

软件准备好后，就开始上线，客户开始使用。Day2 从这里开始，介绍包括软件维护和客户支持在内的内容。软件本身要不断发展，以适应不断变化的需求和客户的要求。在 Day2，主要关注的是建立一个反馈循环。我们监控应用的运行情况，收集用户的反馈意见，并将其发送给开发团队，开发团队将在产品中实现并发布新版本。军事术语 Observe-Orient-Decid-Act 恰好能体现这一阶段的工作内容。

- 观察：从监控系统中获取信息（资源使用和指标、应用性能监控）。
- 定位：对问题进行根本原因分析。
- 决定：找到解决出现的问题的方法。
- 行动：实施解决方案。

如同在作战过程中，这个循环不断重复，正如下图中展示的那样。

![](https://tva1.sinaimg.cn/large/008eGmZEly1gormccennnj31gi0u0nae.jpg)

监控程序是基于服务水平协议（SLA）中定义的要求。SLA基于服务水平目标（SLO），它代表了我们的服务水平指标（SLI）的状态。自动化和监控是解决第2天责任的关键。

有几类工具可以帮助完成 Day2的工作。应用性能监控（APM）类组软件，帮助IT管理员监控应用性能，从而提供高质量的用户体验。在这里我们可以说出Datadog、Dynatrace、SignalFX或Nutanix Xi Epoch。还有一些自动化和编排工具，如Ansible或Kubernetes，它们有助于管理应用环境。这些工具的应用与Day1 的工作相重叠。最后，JIRA 或 GItHub 系统处理客户服务，使用户能够报告与他们正在运行的应用程序有关的问题。

## 参考

- [Defining Day-2 Operations - ozone.com](https://dzone.com/articles/defining-day-2-operations)
- [What is "Day-2" - about.gitlab.com](https://about.gitlab.com/solutions/day-2-ops/)
- [Day 0/Day 1/Day 2 - the software lifecycle in the cloud age - codilime.com](https://codilime.com/day-0-day-1-day-2-the-software-lifecycle-in-the-cloud-age/)