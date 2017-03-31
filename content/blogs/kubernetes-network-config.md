+++
date = "2017-03-31T11:05:18+08:00"
title = "kubernetes network config"
draft = true
Tags = ["kubernetes","cloud computing"]

+++

![西安鼓楼](http://olz1di9xf.bkt.clouddn.com/2014100402.jpg)

*（题图：西安鼓楼 Oct 4,2014）*

书接上文[在CentOS中安装Kubernetes详细指南](http://rootsongjc.github.io/blogs/kubernetes-installation-on-centos/)，这是一个系列文章，作为*学习Kubernetes*的心路历程吧。

本文主要讲解**Kubernetes的网络配置**，👆文中有一个安装**Flannel**的步骤，但是安装好后并没有相应的配置说明。

我们直接使用的yum安装的flannle，安装好后会生成`/usr/lib/systemd/system/flanneld.service`配置文件。

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
FLANNEL_ETCD_ENDPOINTS="http://127.0.0.1:2379"

# etcd config key.  This is the configuration key that flannel queries
# For address range assignment
FLANNEL_ETCD_PREFIX="/kube-centos/network"

# Any additional options that you want to pass
#FLANNEL_OPTIONS=""
```

- **etcd**的地址`FLANNEL_ETCD_ENDPOINT`
- etcd查询的目录，包含docker的IP地址段配置。`FLANNEL_ETCD_PREFIX`

**在etcd中创建网络配置**

为docker分配IP地址段。

```shell
etcdctl mkdir /kube-centos/network
etcdctl mk /kube-centos/network/config "{ \"Network\": \"172.30.0.0/16\", \"SubnetLen\": 24, \"Backend\": { \"Type\": \"vxlan\" } }"
```

**配置Docker**

Flannel的[文档](https://github.com/coreos/flannel/blob/master/Documentation/running.md)中有写**Docker Integration**：

Docker daemon accepts `--bip` argument to configure the subnet of the docker0 bridge. It also accepts `--mtu` to set the MTU for docker0 and veth devices that it will be creating. Since flannel writes out the acquired subnet and MTU values into a file, the script starting Docker can source in the values and pass them to Docker daemon:

```
source /run/flannel/subnet.env
docker daemon --bip=${FLANNEL_SUBNET} --mtu=${FLANNEL_MTU} &
```

Systemd users can use `EnvironmentFile` directive in the .service file to pull in `/run/flannel/subnet.env`

**启动flannel**

```shell
systemctl daemon-reload
systemctl start flanneld
systemctl status flanneld
```

重新登录这三台主机，可以看到每台主机都多了一个IP。

```Shell
#启动nginx的pod
kubectl run nginx --replicas=2 --labels="run=load-balancer-example" --image=sz-pg-oam-docker-hub-001.tendcloud.com/library/nginx:1.9  --port=8080
#创建名为example-service的服务
kubectl expose deployment nginx --type=NodePort --name=example-service
#查看状态
kubectl get deployments nginx
kubectl describe deployments nginx
kubectl get replicasets
kubectl describe replicasets
###################################################
kubectl describe services example-service
Name:			example-service
Namespace:		default
Labels:			run=load-balancer-example
Annotations:		<none>
Selector:		run=load-balancer-example
Type:			NodePort
IP:			10.254.57.173
Port:			<unset>	8080/TCP
NodePort:		<unset>	31849/TCP
Endpoints:		172.17.0.2:8080,172.17.0.5:8080
Session Affinity:	None
Events:			<none>
```

