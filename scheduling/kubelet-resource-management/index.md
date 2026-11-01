---
weight: 76
title: "kubelet 节点资源管理：资源预留、节点压力驱逐、垃圾回收与资源管理器"
linktitle: kubelet 节点资源管理
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: kubelet-resource-management
description: "深入 kubelet 在节点侧的资源管理职责：Node Allocatable 与 kube-reserved/system-reserved/eviction 预留模型、节点压力驱逐的信号/阈值/Pod 选择顺序、镜像与容器垃圾回收、节点优雅关机，以及面向延迟敏感与 AI 负载的 CPU 管理器、内存管理器、拓扑管理器与 NUMA 对齐。"
---

> 调度器只看"节点声称有多少资源"，而节点能不能真的兑现这些承诺，取决于 kubelet 如何预留、如何驱逐、如何在 NUMA 之间摆放 CPU 和内存。

Kubernetes 的资源模型分两层：调度器在控制面按节点的**可分配资源**（Allocatable）做全局决策，kubelet 在节点侧负责把这些决策落实到 cgroup，并在资源真正紧张时保护节点不被压垮。本文聚焦后者——kubelet 的资源预留、节点压力驱逐、垃圾回收、优雅关机以及 CPU/内存/拓扑三大资源管理器，这些配置决定了节点的稳定性，也是 AI 训练与低延迟应用性能调优的关键。

## Node Allocatable 与资源预留

节点的物理容量（Capacity）不能全部交给 Pod：操作系统守护进程、kubelet、容器运行时都需要资源，还要为驱逐留出缓冲。kubelet 据此计算 **Allocatable**：

```text
Allocatable = Capacity − kube-reserved − system-reserved − eviction-threshold
```

三项预留通过 KubeletConfiguration 声明：

```yaml
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
kubeReserved:                    # 为 kubelet、容器运行时等 Kubernetes 系统组件预留
  cpu: "500m"
  memory: "1Gi"
  ephemeral-storage: "5Gi"
  pid: "1000"
systemReserved:                  # 为 sshd、journald 等操作系统守护进程预留
  cpu: "500m"
  memory: "1Gi"
  pid: "1000"
evictionHard:                    # 硬驱逐阈值，同样从 Allocatable 中扣除
  memory.available: "500Mi"
  nodefs.available: "10%"
enforceNodeAllocatable: [pods]   # 只对 Pod 的 cgroup 强制执行 Allocatable 上限
```

`enforceNodeAllocatable` 默认只包含 `pods`，即 kubelet 为所有 Pod 所在的顶层 cgroup（`kubepods`）设置资源上限等于 Allocatable。若把 `kube-reserved`/`system-reserved` 也加入列表，kubelet 会为对应的 cgroup（需通过 `kubeReservedCgroup`/`systemReservedCgroup` 指定）设置上限；这会在系统进程超出预留时直接 OOM 它们，官方建议只有在非常清楚各守护进程实际用量时才启用。

实际用量可用 `kubectl describe node` 查看 `Capacity`/`Allocatable` 两组值，以及 `Allocated resources` 中 Pod 请求的占用比例。云厂商托管节点池通常已按节点规格预设了阶梯式的预留公式，自建集群则需要依据节点上系统进程的实际用量压测后确定。

## 节点压力驱逐

当节点的内存、磁盘、inode 或 PID 低于阈值时，kubelet 会主动终止 Pod 回收资源，这一过程称为节点压力驱逐（Node-pressure Eviction）。它与 API 发起的驱逐（`kubectl drain`、抢占）不同：**不经过 API Server 的 Eviction 子资源，因此不受 PDB 约束**，Pod 会直接被置为 `Failed` 并带上 `DisruptionTarget` 条件。

### 驱逐信号

{{< table title="kubelet 驱逐信号" >}}

