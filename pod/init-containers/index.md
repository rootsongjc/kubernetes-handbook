---
weight: 14
title: Init 容器
date: '2022-05-21T00:00:00+08:00'
type: book
aliases:
  - /book/kubernetes-handbook/objects/init-containers/
description: 'Init 容器是一种专用的容器，在应用程序容器启动之前运行，用来包含一些应用镜像中不存在的实用工具或安装脚本。本文详细介绍 Init 容器的概念、用法和最佳实践。'
keywords:
- init
- kubernetes
- pod
- 启动
- 容器
- 应用
- 应用程序
- 版本
- 运行
- 镜像
---

Init 容器是 Kubernetes 中一种特殊的容器，它在应用程序容器启动之前运行，用来执行初始化任务。Init 容器可以包含一些应用镜像中不存在的实用工具或安装脚本，为主应用程序提供必要的前置条件。

## 什么是 Init 容器

Init 容器是运行在 Pod 中的特殊容器，它们在应用容器启动之前完成运行。一个 Pod 可以拥有多个 Init 容器，这些容器会按照定义的顺序依次执行。

### Init 容器的核心特性

- **顺序执行**：多个 Init 容器按照定义顺序一个接一个地运行
- **必须成功**：每个 Init 容器都必须成功完成，下一个容器才能启动
- **阻塞启动**：所有 Init 容器成功完成后，应用容器才开始启动
- **独立镜像**：Init 容器可以使用与应用容器不同的镜像

### 与普通容器的区别

Init 容器支持应用容器的大部分特性，但有以下重要区别：

| 特性 | Init 容器 | 应用容器 |
|------|-----------|----------|
| 运行方式 | 顺序执行，运行至完成 | 并行运行，持续运行 |
| 重启策略 | 失败时重启整个 Pod | 根据 restartPolicy 处理 |
| 就绪探针 | 不支持 readinessProbe | 支持各种探针 |
| 生命周期 | 一次性执行 | 长期运行 |

## Init 容器的使用场景

Init 容器在以下场景中非常有用：

### 1. 依赖服务检查

等待依赖的服务启动完成：

```bash
# 等待数据库服务可用
until nslookup mysql-service; do 
  echo "Waiting for mysql-service..."
  sleep 2
done
```

### 2. 数据预处理

- 下载配置文件或初始数据
- 克隆 Git 仓库到共享卷
- 生成动态配置文件

### 3. 权限和安全设置

- 修改文件权限
- 创建必要的用户账户
- 设置安全证书

### 4. 资源准备

- 初始化数据库 schema
- 创建必要的目录结构
- 安装依赖包

## 使用示例

### 基础示例

以下示例展示了一个包含两个 Init 容器的 Pod：

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

### 执行顺序

1. Pod 被调度到节点
2. 网络和存储卷初始化
3. Init 容器按顺序依次执行
4. 所有 Init 容器成功后，应用容器启动

### 失败处理

- 如果 Init 容器失败，Kubernetes 会根据 Pod 的 `restartPolicy` 重启 Pod
- `restartPolicy: Never` 时，Pod 不会重启
- `restartPolicy: Always` 或 `OnFailure` 时，会重启整个 Pod

### 重启场景

以下情况会导致 Init 容器重新执行：

- Init 容器镜像更新
- Pod 基础设施容器重启
- Pod 被删除重建

## 资源管理

### 资源请求和限制

Init 容器的资源需求计算规则：

- **有效初始请求**：所有 Init 容器中某资源的最大值
- **Pod 有效请求**：max(有效初始请求，所有应用容器请求之和)

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

Init 容器可以与应用容器共享存储卷：

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

### 查看 Pod 状态

```bash
# 查看 Pod 状态
kubectl get pod myapp-pod

# 查看详细信息
kubectl describe pod myapp-pod

# 查看 Init 容器日志
kubectl logs myapp-pod -c init-myservice
kubectl logs myapp-pod -c init-mydb
```

### 常见状态

- `Init:0/2`：2 个 Init 容器中的第 1 个正在运行
- `Init:1/2`：第 1 个 Init 容器完成，第 2 个正在运行
- `PodInitializing`：所有 Init 容器完成，Pod 正在初始化
- `Running`：Pod 启动成功

## 最佳实践

### 1. 保持幂等性

Init 容器的代码应该是幂等的，能够安全地重复执行：

```bash
# 好的做法：检查文件是否存在
if [ ! -f /data/config.json ]; then
  curl -o /data/config.json https://config-server/config.json
fi

# 避免：直接覆盖可能导致问题
# curl -o /data/config.json https://config-server/config.json
```

### 2. 设置合理的超时

使用 `activeDeadlineSeconds` 避免 Init 容器无限等待：

```yaml
spec:
  activeDeadlineSeconds: 300  # 5 分钟超时
  initContainers:
  - name: wait-service
    image: busybox
    command: ['sh', '-c', 'sleep 10']  # 模拟长时间任务
```

### 3. 适当的资源配置

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

### 4. 使用轻量级镜像

选择合适的基础镜像以减少启动时间：

- 使用 `alpine` 而不是 `ubuntu`
- 构建专用的 Init 容器镜像
- 利用多阶段构建减小镜像大小

## 版本兼容性

Init 容器在不同 Kubernetes 版本中的支持情况：

- **Kubernetes 1.6+**：使用 `spec.initContainers` 字段（推荐）
- **Kubernetes 1.5**：使用 beta 注解（已废弃）
- **当前版本**：完全支持，功能稳定

现代 Kubernetes 集群应始终使用 `spec.initContainers` 字段定义 Init 容器。
