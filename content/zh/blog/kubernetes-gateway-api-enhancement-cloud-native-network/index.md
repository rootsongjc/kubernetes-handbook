---
title: "Kubernetes Gateway API 如何增强云原生网络"
draft: false
date: 2023-11-09T17:10:49+08:00
description: "我很高兴呈现 Istio 的最新版本— Istio 1.19。这篇博客将概述此版本中的更新内容。"
categories: ["Kubernetes"]
tags: ["Istio","Gateway","Gateway API","Kubernetes","Backstage"]
type: "post"
image: "images/banner/gateway-api-network.jpg"
---

上周 Kubernetes Gateway API 的[正式发布公告](https://kubernetes.io/blog/2023/10/31/gateway-api-ga/)标志着 Kubernetes 生态系统内 Gateway 能力的重要里程碑。与此同时，Kubernetes 社区一致认同[Backstage](https://backstage.io/docs/features/kubernetes/)是内部开发平台和门户的领先解决方案。Kubernetes Gateway API 和 Backstage 都从一开始就鼓励社区的可扩展性。可以说 API Gateway 的出现为增强 Kubernetes 网络提供了巨大的机会。

## Gateway API vs Istio 服务网格

不过也有人对 Gateway API 与 Istio 服务网格的关系存在疑问。对于 Gateway API 和 Istio 服务网格，两者都是为了解决 Kubernetes 网络中的问题。然而，Gateway API 着重于提供一种标准化和简化的方式来配置和部署 Ingress 和 Egress，是一个更加通用的 API。另一方面，Istio 服务网格更关注于服务到服务的通信，提供丰富的流量管理，安全，策略和遥测功能。

## Kubernetes Gateway API 的未来

Kubernetes Gateway API 代表了 API Gateway 的关键基础，引入了一种标准，基于角色的，高度适应性的方法来配置和部署 Gateway。Kubernetes Gateway API 相比现有的 Kubernetes Ingress 的显著改进之一是其基于角色的 API 结构。这使得基础设施，平台和应用程序领域的各种角色能够拥有直接与他们的用例相关的 API 的各个方面。Gateway API 的另一个关键特性是其针对可扩展性的设计 - API 专注于核心 Gateway 和路由用例，具有扩展附加能力的可能性，例如安全性，速率限制和转换。

## 什么是 Backstage？

Backstage 是一个开源的开发者平台，它集成了所有开发者需要的服务，提供了一个统一的视图。这包括版本控制系统、持续集成/持续部署（CI/CD）系统、监控、日志、警报和文档。它旨在让开发者更高效地进行日常任务，而无需在多个工具之间切换，它也可以帮助开发者更好地理解和管理他们的软件。

![Backstage UI](backstage-ui.png)

Backstage 可以应用在多种使用场景中：

- **作为服务目录**：Backstage 的软件目录功能可以帮助开发者找到并了解公司内部的所有服务和应用。
- **作为自动化工具**：Backstage 的软件模板可以自动化 API 上线流程，使得开发者能够更快速、更安全地部署他们的 API。
- **提供中心化的 API 文档**：Backstage 的 Tech Docs 功能可以提供中心化的 API 文档，使得开发者能够在一个地方查找所有的 API 文档，而无需在多个工具间切换。
- **作为开发者门户**：Backstage 可以集成多种开发工具，提供一站式的开发者服务，简化开发者的工作流程。

Backstage 通过其[软件目录](https://backstage.io/docs/features/software-catalog/)用于发现 API，[软件模板](https://backstage.io/docs/features/software-templates/)用于提供带有防护栏的自动 API 上线流程，以及[Tech Docs](https://backstage.io/docs/features/techdocs/)用于提供 API 文档的中心用例，用于围绕 API Gateway 的协作。

Backstage 的目标是简化开发者工作流程，提供一站式的解决方案，它使开发者能够在一个平台上查找他们需要的所有信息，而不是在多个工具间切换。此外，Backstage 可以让开发团队专注于编码，而不是管理工具。它还支持多种插件，可以根据团队的需求进行定制。

## 关于未来

Backstage 和 Kubernetes Gateway API 已经牢固地将自己建立为云原生 API Gateway 的基础支柱，两个项目都在各自的路线图中充满创新。其中最有趣的领域是 Kubernetes Gateway API 超越其传统的南北入口能力，包括东西服务至服务通信，通过引入[GAMMA API](https://developer.gamma.co.uk/guides/overview.html)。在真实的流量在每个方向上流动的情况下，为南北和东西流量提供单一基础将有助于提高任何容器化应用的安全性，弹性和可观察性。
