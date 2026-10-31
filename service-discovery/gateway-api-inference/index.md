---
title: Gateway API 推理扩展
linkTitle: Gateway API 推理扩展
weight: 43
slug: gateway-api-inference
date: 2025-10-20T05:19:44.956Z
description: 系统介绍 Kubernetes Gateway API Inference Extension 的架构与核心组件、关键资源与请求处理流程，并解析推理调度算法与 AI 流量管理最佳实践。
lastmod: 2025-10-27T18:14:39.810Z
---

> Gateway API Inference Extension 为 Kubernetes AI/ML 推理工作负载提供了标准化、声明式的流量管理和智能路由能力，极大提升了模型服务的可扩展性与可维护性。

## 引言

本文系统介绍了 Kubernetes Gateway API Inference Extension 的架构、核心组件、关键资源、请求处理流程、调度算法及最佳实践，帮助读者全面理解其在 AI 推理场景下的应用价值。

## 什么是 Gateway API Inference Extension

Gateway API Inference Extension 是 Kubernetes Gateway API 的一个扩展，专为 AI/ML 推理工作负载设计。它提供标准化 API，便于管理 AI 模型服务的路由、负载均衡和流量控制。

### 核心特性

- 模型路由：基于模型名称、版本等进行路由
- 负载均衡：AI 推理服务的智能负载均衡
- 流量分割：支持金丝雀发布和 A/B 测试
- 服务发现：自动发现和注册 AI 服务
- 安全控制：API 密钥管理和访问控制

## 架构概述

下图展示了 Gateway API Inference Extension 的整体架构：

![Gateway API Inference Extension 系统架构总览](inference-extension-architecture.svg)

### 组件说明

- Gateway：入口网关，处理外部请求
- InferencePool：推理服务池，管理多个模型服务
- InferenceExtension：推理扩展，提供 AI 特定功能
- Model Servers：实际的模型推理服务

## 核心组件详解

Gateway API Inference Extension 由四个主要组件协同工作，提供智能推理路由能力。

### Gateway

Gateway 是支持 Gateway API 且实现 ext-proc 的 Kubernetes 代理。常见实现包括 GKE Gateway、Istio、Kgateway 和 Agentgateway。Gateway 负责 L4-L7 路由，并通过 gRPC 流与扩展组件集成。

### Body-Based Router (BBR)

BBR 是可选 ext-proc 服务器，从 OpenAI 格式请求体中提取 `model` 字段，并注入 `X-Gateway-Model-Name` 头部，便于 HTTPRoute 按模型名称路由。

### Endpoint Picker Proxy (EPP)

EPP 是核心智能组件，实现调度和路由逻辑。其主要子模块包括：

- StreamingServer：处理 Envoy 的双向 gRPC 协议
- Director：协调请求生命周期和插件执行
- Scheduler：执行 Filter → Score → Pick 流水线
- Datastore：缓存 Kubernetes 资源和 Pod 指标
- Controllers：协调 InferencePool、InferenceObjective 和 Pod 资源

### Model Servers

后端 Pod 运行推理服务器（如 vLLM、Triton、SGLang），需实现协议以公开调度决策指标。

## 核心 Kubernetes 资源

下表总结了扩展引入的自定义 Kubernetes 资源及其作用：

{{< table title="Inference Extension 关键资源一览" >}}

| 资源 | API 版本 | 目的 |
| --- | --- | --- |
| InferencePool | inference.networking.k8s.io/v1 | 定义模型服务器 Pod 池并引用 EPP 服务进行端点选择 |
| InferenceObjective | inference.networking.x-k8s.io/v1alpha2 | 为模型指定请求优先级和路由策略 |
| Gateway | gateway.networking.k8s.io/v1 | 标准 Gateway API 资源，通过 EPP 集成扩展 |
| HTTPRoute | gateway.networking.k8s.io/v1 | 将流量路由到 InferencePool 后端而非标准 Service |

{{< /table >}}

下图展示了资源之间的关系：

![Inference Extension 的 Kubernetes 资源关系](inference-resource-relations.svg)

## 请求处理流程

推理请求的处理流程分为两段：下图先展示网关、BBR 与 EPP 之间的 ext-proc 交互。

![推理请求处理时序（一）：网关、BBR 与 EPP](inference-request-sequence-gateway.svg)

EPP 收到请求后，内部由 StreamingServer、Director、Scheduler 与 Datastore 协作完成饱和检测与调度：

![推理请求处理时序（二）：EPP 内部的饱和检测与调度](inference-request-sequence-epp.svg)

