---
title: 云原生的设计哲学
linktitle: 云原生的设计哲学
weight: 2
description: 探讨云原生的核心设计理念和哲学思想，阐述云原生应用程序的特征和要求，以及云原生基础设施的本质区别。从分布式设计、配置管理、韧性设计等多个维度深入分析云原生的设计原则。
keywords:
- 云原生
- 基础设施
- 应用程序
- 弹性
- 故障
- 服务
- 服务器
- 设计
- 运行
- 需要
---

云原生一词已经被过度采用，许多软件都号称是云原生，各种打着云原生旗号的会议也如雨后春笋般涌现。

云原生本身甚至不能称为一种架构，它首先是一种基础设施理念，运行在其上的应用程序称作云原生应用，只有符合云原生设计哲学的应用架构才叫云原生应用架构。

## 云原生的设计理念

云原生系统的设计理念如下：

- **面向分布式设计（Distribution）**：容器、微服务、API 驱动的开发；
- **面向配置设计（Configuration）**：一个镜像，多个环境配置；
- **面向韧性设计（Resilience）**：故障容忍和自愈能力；
- **面向弹性设计（Elasticity）**：弹性扩展和对环境变化（负载）的响应；
- **面向交付设计（Delivery）**：自动化部署，缩短交付时间；
- **面向性能设计（Performance）**：响应式、并发和资源高效利用；
- **面向自动化设计（Automation）**：自动化的 DevOps 和运维；
- **面向可观测性设计（Observability）**：集群级别的日志、指标和链路追踪；
- **面向安全性设计（Security）**：安全端点、API Gateway、端到端加密；

以上设计理念很多都继承自分布式应用的设计原则。虽然有如此多的理念，但我们仍然需要明确什么是真正的云原生基础设施。不过可以先用排除法，我将解释什么不是云原生基础设施。

## 什么不是云原生基础设施？

### 不等同于公有云基础设施

云原生基础设施不等于在公有云上运行的基础设施。仅仅租用云服务器并不会使你的基础设施云原生化。管理 IaaS 的流程与运维物理数据中心本质上没有区别，将现有架构直接迁移到云上也未必能获得预期回报。

### 不仅仅是容器化应用

云原生不是指在容器中运行应用程序。Netflix 率先推出云原生基础设施时，几乎所有应用程序都部署在虚拟机中，而不是容器中。改变应用程序的打包方式并不意味着就会增加自治系统的可扩展性和优势。即使应用程序通过 CI/CD 流水线自动构建和部署，也不意味着你就能从 API 驱动部署的基础设施中受益。

### 不只是容器编排平台

运行容器编排器（例如 Kubernetes 和 Apache Mesos）也不等同于云原生。容器编排器提供了云原生基础设施所需的许多平台功能，但如果没有按预期方式使用这些功能，这意味着你的应用程序只是在一组服务器上运行，被动态调度。这是一个很好的起点，但仍有许多工作要做。

> **调度器与编排器**
>
> 术语"调度器"和"编排器"通常可以互换使用。
>
> 在大多数情况下，编排器负责集群中的所有资源利用（例如：存储、网络和 CPU）。该术语通常用于描述执行许多任务的产品，如健康检查和云自动化。
>
> 调度器是编排平台的一个子集，仅负责选择在每台服务器上运行的进程和服务。

### 不等同于微服务或基础设施即代码

云原生不是微服务或基础设施即代码。微服务意味着更快的开发周期和更小的功能单元，但单体应用程序也可以具有相同的功能，通过软件有效管理，并从云原生基础设施中受益。

基础设施即代码以机器可解析语言或领域特定语言（DSL）定义和自动化你的基础设施。传统的基础设施即代码工具包括配置管理工具（例如 Chef 和 Puppet）。这些工具在自动执行任务和提供一致性方面很有帮助，但在提供必要的抽象来描述超出单个服务器的基础设施方面存在局限性。

配置管理工具一次管理一台服务器，依靠人员将服务器提供的功能整合在一起。这使人类成为基础设施扩展的潜在瓶颈。这些工具也不会自动化构建完整系统所需的云基础设施（例如存储和网络）的其他部分。

