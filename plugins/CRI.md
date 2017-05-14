---
title: Container Runtime Interface
date: 2016-10-21 16:11:07
layout: "post"
---

# Container Runtime Interface

Container Runtime Interface (CRI)是Kubelet 1.5/1.6中主要负责的一块项目，它重新定义了Kubelet Container Runtime API，将原来完全面向Pod级别的API拆分成面向Sandbox和Container的API，并分离镜像管理和容器引擎到不同的服务。

![](cri.png)

CRI最早从从1.4版就开始设计讨论和开发，在v1.5中发布第一个测试版。

## 目前的CRI实现

目前，有多家厂商都在基于CRI集成自己的容器引擎，其中包括

- 1) Docker: 核心代码依然保留在kubelet内部
- 2) HyperContainer: https://github.com/kubernetes/frakti
- 3) Rkt: https://github.com/kubernetes-incubator/rktlet
- 4) Runc: https://github.com/kubernetes-incubator/cri-o
- 5) Mirantis: https://github.com/Mirantis/virtlet
- 6) Cloud foundary: https://github.com/cloudfoundry/garden
- 7) Infranetes: not opensourced yet.

