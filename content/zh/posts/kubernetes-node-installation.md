---
date: "2017-04-11T22:20:31+08:00"
title: "Kubernetes node节点安装"
draft: false
categories: "kubernetes"
tags: ["kubernetes"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/2016121101.jpg", desc: "太阳宫桥@北京东北三环 Dec 11,2016"}]
---

## 前言

这是[和我一步步部署kubernetes集群](https://github.com/rootsongjc/follow-me-install-kubernetes-cluster)项目(fork自[opsnull](https://github.com/opsnull/follow-me-install-kubernetes-cluster))中的一篇文章，下文是结合我[之前部署kubernetes的过程](https://jimmysong.io/tags/kubernetes/)产生的kuberentes环境，部署node节点上的`kube-proxy`和`kubelet`，同时对之前部署的flannel改造。

**安装环境配置信息**

- CentOS7.2.1511
- Docker 1.12.5
- Flannel 0.7
- Kubernetes 1.6.0

## 部署kubernetes node节点

kubernetes node 节点包含如下组件：

- Flanneld：参考我之前写的文章[Kubernetes基于Flannel的网络配置](https://jimmysong.io/posts/kubernetes-network-config/)，之前没有配置TLS，现在需要在serivce配置文件中增加TLS配置。
- Docker1.12.5：docker的安装很简单，这里也不说了。
- kubelet
- kube-proxy

下面着重讲`kubelet`和`kube-proxy`的安装，同时还要将之前安装的flannel集成TLS验证。

## 目录和文件

我们再检查一下三个节点上，经过前几步操作生成的配置文件。

```bash
$ ls /etc/kubernetes/ssl
admin-key.pem  admin.pem  ca-key.pem  ca.pem  kube-proxy-key.pem  kube-proxy.pem  kubernetes-key.pem  kubernetes.pem
$ ls /etc/kubernetes/
apiserver  bootstrap.kubeconfig  config  controller-manager  kubelet  kube-proxy.kubeconfig  proxy  scheduler  ssl  token.csv
```

## 配置Flanneld

参考我之前写的文章[Kubernetes基于Flannel的网络配置](https://jimmysong.io/posts/kubernetes-network-config/)，之前没有配置TLS，现在需要在serivce配置文件中增加TLS配置。

service配置文件为

```ini
/usr/lib/systemd/system/flanneld.service
```

文件内容为：

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

`/etc/sysconfig/flanneld`配置文件。

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

在FLANNEL_OPTIONS中增加TLS的配置。

## 安装和配置 kubelet

kubelet 启动时向 kube-apiserver 发送 TLS bootstrapping 请求，需要先将 bootstrap token 文件中的 kubelet-bootstrap 用户赋予 system:node-bootstrapper cluster 角色(role)，
然后 kubelet 才能有权限创建认证请求(certificate signing requests)：

```bash
$ cd /etc/kubernetes
$ kubectl create clusterrolebinding kubelet-bootstrap \
  --clusterrole=system:node-bootstrapper \
  --user=kubelet-bootstrap
```

`--user=kubelet-bootstrap` 是在 `/etc/kubernetes/token.csv` 文件中指定的用户名，同时也写入了该文件中：

```ini
/etc/kubernetes/bootstrap.kubeconfig
```

### 下载最新的 kubelet 和 kube-proxy 二进制文件

```bash
$ wget https://dl.k8s.io/v1.6.0/kubernetes-server-linux-amd64.tar.gz
$ tar -xzvf kubernetes-server-linux-amd64.tar.gz
$ cd kubernetes
$ tar -xzvf  kubernetes-src.tar.gz
$ cp -r ./server/bin/{kube-proxy,kubelet} /usr/bin/
```

### 创建 kubelet 的service配置文件

文件位置在

```ini
/usr/lib/systemd/system/kubelet.serivce
```

文件内容为：

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

kubelet的配置文件`/etc/kubernetes/kubelet`。其中的IP地址更改为你的每台node节点的IP地址。

```bash
###
## kubernetes kubelet (minion) config
#
## The address for the info server to serve on (set to 0.0.0.0 or "" for all interfaces)
KUBELET_ADDRESS="--address=172.20.0.113"
#
## The port for the info server to serve on
#KUBELET_PORT="--port=10250"
#
## You may leave this blank to use the actual hostname
KUBELET_HOSTNAME="--hostname-override=172.20.0.113"
#
## location of the api-server
KUBELET_API_SERVER="--api-servers=http://172.20.0.113:8080"
#
## pod infrastructure container
KUBELET_POD_INFRA_CONTAINER="--pod-infra-container-image=sz-pg-oam-docker-hub-001.tendcloud.com/library/pod-infrastructure:rhel7"
#
## Add your own!
KUBELET_ARGS="--cgroup-driver=systemd --cluster_dns=10.254.0.2 --experimental-bootstrap-kubeconfig=/etc/kubernetes/bootstrap.kubeconfig --kubeconfig=/etc/kubernetes/kubelet.kubeconfig --require-kubeconfig --cert-dir=/etc/kubernetes/ssl --cluster_domain=cluster.local. --hairpin-mode promiscuous-bridge --serialize-image-pulls=false"
```

- `--address` 不能设置为 `127.0.0.1`，否则后续 Pods 访问 kubelet 的 API 接口时会失败，因为 Pods 访问的 `127.0.0.1` 指向自己而不是 kubelet；
- 如果设置了 `--hostname-override` 选项，则 `kube-proxy` 也需要设置该选项，否则会出现找不到 Node 的情况；
- `--experimental-bootstrap-kubeconfig` 指向 bootstrap kubeconfig 文件，kubelet 使用该文件中的用户名和 token 向 kube-apiserver 发送 TLS Bootstrapping 请求；
- 管理员通过了 CSR 请求后，kubelet 自动在 `--cert-dir` 目录创建证书和私钥文件(`kubelet-client.crt` 和 `kubelet-client.key`)，然后写入 `--kubeconfig` 文件；
- 建议在 `--kubeconfig` 配置文件中指定 `kube-apiserver` 地址，如果未指定 `--api-servers` 选项，则必须指定 `--require-kubeconfig` 选项后才从配置文件中读取 kube-apiserver 的地址，否则 kubelet 启动后将找不到 kube-apiserver (日志中提示未找到 API Server），`kubectl get nodes` 不会返回对应的 Node 信息;
- `--cluster_dns` 指定 kubedns 的 Service IP(可以先分配，后续创建 kubedns 服务时指定该 IP)，`--cluster_domain` 指定域名后缀，这两个参数同时指定后才会生效；

完整 unit 见 [kubelet.service](./systemd/kubelet.service)

### 启动kublet

```bash
$ systemctl daemon-reload
$ systemctl enable kubelet
$ systemctl start kubelet
$ systemctl status kubelet
```

### 通过 kublet 的 TLS 证书请求

kubelet 首次启动时向 kube-apiserver 发送证书签名请求，必须通过后 kubernetes 系统才会将该 Node 加入到集群。

查看未授权的 CSR 请求

```bash
$ kubectl get csr
NAME        AGE       REQUESTOR           CONDITION
csr-2b308   4m        kubelet-bootstrap   Pending
$ kubectl get nodes
No resources found.
```

通过 CSR 请求

```bash
$ kubectl certificate approve csr-2b308
certificatesigningrequest "csr-2b308" approved
$ kubectl get nodes
NAME        STATUS    AGE       VERSION
10.64.3.7   Ready     49m       v1.6.1
```

自动生成了 kubelet kubeconfig 文件和公私钥

```bash
$ ls -l /etc/kubernetes/kubelet.kubeconfig
-rw------- 1 root root 2284 Apr  7 02:07 /etc/kubernetes/kubelet.kubeconfig
$ ls -l /etc/kubernetes/ssl/kubelet*
-rw-r--r-- 1 root root 1046 Apr  7 02:07 /etc/kubernetes/ssl/kubelet-client.crt
-rw------- 1 root root  227 Apr  7 02:04 /etc/kubernetes/ssl/kubelet-client.key
-rw-r--r-- 1 root root 1103 Apr  7 02:07 /etc/kubernetes/ssl/kubelet.crt
-rw------- 1 root root 1675 Apr  7 02:07 /etc/kubernetes/ssl/kubelet.key
```

## 配置 kube-proxy

**创建 kube-proxy 的service配置文件**

文件路径`/usr/lib/systemd/system/kube-proxy.service`。

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

kube-proxy配置文件`/etc/kubernetes/proxy`。

```bash
###
# kubernetes proxy config

# default config should be adequate

# Add your own!
KUBE_PROXY_ARGS="--bind-address=172.20.0.113 --hostname-override=172.20.0.113 --kubeconfig=/etc/kubernetes/kube-proxy.kubeconfig --cluster-cidr=10.254.0.0/16"
```

- `--hostname-override` 参数值必须与 kubelet 的值一致，否则 kube-proxy 启动后会找不到该 Node，从而不会创建任何 iptables 规则；
- kube-proxy 根据 `--cluster-cidr` 判断集群内部和外部流量，指定 `--cluster-cidr` 或 `--masquerade-all` 选项后 kube-proxy 才会对访问 Service IP 的请求做 SNAT；
- `--kubeconfig` 指定的配置文件嵌入了 kube-apiserver 的地址、用户名、证书、秘钥等请求和认证信息；
- 预定义的 RoleBinding `cluster-admin` 将User `system:kube-proxy` 与 Role `system:node-proxier` 绑定，该 Role 授予了调用 `kube-apiserver` Proxy 相关 API 的权限；

完整 unit 见 [kube-proxy.service](./systemd/kube-proxy.service)

### 启动 kube-proxy

```bash
$ systemctl daemon-reload
$ systemctl enable kube-proxy
$ systemctl start kube-proxy
$ systemctl status kube-proxy
```

## 验证测试

我们创建一个niginx的service试一下集群是否可用。

```bash
$ kubectl run nginx --replicas=2 --labels="run=load-balancer-example" --image=sz-pg-oam-docker-hub-001.tendcloud.com/library/nginx:1.9  --port=80
deployment "nginx" created
$ kubectl expose deployment nginx --type=NodePort --name=example-service
service "example-service" exposed
$ kubectl describe svc example-service
Name:			example-service
Namespace:		default
Labels:			run=load-balancer-example
Annotations:		<none>
Selector:		run=load-balancer-example
Type:			NodePort
IP:			10.254.62.207
Port:			<unset>	80/TCP
NodePort:		<unset>	32724/TCP
Endpoints:		172.30.60.2:80,172.30.94.2:80
Session Affinity:	None
Events:			<none>
$ curl "10.254.62.207:80"
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

访问`172.20.0.113:32724`或`172.20.0.114:32724`或者`172.20.0.115:32724`都可以得到nginx的页面。

![welcome-nginx](https://res.cloudinary.com/jimmysong/image/upload/images/kubernetes-installation-test-nginx.png)

