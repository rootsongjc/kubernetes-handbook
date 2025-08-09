---
weight: 1
title: Kubernetes 的架构
linktitle: 架构概览
date: '2022-05-21T00:00:00+08:00'
description: >-
  本文深入探讨了 Kubernetes 的核心设计理念，包括分层架构、API 设计原则、控制机制设计原则，以及重要的技术概念和 API 对象，帮助读者全面理解
  Kubernetes 系统的设计思想和实现机制。
type: book
lastmod: '2025-08-09'
---

Kubernetes 提供以下核心特性：

- **声明式配置**：通过 YAML 定义期望状态，系统自动维护实际状态与期望状态一致
- **自动化编排**：Pod 调度、故障恢复、滚动更新、自动扩缩容
- **服务发现与负载均衡**：内置 DNS 和服务抽象，支持多种负载均衡策略
- **存储编排**：支持多种存储后端，提供持久化存储抽象
- **配置和密钥管理**：统一的配置和敏感信息管理机制
- **多租户支持**：命名空间隔离、RBAC 权限控制、资源配额管理

要谈到 Kubernetes 就要不得从 Borg 系统开始谈起。

## Borg 系统简介

Borg 是 Google 内部运行超过 15 年的大规模集群管理系统，管理着数十万个应用跨越数千个集群。它为 Kubernetes 的设计提供了宝贵的实践经验和理论基础。

