---
date: "2017-04-12T15:53:39+08:00"
title: "在开启TLS的Kubernetes1.6集群上安装dashboard"
draft: false
categories: "kubernetes"
tags: ["kubernetes","dashboard"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/2016082001.jpg", desc: "东直门桥 Aug 20,2016"}]
---

## 前言

这是[和我一步步部署kubernetes集群](https://github.com/rootsongjc/follow-me-install-kubernetes-cluster)项目(fork自[opsnull](https://github.com/opsnull/follow-me-install-kubernetes-cluster))中的一篇文章，下文是结合我[之前部署kubernetes的过程](https://jimmysong.io/tags/kubernetes/)产生的kuberentes环境，在开启了TLS验证的集群中部署dashboard。

感谢[opsnull](github.com/opsnull)和[ipchy](github.com/ipchy)的细心解答。

**安装环境配置信息**

- CentOS 7.2.1511
- Docker 1.12.5
- Flannel 0.7
- Kubernetes 1.6.0

## 配置和安装 dashboard

官方文件目录：

```ini
kubernetes/cluster/addons/dashboard
```

我们使用的文件

```bash
$ ls *.yaml
dashboard-controller.yaml  dashboard-service.yaml dashboard-rbac.yaml
```

已经修改好的 yaml 文件见：[dashboard](./manifests/dashboard)

由于 `kube-apiserver` 启用了 `RBAC` 授权，而官方源码目录的 `dashboard-controller.yaml` 没有定义授权的 ServiceAccount，所以后续访问 `kube-apiserver` 的 API 时会被拒绝，web中提示：

```bash
Forbidden (403)

User "system:serviceaccount:kube-system:default" cannot list jobs.batch in the namespace "default". (get jobs.batch)
```

增加了一个`dashboard-rbac.yaml`文件，定义一个名为 dashboard 的 ServiceAccount，然后将它和 Cluster Role view 绑定。

## 配置dashboard-service

```bash
$ diff dashboard-service.yaml.orig dashboard-service.yaml
10a11
>   type: NodePort
```

- 指定端口类型为 NodePort，这样外界可以通过地址 nodeIP:nodePort 访问 dashboard；

## 配置dashboard-controller

```bash
$ diff dashboard-controller.yaml.orig dashboard-controller.yaml
23c23
<         image: gcr.io/google_containers/kubernetes-dashboard-amd64:v1.6.0
---
>         image: sz-pg-oam-docker-hub-001.tendcloud.com/library/kubernetes-dashboard-amd64:v1.6.0
```

## 执行所有定义文件

```bash
$ pwd
/root/kubernetes/cluster/addons/dashboard
$ ls *.yaml
dashboard-controller.yaml  dashboard-service.yaml
$ kubectl create -f  .
service "kubernetes-dashboard" created
deployment "kubernetes-dashboard" created
```

## 检查执行结果

查看分配的 NodePort

```bash
$ kubectl get services kubernetes-dashboard -n kube-system
NAME                   CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
kubernetes-dashboard   10.254.224.130   <nodes>       80:30312/TCP   25s
```

- NodePort 30312映射到 dashboard pod 80端口；

检查 controller

```bash
$ kubectl get deployment kubernetes-dashboard  -n kube-system
NAME                   DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
kubernetes-dashboard   1         1         1            1           3m
$ kubectl get pods  -n kube-system | grep dashboard
kubernetes-dashboard-1339745653-pmn6z   1/1       Running   0          4m
```

## 访问dashboard

有以下三种方式：

- kubernetes-dashboard 服务暴露了 NodePort，可以使用 `http://NodeIP:nodePort` 地址访问 dashboard；
- 通过 kube-apiserver 访问 dashboard（https 6443端口和http 8080端口方式）；
- 通过 kubectl proxy 访问 dashboard：

### 通过 kubectl proxy 访问 dashboard

启动代理

```bash
$ kubectl proxy --address='172.20.0.113' --port=8086 --accept-hosts='^*$'
Starting to serve on 172.20.0.113:8086
```

- 需要指定 `--accept-hosts` 选项，否则浏览器访问 dashboard 页面时提示 “Unauthorized”；

浏览器访问 URL：`http://172.20.0.113:8086/ui`
自动跳转到：

```http
http://172.20.0.113:8086/api/v1/proxy/namespaces/kube-system/services/kubernetes-dashboard/#/workload?namespace=default
```

### 通过 kube-apiserver 访问dashboard

获取集群服务地址列表

```bash
$ kubectl cluster-info
Kubernetes master is running at https://172.20.0.113:6443
KubeDNS is running at https://172.20.0.113:6443/api/v1/proxy/namespaces/kube-system/services/kube-dns
kubernetes-dashboard is running at https://172.20.0.113:6443/api/v1/proxy/namespaces/kube-system/services/kubernetes-dashboard
```

浏览器访问 URL：

```http
https://172.20.0.113:6443/api/v1/proxy/namespaces/kube-system/services/kubernetes-dashboard
```
浏览器会提示证书验证，因为通过加密通道，以改方式访问的话，需要提前导入证书到你的计算机中。这是我当时在这遇到的坑：[通过 kube-apiserver 访问dashboard，提示User "system:anonymous" cannot proxy services in the namespace "kube-system". #5](https://github.com/opsnull/follow-me-install-kubernetes-cluster/issues/5)，已经解决。

**导入证书**

将生成的admin.pem证书转换格式

```bash
openssl pkcs12 -export -in admin.pem  -out admin.p12 -inkey admin-key.pem
```

将生成的`admin.p12`证书导入的你的电脑，导出的时候记住你设置的密码，导入的时候还要用到。

如果你不想使用**https**的话，可以直接访问insecure port 8080端口:

```http
http://172.20.0.113:8080/api/v1/proxy/namespaces/kube-system/services/kubernetes-dashboard
```

![kubernetes-dashboard](https://res.cloudinary.com/jimmysong/image/upload/images/kubernetes-dashboard-raw.jpg)

由于缺少 Heapster 插件，当前 dashboard 不能展示 Pod、Nodes 的 CPU、内存等 metric 图形。
