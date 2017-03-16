+++
date = "2017-03-16T19:52:37+08:00"
title = "Contiv Ultimate-思科docke网络插件contiv入坑终极版"
draft = false
Tags = ["docker","docker plugin","network","cisco"]

+++

*（题图：）*

前几天写的几篇[关于Contiv的文章](http://rootsongjc.github.io/tags/contiv/)已经把引入坑了😂

今天这篇文章将带领大家用正确的姿势编译和打包一个**contiv netplugin**。

> 请一定要在**Linux**环境中编译。docker中编译也会报错，最好还是搞个虚拟🐔吧，最好还有VPN能翻墙。

## 编译

创建一个link **/go**链接到你的GOPATH目录，下面编译的时候要用。

在netplugin目录下执行以下命令能够编译出二进制文件。

```
NET_CONTAINER_BUILD=1 make build
```

**bin**目录下会生成如下几个文件：

```
contivk8s  github-release  godep  golint  misspell  modelgen  netcontiv  netctl
```

*⚠️编译过程中可能会遇到 有些包不存在或者需要翻墙下载。*

## 打包

