# kubeadm工作原理

## 初始化系统

所有机器都需要初始化docker和kubelet。这是因为kubeadm依赖kubelet来启动Master组件，比如kube-apiserver、kube-manager-controller、kube-scheduler、kube-proxy等。

## 安装master

在初始化master时，只需要执行kubeadm init命令即可，比如

```sh
kubeadm init kubeadm init --pod-network-cidr 10.244.0.0/16 --kubernetes-version latest
```

这个命令会自动

- 系统状态检查
- 生成token
- 生成自签名CA和可独断证书
- 生成kubeconfig用于kubelet连接API server
- 为Master组件生成Static Pod manifests，并放到`/etc/kubernetes/manifests`目录中
- 配置RBAC并设置Master node只运行控制平面组件
- 创建附加服务，比如kube-proxy和kube-dns


## 配置Network plugin

kubeadm在初始化时并不关心网络插件，默认情况下，kubelet配置使用CNI插件，这样就需要用户来额外初始化网络插件。

### CNI bridge

```sh
mkdir -p /etc/cni/net.d
cat >/etc/cni/net.d/10-mynet.conf <<-EOF
{
    "cniVersion": "0.3.0",
    "name": "mynet",
    "type": "bridge",
    "bridge": "cni0",
    "isGateway": true,
    "ipMasq": true,
    "ipam": {
        "type": "host-local",
        "subnet": "10.244.0.0/16",
        "routes": [
            { "dst": "0.0.0.0/0"  }
        ]
    }
}
EOF
cat >/etc/cni/net.d/99-loopback.conf <<-EOF
{
    "cniVersion": "0.3.0",
    "type": "loopback"
}
EOF
```

### flannel

```sh
kubectl create -f https://github.com/coreos/flannel/raw/master/Documentation/kube-flannel-rbac.yml
kubectl create -f https://github.com/coreos/flannel/raw/master/Documentation/kube-flannel.yml
```

### weave

```sh
kubectl apply -f https://git.io/weave-kube-1.6
```

### calico

```sh
kubectl apply -f http://docs.projectcalico.org/v2.1/getting-started/kubernetes/installation/hosted/kubeadm/1.6/calico.yaml
```

## 添加Node

```sh
token=$(kubeadm token list | grep authentication,signing | awk '{print $1}')
kubeadm join --token $token ${master_ip}
```

这包括以下几个步骤

- 从API server下载CA
- 创建本地证书，并请求API Server签名
- 最后配置kubelet连接到API Server

## 删除安装

```
kubeadm reset
```

## 参考文档

- [kubeadm Setup Tool](https://kubernetes.io/docs/admin/kubeadm/)

