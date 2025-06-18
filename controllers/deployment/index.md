---
weight: 29
title: Deployment
date: '2022-05-21T00:00:00+08:00'
type: book
description: Deployment 为 Pod 和 ReplicaSet 提供了声明式的部署方案，支持滚动更新、扩缩容、暂停恢复等操作，是 Kubernetes 中管理无状态应用的核心控制器。
keywords:
- deployment
- nginx
- pod
- replica
- replicaset
- selector
- spec
- template
- 创建
---

## 概述

Deployment 为 Pod 和 ReplicaSet 提供了声明式定义（declarative）方法，用来替代以前的 ReplicationController 来方便地管理应用。它是 Kubernetes 中管理无状态应用的核心控制器。

### 主要功能

- **创建管理**：定义 Deployment 来创建 Pod 和 ReplicaSet
- **滚动更新**：支持应用的滚动升级和回滚
- **弹性伸缩**：支持应用的扩容和缩容
- **暂停控制**：可以暂停和继续 Deployment 的部署过程

### 快速示例

一个简单的 nginx 应用可以定义为：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.20
        ports:
        - containerPort: 80
```

### 常用操作命令

**扩容应用：**

```bash
kubectl scale deployment nginx-deployment --replicas 10
```

**设置自动扩缩容：**

```bash
kubectl autoscale deployment nginx-deployment --min=10 --max=15 --cpu-percent=80
```

**更新镜像：**

```bash
kubectl set image deployment/nginx-deployment nginx=nginx:1.21
```

**回滚到上一版本：**

```bash
kubectl rollout undo deployment/nginx-deployment
```

## 架构图解

![Kubernetes Deployment Cheatsheet](https://assets.jimmysong.io/images/book/kubernetes-handbook/controllers/deployment/deployment-cheatsheet.webp)
{width=2142 height=2468}

## 核心概念

### Deployment 的作用

Deployment 为 Pod 和 ReplicaSet 提供声明式更新能力。你只需要在 Deployment 中描述期望的目标状态，Deployment Controller 就会帮你将 Pod 和 ReplicaSet 的实际状态改变到目标状态。

**重要提醒**：你不应该手动管理由 Deployment 创建的 ReplicaSet，否则会与 Deployment Controller 产生冲突。

### 典型应用场景

- **应用部署**：使用 Deployment 创建 ReplicaSet，ReplicaSet 在后台创建 Pod
- **滚动更新**：通过更新 Deployment 的 PodTemplateSpec 字段来声明 Pod 的新状态
- **版本回滚**：当前状态不稳定时，回滚到之前的 Deployment revision
- **应用扩缩容**：扩容 Deployment 以满足更高的负载
- **部署控制**：暂停 Deployment 来应用多个修复，然后恢复上线
- **状态监控**：根据 Deployment 的状态判断部署是否成功
- **历史清理**：清除旧的不必要的 ReplicaSet

## 创建 Deployment

### 基本创建

使用 kubectl 创建 Deployment：

```bash
kubectl create -f nginx-deployment.yaml --record
```

使用 `--record` 参数可以在 annotation 中记录当前命令，便于后续的版本管理和回滚操作。

### 查看状态

创建后立即查看状态：

```bash
kubectl get deployments
NAME               DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   3         0         0            0           1s
```

状态说明：

- **DESIRED**：期望的副本数（根据 `.spec.replicas` 配置）
- **CURRENT**：当前副本数（`.status.replicas`）
- **UP-TO-DATE**：最新的副本数（`.status.updatedReplicas`）
- **AVAILABLE**：可用的副本数（`.status.availableReplicas`）

等待部署完成后：

```bash
kubectl get deployments
NAME               DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   3         3         3            3           18s
```

### 查看关联资源

查看 ReplicaSet：

```bash
kubectl get rs
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-2035384211   3         3         3       18s
```

查看 Pod：

```bash
kubectl get pods --show-labels
NAME                                READY   STATUS    RESTARTS   AGE   LABELS
nginx-deployment-2035384211-7ci7o   1/1     Running   0          18s   app=nginx,pod-template-hash=2035384211
nginx-deployment-2035384211-kzszj   1/1     Running   0          18s   app=nginx,pod-template-hash=2035384211
nginx-deployment-2035384211-qqcnn   1/1     Running   0          18s   app=nginx,pod-template-hash=2035384211
```

### Pod Template Hash 标签

注意 Pod 上的 `pod-template-hash` 标签，这是 Deployment Controller 自动添加的。通过将 ReplicaSet 的 PodTemplate 进行哈希散列，生成的哈希值作为标签值，确保不同版本的 ReplicaSet 管理的 Pod 不会冲突。

## 更新 Deployment

### 触发更新

Deployment 的滚动更新（rollout）只有在 Deployment 的 Pod template（`.spec.template`）中的标签更新或者镜像更改时才会被触发。其他更新如扩容不会触发 rollout。

### 镜像更新

更新 nginx 镜像版本：

```bash
kubectl set image deployment/nginx-deployment nginx=nginx:1.21
```

或者使用 edit 命令：

```bash
kubectl edit deployment/nginx-deployment
```

### 监控更新状态

查看 rollout 状态：

```bash
kubectl rollout status deployment/nginx-deployment
Waiting for rollout to finish: 2 out of 3 new replicas have been updated...
deployment "nginx-deployment" successfully rolled out
```

### 滚动更新过程

Deployment 采用滚动更新策略，确保在更新过程中服务的可用性：

- 默认情况下，最多有 25% 的 Pod 不可用（maxUnavailable）
- 最多有 25% 的 Pod 超出期望数量（maxSurge）
- 这样确保在更新过程中始终有足够的 Pod 提供服务

查看更新过程中的 ReplicaSet 变化：

```bash
kubectl get rs
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-1564180365   3         3         3       6s
nginx-deployment-2035384211   0         0         0       36s
```

### Rollover（多个滚动更新并行）

当 Deployment Controller 观测到新的 deployment 被创建时：

- 如果没有已存在的 ReplicaSet 来创建期望个数的 Pod，就会创建新的 ReplicaSet
- 已存在的 ReplicaSet 会被缩容到 0
- 如果在更新过程中再次更新，会立即创建新的 ReplicaSet，并停止之前的更新过程

### Label Selector 更新

**不建议更新 label selector**，如果必须更新，需要注意：

- **增加 selector**：需要同时在 Deployment spec 中更新新的 label
- **更新 selector**：会导致创建新的 ReplicaSet，旧的会变成孤儿
- **删除 selector**：不需要改变 Pod template label，但删除的 label 仍存在于现有 Pod 中

## 版本回滚

### 回滚场景

当部署出现问题时（如镜像错误、应用崩溃等），可以快速回滚到稳定版本。

假设更新了错误的镜像：

```bash
kubectl set image deployment/nginx-deployment nginx=nginx:1.91
```

### 查看回滚历史

查看 Deployment 的 revision 历史：

```bash
kubectl rollout history deployment/nginx-deployment
deployments "nginx-deployment":
REVISION    CHANGE-CAUSE
1           kubectl create -f nginx-deployment.yaml --record
2           kubectl set image deployment/nginx-deployment nginx=nginx:1.20
3           kubectl set image deployment/nginx-deployment nginx=nginx:1.91
```

查看特定版本的详细信息：

```bash
kubectl rollout history deployment/nginx-deployment --revision=2
```

### 执行回滚

回滚到上一个版本：

```bash
kubectl rollout undo deployment/nginx-deployment
```

回滚到指定版本：

```bash
kubectl rollout undo deployment/nginx-deployment --to-revision=2
```

### 清理策略

通过设置 `.spec.revisionHistoryLimit` 来控制保留的历史版本数量：

```yaml
spec:
  revisionHistoryLimit: 10  # 保留 10 个历史版本
