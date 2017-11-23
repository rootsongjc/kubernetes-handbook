---
date: "2017-03-31T11:05:18+08:00"
title: "Kubernetes基于flannel的网络配置"
draft: false
categories: "kubernetes"
tags: ["kubernetes","flannel"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/2014100402.jpg", desc: "西安鼓楼 Oct 4,2014"}]
---

书接上文[在CentOS中安装Kubernetes详细指南](https://jimmysong.io/posts/kubernetes-installation-on-centos/)，这是一个系列文章，作为学习Kubernetes的心路历程吧。

本文主要讲解**Kubernetes的网络配置**，👆文中有一个安装**Flannel**的步骤，但是安装好后并没有相应的配置说明。

## 配置flannel

我们直接使用的yum安装的flannle，安装好后会生成

```ini
/usr/lib/systemd/system/flanneld.service
```

配置文件。

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
ExecStart=/usr/bin/flanneld-start $FLANNEL_OPTIONS
ExecStartPost=/usr/libexec/flannel/mk-docker-opts.sh -k DOCKER_NETWORK_OPTIONS -d /run/flannel/docker
Restart=on-failure

[Install]
WantedBy=multi-user.target
RequiredBy=docker.service
```

可以看到flannel环境变量配置文件在`/etc/sysconfig/flanneld`。

```Ini
# Flanneld configuration options  

# etcd url location.  Point this to the server where etcd runs
FLANNEL_ETCD_ENDPOINTS="http://sz-pg-oam-docker-test-001.tendcloud.com:2379"

# etcd config key.  This is the configuration key that flannel queries
# For address range assignment
FLANNEL_ETCD_PREFIX="/kube-centos/network"

# Any additional options that you want to pass
#FLANNEL_OPTIONS=""
```

- etcd的地址`FLANNEL_ETCD_ENDPOINT`
- etcd查询的目录，包含docker的IP地址段配置。`FLANNEL_ETCD_PREFIX`

**在etcd中创建网络配置**

执行下面的命令为docker分配IP地址段。

```shell
etcdctl mkdir /kube-centos/network
etcdctl mk /kube-centos/network/config "{ \"Network\": \"172.30.0.0/16\", \"SubnetLen\": 24, \"Backend\": { \"Type\": \"vxlan\" } }"
```

**配置Docker**

Flannel的[文档](https://github.com/coreos/flannel/blob/master/Documentation/running.md)中有写**Docker Integration**：

> Docker daemon accepts `--bip` argument to configure the subnet of the docker0 bridge. It also accepts `--mtu` to set the MTU for docker0 and veth devices that it will be creating. Since flannel writes out the acquired subnet and MTU values into a file, the script starting Docker can source in the values and pass them to Docker daemon:

```bash
source /run/flannel/subnet.env
docker daemon --bip=${FLANNEL_SUBNET} --mtu=${FLANNEL_MTU} &
```

Systemd users can use `EnvironmentFile` directive in the .service file to pull in `/run/flannel/subnet.env`

下载flannel github release中的tar包，解压后会获得一个**mk-docker-opts.sh**文件。

这个文件是用来`Generate Docker daemon options based on flannel env file`。

执行`./mk-docker-opts.sh -i`将会生成如下两个文件环境变量文件。

/run/flannel/subnet.env

```ini
FLANNEL_NETWORK=172.30.0.0/16
FLANNEL_SUBNET=172.30.46.1/24
FLANNEL_MTU=1450
FLANNEL_IPMASQ=false
```

/run/docker_opts.env

```ini
DOCKER_OPT_BIP="--bip=172.30.46.1/24"
DOCKER_OPT_IPMASQ="--ip-masq=true"
DOCKER_OPT_MTU="--mtu=1450"
```

现在查询etcd中的内容可以看到：

```bash
$etcdctl ls /kube-centos/network/subnets
/kube-centos/network/subnets/172.30.14.0-24
/kube-centos/network/subnets/172.30.38.0-24
/kube-centos/network/subnets/172.30.46.0-24
$etcdctl get /kube-centos/network/config
{ "Network": "172.30.0.0/16", "SubnetLen": 24, "Backend": { "Type": "vxlan" } }
$etcdctl get /kube-centos/network/subnets/172.30.14.0-24
{"PublicIP":"172.20.0.114","BackendType":"vxlan","BackendData":{"VtepMAC":"56:27:7d:1c:08:22"}}
$etcdctl get /kube-centos/network/subnets/172.30.38.0-24
{"PublicIP":"172.20.0.115","BackendType":"vxlan","BackendData":{"VtepMAC":"12:82:83:59:cf:b8"}}
$etcdctl get /kube-centos/network/subnets/172.30.46.0-24
{"PublicIP":"172.20.0.113","BackendType":"vxlan","BackendData":{"VtepMAC":"e6:b2:fd:f6:66:96"}}
```

**设置docker0网桥的IP地址**

```bash
source /run/flannel/subnet.env
ifconfig docker0 $FLANNEL_SUBNET
```

这样docker0和flannel网桥会在同一个子网中，如

```bash
6: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN 
    link/ether 02:42:da:bf:83:a2 brd ff:ff:ff:ff:ff:ff
    inet 172.30.38.1/24 brd 172.30.38.255 scope global docker0
       valid_lft forever preferred_lft forever
7: flannel.1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc noqueue state UNKNOWN 
    link/ether 9a:29:46:61:03:44 brd ff:ff:ff:ff:ff:ff
    inet 172.30.38.0/32 scope global flannel.1
       valid_lft forever preferred_lft forever
```

现在就可以重启docker了。

重启了docker后还要重启kubelet，这时又遇到问题，kubelet启动失败。报错：

```bash
Mar 31 16:44:41 sz-pg-oam-docker-test-002.tendcloud.com kubelet[81047]: error: failed to run Kubelet: failed to create kubelet: misconfiguration: kubelet cgroup driver: "cgroupfs" is different from docker cgroup driver: "systemd"
```

这是kubelet与docker的**cgroup driver**不一致导致的，kubelet启动的时候有个`—cgroup-driver`参数可以指定为"cgroupfs"或者“systemd”。

```bash
--cgroup-driver string                                    Driver that the kubelet uses to manipulate cgroups on the host.  Possible values: 'cgroupfs', 'systemd' (default "cgroupfs")
```

**启动flannel**

```bash
systemctl daemon-reload
systemctl start flanneld
systemctl status flanneld
```

重新登录这三台主机，可以看到每台主机都多了一个IP。

参考Kubernetes官方文档的[Exposing an External IP Address to Access an Application in a Cluster](https://kubernetes.io/docs/tutorials/stateless-application/expose-external-ip-address/)，官方使用的Hello World测试，我们启动Nginx服务测试。

```Shell
#启动nginx的pod
kubectl run nginx --replicas=2 --labels="run=load-balancer-example" --image=sz-pg-oam-docker-hub-001.tendcloud.com/library/nginx:1.9  --port=80
#创建名为example-service的服务
kubectl expose deployment nginx --type=NodePort --name=example-service
#查看状态
kubectl get deployments nginx
kubectl describe deployments nginx
kubectl get replicasets
kubectl describe replicasets
kubectl describe svc example-service
###################################################
Name:			example-service
Namespace:		default
Labels:			run=load-balancer-example
Annotations:		<none>
Selector:		run=load-balancer-example
Type:			NodePort
IP:			10.254.180.209
Port:			<unset>	80/TCP
NodePort:		<unset>	32663/TCP
Endpoints:		172.30.14.2:80,172.30.46.2:80
Session Affinity:	None
Events:			<none>
```

我们上面启动的serivce的type是**NodePort**，Kubernetes的service支持三种类型的service，参考[Kubernetes Serivce分析](http://www.cnblogs.com/xuxinkun/p/5331728.html)。

现在访问三台物理机的IP:80端口就可以看到nginx的页面了。

稍等一会在访问ClusterIP + Port也可以访问到nginx。

```bash
$curl 10.254.180.209:80
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
    body {
        width: 35em;
        margin: 0 auto;
        font-family: Tahoma, Verdana, Arial, sans-serif;
    }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```

## 虚拟地址

Kubernetes中的Service了使用了虚拟地址；该地址无法ping通过，但可以访问其端口。通过下面的命令可以看到，该虚拟地址是若干条iptables的规则。到10.254.124.145:8080端口的请求会被重定向到172.30.38.2或172.30.46.2的8080端口。这些规则是由kube-proxy生成；如果需要某台机器可以访问Service，则需要在该主机启动kube-proxy。

**查看service的iptables**

```bash
$iptables-save|grep example-service
-A KUBE-NODEPORTS -p tcp -m comment --comment "default/example-service:" -m tcp --dport 32663 -j KUBE-MARK-MASQ
-A KUBE-NODEPORTS -p tcp -m comment --comment "default/example-service:" -m tcp --dport 32663 -j KUBE-SVC-BR4KARPIGKMRMN3E
-A KUBE-SEP-NCPBOLUH5XTTHG3E -s 172.30.46.2/32 -m comment --comment "default/example-service:" -j KUBE-MARK-MASQ
-A KUBE-SEP-NCPBOLUH5XTTHG3E -p tcp -m comment --comment "default/example-service:" -m tcp -j DNAT --to-destination 172.30.46.2:80
-A KUBE-SEP-ONEKQBIWICF7RAR3 -s 172.30.14.2/32 -m comment --comment "default/example-service:" -j KUBE-MARK-MASQ
-A KUBE-SEP-ONEKQBIWICF7RAR3 -p tcp -m comment --comment "default/example-service:" -m tcp -j DNAT --to-destination 172.30.14.2:80
-A KUBE-SERVICES -d 10.254.180.209/32 -p tcp -m comment --comment "default/example-service: cluster IP" -m tcp --dport 80 -j KUBE-SVC-BR4KARPIGKMRMN3E
-A KUBE-SVC-BR4KARPIGKMRMN3E -m comment --comment "default/example-service:" -m statistic --mode random --probability 0.50000000000 -j KUBE-SEP-ONEKQBIWICF7RAR3
-A KUBE-SVC-BR4KARPIGKMRMN3E -m comment --comment "default/example-service:" -j KUBE-SEP-NCPBOLUH5XTTHG3E
```

**查看clusterIP的iptables**

```Bash
$iptables -t nat -nL|grep 10.254
KUBE-SVC-NPX46M4PTMTKRN6Y  tcp  --  0.0.0.0/0            10.254.0.1           /* default/kubernetes:https cluster IP */ tcp dpt:443
KUBE-SVC-BR4KARPIGKMRMN3E  tcp  --  0.0.0.0/0            10.254.180.209       /* default/example-service: cluster IP */ tcp dpt:80
```

可以看到在PREROUTING环节，k8s设置了一个target: KUBE-SERVICES。而KUBE-SERVICES下面又设置了许多target，一旦destination和dstport匹配，就会沿着chain进行处理。

比如：当我们在pod网络curl 10.254.198.44 80时，匹配到下面的KUBE-SVC-BR4KARPIGKMRMN3E target：

```bash
KUBE-SVC-BR4KARPIGKMRMN3E  tcp  --  0.0.0.0/0            10.254.180.209       /* default/example-service: cluster IP */ tcp dpt:80
```

参考[理解Kubernetes网络之Flannel网络](http://tonybai.com/2017/01/17/understanding-flannel-network-for-kubernetes/)，Tony Bai的文章中有对flannel的详细介绍。

## 遇到的问题

在设置网络的过程中遇到了很多问题，记录如下。

### 问题一

**问题描述**

Kube-proxy开放的**NodePort**端口无法访问。即无法使用NodeIP加NodePort的方式访问service，而且本地telnet也不通，但是端口确确实实在那。

**问题状态**

已解决

**解决方法**

其实这不是问题，是因为从上面的操作记录中我们可以看到，**在启动Nginx的Pod**时，指定port为80即可。以ClusterIP + Port的方式访问serivce需要等一段时间。

**反思**

这个问题困扰了我们差不多两天时间，出现这个问题的根源还是因为<u>思想观念没有从运行docker的命令中解放出来</u>,还把`kubelet run —port`当成是docker run中的端口映射，这种想法是大错特错的，该端口是image中的应用实际暴露的端口，如nginx的80端口。😔

### 问题二

**问题描述**

在没有删除service和deploy的情况下就重启kubelet的时候，会遇到kubelet启动失败的情况。

**出错信息**

```bash
Apr 01 14:24:08 sz-pg-oam-docker-test-001.tendcloud.com kubelet[103932]: I0401 14:24:08.359839  103932 kubelet.go:1752] skipping pod synchronization - [Failed to start ContainerManager failed to initialise top level QOS containers: failed to create top level Burstable QOS cgroup : Unit kubepods-burstable.slice already exists.]
```

[Kubernetes Resource QoS机制解读](http://www.osbaike.net/article-show-id-229028.html)，这篇文章详细介绍了QoS的机制。

Kubernetes根据Pod中Containers Resource的`request`和`limit`的值来定义Pod的QoS Class。

对于每一种Resource都可以将容器分为3中QoS Classes: Guaranteed, Burstable, and Best-Effort，它们的QoS级别依次递减。

- **Guaranteed**：如果Pod中所有Container的所有Resource的`limit`和`request`都相等且不为0，则这个Pod的QoS Class就是Guaranteed。
- **Burstable**：除了符合Guaranteed和Best-Effort的场景，其他场景的Pod QoS Class都属于Burstable。
- **Best-Effort**：如果Pod中所有容器的所有Resource的request和limit都没有赋值，则这个Pod的QoS Class就是Best-Effort。

**解决方法**

这个暂时还没找到根本的解决办法，参考Github上的[Failed to start ContainerManager failed to initialize top level QOS containers #43856](https://github.com/kubernetes/kubernetes/issues/43856)，重启主机后确实正常了，不过这只是临时解决方法。

## 后记

其实昨天就已经安装完毕了，是我们使用的姿势不对，白白耽误这么长时间，身边差个老司机啊，滴～学生卡。

感谢[Tony Bai](tonybai.com)、[Peter Ma](https://godliness.github.io/)的大力支持。

Apr 1,2017 愚人节，东直门
