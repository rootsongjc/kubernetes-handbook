---
weight: 3
title: "IPv4/IPv6 双栈与纯 IPv6 集群"
linktitle: 双栈网络
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: dual-stack
description: "讲解 Kubernetes 的 IPv4/IPv6 双栈网络：控制面与节点的 CIDR 配置、Pod 与 Service 的地址族字段（ipFamilyPolicy/ipFamilies/podIPs/hostIPs）、ServiceCIDR 动态扩展（v1.33 GA）、CNI 与负载均衡器的双栈支持、纯 IPv6 集群与 NAT64/DNS64 出口、kubeadm 双栈初始化，以及迁移与排障要点。"
---

> IPv4 私网地址在大规模集群中早已捉襟见肘，而双栈不只是"加一个地址"——它改变了 Service、DNS、网络策略与出口路径的每一个细节。

Kubernetes 自 v1.23 起 GA 支持 IPv4/IPv6 双栈，v1.21 起默认开启。随着 Pod 规模突破 /16 私网容量、云厂商与运营商普遍提供 IPv6、以及部分地区的合规要求，双栈乃至纯 IPv6 集群正从实验走向生产。本文梳理双栈在控制面、节点、Pod、Service 与出口各层的配置与行为。

## 地址族模型

双栈集群中每个 Pod 同时拥有一个 IPv4 与一个 IPv6 地址，Service 可以按需拥有一个或两个 ClusterIP。相关字段如下：

{{< table title="双栈相关的 API 字段" >}}

| 对象 | 字段 | 说明 |
|------|------|------|
| Pod | `status.podIP` / `status.podIPs` | `podIP` 为主地址（与集群首选族一致），`podIPs` 列出全部地址，最多每族一个 |
| Pod | `status.hostIP` / `status.hostIPs` | 节点地址，同上 |
| Node | `spec.podCIDRs` | 节点被分配的 Pod CIDR 列表，每族一个 |
| Service | `spec.ipFamilyPolicy` | `SingleStack`（默认）、`PreferDualStack`、`RequireDualStack` |
| Service | `spec.ipFamilies` | 地址族顺序 `["IPv4","IPv6"]` 或 `["IPv6","IPv4"]`，决定 `clusterIP` 取哪个 |
| Service | `spec.clusterIP` / `spec.clusterIPs` | 主 ClusterIP 与全部 ClusterIP |
| EndpointSlice | `addressType` | `IPv4` 或 `IPv6`，双栈 Service 会有两组 EndpointSlice |
| ServiceCIDR / IPAddress | `networking.k8s.io/v1` | 集群的 Service 地址段与已分配地址对象（v1.33 GA） |

{{< /table >}}

Service 的 `ipFamilyPolicy` 决定分配行为：`SingleStack` 只从首选族分配；`PreferDualStack` 在集群支持双栈时分配两族地址，否则退化为单栈；`RequireDualStack` 要求两族都分配，集群不支持时创建失败。`ipFamilies` 可省略（按集群首选族）或显式指定顺序，还可用于在双栈集群中创建纯 IPv6 的单栈 Service。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  ipFamilyPolicy: PreferDualStack
  ipFamilies: ["IPv6", "IPv4"]           # IPv6 为主，clusterIP 取 IPv6 地址
  selector: { app: web }
  ports:
  - port: 80
```

已存在的 Service 可以在单栈与双栈之间转换（添加或移除次要地址族），但不能改变主地址族。无选择器的 Headless Service 需要显式设置 `ipFamilies`，否则默认为 IPv4 单栈。

## 控制面与节点配置

启用双栈需要控制面、kube-proxy、kubelet 与 CNI 四方一致。kubeadm 的配置如下：

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: ClusterConfiguration
networking:
  podSubnet: 10.244.0.0/16,fd00:10:244::/56
  serviceSubnet: 10.96.0.0/16,fd00:10:96::/112
controllerManager:
  extraArgs:
  - name: node-cidr-mask-size-ipv4
    value: "24"
  - name: node-cidr-mask-size-ipv6
    value: "64"
---
apiVersion: kubeadm.k8s.io/v1beta4
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: 10.0.0.10
nodeRegistration:
  kubeletExtraArgs:
  - name: node-ip
    value: 10.0.0.10,fd00:10::10          # 裸金属节点必须显式指定两族地址
```

