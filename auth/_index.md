---
weight: 43
title: 身份与权限认证
date: '2022-05-21T00:00:00+08:00'
type: book
description: >-
  深入了解 Kubernetes 中的身份认证与权限管理机制，包括 RBAC、ServiceAccount 等核心概念，以及 SPIFFE/SPIRE
  等现代身份管理解决方案在云原生环境中的应用。
icon: fa-solid fa-user-shield
lastmod: '2025-08-20'
---

Kubernetes 提供了多租户身份认证与权限管理机制，通过 RBAC、ServiceAccount 和安全策略，保障集群资源安全。身份认证不仅用于集群内部，也支持分布式应用的统一身份管理。SPIFFE 作为云原生身份标准，配合 SPIRE 实现自动化证书管理和零信任架构，广泛集成于主流云原生项目。身份与权限管理是 Kubernetes 安全体系的基础。

{{< list_children show_summary="true" style="cards"  >}}