**关键阶段说明：**

1. Body Parsing：BBR 从请求体提取模型名称
2. Route Matching：Gateway 根据头部匹配 HTTPRoute
3. Endpoint Selection：EPP Director 协调 Scheduler 选择最佳 Pod
4. Saturation Detection：检查系统是否过载
5. Scheduling：三阶段调度选择最佳 Pod

## 关键概念和术语

- **Inference Gateway (IGW)**：与 Endpoint Picker 耦合的代理/负载均衡器，基于实时指标智能路由。
- **Endpoint Picker Extension (EPP)**：推理调度器实现，扩展 Envoy 以注入路由决策。
- **指标和能力**：如队列深度、KV 缓存利用率、前缀缓存、LoRA 适配器等。
- **饱和检测**：EPP 监控系统负载，丢弃低优先级请求，相关阈值可配置。

## EPP 内部组件

下图展示了 EPP 应用的主要子系统及其关系：

![EPP 内部组件结构](epp-internal-components.svg)

**主要职责：**

- Runner：初始化和启动所有子系统
- StreamingServer：实现 Envoy 双向流协议
- Director：协调请求生命周期和插件执行
- Scheduler：执行调度流水线
- Datastore：缓存 Kubernetes 资源
- Controllers：同步 CRD 到数据存储
- Plugins：可扩展评分和选择策略

## 调度算法

EPP 采用三阶段调度算法，受 Kubernetes 调度器启发：

![EPP 三阶段调度算法流程](inference-scheduling-pipeline.svg)

**评分权重说明：**

- KV 缓存：利用率越低分数越高
- 队列深度：请求越少分数越高
- LoRA 亲和：已加载适配器分数高
- 前缀缓存：命中前缀分数高

## 支持的平台

### Gateway 提供商

{{< table title="主流 Gateway 提供商支持情况" >}}

| 提供商 | 状态 | 备注 |
| --- | --- | --- |
| GKE Gateway | 稳定 | 原生 Google Cloud 集成，支持 HealthCheckPolicy |
| Istio | 实验性 | 需 Istio 1.28-dev+，启用 ENABLE_GATEWAY_API_INFERENCE_EXTENSION |
| Kgateway | 技术预览 | v2.1.0+ 滚动发布支持 |
| Agentgateway | 技术预览 | Kgateway 控制平面 AI 优化代理 |

{{< /table >}}

### 模型服务器

{{< table title="主流模型服务器支持情况" >}}

| 服务器 | 支持级别 | 协议合规性 |
| --- | --- | --- |
| vLLM | 增强 | 与 llm-d 集成的完整协议支持 |
| Triton Inference Server | 支持 | 需协议合规指标 |
| SGLang | 支持 | 需协议合规指标 |

{{< /table >}}

## 安装与配置

### 安装 Gateway API

以下命令用于安装 Gateway API 及 Inference Extension：

```bash
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.0.0/gateway-api.yaml
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api-inference-extension/releases/download/v0.1.0/inference-extension.yaml
```

### 创建 InferencePool

以下 YAML 示例定义了一个 InferencePool：

```yaml
apiVersion: inference.networking.x-k8s.io/v1alpha1
kind: InferencePool
metadata:
  name: llama-pool
spec:
  selector:
    matchLabels:
      app: llama-model
  targetPortNumber: 8000
  endpointPicker:
    type: Random
```

### 配置 Gateway

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: ai-gateway
  annotations:
    inference.networking.x-k8s.io/enabled: "true"
spec:
  gatewayClassName: inference-gateway
  listeners:
  - name: http
    hostname: ai.example.com
    port: 80
    protocol: HTTP
```

### 创建 InferenceRoute

```yaml
apiVersion: inference.networking.x-k8s.io/v1alpha1
kind: InferenceRoute
metadata:
  name: chat-route
spec:
  parentRefs:
  - name: ai-gateway
  rules:
  - matches:
    - method: POST
      path:
        type: PathPrefix
        value: /v1/chat/completions
    backendRefs:
    - kind: InferencePool
      name: llama-pool
      weight: 100
```

## 高级路由功能

### 模型版本路由

通过 headers 匹配实现模型版本路由：

```yaml
apiVersion: inference.networking.x-k8s.io/v1alpha1
kind: InferenceRoute
metadata:
  name: versioned-route
