# 安装配置 CoreDNS

CoreDNS 可以在具有标准的 Kube-DNS 的 Kubernetes 集群中运行。作为 Kubernetes 的插件使用，CoreDNS 将从 Kubernetes 集群中读取区（zone）数据。它实现了为 Kubernetes 的 DNS 服务发现定义的规范：[Kubernetes DNS-Based Service Discovery](https://github.com/kubernetes/dns/blob/master/docs/specification.md)。

## 部署 CoreDNS

部署 CoreDNS 需要使用到官方提供的两个文件 [deploy.sh](https://github.com/coredns/deployment/blob/master/kubernetes/deploy.sh) 和 [coredns.yaml.sed](https://github.com/coredns/deployment/blob/master/kubernetes/coredns.yaml.sed)（这两个文件已经放入 manifest 的 coredns 目录中）

`deploy.sh` 是一个用于在已经运行 kube-dns 的集群中生成运行 CoreDNS 部署文件（manifest）的工具脚本。它使用 `coredns.yaml.sed` 文件作为模板，创建一个 ConfigMap 和 CoreDNS 的 deployment，然后更新集群中已有的 kube-dns 服务的 selector 使用 CoreDNS 的 deployment。重用已有的服务并不会在服务的请求中发生冲突。

`deploy.sh` 文件并不会删除 kube-dns 的 deployment 或者 replication controller。如果要删除 kube-dns，你必须在部署 CoreDNS 后手动的删除 kube-dns。

你需要仔细测试 manifest 文件，以确保它能够对你的集群正常运行。这依赖于你的怎样构建你的集群以及你正在运行的集群版本。

对 manifest 文件做一些修改是有比要的。

在最佳的案例场景中，使用 CoreDNS 替换 Kube-DNS 只需要使用下面的两个命令：

```bash
$ ./deploy.sh | kubectl apply -f -
$ kubectl delete --namespace=kube-system deployment kube-dns
```

注意：我们建议在部署 CoreDNS 后删除 kube-dns。否则如果 CoreDNS 和 kube-dns 同时运行，服务查询可能会随机的在 CoreDNS 和 kube-dns 之间产生。

对于非 RBAC 部署，你需要编辑生成的结果 yaml 文件：

1. 从 yaml 文件的 `Deployment` 部分删除 `serviceAccountName: coredns`
2. 删除 `ServiceAccount`、 `ClusterRole` 和 `ClusterRoleBinding` 部分

## 参考

- [Kubernetes DNS-Based Service Discovery - github.com](https://github.com/kubernetes/dns/blob/master/docs/specification.md)
