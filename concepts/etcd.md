# Etcd解析

Etcd是Kubernetes集群中的一个十分重要的组件，用于保存集群所有的网络配置和对象的状态信息。在后面具体的安装环境中，我们安装的etcd的版本是v3.1.5，整个kubernetes系统中一共有两个服务需要用到etcd用来协同和存储配置，分别是：

- 网络插件flannel、对于其它网络插件也需要用到etcd存储网络的配置信息
- kubernetes本身，包括各种对象的状态和元信息配置

**注意**：flannel操作etcd使用的是v2的API，而kubernetes操作etcd使用的v3的API，所以在下面我们执行`etcdctl`的时候需要设置`ETCDCTL_API`环境变量，该变量默认值为2。

## 原理

Etcd使用的是raft一致性算法来实现的，是一款分布式的一致性KV存储，主要用于共享配置和服务发现。关于raft一致性算法请参考[该动画演示](http://thesecretlivesofdata.com/raft/)。

关于Etcd的原理解析请参考[Etcd 架构与实现解析](http://jolestar.com/etcd-architecture/)。

## 使用Etcd存储Flannel网络信息

我们在安装Flannel的时候配置了`FLANNEL_ETCD_PREFIX="/kube-centos/network"`参数，这是Flannel查询etcd的目录地址。

查看Etcd中存储的flannel网络信息：

```ini
$ etcdctl --ca-file=/etc/kubernetes/ssl/ca.pem --cert-file=/etc/kubernetes/ssl/kubernetes.pem --key-file=/etc/kubernetes/ssl/kubernetes-key.pem ls /kube-centos/network -r
2018-01-19 18:38:22.768145 I | warning: ignoring ServerName for user-provided CA for backwards compatibility is deprecated
/kube-centos/network/config
/kube-centos/network/subnets
/kube-centos/network/subnets/172.30.31.0-24
/kube-centos/network/subnets/172.30.20.0-24
/kube-centos/network/subnets/172.30.23.0-24
```

查看flannel的配置：

```bash
$ etcdctl --ca-file=/etc/kubernetes/ssl/ca.pem --cert-file=/etc/kubernetes/ssl/kubernetes.pem --key-file=/etc/kubernetes/ssl/kubernetes-key.pem get /kube-centos/network/config
2018-01-19 18:38:22.768145 I | warning: ignoring ServerName for user-provided CA for backwards compatibility is deprecated
{ "Network": "172.30.0.0/16", "SubnetLen": 24, "Backend": { "Type": "host-gw" } }
```

## 使用Etcd存储Kubernetes对象信息

Kubernetes使用etcd v3的API操作etcd中的数据。所有的资源对象都保存在`/registry`路径下，如下：

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

如果你还创建了CRD（自定义资源定义），则在此会出现CRD的API。

### 查看集群中所有的Pod信息

例如我们直接从etcd中查看kubernetes集群中所有的pod的信息，可以使用下面的命令：

```bash
ETCDCTL_API=3 etcdctl get /registry/pods --prefix -w json|python -m json.tool
```

此时将看到json格式输出的结果，其中的`key`使用了`base64`编码，关于etcdctl命令的详细用法请参考[使用etcdctl访问kubernetes数据](../guide/using-etcdctl-to-access-kubernetes-data.md)。

## Etcd V2与V3版本API的区别

Etcd V2和V3之间的数据结构完全不同，互不兼容，也就是说使用V2版本的API创建的数据只能使用V2的API访问，V3的版本的API创建的数据只能使用V3的API访问。这就造成我们访问etcd中保存的flannel的数据需要使用`etcdctl`的V2版本的客户端，而访问kubernetes的数据需要设置`ETCDCTL_API=3`环境变量来指定V3版本的API。

## Etcd数据备份

我们安装的时候指定的Etcd数据的存储路径是`/var/lib/etcd`，一定要对该目录做好备份。

## 参考

- [etcd官方文档](https://coreos.com/etcd/docs/latest)
- [etcd v3命令和API](http://blog.csdn.net/u010278923/article/details/71727682)
- [Etcd 架构与实现解析](http://jolestar.com/etcd-architecture/)
