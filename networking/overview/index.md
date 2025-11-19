---
title: Kubernetes 网络架构概述
linktitle: 概述
weight: 1
description: 从高层次理解 Kubernetes 网络架构，包括网络模型、通信模式、网络策略和架构设计原则。
date: 2025-10-19T00:00:00+08:00
lastmod: 2025-10-27T16:26:51.816Z
---

> 云原生网络的本质，是用软件定义的方式重塑连接、隔离与治理的边界，让复杂系统的流动性与安全性兼得。

Kubernetes 网络架构是云原生基础设施的核心组成部分，涵盖了容器通信、服务发现、负载均衡、安全隔离等关键能力。本文系统梳理了 Kubernetes 网络的模型层次、通信模式、策略机制及主流插件生态，帮助读者全面理解其设计原则与运维实践。

## 网络挑战与设计目标

Kubernetes 网络需要应对容器环境下的动态变化和多样化需求。下图总结了容器网络的主要挑战及对应解决方案。

```mermaid "容器网络挑战与解决方案"
graph TD
    subgraph "容器网络挑战"
        CH1["动态创建销毁<br/>Pod IP 频繁变化"]
        CH2["跨节点通信<br/>节点间网络互通"]
        CH3["服务发现<br/>动态服务定位"]
        CH4["网络隔离<br/>多租户安全隔离"]
        CH5["性能开销<br/>网络栈效率优化"]
        CH6["可移植性<br/>跨环境一致性"]
    end

    subgraph "解决方案"
        SOL1["CNI 标准化接口"]
        SOL2["Overlay/SDN 网络"]
        SOL3["Service 抽象层"]
        SOL4["NetworkPolicy"]
        SOL5["eBPF/XDP 加速"]
        SOL6["云原生网络方案"]
    end

    CH1 --> SOL1
    CH2 --> SOL2
    CH3 --> SOL3
    CH4 --> SOL4
    CH5 --> SOL5
    CH6 --> SOL6
```

