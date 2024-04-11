---
weight: 108
title: Operator
summary: "关于 Kubernetes Operator 的原理、用途等基础知识介绍。"
date: '2022-09-05T11:00:00+08:00'
type: book
---

Operator 最初是由 CoreOS（后被 Red Hat 收购）开发的，下面是关于 Operator 的一些基础知识：

- Operator 是用来扩展 Kubernetes API 的特定的应用程序控制器；
- Operator 用来创建、配置和管理复杂的有状态应用，如数据库、缓存和监控系统；
- Operator 基于 Kubernetes 的资源和控制器概念之上构建，但同时又包含了应用程序特定的领域知识；
- 创建 Operator 的关键是 CRD（自定义资源）的设计；
- Operator 通常作为 Deployment 资源部署在 Kubernetes 中，删掉 Operator 不会影响已使用它创建的自定义资源；
- [Operator Hub](https://operatorhub.io/) 中罗列了目前已知的 Operator。

## 工作原理

Operator 是将运维人员对软件操作的知识给代码化，同时利用 Kubernetes 强大的抽象来管理大规模的软件应用。

Operator 使用了 Kubernetes 的自定义资源扩展 API 机制，如使用 CRD（CustomResourceDefinition）来创建。Operator 通过这种机制来创建、配置和管理应用程序。

Operator 基于 Kubernetes 的以下两个概念构建：

- 资源：对象的状态定义
- 控制器：观测、分析和行动，以调节资源的分布

## Operator 用途

若您有以下需求，可能会需要用到 Operator：

- 按需部署一个应用程序
- 需要备份和恢复应用程序的状态（如数据库）
- 处理应用程序代码的升级以及相关更改，例如数据库架构或额外的配置设置
- 发布一个服务，要让不支持 Kubernetes API 的应用程序能够发现
- 模拟整个或部分集群中的故障以测试其弹性
- 在没有内部成员选举程序的情况下为分布式应用程序选择领导者

## Operator 用途的详细示例

下面是一个使用 Operator 的详细示例：

- 将一个名为 SampleDB 的自定义资源其配置到集群中。
- 确保正在运行的 Deployment 的 Pod 中包含 Operator 的控制器部分。
- Operator 代码的容器镜像。
- 查询控制平面以找出配置了哪些 SampleDB 资源的控制器代码。
- Operator 的核心是告诉 API Server 如何使现实与代码里已配置的资源匹配：
  - 如果添加新的 SampleDB，Operator 将设置 PersistentVolumeClaims 以提供持久的数据库存储，设置 StatefulSet 以运行 SampleDB，并设置 Job 来处理初始配置。
  - 如果删除它，Operator 将建立快照，然后确保删除了 StatefulSet 和卷。
- Operator 还管理常规数据库备份。对于每个 SampleDB 资源，Operator 确定何时创建可以连接到数据库并进行备份的 Pod。这些 Pod 将依赖于 ConfigMap 和 / 或具有数据库连接详细信息和凭据的 Secret。
- 由于 Operator 旨在为其管理的资源提供强大的自动化功能，因此会有其他支持代码。对于此示例，代码将检查数据库是否正在运行旧版本，如果是，则创建 Job 对象为您升级数据库。

## 创建 Operator

Operator 本质上是与应用息息相关的，因为这是特定领域的知识的编码结果，这其中包括了资源配置的控制逻辑。下面是创建 Operator 的基本步骤：

1. 在单个 Deployment 中定义 Operator 且部署完成不需要进行任何操作；
2. 需要为 Operator 创建一个新的自定义类型 CRD，这样用户就可以使用该对象来创建实例；
3. Operator 应该利用 Kubernetes 中内建的原语，如 Deployment、Service 这些经过充分测试的对象，这样也便于理解；
4. Operator 应该向后兼容，始终了解用户在之前版本中创建的资源；
5. 当 Operator 被停止或删除时，Operator 创建的应用实例应该不受影响；
6. Operator 应该让用户能够根据版本声明来选择所需版本和编排应用程序升级。不升级软件是操作错误和安全问题的常见来源，Operator 可以帮助用户更加自信地解决这一问题；
7. Operator 应该进行“Chaos Monkey”测试，以模拟 Pod、配置和网络故障的情况下的行为。

## 参考

- [Writing a Kubernetes Operator in Golang - medium.com](https://medium.com/@mtreacher/writing-a-kubernetes-operator-a9b86f19bfb9)
- [Introducing Operators: Putting Operational Knowledge into Software - cloud.redhat.com](https://cloud.redhat.com/blog/introducing-operators-putting-operational-knowledge-into-software)
- [Automating Kubernetes Cluster Operations with Operators - thenewstack.io](https://thenewstack.io/automating-kubernetes-cluster-operations-operators/)
- [Operator pattern - kubernetes.io](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
