---
weight: 37
title: 准入控制器（Admission Controller）
date: '2022-05-21T00:00:00+08:00'
type: book
---

准入控制器（Admission Controller）位于 API Server 中，在对象被持久化之前，准入控制器拦截对 API Server 的请求，一般用来做身份验证和授权。其中包含两个特殊的控制器：`MutatingAdmissionWebhook` 和 `ValidatingAdmissionWebhook`。分别作为配置的变异和验证[准入控制 webhook](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/#admission-webhooks)。

准入控制器包括以下两种：

- **变更（Mutating）准入控制**：修改请求的对象
- **验证（Validating）准入控制**：验证请求的对象

准入控制器是在 API Server 的启动参数重配置的。一个准入控制器可能属于以上两者中的一种，也可能两者都属于。当请求到达 API Server 的时候首先执行变更准入控制，然后再执行验证准入控制。

我们在部署 Kubernetes 集群的时候都会默认开启一系列准入控制器，如果没有设置这些准入控制器的话可以说你的 Kubernetes 集群就是在裸奔，应该只有集群管理员可以修改集群的准入控制器。

例如我会默认开启如下的准入控制器。

```bash
--admission-control=ServiceAccount,NamespaceLifecycle,NamespaceExists,LimitRanger,ResourceQuota,MutatingAdmissionWebhook,ValidatingAdmissionWebhook
```

## 准入控制器列表

Kubernetes 目前支持的准入控制器有：

- **AlwaysPullImages**：此准入控制器修改每个 Pod 的时候都强制重新拉取镜像。
- **DefaultStorageClass**：此准入控制器观察创建`PersistentVolumeClaim`时不请求任何特定存储类的对象，并自动向其添加默认存储类。这样，用户就不需要关注特殊存储类而获得默认存储类。
- **DefaultTolerationSeconds**：此准入控制器将 Pod 的容忍时间`notready:NoExecute`和`unreachable:NoExecute` 默认设置为 5 分钟。
- **DenyEscalatingExec**：此准入控制器将拒绝`exec` 和附加命令到以允许访问宿主机的升级了权限运行的 pod。
- **EventRateLimit (alpha)**：此准入控制器缓解了 API Server 被事件请求淹没的问题，限制时间速率。
- **ExtendedResourceToleration**：此插件有助于创建具有扩展资源的专用节点。
- **ImagePolicyWebhook**：此准入控制器允许后端判断镜像拉取策略，例如配置镜像仓库的密钥。
- **Initializers (alpha)**：Pod 初始化的准入控制器，详情请参考[动态准入控制](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/)。
- **LimitPodHardAntiAffinityTopology**：此准入控制器拒绝任何在 `requiredDuringSchedulingRequiredDuringExecution` 的 `AntiAffinity ` 字段中定义除了`kubernetes.io/hostname` 之外的拓扑关键字的 pod。
- **LimitRanger**：此准入控制器将确保所有资源请求不会超过 namespace 的 `LimitRange`。
- **MutatingAdmissionWebhook（1.9 版本中为 beta）**：该准入控制器调用与请求匹配的任何变更 webhook。匹配的 webhook 是串行调用的；如果需要，每个人都可以修改对象。
- **NamespaceAutoProvision**：此准入控制器检查命名空间资源上的所有传入请求，并检查引用的命名空间是否存在。如果不存在就创建一个命名空间。
- **NamespaceExists**：此许可控制器检查除 `Namespace` 其自身之外的命名空间资源上的所有请求。如果请求引用的命名空间不存在，则拒绝该请求。
- **NamespaceLifecycle**：此准入控制器强制执行正在终止的命令空间中不能创建新对象，并确保`Namespace`拒绝不存在的请求。此准入控制器还防止缺失三个系统保留的命名空间`default`、`kube-system`、`kube-public`。
- **NodeRestriction**：该准入控制器限制了 kubelet 可以修改的`Node`和`Pod`对象。
- **OwnerReferencesPermissionEnforcement**：此准入控制器保护对`metadata.ownerReferences`对象的访问，以便只有对该对象具有“删除”权限的用户才能对其进行更改。
- **PodNodeSelector**：此准入控制器通过读取命名空间注释和全局配置来限制可在命名空间内使用的节点选择器。
- **PodPreset**：此准入控制器注入一个 pod，其中包含匹配的 PodPreset 中指定的字段，详细信息见[Pod Preset](../pod-preset)。
- **PodSecurityPolicy**：此准入控制器用于创建和修改 pod，并根据请求的安全上下文和可用的 Pod 安全策略确定是否应该允许它。
- **PodTolerationRestriction**：此准入控制器首先验证容器的容忍度与其命名空间的容忍度之间是否存在冲突，并在存在冲突时拒绝该容器请求。
- **Priority**：此控制器使用`priorityClassName`字段并填充优先级的整数值。如果未找到优先级，则拒绝 Pod。
- **ResourceQuota**：此准入控制器将观察传入请求并确保它不违反命名空间的`ResourceQuota`对象中列举的任何约束。
- **SecurityContextDeny**：此准入控制器将拒绝任何试图设置某些升级的 SecurityContext 字段的 pod。
- **ServiceAccount**：此准入控制器实现 serviceAccounts 的自动化。
- **用中的存储对象保护**：该`StorageObjectInUseProtection`插件将`kubernetes.io/pvc-protection`或`kubernetes.io/pv-protection`终结器添加到新创建的持久卷声明（PVC）或持久卷（PV）。在用户删除 PVC 或 PV 的情况下，PVC 或 PV 不会被移除，直到 PVC 或 PV 保护控制器从 PVC 或 PV 中移除终结器。有关更多详细信息，请参阅使用中的[存储对象保护](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#storage-object-in-use-protection)。
- **ValidatingAdmissionWebhook（1.8 版本中为 alpha；1.9 版本中为 beta）**：该准入控制器调用与请求匹配的任何验证 webhook。匹配的 webhooks 是并行调用的；如果其中任何一个拒绝请求，则请求失败。

## 推荐配置

**Kubernetes 1.10+**

对于 Kubernetes 1.10 及更高版本，我们建议使用`--enable-admission-plugins`标志运行以下一组准入控制器（**顺序无关紧要**）。

> **注意：** `--admission-control`在 1.10 中已弃用并替换为`--enable-admission-plugins`。

```bash
--enable-admission-plugins=NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,DefaultTolerationSeconds,MutatingAdmissionWebhook,ValidatingAdmissionWebhook,ResourceQuota
```

对于 Kubernetes 1.9 及更早版本，我们建议使用`--admission-control`标志（**顺序有关**）运行以下一组许可控制器。

**Kubernetes 1.9**

```bash
--admission-control=NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,DefaultTolerationSeconds,MutatingAdmissionWebhook,ValidatingAdmissionWebhook,ResourceQuota
```

值得重申的是，在 1.9 中，这些发生在变更阶段和验证阶段，并且例如`ResourceQuota`在验证阶段运行，因此是运行的最后一个准入控制器。 `MutatingAdmissionWebhook`在此列表中出现在它之前，因为它在变更阶段运行。

对于早期版本，没有验证准入控制器和变更准入控制器的概念，并且准入控制器以指定的确切顺序运行。

**Kubernetes 1.6 - 1.8**

```bash
--admission-control=NamespaceLifecycle,LimitRanger,ServiceAccount,PersistentVolumeLabel,DefaultStorageClass,ResourceQuota,DefaultTolerationSeconds
```

## 参考

- [Using Admission Controllers - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/)
