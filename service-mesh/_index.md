---
linktitle: 服务网格
weight: 20
part_id: part-iii
title: 服务网格
date: 2018-09-09T00:00:00Z
description: 理解服务网格的概念、价值与部署模式，Istio 与 Envoy 的核心机制，无 Sidecar 架构（Istio Ambient、Cilium、Linkerd）的对比，以及 Kiali 可观测面板。
icon: fa-solid fa-project-diagram
lastmod: 2026-11-01T00:00:00+08:00
---

服务网格作为微服务架构的基础设施层，为服务间通信提供了统一的 mTLS、流量治理与可观测性。本章先回答"什么是服务网格"与"你是否需要它"，介绍网格的部署模式，再深入 Istio 与 Envoy 的核心构建模块，对比 Istio Ambient、Cilium 与 Linkerd 三种数据面架构，并以 Kiali 服务网格观测面板收尾。

{{< section-toc show_summary="true" style="cards"  >}}
