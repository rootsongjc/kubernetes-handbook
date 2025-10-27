---
weight: 29
title: Deployment
date: 2022-05-21T00:00:00+08:00
description: Deployment 为 Pod 和 ReplicaSet 提供了声明式的部署方案，支持滚动更新、扩缩容、暂停恢复等操作，是 Kubernetes 中管理无状态应用的核心控制器。
lastmod: 2025-10-27T16:02:32.390Z
---

> Deployment 控制器为 Kubernetes 无状态应用提供了声明式部署、弹性伸缩与高可用保障，是现代云原生架构的核心基石。

## 概述

Deployment 为 Pod 和 ReplicaSet 提供了声明式定义（declarative）方法，用来替代以前的 ReplicationController 来方便地管理应用。它是 Kubernetes 中管理无状态应用的核心控制器。

### 主要功能

Deployment 支持多种核心功能，便于高效管理应用生命周期：

- **创建管理**：定义 Deployment 来创建 Pod 和 ReplicaSet
- **滚动更新**：支持应用的滚动升级和回滚
- **弹性伸缩**：支持应用的扩容和缩容
- **暂停控制**：可以暂停和继续 Deployment 的部署过程

### 快速示例

以下是一个简单的 nginx 应用 Deployment 配置示例：

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

常见的 Deployment 运维命令如下：

```bash
# 扩容应用
kubectl scale deployment nginx-deployment --replicas 10

# 设置自动扩缩容
kubectl autoscale deployment nginx-deployment --min=10 --max=15 --cpu-percent=80

# 更新镜像
kubectl set image deployment/nginx-deployment nginx=nginx:1.21

# 回滚到上一版本
kubectl rollout undo deployment/nginx-deployment
```

## 架构图解

下图展示了 Deployment 控制器的核心架构与资源关系。

![Kubernetes Deployment Cheatsheet](https://assets.jimmysong.io/images/book/kubernetes-handbook/controllers/deployment/deployment-cheatsheet.webp)
{width=2142 height=2468}

## 核心概念

Deployment 通过声明式更新能力，自动管理 Pod 和 ReplicaSet 的生命周期。只需描述期望的目标状态，Deployment Controller 会自动驱动实际状态向目标状态收敛。

{{< table title="Deployment 典型应用场景" >}}

| 场景         | 说明                                   |
|--------------|----------------------------------------|
| 应用部署     | 创建 ReplicaSet，后台自动创建 Pod      |
| 滚动更新     | 更新 PodTemplateSpec 触发新版本部署    |
| 版本回滚     | 回滚到历史稳定版本                     |
| 应用扩缩容   | 动态调整副本数以应对负载变化           |
| 部署控制     | 支持暂停、恢复、批量修改               |
| 状态监控     | 监控部署进度与健康状态                 |
| 历史清理     | 清理旧 ReplicaSet，节省资源            |

{{< /table >}}

**注意**：不要手动管理由 Deployment 创建的 ReplicaSet，否则会与 Deployment Controller 产生冲突。

## 创建 Deployment

### 基本创建

使用 kubectl 创建 Deployment：

```bash
kubectl create -f nginx-deployment.yaml --record
```

`--record` 参数可记录变更历史，便于后续回滚和审计。

### 查看状态

创建后可通过以下命令查看 Deployment 状态：

```bash
kubectl get deployments
kubectl get rs
kubectl get pods --show-labels
```

Deployment 状态字段说明：

{{< table title="Deployment 状态字段说明" >}}

| 字段         | 含义                         |
|--------------|------------------------------|
| DESIRED      | 期望副本数（.spec.replicas） |
| CURRENT      | 当前副本数（.status.replicas）|
| UP-TO-DATE   | 最新副本数（.status.updatedReplicas）|
| AVAILABLE    | 可用副本数（.status.availableReplicas）|

{{< /table >}}

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

Deployment Controller 会自动为 Pod 添加 `pod-template-hash` 标签，用于区分不同版本的 ReplicaSet 管理的 Pod，避免冲突。

## 更新 Deployment

### 触发更新

只有当 Deployment 的 Pod template（`.spec.template`）发生变更（如标签、镜像等）时，才会触发滚动更新（rollout）。

### 镜像更新

更新 nginx 镜像版本：

```bash
kubectl set image deployment/nginx-deployment nginx=nginx:1.21
```

或通过编辑方式：

```bash
kubectl edit deployment/nginx-deployment
```

### 监控更新状态

查看 rollout 状态：

```bash
kubectl rollout status deployment/nginx-deployment
```

### 滚动更新过程

Deployment 默认采用滚动更新策略，保证服务可用性：

- `maxUnavailable`：最多有 25% 的 Pod 不可用
- `maxSurge`：最多有 25% 的 Pod 超出期望数量

查看更新过程中的 ReplicaSet 变化：

```bash
kubectl get rs
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-1564180365   3         3         3       6s
nginx-deployment-2035384211   0         0         0       36s
```

## Rollover（并行滚动更新）

若在滚动更新过程中再次修改 Deployment，会立即创建新的 ReplicaSet，并终止之前的更新过程，确保最新变更优先生效。

## Label Selector 更新

**不建议**直接修改 label selector。若必须修改，需同步更新 Pod template 的 label，避免产生孤儿 ReplicaSet。

## 版本回滚

### 回滚场景与操作

当部署出现问题时，可通过以下命令回滚：

```bash
kubectl rollout undo deployment/nginx-deployment
kubectl rollout undo deployment/nginx-deployment --to-revision=2
```

查看历史版本：

```bash
kubectl rollout history deployment/nginx-deployment
kubectl rollout history deployment/nginx-deployment --revision=2
```

通过 `.spec.revisionHistoryLimit` 控制历史版本保留数量：

```yaml
spec:
  revisionHistoryLimit: 10
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

滚动更新期间扩容，Deployment Controller 会按比例在新旧 ReplicaSet 之间分配新增副本，降低风险。

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

通过多个 Deployment 实现金丝雀发布：

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

- `.spec.template`：Pod 模板，唯一必需字段，结构与 Pod 相同但无需 `apiVersion` 和 `kind`，需指定标签和重启策略

### 可选字段

- `.spec.replicas`：期望 Pod 数量，默认 1
- `.spec.selector`：label selector，必须与模板标签匹配
- `.spec.strategy`：更新策略，支持 `Recreate` 和 `RollingUpdate`
- `maxUnavailable`、`maxSurge`：滚动更新参数
- `progressDeadlineSeconds`、`minReadySeconds`、`revisionHistoryLimit`、`paused` 等高级配置

**完整配置示例：**

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

- 为 Deployment 和 Pod 设置清晰、语义化的标签，避免选择器冲突
- 合理配置 CPU、内存 requests/limits，设置健康检查
- 使用 `--record` 参数记录变更历史，合理设置 `revisionHistoryLimit`
- 监控 Deployment 状态，建立自动告警和健康检查机制

## 总结

Deployment 控制器为 Kubernetes 提供了声明式、自动化的无状态应用管理能力。通过合理配置和最佳实践，可实现高可用、弹性伸缩、平滑升级与快速回滚，助力云原生架构的持续演进。
