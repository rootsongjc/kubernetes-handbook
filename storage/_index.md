---
weight: 54
title: 存储
date: '2022-05-21T00:00:00+08:00'
type: book
description: "深入了解 Kubernetes 存储机制，包括 Secret、ConfigMap、Volume、PV、PVC、StorageClass 等核心存储对象的使用方法和最佳实践。"
---

在现代容器化应用中，数据持久化和配置管理是至关重要的。Kubernetes 提供了完整的存储解决方案来满足不同场景的需求。

## 存储资源概览

Kubernetes 存储系统主要包含以下核心组件：

- **Secret**：安全地存储和管理敏感信息，如密码、OAuth 令牌、SSH 密钥等
- **ConfigMap**：存储非敏感的配置数据，实现配置与应用代码的分离
- **Volume**：为 Pod 提供存储卷，支持多种存储后端
- **PersistentVolume (PV)**：集群级别的存储资源抽象
- **PersistentVolumeClaim (PVC)**：用户对存储资源的请求
- **StorageClass**：定义存储类别和动态供应策略

## 存储架构特点

Kubernetes 存储架构具有以下优势：

- **抽象化**：通过统一的 API 屏蔽底层存储实现差异
- **动态供应**：支持根据需求自动创建存储资源
- **插件化**：通过 CSI（Container Storage Interface）支持多种存储后端
- **生命周期管理**：提供完整的存储资源生命周期管理

## 学习路径

本章节将按照以下结构为你深入讲解 Kubernetes 存储系统：

{{< list_children show_summary="true" style="cards" >}}

通过系统学习这些存储对象，你将能够在生产环境中设计和实施可靠的存储解决方案。
