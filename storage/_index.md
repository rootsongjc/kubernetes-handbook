---
weight: 54
title: 存储
date: 2022-05-21T00:00:00+08:00
description: 深入了解 Kubernetes 存储机制，包括 Secret、ConfigMap、Volume、PV、PVC、StorageClass 等核心存储对象的使用方法和最佳实践。
icon: fa-solid fa-database
lastmod: 2025-11-04T02:02:55.927Z
---

Kubernetes 提供了丰富的存储机制，支持数据持久化和配置管理，满足不同场景下的需求。常用存储对象包括 Secret（安全存储敏感信息）、ConfigMap（管理非敏感配置）、Volume（为 Pod 提供存储卷）、PersistentVolume（集群级存储资源）、PersistentVolumeClaim（用户存储请求）以及 StorageClass（定义存储类别和动态供应策略）。Kubernetes 存储架构具备抽象化、动态供应、插件化和完整生命周期管理等优势。通过学习这些内容，你可以为生产环境设计和实现可靠的存储方案。

{{< section-toc show_summary="true" style="cards"  >}}
