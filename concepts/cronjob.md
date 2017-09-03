# CronJob

*Cron Job* 管理基于时间的 [Job](https://kubernetes.io/docs/concepts/jobs/run-to-completion-finite-workloads/)，即：

- 在给定时间点只运行一次
- 周期性地在给定时间点运行

一个 CronJob 对象类似于 *crontab* （cron table）文件中的一行。它根据指定的预定计划周期性地运行一个 Job，格式可以参考 [Cron](https://en.wikipedia.org/wiki/Cron) 。

### 前提条件

当使用的 Kubernetes 集群，版本 >= 1.4（对 ScheduledJob），>= 1.5（对 CronJob），当启动 API Server（参考 [为集群开启或关闭 API 版本](https://kubernetes.io/docs/admin/cluster-management/#turn-on-or-off-an-api-version-for-your-cluster) 获取更多信息）时，通过传递选项 `--runtime-config=batch/v2alpha1=true` 可以开启 batch/v2alpha1 API。

典型的用法如下所示：

- 在给定的时间点调度 Job 运行
- 创建周期性运行的 Job，例如：数据库备份、发送邮件。

## CronJob Spec

- `.spec.schedule`：**调度**，必需字段，指定任务运行周期，格式同 [Cron](https://en.wikipedia.org/wiki/Cron)

- `.spec.jobTemplate`：**Job 模板**，必需字段，指定需要运行的任务，格式同 [Job](job.md)

- `.spec.startingDeadlineSeconds` ：**启动 Job 的期限（秒级别）**，该字段是可选的。如果因为任何原因而错过了被调度的时间，那么错过执行时间的 Job 将被认为是失败的。如果没有指定，则没有期限

- `.spec.concurrencyPolicy`：**并发策略**，该字段也是可选的。它指定了如何处理被 Cron Job 创建的 Job 的并发执行。只允许指定下面策略中的一种：

  - `Allow`（默认）：允许并发运行 Job
  - `Forbid`：禁止并发运行，如果前一个还没有完成，则直接跳过下一个
  - `Replace`：取消当前正在运行的 Job，用一个新的来替换

  注意，当前策略只能应用于同一个 Cron Job 创建的 Job。如果存在多个 Cron Job，它们创建的 Job 之间总是允许并发运行。

- `.spec.suspend` ：**挂起**，该字段也是可选的。如果设置为 `true`，后续所有执行都会被挂起。它对已经开始执行的 Job 不起作用。默认值为 `false`。

- `.spec.successfulJobsHistoryLimit` 和 `.spec.failedJobsHistoryLimit` ：**历史限制**，是可选的字段。它们指定了可以保留多少完成和失败的 Job。

  默认没有限制，所有成功和失败的 Job 都会被保留。然而，当运行一个 Cron Job 时，Job 可以很快就堆积很多，推荐设置这两个字段的值。设置限制的值为 `0`，相关类型的 Job 完成后将不会被保留。

```yaml
apiVersion: batch/v2alpha1
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
            image: busybox
            args:
            - /bin/sh
            - -c
            - date; echo Hello from the Kubernetes cluster
          restartPolicy: OnFailure
```

```Bash
$ kubectl create -f cronjob.yaml
cronjob "hello" created
```

当然，也可以用`kubectl run`来创建一个CronJob：

```bash
kubectl run hello --schedule="*/1 * * * *" --restart=OnFailure --image=busybox -- /bin/sh -c "date; echo Hello from the Kubernetes cluster"
```

```bash
$ kubectl get cronjob
NAME      SCHEDULE      SUSPEND   ACTIVE    LAST-SCHEDULE
hello     */1 * * * *   False     0         <none>
$ kubectl get jobs
NAME               DESIRED   SUCCESSFUL   AGE
hello-1202039034   1         1            49s
$ pods=$(kubectl get pods --selector=job-name=hello-1202039034 --output=jsonpath={.items..metadata.name} -a)
$ kubectl logs $pods
Mon Aug 29 21:34:09 UTC 2016
Hello from the Kubernetes cluster

# 注意，删除cronjob的时候不会自动删除job，这些job可以用kubectl delete job来删除
$ kubectl delete cronjob hello
cronjob "hello" deleted
```

## Cron Job 限制

Cron Job 在每次调度运行时间内 *大概* 会创建一个 Job 对象。我们之所以说 *大概* ，是因为在特定的环境下可能会创建两个 Job，或者一个 Job 都没创建。我们尝试少发生这种情况，但却不能完全避免。因此，创建 Job 操作应该是 *幂等的*。

Job 根据它所创建的 Pod 的并行度，负责重试创建 Pod，并就决定这一组 Pod 的成功或失败。Cron Job 根本就不会去检查 Pod。

## 删除 Cron Job

一旦不再需要 Cron Job，简单地可以使用 `kubectl` 命令删除它：

```
$ kubectl delete cronjob hello
cronjob "hello" deleted

```

这将会终止正在创建的 Job。然而，运行中的 Job 将不会被终止，不会删除 Job 或 它们的 Pod。为了清理那些 Job 和 Pod，需要列出该 Cron Job 创建的全部 Job，然后删除它们：

```
$ kubectl get jobs
NAME               DESIRED   SUCCESSFUL   AGE
hello-1201907962   1         1            11m
hello-1202039034   1         1            8m
...

$ kubectl delete jobs hello-1201907962 hello-1202039034 ...
job "hello-1201907962" deleted
job "hello-1202039034" deleted
...

```

一旦 Job 被删除，由 Job 创建的 Pod 也会被删除。注意，所有由名称为 “hello” 的 Cron Job 创建的 Job 会以前缀字符串 “hello-” 进行命名。如果想要删除当前 Namespace 中的所有 Job，可以通过命令 `kubectl delete jobs --all` 立刻删除它们。