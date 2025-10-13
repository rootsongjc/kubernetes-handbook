---
weight: 30
title: ConfigMap
date: 2022-05-21T00:00:00+08:00
description: ConfigMap 是 Kubernetes 用于存储配置数据的 API 资源，支持将配置信息与容器镜像解耦。本文详细介绍 ConfigMap 的概念、创建方法以及在 Pod 中的使用方式。
lastmod: 2025-10-13T06:03:13.382Z
---

ConfigMap 是 Kubernetes 提供的配置管理机制，用于将配置信息与容器镜像解耦。应用程序可以从配置文件、命令行参数或环境变量中读取配置信息，而无需在每次配置修改时重新构建镜像。ConfigMap API 提供了向容器注入配置信息的能力，既可以保存单个属性，也可以保存完整的配置文件或 JSON 数据。

## ConfigMap 概览

**ConfigMap** 是 Kubernetes 的 API 资源，用于存储**键值对**配置数据。这些数据可以在 **Pod** 中使用，或者为系统组件存储配置信息。

### 主要特点

- **非敏感数据**：ConfigMap 专门处理不包含敏感信息的配置数据（敏感数据请使用 Secret）
- **配置解耦**：将配置与应用程序代码分离，便于管理和更新
- **多种用途**：可用作环境变量、命令行参数或配置文件

### 基本结构

以下是相关的代码示例：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: example-config
  namespace: default
data:
  database.host: "mysql.example.com"
  database.port: "3306"
  app.properties: |
    log.level=INFO
    cache.size=100
    timeout=30s
```

### 使用场景

ConfigMap 可以用于：

1. **环境变量**：设置容器的环境变量值
2. **命令行参数**：为容器提供启动参数
3. **配置文件**：在数据卷中创建配置文件
4. **应用配置**：存储应用程序的配置信息

## 创建 ConfigMap

Kubernetes 提供了多种创建 ConfigMap 的方法，可以使用 `kubectl create configmap` 命令。

### 使用目录创建

当你有多个配置文件时，可以通过目录批量创建：

```bash
# 假设有以下配置文件
$ ls config/
database.properties
logging.properties

$ cat config/database.properties
host=mysql.example.com
port=3306
database=myapp

$ cat config/logging.properties
level=INFO
format=json
output=stdout
```

创建 ConfigMap：

```bash
kubectl create configmap app-config --from-file=config/
```

查看创建的 ConfigMap：

```bash
$ kubectl describe configmap app-config
Name:         app-config
Namespace:    default
Labels:       <none>
Annotations:  <none>

Data
====
database.properties:    45 bytes
logging.properties:     42 bytes
```

### 使用单个文件创建

也可以从单个文件创建 ConfigMap：

```bash
# 从单个文件创建
kubectl create configmap database-config --from-file=config/database.properties

# 指定自定义键名
kubectl create configmap database-config --from-file=db-config=config/database.properties
```

### 使用字面值创建

直接在命令行中指定键值对：

```bash
kubectl create configmap app-settings \
  --from-literal=app.name=myapp \
  --from-literal=app.version=1.0.0 \
  --from-literal=debug.enabled=true
```

查看结果：

```yaml
$ kubectl get configmap app-settings -o yaml
apiVersion: v1
data:
  app.name: myapp
  app.version: 1.0.0
  debug.enabled: "true"
kind: ConfigMap
metadata:
  name: app-settings
  namespace: default
```

### 使用 YAML 文件创建

也可以直接编写 YAML 文件创建：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  database.url: "mysql://mysql.example.com:3306/myapp"
  redis.url: "redis://redis.example.com:6379"
  config.yaml: |
    server:
      port: 8080
      host: 0.0.0.0
    logging:
      level: INFO
      format: json
```

```bash
kubectl apply -f configmap.yaml
```

## 在 Pod 中使用 ConfigMap

### 作为环境变量使用

#### 引用单个键值

以下是相关的代码示例：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app-container
    image: nginx:1.20
    env:
    - name: DATABASE_HOST
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: database.host
    - name: DATABASE_PORT
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: database.port
```

#### 引用整个 ConfigMap

以下是相关的代码示例：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app-container
    image: nginx:1.20
    envFrom:
    - configMapRef:
        name: app-config
```

### 作为命令行参数使用

以下是具体的使用方法：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app-container
    image: nginx:1.20
    command: ["/bin/sh"]
    args: ["-c", "echo 'Database: $(DATABASE_HOST):$(DATABASE_PORT)'"]
    env:
    - name: DATABASE_HOST
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: database.host
    - name: DATABASE_PORT
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: database.port
```

### 作为数据卷使用

#### 挂载所有键值

以下是相关的代码示例：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app-container
    image: nginx:1.20
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
  volumes:
  - name: config-volume
    configMap:
      name: app-config
```

此时，ConfigMap 中的每个键都会成为 `/etc/config/` 目录下的一个文件。

#### 挂载特定键值

以下是相关的代码示例：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app-container
    image: nginx:1.20
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
  volumes:
  - name: config-volume
    configMap:
      name: app-config
      items:
      - key: database.host
        path: db/host
      - key: app.properties
        path: app/config.properties
```

#### 设置文件权限

以下是相关的代码示例：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app-container
    image: nginx:1.20
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
  volumes:
  - name: config-volume
    configMap:
      name: app-config
      defaultMode: 0644
      items:
      - key: app.properties
        path: app.properties
        mode: 0600
```

## 最佳实践

### 命名规范

- 使用描述性的名称
- 遵循 DNS 子域名规范
- 建议使用小写字母和连字符

### 数据组织

- 按功能或服务分组配置
- 避免在单个 ConfigMap 中存储过多数据
- 考虑使用多个小的 ConfigMap 而不是一个大的

### 版本管理

- 通过标签管理不同版本的配置
- 使用 Deployment 的滚动更新机制
- 考虑使用 Helm 等工具管理配置

### 安全考虑

- 不要在 ConfigMap 中存储敏感信息
- 使用 Secret 存储密码、密钥等敏感数据
- 定期审查配置内容

### 更新策略

- ConfigMap 更新后，Pod 需要重启才能生效（除非使用 subPath）
- 考虑使用 Deployment 的配置更新策略
- 监控配置变更对应用的影响

通过合理使用 ConfigMap，可以有效地管理 Kubernetes 应用的配置信息，实现配置与代码的解耦，提高应用的可维护性和可移植性。