几个约束值得注意：旧的位图式 Service 地址分配器要求 IPv6 Service CIDR 掩码不小于 /108，v1.33 GA 的基于 `IPAddress` 对象的分配器取消了该限制，但 kubeadm 示例与多数发行版仍习惯使用 /112；Pod 的 IPv6 CIDR 每节点默认 /64；`--node-ip` 在没有云控制器的裸金属节点上必须同时提供两族地址，顺序决定节点的首选族。云厂商托管集群（EKS、AKS、GKE）在创建集群时选择双栈模式即可，不能事后开启。

### ServiceCIDR 的动态扩展

传统上 Service CIDR 在集群初始化时固定，耗尽后只能重建集群。v1.33 GA 的 `MultiCIDRServiceAllocator` 把 Service 地址管理改为 `ServiceCIDR` 与 `IPAddress` 两种 API 对象：kube-apiserver 的 `--service-cluster-ip-range` 成为名为 `kubernetes` 的默认 `ServiceCIDR`，管理员可以随时追加新的地址段：

```yaml
apiVersion: networking.k8s.io/v1
kind: ServiceCIDR
metadata:
  name: extra-ipv6
spec:
  cidrs:
  - fd00:10:97::/112
```

`kubectl get servicecidrs` 与 `kubectl get ipaddresses` 可查看地址段与每个已分配地址的归属，排查地址冲突比以前读取 etcd 位图直观得多。新增 ServiceCIDR 后需要让 kube-proxy 与 CNI 也能路由该段（通常依赖它们监听 ServiceCIDR 对象或重新配置 `--cluster-cidr`）。

## CNI、kube-proxy 与负载均衡

双栈需要 CNI 为 Pod 同时配置两族地址与路由。Calico、Cilium、Flannel（VXLAN 模式）、kube-ovn、云厂商 CNI 均支持双栈，但配置方式各异：Cilium 需开启 `ipv6.enabled=true` 并配置 `ipv6NativeRoutingCIDR` 或 IPv6 隧道；Calico 需在 `IPPool` 中为 IPv6 启用 NAT 与 BGP/VXLAN。NetworkPolicy 的 `ipBlock` 对两族独立生效，一条只写 IPv4 CIDR 的策略不会约束 IPv6 流量——这是双栈迁移中最常见的安全盲区。

kube-proxy 的 iptables/nftables 模式都支持双栈（分别维护两套规则表），`--cluster-cidr` 需提供两族 CIDR。nftables 模式（v1.33 GA，见 [kube-proxy 模式](../kube-proxy-modes)）在双栈大规模 Service 下性能优势明显。Cilium 的 eBPF kube-proxy 替代同样支持双栈。

`LoadBalancer` 类型的 Service 要获得两族外部地址，需要云负载均衡器控制器或 MetalLB 支持双栈：AWS NLB（IPv4 与 dualstack 模式）、Azure 标准 LB、GCP 外部 LB 均提供；MetalLB 可为双栈 Service 从两个地址池各分配一个。Gateway API 的 `Gateway.spec.addresses` 同样可列出两族地址，具体取决于实现。

## 纯 IPv6 集群

纯 IPv6（IPv6-only）集群只配置 IPv6 的 Pod 与 Service CIDR，彻底摆脱私网地址规划与 NAT 开销，地址空间几乎无限（一个 /56 可容纳 256 个 /64 节点段）。它的难点在于出口：互联网上仍有大量仅 IPv4 的服务（镜像仓库、第三方 API、SaaS）。标准解法是在集群边界部署 **NAT64 + DNS64**：DNS64 为只有 A 记录的域名合成 `64:ff9b::/96` 前缀的 AAAA 记录，NAT64 网关把这些流量转换为 IPv4。CoreDNS 可用 `dns64` 插件实现 DNS64，云厂商（AWS、GCP、Azure）为 IPv6 子网提供托管 NAT64；集群内所有组件（kubelet 拉镜像、Webhook、外部 Secret 同步）也都走这条路径。

