---
weight: 44
title: "CoreDNS 与集群 DNS：解析流程、Corefile 配置、Pod DNS 策略与性能调优"
linktitle: CoreDNS 与集群 DNS
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: coredns
description: "深入 Kubernetes 集群 DNS：Service 与 Pod 的 DNS 记录格式、Headless Service 与 StatefulSet 的稳定域名、CoreDNS 的 Corefile 插件链与默认配置解读、存根域与上游转发、Pod 的 dnsPolicy/dnsConfig 与 ndots:5 带来的查询放大问题、NodeLocal DNSCache、自动扩缩与常见故障排查。"
---

> 集群里一半的"网络问题"最后都归结为 DNS——理解 ndots:5 与搜索域如何把一次查询放大成五次，是每个 Kubernetes 运维者的必修课。

服务发现在 Kubernetes 中最终落到 DNS：应用用 `my-svc.my-ns` 这样的名字访问服务，由集群 DNS 把它翻译为 ClusterIP 或 Pod IP。自 v1.13 起 CoreDNS 成为默认的集群 DNS 服务器，kubeadm 在 v1.37 中部署的版本为 1.14.x（上游最新为 1.15）。本文从 DNS 记录的格式讲起，解析 CoreDNS 的配置方式、Pod 侧的解析行为，以及大规模集群中必须面对的性能问题。

## 集群 DNS 记录

kubelet 为每个 Pod 生成 `/etc/resolv.conf`，把 `nameserver` 指向 `kube-dns` Service 的 ClusterIP（通常是 Service CIDR 的第 10 个地址，如 `10.96.0.10`）。CoreDNS 通过 `kubernetes` 插件监听 API Server 的 Service、EndpointSlice 与 Namespace，动态生成以下记录：

{{< table title="集群 DNS 记录格式（集群域默认 cluster.local）" >}}

| 对象 | 记录 | 示例 | 说明 |
|------|------|------|------|
| 普通 Service | `<svc>.<ns>.svc.cluster.local` → A/AAAA（ClusterIP） | `web.prod.svc.cluster.local` → `10.96.12.34` | 双栈 Service 同时返回 A 与 AAAA |
| Headless Service（`clusterIP: None`） | 同上 → 所有就绪 Pod 的 IP 列表 | 返回多条 A 记录，客户端自行选择 | 用于客户端负载均衡、StatefulSet |
| Service 端口 | `_<port>._<proto>.<svc>.<ns>.svc.cluster.local` → SRV | `_grpc._tcp.api.prod.svc.cluster.local` | 携带端口号与目标主机名 |
| StatefulSet Pod | `<pod>.<headless-svc>.<ns>.svc.cluster.local` → A | `db-0.db.prod.svc.cluster.local` | 稳定的每副本域名 |
| 带 hostname/subdomain 的 Pod | `<hostname>.<subdomain>.<ns>.svc.cluster.local` → A | 需存在同名 Headless Service | |
| 任意 Pod | `<ip-with-dashes>.<ns>.pod.cluster.local` → A | `10-244-1-5.prod.pod.cluster.local` | 默认开启，实际很少使用 |
| 反向解析 | `in-addr.arpa` / `ip6.arpa` → PTR | | 仅 Service IP 与 Headless Pod |
| ExternalName Service | `<svc>.<ns>.svc.cluster.local` → CNAME | → `db.example.com` | 把集群内名字映射到外部域名 |

{{< /table >}}

Pod 的 `hostname` 默认为 Pod 名（StatefulSet 副本）或由 `spec.hostname` 指定，`setHostnameAsFQDN: true` 可让容器内的 `hostname` 命令返回完整域名。v1.37 GA 的 `hostnameOverride` 字段允许直接为 Pod 指定任意主机名（含 FQDN），不再受 Pod 名称与 `subdomain` 的组合限制。

## CoreDNS 的 Corefile

CoreDNS 的全部行为由 `kube-system/coredns` ConfigMap 中的 Corefile 定义，它是一条按声明顺序执行的插件链。kubeadm 生成的默认配置如下：

```text
.:53 {
    errors                              # 把错误写到标准输出
    health {                            # :8080/health 存活探针
        lameduck 5s                     # 关闭前继续服务 5 秒，配合滚动更新无损
    }
    ready                               # :8181/ready 就绪探针，所有插件就绪后返回 200
    kubernetes cluster.local in-addr.arpa ip6.arpa {
        pods insecure                   # 为任意 Pod IP 生成 A 记录（兼容 kube-dns 行为）
        fallthrough in-addr.arpa ip6.arpa   # 集群外 IP 的反向查询交给后续插件
        ttl 30
    }
    prometheus :9153                    # 指标端点
    forward . /etc/resolv.conf {        # 非集群域名转发到节点的上游 DNS
        max_concurrent 1000
    }
    cache 30                            # 缓存 30 秒（受记录 TTL 约束）
    loop                                # 检测转发环路，发现后退出
    reload                              # 热加载 Corefile 变更（约 2 分钟内生效）
    loadbalance                         # 轮询打乱 A/AAAA 记录顺序
}
```