```

设置为 0 则不保留历史版本，但会失去回滚能力。

## 扩缩容操作

### 手动扩缩容

扩容到 10 个副本：

```bash
kubectl scale deployment nginx-deployment --replicas 10
```

### 自动扩缩容

设置基于 CPU 使用率的自动扩缩容：

```bash
kubectl autoscale deployment nginx-deployment --min=10 --max=15 --cpu-percent=80
```

删除自动扩缩容：

```bash
kubectl get hpa
kubectl delete hpa nginx-deployment
```

### 比例扩容

当 RollingUpdate Deployment 正在进行滚动更新时，如果同时进行扩容操作，Deployment Controller 会按比例在新旧 ReplicaSet 之间分配新增的副本数，以降低风险。

例如：

- 当前有 10 个副本，maxSurge=3，maxUnavailable=2
- 如果此时扩容到 15 个副本，新增的 5 个副本会按比例分配到新旧 ReplicaSet 中

## 暂停和恢复

### 暂停 Deployment

在需要进行多次修改时，可以先暂停 Deployment：

```bash
kubectl rollout pause deployment/nginx-deployment
```

### 进行修改

暂停期间可以进行多次修改而不触发滚动更新：

```bash
# 更新镜像
kubectl set image deployment/nginx-deployment nginx=nginx:1.21

