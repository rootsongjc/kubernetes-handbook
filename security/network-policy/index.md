---
weight: 46
title: NetworkPolicy
date: 2022-05-21T00:00:00+08:00
aliases:
  - /book/kubernetes-handbook/auth/network-policy/
description: Kubernetes NetworkPolicy 是一种声明式的网络安全策略，用于控制 Pod 之间的网络通信。本文详细介绍了 NetworkPolicy 的工作原理、配置方法、使用场景和最佳实践。
lastmod: 2025-10-27T17:03:22.045Z
---

> NetworkPolicy 是 Kubernetes 网络安全的基石，通过声明式策略实现微服务间的最小权限通信，有效提升集群安全性和可控性。

## 概述

NetworkPolicy 是 Kubernetes 提供的网络安全功能，用于控制 Pod 之间以及 Pod 与外部网络端点之间的通信。它通过标签选择器来选择目标 Pod，并定义允许的入站和出站流量规则。

NetworkPolicy 主要作用于网络层（L3）和传输层（L4），即控制基于 IP 地址和端口的访问。如果需要在应用层（L7）进行更细粒度的访问控制，建议使用 [Istio](https://istio.io) 等服务网格解决方案。

在深入配置和应用 NetworkPolicy 之前，需要了解其依赖的网络插件和基本工作原理。

## 前提条件

NetworkPolicy 的实现依赖于网络插件（CNI），从 Kubernetes 1.3 版本开始支持。目前支持 NetworkPolicy 的主要网络方案包括：

- [Calico](https://www.projectcalico.org/) - 功能丰富的企业级网络和安全解决方案
- [Cilium](https://cilium.io/) - 基于 eBPF 的现代化网络和安全平台
- [Antrea](https://antrea.io/) - VMware 支持的 Kubernetes 原生网络解决方案
- [Weave Net](https://www.weave.works/oss/net/) - 轻量级容器网络插件
- [Flannel](https://github.com/flannel-io/flannel) - 部分支持 NetworkPolicy（配合 Canal）

如果使用不支持 NetworkPolicy 的网络插件（如 Flannel 原生模式），创建的 NetworkPolicy 资源将不会生效。在生产环境中，建议选择功能完整的 CNI 插件以获得最佳的安全控制效果。

## Pod 的网络隔离状态

Kubernetes 中 Pod 的网络隔离状态分为以下两种：

- **未隔离状态**：默认情况下，所有 Pod 都处于未隔离状态，可以接收来自任何源的网络流量。
- **隔离状态**：当 NetworkPolicy 选择某个 Pod 后，该 Pod 进入隔离状态，只允许 NetworkPolicy 明确允许的流量。

需要注意的是，NetworkPolicy 的隔离是单向的。如果一个 NetworkPolicy 只定义了 ingress 规则，那么只会影响入站流量；如果只定义了 egress 规则，则只会影响出站流量。

## NetworkPolicy 资源规范

在实际应用中，合理配置 NetworkPolicy 资源是实现网络安全的关键。下面介绍其基本结构和核心字段。

### 基本结构

以下是 NetworkPolicy 的典型 YAML 配置示例：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: example-network-policy
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: web
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 3306
```

### 核心字段说明

- **podSelector**：用于选择应用此策略的目标 Pod。空的 podSelector（`{}`）会选择当前命名空间中的所有 Pod。
- **policyTypes**：指定策略类型，可选值为 `Ingress`、`Egress` 或两者都有。如果未指定，默认为 `Ingress`。
- **ingress**：定义入站流量规则，包含 `from`（流量源）和 `ports`（允许的端口）配置。
- **egress**：定义出站流量规则，包含 `to`（流量目标）和 `ports`（允许的端口）配置。

### 流量源和目标选择器

NetworkPolicy 支持三种方式来指定流量的源或目标：

1. **podSelector**：选择当前命名空间中的 Pod。
2. **namespaceSelector**：选择指定命名空间中的所有 Pod。
3. **ipBlock**：指定 IP 地址段。

下面是多种选择器联合使用的示例：

```yaml
ingress:
- from:
  - podSelector:
      matchLabels:
        role: frontend
  - namespaceSelector:
      matchLabels:
        environment: production
  - ipBlock:
      cidr: 192.168.1.0/24
      except:
      - 192.168.1.10/32
```

## 实际应用示例

通过具体示例，可以更好地理解 NetworkPolicy 的配置和应用场景。

### 示例 1：数据库访问控制

以下策略仅允许标签为 `app: backend` 的 Pod 通过 TCP 端口 3306 访问数据库：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: mysql
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: backend
    ports:
    - protocol: TCP
      port: 3306
```

### 示例 2：跨命名空间通信

以下策略允许来自 `frontend` 和 `mobile` 命名空间的流量访问 API 服务器：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: cross-namespace-policy
  namespace: api
spec:
  podSelector:
    matchLabels:
      app: api-server
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: frontend
    - namespaceSelector:
        matchLabels:
          name: mobile
    ports:
    - protocol: TCP
      port: 8080
```

## 常用默认策略

在实际生产环境中，建议为命名空间设置默认拒绝或允许策略。以下为常见的默认策略示例。

### 拒绝所有流量

该策略拒绝所有入站和出站流量：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

### 允许所有入站流量

该策略允许所有入站流量：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-all-ingress
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - {}
```

### 允许所有出站流量

该策略允许所有出站流量：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-all-egress
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - {}
```

## 最佳实践

为了充分发挥 NetworkPolicy 的安全能力，建议遵循以下最佳实践：

{{< table title="Kubernetes NetworkPolicy 使用最佳实践" >}}

| 类别           | 建议与说明                                                                 | 具体举例或工具           |
|----------------|--------------------------------------------------------------------------|-------------------------|
| 零信任模型     | 为每个命名空间创建默认拒绝策略，按需添加允许规则                           | default-deny-all 策略   |
| 精确标签选择   | 使用具体标签选择器，避免过宽规则，必要时用 matchExpressions                | app/backend、role/db    |
| 分层安全策略   | 结合 RBAC、Pod Security Standards 等机制，实现多层防护                    | RBAC、PSS、NetworkPolicy|
| 策略定期审查   | 定期检查和更新策略，适应业务变化                                          | —                       |
| 测试验证       | 应用前在测试环境验证效果，使用 kubectl describe networkpolicy 和测试 Pod   | kubectl、netshoot       |
| 监控与日志     | 配合 Prometheus、Grafana 等工具监控策略效果和违规流量                     | Prometheus、Grafana     |
| 策略管理工具   | 使用策略即代码工具（如 Kyverno）或可视化编辑器管理复杂策略                 | Kyverno、editor.networkpolicy.io |
| 性能考虑       | 高流量环境下进行性能测试，关注 CNI 插件性能                               | —                       |

{{< /table >}}

## 限制和注意事项

在实际使用 NetworkPolicy 时，还需关注以下限制和注意事项：

- NetworkPolicy 不能阻止同一 Pod 内容器之间的通信。
- 不支持基于用户身份的访问控制，需要结合其他认证机制。
- 应用层（L7）访问控制需结合服务网格（如 Istio）等方案。
- 策略规则是累加的，多个 NetworkPolicy 的规则会合并生效，规则顺序不影响最终结果。
- 某些 CNI 插件可能对 NetworkPolicy 功能支持不完整，建议查阅插件文档。
- NetworkPolicy 不影响 Kubernetes 控制平面组件间的通信。
- 在部分云厂商托管 Kubernetes 服务中，NetworkPolicy 可能有额外限制。

## 总结

Kubernetes NetworkPolicy 通过声明式策略实现了微服务间的最小权限网络访问控制，是提升集群安全性的关键手段。合理配置策略、结合多层安全机制，并定期审查和测试，是保障云原生环境安全的基础。建议结合实际业务需求，充分利用 NetworkPolicy 的能力，构建安全、可控的 Kubernetes 网络环境。

## 参考文献

- [Network Policies - Kubernetes 官方文档](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [Declare Network Policy - Kubernetes 官方教程](https://kubernetes.io/docs/tasks/administer-cluster/declare-network-policy/)
- [Network Policy Editor - editor.networkpolicy.io](https://editor.networkpolicy.io/)
- [Calico Network Policies - docs.tigera.io](https://docs.tigera.io/calico/latest/network-policy/)
- [Cilium Network Policies - docs.cilium.io](https://docs.cilium.io/en/stable/security/policy/)
