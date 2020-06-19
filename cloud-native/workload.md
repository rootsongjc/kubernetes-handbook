# Workload

本文基于 OAM v1alpha2 版本。

应用程序可用的 `Workload` 类型是由平台提供商和基础设施运维人员提供的。`Workload` 模型参照 [Kubernetes 规范](https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/#required-fields)定义，理论上，平台商可以定义如容器、Pod、Serverless 函数、虚拟机、数据库、消息队列等任何类型的 `Workload`。

下面是一个 `Workload` 定义的是示例。

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: WorkloadDefinition
metadata:
  name: schema.example.jimmysong.io
spec:
  definitionRef:
    name: schema.example.jimmysong.io
```

> CR 即 Custom Resource（自定义资源），指的是实例化后的 Kubernetes [CRD](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)。应用开发者可以在 `Component` 的 `Workload` 中直接定义 CR。`definitionRef` 将 `Workload` shcema 在 OAM 解释器中注册，通过增加一个抽象层，使其与 Operator 框架解耦（毕竟不是说有 CRD 都是面向应用开发者的），表示可作为负载类型使用。

请保持 `spec.definitionRef.name` 的值与 `metadata.name` 的值相同，因为 `definitionRef` 是对相应的 `Workload` schema 的引用，对于 Kubernetes 平台来说，即对 [CRD](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) 的引用。应用开发者在定义 [`Component`](component.md) 引用该 `Workload` 的时候需要直接实例化一个 CRD 的配置（及创建一个 CR）。

OAM 中将 `Workload` 分成了 `core.oam.dev`（核心）、`standard.oam.dev`（标准）及自定义扩展类别。目前 OAM 中支持的核心 `Workload` 有 [`ContainerizedWorkload`](https://github.com/oam-dev/spec/blob/master/core/workloads/containerized_workload/containerized_workload.md)。

关于 Workload 的详细信息参考 OAM 中的 [Workload 规范](https://github.com/oam-dev/spec/blob/master/3.workload.md)。

## 参考

- [The Open Application Model specification - github.com](https://github.com/oam-dev/spec)