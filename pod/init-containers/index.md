---
weight: 4
title: Init 容器
date: 2022-05-21T00:00:00+08:00
slug: init-containers
description: Init 容器是一种专用的容器，在应用程序容器启动之前运行，用来包含一些应用镜像中不存在的实用工具或安装脚本。本文详细介绍 Init 容器的概念、用法和最佳实践。
lastmod: 2026-11-01T00:00:00+08:00
---

> Init 容器是 Kubernetes Pod 生命周期管理中的关键机制，专为初始化任务和依赖准备而设计，提升了应用部署的灵活性和可维护性。

## 什么是 Init 容器

Init 容器（Init Container）是运行在 Pod 中的特殊容器，在应用容器启动之前依次执行，用于完成初始化任务。每个 Pod 可以包含多个 Init 容器，这些容器会按照定义顺序依次运行。

### Init 容器的核心特性

{{< table title="Init 容器与应用容器的核心特性对比" >}}

| 特性         | Init 容器                   | 应用容器                   |
|--------------|----------------------------|----------------------------|
| 运行方式     | 顺序执行，运行至完成        | 并行运行，持续运行         |
| 重启策略     | 失败时按 Pod `restartPolicy` 重试 | 根据 restartPolicy 处理    |
| 探针         | 不支持 liveness/readiness/startup 探针 | 支持各种探针               |
| 生命周期钩子 | 不支持 `lifecycle`         | 支持 postStart/preStop     |
| 生命周期     | 一次性执行                 | 长期运行                   |

{{< /table >}}

- **顺序执行**：多个 Init 容器按照定义顺序一个接一个地运行
- **必须成功**：每个 Init 容器都必须成功完成，下一个容器才能启动
- **阻塞启动**：所有 Init 容器成功完成后，应用容器才开始启动
- **独立镜像**：Init 容器可以使用与应用容器不同的镜像

### 与普通容器的区别

Init 容器支持应用容器的大部分特性（镜像、环境变量、卷挂载、资源限制、安全上下文等），但在生命周期、重启策略等方面有显著差异：Init 容器不支持探针和 `lifecycle` 钩子，也不能声明 `ports` 对外提供服务。

### Init 容器与 Sidecar 容器

自 Kubernetes v1.29 起，Init 容器新增了一个可选字段 `restartPolicy`。当某个 Init 容器的 `restartPolicy` 设为 `Always` 时，它不再是"运行一次即退出"的初始化容器，而会成为与 Pod 同寿命的**原生 Sidecar 容器**：启动成功后即放行后续容器，自身持续运行并在崩溃后自动重启，且支持探针与生命周期钩子。该字段是 Init 容器与 Sidecar 容器的唯一区别，详见 [Sidecar 容器](../sidecar-container)。

以下示例同时包含一个普通 Init 容器和一个 Sidecar 容器：

```yaml
spec:
  initContainers:
  - name: init-schema          # 普通 Init 容器：运行完成后退出
    image: my-app:1.0
    command: ["python", "manage.py", "migrate"]
  - name: log-agent            # Sidecar 容器：与 Pod 同寿命
    image: fluent/fluent-bit:3.2
    restartPolicy: Always
  containers:
  - name: app
    image: my-app:1.0
```

本文余下内容聚焦于不设置 `restartPolicy`（或显式设为与 Pod 一致）的普通 Init 容器。

## Init 容器的使用场景

Init 容器适用于多种初始化和依赖准备场景。常见用例如下：

- **依赖服务检查**：等待数据库、缓存等依赖服务就绪
- **数据预处理**：下载配置文件、克隆 Git 仓库、生成动态配置
- **权限和安全设置**：修改文件权限、创建用户、设置证书
- **资源准备**：初始化数据库 schema、创建目录结构、安装依赖包

下图展示了 Init 容器在 Pod 启动流程中的作用：

![Init 容器执行流程](init-container-startup-flow.svg)

## 使用示例

### 基础示例

以下 YAML 展示了一个包含两个 Init 容器的 Pod 配置：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
  labels:
    app: myapp
spec:
  containers:
  - name: myapp-container
    image: busybox:1.35
    command: ['sh', '-c', 'echo The app is running! && sleep 3600']
  initContainers:
  - name: init-myservice
    image: busybox:1.35
    command: ['sh', '-c', 'until nslookup myservice.default.svc.cluster.local; do echo waiting for myservice; sleep 2; done;']
  - name: init-mydb
    image: busybox:1.35
    command: ['sh', '-c', 'until nslookup mydb.default.svc.cluster.local; do echo waiting for mydb; sleep 2; done;']
```

### 配套服务定义

为确保 Init 容器能通过 DNS 访问依赖服务，需定义对应的 Service：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myservice
spec:
  ports:
  - protocol: TCP
    port: 80
    targetPort: 9376
---
apiVersion: v1
kind: Service
metadata:
  name: mydb
spec:
  ports:
  - protocol: TCP
    port: 80
    targetPort: 9377
```

### 实际应用示例

以下 YAML 展示了更复杂的 Init 容器用法：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-app-pod
spec:
  initContainers:
  # 1. 等待数据库就绪
  - name: wait-for-db
    image: postgres:13
    command: ['sh', '-c']
    args:
    - |
      until pg_isready -h postgres-service -p 5432 -U myuser; do
        echo "Waiting for postgres..."
        sleep 2
      done
  # 2. 运行数据库迁移
  - name: db-migration
    image: myapp:latest
    command: ['python', 'manage.py', 'migrate']
    env:
    - name: DATABASE_URL
      value: "postgresql://myuser:mypass@postgres-service:5432/mydb"
  containers:
  - name: web-app
    image: myapp:latest
    ports:
    - containerPort: 8000
