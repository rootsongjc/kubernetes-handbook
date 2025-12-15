---
weight: 62
part_id: part-ii
title: 扩展 Kubernetes
date: 2022-05-21T00:00:00+08:00
type: book
description: 了解如何通过自定义资源定义（CRD）、API 扩展、Operator 模式等方式扩展 Kubernetes 集群功能，构建符合特定需求的云原生应用平台。
icon: fa-solid fa-puzzle-piece
lastmod: 2025-11-04T02:02:55.897Z
---

Kubernetes 采用高度可扩展的架构，支持通过自定义资源定义（CRD）、API 聚合、准入控制器、Operator、设备插件、网络插件（CNI）、存储插件（CSI）等方式扩展集群功能。这些机制允许用户定义新的 API 类型、扩展 API 服务器、实现自定义校验与自动化管理，集成专用硬件和外部系统。扩展时应保持声明式 API、一致的控制器模式、良好的可观测性，并确保兼容性和稳定性。

{{< section-toc show_summary="true" style="cards"  >}}
