---
weight: 3
title: "节点自动扩缩：Cluster Autoscaler 与 Karpenter"
linktitle: 节点自动扩缩
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: node-autoscaling
description: "讲解节点层的自动扩缩：扩容（为 Pending Pod 供应节点）与整合（回收低利用率节点）两个方向的原理，Cluster Autoscaler 的节点组模型与扩展器策略，Karpenter 的 NodePool/NodeClass 模型、整合策略与中断预算，两者的选型对比，与 HPA/VPA/KEDA 的配合，以及 GPU 节点、Spot 实例与 PDB 等生产注意事项。"
---

> 工作负载自动扩缩解决"要多少 Pod"，节点自动扩缩解决"这些 Pod 放在哪台机器上"——后者直接决定账单。

[HPA、VPA 与 KEDA](../../controllers/vpa-and-keda) 调整的是 Pod 的数量与大小，而当集群现有节点容纳不下新的 Pod 时，就需要节点自动扩缩器（Node Autoscaler）向云平台申请新节点；反过来，当节点长期空闲或低利用率时，自动缩容与整合是云上成本优化最直接的手段。SIG Autoscaling 目前维护两个节点自动扩缩实现：Cluster Autoscaler 与 Karpenter。

## 节点自动扩缩的两个方向

**扩容**（Provisioning）由 Pending 状态的 Pod 驱动。自动扩缩器监听带有 `Unschedulable` 条件的 Pod，用调度器相同的约束（资源 requests、节点选择器、亲和性、污点容忍、拓扑分布）模拟判断"如果新增某种节点，这些 Pod 能否被调度"，然后向云平台发起创建请求。节点就绪并注册后，调度器正常把 Pod 调度上去。这意味着：

- 自动扩缩器只看 **requests**，不看实际用量——requests 设置失真会直接导致扩容过度或不足
- 不满足任何节点类型约束的 Pod（如请求的 GPU 类型没有对应节点池）会一直 Pending
- 扩容延迟 = 决策周期（10 秒级） + 云平台创建实例（1 – 3 分钟） + 节点引导与镜像拉取

**整合**（Consolidation）则试图在满足所有 Pod 约束的前提下减少节点数或替换为更便宜的节点。自动扩缩器会选择候选节点、模拟其上的 Pod 能否全部迁移到其他节点（或迁移到一台新的更小节点），通过则先设置污点、再逐个驱逐 Pod（遵守 PDB），最后删除节点。整合的激进程度与业务中断风险直接相关，是最需要精细配置的部分。

## Cluster Autoscaler

[Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler)（CA）是最早的实现，版本号与 Kubernetes 小版本对齐（v1.37 集群对应 CA 1.37.x），支持 30 余种云平台与 Cluster API。它的核心抽象是**节点组**（Node Group）：预先定义的、同构的实例集合（AWS Auto Scaling Group、GCP MIG、Azure VMSS、Cluster API 的 MachineDeployment），每个节点组有最小/最大节点数，CA 只在这些边界内调整数量。

```yaml
# 以 AWS 为例的关键启动参数
- ./cluster-autoscaler
- --cloud-provider=aws
- --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/my-cluster
- --expander=least-waste            # 多个节点组都能容纳时的选择策略
- --balance-similar-node-groups     # 跨可用区的同构节点组均衡扩容
- --skip-nodes-with-local-storage=false
- --scale-down-utilization-threshold=0.5   # 利用率低于 50% 的节点成为缩容候选
- --scale-down-unneeded-time=10m           # 持续低利用 10 分钟后缩容
- --scale-down-delay-after-add=10m         # 扩容后 10 分钟内不缩容
- --max-node-provision-time=15m
```

扩展器（Expander）决定多个节点组都能满足时选哪个：`random`、`most-pods`、`least-waste`（浪费最少的资源）、`price`（最便宜，需云平台支持）、`priority`（按 ConfigMap 中的优先级正则），可用逗号组合形成多级决策。CA 的缩容基于利用率阈值且只能删除整台节点，不会主动把两台半满的节点合并到一台更合适的机型上。

CA 的优势在于成熟、云平台覆盖广、与托管服务（EKS Managed Node Groups、GKE 节点池、AKS 节点池）深度集成——GKE 与 AKS 的内置自动扩缩即基于 CA。它的局限是"节点组"模型要求管理员预先枚举机型组合：要支持 10 种机型 × 3 个可用区 × 按需/Spot 就需要 60 个节点组，且每个节点组内部不能混用机型。

## Karpenter

