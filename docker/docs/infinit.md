# Infinit 

安装文档[https://infinit.sh/get-started/linux#linux-tarball-install](https://infinit.sh/get-started/linux#linux-tarball-install)

下载压缩包[https://storage.googleapis.com/sh_infinit_releases/linux64/Infinit-x86_64-linux_debian_oldstable-gcc4-0.7.2.tbz](https://storage.googleapis.com/sh_infinit_releases/linux64/Infinit-x86_64-linux_debian_oldstable-gcc4-0.7.2.tbz)

**Infinit还有发布1.0版本，跟他们团队沟通过，好不容易实现了分布式存储，infinit的概念非常好，被docker看中也是有原因的，但是目前使用很不便，严重依赖手敲命令行，user、volume、network的security实在是麻烦，昨天使用的时候在最后一步挂载到docker volume的时候居然还需要联网。给他们提了两个bug，团队去过圣诞假期了，明年1月底才可能发新版本，被docker收购后，发展前景不明.**

**2017-01-04**

**infinit daemon启动的时候--as指定用户后，在挂载docker volume plugin的时候还是需要到Hub上查找用户，这个问题会在下个版本解决。**

依赖fuse，使用yum install -y fuse*安装

解压到/usr/local目录下，

ln -s Infinit-x86_64-linux_debian_oldstable-gcc4-0.7.2 /usr/local/infinit

**172.20.0.113****:root****@****sz-pg-oam-docker-test-001**:/usr/local/infinit]# INFINIT_DATA_HOME=$PWD/share/infinit/filesystem/test/home/ INFINIT_STATE_HOME=/tmp/infinit-demo/ bin/infinit-volume --mount --as demo --name infinit/demo --mountpoint ~/mnt-demo --publish --cache

bin/infinit-volume: /lib64/libc.so.6: version `**GLIBC_2.18**' not found (required by /usr/local/Infinit-x86_64-linux_debian_oldstable-gcc4-0.7.2/bin/../lib/libstdc++.so.6)

CentOS7.2.1511的使用源码安装的时候glibc版本太低，无法使用。

官网上使用的是ubuntu安装，ubuntu的glibc版本比较新，而CentOS比较旧，启动报错。

在Slack上跟人要了个rpm，下载地址：[https://infinit.io/_/37aDi9h#](https://infinit.io/_/37aDi9h#)

Docker镜像地址：[https://hub.docker.com/r/mefyl/infinit](https://hub.docker.com/r/mefyl/infinit)

使用RPM包安装即可，默认安装目录在/opt/infinit下

quick-start文档：[https://infinit.sh/get-started](https://infinit.sh/get-started)

详细参考文档：[https://infinit.sh/documentation/reference](https://infinit.sh/documentation/reference)

slack地址：infinit-sh.slack.com

设置环境变量

**export** LC_ALL=en_US.UTF-8

**创建用户**

虽然可以安装不过需要注册用户才能使用，infinit使用的时候会连接到Internet。

设置环境变量INFINIT_CRASH_REPORTER=0就不会再连接Hub。

create的用户信息会保存在

/opt/infinit/.local

infinit-user --create --name "alice"

**创建网络**

infinit-network --create --as alice --storage local --name my-network 

查看网络

infinit-network --list --as alice

启动网络

**infinit**-network --run --daemon --as alice --name my-network --port 11928

必须制定用户，否则会查看root用户的网络，-~~as alice必须放在~~-list动作后面

不要加上--push，否则会push到hub上，又需要连接到网络

创建volume

infinit-volume --create --as alice --network my-network --name my-volume

挂载volume

infinit-volume --mount --as alice --name my-volume --mountpoint ~/mnt-alice-volume --allow-root-creation --async --cache --port 11928

我随意指定的一个端口

不要使用--publish，否则会向Hub注册endpoint

导出user、network、volume

infinit-user --export --as  alice --full>alice

infinit-network --export --name my-network --as alice --output my-network

infinit-volume --export --name my-volume --as alice --output my-volume

Device B

导入user、network、volume

infinit-user --import -i alice

infinit-network --import -i my-network

infinit-volume --import -i my-volume

link网络

infinit-network --link --name my-network --as alice

查看网络信息

infinit-journal --stat --network alice/my-network --as alice

挂载volume

infinit-volume --mount --as alice --name my-volume --mountpoint ~/mnt-alice-volume --allow-root-creation --async --cache --peer server_ip:11928

目前状况：B节点无法连接到A

