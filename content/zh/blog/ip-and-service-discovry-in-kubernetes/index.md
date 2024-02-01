---
date: "2017-04-24T16:11:16+08:00"
title: "Kubernetes 中的 IP 和服务发现体系"
draft: false
description: "几种 IP 的来历。"
categories: ["Kubernetes"]
type: "post"
tags: ["Kubernetes"]
aliases: "/posts/ip-and-service-discovry-in-kubernetes"
image: "images/banner/kubernetes-9.jpg"
draft: false
---

## Cluster IP

即 Service 的 IP，通常在集群内部使用 Service Name 来访问服务，用户不需要知道该 IP 地址，kubedns 会自动根据 service name 解析到服务的 IP 地址，将流量分发给 Pod。

**Service Name 才是对外暴露服务的关键。**

在 kubeapi 的配置中指定该地址范围。

**默认配置**

```ini
--service-cluster-ip-range=10.254.0.0/16
--service-node-port-range=30000-32767
```

## Pod IP

通过配置 flannel 的`network`和`subnet`来实现。

**默认配置**

```ini
FLANNEL_NETWORK=172.30.0.0/16
FLANNEL_SUBNET=172.30.46.1/24
```

Pod 的 IP 地址<u>不固定</u>，当 pod 重启时 IP 地址会变化。

**该 IP 地址也是用户无需关心的。**

但是 Flannel 会在本地生成相应 IP 段的虚拟网卡，为了防止和集群中的其他 IP 地址冲突，需要规划 IP 段。

## 主机/Node IP

物理机的 IP 地址，即 kubernetes 管理的物理机的 IP 地址。

```bash
$ kubectl get nodes
NAME           STATUS    AGE       VERSION
172.20.0.113   Ready     12d       v1.6.0
172.20.0.114   Ready     12d       v1.6.0
172.20.0.115   Ready     12d       v1.6.0
```

## 服务发现

**集群内部的服务发现**

通过 DNS 即可发现，kubends 是 kubernetes 的一个插件，不同服务之间可以直接使用 service name 访问。

通过`sericename:port`即可调用服务。

**服务外部的服务发现**

通过 Ingress 来实现，我们是用的**Traefik**来实现。

## 参考

- [Ingress 解析](https://jimmysong.io/posts/kubernetes-ingress-resource/)
- [Kubernetes Traefik Ingress 安装试用](https://jimmysong.io/posts/traefik-ingress-installation/)

