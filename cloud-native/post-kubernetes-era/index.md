---
linkTitle: Kubernetes 次世代
title: Kubernetes 次世代的云原生应用
weight: 3
description: 探讨 Kubernetes 生态发展历程，分析云原生应用碎片化问题，介绍 OAM（开放应用模型）等解决方案，展望以应用为中心的云原生未来。
date: 2025-08-26T10:05:13.628Z
lastmod: 2025-10-19T12:50:41.590Z
---

## 核心观点

- 云原生基础设施已渡过野蛮生长期，正朝着统一应用标准方向迈进
- Kubernetes 原语无法完整描述复杂的云原生应用体系，开发与运维关注点耦合严重
- Operator 在丰富 Kubernetes 生态的同时加剧了云原生应用碎片化，急需统一的应用定义标准
- OAM 通过分离研发和运维关注点，对资源对象进行抽象，实现化繁为简的目标
- "Kubernetes 次世代"指的是在 Kubernetes 成为基础设施标准后，云原生生态重心向应用层转移的时代

## 云原生发展历程

Kubernetes 自 2014 年开源以来已走过近十年历程，开启了云原生时代。云原生的发展可分为以下几个阶段：

![云原生的发展阶段](https://assets.jimmysong.io/images/book/kubernetes-handbook/cloud-native/post-kubernetes-era/cloud-native-stages.svg)
{width=1048 height=261}

### 孵化期（2014 年）

2014 年 Google 开源 Kubernetes，此前 Docker 于 2013 年开源，DevOps 和微服务概念兴起。Google 联合其他厂商成立 CNCF，将 Kubernetes 作为初创项目捐献给基金会。

### 高速发展期（2015-2016 年）

Kubernetes 快速迭代，于 2017 年击败 Docker Swarm 和 Mesos，确立容器编排领导地位。CRD 和 Operator 模式的诞生极大增强了扩展性，促进生态繁荣。

### 野蛮生长期（2017-2018 年）

云原生应用默认运行在 Kubernetes 上。Google 主导的 Istio 和 Knative 相继开源，大量使用 Operator 扩展。2018 年 Kubernetes 从 CNCF 毕业，CNCF 重新定义云原生概念。

### 成熟普及期（2019 年至今）

Kubernetes 得到大规模应用，云原生概念深入人心。基于 Operator 的生态蓬勃发展，Service Mesh 和 Serverless 快速演进，OAM 等应用定义标准涌现。

## Kubernetes：云原生时代的奠基者

Kubernetes 继承了 Google Borg 系统经验，统一了 PaaS 平台基础设施层，设计遵循以下原则：

1. **基础设施即代码**（声明式 API）
2. **不可变基础设施**
3. **幂等性**
4. **调节器模式**（Operator 原理基础）

### 声明式 API 的创新

声明式 API 开创了云原生基调，支持应用编排和组件依赖定义。但声明的状态并非静态不变，可能受 HPA、自定义控制器等动态调整，需要通过动态准入控制确保一致性。

### Kubernetes 原生应用架构

基于 Kubernetes 原语的云原生应用包含多个层次：

![Kubernetes 原生应用](https://assets.jimmysong.io/images/book/kubernetes-handbook/cloud-native/post-kubernetes-era/kubernetes-native-application-motion.gif)
{width=600 height=334}

**分层架构：**

- **核心层**：应用逻辑、服务定义、生命周期控制
- **隔离与访问层**：资源限制、配置、身份认证、路由规则
- **调度层**：各类调度控制器，主要扩展层
- **资源层**：网络、存储等平台资源

这种分层设计支持职责分离，降低开发和运维复杂度。

## 云原生应用碎片化挑战

随着 Operator 生态繁荣，云原生应用出现碎片化趋势：

![资源交集动画](https://assets.jimmysong.io/images/book/kubernetes-handbook/cloud-native/post-kubernetes-era/resources-motion.gif)
{width=600 height=363}

### 碎片化表现

- **标准缺失**：缺乏统一的应用定义视图，增加沟通成本
- **治理松散**：Operator 间可能冲突，产生不可预期结果  
- **选择困难**：同类资源多种实现（如 Ingress 有 10+ 种实现），选择困难
- **耦合严重**：应用逻辑与运维特性耦合，不利于复用

### Operator 模式的双刃剑

Operator 基于调节器模式，遵循四个原则：

1. 使用数据结构进行输入输出
2. 确保数据结构不可变
3. 保持资源映射简单
4. 使实际状态符合预期状态

虽然解决了有状态应用管理难题，但也带来了生态碎片化问题。

## 应用管理工具演进

### Helm：包管理的先驱

Helm 通过 Chart 模板提供应用打包和版本管理能力：

![Helm3 架构](https://assets.jimmysong.io/images/book/kubernetes-handbook/cloud-native/post-kubernetes-era/helm-chart.svg)
{width=1100 height=714}

**核心能力：**

- **打包**：Chart 格式标准化应用描述
- **配置**：values.yaml 和命令行参数管理
- **发布**：Release 生命周期管理

Helm 主要关注 12 因素应用中的"发布"环节，但仍有局限性。

## 云原生应用统一模型

### 应用分层模型

![云原生应用的分层模型](https://assets.jimmysong.io/images/book/kubernetes-handbook/cloud-native/post-kubernetes-era/cloud-native-app.svg)
{width=1100 height=578}

**分层说明：**

- **应用定义层**：Helm、CNAB、Pulumi 等，直接定义应用组成
- **负载定义层**：基于 Operator 的 Serverless 负载，如 Istio、Knative
- **发布上线层**：关注构建发布、GitOps、发布策略
- **Kubernetes 原语层**：基础原语，Operator 构建基础

### OAM：开放应用模型

OAM（Open Application Model）旨在解决云原生应用定义标准化问题：

**设计理念：**

- **关注点分离**：开发者专注应用组件，运维者专注运维特征
- **高度可扩展**：支持多种工作负载和运维策略
- **Kubernetes 友好**：兼容现有 CRD Operator

**核心概念：**

- **Component**：应用组件定义
- **Workload**：运行时类型（容器、Serverless、VM 等）
- **Trait**：运维特征（扩缩容、流量控制、安全策略）
- **ApplicationConfiguration**：应用配置，关联组件和运维策略

**工作流程：**

1. 开发者创建 Component 描述应用
2. 运维创建各种 Trait 策略
3. ApplicationConfiguration 关联组件和策略
4. OAM Operator 生成对应 Workload 和 Trait
5. 达到终态，完成发布

### 生态支持

目前支持 OAM 的项目包括：

- **Crossplane**：多云基础设施管理
- **KPT**：声明式配置管理工具
- **Vela**：简化云原生应用交付的平台

CNCF SIG App Delivery 致力于推动云原生应用交付标准化。

## 技术趋势与展望

### 从基础设施到应用

云原生生态正从基础设施关注点向应用层转移：

- **基础设施标准化**：Kubernetes 成为事实标准
- **应用定义统一**：OAM 等标准化应用模型
- **开发者体验优化**：降低云原生应用开发门槛
- **运维能力服务化**：Trait 化的运维能力

### 面临的挑战

- **生态整合**：如何整合众多开源项目
- **标准推广**：新标准的采用和推广
- **人才培养**：云原生应用开发和运维人才需求
- **最佳实践**：建立行业最佳实践指南

## 总结

Kubernetes 次世代的核心在于解决云原生应用的碎片化问题，建立以应用为中心的统一标准。OAM 等解决方案通过关注点分离和标准化，为云原生应用定义了新的范式。

未来云原生生态将更加注重：

- 开发者体验的提升
- 应用定义的标准化
- 运维能力的服务化
- 生态整合的深化

这标志着云原生正从技术驱动转向应用驱动，从基础设施关注转向业务价值实现。

## 参考资料

- [Helm 3 架构解析 - developer.ibm.com](https://developer.ibm.com/technologies/containers/blogs/kubernetes-helm-3/)
- [Kubernetes Patterns - O'Reilly](https://www.redhat.com/cms/managed-files/cm-oreilly-kubernetes-patterns-ebook-f19824-201910-en.pdf)
- [云原生应用交付词典 - CNCF SIG App Delivery](https://docs.google.com/document/d/1gMhRz4vEwiHa3uD8DqFKHGTSxrVJNgkLG2WZWvi9lXo/edit)
- [OAM 规范文档 - oam.dev](https://oam.dev/)
- [CNCF 应用交付 SIG - github.com](https://github.com/cncf/sig-app-delivery)
