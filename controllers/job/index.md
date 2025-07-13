---
weight: 33
title: Job
date: '2022-05-21T00:00:00+08:00'
type: book
description: Job 是 Kubernetes 中用于批处理任务的控制器，负责管理一次性任务的执行，确保指定数量的 Pod 成功完成后结束。支持并行执行、失败重试和超时控制等特性。
keywords:
- kubernetes
- job
- batch
- 批处理
- 任务调度
- pod 管理
- 控制器
---

Job 是 Kubernetes 中专门用于批处理任务的控制器，负责管理仅执行一次的任务。它确保批处理任务中的一个或多个 Pod 成功完成，并在任务结束后自动清理。

## Job 工作原理

Job 控制器会持续监控 Pod 的状态，直到指定数量的 Pod 成功完成。与长期运行的服务不同，Job 适用于：

- 数据处理和分析任务
- 批量计算作业
- 数据库迁移
- 定期清理任务

## Job 规范配置

### 基本配置项

- **spec.template**: Pod 模板，格式与 Pod 规范相同
- **restartPolicy**: 仅支持 `Never` 或 `OnFailure`
- **spec.completions**: 指定需要成功完成的 Pod 数量，默认为 1
- **spec.parallelism**: 指定并行运行的 Pod 数量，默认为 1
- **spec.backoffLimit**: 指定失败重试次数，默认为 6
- **spec.activeDeadlineSeconds**: 指定 Job 的最大运行时间，超时后终止
- **spec.ttlSecondsAfterFinished**: 指定 Job 完成后的保留时间

### 完整示例

以下是相关的示例代码：

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

创建和查看 Job：

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

### 单次执行模式

- `completions: 1`, `parallelism: 1`
- 适用于单个任务的简单执行

### 并行执行模式

- `completions: N`, `parallelism: M`
- 同时运行 M 个 Pod，直到总共有 N 个 Pod 成功完成

### 工作队列模式

- 不设置 `completions`，设置 `parallelism: N`
- Pod 从共享队列中获取任务，直到队列为空

## 最佳实践

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

Bare Pod 是指直接使用 PodSpec 创建的独立 Pod，不受任何控制器管理。相比之下，Job 具有以下优势：

| 特性 | Bare Pod | Job |
|------|----------|-----|
| 节点故障恢复 | ❌ 不会重新调度 | ✅ 自动创建新 Pod |
| 失败重试 | ❌ 需要手动处理 | ✅ 自动重试机制 |
| 并行执行 | ❌ 需要手动管理 | ✅ 内置并行控制 |
| 完成状态跟踪 | ❌ 需要外部监控 | ✅ 自动状态管理 |

因此，即使应用只需要运行一个 Pod，也推荐使用 Job 而不是 Bare Pod。
