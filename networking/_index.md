---
weight: 49
title: 网络
date: '2022-05-21T00:00:00+08:00'
type: book
---

Kubernetes 中的网络可以说对初次接触 Kubernetes 或者没有网络方面经验的人来说可能是其中最难的部分。Kubernetes 本身并不提供网络功能，只是把网络接口开放出来，通过插件的形式实现。

## 网络要解决的问题

既然 Kubernetes 中将容器的联网通过插件的方式来实现，那么该如何解决容器的联网问题呢？

如果您在本地单台机器上运行 docker 容器的话会注意到所有容器都会处在 `docker0` 网桥自动分配的一个网络 IP 段内（172.17.0.1/16）。该值可以通过 docker 启动参数 `--bip` 来设置。这样所有本地的所有的容器都拥有了一个 IP 地址，而且还是在一个网段内彼此就可以互相通信了。

但是 Kubernetes 管理的是集群，Kubernetes 中的网络要解决的核心问题就是每台主机的 IP 地址网段划分，以及单个容器的 IP 地址分配。概括为：

- 保证每个 Pod 拥有一个集群内唯一的 IP 地址
- 保证不同节点的 IP 地址划分不会重复
- 保证跨节点的 Pod 可以互相通信
- 保证不同节点的 Pod 可以与跨节点的主机互相通信

为了解决该问题，出现了一系列开源的 Kubernetes 中的网络插件与方案，如：

- flannel
- calico
- contiv
- weave
- kube-router
- cilium
- canal
- 等等

本章将以当前最常用的 flannel、calico 和 cilium 等插件为例解析。

## 本节大纲

{{< list_children show_summary="false">}}
