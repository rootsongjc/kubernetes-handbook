---
weight: 17
title: Pod 的生命周期
date: 2022-05-21T00:00:00+08:00
slug: pod-lifecycle
description: 详细介绍 Kubernetes Pod 的生命周期管理，包括 Pod 状态阶段、容器探针配置、重启策略以及生命周期的各种实际应用场景。
lastmod: 2026-11-01T00:00:00+08:00
---

> Pod 生命周期管理是 Kubernetes 自动化运维和高可用保障的核心，合理配置探针和重启策略可显著提升应用的健壮性和弹性。

## Pod 阶段（Phase）

Pod 的 `status` 字段包含一个 PodStatus 对象，其中的 `phase` 字段表示 Pod 在生命周期中的当前状态。Pod 的阶段（phase）是对 Pod 在其生命周期中状态的高层次概括，并非容器或 Pod 状态的详细汇总。

### 阶段类型

下表总结了 Pod `phase` 字段的所有可能取值及其含义：

{{< table title="Pod 阶段类型说明" >}}

| 阶段         | 描述                                                                 |
|--------------|----------------------------------------------------------------------|
| Pending      | Pod 已被 Kubernetes 接受，但一个或多个容器尚未创建完成。包括调度等待时间和镜像拉取时间 |
| Running      | Pod 已绑定到节点，所有容器已创建，至少有一个容器正在运行、启动或重启 |
| Succeeded    | Pod 中所有容器已成功终止，且不会重启                                 |
| Failed       | Pod 中所有容器已终止，至少有一个容器因失败而终止（退出码非零或被系统终止） |
| Unknown      | 无法获取 Pod 状态，通常因与 Pod 所在节点通信失败导致                 |

{{< /table >}}

下图展示了 Pod 生命周期中状态的变化流程：

![Pod 生命周期状态变化流程](pod-phase-transitions.svg)

## Pod 状态（Status）

Pod 具有 PodStatus 对象，包含 PodCondition 数组。每个 PodCondition 包含 `type`、`status`（`True`、`False` 或 `Unknown`）、`reason`、`message` 和 `lastTransitionTime` 等字段。下表列出了 Kubernetes 内建的 Pod 条件类型：

{{< table title="Pod 内建条件类型" >}}

| 条件类型                    | 含义                                                         | 引入版本        |
|-----------------------------|--------------------------------------------------------------|-----------------|
| `PodScheduled`              | Pod 已被调度到某个节点                                        | 早期            |
| `PodReadyToStartContainers` | Pod 沙箱（网络、卷等）已创建完成，可以开始启动容器               | v1.29 GA        |
| `Initialized`               | 所有 Init 容器已成功完成（Sidecar 容器已启动）                  | 早期            |
| `ContainersReady`           | Pod 中所有容器均已就绪                                        | 早期            |
| `Ready`                     | Pod 可接收流量，应加入匹配 Service 的端点                      | 早期            |
| `DisruptionTarget`          | Pod 因抢占、驱逐、节点压力等原因即将被终止，`reason` 标明原因     | v1.31 GA        |
| `PodResizePending`          | 已提交原地资源调整请求但节点暂时无法满足（`reason` 为 `Deferred` 或 `Infeasible`） | v1.33 引入，v1.35 GA |
| `PodResizeInProgress`       | 原地资源调整正在执行                                          | v1.33 引入，v1.35 GA |

{{< /table >}}

其中 `PodReadyToStartContainers` 填补了"已调度但容器尚未开始创建"这一盲区，便于定位镜像拉取、卷挂载或 CNI 配置缓慢的问题；`DisruptionTarget` 让 Job 等控制器可以通过 Pod 失败策略区分"业务失败"与"被基础设施打断"。

## 容器探针（Probes）

探针（Probe）是 kubelet 对容器执行的定期健康检查。kubelet 通过调用容器实现的处理程序来执行诊断。

### 探针类型

下表总结了四种探针检查机制及其判定标准：

{{< table title="容器探针检查机制与判定标准" >}}

| 检查机制  | 描述                         | 成功条件                              |
|-----------|------------------------------|---------------------------------------|
| `exec`    | 在容器内执行指定命令          | 命令退出码为 0                        |
| `tcpSocket` | 对指定端口发起 TCP 连接     | 端口可连接                            |
| `httpGet` | 发送 HTTP GET 请求            | 响应状态码 200-399                    |
| `grpc`    | 调用 gRPC 健康检查协议（v1.27 GA） | 返回 `SERVING` 状态                   |

{{< /table >}}

