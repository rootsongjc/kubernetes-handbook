# Conduit 概览

Conduit是一款针对Kubernetes的超轻量级的service mesh。它可以透明得管理服务运行时之间的通信，使得在Kubernetes上运行服务更加安全和可靠；它还具有不用修改任何应用程序代码即可改进应用程序的可观测性、可靠性及安全性等方面的特性。

本文档将从一个较高层次介绍Conduit及其是如何工作的。如果不熟悉service mesh模型，或许可以先阅读William Morgan的概览文章 [什么是service mesh？为什么需要它？](https://buoyant.io/2017/04/25/whats-a-service-mesh-and-why-do-i-need-one/)

## Conduit架构

Conduit service mesh部署到Kubernetes集群时有两个基本组件：**数据平面**和**控制平面**。数据平面承载服务实例间实际的应用请求流量，而控制平面则驱动数据平面并修改其行为（及访问聚合指标）提供API。Conduit CLI和Web UI使用此API并为人类提供符合人体工程学的控制。

让我们依次认识这些组件。

Conduit的数据平面由轻量级的代理组成，这些代理作为sidecar容器与每个服务代码的实例部署在一起。如果将服务“添加”到Conduit servie mesh中，必须重新部署该服务的pod，以便在每个pod中包含一个数据平面代理。（`conduit inject` 命令可以完成这个任务，以及透明地从每个实例通过代理汇集流量所需的配置工作。）

这些代理透明地拦截进出每个pod的通信，并增加诸如重试和超时、检测及加密（TLS）等特性，并根据相关策略来允许和拒绝请求。

这些代理并未设计成通过手动方式配置；相反，它们的行为是由控制平面驱动的。

Conduit控制平面是一组运行在专用Kubernetes名称空间（默认情况下为`conduit`）的服务。这些服务完成各种事情 - 聚合遥测数据，提供面向用户的API，向数据平面代理提供控制数据等。它们一起驱动数据平面的行为。

## 使用Conduit

为了支持Conduit的人机交互，可以使用Conduit CLI及web UI（也可以通过相关工具比如 `kubectl`）。CLI 和 web UI通过API驱动控制平面，而控制平面相应地驱动数据平面的行为。

控制平面API设计得足够通用，以便能基于此构建其他工具。比如，你可能希望从另外一个CI/CD系统来驱动API。

运行 `conduit --help` 可查看关于CLI功能的简短概述。

## Conduit 与 Kubernetes

Conduit设计用于无缝地融入现有的Kubernetes系统。该设计有几个重要特征。

第一，Conduit CLI（`conduit`）设计成尽可能地与 `kubectl` 一起使用。比如，`conduit install` 和 `conduit inject` 生成的Kubernetes配置，被设计成直接送入`kubectl`。这是为了在service mesh和编排系统之间提供一个明确的分工，并且使得Conduit适配现有的Kubernetes工作流程。

第二，Kubernetes中Conduit的核心词是Deployment，而不是Service。举个例子，`conduit inject` 增加一个Deployment，Conduit web UI会显示这些Deployment，并且每个Deployment都会给出聚合的性能指标。这是因为单个pod可以是任意数量Service的一部分，而这会导致流量与pod之间出现复杂的映射。相比之下，Deployment要求单个pod只能属于一个Deployment的一部分。通过基于Deployment而不是Service来构建，流量与pod间的映射就总是清晰的。

这两个设计特性能很好地组合。比如，`conduit inject`可用于一个运行的Deployment，因为当它更新Deployment时， Kubernetes会回滚pod以包括数据平面代理。

## 扩展Conduit的行为

Conduit控制平面还为构建自定义功能提供了一个便捷的入口。Conduit最初发布时并不支持这一点，在不远的将来，通过编写gRPC插件来作为控制平面的一部分运行，将能扩展Conduit的功能，而无需重新编译Conduit。