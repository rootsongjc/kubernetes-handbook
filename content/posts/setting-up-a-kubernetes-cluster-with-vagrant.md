---
title: "Setting Up a Kubernetes Cluster With Vagrant and Virtualbox"
subtitle: "With one master and 3 node, Dashboard, CoreDNS and Heapster monitoring"
date: 2018-02-04T09:55:58+08:00
description: "Setting Up a Kubernetes Cluster With Vagrant and Virtualbox with one master and 3 node, Dashboard, CoreDNS and Heapster monitoring"
tags: ["kubernetes","vagrant"]
categories: "kubernetes"
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/2018020402.jpg", desc: ""}]
draft: false
---

# Setting up a kubernetes cluster with Vagrant and Virtualbox

Using vagrant file to build a kubernetes cluster which consists of 1 master(also as node) and 3 nodes. You don't have to create complicated ca files or configuration.

See in Github: [kubernetes-vagrant-centos-cluster](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster)

### Why don't do that with kubeadm

Because I want to setup the etcd, apiserver, controller, scheduler without docker container.

### Architecture

We will create a Kubernetes 1.9.1+ cluster with 3 nodes which contains the components below:

| IP           | Hostname | Componets                                |
| ------------ | -------- | ---------------------------------------- |
| 172.17.8.101 | node1    | kube-apiserver, kube-controller-manager, kube-scheduler, etcd, kubelet, docker, flannel, dashboard |
| 172.17.8.102 | node2    | kubelet, docker, flannel、traefik         |
| 172.17.8.103 | node3    | kubelet, docker, flannel                 |

The default setting will create the private network from 172.17.8.101 to 172.17.8.103 for nodes, and it will use the host's DHCP for the public ip.

The kubernetes service's vip range is `10.254.0.0/16`.

The container network range is `170.33.0.0/16` owned by flanneld with `host-gw` backend.

`kube-proxy` will use `ipvs` mode.

### Usage

#### Prerequisite

- Host server with 8G+ mem(More is better), 60G disk, 8 core cpu at lease
- vagrant 2.0+
- virtualbox 5.0+
- Maybe need to access the internet through GFW to download the kubernetes files

### Support Addon

**Required**

- CoreDNS
- Dashboard
- Traefik

**Optional**

- Heapster + InfluxDB + Grafana
- ElasticSearch + Fluentd + Kibana

#### Setup

```bash
git clone https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster.git
cd kubernetes-vagrant-centos-cluster
vagrant up
```

Wait about 10 minutes the kubernetes cluster will be setup automatically.

#### Connect to kubernetes cluster

There are 3 ways to access the kubernetes cluster.

**local**

Copy `conf/admin.kubeconfig` to `~/.kube/config`, using `kubectl` CLI to access the cluster.

We recommend this way.

**VM**

Login to the virtual machine to access and debug the cluster.

```bash
vagrant ssh node1
sudo -i
kubectl get nodes
```

**Kubernetes dashbaord**

Kubernetes dashboard URL: <https://172.17.8.101:8443>

Get the token:

```bash
kubectl -n kube-system describe secret `kubectl -n kube-system get secret|grep admin-token|cut -d " " -f1`|grep "token:"|tr -s " "|cut -d " " -f2
```

**Note**: You can see the token message from `vagrant up` logs.

**Heapster monitoring**

Run this command on you local machine.

```bash
kubectl apply -f addon/heapster/
```

Append the following item to you local `/etc/hosts` file.

```ini
172.17.8.102 grafana.jimmysong.io
```

Open the URL in your browser: <http://grafana.jimmysong.io>

**Treafik ingress**

Run this command on you local machine.

```bash
kubectl apply -f addon/traefik-ingress
```

Append the following item to you local `/etc/hosts` file.

```ini
172.17.8.102 traefik.jimmysong.io
```

Traefik UI URL: <http://traefik.jimmysong.io>

**EFK**

Run this command on your local machine.

```bash
kubectl apply -f addon/heapster/
```

**Note**: Powerful CPU and memory allocation required. At least 4G per virtual machine.

#### Clean

```bash
vagrant destroy
rm -rf .vagrant
```

#### Note

Don't use it in production environment.

#### Reference

- [Kubernetes Handbook - jimmysong.io](https://jimmysong.io/kubernetes-handbook/)
- [duffqiu/centos-vagrant](https://github.com/duffqiu/centos-vagrant)
- [kubernetes ipvs](https://github.com/kubernetes/kubernetes/tree/master/pkg/proxy/ipvs)