`grpc` 探针要求应用实现 [gRPC Health Checking Protocol](https://github.com/grpc/grpc/blob/master/doc/health-checking.md)，无需再在镜像中打包 `grpc_health_probe` 二进制。

每次探测返回以下结果之一：

- **Success（成功）**：容器通过诊断
- **Failure（失败）**：容器未通过诊断  
- **Unknown（未知）**：诊断失败，不采取行动

### 探针种类

#### 存活探针（Liveness Probe）

- 检测容器是否正在运行
- 失败时 kubelet 杀死容器，按重启策略处理
- 未配置时默认为 `Success`

#### 就绪探针（Readiness Probe）

- 检测容器是否准备好接收流量
- 失败时从 Service 端点中移除 Pod IP
- 未配置时默认为 `Success`

#### 启动探针（Startup Probe）

自 Kubernetes 1.20 起稳定，用于慢启动容器：

- 检测容器是否已启动
- 启动探针成功前，其他探针被禁用
- 适用于启动时间较长的应用
- 对原生 Sidecar 容器而言，启动探针通过是"放行下一个容器"的判定条件

### 探针使用指南

- **存活探针**：适用于进程无法自愈或需自动重启的场景
- **就绪探针**：用于控制流量路由，适合需预热或加载数据的应用
- **启动探针**：为慢启动容器提供更长启动窗口

### 探针配置示例

以下 YAML 展示了三种探针的典型配置：

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

自 Kubernetes 1.14 起，Pod 支持扩展就绪检测机制。可在 PodSpec 中设置 `readinessGates`，指定额外的就绪条件：

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

Pod 被认为就绪需满足：

1. 所有容器状态为 Ready
2. 所有 `readinessGates` 条件为 True

## 重启策略（Restart Policy）

PodSpec 的 `restartPolicy` 字段控制容器重启行为。下表总结了三种重启策略及其适用场景：

{{< table title="Pod 重启策略与适用场景" >}}

| 策略         | 描述           | 适用场景         |
|--------------|----------------|------------------|
| Always       | 总是重启（默认）| 长期运行的服务   |
| OnFailure    | 失败时重启     | 批处理任务       |
| Never        | 从不重启       | 一次性任务       |

{{< /table >}}

- **重启延迟**：采用指数退避算法（10s, 20s, 40s, 80s, 160s, 300s）
- **重置条件**：容器成功运行 10 分钟后重置延迟
- **节点限制**：容器只能在同一节点重启
- **容器级覆盖**：Init 容器可通过自身的 `restartPolicy: Always` 声明为 Sidecar，获得独立于 Pod 的重启语义；v1.34 起还引入了容器级 `restartPolicy` 与 `restartPolicyRules`（v1.35 Beta 并默认开启），允许按退出码决定单个容器是否重启

### 生命周期钩子

除探针外，容器还可以定义 `lifecycle.postStart` 和 `lifecycle.preStop` 两个钩子。钩子支持 `exec`、`httpGet`、`tcpSocket` 以及 v1.34 起 GA 的 `sleep` 四种动作。`sleep` 动作最常见的用途是在 `preStop` 中短暂停顿，等待 Service 端点摘除生效后再让进程退出，且不再依赖镜像内是否存在 shell：

```yaml
containers:
- name: app
  image: my-app:1.0
  lifecycle:
    preStop:
      sleep:
        seconds: 5
```

更多钩子用法参见 [Pod Hook](../pod-hook)。

## Pod 生命周期管理

Kubernetes 通过控制器实现 Pod 生命周期的自动化管理。下表总结了常见控制器类型及其重启策略要求：

{{< table title="Pod 控制器类型与重启策略要求" >}}

| 控制器                | 适用场景         | 重启策略要求      |
|-----------------------|------------------|-------------------|
| Deployment/ReplicaSet | 无状态应用       | Always            |
| StatefulSet           | 有状态应用       | Always            |
| DaemonSet             | 节点级服务       | Always            |
| Job                   | 批处理任务       | OnFailure/Never   |
| CronJob               | 定时任务         | OnFailure/Never   |

{{< /table >}}

### 生命周期事件

Pod 生命周期主要包括以下阶段：

1. **创建阶段**
   - API Server 验证并存储 Pod 规格
   - 调度器选择节点
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

Pod 生命周期管理和重启策略的选择需结合实际业务需求。以下为典型场景示例：

### 场景 1：Web 应用部署

适用于 Deployment 控制器，长期运行服务，重启策略为 Always：

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

适用于 Job 控制器，一次性或有限次数运行的任务，重启策略为 OnFailure：

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

在 Pod 生命周期管理中，常见问题及排查建议如下：

- **Pod 一直处于 Pending 状态**
  - 检查节点资源是否充足
  - 验证镜像是否可拉取
  - 确认 PVC 是否可用
- **容器频繁重启**
  - 检查探针配置是否合理
  - 查看容器日志和事件
  - 验证资源限制设置
- **Pod 无法接收流量**
  - 检查就绪探针状态
  - 验证 Service 配置
  - 确认网络策略设置

常用调试命令如下：

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

- **合理配置探针**：根据应用特性设置合适的超时和重试参数，避免探针过于频繁或宽松
- **优化启动时间**：使用启动探针为慢启动应用提供缓冲，优化镜像和启动流程
- **资源管理**：设置合理的资源请求和限制，监控资源使用
- **优雅终止**：处理 SIGTERM 信号，设置合适的 `terminationGracePeriodSeconds`

## 总结

Pod 生命周期管理是 Kubernetes 自动化运维和高可用的基础。通过合理配置探针、重启策略和生命周期事件，能够有效提升应用的健壮性和弹性。建议结合实际业务场景，灵活运用生命周期管理机制，保障集群稳定运行。

## 参考文献

- [Pod Lifecycle - kubernetes.io](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- [Configure Liveness, Readiness and Startup Probes - kubernetes.io](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Pod Lifecycle - API Reference - kubernetes.io](https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#PodStatus)