```

## 运行时行为

Init 容器的执行顺序和失败处理如下：

1. Pod 被调度到节点
2. 网络和存储卷初始化
3. Init 容器按顺序依次执行
4. 所有 Init 容器成功后，应用容器启动

- 若 Init 容器失败，kubelet 会根据 Pod 的 `restartPolicy` 决定是否重试
- `restartPolicy: Never` 时，Pod 直接进入 `Failed` 阶段
- `restartPolicy: Always` 或 `OnFailure` 时，kubelet 会按指数退避反复重启该 Init 容器，直至成功
- Init 容器的重试同样受 Pod 级 `activeDeadlineSeconds` 约束

以下情况会导致 Init 容器重新执行：

- Pod 的沙箱（pause 容器 / 网络命名空间）被重建，例如节点重启或容器运行时重启
- Init 容器的 `image` 字段被更新（`spec.initContainers` 中只有 `image` 允许在 Pod 创建后修改），kubelet 会重启整个 Pod 的所有容器
- Pod 被删除重建

## 资源管理

Init 容器的资源请求和限制有独特的计算方式。由于普通 Init 容器顺序运行、互不重叠，Kubernetes 不会把它们的资源简单相加：

- **有效初始请求**：所有普通 Init 容器中某资源的最大值
- **Pod 有效请求**：max(有效初始请求，所有应用容器请求之和)

如果 Pod 同时声明了 Sidecar 容器（`restartPolicy: Always` 的 Init 容器），Sidecar 的资源会与应用容器**累加**计算，详见 [Sidecar 容器](../sidecar-container) 中的资源计算规则。

以下 YAML 展示了 Init 容器的资源配置：

```yaml
spec:
  initContainers:
  - name: init-container
    image: busybox
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
```

### 存储卷共享

Init 容器可与应用容器共享存储卷，实现数据预处理和传递：

```yaml
spec:
  initContainers:
  - name: init-data
    image: busybox
    command: ['sh', '-c', 'echo "Hello" > /shared-data/message']
    volumeMounts:
    - name: shared-storage
      mountPath: /shared-data
  containers:
  - name: app
    image: nginx
    volumeMounts:
    - name: shared-storage
      mountPath: /usr/share/nginx/html
  volumes:
  - name: shared-storage
    emptyDir: {}
```

## 监控和调试

在使用 kubectl 工具监控和调试 Init 容器时，可通过以下命令查看 Pod 及其 Init 容器的状态和日志：

```bash
# 查看 Pod 状态
kubectl get pod myapp-pod

# 查看详细信息
kubectl describe pod myapp-pod

# 查看 Init 容器日志
kubectl logs myapp-pod -c init-myservice
kubectl logs myapp-pod -c init-mydb
```

常见状态说明：

- `Init:0/2`：2 个 Init 容器中的第 1 个正在运行
- `Init:1/2`：第 1 个 Init 容器完成，第 2 个正在运行
- `PodInitializing`：所有 Init 容器完成，Pod 正在初始化
- `Running`：Pod 启动成功

## 最佳实践

Init 容器的设计和实现建议如下：

### 保持幂等性

Init 容器的代码应具备幂等性，能安全重复执行：

```bash
# 检查文件是否存在再下载
if [ ! -f /data/config.json ]; then
  curl -o /data/config.json https://config-server/config.json
fi
```

### 设置合理的超时

通过 `activeDeadlineSeconds` 避免 Init 容器无限等待：

```yaml
spec:
  activeDeadlineSeconds: 300  # 5 分钟超时
  initContainers:
  - name: wait-service
    image: busybox
    command: ['sh', '-c', 'sleep 10']
```

### 适当的资源配置

为 Init 容器设置合理的资源限制：

```yaml
initContainers:
- name: data-downloader
  image: alpine/curl
  resources:
    requests:
      memory: "64Mi"
      cpu: "100m"
    limits:
      memory: "128Mi"
      cpu: "200m"
```

### 使用轻量级镜像

选择合适的基础镜像以减少启动时间：

- 使用 `alpine` 替代 `ubuntu`
- 构建专用的 Init 容器镜像
- 利用多阶段构建减小镜像大小

## 版本演进

Init 容器自 Kubernetes 1.6 起以 `spec.initContainers` 字段形式稳定提供，是最早成熟的 Pod 特性之一。近年来与之相关的重要变化集中在两点：

{{< table title="Init 容器相关特性的版本演进" >}}

| 版本       | 变化                                                                 |
| ---------- | -------------------------------------------------------------------- |
| v1.6       | `spec.initContainers` 字段 GA，取代早期的 beta 注解写法                |
| v1.28      | Init 容器可设置 `restartPolicy: Always`（Alpha），原生 Sidecar 雏形      |
| v1.29      | 原生 Sidecar 容器 Beta 并默认开启                                       |
| v1.33      | 原生 Sidecar 容器 GA                                                    |

{{< /table >}}

对运行 v1.29 及以上版本的集群，Init 容器与 Sidecar 容器共同构成了 Pod 启动阶段的完整工具箱：前者负责一次性初始化，后者负责贯穿 Pod 生命周期的辅助能力。

## 总结

Init 容器为 Kubernetes Pod 提供了灵活的初始化机制，适用于依赖检查、数据准备、安全配置等多种场景。通过合理设计 Init 容器及其资源配置，可显著提升应用部署的可靠性和自动化水平。对需要长期运行的辅助进程，应使用 `restartPolicy: Always` 将其声明为 Sidecar 容器，而不是用 Init 容器加后台进程的方式模拟。

## 参考文献

- [Init Containers - kubernetes.io](https://kubernetes.io/zh/docs/concepts/workloads/pods/init-containers/)
- [Kubernetes 官方文档 - kubernetes.io](https://kubernetes.io/zh/docs/concepts/workloads/pods/)
