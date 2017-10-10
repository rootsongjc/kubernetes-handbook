---
date: "2017-03-10T11:51:09+08:00"
title: "Contiv入坑指南-v2plugin"
draft: false
categories: "docker"
tags: ["docker","network","sdn"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20161022082.jpg", desc: "上海交通大学 Oct 22,2016"}]
---

继续趟昨天挖的坑。

昨天的[issue-776](https://github.com/contiv/netplugin/issues/776)已经得到@gkvijay的回复，原来是因为没有安装contiv/v2plugin的缘故，所以create contiv network失败，我需要自己build一个**docker plugin**。

查看下这个[commit](https://github.com/contiv/netplugin/commit/8afd1b7718c8424a876760d18484124e0aad3557)里面有build **v2plugin**的脚本更改，所以直接调用以下命令就可以build自己的v2plugin。

前提你需要先build出`netctl`、`netmaster`、`netplugin`三个二进制文件并保存到**bin**目录下，如果你没自己build直接下载**release**里面的文件保存进去也行。

### 编译v2plugin插件

**修改config.json插件配置文件**

```Json
{
    "manifestVersion": "v0",
    "description": "Contiv network plugin for Docker",
    "documentation": "https://contiv.github.io",
    "entrypoint": ["/startcontiv.sh"],
    "network": {
           "type": "host"
    },
    "env": [
       {
          "Description": "To enable debug mode, set to '-debug'",
          "Name": "dbg_flag",
          "Settable": [
             "value"
          ],
          "Value": "-debug"
       },
       {
          "Description": "VLAN uplink interface used by OVS",
          "Name": "iflist",
          "Settable": [
             "value"
          ],
          "Value": ""
       },
       {
          "Description": "Etcd or Consul cluster store url",
          "Name": "cluster_store",
          "Settable": [
             "value"
          ],
          "Value": "etcd://172.20.0.113:2379"
       },
       {
          "Description": "Local IP address to be used by netplugin for control communication",
          "Name": "ctrl_ip",
          "Settable": [
             "value"
          ],
          "Value": "none"
       },
       {
          "Description": "Local VTEP IP address to be used by netplugin",
          "Name": "vtep_ip",
          "Settable": [
             "value"
          ],
          "Value": "none"
       },
       {
          "Description": "In 'master' role, plugin runs netmaster and netplugin",
          "Name": "plugin_role",
          "Settable": [
             "value"
          ],
          "Value": "master"
       },
       {
          "Description": "Netmaster url to listen http requests on",
          "Name": "listen_url",
          "Settable": [
             "value"
          ],
          "Value": "172.20.0.113:9999"
       },
       {
          "Description": "Network Driver name for requests to dockerd. Should be same as name:tag of the plugin",
          "Name": "plugin_name",
          "Settable": [
             "value"
          ],
          "Value": "contiv/v2plugin:latest"
       }
    ],
    "mounts": [
       {
          "type": "bind",
          "options": ["rbind"],
          "source": "/etc/openvswitch",
          "destination": "/etc/openvswitch"
       },
       {
          "type": "bind",
          "options": ["rbind"],
          "source": "/var/log/openvswitch",
          "destination": "/var/log/openvswitch"
       },
       {
          "type": "bind",
          "options": ["rbind"],
          "source": "/var/run",
          "destination": "/var/run"
       },
       {
          "type": "bind",
          "options": ["rbind"],
          "source": "/lib/modules",
          "destination": "/lib/modules"
       }
    ],
    "interface" : {
          "types": ["docker.networkdriver/1.0", "docker.ipamdriver/1.0"],
          "socket": "netplugin.sock"
    },
    "Linux": {
          "Capabilities": ["CAP_SYS_ADMIN", "CAP_NET_ADMIN", "CAP_SYS_MODULE"]
    }
}
```

[关于**docker plugin v2**配置文件的说明](https://github.com/docker/docker/blob/master/docs/extend/config.md)

**方法一**

自动化make

```bash
$make host-pluginfs-create
```

**方法二**

直接调用Makefile里指定的那个shell脚本`scripts/v2plugin_rootfs.sh`。

```Shell
$bash scripts/v2plugin_rootfs
Creating rootfs for v2plugin ,
sed: 1: "install/v2plugin/config ...": command i expects \ followed by text
Sending build context to Docker daemon 73.94 MB
Step 1/5 : FROM alpine:3.5
 ---> 4a415e366388
Step 2/5 : MAINTAINER Cisco Contiv (http://contiv.github.io/)
 ---> Running in fada1677341b
 ---> f0440792dff6
Removing intermediate container fada1677341b
Step 3/5 : RUN mkdir -p /run/docker/plugins /etc/openvswitch /var/run/contiv/log     && echo 'http://dl-cdn.alpinelinux.org/alpine/v3.4/main' >> /etc/apk/repositories     && apk update && apk add openvswitch=2.5.0-r0 iptables
 ---> Running in 2ae2fbee6834
fetch http://dl-cdn.alpinelinux.org/alpine/v3.5/main/x86_64/APKINDEX.tar.gz
fetch http://dl-cdn.alpinelinux.org/alpine/v3.5/community/x86_64/APKINDEX.tar.gz
fetch http://dl-cdn.alpinelinux.org/alpine/v3.4/main/x86_64/APKINDEX.tar.gz
v3.5.2-3-g3649125268 [http://dl-cdn.alpinelinux.org/alpine/v3.5/main]
v3.5.1-71-gc7bb9a04f0 [http://dl-cdn.alpinelinux.org/alpine/v3.5/community]
v3.4.6-81-g1f1f409 [http://dl-cdn.alpinelinux.org/alpine/v3.4/main]
OK: 13194 distinct packages available
(1/6) Installing libmnl (1.0.4-r0)
(2/6) Installing libnftnl-libs (1.0.7-r0)
(3/6) Installing iptables (1.6.0-r0)
(4/6) Installing libcrypto1.0 (1.0.2k-r0)
(5/6) Installing libssl1.0 (1.0.2k-r0)
(6/6) Installing openvswitch (2.5.0-r0)
Executing busybox-1.25.1-r0.trigger
OK: 19 MiB in 17 packages
 ---> b130141ad660
Removing intermediate container 2ae2fbee6834
Step 4/5 : COPY netplugin netmaster netctl startcontiv.sh /
 ---> 2b88b2f8e5e7
Removing intermediate container d7580a394c64
Step 5/5 : ENTRYPOINT /startcontiv.sh
 ---> Running in e6fc5c887cb3
 ---> 1c569e4c633d
Removing intermediate container e6fc5c887cb3
Successfully built 1c569e4c633d
Password:
03d60dc01488362156f98a062d17af7a34e4b17569c2fe4f5d2048d619860314
Untagged: contivrootfs:latest
Deleted: sha256:1c569e4c633d27bd3e79d9d30b2825ce57452d30f90a3452304b932835331b13
Deleted: sha256:2b88b2f8e5e7bae348bf296f6254662c1d444760db5acd1764b9c955b106adad
Deleted: sha256:b60594671dc9312bf7ba73bf17abb9704d2b0d0e802c0d990315c5b4a5ca11fe
Deleted: sha256:b130141ad660d4ee291d9eb9a1e0704c4bc009fc91a73de28e8fd110aa45c481
Deleted: sha256:ab3c02d5a171681ba00d27f2c456cf8b63eeeaf408161dc84d9d89526d0399de
Deleted: sha256:f0440792dff6a89e321cc5d34ecaa21b4cb993f0c4e4df6c2b04eef8878bb471
```

> 创建镜像这一步需要输入你的docker hub密码。而且alpine下载软件需要翻墙的。打包v2plugin目录需要使用sudo，不然会报一个错。

整个插件打包压缩后的大小是91M。现在`rootfs`和`config.json`都已经有了，就可以在你自己的系统上create docker plugin了。

## 启动contiv plugin

创建docker network plugin并enable。

```Shell
$docker plugin create contiv/v2plugin .
contiv/v2plugin
$docker plugin enable contiv/v2plugin
$docker plugin ls
ID                  NAME                     DESCRIPTION                        ENABLED
574d4a4d82a3        contiv/v2plugin:latest   Contiv network plugin for Docker   true
```

至此*contiv plugin*已经创建好了，enable后执行`ip addr`命令可以看到多出一个网络*contivh0*。

```bash
contivh0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UNKNOWN qlen 1000
link/ether 02:02:ac:13:ff:fe brd ff:ff:ff:ff:ff:ff
inet 172.19.255.254/16 scope global contivh0
	valid_lft forever preferred_lft forever
```

且主机多了一个IP地址*172.19.255.254*。

> 不需要再主机上安装`netctl`、`netmaster`、`netplugin`这几个二进制文件了，只需要安装`docker plugin`即可，这些都已经封装到plugin中了，如果你看下插件的目录结构就知道了。

因为插件安装的问题，目前我测试机上的自定义插件都无法使用，正在troubleshooting中，一旦有进展会及时更新该文档。

另外正在同步跟开发者沟通中，因为时差问题，下周一才能有结果。😪
