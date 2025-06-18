---
weight: 51
title: 非 Overlay 扁平网络 Calico
linktitle: Calico
date: '2022-05-21T00:00:00+08:00'
type: book
description: 'Calico 是一个基于 eBPF 和 iptables 的云原生网络和安全解决方案，提供扁平三层网络架构，支持灵活的网络策略和高性能容器网络互联。'
keywords:
- bgp
- calico
- felix
- kubernetes
- 插件
- 数据
- 端点
- 网络
- 路由
- 集群
- ebpf
---

[Calico](https://www.projectcalico.org/) 原意为"有斑点的"，如果说一只猫为 calico cat 的话，就是说这是只花猫，也叫三色猫，所以 Calico 的 logo 是只三色猫。Calico 是一个开源的云原生网络和网络安全解决方案，为容器、虚拟机和基于主机的工作负载提供网络连接和网络安全策略。

![Calico logo](https://assets.jimmysong.io/images/book/kubernetes-handbook/networking/calico/calico-logo.webp)
{width=441 height=424}

## 核心特性

Calico 创建和管理一个扁平的三层网络（不需要 overlay），每个容器会分配一个可路由的 IP。由于通信时不需要解包和封包，网络性能损耗小，易于排查，且易于水平扩展。

主要特性包括：

- **高性能网络**：基于标准 Linux 网络栈，支持 eBPF 和 XDP 加速
- **扁平网络架构**：无需 overlay 网络，减少网络延迟和复杂性
- **灵活的网络策略**：支持 Kubernetes NetworkPolicy 和 Calico 扩展策略
- **多种数据平面**：支持 iptables、IPVS 和 eBPF 数据平面
- **跨平台支持**：支持 Kubernetes、OpenShift、Docker、OpenStack 等平台

小规模部署时可以通过 BGP client 直接互联，大规模部署可通过指定的 BGP Route Reflector 来完成，确保所有数据流量都通过 IP 路由的方式完成互联。

## 架构概览

Calico 采用分布式架构，由多个组件协同工作，在部署时部分组件是可选的。

![Calico 架构图](https://assets.jimmysong.io/images/book/kubernetes-handbook/networking/calico/calico-architecture.webp)
{width=2580 height=1738}

### 核心组件

#### Felix

Felix 是 Calico 的核心代理，以 DaemonSet 形式在每个节点上运行，负责：

- **接口管理**：配置虚拟网卡和路由表，确保容器网络接口正确配置
- **路由编程**：将本节点的端点路由信息写入 Linux 内核 FIB
- **安全策略执行**：通过 iptables 或 eBPF 程序实施网络安全策略
- **状态上报**：监控网络健康状态并上报异常

#### Calico API Server

Calico API Server 提供 Kubernetes 原生的 API 接口，让用户可以：

- 使用 `kubectl` 直接管理 Calico 资源
- 享受 Kubernetes RBAC 和审计功能
- 集成现有的 Kubernetes 工具链

#### BIRD

BGP Internet Routing Daemon (BIRD) 负责路由发现和分发：

- **路由分发**：将本节点的路由信息通过 BGP 协议分发给其他节点
- **路由学习**：从其他节点学习路由信息并更新本地路由表
- **BGP 对等**：与其他 BIRD 实例或网络设备建立 BGP 会话

#### Typha

Typha 是一个可选的扩展组件，主要用于大规模集群：

- **连接代理**：代理 Felix 与数据存储的连接，减少数据存储负载
- **事件分发**：缓存和过滤数据存储事件，减少不必要的网络传输
- **性能优化**：在超过 100 个节点的集群中显著提升性能

### 插件组件

#### CNI 插件

Calico CNI 插件实现容器网络接口规范：

- **IP 地址分配**：为新创建的 Pod 分配 IP 地址
- **网络接口配置**：创建和配置 veth pair 等网络接口
- **路由配置**：配置容器到主机的路由规则

#### IPAM 插件

IP 地址管理插件负责：

- **IP 池管理**：管理可分配的 IP 地址池
- **地址分配**：为 Pod 分配唯一的 IP 地址
- **地址回收**：回收已删除 Pod 的 IP 地址

### 控制器组件

#### kube-controllers

监控 Kubernetes API 变化并执行相应操作的控制器集合：

- **Policy Controller**：将 Kubernetes NetworkPolicy 转换为 Calico 策略
- **Namespace Controller**：管理命名空间相关的网络配置
- **Node Controller**：监控节点状态和网络配置
- **WorkloadEndpoint Controller**：管理工作负载端点信息

#### confd

轻量级配置管理工具：

- **配置同步**：监控数据存储中的配置变化
- **动态更新**：自动生成和更新 BIRD 配置文件
- **服务重载**：在配置变化时自动重启相关服务

### 数据存储

Calico 支持两种数据存储方式：

#### Kubernetes API Datastore (KDD)

使用 Kubernetes API 作为数据存储的优势：

- **简化管理**：无需额外的数据存储组件
- **集成 RBAC**：利用 Kubernetes 的权限控制机制
- **审计日志**：利用 Kubernetes 的审计功能

#### etcd

独立的 etcd 集群提供：

- **跨平台支持**：支持非 Kubernetes 环境
- **关注点分离**：独立扩展网络数据存储
- **混合部署**：支持多集群和裸机混合场景

### 可选组件

#### Dikastes

服务网格策略执行组件：

- **七层策略**：执行应用层网络策略
- **Istio 集成**：作为 Envoy Sidecar 运行
- **加密认证**：提供请求级别的安全控制

#### calicoctl

命令行管理工具：

- **资源管理**：创建、查看、更新 Calico 资源
- **故障诊断**：提供网络诊断和调试功能
- **配置导入导出**：支持配置的备份和迁移

## 数据平面技术

### eBPF 数据平面

Calico 支持基于 eBPF 的高性能数据平面：

- **内核级处理**：在内核空间处理网络包，避免用户空间开销
- **更好的性能**：相比 iptables 提供更低的延迟和更高的吞吐量
- **源 IP 保持**：支持保持原始源 IP 地址

### iptables 数据平面

传统的基于 iptables 的数据平面：

- **成熟稳定**：经过长期验证的网络处理方式
- **广泛支持**：在各种 Linux 发行版上都有很好的支持
- **调试友好**：使用标准的 Linux 网络工具进行调试

## 网络策略

Calico 提供强大的网络安全策略功能：

### Kubernetes NetworkPolicy

完全兼容 Kubernetes 原生的 NetworkPolicy：

- **入站规则**：控制进入 Pod 的流量
- **出站规则**：控制从 Pod 发出的流量
- **标签选择器**：基于标签进行流量控制

### Calico 扩展策略

提供更丰富的策略功能：

- **全局网络策略**：跨命名空间的策略控制
- **主机端点策略**：保护主机网络接口
- **服务策略**：基于 Kubernetes Service 的策略
- **七层策略**：应用层协议的流量控制

## 部署模式

### BGP 网络模式

- **Full Mesh**：所有节点之间建立 BGP 会话
- **Route Reflector**：通过路由反射器减少 BGP 会话数量
- **AS Per Rack**：为每个机架分配独立的 AS 号

### 网络拓扑

- **扁平网络**：所有 Pod 在同一个大二层网络中
- **分段网络**：根据命名空间或其他标准进行网络分段
- **跨云部署**：支持多云和混合云环境

## 参考资料

- [Calico 官方文档](https://docs.tigera.io/calico/latest/)
- [Calico 架构概览](https://docs.tigera.io/calico/latest/reference/architecture/overview)
- [eBPF 数据平面](https://docs.tigera.io/calico/latest/operations/ebpf/)
