---
weight: 71
title: 资源调度
date: '2022-05-21T00:00:00+08:00'
type: book
---

Kubernetes 作为一个容器编排调度引擎，资源调度是它的最基本也是最重要的功能，这一节中我们将着重讲解 Kubernetes 中是如何做资源调度的。

Kubernetes 中有一个叫做 `kube-scheduler` 的组件，该组件就是专门监听 `kube-apiserver` 中是否有还未调度到 node 上的 pod，再通过特定的算法为 pod 指定分派 node 运行。

Kubernetes 中的众多资源类型，例如 Deployment、DaemonSet、StatefulSet 等都已经定义了 Pod 运行的一些默认调度策略，但是如果我们细心的根据 node 或者 pod 的不同属性，分别为它们打上标签之后，我们将发现 Kubernetes 中的高级调度策略是多么强大。当然如果要实现动态的资源调度，即 pod 已经调度到某些节点上后，因为一些其它原因，想要让 pod 重新调度到其它节点。

考虑以下两种情况：

- 集群中有新增节点，想要让集群中的节点的资源利用率比较均衡一些，想要将一些高负载的节点上的 pod 驱逐到新增节点上，这是 kuberentes 的 scheduler 所不支持的，需要使用如 [descheduler](https://github.com/kubernetes-sigs/descheduler) 这样的插件来实现。
- 想要运行一些大数据应用，设计到资源分片，pod 需要与数据分布达到一致均衡，避免个别节点处理大量数据，而其它节点闲置导致整个作业延迟，这时候可以考虑使用 [kube-batch](https://github.com/kubernetes-sigs/kube-batch)。
