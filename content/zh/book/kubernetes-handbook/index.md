---
title: "Kubernetes 中文指南"
date: 2022-03-09T08:00:00+08:00
draft: false
subtitle : "云原生应用架构实战手册"
# page title background image
bg_image: "images/backgrounds/page-title.jpg"
# meta description
description : "本书从 2017 年初开始撰写，历时近两年完成了20多万字的编纂，为本人学习经验总结。"
# book thumbnail
image: "images/books/kubernetes-handbook.jpg"
# page banner
banner: "images/banner/kubernetes-banner.png"
# taxonomy
category: "Handbook 系列"
# page count
pages : "1000+"
# book price
price : "免费"
# apply url
apply_url : "/kubernetes-handbook"
# type
type: "book"
aliases:
- "/posts/kubectl-cheatsheet"
- "/posts/kubectl-user-authentication-authorization"
- "/posts/kuberentes-crd-custom-resource"
- "/posts/kubernetes-advance-developer-guide"
- "/posts/kubernetes-and-cloud-native-app-overview"
- "/posts/kubernetes-and-cloud-native-outlook-2019"
- "/posts/kubernetes-anytime-anywhere"
- "/posts/kubernetes-client-go-sample"
- "/posts/kubernetes-cloud-native-summary-for-2017-and-outlook"
- "/posts/kubernetes-concept-deployment"
- "/posts/kubernetes-configmap-hot-update"
- "/posts/kubernetes-configmap-introduction"
- "/posts/kubernetes-container-naming-rule"
- "/posts/kubernetes-create-kubeconfig"
- "/posts/kubernetes-dashboard-installation"
- "/posts/kubernetes-dashboard-installation-with-tls"
- "/posts/kubernetes-dashboard-upgrade"
- "/posts/kubernetes-edge-node-configuration"
- "/posts/kubernetes-efk-installation-with-tls"
- "/posts/kubernetes-etcd-ha-config"
- "/posts/kubernetes-filebeat"
- "/posts/kubernetes-fluentd-elasticsearch-installation"
- "/posts/kubernetes-ha-master-installation"
- "/posts/kubernetes-handbook-startup"
- "/posts/kubernetes-heapster-installation"
- "/posts/kubernetes-heapster-installation-with-tls"
- "/posts/kubernetes-ingress-resource"
- "/posts/kubernetes-installation-document"
- "/posts/kubernetes-installation-on-centos"
- "/posts/kubernetes-jenkins-ci-cd"
- "/posts/kubernetes-kubectl-cheatsheat"
- "/posts/kubernetes-kubedns-installation"
- "/posts/kubernetes-logstash"
- "/posts/kubernetes-material-share"
- "/posts/kubernetes-network-config"
- "/posts/kubernetes-node-installation"
- "/posts/kubernetes-open-interfaces-cri-cni-csi"
- "/posts/kubernetes-performance-test"
- "/posts/kubernetes-persistent-volume"
- "/posts/kubernetes-pod-cheetsheet"
- "/posts/kubernetes-pod-preset"
- "/posts/kubernetes-rbac-support"
- "/posts/kubernetes-resourcequota-limitrange-management"
- "/posts/kubernetes-secret-configuration"
- "/posts/kubernetes-service-rolling-update"
- "/posts/kubernetes-taint-and-toleration"
- "/posts/kubernetes-tls-bootstrapping"
- "/posts/kubernetes-tls-certificate"
- "/posts/kubernetes-training-for-dockone-community"
- "/posts/kubernetes-tutorial-recommendation"
- "/posts/kubernetes-volumes-introduction"
- "/posts/kubernetes-with-glusterfs"
- "/posts/upgrade-kubernetes-from-16-to-18"
- "/posts/what-is-a-pause-container"
- "/posts/using-statefulset"
- "/posts/using-openebs-as-kubernetes-persistent-volume"
- "/posts/using-heapster-to-get-object-metrics"
- "/posts/user-authentication-in-kubernetes"
- "/posts/traefik-ingress-installation"
- "/posts/manage-kubernetes-native-app-with-helm"
- "/posts/migrating-hadoop-yarn-to-kubernetes"
- "/posts/openfaas-quick-start"
- "/posts/pod-lifecycle"
- "/posts/service-discovery-in-microservices"
- "/posts/setting-up-a-kubernetes-cluster-with-vagrant"
- "/posts/spring-boot-quick-start-guide"
- "/posts/the-next-stage-of-cloud-native-apps"
- "/posts/running-spark-with-kubernetes-native-scheduler"
---

本书起始于2017年3月，记录了本人从零开始学习和使用Kubernetes的心路历程，着重于经验分享和总结，同时也会有相关的概念解析，希望能够帮助大家少踩坑，少走弯路，还会指引大家关注Kubernetes生态周边，如微服务构建、DevOps、大数据应用、服务网格（Service Mesh）、云原生等领域。

### 开始之前

在阅读本书之前希望您掌握以下知识和准备以下环境：

- Linux 操作系统原理
- Linux 常用命令
- Docker 容器原理及基本操作
- 一台可以上网的电脑，Mac/Windows/Linux 皆可
- 安装 Docker

### 本书主题

本书的主题不局限于Kubernetes，还包括以下几大主题：

- 云原生开源组件
- 云原生应用与微服务架构
- 基于Kubernetes的Service Mesh架构
- Kubernetes与微服务结合实践

起初写作本书时，安装的所有组件、所用示例和操作等皆基于 **Kubernetes 1.6+** 版本，同时我们也将密切关注Kubernetes的版本更新，随着它的版本更新升级，本书中的Kubernetes版本和示例也将随之更新。

### 使用方式

您可以通过以下方式使用本书：

- [GitHub](https://github.com/rootsongjc/kubernetes-handbook)
- [GitBook 在线浏览](https://jimmysong.io/kubernetes-handbook)
- [下载本书的发行版](https://github.com/rootsongjc/kubernetes-handbook/releases)
- 按照[说明](https://github.com/rootsongjc/kubernetes-handbook/blob/master/CODE_OF_CONDUCT.md)自行编译成离线版本
- Fork 一份添加你自己的笔记自行维护，有余力者可以一起参与进来

**注意：本书中的 Service Mesh 相关内容已不再维护，请转至 [istio-handbook](https://www.servicemesher.com/istio-handbook) 浏览。**

## 快速开始

如果您想要学习Kubernetes和云原生应用架构但是又不想自己从头开始搭建和配置一个集群，那么可以直接使用[kubernetes-vagrant-centos-cluster](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster)项目直接在本地部署一个3节点的分布式集群及其他如Heapster、EFK、Istio等可选组件，或者使用更加轻量级的[cloud-native-sandbox](https://github.com/rootsongjc/cloud-native-sandbox)在个人电脑上使用Docker运行单节点的Kubernetes、Istio等组件。

## 贡献与致谢

感谢大家对本书做出的贡献！

- [查看贡献者列表](https://github.com/rootsongjc/kubernetes-handbook/graphs/contributors)
- [查看如何贡献](https://github.com/rootsongjc/kubernetes-handbook/blob/master/CONTRIBUTING.md)
- [查看文档的组织结构与使用方法](https://github.com/rootsongjc/kubernetes-handbook/blob/master/CODE_OF_CONDUCT.md)