尽管配置管理工具为操作系统资源（例如软件包管理器）提供了一些抽象，但它们没有充分抽象底层操作系统以便于轻松管理。如果工程师想要管理系统中的每个软件包和文件，这将是一个非常艰难的过程，并且对于每个配置变体都是独特的。同样，定义不存在或不正确的配置管理资源只会消耗系统资源而不能提供任何价值。

虽然配置管理工具可以帮助自动化部分基础设施，但它们无法更好地管理应用程序。我们将在后续章节中通过查看部署、管理、测试和操作基础设施的流程，探讨云原生基础设施的不同之处。

## 云原生应用程序

就像云改变了业务和基础设施之间的关系一样，云原生应用程序也改变了应用程序和基础设施之间的关系。我们需要了解与传统应用程序相比，云原生应用程序有什么不同，以及它们与基础设施的新关系。

为了建立共同的认知基础，我们需要定义"云原生应用程序"的含义。云原生与 12 因素应用程序不同，尽管它们可能共享一些相似特征。如果你想了解更多细节，推荐阅读 Kevin Hoffman 撰写的《Beyond the Twelve-Factor App》。

云原生应用程序被设计为在平台上运行，并针对弹性、敏捷性、可操作性和可观测性进行设计。弹性包容失败而不是试图阻止它们；它利用了在平台上运行的动态特性。敏捷性允许快速部署和快速迭代。可操作性从应用程序内部控制应用程序生命周期，而不是依赖外部进程和监控器。可观测性提供信息来回答有关应用程序状态的问题。

> **云原生定义**
>
> 云原生应用程序的定义仍在不断演进中。CNCF（云原生计算基金会）等组织也提供了其他定义。

云原生应用程序通过各种方法获得这些特征。具体实现通常取决于应用程序的运行环境以及企业流程和文化。以下是实现云原生应用程序所需特性的常用方法：

- 微服务架构
- 健康状态报告
- 遥测数据收集
- 弹性设计
- 声明式而非命令式

### 微服务架构

作为单个实体进行管理和部署的应用程序通常称为单体应用。在应用程序开发初期，单体应用有很多优势。它们更易于理解，允许你在不影响其他服务的情况下更改主要功能。

随着应用程序复杂性的增长，单体应用的优势逐渐减少。它们变得更难理解，失去了敏捷性，因为工程师很难推理和修改代码。

应对复杂性的最佳方法之一是将明确定义的功能分解为更小的服务，让每个服务独立迭代。这增加了应用程序的灵活性，允许根据需要更轻松地更改部分应用程序。每个微服务可以由独立的团队管理，使用合适的编程语言编写，并根据需要独立扩缩容。

只要每项服务都遵守强有力的契约，应用程序就可以快速改进和变化。当然，转向微服务架构还有许多其他考虑因素，其中最重要的是弹性通信。

我们无法涵盖转向微服务的所有考虑因素。拥有微服务并不意味着你拥有云原生基础设施。如果你想深入了解，推荐阅读 Sam Newman 的《Building Microservices》。虽然微服务是实现应用程序灵活性的一种方式，但如前所述，它们不是云原生应用程序的必需条件。

### 健康状态报告

> 停止逆向工程应用程序，开始从内部进行监控。 —— Kelsey Hightower

没有人比开发人员更了解应用程序需要什么才能以健康状态运行。长期以来，基础设施管理员都试图从他们负责运行的应用程序中摸索出"健康"的定义。如果不真正了解应用程序的健康状况，他们尝试在应用程序不健康时进行监控并发出警报，这往往是脆弱和不完整的。

为了提高云原生应用程序的可操作性，应用程序应该暴露健康检查。开发人员可以将其实现为命令或进程信号，让应用程序在执行自我检查后响应，或者更常见的是：通过应用程序提供 Web 服务，返回 HTTP 状态码来检查健康状态。

