---
title: "随时随地访问您的Kubernetes集群"
subtitle: "kubernetes客户端工具推荐"
description: "kubernetes命令行、桌面、web、手机客户端推荐，随时随地访问您的kubernetes集群"
date: 2017-12-06T16:23:15+08:00
tags: ["kubernetes"]
categories: "kubernetes"
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20171202002.jpg", desc: "大橘猫@五道营胡同 Dec 2,2017"}]
draft: false
---

设想一下，有一天你正在海上冲浪，突然你的智能手表上的电话响起，你的老板要你上线一个服务，而你早已在测试环境部署验证过没有问题，现在到了上线时间了，此时你信心满满，在自己的手表上打开了kubernetes终端，手指点了点，啪，上线完成。

![Kubernetes手机端](https://res.cloudinary.com/jimmysong/image/upload/images/kubernetes-on-arms-1.jpg)

![Kubernetes手机端](https://res.cloudinary.com/jimmysong/image/upload/images/kubernetes-on-arms-2.jpg)

这真的不是痴人说梦，因为已经有人在手表上运行kubernetes了！

下面给大家介绍几款kubernetes集群的访问工具，包括了命令行、web、桌面和移动端。

## 命令行工具使用kubectl

如果您是第一次访问 Kubernetes API 的话，我们建议您使用 Kubernetes 命令行工具：`kubectl`。

为了访问集群，您需要知道集群的地址，并且需要有访问它的凭证。通常，如果您完成了 [入门指南](https://kubernetes.io/docs/getting-started-guides) 那么这些将会自动设置，或者其他人为您部署的集群提供并给您凭证和集群地址。

使用下面的命令检查 kubectl 已知的集群的地址和凭证：

```bash
$ kubectl config view
```

关于 kubectl 命令使用的更多 [示例](https://github.com/kubernetes/kubernetes/tree/%7B%7Bpage.githubbranch%7D%7D/examples/) 和完整文档可以在这里找到：[kubectl 手册](https://kubernetes.io/docs/user-guide/kubectl/index)

当你掌握了kubectl命令后，可以安装带有命令提示功能的[kube-shell](https://github.com/cloudnativelabs/kube-shell)。

![kube-shell](https://jimmysong.io/kubernetes-handbook/images/kube-shell.jpg)

## Web UI - Kubernetes dashboard

Kubernetes dashboard是kubernetes官方出品的UI，与kubernetes的API兼容性最好最及时。

![kubernetes dashboard](https://jimmysong.io/kubernetes-handbook/images/kubernetes-dashboard-1.7.1-brand.jpg)

dashboard1.7及以上版本支持使用token或kubeconfig文件做登录认证，前提是要启用https。

## 桌面客户端Kubernetic

Kubernetic是一款kubernetes桌面客户端，支持windows和mac，当前beta版本免费，<https://kubernetic.com/>，支持以下特性：

- 实时展示集群状态
- 多集群，多个namespace管理
- 原生kubernetes支持
- 支持使用chart安装应用
- 使用kubeconfig登陆认证

![Kubernetic客户端](https://jimmysong.io/kubernetes-handbook/images/kubernetic-desktop-ui.jpg)

## 手机客户端Carbin

Carbin是由[bitnami](https://bitnami.com/)开源的手机管理Kubernetes集群的客户端，目前提供iOS和安卓版本，代码开源在GitHub上：<https://bitnami.com/>

为了方便移动办公，可以使用Carbin这个kuberntes手机客户端，可以链接GKE和任何Kubernetes集群，可以使用以下三种认证方式：

- 证书
- token
- kubeconfig文件

所有功能跟kubernetes dashboard相同，还可以支持使用Helm chart部署应用，可以配置自定义的chart仓库地址。

iPhone用户可以在App Store中搜索**Carbin**即可找到。

![App Store](https://jimmysong.io/kubernetes-handbook/images/carbin-kubernetes-mobile-dashboard-1.jpg)图片 - App Store

可以很方便的在手机上操作自己的kubernetes集群，还可以登录到容器中操作，只要是kubernetes API支持的功能，都可以在该移动客户端上实现。

![在手机上操作Kubernetes集群](https://jimmysong.io/kubernetes-handbook/images/carbin-kubernetes-mobile-dashboard-4.jpg)

更多详细信息请参考：<https://github.com/bitnami/cabin>