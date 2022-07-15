---
date: "2017-03-06T17:03:19+08:00"
title: "Docker 源码编译和开发环境搭建"
description: "本文将讲解如何进行 Docker 源码编译及开发环境搭建。"
draft: false
categories: ["容器"]
tags: ["docker"]
type: "post"
aliases: "/posts/docker-dev-env"
image: "images/banner/docker-logo.jpg"
---

看了下网上其他人写的 docker 开发环境搭建，要么是在 ubuntu 下搭建，要么就是使用官方说明的 build docker-dev 镜像的方式一步步搭建的，甚是繁琐，docker hub 上有一个 docker 官方推出的 **dockercore/docker** 镜像，其实这就是官网上所说的 docker-dev 镜像，不过以前的那个 deprecated 了，使用目前这个镜像搭建 docker 开发环境是最快捷的了。

想要修改 docker 源码和做 docker 定制开发的同学可以参考下。

- [官方指导文档](https://docs.docker.com/opensource/code/)
- [设置 docker 开发环境](https://docs.docker.com/opensource/project/set-up-dev-env/)

docker 的编译实质上是在 docker 容器中运行 docker。

因此在本地编译 docker 的前提是需要安装了 docker，还需要用 git 把代码 pull 下来。

### 创建分支

为了方便以后给 docker 提交更改，我们从 docker 官方 fork 一个分支。

```shell
git clone https://github.com/rootsongjc/docker.git
git config --local user.name "Jimmy Song"
git config --local user.email "rootsongjc@gmail.com"
git remote add upstream https://github.com/docker/docker.git
git config --local -l
git remote -v
git checkout -b dry-run-test
touch TEST.md
vim TEST.md
git status
git add TEST.md
git commit -am "Making a dry run test."
git push --set-upstream origin dry-run-test
```

然后就可以在 `dry-run-test` 这个分支下工作了。

### 配置 docker 开发环境

[官网](https://docs.docker.com/opensource/project/set-up-dev-env/) 上说需要先清空自己电脑上已有的容器和镜像。

docker 开发环境本质上是创建一个 docker 镜像，镜像里包含了 docker 的所有开发运行环境，本地代码通过挂载的方式放到容器中运行，下面这条命令会自动创建这样一个镜像。

在 `dry-run-test` 分支下执行

```Shell
make BIND_DIR=. shell
```

该命令会自动编译一个 docker 镜像，From debian:jessie。这一步会上网下载很多依赖包，速度比较慢。如果翻不了墙的话肯定都会失败。因为需要下载的软件和安装包都是在国外服务器上，不翻墙根本就下载不下来，为了不用这么麻烦，推荐直接使用 docker 官方的 dockercore/docker 镜像，也不用以前的 docker-dev 镜像，那个造就废弃了。这个镜像大小有 2.31G。

```
docker pull dockercore/docker
```

使用方法见 [docker hub](https://hub.docker.com/r/dockercore/docker/)

然后就可以进入到容器里

```Shell
docker run --rm -i --privileged -e BUILDFLAGS -e KEEPBUNDLE -e DOCKER_BUILD_GOGC -e DOCKER_BUILD_PKGS -e DOCKER_CLIENTONLY -e DOCKER_DEBUG -e DOCKER_EXPERIMENTAL -e DOCKER_GITCOMMIT -e DOCKER_GRAPHDRIVER=devicemapper -e DOCKER_INCREMENTAL_BINARY -e DOCKER_REMAP_ROOT -e DOCKER_STORAGE_OPTS -e DOCKER_USERLANDPROXY -e TESTDIRS -e TESTFLAGS -e TIMEOUT -v "/Users/jimmy/Workspace/github/rootsongjc/docker/bundles:/go/src/github.com/docker/docker/bundles" -t "dockercore/docker:latest" bash
```

按照官网的说明 make 会报错

```bash
root@f2753f78bb6d:/go/src/github.com/docker/docker# ./hack/make.sh binary                          

error: .git directory missing and DOCKER_GITCOMMIT not specified
  Please either build with the .git directory accessible, or specify the
  exact (--short) commit hash you are building using DOCKER_GITCOMMIT for
  future accountability in diagnosing build issues.  Thanks!
```

这是一个 [issue-27581](https://github.com/docker/docker/issues/27581) ，解决方式就是在 make 的时候手动指定 `DOCKER_GITCOMMIT`。

```bash
root@f2753f78bb6d:/go/src/github.com/docker/docker# DOCKER_GITCOMMIT=3385658 ./hack/make.sh binary

---> Making bundle: binary (in bundles/17.04.0-dev/binary)
Building: bundles/17.04.0-dev/binary-client/docker-17.04.0-dev
Created binary: bundles/17.04.0-dev/binary-client/docker-17.04.0-dev
Building: bundles/17.04.0-dev/binary-daemon/dockerd-17.04.0-dev
Created binary: bundles/17.04.0-dev/binary-daemon/dockerd-17.04.0-dev
Copying nested executables into bundles/17.04.0-dev/binary-daemon
```

bundles 目录下会生成如下文件结构

```bash
.
├── 17.04.0-dev
│   ├── binary-client
│   │   ├── docker -> docker-17.04.0-dev
│   │   ├── docker-17.04.0-dev
│   │   ├── docker-17.04.0-dev.md5
│   │   └── docker-17.04.0-dev.sha256
│   └── binary-daemon
│       ├── docker-containerd
│       ├── docker-containerd-ctr
│       ├── docker-containerd-ctr.md5
│       ├── docker-containerd-ctr.sha256
│       ├── docker-containerd-shim
│       ├── docker-containerd-shim.md5
│       ├── docker-containerd-shim.sha256
│       ├── docker-containerd.md5
│       ├── docker-containerd.sha256
│       ├── docker-init
│       ├── docker-init.md5
│       ├── docker-init.sha256
│       ├── docker-proxy
│       ├── docker-proxy.md5
│       ├── docker-proxy.sha256
│       ├── docker-runc
│       ├── docker-runc.md5
│       ├── docker-runc.sha256
│       ├── dockerd -> dockerd-17.04.0-dev
│       ├── dockerd-17.04.0-dev
│       ├── dockerd-17.04.0-dev.md5
│       └── dockerd-17.04.0-dev.sha256
└── latest -> 17.04.0-dev

4 directories, 26 files
```

现在可以将 docker-daemon 和 docker-client 目录下的 docker 可以执行文件复制到容器的 /usr/bin/ 目录下了。

启动 docker deamon

```bash
docker daemon -D&
```

检查下 docker 是否可用

```bash
root@f2753f78bb6d:/go/src/github.com/docker/docker/bundles/17.04.0-dev# docker version
DEBU[0048] Calling GET /_ping                           
DEBU[0048] Calling GET /v1.27/version                   
Client:
 Version:      17.04.0-dev
 API version:  1.27
 Go version:   go1.7.5
 Git commit:   3385658
 Built:        Mon Mar  6 08:39:06 2017
 OS/Arch:      linux/amd64

Server:
 Version:      17.04.0-dev
 API version:  1.27 (minimum version 1.12)
 Go version:   go1.7.5
 Git commit:   3385658
 Built:        Mon Mar  6 08:39:06 2017
 OS/Arch:      linux/amd64
 Experimental: false
```

到此 docker 源码编译和开发环境都已经搭建好了。

如果想要修改 docker 源码，只要在你的 IDE、容器里或者你本机上修改 docker 代码后，再执行上面的 hack/make.sh binary 命令就可以生成新的 docker 二进制文件，再替换原来的 /usr/bin/ 目录下的 docker 二进制文件即可。