# 更新资源限制
kubectl set resources deployment nginx-deployment -c=nginx --limits=cpu=200m,memory=512Mi
```

### 恢复 Deployment

完成所有修改后恢复 Deployment：

```bash
kubectl rollout resume deployment/nginx-deployment
```

恢复后会一次性应用所有修改，触发一次滚动更新。

## Deployment 状态

### 进行中（Progressing）

当 Deployment 执行以下任务之一时标记为 *progressing* 状态：

- 正在创建新的 ReplicaSet
- 正在扩容已有的 ReplicaSet
- 正在缩容已有的 ReplicaSet
- 有新的可用 Pod 出现

### 完成（Complete）

当 Deployment 具备以下特性时标记为 *complete* 状态：

- 可用副本数等于或超过期望副本数
- 所有副本都已更新到指定版本
- 没有旧的 Pod 存在

检查完成状态：

```bash
kubectl rollout status deployment/nginx-deployment
deployment "nginx-deployment" successfully rolled out
echo $?  # 返回 0 表示成功
```

### 失败（Failed）

Deployment 可能因为以下原因失败：

- 无效的镜像引用
- 健康检查失败
- 镜像拉取错误
- 权限不足
- 资源限制
- 应用配置错误

### 进度超时

设置进度超时时间：

```bash
kubectl patch deployment/nginx-deployment -p '{"spec":{"progressDeadlineSeconds":600}}'
```

超时后会在 Deployment 状态中添加 `Reason=ProgressDeadlineExceeded` 的条件。

## 高级用例

### 金丝雀发布

通过创建多个 Deployment 实现金丝雀发布：

```yaml
# 稳定版本
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-stable
spec:
  replicas: 9
  selector:
    matchLabels:
      app: nginx
      version: stable
  template:
    metadata:
      labels:
        app: nginx
        version: stable
    spec:
      containers:
      - name: nginx
        image: nginx:1.20

---
# 金丝雀版本
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-canary
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx
      version: canary
  template:
    metadata:
      labels:
        app: nginx
        version: canary
    spec:
      containers:
      - name: nginx
        image: nginx:1.21
```

## Deployment Spec 详解

### 必需字段

**Pod Template (`.spec.template`)**：

- 是 `.spec` 中唯一必需的字段
- 具有与 Pod 相同的 schema，但是嵌套的且不需要 `apiVersion` 和 `kind`
- 必须指定适当的标签和重启策略

### 可选字段

**副本数 (`.spec.replicas`)**：

- 指定期望的 Pod 数量，默认为 1

**选择器 (`.spec.selector`)**：

- 指定 label selector，圈定 Deployment 管理的 Pod 范围
- 如果未指定，默认使用 `.spec.template.metadata.labels`
- 必须匹配 `.spec.template.metadata.labels`

**更新策略 (`.spec.strategy`)**：

- `Recreate`：先删除所有旧 Pod 再创建新 Pod
- `RollingUpdate`：滚动更新（默认）

**滚动更新参数**：

- `maxUnavailable`：更新过程中不可用 Pod 的最大数量或百分比
- `maxSurge`：更新过程中可以超出期望数量的最大 Pod 数或百分比

**其他配置**：

- `progressDeadlineSeconds`：进度超时时间
- `minReadySeconds`：Pod 准备就绪的最小等待时间
- `revisionHistoryLimit`：保留的历史版本数量
- `paused`：是否暂停 Deployment

### 配置示例

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.20
        ports:
        - containerPort: 80
        resources:
          limits:
            cpu: 100m
            memory: 128Mi
          requests:
            cpu: 50m
            memory: 64Mi
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 25%
      maxSurge: 25%
  progressDeadlineSeconds: 600
  minReadySeconds: 5
  revisionHistoryLimit: 10
```

## 最佳实践

### 标签管理

- 为 Deployment 和 Pod 设置清晰的标签
- 避免与其他控制器的选择器冲突
- 使用语义化的标签值

### 资源配置

- 合理设置 CPU 和内存的 requests 和 limits
- 配置健康检查（liveness 和 readiness probe）
- 设置适当的镜像拉取策略

### 版本管理

- 使用 `--record` 参数记录变更历史
- 合理设置 `revisionHistoryLimit`
- 建立完善的发布和回滚流程

### 监控告警

- 监控 Deployment 的状态变化
- 设置资源使用率告警
- 建立应用健康检查机制
