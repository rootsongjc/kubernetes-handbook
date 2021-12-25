# Master 节点高可用
经过部署 Kubernetes 集群章节我们已经可以顺利的部署一个集群用于开发和测试，但是要应用到生产就就不得不考虑 master 节点的高可用问题，因为现在我们的 master 节点上的几个服务 `kube-apiserver`、`kube-scheduler` 和 `kube-controller-manager` 都是单点的而且都位于同一个节点上，一旦 master 节点宕机，虽然不应答当前正在运行的应用，将导致 kubernetes 集群无法变更。本文将引导你创建一个高可用的 master 节点。

在大神 gzmzj 的 ansible 创建 kubernetes 集群神作中有讲到如何配置多个 Master，但是在实践过程中还是遇到不少坑。需要将坑填上才能工作。 参考[集群规划和基础参数设定](https://github.com/mendickxiao/kubeasz/blob/master/docs/00-集群规划和基础参数设定.md)。

按照神作的描述，实际上是通过 keepalived + haproxy 实现的，其中 keepalived 是提供一个 VIP，通过 VIP 关联所有的 Master 节点；然后 haproxy 提供端口转发功能。由于 VIP 还是存在 Master 的机器上的，默认配置 API Server 的端口是 6443，所以我们需要将另外一个端口关联到这个 VIP 上，一般用 8443。

![Master HA架构图](../images/master-ha.JPG)


根据参考文章的实践，我发现需要在Master手工安装keepalived, haproxy。
```bash
yum install keepalived
yum install haproxy
```

需要将 HAProxy 默认的配置文件 balance 从 source 修改为 `roundrobin` 方式。haproxy 的配置文件 `haproxy.cfg` 默认路径是 `/etc/haproxy/haproxy.cfg`。另外需要手工创建 `/run/haproxy` 的目录，否则 haproxy 会启动失败。

**注意**

- bind 绑定的就是 VIP 对外的端口号，这里是 8443。

- balance 指定的负载均衡方式是 `roundrobin` 方式，默认是 source 方式。在我的测试中，source 方式不工作。
- server 指定的就是实际的 Master 节点地址以及真正工作的端口号，这里是 6443。有多少台 Master 就写多少条记录。

```ini
# haproxy.cfg sample
global
        log /dev/log    local0
        log /dev/log    local1 notice
        chroot /var/lib/haproxy
        *stats socket /run/haproxy/admin.sock mode 660 level admin
        stats timeout 30s
        user haproxy
        group haproxy
        daemon
        nbproc 1

defaults
        log     global
        timeout connect 5000
        timeout client  50000
        timeout server  50000

listen kube-master
        **bind 0.0.0.0:8443**
        mode tcp
        option tcplog
        **balance roundrobin**
        server s1 **Master 1的IP地址**:6443  check inter 10000 fall 2 rise 2 weight 1
        server s2 **Master 2的IP地址**:6443  check inter 10000 fall 2 rise 2 weight 1
```

修改 keepalived 的配置文件，配置正确的 VIP。keepalived 的配置文件 `keepalived.conf` 的默认路径是 `/etc/keepalived/keepalived.conf`

**注意**

- priority 决定哪个 Master 是主，哪个 Master 是次。数字大的是主，数字小的是次。数字越大优先级越高。
- `virtual_router_id` 决定当前 VIP 的路由号，实际上 VIP 提供了一个虚拟的路由功能，该 VIP 在同一个子网内必须是唯一。
- virtual_ipaddress 提供的就是 VIP 的地址，该地址在子网内必须是空闲未必分配的。
- `state` 决定初始化时节点的状态，建议 `priority` 最高的节点设置为 `MASTER`。

```ini
# keepalived.cfg sample

global_defs {
    router_id lb-backup
}

vrrp_instance VI-kube-master {
    state BACKUP
    **priority 110**
    dont_track_primary
    interface eth0
    **virtual_router_id 51**
    advert_int 3
    virtual_ipaddress {
        **10.86.13.36**
    }
}
```

配置好后，那么先启动主 Master 的 keepalived 和 haproxy。

```bash
systemctl enable keepalived
systemctl start keepalived
systemctl enable haproxy
systemctl start haproxy
```

然后使用 ip a s 命令查看是否有 VIP 地址分配。如果看到 VIP 地址已经成功分配在 eth0 网卡上，说明 keepalived 启动成功。

```bash
[root@kube32 ~]# ip a s
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP qlen 1000
    link/ether 00:50:56:a9:d5:be brd ff:ff:ff:ff:ff:ff
    inet 10.86.13.32/23 brd 10.86.13.255 scope global eth0
       valid_lft forever preferred_lft forever
    **inet 10.86.13.36/32 scope global eth0**
       valid_lft forever preferred_lft forever
    inet6 fe80::250:56ff:fea9:d5be/64 scope link
       valid_lft forever preferred_lft forever
```

更保险方法还可以通过 `systemctl status keepalived -l` 看看 keepalived 的状态

```bash
[root@kube32 ~]# systemctl status keepalived -l
● keepalived.service - LVS and VRRP High Availability Monitor
   Loaded: loaded (/usr/lib/systemd/system/keepalived.service; enabled; vendor preset: disabled)
   Active: active (running) since Thu 2018-02-01 10:24:51 CST; 1 months 16 days ago
 Main PID: 13448 (keepalived)
   Memory: 6.0M
   CGroup: /system.slice/keepalived.service
           ├─13448 /usr/sbin/keepalived -D
           ├─13449 /usr/sbin/keepalived -D
           └─13450 /usr/sbin/keepalived -D

Mar 20 04:51:15 kube32 Keepalived_vrrp[13450]: VRRP_Instance(VI-kube-master) Dropping received VRRP packet...
**Mar 20 04:51:18 kube32 Keepalived_vrrp[13450]: (VI-kube-master): ip address associated with VRID 51 not present in MASTER advert : 10.86.13.36
Mar 20 04:51:18 kube32 Keepalived_vrrp[13450]: bogus VRRP packet received on eth0 !!!**
```

然后通过 systemctl status haproxy -l 看 haproxy 的状态

```bash
[root@kube32 ~]# systemctl status haproxy -l
● haproxy.service - HAProxy Load Balancer
   Loaded: loaded (/usr/lib/systemd/system/haproxy.service; enabled; vendor preset: disabled)
   Active: active (running) since Thu 2018-02-01 10:33:22 CST; 1 months 16 days ago
 Main PID: 15116 (haproxy-systemd)
   Memory: 3.2M
   CGroup: /system.slice/haproxy.service
           ├─15116 /usr/sbin/haproxy-systemd-wrapper -f /etc/haproxy/haproxy.cfg -p /run/haproxy.pid
           ├─15117 /usr/sbin/haproxy -f /etc/haproxy/haproxy.cfg -p /run/haproxy.pid -Ds
           └─15118 /usr/sbin/haproxy -f /etc/haproxy/haproxy.cfg -p /run/haproxy.pid -Ds
```

这个时候通过 kubectl version 命令，可以获取到 kubectl 的服务器信息。

```bash
[root@kube32 ~]# kubectl version
**Client Version: version.Info{Major:"1", Minor:"9", GitVersion:"v1.9.1", GitCommit:"3a1c9449a956b6026f075fa3134ff92f7d55f812", GitTreeState:"clean", BuildDate:"2018-01-03T22:31:01Z", GoVersion:"go1.9.2", Compiler:"gc", Platform:"linux/amd64"}
Server Version: version.Info{Major:"1", Minor:"9", GitVersion:"v1.9.1", GitCommit:"3a1c9449a956b6026f075fa3134ff92f7d55f812", GitTreeState:"clean", BuildDate:"2018-01-03T22:18:41Z", GoVersion:"go1.9.2", Compiler:"gc", Platform:"linux/amd64"}**
```

这个时候说明你的 keepalived 和 haproxy 都是成功的。这个时候你可以依次将你其他 Master 节点的 keepalived 和 haproxy 启动。 此时，你通过 ip a s 命令去查看其中一台 Master（*非主 Master*）的时候，你看不到 VIP，这个是正常的，因为 VIP 永远只在主 Master 节点上，只有当主 Master 节点挂掉后，才会切换到其他 Master 节点上。

```bash
[root@kube31 ~]# ip a s
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP qlen 1000
    link/ether 00:50:56:a9:07:23 brd ff:ff:ff:ff:ff:ff
    inet 10.86.13.31/23 brd 10.86.13.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::250:56ff:fea9:723/64 scope link
       valid_lft forever preferred_lft forever
```

在我的实践过程中，通过大神的脚本快速启动多个 Master 节点，会导致主 Master 始终获取不了 VIP，当时的报错非常奇怪。后来经过我的研究发现，主 Master 获取 VIP 是需要时间的，如果多个 Master 同时启动，会导致冲突。这个不知道是否算是 Keepalived 的 Bug。但是最稳妥的方式还是先启动一台主 Master，等 VIP 确定后再启动其他 Master 比较靠谱。

Kubernetes 通过 Keepalived + Haproxy 实现多个 Master 的高可用部署，你实际上可以采用其他方式，如外部的负载均衡方式。实际上 Kubernetes 的多个 Master 是没有主从的，都可以提供一致性服务。Keepalived + Haproxy 实际上就是提供了一个简单的负载均衡方式。

---

注：本文来自 [mendickxiao](https://github.com/mendickxiao) 的贡献。
