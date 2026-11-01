---
weight: 2
title: "kube-proxy 模式演进：iptables、IPVS 与 nftables"
linktitle: kube-proxy 模式演进
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: kube-proxy-modes
description: "梳理 kube-proxy 三种 Linux 数据面模式的原理与演进：iptables 的规则增长问题、IPVS 的兴衰与弃用时间表（v1.35 弃用、v1.43 移除）、v1.33 GA 的 nftables 模式及其迁移注意事项，以及 Cilium 等 eBPF 方案替代 kube-proxy 的选择。"
---

> 十年间 Service 数据面从 iptables 走到 IPVS 再回到 netfilter 家族的 nftables，这条看似绕路的曲线恰恰说明：与 Kubernetes Service 语义的匹配度比单点性能更重要。

每个节点上的 kube-proxy 负责把 Service 的虚拟 IP（ClusterIP、NodePort、LoadBalancer）转换为指向后端 Pod 的转发规则。它监听 Service 与 EndpointSlice 的变化，并通过某种内核机制把流量 DNAT 到选中的端点。这"某种内核机制"就是 kube-proxy 的**代理模式**，由 `--proxy-mode` 参数或 KubeProxyConfiguration 的 `mode` 字段决定。Linux 上有 iptables、ipvs、nftables 三种模式，Windows 上只有 kernelspace 一种。本文聚焦 Linux 三种模式的原理、差异与演进脉络。

## 三种模式概览

{{< table title="kube-proxy Linux 代理模式对比（v1.37）" >}}

| 维度             | iptables                         | ipvs                                   | nftables                              |
|------------------|----------------------------------|----------------------------------------|---------------------------------------|
| 内核机制         | netfilter iptables 规则链         | 内核 IPVS 哈希表 + 少量 iptables 辅助规则 | netfilter nftables 规则与集合（set/map） |
| 引入版本         | v1.2（v1.14 起默认）              | v1.8 Alpha，v1.11 GA                    | v1.29 Alpha，v1.31 Beta，v1.33 GA      |
| 当前状态         | **默认模式**                      | **v1.35 弃用**，v1.40 默认关闭，v1.43 移除 | GA，官方计划作为未来默认模式           |
| 规则规模         | 随 Service × 端点线性增长         | 常数级（哈希表）                        | 使用 set/map，近似常数级               |
| 规则同步开销     | 大集群下明显，v1.28 后改为增量更新 | 低                                      | 低，优于 iptables                      |
| 数据面转发性能   | 规则线性匹配，万级 Service 时下降  | 高                                      | 高，万级 Service 以上才体现差距        |
| 负载均衡算法     | 随机                              | rr、wrr、lc、wlc、sh、dh、sed、nq、mh 等 | 随机                                  |
| 内核要求         | 任意                              | 需加载 IPVS 模块                        | 内核 5.13+                             |
| Service 语义完整性 | 完整                             | 存在无法正确实现的边缘场景               | 完整                                  |

{{< /table >}}

## iptables 模式

iptables 模式是最早且至今仍是默认的实现。kube-proxy 为每个 Service 创建一组规则链（`KUBE-SERVICES` → `KUBE-SVC-xxx` → `KUBE-SEP-xxx`），访问 ClusterIP 的数据包依次匹配这些链，最终由 `KUBE-SEP-xxx` 链以 `statistic --mode random` 的概率规则选中一个端点并执行 DNAT。

它的优点是依赖最少、行为透明、Service 的全部语义（会话亲和、`externalTrafficPolicy`、终止端点处理等）都实现得最完整；缺点是规则数量与 Service 数、端点数成正比。在数万 Pod 的集群中，内核需要线性遍历大量规则，更新一次规则也要重写整张表。v1.28 起 iptables 模式改为只更新发生变化的 Service/EndpointSlice，同步性能大幅改善，以往"把 `minSyncPeriod` 调大来缓解"的建议已经不再需要：

```yaml
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
mode: iptables
iptables:
  minSyncPeriod: 1s    # 默认值，v1.28 后通常无需调大
  syncPeriod: 30s
```

