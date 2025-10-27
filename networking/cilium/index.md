---
weight: 52
title: 基于 eBPF 的网络 Cilium
linktitle: Cilium
date: 2022-05-21T00:00:00+08:00
description: Cilium 是一个基于 eBPF 技术的开源云原生网络、可观测性和安全解决方案。本文介绍 Cilium 的核心概念、架构组件、主要特性以及与 Hubble 的集成，帮助读者了解如何利用 eBPF 技术实现高性能的容器网络和安全策略。
lastmod: 2025-10-27T17:42:34.110Z
---

> Cilium 利用 eBPF 技术为 Kubernetes 提供高性能、可观测和安全的网络基础，是现代云原生网络与安全治理的核心方案。

## Cilium 核心概念

Cilium 是为云原生环境设计的网络、可观测性和安全平台，基于 Linux 内核的 eBPF 技术，能够透明地为容器和服务提供网络连接、负载均衡和安全防护，无需修改应用代码或容器配置。

### eBPF 技术基础

> **扩展的伯克利包过滤器**（eBPF, Extended Berkeley Packet Filter）是 Linux 内核中的一项创新技术，允许在内核空间运行沙盒程序，无需修改内核源码或加载内核模块。eBPF 最初用于网络包过滤，现已扩展到系统调用过滤、性能分析和安全等领域。

eBPF 的主要特点：

- 安全性：程序在虚拟机中运行，具备严格安全检查
- 高性能：直接在内核空间执行，避免上下文切换
- 可编程性：支持复杂逻辑和状态维护
- 实时性：可实时处理网络包和系统事件

## Hubble：网络可观测性平台

Hubble 是 Cilium 的网络可观测性组件，提供对 Kubernetes 集群网络流量的深度可视化和监控。

### Hubble 的核心功能

- 实时流量监控：可视化服务间通信
- 安全事件跟踪：监控网络安全策略执行
- 性能分析：分析网络延迟、吞吐量和错误率
- 故障诊断：定位网络连接和策略配置问题

### 监控工具集成

Hubble 支持多种监控和可视化工具：

- Hubble CLI：命令行实时查询和分析
- Hubble UI：Web 界面展示网络拓扑和流量
- Prometheus：导出网络指标，支持告警和存储
- Grafana：自定义网络性能和安全仪表板

## 主要特性与优势

Cilium 通过 eBPF 技术实现了高性能、身份驱动和应用层感知的网络安全能力。

### 身份驱动的安全模型

- 标签驱动：基于 Kubernetes 标签定义服务身份
- 动态适配：自动适应容器生命周期
- 策略简化：无需管理复杂 IP 和端口规则
- 多集群支持：支持跨集群身份识别和策略执行

### 应用层协议感知

Cilium 能理解和处理 L7 应用层协议，支持 HTTP、gRPC、Kafka 等：

- HTTP/HTTPS：基于方法、路径、头部的精细访问控制
- gRPC：基于服务名和方法的访问控制，支持元数据过滤和双向 TLS
- Kafka：Topic 级访问控制，基于身份授权和消息内容过滤

### 高性能网络处理

- 内核级处理：减少上下文切换
- XDP 支持：网卡驱动层包处理，极低延迟
- 负载均衡优化：支持 DSR 和一致性哈希
- 高效连接跟踪：状态管理性能优异

## 网络模型与部署模式

Cilium 支持多种网络模型，适应不同基础设施和性能需求。

### Overlay 网络模式

- VXLAN：常用封装协议，支持多租户隔离
- Geneve：灵活封装，支持扩展元数据
- WireGuard：加密 overlay 网络

适用于底层网络受限、跨云或混合云场景。

### Native Routing 模式

- BGP 集成：与数据中心路由器对接
- 云网络集成：利用云平台原生路由
- 性能最优：无封装开销

适用于高性能、可控网络环境。

## 组件架构

Cilium 采用分布式组件架构，便于扩展和集成。

