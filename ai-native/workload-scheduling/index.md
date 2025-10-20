---
title: AI 工作负载调度
linkTitle: AI 工作负载调度
weight: 7
description: Kubernetes 中 AI 工作负载的调度策略和优化技术。
date: 2025-10-20T05:20:29.038Z
lastmod: 2025-10-20T05:21:59.951Z
---

> AI 工作负载调度是提升 Kubernetes 集群资源利用率和 AI 应用性能的关键环节。本文系统梳理了 AI 任务的资源特性、调度策略、资源配额、队列管理及最佳实践，帮助读者构建高效的 AI 工作负载调度体系。

## AI 工作负载的特点

AI 工作负载在 Kubernetes 集群中具有如下典型特性：

- 计算密集：需要大量 GPU/TPU 等加速资源
- 内存密集：模型参数和数据占用大量内存
- 网络敏感：分布式训练依赖高速网络互联
- 时变性：训练与推理负载模式差异明显

这些特性决定了 AI 任务在调度时需综合考虑资源类型、拓扑结构和任务优先级。

## 调度策略

合理的调度策略能够显著提升 AI 工作负载的资源利用率和执行效率。以下介绍常见的调度方式及其配置方法。

### GPU 亲和性调度

通过节点亲和性确保 AI Pod 被调度到具备指定 GPU 类型的节点上。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: gpu-type
            operator: In
            values:
            - A100
            - H100
  containers:
  - name: ai-container
    resources:
      limits:
        nvidia.com/gpu: 2
      requests:
        nvidia.com/gpu: 2
```

### 拓扑感知调度

分布式训练任务常常需要考虑网络拓扑，利用拓扑约束提升任务间通信效率。

```yaml
spec:
  topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: ai-workload
```

### 优先级调度

通过 PriorityClass 设置任务优先级，保障关键 AI 任务优先获得资源。

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: ai-high-priority
value: 1000000
globalDefault: false
description: "High priority for AI workloads"
---
apiVersion: v1
kind: Pod
metadata:
  name: ai-training-pod
spec:
  priorityClassName: ai-high-priority
  containers:
  - name: training
    image: ai/training:latest
```

## 资源预留与配额管理

为保障 AI 任务的稳定运行，需合理配置资源预留和配额。

### ResourceQuota 配置

通过 ResourceQuota 限制命名空间内的 GPU、CPU、内存等资源总量。

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ai-quota
spec:
  hard:
    requests.nvidia.com/gpu: "8"
    limits.nvidia.com/gpu: "8"
    requests.memory: 128Gi
    requests.cpu: "32"
```

### LimitRange 配置

使用 LimitRange 设置单个容器的默认资源请求和限制，防止资源超分配。

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: ai-limits
spec:
  limits:
  - type: Container
    default:
      cpu: "4"
      memory: 8Gi
      nvidia.com/gpu: "1"
    defaultRequest:
      cpu: "2"
      memory: 4Gi
      nvidia.com/gpu: "1"
```

## 高级调度器与插件

针对 AI/ML 任务的复杂调度需求，Kubernetes 支持调度器扩展和第三方调度器。

### KubeScheduler 扩展插件

通过自定义调度器插件实现资源感知和 GPU 优先调度。

```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
profiles:
- schedulerName: ai-scheduler
  plugins:
    score:
      enabled:
      - name: NodeResourcesFit
        weight: 1
      - name: GPUAffinity
        weight: 2
```

### Volcano 调度器

Volcano 是专为 AI/ML 设计的批量调度器，支持队列、PodGroup、资源池等高级功能。

```yaml
apiVersion: scheduling.volcano.sh/v1beta1
kind: Queue
metadata:
  name: ai-queue
spec:
  weight: 1
  capability:
    cpu: "100"
    memory: "200Gi"
    nvidia.com/gpu: "16"
---
apiVersion: scheduling.volcano.sh/v1beta1
kind: PodGroup
metadata:
  name: ai-job-group
spec:
  queue: ai-queue
  minMember: 4
  minResources:
    cpu: "16"
    memory: "64Gi"
    nvidia.com/gpu: "4"
```

## 批处理与队列管理

AI 训练和推理任务常采用批处理和队列机制，提升资源利用率和任务调度灵活性。

### Job 队列

通过 Kubernetes Job 控制任务并发度和完成数，适合批量训练场景。

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: ai-training-job
spec:
  parallelism: 2
  completions: 1
  template:
    spec:
      containers:
      - name: training
        image: ai/training:latest
        resources:
          requests:
            nvidia.com/gpu: 1
      restartPolicy: Never
```

### CronJob 定时任务

定时触发训练或推理任务，适用于周期性 AI 任务。

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-training
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: training
            image: ai/training:latest
          restartPolicy: OnFailure
```

## 动态调度与自动扩缩容

为应对 AI 负载的动态变化，可结合自动扩缩容机制实现资源弹性供给。

### 集群自动扩缩容

通过 HPA（HorizontalPodAutoscaler）根据 GPU 利用率自动调整副本数。

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gpu-node-autoscaler
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-workload
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: nvidia.com/gpu
      target:
        type: Utilization
        averageUtilization: 80
```

## AI 工作负载调度最佳实践

在实际生产环境中，建议遵循以下调度与资源管理策略：

- 资源隔离：为 AI 工作负载创建专用节点池，避免与通用业务混用
- 优先级管理：合理设置任务优先级，保障关键任务资源分配
- 预留策略：预留关键资源，确保重要任务及时执行
- 监控调优：持续监控调度效率，结合指标优化配置

## 总结

AI 工作负载调度需综合考虑计算资源、网络拓扑、任务优先级和资源弹性。通过合理配置调度策略、资源配额和队列机制，结合高级调度器与自动扩缩容技术，可显著提升 AI 应用的性能和集群资源利用率。

## 参考文献

1. [Kubernetes 官方文档 - kubernetes.io](https://kubernetes.io/docs/)
2. [Volcano 项目文档 - volcano.sh](https://volcano.sh/)
3. [Kubernetes GPU 支持 - kubernetes.io](https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/)
4. [Kubernetes 批处理任务 - kubernetes.io](https://kubernetes.io/docs/concepts/workloads/controllers/job/)
