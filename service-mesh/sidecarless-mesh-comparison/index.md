---
weight: 7
title: "无 Sidecar 服务网格：Istio Ambient、Cilium 与 Linkerd 的架构对比"
linktitle: 无 Sidecar 网格对比
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: sidecarless-mesh-comparison
description: "对比三种服务网格数据面架构：Istio Ambient 的 ztunnel（每节点 L4）+ waypoint（每命名空间 L7）分层、Cilium 基于 eBPF 的内核态 L3/L4 与按需 Envoy L7、Linkerd 的 Rust 微代理 Sidecar 与原生 Sidecar 容器。从资源开销、延迟、安全边界、L7 能力、与 Gateway API/GAMMA 的关系、以及 AI 流量（agentgateway）等维度给出选型建议与从 Sidecar 迁移的路径。"
---

> Sidecar 曾是服务网格的代名词，如今它只是三种数据面架构之一——选哪一种，取决于你愿意在哪一层为零信任与可观测性买单。

早期服务网格无一例外地为每个 Pod 注入一个 Envoy Sidecar：它带来了透明的 mTLS、L7 路由与遥测，也带来了成倍的内存开销、额外的两跳延迟与升级时的全员重启。2022 年后，Istio Ambient 与 Cilium 分别从"每节点代理"与"eBPF 内核态"两个方向探索无 Sidecar 架构，Linkerd 则坚持 Sidecar 但用 Rust 微代理把开销压到最低。本文从架构出发比较三者，帮助读者在现有 Kubernetes 原语（Gateway API、NetworkPolicy、Pod 证书）日益丰富的背景下决定是否以及如何引入网格。

## 三种数据面架构

{{< table title="服务网格数据面架构对比" >}}

| 维度 | Istio Ambient（v1.31，Ambient GA 自 1.22） | Cilium Service Mesh（v1.20） | Linkerd（2.20 版本线，边缘发布） |
|------|------|------|------|
| L4 数据面 | ztunnel：每节点一个 Rust 进程，负责 mTLS（HBONE 隧道）、L4 授权与遥测 | eBPF：在内核态处理连接、策略与负载均衡，无用户态代理 | linkerd2-proxy：每 Pod 一个 Rust 微代理（Sidecar 或原生 Sidecar 容器） |
| L7 数据面 | waypoint：按命名空间或服务按需部署的 Envoy，仅需要 L7 功能的流量经过 | 每节点一个 Envoy（内置于 cilium-agent 或独立 DaemonSet），由 L7 策略/Gateway API 按需触发 | 同一微代理处理 L7（HTTP/gRPC 路由、重试、超时） |
| mTLS 身份 | SPIFFE（Istio CA 或外部 CA） | SPIFFE（内置 SPIRE，Beta） | SPIFFE 兼容的工作负载证书，Linkerd 身份服务 |
| 隔离边界 | ztunnel 为节点级共享组件，租户流量在同一进程内按身份隔离 | 内核级；Envoy 为节点级共享 | Pod 级，故障域最小 |
| 应用 Pod 改动 | 无（无需注入、无需重启） | 无 | 注入 Sidecar（需重启）；支持 Kubernetes 原生 Sidecar 容器 |
| 资源开销 | 每节点 ztunnel 数十 MB；waypoint 按需 | 极低（eBPF）+ 按需 Envoy | 每 Pod 约 10 – 20 MB 内存 |
| 延迟 | L4 路径一跳（ztunnel）；L7 路径再加 waypoint | L4 近乎零额外开销；L7 一跳 Envoy | 两跳微代理（源与目标 Sidecar） |
| 网络层依赖 | 任意 CNI（含 Cilium）；可与 Cilium 的 eBPF 共存 | 必须以 Cilium 为 CNI | 任意 CNI |
| 非 Kubernetes 工作负载 | 虚拟机（Ambient 多网络） | Cilium 的 Cluster Mesh 与外部工作负载 | 网格扩展（mesh expansion） |
| 多集群 | 多网络 Ambient | Cluster Mesh | 多集群通信 |

{{< /table >}}

### Istio Ambient

