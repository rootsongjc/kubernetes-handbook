# Kubernetes1.12更新日志

该版本发布继续关注Kubernetes的稳定性，主要是内部改进和一些功能的毕业。该版本中毕业的功能有安全性和Azure的关键功能。此版本中还有两个毕业的值得注意的新增功能：Kubelet TLS Bootstrap和 Azure Virtual Machine Scale Sets（AVMSS）支持。

这些新功能意味着更高的安全性、可用性、弹性和易用性，可以更快地将生产应用程序推向市场。该版本还表明Kubernetes在开发人员方面日益成熟。

下面是该版本中的一些关键功能介绍。

## Kubelet TLS Bootstrap GA

我们很高兴地宣布[Kubelet TLS Bootstrap GA](https://github.com/kubernetes/features/issues/43)。在Kubernetes 1.4中，我们引入了一个API，用于从集群级证书颁发机构（CA）请求证书。此API的初衷是为kubelet启用TLS客户端证书的配置。此功能允许kubelet将自身引导至TLS安全集群。最重要的是，它可以自动提供和分发签名证书。

之前，当kubelet第一次运行时，必须在集群启动期间在带外进程中为其提供客户端凭据。负担是运营商提供这些凭证的负担。由于此任务对于手动执行和复杂自动化而言非常繁重，因此许多运营商为所有kubelet部署了具有单个凭证和单一身份的集群。这些设置阻止了节点锁定功能的部署，如节点授权器和NodeRestriction准入控制器。

为了缓解这个问题，[SIG Auth](https://github.com/kubernetes/community/tree/master/sig-auth)引入了一种方法，让kubelet生成私钥，CSR用于提交到集群级证书签署过程。v1（GA）标识表示生产加固和准备就绪，保证长期向后兼容。

除此之外，[Kubelet服务器证书引导程序和轮换](https://github.com/kubernetes/features/issues/267)正在转向测试版。目前，当kubelet首次启动时，它会生成一个自签名证书/密钥对，用于接受传入的TLS连接。此功能引入了一个在本地生成密钥，然后向集群API server发出证书签名请求以获取由集群的根证书颁发机构签名的关联证书的过程。此外，当证书接近过期时，将使用相同的机制来请求更新的证书。

## 稳定支持Azure Virtual Machine Scale Sets（VMSS）和Cluster-Autoscaler

Azure Virtual Machine Scale Sets（VMSS）允许您创建和管理可以根据需求或设置的计划自动增加或减少的同类VM池。这使您可以轻松管理、扩展和负载均衡多个VM，从而提供高可用性和应用程序弹性，非常适合可作为Kubernetes工作负载运行的大型应用程序。

凭借这一新的稳定功能，Kubernetes支持[使用Azure VMSS扩展容器化应用程序](https://github.com/kubernetes/features/issues/514)，包括[将其与cluster-autoscaler集成的功能](https://github.com/kubernetes/features/issues/513)根据相同的条件自动调整Kubernetes集群的大小。

## 其他值得注意的功能更新

- [`RuntimeClass`](https://github.com/kubernetes/features/issues/585)是一个新的集群作用域资源，它将容器运行时属性表示为作为alpha功能发布的控制平面。

- [Kubernetes和CSI的快照/恢复功能](https://github.com/kubernetes/features/issues/177)正在作为alpha功能推出。这提供了标准化的API设计（CRD），并为CSI卷驱动程序添加了PV快照/恢复支持。

- [拓扑感知动态配置](https://github.com/kubernetes/features/issues/561)现在处于测试阶段，存储资源现在可以感知自己的位置。这还包括对[AWS EBS](https://github.com/kubernetes/features/issues/567)和[GCE PD](https://github.com/kubernetes/features/issues/558)的beta支持。

- [可配置的pod进程命名空间共享](https://github.com/kubernetes/features/issues/495)处于测试阶段，用户可以通过在PodSpec中设置选项来配置pod中的容器以共享公共PID命名空间。

- [根据条件的taint节点](https://github.com/kubernetes/features/issues/382)现在处于测试阶段，用户可以通过使用taint来表示阻止调度的节点条件。

- Horizo​ntal Pod Autoscaler中的[任意/自定义指标](https://github.com/kubernetes/features/issues/117)正在转向第二个测试版，以测试一些其他增强功能。这项重新设计的Horizo​ntal Pod Autoscaler功能包括对自定义指标和状态条件的支持。

- 允许[Horizo​ntal Pod Autoscaler更快地达到适当大小](https://github.com/kubernetes/features/issues/591)正在转向测试版。

- [Pod的垂直缩放](https://github.com/kubernetes/features/issues/21)现在处于测试阶段，使得可以在其生命周期内改变pod上的资源限制。

- [通过KMS进行静态加密](https://github.com/kubernetes/features/issues/460)目前处于测试阶段。增加了多个加密提供商，包括Google Cloud KMS、Azure Key Vault、AWS KMS和Hashicorp Vault，它们会在数据存储到etcd时对其进行加密。

## 可用性

Kubernetes 1.12可以[在GitHub上下载](https://github.com/kubernetes/kubernetes/releases/tag/v1.12.0)。要开始使用Kubernetes，请查看这些[交互式教程](https://kubernetes.io/docs/tutorials/)。您也可以使用[Kubeadm](https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/)来安装1.12。

## 参考

- [Kubernetes 1.12: Kubelet TLS Bootstrap and Azure Virtual Machine Scale Sets (VMSS) Move to General Availability](https://kubernetes.io/blog/2018/09/27/kubernetes-1.12-kubelet-tls-bootstrap-and-azure-virtual-machine-scale-sets-vmss-move-to-general-availability/)