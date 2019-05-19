---
title: "Cloud Native Sandbox"
subtitle: "A standalone Kubernetes and Istio environment with Docker on you own laptop"
date: 2019-01-18T19:06:14+08:00
bigimg: [{src: "/img/banners/006tNc79ly1fzay4e75ftj31cq0kwhdu.jpg", desc: "Photo via unsplash"}]
draft: false
notoc: true
aliases: "/posts/cloud-native-sandbox/"
description: "Cloud Native Sandbox can help you setup a standalone Kubernetes environment with Docker on you own laptop."
tags: ["cloud native","kubernetes","istio","docker"]
categories: ["cloud native"]
translationKey: "cloud-native-sandbox"
---

Github: https://github.com/rootsongjc/cloud-native-sandbox

Cloud Native Sandbox can help you setup a standalone Kubernetes and istio environment with Docker on you own laptop.

The sandbox integrated with the following components:

- Kubernetes v1.10.3
- Istio v1.0.4
- Kubernetes dashboard v1.8.3

## Differences with kubernetes-vagrant-centos-cluster

As I have created the [kubernetes-vagrant-centos-cluster](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster) to set up a Kubernetes cluster and istio service mesh with `vagrantfile` which consists of 1 master(also as node) and 3 nodes, but there is a big problem that it is so high weight and consume resources. So I made this light weight sandbox.

**Features**

- No VirtualBox or Vagrantfile  required
- Light weight
- High speed, low drag
- Easy to operate

**Services**

As the sandbox setup, you will get the following services.

<p align="center">
    <img src="/img/cloud-native-sandbox.svg" alt="Cloud Native Sandbox">
</p>


Record with [termtosvg](https://github.com/nbedos/termtosvg).

## Prerequisite

You only need a laptop with Docker Desktop installed and [Kubernetes enabled](https://docs.docker.com/docker-for-mac/#kubernetes).

Note: Leave enough resources for Docker Desktop. At least 2 CPU, 4G memory.

## Install

To start the sandbox, you have to run the following steps. 

### Kubernetes dashboard(Optional)

Install Kubernetes dashboard.

```bash
kubectl apply -f install/dashbaord/
```

Get the dashboard token.

```bash
kubectl -n kube-system describe secret default| awk '$1=="token:"{print $2}'
```

Expose `kubernetes-dashboard` service.

```bash
kubectl -n kube-system get pod -l k8s-app=kubernetes-dashboard -o jsonpath='{.items[0].metadata.name}'
```

Login to Kubernetes dashboard on <http://localhost:8001/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/#!/login> with the above token.

### Istio(Required)

Install istio service mesh with the default add-ons.

```bash
# Install istio
kubectl apply -f install/istio/
```

To expose service `grafana` on <http://localhost:3000>.

```bash
kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=grafana -o jsonpath='{.items[0].metadata.name}') 3000:3000 &
```

To expose service `prometheus` on <http://localhost:9090>.

```bash
kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=prometheus -o jsonpath='{.items[0].metadata.name}') 9090:9090 &
```

To expose service `jaeger` on <http://localhost:16686>.

```bash
kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=jaeger -o jsonpath='{.items[0].metadata.name}') 16686:16686 &
```

To expose service `servicegraph` on <http://localhost:8088/dotviz>, <http://localhost:8088/force/forcegraph.html>.

```bash
kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=servicegraph -o jsonpath='{.items[0].metadata.name}') 8088:8088 &
```

### Kiali

Install [kiali](https://www.kiali.io/).

```bash
kubectl -n istio-system apply -f install/kiali
```

To expose service `kiali` on <http://localhost:20001>.

```bash
kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=kiali -o jsonpath='{.items[0].metadata.name}') 20001:20001 &
```

## Bookinfo sample

Deploy [bookinfo sample](https://istio.io/docs/examples/bookinfo/).

```bash
# Enable sidecar auto injection
kubectl label namespace default istio-injection=enabled
# Deploy bookinfo sample
kubectl -n default apply -f sample/bookinfo
```

Visit `productpage` on <http://localhost/productpage>.

Let's generate some loads.

```bash
for ((i=0;i<1000;i=i+1));do echo "Step->$i";curl http://localhost/productpage;done
```

You can watch the service status through <http://localhost:3000>.

## Client tools

To operate the applications on Kubernetes, you should install the following tools.

**Required**

- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) - Deploy and manage applications on Kubernetes.
- [istioctl](https://istio.io/docs/reference/commands/istioctl/) - Istio configuration command line utility.

**Optional**

- [kubectx](https://github.com/ahmetb/kubectx)  - Switch faster between clusters and namespaces in kubectl
- [kube-ps1](https://github.com/jonmosco/kube-ps1) - Kubernetes prompt info for bash and zsh
