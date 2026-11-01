---
weight: 3
title: "Kubernetes 版本演进速览：v1.29 到 v1.37"
linktitle: 版本演进速览
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: release-evolution
description: "按版本梳理 Kubernetes v1.29 至 v1.37 的关键 GA 特性、重要 Beta 变化与弃用移除项，并提炼出原生 Sidecar、原地资源调整、CEL 准入策略、DRA、nftables 等贯穿多个版本的主线，帮助读者快速对齐到当前版本。"
---

> 看懂近九个版本的脉络，比记住任何一个版本的特性列表都重要：Kubernetes 正在从"容器编排器"变成"异构算力与策略的声明式控制面"。

Kubernetes 每年发布三个小版本，每个版本维护约 14 个月。从 2023 年底的 v1.29 到 2026 年 8 月的 v1.37，社区共交付了九个版本、数百项增强。本文不逐条罗列变更，而是先按版本给出最值得关注的变化，再按主题归纳几条跨版本的演进主线。所有版本号均以 kubernetes.io 的特性门控参考表与各版本发布博客为准。

## 版本节奏与支持周期

{{< table title="Kubernetes v1.29 – v1.37 发布信息" >}}

| 版本   | 代号                         | 发布日期     | 支持截止     | 增强数（Stable/Beta/Alpha） |
|--------|------------------------------|--------------|--------------|-----------------------------|
| v1.29  | Mandala                      | 2023-12-13   | 2025-02-28   | 49（11/19/19）              |
| v1.30  | Uwubernetes                  | 2024-04-17   | 2025-07-15   | 45（17/18/10）              |
| v1.31  | Elli                         | 2024-08-13   | 2025-11-11   | 45（11/22/12）              |
| v1.32  | Penelope                     | 2024-12-11   | 2026-02-28   | 44（13/12/19）              |
| v1.33  | Octarine                     | 2025-04-23   | 2026-06-28   | 64（18/20/24）              |
| v1.34  | Of Wind & Will               | 2025-08-27   | 2026-10-27   | 58（23/22/13）              |
| v1.35  | Timbernetes                  | 2025-12-17   | 2027-02-28   | 60（17/19/22）              |
| v1.36  | Haru                         | 2026-04-22   | 2027-06-28   | 70（18/25/25）              |
| v1.37  | Garhwal                      | 2026-08-26   | 2027-10-28   | 67（16/23/27）              |

{{< /table >}}

截至本文更新时（2026 年 11 月），处于支持期内的版本为 v1.35、v1.36、v1.37，按每年三个版本的惯例，v1.38 将于 2026 年 12 月前后发布。生产集群应保持在受支持的三个版本之内，否则将得不到安全补丁。

## 逐版本关键变化

下面按版本列出对日常使用影响最大的 GA 特性、值得提前关注的 Beta 特性以及弃用/移除项。

### v1.29

- **GA**：`ReadWriteOncePod` 访问模式；API 优先级与公平性（APF）；CRD 的 CEL 校验表达式；Job 状态中的就绪 Pod 计数；KMS v2
- **Beta**：原生 Sidecar 容器（`SidecarContainers`）默认开启；`backoffLimitPerIndex`
- **Alpha**：kube-proxy nftables 模式；结构化认证/鉴权配置（`--authentication-config`、`--authorization-config`）；`sleep` 生命周期钩子
- **移除/弃用**：Azure、GCE、vSphere 等 in-tree 云厂商集成默认关闭；CronJob `schedule` 中的 `TZ`/`CRON_TZ` 前缀被禁止

### v1.30

- **GA**：`ValidatingAdmissionPolicy`（CEL 准入校验）；Pod 调度就绪（`schedulingGates`）；基于容器资源的 HPA 指标；准入 Webhook 的 CEL `matchConditions`；API Server 追踪；聚合发现
- **Beta**：结构化认证与鉴权配置；`LoadBalancerIPMode`
- **Alpha**：`MutatingAdmissionPolicy`；Service `trafficDistribution`（`PreferClose`）；Job `managedBy` 与 `successPolicy`
- **移除**：`SecurityContextDeny` 准入插件（改用 Pod 安全准入）

