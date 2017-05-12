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

目前的解决方案是api-server是无状态的可以启动多个，然后在前端再加一个nginx或者ha-proxy。而scheduler和controller都是直接用容器的方式启动的。

## 3.Kubelet启动时Failed to start ContainerManager systemd version does not support ability to start a slice as transient unit

CentOS系统版本7.2.1511

kubelet启动时报错systemd版本不支持start a slice as transient unit。

尝试升级CentOS版本到7.3，看看是否可以修复该问题。

与[kubeadm init waiting for the control plane to become ready on CentOS 7.2 with kubeadm 1.6.1 #228](https://github.com/kubernetes/kubeadm/issues/228)类似。

另外有一个使用systemd管理kubelet的[proposal](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/kubelet-systemd.md)。

## 4.kube-proxy报错kube-proxy[2241]: E0502 15:55:13.889842    2241 conntrack.go:42] conntrack returned error: error looking for path of conntrack: exec: "conntrack": executable file not found in $PATH

**导致的现象**

kubedns启动成功，运行正常，但是service之间无法解析，kubernetes中的DNS解析异常

**解决方法**

CentOS中安装`conntrack-tools`包后重启kubernetes集群即可。

## 5. [Pod stucks in terminating if it has a privileged container but has been scheduled to a node which doesn't allow privilege issue#42568](https://github.com/kubernetes/kubernetes/issues/42568)

当pod被调度到无法权限不足的node上时，pod一直处于pending状态，且无法删除pod，删除时一直处于terminating状态。

**kubelet中的报错信息**

```
Error validating pod kube-keepalived-vip-1p62d_default(5d79ccc0-3173-11e7-bfbd-8af1e3a7c5bd) from api, ignoring: spec.containers[0].securityContext.privileged: Forbidden: disallowed by cluster policy
```
## 6.PVC中对Storage的容量设置不生效

[使用glusterfs做持久化存储](17-使用glusterfs做持久化存储.md)文档中我们构建了PV和PVC，当时给`glusterfs-nginx`的PVC设置了8G的存储限额，`nginx-dm`这个Deployment使用了该PVC，进入该Deployment中的Pod执行测试：

```
dd if=/dev/zero of=test bs=1G count=10
```

![pvc-storage-limit](images/pvc-storage-limit.jpg)

从截图中可以看到创建了9个size为1G的block后无法继续创建了，已经超出了8G的限额。

**参考**

[Persistent Volume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)

[Resource Design Proposals](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/resources.md)