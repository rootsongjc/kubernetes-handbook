# 和我一步步部署kubernetes集群

本系列文档介绍使用二进制部署 `kubernetes` 集群的所有步骤，而不是使用 `kubeadm` 等自动化方式来部署集群，同时开启了集群的TLS安全认证；

在部署的过程中，将详细列出各组件的启动参数，给出配置文件，详解它们的含义和可能遇到的问题。

部署完成后，你将理解系统各组件的交互原理，进而能快速解决实际问题。

所以本文档主要适合于那些有一定 kubernetes 基础，想通过一步步部署的方式来学习和了解系统配置、运行原理的人。

**项目代码中提供了汇总后的markdon和pdf格式的安装文档，pdf版本文档[下载](http://olz1di9xf.bkt.clouddn.com/Kubernetes1.6%E9%9B%86%E7%BE%A4%E9%83%A8%E7%BD%B2%E5%AE%8C%E5%85%A8%E6%8C%87%E5%8D%97%E2%80%94%E2%80%94%E4%BA%8C%E8%BF%9B%E5%88%B6%E6%96%87%E4%BB%B6%E9%83%A8%E7%BD%B2%E5%BC%80%E5%90%AFTLS%E5%9F%BA%E4%BA%8ECentOS7.pdf)。**

注：本文档中不包括docker和私有镜像仓库的安装。

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

1. [创建 TLS 通信所需的证书和秘钥](01-TLS证书和秘钥.md)
2. [创建 kubeconfig 文件](02-kubeconfig文件.md)
3. [创建三节点的高可用 etcd 集群](03-高可用etcd集群.md)
4. [kubectl命令行工具](04-kubectl命令行工具.md)
5. [部署高可用 master 集群](05-部署高可用master集群.md)
6. [部署 node 节点](06-部署node节点.md)
7. [kubedns 插件](07-dns-addon.md)
8. [Dashboard 插件](08-dashboard-addon.md)
9. [Heapster 插件](09-heapster-addon.md)
10. [EFK 插件](10-EFK-addons.md)


## 提醒

1. 由于启用了 TLS 双向认证、RBAC 授权等严格的安全机制，建议**从头开始部署**，而不要从中间开始，否则可能会认证、授权等失败！
2. 本文档将**随着各组件的更新而更新**，有任何问题欢迎提 issue！

## 关于

[Jimmy Song](http://rootsongjc.github.io/about)

[我的Kubernetes相关文章](http://rootsongjc.github.io/tags/kubernetes)

