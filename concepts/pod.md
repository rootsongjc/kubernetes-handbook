# Pod 解析

Pod 是 Kubernetes 中可以创建的最小部署单元，也是 Kubernetes REST API 中的顶级资源类型。V1 core 版本的 Pod 的配置模板见 [Pod template](../manifests/template/pod-v1-template.yaml)。

在 Kuberentes V1 core API 版本中的 Pod 的数据结构如下图所示：

![Pod Cheatsheet](../images/kubernetes-pod-cheatsheet.png)

## 什么是 Pod？

Pod 就像是豌豆荚一样，它由一个或者多个容器组成（例如 Docker 容器），它们共享容器存储、网络和容器运行配置项。Pod 中的容器总是被同时调度，有共同的运行环境。你可以把单个 Pod 想象成是运行独立应用的 “逻辑主机”—— 其中运行着一个或者多个紧密耦合的应用容器 —— 在有容器之前，这些应用都是运行在几个相同的物理机或者虚拟机上。

尽管 kubernetes 支持多种容器运行时，但是 Docker 依然是最常用的运行时环境，我们可以使用 Docker 的术语和规则来定义 Pod。

Pod 中共享的环境包括 Linux 的 namespace、cgroup 和其他可能的隔绝环境，这一点跟 Docker 容器一致。在 Pod 的环境中，每个容器中可能还有更小的子隔离环境。