![容器网络挑战与解决方案](https://assets.jimmysong.io/images/book/kubernetes-handbook/networking/overview/0eff034308869028feb90e389fbb9dc9.svg)
{width=1920 height=548}

Kubernetes 网络设计遵循以下核心原则：

- 每个 Pod 都有唯一的 IP 地址
- Pod 间可以直接通信，无需 NAT
- Service 提供稳定的服务发现和负载均衡
- 网络策略控制流量访问
- 插件化架构支持多种实现

## 网络模型层次

Kubernetes 网络模型分为多个层次，便于理解各组件的职责和作用。下图展示了网络层次结构及通信对象。

```mermaid "Kubernetes 网络模型层次"
graph TB
    subgraph "网络层次"
        CLUSTER["集群网络<br/>Cluster Network"]
        NODE["节点网络<br/>Node Network"]
        POD["Pod 网络<br/>Pod Network"]
        CONTAINER["容器网络<br/>Container Network"]
    end

    subgraph "通信对象"
        SERVICES["Service<br/>服务发现"]
        PODS["Pod<br/>工作负载"]
        CONTAINERS["Container<br/>应用实例"]
    end

    CLUSTER --> NODE
    NODE --> POD
    POD --> CONTAINER

    SERVICES -.-> PODS
    PODS -.-> CONTAINERS
```

![Kubernetes 网络模型层次](https://assets.jimmysong.io/images/book/kubernetes-handbook/networking/overview/a4bbd72e29663ed17784d3a460b6be8e.svg)
{width=2120 height=198}

### 集群网络 (Cluster Network)

- 整个 Kubernetes 集群的网络范围，通常为一个大的 CIDR 块（如 `10.0.0.0/8`）。
- 由网络插件负责分配和管理。

### 节点网络 (Node Network)

- 每个节点的网络配置，包括节点 IP 和路由规则。
- 负责节点间通信。

### Pod 网络 (Pod Network)

- Pod 的网络命名空间，每个 Pod 有唯一的 IP 地址。
- 支持跨节点 Pod 间通信。

## 通信模式与实现机制

Kubernetes 支持多种通信模式，满足不同场景下的流量需求。下图展示了主要通信模式及其实现机制。

```mermaid "Kubernetes 通信模式"
graph TD
    subgraph "通信模式"
        POD2POD["Pod-to-Pod<br/>Pod 间直接通信"]
        POD2SERVICE["Pod-to-Service<br/>通过 Service 访问"]
        EXTERNAL2SERVICE["External-to-Service<br/>外部访问服务"]
        SERVICE2EXTERNAL["Service-to-External<br/>服务访问外部"]
    end

    subgraph "实现机制"
        CNI_PLUGIN["CNI 插件<br/>底层网络"]
        KUBE_PROXY["kube-proxy<br/>服务代理"]
        INGRESS["Ingress<br/>外部接入"]
        EGRESS["Egress<br/>出口流量"]
    end

    POD2POD --> CNI_PLUGIN
    POD2SERVICE --> KUBE_PROXY
    EXTERNAL2SERVICE --> INGRESS
    SERVICE2EXTERNAL --> EGRESS
```

![Kubernetes 通信模式](https://assets.jimmysong.io/images/book/kubernetes-handbook/networking/overview/ed10c47c51e23dabd2fdb5b3270b6c83.svg)
{width=1920 height=797}

### Pod-to-Pod 通信

- 所有 Pod 在同一个扁平网络中，无需 NAT 转换，可直接通信。
- 由 CNI 插件实现。

### Pod-to-Service 通信

- 通过 Service 抽象层，提供负载均衡和服务发现。
- 支持多种 Service 类型。

## Service 网络抽象与类型

Service 是 Kubernetes 网络的核心抽象，支持多种访问模型。下图展示了 Service 类型与网络实现的关系。

```mermaid "Service 类型和网络实现"
graph TD
    subgraph "Service 类型"
        CLUSTERIP["ClusterIP<br/>集群内部访问"]
        NODEPORT["NodePort<br/>节点端口映射"]
        LOADBALANCER["LoadBalancer<br/>云负载均衡器"]
        EXTERNALNAME["ExternalName<br/>外部服务别名"]
    end

    subgraph "网络实现"
        KUBE_PROXY["kube-proxy<br/>用户空间代理"]
        IPTABLES["iptables<br/>内核规则"]
        IPVS["IPVS<br/>高性能代理"]
        CLOUD_PROVIDER["云提供商集成"]
    end

    CLUSTERIP --> KUBE_PROXY
    CLUSTERIP --> IPTABLES
    CLUSTERIP --> IPVS

    NODEPORT --> KUBE_PROXY
    LOADBALANCER --> CLOUD_PROVIDER
```

![Service 类型和网络实现](https://assets.jimmysong.io/images/book/kubernetes-handbook/networking/overview/4ebaa33bd556d934614ecf1f2bde3e14.svg)
{width=1920 height=741}

Service 的 Endpoint 与网络拓扑如下图所示，便于理解流量分发过程。

```mermaid "Service Endpoint 和 Network Topology"
graph TB
    CLIENT["客户端"] --> SVC["Service<br/>10.96.0.1:80"]
    SVC --> EP["Endpoints<br/>Pod 列表"]

    EP --> POD1["Pod 1<br/>192.168.1.10:8080"]
    EP --> POD2["Pod 2<br/>192.168.1.11:8080"]
    EP --> POD3["Pod 3<br/>192.168.2.20:8080"]

    subgraph "节点 1"
        POD1
    end

    subgraph "节点 2"
        POD2
        POD3
    end
```

![Service Endpoint 和 Network Topology](https://assets.jimmysong.io/images/book/kubernetes-handbook/networking/overview/9705a5817a3df36df5cd729d51fe61f0.svg)
{width=1920 height=1542}

## 网络策略与安全机制

Kubernetes 通过 NetworkPolicy 实现细粒度流量控制和零信任安全。下图展示了 NetworkPolicy 的模型结构。

```mermaid "NetworkPolicy 模型结构"
graph TD
    subgraph "流量控制"
        INGRESS["入口流量<br/>Ingress Rules"]
        EGRESS["出口流量<br/>Egress Rules"]
    end

    subgraph "匹配条件"
        POD_SELECTOR["Pod 选择器"]
        NAMESPACE_SELECTOR["命名空间选择器"]
        IP_BLOCK["IP 地址块"]
        PORT["端口和协议"]
    end

    subgraph "策略类型"
        ALLOW["允许策略"]
        DENY["拒绝策略<br/>默认行为"]
    end

    INGRESS --> POD_SELECTOR
    INGRESS --> NAMESPACE_SELECTOR
    INGRESS --> IP_BLOCK
    INGRESS --> PORT

    EGRESS --> POD_SELECTOR
    EGRESS --> NAMESPACE_SELECTOR
    EGRESS --> IP_BLOCK
    EGRESS --> PORT

    POD_SELECTOR --> ALLOW
    NAMESPACE_SELECTOR --> ALLOW
    IP_BLOCK --> ALLOW
```

![NetworkPolicy 模型结构](https://assets.jimmysong.io/images/book/kubernetes-handbook/networking/overview/b27357cdc1528705517adf02c94dd6ac.svg)
{width=1920 height=1416}

以下是一个典型的零信任 NetworkPolicy 配置示例：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-allow
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: web
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
```

## 网络插件生态与选择标准

Kubernetes 支持多种 CNI 网络插件，满足不同场景下的性能、安全和运维需求。下图展示了主流插件分类及其网络模型。

```mermaid "CNI Plugin Classification"
graph TD
    subgraph "网络模型"
        OVERLAY["Overlay 网络<br/>VXLAN, IPIP"]
        ROUTE["路由网络<br/>BGP, 静态路由"]
        UNDERLAY["Underlay 网络<br/>直接使用物理网络"]
    end

    subgraph "主流插件"
        FLANNEL["Flannel<br/>简单 Overlay"]
        CALICO["Calico<br/>路由 + 网络策略"]
        CILIUM["Cilium<br/>eBPF + 服务网格"]
        WEAVE["Weave<br/>对等网络"]
        CANAL["Canal<br/>Flannel + Calico"]
    end

    subgraph "云原生插件"
        AMAZON["AWS VPC CNI<br/>AWS 集成"]
        AZURE["Azure CNI<br/>Azure 集成"]
        GCP["GKE 网络<br/>GCP 集成"]
    end

    OVERLAY --> FLANNEL
    OVERLAY --> WEAVE

    ROUTE --> CALICO
    ROUTE --> CILIUM

    UNDERLAY --> AMAZON
    UNDERLAY --> AZURE
    UNDERLAY --> GCP
```

![CNI Plugin Classification](https://assets.jimmysong.io/images/book/kubernetes-handbook/networking/overview/b9e21b4ea0fe56a3ac4eae0fc26202e2.svg)
{width=2038 height=480}

选择网络插件时需综合考虑性能、安全、可观测性、运维复杂度和云兼容性等因素。下表对比了主流插件的关键维度。

{{< table title="主流 Kubernetes 网络插件选择对比" >}}

| 维度       | 考虑因素                 | 示例                    |
|------------|-------------------------|------------------------|
| 性能       | 网络延迟、吞吐量、资源占用 | Cilium > Calico > Flannel |
| 安全性     | 网络策略支持、加密能力     | Calico, Cilium         |
| 可观测性   | 流量监控、故障排查         | Cilium, Calico         |
| 运维复杂度 | 部署难度、维护成本         | Flannel > Calico > CILIUM |
| 云兼容性   | 云厂商集成、网络策略支持    | AWS VPC CNI, Azure CNI |

{{< /table >}}

## 网络架构演进与发展趋势

Kubernetes 网络架构从单体应用逐步演进到微服务和云原生模式。下图展示了架构演进过程及网络复杂度提升。

```mermaid "网络架构演进"
graph LR
    subgraph "传统单体应用"
        MONOLITH["单体应用<br/>单一进程"]
        LB["负载均衡器"]
        DB["数据库"]

        CLIENT --> LB
        LB --> MONOLITH
        MONOLITH --> DB
    end

    subgraph "微服务架构"
        API["API 服务"]
        USER["用户服务"]
        ORDER["订单服务"]
        PAYMENT["支付服务"]

        INGRESS --> API
        API --> USER
        API --> ORDER
        ORDER --> PAYMENT
        USER --> DB1
        ORDER --> DB2
        PAYMENT --> DB3
    end

    subgraph "网络复杂度递增"
        NETWORKING["服务发现<br/>负载均衡<br/>网络隔离<br/>流量控制"]
    end
```

![网络架构演进](https://assets.jimmysong.io/images/book/kubernetes-handbook/networking/overview/9481cfad0c68a2719ca21c4476b0c6a4.svg)
{width=1920 height=6186}

当前云原生网络发展趋势主要包括：

- 服务网格（Service Mesh）：如 Istio、Linkerd、Consul Connect，提升应用层流量治理能力。
- eBPF 加速：如 Cilium、Calico eBPF 模式，实现内核级高性能网络处理。
- 多集群网络：如 Submariner、Skupper，支持集群联邦和多集群服务发现。
- 零信任安全：基于身份的网络访问控制，声明式管理网络策略。

## 网络故障排查框架与工具

系统性排查方法有助于快速定位和解决网络问题。下图展示了故障排查流程。

```mermaid "网络故障排查流程"
graph TD
    START["网络问题报告"] --> DIAGNOSIS["诊断分类"]

    DIAGNOSIS --> CONNECTIVITY["连通性问题"]
    DIAGNOSIS --> PERFORMANCE["性能问题"]
    DIAGNOSIS --> SECURITY["安全策略问题"]

    CONNECTIVITY --> CHECK_DNS["检查 DNS 解析"]
    CONNECTIVITY --> CHECK_SERVICE["检查 Service 端点"]
    CONNECTIVITY --> CHECK_NETWORKPOLICY["检查 NetworkPolicy"]

    PERFORMANCE --> CHECK_LATENCY["检查网络延迟"]
    PERFORMANCE --> CHECK_THROUGHPUT["检查吞吐量"]
    PERFORMANCE --> CHECK_PACKETLOSS["检查丢包率"]

    SECURITY --> AUDIT_POLICIES["审计网络策略"]
    SECURITY --> CHECK_FIREWALL["检查防火墙规则"]
    SECURITY --> VERIFY_CERTIFICATES["验证证书配置"]

    CHECK_DNS --> TOOLS["诊断工具"]
    CHECK_SERVICE --> TOOLS
    CHECK_NETWORKPOLICY --> TOOLS
    CHECK_LATENCY --> TOOLS
    CHECK_THROUGHPUT --> TOOLS
    CHECK_PACKETLOSS --> TOOLS
    AUDIT_POLICIES --> TOOLS
    CHECK_FIREWALL --> TOOLS
    VERIFY_CERTIFICATES --> TOOLS

    TOOLS --> RESOLUTION["问题解决"]
```

![网络故障排查流程](https://assets.jimmysong.io/images/book/kubernetes-handbook/networking/overview/b8af066a8173f5f5efb2f5c09ad05153.svg)
{width=2202 height=882}

常用诊断工具如下，便于实际运维排查：

```bash
# 网络连通性测试
kubectl run test-pod --image=busybox --rm -it --restart=Never -- wget -qO- http://service-name

# DNS 解析测试
kubectl run test-pod --image=busybox --rm -it --restart=Never -- nslookup service-name

# 网络策略测试
kubectl run test-pod --image=busybox --rm -it --restart=Never -- wget -qO- http://blocked-service

# 抓包分析
kubectl run netshoot --image=nicolaka/netshoot --rm -it --restart=Never
```

## 最佳实践与运维建议

合理的网络规划和运维策略是保障集群稳定运行的基础。以下原则和建议可供参考：

### 网络规划原则

- IP 地址规划：为 Pod、Service、节点分配合适的 CIDR，预留扩展空间，避免冲突。
- 网络隔离策略：默认拒绝所有流量，基于最小权限原则开放访问，定期审计和更新策略。
- 性能优化：选择合适的网络插件，配置合适的 MTU，监控网络性能指标。

### 运维建议

- 监控重点：关注网络延迟、丢包率、DNS 解析性能、Service 端点变化、NetworkPolicy 生效情况。
- 故障应对：准备排查手册，建立问题升级流程，定期进行故障演练。
- 容量规划：监控资源使用，规划扩展容量，预留故障恢复资源。

## 总结

Kubernetes 网络架构采用分层设计，从底层容器网络到高层服务抽象，每一层都解决了特定的网络挑战。通过 CNI 插件机制，Kubernetes 支持多种网络实现方案，能够灵活适配不同应用场景和基础设施需求。掌握核心概念和设计原则，有助于在实际部署和运维中做出正确的架构决策，并高效排查网络相关问题。

## 参考文献

1. [Kubernetes 官方文档 - kubernetes.io](https://kubernetes.io/docs/concepts/cluster-administration/networking/)
2. [CNI 插件规范 - github.com/containernetworking/cni](https://github.com/containernetworking/cni)
3. [Service Mesh Landscape - servicemesh.cn](https://servicemesh.cn/)