### v1.31

- **GA**：AppArmor 支持（`securityContext.appArmorProfile`）；Job Pod 失败策略；弹性 Indexed Job；StatefulSet 起始序数；PDB `unhealthyPodEvictionPolicy`；cgroup v1 进入维护模式
- **Beta**：kube-proxy nftables 模式默认开启；`trafficDistribution`；`VolumeAttributesClass`
- **Alpha**：OCI 镜像卷
- **移除**：全部剩余 in-tree 云厂商集成；CephFS 与 Ceph RBD in-tree 卷插件；kubelet `--keep-terminated-pod-volumes`

### v1.32

- **GA**：结构化鉴权配置（`AuthorizationConfiguration` `v1`）；绑定 ServiceAccount Token 改进（JTI、节点绑定）；自定义资源字段选择器；`kubectl debug` 自定义 profile；StatefulSet 自动删除 PVC；内存管理器
- **Beta**：Job `managedBy`；卷扩容失败恢复；DRA 结构化参数
- **Alpha**：Pod 级资源（`spec.resources`）；`MutatingAdmissionPolicy` 进入功能性 Alpha
- **移除**：`flowcontrol.apiserver.k8s.io/v1beta3`；旧版 DRA 实现

### v1.33

- **GA**：原生 Sidecar 容器；`trafficDistribution`（`PreferClose`）；kube-proxy nftables 模式；多 Service CIDR；`backoffLimitPerIndex` 与 `successPolicy`；卷填充器；CRD 校验棘轮；kubectl `--subresource`；递归只读挂载
- **Beta**：原地 Pod 资源调整默认开启（`PodResizePending`/`PodResizeInProgress` 条件取代 `status.resize`）；用户命名空间默认开启；OCI 镜像卷
- **Alpha**：HPA 可配置容差；`.kuberc` kubectl 偏好文件；`stopSignal`；DRA 设备污点、优先级列表、管理员访问、可分区设备
- **弃用**：`v1` `Endpoints` API（仍提供服务）；`service.kubernetes.io/topology-mode` 注解；`gitRepo` 卷默认禁用

### v1.34

- **GA**：DRA 核心（`resource.k8s.io/v1`）；结构化认证配置；`VolumeAttributesClass`；卷扩容失败恢复；kubelet swap 支持（`LimitedSwap`）；`sleep` 钩子（含零秒）；从 CRI 自动发现 cgroup 驱动；`podReplacementPolicy: Failed`；按字段/标签选择器授权
- **Beta**：Pod 级资源默认开启；`MutatingAdmissionPolicy`；`.kuberc` 默认开启；`PreferSameZone`/`PreferSameNode`；外部 ServiceAccount Token 签名
- **Alpha**：容器重启规则（`restartPolicyRules`）
- **弃用**：手工配置 `cgroupDriver`；`PreferClose`；官方宣布 v1.35 为支持 containerd 1.x 的最后一个版本

### v1.35

- **GA**：原地 Pod 资源调整；`PreferSameZone`/`PreferSameNode`；Job `managedBy`；Pod `metadata.generation`/`status.observedGeneration`
- **Beta**：HPA 可配置容差；OCI 镜像卷默认开启；容器重启规则默认开启；`kubectl get -o kyaml`
- **Alpha**：成组调度（`Workload`/`PodGroup` API）
- **弃用**：cgroup v1（kubelet 默认拒绝在 cgroup v1 节点启动）；kube-proxy IPVS 模式；社区 Ingress NGINX 控制器宣布退役（2026 年 3 月停止维护）

### v1.36

- **GA**：Pod 用户命名空间；`MutatingAdmissionPolicy`（`admissionregistration.k8s.io/v1`）；OCI 镜像卷；kubelet 细粒度鉴权；外部 ServiceAccount Token 签名；DRA 管理员访问与优先级列表；PSI 压力指标
- **Beta**：DRA 可分区设备、可消耗容量、设备污点；`componentstatusz`/`componentflagz` 端点
- **移除/弃用**：containerd 1.x 不再受支持；Service `spec.externalIPs` 弃用（计划 v1.43 后移除）；`gitRepo` 卷永久禁用

