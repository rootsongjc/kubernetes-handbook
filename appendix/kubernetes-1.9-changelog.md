# Kubernetes1.9更新日志

2017年12月15日，kubernetes1.9版本发布。Kubernetes依然按照每三个月一个大版本发布的速度稳定迭代，这是今年发布的第四个版本，也是今年的最后一个版本，该版本最大的改进是Apps Workloads API成为稳定版本，这消除了很多潜在用户对于该功能稳定性的担忧。还有一个重大更新，就是测试支持了Windows了，这打开了在kubernetes中运行Windows工作负载的大门。

## Workloads API GA

[apps/v1 Workloads API](https://kubernetes.io/docs/reference/workloads-18-19/)成为GA（General Availability），且默认启用。 Apps Workloads API将**DaemonSet**、**Deployment**、**ReplicaSet**和**StatefulSet** API组合在一起，作为Kubernetes中长时间运行的无状态和有状态工作负载的基础。

Deployment和ReplicaSet是Kubernetes中最常用的两个对象，经过一年多的实际使用和反馈后，现在已经趋于稳定。[SIG apps](https://github.com/kubernetes/community/tree/master/sig-apps)同时将这些经验应用到另外的两个对象上，使得DaemonSet和StatefulSet也能顺利毕业走向成熟。v1（GA）意味着已经生产可用，并保证长期的向后兼容。

## Windows支持（beta）

Kubernetes最初是为Linux系统开发的，但是用户逐渐意识到容器编排的好处，我们看到有人需要在Kubernetes上运行Windows工作负载。在12个月前，我们开始认真考虑在Kubernetes上支持Windows Server的工作。 [SIG-Windows](https://github.com/kubernetes/community/tree/master/sig-windows)现在已经将这个功能推广到beta版本，这意味着我们可以评估它的[使用情况](https://kubernetes.io/docs/getting-started-guides/windows/)。

## 增强存储

kubernetes从第一个版本开始就支持多种持久化数据存储，包括常用的NFS或iSCSI，以及对主要公共云和私有云提供商的存储解决方案的原生支持。随着项目和生态系统的发展，Kubernetes的存储选择越来越多。然而，为新的存储系统添加volume插件一直是一个挑战。

**容器存储接口（CSI）**是一个跨行业标准计划，旨在降低云原生存储开发的障碍并确保兼容性。 [SIG-Storage](https://github.com/kubernetes/community/tree/master/sig-storage)和[CSI社区](https://github.com/container-storage-interface/community)正在合作提供一个单一接口，用于配置、附着和挂载与Kubernetes兼容的存储。

Kubernetes 1.9引入了容器存储接口（CSI）的alpha实现，这将使挂载新的volume插件就像部署一个pod一样简单，并且第三方存储提供商在开发他们的解决方案时也无需修改kubernetes的核心代码。

由于该功能在1.9版本中为alpha，因此必须明确启用该功能，不建议用于生产使用，但它为更具扩展性和基于标准的Kubernetes存储生态系统提供了清晰的路线图。

## 其它功能

自定义资源定义（CRD）校验，现在已经成为beta，默认情况下已启用，可以用来帮助CRD作者对于无效对象定义给出清晰和即时的反馈。

SIG Node硬件加速器转向alpha，启用GPU，从而实现机器学习和其他高性能工作负载。

CoreDNS alpha可以使用标准工具来安装CoreDNS。

kube-proxy的IPVS模式进入beta版，为大型集群提供更好的可扩展性和性能。

社区中的每个特别兴趣小组（SIG）继续提供其所在领域的用户最迫切需要的功能。有关完整列表，请访问[发行说明](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG.md#v190)。

## 获取

Kubernetes1.9已经可以通过[GitHub下载](https://github.com/kubernetes/kubernetes/releases/tag/v1.9.0)。
