---
weight: 91
title: 访问 Kubernetes 集群
linkTitle: 访问集群
date: '2022-05-21T00:00:00+08:00'
type: book
---

根据用户部署和暴露服务的方式不同，有很多种方式可以用来访问 Kubernetes 集群。

- 最简单也是最直接的方式是使用 `kubectl` 命令。
- 其次可以使用 `kubeconfig` 文件来认证授权访问 API server。
- 通过各种 proxy 经过端口转发访问 Kubernetes 集群中的服务
- 使用 Ingress，在集群外访问 Kubernetes 集群内的 service

## 本节大纲

{{< list_children show_summary="false">}}
