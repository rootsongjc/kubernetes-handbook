---
weight: 55
part_id: part-ii
title: 集群安全性管理
linktitle: 安全
date: 2022-05-21T00:00:00+08:00
description: 全面介绍 Kubernetes 集群安全管理的核心概念、最佳实践和实施策略，包括身份认证、授权控制、网络安全、Pod 安全标准等关键安全机制。
icon: fa-solid fa-shield-alt
lastmod: 2025-11-04T02:02:55.919Z
---

Kubernetes 作为容器编排平台，需要在多租户环境中确保集群安全。安全管理涵盖身份认证与授权、准入控制、网络安全、Pod 安全和密钥管理等方面。建议遵循最小权限原则、定期审计、及时更新组件、镜像安全扫描和网络分段等最佳实践，以构建安全可靠的容器化环境。

{{< section-toc show_summary="true" style="cards"  >}}
