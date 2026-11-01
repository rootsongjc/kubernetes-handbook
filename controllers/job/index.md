---
weight: 33
title: Job
date: 2022-05-21T00:00:00+08:00
description: Job 是 Kubernetes 中用于批处理任务的控制器，负责管理一次性任务的执行，确保指定数量的 Pod 成功完成后结束。支持并行执行、失败重试和超时控制等特性。
lastmod: 2026-11-01T00:00:00+08:00
---

> Job 控制器让 Kubernetes 能够可靠地管理一次性批处理任务，自动完成调度、重试和清理，是实现自动化批量计算和数据处理的基础能力。

Job 是 Kubernetes 中专门用于批处理任务的控制器，负责管理仅执行一次的任务。它确保批处理任务中的一个或多个 Pod 成功完成，并在任务结束后自动清理。

## Job 工作原理

Job 控制器会持续监控 Pod 的状态，直到指定数量的 Pod 成功完成。与长期运行的服务不同，Job 适用于以下场景：

- 数据处理和分析任务
- 批量计算作业
- 数据库迁移
- 定期清理任务

## Job 规范配置

在实际使用中，合理配置 Job 资源对于任务的可靠性和资源利用率至关重要。

### 基本配置项

- **spec.template**：Pod 模板，格式与 Pod 规范相同
- **restartPolicy**：仅支持 `Never` 或 `OnFailure`
- **spec.completions**：指定需要成功完成的 Pod 数量，默认为 1
- **spec.parallelism**：指定并行运行的 Pod 数量，默认为 1
- **spec.backoffLimit**：指定失败重试次数，默认为 6
- **spec.activeDeadlineSeconds**：指定 Job 的最大运行时间，超时后终止
- **spec.ttlSecondsAfterFinished**：指定 Job 完成后的保留时间
- **spec.completionMode**：`NonIndexed`（默认）或 `Indexed`，后者为每个 Pod 分配 0 到 `completions-1` 的索引
- **spec.suspend**：设为 `true` 可暂停 Job（不再创建新 Pod 并删除运行中的 Pod），是 Kueue 等排队系统控制 Job 启动时机的基础
- **spec.podFailurePolicy**：按容器退出码或 Pod 条件决定失败时是重试、忽略还是直接判定 Job 失败
- **spec.successPolicy**：对 Indexed Job 声明"部分索引成功即视为整个 Job 成功"的规则
- **spec.backoffLimitPerIndex**：为 Indexed Job 的每个索引单独设置重试上限

### 完整示例

以下 YAML 示例展示了一个典型 Job 的配置方式：

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: pi-calculation
  labels:
    app: pi-job
spec:
  completions: 3
  parallelism: 2
  backoffLimit: 4
  ttlSecondsAfterFinished: 300
  template:
    metadata:
      labels:
        app: pi-job
    spec:
      containers:
      - name: pi
        image: perl:5.34
        command: ["perl", "-Mbignum=bpi", "-wle", "print bpi(2000)"]
        resources:
          limits:
            cpu: 100m
            memory: 128Mi
          requests:
            cpu: 50m
            memory: 64Mi
      restartPolicy: Never
```

创建和查看 Job 的常用命令如下：

```bash
# 创建 Job
kubectl apply -f pi-job.yaml

# 查看 Job 状态
kubectl get jobs

# 查看 Pod 状态
kubectl get pods -l app=pi-job

# 查看日志
kubectl logs -l app=pi-job
```

## Job 执行模式

Kubernetes Job 支持多种执行模式，满足不同批处理需求。

### 单次执行模式

- `completions: 1`, `parallelism: 1`
- 适用于单个任务的简单执行

### 并行执行模式

- `completions: N`, `parallelism: M`
- 同时运行 M 个 Pod，直到总共有 N 个 Pod 成功完成

### 工作队列模式

- 不设置 `completions`，设置 `parallelism: N`
- Pod 从共享队列中获取任务，直到队列为空

### 索引模式

- `completionMode: Indexed`，`completions: N`
- 每个 Pod 通过 `JOB_COMPLETION_INDEX` 环境变量与 `batch.kubernetes.io/job-completion-index` 注解获知自己的索引
- 配合无头 Service 可得到稳定的 Pod 主机名 `<job>-<index>`，适合分布式训练、数据分片处理等需要确定性身份的任务

以下示例展示了一个带失败策略的 Indexed Job：

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: shard-processor
spec:
  completions: 8
  parallelism: 4
  completionMode: Indexed
  backoffLimitPerIndex: 2
  maxFailedIndexes: 1
  podFailurePolicy:
    rules:
    - action: FailJob            # 配置错误直接失败，不浪费重试
      onExitCodes:
        containerName: worker
        operator: In
        values: [42]
    - action: Ignore             # 被抢占/驱逐不计入重试次数
      onPodConditions:
      - type: DisruptionTarget
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: worker
        image: my-shard-processor:1.0
        command: ["sh", "-c", "process --shard=$JOB_COMPLETION_INDEX"]
```

Indexed Job、失败/成功策略以及 JobSet、Kueue 等批处理生态的深入内容见 [Job 高级特性与批处理生态](../job-advanced)。

## 最佳实践

在生产环境中，建议遵循以下最佳实践以提升 Job 的可靠性和可维护性。

### 资源管理

- 为 Job Pod 设置资源限制和请求
- 使用 `ttlSecondsAfterFinished` 自动清理完成的 Job
- 合理设置 `backoffLimit` 避免无限重试

### 错误处理

- 选择合适的 `restartPolicy`
- 设置 `activeDeadlineSeconds` 避免任务无限运行
- 在应用代码中实现幂等性

### 监控和日志

- 使用标签选择器管理相关 Pod
- 配置日志收集确保任务输出可追溯
- 监控 Job 的完成状态和执行时间

## 与 Bare Pod 的对比

下表对比了 Bare Pod（裸 Pod）与 Job 控制器的主要区别，帮助理解为何推荐使用 Job 管理一次性任务。

{{< table title="Bare Pod 与 Job 控制器对比" >}}

| 特性           | Bare Pod             | Job                      |
|----------------|---------------------|--------------------------|
| 节点故障恢复   | ❌ 不会重新调度      | ✅ 自动创建新 Pod         |
| 失败重试       | ❌ 需要手动处理      | ✅ 自动重试机制           |
| 并行执行       | ❌ 需要手动管理      | ✅ 内置并行控制           |
| 完成状态跟踪   | ❌ 需要外部监控      | ✅ 自动状态管理           |

{{< /table >}}

因此，即使应用只需要运行一个 Pod，也推荐使用 Job 而不是 Bare Pod。

## 总结

Job 控制器为 Kubernetes 提供了强大的批处理能力，支持任务的自动调度、重试、并行和清理。通过合理配置和最佳实践，可以显著提升批处理任务的可靠性和资源利用率。建议在所有一次性任务场景下优先使用 Job 控制器，避免直接使用 Bare Pod。

## 参考文献

- [Job 官方文档 - kubernetes.io](https://kubernetes.io/docs/concepts/workloads/controllers/job/)
- [Kubernetes Patterns: Job - kubernetes.io](https://kubernetes.io/docs/concepts/workloads/controllers/job/#job-patterns)
