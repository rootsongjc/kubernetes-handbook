---
layout: "post"
---

# Kubernetes网络插件

Kubernetes有着丰富的网络插件，方便用户自定义所需的网络。

## 官方插件

* kubenet：这是一个基于CNI bridge的网络插件，也是目前推荐的默认插件
* CNI：CNI网络插件，需要用户将网络配置放到`/etc/cni/net.d`目录中，并将CNI插件的二进制文件放入`/opt/cni/bin`
* exec：通过第三方的可执行文件来为容器配置网络，将在v1.6中移除，见[PR](https://github.com/kubernetes/kubernetes/pull/39254)_

## CNI plugin

安装CNI：

```
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=http://yum.kubernetes.io/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg
       https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
EOF

yum install -y kubernetes-cni
```

配置CNI brige插件：

```
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

## calico

```sh
# kubectl apply -f http://docs.projectcalico.org/v2.0/getting-started/kubernetes/installation/hosted/kubeadm/calico.yaml
kubectl apply -f https://gist.githubusercontent.com/feiskyer/0f952c7dadbfcefd2ce81ba7ea24a8ca/raw/92addea398bbc4d4a1dcff8a98c1ac334c8acb26/calico.yaml
```

## flannel

```sh
kubectl apply -f https://gist.githubusercontent.com/feiskyer/1e7a95f27c391a35af47881eb20131d7/raw/4266f05355590fa185bc8e50c0f50d2841993d20/flannel.yaml
```

## weave

```sh
kubectl apply -f https://gist.githubusercontent.com/feiskyer/0b00688584cc7ed9bd9a993adddae5e3/raw/67f3558e32d5c76be38e36ef713cc46deb2a74ca/weave.yaml
```

## 第三方插件

- [Calico](http://docs.projectcalico.org/v2.0/getting-started/kubernetes/installation/hosted/)是一个基于BGP的三层网络插件，并且也支持Network Policy来实现网络的访问控制。它在每台机器上运行一个vRouter，利用Linux内核来转发网络数据包，并借助iptables实现防火墙等功能。
- [Flannel](https://github.com/coreos/flannel/blob/master/Documentation/kube-flannel.yml)是一个为Kubernetes提供overlay network的网络插件，它基于Linux TUN/TAP，使用UDP封装IP包来创建overlay网络，并借助etcd维护网络的分配情况。
- [Contiv](http://contiv.github.io)是一个基于openvswitch的多租户网络插件，支持VLAN和VXLAN，并基于openflow实现访问控制和QoS的功能。
- [Canal](https://github.com/tigera/canal/tree/master/k8s-install/kubeadm)则是Flannel和Calico联合发布的一个统一网络插件，提供CNI网络插件，并且也支持network policy。
- [Weave Net](https://www.weave.works/docs/net/latest/kube-addon/) provides networking and network policy, will carry on working on both sides of a network partition, and does not require an external database.
- [Romana](http://romana.io/) is a Layer 3 networking solution for pod networks that also supports the NetworkPolicy API.
- [cilium](https://github.com/cilium/cilium): BPF & XDP for containers.
- [ovn-kubernetes](https://github.com/openvswitch/ovn-kubernetes)
- [kuryr-kubernetes](https://github.com/openstack/kuryr-kubernetes)

## 其他辅助工具

- [Weave Scope](https://www.weave.works/documentation/scope-latest-installing/#k8s)是一个监控和可视化Pod/Service的工具。

