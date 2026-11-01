---
weight: 5
title: 扁平网络 Flannel
linktitle: Flannel
date: 2022-05-21T00:00:00+08:00
description: 深入介绍 Kubernetes 网络插件 Flannel 的工作原理，包括网络架构、配置方式、与 Docker 的集成以及路由机制，帮助理解容器网络的底层实现。
lastmod: 2026-11-01T00:00:00+08:00
---

> Flannel 作为 Kubernetes 最主流的网络插件之一，为集群提供了简单高效的扁平网络方案，是理解容器网络实现原理的基础。

Flannel 是 Kubernetes 集群中广泛使用的网络插件，它为集群提供了简单而有效的网络解决方案。本文将通过实际案例详细介绍 Flannel 的工作原理和配置方式。

## 集群网络概览

在 Kubernetes 集群中，网络由多种 IP 地址类型组成。以下示例展示了一个包含三个节点的集群及其节点状态：

```bash
[root@node1 ~]# kubectl get nodes -o wide
NAME      STATUS    ROLES     AGE       VERSION   EXTERNAL-IP   OS-IMAGE                KERNEL-VERSION               CONTAINER-RUNTIME
node1     Ready     <none>    2d        v1.37.0   <none>        Ubuntu 24.04.2 LTS      6.8.0-60-generic             containerd://2.1.3
node2     Ready     <none>    2d        v1.37.0   <none>        Ubuntu 24.04.2 LTS      6.8.0-60-generic             containerd://2.1.3
node3     Ready     <none>    2d        v1.37.0   <none>        Ubuntu 24.04.2 LTS      6.8.0-60-generic             containerd://2.1.3
```

集群中 Pod 的分布情况如下：

```bash
[root@node1 ~]# kubectl get pods --all-namespaces -o wide
NAMESPACE     NAME                                              READY     STATUS    RESTARTS   AGE       IP            NODE
kube-system   coredns-6d4b75cb6d-sjqv9                          1/1       Running   0          1h        172.33.68.2   node1
kube-system   coredns-6d4b75cb6d-tkfrc                          1/1       Running   1          1h        172.33.96.3   node3
kube-system   metrics-server-684c7f9488-z6sdz                   1/1       Running   0          1h        172.33.31.3   node2
kube-system   kubernetes-dashboard-6b66b8b96c-mnm2c             1/1       Running   0          1h        172.33.31.2   node2
```

Kubernetes 网络中常见的三类 IP 地址：

- **Node IP**：宿主机物理网络 IP，用于节点间通信
- **Pod IP**：由网络插件（如 Flannel）分配，实现跨节点 Pod 通信
- **Cluster IP**：Service 虚拟 IP，通过 kube-proxy 的 iptables/nftables 规则提供服务访问

## Flannel 网络架构

Flannel 通过为每个节点分配独立子网、维护路由和支持多种后端，实现了 Kubernetes 集群的扁平网络。

### 工作原理

Flannel 作为二进制程序部署在每个节点上，主要实现以下功能：

1. **子网分配**：为每个节点分配独立的子网段，确保 Pod IP 不冲突
2. **路由管理**：动态维护跨节点的路由信息，实现 Pod 间通信
3. **网络封装**：支持多种后端实现（VXLAN、host-gw、UDP 等）

### 网络拓扑

下图展示了使用 `host-gw` 后端的 Flannel 网络架构：

