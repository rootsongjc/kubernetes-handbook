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

$./pcfdev-VERSION-osx && \
cf dev start
Less than 4096 MB of free memory detected, continue (y/N): > y
Please sign in with your Pivotal Network account.
Need an account? Join Pivotal Network: https://network.pivotal.io

Email> 849122844@qq.com

Password> 
Downloading VM...
Progress: |+++++++++++++=======>| 100% 
VM downloaded.
Allocating 4096 MB out of 16384 MB total system memory (3514 MB free).
Importing VM...
Starting VM...
Provisioning VM...
Waiting for services to start...
8 out of 57 running
8 out of 57 running
8 out of 57 running
46 out of 57 running
57 out of 57 running
 _______  _______  _______    ______   _______  __   __
|       ||       ||       |  |      | |       ||  | |  |
|    _  ||       ||    ___|  |  _    ||    ___||  |_|  |
|   |_| ||       ||   |___   | | |   ||   |___ |       |
|    ___||      _||    ___|  | |_|   ||    ___||       |
|   |    |     |_ |   |      |       ||   |___  |     |
|___|    |_______||___|      |______| |_______|  |___|
is now running.
To begin using PCF Dev, please run:
   cf login -a https://api.local.pcfdev.io --skip-ssl-validation
Apps Manager URL: https://local.pcfdev.io
Admin user => Email: admin / Password: admin
Regular user => Email: user / Password: pass
```

启动过程中还需要**Sign In**，所以注册完后要记住用户名（邮箱地址）和密码（必须超过8位要有特殊字符和大写字母）。这个过程中还要下载VM，对内存要求至少4G。而且下载速度比较慢，我下载的了大概3个多小时吧。

下面部署一个应用到PCF Dev上试一试。

**部署应用**

```
$git clone https://github.com/cloudfoundry-samples/spring-music
$cd ./spring-music
$cf login -a api.local.pcfdev.io --skip-ssl-validation
API endpoint: api.local.pcfdev.io

Email> user

Password> pass
Authenticating...
OK

Targeted org pcfdev-org

Targeted space pcfdev-space


                
API endpoint:   https://api.local.pcfdev.io (API version: 2.65.0)
User:           user
Org:            pcfdev-org
Space:          pcfdev-space

$./gradlew assemble
$cf push --hostname spring-music

```
在浏览器中访问app。

```
requested state: started
instances: 1/1
usage: 512M x 1 instances
urls: spring-music.local.pcfdev.io
```

**查看日志**

PCF提供应用的日志聚合功能，你可以查看HTTP请求、对应用操作时候的output，如扩容、重启等。

每行日志中都包括如下信息：

- Timestamp
- Log type
- Channel
- Message

查看刚才那个应用的日志信息：

查看最近输出：

```
$cf logs spring-music --recent
```

查看实时输出流：

```
$cf logs spring-music
```

