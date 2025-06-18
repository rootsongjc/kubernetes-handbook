---
weight: 16
title: Sidecar 容器
date: '2025-06-16T00:00:00+08:00'
type: book
aliases:
  - /book/kubernetes-handbook/objects/sidecar-container/
description: 介绍 Kubernetes 中 Sidecar 容器模式的概念、使用场景和最佳实践
---

## 什么是 Sidecar 容器

Sidecar 容器是 Kubernetes 中一种重要的设计模式，它指的是在同一个 Pod 中运行的辅助容器，用来增强或扩展主容器的功能。就像摩托车的边车一样，Sidecar 容器与主容器紧密配合，共享相同的网络和存储资源。

## Sidecar 容器的特点

- **共享资源**：与主容器共享网络命名空间、存储卷和生命周期
- **松耦合**：功能独立，可以单独更新和维护
- **透明性**：对主应用透明，不需要修改主应用代码
- **可重用性**：可以在多个不同的应用中复用

## 常见使用场景

### 1. 日志收集

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-sidecar
spec:
  containers:
  - name: app
    image: my-app:latest
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log
  - name: log-collector
    image: fluent/fluent-bit:latest
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log
  volumes:
  - name: shared-logs
    emptyDir: {}
```

### 2. 服务网格代理

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-proxy
spec:
  containers:
  - name: app
    image: my-app:latest
    ports:
    - containerPort: 8080
  - name: envoy-proxy
    image: envoyproxy/envoy:latest
    ports:
    - containerPort: 9901
```

### 3. 配置热更新

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-config-watcher
spec:
  containers:
  - name: app
    image: my-app:latest
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
  - name: config-watcher
    image: config-watcher:latest
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
  volumes:
  - name: config-volume
    configMap:
      name: app-config
```

## 与 Init 容器的区别

| 特性 | Sidecar 容器 | Init 容器 |
|------|-------------|-----------|
| 运行时机 | 与主容器同时运行 | 在主容器启动前运行 |
| 生命周期 | 与主容器相同 | 运行完成后退出 |
| 数量限制 | 可以有多个 | 可以有多个，但按顺序执行 |
| 主要用途 | 提供持续的辅助服务 | 执行初始化任务 |

## 最佳实践

### 1. 资源管理

```yaml
containers:
- name: sidecar
  image: sidecar:latest
  resources:
    requests:
      memory: "64Mi"
      cpu: "50m"
    limits:
      memory: "128Mi"
      cpu: "100m"
```

### 2. 健康检查

```yaml
containers:
- name: sidecar
  image: sidecar:latest
  livenessProbe:
    httpGet:
      path: /health
      port: 8080
    initialDelaySeconds: 30
    periodSeconds: 10
```

### 3. 优雅关闭

```yaml
containers:
- name: sidecar
  image: sidecar:latest
  lifecycle:
    preStop:
      exec:
        command: ["/bin/sh", "-c", "sleep 10"]
```

## 注意事项

1. **资源消耗**：每个 Sidecar 容器都会消耗额外的 CPU 和内存资源
2. **复杂性**：增加了 Pod 的复杂性，调试和监控变得更加困难
3. **网络通信**：需要考虑容器间的网络通信和端口冲突
4. **版本管理**：需要协调主容器和 Sidecar 容器的版本更新

## 总结

Sidecar 容器模式是 Kubernetes 中实现关注点分离的重要方式，它允许我们将横切关注点（如日志、监控、安全等）从主应用中分离出来，提高了应用的模块化程度和可维护性。在使用时需要权衡其带来的好处和额外的复杂性。
