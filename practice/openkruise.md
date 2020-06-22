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
- [AdvancedStatefulSet](https://github.com/openkruise/kruise/blob/master/docs/concepts/astatefulset/README.md)：基于原生 [StatefulSet](../concepts/statefulset.md) 之上的增强版本，默认行为与原生完全一致，在此之外提供了原地升级、并行发布（最大不可用）、发布暂停等功能。
- [SidecarSet](https://github.com/openkruise/kruise/blob/master/docs/concepts/sidecarSet/README.md)：对 sidecar 容器做统一管理，在满足 selector 条件的 Pod 中注入指定的 sidecar 容器。
- [UnitedDeployment](https://github.com/openkruise/kruise/blob/master/docs/concepts/uniteddeployment/README.md): 通过多个 subset workload 将应用部署到多个可用区。
- [BroadcastJob](https://github.com/openkruise/kruise/blob/master/docs/concepts/broadcastJob/README.md): 配置一个 job，在集群中所有满足条件的 Node 上都跑一个 Pod 任务。

**关于命名规范**

Kruise 中的扩展控制器采用与 Kubernetes 社区一致的命名规范：

- `Set` 后缀：这类 controller 会直接操作和管理 Pod，比如 `CloneSet`、`ReplicaSet`、`SidecarSet` 等。它们提供了 Pod 维度的多种部署、发布策略。
- `Deployment` 后缀：这类 controller 不会直接地操作 Pod，它们通过操作一个或多个 `Set` 类型的 workload 来间接管理 Pod，比如 `Deployment` 管理 `ReplicaSet` 来提供一些额外的滚动策略，以及 `UnitedDeployment` 支持管理多个 `StatefulSet`/`AdvancedStatefulSet` 来将应用部署到不同的可用区。
- `Job` 后缀：这类 controller 主要管理短期执行的任务，比如 `BroadcastJob` 支持将任务类型的 Pod 分发到集群中所有 Node 上。

### CloneSet

[CloneSet](https://github.com/openkruise/kruise/blob/master/docs/concepts/cloneset/README.md) 是对 [Deployment](../concepts/deployment.md) 的增强版，主要用于管理对实例顺序没有要求的无状态应用。

下面是一个 CloneSet 的配置示例。

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: CloneSet
metadata:
  labels:
    app: sample
  name: sample-data
spec:
  replicas: 3
  scaleStrategy:
    podsToDelete:
    - sample-9m4hp # 选择性的删除单个 pod
  updateStrategy:
    priorityStrategy: # 优先级策略
      weightPriority: #
      - weight: 50
        matchSelector:
          matchLabels:
            test-key: foo
      - weight: 30
        matchSelector:
          matchLabels:
            test-key: bar
      orderPriority:
      - orderedKey: some-label-key
      scatterStrategy:
      - key: foo
        value: bar
    updateStrategy: # 升级策略
      type: InPlaceIfPossible # 升级策略里增加了原地升级
      maxUnavailable: 2 # 升级时最多有多少个实例不可用
  selector:
    matchLabels:
      app: sample
  template:
    metadata:
      labels:
        app: sample
    spec:
      containers:
      - name: nginx
        image: nginx
        volumeMounts:
        - name: data-vol
          mountPath: /usr/share/nginx/html
  volumeClaimTemplates: # 为 每个 Pod 设置 PVC
    - metadata:
        name: data-vol
      spec:
        accessModes: [ "ReadWriteOnce" ]
        resources:
          requests:
            storage: 10Gi
```

**CloneSet 是对 Deployment 的增强**

对于 Kubernetes 原生支持的 Deployment 控制器， CloneSet 在以下方面做出了增强：

- 支持原地升级（In Place Update），需要在 `updateStrategy` 中配置，默认的升级策略为 `ReCreate`；
- 支持为每个 Pod 设置 PVC；
- 支持选择性的删除某个 Pod；
- 更加高级的升级和发布策略；

关于 CloneSet 的详细描述请见 [Kruise 仓库](https://github.com/openkruise/kruise/blob/master/docs/concepts/cloneset/README.md)。

### AdvancedStatefulSet

[AdvancedStatefulSet](https://github.com/openkruise/kruise/blob/master/docs/concepts/astatefulset/README.md) 是对 Kubernetes 原生的 [StatefulSet](../concepts/statefulset.md) 的增强。

下面是一个 AdvancedStatefulSet 的配置示例。

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: StatefulSet
metadata:
  name: sample
spec:
  replicas: 3
  serviceName: my-service
  selector:
    matchLabels:
      app: sample
  template:
    metadata:
      labels:
        app: sample
    spec:
      readinessGates:
         # 一个新的条件，确保 pod 在原地更新时保持在 NotReady 状态。
      - conditionType: InPlaceUpdateReady
      containers:
      - name: nginx
        image: nginx:alpine
  podManagementPolicy: Parallel # 允许并行更新，与 maxUnavailable 一起使用。
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      # 如果可以的话做原地更新，目前原地更新只支持镜像更新。
      podUpdatePolicy: InPlaceIfPossible
      # 允许并行更新，最大不可用实例数等于 2。
      maxUnavailable: 2
      # 可以按照特定的顺序更新 pod，而不是按照 pod 名称的顺序。
      unorderedUpdate:
        priorityStrategy:
          weightPriority:
          - weight: 50
            matchSelector:
              matchLabels:
                test-key: foo
          - weight: 30
            matchSelector:
              matchLabels:
                test-key: bar
```

**AdvancedStatefulSet 是对 StatefulSet 的增强**

AdvancedStatefulSet 基本保留了 Kubernetes 原生的 [StatefulSet](../concepts/statefulset.md) 的使用用法。在声明 AdvancedStatefulSet 时保留了 CRD 的名字 `StatefulSet`，不过将原来的 `apiVersion` 的值从 `apps/v1` 修改为了 `apps.kruise.io/v1alpha1` ，并做出的如下方面的增强：

- 支持原地升级，同 CloneSet 一样，需要在 `updateStrategy` 中配置，默认的升级策略为 `ReCreate`；
- 支持更高级的更新策略，例如根据权重按照特定的顺序更新 pod，而不是按照 pod 的名称顺序；

关于 AdvancedStatefulSet 的详细描述请见 [Kruise 仓库](https://github.com/openkruise/kruise/blob/master/docs/concepts/astatefulset/README.md)。

### SidecarSet

[SidecarSet](https://github.com/openkruise/kruise/blob/master/docs/concepts/sidecarSet/README.md) 利用了 Kubernetes 的 mutating webhook 准入控制器，在 pod 创建时向其中自动注入 sidecar 容器，这个与 [Istio](https://istio.io) 的做法一致。

下面是一个 SidecarSet 的配置示例。

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: SidecarSet
metadata:
  name: test-sidecarset
spec:
  selector:
    matchLabels:
      app: nginx
  strategy:
    rollingUpdate:
      maxUnavailable: 2
  containers:
  - name: sidecar1
    image: centos:6.7
    command: ["sleep", "999d"] # do nothing at all
    volumeMounts:
    - name: log-volume
      mountPath: /var/log
  volumes: # this field will be merged into pod.spec.volumes
  - name: log-volume
    emptyDir: {}
```

**SidecarSet 的主要功能**

Sidecar 容器的生命周期独立于整个 Pod，实现如下功能：

- SidecarSet 可以向指定的 Pod 中注入 Sidecar 容器；
- Sidecar 容器可以可原地升级（仅当更新镜像时）；

关于 SidecarSet 的详细描述请见 [Kruise 仓库](https://github.com/openkruise/kruise/blob/master/docs/concepts/sidecarSet/README.md)。

### UnitedDeployment

[UnitedDeployment](https://github.com/openkruise/kruise/blob/master/docs/concepts/uniteddeployment/README.md) 主要用于分组发布，通过定义 subset 将工作负载发布到不同的可用区中。Kubernetes 集群中的不同域由多组由标签识别的节点表示。UnitedDeployment 控制器为每组提供一种类型的工作负载，并提供相应匹配的 NodeSelector，这样各个工作负载创建的 pod 就会被调度到目标域。

UnitedDeployment 管理的每个工作负载称为子集。每个域至少要提供运行 n 个副本数量的 pod 的能力。目前仅支持 StatefulSet 工作负载。下面的示例 YAML 展示了一个 UnitedDeployment，它在三个域中管理三个 StatefulSet 实例。管理的 pod 总数为 6。

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: UnitedDeployment
metadata:
  name: sample
spec:
  replicas: 6
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app: sample
  template:
    statefulSetTemplate:
      metadata:
        labels:
          app: sample
      spec:
        template:
          metadata:
            labels:
              app: sample
          spec:
            containers:
            - image: nginx:alpine
              name: nginx
  topology:
    subsets:
    - name: subset-a
      nodeSelector:
        nodeSelectorTerms:
        - matchExpressions:
          - key: node
            operator: In
            values:
            - zone-a
      replicas: 1
    - name: subset-b
      nodeSelector:
        nodeSelectorTerms:
        - matchExpressions:
          - key: node
            operator: In
            values:
            - zone-b
      replicas: 50%
    - name: subset-c
      nodeSelector:
        nodeSelectorTerms:
        - matchExpressions:
          - key: node
            operator: In
            values:
            - zone-c
  updateStrategy:
    manualUpdate:
      partitions:
        subset-a: 0
        subset-b: 0
        subset-c: 0
    type: Manual
...
```

**UnitedDeployment 的主要功能**

UnitedDeployment 主要功能即分组发布，控制不同可用区中的 StatefulSet 工作负载发布。

关于 UnitedDeployment 的详细描述请见 [Kruise 仓库](https://github.com/openkruise/kruise/blob/master/docs/concepts/uniteddeployment/README.md)。

### BroadcastJob

[BroadcastJob](https://github.com/openkruise/kruise/blob/master/docs/concepts/broadcastJob/README.md) 控制器在集群中的每个节点上分发一个 Pod。像 DaemonSet 一样，BroadcastJob 确保 Pod 被创建并在集群中的所有选定节点上运行一次。

BroadcastJob 在每个节点上的 Pod 运行完成后不会消耗任何资源。当升级一个软件，例如 Kubelet，或者在每个节点上进行验证检查时，BroadcastJob 特别有用，通常在很长一段时间内只需要一次，或者运行一个临时性的完整集群检查脚本。

BroadcastJob pod 也可以选择在所需节点上运行完成后保持存活，这样在每一个新节点被添加到集群后，就会自动启动一个 Pod。

下面是一个 BroadcastJob 的示例。

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: BroadcastJob
metadata:
  name: broadcastjob-ttl
spec:
  template:
    spec:
      containers:
        - name: pi
          image: perl
          command: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"]
      restartPolicy: Never
  completionPolicy:
    type: Always
    ttlSecondsAfterFinished: 30
```

BroadcastJob 的支持多种 `CompletionPolicy`  和 `FailurePolicy` 设置，关于 BroadcastJob 的详细描述请见 [Kruise 仓库](https://github.com/openkruise/kruise/blob/master/docs/concepts/broadcastJob/README.md)。、

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

## 总结

Kruise 在 Kubernetes 原生控制器基础上进行了扩展，主要增加了原地升级，更灵活的发布策略及多一些特殊场景的适配（如 SidecarSet、UnitedDeployment），CloneSet 可以完全替代 Deployment，AdvancedStatefulSet 可以完全替代 StatefulSet，且使用方式都类似，用户可以无负担的轻松接入。

## 参考

- [Kruise 中文文档 - github.com](https://github.com/openkruise/kruise/blob/master/README-zh_CN.md)
- [Kruise 控制器分类指引 - openkruise.io](http://openkruise.io/zh-cn/blog/blog1.html)