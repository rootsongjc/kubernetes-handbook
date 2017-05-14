---
title: "Cluster deploying of frakti"
layout: "post"
---

# Cluster deploying of frakti

- [Cluster deploying of frakti](#cluster-deploying-of-frakti)
  - [Overview](#overview)
  - [Install packages](#install-packages)
    - [Install hyperd](#install-hyperd)
    - [Install docker](#install-docker)
    - [Install frakti](#install-frakti)
    - [Install CNI](#install-cni)
    - [Install kubelet](#install-kubelet)
  - [Setting up the master node](#setting-up-the-worker-nodes)
  - [Setting up the worker nodes](#setting-up-the-worker-nodes)

## Overview

This document shows how to easily install a kubernetes cluster with frakti runtime.

Frakti is a hypervisor-based container runtime, it depends on a few packages besides kubernetes:

- hyperd: the hyper container engine (main container runtime)
- docker: the docker container engine (auxiliary container runtime)
- cni: the network plugin

## Install packages

### Install hyperd

On Ubuntu 16.04+:

```sh
apt-get update && apt-get install -y qemu libvirt-bin
curl -sSL https://hypercontainer.io/install | bash
```

On CentOS 7:

```sh
curl -sSL https://hypercontainer.io/install | bash
```

Configure hyperd:

```sh
echo -e "Hypervisor=libvirt\n\
Kernel=/var/lib/hyper/kernel\n\
Initrd=/var/lib/hyper/hyper-initrd.img\n\
Hypervisor=qemu\n\
StorageDriver=overlay\n\
gRPCHost=127.0.0.1:22318" > /etc/hyper/config
systemctl enable hyperd
systemctl restart hyperd
```

### Install docker

On Ubuntu 16.04+:

```sh
apt-get update
apt-get install -y docker.io
```

On CentOS 7:

```sh
yum install -y docker
sed -i 's/native.cgroupdriver=systemd/native.cgroupdriver=cgroupfs/g' /usr/lib/systemd/system/docker.service
systemctl daemon-reload
```

Configure and start docker:

```sh
systemctl enable docker
systemctl start docker
```

### Install frakti

```sh
curl -sSL https://github.com/kubernetes/frakti/releases/download/v0.1/frakti -o /usr/bin/frakti
chmod +x /usr/bin/frakti
cat <<EOF > /lib/systemd/system/frakti.service
[Unit]
Description=Hypervisor-based container runtime for Kubernetes
Documentation=https://github.com/kubernetes/frakti
After=network.target

[Service]
ExecStart=/usr/bin/frakti --v=3 \
          --log-dir=/var/log/frakti \
          --logtostderr=false \
          --listen=/var/run/frakti.sock \
          --streaming-server-addr=%H \
          --hyper-endpoint=127.0.0.1:22318
MountFlags=shared
TasksMax=8192
LimitNOFILE=1048576
LimitNPROC=1048576
LimitCORE=infinity
TimeoutStartSec=0
Restart=on-abnormal

[Install]
WantedBy=multi-user.target
EOF
```

### Install CNI

On Ubuntu 16.04+:

```sh
apt-get update && apt-get install -y apt-transport-https
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
cat <<EOF > /etc/apt/sources.list.d/kubernetes.list
deb http://apt.kubernetes.io/ kubernetes-xenial-unstable main
EOF
apt-get update
apt-get install -y kubernetes-cni
```

On CentOS 7:

```sh
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=http://yum.kubernetes.io/repos/kubernetes-el7-x86_64-unstable
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg
       https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
EOF
setenforce 0
yum install -y kubernetes-cni
```

Configure CNI networks:

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

### Start frakti

```sh
systemctl enable frakti
systemctl start frakti
```

### Install kubelet

On Ubuntu 16.04+:

```sh
apt-get install -y kubelet kubeadm kubectl
```

On CentOS 7:

```sh
yum install -y kubelet kubeadm kubectl
```

> Note that there are no kubernete v1.6 rpms on `yum.kubernetes.io`, so it needs to be fetched from `dl.k8s.io`:

```sh
# Download latest release of kubelet and kubectl
# TODO: remove this after the stable v1.6 release
curl -SL https://dl.k8s.io/v1.6.0-beta.4/kubernetes-server-linux-amd64.tar.gz -o kubernetes-server-linux-amd64.tar.gz
tar zxvf kubernetes-server-linux-amd64.tar.gz
/bin/cp -f kubernetes/server/bin/{kubelet,kubeadm,kubectl} /usr/bin/
rm -rf kubernetes-server-linux-amd64.tar.gz
```

Configure kubelet with frakti runtime:

```sh
sed -i '2 i\Environment="KUBELET_EXTRA_ARGS=--container-runtime=remote --container-runtime-endpoint=/var/run/frakti.sock --feature-gates=AllAlpha=true"' /etc/systemd/system/kubelet.service.d/10-kubeadm.conf
```

## Setting up the master node

```sh
# export KUBE_HYPERKUBE_IMAGE=
kubeadm init kubeadm init --pod-network-cidr 10.244.0.0/16 --kubernetes-version latest
```


Optional: enable schedule pods on the master

```sh
export KUBECONFIG=/etc/kubernetes/admin.conf
kubectl taint nodes --all node-role.kubernetes.io/master:NoSchedule-
```

## Setting up the worker nodes

```sh
# get token on master node
token=$(kubeadm token list | grep authentication,signing | awk '{print $1}')

# join master on worker nodes
kubeadm join --token $token ${master_ip}
```

