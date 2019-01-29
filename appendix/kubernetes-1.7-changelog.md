# Kubernetes1.7更新日志

2017年6月29日，kuberentes1.7发布。该版本的kubernetes在安全性、存储和可扩展性方面有了很大的提升。改版本的详细更新文档请查看[Changelog](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.7.md)。

这些新特性中包含了安全性更高的加密的secret、pod间通讯的网络策略，限制kubelet访问的节点授权程序以及客户端/服务器TLS证书轮换。

对于那些在Kubernetes上运行横向扩展数据库的人来说，这个版本有一个主要的特性，可以为StatefulSet添加自动更新并增强DaemonSet的更新。我们还宣布了对本地存储的Alpha支持，以及用于更快地缩放StatefulSets的突发模式。

此外，对于高级用户，此发行版中的API聚合允许使用用于自定义的API与API server同时运行。其他亮点包括支持可扩展的准入控制器，可插拔云供应商程序和容器运行时接口（CRI）增强功能。

## 新功能

**安全**

- [Network Policy API](https://kubernetes.io/docs/concepts/services-networking/network-policies/) 提升为稳定版本。用户可以通过使用网络插件实现的网络策略来控制哪些Pod之间能够互相通信。
- [节点授权](https://kubernetes.io/docs/admin/authorization/node/)和准入控制插件是新增加的功能，可以用于限制kubelet可以访问的secret、pod和其它基于节点的对象。
- [加密的Secret](https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/)和etcd中的其它资源，现在是alpha版本。
- Kubelet TLS bootstrapping 现在支持客户端和服务器端的证书轮换。
- 由API server存储的[审计日志](https://kubernetes.io/docs/tasks/debug-application-cluster/audit/)现在更具可定制性和可扩展性，支持事件过滤和webhook。它们还为系统审计提供更丰富的数据。

**有状态负载**

- [StatefulSet更新](https://kubernetes.io/docs/tutorials/stateful-application/basic-stateful-set/#updating-statefulsets)是1.7版本的beta功能，它允许使用包括滚动更新在内的一系列更新策略自动更新诸如Kafka，Zookeeper和etcd等有状态应用程序。
- StatefulSets现在还支持对不需要通过[Pod管理策略](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#pod-management-policies)进行排序的应用程序进行快速扩展和启动。这可以是主要的性能改进。
- [本地存储](https://kubernetes.io/docs/concepts/storage/volumes/#local)（alpha）是有状态应用程序最常用的功能之一。用户现在可以通过标准的PVC/PV接口和StatefulSet中的StorageClass访问本地存储卷。
- DaemonSet——为每个节点创建一个Pod，现在有了更新功能，在1.7中增加了[智能回滚和历史记录](https://kubernetes.io/docs/tasks/manage-daemon/rollback-daemon-set/)功能。
- 新的[StorageOS Volume插件](https://kubernetes.io/docs/concepts/storage/volumes/#storageos)可以使用本地或附加节点存储中以提供高可用的集群范围的持久卷。

**可扩展性**

- 运行时的[API聚合](https://kubernetes.io/docs/concepts/api-extension/apiserver-aggregation/)是此版本中最强大的扩展功能，允许高级用户将Kubernetes风格的预先构建的第三方或用户创建的API添加到其集群中。
- [容器运行时接口](https://github.com/kubernetes/community/blob/master/contributors/devel/container-runtime-interface.md)（CRI）已经增强，可以使用新的RPC调用从运行时检索容器度量。 [CRI的验证测试](https://github.com/kubernetes/community/blob/master/contributors/devel/cri-validation.md)已经发布，与[containerd](http://containerd.io/)进行了Alpha集成，现在支持基本的生命周期和镜像管理。参考[深入介绍CRI](http://blog.kubernetes.io/2016/12/container-runtime-interface-cri-in-kubernetes.html)的文章。

**其它功能**

- 引入了对[外部准入控制器](https://kubernetes.io/docs/admin/extensible-admission-controllers/)的Alpha支持，提供了两个选项，用于向API server添加自定义业务逻辑，以便在创建对象和验证策略时对其进行修改。
- [基于策略的联合资源布局](https://kubernetes.io/docs/tasks/federation/set-up-placement-policies-federation/)提供Alpha版本，用于根据自定义需求（如法规、定价或性能）为联合（federated）集群提供布局策略。

**弃用** 

- 第三方资源（TPR）已被自定义资源定义（Custom Resource Definitions，CRD）取代，后者提供了一个更清晰的API，并解决了TPR测试期间引发的问题和案例。如果您使用TPR测试版功能，则建议您[迁移](https://kubernetes.io/docs/tasks/access-kubernetes-api/migrate-third-party-resource/)，因为它将在Kubernetes 1.8中被移除。

以上是Kubernetes1.7中的主要新特性，详细更新文档请查看[Changelog](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.7.md)。