spec:
  rules:
  - matches:
    - headers:
      - name: x-model-version
        value: v2
    backendRefs:
    - kind: InferencePool
      name: llama-v2-pool
      weight: 100
  - matches:
    - headers:
      - name: x-model-version
        value: v1
    backendRefs:
    - kind: InferencePool
      name: llama-v1-pool
      weight: 100
```

### 流量分割

```yaml
spec:
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /v1/chat/completions
    backendRefs:
    - kind: InferencePool
      name: llama-v2-pool
      weight: 90
    - kind: InferencePool
      name: llama-v1-pool
      weight: 10
```

### 地理位置路由

```yaml
apiVersion: inference.networking.x-k8s.io/v1alpha1
kind: InferenceRoute
metadata:
  name: geo-route
spec:
  rules:
  - matches:
    - headers:
      - name: x-region
        value: us-west
    backendRefs:
    - kind: InferencePool
      name: us-west-pool
  - matches:
    - headers:
      - name: x-region
        value: eu-central
    backendRefs:
    - kind: InferencePool
      name: eu-central-pool
```

## 负载均衡策略

### 轮询负载均衡

```yaml
apiVersion: inference.networking.x-k8s.io/v1alpha1
kind: InferencePool
metadata:
  name: round-robin-pool
spec:
  endpointPicker:
    type: RoundRobin
```

### 最小连接数

```yaml
spec:
  endpointPicker:
    type: LeastConnections
```

### 基于权重的负载均衡

```yaml
spec:
  endpointPicker:
    type: WeightedRoundRobin
    weights:
      endpoint-1: 70
      endpoint-2: 30
```

## 安全与访问控制

### API 密钥验证

```yaml
apiVersion: inference.networking.x-k8s.io/v1alpha1
kind: InferenceRoute
metadata:
  name: secured-route
  annotations:
    inference.networking.x-k8s.io/auth-type: api-key
spec:
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /v1/chat/completions
    filters:
    - type: RequestHeaderModifier
      requestHeaderModifier:
        add:
        - name: Authorization
          value: Bearer ${API_KEY}
```

### 速率限制

```yaml
filters:
- type: RateLimit
  rateLimit:
    requestsPerUnit: 100
    unit: Minute
    burst: 20
```

## 监控与可观测性

Inference Extension 自动收集请求延迟、吞吐量、错误率、推理池健康状态等指标。

### 集成 Prometheus

以下为 Prometheus 集成配置示例：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: inference-gateway-config
data:
  gateway-config.yaml: |
    apiVersion: gateway.networking.k8s.io/v1
    kind: Gateway
    metadata:
      name: ai-gateway
      annotations:
        inference.networking.x-k8s.io/metrics-enabled: "true"
        inference.networking.x-k8s.io/prometheus-port: "9090"
```

## 最佳实践

- 多副本部署，确保高可用
- 配置健康检查与自动故障转移
- 优化连接池与缓存策略，提升性能
- 启用 TLS 加密与细粒度访问控制
- 开启审计日志，便于安全追踪

## 故障排除

常见问题及调试命令：

- 路由不生效：检查 InferenceRoute 配置和标签选择器
- 负载不均衡：验证 endpoint picker 配置
- 性能问题：检查资源限制和网络配置

```bash
kubectl get inferencepool
kubectl describe inferenceroute chat-route
kubectl logs -l app=gateway-api-controller
```

## 快速开始

1. 部署模型服务器（GPU/CPU/模拟器）
2. 安装 CRDs
3. 安装 InferencePool + EPP
4. 部署 Gateway
5. 发送推理请求

```bash
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api-inference-extension/releases/latest/download/manifests.yaml
helm install vllm-llama3-8b-instruct oci://registry.k8s.io/gateway-api-inference-extension/charts/inferencepool
curl ${IP}:${PORT}/v1/completions -d '{"model": "...", "prompt": "..."}'
```

## 项目状态

该项目目前处于 alpha 阶段，API 及功能可能有重大变更。最新版本特性包括：

- InferencePool v1 API（稳定）
- InferenceObjective v1alpha2 API（Alpha）
- 生产级 EPP 可插拔调度框架
- GKE Gateway 稳定支持
- Istio、Kgateway、Agentgateway 实验性支持

## 总结

Gateway API Inference Extension 为 AI 推理服务带来了声明式、可扩展的流量管理与智能调度能力。通过标准化的 Kubernetes 资源和灵活的路由策略，极大提升了 AI 服务的可维护性与可观测性，是构建现代 AI 平台的重要基础设施组件。

## 参考

- [Gateway API Inference Extension](https://gateway-api-inference-extension.sigs.k8s.io/)
