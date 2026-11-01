---
weight: 12
part_id: part-ii
title: 安全
linktitle: 安全
date: 2022-05-21T00:00:00+08:00
description: 构建 Kubernetes 的纵深防御：Pod 安全准入与安全上下文、静态数据加密、审计日志、多租户隔离、软件供应链安全、网络策略与安全最佳实践。
icon: fa-solid fa-shield-alt
lastmod: 2026-11-01T00:00:00+08:00
---

Kubernetes 的安全是分层的：工作负载层由 Pod 安全准入与安全上下文约束容器的权限边界，数据层由静态加密保护 etcd 中的密文，审计日志记录控制面上的每个操作，多租户隔离把命名空间、配额、网络策略与准入控制组合成租户边界，供应链安全则把防线前移到镜像构建与分发环节。本章逐层展开这些机制，并以安全最佳实践收尾；身份认证与 RBAC 相关内容见"身份认证与访问控制"章。

{{< section-toc show_summary="true" style="cards"  >}}