| 信号 | 含义 | 说明 |
|------|------|------|
| `memory.available` | 节点可用内存（Capacity − 工作集） | 基于 cgroup 的 `memory.workingSet`，不含 `active_file` 页缓存 |
| `nodefs.available` / `nodefs.inodesFree` | kubelet 根目录所在文件系统（日志、emptyDir、可写层）的可用空间与 inode | |
| `imagefs.available` / `imagefs.inodesFree` | 容器运行时存放镜像的文件系统 | 与 nodefs 同盘时两者等价 |
| `containerfs.available` / `containerfs.inodesFree` | 容器可写层所在文件系统（v1.31 起 Beta 的分离磁盘场景） | `KubeletSeparateDiskGC` 允许镜像与可写层分别位于不同磁盘 |
| `pid.available` | 节点剩余可用 PID 数 | 防止 fork 炸弹耗尽进程号 |

{{< /table >}}

### 硬阈值与软阈值

**硬阈值**（`evictionHard`）一旦触及立即驱逐，Pod 不享受宽限期。Linux 节点的默认值为：

```yaml
evictionHard:
  memory.available: "100Mi"
  nodefs.available: "10%"
  imagefs.available: "15%"
  nodefs.inodesFree: "5%"
  imagefs.inodesFree: "5%"
```

需要特别注意：**只要修改了其中任何一项，其余项的默认值都会被置为零而不是继承默认**，必须完整列出所有阈值；或者在 KubeletConfiguration 中设置 `mergeDefaultEvictionSettings: true`，让未指定的信号继承默认值。

**软阈值**（`evictionSoft`）触及后需持续超过 `evictionSoftGracePeriod` 才触发驱逐，且 Pod 可获得最多 `evictionMaxPodGracePeriod` 的终止宽限，适合把驱逐前移到更温和的水位：

```yaml
evictionSoft:
  memory.available: "1Gi"
  nodefs.available: "15%"
evictionSoftGracePeriod:
  memory.available: "1m30s"
  nodefs.available: "2m"
evictionMaxPodGracePeriod: 60
evictionMinimumReclaim:          # 每次驱逐至少回收的量，避免在阈值附近反复驱逐
  memory.available: "500Mi"
  nodefs.available: "1Gi"
evictionPressureTransitionPeriod: 5m   # 节点条件从 Pressure 恢复的最短观察期，防止抖动
```

### Pod 选择顺序

kubelet 驱逐时先尝试回收节点级资源（删除已退出容器、未使用镜像），仍不足再按以下顺序选择 Pod：

1. **用量是否超过 requests**：超出请求的 Pod 排在前面；BestEffort Pod 没有 requests，任何用量都视为超额
2. **Pod 优先级**：同为超额的 Pod 中，优先级低者先被驱逐
3. **超出量相对 requests 的比例**：超出越多越先驱逐

因此 QoS 等级只是间接影响驱逐顺序：Guaranteed 与 Burstable Pod 只要用量不超过 requests，就不会因其他 Pod 的内存压力而被驱逐（系统守护进程超出预留的极端情况除外）。静态 Pod 与 `system-node-critical` 优先级的 Pod 同样可能被驱逐，关键组件应设置准确的 requests 并避免超额使用。

驱逐后的 Pod 处于 `Failed` 状态并保留在 API 中供排障，由控制器在其他节点重建；节点会带上 `MemoryPressure`/`DiskPressure`/`PIDPressure` 条件及对应污点，调度器在条件清除前不再向其调度 BestEffort（内存压力）或任何新 Pod（磁盘压力）。

### 与内核 OOM 的关系

驱逐是 kubelet 的主动行为，默认每 10 秒评估一次；若内存消耗在两次评估之间急剧飙升，内核 OOM Killer 会先于 kubelet 介入。OOM Killer 依据 `oom_score_adj` 选择牺牲者，kubelet 为不同 QoS 的容器预设了该值：Guaranteed 为 −997、BestEffort 为 1000、Burstable 按 requests 占比在 2 – 999 之间。容器被 OOM 杀死后按 `restartPolicy` 原地重启，不会迁移到其他节点。v1.37 起 Beta 并默认开启的内存 QoS（cgroup v2 的 `memory.min`/`memory.high`）可以在接近 limits 时提前限流，减少硬 OOM。

## 垃圾回收

