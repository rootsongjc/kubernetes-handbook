---
weight: 105
title: 配置 Kubernetes 开发环境
date: '2022-05-21T00:00:00+08:00'
type: book
---

我们将在 Mac 上使用 docker 环境编译 kuberentes。

## 安装依赖

```bash
brew install gnu-tar
```

Docker 环境，至少需要给容器分配 4G 内存，在低于 3G 内存的时候可能会编译失败。

## 执行编译

切换目录到 kuberentes 源码的根目录下执行：

`./build/run.sh make` 可以在 docker 中执行跨平台编译出二进制文件。

需要用的的 docker 镜像：

```bash
gcr.io/google_containers/kube-cross:v1.7.5-2
```

该镜像基于 Ubuntu 构建，大小 2.15G，编译环境中包含以下软件：

- Go1.7.5
- etcd
- protobuf
- g++
- 其他 golang 依赖包

在我自己的电脑上的整个编译过程大概要半个小时。

编译完成的二进制文件在 `/_output/local/go/bin/` 目录下。
