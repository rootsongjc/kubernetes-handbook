---
weight: 13
part_id: part-ii
title: 访问集群与 kubectl
linkTitle: 访问集群
description: 掌握访问 Kubernetes 集群的各种方式与工具：kubectl 原理与命令技巧、Pod 调试、kubeconfig 管理、端口转发、Service 访问、Dashboard、k9s 与 Devtron。
date: 2022-05-21T00:00:00+08:00
type: book
icon: fa-solid fa-sign-in-alt
lastmod: 2026-11-01T00:00:00+08:00
linktitle: 访问集群与 kubectl
aliases:
  - /book/kubernetes-handbook/cli/
---

kubectl 是与集群交互最直接的入口，本章先讲解它与 API Server 的交互原理、常用命令技巧与 Pod 调试方法，再介绍 kubeconfig 的组织与跨集群访问、端口转发与通过 Service 访问应用等多种访问路径，最后介绍 Kubernetes Dashboard、k9s、Devtron 等图形化与终端 UI 工具，帮助读者按场景选择合适的访问方式。

{{< section-toc show_summary="true" style="cards"  >}}