kubelet 定期清理节点上不再使用的镜像与容器，防止磁盘耗尽。

### 镜像垃圾回收

基于磁盘用量阈值：当镜像文件系统使用率超过 `imageGCHighThresholdPercent`（默认 85%）时，按最近最少使用的顺序删除未被任何容器引用的镜像，直到降至 `imageGCLowThresholdPercent`（默认 80%）。v1.35 GA 的 `imageMaximumGCAge` 额外提供基于时间的回收：超过该时长未使用的镜像即使磁盘充足也会被删除。

```yaml
imageGCHighThresholdPercent: 85
imageGCLowThresholdPercent: 80
imageMinimumGCAge: 2m          # 镜像拉取后至少保留的时间
imageMaximumGCAge: 168h        # 一周未使用即回收（v1.35 GA，0 表示禁用）
```

运行大模型镜像的节点应结合镜像卷的使用情况调高阈值或禁用基于时间的回收，避免数十 GB 的模型层被反复拉取。

### 容器垃圾回收

已退出的容器实例按 `maxPerPodContainerCount`（每个 Pod 每个容器保留的已退出实例数，默认 1）与 `maxContainerCount`（节点总数，默认 −1 不限）清理，保留的实例用于 `kubectl logs --previous` 查看崩溃日志。

## 节点优雅关机

`GracefulNodeShutdown`（v1.21 起 Beta 并默认开启）让 kubelet 通过 systemd inhibitor 锁拦截节点关机，在 `shutdownGracePeriod` 内按优先级分批终止 Pod：先终止普通 Pod，为 `shutdownGracePeriodCriticalPods` 保留的时间内再终止关键 Pod。

```yaml
shutdownGracePeriod: 60s
shutdownGracePeriodCriticalPods: 20s
# 或按优先级类精细分配（GracefulNodeShutdownBasedOnPodPriority）
shutdownGracePeriodByPodPriority:
- priority: 2000000000     # system-cluster-critical 及以上
  shutdownGracePeriodSeconds: 20
- priority: 1000000
  shutdownGracePeriodSeconds: 30
- priority: 0
  shutdownGracePeriodSeconds: 60
```

这对使用 Spot/抢占式实例的集群尤为重要：云厂商的回收通知通常只给 30 – 120 秒，优雅关机保证应用能在这一窗口内完成检查点与连接排空。

## 资源管理器：CPU、内存与拓扑

默认情况下，Linux 的 CFS 调度器会让容器进程在所有 CPU 核之间漂移，内存也可能分配在任意 NUMA 节点上。对数据库、网络功能虚拟化、分布式训练等延迟敏感或带宽敏感的负载，跨 NUMA 访问内存与 PCIe 设备会带来显著的性能抖动。kubelet 提供三个协同工作的资源管理器解决这一问题，它们都只对 **Guaranteed QoS 且 requests 为整数核** 的容器生效。

{{< table title="kubelet 资源管理器" >}}

| 管理器 | 配置字段 | 作用 | 状态 |
|--------|----------|------|------|
| CPU 管理器 | `cpuManagerPolicy: static` | 为符合条件的容器分配独占 CPU 核（cpuset），其余容器共享剩余核 | GA（v1.26），策略选项 GA（v1.33） |
| 内存管理器 | `memoryManagerPolicy: Static` | 保证容器的内存与 hugepages 来自指定 NUMA 节点 | GA（v1.32） |
| 拓扑管理器 | `topologyManagerPolicy` | 协调 CPU、内存、设备插件/DRA 设备的 NUMA 亲和性，使它们落在同一 NUMA 节点 | GA（v1.27），策略选项 GA（v1.32） |

{{< /table >}}

典型的高性能节点配置如下：

```yaml
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
cpuManagerPolicy: static
cpuManagerPolicyOptions:
  full-pcpus-only: "true"            # 只分配完整物理核，避免超线程兄弟核被其他容器占用
  distribute-cpus-across-numa: "true"
reservedSystemCPUs: "0-1"            # 系统与 kubelet 固定使用的核，与 kubeReserved/systemReserved 的 cpu 互斥
memoryManagerPolicy: Static
reservedMemory:
- numaNode: 0
  limits:
    memory: 1Gi
topologyManagerPolicy: single-numa-node
topologyManagerScope: pod            # 以 Pod 为单位对齐，而非逐容器
topologyManagerPolicyOptions:
  prefer-closest-numa-nodes: "true"
```

