---
title: Kubernetes AI 相关工作组介绍
linktitle: AI 工作组
weight: 110
description: "梳理 Kubernetes 社区面向 AI 工作负载的工作组与子项目：AI Conformance（SIG Architecture 子项目与 CNCF 认证）、WG AI Gateway、WG Device Management、WG Batch、WG Workload-aware Scheduling、WG Workload Conformance，以及已归档的 WG Serving 留下的成果，说明各自职责、产出与相互关系。"
date: 2025-11-18T13:33:59.759Z
lastmod: 2026-11-01T00:00:00+08:00
---

> AI Native 的落地，离不开标准、设备、调度与流量治理能力的协同演进。Kubernetes 社区正以工作组为抓手，推动 AI 工作负载从"可运行"走向"可治理"。

Kubernetes 近两年最显著的演化趋势之一，是面向 AI 工作负载的体系化能力建设。与以往"某个 SIG 顺带支持 GPU"不同，社区自 2024 年起陆续成立了多个跨 SIG 的工作组（Working Group，WG），分别承担 AI 工作负载的标准化、设备管理、批处理与调度、推理流量治理等职责，并把成果以 KEP、SIG 子项目和 CNCF 认证的形式固化下来。本文按职责层次介绍这些工作组及其产出，信息以 kubernetes/community 仓库的 `sigs.yaml` 为准（2026 年 10 月）。

## 工作组全景

{{< table title="Kubernetes 社区 AI 相关工作组与子项目（2026 年 10 月）" >}}

| 名称 | 形态 | 利益相关 SIG | 关注点 | 代表产出 |
|------|------|--------------|--------|----------|
| AI Conformance | SIG Architecture 子项目 + CNCF 认证程序 | Architecture | 定义"AI 就绪"Kubernetes 平台应具备的能力 | Certified Kubernetes AI Conformance（覆盖 v1.35–v1.37） |
| WG AI Gateway | 工作组 | Network、Multicluster | 推理流量的路由与负载均衡 | Gateway API Inference Extension（`InferencePool` v1 GA） |
| WG Device Management | 工作组 | Architecture、Node、Scheduling、Autoscaling | GPU 等异构设备的发现、分配与共享 | 动态资源分配（DRA，v1.34 GA 及后续增强） |
| WG Batch | 工作组 | Apps、Autoscaling、Node、Scheduling | 批处理与训练作业的排队、配额与生命周期 | Kueue、JobSet、Job 的失败/成功策略与 `managedBy` |
| WG Workload-aware Scheduling | 工作组 | Apps、Autoscaling、Scheduling 等 | 从逐 Pod 调度走向工作负载级调度 | `Workload`/`PodGroup` API 与成组调度（v1.37 Beta） |
| WG Workload Conformance | 工作组 | Apps、Architecture | 定义工作负载在 Kubernetes 上运行时行为的可验证标准 | 工作负载一致性标准与验证工具（进行中） |
| WG Serving（已归档） | 工作组（2024–2025） | Apps、Network 等 | 推理服务的部署与扩缩 | LeaderWorkerSet（v1.0）、Inference Extension 早期孵化、model-serving-signals |

{{< /table >}}

## AI Conformance：AI 平台的能力基线

