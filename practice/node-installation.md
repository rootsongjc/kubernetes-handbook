# 部署node节点

Kubernetes node节点包含如下组件：

+ Flanneld：参考我之前写的文章[Kubernetes基于Flannel的网络配置](https://jimmysong.io/posts/kubernetes-network-config/)，之前没有配置TLS，现在需要在service配置文件中增加TLS配置，安装过程请参考上一节[安装flannel网络插件](flannel-installation.md)。
+ Docker1.12.5：docker的安装很简单，这里也不说了，但是需要注意docker的配置。
+ kubelet：直接用二进制文件安装
+ kube-proxy：直接用二进制文件安装

**注意**：每台 node 上都需要安装 flannel，master 节点上可以不安装。

**步骤简介**

1. 确认在上一步中我们安装配置的网络插件flannel已启动且运行正常
2. 安装配置docker后启动
3. 安装配置kubelet、kube-proxy后启动
4. 验证

## 目录和文件

我们再检查一下三个节点上，经过前几步操作我们已经创建了如下的证书和配置文件。

``` bash
$ ls /etc/kubernetes/ssl
admin-key.pem  admin.pem  ca-key.pem  ca.pem  kube-proxy-key.pem  kube-proxy.pem  kubernetes-key.pem  kubernetes.pem
$ ls /etc/kubernetes/
apiserver  bootstrap.kubeconfig  config  controller-manager  kubelet  kube-proxy.kubeconfig  proxy  scheduler  ssl  token.csv
```

## 配置Docker

> 如果您使用yum的方式安装的flannel则不需要执行mk-docker-opts.sh文件这一步，参考Flannel官方文档中的[Docker Integration](https://github.com/coreos/flannel/blob/master/Documentation/running.md)。

如果你不是使用yum安装的flannel，那么需要下载flannel github release中的tar包，解压后会获得一个**mk-docker-opts.sh**文件，到[flannel release](https://github.com/coreos/flannel/releases)页面下载对应版本的安装包，该脚本见[mk-docker-opts.sh](https://github.com/rootsongjc/kubernetes-handbook/tree/master/tools/flannel/mk-docker-opts.sh)，因为我们使用yum安装所以不需要执行这一步。

这个文件是用来`Generate Docker daemon options based on flannel env file`。

使用`systemctl`命令启动flanneld后，会自动执行`./mk-docker-opts.sh -i`生成如下两个文件环境变量文件：

- /run/flannel/subnet.env

```ini
FLANNEL_NETWORK=172.30.0.0/16
FLANNEL_SUBNET=172.30.46.1/24
FLANNEL_MTU=1450
FLANNEL_IPMASQ=false
```

- /run/docker_opts.env

```ini
DOCKER_OPT_BIP="--bip=172.30.46.1/24"
DOCKER_OPT_IPMASQ="--ip-masq=true"
DOCKER_OPT_MTU="--mtu=1450"
```

Docker将会读取这两个环境变量文件作为容器启动参数。

**注意：**不论您用什么方式安装的flannel，下面这一步是必不可少的。

**yum方式安装的flannel**

修改docker的配置文件`/usr/lib/systemd/system/docker.service`，增加一条环境变量配置：

```ini
EnvironmentFile=-/run/flannel/docker
```

`/run/flannel/docker`文件是flannel启动后自动生成的，其中包含了docker启动时需要的参数。

**二进制方式安装的flannel**

修改docker的配置文件`/usr/lib/systemd/system/docker.service`，增加如下几条环境变量配置：

```ini
EnvironmentFile=-/run/docker_opts.env
EnvironmentFile=-/run/flannel/subnet.env
```

这两个文件是`mk-docker-opts.sh`脚本生成环境变量文件默认的保存位置，docker启动的时候需要加载这几个配置文件才可以加入到flannel创建的虚拟网络里。

所以不论您使用何种方式安装的flannel，将以下配置加入到`docker.service`中可确保万无一失。

```ini
EnvironmentFile=-/run/flannel/docker
EnvironmentFile=-/run/docker_opts.env
EnvironmentFile=-/run/flannel/subnet.env
EnvironmentFile=-/etc/sysconfig/docker
EnvironmentFile=-/etc/sysconfig/docker-storage
EnvironmentFile=-/etc/sysconfig/docker-network
EnvironmentFile=-/run/docker_opts.env
```

请参考[docker.service](https://github.com/rootsongjc/kubernetes-handbook/blob/master/systemd/docker.service)中的配置。

### 启动docker

重启了docker后还要重启kubelet，这时又遇到问题，kubelet启动失败。报错：

```bash
Mar 31 16:44:41 test-002.jimmysong.io kubelet[81047]: error: failed to run Kubelet: failed to create kubelet: misconfiguration: kubelet cgroup driver: "cgroupfs" is different from docker cgroup driver: "systemd"
```

这是kubelet与docker的**cgroup driver**不一致导致的，kubelet启动的时候有个`—cgroup-driver`参数可以指定为"cgroupfs"或者“systemd”。

```bash
--cgroup-driver string                                    Driver that the kubelet uses to manipulate cgroups on the host.  Possible values: 'cgroupfs', 'systemd' (default "cgroupfs")
```

配置docker的service配置文件`/usr/lib/systemd/system/docker.service`，设置`ExecStart`中的`--exec-opt native.cgroupdriver=systemd`。

## 安装和配置kubelet

**kubernets1.8**

相对于kubernetes1.6集群必须进行的配置有：

对于kuberentes1.8集群，必须关闭swap，否则kubelet启动将失败。

修改`/etc/fstab`将，swap系统注释掉。

---

kubelet 启动时向 kube-apiserver 发送 TLS bootstrapping 请求，需要先将 bootstrap token 文件中的 kubelet-bootstrap 用户赋予 system:node-bootstrapper cluster 角色(role)，
然后 kubelet 才能有权限创建认证请求(certificate signing requests)：

``` bash
cd /etc/kubernetes
kubectl create clusterrolebinding kubelet-bootstrap \
  --clusterrole=system:node-bootstrapper \
  --user=kubelet-bootstrap
```

+ `--user=kubelet-bootstrap` 是在 `/etc/kubernetes/token.csv` 文件中指定的用户名，同时也写入了 `/etc/kubernetes/bootstrap.kubeconfig` 文件；

---

kubelet 通过认证后向 kube-apiserver 发送 register node 请求，需要先将 `kubelet-nodes` 用户赋予 `system:node` cluster角色(role) 和 `system:nodes` 组(group)，
然后 kubelet 才能有权限创建节点请求：

``` bash
kubectl create clusterrolebinding kubelet-nodes \
  --clusterrole=system:node \
  --group=system:nodes
```

### 下载最新的kubelet和kube-proxy二进制文件

注意请下载对应的Kubernetes版本的安装包。

``` bash
wget https://dl.k8s.io/v1.6.0/kubernetes-server-linux-amd64.tar.gz
tar -xzvf kubernetes-server-linux-amd64.tar.gz
cd kubernetes
tar -xzvf  kubernetes-src.tar.gz
cp -r ./server/bin/{kube-proxy,kubelet} /usr/local/bin/
```

### 创建kubelet的service配置文件

文件位置`/usr/lib/systemd/system/kubelet.service`。

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
ExecStart=/usr/local/bin/kubelet \
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

**注意：**在启动kubelet之前，需要先手动创建`/var/lib/kubelet`目录。

下面是kubelet的配置文件`/etc/kubernetes/kubelet`:

**kubernetes1.8**

相对于kubenrete1.6的配置变动：

- 对于kuberentes1.8集群中的kubelet配置，取消了`KUBELET_API_SERVER`的配置，而改用kubeconfig文件来定义master地址，所以请注释掉`KUBELET_API_SERVER`配置。

``` bash
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
## COMMENT THIS ON KUBERNETES 1.8+
KUBELET_API_SERVER="--api-servers=http://172.20.0.113:8080"
#
## pod infrastructure container
KUBELET_POD_INFRA_CONTAINER="--pod-infra-container-image=jimmysong/pause-amd64:3.0"
#
## Add your own!
KUBELET_ARGS="--cgroup-driver=systemd --cluster-dns=10.254.0.2 --experimental-bootstrap-kubeconfig=/etc/kubernetes/bootstrap.kubeconfig --kubeconfig=/etc/kubernetes/kubelet.kubeconfig --require-kubeconfig --cert-dir=/etc/kubernetes/ssl --cluster-domain=cluster.local --hairpin-mode promiscuous-bridge --serialize-image-pulls=false"
```

+ 如果使用systemd方式启动，则需要额外增加两个参数`--runtime-cgroups=/systemd/system.slice --kubelet-cgroups=/systemd/system.slice`
+ `--experimental-bootstrap-kubeconfig` 在1.9版本已经变成了`--bootstrap-kubeconfig`
+ `--address` 不能设置为 `127.0.0.1`，否则后续 Pods 访问 kubelet 的 API 接口时会失败，因为 Pods 访问的 `127.0.0.1` 指向自己而不是 kubelet；
+ 如果设置了 `--hostname-override` 选项，则 `kube-proxy` 也需要设置该选项，否则会出现找不到 Node 的情况；
+ `"--cgroup-driver` 配置成 `systemd`，不要使用`cgroup`，否则在 CentOS 系统中 kubelet 将启动失败（保持docker和kubelet中的cgroup driver配置一致即可，不一定非使用`systemd`）。
+ `--experimental-bootstrap-kubeconfig` 指向 bootstrap kubeconfig 文件，kubelet 使用该文件中的用户名和 token 向 kube-apiserver 发送 TLS Bootstrapping 请求；
+ 管理员通过了 CSR 请求后，kubelet 自动在 `--cert-dir` 目录创建证书和私钥文件(`kubelet-client.crt` 和 `kubelet-client.key`)，然后写入 `--kubeconfig` 文件；
+ 建议在 `--kubeconfig` 配置文件中指定 `kube-apiserver` 地址，如果未指定 `--api-servers` 选项，则必须指定 `--require-kubeconfig` 选项后才从配置文件中读取 kube-apiserver 的地址，否则 kubelet 启动后将找不到 kube-apiserver (日志中提示未找到 API Server），`kubectl get nodes` 不会返回对应的 Node 信息; `--require-kubeconfig` 在1.10版本被移除，参看[PR](https://github.com/kubernetes/kops/pull/4357/commits/30b10cb1c8c9d8d67fdf6371f1fda952a2b02004)；
+ `--cluster-dns` 指定 kubedns 的 Service IP(可以先分配，后续创建 kubedns 服务时指定该 IP)，`--cluster-domain` 指定域名后缀，这两个参数同时指定后才会生效；
+ `--cluster-domain` 指定 pod 启动时 `/etc/resolve.conf` 文件中的 `search domain` ，起初我们将其配置成了 `cluster.local.`，这样在解析 service 的 DNS 名称时是正常的，可是在解析 headless service 中的 FQDN pod name 的时候却错误，因此我们将其修改为 `cluster.local`，去掉最后面的 ”点号“ 就可以解决该问题，关于 kubernetes 中的域名/服务名称解析请参见我的另一篇文章。
+ `--kubeconfig=/etc/kubernetes/kubelet.kubeconfig `中指定的`kubelet.kubeconfig`文件在第一次启动kubelet之前并不存在，请看下文，当通过CSR请求后会自动生成`kubelet.kubeconfig`文件，如果你的节点上已经生成了`~/.kube/config`文件，你可以将该文件拷贝到该路径下，并重命名为`kubelet.kubeconfig`，所有node节点可以共用同一个kubelet.kubeconfig文件，这样新添加的节点就不需要再创建CSR请求就能自动添加到kubernetes集群中。同样，在任意能够访问到kubernetes集群的主机上使用`kubectl --kubeconfig`命令操作集群时，只要使用`~/.kube/config`文件就可以通过权限认证，因为这里面已经有认证信息并认为你是admin用户，对集群拥有所有权限。
+ `KUBELET_POD_INFRA_CONTAINER` 是基础镜像容器，这里我用的是私有镜像仓库地址，**大家部署的时候需要修改为自己的镜像**。我上传了一个到时速云上，可以直接 `docker pull index.tenxcloud.com/jimmy/pod-infrastructure` 下载。`pod-infrastructure`镜像是Redhat制作的，大小接近80M，下载比较耗时，其实该镜像并不运行什么具体进程，可以使用Google的pause镜像`gcr.io/google_containers/pause-amd64:3.0`，这个镜像只有300多K，或者通过DockerHub下载`jimmysong/pause-amd64:3.0`。

完整 unit 见 [kubelet.service](../systemd/kubelet.service)

### 启动kublet

``` bash
systemctl daemon-reload
systemctl enable kubelet
systemctl start kubelet
systemctl status kubelet
```

### 通过kublet的TLS证书请求

kubelet 首次启动时向 kube-apiserver 发送证书签名请求，必须通过后 kubernetes 系统才会将该 Node 加入到集群。

查看未授权的 CSR 请求

``` bash
$ kubectl get csr
NAME        AGE       REQUESTOR           CONDITION
csr-2b308   4m        kubelet-bootstrap   Pending
$ kubectl get nodes
No resources found.
```

通过 CSR 请求

``` bash
$ kubectl certificate approve csr-2b308
certificatesigningrequest "csr-2b308" approved
$ kubectl get nodes
NAME        STATUS    AGE       VERSION
10.64.3.7   Ready     49m       v1.6.1
```

自动生成了 kubelet kubeconfig 文件和公私钥

``` bash
$ ls -l /etc/kubernetes/kubelet.kubeconfig
-rw------- 1 root root 2284 Apr  7 02:07 /etc/kubernetes/kubelet.kubeconfig
$ ls -l /etc/kubernetes/ssl/kubelet*
-rw-r--r-- 1 root root 1046 Apr  7 02:07 /etc/kubernetes/ssl/kubelet-client.crt
-rw------- 1 root root  227 Apr  7 02:04 /etc/kubernetes/ssl/kubelet-client.key
-rw-r--r-- 1 root root 1103 Apr  7 02:07 /etc/kubernetes/ssl/kubelet.crt
-rw------- 1 root root 1675 Apr  7 02:07 /etc/kubernetes/ssl/kubelet.key
```

假如你更新kubernetes的证书，只要没有更新`token.csv`，当重启kubelet后，该node就会自动加入到kuberentes集群中，而不会重新发送`certificaterequest`，也不需要在master节点上执行`kubectl certificate approve`操作。前提是不要删除node节点上的`/etc/kubernetes/ssl/kubelet*`和`/etc/kubernetes/kubelet.kubeconfig`文件。否则kubelet启动时会提示找不到证书而失败。

**注意：**如果启动kubelet的时候见到证书相关的报错，有个trick可以解决这个问题，可以将master节点上的`~/.kube/config`文件（该文件在[安装kubectl命令行工具](kubectl-installation.md)这一步中将会自动生成）拷贝到node节点的`/etc/kubernetes/kubelet.kubeconfig`位置，这样就不需要通过CSR，当kubelet启动后就会自动加入的集群中。

## 配置 kube-proxy

**安装conntrack**

```bash
yum install -y conntrack-tools
```

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
ExecStart=/usr/local/bin/kube-proxy \
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

``` bash
###
# kubernetes proxy config

# default config should be adequate

# Add your own!
KUBE_PROXY_ARGS="--bind-address=172.20.0.113 --hostname-override=172.20.0.113 --kubeconfig=/etc/kubernetes/kube-proxy.kubeconfig --cluster-cidr=10.254.0.0/16"
```

+ `--hostname-override` 参数值必须与 kubelet 的值一致，否则 kube-proxy 启动后会找不到该 Node，从而不会创建任何 iptables 规则；
+ kube-proxy 根据 `--cluster-cidr` 判断集群内部和外部流量，指定 `--cluster-cidr` 或 `--masquerade-all` 选项后 kube-proxy 才会对访问 Service IP 的请求做 SNAT；
+ `--kubeconfig` 指定的配置文件嵌入了 kube-apiserver 的地址、用户名、证书、秘钥等请求和认证信息；
+ 预定义的 RoleBinding `cluster-admin` 将User `system:kube-proxy` 与 Role `system:node-proxier` 绑定，该 Role 授予了调用 `kube-apiserver` Proxy 相关 API 的权限；

完整 unit 见 [kube-proxy.service](../systemd/kube-proxy.service)

### 启动 kube-proxy

``` bash
systemctl daemon-reload
systemctl enable kube-proxy
systemctl start kube-proxy
systemctl status kube-proxy
```
## 验证测试

我们创建一个nginx的service试一下集群是否可用。

```bash
$ kubectl run nginx --replicas=2 --labels="run=load-balancer-example" --image=nginx  --port=80
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

访问以下任何一个地址都可以得到nginx的页面。

- 172.20.0.113:32724
- 172.20.0.114:32724
- 172.20.0.115:32724

![nginx欢迎页面](../images/kubernetes-installation-test-nginx.png)

## 参考

- [Kubelet 的认证授权](../guide/kubelet-authentication-authorization.md)