### v1.37

- **GA**：`metrics.k8s.io/v1`（Beta 近九年后毕业）；HPA 可配置容差；DRA 设备污点/容忍与扩展资源映射；`SELinuxMount`；KYAML 输出；Pod 证书与 `ClusterTrustBundle`；节点声明特性（`status.declaredFeatures`）；存储版本迁移器
- **Beta**：HPA 缩容到零（`minReplicas: 0`）默认开启；成组调度 `Workload`/`PodGroup` API（默认关闭）；基于清单的静态准入配置；cgroup v2 内存 QoS 默认开启；StatefulSet `maxUnavailable` 默认开启
- **Alpha**：PodGroup 级抢占策略；复合 PodGroup；原地资源调整的调度器抢占辅助
- **移除/弃用**：静态 Pod 不再允许引用 Secret/ConfigMap；IPVS 弃用时间表确定（v1.40 默认关闭，v1.43 移除）；`kubectl run -f` 弃用

## 跨版本演进主线

逐版本的清单容易见木不见林。把九个版本放在一起看，可以归纳出以下几条持续推进的主线。

### Pod 模型补课：Sidecar、原地调整与用户命名空间

Pod 作为最核心的抽象，在这九个版本里获得了三项期待已久的能力。**原生 Sidecar 容器**（v1.28 Alpha → v1.33 GA）解决了辅助容器启动顺序与 Job 无法完成的顽疾；**原地资源调整**（v1.27 Alpha → v1.35 GA）让垂直扩缩容不再需要重建 Pod，并带动 VPA 与 Pod 级资源（v1.34 Beta）一起演进；**用户命名空间**（v1.28 Alpha → v1.36 GA）把容器内 root 映射为宿主机非特权用户，是容器隔离模型多年来最大的一次加固。三者分别对应本书的 [Sidecar 容器](../../pod/sidecar-container)、[Pod 原地资源调整与 Pod 级资源](../../pod/in-place-pod-resize) 与 [Pod 用户命名空间](../../pod/user-namespaces)。

### 策略内建化：CEL 取代 Webhook

从 v1.29 的 CRD CEL 校验 GA，到 v1.30 的 `ValidatingAdmissionPolicy` GA，再到 v1.36 的 `MutatingAdmissionPolicy` GA，Kubernetes 用 CEL 表达式把过去必须依赖外部 Webhook 的校验与变更逻辑搬进了 API Server 进程内。配合 v1.30 Webhook 的 `matchConditions`、v1.32/v1.34 结构化鉴权与认证配置中的 CEL 规则，CEL 已成为 Kubernetes 控制面的通用策略语言。详见 [准入策略：用 CEL 替代 Webhook](../../extend/admission-policy) 与 [结构化认证与鉴权配置](../../auth/structured-authentication-authorization)。

### 面向 AI 的异构算力：DRA

动态资源分配（DRA）在 v1.32 重写为结构化参数模型后快速成熟：v1.34 核心 GA，v1.36/v1.37 陆续稳定管理员访问、优先级列表、设备污点与扩展资源映射。它把 GPU、NIC 等设备从"整数计数"升级为可按属性筛选、可共享、可分区的一等资源，是 Kubernetes 承载 AI 训练与推理工作负载的基础。详见 [动态资源分配（DRA）](../../extend/dynamic-resource-allocation)。

### 网络数据面更替

Service 数据面经历了 iptables → IPVS → nftables/eBPF 的演进：nftables 模式 v1.33 GA，IPVS 于 v1.35 弃用并将在 v1.43 移除；`trafficDistribution` 字段（v1.33/v1.35 GA）取代拓扑感知提示注解；`Endpoints` API 让位于 EndpointSlice；入口层面 Ingress 特性冻结、社区 Ingress NGINX 退役，Gateway API 成为唯一演进方向。详见 [kube-proxy 模式演进](../../networking/kube-proxy-modes) 与 [Gateway API](../../service-discovery/gateway)。

