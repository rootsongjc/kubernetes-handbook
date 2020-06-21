# OpenKruise

[OpenKruise](http://openkruise.io/) 是阿里云开源的大规模应用自动化管理引擎，在 Kubernetes 原生 Deployment/StatefulSet 等控制器基础上，提供了更多的增强功能如：

- 优雅原地升级

- 发布优先级/打散策略

- 多可用区 workload 抽象管理

- 统一 sidecar 容器注入管理等

这些控制器可以帮助开发者应对更加多样化的部署环境和需求、为集群维护者和应用开发者带来更加灵活的部署发布组合策略。

## 扩展控制器

Kruise 是 OpenKruise 中的核心项目之一，它提供一套在 [Kubernetes 核心控制器](https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/)之外的扩展 workload 管理和实现。目前，Kruise 提供了以下 5 个 Kubernetes 扩展控制器：

- [CloneSet](https://github.com/openkruise/kruise/blob/master/docs/concepts/cloneset/README.md): 提供了更加高效、确定可控的应用管理和部署能力，支持优雅**原地升级**、指定删除、发布顺序可配置、并行/灰度发布等丰富的策略，可以满足更多样化的应用场景。
- [Advanced StatefulSet](https://github.com/openkruise/kruise/blob/master/docs/concepts/astatefulset/README.md)：基于原生 [StatefulSet](../concepts/statefulset.md) 之上的增强版本，默认行为与原生完全一致，在此之外提供了原地升级、并行发布（最大不可用）、发布暂停等功能。
- [SidecarSet](https://github.com/openkruise/kruise/blob/master/docs/concepts/sidecarSet/README.md)：对 sidecar 容器做统一管理，在满足 selector 条件的 Pod 中注入指定的 sidecar 容器。
- [UnitedDeployment](https://github.com/openkruise/kruise/blob/master/docs/concepts/uniteddeployment/README.md): 通过多个 subset workload 将应用部署到多个可用区。
- [BroadcastJob](https://github.com/openkruise/kruise/blob/master/docs/concepts/broadcastJob/README.md): 配置一个 job，在集群中所有满足条件的 Node 上都跑一个 Pod 任务。

### CloneSet

CloneSet 是的对 Deployment 的增强版，主要用于管理对实例顺序没有要求的无状态应用。

### Advanced StatefulSet

### SidecarSet

### UnitedDeployment

### BroadcastJob



## 安装

使用 Helm v3 安装，并保证 Kubernetes 版本不低于 1.12。

```bash
helm install kruise https://github.com/openkruise/kruise/releases/download/v0.5.0/kruise-chart.tgz
```

默认启用所有支持的扩展控制器，若您想只启动指定的控制器，可以在执行上面的命令时设置环境变量，例如您想只启用 `CloneSet` 和 `StatefulSet`，可以加上这样的：

```bash
--set manager.custom_resource_enable="CloneSet,StatefulSet"
```

## 卸载

要想卸载 Kruise，只需要执行下面的命令：

```bash
helm delete kruise --namespace default
```

注意：卸载会导致所有 Kruise 下的资源都被删除，包括 webhook configurations、services、namespace、CRD、CR 实例和所有 Kruise workload 下的 Pod。 请务必谨慎操作！

## 参考

- [Kruise 中文文档 - github.com](https://github.com/openkruise/kruise/blob/master/README-zh_CN.md)