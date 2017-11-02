---
title: "Kubernetes Dashboard版本升级详解"
date: 2017-11-02T16:41:21+08:00
draft: false
tags: ["kubernetes","dashboard"]
subtitle: "From v1.6.3 to v1.7.1"
description: "本文介绍的是将介绍将dashboard从v1.6.3升级到v1.7.1并开启用户登陆认证的详细步骤"
categories: "kubernetes"
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20160326073.jpg", desc: "郁金香 Mar 26,2016"}] 
---

# 升级Dashboard

我们在kubernetes1.6的时候同时安装了dashboard插件，该插件也是基于kubernetes1.6版本开发的。如今kubernetes1.8版本业已发布，如何升级dashboard以获取新版中功能呢？

Dashboard的升级比较简单，因为它仅仅是一个前端应用，用来展现集群信息和与后端API交互，理论上只需要更新原先dashboard的yaml配置文件中的镜像就可以了，但是为了使用dashboard1.7版本中的用户登陆功能，还需要做一些额外的操作。

[dashboard](https://github.com/kubernetes/dashboard)的更新日志请见[release note](https://github.com/kubernetes/dashboard/releases)，当前的最新版本为v1.7.1，下面将介绍将dashboard从v1.6.3升级到v1.7.1并开启用户登陆认证的详细步骤。

本文已归档到[kubernetes-handbook](https://jimmysong.io/kubernetes-handbook)中。

## 升级步骤

**删除原来的版本**

首先删除原来的dashboard资源：

```bash
kubectl delete -f dashboard/
```

将`dashboard`目录下的所有yaml文件中的资源全部删除，包括Deployment、service和角色绑定等。

**部署新版本**

我们使用官方的配置文件来安装，首先下载官方配置：

```bash
wget https://raw.githubusercontent.com/kubernetes/dashboard/master/src/deploy/recommended/kubernetes-dashboard.yaml
```

修改其中的两个镜像地址为我们的私有地址。

- gcr.io/google_containers/kubernetes-dashboard-init-amd64:v1.0.1
- gcr.io/google_containers/kubernetes-dashboard-amd64:v1.7.1

这个两个镜像可以同时从**时速云**上获取：

- index.tenxcloud.com/jimmy/kubernetes-dashboard-amd64:v1.7.1
- index.tenxcloud.com/jimmy/kubernetes-dashboard-init-amd64:v1.0.1

将service type设置为`NodePort`，修改后的yaml文件见[kubernetes-dashboard.yaml](https://github.com/rootsongjc/kubernetes-handbook/tree/master/manifests/dashboard-1.7.1/kubernetes-dashboard.yaml)，然后就可以部署新版本的dashboard了。

```bash
kubectl create -f kubernetes-dashboard.yaml
```

获取dashboard的外网访问端口：

```bash
kubectl -n kube-system get svc kubernetes-dashboard
NAME                   CLUSTER-IP       EXTERNAL-IP   PORT(S)         AGE
kubernetes-dashboard   10.254.177.181   <nodes>       443:32324/TCP   49m
```

访问集群中的任何一个节点，即可打开dashboard登陆页面，如[https://172.20.0.113:32324/（请使用https访问）：](https://172.20.0.113:32324/%EF%BC%88%E8%AF%B7%E4%BD%BF%E7%94%A8https%E8%AE%BF%E9%97%AE%EF%BC%89%EF%BC%9A)

![登陆界面](https://jimmysong.io/kubernetes-handbook/images/kubernetes-dashboard-1.7.1-login.jpg)

选择本地的`kubeconfig`文件以登陆集群，`kubeconfig`文件中包括登陆的用户名、证书和token信息。

登陆之后首先看到的界面是这样的：

![首页](https://jimmysong.io/kubernetes-handbook/images/kubernetes-dashboard-1.7.1-default-page.jpg)

这是因为该用户没有对`default`命名空间的访问权限。

修改URL地址中的`namespace`字段为该用户有权限访问的命名空间如brand：<https://172.20.0.113:32324/#!/overview?namespace=brand>：

![用户空间](https://jimmysong.io/kubernetes-handbook/images/kubernetes-dashboard-1.7.1-brand.jpg)登陆dashboard的时候可以指定`kubeconfig`文件来认证用户权限，如何生成登陆dashboard时指定的`kubeconfig`文件请参考[创建用户认证授权的kubeconfig文件](https://jimmysong.io/kubernetes-handbook/guide/kubectl-user-authentication-authorization.html)。

另外还需要生成用户token，例如为brand用户生成token：

```bash
$ head -c 16 /dev/urandom | od -An -t x| tr -d ' '
a09bb459d67d876cf1829b4047394a5a
```

将该用户的token追加到kuberentes API启动参数中指定的`token`文件中，我们安装时指定的是`/etc/kubernetes/token.csv`。

```bash
a09bb459d67d876cf1829b4047394a5a,brand,10002,"brand"
```

注意：此处Namespace和ServiceAccount相同，都是`brand`。

重启API server也加载最新的配置。

然后在上面生成的`kubeconfig`文件中追加一行`token`的配置，如下所示：

![kubeconfig文件](https://jimmysong.io/kubernetes-handbook/images/brand-kubeconfig-yaml.jpg)

这样就可以使用`brand.kubeconfig`文件来登陆dashboard了，而且只能访问和操作`brand`命名空间下的对象。

## 参考

- [Dashboard log in mechanism #2093](https://github.com/kubernetes/dashboard/issues/2093)
- [Accessing Dashboard 1.7.X and above](https://github.com/kubernetes/dashboard/wiki/Accessing-Dashboard---1.7.X-and-above)