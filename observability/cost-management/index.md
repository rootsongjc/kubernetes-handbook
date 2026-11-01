---
weight: 8
title: "成本可观测性与 FinOps：度量、分摊与优化 Kubernetes 开销"
linktitle: 成本可观测性
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: cost-management
description: "把成本作为可观测性的第四个维度：Kubernetes 成本的构成与分摊难题、基于 requests 与用量的分摊模型、OpenCost 的开源成本度量与 Prometheus 指标、标签与命名空间的成本归属规范、闲置资源与过度申请的识别、FinOps 的度量—优化—运营循环，以及 GPU 与 AI 工作负载的成本专题。"
---

> 把成本接入 Grafana 之前，Kubernetes 账单只是一个月底才出现的数字；接入之后，每一次扩容和每一个忘记设置 limits 的 Deployment 都有了价格标签。

Kubernetes 把计算资源池化后，云账单里只剩下节点、磁盘与网络的总额，而"哪个团队、哪个服务花了多少钱"的信息消失了。成本可观测性（Cost Observability）与 FinOps 实践正是为了把账单重新映射回工作负载，并驱动持续优化。本文介绍 Kubernetes 成本的度量模型、开源工具与优化手段。

## Kubernetes 成本的构成与难题

集群成本由三部分组成：节点（计算）、持久存储（PV）与网络（负载均衡器、跨区/出口流量），其中节点通常占 70% 以上。分摊难题源于共享：一台节点上同时运行多个命名空间的 Pod，没有任何一个账单条目直接对应某个 Deployment。此外还有三类"看不见"的成本：

- **闲置容量**：节点上既未被 requests 占用、也未被实际使用的部分，源于装箱碎片、过度预留与自动扩缩滞后
- **过度申请**：Pod 的 requests 远高于实际用量，这部分资源被调度器视为已占用，无法给他人使用，是最常见的浪费来源
- **系统开销**：kube-system、监控、日志、服务网格等平台组件的消耗，需要决定是按比例分摊给租户还是作为平台成本

## 成本分摊模型

把节点成本分摊到 Pod 的标准做法是：按 Pod 对各资源的 `max(request, usage)` 占节点可分配资源的比例，乘以节点在该时段的价格。使用 `max` 而非单独的 request 或 usage，是因为 requests 决定了别人无法使用的部分，而超出 requests 的用量（Burstable 的突发）同样消耗了资源。CPU 与内存的权重默认各占一半，GPU 按设备数量单独计价。

```text
Pod 成本 = Σ_资源 [ max(request, usage) / 节点可分配量 × 节点小时价 × 资源权重 ] × 运行小时数
         + PV 成本（按容量 × 存储类单价）
         + 网络成本（负载均衡器按 Service 归属，出口流量按 Pod 归属）
```

闲置成本 = 节点总成本 − 所有 Pod 分摊之和，可以按命名空间的占比再次分摊，或作为平台团队的 KPI 单独呈现。价格来源有三种：云厂商的计费 API 或账单导出（最准确，含预留实例、Savings Plan 折扣）、公开的按需价格表（无折扣，适合估算）、以及自建机房的自定义单价（CPU 核时、GB 内存时）。

## OpenCost

