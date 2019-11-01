# Operator

Operator是由[CoreOS](https://coreos.com)开发的，用来扩展Kubernetes API，特定的应用程序控制器，它用来创建、配置和管理复杂的有状态应用，如数据库、缓存和监控系统。Operator基于Kubernetes的资源和控制器概念之上构建，但同时又包含了应用程序特定的领域知识。创建Operator的关键是CRD（自定义资源）的设计。

## 工作原理

Operator是将运维人员对软件操作的知识给代码化，同时利用Kubernetes强大的抽象来管理大规模的软件应用。

Operator使用了Kubernetes的自定义资源扩展API机制，如使用[CRD](../concepts/custom-resource.md)（CustomResourceDefinition）来创建。Operator通过这种机制来创建、配置和管理应用程序。

当前CoreOS依靠社区力量创建了众多的 Operator，见：<https://operatorhub.io/>。

Operator基于Kubernetes的以下两个概念构建：

- 资源：对象的状态定义
- 控制器：观测、分析和行动，以调节资源的分布

## Operator 用途

若您有以下需求，可能会需要用到 Operator：

- 按需部署一个应用程序
- 需要备份和恢复应用程序的状态（如数据库）
- 处理应用程序代码的升级以及相关更改，例如数据库架构或额外的配置设置
- 发布一个服务，要让不支持Kubernetes API的应用程序能够发现
- 模拟整个或部分集群中的故障以测试其弹性
- 在没有内部成员选举程序的情况下为分布式应用程序选择领导者

## 一个Operator用途的详细示例

下面是一个使用 Operator 的详细示例。

- 一个名为SampleDB的自定义资源，您可以将其配置到集群中。
- 确保正在运行的Deployment的Pod中包含Operator的控制器部分。
- Operator代码的容器镜像。
- 查询控制平面以找出配置了哪些SampleDB资源的控制器代码。
- Operator的核心是告诉API Server如何使现实与代码里已配置的资源匹配。
  - 如果添加新的SampleDB，Operator将设置PersistentVolumeClaims以提供持久的数据库存储，设置StatefulSet以运行SampleDB，并设置Job来处理初始配置。
  - 如果删除它，Operator将建立快照，然后确保删除了StatefulSet和卷。
- Operator还管理常规数据库备份。对于每个SampleDB资源，Operator确定何时创建可以连接到数据库并进行备份的Pod。这些Pod将依赖于ConfigMap和/或具有数据库连接详细信息和凭据的Secret。
- 由于Operator旨在为其管理的资源提供强大的自动化功能，因此会有其他支持代码。对于此示例，代码将检查数据库是否正在运行旧版本，如果是，则创建Job对象为您升级数据库。

## 创建Operator

Operator本质上是与应用息息相关的，因为这是特定领域的知识的编码结果，这其中包括了资源配置的控制逻辑。下面是创建Operator的基本步骤：

1. 在单个Deployment中定义Operator，如：https://coreos.com/operators/etcd/latest/deployment.yaml
2. 需要为Operator创建一个新的自定义类型[CRD](../concepts/custom-resource.md)，这样用户就可以使用该对象来创建实例
3. Operator应该利用Kubernetes中内建的原语，如Deployment、Service这些经过充分测试的对象，这样也便于理解
4. Operator应该向后兼容，始终了解用户在之前版本中创建的资源
5. 当Operator被停止或删除时，Operator创建的应用实例应该不受影响
6. Operator应该让用户能够根据版本声明来选择所需版本和编排应用程序升级。不升级软件是操作错误和安全问题的常见来源，Operator可以帮助用户更加自信地解决这一问题。
7. Operator应该进行“Chaos Monkey”测试，以模拟Pod、配置和网络故障的情况下的行为。

## OperatorHub

我们都知道在 Kubernetes 上安装应用可以使用 Helm 直接安装各种打包成 Chart 形式的 Kubernetes 应用，但随着 Kubernetes Operator 的流行，Kubernetes 社区又推出了 [OperatorHub](https://www.operatorhub.io/)，你可以在这里分享或安装 Operator：<https://www.operatorhub.io>。

另外，[awesome-operators](https://github.com/operator-framework/awesome-operators) 中罗列了目前已知的 Operator。

## 参考

- [Operators - coreos.com](https://coreos.com/operators)
- [awesome-operators - github.com](https://github.com/operator-framework/awesome-operators)
- [OperatorHub - operatorhub.io](https://www.operatorhub.io)
- [Writing a Kubernetes Operator in Golang](https://medium.com/@mtreacher/writing-a-kubernetes-operator-a9b86f19bfb9)
- [Introducing Operators: Putting Operational Knowledge into Software - coreos.com](https://coreos.com/blog/introducing-operators.html)
- [Automating Kubernetes Cluster Operations with Operators - thenewstack.io](https://thenewstack.io/automating-kubernetes-cluster-operations-operators/)
- [Operator pattern - kubernetes.io](https://kubernetes.io/docs/concepts/extend-kubernetes/operator)
