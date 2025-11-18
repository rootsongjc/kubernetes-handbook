---
title: Kubernetes AI 相关工作组介绍
linktitle: AI 工作组
weight: 110 
description: 解析 Kubernetes 社区三大 AI Native 工作组的职责与演进，涵盖标准化、网络治理与生产级集成，助力 AI 工作负载在云原生环境的落地。
date: 2025-11-18T13:33:59.759Z
lastmod: 2025-11-18T13:34:00.595Z
---

> AI Native 的落地，离不开标准、治理与集成三大能力的协同演进。Kubernetes 社区正以工作组为抓手，推动 AI 工作负载从“可运行”走向“可治理”。

Kubernetes 在 2025 年的主要演化趋势之一，是面向 AI Native 的体系化能力建设。围绕 AI 工作负载的标准化、推理流量治理以及 AI 系统的生产级集成，社区形成了三个关键工作组（Working Group），分别对应 AI Native 架构中的 **标准层、网络层、集成层**。

以下内容将详细介绍这三大工作组的职责与演进方向。

## AI Native 三大工作组概览

社区已成立以下三个核心工作组，分别聚焦于 AI 工作负载的标准化、网络治理与生产级集成：

- [**WG AI Conformance**](https://github.com/kubernetes-sigs/wg-ai-conformance)：定义 AI 工作负载在 Kubernetes 上的能力一致性与合规基线。
- [**WG AI Gateway**](https://github.com/kubernetes-sigs/wg-ai-gateway)：构建 AI 推理场景的网络治理模型与 Gateway API 扩展。
- [**WG AI Integration**](https://github.com/kubernetes/community/tree/master/wg-ai-integration)：沉淀 AI 系统在 Kubernetes 上的集成模式与生产实践。

这三大工作组分别对应 AI Native 架构中的标准层、网络层和集成层。

## WG AI Conformance：AI 工作负载能力基线

该工作组的目标是定义在 Kubernetes 上运行 AI 工作负载需要满足的标准化行为和一致性要求。

2025 年推出的 **Certified Kubernetes AI Conformance** 是该方向的核心成果，内容覆盖：

- 资源声明、扩缩容、服务接口等行为的标准化
- GPU / 异构算力调度的可预测性要求
- 模型加载、更新、回滚等生命周期行为的一致性
- 探针、事件、日志与监控指标的统一规范
- 多发行版、多平台之间的兼容性测试项

通过上述标准，AI 平台能够获得通用能力基线，使模型服务基础设施具备更可验证的运行特征。

## WG AI Gateway：AI 推理流量的网络治理模型

该工作组致力于将 AI 推理场景纳入 Gateway API 体系，形成针对大语言模型（LLM, Large Language Model）及推理工作负载的网络治理能力。

核心成果包括 **Gateway API Inference Extension（GAIE）**，覆盖以下能力：

- KV-Cache 感知负载均衡
- 模型权重加载状态感知路由
- 基于 GPU 显存、节点压力的动态调度
- 面向推理延迟的多维观测指标
- 跨集群推理流量分发与回源策略

在相关会议中，社区展示了如下实践案例：

- 有状态推理流量的智能路由
- 跨 Region 的推理入口网关
- 面向 token/s 与稳定性的调度策略

WG AI Gateway 将 AI 推理从“普通 HTTP 流量”的分类中抽离，形成独立的调度与治理范式。

## WG AI Integration：AI 系统的 Kubernetes 集成体系

该工作组聚焦于建立 AI 系统在 Kubernetes 上的生产级集成模式，涵盖模型、数据、算力、调度与运维等方面。

主要推进方向包括：

### 模型包标准：ModelPack（基于 OCI Artifact）

ModelPack 规范了模型在云原生环境中的结构、元数据、安全性、版本管理与供应链合规，确保模型在不同环境中具有可移植性与可审计性。

### AI 框架的集成规范

围绕 Ray、PyTorch、vLLM、Triton、TensorRT-LLM 等主流组件，社区沉淀了：

- Operator/CRD 的集成模式
- 分布式训练拓扑与扩缩策略
- 多模态数据管道结构
- 异构硬件调度最佳实践
- 跨集群资源编排流程

### 生产级经验体系化

在生产实践层面，WG AI Integration 关注：

- 多模型流水线的部署方法
- GPU/AI 硬件的异构资源管理
- 推理服务的弹性、可用性与观测性
- 训练与推理的生命周期管理
- 跨环境一致性与可重复性

该工作组构建的是 Kubernetes AI Native 的操作模型，覆盖模型生产、部署、推理及持续治理的全链路。

## 总结

三大工作组共同构成 Kubernetes 在 AI Native 方向上的能力框架：

- **AI Conformance：** 定义行为标准
- **AI Gateway：** 定义推理流量治理
- **AI Integration：** 定义生产级落地模式

这一体系推动 AI 工作负载从“可运行”迈向“可治理、可观测、可标准化、可移植”的成熟阶段，使 Kubernetes 从通用编排系统进化为 **AI Native 的统一运行时层**。
