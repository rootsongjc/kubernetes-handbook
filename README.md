# Kubernetes Handbook

玩转Kubernetes，我就看kubernetes handbook！

文章同步更新到[gitbook](https://www.gitbook.com/book/rootsongjc/kubernetes-handbook/details)，方便大家浏览和下载PDF。

GitHub地址：https://github.com/rootsongjc/kubernetes-handbook

## 目录

- [0.0 介绍](README.md)
  - [1.0 Kubernetes集群安装](00-kubernetes安装前言.md)
  - [1.1 创建 TLS 通信所需的证书和秘钥](01-TLS证书和秘钥.md)
  - [1.2 创建kubeconfig 文件](02-kubeconfig文件.md)
  - [1.3 创建三节点的高可用etcd集群](03-高可用etcd集群.md)
  - [1.4 安装kubectl命令行工具](04-kubectl命令行工具.md)
  - [1.5 部署高可用master集群](05-部署高可用master集群.md)
  - [1.6 部署node节点](06-部署node节点.md)
  - [1.7 部署kubedns插件](07-dns-addon.md)
  - [1.8 安装dashboard插件](08-dashboard-addon.md)
  - [1.9 安装heapster插件](09-heapster-addon.md)
  - [1.10 安装EFK插件](10-EFK-addons.md)
- [Kubernetes服务发现与负载均衡]()
  - [2.0 Ingress解析](11-ingress-resource.md)
  - [2.1 Traefik ingress安装](12-traefik-ingress.md)
- [Kubernetes中的容器设计模式]()
- [Kubernetes中的概念解析]()
- [Kubernetes的安全设置]()
- [Kubernetes网络配置]()
- [Kubernetes存储配置]()
- [问题记录](issues.md)

## 说明

文中涉及的配置文件和代码链接在gitbook中会无法打开，请下载github源码后，在MarkDown编辑器中打开，点击链接将跳转到你的本地目录。

[Kubernetes集群安装部分](00-kubernetes安装前言.md)（1.0-1.10原作来自[opsnull](https://github.com/opsnull/follow-me-install-kubernetes-cluster)，在此基础上进行了编辑、修改和整理成[follow-me-install-kubernetes-cluster](https://github.com/rootsongjc/follow-me-install-kubernetes-cluster)）

## 如何使用

**在线浏览**

访问gitbook：https://www.gitbook.com/book/rootsongjc/kubernetes-handbook/

**本地查看**

1. 将代码克隆到本地
2. 安装gitbook：[Setup and Installation of GitBook](https://github.com/GitbookIO/gitbook/blob/master/docs/setup.md)
3. 执行gitbook serve
4. 在浏览器中访问http://localhost:4000

## 贡献者

[Jimmy Song](http://rootsongjc.github.io/about)

[opsnull](http://github.com/opsnull)

[godliness](https://github.com/godliness/)