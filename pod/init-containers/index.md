---
weight: 14
title: Init 容器
date: 2022-05-21T00:00:00+08:00
aliases:
  - /book/kubernetes-handbook/objects/init-containers/
description: Init 容器是一种专用的容器，在应用程序容器启动之前运行，用来包含一些应用镜像中不存在的实用工具或安装脚本。本文详细介绍 Init 容器的概念、用法和最佳实践。
lastmod: 2025-10-27T13:26:42.274Z
---

> Init 容器是 Kubernetes Pod 生命周期管理中的关键机制，专为初始化任务和依赖准备而设计，提升了应用部署的灵活性和可维护性。

## 什么是 Init 容器

Init 容器（Init Container）是运行在 Pod 中的特殊容器，在应用容器启动之前依次执行，用于完成初始化任务。每个 Pod 可以包含多个 Init 容器，这些容器会按照定义顺序依次运行。

### Init 容器的核心特性

{{< table title="Init 容器与应用容器的核心特性对比" >}}

| 特性         | Init 容器                   | 应用容器                   |
|--------------|----------------------------|----------------------------|
| 运行方式     | 顺序执行，运行至完成        | 并行运行，持续运行         |
| 重启策略     | 失败时重启整个 Pod         | 根据 restartPolicy 处理    |
| 就绪探针     | 不支持 readinessProbe      | 支持各种探针               |
| 生命周期     | 一次性执行                 | 长期运行                   |

{{< /table >}}

- **顺序执行**：多个 Init 容器按照定义顺序一个接一个地运行
- **必须成功**：每个 Init 容器都必须成功完成，下一个容器才能启动
- **阻塞启动**：所有 Init 容器成功完成后，应用容器才开始启动
- **独立镜像**：Init 容器可以使用与应用容器不同的镜像

### 与普通容器的区别

Init 容器支持应用容器的大部分特性，但在生命周期、重启策略等方面有显著差异。

## Init 容器的使用场景

Init 容器适用于多种初始化和依赖准备场景。常见用例如下：

- **依赖服务检查**：等待数据库、缓存等依赖服务就绪
- **数据预处理**：下载配置文件、克隆 Git 仓库、生成动态配置
- **权限和安全设置**：修改文件权限、创建用户、设置证书
- **资源准备**：初始化数据库 schema、创建目录结构、安装依赖包

下图展示了 Init 容器在 Pod 启动流程中的作用：

```mermaid "Init 容器执行流程"
graph TD
    A[Pod 调度到节点] --> B[网络和存储卷初始化]
    B --> C[Init 容器 1 执行]
    C --> D[Init 容器 2 执行]
    D --> E[所有 Init 容器完成]
    E --> F[应用容器启动]
```

![Init 容器执行流程](96277efc8363e49a5e8c906089ee4622.svg)
{width=1920 height=7804}

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

- 若 Init 容器失败，Kubernetes 会根据 Pod 的 `restartPolicy` 重启 Pod
- `restartPolicy: Never` 时，Pod 不会重启
- `restartPolicy: Always` 或 `OnFailure` 时，会重启整个 Pod

以下情况会导致 Init 容器重新执行：

- Init 容器镜像更新
- Pod 基础设施容器重启
- Pod 被删除重建

## 资源管理

Init 容器的资源请求和限制有独特的计算方式：

- **有效初始请求**：所有 Init 容器中某资源的最大值
- **Pod 有效请求**：max(有效初始请求，所有应用容器请求之和)

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

## 版本兼容性

{{< table title="Init 容器在不同 Kubernetes 版本中的支持情况" >}}

| 版本           | 支持方式                  | 说明           |
| -------------- | ------------------------- | -------------- |
| Kubernetes 1.6+| `spec.initContainers` 字段 | 推荐，主流用法 |
| Kubernetes 1.5 | beta 注解                 | 已废弃         |
| 当前版本       | 完全支持                  | 功能稳定       |

{{< /table >}}

现代 Kubernetes 集群应始终使用 `spec.initContainers` 字段定义 Init 容器。

## 总结

Init 容器为 Kubernetes Pod 提供了灵活的初始化机制，适用于依赖检查、数据准备、安全配置等多种场景。通过合理设计 Init 容器及其资源配置，可显著提升应用部署的可靠性和自动化水平。建议在实际项目中充分利用 Init 容器，规范初始化流程，提升集群运维效率。

## 参考文献

- [Init Containers - kubernetes.io](https://kubernetes.io/zh/docs/concepts/workloads/pods/init-containers/)
- [Kubernetes 官方文档 - kubernetes.io](https://kubernetes.io/zh/docs/concepts/workloads/pods/)
