---
weight: 8
part_id: part-i
title: 服务发现与路由
date: 2022-05-21T00:00:00+08:00
description: 理解 Kubernetes 的服务发现与流量路由：Service、CoreDNS、拓扑感知路由、Ingress 与 Ingress 控制器、Gateway API 及其推理扩展。
icon: fa-solid fa-search-location
lastmod: 2026-11-01T00:00:00+08:00
linktitle: 服务发现与路由
---

在微服务架构中，服务发现和路由是确保应用间高效通信的基础设施。Kubernetes 以 Service 抽象后端实例、以 CoreDNS 提供名称解析、以拓扑感知路由优化就近访问，并通过 Ingress 与新一代的 Gateway API 把集群外流量引入集群。本章按这一链路依次展开，并包含 Ingress 控制器的选型与从 Ingress 迁移到 Gateway API 的实践。

{{< section-toc show_summary="true" style="cards"  >}}
