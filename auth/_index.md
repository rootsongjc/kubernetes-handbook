---
weight: 11
part_id: part-i
title: 身份认证与访问控制
date: 2022-05-21T00:00:00+08:00
description: 全面掌握 Kubernetes 的身份认证与访问控制：认证策略、ServiceAccount、RBAC、结构化认证与鉴权配置、kubeconfig 与 token 认证、kubelet 认证授权、TLS Bootstrap 与证书管理，以及 SPIFFE/SPIRE 工作负载身份。
icon: fa-solid fa-user-shield
lastmod: 2026-11-01T00:00:00+08:00
linktitle: 身份认证与访问控制
---

API Server 上的每个请求都要回答"你是谁"与"你能做什么"。本章系统梳理 Kubernetes 的认证与鉴权体系：从用户与 ServiceAccount 的身份模型、各类认证策略与 RBAC，到 v1.34 GA 的结构化认证与鉴权配置；再到面向运维的 kubeconfig 与 token 认证、kubelet 的认证授权、TLS Bootstrap 与集群证书管理；最后介绍 SPIFFE 与 SPIRE 如何为工作负载提供跨集群、跨平台的统一身份，构成零信任架构的基础。

{{< section-toc show_summary="true" style="cards"  >}}