Ambient 把 Sidecar 的职责拆成两层。**ztunnel**（zero-trust tunnel）以 DaemonSet 运行，拦截节点上加入网格的 Pod 的流量，用 HBONE（HTTP-Based Overlay Network Environment，基于 HTTP/2 CONNECT 的 mTLS 隧道）封装后送往目标节点的 ztunnel，由它解封并转发给目标 Pod；它只看 L4，因而能用 Rust 写得极小、极稳。**waypoint** 是按需部署的 Envoy，只有当某个命名空间或服务需要 L7 路由、重试、L7 授权或 L7 遥测时才创建，流量在 ztunnel 之后被导向 waypoint。

```bash
# 把命名空间加入 Ambient 网格（仅 L4：mTLS + L4 策略 + TCP 遥测）
kubectl label namespace prod istio.io/dataplane-mode=ambient

# 为命名空间部署 waypoint 启用 L7（基于 Gateway API）
istioctl waypoint apply -n prod --enroll-namespace
```

waypoint 本身是一个 `Gateway` 对象（`gatewayClassName: istio-waypoint`），L7 策略全部以 Gateway API 的 `HTTPRoute`、`GRPCRoute` 与 Istio `AuthorizationPolicy` 表达，这让 Ambient 成为 Gateway API GAMMA（网格）规范最完整的实现之一。Istio 1.29+ 还实验性地支持用 [agentgateway](https://agentgateway.dev/)（面向 AI Agent 与 MCP 流量的 Rust 代理，由 kgateway 社区维护）替代 Envoy 作为 waypoint 与入口网关，为 LLM/MCP 流量提供协议级的路由与治理。

### Cilium Service Mesh

Cilium 以 eBPF 替代 kube-proxy 并实现 NetworkPolicy，其网格能力是这一基础的自然延伸：连接级的身份（基于 Cilium 安全身份）、L3/L4 策略与负载均衡全部在内核完成，透明加密可选 WireGuard 或 IPsec（节点间），SPIFFE 身份的 mTLS 互认证仍为 Beta。当策略或路由需要 L7（HTTP 路径匹配、gRPC 方法、Kafka 主题）时，流量被重定向到节点上的 Envoy。Cilium 同时是 Gateway API（入口）与 GAMMA（网格路由）的实现，Hubble 提供网络层到 L7 的可观测性。

Cilium 的网格最适合"已经用 Cilium 作为 CNI、主要需求是零信任网络与可观测性、L7 需求有限"的场景；代价是与 CNI 的强绑定，以及 L7 功能（重试、熔断、故障注入、细粒度 L7 授权）相对 Istio 仍不完整。

### Linkerd

Linkerd 坚持 Sidecar 模型，但用专为网格编写的 Rust 微代理（linkerd2-proxy）而非通用 Envoy，单实例内存约为 Envoy Sidecar 的十分之一，配置面简单，mTLS 默认开启且零配置。它支持 Kubernetes 原生 Sidecar 容器（v1.33 GA）解决了 Sidecar 与 Job、init 容器的启动顺序问题，并以 `HTTPRoute`/`GRPCRoute`（GAMMA）表达路由，2.19 起支持后量子加密。

Linkerd 的 Pod 级隔离在多租户与故障域上最清晰，运维复杂度最低；代价是仍需注入与重启，且每 Pod 的固定开销在数万 Pod 的集群中依然可观。需要注意，自 2024 年 2 月起 Linkerd 开源项目只发布边缘（edge）版本，稳定版本由 Buoyant 等供应商提供（Buoyant Enterprise for Linkerd），生产使用需评估这一分发模式。

## 选型维度

{{< table title="无 Sidecar 网格选型" >}}

| 需求 | 建议 |
|------|------|
| 全集群 mTLS 与 L4 授权，尽量不改动应用、不增加开销 | Istio Ambient 仅 L4 模式，或 Cilium（若已是 CNI） |
| 丰富的 L7 流量治理（金丝雀、重试、熔断、故障注入、L7 授权） | Istio Ambient + waypoint，或 Istio Sidecar |
| 已选定 Cilium，希望网络与网格统一运维 | Cilium Service Mesh，L7 部分按需开启 |
| 极简运维、Pod 级隔离、团队规模小 | Linkerd（注意稳定版分发模式） |
| 多租户严格隔离，不接受节点级共享代理 | Linkerd 或 Istio Sidecar |
| 多集群、虚拟机、异构工作负载 | Istio（Ambient 多网络 / Sidecar） |
| AI Agent、MCP、LLM 推理流量治理 | Istio Ambient + agentgateway waypoint，或独立的 [AI 网关](../../ai-native/ai-gateway) |
| 只需要入口与少量路由，不需要东西向 mTLS | 不部署网格，用 Gateway API 实现 + NetworkPolicy + [Pod 证书](../../storage/downward-api-and-projected-volumes) |

{{< /table >}}

最后一行值得强调：Kubernetes 原生能力的进步正在缩小网格的必要性边界。Gateway API 提供了标准化的 L7 入口与 GAMMA 网格路由，NetworkPolicy（以及 Cilium/Calico 的 L7 扩展）提供了网络隔离，`podCertificate` 投射卷（v1.37 GA）让应用可以直接获得自动轮换的 mTLS 证书，Pod 安全准入与结构化授权覆盖了平台层安全。如果团队的需求只是其中一两项，先用原生原语往往比引入网格更划算。

## 从 Sidecar 迁移到 Ambient

对已运行 Istio Sidecar 的集群，Istio 提供了逐命名空间的迁移路径，两种模式可在同一网格中共存：

1. 安装 Ambient 组件（`istioctl install --set profile=ambient`），现有 Sidecar 工作负载不受影响
2. 审计命名空间中使用的 Istio API：`VirtualService`/`DestinationRule` 需改写为 Gateway API 的 `HTTPRoute` 并附加到 waypoint；`PeerAuthentication` 与 L4 `AuthorizationPolicy` 直接生效；L7 `AuthorizationPolicy` 需要 waypoint；`EnvoyFilter` 需逐一评估
3. 为需要 L7 的命名空间部署 waypoint 并验证路由
4. 给命名空间打 `istio.io/dataplane-mode=ambient` 标签，并移除 `istio-injection=enabled`
5. 滚动重启工作负载以移除 Sidecar；Ambient 下后续加入/退出网格不再需要重启

迁移过程中应关注遥测的变化：Ambient 的 L4 指标来自 ztunnel，L7 指标只在经过 waypoint 的流量上产生，原先依赖 Sidecar 的每请求指标与分布式追踪头注入需要确认是否仍被覆盖。

## 总结

无 Sidecar 架构把服务网格从"每个 Pod 一个代理"的沉重模型中解放出来：Istio Ambient 以 ztunnel 与 waypoint 分离 L4 与 L7，让 mTLS 与零信任几乎免费、L7 治理按需付费；Cilium 把网络与网格统一到 eBPF 内核态，以 CNI 绑定换取最低开销；Linkerd 则证明了精简的 Rust Sidecar 仍是隔离性最好、运维最简单的选择。与此同时，Gateway API、Pod 证书与网络策略等原生能力正在接管网格的部分职责——评估网格时，先问"原生原语够不够"，再在三种架构中按 L7 需求、隔离要求与现有网络栈做选择。

## 参考文献

- [Istio Ambient Mode Overview - istio.io](https://istio.io/latest/docs/ambient/overview/)
- [Istio Ambient Architecture: Data plane - istio.io](https://istio.io/latest/docs/ambient/architecture/data-plane/)
- [Migrate from Sidecar to Ambient - istio.io](https://istio.io/latest/docs/ambient/migrate/)
- [Use agentgateway with Istio - istio.io](https://istio.io/latest/docs/ambient/usage/agentgateway/)
- [Cilium Service Mesh - docs.cilium.io](https://docs.cilium.io/en/stable/network/servicemesh/)
- [Linkerd Architecture - linkerd.io](https://linkerd.io/2/reference/architecture/)
- [Linkerd Releases and Versions - linkerd.io](https://linkerd.io/releases/)
- [Gateway API for Mesh (GAMMA) - gateway-api.sigs.k8s.io](https://gateway-api.sigs.k8s.io/concepts/gamma/)
