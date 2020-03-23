# Pod Preset

> **注意：**PodPreset 资源对象只有 kubernetes 1.8 以上版本才支持。

Preset 就是预设，有时候想要让一批容器在启动的时候就注入一些信息，比如 secret、volume、volume mount 和环境变量，而又不想一个一个的改这些 Pod 的 template，这时候就可以用到 PodPreset 这个资源对象了。

本页是关于 PodPreset 的概述，该对象用来在 Pod 创建的时候向 Pod 中注入某些特定信息。该信息可以包括 secret、volume、volume mount 和环境变量。

## 理解 Pod Preset

`Pod Preset` 是用来在 Pod 被创建的时候向其中注入额外的运行时需求的 API 资源。

您可以使用 [label selector](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#label-selectors) 来指定为哪些 Pod 应用 Pod Preset。

使用 Pod Preset 使得 pod 模板的作者可以不必为每个 Pod 明确提供所有信息。这样一来，pod 模板的作者就不需要知道关于该服务的所有细节。

关于该背景的更多信息，请参阅 [PodPreset 的设计方案](https://git.k8s.io/community/contributors/design-proposals/service-catalog/pod-preset.md)。

## 如何工作

Kubernetes 提供了一个准入控制器（`PodPreset`），当其启用时，Pod Preset 会将应用创建请求传入到该控制器上。当有 Pod 创建请求发生时，系统将执行以下操作：

1. 检索所有可用的 `PodPresets`。
2. 检查 PodPreset 标签选择器上的标签，看看其是否能够匹配正在创建的 Pod 上的标签。
3. 尝试将由 `PodPreset` 定义的各种资源合并到正在创建的 Pod 中。
4. 出现错误时，在该 Pod 上引发记录合并错误的事件，PodPreset *不会*注入任何资源到创建的 Pod 中。
5. 注释刚生成的修改过的 Pod spec，以表明它已被 PodPreset 修改过。注释的格式为 `podpreset.admission.kubernetes.io/podpreset-<pod-preset name>": "<resource version>"`。

每个 Pod 可以匹配零个或多个 Pod Prestet；并且每个 `PodPreset` 可以应用于零个或多个 Pod。 `PodPreset` 应用于一个或多个 Pod 时，Kubernetes 会修改 Pod Spec。对于 `Env`、`EnvFrom` 和 `VolumeMounts` 的更改，Kubernetes 修改 Pod 中所有容器的容器 spec；对于 `Volume` 的更改，Kubernetes 修改 Pod Spec。

> **注意：**Pod Preset 可以在适当的时候修改 Pod spec 中的 `spec.containers` 字段。Pod Preset 中的资源定义将*不会*应用于 `initContainers` 字段。

### 禁用特定 Pod 的 Pod Preset

在某些情况下，您可能不希望 Pod 被任何 Pod Preset 所改变。在这些情况下，您可以在 Pod 的 Pod Spec 中添加注释：`podpreset.admission.kubernetes.io/exclude："true"`。

## 启用 Pod Preset

为了在群集中使用 Pod Preset，您必须确保以下内容：

1. 您已启用 `settings.k8s.io/v1alpha1/podpreset` API 类型。例如，可以通过在 API server 的 `--runtime-config` 选项中包含 `settings.k8s.io/v1alpha1=true` 来完成此操作。
2. 您已启用 `PodPreset` 准入控制器。 一种方法是将 `PodPreset` 包含在为 API server 指定的 `--admission-control` 选项值中。
3. 您已经在要使用的命名空间中通过创建 `PodPreset` 对象来定义 `PodPreset`。

## 更多资料

- [使用 PodPreset 向 Pod 中注入数据](https://kubernetes.io/docs/tasks/inject-data-application/podpreset)
