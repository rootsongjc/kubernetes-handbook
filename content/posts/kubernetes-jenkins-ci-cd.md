---
date: "2017-06-27T20:52:57+08:00"
draft: false
title: "使用Jenkins进行持续构建与发布应用到kubernetes集群中"
categories: "devops"
tags: ["kubernetes","ci","jenkins"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20170627001.jpg", desc: "正午@东直门 Jun 27，2017"}]
---

本文已归档到[kubernetes-handbook](https://github.com/rootsongjc/kubernetes-handbook/)中的【最佳实践—使用Jenkins进行持续构建与发布】章节中，一切内容以kubernetes-handbook为准。

我们基于Jenkins的CI/CD流程如下所示。

![基于Jenkins的持续集成与发布](https://res.cloudinary.com/jimmysong/image/upload/images/kubernetes-jenkins-ci-cd.png)

## 流程说明

应用构建和发布流程说明。

1. 用户向Gitlab提交代码，代码中必须包含`Dockerfile`；
2. 将代码提交到远程仓库；
3. 用户在发布应用时需要填写git仓库地址和分支、服务类型、服务名称、资源数量、实例个数等，确定后触发Jenkins自动构建；
4. Jenkins的CI流水线自动编译代码并打包成docker镜像推送到Harbor镜像仓库；
5. Jenkins的CI流水线中包括了自定义脚本，根据我们已准备好的kubernetes的YAML模板，将其中的变量替换成用户输入的选项；
6. 生成应用的kubernetes YAML配置文件；
7. 更新Ingress的配置，根据新部署的应用的名称，在ingress的配置文件中增加一条路由信息
8. 更新PowerDNS，向其中插入一条DNS记录，IP地址是边缘节点的IP地址。关于边缘节点，请查看[kubernetes-handbook](https://github.com/rootsongjc/kubernetes-handbook)中的【最佳实践——边缘节点配置】章节；
9. Jenkins调用kubernetes的API，部署应用到kubernetes集群中。

关于应用的更新、滚动升级、灰度发布请留意博客中的后续文章或关注[kubernetes-handbook](https://github.com/rootsongjc/kubernetes-handbook)的更新。
