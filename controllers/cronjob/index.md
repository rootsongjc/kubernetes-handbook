---
weight: 34
title: CronJob
date: 2022-05-21T00:00:00+08:00
description: CronJob 是 Kubernetes 中用于管理基于时间调度的 Job 资源，支持一次性和周期性任务执行，类似于 Linux 系统中的 crontab 功能。
lastmod: 2025-10-27T15:54:06.305Z
---

> CronJob 机制让 Kubernetes 能够原生支持定时任务编排，实现自动化运维、数据备份等周期性作业的高效管理。

CronJob 管理基于时间的 [Job](https://kubernetes.io/docs/concepts/workloads/controllers/job/)，即可以在给定时间点只运行一次，也可以周期性地在给定时间点运行。一个 CronJob 对象类似于 *crontab*（cron table）文件中的一行。它根据指定的预定计划周期性地运行一个 Job，格式可以参考 [Cron](https://en.wikipedia.org/wiki/Cron)。

## 前提条件

CronJob 自 Kubernetes v1.21 起已成为稳定版本（`batch/v1`），在所有受支持的 Kubernetes 版本中均可直接使用。

## 典型用例

CronJob 适用于多种自动化场景，常见用例如下：

- 在指定时间点运行一次性任务
- 创建周期性运行的任务，例如数据库备份、发送报告邮件、清理临时文件、健康检查等

## CronJob 规格说明

CronJob 资源定义包含必需字段和可选字段，合理配置可满足不同调度需求。

### 必需字段

- **`.spec.schedule`**：调度配置，指定任务运行周期，格式遵循 [Cron](https://en.wikipedia.org/wiki/Cron) 语法
- **`.spec.jobTemplate`**：Job 模板，指定需要运行的任务，格式同 [Job](../job)

### 可选字段

- **`.spec.startingDeadlineSeconds`**：启动 Job 的期限（秒）。如果因任何原因错过调度时间，超过此期限的 Job 将被视为失败。未指定则无期限限制
- **`.spec.concurrencyPolicy`**：并发策略，指定如何处理 CronJob 创建的 Job 的并发执行：
  - `Allow`（默认）：允许并发运行 Job
  - `Forbid`：禁止并发运行，如果前一个未完成，则跳过下一个
  - `Replace`：取消当前运行的 Job，用新的替换

{{< callout note "注意" >}}
并发策略仅适用于同一个 CronJob 创建的 Job。不同 CronJob 之间创建的 Job 总是允许并发运行。
{{< /callout >}}

- **`.spec.suspend`**：挂起标志，设置为 `true` 时，后续所有执行都会被挂起。对已开始执行的 Job 不起作用。默认值为 `false`
- **`.spec.successfulJobsHistoryLimit`** 和 **`.spec.failedJobsHistoryLimit`**：历史记录限制，指定保留多少个完成和失败的 Job。默认值分别为 `3` 和 `1`，设置为 `0` 表示完成后不保留相关类型的 Job

## 创建 CronJob

可以通过 YAML 文件或 kubectl 命令创建 CronJob 资源。

### 使用 YAML 文件

以下是 CronJob 的 YAML 配置示例：

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: hello
spec:
  schedule: "*/1 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: hello
            image: busybox:1.35
            args:
            - /bin/sh
            - -c
            - date; echo Hello from the Kubernetes cluster
          restartPolicy: OnFailure
```

```bash
kubectl apply -f cronjob.yaml
```

### 使用 kubectl 命令

也可以直接通过命令行创建 CronJob：

```bash
kubectl create cronjob hello --schedule="*/1 * * * *" --image=busybox:1.35 -- /bin/sh -c "date; echo Hello from the Kubernetes cluster"
```

## 管理 CronJob

日常运维中，需关注 CronJob 的状态、相关 Job 和 Pod 的执行情况。

### 查看 CronJob 状态

```bash
kubectl get cronjob
kubectl describe cronjob hello
```

### 查看相关 Job 和 Pod

```bash
kubectl get jobs
kubectl get pods --selector=job-name=hello-1202039034
kubectl logs hello-1202039034-x7db5
```

## CronJob 限制和注意事项

在实际使用 CronJob 时，需注意以下限制和设计要点。

### 调度可靠性

CronJob 在每次调度时间内*大概*会创建一个 Job 对象。说*大概*是因为在特定环境下可能会：

- 创建两个 Job
- 一个 Job 都没创建

因此，Job 操作应该设计为**幂等的**。

### 时区处理

CronJob 调度基于控制平面运行的时区。如果控制平面在不同时区的多个节点上运行，调度时间可能会不可预测。

### Job 管理职责

- Job 负责重试创建 Pod，并决定 Pod 组的成功或失败
- CronJob 不会检查 Pod 的状态

## 删除 CronJob

删除 CronJob 资源不会自动删除其创建的 Job 和 Pod，需手动清理相关资源。

### 删除 CronJob 资源

```bash
kubectl delete cronjob hello
```

{{< callout note "重要" >}}
删除 CronJob 不会自动删除其创建的 Job 和 Pod。需要手动清理。
{{< /callout >}}

### 清理相关资源

```bash
kubectl get jobs
kubectl delete job hello-1201907962 hello-1202039034
kubectl delete jobs --all  # 谨慎使用
```

### 批量清理脚本

```bash
# 删除特定 CronJob 创建的所有 Job
kubectl delete jobs -l job-name --selector='job-name=hello'

# 删除超过一定时间的已完成 Job
kubectl delete job $(kubectl get job -o jsonpath='{.items[?(@.status.conditions[0].type=="Complete")].metadata.name}')
```

## 最佳实践

- 为 Job 模板中的容器设置适当的资源请求和限制
- 合理设置 `restartPolicy` 和 `backoffLimit`，配置重试策略
- 监控 CronJob 的执行状态和失败情况，及时告警
- 确保容器日志能够被适当收集和保存
- 保证 Job 执行幂等，避免重复执行造成问题
- 定期清理历史 Job，避免资源累积

## 总结

CronJob 机制为 Kubernetes 提供了原生的定时任务调度能力，适用于自动化运维、周期性数据处理等场景。合理配置并结合最佳实践，可提升集群的自动化水平和资源利用效率。
