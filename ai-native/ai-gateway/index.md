---
title: AI Gateway
linkTitle: AI Gateway
weight: 3
description: AI Gateway 的作用、架构和在 Kubernetes 中的实现。
date: 2025-10-20T05:19:39.094Z
lastmod: 2026-11-01T00:00:00+08:00
---

> AI Gateway 是连接客户端与 AI 服务的关键桥梁，负责请求路由、负载均衡、安全控制和性能优化。本文系统梳理 AI Gateway 的核心功能、架构设计、Kubernetes 实现方式、高级特性及运维实践，助力构建高效稳定的 AI 原生应用网关。

## 什么是 AI Gateway

AI Gateway 是专为 AI 应用设计的 API 网关，负责管理 AI 服务入口、请求路由、负载均衡、安全控制和性能优化。它在 AI 原生架构中扮演着至关重要的角色，保障服务的高可用与安全性。

### 核心功能

- 请求路由：按模型类型、版本、地理位置等智能分发请求
- 负载均衡：在多个 AI 服务实例间分配流量
- 安全控制：API 密钥验证、速率限制、访问控制
- 性能优化：请求缓存、批处理、数据压缩
- 监控分析：请求跟踪、性能指标、错误处理

## AI Gateway 架构设计

合理的架构设计是实现高性能、高可用 AI Gateway 的基础。

### 典型架构示意

下图展示了 AI Gateway 的典型架构流程：

```text
客户端 → AI Gateway → 模型服务集群
                     ↓
              缓存层/负载均衡器
                     ↓
            AI 推理服务 (vLLM/TensorRT 等)
```

### 主要组件说明

- 入口控制器：处理外部请求，统一入口
- 路由引擎：基于规则进行智能请求分发
- 安全模块：身份验证与授权
- 缓存层：热点模型响应缓存，提升性能
- 监控系统：性能与健康监控，支持告警

## Kubernetes 中的实现方式

在 Kubernetes 环境下，AI Gateway 可通过多种方式实现，满足不同场景需求。

### Gateway API 实现

Kubernetes Gateway API 是实现 AI Gateway 的推荐基础（Ingress 特性已冻结，社区 Ingress NGINX 已于 2026 年 3 月退役）。以下示例把 OpenAI 兼容的聊天补全路径路由到后端服务，并放宽 LLM 场景所需的请求超时。

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: ai-gateway
spec:
  gatewayClassName: ai-gateway-class
  listeners:
  - name: http
    hostname: ai.example.com
    port: 80
    protocol: HTTP
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: chat-route
spec:
  parentRefs:
  - name: ai-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /v1/chat/completions
    backendRefs:
    - name: chat-service
      port: 80
    timeouts:
      request: 300s
```

### Gateway API Inference Extension

对自托管模型，仅按路径路由还不够：多个推理副本的 KV 缓存状态、排队深度与已加载的 LoRA 适配器各不相同，轮询会显著拉高尾延迟。Kubernetes SIG Network 的 [Gateway API Inference Extension](../../service-discovery/gateway-api-inference) 用 `InferencePool`（`inference.networking.k8s.io/v1`，GA）替代 Service 作为 HTTPRoute 的后端，由端点选择器（EPP）依据模型服务器实时指标选择副本：

```yaml
apiVersion: inference.networking.k8s.io/v1
kind: InferencePool
metadata:
  name: qwen3-32b
spec:
  selector:
    matchLabels:
      app: vllm-qwen3-32b
  targetPorts:
  - number: 8000
  endpointPickerRef:
    name: qwen3-32b-epp
    port:
      number: 9002
    failureMode: FailOpen
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: qwen3-route
spec:
  parentRefs:
  - name: ai-gateway
  rules:
  - matches:
    - headers:
      - name: X-Gateway-Model-Name     # 由 Body-Based Router 从请求体 model 字段提取
        value: Qwen/Qwen3-32B
    backendRefs:
    - group: inference.networking.k8s.io
      kind: InferencePool
      name: qwen3-32b
