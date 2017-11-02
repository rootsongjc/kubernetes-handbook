# 手动升级kubernetes集群

目前kubernetes的官方文档上并没有详细的手动安装的集群如何升级的参考资料，只有两篇关于kubernetes集群升级的文档。

- 在ubuntu上如何使用juju升级：https://kubernetes.io/docs/getting-started-guides/ubuntu/upgrades/
- 使用kubeadm升级：https://kubernetes.io/docs/getting-started-guides/ubuntu/upgrades/

手动升级的还没有详细的方案，大多是基于管理工具部署和升级，比如juju、kubeadm、kops、kubespray等。

[manual upgrade/downgrade testing for Kubernetes 1.6 - google group](https://groups.google.com/forum/#!topic/kubernetes-dev/jDbGKAsfo4Q)，在这个Google group中讨论了kubernetes手动升级的问题，并给出了参考建议。

## 参考

- [Cluster Upgrade #2524](https://github.com/kubernetes/kubernetes/issues/2524)
- [Upgrading self-hosted Kubernetes](https://coreos.com/matchbox/docs/latest/bootkube-upgrades.html)
- [Upgrading Kubernetes - kops](https://github.com/kubernetes/kops/blob/master/docs/upgrade.md)
- [Upgrading kubeadm clusters from 1.6 to 1.7](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm-upgrade-1-7/)
- [How to Upgrade a Kubernetes Cluster With No Downtime](https://medium.com/retailmenot-engineering/zero-downtime-kubernetes-cluster-upgrades-aab4cac943d2)
- [manual upgrade/downgrade testing for Kubernetes 1.6 - google group](https://groups.google.com/forum/#!topic/kubernetes-dev/jDbGKAsfo4Q)
- [Notes/Instructions for Manual Upgrade Testing1.5 -> 1.6](https://docs.google.com/document/d/1DtQFhxmKSZJJ_yv8ttweqotburHHZWxaCYnFbjLDA5g/edit)
- [Upgrading Kubernetes in Kubespray](https://github.com/kubernetes-incubator/kubespray/blob/master/docs/upgrades.md)