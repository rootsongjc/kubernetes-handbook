# Knative

![Knative logo](https://tva1.sinaimg.cn/large/006y8mN6ly1g7pg0iwbzfj30d8080dfp.jpg)

[Knative](https://github.com/knative) 开源于 2018 年 7 月 24 日，由 Pivotal、Google、IBM 等公司共同发起，从以 K 打头的名字上就可以看出来 Knative 是用以扩展 Kubernetes 的。官方给 Knative 的定位是：基于 Kubernetes 的平台，用来构建、部署和管理现代 Serverless 工作负载。通过 Knative 可将云原生应用开发在三个领域的最佳实践结合起来——服务构建部署的自动化、服务编排的弹性化以及事件驱动基础设施的标准化。

## 组件

Knative 包含以下两个组件：

- Eventing：提供用来使用和生成符合 CloudEvents 规范的事件的构建块。它包括对来自事件源的信息流的抽象，以及通过由可插拔发布/订阅代理服务提供支持的消息传递通道实现交付解耦。
- Serving：可缩放至零、请求驱动的计算运行环境，利用 Istio 在各版本之间路由流量。Serving 的目标是为 Kubernetes 提供扩展功能，用于部署和运行 Serverless 工作负载。

注：在 Knative 自 0.8 版本前还包含 Build 组件，该组件提供了一种从源代码构建容器的可插拔模型。它以 Google 的容器构建服务为基础。在 0.8 版本后 Build 组件被 [tekoncd/pipeline](https://github.com/tektoncd/pipeline) 取代。

## 受众

不同受众参与和使用 Knative 的方式不同，如下图所示。

![Knative 受众（图片来自 knative.dev）](https://tva1.sinaimg.cn/large/006y8mN6ly1g7po5i7cgqj31ap0u075l.jpg)

## Knative 特性

- 对于常用应用用例的更高级别抽象
- 安全、无状态、可扩展应用的秒级启动
- 功能松耦合，可任意组装
- 组件可拔插，你可以使用自己的日志、监控、网络和服务网格
- 可移植：在任意 Kubernetes 集群上运行，无需担心供应商锁定
- 顺应开发者习惯，支持如 GitOps、DockerOps、ManualOps 等通用模式
- 可以与通用工具及框架一起使用，如 Django、Ruby on Rails、Spring 等

## 商业产品

Knative 是一个拥有众多厂商参与的社区，其中很多厂商已经提供 Knative 的商业托管服务产品。以下是 Knative 部分商业托管服务产品的清单。

- Gardener：通过在 Gardener vanilla Kubernetes 集群中安装 Knative，实现无服务器运行时附加层。
- Google Cloud Run for Anthos：通过 Serverless 开发平台来扩展 Google Kubernetes Engine。利用 Cloud Run for Anthos，你可以通过 Kubernetes 的灵活性获得 Serverless 的开发体验，从而在自己的集群上部署和管理 Knative 服务。
- Google Cloud Run：由谷歌云全托管的基于 Knative 的 Serverless 计算平台。你无须管理 Kubernetes 集群，通过 Cloud Run 可以在几秒钟内将容器应用到生产环境中。
- Managed Knative for IBM Cloud Kubernetes Service：IBM Kubernetes Service 的托管附加组件，便于你在自己的 Kubernetes 集群上部署和管理 Knative 服务。
- OpenShift Serverless：OpenShift 容器平台可以让有状态、无状态的 Serverless 工作负载自动在单个多云容器平台上运行。开发人员可以使用一个平台来托管其微服务、传统应用和 Serverless 应用程序。
- Pivotal Function Service (PFS)：一个用于在 Kubernetes 上构建和运行函数、应用程序和容器的平台，基于 RIFF 的开源项目。
- TriggerMesh Cloud：一个全托管的 Knative 和 Tekton 平台，支持 AWS、Azure 和 Google 事件源和代理。

## 参考

- [Knative 官网 - knative.dev](https://knative.dev)
- [什么是 Knative？- mp.weixin.qq.com](https://mp.weixin.qq.com/s/ZyGKR-f0SqGadlg9EVvE4Q)

