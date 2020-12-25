# Component

本文基于 OAM v1alpha2 版本。

`Component` 用于定义应用程序的基本组件，其中包含了对 Workload 的引用，一个 Component 中只能定义一个 Workload，这个 Workload 是与平台无关的，可以直接引用 Kubernetes 中的 CRD。

下面是根据 OAM 规范定义的一个 Component 示例。

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: Component
metadata:
  name: my-component
spec:
  workload:
    apiVersion: core.oam.dev/v1alpha2
    kind: ContainerizedWorkload
    spec:
      os: linux
      containers:
        - name: server
          image: my-image:latest
  parameters:
  - name: myServerImage
    required: true
    fieldPaths:
    - ".spec.containers[0].image"
```

`Component`  定义由以下几个部分组成：

- `metadata`：关于 Component 的信息，主要是针对应用运维的信息。
- `workload`：该 Component 的实际工作负载。具体有哪些负载类型可用可以咨询平台提供商，平台运维也可以根据 [Workload 规范](https://github.com/oam-dev/spec/blob/master/3.workload.md) 来扩展负载类型，比如 `Containers`、`Functions`、`VirtualMachine`、[`VirtualService `](https://istio.io/docs/reference/config/networking/virtual-service/) 等。OAM 目前定义的核心负载类型有 [ContainerizedWorkload](https://github.com/oam-dev/spec/blob/master/core/workloads/containerized_workload/containerized_workload.md)（与 Kubernetes 中的 Pod 定义类似，同样支持定义多个容器，但是缺少了 Pod 中的一些属性 ）。
- `parameters`：在应用程序运行时可以调整的参数，即应用开发者在 `Component` 中的原有定义可以在运行时被应用运维人员覆盖。`parameters` 使用 [JSONPath](https://kubernetes.io/zh/docs/reference/kubectl/jsonpath/) 的方式引用 `spec` 中的字段。

> `Component` 的配置在应用后是**可更改的（Mutable）**， 有的 [`Trait`](trait.md) 可能会监听 `Component` 的变更并作出相应的操作，每次变更都会导致新的 `ApplicationConfiguration` 发布。
>

关于 Component 的详细信息请参考 OAM 中的 [Component 规范](https://github.com/oam-dev/spec/blob/master/4.component.md)。

## 参考

- [The Open Application Model specification - github.com](https://github.com/oam-dev/spec)