![Borg 架构](https://assets.jimmysong.io/images/book/kubernetes-handbook/architecture/borg.webp)
{width=572 height=549}

### Borg 核心组件

- **BorgMaster**：集群大脑，负责状态管理和决策制定，使用 Paxos 协议保证一致性
- **Scheduler**：智能调度器，基于资源需求和约束条件进行任务分配
- **Borglet**：节点代理，管理容器生命周期和资源监控
- **borgcfg**：声明式配置工具，定义应用的期望状态

## Kubernetes 架构概览

Kubernetes 继承了 Borg 的核心设计理念，同时在开放性、可扩展性和社区生态方面实现了重大突破。

### 整体架构

下图展示了 Kubernetes 的整体架构，包括控制平面和工作节点的主要组件及其交互关系，帮助理解系统的核心模块分布和职责划分。

![Kubernetes 架构](https://assets.jimmysong.io/images/book/kubernetes-handbook/architecture/architecture.webp)
{width=1200 height=932}

### 设计原则

- **API 驱动**：所有操作通过 RESTful API 完成
- **声明式**：描述期望状态而非执行步骤
- **控制器模式**：通过控制循环保持状态一致性
- **可扩展性**：支持插件化架构和自定义资源

## 核心组件详解

### 控制平面（Control Plane）

控制平面是 Kubernetes 的决策中心，负责管理集群状态和协调各种操作。

#### kube-apiserver

- **功能**：提供 Kubernetes API 的唯一入口
- **职责**：身份验证、授权、准入控制、API 版本管理
- **特点**：无状态、水平可扩展、支持多种认证机制

#### etcd

- **功能**：分布式键值存储，集群状态的唯一数据源
- **特点**：强一致性、高可用、支持 Watch 机制
- **重要性**：etcd 是集群的"真相源"，其健康状态直接影响集群可用性

#### kube-controller-manager

- **功能**：运行各种控制器，实现声明式配置的核心逻辑
- **内置控制器**：
  - Node Controller：节点状态管理
  - Replication Controller：副本数量控制
  - Endpoints Controller：服务端点管理
  - Service Account & Token Controller：认证令牌管理

#### kube-scheduler

- **功能**：为新创建的 Pod 选择合适的节点
- **调度算法**：预选（Filtering）+ 优选（Scoring）
- **可扩展性**：支持调度框架和多调度器

### 工作节点（Worker Node）

工作节点负责运行应用容器和处理网络流量。

#### kubelet

- **功能**：节点代理，管理 Pod 生命周期
- **职责**：
  - 容器运行时管理（通过 CRI）
  - 存储卷管理（通过 CSI）
  - 网络配置（通过 CNI）
  - 健康检查和监控

#### kube-proxy

- **功能**：网络代理，实现 Service 的流量转发
- **模式**：
  - iptables：基于 iptables 规则（默认）
  - IPVS：基于 IPVS 负载均衡（高性能）
  - userspace：用户空间代理（已弃用）

#### 容器运行时（Container Runtime）

- **接口**：Container Runtime Interface (CRI)
- **主流实现**：
  - containerd：CNCF 毕业项目，轻量级
  - CRI-O：专为 Kubernetes 设计
  - Docker Engine：通过 dockershim 支持（已弃用）

## 网络架构

### 网络模型

Kubernetes 采用扁平化网络模型：

- 每个 Pod 有独立的 IP 地址
- Pod 间可直接通信，无需 NAT
- Node 和 Pod 间可直接通信
- 容器看到的 IP 与其他容器看到的一致

### 网络组件

#### CNI (Container Network Interface)

- **主流插件**：
  - Calico：基于 BGP 的网络方案
  - Flannel：简单的 overlay 网络
  - Cilium：基于 eBPF 的高性能网络
  - Weave：易于部署的网络方案

#### Service 类型

- **ClusterIP**：集群内部访问
- **NodePort**：通过节点端口暴露服务
- **LoadBalancer**：云提供商负载均衡器
- **ExternalName**：DNS 别名映射

#### Ingress

- **功能**：HTTP/HTTPS 流量的负载均衡和路由
- **控制器**：NGINX Ingress Controller、Traefik、Istio Gateway

## 存储架构

### 存储抽象

#### Volume

- **EmptyDir**：Pod 临时存储
- **HostPath**：挂载宿主机路径
- **ConfigMap/Secret**：配置和密钥挂载
- **PersistentVolume**：持久化存储抽象

#### CSI (Container Storage Interface)

- **作用**：标准化存储插件接口
- **支持**：块存储、文件存储、对象存储
- **生态**：AWS EBS、GCE PD、Azure Disk、Ceph、GlusterFS

### 存储类

- **动态供应**：StorageClass 定义存储属性
- **回收策略**：Retain、Delete、Recycle
- **访问模式**：ReadWriteOnce、ReadOnlyMany、ReadWriteMany

## 架构视图

### 高层架构

下图展示了 Kubernetes 的高层架构，帮助理解各主要组件之间的关系及其在系统中的作用。

![Kubernetes 架构（图片来自于网络）](https://assets.jimmysong.io/images/book/kubernetes-handbook/architecture/kubernetes-high-level-component-archtecture.webp)
{width=1858 height=1126}

### 抽象架构

下图展示了 Kubernetes 的抽象架构，突出各层次组件的分工与协作关系，帮助理解系统的整体设计思路和模块边界。

![kubernetes 整体架构示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/architecture/kubernetes-whole-arch.webp)
{width=1600 height=1067}

### 控制平面详图

下图展示了 Kubernetes 的控制平面架构，包括 API 服务器、控制器管理器、调度器、etcd 数据库、kubelet 和容器运行时。

![Kubernetes master 架构示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/architecture/kubernetes-master-arch.webp)
{width=1600 height=1067}

### 工作节点详图

下图展示了 Kubernetes 的工作节点架构，包括 kubelet、容器运行时和 Pod。

![kubernetes node 架构示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/architecture/kubernetes-node-arch.webp)
{width=1600 height=1067}

## 分层架构

Kubernetes 采用分层架构设计，从底层基础设施到上层应用形成完整的技术栈。

![Kubernetes 分层架构示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/architecture/kubernetes-layers-arch.webp)
{width=1898 height=1008}

### 架构层次

#### 基础设施层

- **计算**：虚拟机、物理机、云实例
- **网络**：SDN、负载均衡、防火墙
- **存储**：块存储、文件存储、对象存储

#### 容器运行时层

- **容器运行时**：containerd、CRI-O
- **镜像管理**：镜像仓库、镜像安全扫描
- **操作系统**：Linux、Windows Server

#### Kubernetes 核心层

- **API Server**：统一的 API 入口
- **资源模型**：Pod、Service、Deployment 等
- **控制器**：声明式配置的实现机制
- **调度器**：资源分配和优化

#### 应用编排层

- **工作负载**：Deployment、StatefulSet、DaemonSet
- **配置管理**：ConfigMap、Secret
- **网络服务**：Service、Ingress、NetworkPolicy
- **存储编排**：PV、PVC、StorageClass

#### 扩展层

- **CRD**：自定义资源定义
- **Operator**：应用特定的运维逻辑
- **Admission Controller**：准入控制和策略执行
- **调度扩展**：自定义调度算法

#### 生态系统层

- **开发工具**：Helm、Kustomize、Skaffold
- **CI/CD**：Jenkins、GitLab CI、Tekton、ArgoCD
- **监控观测**：Prometheus、Grafana、Jaeger
- **安全工具**：Falco、OPA Gatekeeper、Twistlock
- **服务网格**：Istio、Linkerd、Consul Connect

## 云原生生态

### CNCF 生态系统

Kubernetes 作为 CNCF 的核心项目，与众多云原生技术形成完整生态：

#### 应用定义和镜像构建

- **Helm**：Kubernetes 应用包管理
- **Buildpacks**：源码到镜像的构建工具
- **Docker**：容器镜像标准

#### 运行时

- **containerd**：容器运行时
- **gVisor**：安全沙箱运行时
- **Kata Containers**：轻量级虚拟机

#### 编排和管理

- **Kubernetes**：容器编排平台
- **Crossplane**：云资源管理
- **Argo**：GitOps 和工作流

#### 监控和分析

- **Prometheus**：监控系统
- **Grafana**：可视化平台
- **Jaeger**：分布式追踪

#### 服务代理、发现和网格

- **Istio**：服务网格
- **Linkerd**：轻量级服务网格
- **Consul**：服务发现

#### 网络和安全

- **Calico**：网络和安全策略
- **Falco**：运行时安全监控
- **Open Policy Agent**：策略引擎

## 最佳实践

### 架构设计原则

1. **高可用性**：控制平面多副本部署，etcd 集群部署
2. **可观测性**：完善的监控、日志和追踪体系
3. **安全性**：最小权限原则、网络策略、镜像安全
4. **可扩展性**：水平扩展、垂直扩展、集群联邦
5. **资源效率**：合理的资源配额和限制

### 生产部署建议

- **控制平面**：至少 3 个节点，奇数个 etcd 实例
- **工作节点**：根据业务需求弹性扩展
- **网络**：选择适合的 CNI 插件
- **存储**：规划持久化存储方案
- **监控**：部署 Prometheus + Grafana 监控栈
- **备份**：定期备份 etcd 数据

## 参考资料

- [Borg, Omega, and Kubernetes - ACM Queue](https://queue.acm.org/detail.cfm?id=2898444)
- [Large-scale cluster management at Google with Borg](https://research.google/pubs/pub43438/)
- [Kubernetes 官方架构文档](https://kubernetes.io/docs/concepts/architecture/)
- [CNCF Cloud Native Landscape](https://landscape.cncf.io/)
- [Kubernetes 设计文档](https://github.com/kubernetes/design-proposals-archive)
