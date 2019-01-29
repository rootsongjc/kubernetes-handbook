# 生产级的Kubernetes简化管理工具kubeadm

Kubeadm 在2018年12月3日发布的 [Kubernetes 1.13](https://kubernetes.io/blog/2018/12/03/kubernetes-1-13-release-announcement/) 版本中已经宣布 GA，可以支持生产。本文是对 kubeadmin 的先关介绍，详细信息请参考 [Overview of kubeadm](https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm/)。

## 基本介绍
**kubeadm** 是一个工具包，可帮助您以简单，合理安全和可扩展的方式引导最佳实践Kubernetes群集。它还支持为您管理[Bootstrap Tokens](https://kubernetes.io/docs/reference/access-authn-authz/bootstrap-tokens/)并升级/降级群集。

kubeadm的目标是建立一个通过Kubernetes一致性测试Kubernetes Conformance tests的最小可行集群 ，但不会安装其他功能插件。

它在设计上并未为您安装网络解决方案，需要用户自行安装第三方符合CNI的网络解决方案（如flanal，calico，canal等）。

kubeadm可以在多种设备上运行，可以是Linux笔记本电脑，虚拟机，物理/云服务器或Raspberry Pi。这使得kubeadm非常适合与不同种类的配置系统（例如Terraform，Ansible等）集成。

kubeadm是一种简单的方式让新用户开始尝试Kubernetes，也可能是第一次让现有用户轻松测试他们的应用程序并缝合到一起的方式，也可以作为其他生态系统中的构建块，或者具有更大范围的安装工具。

可以在支持安装deb或rpm软件包的操作系统上非常轻松地安装kubeadm。SIG集群生命周期[SIG Cluster Lifecycle](https://github.com/kubernetes/community/tree/master/sig-cluster-lifecycle) kubeadm的SIG相关维护者提供了预编译的这些软件包，也可以在其他操作系统上使用。

## kubeadm 成熟度

| 分类                    | 成熟度 Level |
|---------------------------|--------------- |
| Command line UX           | beta           |
| Implementation            | beta           |
| Config file API           | alpha          |
| Self-hosting              | alpha          |
| kubeadm alpha subcommands | alpha          |
| CoreDNS                   | alpha          |
| DynamicKubeletConfig      | alpha          |

kubeadm的整体功能状态为 **Beta**，即将在2018 年推向 **General Availability（GA）**。一些子功能（如自托管或配置文件API）仍在积极开发中。随着这个工具的发展，创建集群的实现可能会稍微改变，但总体实现应该相当稳定。根据`kubeadm alpha`定义，任何命令 都在alpha级别上受支持。


## 支持时间表

Kubernetes版本通常支持九个月，在此期间，如果发现严重的错误或安全问题，可能会从发布分支发布补丁程序版本。这里是最新的Kubernetes版本和支持时间表; 这也适用于 `kubeadm`.

| Kubernetes version | Release month  | End-of-life-month |
|--------------------|----------------|-------------------|
| v1.6.x             | March 2017     | December 2017     |
| v1.7.x             | June 2017      | March 2018        |
| v1.8.x             | September 2017 | June 2018         |
| v1.9.x             | December 2017  | September 2018    |
| v1.10.x            | March 2018     | December 2018     |

## 参考

- [Overview of kubeadm](https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm/)