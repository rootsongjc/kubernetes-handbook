---
title: "如何编译 Istio？"
description: "本文将指导你如何在 macOS 上编译 Istio。"
date: 2022-05-15T14:18:40+08:00
draft: false
tags: ["istio"]
categories: ["Istio"]
type: "post"
bg_image: "images/backgrounds/page-title.jpg"
image: "images/banner/build-istio.jpg"
---

本文将指导你如何在 macOS 上编译 Istio 二进制文件和 Docker 镜像。

## 构建前的准备

在正式开始构建前，[参考这篇文档](https://github.com/istio/istio/wiki/Preparing-for-Development-Mac) ，以下是我的构建环境信息：

- macOS 12.3.1 Darwin AMD64
- Docker Desktop 4.8.1(78998)
- Docker Engine v20.10.14

## 开始构建

参考[这篇文档](https://github.com/istio/istio/wiki/Using-the-Code-Base) 编译 Istio。

首先在 [GitHub 上](https://github.com/istio/istio) 下载 Istio 代码，将代码下载到 `$GOPATH/src/istio.io/istio` 目录下，下文中的命令都在该根目录下执行。

### 编译成二进制文件

执行下面的命令下载 Istio 依赖的包，这些包将下载到 `vendor` 目录下：

```bash
go mod vendor
```

然后执行下面的命令构建 Istio：

```bash
sudo make build
```

如果你没有在命令前加 `sudo`，你可能遇到下面的错误：

```bash
fatal: unsafe repository ('/work' is owned by someone else)
To add an exception for this directory, call:

	git config --global --add safe.directory /work
fatal: unsafe repository ('/work' is owned by someone else)
To add an exception for this directory, call:

	git config --global --add safe.directory /work
Makefile.core.mk:170: *** "TAG cannot be empty".  Stop.
make: *** [build] Error 2
```

即使你按照提示执行了 `git config --global --add safe.directory /work` 在编译过程中还是会出现错误。

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

### 编译成 Docker 镜像

执行下面的将 Istio 编译成 Docker 镜像：

```bash
sudo make build
```

编译根据你的网络情况，大概耗时 3 到 5 分钟。编译完成后，执行下面的命令你将看到 Istio 的 Docker 镜像。

```bash
$ docker images
REPOSITORY                                         TAG                          IMAGE ID       CREATED              SIZE
localhost:5000/app_sidecar_centos_7                latest                       2044037df94b   51 seconds ago       524MB
localhost:5000/app_sidecar_ubuntu_jammy            latest                       5d8ae5ed55b7   About a minute ago   362MB
localhost:5000/proxyv2                             latest                       d4679412385f   About a minute ago   243MB
localhost:5000/install-cni                         latest                       78f46d5771d2   About a minute ago   270MB
localhost:5000/istioctl                            latest                       c38130a5adc8   About a minute ago   190MB
localhost:5000/pilot                               latest                       2aa9185ec202   About a minute ago   190MB
localhost:5000/app                                 latest                       473adafaeb8d   About a minute ago   188MB
localhost:5000/operator                            latest                       9ac1fedcdd12   About a minute ago   191MB
localhost:5000/ext-authz                           latest                       1fb5aaf20791   About a minute ago   117MB
localhost:5000/app_sidecar_debian_11               latest                       61376a02b95d   2 minutes ago        407MB
localhost:5000/app_sidecar_ubuntu_xenial           latest                       7e8efe666611   2 minutes ago        418MB
```

编译出镜像以后，你就可以修改镜像名字并推送到自己的镜像仓库里了。

## 总结

以上就是在 macOS 上构建 Istio 的过程，如果你已经下载好了构建所需要的的 Docker 镜像，那么构建时间将不超过一分钟，构建 Docker 镜像也只需要几分钟时间。

## 参考

- [Using the Code Base - github.com](https://github.com/istio/istio/wiki/Using-the-Code-Base)
