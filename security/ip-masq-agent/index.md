---
weight: 87
title: IP 伪装代理
date: 2022-05-21T00:00:00+08:00
type: book
description: IP 伪装代理（ip-masq-agent）通过配置 iptables 规则将 Pod IP 地址隐藏在集群节点 IP 后面，实现网络地址转换，确保集群内部流量能够正确访问外部网络。
lastmod: 2025-10-27T17:05:37.109Z
---

> IP 伪装代理（ip-masq-agent）为 Kubernetes 集群提供灵活的网络地址转换能力，保障 Pod 流量安全合规地访问外部网络，是云原生网络治理的重要基础设施。

## 概述

在 Kubernetes 集群中，IP 伪装代理（ip-masq-agent）通过配置 iptables 规则实现网络地址转换（NAT），将 Pod 的 IP 地址隐藏在集群节点的 IP 地址后面。这对于访问集群外部资源尤为关键，能够满足云环境和企业网络对出站流量的合规性要求。

## 关键概念

理解 ip-masq-agent 的工作原理，需先掌握以下核心网络概念。

### NAT（网络地址转换）

NAT（Network Address Translation）是一种通过修改 IP 数据包头中的源和/或目标地址，将一个 IP 地址重新映射到另一个 IP 地址的技术。

### Masquerading（伪装）

Masquerading 是 NAT 的一种特殊形式，常用于将多个源 IP 地址隐藏在单个地址后面。在 Kubernetes 中，这个单一地址通常是节点的 IP。

### CIDR（无类域间路由）

CIDR（Classless Inter-Domain Routing）是一种基于可变长度子网掩码的 IP 地址分配方法，使用斜杠记号表示网络前缀长度，如 `192.168.2.0/24`。

### 本地链路

本地链路（Link-local）仅在主机连接的网段内有效。IPv4 的本地链路地址范围为 `169.254.0.0/16`。

## 工作原理

下图展示了 ip-masq-agent 的基本工作流程：

![IP 伪装代理工作原理示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/security/ip-masq-agent/ip-masq.webp)
{width=960 height=720}

ip-masq-agent 的主要流程如下：

1. **流量检测**：监控从 Pod 发出的网络流量。
2. **目标判断**：判断流量目标是否为集群内部地址。
3. **规则应用**：对访问外部地址的流量应用伪装规则。
4. **地址转换**：将 Pod IP 转换为节点 IP。

默认情况下，以下 IP 范围被视为集群内部地址，不会进行伪装：

- `10.0.0.0/8`
- `172.16.0.0/12`
- `192.168.0.0/16`
- `169.254.0.0/16`（本地链路）

## 部署 IP 伪装代理

ip-masq-agent 支持默认和自定义两种部署方式，适应不同集群环境需求。

### 使用默认配置部署

如需快速启用 ip-masq-agent，可直接应用官方 YAML 文件：

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/kubernetes/master/cluster/addons/ip-masq-agent/ip-masq-agent.yaml
```

### 自定义配置部署

如需自定义伪装规则，可通过 ConfigMap 配置。

**创建配置文件**

以下为自定义配置文件示例：

```yaml
nonMasqueradeCIDRs:
  - 10.0.0.0/8
  - 192.168.0.0/16
resyncInterval: 60s
masqLinkLocal: false
```

**创建 ConfigMap**

将上述配置文件创建为 ConfigMap：

```bash
kubectl create configmap ip-masq-agent \
  --from-file=config \
  --namespace=kube-system
