---
weight: 22
title: Node
date: 2022-05-21T00:00:00+08:00
lastmod: 2025-10-27T14:41:59.360Z
description: Kubernetes 集群中的工作节点管理，包括节点状态监控、资源管理和维护操作等核心概念和实践。
---

> 节点（Node）是 Kubernetes 集群资源管理的基础环节，合理运维节点可保障集群稳定与高效。

在 Kubernetes 集群中，节点（Node）是负责运行 Pod 和容器化应用的基础计算单元。每个节点可以是物理服务器或虚拟机，通过 kubelet 组件与集群控制平面通信，实现资源调度与健康监控。

## 节点状态信息

了解节点的状态信息有助于管理员及时发现和排查问题，保障集群的稳定运行。每个节点都包含以下关键状态信息：

### 地址信息（Address）

节点的地址信息用于标识和通信，主要包括：

- **HostName**：节点主机名，可通过 kubelet 的 `--hostname-override` 参数覆盖。
- **ExternalIP**：集群外部可路由访问的 IP 地址。
- **InternalIP**：集群内部通信使用的 IP 地址，外部无法直接访问。

### 节点条件（Condition）

节点条件反映节点的健康和可调度状态，常见类型如下：

- **Ready**：节点是否准备就绪接受 Pod 调度。
  - `True`：节点健康且可调度。
  - `False`：节点存在问题，不可调度。
  - `Unknown`：Node Controller 在 40 秒内未收到节点状态报告。
- **MemoryPressure**：节点内存资源紧张时为 `True`。
- **DiskPressure**：节点磁盘空间不足时为 `True`。
- **PIDPressure**：节点进程数接近限制时为 `True`。
- **NetworkUnavailable**：节点网络配置异常时为 `True`。

### 容量信息（Capacity）

节点的容量信息用于资源分配和调度，主要包括：

- **CPU**：可分配的 CPU 资源。
- **Memory**：可分配的内存资源。
- **Pods**：可运行的最大 Pod 数量。
- **Storage**：可用存储容量。

### 节点信息（NodeInfo）

节点信息包含系统和组件版本，便于运维管理：

- 操作系统版本
- Kubernetes 版本
- 容器运行时版本（如 containerd、Docker）
- kubelet 版本
- kube-proxy 版本

## 节点管理操作

合理的节点管理操作有助于保障业务连续性和集群健康。以下是常用的节点管理命令及说明。

### 禁止调度

当需要维护节点或避免新 Pod 调度时，可使用如下命令：

```bash
kubectl cordon <node-name>
```

### 驱逐 Pod

安全地将节点上的 Pod 迁移到其他节点，常用于节点维护或故障恢复：

```bash
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data
```

常用选项说明：

- `--ignore-daemonsets`：忽略 DaemonSet 管理的 Pod。
- `--delete-emptydir-data`：删除使用 emptyDir 卷的 Pod。
- `--force`：强制删除不受控制器管理的 Pod。
- `--grace-period=<seconds>`：设置优雅终止时间。

### 恢复调度

节点维护完成后，重新允许 Pod 调度：

```bash
kubectl uncordon <node-name>
```

## 节点维护最佳实践

在实际运维过程中，建议遵循以下节点维护最佳实践，以提升集群的稳定性和可维护性：

- **计划维护**：使用 `cordon` 和 `drain` 命令确保应用服务不中断。
- **监控资源**：定期检查节点的 CPU、内存和磁盘使用情况。
- **更新管理**：制定节点系统和 Kubernetes 组件的更新策略。
- **故障恢复**：准备节点故障时的应急响应流程。

## 查看节点信息

日常运维中，及时掌握节点的基本信息和资源使用情况对于集群健康管理至关重要。Kubernetes 提供了多种命令用于查看节点状态、详细配置以及实时资源消耗。

以下命令可用于节点信息查询：

```bash
# 查看所有节点
kubectl get nodes

# 查看节点详细信息
kubectl describe node <node-name>

# 查看节点资源使用情况
kubectl top node <node-name>
```

## 总结

本章节介绍了 Kubernetes 节点（Node）的核心概念、状态信息、管理操作及维护最佳实践。合理运维节点是保障集群高可用和业务稳定的基础，后续章节将进一步深入探讨节点相关高级功能与实战经验。
