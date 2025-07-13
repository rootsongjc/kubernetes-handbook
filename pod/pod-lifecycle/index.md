---
weight: 17
title: Pod 的生命周期
date: '2022-05-21T00:00:00+08:00'
type: book
aliases:
  - /book/kubernetes-handbook/objects/pod-lifecycle/
description: 详细介绍 Kubernetes Pod 的生命周期管理，包括 Pod 状态阶段、容器探针配置、重启策略以及生命周期的各种实际应用场景。
keywords:
- always
- kubelet
- phase
- pod
- restartpolicy
- running
- 容器
- 探针
- 状态
- 重启
---

本文深入讲解 Kubernetes 中 Pod 的生命周期管理，涵盖生命周期的各个阶段、健康检查探针、重启策略以及实际应用场景。

## Pod 阶段（Phase）

Pod 的 `status` 字段包含一个 PodStatus 对象，其中的 `phase` 字段表示 Pod 在生命周期中的当前状态。

Pod 的阶段（phase）是对 Pod 在其生命周期中状态的高层次概括，并非容器或 Pod 状态的详细汇总。

### 阶段类型

Pod 的 `phase` 字段可能包含以下值：

| 阶段 | 描述 |
|------|------|
| **Pending（挂起）** | Pod 已被 Kubernetes 接受，但一个或多个容器尚未创建完成。包括调度等待时间和镜像拉取时间 |
| **Running（运行中）** | Pod 已绑定到节点，所有容器已创建，至少有一个容器正在运行、启动或重启 |
| **Succeeded（成功）** | Pod 中所有容器已成功终止，且不会重启 |
| **Failed（失败）** | Pod 中所有容器已终止，至少有一个容器因失败而终止（退出码非零或被系统终止） |
| **Unknown（未知）** | 无法获取 Pod 状态，通常因与 Pod 所在节点通信失败导致 |

### 生命周期图示

下图展示了 Pod 生命周期中状态的变化流程：

