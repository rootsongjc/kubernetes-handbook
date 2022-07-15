---
title: "从外部访问 Kubernetes 中的 Pod"
date: 2017-11-21T20:13:01+08:00
description: "关于在 Kubenretes 中暴露 Pod 及服务的五种方式。"
draft: false
categories: ["Kubernetes"]
tags: ["Kubernetes"]
type: "post"
image: "images/banner/kubernetes.jpg"
aliases: "/posts/accessing-kubernetes-pods-from-outside-of-the-cluster"
---

本文主要讲解访问 kubenretes 中的 Pod 和 Serivce 的几种方式，包括如下几种：

- hostNetwork
- hostPort
- NodePort
- LoadBalancer
- Ingress

说是暴露 Pod 其实跟暴露 Service 是一回事，因为 Pod 就是 Service 的 backend。

## hostNetwork: true

这是一种直接定义 Pod 网络的方式。

如果在 Pod 中使用 `hostNetwork:true` 配置的话，在这种 pod 中运行的应用程序可以直接看到 pod 启动的主机的网络接口。在主机的所有网络接口上都可以访问到该应用程序。以下是使用主机网络的 pod 的示例定义：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: influxdb
spec:
  hostNetwork: true
  containers:
    - name: influxdb
      image: influxdb
```

部署该 Pod：

```bash
$ kubectl create -f influxdb-hostnetwork.yml
```

访问该 pod 所在主机的 8086 端口：

```bash
curl -v http://$POD_IP:8086/ping
```

将看到 204 No Content 的 204 返回码，说明可以正常访问。

注意每次启动这个 Pod 的时候都可能被调度到不同的节点上，所有外部访问 Pod 的 IP 也是变化的，而且调度 Pod 的时候还需要考虑是否与宿主机上的端口冲突，因此一般情况下除非您知道需要某个特定应用占用特定宿主机上的特定端口时才使用 `hostNetwork: true` 的方式。

这种 Pod 的网络模式有一个用处就是可以将网络插件包装在 Pod 中然后部署在每个宿主机上，这样该 Pod 就可以控制该宿主机上的所有网络。

## hostPort

这是一种直接定义 Pod 网络的方式。

`hostPort` 是直接将容器的端口与所调度的节点上的端口路由，这样用户就可以通过宿主机的 IP 加上来访问 Pod 了，如:。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: influxdb
spec:
  containers:
    - name: influxdb
      image: influxdb
      ports:
        - containerPort: 8086
          hostPort: 8086
```

这样做有个缺点，因为 Pod 重新调度的时候该 Pod 被调度到的宿主机可能会变动，这样就变化了，用户必须自己维护一个 Pod 与所在宿主机的对应关系。

这种网络方式可以用来做 nginx [Ingress controller](https://github.com/kubernetes/ingress/tree/master/controllers/nginx) 。外部流量都需要通过 kubenretes node 节点的 80 和 443 端口。

## NodePort

NodePort 在 kubenretes 里是一个广泛应用的服务暴露方式。Kubernetes 中的 service 默认情况下都是使用的 `ClusterIP` 这种类型，这样的 service 会产生一个 ClusterIP，这个 IP 只能在集群内部访问，要想让外部能够直接访问 service，需要将 service type 修改为 `nodePort`。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: influxdb
  labels:
    name: influxdb
spec:
  containers:
    - name: influxdb
      image: influxdb
      ports:
        - containerPort: 8086
```

同时还可以给 service 指定一个 `nodePort` 值，范围是 30000-32767，这个值在 API server 的配置文件中，用 `--service-node-port-range` 定义。

```yaml
kind: Service
apiVersion: v1
metadata:
  name: influxdb
spec:
  type: NodePort
  ports:
    - port: 8086
      nodePort: 30000
  selector:
    name: influxdb
```

集群外就可以使用 kubernetes 任意一个节点的 IP 加上 30000 端口访问该服务了。kube-proxy 会自动将流量以 round-robin 的方式转发给该 service 的每一个 pod。

这种服务暴露方式，无法让你指定自己想要的应用常用端口，不过可以在集群上再部署一个反向代理作为流量入口。

## LoadBalancer

`LoadBalancer` 只能在 service 上定义。这是公有云提供的负载均衡器，如 AWS、Azure、CloudStack、GCE 等。

```yaml
kind: Service
apiVersion: v1
metadata:
  name: influxdb
spec:
  type: LoadBalancer
  ports:
    - port: 8086
  selector:
    name: influxdb
```

查看服务：

```bash
$ kubectl get svc influxdb
NAME       CLUSTER-IP     EXTERNAL-IP     PORT(S)          AGE
influxdb   10.97.121.42   10.13.242.236   8086:30051/TCP   39s
```

内部可以使用 ClusterIP 加端口来访问服务，如 19.97.121.42:8086。

外部可以用以下两种方式访问该服务：

- 使用任一节点的 IP 加 30051 端口访问该服务
- 使用 `EXTERNAL-IP` 来访问，这是一个 VIP，是云供应商提供的负载均衡器 IP，如 10.13.242.236:8086。

## Ingress

`Ingress` 是自 kubernetes1.1 版本后引入的资源类型。必须要部署 [Ingress controller](https://github.com/kubernetes/ingress/tree/master/controllers/nginx) 才能创建 Ingress 资源，Ingress controller 是以一种插件的形式提供。Ingress controller 是部署在 Kubernetes 之上的 Docker 容器。它的 Docker 镜像包含一个像 nginx 或 HAProxy 的负载均衡器和一个控制器守护进程。控制器守护程序从 Kubernetes 接收所需的 Ingress 配置。它会生成一个 nginx 或 HAProxy 配置文件，并重新启动负载平衡器进程以使更改生效。换句话说，Ingress controller 是由 Kubernetes 管理的负载均衡器。

Kubernetes Ingress 提供了负载平衡器的典型特性：HTTP 路由，粘性会话，SSL 终止，SSL 直通，TCP 和 UDP 负载平衡等。目前并不是所有的 Ingress controller 都实现了这些功能，需要查看具体的 Ingress controller 文档。

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: influxdb
spec:
  rules:
    - host: influxdb.kube.example.com
      http:
        paths:
          - backend:
              serviceName: influxdb
              servicePort: 8086
```

外部访问 URL `http://influxdb.kube.example.com/ping` 访问该服务，入口就是 80 端口，然后 Ingress controller 直接将流量转发给后端 Pod，不需再经过 kube-proxy 的转发，比 LoadBalancer 方式更高效。

## 总结

总的来说 Ingress 是一个非常灵活和越来越得到厂商支持的服务暴露方式，包括 Nginx、HAProxy、Traefik，还有各种 Service Mesh，而其它服务暴露方式可以更适用于服务调试、特殊应用的部署。
