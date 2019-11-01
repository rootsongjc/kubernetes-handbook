# 集群联邦

Kubernetes v1.9声称单集群最多可支持5000个节点和15万个Pod，我相信很少有公司会部署如此庞大的一个单集群，总有很多情况下因为各种各样的原因我们可能会部署多个集群，但是有时候有想将他们统一起来管理，这时候就需要用到集群联邦（Federation）。

## 为什么要使用 federation

Federation 使管理多个集群变得简单。它通过提供两个主要构建模块来实现：

- 跨集群同步资源：Federation 提供了在多个集群中保持资源同步的能力。例如，可以保证同一个 deployment 在多个集群中存在。
- 跨集群服务发现：Federation 提供了自动配置 DNS 服务以及在所有集群后端上进行负载均衡的能力。例如，可以提供一个全局 VIP 或者 DNS 记录，通过它可以访问多个集群后端。

Federation 还可以提供一些其它用例：

- 高可用：通过在集群间分布负载并自动配置 DNS 服务和负载均衡，federation 最大限度地减少集群故障的影响。
- 避免厂商锁定：通过更简单的跨集群应用迁移方式，federation 可以防止集群厂商锁定。

Federation 对于单个集群没有用处。基于下面这些原因您可能会需要多个集群：

- 低延迟：通过在多个区域部署集群可以最大限度减少区域近端用户的延迟。
- 故障隔离：拥有多个小集群可能比单个大集群更利于故障隔离（例如：在云服务提供商的不同可用区中的多个集群）。详情请参考 [多集群指南](https://kubernetes.io/docs/concepts/cluster-administration/federation)。
- 可伸缩性：单个集群有可伸缩性限制（对于大多数用户这不是典型场景。更多细节请参考 [Kubernetes 弹性伸缩与性能目标](https://git.k8s.io/community/sig-scalability/goals.md)）。
- [混合云](https://kubernetes.io/docs/concepts/cluster-administration/federation/)：您可以在不同的云服务提供商或本地数据中心中拥有多个集群。

### 警告

虽然 federation 有很多吸引人的使用案例，但也有一些注意事项：

- 增加网络带宽和成本：federation 控制平面监控所有集群以确保当前状态符合预期。如果集群在云服务提供商的不同区域或者不同的云服务提供商上运行时，这将导致明显的网络成本增加。
- 减少跨集群隔离：federation 控制平面中的 bug 可能影响所有集群。通过在 federation 中实现最少的逻辑可以缓解这种情况。只要有可能，它就将尽力把工作委托给 kubernetes 集群中的控制平面。这种设计和实现在安全性及避免多集群停止运行上也是错误的。
- 成熟度：federation 项目相对比较新，还不是很成熟。并不是所有资源都可用，许多仍然处于 alpha 状态。 [Issue 88](https://github.com/kubernetes/kubernetes/issues/88) 列举了团队目前正忙于解决的与系统相关的已知问题。

### 混合云能力

Kubernetes 集群 federation 可以包含运行在不同云服务提供商（例如 Google Cloud、AWS）及本地（例如在 OpenStack 上）的集群。您只需要按需在适合的云服务提供商和/或地点上简单的创建集群，然后向 Federation API Server 注册每个集群的 API endpoint 和凭据即可。

此后，您的 [API 资源](https://kubernetes.io/docs/concepts/cluster-administration/federation/) 就可以跨越不同的集群和云服务提供商。

## 设置 federation

为了能够联合（federate）多个集群，首先需要建立一个 federation 控制平面。请按照 [设置指南](https://kubernetes.io/docs/tutorials/federation/set-up-cluster-federation-kubefed) 设置 federation 控制平面。

## 级联删除

Kubernetes 1.6 版本包括了对联邦资源（federated resources）级联删除的支持。通过级联删除，当您从 federation 控制平面删除一个资源时，会同时删除所有底层集群中对应的资源。

当使用 REST API 时，级联删除没有默认开启。要想在使用 REST API 从 federation 控制平面删除资源时启用级联删除，请设置 `DeleteOptions.orphanDependents=false` 选项。使用 `kubectl delete` 时默认使用级联删除。您可以通过运行 `kubectl delete --cascade=false` 来禁用该功能。

注意：Kubernetes 1.5 版本支持的级联删除仅支持部分 federation 资源。

## 单个集群范围

在诸如 Google Compute Engine 或者 Amazon Web Services 等 IaaS 服务提供商中，虚拟机存在于 [区域](https://cloud.google.com/compute/docs/zones) 或 [可用区](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html) 上。我们建议 Kubernetes 集群中的所有虚拟机应该位于相同的可用区，因为：

- 与拥有单个全局 Kubernetes 集群相比，单点故障更少。
- 与跨可用区集群相比，推测单区域集群的可用性属性更容易。
- 当 Kubernetes 开发人员设计系统时（例如对延迟，带宽或相关故障进行假设），它们假设所有的机器都在一个单一的数据中心，或以其它方式紧密连接。

在每个可用区域同时拥有多个集群也是可以的，但总体而言，我们认为少一点更好。 选择较少集群的理由是：

- 某些情况下，在一个集群中拥有更多的节点可以改进 Pod 的装箱打包（较少资源碎片）。
- 减少运维开销（尽管随着运维工具和流程的成熟，优势已经减少）。
- 减少每个集群固定资源成本的开销，例如 apiserver 虚拟机（但对于大中型集群的整体集群成本来说百分比很小）。

拥有多个集群的原因包括：

- 严格的安全策略要求将一类工作与另一类工作隔离开来（但是，请参见下面的分区集群（Partitioning Clusters））。
- 对新的 Kubernetes 发行版或其它集群软件进行灰度测试。

## 选择正确的集群数量

Kubernetes 集群数量的选择可能是一个相对静态的选择，只是偶尔重新设置。相比之下，依据负载情况和增长，集群的节点数量和 service 的 pod 数量可能会经常变化。

要选择集群的数量，首先要确定使用哪些区域，以便为所有终端用户提供足够低的延迟，以在 Kubernetes 上运行服务（如果您使用内容分发网络（Content Distribution Network，CDN），则 CDN 托管内容的时延要求不需要考虑）。法律问题也可能影响到这一点。例如，拥有全球客户群的公司可能会决定在美国、欧盟、亚太和南亚地区拥有集群。我们将选择的区域数量称为 `R`。

其次，决定在整体仍然可用的前提下，可以同时有多少集群不可用。将不可用集群的数量称为 `U`。如果您不能确定，那么 1 是一个不错的选择。

如果在集群故障的情形下允许负载均衡将流量引导到任何区域，则至少需要有比 `R` 或 `U + 1` 数量更大的集群。如果不行的话（例如希望在集群发生故障时对所有用户确保低延迟），那么您需要有数量为 `R * (U + 1)` 的集群（`R` 个区域，每个中有 `U + 1` 个集群）。无论如何，请尝试将每个集群放在不同的区域中。

最后，如果您的任何集群需要比 Kubernetes 集群最大建议节点数更多的节点，那么您可能需要更多的集群。 Kubernetes v1.3 支持最多 1000 个节点的集群。 Kubernetes v1.8 支持最多 5000 个节点的集群。

---

原文地址：https://kubernetes.io/docs/concepts/cluster-administration/federation/

译文地址：https://k8smeetup.github.io/docs/concepts/cluster-administration/federation/
