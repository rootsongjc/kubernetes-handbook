---
weight: 65
title: Aggregated API Server
date: '2022-05-21T00:00:00+08:00'
type: book
---

Aggregated（聚合的）API server 是为了将原来的 API server 这个巨石（monolithic）应用给拆分成，为了方便用户开发自己的 API server 集成进来，而不用直接修改 kubernetes 官方仓库的代码，这样一来也能将 API server 解耦，方便用户使用实验特性。这些 API server 可以跟 core API server 无缝衔接，使用 kubectl 也可以管理它们。

## 架构

我们需要创建一个新的组件，名为 `kube-aggregator`，它需要负责以下几件事：

- 提供用于注册 API server 的 API
- 汇总所有的 API server 信息
- 代理所有的客户端到 API server 的请求

**注意**：这里说的 API server 是一组“API Server”，而不是说我们安装集群时候的那个 API server，而且这组 API server 是可以横向扩展的。

## 安装配置聚合的 API server

有两种方式来启用 `kube-aggregator`：

- 使用 **test mode/single-user mode**，作为一个独立的进程来运行
- 使用 **gateway mode**，`kube-apiserver` 将嵌入到 `kbe-aggregator` 组件中，它将作为一个集群的 gateway，用来聚合所有 apiserver。

`kube-aggregator` 二进制文件已经包含在 Kubernetes release 里面了。