若 `sync_proxy_rules_duration_seconds` 指标的均值远高于 1 秒，说明集群规模已经触及 iptables 模式的上限，应考虑切换到 nftables。

## IPVS 模式

IPVS（IP Virtual Server）是 Linux 内核内建的四层负载均衡器，基于哈希表而非线性规则链，天然适合大量虚拟服务。kube-proxy 的 IPVS 模式在 v1.8 引入、v1.11 GA，曾是大规模集群的标准选择，并提供了丰富的调度算法（通过 `ipvs.scheduler` 配置）：轮询 `rr`、加权轮询 `wrr`、最少连接 `lc`/`wlc`、源/目的哈希 `sh`/`dh`、最短期望延迟 `sed`、永不排队 `nq`、Maglev 哈希 `mh` 等。

然而 IPVS 是为传统负载均衡器设计的 API，与 Kubernetes Service 的模型并不完全匹配：它仍需要借助 iptables/ipset 处理 NodePort、`externalTrafficPolicy`、伪装等逻辑，一些边缘语义（如对终止中端点的处理、某些会话亲和场景）始终无法正确实现。官方文档对此的总结是"内核 IPVS API 与 Kubernetes Services API 是一个糟糕的匹配"。随着 nftables 模式在同步与转发性能上同时超越 IPVS，继续维护两套半数据面失去了意义：

- **v1.35**：IPVS 模式标记为弃用
- **v1.40**：默认关闭，需要通过 `KubeProxyIPVS` 特性门控显式启用
- **v1.43**：彻底移除

仍在使用 IPVS 的集群应规划迁移。对无法满足 nftables 内核要求（5.13+）的老旧节点，官方建议退回 iptables 模式而不是停留在 IPVS，因为 iptables 模式的性能在 IPVS 推出之后已有显著提升。

## nftables 模式

nftables 是 iptables 的继任者，同属 netfilter 子系统，但提供了集合（set）、映射（map）、原子事务更新等更高层的抽象。kube-proxy 的 nftables 模式（KEP-3866）v1.29 Alpha、v1.31 Beta 默认开启、v1.33 GA，用 map 保存"Service IP:端口 → 端点集合"的映射，一次查表即可完成匹配，规则总量不再随 Service 数线性膨胀，规则更新也以事务方式批量提交。官方描述其为"iptables 与 ipvs 两种模式的共同替代者，性能优于两者"。

启用方式非常简单：

```yaml
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
mode: nftables
nftables:
  minSyncPeriod: 1s
  syncPeriod: 30s
  masqueradeAll: false
```

使用 kubeadm 部署的集群可以修改 `kube-system/kube-proxy` ConfigMap 后滚动重启 kube-proxy DaemonSet。由于 v1.37 的默认值仍是 iptables、未来版本会切换为 nftables，官方强烈建议**所有集群显式写明 `mode`**，避免升级时数据面被意外更换。

### 从 iptables 迁移到 nftables 的差异

nftables 模式在设计时有意修正了 iptables 模式的几个历史行为，迁移前需要逐项确认：

{{< table title="iptables 与 nftables 模式的行为差异" >}}

| 行为                     | iptables 模式                                   | nftables 模式                                                     |
|--------------------------|-------------------------------------------------|-------------------------------------------------------------------|
| NodePort 监听地址        | 默认所有本地 IP                                  | 默认 `--nodeport-addresses primary`，仅节点主 IPv4/IPv6；可显式设为 `0.0.0.0/0` |
| NodePort 与本地防火墙    | 为每个 NodePort 自动添加放行规则                  | 不再添加，需自行在防火墙放行整个 NodePort 范围                      |
| 6.1 之前内核的 conntrack 缺陷 | 默认安装规避规则（可能引发其他问题）           | 默认不安装；若 `iptables_ct_state_invalid_dropped_packets_total` 非零，可加 `--conntrack-tcp-be-liberal` |
| 通过 127.0.0.1 访问 NodePort | 默认可用                                     | 默认不可用；v1.37 起可用 Alpha 门控 `KubeProxyNFTablesLocalhostNodePorts` 并设置 `--nodeport-addresses primary,localhost` |