Pod 中的容器共享 IP 地址和端口号，它们之间可以通过 `localhost` 互相发现。它们之间可以通过进程间通信，例如 [SystemV](https://en.wikipedia.org/wiki/UNIX_System_V) 信号或者 POSIX 共享内存。不同 Pod 之间的容器具有不同的 IP 地址，不能直接通过 IPC 通信。

Pod 中的容器也有访问共享 volume 的权限，这些 volume 会被定义成 pod 的一部分并挂载到应用容器的文件系统中。

根据 Docker 的结构，Pod 中的容器共享 namespace 和 volume，不支持共享 PID 的 namespace。

就像每个应用容器，pod 被认为是临时（非持久的）实体。在 Pod 的生命周期中讨论过，pod 被创建后，被分配一个唯一的 ID（UID），调度到节点上，并一致维持期望的状态直到被终结（根据重启策略）或者被删除。如果 node 死掉了，分配到了这个 node 上的 pod，在经过一个超时时间后会被重新调度到其他 node 节点上。一个给定的 pod（如 UID 定义的）不会被 “重新调度” 到新的节点上，而是被一个同样的 pod 取代，如果期望的话甚至可以是相同的名字，但是会有一个新的 UID。

Volume 跟 pod 有相同的生命周期（当其 UID 存在的时候）。当 Pod 因为某种原因被删除或者被新创建的相同的 Pod 取代，它相关的东西（例如 volume）也会被销毁和再创建一个新的 volume。



![Pod示意图](../images/pod-overview.png)

说明：一个多容器 Pod，包含文件提取程序和 Web 服务器，该服务器使用持久卷在容器之间共享存储。 s

## Pod 的动机

### 管理

Pod 是一个服务的多个进程的聚合单位，pod 提供这种模型能够简化应用部署管理，通过提供一个更高级别的抽象的方式。Pod 作为一个独立的部署单位，支持横向扩展和复制。共生（协同调度），命运共同体（例如被终结），协同复制，资源共享，依赖管理，Pod 都会自动的为容器处理这些问题。

### 资源共享和通信

Pod 中的应用可以共享网络空间（IP 地址和端口），因此可以通过 `localhost` 互相发现。因此，pod 中的应用必须协调端口占用。每个 pod 都有一个唯一的 IP 地址，跟物理机和其他 pod 都处于一个扁平的网络空间中，它们之间可以直接连通。

Pod 中应用容器的 hostname 被设置成 Pod 的名字。

Pod 中的应用容器可以共享 volume。Volume 能够保证 pod 重启时使用的数据不丢失。

## Pod 的使用

Pod 也可以用于垂直应用栈（例如 LAMP），这样使用的主要动机是为了支持共同调度和协调管理应用程序，例如：

- 内容管理系统、文件和数据加载器、本地换群管理器等。
- 日志和检查点备份、压缩、旋转、快照等。
- 数据变更观察者、日志和监控适配器、活动发布者等。
- 代理、桥接和适配器等。
- 控制器、管理器、配置器、更新器等。

通常单个 pod 中不会同时运行一个应用的多个实例。

详细说明请看： [The Distributed System ToolKit: Patterns for Composite Containers](https://kubernetes.io/blog/2015/06/the-distributed-system-toolkit-patterns/).

## 其他替代选择

**为什么不直接在一个容器中运行多个应用程序呢？**

1. 透明。让 Pod 中的容器对基础设施可见，以便基础设施能够为这些容器提供服务，例如进程管理和资源监控。这可以为用户带来极大的便利。
2. 解耦软件依赖。每个容器都可以进行版本管理，独立的编译和发布。未来 kubernetes 甚至可能支持单个容器的在线升级。
3. 使用方便。用户不必运行自己的进程管理器，还要担心错误信号传播等。
4. 效率。因为由基础架构提供更多的职责，所以容器可以变得更加轻量级。

**为什么不支持容器的亲和性的协同调度？**

这种方法可以提供容器的协同定位，能够根据容器的亲和性进行调度，但是无法实现使用 pod 带来的大部分好处，例如资源共享，IPC，保持状态一致性和简化管理等。

## Pod 的持久性（或者说缺乏持久性）

Pod 在设计支持就不是作为持久化实体的。在调度失败、节点故障、缺少资源或者节点维护的状态下都会死掉会被驱逐。

通常，用户不需要手动直接创建 Pod，而是应该使用 controller（例如 [Deployments](deployment.md)），即使是在创建单个 Pod 的情况下。Controller 可以提供集群级别的自愈功能、复制和升级管理。

使用集合 API 作为主要的面向用户的原语在集群调度系统中相对常见，包括 [Borg](https://research.google.com/pubs/pub43438.html)、[Marathon](https://mesosphere.github.io/marathon/docs/rest-api.html)、[Aurora](https://aurora.apache.org/documentation/latest/reference/configuration/#job-schema) 和 [Tupperware](https://www.slideshare.net/Docker/aravindnarayanan-facebook140613153626phpapp02-37588997)。

Pod 原语有利于：

- 调度程序和控制器可插拔性
- 支持 pod 级操作，无需通过控制器 API “代理” 它们
- 将 pod 生命周期与控制器生命周期分离，例如用于自举（bootstrap）
- 控制器和服务的分离 —— 端点控制器只是监视 pod
- 将集群级功能与 Kubelet 级功能的清晰组合 ——Kubelet 实际上是 “pod 控制器”
- 高可用性应用程序，它们可以在终止之前及在删除之前更换 pod，例如在计划驱逐、镜像预拉取或实时 pod 迁移的情况下[#3949](https://github.com/kubernetes/kubernetes/issues/3949)

[StatefulSet](./statefulset.md) 控制器支持有状态的 Pod。在 1.4 版本中被称为 PetSet。在 kubernetes 之前的版本中创建有状态 pod 的最佳方式是创建一个 replica 为 1 的 replication controller。

## Pod 的终止

因为 Pod 作为在集群的节点上运行的进程，所以在不再需要的时候能够优雅的终止掉是十分必要的（比起使用发送 KILL 信号这种暴力的方式）。用户需要能够发起一个删除 Pod 的请求，并且知道它们何时会被终止，是否被正确的删除。用户想终止程序时发送删除 pod 的请求，在 pod 可以被强制删除前会有一个宽限期，会发送一个 TERM 请求到每个容器的主进程。一旦超时，将向主进程发送 KILL 信号并从 API server 中删除。如果 kubelet 或者 container manager 在等待进程终止的过程中重启，在重启后仍然会重试完整的宽限期。

示例流程如下：

1. 用户发送删除 pod 的命令，默认宽限期是 30 秒；
2. 在 Pod 超过该宽限期后 API server 就会更新 Pod 的状态为 “dead”；
3. 在客户端命令行上显示的 Pod 状态为 “terminating”；
4. 跟第三步同时，当 kubelet 发现 pod 被标记为 “terminating” 状态时，开始停止 pod 进程：
   1. 如果在 pod 中定义了 preStop hook，在停止 pod 前会被调用。如果在宽限期过后，preStop hook 依然在运行，第二步会再增加 2 秒的宽限期；
   2. 向 Pod 中的进程发送 TERM 信号；
5. 跟第三步同时，该 Pod 将从该 service 的端点列表中删除，不再是 replication controller 的一部分。关闭的慢的 pod 将继续处理 load balancer 转发的流量；
6. 过了宽限期后，将向 Pod 中依然运行的进程发送 SIGKILL 信号而杀掉进程。
7. Kubelet 会在 API server 中完成 Pod 的的删除，通过将优雅周期设置为 0（立即删除）。Pod 在 API 中消失，并且在客户端也不可见。

删除宽限期默认是 30 秒。 `kubectl delete` 命令支持 `—grace-period=<seconds>` 选项，允许用户设置自己的宽限期。如果设置为 0 将强制删除 pod。在 kubectl>=1.5 版本的命令中，你必须同时使用 `--force` 和 `--grace-period=0` 来强制删除 pod。 在 yaml 文件中可以通过 `{{ .spec.spec.terminationGracePeriodSeconds }}` 来修改此值。

### 强制删除 Pod

Pod 的强制删除是通过在集群和 etcd 中将其定义为删除状态。当执行强制删除命令时，API server 不会等待该 pod 所运行在节点上的 kubelet 确认，就会立即将该 pod 从 API server 中移除，这时就可以创建跟原 pod 同名的 pod 了。这时，在节点上的 pod 会被立即设置为 terminating 状态，不过在被强制删除之前依然有一小段优雅删除周期。

强制删除对于某些 pod 具有潜在危险性，请谨慎使用。使用 StatefulSet pod 的情况下，请参考删除 StatefulSet 中的 pod 文章。

## Pod 中容器的特权模式

从 Kubernetes1.1 版本开始，pod 中的容器就可以开启 privileged 模式，在容器定义文件的 `SecurityContext` 下使用 `privileged` flag。 这在使用 Linux 的网络操作和访问设备的能力时是很有用的。容器内进程可获得近乎等同于容器外进程的权限。在不需要修改和重新编译 kubelet 的情况下就可以使用 pod 来开发节点的网络和存储插件。

如果 master 节点运行的是 kuberentes1.1 或更高版本，而 node 节点的版本低于 1.1 版本，则 API server 将也可以接受新的特权模式的 pod，但是无法启动，pod 将处于 pending 状态。

执行 `kubectl describe pod FooPodName`，可以看到为什么 pod 处于 pending 状态。输出的 event 列表中将显示： `Error validating pod "FooPodName"."FooPodNamespace" from api, ignoring: spec.containers[0].securityContext.privileged: forbidden '<*>(0xc2089d3248)true'`

如果 master 节点的版本低于 1.1，无法创建特权模式的 pod。如果你仍然试图去创建的话，你得到如下错误：

```
The Pod "FooPodName" is invalid. spec.containers[0].securityContext.privileged: forbidden '<*>(0xc20b222db0)true'
```
