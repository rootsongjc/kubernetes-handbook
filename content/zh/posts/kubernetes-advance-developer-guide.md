---
title: "Kubernetes高级开发者指南"
subtitle: "Pod高级配置与Kubernetes API扩展"
tags: ["kubernetes"]
categories: "kubernetes"
description: "Kubernetes高级开发者指南，涵盖Pod的高级配置和Kubernetes的扩展等。"
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/2018021002.jpg", desc: "Twilight in the Forbidden City|Beijing|Feb 10,2018"}]
date: 2018-02-11T10:32:46+08:00
draft: false

---

本文假定您已经熟悉 Kubernetes 的核心概念并可以轻松的部署自己的应用程序。如果还不能的话，您需要先查看下[中级应用开发者](https://kubernetes.io/docs/user-journeys/users/application-developer/intermediate/)主题。

在浏览了本页面及其链接的内容后，您将会更好的理解如下部分：

- 可以在应用程序中使用的高级功能
- 扩展 Kubernetes API 的各种方法

## 使用高级功能部署应用

现在您知道了 Kubernetes 中提供的一组 API 对象。理解了 daemonset 和 deployment 之间的区别对于应用程序部署通常是足够的。也就是说，熟悉 Kubernetes 中其它的鲜为人知的功能也是值得的。因为这些功能有时候对于特别的用例是非常强大的。

#### 容器级功能

如您所知，将整个应用程序（例如容器化的 Rails 应用程序，MySQL 数据库以及所有应用程序）迁移到单个 Pod 中是一种反模式。这就是说，有一些非常有用的模式超出了容器和 Pod 之间的 1:1 的对应关系：

- **Sidecar 容器**：虽然 Pod 中依然需要有一个主容器，你还可以添加一个副容器作为辅助（见 [日志示例](https://kubernetes.io/docs/concepts/cluster-administration/logging/#using-a-sidecar-container-with-the-logging-agent))。单个 Pod 中的两个容器可以[通过共享卷](https://kubernetes.io/docs/tasks/access-application-cluster/communicate-containers-same-pod-shared-volume/)进行通信。
- **Init 容器**：Init 容器在 Pod 的应用容器（如主容器和 sidecar 容器）之前运行。[阅读更多](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)，查看 [nginx 服务器示例](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-initialization/)，并[学习如何调试这些容器](https://kubernetes.io/docs/tasks/debug-application-cluster/debug-init-containers/)。

#### Pod 配置

通常，您可以使用 label 和 annotation 将元数据附加到资源上。将数据注入到资源，您可以会创建 ConfigMap（用于非机密数据）或 Secret（用于机密数据）。

下面是一些其他不太为人所知的配置资源 Pod 的方法：

- Taint（污点）和 Toleration（容忍）：这些为节点“吸引”或“排斥” Pod 提供了一种方法。当需要将应用程序部署到特定硬件（例如用于科学计算的 GPU）时，经常使用它们。[阅读更多](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/)。
- **向下 API**：这允许您的容器使用有关自己或集群的信息，而不会过度耦合到 Kubernetes API server。这可以通过[环境变量](https://kubernetes.io/docs/tasks/inject-data-application/environment-variable-expose-pod-information/) 或者 [DownwardAPIVolumeFiles](https://kubernetes.io/docs/tasks/inject-data-application/downward-api-volume-expose-pod-information/)。
- **Pod 预设**：通常，要将运行时需求（例如环境变量、ConfigMap 和 Secret）安装到资源中，可以在资源的配置文件中指定它们。[PodPresets](https://kubernetes.io/docs/concepts/workloads/pods/podpreset/)允许您在创建资源时动态注入这些需求。例如，这允许团队 A 将任意数量的新Secret 安装到团队 B 和 C 创建的资源中，而不需要 B 和 C 的操作。[请参阅示例](https://kubernetes.io/docs/tasks/inject-data-application/podpreset/)。

#### 其他 API 对象

在设置以下资源之前，请检查这是否属于您组织的集群管理员的责任。

- **Horizontal Pod Autoscaler (HPA)** ：这些资源是在CPU使用率或其他[自定义度量](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/instrumentation/custom-metrics-api.md)标准“秒杀”时自动化扩展应用程序的好方法。[查看示例](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/)以了解如何设置HPA。
- **联合集群对象**：如果使用 federation 在多个 Kubernetes 集群上运行应用程序，则需要部署标准 Kubernetes API 对象的联合版本。有关参考，请查看设置 [联合 ConfigMap](https://kubernetes.io/docs/tasks/administer-federation/configmap/) 和[联合 Deployment](https://kubernetes.io/docs/tasks/administer-federation/deployment/) 的指南。

## 扩展 Kubernetes API

Kubernetes 在设计之初就考虑到了可扩展性。如果上面提到的 API 资源和功能不足以满足您的需求，则可以自定义其行为，而无需修改核心 Kubernetes 代码。

#### 理解 Kubernetes 的默认行为

在进行任何自定义之前，了解 Kubernetes API 对象背后的一般抽象很重要。虽然 Deployment 和 Secret 看起来可能完全不同，但对于任何对象来说，以下概念都是正确的：

- **Kubernetes对象是存储有关您的集群的结构化数据的一种方式。**

  在 Deployment 的情况下，该数据代表期望的状态（例如“应该运行多少副本？”），但也可以是通用的元数据（例如数据库凭证）。

- **Kubernetes 对象通过 Kubernetes API** 修改。

  换句话说，您可以对特定的资源路径（例如 `<api-server-url>/api/v1/namespaces/default/deployments` ）执行 `GET` 和 `POST` 请求来读取或修改对应的对象类型。

- **利用 [Controller 模式](https://kubernetes.io/docs/concepts/api-extension/custom-resources/#custom-controllers)，Kubernetes 对象可被确保达到期望的状态**。为了简单起见，您可以将 Controller 模式看作以下连续循环：

  1. 检查当前状态（副本数、容器镜像等）
  2. 对比当前状态和期望状态
  3. 如果不匹配则更新当前状态

  这些状态是通过 Kubernetes API 来获取的。

  并非所有的 Kubernetes 对象都需要一个 Controller。尽管 Deployment 触发群集进行状态更改，但 ConfigMaps 纯粹作为存储。

#### 创建自定义资源

基于上述想法，您可以定义与 Deployment 一样合法的[自定义资源](https://kubernetes.io/docs/concepts/api-extension/custom-resources/#custom-resources)。例如，如果 `CronJobs` 不能提供所有您需要的功能，您可能需要定义 `Backup` 对象以进行定期备份。

创建自定义资源有以下两种方式：

1. **自定义资源定义（CRD）**：这种实现方式的工作量最小。参考[示例](https://kubernetes.io/docs/tasks/access-kubernetes-api/extend-api-custom-resource-definitions/)。
2. **API 聚合**：在实际设置单独的[扩展 API server](https://kubernetes.io/docs/tasks/access-kubernetes-api/setup-extension-api-server/) 之前，此方法需要一些[预配置](https://kubernetes.io/docs/tasks/access-kubernetes-api/configure-aggregation-layer/)

请注意，与依赖内置的  [`kube-controller-manager`](https://kubernetes.io/docs/reference/generated/kube-controller-manager/) 不同，您需要编写并运行[自定义控制器](https://github.com/kubernetes/sample-controller)。

下面是一些有用的链接：

- [如何才知道自定义资源是否符合您的使用场景](https://kubernetes.io/docs/concepts/api-extension/custom-resources/#should-i-use-a-configmap-or-a-custom-resource)
- [CRD 还是 API 聚合，如何选择？](https://kubernetes.io/docs/concepts/api-extension/custom-resources/#choosing-a-method-for-adding-custom-resources)

#### Service Catalog

如果您想要使用或提供完整的服务（而不是单个资源），**Service Catalog** 为此提供了一个[规范](https://github.com/openservicebrokerapi/servicebroker)。这些服务使用 Service Broker注册（请参阅 [示例](https://github.com/openservicebrokerapi/servicebroker/blob/master/gettingStarted.md#example-service-brokers)）。

如果您没有集群管理员来管理 Service Catalog 的安装，您可以使用 [Helm](https://kubernetes.io/docs/tasks/service-catalog/install-service-catalog-using-helm/) 或 [二进制安装器](https://kubernetes.io/docs/tasks/service-catalog/install-service-catalog-using-sc/)。

## 探索其他资源

#### 参考

以下主题对构建更复杂的应用程序也很有用：

- [Kubernetes 中的其他扩展点](https://kubernetes.io/docs/concepts/overview/extending/) - 在哪里可以挂勾到 Kubernetes 架构的概念性的概述
- [Kubernetes 客户端库](https://kubernetes.io/docs/reference/client-libraries/) - 用于构建需要与 Kubernetes API 大量交互的应用程序。

#### 下一步

恭喜您完成了应用开发者之旅！您已经了解了 Kubernetes 提供的大部分功能。现在怎么办？

- 如果您想推荐新功能或跟上Kubernetes应用开发的最新进展，请考虑加入 SIG，如 [SIG Apps](https://github.com/kubernetes/community/tree/master/sig-apps)。
- 如果您有兴趣详细了解 Kubernetes 的内部运作（例如网络），请考虑查看[集群运维之旅](https://kubernetes.io/docs/user-journeys/users/cluster-operator/foundational/)。

原文：<https://kubernetes.io/docs/user-journeys/users/application-developer/advanced/>