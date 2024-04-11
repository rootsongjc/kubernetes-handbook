---
weight: 6
title: 开放接口
date: '2022-05-21T00:00:00+08:00'
type: book
---

Kubernetes 作为云原生应用的基础调度平台，相当于云原生的操作系统，为了便于系统的扩展，Kubernetes 中开放的以下接口，可以分别对接不同的后端，来实现自己的业务逻辑：

- [容器运行时接口（CRI）](cri)：提供计算资源
- [容器网络接口（CNI）](cni)：提供网络资源
- [容器存储接口（CSI）](csi)，提供存储资源

以上三种资源相当于一个分布式操作系统的最基础的几种资源类型，而 Kuberentes 是将他们粘合在一起的纽带。

## 本节大纲

{{< list_children show_summary="false">}}
