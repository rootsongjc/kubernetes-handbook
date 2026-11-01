---
weight: 73
title: "调度约束：节点选择、亲和性与拓扑分布"
linktitle: 调度约束
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: scheduling-constraints
description: "系统介绍 Kubernetes 中控制 Pod 落点的四类调度约束：nodeSelector、节点亲和性、Pod 亲和/反亲和、拓扑分布约束，解释硬/软约束语义、拓扑键、matchLabelKeys、minDomains、nodeAffinityPolicy 等字段，并给出跨可用区高可用部署的推荐组合。"
---

> 调度约束表达的是业务对"在哪里运行"的意图：高可用要分散、低延迟要聚合、特殊硬件要匹配——四种机制各管一段，组合起来才是完整答案。

默认情况下 kube-scheduler 只保证 Pod 落到有足够资源的节点上，不关心 Pod 之间的相对位置。但真实的生产需求远不止于此：数据库副本必须分布在不同可用区，GPU 任务必须落到带特定型号显卡的节点，缓存应与访问它的服务同处一个机架，同一服务的副本要尽量均匀铺开而不是挤在一台机器上。Kubernetes 提供了四类调度约束来表达这些意图，本文逐一介绍并说明如何组合使用。

## 四类约束概览

{{< table title="Kubernetes 调度约束对比" >}}

| 机制 | 字段 | 决策依据 | 支持软约束 | 典型用途 |
|------|------|----------|------------|----------|
| 节点选择器 | `spec.nodeSelector` | 节点标签精确匹配 | 否 | 简单的"只能跑在某类节点" |
| 节点亲和性 | `spec.affinity.nodeAffinity` | 节点标签表达式（In/NotIn/Exists/Gt/Lt） | 是 | 复杂节点选择、偏好某类节点 |
| Pod 亲和/反亲和 | `spec.affinity.podAffinity` / `podAntiAffinity` | 拓扑域内是否已有匹配标签的 Pod | 是 | 与某服务同置、副本互斥 |
| 拓扑分布约束 | `spec.topologySpreadConstraints` | 各拓扑域内匹配 Pod 的数量差 | 是 | 跨可用区/节点均匀分布 |

{{< /table >}}

除这四类外，污点与容忍（见 [Taint 和 Toleration](../taint-and-toleration)）从节点侧"排斥"Pod，与亲和性从 Pod 侧"选择"节点互为补充；`spec.nodeName` 则完全绕过调度器直接绑定节点，仅用于静态 Pod 等特殊场景。

## 节点选择器

`nodeSelector` 是最简单的约束：Pod 只会被调度到拥有全部指定标签的节点。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-job
spec:
  nodeSelector:
    nvidia.com/gpu.product: NVIDIA-H100-80GB-HBM3
    topology.kubernetes.io/zone: cn-beijing-a
  containers:
  - name: train
    image: my-trainer:1.0
```

Kubernetes 为每个节点自动维护一组众所周知的标签，是编写约束时最常用的拓扑键：

{{< table title="常用的内建节点标签" >}}

| 标签 | 含义 | 设置者 |
|------|------|--------|
| `kubernetes.io/hostname` | 节点主机名 | kubelet |
| `kubernetes.io/os`、`kubernetes.io/arch` | 操作系统与 CPU 架构（linux/amd64、arm64 等） | kubelet |
| `topology.kubernetes.io/zone` | 可用区 | 云控制器 / 管理员 |
| `topology.kubernetes.io/region` | 地域 | 云控制器 / 管理员 |
| `node.kubernetes.io/instance-type` | 云实例规格 | 云控制器 |
| `node-role.kubernetes.io/control-plane` | 控制面节点 | kubeadm |

{{< /table >}}

GPU 型号、内核特性等硬件标签通常由 [Node Feature Discovery](https://kubernetes-sigs.github.io/node-feature-discovery/)（NFD）或 NVIDIA GPU Feature Discovery 自动打上。

## 节点亲和性

节点亲和性是 `nodeSelector` 的超集，支持集合运算符、多组条件以及"尽量满足"的软约束：

```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:     # 硬约束：不满足则不调度
        nodeSelectorTerms:
        - matchExpressions:
          - key: topology.kubernetes.io/zone
            operator: In
            values: [cn-beijing-a, cn-beijing-b]
          - key: node.kubernetes.io/instance-type
            operator: NotIn
            values: [ecs.t6-c1m1.large]
      preferredDuringSchedulingIgnoredDuringExecution:    # 软约束：按权重加分
      - weight: 80
        preference:
          matchExpressions:
          - key: karpenter.sh/capacity-type
            operator: In
            values: [spot]
      - weight: 20
        preference:
          matchExpressions:
          - key: node.kubernetes.io/instance-type
            operator: In
            values: [ecs.g8i.xlarge]