AI Conformance 并不是工作组，而是 SIG Architecture 下的子项目（讨论仓库为 `kubernetes-sigs/wg-ai-conformance`，沿用了早期名称），其对应的认证程序由 CNCF 以 [cncf/k8s-ai-conformance](https://github.com/cncf/k8s-ai-conformance) 运营，2025 年推出 **Certified Kubernetes AI Conformance**，当前覆盖 Kubernetes v1.35、v1.36、v1.37 三个版本。

与面向 API 行为的 Kubernetes Conformance 不同，AI Conformance 检验的是一个发行版或托管平台是否具备运行 AI 工作负载的**平台能力**，前提是先通过基础的 Kubernetes Conformance。要求项以 KAR（Kubernetes AI Requirement）形式在 GitHub Project 中跟踪，状态从 Implementable 推进到 Implemented 后成为 MUST；每个 Kubernetes 版本对应一份检查清单，部分项（如安全加速器访问、成组调度）已有自动化测试。v1.37 清单按加速器、网络、调度、可观测性、安全、Operator 六类组织：

{{< table title="Certified Kubernetes AI Conformance v1.37 要求概览" >}}

| 类别 | MUST | SHOULD |
|------|------|--------|
| 加速器 | —（DRA 支持在 v1.35 清单中为独立项，v1.37 起融入各项要求） | 驱动与运行时配置的可验证管理、GPU 共享（时间片/MIG 等至少一种）、虚拟化加速器 |
| 网络 | 支持 Gateway API 及面向推理的高级流量管理（加权分流、按 OpenAI 协议头路由） | 高级推理入口（Inference Extension）、高性能网络（RDMA 等）、分离式推理（prefill/decode 分离） |
| 调度 | 成组调度（Kueue、Volcano 等至少一种）、集群自动扩缩容覆盖加速器节点、Pod 自动扩缩容可基于自定义指标 | — |
| 可观测性 | 加速器指标、AI 服务指标以标准化格式暴露 | — |
| 安全 | 加速器访问经由设备插件/DRA 与运行时隔离与仲裁 | 工作负载沙箱 |
| Operator | 可靠运行 Operator/控制器（CRD、Webhook 等） | — |

{{< /table >}}

通过认证的平台可在 CNCF 景观中使用 "Certified Kubernetes AI Conformance" 标识，认证有效期一年，为用户选型提供可验证的基线。

## WG AI Gateway：推理流量的网络治理

WG AI Gateway 由 SIG Network 与 SIG Multicluster 共同发起，聚焦"AI 与网络的交叉点"：把负载均衡器、网关与代理技术扩展到推理流量场景。其核心产出是 [Gateway API Inference Extension](../../service-discovery/gateway-api-inference)：

- 以 `InferencePool`（`inference.networking.k8s.io/v1`，已 GA）替代 Service 作为推理后端，网关通过 ext-proc 协议调用端点选择器（EPP）
- EPP 基于 KV 缓存利用率、排队深度、已加载 LoRA 适配器等实时指标选择副本，而不是轮询
- 定义模型服务器协议，要求 vLLM、SGLang、Triton 等以统一指标暴露调度所需信息
- 多集群推理（`InferencePoolImport`）与请求优先级、模型名重写等能力在 llm-d 等下游项目中演进

Istio、Agentgateway、NGINX Gateway Fabric、kgateway、GKE Inference Gateway 等已通过该扩展的一致性测试。

## WG Device Management：异构设备的声明式分配

WG Device Management 横跨 SIG Architecture、Node、Scheduling 与 Autoscaling，目标是让 GPU、TPU、NIC、FPGA 等设备在 Kubernetes 中成为一等资源。其主要成果是 [动态资源分配（DRA）](../../extend/dynamic-resource-allocation)：核心 API 在 v1.34 GA，随后在 v1.36/v1.37 陆续稳定优先级列表、管理员访问、设备污点与扩展资源映射，可分区设备与可消耗容量进入 Beta。DRA 统一以 [CDI](../../interfaces/cdi) 完成设备注入，并通过标准设备属性（如 `resource.kubernetes.io/numaNode`）为跨厂商的拓扑对齐奠定基础。该工作组还负责推动 NVIDIA、Intel 等厂商 DRA 驱动的生产化与设备健康上报等节点侧能力。

## WG Batch：批处理与训练作业

WG Batch 成立较早，是 AI 训练负载在 Kubernetes 上的主要推动者。它在核心 Job API 上补齐了 Indexed Job、Pod 失败策略、成功策略、按索引退避、`managedBy` 等能力（v1.31–v1.35 陆续 GA），并孵化了两个 SIG 项目：

- **Kueue**：作业排队、配额与公平共享，支持全有或全无准入、抢占与多集群分发（MultiKueue）
- **JobSet**：多角色分布式训练作业的统一抽象，被 Kubeflow Trainer v2 采用为底层运行时

详见 [Job 高级特性与批处理生态](../../controllers/job-advanced)。

## WG Workload-aware Scheduling：工作负载级调度

传统调度器逐 Pod 决策，无法表达"8 个 worker 要么全部启动、要么全部等待"的训练作业需求。WG Workload-aware Scheduling 旨在核心 Kubernetes 中建立原生的工作负载级调度 API 与通用调度底座：`Workload`/`PodGroup` API（`scheduling.k8s.io`）在 v1.35 以 Alpha 引入、v1.37 升级为 Beta，v1.37 还引入了 PodGroup 级抢占策略与复合 PodGroup（Alpha）。这项工作与 Kueue、JobSet 对接后，有望减少对 Volcano、YuniKorn 等第三方批调度器的依赖。

## WG Workload Conformance：工作负载运行时行为标准

与 AI Conformance 关注"平台能力"不同，WG Workload Conformance 关注"工作负载自身应如何行为"：为工作负载在 Kubernetes 上运行时的探针、信号处理、资源声明、优雅终止等行为定义开放、可客观验证的标准，并提出验证工具。它由 SIG Apps 与 SIG Architecture 支持，是 AI 工作负载（如模型服务器）走向"可移植、可验证"的另一半基础。

## 已归档的 WG Serving

WG Serving 成立于 2024 年，聚焦推理服务在 Kubernetes 上的部署与扩缩，孵化了 [LeaderWorkerSet](https://github.com/kubernetes-sigs/lws)（多节点推理的 leader/worker 组抽象，2026 年 10 月发布 v1.0）、Gateway API Inference Extension 的早期版本以及 model-serving-signals 等项目。随着这些项目分别归入 SIG Apps、WG AI Gateway 与 SIG Network，WG Serving 于 2025 年完成使命并归档。

## 工作组之间的协作

这些工作组对应 AI 工作负载生命周期的不同环节，彼此通过共享的 API 衔接：

- **设备**：WG Device Management 的 DRA 为训练与推理提供加速器
- **排队与调度**：WG Batch 的 Kueue 决定作业何时进入集群，WG Workload-aware Scheduling 的成组调度决定 Pod 如何整体落到节点
- **流量**：WG AI Gateway 的 Inference Extension 把请求路由到合适的推理副本
- **标准**：AI Conformance 要求平台具备上述能力，Workload Conformance 要求工作负载正确使用这些能力

## 总结

Kubernetes 社区没有设立一个"AI SIG"，而是以多个跨 SIG 工作组分别攻克设备、调度、批处理与流量治理问题，并用 AI Conformance 认证把成果固化为可验证的平台基线。理解这些工作组的分工，有助于判断哪些能力已进入核心 API、哪些仍在 SIG 项目中演进，从而为 AI 基础设施选型与升级节奏提供依据。

## 参考文献

- [Kubernetes SIGs and Working Groups - github.com](https://github.com/kubernetes/community/blob/master/sig-list.md)
- [Kubernetes AI Conformance - github.com](https://github.com/cncf/k8s-ai-conformance)
- [AI Gateway Working Group - github.com](https://github.com/kubernetes/community/tree/master/wg-ai-gateway)
- [Device Management Working Group - github.com](https://github.com/kubernetes/community/tree/master/wg-device-management)
- [Batch Working Group - github.com](https://github.com/kubernetes/community/tree/master/wg-batch)
- [Workload-aware Scheduling Working Group - github.com](https://github.com/kubernetes/community/tree/master/wg-workload-aware-scheduling)
- [Workload Conformance Working Group - github.com](https://github.com/kubernetes/community/tree/master/wg-workload-conformance)
