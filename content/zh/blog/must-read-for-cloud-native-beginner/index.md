---
title: "云原生初学者入门必读"
description: "这篇文章将助于各位有志于从事云原生领域工作或需要了解该领域背景的人群快速入门 Kubernetes 和云原生。"
date: 2020-10-18T14:18:40+08:00
draft: false
tags: ["云原生","Kubernetes","Docker","Service Mesh"]
categories: ["云原生"]
type: "post"
bg_image: "images/backgrounds/page-title.jpg"
image: "images/banner/beginner.jpg"
---

## 为什么写这篇文章

看到这个标题后，大家可能会问“都已经 2020 年了，Kubernetes 开源有 6 年时间了，为什么还要写一篇 Kubernetes 入门的文章？”我想说的是，Kubernetes 还远远没有达到我们想象的那么普及。众多的开发者，平时忙于各自的业务开发，学习新技术的时间有限；还有大量的学生群体，可能还仅仅停留在“知道有这门技术”的阶段，远远没有入门。这篇文章将助于各位有志于从事云原生领域工作或需要了解该领域背景的人群快速入门 Kubernetes 和云原生。

因为云原生的知识体系过于庞杂，本文主要讲解容器、Kubernetes 及服务网格的入门概念，关于云原生的更多细节将在后续文章中推出。另外大家也可以关注云原生社区推出的 [云原生知识图谱](https://github.com/cloudnativeto/cloudnative-knowledge-map) 项目，进一步了解云原生。

## 引言

[Kubernetes](https://kubernetes.io/) 一词来自希腊语，意思是“飞行员”或“舵手”。这个名字很贴切，Kubernetes 可以帮助你在波涛汹涌的容器海洋中航行。

Kubernetes 是做什么的？什么是 Docker？什么是容器编排？Kubernetes 是如何工作和扩展的？你可能还有很多其他的问题，本文将一一为你解答。

这篇文章适合初学者，尤其是那些工作忙碌，没有办法抽出太多时间来了解 Kubernetes 和云原生的开发者们，希望本文可以帮助你进入 Kubernetes 的世界。

简而言之，Kubernetes 提供了一个平台或工具来帮助你快速协调或扩展容器化应用，特别是在 [Docker](https://docker.com/) 容器。让我们深入了解一下这些概念。

## 容器和容器化

那么什么是容器呢？

要讨论容器化首先要谈到虚拟机 (VM)，顾名思义，虚拟机就是可以远程连接的虚拟服务器，比如 AWS 的 EC2 或阿里云的 ECS。

接下来，假如你要在虚拟机上运行一个网络应用——包括一个 MySQL 数据库、一个 Vue 前端和一些 Java 库，在 Ubuntu 操作系统 (OS) 上运行。你不用熟悉其中的每一个技术——你只要记住，一个应用程序由各种组件、服务和库组成，它们运行在操作系统上。

现在，将应用程序打包成一个虚拟机镜像，这个镜像中包括了 Ubuntu 操作系统。这使得虚拟机变得非常笨重——通常有几个 G 的大小。

虚拟机镜像包含了整个操作系统及所有的库，对应用程序来说，这个镜像过于臃肿，其中大部分组件并没有被应用程序直接调用。如果你需要重新创建、备份或扩展这个应用程序，就需要复制整个环境（虚拟机镜像），在新环境中启动应用通常需要几十秒甚至几分钟时间。如果你想单独升级应用中的某个组件，比如说 Vue 应用，就需要重建整个虚拟机镜像。另外，如果你的两个应用依赖同一个底层镜像，升级底层镜像会同时影响这两个应用，而有时候，你只需要升级其中一个应用的依赖而已。这就是所谓的“依赖陷阱”。

解决这个问题的办法就是容器。容器是继虚拟机之后更高层次的抽象，在这层抽象中，整个应用程序的每个组件被单独打包成一个个独立的单元，这个单元就是所谓的容器。通过这种方式，可以将代码和应用服务从底层架构中分离出来，实现了完全的可移植性（在任何操作系统或环境上运行应用的能力）。所以在上面的例子中，Ubuntu 操作系统就是一个单元（容器）。MySQL 数据库是另一个容器，Vue 环境和随之而来的库也是一个容器。

但是，MySQL 数据库是如何自己“运行”的？数据库本身肯定也要在操作系统上运行吧？没错！

更高层次的容器，比如 MySQL 容器，实际上会包含必要的库来与底层的操作系统容器通信和集成。所以你可以把容器看成是整个应用堆栈中的一层，每层都依赖于下层的单元。而这就类似于船舶或港口中集装箱的堆叠方式，每个容器的稳定性都依赖于下面的容器的支持。所以应用容器的核心是一个受控的执行环境。它们允许你从头开始定义整个环境，从操作系统开始，到你要使用的各个版本的库，再到你要添加的代码版本。

与容器相关的一个重要概念是**微服务**。将应用程序的各个组件拆分并打包成独立的服务，这样每个组件都可以很容易地被替换、升级、调试。上面的例子中，我们会为 Vue 前端创建一个微服务，为 MySQL 数据库创建另一个微服务，为 Java 中间件部分创建另一个微服务，以此类推。很明显，微服务与容器化是相辅相成的。

## 从 Docker 开始

现在你已经对容器有一定了解了吧？Docker 是最常用的容器化工具，也是最流行的容器运行时。

Docker 开源于 2013 年。用于打包和创建容器，管理基于容器的应用。所有 Linux 发行版、Windows 和 macOS 都支持 Docker。

还有其他的容器化工具，如 [CoreOS rkt](https://coreos.com/rkt/)、[Mesos Containerizer](http://mesos.apache.org/documentation/latest/mesos-containerizer/) 和 [LXC](https://linuxcontainers.org/)。但是目前，绝大多数的容器化应用都是在 Docker 上运行的。

## 再到 Kubernetes

首先，简单介绍一下历史。Kubernetes 是 Google 基于其内部容器调度平台 Borg 的经验开发的。2014 年开源，并作为 CNCF（云原生计算基金会）的核心发起项目。

那么 Kubernetes 又跟容器是什么关系呢？让我们再回到上面的例子。假设我们的应用爆火，每天的注册用户越来越多。

现在，我们需要增加后端资源，使浏览我们网站的用户在浏览页面时加载时间不会过长或者超时。最简单的方式就是增加容器的数量，然后使用负载均衡器将传入的负载（以用户请求的形式）分配给容器。

这样做虽然行之有效，但也只能在用户规模有限的情况下使用。当用户请求达到几十万或几百万时，这种方法也是不可扩展的。你需要管理几十个也许是几百个负载均衡器，这本身就是另一个令人头疼的问题。如果我们想对网站或应用进行任何升级，也会遇到问题，因为负载均衡不会考虑到应用升级的问题。我们需要单独配置每个负载均衡器，然后升级该均衡器所服务的容器。想象一下，当你有 20 个负载均衡器和每周 5 或 6 个小的更新时，你将不得不进行大量的手工劳动。

我们需要的是一种可以一次性将变更传递给所有受控容器的方法，同时也需要一种可以轻松地调度可用容器的方法，这个过程还必须要是自动化的，这正是 Kubernetes 所做的事情。

接下来，我们将探讨 Kubernetes 究竟是如何工作的，它的各种组件和服务，以及更多关于如何使用 Kubernetes 来编排、管理和监控容器化环境。为了简单起见，假设我们使用的是 Docker 容器，尽管如前所述，Kubernetes 除了支持 Docker 之外，还支持其他几种容器平台。

## Kubernetes 架构和组件

首先，最重要的是你需要认识到 Kubernetes 利用了“期望状态”原则。就是说，你定义了组件的期望状态，而 Kubernetes 要将它们始终调整到这个状态。

例如，你想让你的 Web 服务器始终运行在 4 个容器中，以达到负载均衡的目的，你的数据库复制到 3 个不同的容器中，以达到冗余的目的。这就是你想要的状态。如果这 7 个容器中的任何一个出现故障，Kubernetes 引擎会检测到这一点，并自动创建出一个新的容器，以确保维持所需的状态。

现在我们来定义一些 Kubernetes 的重要组件。

当你第一次设置 Kubernetes 时，你会创建一个集群。所有其他组件都是集群的一部分。你也可以创建多个虚拟集群，称为命名空间 (namespace)，它们是同一个物理集群的一部分。这与你可以在同一物理服务器上创建多个虚拟机的方式非常相似。如果你不需要，也没有明确定义的命名空间，那么你的集群将在始终存在的默认命名空间中创建。

Kubernetes 运行在节点 (node) 上，节点是集群中的单个机器。如果你有自己的硬件，节点可能对应于物理机器，但更可能对应于在云中运行的虚拟机。节点是部署你的应用或服务的地方，是 Kubernetes 工作的地方。有 2 种类型的节点——master 节点和 worker 节点，所以说 Kubernetes 是主从结构的。

主节点是一个控制其他所有节点的特殊节点。一方面，它和集群中的任何其他节点一样，这意味着它只是另一台机器或虚拟机。另一方面，它运行着控制集群其他部分的软件。它向集群中的所有其他节点发送消息，将工作分配给它们，工作节点向主节点上的 API Server 汇报。

Master 节点本身也包含一个名为 API Server 的组件。这个 API 是节点与控制平面通信的唯一端点。API Server 至关重要，因为这是 worker 节点和 master 节点就 pod、deployment 和所有其他 Kubernetes API 对象的状态进行通信的点。

Woker 节点是 Kubernetes 中真正干活的节点。当你在应用中部署容器或 pod（稍后定义）时，其实是在将它们部署到 worker 节点上运行。Worker 节点托管和运行一个或多个容器的资源。

Kubernetes 中的逻辑而非物理的工作单位称为 pod。一个 pod 类似于 Docker 中的容器。记得我们在前面讲到，容器可以让你创建独立、隔离的工作单元，可以独立运行。但是要创建复杂的应用程序，比如 Web 服务器，你经常需要结合多个容器，然后在一个 pod 中一起运行和管理。这就是 pod 的设计目的——一个 pod 允许你把多个容器，并指定它们如何组合在一起来创建应用程序。而这也进一步明确了 Docker 和 Kubernetes 之间的关系——一个 Kubernetes pod 通常包含一个或多个 Docker 容器，所有的容器都作为一个单元来管理。

Kubernetes 中的 service 是一组逻辑上的 pod。把一个 service 看成是一个 pod 的逻辑分组，它提供了一个单一的 IP 地址和 DNS 名称，你可以通过它访问服务内的所有 pod。有了服务，就可以非常容易地设置和管理负载均衡，当你需要扩展 Kubernetes pod 时，这对你有很大的帮助，我们很快就会看到。

ReplicationController 或 ReplicaSet 是 Kubernetes 的另一个关键功能。它是负责实际管理 pod 生命周期的组件——当收到指令时或 pod 离线或意外停止时启动 pod，也会在收到指示时杀死 pod，也许是因为用户负载减少。所以换句话说，ReplicationController 有助于实现我们所期望的指定运行的 pod 数量的状态。

## 什么是 Kubectl？

kubectl 是一个命令行工具，用于与 Kubernetes 集群和其中的 pod 通信。使用它你可以查看集群的状态，列出集群中的所有 pod，进入 pod 中执行命令等。你还可以使用 YAML 文件定义资源对象，然后使用 kubectl 将其应用到集群中。

## Kubernetes 中的自动扩展

请记住，我们使用 Kubernetes 而不是直接使用 Docker 的原因之一，是因为 Kubernetes 能够自动扩展应用实例的数量以满足工作负载的需求。

自动缩放是通过集群设置来实现的，当服务需求增加时，增加节点数量，当需求减少时，则减少节点数量。但也要记住，节点是 “物理” 结构——我们把“物理”放在引号里，因为要记住，很多时候，它们实际上是虚拟机。

无论如何，节点是物理机器的事实意味着我们的云平台必须允许 Kubernetes 引擎创建新机器。各种云提供商对 Kubernetes 支持基本都满足这一点。

我们再继续说一些概念，这次是和网络有关的。

## 什么是 kubernetes Ingress 和 Egress？

外部用户或应用程序与 Kubernetes pod 交互，就像 pod 是一个真正的服务器一样。我们需要设置安全规则允许哪些流量可以进入和离开“服务器”，就像我们为托管应用程序的服务器定义安全规则一样。

进入 Kubernetes pod 的流量称为 Ingress，而从 pod 到集群外的出站流量称为 egress。我们创建入口策略和出口策略的目的是限制不需要的流量进入和流出服务。而这些策略也是定义 pod 使用的端口来接受传入和传输传出数据 / 流量的地方。

## 什么是 Ingress Controller？

但是在定义入口和出口策略之前，你必须首先启动被称为 Ingress Controller（入口控制器）的组件；这个在集群中默认不启动。有不同类型的入口控制器，Kubernetes 项目默认只支持 Google Cloud 和开箱即用的 Nginx 入口控制器。通常云供应商都会提供自己的入口控制器。

## 什么是 Replica 和 ReplicaSet？

为了保证应用程序的弹性，需要在不同节点上创建多个 pod 的副本。这些被称为 Replica。假设你所需的状态策略是“让名为 webserver-1 的 pod 始终维持在 3 个副本”，这意味着 ReplicationController 或 ReplicaSet 将监控活动副本的数量，如果其中有任何一个 replica 因任何原因不可用（例如节点的故障），那么 Deployment Controller 将自动创建一个新的系统（定义如下）。

所需状态是在 deployment 中定义的。 Master 节点的中有一个子系统叫做 Deployment Controller，负责实际执行并使当前状态不断趋向于所需状态。

因此，举例来说，如果你目前有 2 个 pod 的副本，而你所希望的状态应该有 3 个，那么 Replication Controller 或 ReplicaSet 会自动检测到这个要求，并指示 Deployment Controller 根据预定义的设置部署一个新的 pod。

## 什么是服务网格？

[服务网格 (Service Mesh)](https://jimmysong.io/blog/what-is-a-service-mesh/) 用于管理服务之间的网络流量，是云原生的网络基础设施层，也是 [Kubernetes 次世代的云原生应用](https://jimmysong.io/blog/post-kubernetes-era/) 的重要组成部分。

服务网格利用容器之间的网络设置来控制或改变应用程序中不同组件之间的交互。下面，我们用一个例子来说明。假设你想测试 Nginx 的新版本，检查它是否与你的 Web 应用兼容。你用新的 Nginx 版本创建了一个新的容器 (Container2)，并从当前容器 (Container1) 中复制了当前的 Nginx webserver 配置。但你不想影响组成 web 应用的其他微服务（假设每个容器对应一个单独的微服务）——就是 MySQL 数据库、Node.js 前端、负载均衡器等。

所以使用服务网格，你可以立即只把 webserver 微服务改成 Container2（新 Nginx 版本的那个）进行测试。如果确定它不能工作，比如因为它导致网站出现一些兼容性问题，那么你就调用服务网格来快速切换回原来的 Container1。而这一切都不需要对其他容器进行任何配置变更——这些变更对其他容器是完全透明的。

如果没有服务网格，对容器来说这项工作将十分繁琐，因为这涉及到逐一更改所有其他容器上的配置，将它们所包含的服务从 Container1 指向 Container2，然后在测试失败后，将它们全部改回来。

在前面这部分 Kubernetes 指南中，我们介绍了一些与 Kubernetes 网络相关的概念。Kubernetes 中的网络可能很棘手，很难理解，如果你刚刚开始，你可能需要一些实践来理解这里。关于服务网格的更多内容请参考 [Istio Handbook——Istio 服务网格进阶实战](https://www.servicemesher.com/istio-handbook)。

在下一部分中，我们将展开更多关于 Kubernetes 的话题：如何开始学习 Kubernetes，如何在本地安装和测试 Kubernetes，以及 Kubernetes 的一些优秀的监控工具。

## 如何学习 Kubernetes？

自学 Kubernetes 知识基本上有三种不同的途径，我们在这里只提供了一个指导大纲。

### 一、从零开始学习和安装 Kubernetes

要想真正掌握 Kubernetes，最好的办法莫过于自己从头开始安装 Kubernetes。不过要注意的是，从零开始安装 Kubernetes 并不是一件容易的事情。安装 Kubernetes 并不是简单的“下载文件 -> 点击安装”式的操作，Kubernetes 由多个组件组成，这些组件必须单独安装和配置。而在此之前，你也需要相当的技术储备来做安装前的准备，比如熟悉 Linux 操作系统。如果你决定使用这种方式学习的话，推荐你阅读 [Kubernetes Handbook——Kubernetes 中文指南 / 云原生架构实践手册](https://github.com/rootsongjc/kubernetes-handbook)。此外，请记住，尽管 Kubernetes 作为一个开源解决方案在技术上是免费的，但它确实有一些隐藏的成本，只不过对初学者来说可能并不明显。

### 二、Kubernetes 自托管解决方案

这些解决方案样是一些工具和实用程序，大大简化了在本地计算机上安装和配置小型 Kubernetes 集群的任务。它们是学习 Kubernetes 的好方法，同时对于新手来说也不会太难，又足够小巧可以到安装在个人电脑上。最流行的自托管 Kubernetes 工具和环境是 [Minikube](https://github.com/kubernetes/minikube)、[MicroK8s](https://github.com/ubuntu/microk8s)、[Docker Desktop](https://docs.docker.com/docker-for-windows/kubernetes/) 和 [Kind](https://github.com/kubernetes-sigs/kind)。这些解决方案往往有一些限制，例如，Minikube 只允许创建一个节点。尽管有这些缺点，但这些工具还是非常值得推荐，因为它们将易学性和成本效益结合起来，对于刚开始使用 Kubernetes 的初学者来说，是一个很好的选择。

### 三、云托管的解决方案

如今各大云供应商都提供了定制化的 Kubernetes 解决方案来。你也可以通过线上教学平台如 [Katacoda](https://katacoda.com/) 上的免费课程来学习 Kubernetes，它们都是云托管的，你不需要自己安装，只不过你需要云供应商的集群需要付费。

## 本地测试和调试 Kubernetes

作为本地安装 Kubernetes 的一部分，你很可能还需要一些测试和调试能力，以确保一切都在顺利运行，特别是定义入口和出口策略等棘手的任务。此外，还有 Kubernetes 附加组件的生态系统，你可能想使用这些组件来扩展 Kubernetes 集群的功能。添加所有这些都需要进行更多的测试，以确保它们能与你的 Kubernetes 集群完美的集成。

用于在本地开发和调试 Kubernetes 服务的工具有：[Microsoft Bridge to Kubernetes](https://github.com/microsoft/mindaro) 和 [telepresence](https://github.com/telepresenceio/telepresence)。这些工具可以让你在本地运行单个服务，同时将该服务连接到远程 Kubernetes 集群。这样你就可以让自己的本地机器作为 Kubernetes 集群中的一部分来运行——这对于在本地而不是在生产集群上开发服务非常有用。

Kubernetes 项目也了解到了 Kubernetes 安装对端到端 (E2E) 测试的需求。为此，项目核心团队一直在确保在最近的版本中更恰当地支持 E2E 测试。这包括诸如允许测试重用和纳入更多附加组件和驱动程序的测试等。

## Kubernetes 监控工具

Kubernetes 提供了应用程序在集群的每个层次上的资源使用情况的详细信息——容器、pod、服务。这些详细信息使你能够评估应用程序的性能，确定哪些瓶颈可以解决以提高整体性能。

毕竟，监控可以帮助你了解应用和集群运行情况的详细信息，这对于学习 Kubernetes 是十分有帮助的。

Kubernetes 包含两个内置度量收集工具用于监控：[资源管道和全度量管道](https://kubernetes.io/docs/tasks/debug-application-cluster/resource-usage-monitoring/)。资源管道是一个较低级和较有限的工具，主要集中在与各种控制器相关的指标上。全指标管道，顾名思义，从几乎所有集群组件中获取并显示更丰富的指标。

还有一些第三方工具可以安装并集成到 Kubernetes 集群中。对于 Kubernetes 来说，最普遍使用的两个工具是 Prometheus 和 Grafana。

### Prometheus 监控

Prometheus 是一个功能丰富的开源监控和警报工具。Prometheus 包含一个内部数据存储用来收集指标，如生成的时间序列数据。Prometheus 还拥有众多插件，允许它将数据暴露给各种外部解决方案，并从其他数据源导入数据，包括所有主要公有云监控解决方案。

### Grafana 仪表盘

Grafana 是一个优秀的仪表盘、分析和数据可视化工具。它没有 Prometheus 的全功能数据收集能力，但 Prometheus 又没有 Grafana 的数据呈现界面。事实上，他们最好是结合在一起使用——Prometheus 负责数据收集和汇总，Grafana 负责数据展示。它们共同创造了一个强大的组合，涵盖了数据收集、基本警报和可视化。

### 高级警报

对于高级警报，你可以添加 [Nagios](https://www.nagios.org/) 或 [Prometheus Alertmanager](https://github.com/prometheus/alertmanager) 等工具。这些警报工具通常有大量的集成。你可以为自定义值班团队，然后定义你想要监控的参数，例如“当任何 pod 不可用时”或“当任何节点无法访问时”、“当容量达到 90%”等，然后通过电子邮件、短信、手机应用提醒、电话呼叫等方式向值班人员发送自定义通知。你还可以创建升级策略，比如，如果一个被定义为“危急”的警报在 10 分钟内没有值班人员确认，那么就将警报升级（发送警报）到该人员的经理。

现在，你应该已经对 Docker 和 Kubernetes 有了大体的认识。了解了 Kubernetes 的作用，知道它是如何进行容器化应用部署和管理的。

调试和监控技术不仅仅是运维需要，你也可以把它当作学习方式。有什么比边做边学更好呢？

请记住，如果你的应用规模太小，而且预计用户需求不会有太大变化或重大波动（比如一个只在公司内部使用的应用），那么 Kubernetes 对你来说可能没有必要，这种情况下，直接使用 Docker 就足够了。

## 更多

云原生领域的开源项目众多（见 [Awesome Cloud Native/云原生开源项目大全](https://jimmysong.io/awesome-cloud-native)），其中有大量的优秀项目可供我们学习。此外，Kubernetes 开源已经多年时间，网上有大量的学习资料，业界出版过很多[书籍](https://jimmysong.io/cloud-native/note/books/)，建议大家通过阅读[官方文档](https://kubernetes.io)和实践来学习，也可以参考我编写的[Kubernetes Handbook——Kubernetes 中文指南 / 云原生架构实践手册](https://jimmysong.io/kubernetes-handbook)。

推荐大家加入我发起创办的[云原生社区](https://cloudnative.to)，这是一个立足中国，放眼世界的云原生终端用户社区，致力于云原生技术的传播和应用。云原生社区主办的[云原生学院](https://github.com/cloudnativeto/academy)定期邀请云原生和开源领域的大咖在 B 站上进行直播分享，成员自发组织了多个 SIG（特别兴趣小组）进行讨论学习。欢迎加入我们，共同学习和交流云原生技术。
