# Multi-Cluster Services API（多集群服务 API）

2020 年初，Kubernetes 社区提议 [Multi-Cluster Services API](https://docs.google.com/document/d/1hFtp8X7dzVS-JbfA5xuPvI_DNISctEbJSorFnY-nz6o/edit#heading=h.u7jfy9wqpd2b)，旨在解决长久以来就存在的 Kubernetes 多集群服务管理问题。

K8s用户可能希望将他们的部署分成多个集群，但仍然保留在这些集群中运行的工作负载之间的相互依赖关系，这有[很多原因](http://bit.ly/k8s-multicluster-conversation-starter-doc)。今天，集群是一个硬边界，一个服务对远程的K8s消费者来说是不透明的，否则就可以利用元数据（如端点拓扑结构）来更好地引导流量。为了支持故障转移或在迁移过程中的临时性，用户可能希望消费分布在各集群中的服务，但今天这需要非复杂的定制解决方案。

多集群服务API旨在解决这些问题。

## 参考

- [KEP-1645: Multi-Cluster Services API - github.com](https://github.com/kubernetes/enhancements/tree/master/keps/sig-multicluster/1645-multi-cluster-services-api)