![Pod 的生命周期示意图（图片来自网络）](https://assets.jimmysong.io/images/book/kubernetes-handbook/objects/pod-lifecycle/kubernetes-pod-life-cycle.webp)
{width=1886 height=638}

## Pod 状态（Status）

Pod 具有 PodStatus 对象，包含 PodCondition 数组。每个 PodCondition 包含：

- **`type`**：条件类型，可能值包括：
  - `PodScheduled`：Pod 是否已被调度
  - `Ready`：Pod 是否准备好接收流量
  - `Initialized`：所有初始化容器是否成功完成
  - `ContainersReady`：Pod 中所有容器是否就绪

- **`status`**：条件状态，值为 `True`、`False` 或 `Unknown`

## 容器探针（Probes）

探针是 kubelet 对容器执行的定期健康检查。kubelet 通过调用容器实现的处理程序来执行诊断。

### 探针类型

容器探针包含以下类型：

| 探针类型 | 描述 | 成功条件 |
|----------|------|----------|
| **ExecAction** | 执行指定命令 | 命令退出码为 0 |
| **TCPSocketAction** | TCP 端口检查 | 端口可连接 |
| **HTTPGetAction** | HTTP GET 请求 | 响应状态码 200-399 |

### 探测结果

每次探测返回以下结果之一：

- **Success（成功）**：容器通过诊断
- **Failure（失败）**：容器未通过诊断  
- **Unknown（未知）**：诊断失败，不采取行动

### 探针种类

#### 存活探针（Liveness Probe）

- **用途**：检测容器是否正在运行
- **失败处理**：kubelet 杀死容器，容器根据重启策略处理
- **默认状态**：如未配置，默认为 `Success`

#### 就绪探针（Readiness Probe）

- **用途**：检测容器是否准备好接收流量
- **失败处理**：从所有匹配的 Service 端点中移除 Pod IP
- **默认状态**：如未配置，默认为 `Success`

#### 启动探针（Startup Probe）

自 Kubernetes 1.16 起支持，用于检测容器是否已启动：

- **用途**：为慢启动容器提供更长的启动时间
- **优先级**：启动探针成功前，其他探针被禁用
- **适用场景**：遗留应用或启动时间较长的容器

### 探针使用指南

#### 何时使用存活探针

- 容器进程无法自行检测并恢复健康状态
- 需要在探测失败时重启容器
- 配合 `restartPolicy` 为 `Always` 或 `OnFailure` 使用

#### 何时使用就绪探针

- 需要控制流量路由到健康的 Pod
- 容器启动后需要加载数据或预热
- 临时不可用时希望停止接收流量

#### 何时使用启动探针

- 容器启动时间超过 `initialDelaySeconds + failureThreshold × periodSeconds`
- 需要为慢启动容器提供更长的启动窗口

### 探针配置示例

在 Kubernetes 中，探针（Probe）用于自动检测容器的健康和可用状态。常见的探针类型包括存活探针（Liveness Probe）、就绪探针（Readiness Probe）和启动探针（Startup Probe）。下面分别给出三种探针的典型配置示例，帮助你理解如何在 Pod 中使用探针提升应用的健壮性和可用性。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: probe-example
spec:
  containers:
  - name: app
    image: nginx:1.20
    ports:
    - containerPort: 80
    startupProbe:
      httpGet:
        path: /
        port: 80
      initialDelaySeconds: 10
      periodSeconds: 5
      failureThreshold: 12  # 60 秒启动窗口
    livenessProbe:
      httpGet:
        path: /health
        port: 80
      initialDelaySeconds: 15
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /ready
        port: 80
      initialDelaySeconds: 5
      periodSeconds: 5
      timeoutSeconds: 3
      successThreshold: 1
      failureThreshold: 3
```

## 就绪门控（Readiness Gates）

自 Kubernetes 1.14 起，支持扩展 Pod 就绪检测机制。

### 配置方式

在 PodSpec 中设置 `readinessGates`，指定额外的就绪条件：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: readiness-gate-example
spec:
  readinessGates:
    - conditionType: "example.com/load-balancer-ready"
  containers:
  - name: app
    image: nginx:1.20
status:
  conditions:
    - type: Ready
      status: "True"
      lastTransitionTime: "2023-01-01T00:00:00Z"
    - type: "example.com/load-balancer-ready"
      status: "True"
      lastTransitionTime: "2023-01-01T00:00:00Z"
```

### 就绪条件

Pod 被认为就绪需要满足：

1. 所有容器状态为 Ready
2. 所有 `readinessGates` 条件为 True

## 重启策略（Restart Policy）

PodSpec 的 `restartPolicy` 字段控制容器重启行为：

| 策略 | 描述 | 适用场景 |
|------|------|----------|
| **Always** | 总是重启（默认值） | 长期运行的服务 |
| **OnFailure** | 失败时重启 | 批处理任务 |
| **Never** | 从不重启 | 一次性任务 |

### 重启行为

- **重启延迟**：指数退避算法（10s, 20s, 40s, 80s, 160s, 300s）
- **重置条件**：容器成功运行 10 分钟后重置延迟
- **节点限制**：容器只能在同一节点重启

## Pod 生命周期管理

### 控制器类型

| 控制器 | 适用场景 | 重启策略要求 |
|--------|----------|--------------|
| **Deployment/ReplicaSet** | 无状态应用 | Always |
| **StatefulSet** | 有状态应用 | Always |
| **DaemonSet** | 节点级服务 | Always |
| **Job** | 批处理任务 | OnFailure/Never |
| **CronJob** | 定时任务 | OnFailure/Never |

### 生命周期事件

1. **创建阶段**
   - API Server 验证并存储 Pod 规格
   - 调度器选择合适节点
   - kubelet 拉取镜像并创建容器

2. **运行阶段**
   - 容器启动并运行
   - 探针持续检查健康状态
   - 根据检查结果更新 Pod 状态

3. **终止阶段**
   - 发送 SIGTERM 信号
   - 等待优雅终止期（默认 30 秒）
   - 发送 SIGKILL 强制终止

## 实际应用场景

在实际应用中，Pod 生命周期管理和重启策略的选择会根据不同的业务场景而有所不同。下面分别以 Web 应用部署和批处理任务为例，展示典型的 Pod 配置及其生命周期管理方式。

### 场景 1：Web 应用部署

Web 应用部署（Deployment 控制器，适合长期运行的服务，重启策略为 Always）：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: web
        image: nginx:1.20
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
```

### 场景 2：批处理任务

在批处理任务场景下，通常使用 Job 控制器来管理一次性或有限次数运行的任务。Job 会确保指定数量的 Pod 成功完成，适合数据处理、定时任务等场景。此时 Pod 的重启策略一般设置为 `OnFailure`，即仅在容器异常退出时重启，正常完成后不再重启。下面是一个典型的批处理 Job 配置示例：

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: data-processing
spec:
  template:
    spec:
      restartPolicy: OnFailure
      containers:
      - name: processor
        image: data-processor:latest
        command: ["python", "process.py"]
        resources:
          requests:
            memory: "512Mi"
            cpu: "1"
          limits:
            memory: "1Gi"
            cpu: "2"
```

## 故障排查

### 常见问题

1. **Pod 一直处于 Pending 状态**
   - 检查节点资源是否充足
   - 验证镜像是否可拉取
   - 确认 PVC 是否可用

2. **容器频繁重启**
   - 检查探针配置是否合理
   - 查看容器日志和事件
   - 验证资源限制设置

3. **Pod 无法接收流量**
   - 检查就绪探针状态
   - 验证 Service 配置
   - 确认网络策略设置

### 调试命令

在日常运维和故障排查中，掌握常用的 Pod 调试命令非常重要。以下列举了一些常见的 kubectl 命令，帮助你快速定位和解决 Pod 相关问题：

```bash
# 查看 Pod 状态
kubectl get pods -o wide

# 查看 Pod 详细信息
kubectl describe pod <pod-name>

# 查看 Pod 日志
kubectl logs <pod-name> -c <container-name>

# 查看 Pod 事件
kubectl get events --field-selector involvedObject.name=<pod-name>

# 进入容器调试
kubectl exec -it <pod-name> -c <container-name> -- /bin/bash
```

## 最佳实践

1. **合理配置探针**
   - 根据应用特性设置合适的超时和重试参数
   - 避免探针过于频繁或过于宽松

2. **优化启动时间**
   - 使用启动探针为慢启动应用提供缓冲
   - 优化镜像大小和启动流程

3. **资源管理**
   - 设置合理的资源请求和限制
   - 监控资源使用情况

4. **优雅终止**
   - 处理 SIGTERM 信号
   - 设置合适的 `terminationGracePeriodSeconds`

## 参考资料

- [Pod Lifecycle - Kubernetes 官方文档](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- [Configure Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Pod Lifecycle - API Reference](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#podstatus-v1-core)
