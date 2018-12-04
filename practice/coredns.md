# 安装配置CoreDNS

CoreDNS可以在具有标准的Kube-DNS的Kubernetes集群中运行。作为Kubernetes 的插件使用，CoreDNS将从
Kubernetes集群中读取区（zone）数据。它实现了为Kubernetes的DNS服务发现定义的规范：[Kubernetes DNS-Based Service Discovery](https://github.com/kubernetes/dns/blob/master/docs/specification.md)。

## 部署CoreDNS

部署 CoreDNS 需要使用到官方提供的两个文件 [deploy.sh](https://github.com/coredns/deployment/blob/master/kubernetes/deploy.sh)和[coredns.yaml.sed](https://github.com/coredns/deployment/blob/master/kubernetes/coredns.yaml.sed)（这两个文件已经放入manifest的coredns目录中）

`deploy.sh` 是一个用于在已经运行kube-dns的集群中生成运行CoreDNS部署文件（manifest）的工具脚本。它使用 `coredns.yaml.sed`文件作为模板，创建一个ConfigMap和CoreDNS的deployment，然后更新集群中已有的kube-dns
服务的selector使用CoreDNS的deployment。重用已有的服务并不会在服务的请求中发生冲突。

`deploy.sh`文件并不会删除kube-dns的deployment或者replication controller。如果要删除kube-dns，你必须在部署CoreDNS后手动的删除kube-dns。

你需要仔细测试manifest文件，以确保它能够对你的集群正常运行。这依赖于你的怎样构建你的集群以及你正在运行的集群版本。

对manifest文件做一些修改是有比要的。

在最佳的案例场景中，使用CoreDNS替换Kube-DNS只需要使用下面的两个命令：

```bash
$ ./deploy.sh | kubectl apply -f -
$ kubectl delete --namespace=kube-system deployment kube-dns
```

注意：我们建议在部署CoreDNS后删除kube-dns。否则如果CoreDNS和kube-dns同时运行，服务查询可能会随机的在CoreDNS和kube-dns之间产生。

对于非RBAC部署，你需要编辑生成的结果yaml文件：
1. 从yaml文件的`Deployment`部分删除 `serviceAccountName: coredns`
2. 删除 `ServiceAccount`、 `ClusterRole `和 `ClusterRoleBinding` 部分

## 参考

- [Kubernetes DNS-Based Service Discovery](https://github.com/kubernetes/dns/blob/master/docs/specification.md)