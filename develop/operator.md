# Operator

Operator是由[CoreOS](https://coreos.com)开发的，用来扩展Kubernetes API，特定的应用程序控制器，它用来创建、配置和管理复杂的有状态应用，如数据库、缓存和监控系统。Operator基于Kubernetes的资源和控制器概念之上构建，但同时又包含了应用程序特定的领域知识。创建Operator的关键是CRD（自定义资源）的设计。

## 工作原理

Operator是将运维人员对软件操作的知识给代码化，同时利用Kubernetes强大的抽象来管理大规模的软件应用。

Operator使用了Kubernetes的自定义资源扩展API机制，如使用[CRD](../concepts/custom-resource.md)（CustomResourceDefinition）来创建。Operator通过这种机制来创建、配置和管理应用程序。

当前CoreOS提供的以下四种Operator：

- [etcd](https://coreos.com/operators/etcd/docs/latest/)：创建etcd集群
- [Rook](https://github.com/rook/rook)：云原生环境下的文件、块、对象存储服务
- [Prometheus](https://coreos.com/operators/prometheus/docs/latest/)：创建Prometheus监控实例
- [Tectonic](https://coreos.com/tectonic/)：部署Kubernetes集群

以上为CoreOS官方提供的Operator，另外还有很多很多其他开源的Operator实现。

Operator基于Kubernetes的以下两个概念构建：

- 资源：对象的状态定义
- 控制器：观测、分析和行动，以调节资源的分布

## 创建Operator

Operator本质上是与应用息息相关的，因为这是特定领域的知识的编码结果，这其中包括了资源配置的控制逻辑。下面是创建Operator的基本套路：

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
- [Introducing Operators: Putting Operational Knowledge into Software](https://coreos.com/blog/introducing-operators.html)
- [Automating Kubernetes Cluster Operations with Operators](https://thenewstack.io/automating-kubernetes-cluster-operations-operators/)