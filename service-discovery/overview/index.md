---
title: Kubernetes 中的服务发现与网络路由
linktitle: 概述
date: 2025-10-13
weight: 1
description: 系统梳理了 Kubernetes 网络与服务相关的核心概念，重点介绍 Service、EndpointSlice、DNS、Ingress、网络策略等机制，帮助读者理解集群内外通信与服务发现的实现方式。
lastmod: 2025-10-13T04:49:54.720Z
---

本文介绍 Kubernetes 网络与服务的核心概念，重点阐述 Service 及其相关组件如何实现 Pod 间通信与应用对外暴露。

## Service 概述

Service 是 Kubernetes 中用于定义一组逻辑 Pod 及其访问策略的抽象，提供稳定的访问入口，实现应用间的解耦。

```mermaid "Service 层次结构与访问流程"
flowchart TD
    subgraph "Client Access"
        Client("外部客户端")
        InternalClient("集群内 Pod 客户端")
    end

    subgraph "Service Layer"
        Service("Service</br>（稳定 IP + DNS 名称）")
        EP("EndpointSlices</br>（实际 Pod IP）")
    end
    
    subgraph "Pod Layer"
        Pod1("Pod 1</br>app=MyApp")
        Pod2("Pod 2</br>app=MyApp") 
        Pod3("Pod 3</br>app=MyApp")
    end

    Client --> Service
    InternalClient --> Service
    Service --> EP
    EP --> Pod1
    EP --> Pod2
    EP --> Pod3

    classDef plain fill:#ddd,stroke:#fff,stroke-width:4px,color:#000;
    classDef k8s fill:#326ce5,stroke:#fff,stroke-width:4px,color:#fff;
    classDef cluster fill:#fff,stroke:#bbb,stroke-width:2px,color:#326ce5;

    class Client,InternalClient plain;
    class Service,EP k8s;
    class Pod1,Pod2,Pod3 k8s;
```

![Service 层次结构与访问流程](c7a47cb31c775199d3f79a9bc48ea56c.svg)
{width=1920 height=2234}

## Service 类型

Kubernetes 支持多种 Service 类型，满足不同场景下的访问需求。

{{< table title="Service 类型与适用场景" >}}

| 类型 | 描述 | 典型场景 |
| --- | --- | --- |
| ClusterIP | 仅集群内可访问 | 应用间内部通信 |
| NodePort | 每个节点开放静态端口 | 开发测试、简单外部访问 |
| LoadBalancer | 云厂商负载均衡器 | 生产环境对外服务 |
| ExternalName | 映射到外部 DNS 名称 | 访问集群外部服务 |

{{< /table >}}

ClusterIP（默认）仅集群内可访问，NodePort 和 LoadBalancer 均基于 ClusterIP 增加了外部访问能力。

```mermaid "不同 Service 类型流量路径"
flowchart TD
    subgraph "Kubernetes Cluster"
        subgraph "Node 1"
            kp1["kube-proxy"]
            p1["Pod</br>app=MyApp"]
            p2["Pod</br>app=MyApp"]
            np1["NodePort</br>30007"]
        end
        
        subgraph "Node 2"
            kp2["kube-proxy"]
            p3["Pod</br>app=MyApp"]
            np2["NodePort</br>30007"]
        end
        
        svc["ClusterIP Service</br>10.96.0.10"]
    end

    LB["负载均衡器</br>(外部 IP)"]
    Client["外部客户端"]

    Client -- "1. 通过负载均衡器访问" --> LB
    Client -- "2. 通过 NodePort 访问" --> np1
    Client -- "3. 通过 NodePort 访问" --> np2
    LB --> svc
    np1 --> svc
    np2 --> svc
    svc -- "路由到" --> p1
    svc -- "路由到" --> p2
    svc -- "路由到" --> p3
    kp1 -- "编程路由" --> np1
    kp2 -- "编程路由" --> np2
```

![不同 Service 类型流量路径](a02b613568d9af5144190b6b698d7135.svg)
{width=1920 height=1185}

## Service 选择器与端点

Service 通过标签选择器确定后端 Pod，Kubernetes 自动生成 EndpointSlice 记录所有匹配 Pod 的 IP。无选择器的 Service 可手动管理 EndpointSlice。

## 多端口与 Headless Service

Service 支持多端口暴露，需为每个端口命名。Headless Service（`clusterIP: None`）不提供统一 IP，而是直接暴露所有后端 Pod 的 IP，适用于需要点对点连接的有状态应用。

```mermaid "普通 Service 与 Headless Service 对比"
flowchart TD
    subgraph "Normal Service"
        svc["Service</br>ClusterIP: 10.96.0.10"] --> pod1["Pod 1</br>10.244.0.5"]
        svc --> pod2["Pod 2</br>10.244.0.6"]
        svc --> pod3["Pod 3</br>10.244.0.7"]
        client1["客户端"] --> svc
    end

    subgraph "Headless Service"
        hsvc["Headless Service</br>ClusterIP: None"]
        client2["客户端"] -- "DNS 查询返回所有 Pod IP" --> hsvc
        client2 -- "直连" --> hpod1["Pod 1</br>10.244.1.5"]
        client2 -- "直连" --> hpod2["Pod 2</br>10.244.1.6"]
        client2 -- "直连" --> hpod3["Pod 3</br>10.244.1.7"]
    end
```

