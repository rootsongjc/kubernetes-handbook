# Kubernetes1.11更新日志

2018年6月27日，Kubernetes1.11版本发布，这也是Kubernetes在2018年度的第二个大版本。该版本最大的变化是增强了集群内负载均衡，CoreDNS毕业成为GA版本，作为Kubernetes内置默认DNS服务。

该版本的主要亮点集中在网络层面，SIG-API Machinery和SIG-Node的两项主要功能成为beta版本，同时进一步增强存储功能。利用该版本，用户将能够更轻松地将任意基础设施——无论云平台还是内部环境——接入Kubernetes当中。

本版本最值得关注的是增加了两项备受期待的功能，分别为：基于IPVS的集群内负载均衡，以及将CoreDNS作为集群DNS的附加选项——这意味着生产应用的可扩展性与灵活性都将得到提升。

可以称得上是亮点的功能有：

## 基于IPVS的集群内服务负载均衡正式上线

IPVS（即IP虚拟服务器）能够提供高性能内核负载均衡功能，且其编程接口较iptables更为简单，且网络吞吐量更上一层楼、提供更低的编程延迟，但是仍然不是默认配置，需要自己配置打开。

## CoreDNS正式上线

CoreDNS之前一直是作为Kuberentes的一个插件独立开发，Kubernetes中最早使用的是名为KubeDNS的DNS组件，CoreDNS是一套灵活且可扩展的权威DNS服务器，可直接与Kubernetes API相集成。相较于原有DNS服务器，CoreDNS的移动部件更少——仅包含单一可执行文件与单一进程，且允许用户通过创建自定义DNS条目以支持更为灵活的用例。其同样使用Go语言编写而成，因此天然具备更理想的安全性水平。

## 动态Kubelet配置进入Beta阶段

通过这项改进，用户可以将新的Kubelet配置部署在运行中的集群之内。此前，Kubelet需要通过命令行标记进行配置，这导致我们很难对运行中的集群进行Kubelet配置更新。在此次beta功能的帮助下，[用户将能够通过API Server随时配置集群中运行中的Kubelet](https://kubernetes.io/docs/tasks/administer-cluster/reconfigure-kubelet/)。  

## 自定义资源定义（CRD）现在可定义多个版本

CRD不再局限于对单一版本的定制化资源作出定义。如今，利用[此项](https://github.com/kubernetes/features/issues/544)beta测试功能，用户可以为资源定义多个版本。未来，其还将进一步扩展以支持版本间自动转换功能。目前，该功能允许定制化资源作者“以安全变更的方式实现版本升级，例如由`v1beta1`切换至`v1`“，并为发生变化的资源创建迁移路径。

## 存储增强

主要是增强了CSI，1.11版本为CSI带来了对原始数据块分卷的alph支持能力，将CSI与新的kubelet插件注册机制相集成，同时降低了向CSI插件传递秘密凭证的难度。支持对持久分卷进行[在线大小调整](https://github.com/kubernetes/features/issues/284)（alpha版本）。这意味着用户能够增加持久分卷的大小，而完全无需终止pod并卸载对应分卷。用户可以更新VPC以提交新的分卷大小请求，kubelet则负责完成文件系统的大小调整。 

## 参考

- [Kubernetes 1.11: In-Cluster Load Balancing and CoreDNS Plugin Graduate to General Availability](https://kubernetes.io/blog/2018/06/27/kubernetes-1.11-release-announcement/)