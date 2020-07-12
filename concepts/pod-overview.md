# Pod 概览

本文将为您讲解 Pod 的基础概念。

## 理解 Pod

Pod 是 kubernetes 中你可以创建和部署的最小也是最简的单位。Pod 代表着集群中运行的进程。

Pod 中封装着应用的容器（有的情况下是好几个容器），存储、独立的网络 IP，管理容器如何运行的策略选项。Pod 代表着部署的一个单位：kubernetes 中应用的一个实例，可能由一个或者多个容器组合在一起共享资源。

> [Docker](https://www.docker.com) 是 kubernetes 中最常用的容器运行时，但是 Pod 也支持其他容器运行时。


在 Kubernetes 集群中 Pod 有如下两种使用方式：

- **一个 Pod 中运行一个容器**。“每个 Pod 中一个容器” 的模式是最常见的用法；在这种使用方式中，你可以把 Pod 想象成是单个容器的封装，kuberentes 管理的是 Pod 而不是直接管理容器。
- **在一个 Pod 中同时运行多个容器**。一个 Pod 中也可以同时封装几个需要紧密耦合互相协作的容器，它们之间共享资源。这些在同一个 Pod 中的容器可以互相协作成为一个 service 单位 —— 一个容器共享文件，另一个 “sidecar” 容器来更新这些文件。Pod 将这些容器的存储资源作为一个实体来管理。

[Kubernetes Blog](https://kubernetes.io/blog) 有关于 Pod 用例的详细信息，查看：

- [The Distributed System Toolkit: Patterns for Composite Containers](https://kubernetes.io/blog/2015/06/the-distributed-system-toolkit-patterns/)
- [Container Design Patterns](https://kubernetes.io/blog/2016/06/container-design-patterns/)

每个 Pod 都是应用的一个实例。如果你想平行扩展应用的话（运行多个实例），你应该运行多个 Pod，每个 Pod 都是一个应用实例。在 Kubernetes 中，这通常被称为 replication。

### Pod 中如何管理多个容器

Pod 中可以同时运行多个进程（作为容器运行）协同工作。同一个 Pod 中的容器会自动的分配到同一个 node 上。同一个 Pod 中的容器共享资源、网络环境和依赖，它们总是被同时调度。

注意在一个 Pod 中同时运行多个容器是一种比较高级的用法。只有当你的容器需要紧密配合协作的时候才考虑用这种模式。例如，你有一个容器作为 web 服务器运行，需要用到共享的 volume，有另一个 “sidecar” 容器来从远端获取资源更新这些文件，如下图所示：

![pod diagram](../images/pod-overview.png)

Pod 中可以共享两种资源：网络和存储。

#### 网络

每个 Pod 都会被分配一个唯一的 IP 地址。Pod 中的所有容器共享网络空间，包括 IP 地址和端口。Pod 内部的容器可以使用 `localhost` 互相通信。Pod 中的容器与外界通信时，必须分配共享网络资源（例如使用宿主机的端口映射）。

#### 存储

可以为一个 Pod 指定多个共享的 Volume。Pod 中的所有容器都可以访问共享的 volume。Volume 也可以用来持久化 Pod 中的存储资源，以防容器重启后文件丢失。

## 使用 Pod

你很少会直接在 kubernetes 中创建单个 Pod。因为 Pod 的生命周期是短暂的，用后即焚的实体。当 Pod 被创建后（不论是由你直接创建还是被其他 Controller），都会被 Kubernetes 调度到集群的 Node 上。直到 Pod 的进程终止、被删掉、因为缺少资源而被驱逐、或者 Node 故障之前这个 Pod 都会一直保持在那个 Node 上。

> 注意：重启 Pod 中的容器跟重启 Pod 不是一回事。Pod 只提供容器的运行环境并保持容器的运行状态，重启容器不会造成 Pod 重启。

Pod 不会自愈。如果 Pod 运行的 Node 故障，或者是调度器本身故障，这个 Pod 就会被删除。同样的，如果 Pod 所在 Node 缺少资源或者 Pod 处于维护状态，Pod 也会被驱逐。Kubernetes 使用更高级的称为 Controller 的抽象层，来管理 Pod 实例。虽然可以直接使用 Pod，但是在 Kubernetes 中通常是使用 Controller 来管理 Pod 的。

### Pod 和 Controller

Controller 可以创建和管理多个 Pod，提供副本管理、滚动升级和集群级别的自愈能力。例如，如果一个 Node 故障，Controller 就能自动将该节点上的 Pod 调度到其他健康的 Node 上。

包含一个或者多个 Pod 的 Controller 示例：

- [Deployment](deployment.md)
- [StatefulSet](./statefulset.md)
- [DaemonSet](daemonset.md)

通常，Controller 会用你提供的 Pod Template 来创建相应的 Pod。

## Pod Templates

Pod 模版是包含了其他 object 的 Pod 定义，例如 [Replication Controllers](replicaset.md)，[Jobs](./job.md) 和
[DaemonSets](./daemonset.md)。Controller 根据 Pod 模板来创建实际的 Pod。
