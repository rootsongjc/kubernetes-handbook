# Kubernetes中的网络

Kubernetes中的网络可以说对初次接触Kubernetes或者没有网络方面经验的人来说可能是其中最难的部分。Kubernetes本身并不提供网络功能，只是把网络接口开放出来，通过插件的形式实现。

## 网络要解决的问题

既然Kubernetes中将容器的联网通过插件的方式来实现，那么该如何解决容器的联网问题呢？

如果您在本地单台机器上运行docker容器的话会注意到所有容器都会处在`docker0`网桥自动分配的一个网络IP段内（172.17.0.1/16）。该值可以通过docker启动参数`--bip`来设置。这样所有本地的所有的容器都拥有了一个IP地址，而且还是在一个网段内彼此就可以互相通信了。

但是Kubernetes管理的是集群，Kubernetes中的网络要解决的核心问题就是每台主机的IP地址网段划分，以及单个容器的IP地址分配。概括为：

- 保证每个Pod拥有一个集群内唯一的IP地址
- 保证不同节点的IP地址划分不会重复
- 保证跨节点的Pod可以互相通信
- 保证不同节点的Pod可以与跨节点的主机互相通信

为了解决该问题，出现了一系列开源的Kubernetes中的网络插件与方案，如：

- flannel
- calico
- contiv
- weave net
- kube-router
- cilium
- canal

还有很多就不一一列举了，只要实现Kubernetes官方的设计的[CNI - Container Network Interface（容器网络接口）](cni.md)就可以自己写一个网络插件。

下面仅以当前最常用的flannel和calico插件为例解析。

- [Kubernetes中的网络解析——以flannel为例](flannel.md)
- [Kubernetes中的网络解析——以calico为例](calico.md)
