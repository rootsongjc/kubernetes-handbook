## 安装flannel网络插件

所有的node节点都需要安装网络插件才能让所有的Pod加入到同一个局域网中，本文是安装flannel网络插件的参考文档。

建议直接使用yum安装flanneld，除非对版本有特殊需求，默认安装的是0.7.1版本的flannel。

```shell
yum install -y flannel
```

service配置文件`/usr/lib/systemd/system/flanneld.service`。

```ini
[Unit]
Description=Flanneld overlay address etcd agent
After=network.target
After=network-online.target
Wants=network-online.target
After=etcd.service
Before=docker.service

[Service]
Type=notify
EnvironmentFile=/etc/sysconfig/flanneld
EnvironmentFile=-/etc/sysconfig/docker-network
ExecStart=/usr/bin/flanneld-start \
  -etcd-endpoints=${FLANNEL_ETCD_ENDPOINTS} \
  -etcd-prefix=${FLANNEL_ETCD_PREFIX} \
  $FLANNEL_OPTIONS
ExecStartPost=/usr/libexec/flannel/mk-docker-opts.sh -k DOCKER_NETWORK_OPTIONS -d /run/flannel/docker
Restart=on-failure

[Install]
WantedBy=multi-user.target
RequiredBy=docker.service
```

`/etc/sysconfig/flanneld`配置文件：

```ini
# Flanneld configuration options  

# etcd url location.  Point this to the server where etcd runs
FLANNEL_ETCD_ENDPOINTS="https://172.20.0.113:2379,https://172.20.0.114:2379,https://172.20.0.115:2379"

# etcd config key.  This is the configuration key that flannel queries
# For address range assignment
FLANNEL_ETCD_PREFIX="/kube-centos/network"

# Any additional options that you want to pass
FLANNEL_OPTIONS="-etcd-cafile=/etc/kubernetes/ssl/ca.pem -etcd-certfile=/etc/kubernetes/ssl/kubernetes.pem -etcd-keyfile=/etc/kubernetes/ssl/kubernetes-key.pem"
```

如果是多网卡（例如vagrant环境），则需要在FLANNEL_OPTIONS中增加指定的外网出口的网卡，例如-iface=eth2

**在etcd中创建网络配置**

执行下面的命令为docker分配IP地址段。

```shell
etcdctl --endpoints=https://172.20.0.113:2379,https://172.20.0.114:2379,https://172.20.0.115:2379 \
  --ca-file=/etc/kubernetes/ssl/ca.pem \
  --cert-file=/etc/kubernetes/ssl/kubernetes.pem \
  --key-file=/etc/kubernetes/ssl/kubernetes-key.pem \
  mkdir /kube-centos/network
etcdctl --endpoints=https://172.20.0.113:2379,https://172.20.0.114:2379,https://172.20.0.115:2379 \
  --ca-file=/etc/kubernetes/ssl/ca.pem \
  --cert-file=/etc/kubernetes/ssl/kubernetes.pem \
  --key-file=/etc/kubernetes/ssl/kubernetes-key.pem \
  mk /kube-centos/network/config '{"Network":"172.30.0.0/16","SubnetLen":24,"Backend":{"Type":"vxlan"}}'
```

如果你要使用`host-gw`模式，可以直接将vxlan改成`host-gw`即可。

**注**：参考[网络和集群性能测试](network-and-cluster-perfermance-test.md)那节，最终我们使用的`host-gw`模式，关于flannel支持的backend模式见：<https://github.com/coreos/flannel/blob/master/Documentation/backends.md>。

**启动flannel**

```shell
systemctl daemon-reload
systemctl enable flanneld
systemctl start flanneld
systemctl status flanneld
```

现在查询etcd中的内容可以看到：

```bash
$etcdctl --endpoints=${ETCD_ENDPOINTS} \
  --ca-file=/etc/kubernetes/ssl/ca.pem \
  --cert-file=/etc/kubernetes/ssl/kubernetes.pem \
  --key-file=/etc/kubernetes/ssl/kubernetes-key.pem \
  ls /kube-centos/network/subnets
/kube-centos/network/subnets/172.30.14.0-24
/kube-centos/network/subnets/172.30.38.0-24
/kube-centos/network/subnets/172.30.46.0-24
$etcdctl --endpoints=${ETCD_ENDPOINTS} \
  --ca-file=/etc/kubernetes/ssl/ca.pem \
  --cert-file=/etc/kubernetes/ssl/kubernetes.pem \
  --key-file=/etc/kubernetes/ssl/kubernetes-key.pem \
  get /kube-centos/network/config
{ "Network": "172.30.0.0/16", "SubnetLen": 24, "Backend": { "Type": "vxlan" } }
$etcdctl get /kube-centos/network/subnets/172.30.14.0-24
{"PublicIP":"172.20.0.114","BackendType":"vxlan","BackendData":{"VtepMAC":"56:27:7d:1c:08:22"}}
$etcdctl get /kube-centos/network/subnets/172.30.38.0-24
{"PublicIP":"172.20.0.115","BackendType":"vxlan","BackendData":{"VtepMAC":"12:82:83:59:cf:b8"}}
$etcdctl get /kube-centos/network/subnets/172.30.46.0-24
{"PublicIP":"172.20.0.113","BackendType":"vxlan","BackendData":{"VtepMAC":"e6:b2:fd:f6:66:96"}}
```

如果可以查看到以上内容证明flannel已经安装完成，下一步是在node节点上安装和配置docker、kubelet、kube-proxy等，请参考下一节[部署node节点](node-installation.md)。
