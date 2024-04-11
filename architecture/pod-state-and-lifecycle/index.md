---
weight: 11
title: Pod 状态与生命周期管理
date: '2022-05-21T00:00:00+08:00'
type: book
---

该节将带领大家了解 Kubernetes 中的基本概念，尤其是作为 Kubernetes 中调度的最基本单位 Pod。

本节中包括以下内容：

- 了解 Pod 的构成
- Pod 的生命周期
- Pod 中容器的启动顺序模板定义

Kubernetes 中的基本组件 `kube-controller-manager` 就是用来控制 Pod 的状态和生命周期的，在了解各种 controller 之前我们有必要先了解下 Pod 本身和其生命周期。
