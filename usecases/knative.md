# Knative

![Knative logo](https://tva1.sinaimg.cn/large/006y8mN6ly1g7pg0iwbzfj30d8080dfp.jpg)

[Knative](https://github.com/knative) 开源于 2018 年 7 月 24 日，由 Pivotal、Google、IBM 等公司共同发起，从以 K 打头的名字上就可以看出来 Knative 是用以扩展 Kubernetes 的。

## 组件

Knative 最初包含以下 3 个组件：

- Build<b><sup>*</sup></b>：提供了一种从源代码构建容器的可插拔模型。它以 Google 的容器构建服务为基础。
- Eventing：提供用来使用和生成符合 CloudEvents 规范的事件的构建块。它包括对来自事件源的信息流的抽象，以及通过由可插拔发布/订阅代理服务提供支持的消息传递通道实现交付解耦。
- Serving：可缩放至零、请求驱动的计算运行环境，利用 Istio 在各版本之间路由流量。Serving 的目标是为 Kubernetes 提供扩展功能，用于部署和运行 Serverless 工作负载。

> **[warning] 注意**
>
> Knative 自 0.8 版本起去掉了 Build 组件，转而使用 [tekoncd/pipeline](https://github.com/tektoncd/pipeline) 取代，只保留了 Eventing 和 Serving 组件。

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

## 参考

- <https://pivotal.io/cn/knative>
- <https://github.com/knative>