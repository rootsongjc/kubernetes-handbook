---
weight: 12
title: Pod 概览
date: '2017-03-10T00:00:00+08:00'
type: book
aliases:
  - /book/kubernetes-handbook/objects/pod-overview/
description: 深入了解 Kubernetes 中最基本的部署单元 Pod，包括其核心概念、使用模式、资源共享机制以及与控制器的关系。
keywords:
- controller
- kubernetes
- node
- pod
- 共享
- 创建
- 实例
- 容器
- 运行
- 重启
---

本文将为你深入讲解 Pod 的核心概念和最佳实践。

## 什么是 Pod

Pod 是 Kubernetes 中可以创建和部署的**最小调度单元**。Pod 代表集群中运行的一个或多个容器的集合。

Pod 封装了以下内容：

- 一个或多个应用容器
- 共享的存储卷（Volumes）
- 唯一的网络 IP 地址
- 容器运行策略配置

Pod 代表一个部署单元：Kubernetes 中单个应用实例，通常由一个或多个紧密协作的容器组成。

> **容器运行时支持**：虽然 [Docker](https://www.docker.com) 曾是最常用的容器运行时，但 Kubernetes 现在支持多种符合 CRI（Container Runtime Interface）标准的运行时，如 containerd、CRI-O 等。

## Pod 的使用模式

在 Kubernetes 集群中，Pod 有以下两种主要使用模式：

### 单容器 Pod

**一个 Pod 运行一个容器** - 这是最常见的使用模式。在这种模式下：

- Pod 作为单个容器的包装器
- Kubernetes 管理 Pod，而不是直接管理容器
- 提供了比直接管理容器更高层次的抽象

### 多容器 Pod

**一个 Pod 运行多个容器** - 适用于需要紧密协作的容器场景：

- 容器之间需要共享资源和数据
- 容器需要在同一网络命名空间中通信
- 典型的边车（Sidecar）模式应用

常见的多容器模式包括：

- **边车模式**：主容器与辅助容器协作（如日志收集、代理）
- **大使模式**：代理容器处理外部通信
- **适配器模式**：转换容器输出格式

### 学习资源

以下 Kubernetes 官方博客文章提供了更详细的 Pod 使用模式：

- [The Distributed System Toolkit: Patterns for Composite Containers](https://kubernetes.io/blog/2015/06/the-distributed-system-toolkit-patterns/)
- [Container Design Patterns](https://kubernetes.io/blog/2016/06/container-design-patterns/)

## Pod 中的资源共享

Pod 中的多个容器共享以下资源：

### 网络共享

- 每个 Pod 分配唯一的 IP 地址
- Pod 内所有容器共享网络命名空间
- 容器间可通过 `localhost` 通信
- 共享端口空间，避免端口冲突

### 存储共享

- Pod 可定义多个共享卷（Volumes）
- 所有容器可访问这些共享卷
- 支持数据持久化和容器间数据交换
- 常用于配置文件、日志文件共享

### 示例架构

下图展示了一个典型的多容器 Pod 架构：

![Pod 示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/objects/pod-overview/pod-overview.webp)
{width=600 height=400}

## Pod 的生命周期管理

### 为什么不直接使用 Pod

在生产环境中，很少直接创建和管理单个 Pod，原因如下：

- **短暂性**：Pod 是临时的、用后即焚的实体
- **不自愈**：Pod 故障后不会自动重启或重新调度
- **无副本管理**：单个 Pod 无法提供高可用性

### Pod 与控制器

Kubernetes 使用控制器（Controller）来管理 Pod，提供以下能力：

| 控制器类型 | 用途 | 特点 |
|------------|------|------|
| [Deployment](../../controllers/deployment) | 无状态应用 | 副本管理、滚动更新 |
| [StatefulSet](../../controllers/statefulset) | 有状态应用 | 有序部署、持久化存储 |
| [DaemonSet](../../controllers/daemonset) | 节点级服务 | 每个节点运行一个 Pod |
| [Job](../../controllers/job) | 批处理任务 | 一次性任务执行 |
| [CronJob](../../controllers/cronjob) | 定时任务 | 按计划执行任务 |

### Pod 扩缩容

如需运行应用的多个实例：

- 创建多个 Pod，每个作为独立的应用实例
- 在 Kubernetes 中称为**副本（Replication）**
- 通常由控制器自动管理副本数量

## Pod 模板

Pod 模板（Pod Template）定义了 Pod 的规格，可以嵌入到各种控制器中：

```yaml
apiVersion: v1
kind: Pod
metadata:
    name: example-pod
spec:
    containers:
    - name: app-container
        image: nginx:1.21
        ports:
        - containerPort: 80
```

控制器使用 Pod 模板来创建和管理实际的 Pod 实例，确保应用的可靠性和可扩展性。

## 最佳实践

1. **优先使用控制器**：避免直接创建 Pod，使用 Deployment 等控制器
2. **合理设计容器**：一个 Pod 中的容器应该紧密相关
3. **资源限制**：为容器设置适当的资源请求和限制
4. **健康检查**：配置存活探针和就绪探针
5. **标签管理**：使用标签进行 Pod 的分类和选择