拓扑管理器的四种策略决定了对齐失败时的行为：

- `none`：不做对齐（默认）
- `best-effort`：尽量对齐，失败也准入
- `restricted`：要求首选对齐（如单 NUMA）可满足，否则拒绝 Pod（`TopologyAffinityError`）
- `single-numa-node`：要求所有资源来自同一个 NUMA 节点，否则拒绝

拓扑管理器通过 Hint Provider 接口从 CPU 管理器、内存管理器和设备插件收集每种资源可用的 NUMA 位掩码，再求交集选出共同的 NUMA 节点。DRA 驱动可以在 `ResourceSlice` 中以设备属性的形式暴露 NUMA 位置，但 DRA 与拓扑管理器的原生集成仍在 WG Device Management 推进中，当前需要由驱动或调度器插件自行处理对齐。`topologyManagerScope: pod` 让多容器 Pod（如训练进程 + RDMA Sidecar）整体落在同一 NUMA 节点，是 AI 训练节点的推荐设置。

### 与原地资源调整、Pod 级资源的关系

使用静态 CPU 管理器或内存管理器策略的 Pod 目前不能原地调整资源（独占资源的在线调整在 v1.37 仍为 Alpha）。Pod 级资源（`spec.resources`）与资源管理器的对齐需要开启 `PodLevelResourceManagers`（v1.37 Beta，默认关闭），否则管理器仍按容器级资源计算。

## 实践建议

- 所有节点显式配置 `kubeReserved`/`systemReserved` 与完整的 `evictionHard`，并开启 `mergeDefaultEvictionSettings` 避免漏项
- 为关键 Pod 设置准确的 requests 并避免运行时超额，这是免于节点压力驱逐的唯一保证
- 增加 `evictionSoft` 与 `evictionMinimumReclaim`，让驱逐发生在仍有余量时并一次回收足够资源
- Spot 节点开启优雅关机并按优先级分配宽限期
- 延迟敏感与 AI 节点池单独配置静态 CPU/内存管理器与 `single-numa-node` 拓扑策略，普通节点池保持默认以免浪费核
- 监控 `kubelet_evictions`、`kubelet_pod_resources_endpoint_*`、`container_oom_events_total` 等指标，驱逐与 OOM 频发意味着预留或 requests 需要修正

## 总结

kubelet 的资源管理决定了节点能否兑现调度器的承诺：预留模型划出系统与 Pod 的边界，驱逐机制在压力下有序牺牲低优先级与超额 Pod，垃圾回收与优雅关机维护节点的长期健康，CPU/内存/拓扑管理器则为高性能负载提供 NUMA 级的确定性。理解这些机制，才能把"节点有多少资源"与"应用实际能用多少"真正对齐。

## 参考文献

- [Reserve Compute Resources for System Daemons - kubernetes.io](https://kubernetes.io/docs/tasks/administer-cluster/reserve-compute-resources/)
- [Node-pressure Eviction - kubernetes.io](https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/)
- [Garbage Collection: Containers and Images - kubernetes.io](https://kubernetes.io/docs/concepts/architecture/garbage-collection/#containers-images)
- [Graceful Node Shutdown - kubernetes.io](https://kubernetes.io/docs/concepts/cluster-administration/node-shutdown/)
- [Control CPU Management Policies on the Node - kubernetes.io](https://kubernetes.io/docs/tasks/administer-cluster/cpu-management-policies/)
- [Control Topology Management Policies on a Node - kubernetes.io](https://kubernetes.io/docs/tasks/administer-cluster/topology-manager/)
- [Utilizing the NUMA-aware Memory Manager - kubernetes.io](https://kubernetes.io/docs/tasks/administer-cluster/memory-manager/)
