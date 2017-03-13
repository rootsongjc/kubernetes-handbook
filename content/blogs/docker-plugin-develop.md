+++
date = "2017-03-10T14:23:26+08:00"
title = "Docker插件开发-sshfs示例"
draft = false
Tags = ["docker","docker plugin"]

+++

![杭州吴山](http://olz1di9xf.bkt.clouddn.com/20161016022.jpg)

*（题图：杭州吴山步道旁的墙壁 Oct 16,2016）*

> 当你看到这篇文章时，如果你也正在进行docker1.13+版本下的plugin开发，恭喜你也入坑了，如果你趟出坑，麻烦告诉你的方法，感恩不尽🙏

### Docker plugin开发文档

首先docker官方给出了一个[docker legacy plugin文档](https://docs.docker.com/engine/extend/legacy_plugins/)，这篇文章基本就是告诉你docker目前支持哪些插件，罗列了一系列连接，不过对不起，这些不是docker官方插件，有问题去找它们的开发者去吧😂

真正要开发一个docker plugin还是得看[docker plugin API](https://docs.docker.com/engine/extend/plugin_api/)，这篇文档告诉我们：

#### 插件发现

当你开发好一个插件**docker engine**怎么才能发现它们呢？有三种方式：

- **.sock**，linux下放在/run/docker/plugins目录下，或该目录下的子目录比如[flocker](https://github.com/ClusterHQ/flocker)插件的`.sock`文件放在`/run/docker/plugins/flocker/flocker.sock`下
- **.spec**，比如**convoy**插件在`/etc/docker/plugins/convoy.spec `定义，内容为`unix:///var/run/convoy/convoy.sock`
- **.json**，比如**infinit**插件在`/usr/lib/docker/plugins/infinit.json `定义，内容为`{"Addr":"https://infinit.sh","Name":"infinit"}`

文章中的其它部分**貌似都过时**了，新的插件不是作为**systemd**进程运行的，而是完全通过**docker plugin**命令来管理的。

当你使用**docker plugin enable <plugin_name>**来激活了插件后，理应在`/run/docker/plugins`目录下生成插件的`.sock`文件，但是现在只有一个以runc ID命名的目录，这个问题下面有详细的叙述过程，你也可以跳过，直接看[issue-31723](https://github.com/docker/docker/issues/31723)

[docker plugin管理](https://docs.docker.com/engine/extend/)

### 创建sshfs volume plugin

[官方示例文档](https://github.com/docker/docker/blob/17.03.x/docs/extend/index.md#developing-a-plugin)

官方以开发一个**sshfs**的volume plugin为例。

```
$ git clone https://github.com/vieux/docker-volume-sshfs
$ cd docker-volume-sshfs
$ go get github.com/docker/go-plugins-helpers/volume
$ go build -o docker-volume-sshfs main.go  
$ docker build -t rootfsimage .
$ id=$(docker create rootfsimage true) # id was cd851ce43a403 when the image was created
$ sudo mkdir -p myplugin/rootfs
$ sudo docker export "$id" | sudo tar -x -C myplugin/rootfs
$ docker rm -vf "$id"
$ docker rmi rootfsimage
```

我们可以看到**sshfs**的Dockerfile是这样的：

```Dockerfile
FROM alpine

RUN apk update && apk add sshfs

RUN mkdir -p /run/docker/plugins /mnt/state /mnt/volumes

COPY docker-volume-sshfs docker-volume-sshfs

CMD ["docker-volume-sshfs"]
```

实际上是讲编译好的可执行文件复制到alpine linux容器中运行。

编译rootfsimage镜像的过程。

```
docker build -t rootfsimage .
Sending build context to Docker daemon 11.71 MB
Step 1/5 : FROM alpine
 ---> 4a415e366388
Step 2/5 : RUN apk update && apk add sshfs
 ---> Running in 1551ecc1c847
fetch http://dl-cdn.alpinelinux.org/alpine/v3.5/main/x86_64/APKINDEX.tar.gz
fetch http://dl-cdn.alpinelinux.org/alpine/v3.5/community/x86_64/APKINDEX.tar.gz
v3.5.2-2-ge626ce8c3c [http://dl-cdn.alpinelinux.org/alpine/v3.5/main]
v3.5.1-71-gc7bb9a04f0 [http://dl-cdn.alpinelinux.org/alpine/v3.5/community]
OK: 7959 distinct packages available
(1/10) Installing openssh-client (7.4_p1-r0)
(2/10) Installing fuse (2.9.7-r0)
(3/10) Installing libffi (3.2.1-r2)
(4/10) Installing libintl (0.19.8.1-r0)
(5/10) Installing libuuid (2.28.2-r1)
(6/10) Installing libblkid (2.28.2-r1)
(7/10) Installing libmount (2.28.2-r1)
(8/10) Installing pcre (8.39-r0)
(9/10) Installing glib (2.50.2-r0)
(10/10) Installing sshfs (2.8-r0)
Executing busybox-1.25.1-r0.trigger
Executing glib-2.50.2-r0.trigger
OK: 11 MiB in 21 packages
 ---> 1a73c501f431
Removing intermediate container 1551ecc1c847
Step 3/5 : RUN mkdir -p /run/docker/plugins /mnt/state /mnt/volumes
 ---> Running in 032af3b2595a
 ---> 30c7e8463e96
Removing intermediate container 032af3b2595a
Step 4/5 : COPY docker-volume-sshfs docker-volume-sshfs
 ---> a924c6fcc1e4
Removing intermediate container ffc5e3c97707
Step 5/5 : CMD docker-volume-sshfs
 ---> Running in 0dc938fe4f4e
 ---> 0fd2e3d94860
Removing intermediate container 0dc938fe4f4e
Successfully built 0fd2e3d94860
```

编写``config.json``文档

```Json
{
    "description": "sshFS plugin for Docker",
    "documentation": "https://docs.docker.com/engine/extend/plugins/",
    "entrypoint": ["/go/bin/docker-volume-sshfs"],
    "network": {
           "type": "host"
           },
    "interface" : {
           "types": ["docker.volumedriver/1.0"],
           "socket": "sshfs.sock"
    },
    "linux": {
        "capabilities": ["CAP_SYS_ADMIN"]
    }
}
```

该插件使用host网络类型，使用/run/docker/plugins/sshfs.sock接口与docker engine通信。

**创建plugin**

使用``docker plugin create <plugin_name> /path/to/plugin/data/``命令创建插件。

具体到sshfs插件，在myplugin目录下使用如下命令创建插件：

```shell
docker plugin create jimmysong/sshfs:latest .
```

现在就可以看到刚创建的插件了

```
docker plugin ls
ID                  NAME                 DESCRIPTION               ENABLED
8aa1f6098fca        vieux/sshfs:latest   sshFS plugin for Docker   true
```

**push plugin**

先登录你的docker hub账户，然后使用``docker plugin push jimmysong/sshfs:latest``即可以推送docker plugin到docker hub中。

目前推送到**harbor**镜像仓库有问题，报错信息：

```
c08c951b53b7: Preparing 
denied: requested access to the resource is denied
```

已给harbor提[issue-1532](https://github.com/vmware/harbor/issues/1532)

**plugin的使用**

有发现了个问题[docker issue-31723](https://github.com/docker/docker/issues/31723)，使用plugin创建volume的时候居然找不到`sshfs.sock`文件！😢刚开始手动创建plugin的时候测试了下是正常的，不知道为啥弄到这台测试机器上出问题了。

