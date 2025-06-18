---
weight: 15
title: Pause 容器
date: '2022-05-21T00:00:00+08:00'
type: book
aliases:
  - /book/kubernetes-handbook/objects/pause-container/
description: 深入探究 Kubernetes 中 Pause 容器（Infra 容器）的作用与原理，了解它如何实现 Pod 内容器间的网络命名空间共享，以及在 Pod 生命周期管理中的关键作用。
keywords:
- container
- infra
- namespace
- nginx
- pause
- pod
- 共享
- 容器
- 网络
---

Pause 容器，又称 Infra 容器，是 Kubernetes Pod 架构中的核心组件。本文将深入探究该容器的作用与实现原理。

## Pause 容器配置

在 kubelet 的配置中，我们可以看到 Pause 容器的相关参数：

```bash
# Kubernetes 默认配置
--pod-infra-container-image=registry.k8s.io/pause:3.9

# 早期版本配置（已过时）
--pod-infra-container-image=gcr.io/google_containers/pause-amd64:3.0
```

> **注意**：从 Kubernetes 1.25 开始，默认的 Pause 容器镜像已更新为 `registry.k8s.io/pause:3.9`，并且支持多架构。

Pause 容器是可以自定义的，官方源代码位于 [Kubernetes GitHub 仓库](https://github.com/kubernetes/kubernetes/tree/master/build/pause)，使用 C 语言编写。

## 容器特点

Pause 容器具有以下显著特点：

- **轻量级**：镜像极小，约 300-700KB
- **持久运行**：永远处于 Pause（暂停）状态
- **多架构支持**：支持 AMD64、ARM64 等多种架构
- **资源消耗极低**：几乎不消耗 CPU 和内存资源

## 设计背景

Pod 作为 Kubernetes 的基本调度单元，本质上是一个逻辑概念。要实现 Pod 内多个容器之间高效共享资源和数据，需要解决的核心问题是：**如何打破容器间的 Linux Namespace 和 cgroups 隔离**。

Kubernetes 采用了巧妙的设计方案，通过 Pause 容器来解决这个问题，主要涉及两个方面：

1. **网络共享**：通过 Network Namespace 共享
2. **存储共享**：通过 Volume 挂载

## 实现原理

### 网络共享机制

Pod 内多个容器的网络共享通过以下步骤实现：

1. **创建 Pause 容器**：每个 Pod 启动时，首先创建一个 Pause 容器
2. **建立网络命名空间**：Pause 容器创建并持有 Network Namespace
3. **容器加入命名空间**：其他业务容器通过 `--net=container:pause` 方式加入到同一个 Network Namespace

```mermaid
graph TD "网络共享机制"
    A[Pod 创建] --> B[启动 Pause 容器]
    B --> C[创建 Network Namespace]
    C --> D[业务容器 A 加入]
    C --> E[业务容器 B 加入]
    D --> F[共享网络资源]
    E --> F
```

### 关键特性

- **统一网络视图**：Pod 内所有容器看到相同的网络设备、IP 地址、MAC 地址
- **生命周期管理**：Pod 的生命周期等同于 Pause 容器的生命周期
- **独立更新**：可以单独更新 Pod 内的某个业务容器，而无需重建整个 Pod

## 实际作用

### 主要功能

Pause 容器在 Pod 中承担以下关键职责：

1. **命名空间共享基础**
   - Network Namespace 共享
   - IPC Namespace 共享  
   - PID Namespace 共享

2. **Init 进程角色**
   - 作为 Pod 内的 PID 1 进程
   - 负责回收僵尸进程
   - 处理信号传递

### 查看运行状态

在任意 Kubernetes 节点上，都可以看到运行中的 Pause 容器：

```bash
$ crictl ps | grep pause
9cec6c0ef583   registry.k8s.io/pause:3.9   3 hours ago   Running   k8s_POD_nginx-deployment-...
5a5ef33b0d58   registry.k8s.io/pause:3.9   3 hours ago   Running   k8s_POD_redis-cluster-...
```

## 实战演示

以下示例演示了 Pause 容器的工作原理：

![Pause 容器示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/objects/pause-container/pause-container.webp)
{width=1598 height=948}

### 步骤一：启动 Pause 容器

```bash
docker run -d --name pause -p 8880:80 --ipc=shareable registry.k8s.io/pause:3.9
```

### 步骤二：创建 Nginx 配置并启动容器

```bash
cat <<EOF > nginx.conf
error_log stderr;
events { worker_connections 1024; }
http {
    access_log /dev/stdout combined;
    server {
        listen 80 default_server;
        server_name example.com www.example.com;
        location / {
            proxy_pass http://127.0.0.1:2368;
        }
    }
}
EOF

docker run -d --name nginx \
  -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf \
  --net=container:pause \
  --ipc=container:pause \
  --pid=container:pause \
  nginx
```

### 步骤三：启动 Ghost 应用容器

```bash
docker run -d --name ghost \
  --net=container:pause \
  --ipc=container:pause \
  --pid=container:pause \
  ghost
```

现在访问 `http://localhost:8880/` 即可看到 Ghost 博客界面。

### 验证共享效果

进入 Ghost 容器查看进程：

```bash
$ docker exec -it ghost ps aux
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.0   1024     4 ?        Ss   13:49   0:00 /pause
root         5  0.0  0.1  32432  5736 ?        Ss   13:51   0:00 nginx: master process
systemd+     9  0.0  0.0  32980  3304 ?        S    13:51   0:00 nginx: worker process
node        10  0.3  2.0 1254200 83788 ?       Ssl  13:53   0:03 node current/index.js
```

可以看到：

- Pause 容器进程 PID 为 1（Init 进程）
- 所有容器进程在同一个 PID 命名空间中
- 容器间可以通过 `localhost` 直接通信

## 版本演进

| Kubernetes 版本 | Pause 容器版本 | 主要变化 |
|------------------|----------------|----------|
| 1.20 及以前 | pause:3.2 | 基础功能 |
| 1.21-1.24 | pause:3.5 | 多架构支持 |
| 1.25+ | pause:3.9 | 镜像仓库迁移到 registry.k8s.io |

## 最佳实践

1. **镜像选择**：使用与集群版本匹配的 Pause 容器镜像
2. **网络配置**：确保 Pause 容器镜像在所有节点上可用
3. **监控观察**：通过 Pause 容器状态判断 Pod 健康状态
4. **故障排查**：Pause 容器异常通常意味着整个 Pod 存在问题

## 参考资料

- [The Almighty Pause Container - Ian Lewis](https://www.ianlewis.org/en/almighty-pause-container)
- [Kubernetes Pause Container Source Code](https://github.com/kubernetes/kubernetes/tree/master/build/pause)
- [Kubernetes Container Runtime Interface](https://kubernetes.io/docs/concepts/architecture/cri/)