```

**验证配置**

配置更新后，ip-masq-agent 会按 `resyncInterval` 指定的时间间隔自动重新加载。可通过以下命令验证 iptables 规则：

```bash
iptables -t nat -L IP-MASQ-AGENT
```

预期输出示例：

```text
Chain IP-MASQ-AGENT (1 references)
target     prot opt source               destination         
RETURN     all  --  anywhere             169.254.0.0/16       /* ip-masq-agent: cluster-local traffic */
RETURN     all  --  anywhere             10.0.0.0/8           /* ip-masq-agent: cluster-local traffic */
RETURN     all  --  anywhere             172.16.0.0/12        /* ip-masq-agent: cluster-local traffic */
RETURN     all  --  anywhere             192.168.0.0/16       /* ip-masq-agent: cluster-local traffic */
MASQUERADE all  --  anywhere             anywhere             /* ip-masq-agent: outbound traffic */
```

## 配置选项

ip-masq-agent 的配置文件支持多种参数，灵活适配不同网络环境。

{{< table title="ip-masq-agent 配置参数说明" >}}

| 参数名              | 类型         | 说明                                                         | 示例值                        |
|---------------------|--------------|--------------------------------------------------------------|-------------------------------|
| nonMasqueradeCIDRs  | 字符串数组   | 不进行伪装的 IP 范围（CIDR 格式）                            | `["10.0.0.0/8", "192.168.0.0/16"]` |
| masqLinkLocal       | 布尔值       | 是否对本地链路地址（169.254.0.0/16）进行伪装                  | `false`                       |
| resyncInterval      | 时间间隔字符串 | 配置文件自动重载的时间间隔                                   | `"60s"`、`"5m"`、`"1h"`        |

{{< /table >}}

## 使用场景

ip-masq-agent 适用于多种典型场景，提升集群网络的灵活性和安全性。

### 云环境集成

在 Google Cloud Platform 等云环境中，虚拟机的出站流量必须使用虚拟机的 IP 地址。ip-masq-agent 可确保 Pod 流量通过节点 IP 访问外部资源，满足云厂商合规要求。

### 企业网络

在企业网络环境下，防火墙策略通常只允许来自特定 IP 的流量。通过 IP 伪装，所有 Pod 流量都显示为节点 IP，简化网络策略配置。

### 服务网格

在复杂的服务网格（Service Mesh）环境中，ip-masq-agent 有助于统一流量出口，简化网络策略和路由规则管理。

## 故障排除

遇到网络异常时，可通过以下方法排查 ip-masq-agent 的运行状态和配置。

### 检查代理状态

使用如下命令查看 ip-masq-agent Pod 状态：

```bash
kubectl get pods -n kube-system -l k8s-app=ip-masq-agent
```

### 查看日志

通过日志排查代理运行情况：

```bash
kubectl logs -n kube-system -l k8s-app=ip-masq-agent
```

### 验证 iptables 规则

在节点上执行以下命令，检查 NAT 规则是否生效：

```bash
iptables -t nat -L IP-MASQ-AGENT -v
```

### 常见问题

- **配置未生效**：确认 ConfigMap 名称为 `ip-masq-agent`，配置文件名为 `config`。
- **网络连接问题**：检查 CIDR 配置，确保内部流量未被错误伪装。
- **性能问题**：根据实际需求调整 `resyncInterval`，平衡配置更新频率与系统开销。

## 最佳实践

为保障集群网络安全与高可用，建议遵循以下最佳实践：

{{< table title="Kubernetes ip-masq-agent 使用最佳实践" >}}

| 类别           | 建议与说明                                         | 具体举例或工具         |
|----------------|----------------------------------------------------|-----------------------|
| CIDR 配置      | 谨慎配置 nonMasqueradeCIDRs，避免内部通信被伪装     | 仅包含集群内网段       |
| 监控           | 定期监控 iptables 规则和网络流量                   | Prometheus、日志分析   |
| 版本兼容性     | 确认 ip-masq-agent 与 Kubernetes 版本兼容           | 官方文档、Release Note |
| 配置备份       | 修改前备份现有 ConfigMap                            | kubectl get configmap |

{{< /table >}}

## 总结

ip-masq-agent 为 Kubernetes 集群提供了灵活、可配置的网络地址转换能力，满足了云环境、企业网络和服务网格等多样化场景下的流量合规与安全需求。通过合理配置和监控，可有效提升集群网络的可用性和可维护性。

## 参考文献

- [IP Masquerade Agent User Guide - kubernetes.io](https://kubernetes.io/docs/tasks/administer-cluster/ip-masq-agent/)
- [ip-masq-agent GitHub 仓库 - github.com](https://github.com/kubernetes-sigs/ip-masq-agent)