Kubernetes 自身对纯 IPv6 的支持完整，但生态组件偶有缺口：某些 Operator 硬编码 `0.0.0.0` 监听地址、某些镜像内置的健康检查使用 `127.0.0.1`、部分 Helm Chart 的 IP 校验正则只匹配 IPv4。迁移前应在测试集群中全量部署一遍并检查日志。

## kube-proxy 与应用层的注意点

- **DNS**：双栈 Service 同时返回 A 与 AAAA，客户端按 RFC 6724 偏好 IPv6；若 Pod 只监听 IPv4（`0.0.0.0`），IPv6 连接会失败后回退，带来延迟。应用应监听 `::`（Linux 上默认同时接受 IPv4 映射地址）
- **ndots 放大**：双栈下每个搜索域要查 A 与 AAAA 两次，[CoreDNS](../../service-discovery/coredns) 章节讨论的 `ndots:5` 放大问题在双栈集群更为突出
- **源 IP 与日志**：审计日志、访问日志、`X-Forwarded-For` 中会同时出现两族地址，IP 白名单需同时维护两族 CIDR
- **Pod 到外部 IPv4 服务**：双栈集群中 Pod 走 IPv4 地址 + SNAT 出口即可；纯 IPv6 集群依赖 NAT64
- **严格地址校验**：`StrictIPCIDRValidation`（v1.36 Beta 默认开启）拒绝带前导零（`010.0.0.1`）、IPv4 映射 IPv6（`::ffff:10.0.0.1`）等非规范格式的地址进入 API 对象，迁移前需检查 Service/NetworkPolicy/Ingress 中的地址书写

## 验证双栈

```bash
# 节点的两族 Pod CIDR
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.podCIDRs}{"\n"}{end}'

# Pod 的两族地址
kubectl get pod web-0 -o jsonpath='{.status.podIPs}'

# 创建双栈 Service 并查看分配结果
kubectl get svc web -o jsonpath='{.spec.ipFamilyPolicy}{"\t"}{.spec.clusterIPs}{"\n"}'

# ServiceCIDR 与地址分配
kubectl get servicecidrs
kubectl get ipaddresses | head

# 从 Pod 内分别测试两族连通性
kubectl exec web-0 -- sh -c 'wget -qO- -4 http://web.default.svc; wget -qO- -6 http://web.default.svc'
```

## 总结

双栈让 Kubernetes 在不放弃 IPv4 兼容的前提下引入 IPv6 的地址空间与端到端可达性，其核心在于控制面、kube-proxy、kubelet 与 CNI 四方 CIDR 配置的一致，以及 Service 通过 `ipFamilyPolicy`/`ipFamilies` 对地址族的显式声明。`ServiceCIDR` API 消除了 Service 地址耗尽只能重建集群的历史痛点，而纯 IPv6 集群配合 NAT64/DNS64 已是大规模与地址受限场景的现实选项。迁移时最需要警惕的是只覆盖 IPv4 的网络策略与 IP 白名单——双栈的每一条安全规则都必须成对出现。

## 参考文献

- [IPv4/IPv6 dual-stack - kubernetes.io](https://kubernetes.io/docs/concepts/services-networking/dual-stack/)
- [Validate IPv4/IPv6 dual-stack - kubernetes.io](https://kubernetes.io/docs/tasks/network/validate-dual-stack/)
- [Dual-stack support with kubeadm - kubernetes.io](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/dual-stack-support/)
- [Service ClusterIP allocation - kubernetes.io](https://kubernetes.io/docs/concepts/services-networking/cluster-ip-allocation/)
- [Extend Service IP Ranges - kubernetes.io](https://kubernetes.io/docs/tasks/network/extend-service-ip-ranges/)
- [Cilium IPv6 - docs.cilium.io](https://docs.cilium.io/en/stable/network/concepts/ipam/)