[Karpenter](https://karpenter.sh/) 由 AWS 发起、2023 年捐赠给 SIG Autoscaling，核心库 `kubernetes-sigs/karpenter` 当前为 v1.15，云平台实现包括 AWS（GA）、Azure（GA）以及社区维护的 GCP、阿里云、Cluster API 等。它放弃了节点组，直接面向云平台的实例 API 做"即时供应"：根据 Pending Pod 的聚合需求，在允许的机型范围内挑选最合适、最便宜的实例类型逐台创建，并用 `NodeClaim` 对象跟踪每个节点的生命周期。

两个核心 CRD 是 `NodePool`（供应约束与中断策略，云无关）与云平台特定的 `NodeClass`（如 `EC2NodeClass`，定义 AMI、子网、安全组、磁盘）：

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: general
spec:
  template:
    metadata:
      labels:
        team: platform
    spec:
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
      requirements:                             # 允许的机型范围，Karpenter 在其中按价格择优
      - key: karpenter.sh/capacity-type
        operator: In
        values: ["spot", "on-demand"]
      - key: kubernetes.io/arch
        operator: In
        values: ["amd64", "arm64"]
      - key: karpenter.k8s.aws/instance-category
        operator: In
        values: ["c", "m", "r"]
      - key: karpenter.k8s.aws/instance-generation
        operator: Gt
        values: ["5"]
      expireAfter: 720h                         # 节点最长存活 30 天，强制轮换以更新 AMI
      terminationGracePeriod: 48h               # 中断时给 Pod 的最长排空时间
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 1m
    budgets:
    - nodes: "10%"                              # 任意时刻最多中断 10% 节点
    - schedule: "0 9 * * mon-fri"               # 工作日白天禁止主动整合
      duration: 8h
      nodes: "0"
  limits:
    cpu: "1000"
    memory: 4000Gi
  weight: 10
---
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: default
spec:
  amiSelectorTerms:
  - alias: al2023@latest
  role: KarpenterNodeRole-my-cluster
  subnetSelectorTerms:
  - tags: { karpenter.sh/discovery: my-cluster }
  securityGroupSelectorTerms:
  - tags: { karpenter.sh/discovery: my-cluster }
  blockDeviceMappings:
  - deviceName: /dev/xvda
    ebs: { volumeSize: 100Gi, volumeType: gp3, encrypted: true }
```

Karpenter 的几个关键特性：

- **装箱式供应**：一批 Pending Pod 会被聚合后选择一台或少数几台恰好容纳的实例，而不是按固定机型逐台加；Spot 场景下自动在多种机型中选择中断率低、价格优的组合
- **主动整合**：`WhenEmptyOrUnderutilized` 策略下，Karpenter 会持续评估能否删除节点或把节点替换为更便宜的机型（如把 `m5.2xlarge` 换成当前更便宜的 `m6a.xlarge` + 迁移 Pod），`Balanced` 则在成本与中断之间折中；配合 `budgets` 控制速度与时间窗口
- **节点到期与漂移**：`expireAfter` 强制定期轮换节点以应用新的 AMI 与补丁；修改 `NodeClass` 后现有节点被标记为"漂移"（Drift）并按预算逐步替换，实现声明式的节点生命周期管理
- **Spot 中断处理**：通过云平台事件（EC2 Spot 中断通知、计划维护）提前排空节点，与 [节点优雅关机](../../cluster/kubelet-resource-management) 配合

## 选型对比

{{< table title="Cluster Autoscaler 与 Karpenter 对比" >}}

| 维度 | Cluster Autoscaler | Karpenter |
|------|-------------------|-----------|
| 节点模型 | 预定义节点组，组内同构 | 无节点组，按约束范围即时选择机型 |
| 扩容速度 | 依赖节点组 API，通常 2 – 4 分钟 | 直接调用实例 API，通常 1 – 2 分钟 |
| 机型灵活性 | 需为每种机型/区/容量类型建组 | 一个 NodePool 覆盖数百种机型 |
| 缩容/整合 | 按利用率阈值删除整台节点 | 删除或替换为更便宜机型，预算与时间窗控制 |
| 节点生命周期 | 不管理，由节点组/托管服务负责 | 到期轮换、漂移替换、AMI 声明式更新 |
| 云平台支持 | 30+（含私有云、Cluster API） | AWS、Azure GA；GCP、阿里云、CAPI 等社区实现 |
| 与托管服务集成 | GKE/AKS 内置；EKS Managed Node Groups | EKS Auto Mode 内置；AKS Node Autoprovisioning（NAP）内置 |
| 成熟度 | 2016 年起，极为成熟 | 2021 年起，AWS 上大规模生产验证 |

{{< /table >}}

实践中的建议：在 AWS 或 Azure 上的新集群优先选择 Karpenter，其机型灵活性与整合能力带来的成本节省通常在 20% – 40%；多云、私有云或依赖 Cluster API 的环境使用 CA；GKE 直接使用内置的节点自动供应（NAP）即可。两者可以共存但不应管理同一批节点，常见组合是系统组件所在的固定节点池由 CA/托管服务管理，弹性工作负载由 Karpenter 供应。

## 与工作负载扩缩的配合

节点扩缩与 Pod 扩缩是两个独立但相互触发的回路：HPA/KEDA 增加副本 → 新 Pod Pending → 节点扩容；HPA 减少副本 → 节点利用率下降 → 整合回收。配合时需注意：

- **requests 准确性**是一切的前提，[VPA](../../controllers/vpa-and-keda) 推荐模式可持续校准
- **扩容预热**：对延迟敏感的服务，可部署低优先级（负 `PriorityClass` 值）的"占位 Pod"预留一台空闲节点，真正的业务 Pod 到来时抢占占位 Pod 立即调度，节点扩缩器随后为被抢占的占位 Pod 补充节点，详见 [优先级与抢占](../../cluster/priority-and-preemption)
- **PDB** 是整合时的安全网，没有 PDB 的多副本应用可能在整合中被同时驱逐；但过于严格的 PDB（如 `maxUnavailable: 0`）会让节点永远无法回收，Karpenter 与 CA 都会在日志与事件中报告被 PDB 阻塞的节点
- **DaemonSet 与系统 Pod** 不会阻止缩容；带本地存储（`emptyDir` 外的 hostPath/local PV）的 Pod、未被控制器管理的裸 Pod、以及带 `cluster-autoscaler.kubernetes.io/safe-to-evict: "false"` 或 `karpenter.sh/do-not-disrupt: "true"` 注解的 Pod 会阻止其所在节点被回收

## GPU 与 AI 工作负载

GPU 节点昂贵且启动慢（驱动与 CUDA 镜像拉取），自动扩缩需要额外考虑：

- 在 NodePool/节点组上设置 `nvidia.com/gpu` 等污点，确保只有显式请求 GPU 的 Pod 落到 GPU 节点；Karpenter 可按 `karpenter.k8s.aws/instance-gpu-name` 等标签精确约束 GPU 型号
- 扩容器依赖设备插件或 DRA 驱动在节点上报告 GPU 容量；节点就绪到 GPU 可用之间有延迟，CA 需配置 `--gpu-total` 相关的节点组标签让其在模拟时预知 GPU 数量，Karpenter 则从实例类型元数据直接获知
- 训练任务通常以 Job/JobSet 形式成组启动，配合 [Kueue](../../controllers/job-advanced) 等队列系统做准入后再触发节点扩容，避免部分 Pod 就绪、部分等待节点的"半启动"浪费；GenericWorkload/成组调度的进展也将改善这一点
- GPU 节点的整合要格外保守：训练中的 Pod 被驱逐意味着丢失检查点以来的进度，应设置 `karpenter.sh/do-not-disrupt` 注解或更长的 `terminationGracePeriod`

## 总结

节点自动扩缩把"有多少机器"从容量规划变成了由工作负载需求实时驱动的闭环。Cluster Autoscaler 以节点组为单位稳健地增减节点，覆盖几乎所有基础设施；Karpenter 则跳过节点组直接按 Pod 需求选择最优实例，并以到期、漂移与整合预算实现声明式的节点生命周期管理。无论选择哪一个，准确的资源 requests、合理的 PDB 与明确的中断预算，都是让自动扩缩既省钱又不伤业务的前提。

## 参考文献

- [Node Autoscaling - kubernetes.io](https://kubernetes.io/docs/concepts/cluster-administration/node-autoscaling/)
- [Cluster Autoscaler FAQ - github.com](https://github.com/kubernetes/autoscaler/blob/master/cluster-autoscaler/FAQ.md)
- [Karpenter Documentation - karpenter.sh](https://karpenter.sh/docs/)
- [Karpenter NodePools - karpenter.sh](https://karpenter.sh/docs/concepts/nodepools/)
- [Karpenter Disruption - karpenter.sh](https://karpenter.sh/docs/concepts/disruption/)
- [kubernetes-sigs/karpenter - github.com](https://github.com/kubernetes-sigs/karpenter)