![flannel 网络架构（图片来自 openshift）](https://assets.jimmysong.io/images/book/kubernetes-handbook/networking/flannel/flannel-networking.webp)
{width=1520 height=1039}

### 网络配置的存储方式

Flannel 支持两种子网管理器：早期部署直接把网络配置写入独立的 etcd；如今在 Kubernetes 中部署时默认使用 `--kube-subnet-mgr` 模式，网络配置来自 `kube-flannel-cfg` ConfigMap，每个节点的子网则从 Node 对象的 `spec.podCIDR` 读取，并把 VTEP MAC、公网 IP 等信息写回 Node 注解（`flannel.alpha.coreos.com/*`），完全不依赖额外的 etcd。

```bash
# kube-subnet-mgr 模式：查看集群网络配置
kubectl -n kube-flannel get cm kube-flannel-cfg -o jsonpath='{.data.net-conf\.json}'
{"Network":"10.244.0.0/16","Backend":{"Type":"vxlan"}}

# 查看某节点分配到的子网与 Flannel 注解
kubectl get node node1 -o jsonpath='{.spec.podCIDR}{"\n"}{.metadata.annotations}'
```

以下是 etcd 子网管理器模式下的等价查询，仅在存量的独立 etcd 部署中仍会用到：

```bash
# 查看子网分配情况
[root@node1 ~]# etcdctl ls /kube-centos/network/subnets
/kube-centos/network/subnets/172.33.68.0-24
/kube-centos/network/subnets/172.33.31.0-24
/kube-centos/network/subnets/172.33.96.0-24

# 查看网络配置
[root@node1 ~]# etcdctl get /kube-centos/network/config
{"Network":"172.33.0.0/16","SubnetLen":24,"Backend":{"Type":"host-gw"}}
```

配置字段说明：

- `Network`：整个集群的网络段
- `SubnetLen`：每个节点分配的子网掩码长度
- `Backend`：网络实现方式（vxlan、host-gw、wireguard、ipip 等；`udp` 后端早已弃用）

## Flannel 配置详解

Flannel 的部署和运行依赖于系统服务和环境变量配置。

### 服务配置

以下为 Node1 上的 Flannel 服务配置文件：

```bash
[root@node1 ~]# cat /usr/lib/systemd/system/flanneld.service
[Unit]
Description=Flanneld overlay address etcd agent
After=network.target
After=network-online.target
Wants=network-online.target
After=etcd.service
Before=docker.service

[Service]
Type=notify
EnvironmentFile=/etc/sysconfig/flanneld
EnvironmentFile=-/etc/sysconfig/docker-network
ExecStart=/usr/bin/flanneld-start $FLANNEL_OPTIONS
ExecStartPost=/usr/libexec/flannel/mk-docker-opts.sh -k DOCKER_NETWORK_OPTIONS -d /run/flannel/docker
Restart=on-failure

[Install]
WantedBy=multi-user.target
RequiredBy=docker.service
```

### 环境变量配置

Flannel 主配置文件内容如下：

```bash
[root@node1 ~]# cat /etc/sysconfig/flanneld
# Flanneld configuration options
FLANNEL_ETCD_ENDPOINTS="http://172.17.8.101:2379"
FLANNEL_ETCD_PREFIX="/kube-centos/network"
FLANNEL_OPTIONS="-iface=eth2"
```

### 动态生成的配置

Flannel 启动后会自动生成以下配置文件，供 Docker 等容器运行时使用。

**Docker 网络配置** (`/run/flannel/docker`)：

```bash
[root@node1 ~]# cat /run/flannel/docker
DOCKER_OPT_BIP="--bip=172.33.68.1/24"
DOCKER_OPT_IPMASQ="--ip-masq=true"
DOCKER_OPT_MTU="--mtu=1500"
DOCKER_NETWORK_OPTIONS="--bip=172.33.68.1/24 --ip-masq=true --mtu=1500"
```

**子网环境变量** (`/run/flannel/subnet.env`)：

```bash
[root@node1 ~]# cat /run/flannel/subnet.env
FLANNEL_NETWORK=172.33.0.0/16
FLANNEL_SUBNET=172.33.68.1/24
FLANNEL_MTU=1500
FLANNEL_IPMASQ=false
```

## 容器运行时集成

Flannel 通过与容器运行时（如 Docker）集成，实现 Pod 网络的自动配置和管理。

### 网络接口分析

查看节点的网络接口，可以了解 Flannel 与宿主机、容器的网络连接关系。

```bash
[root@node1 ~]# ip addr show
# 主要接口说明：
# lo: 回环接口 (127.0.0.1)
# eth0: NAT 网络接口
# eth1: 集群内部通信接口 (172.17.8.101/24)
# eth2: 外网访问接口
# docker0: Docker 网桥 (172.33.68.1/24)
# veth对: 连接容器与网桥的虚拟网卡对
```

网络接口类型说明：

- **物理接口**：实际的网络硬件接口
- **虚拟网桥**：软件实现的二层交换设备
- **veth pair**：成对出现的虚拟网络接口，用于连接不同的网络命名空间

### 容器网络检查

通过 Docker 命令可以检查当前网络配置和容器连接情况。

```bash
[root@node1 ~]# docker network ls
NETWORK ID          NAME                DRIVER              SCOPE
940bb75e653b        bridge              bridge              local
d94c046e105d        host                host                local
2db7597fd546        none                null                local

# 检查 bridge 网络详情
[root@node1 ~]# docker network inspect bridge
# 输出包含子网配置、网关设置、连接的容器等信息
```

## 路由机制

Flannel 自动维护节点间的路由表，实现跨节点 Pod 通信。

### 路由表分析

以下为 Node1 的路由信息：

```bash
[root@node1 ~]# route -n
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         10.0.2.2        0.0.0.0         UG    100    0        0 eth0
172.17.8.0      0.0.0.0         255.255.255.0   U     100    0        0 eth1
172.33.68.0     0.0.0.0         255.255.255.0   U     0      0        0 docker0
172.33.31.0     172.17.8.102    255.255.255.0   UG    0      0        0 eth1
172.33.96.0     172.17.8.103    255.255.255.0   UG    0      0        0 eth1
```

路由规则说明：

- 本地子网（172.33.68.0/24）直接通过 docker0 网桥
- 远程子网通过对应节点的 IP 地址路由
- Flannel 自动维护这些路由规则

### 跨节点通信测试

以下为从 node1 访问 node3 上 Pod 的通信流程：

```bash
[root@node1 ~]# traceroute 172.33.96.3
traceroute to 172.33.96.3 (172.33.96.3), 30 hops max, 60 byte packets
 1  172.17.8.103 (172.17.8.103)  0.518 ms  0.367 ms  0.398 ms
 2  172.33.96.3 (172.33.96.3)  0.451 ms  0.352 ms  0.223 ms
```

通信流程说明：

1. 数据包从 node1 发出
2. 根据路由表转发到 node3（172.17.8.103）
3. node3 接收后转发到目标 Pod

## 防火墙规则

Kubernetes 会在 iptables 中注入相关规则，保障网络安全和流量转发。

```bash
[root@node1 ~]# iptables -L -n
# 主要规则链：
# KUBE-SERVICES: Service 访问规则
# KUBE-FORWARD: 转发规则
# KUBE-FIREWALL: 防火墙规则
```

重要规则说明：

- **KUBE-SERVICES**：处理 Service 的负载均衡
- **KUBE-FORWARD**：允许 Pod 间的转发通信
- **DOCKER** 链：处理容器网络的 NAT 规则

## 最佳实践

在生产环境中，合理配置 Flannel 可提升网络性能和稳定性。

### 性能优化

- **选择合适的后端**：
- `host-gw`：性能最佳，要求节点在同一二层子网
- `vxlan`：默认后端，适用于复杂网络环境，有轻微封装开销；可开启 `DirectRouting` 在同子网节点间自动走直连路由
- `wireguard`：需要节点间加密传输时选用
- **NetworkPolicy**：Flannel 本身不实现 NetworkPolicy，如有需求需搭配 kube-router 或改用 Calico/Cilium
- **MTU 设置**：
- 根据底层网络调整 MTU 值
- 避免数据包分片导致的性能问题

### 故障排查

常见问题及解决方法：

**Pod 无法跨节点通信**：

- 检查路由表是否正确
- 验证防火墙规则
- 确认 Flannel 服务状态

**网络性能问题**：

- 检查 MTU 配置
- 监控网络接口状态
- 分析网络延迟和丢包

## 总结

Flannel 作为 Kubernetes 最常用的网络插件之一，通过子网分配、路由维护和多后端支持，为集群提供了高效、易用的扁平网络方案。理解 Flannel 的工作原理和配置细节，有助于优化集群网络性能、提升故障排查效率。建议结合实际场景选择合适的后端和参数配置，持续关注网络健康和安全。

## 参考文献

- [Flannel 官方文档 - github.com](https://github.com/flannel-io/flannel)
- [Kubernetes 网络模型 - kubernetes.io](https://kubernetes.io/docs/concepts/cluster-administration/networking/)
- [CNI 规范 - github.com](https://github.com/containernetworking/cni)
- [Linux 网络虚拟化技术 - kernel.org](https://www.kernel.org/doc/Documentation/networking/)