> **Google Borg 示例**
>
> Google 的 Borg 论文中列出了健康报告的例子：
>
> 几乎每个在 Borg 下运行的任务都包含一个内置的 HTTP 服务器，该服务器发布有关任务运行状况和数千个性能指标（如 RPC 延迟）的信息。Borg 监控健康检查 URL 并重新启动不及时响应或返回 HTTP 错误代码的任务。其他数据由监控工具跟踪，用于仪表板和服务级别目标（SLO）违规告警。

将健康责任转移到应用程序中使应用程序更容易管理和自动化。应用程序应该知道它是否正常运行以及它依赖什么（例如访问数据库）来提供业务价值。这意味着开发人员需要与产品经理合作来定义应用程序服务的业务功能并相应地编写测试。

提供健康检查的应用程序示例包括 ZooKeeper 的 `ruok` 命令和 etcd 的 HTTP `/health` 端点。

应用程序不仅仅有健康或不健康的状态。它们会经历启动和关闭过程，在这个过程中应该通过健康检查报告它们的状态。如果应用程序能让平台准确了解它所处的状态，平台就更容易知道如何操作它。

一个很好的例子是当平台需要知道应用程序何时可以接收流量。在应用程序启动时，如果它不能正确处理流量，就应该表现为未就绪。此额外状态将防止应用程序过早终止，因为如果健康检查失败，平台可能会认为应用程序不健康，并反复停止或重新启动它。

应用程序健康只是能够自动化应用程序生命周期的一部分。除了知道应用程序是否健康，还需要知道应用程序正在执行什么工作。这些信息来自遥测数据。

### 遥测数据收集

遥测数据是进行决策所需的信息。遥测数据可能与健康报告重叠，但它们有不同的用途。健康报告通知我们应用程序生命周期状态，而遥测数据通知我们应用程序业务目标。

你测量的指标有时称为服务级别指标（SLI）或关键性能指标（KPI）。这些是特定于应用程序的数据，可以确保应用程序的性能处于服务级别目标（SLO）内。

遥测和指标用于解决以下问题：

- 应用程序每分钟收到多少请求？
- 有错误吗？
- 应用程序延迟是多少？
- 订单处理需要多长时间？

通常会将数据采集或推送到时间序列数据库（例如 Prometheus 或 InfluxDB）进行聚合。遥测数据的唯一要求是它能被收集数据的系统格式化。

至少，建议实施指标的 RED 方法，该方法收集应用程序的速率、错误和持续时间。

**请求速率（Rate）**

收到了多少个请求

**错误（Errors）**

应用程序有多少错误

**持续时间（Duration）**

收到响应需要多长时间

遥测数据应该用于告警而非健康监测。在动态的、自我修复的环境中，我们更少关注单个应用程序实例的生命周期，更多关注整体应用程序 SLO。健康报告对于自动应用程序管理仍然很重要，但不应该用于呼叫工程师。

如果 1 个实例或 50 个应用程序实例不健康，只要满足应用程序的业务需求，我们可能不会收到告警。指标让你知道是否符合 SLO，应用程序的使用方式以及对于你的应用程序来说什么是"正常"的。告警有助于将系统恢复到已知的良好状态。

> 如果它变化，我们就跟踪它。有时候我们会为尚未变化的东西绘制图表，以防万一它决定变化。
>
> ——Ian Malpass，《Measure Anything, Measure Everything》

告警也不应该与日志记录混淆。日志用于调试、开发和观察模式，它暴露了应用程序的内部功能。指标有时可以从日志计算（例如错误率），但需要额外的聚合服务（例如 Elasticsearch）和处理。

### 弹性设计

一旦你有了遥测和监控数据，就需要确保你的应用程序对故障有适应能力。弹性是基础设施的责任，但云原生应用程序也需要承担部分工作。

传统基础设施被设计为抵抗失败。硬件需要多个硬盘驱动器、电源以及全天候监控和部件更换以保持应用程序可用。使用云原生应用程序，应用程序有责任接受失败而不是避免失败。

> 在任何平台上，尤其是在云中，最重要的特征是其可靠性。
>
> ——David Rensin

设计具有弹性的应用程序本身就可以写成一本书。我们将考虑云原生应用程序中弹性的两个主要方面：为失败而设计和优雅降级。

#### 为失败而设计

