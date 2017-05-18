# 在CentOS上部署kubernetes1.6集群

本系列文档介绍使用二进制部署 `kubernetes` 集群的所有步骤，而不是使用 `kubeadm` 等自动化方式来部署集群，同时开启了集群的TLS安全认证；

在部署的过程中，将详细列出各组件的启动参数，给出配置文件，详解它们的含义和可能遇到的问题。

部署完成后，你将理解系统各组件的交互原理，进而能快速解决实际问题。

所以本文档主要适合于那些有一定 kubernetes 基础，想通过一步步部署的方式来学习和了解系统配置、运行原理的人。

*注：本文档中不包括docker和私有镜像仓库的安装。*

## 提供所有的配置文件

集群安装时所有组件用到的配置文件，包含在以下目录中：

- **etc**： service的环境变量配置文件
- **manifest**： kubernetes应用的yaml文件
- **systemd** ：systemd serivce配置文件

## 集群详情

+ Kubernetes 1.6.0
+ Docker  1.12.5（使用yum安装）
+ Etcd 3.1.5
+ Flanneld 0.7 vxlan 网络
+ TLS 认证通信 (所有组件，如 etcd、kubernetes master 和 node)
+ RBAC 授权
+ kublet TLS BootStrapping
+ kubedns、dashboard、heapster(influxdb、grafana)、EFK(elasticsearch、fluentd、kibana) 集群插件
+ 私有docker镜像仓库[harbor](github.com/vmware/harbor)（请自行部署，harbor提供离线安装包，直接使用docker-compose启动即可）

## 步骤介绍

- [1 创建 TLS 证书和秘钥](create-tls-and-secret-key.md)
- [2 创建kubeconfig 文件](create-kubeconfig.md)
- [3 创建高可用etcd集群](etcd-cluster-installation.md)
- [4 安装kubectl命令行工具](kubectl-installation.md)
- [5 部署高可用master集群](master-installation.md)
- [6 部署node节点](node-installation.md)
- [7 安装kubedns插件](kubedns-addon-installation.md)
- [8 安装dashboard插件](dashboard-addon-installation.md.md)
- [9 安装heapster插件](heapster-addon-installation.md)
- [10 安装EFK插件](efk-addon-installation.md)

## 提醒

1. 由于启用了 TLS 双向认证、RBAC 授权等严格的安全机制，建议**从头开始部署**，而不要从中间开始，否则可能会认证、授权等失败！
2. 本文档将**随着各组件的更新而更新**，有任何问题欢迎提 issue！

## 关于

[Jimmy Song](http://rootsongjc.github.io/about)

