---
title: "集群部署"
layout: "post"
---

## Kubernetes集群架构

![](../ha/ha.png)

### etcd集群

从`https://discovery.etcd.io/new?size=3`获取token后，把<https://kubernetes.io/docs/admin/high-availability/etcd.yaml>放到每台机器的`/etc/kubernetes/manifests/etcd.yaml`，并替换掉`${DISCOVERY_TOKEN}`, `${NODE_NAME}`和`${NODE_IP}`，既可以由kubelet来启动一个etcd集群。

对于运行在kubelet外部的etcd，可以参考[etcd clustering guide](https://github.com/coreos/etcd/blob/master/Documentation/op-guide/clustering.md)来手动配置集群模式。

### kube-apiserver

把<https://kubernetes.io/docs/admin/high-availability/kube-apiserver.yaml>放到每台Master节点的`/etc/kubernetes/manifests/`，并把相关的配置放到`/srv/kubernetes/`，即可由kubelet自动创建并启动apiserver:

- basic_auth.csv - basic auth user and password
- ca.crt - Certificate Authority cert
- known_tokens.csv - tokens that entities (e.g. the kubelet) can use to talk to the apiserver
- kubecfg.crt - Client certificate, public key
- kubecfg.key - Client certificate, private key
- server.cert - Server certificate, public key
- server.key - Server certificate, private key

apiserver启动后，还需要为它们做负载均衡，可以使用云平台的弹性负载均衡服务或者使用haproxy/lvs/nginx等为master节点配置负载均衡。

另外，还可以借助Keepalived、OSPF、Pacemaker等来保证负载均衡节点的高可用。

注意：

- 大规模集群注意增加`--max-requests-inflight`（默认400）
- 使用nginx时注意增加`proxy_timeout: 10m`

### controller manager和scheduler

controller manager和scheduler需要保证任何时刻都只有一个实例运行，需要一个选主的过程，所以在启动时要设置`--leader-elect=true`，比如

```
kube-scheduler --master=127.0.0.1:8080 --v=2 --leader-elect=true
kube-controller-manager --master=127.0.0.1:8080 --cluster-cidr=10.245.0.0/16 --allocate-node-cidrs=true --service-account-private-key-file=/srv/kubernetes/server.key --v=2 --leader-elect=true
```

把[kube-scheduler.yaml](https://kubernetes.io/docs/admin/high-availability/kube-scheduler.yaml)和[kube-controller-manager.yaml](https://kubernetes.io/docs/admin/high-availability/kube-controller-manager.yaml)(非GCE平台需要适当修改) 放到每台master节点的`/etc/kubernetes/manifests/`即可。

### kube-dns

kube-dns可以通过Deployment的方式来部署，默认kubeadm会自动创建。但在大规模集群的时候，需要放宽资源限制，比如

```
dns_replicas: 6
dns_cpu_limit: 100m
dns_memory_limit: 512Mi
dns_cpu_requests 70m
dns_memory_requests: 70Mi
```

另外，也需要给dnsmasq增加资源，比如增加缓存大小到10000，增加并发处理数量`--dns-forward-max=1000`等。

### 数据持久化

除了上面提到的这些配置，持久化存储也是高可用Kubernetes集群所必须的。

- 对于公有云上部署的集群，可以考虑使用云平台提供的持久化存储，比如aws ebs或者gce persistent disk
- 对于物理机部署的集群，可以考虑使用iSCSI、NFS、Gluster或者Ceph等网络存储，也可以使用RAID

## GCE/Azure

在GCE或者Azure上面可以利用cluster脚本方便的部署集群：

```
# gce,aws,gke,azure-legacy,vsphere,openstack-heat,rackspace,libvirt-coreos
export KUBERNETES_PROVIDER=gce
curl -sS https://get.k8s.io | bash
cd kubernetes
cluster/kube-up.sh
```

## AWS

在aws上建议使用[kops](https://kubernetes.io/docs/getting-started-guides/kops/)来部署。

## 物理机或虚拟机

在Linux物理机或虚拟机中，建议使用[kubeadm](https://kubernetes.io/docs/getting-started-guides/kubeadm/)来部署Kubernetes集群。

