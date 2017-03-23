+++
date = "2017-03-23T15:01:18+08:00"
title = "Cloud foundry试用"
draft = true
Tags = ["cloud","cloud foundry","pivotal","paas"]

+++

*（题图：）*

## 前言

最近研究了下**Pivotal**的**Cloud foundry**，CF本身是一款开源软件，很多PAAS厂商都加入了CF，我们用的是的**PCF Dev**（PCF Dev是一款可以在工作站上运行的轻量级PCF安装）来试用的，因为它可以部署在自己的环境里，而**Pivotal Web Services**只免费两个月，之后就要收费。[这里](https://pivotal.io/cn/platform/pcf-tutorials/getting-started-with-pivotal-cloud-foundry-dev/introduction)有官方的详细教程。

## 开始

根据官网的示例，我们将运行一个Java程序示例。

**安装命令行终端**

[下载](https://pivotal.io/cn/platform/pcf-tutorials/getting-started-with-pivotal-cloud-foundry-dev/install-the-cf-cli)后双击安装即可，然后执行`cf help`能够看到帮助。

**安装PCF Dev**

先[下载](https://network.pivotal.io/products/pcfdev)，如果你没有Pivotal network账号的话，还需要注册个用户，然后用以下命令安装：

```shell
./pcfdev-VERSION-osx && \
cf dev start
```

启动过程中还需要**Sign In**，所以注册完后要记住用户名（邮箱地址）和密码（必须超过8位要有特殊字符和大写字母）。这个过程中还要下载VM，对内存要求至少4G。