唯一永远不会失败的系统是那些关乎生命的系统（例如心脏起搏器和刹车系统）。如果你的服务永远不能停止运行，你需要花费太多时间设计它们来抵抗故障，而没有足够时间增加业务价值。你的 SLO 决定服务需要多长时间可用。你花费在工程设计上超出 SLO 要求的正常运行时间的任何资源都是被浪费的。

你应该为每项服务测量两个值：平均无故障时间（MTBF）和平均恢复时间（MTTR）。监控和指标可以让你检测是否符合 SLO，但运行应用程序的平台是保持高 MTBF 和低 MTTR 的关键。

在任何复杂系统中，都会有失败。你可以管理硬件中的某些故障（例如 RAID 和冗余电源），以及基础设施中的某些故障（例如负载均衡器）。但是因为应用程序知道它们何时健康，所以它们也应该尽可能地管理自己的失败。

设计一个预期失败的应用程序将比假定可用性的应用程序更具防御性。当故障不可避免时，应用程序中会内置额外的检查、故障模式和日志。

知道应用程序可能失败的每种方式是不可能的。假设任何事情都可能且将会失败，这是云原生应用程序的一种模式。

你的应用程序的最佳状态是健康状态。第二好的状态是失败状态。其他一切都是非确定性的，难以监控和故障排除。正如 Honeycomb 首席执行官 Charity Majors 在她的文章《Ops: It's Everyone's Job Now》中指出的："分布式系统永远不会完全正常工作；它们处于部分降级服务的持续状态。接受失败，设计弹性，保护和缩小关键路径。"

无论发生什么故障，云原生应用程序都应该是适应性的。它们预期失败，所以在检测到时进行调整。

有些故障不能也不应该被设计到应用程序中（例如网络分区和可用区故障）。平台应该自主处理未集成到应用程序中的故障域。

#### 优雅降级

云原生应用程序需要有一种方法来处理过载，无论是应用程序本身还是相关服务的负载过重。处理负载的一种方式是优雅降级。《Site Reliability Engineering》一书中描述了应用程序的优雅降级，即在负载过重的情况下提供"不如正常响应准确或包含较少数据的响应，但计算更容易"。

减少应用程序负载的某些方面由基础设施处理。智能负载均衡和动态扩展可以提供帮助，但在某些情况下，你的应用程序可能承受的负载比它能处理的更多。云原生应用程序需要认识到这种必然性并做出相应反应。

优雅降级的重点是允许应用程序始终为请求返回答案。如果应用程序没有足够的本地计算资源，并且依赖服务没有及时返回信息，这种做法是正确的。依赖于一个或多个其他服务的服务应该能够响应请求，即使依赖服务不可用。当服务降级时，返回部分答案或使用本地缓存中的旧信息是可能的解决方案。

尽管优雅降级和失败处理都应该在应用程序中实现，但平台的多个层面应该提供帮助。如果采用微服务，网络基础设施就成为需要在提供应用弹性方面发挥积极作用的关键组件。

> **可用性数学**
>
> 云原生应用程序需要在基础设施之上构建平台，以使基础设施更具弹性。如果你希望将现有应用程序"提升并转移"到云中，应该检查云提供商的服务级别协议（SLA），并考虑在使用多个服务时会发生什么。
>
> 让我们以运行应用程序的云进行假设。
>
> 计算基础设施的典型可用性是每月 99.95% 的正常运行时间。这意味着你的实例每天可能停机 43.2 秒，并且仍在云服务提供商的 SLA 范围内。
>
> 另外，实例的本地存储（例如 EBS 卷）也具有 99.95% 的可用性。如果幸运的话，它们会同时故障，但最坏情况是它们可能在不同时间停机，让你的实例只有 99.9% 的可用性。
>
> 你的应用程序可能还需要数据库，与其自己安装一个可能停机 1 分 26 秒（99.9% 可用性）的数据库，不如选择可靠性为 99.95% 的托管数据库。这使你的应用程序可靠性达到 99.85%，或者每天可能发生 2 分 9 秒的停机时间。
>
> 将可用性相乘可以快速了解为什么应该以不同方式处理云。真正糟糕的部分是，如果云提供商不符合其 SLA，它将退还账单中一定比例的费用。
>
> 虽然你不必为停机付费，但我们不知道世界上有任何一个企业是依靠云计算信用额度运营的。如果你的应用程序的可用性不足以超过你收到的信用额度价值，那么你应该认真考虑是否应该运行这个应用程序。

