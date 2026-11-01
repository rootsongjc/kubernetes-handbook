---
weight: 4
part_id: part-i
title: 集群与基础对象
date: 2022-05-21T00:00:00+08:00
type: book
description: 掌握 Kubernetes 集群的基础对象：Node、Namespace、Label、Annotation、污点与容忍，以及对象的垃圾收集机制。
icon: fa-solid fa-server
lastmod: 2026-11-01T00:00:00+08:00
linktitle: 集群与基础对象
---

Node、Namespace、Label、Annotation 与污点/容忍是 Kubernetes 中最基础的组织与分类原语：Node 是算力的载体，Namespace 划分逻辑边界，Label 与 Annotation 为对象附加可查询的元数据与说明，污点与容忍约束工作负载与节点的匹配关系，垃圾收集则负责级联清理对象之间的从属关系。本章逐一解析这些对象的语义与最佳实践，调度、配额与弹性相关的内容请见后续的"调度与弹性"章。

{{< section-toc show_summary="true" style="cards"  >}}
