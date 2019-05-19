---
draft: false
date: "2017-04-13T14:00:04+08:00"
title: "Kubernetes1.6集群部署完全指南——二进制文件部署开启TLS基于CentOS7发布"
categories: "github"
tags: ["kubernetes","book"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/2016081309.jpg", desc: "清晨@首都机场 Aug 13,2016"}]
---

**这可能是目前为止最详细的kubernetes安装文档了。**

经过几天的安装、调试、整理，今天该文档终于发布了。

你可以在这里看到文档和配置文件[和我一步步部署 kubernetes1.6 集群](https://github.com/rootsongjc/follow-me-install-kubernetes-cluster)。

或者直接下载[pdf](https://res.cloudinary.com/jimmysong/image/upload/images/Kubernetes1.6%E9%9B%86%E7%BE%A4%E9%83%A8%E7%BD%B2%E5%AE%8C%E5%85%A8%E6%8C%87%E5%8D%97%E2%80%94%E2%80%94%E4%BA%8C%E8%BF%9B%E5%88%B6%E6%96%87%E4%BB%B6%E9%83%A8%E7%BD%B2%E5%BC%80%E5%90%AFTLS%E5%9F%BA%E4%BA%8ECentOS7.pdf)版本（2.92M）。

Kubernetes的安装繁琐，步骤复杂，该文档能够帮助跳过很多坑，节约不少时间，我在本地环境上已经安装完成，有问题欢迎在[GitHub](https://github.com/opsnull/follow-me-install-kubernetes-cluster)上提issue。

**安装的集群详情**

- Kubernetes 1.6.0
- Docker 1.12.5（使用yum安装）
- Etcd 3.1.5
- Flanneld 0.7 vxlan 网络
- TLS 认证通信 (所有组件，如 etcd、kubernetes master 和 node)
- RBAC 授权
- kublet TLS BootStrapping
- kubedns、dashboard、heapster(influxdb、grafana)、EFK(elasticsearch、fluentd、kibana) 集群插件
- 私有docker镜像仓库[harbor](https://github.com/rootsongjc/follow-me-install-kubernetes-cluster/blob/master/github.com/vmware/harbor)（请自行部署，harbor提供离线安装包，直接使用docker-compose启动即可）

**该文档中包括以下几个步骤**

- 创建 TLS 通信所需的证书和秘钥
- 创建 kubeconfig 文件
- 创建三节点的高可用 etcd 集群
- kubectl命令行工具
- 部署高可用 master 集群
- 部署 node 节点
- kubedns 插件
- Dashboard 插件
- Heapster 插件
- EFK 插件
