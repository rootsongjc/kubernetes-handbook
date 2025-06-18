---
weight: 46
title: NetworkPolicy
date: '2022-05-21T00:00:00+08:00'
type: book
description: 'Kubernetes NetworkPolicy 是一种声明式的网络安全策略，用于控制 Pod 之间的网络通信。本文详细介绍了 NetworkPolicy 的工作原理、配置方法、使用场景和最佳实践。'
keywords:
- namespace
- network
- networkpolicy
- pod
- 允许
- 流量
- 示例
- 策略
- 网络
- 规则
---

NetworkPolicy 是 Kubernetes 提供的网络安全功能，用于控制 Pod 之间以及 Pod 与外部网络端点之间的通信。它通过标签选择器来选择目标 Pod，并定义允许的入站和出站流量规则。

NetworkPolicy 主要作用于网络层（L3）和传输层（L4），即控制基于 IP 地址和端口的访问。如果需要在应用层（L7）进行更细粒度的访问控制，建议使用 [Istio](https://istio.io) 等服务网格解决方案。

## 前提条件

NetworkPolicy 的实现依赖于网络插件（CNI），因此需要使用支持 NetworkPolicy 的网络方案，如：

- [Calico](https://www.projectcalico.org/)
- [Cilium](https://cilium.io/)
- [Weave Net](https://www.weave.works/oss/net/)

如果使用不支持 NetworkPolicy 的网络插件，创建的 NetworkPolicy 资源将不会生效。

## Pod 的网络隔离状态

在 Kubernetes 中，Pod 的网络隔离状态分为以下两种：

- **未隔离状态**：默认情况下，所有 Pod 都处于未隔离状态，可以接收来自任何源的网络流量
- **隔离状态**：当 NetworkPolicy 选择某个 Pod 后，该 Pod 进入隔离状态，只允许 NetworkPolicy 明确允许的流量

需要注意的是，NetworkPolicy 的隔离是单向的。如果一个 NetworkPolicy 只定义了 ingress 规则，那么只会影响入站流量；如果只定义了 egress 规则，则只会影响出站流量。

## NetworkPolicy 资源规范

### 基本结构

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

**podSelector**：用于选择应用此策略的目标 Pod。空的 podSelector（`{}`）会选择当前命名空间中的所有 Pod。

**policyTypes**：指定策略类型，可选值为 `Ingress`、`Egress` 或两者都有。如果未指定，默认为 `Ingress`。

**ingress**：定义入站流量规则，包含 `from`（流量源）和 `ports`（允许的端口）配置。

**egress**：定义出站流量规则，包含 `to`（流量目标）和 `ports`（允许的端口）配置。

### 流量源和目标选择器

NetworkPolicy 支持三种方式来指定流量的源或目标：

1. **podSelector**：选择当前命名空间中的 Pod
2. **namespaceSelector**：选择指定命名空间中的所有 Pod
3. **ipBlock**：指定 IP 地址段

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

### 示例 1：数据库访问控制

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

此策略仅允许标签为 `app: backend` 的 Pod 通过 TCP 端口 3306 访问数据库。

### 示例 2：跨命名空间通信

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

此策略允许来自 `frontend` 和 `mobile` 命名空间的流量访问 API 服务器。

## 常用默认策略

### 拒绝所有流量

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

1. **采用零信任模型**：建议为每个命名空间创建默认拒绝策略，然后根据需要添加允许规则
2. **精确的标签选择**：使用具体的标签选择器，避免过于宽泛的规则
3. **定期审查策略**：定期检查和更新 NetworkPolicy，确保其符合当前的安全要求
4. **测试验证**：在应用 NetworkPolicy 前，在测试环境中验证其效果
5. **监控和日志**：配合网络监控工具，观察 NetworkPolicy 的实际效果

## 限制和注意事项

- NetworkPolicy 不能阻止同一 Pod 内容器之间的通信
- 不支持基于用户身份的访问控制
- 对于需要应用层访问控制的场景，需要结合服务网格等解决方案
- 策略规则是累加的，多个 NetworkPolicy 的规则会合并生效

## 参考资料

- [Network Policies - Kubernetes 官方文档](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [Declare Network Policy - Kubernetes 官方教程](https://kubernetes.io/docs/tasks/administer-cluster/declare-network-policy/)