```

语义要点：

- `nodeSelectorTerms` 中的多个条目是**或**关系，单个条目内的 `matchExpressions` 是**与**关系
- `IgnoredDuringExecution` 表示约束只在调度时评估，Pod 运行后节点标签变化不会触发驱逐；`RequiredDuringExecution` 变体至今未实现，需要该语义时可用污点的 `NoExecute` 效果
- 软约束的 `weight` 取值 1 – 100，调度器把所有满足的偏好权重相加作为该节点的亲和性得分，再与其他打分插件的结果合并
- 运算符 `Gt`/`Lt` 只对整数字符串有效，常用于按 CPU 核数、显存大小等数值标签筛选
- `matchFields` 可按节点字段（目前仅 `metadata.name`）匹配

## Pod 亲和性与反亲和性

Pod 亲和性依据**其他 Pod 的位置**做决策：在某个拓扑域（由 `topologyKey` 指定的节点标签划分）内，若已存在匹配 `labelSelector` 的 Pod，则该域对当前 Pod 具有亲和（吸引）或反亲和（排斥）效果。

```yaml
spec:
  affinity:
    podAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchLabels:
            app: redis-cache
        topologyKey: topology.kubernetes.io/zone        # 与缓存同可用区
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchLabels:
            app: web
        topologyKey: kubernetes.io/hostname             # 同一节点不放两个 web 副本
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app: web
          topologyKey: topology.kubernetes.io/zone      # 尽量跨可用区
```

几个实践中容易踩坑的细节：

- `labelSelector` 默认只匹配**同命名空间**的 Pod，跨命名空间需显式写 `namespaces` 或 `namespaceSelector`
- 硬反亲和 + `topologyKey: kubernetes.io/hostname` 意味着副本数不能超过节点数，扩容时会出现 Pending；跨可用区分散更推荐用拓扑分布约束
- Pod 亲和性需要扫描所有节点上的 Pod，在数千节点集群中开销显著高于节点亲和性，应避免在大规模 DaemonSet 类工作负载上使用
- `matchLabelKeys`（v1.33 GA）可把当前 Pod 自身的某些标签值自动合并进 `labelSelector`，典型用法是加上 `pod-template-hash`，让反亲和只在**同一次 Deployment 版本**的副本间生效，避免滚动更新时新旧版本互相排斥导致卡住：

```yaml
podAntiAffinity:
  requiredDuringSchedulingIgnoredDuringExecution:
  - labelSelector:
      matchLabels:
        app: web
    matchLabelKeys: [pod-template-hash]
    topologyKey: kubernetes.io/hostname
```

`mismatchLabelKeys` 则相反，用于"与标签值不同的 Pod 共置"，例如多租户场景中让不同 `tenant` 的 Pod 分开。

## 拓扑分布约束

拓扑分布约束（Topology Spread Constraints）解决的是"均匀铺开"问题：以 `topologyKey` 划分拓扑域，要求各域内匹配 Pod 的数量之差不超过 `maxSkew`。相比反亲和性的"要么同域要么不同域"二元语义，它能表达"3 个可用区各放 2 个副本"这样的量化分布，且在域数少于副本数时仍可正常工作。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 6
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule            # 硬约束
        labelSelector:
          matchLabels:
            app: web
        matchLabelKeys: [pod-template-hash]         # 只在同一版本内计算倾斜
        minDomains: 3                               # 至少铺开到 3 个可用区
      - maxSkew: 2
        topologyKey: kubernetes.io/hostname
        whenUnsatisfiable: ScheduleAnyway           # 软约束：尽量按节点均匀
        labelSelector:
          matchLabels:
            app: web
      containers:
      - name: web
        image: nginx:1.27
```

{{< table title="拓扑分布约束字段说明" >}}

| 字段 | 说明 | 状态 |
|------|------|------|
| `maxSkew` | 任意两个拓扑域内匹配 Pod 数量的最大允许差值，必须 ≥ 1 | GA |
| `topologyKey` | 划分拓扑域的节点标签键 | GA |
| `whenUnsatisfiable` | `DoNotSchedule`（硬）或 `ScheduleAnyway`（软，尽量减小倾斜） | GA |
| `labelSelector` | 统计哪些 Pod | GA |
| `matchLabelKeys` | 把当前 Pod 的指定标签值并入选择器，滚动更新时避免新旧版本混算 | v1.27 Beta，v1.34 起与 `labelSelector` 合并语义 Beta |
| `minDomains` | 拓扑域少于该值时视为倾斜，迫使调度器"撑开"域数；仅 `DoNotSchedule` 时有效 | v1.30 GA |
| `nodeAffinityPolicy` | 计算倾斜时是否只统计满足 Pod 节点亲和性的节点（默认 `Honor`） | v1.33 GA |
| `nodeTaintsPolicy` | 计算倾斜时是否排除有不可容忍污点的节点（默认 `Ignore`） | v1.33 GA |

