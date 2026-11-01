---
weight: 16
part_id: part-ii
title: 应用交付与 GitOps
linktitle: 应用交付与 GitOps
description: 掌握在 Kubernetes 上交付应用的完整工具链：部署流程、Helm 与 Kustomize、CI/CD、Argo CD 与 Argo Rollouts 渐进式交付、Terraform，以及传统应用与有状态应用的迁移部署。
date: 2022-05-21T00:00:00+08:00
type: book
icon: fa-solid fa-tools
lastmod: 2026-11-01T00:00:00+08:00
---

把应用交付到 Kubernetes 需要一条从清单管理到持续交付的完整链路。本章先梳理应用开发部署的基本流程，再介绍 Helm 与 Kustomize 两种主流的清单管理方式、CI/CD 流水线的设计、以 Argo CD 为代表的 GitOps 与 Argo Rollouts 的渐进式交付、以及用 Terraform 管理集群周边基础设施；最后以传统分布式应用迁移与有状态应用部署两个案例收尾。

{{< section-toc show_summary="true" style="cards"  >}}
