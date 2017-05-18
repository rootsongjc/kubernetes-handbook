# Kubernetes中的网络模式解析

Kubernetes本身不提供网络模式，而是通过[CNI网络插件](https://kubernetes.io/docs/concepts/cluster-administration/network-plugins/)实现，这与docker中使用的libnetwork（CNM的一种实现）不同，可关于CNM和CNI的详细信息可以参考[Rancher网络探讨和扁平网络实现](https://rootsongjc.github.io/docker-practice/docs/rancher_network.html)。

一般情况下第一次安装和试用kubernetes的时候都会推荐使用flannel这个网络插件，这也是官方文档中推荐的，vxlan网络模式是最常使用的，但是这种模式对网络的损耗较大，大约在40%至50%，而host-gw模式对网络的损耗比较小，只有10%左右。

关于flannel的几种网络模式和性能测试请参考[Comparison of Networking Solutions for Kubernetes](http://machinezone.github.io/research/networking-solutions-for-kubernetes/#comparison-of-networking-solutions-for-kubernetes)。

Flannel的配置参考[Flannel configuration](https://github.com/coreos/flannel/blob/master/Documentation/configuration.md)。

## Flannel host-gw模式架构

参考[OpenShift Flannel Architectrue](https://docs.openshift.com/container-platform/3.4/architecture/additional_concepts/flannel.html)

Flannel的host-gw模式映射容器到容器的路由信息，kubernetes的每个node都会运行一个**flanneld**进程，它有以下几个职责：

- 为每个node分配一个独立的subnet
- 为每个pod分配一个独立的IP地址
- 映射容器到容器的路由信息，即便是不同主机上的容器

每个flanneld进程都会将信息发送到etcd集群中存储，这样每个node就都可以在flannel网络中获取容器的路由信息。

下图是flannel host-gw模式的架构图

![arch](../images/flannel-host-gw-arch.png)

图片来源：[OpenShift Doc](https://docs.openshift.com/container-platform/3.4/architecture/additional_concepts/flannel.html)

查看Node1和Node2的路由信息，你将会看到：

**Node1**

```
default via 192.168.0.100 dev eth0 proto static metric 100
10.1.15.0/24 dev docker0 proto kernel scope link src 10.1.15.1
10.1.20.0/24 via 192.168.0.200 dev eth0
```

**Node2**

```
default via 192.168.0.200 dev eth0 proto static metric 100
10.1.20.0/24 dev docker0 proto kernel scope link src 10.1.20.1
10.1.15.0/24 via 192.168.0.100 dev eth0
```

