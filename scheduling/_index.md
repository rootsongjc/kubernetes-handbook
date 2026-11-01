---
weight: 7
part_id: part-i
title: 调度与弹性
linktitle: 调度与弹性
date: 2026-11-01T00:00:00+08:00
type: book
description: 系统讲解 Kubernetes 的调度与资源管理：kube-scheduler 原理、调度约束、优先级与抢占、QoS、配额与 LimitRange、kubelet 节点资源管理，以及 HPA/VPA/KEDA、节点自动扩缩与批处理调度器构成的弹性体系。
icon: fa-solid fa-scale-balanced
lastmod: 2026-11-01T00:00:00+08:00
---

调度决定 Pod 运行在哪里，资源管理决定它能用多少，弹性机制决定在负载变化时如何自动增减——三者共同构成 Kubernetes 高效利用算力的核心。本章先从 kube-scheduler 的工作原理与调度约束讲起，再覆盖优先级与抢占、QoS、ResourceQuota 与 LimitRange、kubelet 在节点侧的预留与驱逐，最后把工作负载层的 HPA、VPA、KEDA 与节点层的 Cluster Autoscaler、Karpenter 以及面向批处理与 AI 的 Volcano 串成完整的弹性链路。

{{< section-toc show_summary="true" style="cards"  >}}