### 节点基线现代化

节点侧的要求在稳步抬高：cgroup v2 自 v1.25 GA 后，cgroup v1 于 v1.31 进入维护模式、v1.35 弃用并默认拒绝启动；containerd 1.x 在 v1.36 失去支持；kubelet 从 CRI 自动发现 cgroup 驱动（v1.34 GA）；swap（v1.34 GA）、内存 QoS（v1.37 Beta）、PSI 指标（v1.36 GA）等资源管理特性都只面向 cgroup v2。升级到 v1.37 的节点应以"cgroup v2 + containerd 2.x + 内核 5.13+"为基线。

### 安全默认值收紧

`PodSecurityPolicy` 在 v1.25 移除后，Pod 安全准入成为内建基线；绑定 ServiceAccount Token 持续加固（v1.32 增加 JTI 与节点绑定，v1.29 起自动清理长期未用的旧 Token）；v1.37 禁止静态 Pod 引用 Secret/ConfigMap；Service `externalIPs` 因 CVE-2020-8554 被弃用；AppArmor、SELinux 挂载相关字段相继 GA。详见 [Pod 安全准入](../../security/pod-security-admission)。

### 批处理与调度

Job 在 v1.31 – v1.35 间补齐了 Pod 失败策略、成功策略、按索引退避、`managedBy` 等能力，使 JobSet、Kueue 等上层项目可以在不打补丁的情况下构建多集群排队与成组调度；核心调度器也在 v1.35 引入成组调度（v1.37 Beta）并开始探索 PodGroup 级抢占。详见 [Job 高级特性与批处理生态](../../controllers/job-advanced)。

## 升级到 v1.37 的检查清单

在把存量集群升级到 v1.37 之前，建议对照以下清单逐项确认：

- 节点已切换到 cgroup v2，容器运行时为 containerd 2.x 或匹配版本的 CRI-O
- kube-proxy 未使用 IPVS 模式，或已有向 nftables/eBPF 迁移的计划
- 不再依赖社区 Ingress NGINX；如仍在使用，已制定 Gateway API 迁移方案
- 清单中没有 `v1` `Endpoints`、`service.kubernetes.io/topology-mode` 注解、`externalIPs`、in-tree 云存储卷类型等已弃用用法
- 静态 Pod 不引用 Secret/ConfigMap
- 监控栈已适配 `metrics.k8s.io/v1`，Prometheus 规则不再依赖已移除的指标
- 准入 Webhook 评估是否可迁移为 `ValidatingAdmissionPolicy`/`MutatingAdmissionPolicy`

## 总结

v1.29 到 v1.37 的九个版本里，Kubernetes 在 Pod 模型、策略机制、异构算力、网络数据面、节点基线与安全默认值六个方向上都完成了代际更替。理解这些主线，有助于判断哪些旧知识需要更新、哪些新特性值得在生产环境中优先采用。后续章节将分别深入这些特性的细节。

## 参考文献

- [Kubernetes Release History - kubernetes.io](https://kubernetes.io/releases/)
- [Kubernetes v1.33: Octarine - kubernetes.io](https://kubernetes.io/blog/2025/04/23/kubernetes-v1-33-release/)
- [Kubernetes v1.34: Of Wind & Will - kubernetes.io](https://kubernetes.io/blog/2025/08/27/kubernetes-v1-34-release/)
- [Kubernetes v1.35: Timbernetes - kubernetes.io](https://kubernetes.io/blog/2025/12/17/kubernetes-v1-35-release/)
- [Kubernetes v1.36: Haru - kubernetes.io](https://kubernetes.io/blog/2026/04/22/kubernetes-v1-36-release/)
- [Kubernetes v1.37: Garhwal - kubernetes.io](https://kubernetes.io/blog/2026/08/26/kubernetes-v1-37-release/)
- [Feature Gates Reference - kubernetes.io](https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates/)
- [Deprecated API Migration Guide - kubernetes.io](https://kubernetes.io/docs/reference/using-api/deprecation-guide/)
