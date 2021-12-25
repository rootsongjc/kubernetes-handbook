# 用 kubeadm 在 Ubuntu 上快速构建 Kubernetes 测试集群

本文将介绍如何在 Ubuntu server 16.04 版本上安装 kubeadm，并利用 kubeadm 快速的在 Ubuntu server 版本 16.04 上构建一个 kubernetes 的基础的测试集群，用来做学习和测试用途，当前（2018-04-14）最新的版本是 1.10.1。参考文档包括 kubernetes 官方网站的 [kubeadm 安装文档](https://kubernetes.io/docs/setup/independent/install-kubeadm/)以及[利用 kubeadm 创建集群](https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/)这两个文档。

生产用途的环境，需要考虑各个组件的高可用，建议参考 Kubernetes 的官方的相关的安装文档。

## 概述

本次安装建议至少 4 台服务器或者虚拟机，每台服务器 4G 内存，2 个 CPU 核心以上，基本架构为 1 台 master 节点，3 台 slave 节点。整个安装过程将在 Ubuntu 服务器上安装完 kubeadm，以及安装 kubernetes 的基本集群，包括 canal 网络，另后台存储可参考本书的最佳实践中的存储管理内容。 本次安装一共 4 个节点，节点信息如下:

| 角色   | 主机名        | IP 地址       |
| ------ | ------------- | ------------- |
| Master | Ubuntu-master | 192.168.5.200 |
| Slave  | ubuntu-1      | 192.168.5.201 |
| Slave  | ubuntu-2      | 192.168.5.202 |
| Slave  | ubuntu-3      | 192.168.5.203 |

## 准备工作

- 默认方式安装 Ubuntu Server 版本 16.04
- 配置主机名映射，每个节点

```bash
# cat /etc/hosts
127.0.0.1    localhost
192.168.0.200   Ubuntu-master
192.168.0.201   Ubuntu-1
192.168.0.202   Ubuntu-2
192.168.0.203   Ubuntu-3
```

- 如果连接 gcr 网站不方便，无法下载镜像，会导致安装过程卡住，可以下载我导出的镜像包，

  我导出的镜像网盘链接

  ，解压缩以后是多个个 tar 包，使用

   

  ```
  docker load< xxxx.tar
  ```

   

  导入各个文件即可）。

  ## 在所有节点上安装 kubeadm

  查看 apt 安装源如下配置，使用阿里云的系统和 kubernetes 的源。

```bash
$ cat /etc/apt/sources.list
# 系统安装源
deb http://mirrors.aliyun.com/ubuntu/ xenial main restricted
deb http://mirrors.aliyun.com/ubuntu/ xenial-updates main restricted
deb http://mirrors.aliyun.com/ubuntu/ xenial universe
deb http://mirrors.aliyun.com/ubuntu/ xenial-updates universe
deb http://mirrors.aliyun.com/ubuntu/ xenial multiverse
deb http://mirrors.aliyun.com/ubuntu/ xenial-updates multiverse
deb http://mirrors.aliyun.com/ubuntu/ xenial-backports main restricted universe multiverse
# kubeadm及kubernetes组件安装源
deb https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial main
```

安装 docker，可以使用系统源的的 docker.io 软件包，版本 1.13.1，我的系统里是已经安装好最新的版本了。

```bash
# apt-get install docker.io
Reading package lists... Done
Building dependency tree       
Reading state information... Done
docker.io is already the newest version (1.13.1-0ubuntu1~16.04.2).
0 upgraded, 0 newly installed, 0 to remove and 4 not upgraded.
```

更新源，可以不理会 gpg 的报错信息。

```bash
# apt-get update
Hit:1 http://mirrors.aliyun.com/ubuntu xenial InRelease
Hit:2 http://mirrors.aliyun.com/ubuntu xenial-updates InRelease
Hit:3 http://mirrors.aliyun.com/ubuntu xenial-backports InRelease
Get:4 https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial InRelease [8,993 B]
Ign:4 https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial InRelease
Fetched 8,993 B in 0s (20.7 kB/s)
Reading package lists... Done
W: GPG error: https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial InRelease: The following signatures couldn't be verified because the public key is not available: NO_PUBKEY 6A030B21BA07F4FB
W: The repository 'https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial InRelease' is not signed.
N: Data from such a repository can't be authenticated and is therefore potentially dangerous to use.
N: See apt-secure(8) manpage for repository creation and user configuration details.
```

强制安装 kubeadm，kubectl，kubelet 软件包。

```bash
# apt-get install -y kubelet kubeadm kubectl --allow-unauthenticated
Reading package lists... Done
Building dependency tree
Reading state information... Done
The following additional packages will be installed:
  kubernetes-cni socat
The following NEW packages will be installed:
  kubeadm kubectl kubelet kubernetes-cni socat
0 upgraded, 5 newly installed, 0 to remove and 4 not upgraded.
Need to get 56.9 MB of archives.
After this operation, 410 MB of additional disk space will be used.
WARNING: The following packages cannot be authenticated!
  kubernetes-cni kubelet kubectl kubeadm
Authentication warning overridden.
Get:1 http://mirrors.aliyun.com/ubuntu xenial/universe amd64 socat amd64 1.7.3.1-1 [321 kB]
Get:2 https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial/main amd64 kubernetes-cni amd64 0.6.0-00 [5,910 kB]
Get:3 https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial/main amd64 kubelet amd64 1.10.1-00 [21.1 MB]
Get:4 https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial/main amd64 kubectl amd64 1.10.1-00 [8,906 kB]
Get:5 https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial/main amd64 kubeadm amd64 1.10.1-00 [20.7 MB]
Fetched 56.9 MB in 5s (11.0 MB/s)
Use of uninitialized value $_ in lc at /usr/share/perl5/Debconf/Template.pm line 287.
Selecting previously unselected package kubernetes-cni.
(Reading database ... 191799 files and directories currently installed.)
Preparing to unpack .../kubernetes-cni_0.6.0-00_amd64.deb ...
Unpacking kubernetes-cni (0.6.0-00) ...
Selecting previously unselected package socat.
Preparing to unpack .../socat_1.7.3.1-1_amd64.deb ...
Unpacking ....
....
```

kubeadm 安装完以后，就可以使用它来快速安装部署 Kubernetes 集群了。

## 使用 kubeadm 安装 Kubernetes 集群

在做好了准备工作之后，下面介绍如何使用 kubeadm 安装 Kubernetes 集群，我们将首先安装 master 节点，然后将 slave 节点一个个加入到集群中去。

### 使用 kubeadmin 初始化 master 节点

因为使用要使用 canal，因此需要在初始化时加上网络配置参数，设置 kubernetes 的子网为 10.244.0.0/16，注意此处不要修改为其他地址，因为这个值与后续的 canal 的 yaml 值要一致，如果修改，请一并修改。

这个下载镜像的过程涉及翻墙，因为会从 gcr 的站点下载容器镜像。。。（如果大家翻墙不方便的话，可以用我在上文准备工作中提到的导出的镜像）。

如果有能够连接 gcr 站点的网络，那么整个安装过程非常简单。

```bash
# kubeadm init --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=192.168.0.200
[init] Using Kubernetes version: v1.10.1
[init] Using Authorization modes: [Node RBAC]
[preflight] Running pre-flight checks.
    [WARNING FileExisting-crictl]: crictl not found in system path
Suggestion: go get github.com/kubernetes-incubator/cri-tools/cmd/crictl
[preflight] Starting the kubelet service
[certificates] Generated ca certificate and key.
[certificates] Generated apiserver certificate and key.
[certificates] apiserver serving cert is signed for DNS names [ubuntu-master kubernetes kubernetes.default kubernetes.default.svc kubernetes.default.svc.cluster.local] and IPs [10.96.0.1 192.168.0.200]
[certificates] Generated apiserver-kubelet-client certificate and key.
[certificates] Generated etcd/ca certificate and key.
[certificates] Generated etcd/server certificate and key.
[certificates] etcd/server serving cert is signed for DNS names [localhost] and IPs [127.0.0.1]
[certificates] Generated etcd/peer certificate and key.
[certificates] etcd/peer serving cert is signed for DNS names [ubuntu-master] and IPs [192.168.0.200]
[certificates] Generated etcd/healthcheck-client certificate and key.
[certificates] Generated apiserver-etcd-client certificate and key.
[certificates] Generated sa key and public key.
[certificates] Generated front-proxy-ca certificate and key.
[certificates] Generated front-proxy-client certificate and key.
[certificates] Valid certificates and keys now exist in "/etc/kubernetes/pki"
[kubeconfig] Wrote KubeConfig file to disk: "/etc/kubernetes/admin.conf"
[kubeconfig] Wrote KubeConfig file to disk: "/etc/kubernetes/kubelet.conf"
[kubeconfig] Wrote KubeConfig file to disk: "/etc/kubernetes/controller-manager.conf"
[kubeconfig] Wrote KubeConfig file to disk: "/etc/kubernetes/scheduler.conf"
[controlplane] Wrote Static Pod manifest for component kube-apiserver to "/etc/kubernetes/manifests/kube-apiserver.yaml"
[controlplane] Wrote Static Pod manifest for component kube-controller-manager to "/etc/kubernetes/manifests/kube-controller-manager.yaml"
[controlplane] Wrote Static Pod manifest for component kube-scheduler to "/etc/kubernetes/manifests/kube-scheduler.yaml"
[etcd] Wrote Static Pod manifest for a local etcd instance to "/etc/kubernetes/manifests/etcd.yaml"
[init] Waiting for the kubelet to boot up the control plane as Static Pods from directory "/etc/kubernetes/manifests".
[init] This might take a minute or longer if the control plane images have to be pulled.
[apiclient] All control plane components are healthy after 28.003828 seconds
[uploadconfig] Storing the configuration used in ConfigMap "kubeadm-config" in the "kube-system" Namespace
[markmaster] Will mark node ubuntu-master as master by adding a label and a taint
[markmaster] Master ubuntu-master tainted and labelled with key/value: node-role.kubernetes.io/master=""
[bootstraptoken] Using token: rw4enn.mvk547juq7qi2b5f
[bootstraptoken] Configured RBAC rules to allow Node Bootstrap tokens to post CSRs in order for nodes to get long term certificate credentials
[bootstraptoken] Configured RBAC rules to allow the csrapprover controller automatically approve CSRs from a Node Bootstrap Token
[bootstraptoken] Configured RBAC rules to allow certificate rotation for all node client certificates in the cluster
[bootstraptoken] Creating the "cluster-info" ConfigMap in the "kube-public" namespace
[addons] Applied essential addon: kube-dns
[addons] Applied essential addon: kube-proxy

Your Kubernetes master has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

You can now join any number of machines by running the following on each node
as root:

  kubeadm join 192.168.0.200:6443 --token rw4enn.mvk547juq7qi2b5f --discovery-token-ca-cert-hash sha256:ba260d5191213382a806a9a7d92c9e6bb09061847c7914b1ac584d0c69471579
```

执行如下命令来配置 kubectl。

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

这样 master 的节点就配置好了，并且可以使用 kubectl 来进行各种操作了，根据上面的提示接着往下做，将 slave 节点加入到集群。

### Slave 节点加入集群

在 slave 节点执行如下的命令，将 slave 节点加入集群，正常的返回信息如下：

```bash
#kubeadm join 192.168.0.200:6443 --token rw4enn.mvk547juq7qi2b5f --discovery-token-ca-cert-hash sha256:ba260d5191213382a806a9a7d92c9e6bb09061847c7914b1ac584d0c69471579
[preflight] Running pre-flight checks.
    [WARNING FileExisting-crictl]: crictl not found in system path
Suggestion: go get github.com/kubernetes-incubator/cri-tools/cmd/crictl
[discovery] Trying to connect to API Server "192.168.0.200:6443"
[discovery] Created cluster-info discovery client, requesting info from "https://192.168.0.200:6443"
[discovery] Requesting info from "https://192.168.0.200:6443" again to validate TLS against the pinned public key
[discovery] Cluster info signature and contents are valid and TLS certificate validates against pinned roots, will use API Server "192.168.0.200:6443"
[discovery] Successfully established connection with API Server "192.168.0.200:6443"

This node has joined the cluster:
* Certificate signing request was sent to master and a response
  was received.
* The Kubelet was informed of the new secure connection details.

Run 'kubectl get nodes' on the master to see this node join the cluster.
```

等待节点加入完毕。加入中状态。

```bash
# kubectl get node
NAME            STATUS     ROLES     AGE       VERSION
ubuntu-1        NotReady   <none>    6m        v1.10.1
ubuntu-2        NotReady   <none>    6m        v1.10.1
ubuntu-3        NotReady   <none>    6m        v1.10.1
ubuntu-master   NotReady   master    10m       v1.10.1
```

在 master 节点查看信息如下状态为节点加入完毕。

```bash
root@Ubuntu-master:~# kubectl get pod -n kube-system -o wide
NAME                                    READY     STATUS    RESTARTS   AGE       IP              NODE
etcd-ubuntu-master                      1/1       Running   0          21m       192.168.0.200   ubuntu-master
kube-apiserver-ubuntu-master            1/1       Running   0          21m       192.168.0.200   ubuntu-master
kube-controller-manager-ubuntu-master   1/1       Running   0          22m       192.168.0.200   ubuntu-master
kube-dns-86f4d74b45-wkfk2               0/3       Pending   0          22m       <none>          <none>
kube-proxy-6ddb4                        1/1       Running   0          22m       192.168.0.200   ubuntu-master
kube-proxy-7ngb9                        1/1       Running   0          17m       192.168.0.202   ubuntu-2
kube-proxy-fkhhx                        1/1       Running   0          18m       192.168.0.201   ubuntu-1
kube-proxy-rh4lq                        1/1       Running   0          18m       192.168.0.203   ubuntu-3
kube-scheduler-ubuntu-master            1/1       Running   0          21m       192.168.0.200   ubuntu-master
```

kubedns 组件需要在网络插件完成安装以后会自动安装完成。

## 安装网络插件 canal

从 [canal 官方文档参考](https://docs.projectcalico.org/v3.0/getting-started/kubernetes/installation/hosted/canal/)，如下网址下载 2 个文件并且安装，其中一个是配置 canal 的 RBAC 权限，一个是部署 canal 的 DaemonSet。

```bash
# kubectl apply -f  https://docs.projectcalico.org/v3.0/getting-started/kubernetes/installation/hosted/canal/rbac.yaml
clusterrole.rbac.authorization.k8s.io "calico" created
clusterrole.rbac.authorization.k8s.io "flannel" created
clusterrolebinding.rbac.authorization.k8s.io "canal-flannel" created
clusterrolebinding.rbac.authorization.k8s.io "canal-calico" created
# kubectl apply -f https://docs.projectcalico.org/v3.0/getting-started/kubernetes/installation/hosted/canal/canal.yaml
configmap "canal-config" created
daemonset.extensions "canal" created
customresourcedefinition.apiextensions.k8s.io "felixconfigurations.crd.projectcalico.org" created
customresourcedefinition.apiextensions.k8s.io "bgpconfigurations.crd.projectcalico.org" created
customresourcedefinition.apiextensions.k8s.io "ippools.crd.projectcalico.org" created
customresourcedefinition.apiextensions.k8s.io "clusterinformations.crd.projectcalico.org" created
customresourcedefinition.apiextensions.k8s.io "globalnetworkpolicies.crd.projectcalico.org" created
customresourcedefinition.apiextensions.k8s.io "networkpolicies.crd.projectcalico.org" created
serviceaccount "canal" created
```

查看 canal 的安装状态。

```bash
# kubectl get pod -n kube-system -o wide
NAME                                    READY     STATUS    RESTARTS   AGE       IP              NODE
canal-fc94k                             3/3       Running   10         4m        192.168.0.201   ubuntu-1
canal-rs2wp                             3/3       Running   10         4m        192.168.0.200   ubuntu-master
canal-tqd4l                             3/3       Running   10         4m        192.168.0.202   ubuntu-2
canal-vmpnr                             3/3       Running   10         4m        192.168.0.203   ubuntu-3
etcd-ubuntu-master                      1/1       Running   0          28m       192.168.0.200   ubuntu-master
kube-apiserver-ubuntu-master            1/1       Running   0          28m       192.168.0.200   ubuntu-master
kube-controller-manager-ubuntu-master   1/1       Running   0          29m       192.168.0.200   ubuntu-master
kube-dns-86f4d74b45-wkfk2               3/3       Running   0          28m       10.244.2.2      ubuntu-3
kube-proxy-6ddb4                        1/1       Running   0          28m       192.168.0.200   ubuntu-master
kube-proxy-7ngb9                        1/1       Running   0          24m       192.168.0.202   ubuntu-2
kube-proxy-fkhhx                        1/1       Running   0          24m       192.168.0.201   ubuntu-1
kube-proxy-rh4lq                        1/1       Running   0          24m       192.168.0.203   ubuntu-3
kube-scheduler-ubuntu-master            1/1       Running   0          28m       192.168.0.200   ubuntu-master
```

可以看到 canal 和 kube-dns 都已经运行正常，一个基本功能正常的测试环境就部署完毕了。

此时查看集群的节点状态，版本为最新的版本 v1.10.1。

```bash
# kubectl get node
NAME            STATUS    ROLES     AGE       VERSION
ubuntu-1        Ready     <none>    27m       v1.10.1
ubuntu-2        Ready     <none>    27m       v1.10.1
ubuntu-3        Ready     <none>    27m       v1.10.1
ubuntu-master   Ready     master    31m       v1.10.1
```

让 master 也运行 pod（默认 master 不运行 pod）, 这样在测试环境做是可以的，不建议在生产环境如此操作。

```bash
#kubectl taint nodes --all node-role.kubernetes.io/master-
node "ubuntu-master" untainted
taint "node-role.kubernetes.io/master:" not found
taint "node-role.kubernetes.io/master:" not found
taint "node-role.kubernetes.io/master:" not found
```

## 参考

- [Overview of kubeadm - kubernetest.io](https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm/)
