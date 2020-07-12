# Namespace

在一个 Kubernetes 集群中可以使用 namespace 创建多个 “虚拟集群”，这些 namespace 之间可以完全隔离，也可以通过某种方式，让一个 namespace 中的 service 可以访问到其他的 namespace 中的服务，我们 [在 CentOS 中部署 kubernetes1.6 集群](../practice/install-kubernetes-on-centos.md) 的时候就用到了好几个跨越 namespace 的服务，比如 Traefik ingress 和 `kube-system`namespace 下的 service 就可以为整个集群提供服务，这些都需要通过 RBAC 定义集群级别的角色来实现。

## 哪些情况下适合使用多个 namespace

因为 namespace 可以提供独立的命名空间，因此可以实现部分的环境隔离。当你的项目和人员众多的时候可以考虑根据项目属性，例如生产、测试、开发划分不同的 namespace。

## Namespace 使用

**获取集群中有哪些 namespace **

```kubectl get ns```

集群中默认会有 `default` 和 `kube-system` 这两个 namespace。

在执行 `kubectl` 命令时可以使用 `-n` 指定操作的 namespace。

用户的普通应用默认是在 `default` 下，与集群管理相关的为整个集群提供服务的应用一般部署在 `kube-system` 的 namespace 下，例如我们在安装 kubernetes 集群时部署的 `kubedns`、`heapseter`、`EFK` 等都是在这个 namespace 下面。

另外，并不是所有的资源对象都会对应 namespace，`node` 和 `persistentVolume` 就不属于任何 namespace。
