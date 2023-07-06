---
title: "为什么需要 Istio？"
description: "Istio 为我们带来了什么？"
date: 2018-03-19T19:32:46+08:00
draft: false
categories: ["Service Mesh"]
tags: ["Istio"]
type: "post"
mobile_toc: false
aliases: "/posts/why-do-we-need-istio"
image: "images/banner/istio-kubernetes.jpg"
---

本文译自 [Istio Why do I need it?](https://medium.com/google-cloud/istio-why-do-i-need-it-18d122838ee3)

我最近没有多少时间去玩 k8s，并承认 Istio 到底给 k8s 带来了什么方面有点迷失了。这是否会增加更多的运营开销？它是否简化了我们通常需要做的事情？这些问题都浮现在我的脑海里。

我怀疑在发布了这些内容之后，我的团队中比我更懂 k8s 的人可能会想找我谈谈…… 虽然我讲会跟团队中的成员辩论，但那将是我最喜欢的对话。

## 那么 Istio 究竟是什么？

[Istio 网站](http://istio.io/) 上说，Istio 带给你：

- HTTP、gRPC、WebSocket 和 TCP 流量的自动负载均衡。
- 通过丰富的路由规则、重试、故障转移和故障注入对流量行为进行细粒度控制。
- 支持访问控制、速率限制和配额的可拔插策略层和配置 API。
- 自动指标、日志和集群内所有流量的跟踪，包括集群入口和出口。
- 通过集群中的服务之间的强身份断言来实现服务间的身份验证。

通过在整个环境中部署一个特殊的 sidecar 代理（辅助容器），您可以将 Istio 支持添加到服务中（这给我留下了深刻的印象，如果您想做到这一点，请参阅后面的内容）。安装了 sidecar 代理之后，（微）服务之间的所有网络通信都通过这个代理。此外，所有的网络通信都是使用 Istio 的控制平面功能进行配置和管理的。

Istio 是 **Service Mesh（服务网格）**。我认为的 service mesh 定义就是“它是一个专用的基础设施层，使得服务间的通信安全、高效和可靠”

然而，如果像我一样，你从[概念文档](https://istio.io/docs/concepts/what-is-istio/overview.html) 开始看的话，上面有这样的内容：“术语 **service mesh** 通常用于描述组成这些应用程序的微服务网络以及它们之间的交互。随着服务网格的大小和复杂程度不断增加，可能会变得难以理解和管理。可能出现包括服务发现、负载平衡、故障恢复、度量和监控，以及更复杂的需求，如 A/B 测试、金丝雀发布、速率限制、访问控制和端到端身份验证。Istio 提供了一个完整的解决方案，通过对整个服务网格提供行为分析和操作控制来满足微服务应用程序的各种需求。“

读完之后你可能会像我一样困惑！最后在网上查了一圈关于什么是服务网格之后，我终于搞明白了。我最后使用的可能是一个在所有搜索到的样本里一个非代表性的共识，但这是一个合理的选择。不过有个细节确实了，就是如何将它与 k8s 等编排工具分开。Istio 需要跟 k8s 一起使用，没有 k8s 或其他容器编排工具的它就不存在了吗？它没有做编排，实际上它的是为解决管理基于微服务的解决方案中网络和操作复杂性而设计的。它涵盖的范围就像 k8s 一样！现在我真的需要继续这个帖子了。。。

所以我知道 Istio 是什么，给我们带来了什么，但它实际上解决了什么挑战呢？

从[为什么使用 Istio 页面](https://istio.io/docs/concepts/what-is-istio/overview.html) 中可以看出，它在服务网络中统一提供了许多关键功能：

- 流量管理
- 可观察性
- 强制策略
- 服务身份标识和安全

对于我来说，要真正理解 Istio 的价值，所以我使用了 [codelab](https://codelabs.developers.google.com/codelabs/cloud-hello-istio/#0) 。编写 code lab 的人真是太棒了！

Code lab 向我介绍了 Istio 控制平面的四个主要组件：

- **Pilot**：处理代理 sidecar 的配置和编程。
- **Mixer**：为您的流量处理决策并收集遥测数据。
- **Ingress**：处理来自群集外部的传入请求。
- **CA**：证书颁发机构。

查看 [Istio 架构概念](https://istio.io/docs/concepts/what-is-istio/#architecture) 页面了解这些组件如何协同工作的。

Code lab 提供了[路由规则](https://istio.io/docs/concepts/traffic-management/rules-configuration.html#route-rules) —— 流量管理部分

我还尝试了 [Istio.io](https://istio.io/docs/tasks/) 中的一些 task，因为我需要了解它如何处理那些领域的工作。

提示：如果您在完成 codelab 时也决定在四处看看，那么请将您的群集与应用程序一起启动并运行。无论如何，你会再次使用它。

所以我对它如何解决这些问题有了一个基本的了解，但是如果我使用像 GKE 这样的托管 K8s（好吧，你知道我会选那个不是吗？）使用 Istio 是否合适？

**注意**：是的，这里有更多的细节，但我主要想弄明白为什么需要使用 Istio。

**集群最终用户 / 开发人员访问**

GKE 结合使用 [IAM](https://cloud.google.com/kubernetes-engine/docs/how-to/iam-integration) 和 RBAC，是的，这里面有很多东西需要你了解。

要为您的集群用户授予比 Cloud IAM 更细粒度的权限，您可以使用 namespace 和 RBAC 来限制对特定 pod 的访问或排除对 secret 的访问。

[Istio RBAC](https://istio.io/docs/concepts/security/rbac.html) 介绍了两个侧重于服务的角色

- **ServiceRole** 定义用于访问网格中的服务的角色。
- **ServiceRoleBinding** 将角色授予主题（例如用户、组、服务）。

它们是 k8s 中的 CustomResourceDefinition（CRD）对象。但您仍然需要了解 IAM。

## 服务身份标识

GKE 可以使用 service account 来管理 [GKE 上运行的应用程序](https://cloud.google.com/kubernetes-engine/docs/tutorials/authenticating-to-cloud-platform) 可以使用哪些 GCP 服务。这些 service accout 的密钥使用 secret 存储。Pod 中运行的进程的身份标识是由 [k8s service account](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/) 与 RBAC 一起决定的。Istio 使用 [istio-auth](https://istio.io/docs/concepts/security/mutual-tls.html) ，它使用双向 TLS 提供强大的服务间和最终用户身份验证，内置身份和凭证管理。Istio-auth 使用 Kubernetes service account。

Istio 不提供任何使用 GCP service account 帮助。这还很早，但是它正在制定未来发展计划的路线图。

Istio-auth 很好，计划中的增强功能将值得等待。我对安全的复杂性感到厌烦，因为这不可避免地导致配置错误，所以我希望它与 service account 类型之间进行更加无缝的对齐！

## 网络控制

GKE（用于 k8s 版本 1.7.6 +）使用 [k8s 网络策略](https://cloud.google.com/kubernetes-engine/docs/how-to/network-policy) 来管理哪些 Pod 可以和服务通信。这是相对简单的配置。Istio 也有网络策略，但他们不是你知道和喜欢的 K8s 策略，为什么会有这样的区别呢？ [这篇文章](https://istio.io/blog/2017/0.1-using-network-policy.html) 很好地解释了这一点，所以我不会在这里重述，但是这个表格总结了不同之处以及为什么会有这样的不同。

| 项目   | Istio 策略      | 网络策略           |
| :----- | :-------------- | :----------------- |
| 层     | Service（7 层） | Network（3、4 层） |
| 实现   | Userspace       | Kernel             |
| 控制点 | Pod             | Node               |

Istio 使用 envoy 作为 sidecar 代理。Envoy 在 OSI 模型的应用层运行，所以在第 7 层。我的这篇博客将为你详细解释。

您需要两种策略类型，这是纵深防御的方法。

## 多个集群

Istio 有个非常酷的功能是 [mixer 适配器](https://istio.io/docs/concepts/policy-and-control/mixer.html#adapters) 。简而言之，它可以从底层后端进行抽象以提供核心功能，例如日志记录、监控、配额、ACL 检查等。它公开了一个一致的 API，与使用的后端无关。就像 GCS 公开了一个 API，无论您使用什么存储类别！

我认为 [mixer 适配器模型](https://istio.io/blog/2017/adapter-model.html) 博客文章中的这张图片解释了 mixer 适配器中的全部要点。

有一个[早期 demo](https://istio.io/docs/guides/integrating-vms.html) ，我认为它是 istio 最有用的特性之一，它实际上使用虚拟机来承载 codelab 中使用的评分 dbase MySQL 数据库，并将其作为 GKE 集群所属网格的一部分。使用一个网格来管理它们！

## 流量管理

如果你使用了 codelab，你会看到使用 istio 来引导使用路由规则的流量是多么容易。使用 K8s，您还可以使用金丝雀部署进行流量管理，并以类似于 istio 的方式将一定比例的流量引导至您的应用的一个版本，但 Istio 在这种情况下更灵活，方法是允许您设置细粒度流量百分比并控制流量使用 code lab 中的其他标准。

## 服务发现

服务注册在 k8s 中完成。Istio 抽象出底层的服务发现机制，并将其转换为 envoy sidecar 可消费的标准格式。

## 审计记录和监控

如果是超出 GKE 提供的标准日志记录的话，可以将 GKE 与 [StackDriver 日志记录](https://cloud.google.com/kubernetes-engine/docs/how-to/logging) 集成来收集，在持久化存储中存储`容器日志`、`系统日志`和关于群集中的活动的`事件`，例如 Pod 的调度。还可以与 [StackDriver Monitoring](https://cloud.google.com/kubernetes-engine/docs/how-to/monitoring) 集成以收集系统度量指标（度量群集的基础设施，例如 CPU 或内存使用情况）和自定义指标（特定于应用程序的指标）。

Istio 利用 prometheus 与 grafana 一起作为仪表板进行记录和监控。我喜欢 [service graph 配置](https://istio.io/docs/tasks/telemetry/servicegraph.html) ，它可以为您提供 service mesh 的图形表示。你也可以用 kibana 和 fluentd 来配合 Elasticsearch 使用。

## 那么我需要 Istio 吗？

Istio 的流量管理非常棒，mixer 适配器模型可以轻松管理覆盖多个群集和虚拟机的网格。我喜欢 Istio 是因为它可以让你进中精力思考服务，而不是那么多的 pod 和节点，并不是说你不必担心这些，而是只关注服务就好了！

如果你需要管理一个分布式集群，那么 Istio 应该在你的选择列表里。如果您需要在流量管理方面有比 k8s 提供的更多的灵活性的化那么 Istio 也很值得关注。

如果你有足够的资源来处理处于发展早期的事物，那么尽早理解 Istio 是值得的。如果你已经在使用 k8s 的话那么 istio 的学习曲线将很低。

记住它是一个建立在上层的东西，所以你仍然需要在 k8s 层做些事情，比如配置 k8s 网络策略来补充 istio 网络策略。

Istio 还处于发展的早期阶段，所以它不会做你期望的所有事情，但我们希望它会。你将无法避免的在提供商 API 和 Istio 之间来回调用才能完成一个完整的工作，所以它不是你希望的那种一站式解决方案。

Dashboard 是可视化网格配置的一种很好的方式，因为编写 YAML 会让人很快疲惫！是的，您可以设置仪表板上的控制面板来可视化度量指标，但我希望看到它与 StackDriver 集成。

因此，在总体了解 Istio 之后，我实际上很喜欢它所承诺的内容。