![普通 Service 与 Headless Service 对比](64fddc9b958a9bf4118da8ed32064302.svg)
{width=1920 height=777}

## EndpointSlice 机制

EndpointSlice 是 Kubernetes 跟踪网络端点的高效机制，适合大规模 Service。

```mermaid "EndpointSlice 结构与关联"
flowchart TD
    subgraph "Service"
        svc["Service</br>app=MyApp"]
    end

    subgraph "EndpointSlices"
        es1["EndpointSlice 1</br>(最多 100 个端点)"]
        es2["EndpointSlice 2</br>(更多端点)"]
    end

    subgraph "Pods"
        p1["Pod 1</br>IP: 10.244.0.5"]
        p2["Pod 2</br>IP: 10.244.0.6"]
        p3["Pod 3</br>IP: 10.244.0.7"]
        pn["...更多 Pod"]
    end

    svc -- "拥有" --> es1
    svc -- "拥有" --> es2
    es1 -- "引用" --> p1
    es1 -- "引用" --> p2
    es2 -- "引用" --> p3
    es2 -- "引用" --> pn

    kp["kube-proxy"] -- "监听" --> es1
    kp -- "监听" --> es2
```

![EndpointSlice 结构与关联](06d1c1083b473f15e3e5eb06c9761bba.svg)
{width=1920 height=1534}

控制面自动为带选择器的 Service 创建和维护 EndpointSlice，每个 Slice 包含一组端点的地址、端口和状态。

## 服务与 Pod 的 DNS

Kubernetes 为 Service 和 Pod 提供 DNS 记录，实现基于名称的服务发现。

### Service DNS 记录

普通 Service 在 `my-service.my-namespace.svc.cluster.local` 生成 A/AAAA 记录，Headless Service 为每个后端 Pod 生成独立记录。

### Pod DNS 记录

Pod 的 DNS 记录格式如下：

```text
pod-ip-address.my-namespace.pod.cluster.local
```

```mermaid "Kubernetes DNS 解析流程"
flowchart LR
    subgraph "DNS Resolution in Kubernetes"
        direction TB

        subgraph "Clients"
            podClient["Pod"]
        end

        subgraph "Core DNS"
            coreDNS["CoreDNS</br>(cluster DNS 服务)"]
        end

        subgraph "Services DNS Records"
            direction TB
            svcA["my-service.my-namespace.svc.cluster.local</br>A 记录 → 10.96.0.10"]
            svcSRV["_http._tcp.my-service.my-namespace.svc.cluster.local</br>SRV 记录"]
        end

        subgraph "Pods DNS Records"
            direction TB
            podA["10-244-0-5.my-namespace.pod.cluster.local</br>A 记录 → 10.244.0.5"]
        end

        podClient -- "1. DNS 查询" --> coreDNS
        coreDNS -- "2a. Service 查询" --> svcA
        coreDNS -- "2b. SRV 查询" --> svcSRV
        coreDNS -- "2c. Pod 查询" --> podA
    end
```

![Kubernetes DNS 解析流程](c07a80c96558caa732a2081f305c29db.svg)
{width=1920 height=1697}

### Pod DNS 配置

可通过 `dnsPolicy` 和 `dnsConfig` 字段配置 Pod 的 DNS 行为：

- `Default`：继承节点 DNS 配置
- `ClusterFirst`：优先使用集群 DNS
- `ClusterFirstWithHostNet`：hostNetwork Pod 专用
- `None`：忽略集群 DNS 设置

## Ingress 入口资源

Ingress 用于将集群外部的 HTTP/HTTPS 流量路由到集群内 Service，支持基于主机名和路径的转发。

```mermaid "Ingress 流量路由示意"
flowchart TD
    subgraph "External"
        client["外部客户端"]
    end

    subgraph "Kubernetes Cluster"
        direction TB

        subgraph "Ingress Layer"
            ingCtrl["Ingress Controller</br>(如 nginx-ingress)"]
            ing["Ingress 资源</br>host: foo.bar.com</br>path: /foo → service1:80</br>path: /bar → service2:80"]
        end

        subgraph "Service Layer"
            svc1["Service: service1</br>ClusterIP: 10.96.0.11"]
            svc2["Service: service2</br>ClusterIP: 10.96.0.12"]
        end

        subgraph "Pod Layer"
            pod1["Pod 1</br>service1</br>10.244.0.5"]
            pod2["Pod 2</br>service1</br>10.244.0.6"]
            pod3["Pod 3</br>service2</br>10.244.0.7"]
            pod4["Pod 4</br>service2</br>10.244.0.8"]
        end
    end

    client --> ingCtrl
    ingCtrl -- "实现" --> ing
    ing -- "路由 /foo" --> svc1
    ing -- "路由 /bar" --> svc2
    svc1 --> pod1
    svc1 --> pod2
    svc2 --> pod3
    svc2 --> pod4
```

