---
title: "如何编译 Istio？"
description: "本文将指导你如何在 macOS 上编译 Istio 二进制文件。"
date: 2022-05-15T14:18:40+08:00
draft: false
tags: ["istio"]
categories: ["Istio"]
type: "post"
bg_image: "images/backgrounds/page-title.jpg"
image: "images/banner/build-istio.jpg"
---

本文将指导你如何在 macOS 上编译 Istio 二进制文件。

## 构建前的准备

在正式开始构建前，[参考这篇文档](https://github.com/istio/istio/wiki/Preparing-for-Development-Mac)，以下是我的构建环境信息：

- macOS 12.3.1 Darwin AMD64
- Docker Desktop 4.8.1(78998)
- Docker Engine v20.10.14

## 开始构建

参考[这篇文档](https://github.com/istio/istio/wiki/Using-the-Code-Base)编译 Istio。

首先在 [GitHub 上](https://github.com/istio/istio)下载 Istio 代码，将代码下载到 `$GOPATH/src/istio.io/istio` 目录下，下文中的命令都在该根目录下执行。

执行下面的命令下载 Istio 依赖的包，这些包将下载到 `vendor` 目录下：

```bash
go mod vendor
```

然后执行下面的命令构建 Istio：

```bash
sudo make build
```

如果你没有在命令前加 `sudo`，你还是可能遇到下面的错误：

```
fatal: unsafe repository ('/work' is owned by someone else)
To add an exception for this directory, call:

	git config --global --add safe.directory /work
fatal: unsafe repository ('/work' is owned by someone else)
To add an exception for this directory, call:

	git config --global --add safe.directory /work
Makefile.core.mk:170: *** "TAG cannot be empty".  Stop.
make: *** [build] Error 2
```

构建完的二进制文件将保存在 `out` 目录下，其目录结构如下：

```bash
out
├── darwin_amd64
│   ├── bug-report
│   ├── client
│   ├── envoy
│   ├── extauthz
│   ├── install-cni
│   ├── istio-cni
│   ├── istio-cni-taint
│   ├── istio-iptables
│   ├── istio_is_init
│   ├── istioctl
│   ├── logs
│   ├── operator
│   ├── pilot-agent
│   ├── pilot-discovery
│   ├── release
│   └── server
└── linux_amd64
    ├── envoy
    ├── envoy-centos
    ├── logs
    └── release
```

同时构建出了 `linux_amd64` 和 `darwin_amd64` 架构的二进制文件。

## 总结

以上就是在 macOS 上构建 Istio 的过程，如果你已经下载好了构建所需要的的 Docker 镜像，那么构建时间将不超过一分钟。

## 参考

- [Using the Code Base - github.com](https://github.com/istio/istio/wiki/Using-the-Code-Base)
