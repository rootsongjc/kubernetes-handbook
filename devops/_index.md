---
weight: 99
title: 在 Kubernetes 中开发部署应用
linktitle: 部署应用
description: 探讨如何将传统应用迁移到 Kubernetes 以及在 Kubernetes 中开发云原生应用的最佳实践，包括服务发现、应用设计和部署策略等关键要素。
date: '2022-05-21T00:00:00+08:00'
type: book
icon: fa-solid fa-tools
lastmod: '2025-08-09'
---

将应用迁移到 Kubernetes 时，需关注架构设计和服务发现。适合在 Kubernetes 运行的应用包括基于服务名或主机名发现服务的应用、无状态应用和容器化友好的应用。传统依赖硬编码 IP 的应用需改造以适应 Pod 动态 IP。迁移单体应用时，建议逐步演进为微服务，利用 ConfigMap 和 Secret 管理配置，合理使用 PersistentVolume 处理有状态需求，并适配 Kubernetes 的服务发现。

Kubernetes 为新开发的云原生应用提供自动化部署、弹性伸缩、服务网格集成、可观测性和多环境一致性等优势。开发部署时，建议采用微服务架构，配置健康检查，合理设置资源限制，强化安全策略，并集成监控和日志系统。

{{< list_children show_summary="true" style="cards" >}}
