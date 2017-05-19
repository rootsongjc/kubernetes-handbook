# Swarm mode简介

为了使用 Docker 内置的 swarm 模式，你需要安装 Docker Engine v1.12.0 或者更新版本的 Docker，或者，相应的安装最新的 Docker for Mac, Docker for Windows Beta。

Docker Engine 1.12 内置了 swarm 模式来让用户便捷的管理集群。 通过 Docker CLI 可以创建一个 swarm 集群，部署应用到一个 swarm 集群，或者管理一个 swarm 集群的行为。

如果你正在使用 v1.12.0 以前版本的 Docker ，请参考 [Docker Swarm](https://docs.docker.com/swarm)。

## 主要特性

### 内置于 Docker Engine 的集群管理

可以直接用 Docker Engine CLI 来创建 Swarm 集群，并在该集群上部署服务。你不再需要额外的编排软件来创建或管理 Swarm 集群了。

### 去中心化设计

不同于在部署时就确定节点之间的关系, 新的 Swarm 模式选择在运行时动态地处理这些关系, 你可以用 Docker Engine 部署 manager 和 worker 这两种不同的节点。 这意味着你可以从一个磁盘镜像搭建整个 Swarm 。

### 声明式服务模型

Docker Engine 使用一种声明式方法来定义各种服务的状态。譬如，你可以描述一个由 web 前端服务，消息队列服务和数据库后台组成的应用。

### 服务扩缩

你可以通过 docker service scale 命令轻松地增加或减少某个服务的任务数。

### 集群状态维护

Swarm 管理节点会一直监控集群状态，并依据你给出的期望状态与集群真实状态间的区别来进行调节。譬如，你为一个服务设置了10个任务副本，如果某台运行着该服务两个副本的工作节点停止工作了，管理节点会创建两个新的副本来替掉上述异常终止的副本。 Swarm 管理节点这个新的副本分配到了正常运行的工作节点上。

### 跨主机网络

你可以为你的服务指定一个 overlay 网络。在服务初始化或着更新时，Swarm 管理节点自动的为容器在 overlay 网络上分配地址。

### 服务发现

Swarm 管理节点在集群中自动的为每个服务分配唯一的 DNS name 并为容器配置负载均衡。利用内嵌在 Swarm 中的 DNS 服务器你可以找到每个运行在集群中的容器。

### 负载均衡

你可以把服务的端口暴露给一个集群外部的负载均衡器。 在 Swarm 集群内部你可以决定如何在节点间分发服务的容器。

### 默认 TLS 加密

Swarm 集群中的节点间通信是强制加密的。你可以选择使用自签名的根证书或者来自第三方认证的证书。

### 滚动更新

docker service 允许你自定义更新的间隔时间, 并依次更新你的容器, docker 会按照你设置的更新时间依次更新你的容器, 如果发生了错误, 还可以回滚到之前的状态.

## Swarm

Docker Engine 内置的集群管理和编排功能是利用 SwarmKit 实现的。集群中的 Engine 在 swarm 模式下运行。你可以通过初始化一个 swarm 集群或者加入一个存在的 swarm 集群来激活 Engine 的 swarm 模式。

Swarm 是你部署服务的一个集群。 Docker Engine CLI 已经内置了swarm 管理的相关命令，像添加，删除节点等。 CLI 也内置了在 swarm 上部署服务以及管理服务编排的命令。

在非 swarm mode 下，你只能执行容器命令。在 swarm mode 下，你可以编排服务。

## Node

Node 是 Docker Engine 加入到 swarm 的一个实例。

你可以通过向 manager node 提交一个服务描述来部署应用到 swarm 集群。manager node 调度工作单元--任务，到 worker node。

Manager node 也负责提供维护 swarm 状态所需要的编排和集群管理功能。 Manager node 选举一个 leader 来管理任务编排。

Worker node 接收并执行从 manager node 调度过来的任务。

在默认情况下， manager node 同时也是 worker node，当然你可以配置 manager node 只充当管理角色不参与任务执行。Manager 根据 agent 提供的任务当前状态来维护目标状态。

## Services and tasks

service 指的是在 worker node 上执行的任务的描述。service 是 swarm 系统的中心架构，是用户跟 swarm 交互的基础。

在你创建 service 时， 你需要指定容器镜像，容器里面执行的命令等。

在 replicated service 模式下， swarm 根据你设置的 scale(副本) 数部署在集群中部署指定数量的任务副本。

在 global service 模式下， swarm 在集群每个可用的机器上运行一个 service 的任务。

task 指的是一个 Docker 容器以及需要在该容器内运行的命令。 task 是 swarm 的最小调度单元。 manager node 根据 service scale 的副本数量将 task 分配到 worker node 上。 被分配到一个 node 上的 task 不会被莫名移到另一个 node 上，除非运行失败。

## Load balancing

swarm manager 用 ingress load balancing 来对外暴露 service 。 swarm manager 能够自动的为 service 分配对外端口，当然，你也可以为 service 在 30000-32767 范围内指定端口。

外部组件，譬如公有云的负载均衡器，都可以通过集群中任何主机的上述端口来访问 service ，无论 service 的 task 是否正运行在这个主机上。 swarm 中的所有主机都可以路由 ingress connections 到一个正在运行着的 task 实例上。

Swarm mode 有一个内部的 DNS 组件来自动为每个 service 分配 DNS 入口。 swarm manager 根据 service 在集群中的 DNS name 使用内部负载均衡来分发请求。