常见的定制包括存根域（把某个域交给专用 DNS）、条件转发与自定义记录。下面的片段把 `corp.example.com` 转发到内网 DNS、为迁移中的旧域名添加别名、并限制 `cache` 对否定应答的缓存时间：

```text
corp.example.com:53 {
    errors
    cache 30
    forward . 10.10.0.53 10.10.0.54 {
        policy sequential
    }
}
.:53 {
    errors
    health { lameduck 5s }
    ready
    rewrite name legacy-api.prod.svc.cluster.local api.prod.svc.cluster.local
    hosts {
        10.20.0.5 registry.internal
        fallthrough
    }
    kubernetes cluster.local in-addr.arpa ip6.arpa {
        pods insecure
        fallthrough in-addr.arpa ip6.arpa
        ttl 30
    }
    prometheus :9153
    forward . /etc/resolv.conf { max_concurrent 1000 }
    cache {
        success 9984 30
        denial 9984 5                   # NXDOMAIN 只缓存 5 秒，避免新建 Service 被负缓存拖延
    }
    loop
    reload
    loadbalance
}
```

修改 ConfigMap 后 `reload` 插件会自动生效，也可以 `kubectl -n kube-system rollout restart deployment coredns` 立即重载。托管集群（EKS、GKE、AKS）大多允许编辑 Corefile，但部分插件可能被禁用，GKE 则使用 kube-dns 或 Cloud DNS 作为默认实现。

## Pod 的 DNS 策略与配置

`dnsPolicy` 决定 kubelet 为 Pod 生成怎样的 `resolv.conf`：

{{< table title="Pod dnsPolicy" >}}

| 取值 | 行为 |
|------|------|
| `ClusterFirst` | **默认**。集群域名查 CoreDNS，其余按 Corefile 转发到上游 |
| `ClusterFirstWithHostNet` | `hostNetwork: true` 的 Pod 若仍想使用集群 DNS，必须显式设置此值，否则默认退化为 `Default` |
| `Default` | 继承节点的 `/etc/resolv.conf`，无法解析集群内名字 |
| `None` | 忽略所有默认，完全由 `dnsConfig` 指定 |

{{< /table >}}

一个 `ClusterFirst` Pod 的 `resolv.conf` 典型内容如下：

```text
nameserver 10.96.0.10
search prod.svc.cluster.local svc.cluster.local cluster.local
options ndots:5
```

`ndots:5` 意味着任何点数少于 5 的名字都会先依次拼接搜索域尝试。应用解析 `api.example.com`（2 个点）时，解析器会依次查询 `api.example.com.prod.svc.cluster.local`、`api.example.com.svc.cluster.local`、`api.example.com.cluster.local`，全部 NXDOMAIN 后才查询 `api.example.com` 本身；若同时启用 IPv4/IPv6，每一步又各发 A 与 AAAA 两次。一次外部域名解析因此放大为 8 次查询，这是 CoreDNS 负载高、外部调用延迟抖动的首要原因。缓解手段按优先级排序：

- 在应用中对外部域名使用 FQDN（结尾加点，如 `api.example.com.`），解析器直接查询不走搜索域
- 通过 `dnsConfig` 调低 `ndots`，只访问同命名空间服务的应用可设为 1 或 2
- 在 Corefile 中用 `autopath @kubernetes` 让 CoreDNS 服务端完成搜索域展开，一次往返返回最终结果（需 `pods verified` 模式，内存开销更高）
- 部署 NodeLocal DNSCache 在节点本地吸收重复查询

```yaml
spec:
  dnsPolicy: ClusterFirst
  dnsConfig:
    options:
    - name: ndots
      value: "2"
    - name: single-request-reopen     # glibc 在同一套接字上并发 A/AAAA 时的 conntrack 竞争问题的规避项
    searches:
    - corp.example.com               # 追加的搜索域，总数上限 32 个、总长度 2048 字符
```

## NodeLocal DNSCache

NodeLocal DNSCache 以 DaemonSet 在每个节点运行一个 CoreDNS 实例，监听链路本地地址（约定为 `169.254.20.10`）并通过 iptables/nftables 规则把 Pod 发往 `kube-dns` ClusterIP 的查询劫持到本地。它带来三方面收益：

