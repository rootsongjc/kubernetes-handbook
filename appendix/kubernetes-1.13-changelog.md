# Kubernetes 1.13 更新日志

2018年12月3日，Kubernetes 1.13发布，这是2018年发布的第四个也是最后一个大版本。该版本中最显著地改进包括：

- 使用 [kubeadm](https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm/) 简化集群管理
- [CSI](../concepts/csi.md)（容器存储接口），[查看  CSI 规范](https://github.com/container-storage-interface/spec)
- [CoreDNS](https://github.com/coredns/coredns) 作为默认的 DNS

以上功能正式成为 GA（General Available）。

还有其他一些小的功能更新，例如：

- 支持第三方设备监控插件成为 alpha 功能。
- kubelet 设备插件注册 GA。
- 拓扑感知的 Volume 调度进入 stable。
- APIServer DryRun 进入 beta。
- kubectl diff 进入 beta。
- 使用 PV 源的原始块设备进入 beta。

详细的更新日志请访问 [Kubernetes 1.13: Simplified Cluster Management with Kubeadm, Container Storage Interface (CSI), and CoreDNS as Default DNS are Now Generally Available](https://kubernetes.io/blog/2018/12/03/kubernetes-1-13-release-announcement/)。

## 参考

- [Overview of kubeadm](https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm/)
- [Kubernetes 1.13: Simplified Cluster Management with Kubeadm, Container Storage Interface (CSI), and CoreDNS as Default DNS are Now Generally Available](https://kubernetes.io/blog/2018/12/03/kubernetes-1-13-release-announcement/)