![Ingress 流量路由示意](2e53647a7d69fc6c6eac81eaae283566.svg)
{width=1920 height=2614}

常见 Ingress Controller 包括 NGINX、AWS Load Balancer、GCE Ingress 等。

### 路径类型

Ingress 支持多种路径匹配方式：

{{< table title="Ingress 路径类型说明" >}}

| 路径类型 | 描述 | 示例 |
| --- | --- | --- |
| Prefix | 按 `/` 分割的前缀匹配 | `/foo` 匹配 `/foo/bar` |
| Exact | 精确路径匹配 | `/foo` 仅匹配 `/foo` |
| ImplementationSpecific | 由 IngressClass 决定 | 依赖控制器实现 |

{{< /table >}}

## 网络策略（NetworkPolicy）

NetworkPolicy 允许基于标签选择器定义 Pod 的网络访问规则，实现细粒度的流量隔离。

```mermaid "NetworkPolicy 流量控制示意"
flowchart TD
    subgraph K8s_Cluster [Kubernetes Cluster]
        direction TB

        subgraph NS_default [Namespace: default]
            pod1["Pod: frontend<br/>app=frontend"]
            pod2["Pod: backend<br/>app=backend"]
            pod3["Pod: database<br/>role=db"]

            netpol["NetworkPolicy<br/>spec.podSelector: role=db<br/>允许 ingress: app=frontend<br/>允许 egress: 10.0.0.0/24:5978"]
        end

        subgraph NS_other [Namespace: other]
            pod4["Pod: other-service<br/>project=myproject"]
        end

        external["外部服务<br/>10.0.0.5:5978"]
    end

    pod1 -- 被允许 --> pod3
    pod4 -- 被允许 --> pod3
    pod2 -. 被拒绝 .-> pod3
    pod3 -- 被允许 --> external

    netpol -. 控制流量 .-> pod3
```

![NetworkPolicy 流量控制示意](12fb2634fbc2a086005dda8185e71931.svg)
{width=1920 height=1401}

NetworkPolicy 支持：

- **Ingress**：入站流量控制
- **Egress**：出站流量控制

默认无策略时全部放通，应用策略后仅允许显式声明的流量。

## 双栈网络（IPv4/IPv6）

Kubernetes 支持双栈网络，可为 Pod 和 Service 分配 IPv4 与 IPv6 地址（1.21+ 默认启用）。

```mermaid "双栈网络配置与流量"
flowchart TD
    subgraph "Kubernetes Cluster"
        direction TB

        subgraph "Control Plane"
            apiserver["kube-apiserver</br>--service-cluster-ip-range=10.96.0.0/16,fd00::/108"]
            controller["kube-controller-manager</br>--cluster-cidr=10.244.0.0/16,fd01::/48"]
        end

        subgraph "Node 1"
            kubelet1["kubelet</br>--node-ip=192.168.0.10,2001:db8::10"]
            pod1["Pod</br>IPv4: 10.244.1.4</br>IPv6: fd01::4"]
            pod2["Pod</br>IPv4: 10.244.1.5</br>IPv6: fd01::5"]
        end

        subgraph "Node 2"
            kubelet2["kubelet</br>--node-ip=192.168.0.11,2001:db8::11"]
            pod3["Pod</br>IPv4: 10.244.2.4</br>IPv6: fd01:0:0:2::4"]
        end

        svc["Service (dual-stack)</br>ClusterIPs:</br>- 10.96.0.10 (IPv4)</br>- fd00::10 (IPv6)"]
    end

    pod1 --> svc
    pod2 --> svc
    pod3 --> svc
```

![双栈网络配置与流量](03a588dd8d97f0c8ac83d34a0953b2dd.svg)
{width=1920 height=1032}

Service 的 `ipFamilyPolicy` 可设为：

- `SingleStack`：仅分配首个 IP 家族
- `PreferDualStack`：优先双栈，若支持则分配双 IP
- `RequireDualStack`：强制要求双栈，否则失败

## Service 内部流量策略

通过设置 `.spec.internalTrafficPolicy: Local`，可让 Service 仅将内部流量路由到本节点上的后端 Pod，提升性能并减少跨节点流量。

## 总结

Kubernetes 网络与服务系统通过 Service、EndpointSlice、DNS、Ingress、NetworkPolicy 等机制，实现了集群内外的高效服务发现、流量调度与安全隔离。掌握这些核心机制，有助于设计和运维高可用、可扩展的云原生应用网络。

## 参考文献

1. [Kubernetes Service 官方文档 - kubernetes.io](https://kubernetes.io/docs/concepts/services-networking/service/)
2. [Kubernetes Ingress 官方文档 - kubernetes.io](https://kubernetes.io/docs/concepts/services-networking/ingress/)
3. [Kubernetes NetworkPolicy 官方文档 - kubernetes.io](https://kubernetes.io/docs/concepts/services-networking/network-policy/)
