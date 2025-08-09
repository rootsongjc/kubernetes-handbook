---
weight: 49
title: 网络
date: '2022-05-21T00:00:00+08:00'
type: book
description: >-
  深入了解 Kubernetes 网络架构，包括网络插件、容器网络通信原理，以及主流网络解决方案如 Flannel、Calico 和 Cilium
  的特点与应用场景。
icon: fa-solid fa-network-wired
lastmod: '2025-08-09'
---

Kubernetes 网络是容器编排中最复杂的部分之一。它采用插件化架构，通过 CNI（Container Network Interface）规范支持多种网络方案。与单机 Docker 不同，Kubernetes 需要解决 Pod IP 唯一、网段隔离、跨节点通信、主机互通和服务发现等问题。

主流 CNI 插件包括 Flannel、Weave、Canal、Calico、Kube-router、Cilium、Antrea，以及云厂商的 AWS VPC CNI、Azure CNI、GKE 网络等。选择网络方案时需考虑性能、安全、运维、云兼容性和社区活跃度。

本章将介绍主流网络插件的原理、部署和实践。

{{< list_children show_summary="true" style="cards" >}}
