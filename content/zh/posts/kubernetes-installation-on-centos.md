---
date: "2017-03-30T20:44:20+08:00"
title: "在CentOS上安装kubernetes详细指南"
draft: false
categories: "kubernetes"
tags: ["kubernetes"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/2014082501.jpg", desc: "北京圆明园 Aug 25,2014"}]
---

作者：[Jimmy Song](rootsongjc.github.io/about)，[Peter Ma](https://godliness.github.io/)，2017年3月30日

最近决定从Docker Swarm Mode投入到Kubernetes的怀抱，对Docker的战略和企业化发展前景比较堪忧，而Kubernetes是[CNCF](https://www.cncf.io/)的成员之一。

这篇是根据[官方安装文档](https://kubernetes.io/docs/getting-started-guides/centos/centos_manual_config/#prerequisites)实践整理的，操作系统是纯净的CentOS7.2。

另外还有一个Peter Ma写的[在CentOS上手动安装kubernetes的文档](https://godliness.github.io/2017/03/29/%E5%9C%A8CentOS7%E4%B8%8A%E6%89%8B%E5%8A%A8%E5%AE%89%E8%A3%85Kubernetes/)可以参考。

**注意：本文是在没有启用TLS的情况下安装的kubernetes，还请大家参照 [kubernetes-handbook](https://jimmysong.io/kubernetes-handbook) 安装。**

**角色分配**

下面以在三台主机上安装Kubernetes为例。

```bash
172.20.0.113 master/node kube-apiserver kube-controller-manager kube-scheduler kubelet kube-proxy etcd flannel
172.20.0.114 node kubectl kube-proxy flannel
172.20.0.115 node kubectl kube-proxy flannel
```

第一台主机既作为master也作为node。

**系统环境**

- Centos 7.2.1511
- docker 1.12.6
- etcd 3.1.5
- kubernetes 1.6.0
- flannel 0.7.0-1

# 安装

下面给出两种安装方式：

- 配置yum源后，使用yum安装，好处是简单，坏处也很明显，需要google更新yum源才能获得最新版本的软件，而所有软件的依赖又不能自己指定，尤其是你的操作系统版本如果低的话，使用yum源安装的kubernetes的版本也会受到限制。
- 使用二进制文件安装，好处是可以安装任意版本的kubernetes，坏处是配置比较复杂。

我们最终选择使用第二种方式安装。

本文的很多安装步骤和命令是参考的Kubernetes官网[CentOS Manual Config](https://kubernetes.io/docs/getting-started-guides/centos/centos_manual_config/)文档。

## 第一种方式：CentOS系统中直接使用yum安装

**给yum源增加一个Repo**

```bash
[virt7-docker-common-release]
name=virt7-docker-common-release
baseurl=http://cbs.centos.org/repos/virt7-docker-common-release/x86_64/os/
gpgcheck=0
```

**安装docker、kubernetes、etcd、flannel一步到位**

```bash
yum -y install --enablerepo=virt7-docker-common-release kubernetes etcd flannel
```

安装好了之后需要修改一系列配置文件。

> 这个repo在CentOS7.3下是毫无意义的，因为CentOS官方源的extras中已经包含了Kubernetes1.5.2，如果你使用的是CentOS7.3的话，会自动下载安装Kubernetes1.5.2（Till March 30,2017）。如果你使用的是CentOS7.2的化，这个源就有用了，但是不幸的是，它会自动下载安装Kubernentes1.1。我们现在要安装目前的最新版本Kubernetes1.6，而使用的又是CentOS7.2，所以我们不使用yum安装（当前yum源支持的最高版本的kuberentes是1.5.2）。

## 第二种方式：使用二进制文件安装

这种方式安装的话，需要自己一个一个组件的安装。

### 安装Docker

yum localinstall ./docker-engine*

将使用CentOS的**extras** repo下载。

### 关闭防火墙和SELinux

这是官网上建议的，我是直接将iptables-services和firewlld卸载掉了。

```shell
setenforce 0
systemctl disable iptables-services firewalld
systemctl stop iptables-services firewalld
```

### 安装etcd

**下载二进制文件**

```shell
DOWNLOAD_URL=https://storage.googleapis.com/etcd  #etcd存储地址
ETCD_VER=v3.1.5  #设置etcd版本号
wget ${DOWNLOAD_URL}/${ETCD_VER}/etcd-${ETCD_VER}-linux-amd64.tar.gz
tar xvf etcd-${ETCD_VER}-linux-amd64.tar.gz
```

**部署文件**

将如下内容写入文件 /etc/etcd/etcd.conf 中：

```ini
# [member]
ETCD_NAME=default
ETCD_DATA_DIR="/var/lib/etcd/default.etcd"
# ETCD_WAL_DIR=""
# ETCD_SNAPSHOT_COUNT="10000"
# ETCD_HEARTBEAT_INTERVAL="100"
# ETCD_ELECTION_TIMEOUT="1000"
# ETCD_LISTEN_PEER_URLS="http://localhost:2380"
ETCD_LISTEN_CLIENT_URLS="http://0.0.0.0:2379"
# ETCD_MAX_SNAPSHOTS="5"
# ETCD_MAX_WALS="5"
# ETCD_CORS=""
#
# [cluster]
# ETCD_INITIAL_ADVERTISE_PEER_URLS="http://localhost:2380"
# if you use different ETCD_NAME (e.g. test), set ETCD_INITIAL_CLUSTER value for this name, i.e. "test=http://..."
# ETCD_INITIAL_CLUSTER="default=http://localhost:2380"
# ETCD_INITIAL_CLUSTER_STATE="new"
# ETCD_INITIAL_CLUSTER_TOKEN="etcd-cluster"
ETCD_ADVERTISE_CLIENT_URLS="http://0.0.0.0:2379"
# ETCD_DISCOVERY=""
# ETCD_DISCOVERY_SRV=""
# ETCD_DISCOVERY_FALLBACK="proxy"
# ETCD_DISCOVERY_PROXY=""
#
# [proxy]
# ETCD_PROXY="off"
# ETCD_PROXY_FAILURE_WAIT="5000"
# ETCD_PROXY_REFRESH_INTERVAL="30000"
# ETCD_PROXY_DIAL_TIMEOUT="1000"
# ETCD_PROXY_WRITE_TIMEOUT="5000"
# ETCD_PROXY_READ_TIMEOUT="0"
#
# [security]
# ETCD_CERT_FILE=""
# ETCD_KEY_FILE=""
# ETCD_CLIENT_CERT_AUTH="false"
# ETCD_TRUSTED_CA_FILE=""
# ETCD_PEER_CERT_FILE=""
# ETCD_PEER_KEY_FILE=""
# ETCD_PEER_CLIENT_CERT_AUTH="false"
# ETCD_PEER_TRUSTED_CA_FILE=""
# [logging]
# ETCD_DEBUG="false"
# examples for -log-package-levels etcdserver=WARNING,security=DEBUG
# ETCD_LOG_PACKAGE_LEVELS=""
```
将 etcd, etcdctl放入 /usr/bin/下，并将如下内容写进/usr/lib/systemd/system/etcd.service文件
```Ini
[Unit]
Description=Etcd Server
After=network.target
After=network-online.target
Wants=network-online.target

[Service]
Type=notify
WorkingDirectory=/var/lib/etcd/
EnvironmentFile=-/etc/etcd/etcd.conf
User=etcd
# set GOMAXPROCS to number of processors
ExecStart=/bin/bash -c "GOMAXPROCS=$(nproc) /usr/bin/etcd --name=\"${ETCD_NAME}\" --data-dir=\"${ETCD_DATA_DIR}\" --listen-client-urls=\"${ETCD_LISTEN_CLIENT_URLS}\""
Restart=on-failure
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```
**启动并校验**
```bash
systemctl start etcd
systemctl enable etcd
systemctl status etcd
etcdctl ls
```
**集群**

若要部署多节点集群也比较简单，只要更改etcd.conf文件以及etcd.service添加相应配置即可

参考 [etcd Clustering Guide](https://github.com/coreos/etcd/blob/master/Documentation/op-guide/clustering.md)

### 安装flannel

可以直接使用`yum install flannel`安装。

因为网络这块的配置比较复杂，我将在后续文章中说明。

### 安装Kubernetes

 根据《Kubernetes权威指南（第二版）》中的介绍，直接使用GitHub上的release里的二进制文件安装。

执行下面的命令安装。

```bash
wget https://github.com/kubernetes/kubernetes/releases/download/v1.6.0/kubernetes.tar.gz
tar kubernetes.tar.gz
cd kubernetes
./cluster/get-kube-binaries.sh
cd server
tar xvf kubernetes-server-linux-amd64.tar.gz
rm -f *_tag *.tar
chmod 755 *
mv * /usr/bin
```

从下面的地址下载kubernetes-server-linux-amd64.tar.gz
```http
https://storage.googleapis.com/kubernetes-release/release/v1.6.0
```
解压完后获得的二进制文件有：

```bash
cloud-controller-manager
hyperkube
kubeadm
kube-aggregator
kube-apiserver
kube-controller-manager
kubectl
kubefed
kubelet
kube-proxy
kube-scheduler
```

在`cluster/juju/layers/kubernetes-master/templates`目录下有service和环境变量配置文件的模板，这个模板本来是为了使用[juju](https://jujucharms.com/)安装写的。

#### Master节点的配置

Master节点需要配置的kubernetes的组件有：

- kube-apiserver
- kube-controller-manager
- kube-scheduler
- kube-proxy
- kubectl

**配置kube-apiserver**

编写`/usr/lib/systemd/system/kube-apiserver.service`文件。[CentOS中的service配置文件参考](http://blog.csdn.net/yuesichiu/article/details/51485147)

```ini
[Unit]
Description=Kubernetes API Service
Documentation=https://github.com/GoogleCloudPlatform/kubernetes
After=network.target
After=etcd.service

[Service]
EnvironmentFile=-/etc/kubernetes/config
EnvironmentFile=-/etc/kubernetes/apiserver
ExecStart=/usr/bin/kube-apiserver \
	    $KUBE_LOGTOSTDERR \
	    $KUBE_LOG_LEVEL \
	    $KUBE_ETCD_SERVERS \
	    $KUBE_API_ADDRESS \
	    $KUBE_API_PORT \
	    $KUBELET_PORT \
	    $KUBE_ALLOW_PRIV \
	    $KUBE_SERVICE_ADDRESSES \
	    $KUBE_ADMISSION_CONTROL \
	    $KUBE_API_ARGS
Restart=on-failure
Type=notify
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

创建kubernetes的配置文件目录`/etc/kubernetes`。

添加`config`配置文件。

```ini
###
# kubernetes system config
#
# The following values are used to configure various aspects of all
# kubernetes services, including
#
#   kube-apiserver.service
#   kube-controller-manager.service
#   kube-scheduler.service
#   kubelet.service
#   kube-proxy.service
# logging to stderr means we get it in the systemd journal
KUBE_LOGTOSTDERR="--logtostderr=true"

# journal message level, 0 is debug
KUBE_LOG_LEVEL="--v=0"

# Should this cluster be allowed to run privileged docker containers
KUBE_ALLOW_PRIV="--allow-privileged=false"

# How the controller-manager, scheduler, and proxy find the apiserver
KUBE_MASTER="--master=http://sz-pg-oam-docker-test-001.tendcloud.com:8080"
```

添加`apiserver`配置文件。

```ini
###
## kubernetes system config
##
## The following values are used to configure the kube-apiserver
##
#
## The address on the local server to listen to.
KUBE_API_ADDRESS="--address=sz-pg-oam-docker-test-001.tendcloud.com"
#
## The port on the local server to listen on.
KUBE_API_PORT="--port=8080"
#
## Port minions listen on
KUBELET_PORT="--kubelet-port=10250"
#
## Comma separated list of nodes in the etcd cluster
KUBE_ETCD_SERVERS="--etcd-servers=http://127.0.0.1:2379"
#
## Address range to use for services
KUBE_SERVICE_ADDREKUBELET_POD_INFRA_CONTAINERSSES="--service-cluster-ip-range=10.254.0.0/16"
#
## default admission control policies
KUBE_ADMISSION_CONTROL="--admission-control=NamespaceLifecycle,NamespaceExists,LimitRanger,SecurityContextDeny,ResourceQuota"
#
## Add your own!
#KUBE_API_ARGS=""
```

> `—admission-control`参数是Kubernetes的安全机制配置，这些安全机制都是以插件的形式用来对API Serve进行准入控制，一开始我们没有配置`ServiceAccount`，这是为了方便集群之间的通信，不需要进行身份验证。如果你需要更高级的身份验证和鉴权的话就需要加上它了。

**配置kube-controller-manager**

编写`/usr/lib/systemd/system/kube-controller.service`文件。

```Ini
Description=Kubernetes Controller Manager
Documentation=https://github.com/GoogleCloudPlatform/kubernetes

[Service]
EnvironmentFile=-/etc/kubernetes/config
EnvironmentFile=-/etc/kubernetes/controller-manager
ExecStart=/usr/bin/kube-controller-manager \
	    $KUBE_LOGTOSTDERR \
	    $KUBE_LOG_LEVEL \
	    $KUBE_MASTER \
	    $KUBE_CONTROLLER_MANAGER_ARGS
Restart=on-failure
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

在`/etc/kubernetes`目录下添加`controller-manager`配置文件。

```ini
###
# The following values are used to configure the kubernetes controller-manager

# defaults from config and apiserver should be adequate

# Add your own!
KUBE_CONTROLLER_MANAGER_ARGS=""
```

**配置kube-scheduler**

编写`/usr/lib/systemd/system/kube-scheduler.service`文件。

```ini
[Unit]
Description=Kubernetes Scheduler Plugin
Documentation=https://github.com/GoogleCloudPlatform/kubernetes

[Service]
EnvironmentFile=-/etc/kubernetes/config
EnvironmentFile=-/etc/kubernetes/scheduler
ExecStart=/usr/bin/kube-scheduler \
	    $KUBE_LOGTOSTDERR \
	    $KUBE_LOG_LEVEL \
	    $KUBE_MASTER \
	    $KUBE_SCHEDULER_ARGS
Restart=on-failure
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

在`/etc/kubernetes`目录下添加`scheduler`文件。

```ini
###
# kubernetes scheduler config

# default config should be adequate

# Add your own!
KUBE_SCHEDULER_ARGS=""
```

**配置kube-proxy**

编写`/usr/lib/systemd/system/kube-proxy.service`文件。

```ini
[Unit]
Description=Kubernetes Kube-Proxy Server
Documentation=https://github.com/GoogleCloudPlatform/kubernetes
After=network.target

[Service]
EnvironmentFile=-/etc/kubernetes/config
EnvironmentFile=-/etc/kubernetes/proxy
ExecStart=/usr/bin/kube-proxy \
	    $KUBE_LOGTOSTDERR \
	    $KUBE_LOG_LEVEL \
	    $KUBE_MASTER \
	    $KUBE_PROXY_ARGS
Restart=on-failure
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

在`/etc/kubernetes`目录下添加`proxy`配置文件。

```ini
###
# kubernetes proxy config

# default config should be adequate

# Add your own!
KUBE_PROXY_ARGS=""
```

**配置kubelet**

创建配置

```ini
/usr/lib/systemd/system/kubelet.service
```
文件的内容为：

```ini
[Unit]
Description=Kubernetes Kubelet Server
Documentation=https://github.com/GoogleCloudPlatform/kubernetes
After=docker.service
Requires=docker.service

[Service]
WorkingDirectory=/var/lib/kubelet
EnvironmentFile=-/etc/kubernetes/config
EnvironmentFile=-/etc/kubernetes/kubelet
ExecStart=/usr/bin/kubelet \
	    $KUBE_LOGTOSTDERR \
	    $KUBE_LOG_LEVEL \
	    $KUBELET_API_SERVER \
	    $KUBELET_ADDRESS \
	    $KUBELET_PORT \
	    $KUBELET_HOSTNAME \
	    $KUBE_ALLOW_PRIV \
	    $KUBELET_POD_INFRA_CONTAINER \
	    $KUBELET_ARGS
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

在`/etc/kubernetes`目录下添加`kubelet`配置文件。

```ini
###
## kubernetes kubelet (minion) config
#
## The address for the info server to serve on (set to 0.0.0.0 or "" for all interfaces)
KUBELET_ADDRESS="--address=0.0.0.0"
#
## The port for the info server to serve on
KUBELET_PORT="--port=10250"
#
## You may leave this blank to use the actual hostname
KUBELET_HOSTNAME="--hostname-override=sz-pg-oam-docker-test-001.tendcloud.com"
#
## location of the api-server
KUBELET_API_SERVER="--api-servers=http://sz-pg-oam-docker-test-001.tendcloud.com:8080"
#
## pod infrastructure container
KUBELET_POD_INFRA_CONTAINER="--pod-infra-container-image=registry.access.redhat.com/rhel7/pod-infrastructure:latest"
#
## Add your own!
KUBELET_ARGS=""
```

⚠️`KUBELET_POD_INFRA_CONTAINER`在生产环境中配置成自己私有仓库里的image。

#### Node节点配置

Node节点需要配置：

- kube-proxy
- kubectl

`kube-proxy`的配置与master节点的kube-proxy配置相同。

`kubectl`的配置需要修改`KUBELET_HOST`为本机的hostname，其它配置相同。

# 启动

在**Master**节点上执行：

```shell
for SERVICES in etcd kube-apiserver kube-controller-manager kube-scheduler kube-proxy kubelet flanneld; do
    systemctl restart $SERVICES
    systemctl enable $SERVICES
    systemctl status $SERVICES
done
```

在另外两台Node节点上执行：

```shell
for SERVICES in kube-proxy kubelet flanneld; do
    systemctl restart $SERVICES
    systemctl enable $SERVICES
    systemctl status $SERVICES
done
```

# 验证

在Master节点上运行

```bash
$kubectl get all
NAME             CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
svc/kubernetes   10.254.0.1   <none>        443/TCP   1h
$kubectl get nodes
NAME                                      STATUS    AGE       VERSION
sz-pg-oam-docker-test-001.tendcloud.com   Ready     7m        v1.6.0
sz-pg-oam-docker-test-002.tendcloud.com   Ready     4m        v1.6.0
sz-pg-oam-docker-test-003.tendcloud.com   Ready     10s       v1.6.0
```

现在可以正常使用啦。

### 后记

另外Kuberntes还提供第三中安装方式，请看Tony Bai写的[使用Kubeadm方式安装Kubernetes集群的探索](http://tonybai.com/2017/01/24/explore-kubernetes-cluster-installed-by-kubeadm/)。

*时隔一年重新捡起kubernetes，正好现在KubeCon正在德国柏林举行，IDC 发布的报告显示，2017年大数据全球市场规模将达324亿美元，年复合增长率为27%，其中市场增长最快的领域是数据存储领域（53.4%）*