![Cilium 组件架构图](https://assets.jimmysong.io/images/book/kubernetes-handbook/networking/cilium/cilium-arch.webp)
{width=1619 height=1443}

### Cilium Agent

每个节点运行 Cilium Agent，负责：

- 网络配置：为 Pod 分配 IP 和配置接口
- 策略执行：将安全策略编译为 eBPF 程序
- 状态同步：与 Kubernetes API 同步集群状态
- 指标收集：采集网络与安全指标

支持 REST、gRPC、CNI 等多种接口。

### Cilium Operator

负责集群级操作：

- IP 地址管理
- CRD 管理
- 证书生成与轮换
- 垃圾回收

### 数据存储

Cilium 使用 Kubernetes 的 etcd 存储身份映射、网络策略、服务与节点信息等。

## 命令行工具使用

Cilium 提供丰富的命令行工具，便于日常运维和调试。

```bash
# 查看集群状态
cilium status

# 管理网络端点
cilium endpoint list
cilium endpoint get <endpoint-id>

# 网络策略管理
cilium policy get
cilium policy import <policy-file>
cilium policy delete <policy-name>

# 网络连通性测试
cilium connectivity test

# 监控网络流量
cilium monitor
cilium monitor --type=drop

# 服务和负载均衡
cilium service list
cilium bpf lb list

# 调试和故障排除
cilium debuginfo
cilium bpf tunnel list
```

### 网络策略示例

以下为典型的 Cilium 网络策略配置：

```yaml
apiVersion: "cilium.io/v2"
kind: CiliumNetworkPolicy
metadata:
  name: "l7-rule"
spec:
  endpointSelector:
    matchLabels:
      app: web-server
  ingress:
  - fromEndpoints:
    - matchLabels:
        app: api-gateway
    toPorts:
    - ports:
      - port: "80"
        protocol: TCP
      rules:
        http:
        - method: "GET"
          path: "/api/v1/.*"
        - method: "POST"
          path: "/api/v1/data"
          headers:
          - "Content-Type: application/json"
```

该策略允许带有 `app: api-gateway` 标签的 Pod 通过 HTTP GET 和 POST 方法访问 `app: web-server` 的特定路径。

## 性能优化与最佳实践

为获得最佳性能和稳定性，建议关注以下方面。

### 部署建议

- 推荐 Linux 内核 4.19+，启用 eBPF、XDP 等内核特性
- 合理配置 Cilium Agent 资源和 eBPF map 大小
- 选择合适的数据路径模式，优化 MTU，必要时启用 XDP

### 监控与故障排除

- 监控网络延迟、吞吐、策略执行、eBPF 性能等关键指标
- 使用 `cilium monitor` 追踪包丢弃和策略命中
- 检查 eBPF 程序加载和网络策略配置
- 利用 Hubble 分析流量和安全事件

## 与云原生生态集成

Cilium 与 Kubernetes 及主流云原生工具深度集成。

- 完全兼容 Kubernetes NetworkPolicy
- 高性能 Service 负载均衡
- 支持 Ingress 控制器和服务网格（如 Istio）
- 集成 Falco、OPA/Gatekeeper、Prometheus/Grafana、Jaeger/Zipkin 等安全与可观测工具

## 总结

Cilium 通过 eBPF 技术为 Kubernetes 提供了高性能、可观测和安全的网络解决方案，支持细粒度安全控制和深度网络可视性。建议结合实际场景选择合适的部署模式和策略，充分发挥 Cilium 在云原生网络治理中的优势。

## 参考文献

- [Cilium 官方网站 - cilium.io](https://cilium.io)
- [Cilium 文档 - docs.cilium.io](https://docs.cilium.io)
- [eBPF 官方网站 - ebpf.io](https://ebpf.io)
- [Hubble 项目 - github.com](https://github.com/cilium/hubble)
- [CNCF Cilium 项目 - cncf.io](https://www.cncf.io/projects/cilium/)
