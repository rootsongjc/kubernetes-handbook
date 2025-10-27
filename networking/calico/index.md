---
weight: 51
title: 非 Overlay 扁平网络 Calico
linktitle: Calico
date: 2022-05-21T00:00:00+08:00
description: Calico 是一个基于 eBPF 和 iptables 的云原生网络和安全解决方案，提供扁平三层网络架构，支持灵活的网络策略和高性能容器网络互联。
lastmod: 2025-10-27T17:42:15.621Z
---

> Calico 以扁平三层网络和高性能安全策略著称，是云原生环境下容器网络与安全治理的主流方案，兼具可扩展性与易用性。

## 核心特性

Calico 创建和管理一个扁平的三层网络（无需 overlay），每个容器分配可路由 IP，通信无需封包解包，性能损耗小，易排查，便于扩展。

主要特性包括：

- 高性能网络：基于标准 Linux 网络栈，支持 eBPF 和 XDP 加速
- 扁平网络架构：无需 overlay，降低延迟和复杂性
- 灵活的网络策略：支持 Kubernetes NetworkPolicy 和 Calico 扩展策略
- 多种数据平面：支持 iptables、IPVS、eBPF
- 跨平台支持：兼容 Kubernetes、OpenShift、Docker、OpenStack 等

小规模可用 BGP client 直连，大规模可用 BGP Route Reflector，所有流量均基于 IP 路由互联。

## 架构概览

Calico 采用分布式架构，由多个组件协同工作，部分组件为可选。

![Calico 架构图](https://assets.jimmysong.io/images/book/kubernetes-handbook/networking/calico/calico-architecture.webp)
{width=2580 height=1738}

### 核心组件

#### Felix

Felix 是 Calico 的核心代理，以 DaemonSet 运行于每个节点，负责接口管理、路由编程、安全策略执行和状态上报。

#### Calico API Server

提供 Kubernetes 原生 API 接口，支持 kubectl 管理 Calico 资源，集成 RBAC 和审计。

#### BIRD

BGP Internet Routing Daemon (BIRD) 负责路由发现与分发，节点间通过 BGP 协议同步路由。

#### Typha

Typha 是可选扩展组件，适用于大规模集群，代理 Felix 与数据存储连接，优化性能。

### 插件组件

#### CNI 插件

实现容器网络接口规范，负责 IP 分配、网络接口配置和路由设置。

#### IPAM 插件

负责 IP 池管理、地址分配与回收。

### 控制器组件

#### kube-controllers

监控 Kubernetes API 变化，执行策略、命名空间、节点、端点等控制逻辑。

#### confd

轻量级配置管理工具，自动同步和更新 BIRD 配置。

### 数据存储

Calico 支持两种数据存储方式：

{{< table title="Calico 数据存储方式对比" >}}

| 存储方式                  | 优势与适用场景                                   |
|---------------------------|--------------------------------------------------|
| Kubernetes API Datastore  | 简化管理、集成 RBAC、审计，适合 Kubernetes 环境  |
| etcd                      | 跨平台、关注点分离、混合多集群/裸机场景          |

{{< /table >}}

### 可选组件

#### Dikastes

服务网格策略执行组件，支持七层策略、Istio 集成和加密认证。

#### calicoctl

命令行管理工具，支持资源管理、故障诊断和配置导入导出。

## 数据平面技术

Calico 支持多种高性能数据平面，适应不同场景需求。

### eBPF 数据平面

- 内核级处理，避免用户空间开销
- 性能优于 iptables，延迟低、吞吐高
- 支持源 IP 保持

### iptables 数据平面

- 成熟稳定，广泛支持
- 易于调试，兼容性好

## 网络策略

Calico 提供强大的网络安全策略能力，兼容原生 NetworkPolicy 并支持扩展策略。

### Kubernetes NetworkPolicy

- 入站规则：控制进入 Pod 的流量
- 出站规则：控制从 Pod 发出的流量
- 标签选择器：基于标签灵活控制

### Calico 扩展策略

- 全局网络策略：跨命名空间控制
- 主机端点策略：保护主机网络接口
- 服务策略：基于 Service 的流量控制
- 七层策略：应用层协议流量控制

## 部署模式

Calico 支持多种 BGP 网络模式和网络拓扑，适应不同规模和架构需求。

### BGP 网络模式

- Full Mesh：所有节点互为 BGP 对等体
- Route Reflector：通过路由反射器减少会话数量
- AS Per Rack：每机架独立 AS 号

### 网络拓扑

- 扁平网络：所有 Pod 处于同一大二层网络
- 分段网络：按命名空间等标准分段
- 跨云部署：支持多云和混合云

## 总结

Calico 以高性能、扁平三层网络和灵活安全策略，成为云原生网络与安全的主流方案。其分布式架构、丰富的数据平面和策略能力，适用于多种规模和平台的 Kubernetes 集群。建议结合实际业务需求，合理选择架构和策略，充分发挥 Calico 的优势。

## 参考文献

- [Calico 官方文档 - docs.tigera.io](https://docs.tigera.io/calico/latest/)
- [Calico 架构概览 - docs.tigera.io](https://docs.tigera.io/calico/latest/reference/architecture/overview)
- [eBPF 数据平面 - docs.tigera.io](https://docs.tigera.io/calico/latest/operations/ebpf/)
