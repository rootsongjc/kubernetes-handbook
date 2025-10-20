---
title: vLLM 在 Kubernetes 中的实践
linkTitle: vLLM 实践
weight: 5
description: vLLM 推理引擎在 Kubernetes 中的部署、配置和优化指南。
date: 2025-10-20T05:20:22.064Z
lastmod: 2025-10-20T05:37:01.371Z
---

> vLLM 是高性能大语言模型推理引擎，结合 Kubernetes 编排能力，可实现高效、弹性、可观测的 AI 推理服务。本文系统梳理 vLLM 在 K8s 环境下的部署架构、配置优化、服务暴露、监控扩缩容及最佳实践，助力构建可扩展的 LLM 推理平台。

## vLLM 简介

vLLM 是专为大语言模型推理场景设计的高性能库，支持 PagedAttention、连续批处理、量化等多项优化技术，兼容 OpenAI API，具备分布式扩展能力和智能资源管理。

### 核心特性

- 高吞吐量：连续批处理与优化注意力机制
- 低延迟：高效内存管理与计算优化
- 易用性：兼容 OpenAI API
- 可扩展性：支持分布式推理
- 资源效率：智能内存管理，降低 GPU 占用

## Kubernetes 部署架构

在 Kubernetes 中部署 vLLM 可实现弹性扩缩容与高可用，支持单节点和多 GPU 分布式场景。

### 单节点部署

适用于小规模推理服务，配置简单，便于快速上线。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: vllm
  template:
    metadata:
      labels:
        app: vllm
    spec:
      containers:
      - name: vllm
        image: vllm/vllm-openai:latest
        command:
        - python
        - -m
        - vllm.entrypoints.openai.api_server
        args:
        - --model
        - meta-llama/Llama-2-7b-chat-hf
        - --tensor-parallel-size
        - "1"
        - --host
        - "0.0.0.0"
        - --port
        - "8000"
        ports:
        - containerPort: 8000
        resources:
          limits:
            nvidia.com/gpu: 1
            memory: 16Gi
            cpu: 4
          requests:
            nvidia.com/gpu: 1
            memory: 16Gi
            cpu: 4
        env:
        - name: HUGGING_FACE_HUB_TOKEN
          valueFrom:
            secretKeyRef:
              name: hf-token
              key: token
```

### 多 GPU 分布式部署

结合 Ray 等分布式框架，提升推理吞吐与模型规模。

```yaml
args:
- --model
- meta-llama/Llama-2-13b-chat-hf
- --tensor-parallel-size
- "2"
- --pipeline-parallel-size
- "1"
- --host
- "0.0.0.0"
- --port
- "8000"
resources:
  limits:
    nvidia.com/gpu: 2
  requests:
    nvidia.com/gpu: 2
```

## 配置优化

合理配置 vLLM 参数可显著提升性能与资源利用率。

### 内存优化

- 使用 8-bit 量化减少显存占用：`--quantization awq`
- 限制 KV 缓存大小：`--max-num-seqs 128`
- 启用 CPU 内存卸载：`--cpu-offload-gb 8`

### 性能调优

- 启用连续批处理：`--enable-chunked-prefill true`
- 设置最大并发请求数：`--max-num-batched-tokens 4096`
- 配置块大小：`--block-size 16`

### 量化配置

- 4-bit 量化：`--quantization gptq`
- 指定量化参数文件：`--quantization-param-path quant_config.json`

## 服务暴露与访问

Kubernetes 支持多种服务暴露方式，便于集群内外访问 vLLM 推理接口。

### Service 配置

通过 ClusterIP 服务实现集群内访问。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: vllm-service
spec:
  selector:
    app: vllm
  ports:
  - name: http
    port: 80
    targetPort: 8000
  type: ClusterIP
```

### Ingress 配置

通过 Ingress 实现域名访问和外部流量入口。

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: vllm-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: vllm.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: vllm-service
            port:
              number: 80
```

## 监控与可观测性

vLLM 支持 Prometheus 指标，便于集群监控与性能分析。

### 关键指标说明

- 推理请求延迟：`vllm:request_latency_seconds`
- GPU 利用率：`vllm:gpu_utilization`
- 显存使用量：`vllm:gpu_memory_used_bytes`
- 请求队列长度：`vllm:queue_size`

### 集成 Prometheus

通过 ConfigMap 配置 Prometheus 自动抓取 vLLM 指标。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    scrape_configs:
    - job_name: 'vllm'
      static_configs:
      - targets: ['vllm-service:8000']
```

## 自动扩缩容

结合 HPA 实现 vLLM 服务的弹性伸缩，提升资源利用率。

### HPA 配置示例

根据队列长度等外部指标自动扩容。

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: vllm-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: vllm-deployment
  minReplicas: 1
  maxReplicas: 5
  metrics:
  - type: External
    external:
      metric:
        name: vllm_queue_size
        selector:
          matchLabels:
            app: vllm
      target:
        type: Value
        value: "10"
```

## 运维与最佳实践

为保障 vLLM 服务稳定高效，建议结合以下运维策略。

### 模型预热

通过 Pod 生命周期钩子预热模型，减少首次请求延迟。

```yaml
lifecycle:
  postStart:
    exec:
      command:
      - python
      - -c
      - |
        import requests
        import time
        time.sleep(10)
        requests.post('http://localhost:8000/v1/chat/completions',
                     json={
                       "model": "llama2",
                       "messages": [{"role": "user", "content": "Hello"}],
                       "max_tokens": 10
                     })
```

### 健康检查配置

合理设置 readiness/liveness probe，提升服务可用性。

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5

livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 60
  periodSeconds: 30
  timeoutSeconds: 10
```

### 安全与限流

- 设置 API 密钥：`--api-key ${API_KEY}`
- 限制并发请求数：`--max-concurrent-requests 100`

## 故障排除与调试

常见问题及排查建议：

- 内存不足：减少 batch size 或启用量化
- 启动失败：检查 GPU 分配与模型路径
- 性能瓶颈：调整 tensor 并行度与优化参数
- 网络异常：检查资源限制与服务发现配置

调试技巧：

```bash
# 查看 vLLM 日志
kubectl logs -f deployment/vllm-deployment

# 检查 GPU 状态
kubectl exec -it pod/vllm-pod -- nvidia-smi

# 测试 API
kubectl port-forward svc/vllm-service 8000:80
curl http://localhost:8000/v1/models
```

## 总结

vLLM 是在 Kubernetes 环境下部署大语言模型推理服务的高效方案。通过合理配置与优化，结合 K8s 的编排、监控和弹性扩缩容能力，可构建高性能、可扩展的 AI 推理平台，满足多样化业务需求。

## 参考文献

1. [vLLM 官方文档 - vllm.ai](https://docs.vllm.ai/)
2. [Kubernetes 官方文档 - kubernetes.io](https://kubernetes.io/docs/)
3. [Ray 项目文档 - ray.io](https://docs.ray.io/)
4. [Prometheus 官方文档 - prometheus.io](https://prometheus.io/docs/)
5. [HPA 自动扩缩容 - kubernetes.io](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