[OpenCost](https://opencost.io/)（CNCF 孵化项目，v1.121）是 Kubernetes 成本度量的开源标准实现，由 Kubecost 捐赠并成为 CNCF 成本规范（OpenCost Specification）的参考实现。它以单个 Deployment 运行，从 Prometheus 读取 `kube-state-metrics` 与 cAdvisor 指标计算分摊，从云厂商定价 API 或账单获取价格，提供 REST API、Prometheus 指标、UI 与 `kubectl cost` 插件。

```bash
helm install opencost opencost/opencost -n opencost --create-namespace \
  --set opencost.prometheus.internal.serviceName=prometheus-server \
  --set opencost.prometheus.internal.namespaceName=monitoring \
  --set opencost.exporter.defaultClusterId=prod-us-west

# 按命名空间查看过去 7 天的成本
kubectl cost namespace --window 7d --show-cpu --show-memory --show-pv --show-efficiency

# 按标签聚合（如 team）
kubectl cost label --window 7d -l team
```

OpenCost 暴露的核心指标可直接在 Grafana 中使用：

{{< table title="OpenCost 主要 Prometheus 指标" >}}

| 指标 | 含义 |
|------|------|
| `node_cpu_hourly_cost` / `node_ram_hourly_cost` / `node_gpu_hourly_cost` | 节点各资源的小时单价（按云价格表或自定义单价） |
| `node_total_hourly_cost` | 节点每小时总成本 |
| `pv_hourly_cost` | 持久卷每小时成本 |
| `container_cpu_allocation` / `container_memory_allocation_bytes` / `container_gpu_allocation` | 容器的分配量（`max(request, usage)`），乘以单价即为容器成本 |
| `kubecost_cluster_management_cost` | 托管控制面费用（如 EKS 每小时 $0.10） |
| `kubecost_load_balancer_cost` | 负载均衡器成本 |

{{< /table >}}

一个按命名空间统计过去一小时 CPU 成本的 PromQL 示例：

```promql
sum by (namespace) (
  container_cpu_allocation * on(node) group_left() node_cpu_hourly_cost
)
```

OpenCost 还支持云账单集成（AWS CUR、GCP BigQuery 导出、Azure 成本导出）以把 Kubernetes 外的云资源（托管数据库、对象存储）纳入同一视图，并正在与 FinOps 基金会的 FOCUS 规范对齐术语与数据格式，便于跨云 FinOps 工具消费。商业产品 Kubecost（已并入 IBM）、云厂商内置方案（AWS Split Cost Allocation Data、GCP GKE Cost Allocation、Azure AKS Cost Analysis）以及 CAST AI、Harness、Vantage 等第三方平台在 OpenCost 模型之上提供多集群聚合、预算告警与自动优化。

## 成本归属的前提：标签规范

分摊再精确，如果工作负载没有一致的归属标签，结果也只能按命名空间粗分。应在组织层面规定并用策略引擎强制一组成本标签：

```yaml
metadata:
  labels:
    team: payments
    cost-center: cc-4210
    environment: prod
    app.kubernetes.io/name: order-api
    app.kubernetes.io/part-of: checkout
```

用 [ValidatingAdmissionPolicy 或 Kyverno](../../extend/policy-engines) 要求所有 Deployment/StatefulSet/Job 携带 `team` 与 `cost-center`，缺失即拒绝或告警；命名空间同样打上这些标签作为默认归属。云资源（负载均衡器、磁盘）则依赖云控制器把 Kubernetes 标签传播为云标签（AWS 的 `--aws-resource-tags`、GKE 的资源标签），使 Kubernetes 内外的归属一致。

## 识别浪费

有了分摊数据后，优化从几个固定的问题开始：

- **效率（Efficiency）**：`usage / request` 的比值。OpenCost 为每个工作负载报告 CPU 与内存效率，长期低于 30% – 40% 的工作负载是 [VPA](../../controllers/vpa-and-keda) 推荐模式的首要目标
- **没有 requests 的 Pod**：BestEffort Pod 不参与分摊基准，也让节点扩缩无法预估；用 LimitRange 补默认值并用策略拒绝无 requests 的生产工作负载
- **闲置节点与装箱碎片**：节点整体分配率低于 50% 却因个别 Pod 无法回收；用 [Karpenter 的整合](../../operation/node-autoscaling)、descheduler 的 `HighNodeUtilization` 策略或调整机型
- **非工作时间的开发/测试环境**：按 Cron 缩容到零（KEDA `cron` Scaler、kube-downscaler），通常能节省 60% 以上
- **孤立资源**：未绑定的 PV、未被 Service 引用的负载均衡器、已完成 Job 残留的 Pod；用 Kyverno DeletingPolicy 或定期脚本清理
- **跨区流量**：Pod 与依赖服务分布在不同可用区导致的流量费用；用 [拓扑感知路由](../../service-discovery/topology-aware-routing) 的 `trafficDistribution: PreferSameZone` 让流量尽量留在同区
- **购买方式**：长期稳定的基线用预留实例/Savings Plan，弹性与容错部分用 Spot；Karpenter 的 `capacity-type` 约束可把 Spot 占比变成声明式配置

## GPU 与 AI 工作负载的成本

GPU 节点的单价是通用节点的 10 – 50 倍，且 GPU 不能像 CPU 那样超售，一张被 requests 占用却只有 20% 利用率的 GPU 就是实打实的浪费。成本度量上，OpenCost 按 `container_gpu_allocation` 与 `node_gpu_hourly_cost` 分摊整卡成本；实际利用率需要 DCGM Exporter 的 `DCGM_FI_DEV_GPU_UTIL`、`DCGM_FI_DEV_FB_USED` 指标对照。优化手段包括：

- 推理服务用 [MIG、时间切片或 HAMi 等共享方案](../../ai-native/hami) 让多个模型共用一张卡
- 训练任务通过 Kueue 排队与配额共享，避免每个团队各自保留 GPU
- [DRA](../../extend/dynamic-resource-allocation) 让调度器按型号、显存等属性精确匹配，减少"用 H100 跑只需 A10 的任务"
- 推理按请求量用 KEDA 扩缩，夜间缩到零；模型权重用 [镜像卷](../../storage/image-volume) 或共享存储，避免每次扩容重复下载的流量与时间成本
- 为 GPU 命名空间设置 `requests.nvidia.com/gpu` 配额，并把 GPU 效率纳入团队的成本报表

## FinOps 循环

FinOps 基金会把成本管理描述为"度量（Inform）—优化（Optimize）—运营（Operate）"的循环。在 Kubernetes 中对应的落地步骤：

1. **度量**：部署 OpenCost 接入 Prometheus/Grafana，强制成本标签，按团队/环境/应用生成每日成本与效率报表
2. **优化**：按效率排序处理过度申请，启用 VPA 推荐与节点整合，为非生产环境设置定时缩容，调整购买方式
3. **运营**：为每个团队设置预算与告警（如 `increase(namespace_cost[1d]) > budget × 1.2`），把单位成本（每千次请求、每个租户、每个训练作业的成本）作为 SLO 之外的另一组服务指标，在容量评审与架构决策中引用

成本与可靠性、性能的权衡应是显式的：保留 20% 的余量用于突发流量是合理的"浪费"，关键是让这个数字被看见并被有意识地决定。

## 总结

成本可观测性把 Kubernetes 的共享资源池重新映射回团队与服务，使浪费从账单总额中被分解出来。OpenCost 提供了开源、标准化的分摊模型与 Prometheus 指标，标签规范与策略引擎保证归属数据的质量，效率分析、VPA、节点整合、定时缩容与购买方式优化构成了主要的节省手段，而 GPU 工作负载因其高单价与不可超售的特性成为 AI 时代成本治理的重点。把成本纳入与指标、日志、追踪并列的可观测性维度，并建立度量—优化—运营的持续循环，是平台团队证明自身价值的直接方式。

## 参考文献

- [OpenCost Documentation - opencost.io](https://opencost.io/docs/)
- [OpenCost Specification - github.com](https://github.com/opencost/opencost/blob/develop/spec/opencost-specv01.md)
- [FinOps Framework - finops.org](https://www.finops.org/framework/)
- [FOCUS: FinOps Open Cost and Usage Specification - focus.finops.org](https://focus.finops.org/)
- [Resource Management for Pods and Containers - kubernetes.io](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [NVIDIA DCGM Exporter - github.com](https://github.com/NVIDIA/dcgm-exporter)
