---
title: "Istio 社区周报（第 1 期）"
draft: false
date: 2023-12-18T10:27:49+08:00
description: "这是 Istio 社区周报第一期，汇总 Istio 社区最近一周的新闻和动态。本期覆盖的时间范围为 2023 年 12 月 11 日到 17 日。"
categories: ["Istio"]
tags: ["Istio","Istio Weekly"]
type: "post"
image: "images/banner/istio-weekly-01.jpg"
---

## 欢迎来到 Istio 社区周报

Istio 社区朋友们，你们好！

我很高兴呈现第一期 Istio 社区周报。作为 Istio 社区的一员，每周我将为您带来 Istio 的最新发展、有见地的社区讨论、专业提示和重要安全新闻内容。

祝你阅读愉快，并在下一期中与您再见！

## 社区更新

### 切换到 GitHub Discussions 进行 Istio 社区问答

Istio 团队宣布了社区互动和问答方式的重大变化。当前的论坛 [discuss.istio.io](https://discuss.istio.io/) 将于 12 月 20 日前归档，团队将转向 [GitHub Discussions](https://github.com/istio/istio/discussions) 进行未来的互动。这个新平台被设想为用户提问和与社区互动的中心。值得注意的是，在 GitHub 讨论中的贡献将被视为官方的 Istio 贡献，影响着 steering contributor 席位的分配。这是对维护者、供应商和最终用户积极参与这些讨论的号召。

### Istio Office Hours 提案

Istio 社区引入了一个新的倡议："Istio Office Hours"。该提案旨在建立一个定期的社区会议，分享技术知识并促进社区增长。Office Hours 旨在帮助新的贡献者，并为当前成员提供分享见解的论坛。

请参阅[提案文件](https://docs.google.com/document/d/13voR8qZwG8lKI2_xtvYhN6msBHp0MAdvlDXMUqQGFEM/edit)以获取更详细的信息，并参与塑造这个倡议。

### Kubernetes v1.29 发布：从 iptables 切换到 nftables 及其对 Istio 的影响

最近发布的 [Kubernetes v1.29](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.29.md) 引入了其网络方法的重大变化。Kubernetes 现在将 nftables 作为 kube-proxy 后端的 Alpha 特性，取代了 iptables。这一变化是由于 iptables 存在已久的性能问题，随着规则集大小的增加而恶化。内核中 iptables 的开发已经显著减缓，大部分活动已停止，新功能也已停滞不前。

### 为什么选择 nftables？

- nftables 解决了 iptables 的限制，并提供更好的性能。
- 像 RedHat 和 Debian 这样的主要发行版正在摆脱 iptables。RedHat 在 RHEL 9 中已弃用 iptables，而 Debian 在 Debian 11（Bullseye）中将其从必需的软件包中删除。

### 对 Istio 的影响

Istio 目前依赖 iptables 来进行流量劫持，可能需要考虑使用 nftables 来适应这一变化。这个变化与 Linux 生态系统中更广泛的向 nftables 迁移一致。

### 管理员的作用

- 要启用此功能，管理员必须使用 NFTablesProxyMode 特性门和运行 kube-proxy 时使用 `-proxy-mode=nftables` 标志。
- 可能会存在兼容性问题，因为目前依赖 iptables 的 CNI 插件、NetworkPolicy 实现和其他组件需要更新以适应 nftables。

Kubernetes v1.29 中的这一变化是一个前瞻性的步骤，但需要谨慎考虑和规划，以与像 Istio 这样的系统集成。Istio 社区需要密切关注这些发展，并为未来的 Istio 版本可能需要进行的调整做好准备，以保持与 Kubernetes 的兼容性。

## 项目更新

### ISTIO-SECURITY-2023-005：Istio CNI RBAC 权限的更改

### 解决的安全漏洞

Istio 安全委员会已经确定并解决了与 Istio CNI（容器网络接口）有关的一个重大安全漏洞。这个问题在 [ISTIO-SECURITY-2023-005](https://istio.io/latest/news/security/istio-security-2023-005/) 中详细说明，涉及到 `istio-cni-repair-roleClusterRole` 的潜在滥用。

### 安全风险

如果节点被入侵，Istio CNI 的现有高级权限可能会被利用。这种滥用可能会将本地入侵升级为集群范围的安全漏洞。

### 采取的措施

针对这一发现，已对 Istio CNI 的 RBAC（基于角色的访问控制）权限进行了修改，以减轻这一风险。

有关更详细信息，请访问官方安全咨询 [Istio Security 2023-005](https://istio.io/latest/news/security/istio-security-2023-005/)。

### 新的小版本发布

Istio 发布了新的小版本以增强安全性和功能性：

- Istio 1.18.6
- Istio 1.19.5
- Istio 1.20.1

这些更新包括各种改进和修复，反映了对维护和增强 Istio 服务网格安全性和性能的持续承诺。

有关这些发布的更多详细信息，请访问 [Istio 最新消息](https://istio.io/latest/news/)。

## 热门话题讨论

### 关于 Istio 1.21 中环境模式转入 Beta 的讨论

在最近的联合工作组会议上，关于环境模式在即将发布的 Istio 1.21 版本（Q124）中转入 Beta 的讨论引发了激烈的讨论。

#### 分歧的观点

- Solo 团队的立场：主张延迟 1.21 版本的发布，以确保环境模式在该版本中达到 Beta 状态。
- 其他所有人的观点：反对延迟版本发布，强调环境模式尚未准备好发布 Beta 版。

#### 当前展望

共识倾向于在不包括环境模式的 Beta 版本中维持 1.21 版本的发布计划。主要观点是，环境模式需要进一步开发，不太可能在 1.21 版本中达到 Beta 状态。

讨论反映了 Istio 开发过程中对质量和准备性的持续承诺。不急于将环境模式推向 Beta 版本的决定强调了社区在每个发布中确保稳定性和可靠性的奉献精神。

## Istio 专业提示

### 确定 Ingress Gateway 的上游 IP 地址

在处理 Ingress 网关之前，特别是对于 TLS 卸载，确定上游源工作负载是至关重要的。在 `istio_requests_total` 中，如果 `source_workload` 是一个 Ingress 网关，就需要识别真正的源工作负载。一个实用的方法是利用 HTTP 头来实现这一目的。XFF（X-Forwarded-For）是 [Istio 文档](https://istio.io/latest/docs/ops/configuration/traffic-management/network-topologies/)中概述的标准方法，但也可以通过虚拟服务添加头部来实现自定义解决方案。

### Istio 发行版中的 Envoy 版本

Istio 团队维护他们的 Envoy 构建，独立决定补丁版本。这种方法确保更快地获得必要的更新，而不必等待官方的 Envoy 发布，因此导致了 Istio 中使用的 Envoy 版本与 Envoy 的最新版本不一致。更多详细信息可以在这个 [GitHub 讨论](https://github.com/istio/istio/discussions/48064#discussioncomment-7794044) 中找到。

## 总结

当我们结束本周的 Istio Community Weekly，让我们回顾一下我们所分享的信息。我们看到了 Istio 社区的活力和创新，以及与服务网格技术相关的最新趋势和讨论。

本周，我们了解到 Istio 社区将转向 GitHub Discussions 作为主要的问答和交流平台，这标志着更加开放和协作的未来。同时，"Istio Office Hours" 倡议将帮助社区成员共享知识，促进成长。

在技术方面，Kubernetes v1.29 的变化将对 Istio 和整个生态系统产生影响，我们需要密切关注和适应这些变化。此外，我们还了解到 Istio CNI RBAC 权限的改变，以及新的 Istio 小版本发布，旨在提高安全性和性能。

最后，我们深入讨论了 Istio 1.21 版本中环境模式转入 Beta 的问题，以及如何确定 Ingress Gateway 的上游 IP 地址的技巧。

作为 Istio 社区的一员，您的反馈和参与至关重要。让我们继续在 GitHub 上分享见解、问题和意见，共同塑造 Istio 的未来。展望下周，我们期待更多精彩的更新和社区互动。敬请关注，下期再见！
