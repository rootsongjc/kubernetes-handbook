# Cluster deploying of frakti On Ubuntu

This document shows how to easily install a kubernetes cluster with frakti runtime.

Frakti is a hypervisor-based container runtime, it depends on a few packages besides kubernetes:

- hyperd: the hyper container engine (main container runtime)
- docker: the docker container engine (auxiliary container runtime)
- cni: the network plugin

## Optional: create instances on GCE

It is recommended to run frakti-enabled kubernetes on baremetal, but you could still have a try of frakti on public clouds.

**Do not forget to enable ip_forward on GCE.**

## Initialize all nodes

### Install hyperd

```sh
# install from https://docs.hypercontainer.io/get_started/install/linux.html
apt-get update && apt-get install -y qemu libvirt-bin
curl -sSL https://hypercontainer.io/install | bash

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

```sh
apt-get update
apt-get install -y docker.io

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

Frakti requires cni network for starting.

Note:

- Configure different subnet for different hosts, e.g.
  - 10.244.1.0/24
  - 10.244.2.0/24
  - 10.244.3.0/24
- Configure host routes on GCE
  - gcloud compute routes create "instance-1" --description "instance-1" --destination-range "10.244.1.0/24" --network "default" --next-hop-instance "instance-1" --next-hop-instance-zone "asia-east1-a" --priority "100"
  - gcloud compute routes create "instance-2" --description "instance-2" --destination-range "10.244.2.0/24" --network "default" --next-hop-instance "instance-2" --next-hop-instance-zone "asia-east1-a" --priority "100"
  - gcloud compute routes create "instance-3" --description "instance-3" --destination-range "10.244.3.0/24" --network "default" --next-hop-instance "instance-3" --next-hop-instance-zone "asia-east1-a" --priority "100"

```sh
apt-get update && apt-get install -y apt-transport-https
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
cat <<EOF > /etc/apt/sources.list.d/kubernetes.list
deb http://apt.kubernetes.io/ kubernetes-xenial-unstable main
EOF
apt-get update
apt-get install -y kubernetes-cni
```

Configure cni network

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
        "subnet": "10.244.1.0/24",
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

### start frakti

```sh
systemctl enable frakti
systemctl start frakti
```

### Install kubelet

```sh
apt-get install -y kubelet kubeadm kubectl
```

Configure kubelet with frakti runtime:

```sh
sed -i '2 i\Environment="KUBELET_EXTRA_ARGS=--container-runtime=remote --container-runtime-endpoint=/var/run/frakti.sock --feature-gates=AllAlpha=true"' /etc/systemd/system/kubelet.service.d/10-kubeadm.conf
```

## Setting up the master node

hyperkube image could be customized via `KUBE_HYPERKUBE_IMAGE`:

- `VERSION=v1.6.0 make -C cluster/images/hyperkube build`
- `export KUBE_HYPERKUBE_IMAGE=xxxx`

```sh
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
