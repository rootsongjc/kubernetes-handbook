---
weight: 74
title: 配置 Pod 的 liveness 和 readiness 探针
linktitle: Liveness 和 Readiness 探针
date: '2022-05-21T00:00:00+08:00'
type: book
description: >-
  学习如何在 Kubernetes 中配置 Pod 的存活探针和就绪探针，确保应用程序的健康状态监控和流量管理。本文详细介绍了三种探针类型：命令执行、HTTP
  请求和 TCP 套接字，以及相关的配置参数。
keywords:
  - http
  - kubelet
  - kubernetes
  - liveness
  - pod
  - probe
  - readiness
  - 失败
  - 容器
  - 返回
lastmod: '2025-08-23'
---

当你使用 Kubernetes 时，是否遇到过 Pod 在启动后不久就崩溃然后重新启动的恶性循环？你是否好奇 Kubernetes 如何检测 Pod 是否还存活？虽然容器已经启动，但 Kubernetes 如何知道容器的进程是否准备好对外提供服务？

本文将详细介绍如何配置容器的存活探针（liveness probe）和就绪探针（readiness probe），帮助你更好地管理 Kubernetes 中的应用程序健康状态。

## 探针概述

### Liveness Probe（存活探针）

Kubelet 使用 liveness probe 来确定何时重启容器。当应用程序处于运行状态但无法进行进一步操作时（如发生死锁），liveness 探针将检测到这种状态并重启容器，使应用程序在存在 bug 的情况下依然能够继续运行。

### Readiness Probe（就绪探针）

Kubelet 使用 readiness probe 来确定容器是否已经准备好接受流量。只有当 Pod 中的所有容器都处于就绪状态时，kubelet 才会认定该 Pod 处于就绪状态。这个信号控制着哪些 Pod 应该作为 Service 的后端。如果 Pod 处于非就绪状态，它们将从 Service 的负载均衡器中移除。

## 配置 Liveness 探针

### 基于命令的 Liveness 探针

许多长时间运行的应用程序最终会转换到损坏状态，除非重新启动，否则无法恢复。以下示例展示了如何配置基于命令执行的 liveness 探针：

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    test: liveness
  name: liveness-exec
spec:
  containers:
  - name: liveness
    image: registry.k8s.io/busybox
    args:
    - /bin/sh
    - -c
    - touch /tmp/healthy; sleep 30; rm -rf /tmp/healthy; sleep 600
    livenessProbe:
      exec:
        command:
        - cat
        - /tmp/healthy
      initialDelaySeconds: 5
      periodSeconds: 5
```

**配置说明：**

- `periodSeconds`：kubelet 每隔 5 秒执行一次 liveness probe
- `initialDelaySeconds`：kubelet 在第一次执行 probe 前等待 5 秒
- 探针通过执行 `cat /tmp/healthy` 命令检测容器健康状态
- 如果命令返回 0，kubelet 认为容器健康；返回非 0 值则重启容器

**测试流程：**

创建 Pod：

```bash
kubectl apply -f exec-liveness.yaml
```

在 30 秒内查看 Pod 状态：

```bash
kubectl describe pod liveness-exec
```

35 秒后再次查看，会发现 liveness probe 失败的事件：

```bash
kubectl get pod liveness-exec
```

### 基于 HTTP 的 Liveness 探针

HTTP GET 请求是另一种常用的 liveness probe 方式：

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    test: liveness
  name: liveness-http
spec:
  containers:
  - name: liveness
    image: registry.k8s.io/liveness
    args:
    - /server
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8080
        httpHeaders:
        - name: X-Custom-Header
          value: Awesome
      initialDelaySeconds: 3
      periodSeconds: 3
```

**工作原理：**

- kubelet 向容器的 8080 端口发送 HTTP GET 请求
- 访问路径为 `/healthz`
- HTTP 状态码在 200-399 范围内被认为是成功
- 其他状态码被认为是失败

### 基于 TCP 的 Liveness 探针

TCP Socket 检查是第三种 liveness probe 方式：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: goproxy
  labels:
    app: goproxy
spec:
  containers:
  - name: goproxy
    image: registry.k8s.io/goproxy:0.1
    ports:
    - containerPort: 8080
    livenessProbe:
      tcpSocket:
        port: 8080
      initialDelaySeconds: 15
      periodSeconds: 20
    readinessProbe:
      tcpSocket:
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 10
```

kubelet 尝试在指定端口上打开容器的套接字。如果可以建立连接，容器被认为是健康的；否则认为是失败的。

## 配置 Readiness 探针

Readiness 探针用于处理应用程序暂时无法对外提供服务的情况，例如应用程序在启动期间需要加载大量数据或配置文件。

```yaml
readinessProbe:
  exec:
    command:
    - cat
    - /tmp/healthy
  initialDelaySeconds: 5
  periodSeconds: 5
```

Readiness probe 的 HTTP 和 TCP 配置方式与 liveness probe 相同，只需将 `livenessProbe` 替换为 `readinessProbe`。

## 使用命名端口

可以使用命名的 ContainerPort 作为 HTTP 或 TCP 探针的目标：

```yaml
ports:
- name: liveness-port
  containerPort: 8080

livenessProbe:
  httpGet:
    path: /healthz
    port: liveness-port
```

## 探针配置参数

### 通用参数

- `initialDelaySeconds`：容器启动后第一次执行探测前的等待时间（默认 0 秒）
- `periodSeconds`：执行探测的频率（默认 10 秒，最小 1 秒）
- `timeoutSeconds`：探测超时时间（默认 1 秒，最小 1 秒）
- `successThreshold`：探测失败后，连续成功多少次才被认定为成功（默认 1，liveness 必须为 1）
- `failureThreshold`：探测成功后，连续失败多少次才被认定为失败（默认 3，最小 1）

### HTTP 探针特有参数

- `host`：连接的主机名（默认为 Pod IP）
- `scheme`：连接协议（默认 HTTP）
- `path`：HTTP 服务器的访问路径
- `httpHeaders`：自定义请求头
- `port`：访问的容器端口

## 最佳实践

1. **合理设置超时时间**：避免因网络延迟导致的误报
2. **区分使用场景**：
   - Liveness probe：检测应用程序是否需要重启
   - Readiness probe：检测应用程序是否准备好接收流量
3. **谨慎配置失败阈值**：避免因临时故障导致不必要的重启
4. **监控探针性能**：确保探针本身不会对应用程序造成负担

## 参考资料

- [Pod 生命周期 - Kubernetes 官方文档](https://kubernetes.io/zh-cn/docs/concepts/workloads/pods/pod-lifecycle/#container-probes)
- [配置存活、就绪和启动探针](https://kubernetes.io/zh-cn/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