{{< /table >}}

两个经常被忽视的默认行为：

- 拓扑域的集合由**集群中存在的节点标签值**决定。若某可用区暂时没有节点（例如节点池缩容到零），该域不会被计入，`minDomains` 正是为此而设
- 默认 `nodeTaintsPolicy: Ignore` 会把带污点的节点（如控制面节点）也算进拓扑域，可能导致"控制面所在可用区副本为 0"被判定为倾斜而无法调度，生产中通常应设为 `Honor`

### 集群级默认约束

管理员可以在调度器配置中为所有未声明 `topologySpreadConstraints` 的 Pod 设置默认约束。Kubernetes 自身的内建默认值是：按可用区 `maxSkew: 3` 软约束、按主机名 `maxSkew: 5` 软约束，均只统计同一 Service/ReplicaSet/StatefulSet 下的 Pod。可通过 `PodTopologySpread` 插件参数覆盖：

```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
profiles:
- schedulerName: default-scheduler
  pluginConfig:
  - name: PodTopologySpread
    args:
      defaultConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: ScheduleAnyway
      defaultingType: List
```

## 推荐组合

不同目标对应的推荐写法如下：

{{< table title="常见调度目标与推荐约束组合" >}}

| 目标 | 推荐做法 | 不推荐 |
|------|----------|--------|
| 跨可用区高可用 | `topologySpreadConstraints`（zone，`DoNotSchedule`，`minDomains`）+ 按节点的软分布 | 硬 Pod 反亲和（域数不足即 Pending） |
| 同节点最多一个副本 | 拓扑分布按 `hostname`、`maxSkew: 1`、`DoNotSchedule`；或硬反亲和 + `matchLabelKeys` | 不带 `matchLabelKeys` 的硬反亲和（滚动更新易卡住） |
| 必须使用特定硬件 | `nodeAffinity` 硬约束 + 节点污点让其他 Pod 远离；GPU 场景优先用 DRA 按属性申请 | 仅靠 `nodeSelector` 而不加污点，普通 Pod 会挤占昂贵节点 |
| 与依赖服务就近 | 软 Pod 亲和（zone），配合 Service `trafficDistribution: PreferSameZone` 让流量也就近 | 硬亲和（依赖服务不可用时自身也无法调度） |
| 偏好 Spot 节点但允许回退 | `preferredDuringScheduling` 节点亲和 + 容忍 Spot 污点 | 硬约束到 Spot（容量不足时 Pending） |
| 关键系统组件独占节点 | 节点污点 `NoSchedule` + 组件容忍 + `nodeAffinity` | 仅靠亲和性（无法阻止其他 Pod 进入） |

{{< /table >}}

所有约束都只在**调度时**评估。若运行后期望重新平衡（例如新增可用区后让副本分散过去），需要借助 [Descheduler](https://github.com/kubernetes-sigs/descheduler) 的 `RemovePodsViolatingTopologySpreadConstraint` 等策略驱逐后重调度。

## 排查调度失败

Pod 因约束无法调度时会停留在 `Pending`，`kubectl describe pod` 的事件中会给出各插件的过滤结果：

```text
Warning  FailedScheduling  0/12 nodes are available: 3 node(s) didn't match pod topology spread constraints,
4 node(s) didn't match Pod's node affinity/selector, 5 node(s) had untolerated taint {dedicated: gpu}.
preemption: 0/12 nodes are available: 12 Preemption is not helpful for scheduling.
```

依据消息逐项核对标签、拓扑域与污点，通常即可定位。`kubectl get nodes -L topology.kubernetes.io/zone` 可快速查看拓扑分布，`kubectl get pods -o wide --sort-by=.spec.nodeName` 查看实际落点。

## 总结

`nodeSelector` 与节点亲和性回答"能去哪些节点"，Pod 亲和/反亲和回答"和谁在一起或分开"，拓扑分布约束回答"如何均匀铺开"。生产中最常见的高可用部署应以拓扑分布约束为主、辅以 `matchLabelKeys` 避免滚动更新干扰，并把硬约束留给真正不可妥协的场景；对 GPU 等异构资源，则逐步把选择逻辑从节点标签迁移到 DRA 的属性选择器。

## 参考文献

- [Assigning Pods to Nodes - kubernetes.io](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/)
- [Pod Topology Spread Constraints - kubernetes.io](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/)
- [Well-Known Labels, Annotations and Taints - kubernetes.io](https://kubernetes.io/docs/reference/labels-annotations-taints/)
- [Scheduler Configuration - kubernetes.io](https://kubernetes.io/docs/reference/scheduling/config/)
