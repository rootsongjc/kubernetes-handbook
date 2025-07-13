---
weight: 87
title: IP 伪装代理
date: '2022-05-21T00:00:00+08:00'
type: book
description: 'IP 伪装代理（ip-masq-agent）通过配置 iptables 规则将 Pod IP 地址隐藏在集群节点 IP 后面，实现网络地址转换，确保集群内部流量能够正确访问外部网络。'
keywords:
- agent
- cidr
- ip
- masq
- 伪装
- 地址
- 链路
- 集群
- 默认
---

本文介绍如何在 Kubernetes 集群中配置和使用 IP 伪装代理（ip-masq-agent），以实现网络地址转换功能。

## 概述

IP 伪装代理是 Kubernetes 中的一个重要组件，它通过配置 iptables 规则实现网络地址转换（NAT），将 Pod 的 IP 地址隐藏在集群节点的 IP 地址后面。这在访问集群外部资源时特别重要，因为某些环境要求出站流量必须来自已知的机器地址。

## 关键概念

### NAT（网络地址转换）

一种通过修改 IP 数据包头中的源和/或目标地址信息，将一个 IP 地址重新映射到另一个 IP 地址的技术。

### Masquerading（伪装）

NAT 的一种特殊形式，通常用于将多个源 IP 地址隐藏在单个地址后面。在 Kubernetes 中，这个单个地址通常是节点的 IP 地址。

### CIDR（无类域间路由）

基于可变长度子网掩码的 IP 地址分配方法，使用斜杠记号表示网络前缀长度，如 `192.168.2.0/24`。

### 本地链路

仅在主机连接的网段内有效的网络地址。IPv4 的本地链路地址范围为 `169.254.0.0/16`。

## 工作原理

![IP 伪装代理示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/security/ip-masq-agent/ip-masq.webp)
{width=960 height=720}

IP 伪装代理的工作流程如下：

1. **流量检测**：监控从 Pod 发出的网络流量
2. **目标判断**：判断流量目标是否为集群内部地址
3. **规则应用**：对访问外部地址的流量应用伪装规则
4. **地址转换**：将 Pod IP 转换为节点 IP

默认情况下，以下 IP 范围被视为集群内部地址，不会进行伪装：

- `10.0.0.0/8`
- `172.16.0.0/12`
- `192.168.0.0/16`
- `169.254.0.0/16`（本地链路）

## 部署 IP 伪装代理

### 使用默认配置部署

以下是相关的配置示例：

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/kubernetes/master/cluster/addons/ip-masq-agent/ip-masq-agent.yaml
```

### 自定义配置部署

如果默认配置不满足需求，可以通过 ConfigMap 进行自定义配置。

1. **创建配置文件**

创建名为 `config` 的配置文件：

```yaml
nonMasqueradeCIDRs:
  - 10.0.0.0/8
  - 192.168.0.0/16
resyncInterval: 60s
masqLinkLocal: false
```

2. **创建 ConfigMap**

```bash
kubectl create configmap ip-masq-agent \
  --from-file=config \
  --namespace=kube-system
```

3. **验证配置**

配置更新后，代理会每隔 `resyncInterval` 指定的时间间隔重新加载配置。可以通过以下命令验证 iptables 规则：

```bash
iptables -t nat -L IP-MASQ-AGENT
```

预期输出类似：

```
Chain IP-MASQ-AGENT (1 references)
target     prot opt source               destination         
RETURN     all  --  anywhere             169.254.0.0/16       /* ip-masq-agent: cluster-local traffic */
RETURN     all  --  anywhere             10.0.0.0/8           /* ip-masq-agent: cluster-local traffic */
RETURN     all  --  anywhere             172.16.0.0/12        /* ip-masq-agent: cluster-local traffic */
RETURN     all  --  anywhere             192.168.0.0/16       /* ip-masq-agent: cluster-local traffic */
MASQUERADE all  --  anywhere             anywhere             /* ip-masq-agent: outbound traffic */
```

## 配置选项

配置文件支持以下参数：

### nonMasqueradeCIDRs

- **类型**：字符串数组
- **说明**：使用 CIDR 表示法指定的非伪装 IP 范围列表
- **示例**：`["10.0.0.0/8", "192.168.0.0/16"]`

### masqLinkLocal

- **类型**：布尔值
- **说明**：是否对本地链路地址（169.254.0.0/16）进行伪装
- **默认值**：`false`

### resyncInterval

- **类型**：时间间隔字符串
- **说明**：代理重新加载配置的时间间隔
- **示例**：`"60s"`、`"5m"`、`"1h"`

## 使用场景

### 云环境集成

在 Google Cloud Platform 等云环境中，虚拟机的出站流量必须使用虚拟机的 IP 地址。IP 伪装代理确保 Pod 流量能够正确地通过节点 IP 访问外部资源。

### 企业网络

在企业网络环境中，防火墙策略可能只允许来自特定 IP 地址的流量。通过 IP 伪装，所有 Pod 流量都会显示为来自节点 IP。

### 服务网格

在复杂的服务网格环境中，IP 伪装代理有助于简化网络策略和路由规则的管理。

## 故障排除

### 检查代理状态

以下是相关的代码示例：

```bash
kubectl get pods -n kube-system -l k8s-app=ip-masq-agent
```

### 查看日志

以下是相关的代码示例：

```bash
kubectl logs -n kube-system -l k8s-app=ip-masq-agent
```

### 验证 iptables 规则

以下是相关的代码示例：

```bash
# 在节点上执行
iptables -t nat -L IP-MASQ-AGENT -v
```

### 常见问题

- **配置未生效**：确认 ConfigMap 名称为 `ip-masq-agent`，配置文件名为 `config`
- **网络连接问题**：检查 CIDR 配置是否正确，确保内部流量不会被错误伪装
- **性能问题**：适当调整 `resyncInterval` 以平衡配置更新频率和系统开销

## 最佳实践

1. **谨慎配置 CIDR 范围**：确保集群内部通信不会被意外伪装
2. **定期监控**：监控 iptables 规则和网络流量，确保配置正确
3. **版本兼容性**：确认 ip-masq-agent 版本与 Kubernetes 集群版本兼容
4. **备份配置**：在修改配置前备份现有的 ConfigMap

## 参考资料

- [IP Masquerade Agent User Guide - Kubernetes 官方文档](https://kubernetes.io/docs/tasks/administer-cluster/ip-masq-agent/)
- [ip-masq-agent GitHub 仓库](https://github.com/kubernetes-sigs/ip-masq-agent)
