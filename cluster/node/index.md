---
weight: 22
title: Node
date: '2022-05-21T00:00:00+08:00'
type: book
description: 'Kubernetes 集群中的工作节点管理，包括节点状态监控、资源管理和维护操作等核心概念和实践。'
keywords:
- kubernetes
- node
- kubelet
- pod
- 集群管理
- 节点维护
- 资源监控
---

Node 是 Kubernetes 集群中的工作节点，负责运行 Pod 和容器化应用。每个 Node 可以是物理服务器或虚拟机，通过 kubelet 组件与集群控制平面通信。

## 节点状态信息

每个 Node 都包含以下关键状态信息：

### 地址信息 (Address)

- **HostName**：节点的主机名，可通过 kubelet 的 `--hostname-override` 参数覆盖
- **ExternalIP**：集群外部可路由访问的 IP 地址
- **InternalIP**：集群内部通信使用的 IP 地址，外部无法直接访问

### 节点条件 (Condition)

- **Ready**：节点是否准备就绪接受 Pod 调度
  - `True`：节点健康且可调度
  - `False`：节点存在问题，不可调度
  - `Unknown`：Node Controller 在 40 秒内未收到节点状态报告
- **MemoryPressure**：节点内存资源紧张时为 `True`
- **DiskPressure**：节点磁盘空间不足时为 `True`
- **PIDPressure**：节点进程数接近限制时为 `True`
- **NetworkUnavailable**：节点网络配置异常时为 `True`

### 容量信息 (Capacity)

- **CPU**：可分配的 CPU 资源
- **Memory**：可分配的内存资源
- **Pods**：可运行的最大 Pod 数量
- **Storage**：可用存储容量

### 节点信息 (NodeInfo)

包含节点的系统信息：

- 操作系统版本
- Kubernetes 版本
- 容器运行时版本（如 containerd、Docker）
- kubelet 版本
- kube-proxy 版本

## 节点管理操作

### 禁止调度

防止新的 Pod 调度到指定节点：

```bash
kubectl cordon <node-name>
```

### 驱逐 Pod

安全地将节点上的 Pod 迁移到其他节点：

```bash
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data
```

常用选项说明：

- `--ignore-daemonsets`：忽略 DaemonSet 管理的 Pod
- `--delete-emptydir-data`：删除使用 emptyDir 卷的 Pod
- `--force`：强制删除不受控制器管理的 Pod
- `--grace-period=<seconds>`：设置优雅终止时间

### 恢复调度

节点维护完成后，重新允许 Pod 调度：

```bash
kubectl uncordon <node-name>
```

## 节点维护最佳实践

1. **计划维护**：使用 `cordon` 和 `drain` 命令确保应用服务不中断
2. **监控资源**：定期检查节点的 CPU、内存和磁盘使用情况
3. **更新管理**：制定节点系统和 Kubernetes 组件的更新策略
4. **故障恢复**：准备节点故障时的应急响应流程

## 查看节点信息

在日常运维中，了解和掌握节点的基本信息和资源使用情况对于集群健康管理至关重要。Kubernetes 提供了多种命令用于查看节点的状态、详细配置以及实时资源消耗，便于管理员及时发现和排查问题。

```bash
# 查看所有节点
kubectl get nodes

# 查看节点详细信息
kubectl describe node <node-name>

# 查看节点资源使用情况
kubectl top node <node-name>
```
