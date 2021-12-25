# 在 CentOS 上部署 Kubernetes 集群

> 本文档最初是基于 kubenetes1.6 版本编写的，对于 kuberentes1.8 及以上版本同样适用，只是个别位置有稍许变动，变动的地方我将特别注明版本要求。

本系列文档介绍使用二进制部署 `Kubernetes` 集群的所有步骤，而不是使用 `kubeadm` 等自动化方式来部署集群，同时开启了集群的 TLS 安全认证，该安装步骤适用于所有 bare metal 环境、on-premise 环境和公有云环境。

>  如果您想快速的在自己电脑的本地环境下使用虚拟机来搭建 Kubernetes 集群，可以参考 [本地分布式开发环境搭建（使用 Vagrant 和 Virtualbox）](../develop/using-vagrant-and-virtualbox-for-development.md)。

在部署的过程中，将详细列出各组件的启动参数，给出配置文件，详解它们的含义和可能遇到的问题。

部署完成后，你将理解系统各组件的交互原理，进而能快速解决实际问题。

所以本文档主要适合于那些有一定 Kubernetes 基础，想通过一步步部署的方式来学习和了解系统配置、运行原理的人。

**注：本文档中不包括 docker 和私有镜像仓库的安装，安装说明中使用的镜像来自 Google Cloud Platform，中国大陆用户若无法访问请自行选择其他镜像仓库备份。**

**欲下载最新版本的官方镜像请访问 [Google 云平台容器注册表](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL)。**

## 提供所有的配置文件

集群安装时所有组件用到的配置文件，包含在以下目录中：

-**etc**：service 的环境变量配置文件
-**manifest**：Kubernetes 应用的 yaml 文件
-**systemd**：systemd serivce 配置文件

## 集群详情

+ OS：CentOS Linux release 7.4.1708 (Core) 3.10.0-693.11.6.el7.x86_64
+ Kubernetes 1.6.0+（最低的版本要求是 1.6）
+ Docker：建议使用 Docker CE，**请勿使用 docker-1.13.1-84.git07f3374.el7.centos.x86_64 版本**，[查看详情](https://jimmysong.io/posts/docker-exec-bug-on-centos7/)
+ Etcd 3.1.5
+ Flannel 0.7.1 vxlan 或者 host-gw 网络
+ TLS 认证通信 (所有组件，如 etcd、Kubernetes master 和 node)
+ RBAC 授权
+ kubelet TLS BootStrapping
+ kubedns、dashboard、heapster (influxdb、grafana)、EFK (elasticsearch、fluentd、kibana) 集群插件
+ 私有 docker 镜像仓库 [harbor](https://github.com/goharbor/harbor)（请自行部署，harbor 提供离线安装包，直接使用 docker-compose 启动即可）

## 环境说明

在下面的步骤中，我们将在三台 CentOS 系统的物理机上部署具有三个节点的 Kubernetes1.6.0 集群。

角色分配如下：

**镜像仓库**：172.20.0.112，域名为 `harbor.jimmysong.io`，为私有镜像仓库，请替换为公共仓库或你自己的镜像仓库地址。

**Master**：172.20.0.113

**Node**：172.20.0.113、172.20.0.114、172.20.0.115

注意：172.20.0.113 这台主机 master 和 node 复用。所有生成证书、执行 kubectl 命令的操作都在这台节点上执行。一旦 node 加入到 Kubernetes 集群之后就不需要再登陆 node 节点了。

## 安装前的准备

1. 在 node 节点上安装 docker1.12.5

   直接使用 `yum install docker`

2. 关闭所有节点的 SELinux

  **永久方法 – 需要重启服务器**

   修改 `/etc/selinux/config` 文件中设置 SELINUX=disabled ，然后重启服务器。

  **临时方法 – 设置系统参数**

   使用命令 `setenforce 0`

  **附：**
   setenforce 1 设置 SELinux 成为 enforcing 模式
   setenforce 0 设置 SELinux 成为 permissive 模式

3. 准备 harbor 私有镜像仓库

   参考：https://github.com/vmware/harbor

## 步骤介绍

1. [创建 TLS 证书和秘钥](create-tls-and-secret-key.md)
2. [创建 kubeconfig 文件](create-kubeconfig.md)
3. [创建高可用 etcd 集群](etcd-cluster-installation.md)
4. [安装 kubectl 命令行工具](kubectl-installation.md)
5. [部署 master 节点](master-installation.md)
6. [安装 flannel 网络插件](flannel-installation.md)
7. [部署 node 节点](node-installation.md)
8. [安装 kubedns 插件](kubedns-addon-installation.md)
9. [安装 dashboard 插件](dashboard-addon-installation.md)
10. [安装 heapster 插件](heapster-addon-installation.md)
11. [安装 EFK 插件](efk-addon-installation.md)

## 提醒

1. 由于启用了 TLS 双向认证、RBAC 授权等严格的安全机制，建议**从头开始部署**，而不要从中间开始，否则可能会认证、授权等失败！
2. 部署过程中需要有很多证书的操作，请大家耐心操作，不明白的操作可以参考本书中的其他章节的解释。
3. 该部署操作仅是搭建成了一个可用 Kubernetes 集群，而很多地方还需要进行优化，heapster 插件、EFK 插件不一定会用于真实的生产环境中，但是通过部署这些插件，可以让大家了解到如何部署应用到集群上。

## 参考

- [opsnull 跟我一步步部署 kubernetes 集群 - github.com](https://github.com/opsnull/follow-me-install-kubernetes-cluster/)
