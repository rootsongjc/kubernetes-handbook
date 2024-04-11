---
weight: 5
title: Etcd 解析
date: '2022-05-21T00:00:00+08:00'
type: book
---

Etcd 是 Kubernetes 集群中的一个十分重要的组件，用于保存集群所有的网络配置和对象的状态信息。在后面具体的安装环境中，我们安装的 etcd 的版本是 v3.1.5，整个 Kubernetes 系统中一共有两个服务需要用到 etcd 用来协同和存储配置，分别是：

- 网络插件 flannel、对于其它网络插件也需要用到 etcd 存储网络的配置信息
- Kubernetes 本身，包括各种对象的状态和元信息配置

**注意**：flannel 操作 etcd 使用的是 v2 的 API，而 Kubernetes 操作 etcd 使用的 v3 的 API，所以在下面我们执行 `etcdctl` 的时候需要设置 `ETCDCTL_API` 环境变量，该变量默认值为 2。

## 原理

Etcd 使用的是 raft 一致性算法来实现的，是一款分布式的一致性 KV 存储，主要用于共享配置和服务发现。关于 raft 一致性算法请参考 [该动画演示](http://thesecretlivesofdata.com/raft/)。

关于 Etcd 的原理解析请参考 [Etcd 架构与实现解析](http://jolestar.com/etcd-architecture/)。

## 使用 Etcd 存储 Flannel 网络信息

我们在安装 Flannel 的时候配置了 `FLANNEL_ETCD_PREFIX="/kube-centos/network"` 参数，这是 Flannel 查询 etcd 的目录地址。

查看 Etcd 中存储的 flannel 网络信息：

```ini
$ etcdctl --ca-file=/etc/kubernetes/ssl/ca.pem --cert-file=/etc/kubernetes/ssl/kubernetes.pem --key-file=/etc/kubernetes/ssl/kubernetes-key.pem ls /kube-centos/network -r
2018-01-19 18:38:22.768145 I | warning: ignoring ServerName for user-provided CA for backwards compatibility is deprecated
/kube-centos/network/config
/kube-centos/network/subnets
/kube-centos/network/subnets/172.30.31.0-24
/kube-centos/network/subnets/172.30.20.0-24
/kube-centos/network/subnets/172.30.23.0-24
```查看 flannel 的配置：```bash
$ etcdctl --ca-file=/etc/kubernetes/ssl/ca.pem --cert-file=/etc/kubernetes/ssl/kubernetes.pem --key-file=/etc/kubernetes/ssl/kubernetes-key.pem get /kube-centos/network/config
2018-01-19 18:38:22.768145 I | warning: ignoring ServerName for user-provided CA for backwards compatibility is deprecated
{"Network": "172.30.0.0/16", "SubnetLen": 24, "Backend": { "Type": "host-gw"} }
```

## 使用 Etcd 存储 Kubernetes 对象信息

Kubernetes 使用 etcd v3 的 API 操作 etcd 中的数据。所有的资源对象都保存在 `/registry` 路径下，如下：

```ini
ThirdPartyResourceData
apiextensions.k8s.io
apiregistration.k8s.io
certificatesigningrequests
clusterrolebindings
clusterroles
configmaps
controllerrevisions
controllers
daemonsets
deployments
events
horizontalpodautoscalers
ingress
limitranges
minions
monitoring.coreos.com
namespaces
persistentvolumeclaims
persistentvolumes
poddisruptionbudgets
pods
ranges
replicasets
resourcequotas
rolebindings
roles
secrets
serviceaccounts
services
statefulsets
storageclasses
thirdpartyresources
```

如果你还创建了 CRD（自定义资源定义），则在此会出现 CRD 的 API。

### 查看集群中所有的 Pod 信息

例如我们直接从 etcd 中查看 kubernetes 集群中所有的 pod 的信息，可以使用下面的命令：

```bash
ETCDCTL_API=3 etcdctl get /registry/pods --prefix -w json|python -m json.tool
```

此时将看到 json 格式输出的结果，其中的`key`使用了`base64` 编码，关于 etcdctl 命令的详细用法请参考 [使用 etcdctl 访问 kubernetes 数据](../../guide/using-etcdctl-to-access-kubernetes-data/)。

## Etcd V2 与 V3 版本 API 的区别

Etcd V2 和 V3 之间的数据结构完全不同，互不兼容，也就是说使用 V2 版本的 API 创建的数据只能使用 V2 的 API 访问，V3 的版本的 API 创建的数据只能使用 V3 的 API 访问。这就造成我们访问 etcd 中保存的 flannel 的数据需要使用 `etcdctl` 的 V2 版本的客户端，而访问 kubernetes 的数据需要设置 `ETCDCTL_API=3` 环境变量来指定 V3 版本的 API。

## Etcd 数据备份

我们安装的时候指定的 Etcd 数据的存储路径是 `/var/lib/etcd`，一定要对该目录做好备份。

## 参考

- [etcd 官方文档 - etcd.io](https://etcd.io/)
- [etcd v3 命令和 API - blog.csdn.net](http://blog.csdn.net/u010278923/article/details/71727682)
- [Etcd 架构与实现解析 - jolestar.com](http://jolestar.com/etcd-architecture/)