- 节点内命中缓存的查询不再经过网络，P99 延迟从毫秒级降到微秒级
- 上游连接从 UDP 改为 TCP 并保持长连接，规避了 conntrack 表项竞争导致的间歇性 5 秒超时（内核 race condition，表现为 DNS 查询偶发 5 秒延迟）
- 集中的 CoreDNS 副本只需处理缓存未命中，可以显著缩减副本数

部署时需按集群的 `kube-dns` ClusterIP 与集群域替换清单中的占位符；kubelet 的 `clusterDNS` 可以保持为 ClusterIP（劫持模式）或直接改为 `169.254.20.10`（不依赖 iptables，Cilium 等 eBPF 数据面推荐）。开启后应检查 Pod 的 `dnsPolicy: None` 与自定义 `nameserver` 是否绕过了本地缓存。

## 扩缩容与资源

CoreDNS 的负载与集群 QPS 而非节点数直接相关。kubeadm 默认部署 2 个副本并带 Pod 反亲和；大规模集群可部署 [cluster-proportional-autoscaler](https://github.com/kubernetes-sigs/cluster-proportional-autoscaler) 按节点数/核数线性扩缩，或按 `coredns_dns_request_duration_seconds` 与 CPU 使用率配置 HPA。关键指标包括：

- `coredns_dns_requests_total`：按类型/区域统计的 QPS
- `coredns_dns_responses_total{rcode="NXDOMAIN"}`：NXDOMAIN 比例过高通常意味着 ndots 放大
- `coredns_cache_hits_total` / `coredns_cache_misses_total`：缓存命中率
- `coredns_forward_requests_total` 与 `coredns_forward_responses_total{rcode="SERVFAIL"}`：上游健康
- `coredns_panics_total`、`coredns_reload_failed_total`

默认内存 limit 170Mi 适用于中小集群，Service/EndpointSlice 数量上万时需按约"每 1000 个 Service 10 – 20 MiB"的经验值上调，并关注 `kubernetes` 插件的 watch 开销。

## 故障排查

```bash
# 1. 从一个调试 Pod 验证集群内外解析
kubectl run -it --rm dns-test --image=registry.k8s.io/e2e-test-images/agnhost:2.66.1 -- \
  sh -c 'cat /etc/resolv.conf; nslookup kubernetes.default; nslookup kubernetes.io'

# 2. 检查 CoreDNS 状态、日志与端点
kubectl -n kube-system get pods -l k8s-app=kube-dns -o wide
kubectl -n kube-system logs -l k8s-app=kube-dns --tail=100
kubectl -n kube-system get endpointslices -l kubernetes.io/service-name=kube-dns

# 3. 临时开启查询日志（在 Corefile 中加入 log 插件）
kubectl -n kube-system edit configmap coredns      # 在 .:53 块中加入 "log"

# 4. 用 kubectl debug 在节点上抓包
kubectl debug node/<node> -it --image=nicolaka/netshoot -- tcpdump -ni any udp port 53
```

典型问题与原因：所有解析失败且日志出现 `loop` 退出 → 节点 `resolv.conf` 指向 127.0.0.53（systemd-resolved），应让 kubelet 使用 `/run/systemd/resolve/resolv.conf`；外部域名间歇超时 5 秒 → conntrack 竞争，部署 NodeLocal DNSCache 或设置 `single-request-reopen`；新建 Service 短时间解析不到 → 负缓存，调低 `cache` 的 `denial` TTL；`hostNetwork` Pod 解析不到集群服务 → 缺少 `ClusterFirstWithHostNet`。

## 总结

CoreDNS 用一条可插拔的插件链实现了集群 DNS 的全部功能，其默认配置适合开箱即用，但 `ndots:5` 与搜索域机制让外部域名解析被数倍放大，是大规模集群 DNS 负载与延迟问题的根源。通过 FQDN、调低 ndots、`autopath`、NodeLocal DNSCache 与按 QPS 扩缩 CoreDNS 副本的组合，可以把 DNS 从排障清单的首位移除；而理解 Service、Headless Service 与 StatefulSet 的记录格式，则是正确设计服务发现与有状态应用寻址的基础。

## 参考文献

- [DNS for Services and Pods - kubernetes.io](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)
- [Customizing DNS Service - kubernetes.io](https://kubernetes.io/docs/tasks/administer-cluster/dns-custom-nameservers/)
- [Using NodeLocal DNSCache in Kubernetes Clusters - kubernetes.io](https://kubernetes.io/docs/tasks/administer-cluster/nodelocaldns/)
- [Debugging DNS Resolution - kubernetes.io](https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/)
- [CoreDNS Plugins - coredns.io](https://coredns.io/plugins/)
- [cluster-proportional-autoscaler - github.com](https://github.com/kubernetes-sigs/cluster-proportional-autoscaler)
