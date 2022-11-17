---
title: "Istio Ambient 模式中的透明流量劫持四层网络路由路径详解"
description: "本文以图示和实际操作的形式详细介绍了 Ambient Mesh 中的透明流量劫持和四层（L4）流量路径。"
date: 2022-11-14T22:09:40+08:00
draft: false
tags: ["Istio","Ambient Mesh","ztunnel","Envoy"]
categories: ["Istio"]
type: "post"
image: "images/banner/ambient-l4.jpg"
---

本文通过动手操作，带领读者一步步了解 Istio ambient 模式中的四层流量路径。如果你还不了解什么是 Ambient 模式，以下文章可以帮助你了解：

- [关于 Istio 推出 Ambient 数据平面模式的看法](/blog/istio-ambient-mode/)
- [Istio 无 sidecar 代理数据平面 ambient 模式简介](https://lib.jimmysong.io/blog/introducing-ambient-mesh/)
- [Istio 服务网格 ambient 模式安全详解](https://lib.jimmysong.io/blog/ambient-security/)
- [什么是 Ambient Mesh，它与 sidecar 模式有什么区别？](https://lib.jimmysong.io/blog/what-is-ambient-mesh/)

如果你想略过实际动手步骤，只是想知道 Ambient 模式中的四层流量路径，请看下面服务 A 的一个 Pod 访问不同节点上服务 B 的 Pod 的四层流量路径图。

![Ambient 模式中的四层流量路径](ambient-mesh-l4-traffic-path.svg)

## 原理 {#principles}

Ambient 模式使用 **tproxy** 和 **HBONE** 这两个关键技术实现透明流量劫持和路由的：

- 使用 tproxy 将主机 Pod 中的流量劫持到 Ztunnel（Envoy Proxy）中，实现透明流量劫持；
- 使用 HBONE 建立在 Ztunnel 之间传递 TCP 数据流隧道；

### 什么是 tproxy？{#what-is-tproxy}

`tproxy` 是 Linux 内核自 2.2 版本以来支持的透明代理（Transparent proxy），其中的 t 代表 transparent，即透明。你需要在内核配置中启用 `NETFILTER_TPROXY` 和策略路由。通过 tproxy，Linux 内核就可以作为一个路由器，将数据包重定向到用户空间。详见 [tproxy 文档](http://lxr.linux.no/linux+v3.10/Documentation/networking/tproxy.txt) 。

### 什么是 HBONE？{#what-is-hbone}

HBONE 是 HTTP-Based Overlay Network Environment 的缩写，是一种使用 HTTP 协议提供隧道能力的方法。客户端向 HTTP 代理服务器发送 HTTP CONNECT 请求（其中包含了目的地址）以建立隧道，代理服务器代表客户端与目的地建立 TCP 连接，然后客户端就可以通过代理服务器透明的传输 TCP 数据流到目的服务器。在 Ambient 模式中，Ztunnel（其中的 Envoy）实际上是充当了透明代理，它使用 [Envoy Internal Listener](https://www.envoyproxy.io/docs/envoy/latest/configuration/other_features/internal_listener) 来接收 HTTP CONNECT 请求和传递 TCP 流给上游集群。

## 环境说明 {#environment}

在开始动手操作之前，需要先说明一下笔者的演示环境，本文中对应的对象名称：

| 代号           | 名称                                         | IP            |
| -------------- | -------------------------------------------- | ------------- |
| 服务 A Pod     | sleep-5644bdc767-2dfg7                       | 10.4.4.19     |
| 服务 B Pod     | productpage-v1-5586c4d4ff-qxz9f              | 10.4.3.20     |
| Ztunnel A Pod  | ztunnel-rts54                                | 10.4.4.18     |
| Ztunnel B Pod  | ztunnel-z4qmh                                | 10.4.3.14     |
| 节点 A         | gke-jimmy-cluster-default-pool-d5041909-d10i | 10.168.15.222 |
| 节点 B         | gke-jimmy-cluster-default-pool-d5041909-c1da | 10.168.15.224 |
| 服务 B Cluster | productpage                                  | 10.8.14.226   |

注意：因为这些名称将在后续的命令行中用到，文中将使用代称，以便你在自己的环境中实验。

笔者在 GKE 中安装了 Ambient 模式的 Istio，请参考[该步骤](/blog/istio-ambient-mode/#setup)安装，注意不要安装 Gateway，以免启用 L7 功能，否则流量路径将于 L4 流量不同。

下面我们将动手实验，深入探究 `sleep` 服务的 Pod 访问不同节点上 `productpage` 服务的 Pod 的四层流量路径。我们将分别检视 Pod 的 outbound 和 inbound 流量。

## Outbound 流量劫持 {#outbound}

Ambient mesh 的 pod 出站流量的透明流量劫持流程如下：

1. Istio CNI 在节点上创建 `istioout` 网卡和 iptables 规则，将 Ambient mesh 中的 Pod IP 加入 [IP 集](https://ipset.netfilter.org/)，并通过 netfilter `nfmark` 标记和路由规则，将 Ambient mesh 中的出站流量通过 Geneve 隧道透明劫持到 `pistioout` 虚拟网卡；
2. ztunnel 中的 init 容器创建 iptables 规则，将 `pistioout` 网卡中的所有流量转发到 ztunnel 中的 Envoy 代理的 15001 端口；
3. Envoy 对数据包进行处理，并与上游端点建立 HBONE 隧道（HTTP CONNECT），将数据包转发到上游。

### 检查节点 A 上的路由规则 {#node-a-rules}

登录到服务 A 所在的节点 A，使用 `iptables-save` 查看规则：

{{<highlight bash "linenos=table,hl_lines=3 4 6 35">}}
$ iptables-save
/* 省略 */
-A PREROUTING -j ztunnel-PREROUTING
-A PREROUTING -m comment --comment "kubernetes service portals" -j KUBE-SERVICES
-A ztunnel-POSTROUTING -m mark --mark 0x100/0x100 -j ACCEPT
-A ztunnel-PREROUTING -m mark --mark 0x100/0x100 -j ACCEPT
/* 省略 */
*mangle
/* 省略 */
-A PREROUTING -j ztunnel-PREROUTING
-A INPUT -j ztunnel-INPUT
-A FORWARD -j ztunnel-FORWARD
-A OUTPUT -j ztunnel-OUTPUT
-A OUTPUT -s 169.254.169.254/32 -j DROP
-A POSTROUTING -j ztunnel-POSTROUTING
-A ztunnel-FORWARD -m mark --mark 0x220/0x220 -j CONNMARK --save-mark --nfmask 0x220 --ctmask 0x220
-A ztunnel-FORWARD -m mark --mark 0x210/0x210 -j CONNMARK --save-mark --nfmask 0x210 --ctmask 0x210
-A ztunnel-INPUT -m mark --mark 0x220/0x220 -j CONNMARK --save-mark --nfmask 0x220 --ctmask 0x220
-A ztunnel-INPUT -m mark --mark 0x210/0x210 -j CONNMARK --save-mark --nfmask 0x210 --ctmask 0x210
-A ztunnel-OUTPUT -s 10.4.4.1/32 -j MARK --set-xmark 0x220/0xffffffff
-A ztunnel-PREROUTING -i istioin -j MARK --set-xmark 0x200/0x200
-A ztunnel-PREROUTING -i istioin -j RETURN
-A ztunnel-PREROUTING -i istioout -j MARK --set-xmark 0x200/0x200
-A ztunnel-PREROUTING -i istioout -j RETURN
-A ztunnel-PREROUTING -p udp -m udp --dport 6081 -j RETURN
-A ztunnel-PREROUTING -m connmark --mark 0x220/0x220 -j MARK --set-xmark 0x200/0x200
-A ztunnel-PREROUTING -m mark --mark 0x200/0x200 -j RETURN
-A ztunnel-PREROUTING ! -i veth300a1d80 -m connmark --mark 0x210/0x210 -j MARK --set-xmark 0x40/0x40
-A ztunnel-PREROUTING -m mark --mark 0x40/0x40 -j RETURN
-A ztunnel-PREROUTING ! -s 10.4.4.18/32 -i veth300a1d80 -j MARK --set-xmark 0x210/0x210
-A ztunnel-PREROUTING -m mark --mark 0x200/0x200 -j RETURN
-A ztunnel-PREROUTING -i veth300a1d80 -j MARK --set-xmark 0x220/0x220
-A ztunnel-PREROUTING -p udp -j MARK --set-xmark 0x220/0x220
-A ztunnel-PREROUTING -m mark --mark 0x200/0x200 -j RETURN
-A ztunnel-PREROUTING -p tcp -m set --match-set ztunnel-pods-ips src -j MARK --set-xmark 0x100/0x100
{{</highlight>}}

iptables 规则说明：

- 第 3 行：PREROUTING 链是最先运行的，所有数据包将先进入 `ztunnel-PREROUTING` 链；
- 第 4 行：将数据包发往 `KUBE-SERVICES` 链，在那里将 Kubernetes Service 的 Cluster IP 进行 DNAT 转换为 Pod IP；
- 第 6 行：带有 `0x100/0x100` 标记的数据包通过 PREROUTING 链，不再经过 `KUBE-SERVICES` 链；
- 第 35 行：这是添加到 `ztunnel-PREROUTING` 链上的最后一条规则，进入 `ztunnel-PREROUTING` 链中的在 `ztunnel-pods-ips` IP 集中的所有 TCP 数据包都会被打上 `0x100/0x100` 的标记，它将覆盖前面的所有标记；

{{<callout note "关于 iptables 设置 mark 和 xmark 标记">}}

`MARK` 这个扩展目标可以用来给数据包打标记，标记分两种：一种是用于标记链接的 `ctmark`，一种是用于标记数据包的 `nfmark` 。`nfmark`占四个字节共 32 位，我们可以把它看成是一个长度为 32 位的无符号整数，一般用 16 进制来表示。

Mark 的设置一共有五个选项，分别是 `--set-xmark`、`--set-mark`、`--and-mark`、`--and-mark`、`--or-mark` 和 `--xor-mark`。在本文用到了前两种，下面将分别为大家介绍。

**`--set-xmark value[/mask]`**

上面的 `value` 和掩码 `mask` 都是 32 位无符号整数，一般用 16 进制表示。内核设置数据包 nfmark 值的流程分为两步：

1. 首先，内核会先用 mask 预处理数据包原来的 nfmark，处理方法是：如果 mask 的第 N 位（二进制）为 1，则将数据包的 nfmark 第的 N 位（二进制）清零（Zero out） ，如果 mask 的第 N 位为 0，那么数据包的 nfmark 位保持不变
2. 再用上面预处理后的 nfmark 和 value 做异或运算，得到数据包最后的 nfmark 值。

举个例子：假设我们设置了 `--set-xmark 0x4000/0xffffffff`，掩码为 `0xffffffff`，掩码表示为二进制的话 32 位每一位都是 `1`，那么内核首先会将数据包原来的 `nfmark` 所有的位都清零（异或运算，相当于是先把 `nfmark` 置 0），然后再和 value 做异或操作，那么得到的最后的 `nfmark` 值就是 `0x4000`。所以，数据包经过这条规则后，它的 nfmark 值就是 `0x4000`。

上面的掩码 `mask` 是个可选项，如果没有设置的话，默认为 `0xffffffff`。

根据上面的规则，省略 `mask` 的值或者将 `mask` 和 `value` 的值设置成一样可以快速设置数据包的 `nfmark` 值为 `value`。读者可以自己推导一下：`value XOR 0xFFFFFFFF XOR value =value`，`value XOR value XOR value = value`。

**`--set-mark value[/mask]`**

设置步骤与上文类似。第一步预处理也是将原来的 `nfmark` 与 mask 进行异或运算，第二步不同，该方法是将预处理的 nfmark 和 value 做或（OR）运算。

根据上面的规则，省略 `mask` 的值，或者将 `mask` 与 `value` 值设置成一样可以快速设置数据包的 `nfmark` 值为 `value`。读者可以自己推导一下：`value XOR 0xFFFFFFFF OR value = value`，`0 OR value = value`）。

查看 [netfilter 文档](https://ipset.netfilter.org/iptables-extensions.man.html#lbDD) 了解详情。

{{</callout>}}

通过执行以上 iptables 规则，可以确保 Ambient Mesh 仅拦截 `ztunnel-pods-ips` IP 集 Pod 中的数据包并给数据包打上 `0x100/0x100` 标记（`nfmark`，格式为 `值/掩码`，值和掩码都是 32 位的二进制整数，），而不影响其他 Pod。

{{<callout note "关于 ztunnel-pods-ips IP 集">}}

`ztunnel-pods-ips` 是由 Istio CNI 创建的 [IP 集（IP Set）](https://ipset.netfilter.org/)，这里面保存着该节点上 Ambient Mesh 中的所有 Pod 的 IP 地址。IP 集是 Linux 内核中的一个框架，可由 [ipset](https://ipset.netfilter.org/ipset.man.html) 实用程序管理。IP 集可以存储不同类型的数据，例如 IP 地址、网络、（TCP/UDP）端口号、MAC 地址、接口名称或它们的组合，从而确保在条目与集合匹配时具有闪电般的速度。

{{</callout>}}

{{<detail "用 `iptables -t nat -L` 按顺序查看 iptables 规则，将可以更明显的看到路由路径。">}}

```bash
$ iptables -t nat -L
Chain PREROUTING (policy ACCEPT)
target     prot opt source               destination
# 数据包首先进入 ztunnel-PREROUTING 链处理
ztunnel-PREROUTING  all  --  anywhere             anywhere
# 然后进入 KUBE-SERVICES 链处理
KUBE-SERVICES  all  --  anywhere             anywhere             /* kubernetes service portals */

Chain INPUT (policy ACCEPT)
target     prot opt source               destination         

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination         
KUBE-SERVICES  all  --  anywhere             anywhere             /* kubernetes service portals */

Chain POSTROUTING (policy ACCEPT)
target     prot opt source               destination         
ztunnel-POSTROUTING  all  --  anywhere             anywhere            
KUBE-POSTROUTING  all  --  anywhere             anywhere             /* kubernetes postrouting rules */
IP-MASQ    all  --  anywhere             anywhere             /* ip-masq: ensure nat POSTROUTING directs all non-LOCAL destination traffic to our custom IP-MASQ chain */ ADDRTYPE match dst-type !LOCAL

/* Omit KUBE-SVC chains */

Chain ztunnel-POSTROUTING (1 references)
target     prot opt source               destination         
ACCEPT     all  --  anywhere             anywhere             mark match 0x100/0x100

Chain ztunnel-PREROUTING (1 references)
target     prot opt source               destination   
# 通过所有被打上 0x100/0x100 标记的数据包
ACCEPT     all  --  anywhere             anywhere             mark match 0x100/0x100
```

{{</detail>}}

我们再查看一下该节点的路由规则：

```bash
$ ip rule
0:      from all lookup local
100:    from all fwmark 0x200/0x200 goto 32766
101:    from all fwmark 0x100/0x100 lookup 101
102:    from all fwmark 0x40/0x40 lookup 102
103:    from all lookup 100
32766:  from all lookup main
32767:  from all lookup default
```

路由表将按顺序执行，第一列表示的是路由表的优先级，第二列表示要查找或跳转的路由表。你会看到所有带有 `0x100/0x100` 标记的数据包将查找 101 路由表。我们再查看一下该路由表：

```bash
$ ip route show table 101
default via 192.168.127.2 dev istioout 
10.4.4.18 dev veth52b75946 scope link 
```

你会看到 `101` 路由表中带有关键字 `via` ，这表示数据包将通过网关传输，查看 [ip route 命令的用法](http://linux-ip.net/html/tools-ip-route.html#tools-ip-route-show)。所有数据包被通过 `istioout` 网卡发送到网关（IP 是 `192.168.127.2`）。另一行表示是当前节点上 ztunnel pod 的路由链路。

{{<callout note  "关于 101 路由表">}}
所谓路由表（Routing Table），指的是路由器或者其他互联网网络设备上存储的表，该表中存有到达特定网络终端的路径。路由器的主要工作就是为经过路由器的每个数据包寻找一条最佳的传输路径，并将该数据有效地传送到目的站点。为了完成这项工作，在路由器中保存着各种传输路径的相关数据，供路由选择时使用，表中包含的信息决定了数据转发的策略。路由表根据其建立的方法，可以分为**动态路由表**和**静态路由表**。

101 路由表是由 Istio CNI 创建的，它的作用是将带有 `0x100/0x00` fwmark 的数据包转发到 ztunnel 中。

在 Linux 系统中，用户可以自定义编号 1 到 252 的路由表，Linux 系统维护了 4 个路由表：

- 0：系统保留表
- 253：defulte 表，没特别指定的默认路由都放在改表
- 254：main 表，没指明路由表的所有路由放在该表，默认表，我们使用 `ip route list` 或 `route -n` 或 `netstat -rn` 查看的路由记录即为 main 表中的记录
- 255：locale 表，保存本地接口地址，广播地址、NAT地址 由系统维护，用户不得更改

{{</callout>}}

我们再查看一下 `istioout` 网卡的详细信息：

{{<highlight bash "linenos=table,hl_lines=4 5">}}
$ ip -d addr show istioout
24: istioout: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1410 qdisc noqueue state UNKNOWN group default 
    link/ether 62:59:1b:ad:79:01 brd ff:ff:ff:ff:ff:ff
    geneve id 1001 remote 10.4.4.18 ttl auto dstport 6081 noudpcsum udp6zerocsumrx numtxqueues 1 numrxqueues 1 gso_max_size 65536 gso_max_segs 65535
    inet 192.168.127.1/30 brd 192.168.127.3 scope global istioout
       valid_lft forever preferred_lft forever
    inet6 fe80::6059:1bff:fead:7901/64 scope link 
       valid_lft forever preferred_lft forever
{{</highlight>}}

Pod A 中的 `istioout` 网卡通过 Geneve tunnel 与 ztunnel A 中的 `pstioout` 网卡连通。

{{<callout note "关于 istioout 网卡">}}

`istioout` 是一个 [Geneve（Generic Network Virtualization Encapsulation）](https://datatracker.ietf.org/doc/html/draft-gross-geneve-00)类型的虚拟网卡，它的 IP 是 `192.168.127.1`，远端是 `10.4.2.19`（节点 A 上的 ztunnel Pod 的 IP），网关是 `192.168.127.2`（节点 A 上 ztunnel Pod 中 `pistioout` 网卡的 IP，在下文会看到）。

{{</callout>}}

### 检查 Ztunnel A 上的路由规则 {#ztunnel-a-rules}

进入 Ztunnel A Pod，使用 `ip -d a` 命令检查它的网卡信息：

{{<highlight bash "linenos=table,hl_lines=11-20">}}
$ ip -d a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00 promiscuity 0 minmtu 0 maxmtu 0 numtxqueues 1 numrxqueues 1 gso_max_size 65536 gso_max_segs 65535 
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: eth0@if16: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1460 qdisc noqueue state UP group default 
    link/ether 06:3e:d1:5d:95:16 brd ff:ff:ff:ff:ff:ff link-netnsid 0 promiscuity 0 minmtu 68 maxmtu 65535 
    veth numtxqueues 1 numrxqueues 1 gso_max_size 65536 gso_max_segs 65535 
    inet 10.4.2.1/24 brd 10.4.4.255 scope global eth0
       valid_lft forever preferred_lft forever
3: pistioin: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1410 qdisc noqueue state UNKNOWN group default qlen 1000
    link/ether 06:18:ee:29:7e:e4 brd ff:ff:ff:ff:ff:ff promiscuity 0 minmtu 68 maxmtu 65485 
    geneve id 1000 remote 10.4.2.1 ttl auto dstport 6081 noudpcsum udp6zerocsumrx numtxqueues 1 numrxqueues 1 gso_max_size 65536 gso_max_segs 65535 
    inet 192.168.126.2/30 scope global pistioin
       valid_lft forever preferred_lft forever
4: pistioout: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1410 qdisc noqueue state UNKNOWN group default qlen 1000
    link/ether aa:40:40:7c:07:b2 brd ff:ff:ff:ff:ff:ff promiscuity 0 minmtu 68 maxmtu 65485 
    geneve id 1001 remote 10.4.2.1 ttl auto dstport 6081 noudpcsum udp6zerocsumrx numtxqueues 1 numrxqueues 1 gso_max_size 65536 gso_max_segs 65535 
    inet 192.168.127.2/30 scope global pistioout
       valid_lft forever preferred_lft forever
{{</highlight>}}

你将发现其中有两个网卡：

- `pistioin` ：IP 为 `192.168.126.2`
- `pistioout`：IP 为 `192.168.127.2`

{{<callout note "关于 pistioin 和 pistioout 网卡">}}

这两个网卡都是由 ztunnel 中的 init 容器创建的 Geneve 类型的虚拟网卡，其 IP 地址也是固定的，如果你查看 ztunnel 的 YAML 配置将发现其中的网卡创建命令，在此我们按下不表，因为 Ambient 模式还在开发初期，这些启动命令未来可能有很大变化，感兴趣的读者可以自行查阅。

{{</callout>}}

自 Pod A 的流量进入 ztunnel 之后，如何对流量进行处理呢？答案是 iptables，查看 ztunnel A 中的 iptables 规则：

{{<highlight bash "linenos=table,hl_lines=11">}}
$ iptables-save
/* 省略 */
*mangle
:PREROUTING ACCEPT [185880:96984381]
:INPUT ACCEPT [185886:96984813]
:FORWARD ACCEPT [0:0]
:OUTPUT ACCEPT [167491:24099839]
:POSTROUTING ACCEPT [167491:24099839]
-A PREROUTING -j LOG --log-prefix "mangle pre [ ztunnel-rts54] "
-A PREROUTING -i pistioin -p tcp -m tcp --dport 15008 -j TPROXY --on-port 15008 --on-ip 127.0.0.1 --tproxy-mark 0x400/0xfff
-A PREROUTING -i pistioout -p tcp -j TPROXY --on-port 15001 --on-ip 127.0.0.1 --tproxy-mark 0x400/0xfff
-A PREROUTING -i pistioin -p tcp -j TPROXY --on-port 15006 --on-ip 127.0.0.1 --tproxy-mark 0x400/0xfff
/* 省略 */
{{</highlight>}}

可以看到 ztunnel A 中的所有发往 `pistioin` 网卡的 TCP 流量透明转发到 `15001` 端口（Envoy 的 outbound 端口），并打上了 `0x400/0xfff` 的标记。这个标记可以保证数据包发往正确的网卡。

{{<callout note "关于 tproxy">}}

`tproxy` 是 Linux 内核自 2.2 版本以来支持的透明代理（Transparent proxy），其中的 t 代表 transparent，即透明。你需要在内核配置中启用 `NETFILTER_TPROXY` 和策略路由。通过 tproxy，Linux 内核就可以作为一个路由器，将数据包重定向到用户空间。详见 [tproxy 文档](http://lxr.linux.no/linux+v3.10/Documentation/networking/tproxy.txt)。

{{</callout>}}

查看 Ztunnel A 中的路由表。

```bash
$ ip rule
0:      from all lookup local
20000:  from all fwmark 0x400/0xfff lookup 100
20001:  from all fwmark 0x401/0xfff lookup 101
20002:  from all fwmark 0x402/0xfff lookup 102
20003:  from all fwmark 0x4d3/0xfff lookup 100
32766:  from all lookup main
32767:  from all lookup default
```

你会看到所有标记 `0x400/0xfff` 的数据包应用 101 路由表，我们查看该路由表详情：

```bash
$ ip route show table 100
local default dev lo scope host 
```

你会看到这是一条本地路由，数据包发送到本地的回环网卡，即 `127.0.0.1`。

以上就是 Pod 中出站流量的透明劫持过程。

## Ztunnel A 上的出站流量路由 {#ztunnel-a-outbound}

出站流量在被劫持到 Ztunnel 上，进入 Envoy 的 15001 端口处理。下面我们来查看 Ztunnel 如何路由出站流量。

注意：Ztunnel 中的 Envoy 过滤器规则与 Sidecar 模式中的 Envoy 过滤器规则完全不同，我们不使用 `istioctl proxy-config` 命令来检视 Listener、Cluster、Endpoint 等配置，而是直接导出 ztunnel 中的 Envoy 完整配置。 

我们直接在自己的本地机器上远程获取 ztunnel A 中的 Envoy 配置：

```bash
kubectl exec -n istio-system ztunnel-hptxk -c istio-proxy -- curl "127.0.0.1:15000/config_dump?include_eds">ztunnel-a-all-include-eds.json
```

注意：不要使用 `istioctl proxy-config all ztunnel-rts54 -n istio-system` 命令来获取 Envoy 配置，因为这样获取的配置中不包含 EDS 部分。导出的 Json 文件将有上万行，为了便于阅读，建议使用 [fx](https://github.com/antonmedv/fx) 或其他工具来解析该文件。

### ztunnel_outbound 监听器 {#ztunnel_outbound-listener}

在这个 Envoy 配置中包含了该节点上的所有 Pod 访问的流量规则配置，查看 `ztunnel_outbound` Listener 部分配置（因配置太多，省略部分内容）：

{{<highlight json "linenos=table,hl_lines=7 10 11 14 43 59 62 64 69 76 82 85 88-123">}}
{
 "name": "ztunnel_outbound",
 "active_state": {
  "version_info": "2022-11-11T07:10:40Z/13",
  "listener": {
   "@type": "type.googleapis.com/envoy.config.listener.v3.Listener",
   "name": "ztunnel_outbound",
   "address": {
    "socket_address": {
     "address": "0.0.0.0",
     "port_value": 15001
    }
   },
   "filter_chains": [{...},...],
   "use_original_dst": true,
   "listener_filters": [
    {
     "name": "envoy.filters.listener.original_dst",
     "typed_config": {
      "@type": "type.googleapis.com/envoy.extensions.filters.listener.original_dst.v3.OriginalDst"
     }
    },
    {
     "name": "envoy.filters.listener.original_src",
     "typed_config": {
      "@type": "type.googleapis.com/envoy.extensions.filters.listener.original_src.v3.OriginalSrc",
      "mark": 1234
     }
    },
    {
     "name": "envoy.filters.listener.workload_metadata",
     "config_discovery": {
      "config_source": {
       "ads": {},
       "initial_fetch_timeout": "30s"
      },
      "type_urls": [
       "type.googleapis.com/istio.telemetry.workloadmetadata.v1.WorkloadMetadataResources"
      ]
     }
    }
   ],
   "transparent": true,
   "socket_options": [
    {
     "description": "Set socket mark to packets coming back from outbound listener",
     "level": "1",
     "name": "36",
     "int_value": "1025"
    }
   ],
   "access_log": [{...}],
   "default_filter_chain": {"filters": [...], ...},
   "filter_chain_matcher": {
    "matcher_tree": {
     "input": {
      "name": "port",
      "typed_config": {
       "@type": "type.googleapis.com/envoy.extensions.matching.common_inputs.network.v3.DestinationPortInput"
      }
     },
     "exact_match_map": {
      "map": {
       "15001": {
        "action": {
         "name": "BlackHoleCluster",
         "typed_config": {
          "@type": "type.googleapis.com/google.protobuf.StringValue",
          "value": "BlackHoleCluster"
         }
        }
       }
      }
     }
    },
    "on_no_match": {
     "matcher": {
      "matcher_tree": {
       "input": {
        "name": "source-ip",
        "typed_config": {
         "@type": "type.googleapis.com/envoy.extensions.matching.common_inputs.network.v3.SourceIPInput"
        }
       },
       "exact_match_map": {
        "map": {
         "10.168.15.222": {...},
         "10.4.4.19": {
          "matcher": {
           "matcher_tree": {
            "input": {
             "name": "ip",
             "typed_config": {
              "@type": "type.googleapis.com/envoy.extensions.matching.common_inputs.network.v3.DestinationIPInput"
             }
            },
            "exact_match_map": {
             "map": {
              "10.8.4.226": {
               "matcher": {
                "matcher_tree": {
                 "input": {
                  "name": "port",
                  "typed_config": {
                   "@type": "type.googleapis.com/envoy.extensions.matching.common_inputs.network.v3.DestinationPortInput"
                  }
                 },
                 "exact_match_map": {
                  "map": {
                   "9080": {
                    "action": {
                     "name": "spiffe://cluster.local/ns/default/sa/sleep_to_http_productpage.default.svc.cluster.local_outbound_internal",
                     "typed_config": {
                      "@type": "type.googleapis.com/google.protobuf.StringValue",
                      "value": "spiffe://cluster.local/ns/default/sa/sleep_to_http_productpage.default.svc.cluster.local_outbound_internal"
                     }
                    }
                   }
                  }
                 }
                }
               }
              },
              {...}
             }
            }
           }
          }
         },
         "10.4.4.7": {...},
         "10.4.4.11": {...},
        }
       }
      },
      "on_no_match": {
       "action": {
        "name": "PassthroughFilterChain",
        "typed_config": {
         "@type": "type.googleapis.com/google.protobuf.StringValue",
         "value": "PassthroughFilterChain"
        }
       }
      }
     }
    }
   }
  },
  "last_updated": "2022-11-11T07:33:10.485Z"
 }
}
{{</highlight>}}

说明：
- 第 10、11、59、62、64、69、76、82、85 行：Envoy 监听 15001 端口，处理内核中使用 tproxy 转发的流量；对于目的地是 15001 端口的数据包直接抛弃，对于目的地是其他端口的流量再根据源 IP 地址匹配决定数据包去向；
- 第 43 行：使用 `IP_TRANSPARENT` 套接字选项，开启 tproxy 透明代理，转发目的地非 ztunnel IP 的流量包；
-  第 88 到 123 行：根据源 IP（`10.4.4.19` 是 Pod A 的 IP）、目的 IP（`10.8.14.226` 是服务 B 的 Cluster IP）和端口（9080）规则匹配，数据包将被发往 `spiffe://cluster.local/ns/default/sa/sleep_to_http_productpage.default.svc.cluster.local_outbound_internal` 集群。

### Sleep 集群

我们再查看一下该集群的配置：

{{<highlight json "linenos=table,hl_lines=5 6 18 23-37">}}
{
 "version_info": "2022-11-08T06:40:06Z/63",
 "cluster": {
  "@type": "type.googleapis.com/envoy.config.cluster.v3.Cluster",
  "name": "spiffe://cluster.local/ns/default/sa/sleep_to_http_productpage.default.svc.cluster.local_outbound_internal",
  "type": "EDS",
  "eds_cluster_config": {
   "eds_config": {
    "ads": {},
    "initial_fetch_timeout": "0s",
    "resource_api_version": "V3"
   }
  },
  "transport_socket_matches": [
   {
    "name": "internal_upstream",
    "match": {
     "tunnel": "h2"
    },
    "transport_socket": {
     "name": "envoy.transport_sockets.internal_upstream",
     "typed_config": {
      "@type": "type.googleapis.com/envoy.extensions.transport_sockets.internal_upstream.v3.InternalUpstreamTransport",
      "passthrough_metadata": [
       {
        "kind": {
         "host": {}
        },
        "name": "tunnel"
       },
       {
        "kind": {
         "host": {}
        },
        "name": "istio"
       }
      ],
      "transport_socket": {
       "name": "envoy.transport_sockets.raw_buffer",
       "typed_config": {
        "@type": "type.googleapis.com/envoy.extensions.transport_sockets.raw_buffer.v3.RawBuffer"
       }
      }
     }
    }
   },
   {
    "name": "tlsMode-disabled",
    "match": {},
    "transport_socket": {
     "name": "envoy.transport_sockets.raw_buffer",
     "typed_config": {
      "@type": "type.googleapis.com/envoy.extensions.transport_sockets.raw_buffer.v3.RawBuffer"
     }
    }
   }
  ]
 },
 "last_updated": "2022-11-08T06:40:06.619Z"
}
{{</highlight>}}

说明：

- 第 6 行：该 Cluster 配置使用 EDS 获取端点
- 第 18 行：对所有具有 `tunnel: h2` 元数据的字节流应用 [`InternalUpstreamTransport`](https://www.envoyproxy.io/docs/envoy/latest/api-v3/extensions/transport_sockets/internal_upstream/v3/internal_upstream.proto#envoy-v3-api-msg-extensions-transport-sockets-internal-upstream-v3-internalupstreamtransport)，用于内部地址，定义位于同一代理实例中的环回用户空间 socket。除了常规字节流之外，该扩展还允许跨用户空间 socket 传递额外的结构化状态（`passthrough_metadata`）。目的是促进下游过滤器和上游内部连接之间的通信。与上游连接共享的所有过滤器状态对象也通过此传输 socket 与下游内部连接共享。
- 第 23 到 37 行：向上游传递的结构化数据；

### Sleep 集群的端点 {#sleep-endpoints}

我们再检查下 EDS，你会发现在众多的 `endpoint_config` 中有这样一条：

{{<highlight json "linenos=table,hl_lines=4 13 20-30">}}
{
 "endpoint_config": {
  "@type": "type.googleapis.com/envoy.config.endpoint.v3.ClusterLoadAssignment",
  "cluster_name": "spiffe://cluster.local/ns/default/sa/sleep_to_http_productpage.default.svc.cluster.local_outbound_internal",
  "endpoints": [
   {
    "locality": {},
    "lb_endpoints": [
     {
      "endpoint": {
       "address": {
        "envoy_internal_address": {
         "server_listener_name": "outbound_tunnel_lis_spiffe://cluster.local/ns/default/sa/sleep",
         "endpoint_id": "10.4.3.20:9080"
        }
       },
       "health_check_config": {}
      },
      "health_status": "HEALTHY",
      "metadata": {
       "filter_metadata": {
        "envoy.transport_socket_match": {
         "tunnel": "h2"
        },
        "tunnel": {
         "address": "10.4.3.20:15008",
         "destination": "10.4.3.20:9080"
        }
       }
      },
      "load_balancing_weight": 1
     }
    ]
   }
  ],
  "policy": {
   "overprovisioning_factor": 140
  }
 }
}
{{</highlight>}}

说明：

- 第 4 行：截止 2022年11月14日，实际在导出 Envoy 配置的时候并没有该字段，但是理应有这个字段，否则无法判断 Endpoint 属于哪个 Cluster；
- 第 13 行：该端点的地址是一个 `envoy_internal_address`，Envoy 内部监听器 `outbound_tunnel_lis_spiffe://cluster.local/ns/default/sa/sleep`；
- 第 20 - 30 行：定义过滤器元数据，使用 HBONE 隧道传递给 Envoy 内部监听器；

{{<callout warning "关于 endpoint_config 中未显示 cluster_name 字段的问题">}}

这里的 [`endpoint_config`](https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/endpoint/v3/endpoint.proto) 中缺少了必选的 `cluster_name` 字段，这可能是 Ambient 模式的一个 bug 导致了在导出 Envoy 的配置时缺少了该字段。我在 GItHub 上创建了一个 Issue 来追踪这个问题，详见 [Istio Issue-42022](https://github.com/istio/istio/issues/42022)。

{{</callout>}}

### 通过 Envoy 内部监听器建立 HBONE 隧道 {#sleep-internal-upstream}

我们再看下这个监听器 `outbound_tunnel_lis_spiffe://cluster.local/ns/default/sa/sleep`：

{{<highlight json "linenos=table,hl_lines=16 18-28 40">}}
{
 "name": "outbound_tunnel_lis_spiffe://cluster.local/ns/default/sa/sleep",
 "active_state": {
  "version_info": "2022-11-08T06:40:06Z/63",
  "listener": {
   "@type": "type.googleapis.com/envoy.config.listener.v3.Listener",
   "name": "outbound_tunnel_lis_spiffe://cluster.local/ns/default/sa/sleep",
   "filter_chains": [
    {
     "filters": [
      {
       "name": "envoy.filters.network.tcp_proxy",
       "typed_config": {
        "@type": "type.googleapis.com/envoy.extensions.filters.network.tcp_proxy.v3.TcpProxy",
        "stat_prefix": "outbound_tunnel_lis_spiffe://cluster.local/ns/default/sa/sleep",
        "cluster": "outbound_tunnel_clus_spiffe://cluster.local/ns/default/sa/sleep",
        "access_log": [{...}, ...],
        "tunneling_config": {
         "hostname": "%DYNAMIC_METADATA(tunnel:destination)%",
         "headers_to_add": [
          {
           "header": {
            "key": "x-envoy-original-dst-host",
            "value": "%DYNAMIC_METADATA([\"tunnel\", \"destination\"])%"
           }
          }
         ]
        }
       }
      }
     ]
    }
   ],
   "use_original_dst": false,
   "listener_filters": [
    {
     "name": "set_dst_address",
     "typed_config": {
      "@type": "type.googleapis.com/xds.type.v3.TypedStruct",
      "type_url": "type.googleapis.com/istio.set_internal_dst_address.v1.Config",
      "value": {}
     }
    }
   ],
   "internal_listener": {}
  },
  "last_updated": "2022-11-08T06:40:06.750Z"
 }
}
{{</highlight>}}

说明：

- 第 14 行：数据包将被转发到 `outbound_tunnel_clus_spiffe://cluster.local/ns/default/sa/sleep` 集群；
- 第 18 - 28 行： [`tunneling_config`](https://www.envoyproxy.io/docs/envoy/latest/api-v3/extensions/filters/network/tcp_proxy/v3/tcp_proxy.proto#envoy-v3-api-msg-extensions-filters-network-tcp-proxy-v3-tcpproxy-tunnelingconfig) ，用来配置上游 HTTP CONNECT 隧道。另外该监听器中的 `TcpProxy` 过滤器将流量传给上游 `outbound_tunnel_clus_spiffe://cluster.local/ns/default/sa/sleep` 集群。TCP 过滤器上设置了 HTTP CONNECT 隧道（承载发送到 `10.4.3.20:9080` 的流量），供 `productpage` 所在节点的 ztunnel 使用。有多少个端点，就会创建多少条隧道。HTTP 隧道是 Ambient 组件之间安全通信的承载协议。同时在隧道中的数据包添加了 `x-envoy-original-dst-host` header，根据上一步 EDS 中选择的端点的 `metadata` 里的参数设置目的地址。前面 EDS  选择的端点是 `10.4.3.20:9080` ，那么这里的 tunnel 监听器就会 header 的值设置为 `10.4.3.20:9080`，请留意这个 header，它会在隧道的另一端被用到；
- 第 40 行：监听器中首先执行监听器过滤器，`set_dst_address` 过滤器将上游地址设置为下游的目的地址。

{{<callout note "关于 HBONE 隧道">}}

HBONE 是 HTTP-Based Overlay Network Environment 的缩写，是一种使用 HTTP 协议提供隧道能力的方法。客户端向 HTTP 代理服务器发送 HTTP CONNECT 请求（其中包含了目的地址）以建立隧道，代理服务器代表客户端与目的地建立 TCP 连接，然后客户端就可以通过代理服务器透明的传输 TCP 数据流到目的服务器。在 Ambient 模式中，Ztunnel（其中的 Envoy）实际上是充当了透明代理，它使用 [Envoy Internal Listener](https://www.envoyproxy.io/docs/envoy/latest/configuration/other_features/internal_listener) 来接收 HTTP CONNECT 请求和传递 TCP 流给上游集群。

{{</callout>}}

### Sleep 集群的 HBONE 隧道端点 {#sleep-tunnel-cluster}

我们再查看一下 `outbound_tunnel_clus_spiffe://cluster.local/ns/default/sa/sleep` 集群的配置：

{{<highlight json "linenos=table,hl_lines=6 22-41 45-47">}}
 {
 "version_info": "2022-11-11T07:30:10Z/37",
 "cluster": {
  "@type": "type.googleapis.com/envoy.config.cluster.v3.Cluster",
  "name": "outbound_pod_tunnel_clus_spiffe://cluster.local/ns/default/sa/sleep",
  "type": "ORIGINAL_DST",
  "connect_timeout": "2s",
  "lb_policy": "CLUSTER_PROVIDED",
  "cleanup_interval": "60s",
  "transport_socket": {
   "name": "envoy.transport_sockets.tls",
   "typed_config": {
    "@type": "type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext",
    "common_tls_context": {
     "tls_params": {
      "tls_minimum_protocol_version": "TLSv1_3",
      "tls_maximum_protocol_version": "TLSv1_3"
     },
     "alpn_protocols": [
      "h2"
     ],
     "tls_certificate_sds_secret_configs": [
      {
       "name": "spiffe://cluster.local/ns/default/sa/sleep~sleep-5644bdc767-2dfg7~85c8c34e-7ae3-4d29-9582-0819e2b10c69",
       "sds_config": {
        "api_config_source": {
         "api_type": "GRPC",
         "grpc_services": [
          {
           "envoy_grpc": {
            "cluster_name": "sds-grpc"
           }
          }
         ],
         "set_node_on_first_message_only": true,
         "transport_api_version": "V3"
        },
        "resource_api_version": "V3"
       }
      }
     ]
    }
   }
  },
  "original_dst_lb_config": {
   "upstream_port_override": 15008
  },
  "typed_extension_protocol_options": {
   "envoy.extensions.upstreams.http.v3.HttpProtocolOptions": {
    "@type": "type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions",
    "explicit_http_config": {
     "http2_protocol_options": {
      "allow_connect": true
     }
    }
   }
  }
 },
 "last_updated": "2022-11-11T07:30:10.754Z"
}
{{</highlight>}}

说明：

- 第 6 行：该集群的类型是 `ORIGINAL_DST`，即前文中 EDS 获取到的地址 `10.4.3.20:9080`；
- 第 22 - 41 行：配置了上游的 TLS 证书；
- 第 45 - 48 行：将上游端口修改为 15008；

以上就是使用 tproxy 和 HBONE 隧道实现的出站流量透明劫持的全过程。

## Inbound 流量劫持 {#inbound}

节点 B 接收节点 A 对 `10.4.3.20:15008` 的请求。Ambient 模式的入站流量劫持与出站流量类似，同样使用 tproxy 和 HBONE 实现透明流量劫持。

Ambient mesh 的 pod 入站流量的透明流量劫持流程如下：

1. Istio CNI 在节点上创建 `istioin` 网卡和 iptables 规则，将 Ambient mesh 中的 Pod IP 加入 IP 集，并通过 netfilter `nfmark` 标记和路由规则，将 Ambient mesh 中的出站流量通过 Geneve 隧道透明劫持到 `pistioin` 虚拟机网卡；
2. ztunnel 中的 init 容器创建 iptables 规则，将 `pistioin` 网卡中的所有流量转发到 ztunnel 中的 Envoy 代理的 15008 端口；
3. Envoy 对数据包进行处理后转发给 Pod B。

因为操作步骤与上文中的检查出站流量时相同，因此下文将省略部分输出。

### 检查节点 B 上的路由规则 {#node-b-rules}

登录到服务 B 所在的节点 B，查看节点上的 iptables：

```bash
$ iptables-save
/* 省略 */
-A ztunnel-PREROUTING -m mark --mark 0x200/0x200 -j RETURN
-A ztunnel-PREROUTING -p tcp -m set --match-set ztunnel-pods-ips src -j MARK --set-xmark 0x100/0x100
/* 省略 */
```

你将看到在前文中提到的给所有 `ztunnel-pods-ips` IP 集中 Pod 发送的数据包打上 `0x100/0x100` 标记的上一条命令：给所有数据包打上 `0x200/0x200` 标记，然后继续执行 iptables。

查看节点 B 上的路由表：

```bash
0:      from all lookup local
100:    from all fwmark 0x200/0x200 goto 32766
101:    from all fwmark 0x100/0x100 lookup 101
102:    from all fwmark 0x40/0x40 lookup 102
103:    from all lookup 100
32766:  from all lookup main
32767:  from all lookup default
```

所有 Ambient Mesh 节点中的路由表数量和规则是一样的，路由表规则将按顺序执行，首先查找 `local` 表，然后所有带有 `0x200/0x200` 标记的数据包将首先跳转到 `main` 表（其中定义了 veth 路由），然后查找 `100` 表，在 `100` 表中有以下规则：

{{<highlight bash "linenos=table,hl_lines=8">}}
$ ip route show table 100
10.4.3.14 dev veth28865c45 scope link 
10.4.3.15 via 192.168.126.2 dev istioin src 10.4.3.1
10.4.3.16 via 192.168.126.2 dev istioin src 10.4.3.1
10.4.3.17 via 192.168.126.2 dev istioin src 10.4.3. 
10.4.3.18 via 192.168.126.2 dev istioin src 10.4.3. 
10.4.3.19 via 192.168.126.2 dev istioin src 10.4.3.1
10.4.3.20 via 192.168.126.2 dev istioin src 10.4.3.1
{{</highlight>}}

你会看到发往 `10.4.3.20` 的数据包将被路由到 `istioin` 网卡上的 `192.168.126.2` 网关。

查看 `istioin` 网卡的详细信息：

{{<highlight bash "linenos=table,hl_lines=4 5">}}
$ ip -d addr show istioin 
17: istioin: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1410 qdisc noqueue state UNKNOWN group default 
    link/ether 36:2a:2f:f1:5c:97 brd ff:ff:ff:ff:ff:ff promiscuity 0 minmtu 68 maxmtu 65485 
    geneve id 1000 remote 10.4.3.14 ttl auto dstport 6081 noudpcsum udp6zerocsumrx numtxqueues 1 numrxqueues 1 gso_max_size 65536 gso_max_segs 65535 
    inet 192.168.126.1/30 brd 192.168.126.3 scope global istioin
       valid_lft forever preferred_lft forever
    inet6 fe80::342a:2fff:fef1:5c97/64 scope link 
       valid_lft forever preferred_lft forever
{{</highlight>}}

从输出中可以看到，`istioin` 是一个 Geneve 类型虚拟网卡，它创建了一个 Geneve 隧道，远端的 IP 是 `10.4.3.14 `，这是 Ztunnel B 的 Pod IP。

### 检查 Ztunnel B Pod 上的路由规则 {#ztunnel-b-rules}

进入 Ztunnel B Pod，使用 `ip -d a` 命令检查它的网卡信息，你会看到有一个 `pistioout` 网卡，它的 IP 为 `192.168.127.2`，这正是与 `istioin` 虚拟网卡建立的 Geneve 隧道的远端。

使用 `iptables-save` 查看 Pod 内的 iptables 规则，你会看到：

```bash
-A PREROUTING -i pistioin -p tcp -m tcp --dport 15008 -j TPROXY --on-port 15008 --on-ip 127.0.0.1 --tproxy-mark 0x400/0xfff
-A PREROUTING -i pistioin -p tcp -j TPROXY --on-port 15006 --on-ip 127.0.0.1 --tproxy-mark 0x400/0xfff
```

所有发往 `10.4.3.20:15008` 的流量将使用 tproxy 被路由到 15008 端口。

{{<callout note "关于 15006 和 15008 端口">}}

- 15006 端口用于处理非加密的（plain）TCP 数据包。
- 15008 端口用于处理加密的（TLS）TCP数据包。

{{</callout>}}

以上就是 Pod 中入站流量的透明劫持过程。

## Ztunnel B 上的入站流量路由 {#ztunnel-b-inbound}

出站的 TLS 加密流量在被劫持到 Ztunnel 上，进入 Envoy 的 15008 端口处理。下面我们来查看 Ztunnel 如何路由入站流量。

我们直接在自己的本地机器上远程获取 ztunnel B 中的 Envoy 配置：

```bash
kubectl exec -n istio-system 	ztunnel-z4qmh -c istio-proxy -- curl "127.0.0.1:15000/config_dump?include_eds">ztunnel-b-all-include-eds.json
```

### ztunnel_inbound 监听器 {#ztunnel_inbound-listener}

查看 `ztunnel_inbound` 监听器的详细信息：

{{<highlight json "linenos=table,hl_lines=7 10 11 17-22 39-65 78-82">}}

{
 "name": "ztunnel_inbound",
 "active_state": {
  "version_info": "2022-11-11T07:12:01Z/16",
  "listener": {
   "@type": "type.googleapis.com/envoy.config.listener.v3.Listener",
   "name": "ztunnel_inbound",
   "address": {
    "socket_address": {
     "address": "0.0.0.0",
     "port_value": 15008
    }
   },
   "filter_chains": [
    {
     "filter_chain_match": {
      "prefix_ranges": [
       {
        "address_prefix": "10.4.3.20",
        "prefix_len": 32
       }
      ]
     },
     "filters": [
      {
       "name": "envoy.filters.network.rbac",
       "typed_config": {
        "@type": "type.googleapis.com/envoy.extensions.filters.network.rbac.v3.RBAC",
        "rules": {...},
        "stat_prefix": "tcp.",
        "shadow_rules_stat_prefix": "istio_dry_run_allow_"
       }
      },
      {
       "name": "envoy.filters.network.http_connection_manager",
       "typed_config": {
        "@type": "type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager",
        "stat_prefix": "inbound_hcm",
        "route_config": {
         "name": "local_route",
         "virtual_hosts": [
          {
           "name": "local_service",
           "domains": [
            "*"
           ],
           "routes": [
            {
             "match": {
              "connect_matcher": {}
             },
             "route": {
              "cluster": "virtual_inbound",
              "upgrade_configs": [
               {
                "upgrade_type": "CONNECT",
                "connect_config": {}
               }
              ]
             }
            }
           ]
          }
         ]
        },
        "http_filters": [
         {
          "name": "envoy.filters.http.router",
          "typed_config": {
           "@type": "type.googleapis.com/envoy.extensions.filters.http.router.v3.Router"
          }
         }
        ],
        "http2_protocol_options": {
         "allow_connect": true
        },
        "access_log": [{...}],
        "upgrade_configs": [
         {
          "upgrade_type": "CONNECT"
         }
        ]
       }
      }
     ],
     "transport_socket": {
      "name": "envoy.transport_sockets.tls",
      "typed_config": {...} 
     },
     "name": "inbound_10.4.3.20"
    },
    {...}
   ],
   "use_original_dst": true,
   "listener_filters": [{},...],
   "transparent": true,
   "socket_options": [{...}}],
   "access_log": [{...} ]
  },
  "last_updated": "2022-11-14T03:54:07.040Z"
 }
}

{{</highlight>}}

从上面的配置中可以看出：

- 发往 `10.4.3.20` 的流量将被路由到 `virtual_inbound` 集群；
- 第 78 - 82 行：[`upgrade_type: "CONNECT"`](https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/route/v3/route_components.proto#config-route-v3-routeaction-upgradeconfig) 为 Envoy 的 HCM 启用 HTTP Connect 隧道，将该隧道中的 TCP 数据发送到上游；

### virtual_inbound 集群 {#virtual_inbound-cluster}

查看 `virtual_inbound` 集群的信息：

{{<highlight bash "linenos=table,hl_lines=6 9">}}

{
 "version_info": "2022-11-11T07:10:40Z/13",
 "cluster": {
  "@type": "type.googleapis.com/envoy.config.cluster.v3.Cluster",
  "name": "virtual_inbound",
  "type": "ORIGINAL_DST",
  "lb_policy": "CLUSTER_PROVIDED",
  "original_dst_lb_config": {
   "use_http_header": true
  }
 },
 "last_updated": "2022-11-11T07:10:42.111Z"
}

{{</highlight>}}

说明：

- 第 7 行：该集群的类型是 `ORIGINAL_DST`，表示使用下游的原始目的地作为路由目的地，即 `10.4.3.20:15008`，显然这个地址中的端口不正确；
- 第 9 行：[`use_http_header`](https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/cluster/v3/cluster.proto#config-cluster-v3-cluster-originaldstlbconfig) 为 `true` 时将使用 HTTP header [`x-envoy-original-dst-host`](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_conn_man/headers#config-http-conn-man-headers-x-envoy-original-dst-host) 作为目的地址，而这个 header [在出站的 Ztunnel 中已设置](/#sleep-internal-upstream)为 `10.4.3.20:9080`，它将覆盖之前设置的目的地址；

至此，入站流量被 ztunnel 准确地路由到了目的地。以上就是 Ambient 模式中不同节点间 L4 流量劫持和路由流程。

## 总结 {#summary}

为了方便演示，本文中展示的是不同节点上的服务 L4 网络访问数据包的路径，即使两个服务在同一个节点上路径也是类似的。根据本文中提供的操作说明，读者可以在自己的环境中尝试。Istio 的 Ambient 模式还在初级阶段，在笔者测试过程中，也发现导出的 Envoy 配置中 EDS 缺少 `cluster_name` 字段的问题。在了解了 L4 流量路径之后，今后笔者会再分享 Ambient 模式中的 L7 流量路径，欢迎关注。

## 参考{#reference}

- [安装 Ambient Mesh - istio.io](https://istio.io/latest/blog/2022/get-started-ambient/)
- [深入 Ambient Mesh - 流量路径 - mp.weixin.qq.com](https://mp.weixin.qq.com/s/PpP0pmxdJR8PknHeR-pVHQ)
- [一文读懂 Ambient Mesh 七层服务治理 - mp.weixin.qq.com](https://mp.weixin.qq.com/s/TXMyxbzBSfuYNquOZJmZTg)
- [深度剖析！Istio共享代理新模式Ambient Mesh - mp.weixin.qq.com](https://mp.weixin.qq.com/s/B0q73ACAvmY4SjW42A2GVw)
- [Istio Ambient 模式流量管理实现机制详解（一）- zhaohuabing.com](https://www.zhaohuabing.com/post/2022-09-11-ambient-deep-dive-1/)
- [Istio Ambient 模式流量管理实现机制详解（二） - zhaohuabing.com](https://www.zhaohuabing.com/post/2022-09-11-ambient-deep-dive-2/)
- [Istio Ambient 模式流量管理实现机制详解（三）- zhaohuabing.com](https://www.zhaohuabing.com/post/2022-10-17-ambient-deep-dive-3/)
