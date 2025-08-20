---
weight: 28
title: 控制器
date: '2022-05-21T00:00:00+08:00'
type: book
description: 深入了解 Kubernetes 中的各种控制器，包括 Deployment、StatefulSet、DaemonSet 等，掌握它们的工作原理和使用场景。
icon: fa-solid fa-sliders-h
lastmod: '2025-08-20'
---

Kubernetes 中内建了多种控制器（Controller），它们是集群中的核心组件，负责监控集群的实际状态并使其向期望状态收敛。每个控制器都可以看作是一个状态机，通过控制循环（Control Loop）来管理和调节 Pod 及其他资源的生命周期。

控制器的主要职责包括：

- **状态监控**：持续监控资源的当前状态
- **差异检测**：比较当前状态与期望状态的差异
- **状态调节**：执行必要的操作以消除状态差异
- **事件响应**：对集群中的事件做出相应的反应

所有控制器都遵循相同的基本模式：

1. **观察**：通过 API Server 监听相关资源的变化
2. **分析**：分析当前状态与期望状态的差异
3. **执行**：采取行动来修正差异
4. **重复**：持续循环执行上述过程

这种设计模式确保了 Kubernetes 集群的自愈能力和声明式管理特性。

{{< list_children show_summary="true" style="cards"  >}}
