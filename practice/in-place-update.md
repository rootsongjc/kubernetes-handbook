# 原地升级

Kruise 对 Kubernetes 扩展的控制器中有一个重要功能就是支持原地升级，本文将为大家介绍什么是原地升级以及如何配置。

## 什么是原地升级？

原地升级（In-place update）是一种 Kubernetes 中的 Pod 升级方式，这种升级方式可以更新 Pod 中某一个或多个容器的镜像版本，而不影响 Pod 中其余容器的运行，同时保持 Pod 的网络和存储状态不变。

Kubernetes 原生工作负载，不论是 Deployment、StatefulSet 还是 Pod 本身，如果你想升级 Pod 中的镜像，那么 Kubernetes 就会重新销毁该 Pod 并重新调度并创建一个 Pod，对于 StatefulSet 虽然可以保持原有 Pod 的名字，但是实际 **UID** 及 **Pod IP** 都将发生改变。如果你还使用了 Istio，那么在更新 Sidecar 容器的时候，所有植入 Sidecar 容器的 Pod 都需要销毁、重新调度和重建，这将带来极大的开销，同时也影响了业务的稳定性。

## 原地升级的优势

原地升级的模式极大地提升了应用发布的效率，

1. 节省了调度的耗时，Pod 的位置、资源都不发生变化；
1. 节省了分配网络的耗时，Pod 还使用原有的 IP；
1. 节省了分配、挂载远程盘的耗时，Pod 还使用原有的 PV（且都是已经在 Node 上挂载好的）；
1. 节省了大部分拉取镜像的耗时，因为 Node 上已经存在了应用的旧镜像，当拉取新版本镜像时只需要下载很少的几层 layer；

而且用户要想在 Kubernetes 中使用原地升级也是极其容易的，只需要安装 [OpenKruise](./openkruise.md)，并在使用 Kruise 的 CRD 并在 策略中设置即可。

## 如何配置原地升级

OpenKruise 对于 Kubernetes 扩展的 `AdvancedStatefulSet`、`CloneSet`、`SidecarSet` 都支持原地升级。

需要将 `updateStrategy` 的 `type` 值配置为以下两种类型之一：

- `InPlaceIfPossible`：如果可能的话，控制器将尝试就地更新 Pod，而不是重新创建它们。目前，只有`spec.template.spec.container[x].image` 字段可以原地更新；
- `InPlaceOnly`：控制器将原地更新 Pod，而不是重新创建它们。使用 `InPlaceOnly` 策略，用户不能修改 `spec.template` 中除 `spec.template.spec.containers[x].image` 以外的任何字段。

注意：`updateStrategy` 默认值为 `ReCreate` ，必须显式的配置为以上两个类型之一才可以开启原地升级。

关于原地升级的技术背景及实现原理请参考[揭秘：如何为 Kubernetes 实现原地升级](https://developer.aliyun.com/article/765421)。

## 参考

- [揭秘：如何为 Kubernetes 实现原地升级 - developer.aliyun.com](https://developer.aliyun.com/article/765421)
- [Kruise 中文文档 - github.com](https://github.com/openkruise/kruise/blob/master/README-zh_CN.md)