```

Istio、Agentgateway、kgateway、NGINX Gateway Fabric、GKE Inference Gateway 等已通过其一致性测试；它也是 vLLM 与 Kubernetes 社区联合推出的 llm-d 推理栈的默认入口。

## 高级功能与优化

AI Gateway 支持多种高级功能，提升整体性能与安全性。

### 智能路由策略

- 性能路由：优先选择响应快的模型实例
- 负载均衡：避免过载，均衡分配请求
- 地理路由：就近访问，降低延迟

### 请求优化技术

- 批处理：合并小请求为批处理，提升吞吐
- 缓存：缓存常用查询结果，减少重复计算
- 压缩：压缩请求与响应数据，节省带宽

### 安全特性

- API 密钥管理：统一密钥验证
- 速率限制：防止恶意刷请求
- 内容过滤：拦截敏感或非法内容
- 审计日志：记录关键操作，便于追溯

## 集成主流开源方案

结合 Envoy、Istio 等开源组件，可实现更强大的 AI Gateway 能力。

### Envoy 作为 AI Gateway

使用 Envoy 代理实现高性能流量管理与路由。

```yaml
static_resources:
  listeners:
  - address:
      socket_address:
        address: 0.0.0.0
        port_value: 8080
    filter_chains:
    - filters:
      - name: envoy.http_connection_manager
        config:
          route_config:
            routes:
            - match:
                prefix: "/v1/models"
              route:
                cluster: ai-models-cluster
```

### Istio 服务网格集成

将 AI Gateway 集成到 Istio 服务网格，获得更强的流量管理与安全能力。

- 流量管理：支持金丝雀发布、A/B 测试
- 安全加固：mTLS 加密通信
- 可观测性：分布式追踪与性能分析

### 专用 AI Gateway 项目

除通用网关外，一批专门面向 LLM 流量的开源网关在 2025 – 2026 年快速成熟，它们通常同时实现 Gateway API 与 Inference Extension，并补充按 token 计费限流、提示词守卫、多模型提供商统一 API 等能力：

{{< table title="主流开源 AI Gateway 项目" >}}

| 项目 | 基础 | 特点 |
|------|------|------|
| Envoy AI Gateway | Envoy Gateway 扩展 | CNCF Envoy 社区项目，统一 OpenAI/Anthropic/Bedrock 等上游 API，按 token 限流，支持 Inference Extension |
| Agentgateway | Rust 自研数据面（Linux 基金会） | 面向 LLM、MCP、A2A 流量，可作为 Gateway API 与 Inference Gateway 实现，是 kgateway 控制面的 AI 数据面 |
| Higress | Envoy + Istio | 阿里开源，AI 插件生态丰富（Token 限流、缓存、安全护栏），兼容 Gateway API |
| Kong AI Gateway | Kong Gateway 插件 | 多 LLM 供应商路由、提示词模板与守卫、语义缓存 |
| LiteLLM | Python 代理 | 以 OpenAI 格式统一 100+ 模型提供商，常作为应用侧的轻量网关 |

{{< /table >}}

## 监控与运维实践

AI Gateway 的稳定运行离不开完善的监控与运维体系。

### 关键监控指标

- 请求延迟：端到端响应时间
- 吞吐量：每秒处理请求数
- 错误率：失败请求比例
- 资源利用率：CPU/GPU 使用情况

### 日志与追踪

- 结构化日志：详细记录请求与响应
- 分布式追踪：跟踪请求在系统中的完整路径
- 性能分析：定位瓶颈，优化系统

## AI Gateway 最佳实践

结合实际运维经验，建议遵循如下网关部署与管理策略：

- 水平扩展：根据负载自动扩缩 AI Gateway 实例
- 缓存策略：合理配置缓存，提升响应速度
- 安全加固：实施多层安全防护，防止攻击
- 监控告警：设置关键指标告警，及时响应异常

## 总结

AI Gateway 是连接客户端与 AI 服务的核心枢纽，通过智能路由、负载均衡和安全控制，保障 AI 应用的稳定高效运行。在 Kubernetes 中，应以 Gateway API 为基础，对自托管模型叠加 Inference Extension 的模型感知路由，再按需选用 Envoy AI Gateway、Agentgateway、Higress 等专用网关补齐 token 限流与提示词安全等能力。

## 参考文献

1. [Kubernetes Gateway API 官方文档 - kubernetes.io](https://kubernetes.io/docs/concepts/services-networking/gateway-api/)
2. [Envoy 官方文档 - envoyproxy.io](https://www.envoyproxy.io/docs/)
3. [Istio 服务网格文档 - istio.io](https://istio.io/latest/docs/)
4. [Gateway API Inference Extension - gateway-api-inference-extension.sigs.k8s.io](https://gateway-api-inference-extension.sigs.k8s.io/)
5. [Envoy AI Gateway - aigateway.envoyproxy.io](https://aigateway.envoyproxy.io/)
6. [Agentgateway - agentgateway.dev](https://agentgateway.dev/)
