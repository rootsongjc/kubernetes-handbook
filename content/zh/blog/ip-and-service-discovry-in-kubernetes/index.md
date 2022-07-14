---
date: "2017-04-24T16:11:16+08:00"
title: "Kubernetes中的IP和服务发现体系"
draft: false
description: "几种 IP 的来历。"
categories: ["Kubernetes"]
type: "post"
tags: ["Kubernetes"]
aliases: "/posts/ip-and-service-discovry-in-kubernetes"
image: "images/banner/kubernetes.jpg"
draft: false
---

## Cluster IP

即Service的IP，通常在集群内部使用Service Name来访问服务，用户不需要知道该IP地址，kubedns会自动根据service name解析到服务的IP地址，将流量分发给Pod。

**Service Name才是对外暴露服务的关键。**

在kubeapi的配置中指定该地址范围。

**默认配置**

```ini
--service-cluster-ip-range=10.254.0.0/16
--service-node-port-range=30000-32767
```

## Pod IP

通过配置flannel的`network`和`subnet`来实现。

**默认配置**

```ini
FLANNEL_NETWORK=172.30.0.0/16
FLANNEL_SUBNET=172.30.46.1/24
```

Pod的IP地址<u>不固定</u>，当pod重启时IP地址会变化。

**该IP地址也是用户无需关心的。**

但是Flannel会在本地生成相应IP段的虚拟网卡，为了防止和集群中的其他IP地址冲突，需要规划IP段。

## 主机/Node IP

物理机的IP地址，即kubernetes管理的物理机的IP地址。

```bash
$ kubectl get nodes
NAME           STATUS    AGE       VERSION
172.20.0.113   Ready     12d       v1.6.0
172.20.0.114   Ready     12d       v1.6.0
172.20.0.115   Ready     12d       v1.6.0
```

## 服务发现

**集群内部的服务发现**

通过DNS即可发现，kubends是kubernetes的一个插件，不同服务之间可以直接使用service name访问。

通过`sericename:port`即可调用服务。

**服务外部的服务发现**

通过Ingress来实现，我们是用的**Traefik**来实现。

## 参考

- [Ingress解析](https://jimmysong.io/posts/kubernetes-ingress-resource/)
- [Kubernetes Traefik Ingress安装试用](https://jimmysong.io/posts/traefik-ingress-installation/)