{{< /table >}}

可以在切换前检查 `iptables_localhost_nodeports_accepted_packets_total` 指标：若非零，说明有客户端依赖 localhost 访问 NodePort，需要先调整客户端或启用相应门控。

### 迁移步骤建议

- 确认所有节点内核版本不低于 5.13，并安装 `nft` 用户态工具便于排障
- 在一个节点池上把 `mode` 改为 `nftables` 灰度验证，重点观察 NodePort、`externalTrafficPolicy: Local`、会话亲和与长连接服务
- 检查上述四项差异对应的指标与防火墙配置
- 全量切换后监控 `sync_proxy_rules_duration_seconds` 与 `kubeproxy_sync_proxy_rules_last_timestamp_seconds`
- 切换模式时 kube-proxy 会自动清理旧模式残留的大部分规则，但建议在维护窗口内滚动重启节点以彻底清理

## 替代 kube-proxy：eBPF 数据面

上述三种模式都基于 netfilter 的"规则匹配 + DNAT"思路。Cilium、Calico eBPF 模式等 CNI 插件则用 eBPF 程序在套接字层或 TC 层直接完成 Service 到端点的转换：ClusterIP 的转换可在 `connect()` 系统调用时完成（socket LB），根本不产生 NAT 后的数据包，延迟更低，也天然支持 Maglev 一致性哈希、DSR（直接服务器返回）等高级能力。

```yaml
# Cilium Helm values 示例：完全接管 Service 负载均衡
kubeProxyReplacement: true
k8sServiceHost: <API Server 地址>
k8sServicePort: 6443
loadBalancer:
  algorithm: maglev
  mode: dsr
```

启用后集群中不再需要部署 kube-proxy，Node 对象的 `status.nodeInfo.kubeProxyVersion` 字段为空（该字段自 v1.31 起已弃用）。选择 eBPF 方案意味着把 Service 数据面与 CNI 绑定，需要评估团队对 eBPF 工具链（`cilium monitor`、`bpftool`、Hubble）的掌握程度。

## 选型建议

- **新建集群**：直接使用 nftables 模式并显式配置；若已选定 Cilium 等 eBPF CNI，可直接启用 kube-proxy 替代
- **存量 iptables 集群**：若 Service 规模未触及性能瓶颈，可以继续使用，但应在配置中显式写明 `mode: iptables`，并把 nftables 迁移纳入未来一到两个版本的升级计划
- **存量 IPVS 集群**：在 v1.40 之前完成向 nftables 或 eBPF 的迁移；依赖特定 IPVS 调度算法（如 `sh`、`mh`）的场景可用 Cilium 的 Maglev/会话亲和能力替代
- **老旧内核节点**：无法升级到 5.13+ 时使用 iptables，而非 IPVS

## 总结

kube-proxy 的数据面正在完成从 iptables/IPVS 向 nftables 的代际更替：nftables 以更低的同步与转发开销、更完整的 Service 语义取代了两位前辈，IPVS 则进入了明确的弃用倒计时。与此同时，eBPF 方案提供了另一条绕开 netfilter 的路径。无论选择哪条路线，显式声明代理模式、按版本节奏提前迁移，都是保证集群升级平滑的基本功。

## 参考文献

- [Virtual IPs and Service Proxies - kubernetes.io](https://kubernetes.io/docs/reference/networking/virtual-ips/)
- [Kubernetes v1.33: nftables backend for kube-proxy graduates to GA - kubernetes.io](https://kubernetes.io/blog/2025/04/23/kubernetes-v1-33-release/#nftables-backend-for-kube-proxy)
- [KEP-3866: Add an nftables-based kube-proxy backend - github.com](https://github.com/kubernetes/enhancements/tree/master/keps/sig-network/3866-nftables-proxy)
- [kube-proxy Configuration (v1alpha1) - kubernetes.io](https://kubernetes.io/docs/reference/config-api/kube-proxy-config.v1alpha1/)
- [Kubernetes Without kube-proxy - docs.cilium.io](https://docs.cilium.io/en/stable/network/kubernetes/kubeproxy-free/)