### 声明式而非响应式

因为云原生应用程序被设计为在云环境中运行，所以它们与基础设施以及相关依赖应用程序的交互方式不同于传统应用程序。在云原生应用程序中，与任何事物的通信都需要通过网络进行。很多时候，网络通信通过 RESTful HTTP 调用完成，但也可以通过其他接口实现，比如远程过程调用（RPC）。

传统应用程序通过向消息队列发送消息、在共享存储上写入文件或触发本地 shell 脚本来执行自动化任务。通信方法基于发生的事件做出反应（例如，如果用户点击提交，运行提交脚本），通常需要存在于同一物理或虚拟服务器上的信息。

> **Serverless**
>
> 无服务器平台是云原生的，被设计为对事件做出反应。它们在云中运行良好的原因是通过 HTTP API 进行通信，是单一用途的函数，并且在调用中是声明性的。平台还使它们可扩展并可从云内访问。

传统应用程序中的响应式通信通常是构建弹性的一种尝试。如果应用程序以响应式方式在磁盘上或消息队列中写入文件，然后应用程序死亡，该消息或文件的结果仍然可以完成。

这里并不是说不应该使用像消息队列这样的技术，而是说在动态且经常出现故障的系统中，不能将它们作为唯一的弹性层来依赖。从根本上说，在云原生环境中，应用程序之间的通信方法应该有所变化——这不仅是因为存在其他方法来构建通信弹性，而且因为如果要让传统通信方法在云中复制，我们往往需要做更多工作。

当应用程序可以信任通信的弹性时，它们应该放弃响应式并使用声明式。声明式通信信任网络会将消息送达。它也相信应用程序将返回成功或错误。这并不是说让应用程序观察变化不重要。Kubernetes 的控制器对 API 服务器做的就是这个。但是，一旦发现变更，它们就会声明一个新状态，并相信 API 服务器和 kubelet 会做必要的事情。

声明式通信模型由于多种原因而变得更加健壮。最重要的是，它规范了通信模型，并将功能实现（如何从某种状态到达期望状态）从应用程序转移到远程 API 或服务端点。这有助于简化应用程序，并使它们彼此的行为更具可预测性。

## 云原生应用程序如何影响基础设施？

希望你现在可以了解云原生应用程序与传统应用程序的不同。云原生应用程序不能直接在 PaaS 上运行或与服务器的操作系统紧密耦合。它们期望在一个拥有大多数自治系统的动态环境中运行。

云原生基础设施在 IaaS 之上创建了一个平台，提供自主的应用程序管理。该平台建立在动态创建的基础设施之上，以抽象出单个服务器并促进动态资源分配调度。

自动化与自治不同。自动化使人类对他们采取的行动产生更大影响。

云原生关于不需要人类做出决定的自治系统。它仍然使用自动化，但只有在决定了所需操作之后。只有在系统不能自动确定正确做法时才应该通知人类。

具有这些特征的应用程序需要一个能够实际监控、收集指标并在发生故障时做出反应的平台。云原生应用程序不依赖于人员设置 ping 检查或创建系统日志规则。它们需要从选择基本操作系统或软件包管理器的过程中提取自助服务资源，并依靠服务发现和强大的网络通信来提供丰富的功能体验。

## 参考资料

- [《Cloud Native Infrastructure》, O'Reilly 免费电子书](https://blog.heptio.com/i-still-remember-the-first-time-i-logged-into-a-production-server-over-ssh-and-telling-myself-i-53ab1d1e7f46)
- [CNCF Cloud Native Definition](https://github.com/cncf/toc/blob/main/DEFINITION.md)
- [The Twelve-Factor App](https://12factor.net/)
- [Site Reliability Engineering Book](https://sre.google/books/)
