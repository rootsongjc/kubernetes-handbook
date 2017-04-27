## 问题记录

安装、使用kubernetes的过程中遇到的所有问题的记录。

推荐直接在Kubernetes的GitHub上[提issue](https://github.com/kubernetes/kubernetes/issues/new)，在此记录所提交的issue。

## 1.[Failed to start ContainerManager failed to initialise top level QOS containers #43856](https://github.com/kubernetes/kubernetes/issues/43856)

重启kubelet时报错，目前的解决方法是：

1.在docker.service配置中增加的`--exec-opt native.cgroupdriver=systemd`配置。

2.手动删除slice（貌似不管用）

3.重启主机，这招最管用😄

```bash
for i in $(systemctl list-unit-files —no-legend —no-pager -l | grep —color=never -o .*.slice | grep kubepod);do systemctl stop $i;done
```

上面的几种方法在该bug修复前只有重启主机管用，该bug已于2017年4月27日修复，merge到了master分支，见https://github.com/kubernetes/kubernetes/pull/44940

## 2.[High Availability of Kube-apiserver #19816](https://github.com/kubernetes/kubernetes/issues/19816)

API server的HA如何实现？或者说这个master节点上的服务`api-server`、`scheduler`、`controller` 如何实现HA？目前的解决方案是什么？
