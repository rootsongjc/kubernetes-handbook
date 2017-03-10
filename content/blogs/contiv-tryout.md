+++
date = "2017-03-09T14:23:04+08:00"
title = "Contiv人坑指南-试用全记录"
draft = false
Tags = ["contiv","docker","docker plugin","network","cisco","sdn"]

+++

![黄昏](http://olz1di9xf.bkt.clouddn.com/2017013129.jpg)

*(题图：北纬37度黄海之滨风力发电场，冬天的大风持续给人类提供清洁的能源）*

关于contiv的介绍请看我的上一篇文章[Contiv Intro](http://rootsongjc.github.io/post/contiv_guide/)。

开发环境使用**Vagrant**搭建，昨天试用了下，真不知道它们是怎么想的，即然是docker插件为啥不直接在docker中开发呢，我有篇文章介绍[如何搭建docker开发环境](http://rootsongjc.github.io/post/docker-dev-env/)，可以在docker中开发docker，当然也可以用来开发contiv啊😄，只要下载一个docker镜像`dockercore/docker:latest`即可，不过有点大2.31G，使用阿里云的mirror下载倒是也划算，总比你自己部署一个开发环境节省时间。

### Contiv概念解析

Contiv用于给容器创建和分配网路，可以创建策略管理容器的安全、带宽、优先级等，相当于一个SDN。

#### Group

按容器或Pod的功能给容器分配策略组，通常是按照容器/Pod的`label`来分组，应用组跟contiv的network不是一一对应的，可以很多应用组属于同一个network或IP subnet。

#### Polices

用来限定group的行为，contiv支持两种类型的policy：

- Bandwidth 限定应用组的资源使用上限
- Isolation 资源组的访问权限

Group可以同时应用一个或多个policy，当有容器调度到该group里就会适用该group的policy。

#### Network

IPv4或IPv6网络，可以配置subnet和gateway。

**Contiv中的网络**

在contiv中可以配置两种类型的网络

- application network：容器使用的网络
- infrastructure network：host namespace的虚拟网络，比如基础设施监控网络

**网络封装**

Contiv中有两种类型的网络封装

- Routed：overlay topology和L3-routed BGP topology
- Bridged：layer2 VLAN

#### Tenant

Tenant提供contiv中的namespace隔离。一个tenant可以有很多个network，每个network都有个subnet。该tenant中的用户可以使用它的任意network和subnet的IP。

物理网络中的tenant称作`虚拟路由转发(VRF)`。Contiv使用VLAN和VXLAN ID来实现外部网络访问，这取决你使用的是layer2、layer3还是Cisco ACI。

### Contiv下载

Contiv的编译安装比较复杂，我们直接下载github上的[release-1.0.0-beta.3-03-08-2017.18-51-20.UTC]([1.0.0-beta.3-03-08-2017.18-51-20.UTC](https://github.com/contiv/netplugin/releases/tag/1.0.0-beta.3-03-08-2017.18-51-20.UTC))文件解压获得二进制文件安装。

> https://github.com/contiv/install/blob/master/README.md这个官方文档已经过时，不要看了。

如果试用可以的话，我会后续写contiv开发环境搭建的文章。

这个release是2017年3月8日发布的，就在我写这篇文章的前一天。有个**最重要的更新**是<u>支持docker1.13 swarm mode</u>。

[官方安装文档](https://github.com/contiv/netplugin/blob/master/install/HowtoSetupContiv.md)

下载解压后会得到如下几个文件：

- contivk8s  k8s专用的
- contrib  文件夹，里面有个``netctl``的bash脚本
- netcontiv  这个命令就一个-version选项用来查看contiv的版本😓
- netctl  contiv命令行工具，用来配置网络、策略、服务负载均衡，[使用说明](http://contiv.github.io/documents/reference/netctlcli.html)
- netmaster  contiv的主节点服务
- netplugin

下面的安装中用到的只有netctl、netmaster和netplugin这三个二进制文件。

我们将这三个文件都copy到/usr/bin目录下。

我们在docker17.03-ce中安装contiv。

### Contiv安装依赖

Contiv依赖于consul或etcd，我们选择使用etcd，slack里的人说只支持2.3.x版本，可能不支持3.0+版本的吧，还没实际测过，先使用2.3.7。

``contiv master``启动后自动向etcd中注册信息：

```
/contiv.io/oper
/contiv.io/oper/auto-vlan
/contiv.io/oper/auto-vlan/global
/contiv.io/oper/auto-vxlan
/contiv.io/oper/auto-vxlan/global
/contiv.io/oper/global
/contiv.io/oper/global/global
/contiv.io/oper/ovs-driver
/contiv.io/oper/ovs-driver/sz-pg-oam-docker-test-001.tendcloud.com
/contiv.io/master
/contiv.io/master/config
/contiv.io/master/config/global
/contiv.io/obj
/contiv.io/obj/modeldb
/contiv.io/obj/modeldb/global
/contiv.io/obj/modeldb/global/global
/contiv.io/obj/modeldb/tenant
/contiv.io/obj/modeldb/tenant/default
/contiv.io/lock
/contiv.io/lock/netmaster
/contiv.io/lock/netmaster/leader
/contiv.io/service
/contiv.io/service/netmaster
/contiv.io/service/netmaster/172.20.0.113:9999
/contiv.io/service/netmaster.rpc
/contiv.io/service/netmaster.rpc/172.20.0.113:9001
/contiv.io/state
/contiv.io/state/auto-vlan
/contiv.io/state/auto-vlan/global
/contiv.io/state/auto-vxlan
/contiv.io/state/auto-vxlan/global
/contiv.io/state/global
/contiv.io/state/global/global
```

### Contiv启动

**启动netmaster**

```shell
$nohup netmaster -cluster-mode docker -cluster-store etcd://172.20.0.113:2379 -debug -listen-url 172.20.0.113:9999 -plugin-name netplugin &
```

为了突出netmaster命令的使用，我把所有可以使用默认值的参数都明确的写出。

``netmaster``监听9999端口。

**查看已有的contiv网络**

```
$netctl --netmaster http://172.20.0.113:9999 network ls
Tenant  Network  Nw Type  Encap type  Packet tag  Subnet   Gateway  IPv6Subnet  IPv6Gateway
------  -------  -------  ----------  ----------  -------  ------   ----------  -----------
```

为了以后执行命令方便，不用来回输入`$NETMASTER`地址，可以将其设置为环境变量

``export NETMASTER="http://172.20.0.113:9999"``

> netplugin需要使用Open vSwitch，所以你需要先安装**Open vSwitch**。否则你会遇到这个问题[netplugin issue-760](https://github.com/contiv/netplugin/issues/760)

### Open vSwitch安装

[Open vSwitch installation on CentOS7.2](http://supercomputing.caltech.edu/blog/index.php/2016/05/03/open-vswitch-installation-on-centos-7-2/)

参考上面链接里的方法。

```shell
#!/bin/bash
yum -y install make gcc openssl-devel autoconf automake rpm-build redhat-rpm-config python-devel openssl-devel kernel-devel kernel-debug-devel libtool wget
mkdir -p ~/rpmbuild/SOURCES
cp openvswitch-2.5.1.tar.gz ~/rpmbuild/SOURCES/
tar xfz openvswitch-2.5.1.tar.gz
sed 's/openvswitch-kmod, //g' openvswitch-2.5.1/rhel/openvswitch.spec > openvswitch-2.5.1/rhel/openvswitch_no_kmod.spec
rpmbuild -bb --nocheck ~/openvswitch-2.5.1/rhel/openvswitch_no_kmod.spec
```

编译好的rpm包在`~/rpmbuild/RPMS/x86_64/openvswitch-2.5.1-1.x86_64.rpm`目录下。

安装好Open vSwitch后就可以启动**netplugin**。

### 创建contiv网络

**启动netplugin**

`nohup netplugin -cluster-store etcd://172.20.0.113:2379 &`

**创建network**

`netctl --netmaster http://172.20.0.113:9999 network create --subnet=10.1.2.0/24 contiv-net`

获得以下报错：

ERRO[0000] Error response from daemon: legacy plugin netplugin of type NetworkDriver is not supported in swarm mode

但是执行第二次的时候居然成功了，不过当我查看docker network的时候根本就看不到刚刚创建的contiv-net网络。*这只是一场游戏一场梦。。。*😢

Creating network default:contiv-net

```
$netctl network ls
Tenant   Network     Nw Type  Encap type  Packet tag  Subnet       Gateway  IPv6Subnet  IPv6Gateway
------   -------     -------  ----------  ----------  -------      ------   ----------  -----------
default  contiv-net  data     vxlan       0           10.1.2.0/24  
```

查看刚创建的contiv-net网络。

```
$netctl network inspect contiv-net
Inspeting network: contiv-net tenant: default
{
  "Config": {
    "key": "default:contiv-net",
    "encap": "vxlan",
    "networkName": "contiv-net",
    "nwType": "data",
    "subnet": "10.1.2.0/24",
    "tenantName": "default",
    "link-sets": {},
    "links": {
      "Tenant": {
        "type": "tenant",
        "key": "default"
      }
    }
  },
  "Oper": {
    "availableIPAddresses": "10.1.2.1-10.1.2.254",
    "externalPktTag": 1,
    "pktTag": 1
  }
}
```

从**netmaster**日志中可以看到如下报错：

```
time="Mar  9 21:44:14.746627381" level=debug msg="NwInfra type is default, no ACI" 
time="Mar  9 21:44:14.750278056" level=info msg="Creating docker network: {CheckDuplicate:true Driver:netplugin EnableIPv6:false IPAM:0xc4204d8ea0 Internal:false Attachable:true Options:map[tenant:default encap:vxlan pkt-tag:1] Labels:map[]}" 
time="Mar  9 21:44:14.752034749" level=error msg="Error creating network contiv-net. Err: Error response from daemon: legacy plugin netplugin of type NetworkDriver is not supported in swarm mode" 
time="Mar  9 21:44:14.752067294" level=error msg="Error creating network contiv-net.default in docker. Err: Error response from daemon: legacy plugin netplugin of type NetworkDriver is not supported in swarm mode" 
time="Mar  9 21:44:14.752102735" level=error msg="Error creating network {&{Key:default:contiv-net Encap:vxlan Gateway: Ipv6Gateway: Ipv6Subnet: NetworkName:contiv-net NwType:data PktTag:0 Subnet:10.1.2.0/24 TenantName:default LinkSets:{EndpointGroups:map[] Servicelbs:map[] Services:map[]} Links:{Tenant:{ObjType: ObjKey:}}}}. Err: Error response from daemon: legacy plugin netplugin of type NetworkDriver is not supported in swarm mode" 
time="Mar  9 21:44:14.752129195" level=error msg="NetworkCreate retruned error for: &{Key:default:contiv-net Encap:vxlan Gateway: Ipv6Gateway: Ipv6Subnet: NetworkName:contiv-net NwType:data PktTag:0 Subnet:10.1.2.0/24 TenantName:default LinkSets:{EndpointGroups:map[] Servicelbs:map[] Services:map[]} Links:{Tenant:{ObjType: ObjKey:}}}. Err: Error response from daemon: legacy plugin netplugin of type NetworkDriver is not supported in swarm mode" 
time="Mar  9 21:44:14.752155973" level=error msg="CreateNetwork error for: {Key:default:contiv-net Encap:vxlan Gateway: Ipv6Gateway: Ipv6Subnet: NetworkName:contiv-net NwType:data PktTag:0 Subnet:10.1.2.0/24 TenantName:default LinkSets:{EndpointGroups:map[] Servicelbs:map[] Services:map[]} Links:{Tenant:{ObjType: ObjKey:}}}. Err: Error response from daemon: legacy plugin netplugin of type NetworkDriver is not supported in swarm mode" 
time="Mar  9 21:44:14.752172138" level=error msg="Handler for POST /api/v1/networks/default:contiv-net/ returned error: Error response from daemon: legacy plugin netplugin of type NetworkDriver is not supported in swarm mode" 
```

### 总结

从日志中看到一个令人悲痛语句的话*legacy plugin netplugin of type NetworkDriver is not supported in swarm mode*，你们昨天不是刚发的版本说已经支持swarm mode吗？[`commit-8afd1b7`](https://github.com/contiv/netplugin/commit/8afd1b7718c8424a876760d18484124e0aad3557)不是白纸黑字的写着吗？

我提了个[issue-776](https://github.com/contiv/netplugin/issues/776)，看看怎样解决这个问题，另外netplugin命令怎么用，文档上没写啊？

`netplugin -h`可以中有两个选项我不明白，不知道怎么设置，有知道的人请告诉我一声。

```
  -vlan-if value
    	VLAN uplink interface
  -vtep-ip string
    	My VTEP ip address
```

同时我会继续关注contiv的slack和github [Issue-776](https://github.com/contiv/netplugin/issues/776)的进展。