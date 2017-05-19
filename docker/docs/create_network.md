# 如何创建docker network？

容器的跨主机网络访问是docker容器集群的基础，我们之前使用的[Shrike](github.com/talkingdata/shrike)实现二层网络，能够使不同主机中的容器和主机的网络互联互通，使容器看上去就像是虚拟机一样，这样做的好处是可以不变动已有的服务，将原有的应用直接封装成一个image启动即可，但这也无法利用上docker1.12+后的service、stack等服务编排、负载均衡、服务发现等功能。我们在此讨论容器的网络模式，暂且忽略自定义网络，会在后面单独谈论它。

## Swarm中已有的network##

安装好docker并启动swarm集群后，会在集群的每个node中找到如下network：

| NETWORK ID         | NAME            | DRIVER       | SCOPE       |
| ------------------ | --------------- | ------------ | ----------- |
| b1d5859a9439       | bridge          | bridge       | local       |
| 262ec8634832       | docker_gwbridge | bridge       | local       |
| 19c11140a610       | host            | host         | local       |
| tx49ev228p5l       | ingress         | overlay      | swarm       |
| ~~*c7d82cbc5a33*~~ | ~~*mynet*~~     | ~~*bridge*~~ | ~~*local*~~ |
| e1a59cb1dc34       | none            | null         | local       |

**(注)**mynet是我们自定义的本地网络，我们暂时不用它，因为我们是以swarm集群模式使用docker，暂时不考虑本地网络；docker_gwbridge作为docker gateway网络，功能比较特殊，负责service的负载均衡和服务发现。

**有两种方式来创建docker network：**

- 使用docker network create命令来创建，只能创建docker内建的网络模式
- 使用docker plugin，创建自定义网络

## 使用docker命令创建网络##

**Docker中内置的网络模式包括如下几种:**

- bridge 我们基于该网络模式创建了mynet网络
- host 本地网络模式
- macvlan 这个模式貌似是最新加的
- null 无网络
- overlay 用于swarm集群中容器的跨主机网络访问

**docker create network命令包含以下参数：**

```
Flag shorthand -h has been deprecated, please use --help

Usage:	docker network create [OPTIONS] NETWORK

Create a network

Options:
      --attachable             Enable manual container attachment
      --aux-address map        Auxiliary IPv4 or IPv6 addresses used by Network driver (default map[])
  -d, --driver string          Driver to manage the Network (default "bridge")
      --gateway stringSlice    IPv4 or IPv6 Gateway for the master subnet
      --help                   Print usage
      --internal               Restrict external access to the network
      --ip-range stringSlice   Allocate container ip from a sub-range
      --ipam-driver string     IP Address Management Driver (default "default")
      --ipam-opt map           Set IPAM driver specific options (default map[])
      --ipv6                   Enable IPv6 networking
      --label list             Set metadata on a network (default [])
  -o, --opt map                Set driver specific options (default map[])
      --subnet stringSlice     Subnet in CIDR format that represents a network segment
```

创建overlay模式的全局网络，我们可以看到新创建的mynet1的scope是swarm，即集群范围可见的。

```shell
172.18.0.1:root@sz-pg-oam-docker-test-001:/root]# docker network create -d overlay mynet1
x81fu4ohqot2ufbpoa2u8vyx3
172.18.0.1:root@sz-pg-oam-docker-test-001:/root]# docker network ls
NETWORK ID          NAME                DRIVER              SCOPE
ad3023f6d324        bridge              bridge              local
346c0fe30055        crane_default       bridge              local
4da289d8e48a        docker_gwbridge     bridge              local
3d636dff00da        host                host                local
tx49ev228p5l        ingress             overlay             swarm
x81fu4ohqot2        mynet1              overlay             swarm
cc14ee093707        none                null                local
172.18.0.1:root@sz-pg-oam-docker-test-001:/root]# docker network inspect mynet1
[
    {
        "Name": "mynet1",
        "Id": "x81fu4ohqot2ufbpoa2u8vyx3",
        "Created": "0001-01-01T00:00:00Z",
        "Scope": "swarm",
        "Driver": "overlay",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": []
        },
        "Internal": false,
        "Attachable": false,
        "Containers": null,
        "Options": {
            "com.docker.network.driver.overlay.vxlanid_list": "4097"
        },
        "Labels": null
    }
]

```

注意，overlay模式的网络只能在swarm的manager节点上创建，如果在work节点上创建overlay网络会报错：

```shell
172.18.0.1:root@sz-pg-oam-docker-test-002:/root]# docker network create -d overlay mynet1
Error response from daemon: Cannot create a multi-host network from a worker node. Please create the network from a manager node.
```

如果不使用-d指定driver将默认创建本地bridge网络。

## 自定义网络##

创建自定义网络需要设置网络的driver和ipam。

TDB

创建网络需要满足的需求

写一个创建自定义网络的例子

[一步步教你创建一个自定义网络](create_network_step_by_step.md)

