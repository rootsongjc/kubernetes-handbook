---
weight: 40
title: 拓扑感知路由
date: 2022-05-21T00:00:00+08:00
description: 拓扑感知路由是 Kubernetes 中的一项功能，允许客户端访问服务时根据端点拓扑优先路由到同一节点或可用区的端点，提高网络性能并减少跨区域流量成本。
lastmod: 2026-11-01T00:00:00+08:00
---

> 拓扑感知路由让服务流量更智能地靠近用户，是提升 Kubernetes 网络效率与体验的关键利器。

拓扑感知路由（Topology Aware Routing）是 Kubernetes 的一项网络优化功能，它允许客户端访问服务时根据端点的拓扑位置，优先将流量路由到与客户端位于同一节点或可用区的端点上，从而减少网络延迟并降低跨区域流量成本。

Kubernetes 目前提供两套机制表达这一需求：

- **拓扑感知提示（Topology Aware Hints）**：通过 `service.kubernetes.io/topology-mode: Auto` 注解启用，由控制面按各可用区的可分配 CPU 比例自动计算并下发提示，是本文的主要内容
- **流量分发策略（`spec.trafficDistribution`）**：v1.33 GA 的 Service 字段，由用户显式声明 `PreferSameZone`/`PreferSameNode`（v1.35 GA）等偏好，无需控制面评估容量，语义更简单、更可预测

对新建的 Service，官方推荐优先使用 `trafficDistribution`；`topology-mode` 注解自 v1.33 起已被标记为弃用，仅建议在存量 Service 上继续使用。两者不能同时生效，设置了 `trafficDistribution` 后注解将被忽略。

## 工作原理

拓扑感知路由通过以下方式工作：

1. **拓扑信息收集**：EndpointSlice 控制器收集每个端点的拓扑信息（节点、可用区等）
2. **提示生成**：控制器根据拓扑分布情况为端点生成拓扑提示
3. **智能路由**：kube-proxy 根据这些提示优先选择本地端点进行流量转发

## 前提条件

要启用拓扑感知路由功能，需要满足以下条件：

- Kubernetes 版本 1.23+（`TopologyAwareHints` 特性门控自 1.23 起 Beta 并默认启用，v1.33 GA）
- 节点带有 `topology.kubernetes.io/zone` 标签（云厂商通常自动设置）
- 确保 EndpointSlice 控制器正常运行
- kube-proxy（或支持拓扑提示的 Cilium 等替代实现）正常工作

## EndpointSlice 资源详解

EndpointSlice 是 Kubernetes 中用于替代传统 Endpoint 资源的新 API，它提供了更好的可扩展性和拓扑感知能力。

### 基本结构

以下是相关的代码示例：

```yaml
apiVersion: discovery.k8s.io/v1
kind: EndpointSlice
metadata:
  name: example-service
  labels:
    kubernetes.io/service-name: example-svc
    endpointslice.kubernetes.io/managed-by: endpointslice-controller.k8s.io
addressType: IPv4
ports:
  - name: http
    protocol: TCP
    port: 80
endpoints:
  - addresses:
      - "10.244.1.5"
    conditions:
      ready: true
    hostname: backend-pod-1
    nodeName: worker-node-1
    zone: us-west-1a
```

### 拓扑信息字段

EndpointSlice 中每个端点可以包含以下拓扑信息：

- **`nodeName`**：端点所在的节点名称
- **`zone`**：端点所处的可用区标识
- **`hostname`**：端点对应的 Pod 主机名
- **`region`**：端点所在的地理区域（可选）

## 启用拓扑感知路由

### 配置服务注解

在 Service 资源上添加注解来启用拓扑感知提示：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: example-service
  annotations:
    service.kubernetes.io/topology-mode: "Auto"
spec:
  selector:
    app: backend
  ports:
    - port: 80
      targetPort: 8080
```

### 验证配置

启用后，EndpointSlice 将包含拓扑提示信息：

```yaml
apiVersion: discovery.k8s.io/v1
kind: EndpointSlice
metadata:
  name: example-service-abc123
  labels:
    kubernetes.io/service-name: example-service
endpoints:
  - addresses:
      - "10.244.1.5"
    conditions:
      ready: true
    hostname: backend-pod-1
    nodeName: worker-node-1
    zone: us-west-1a
    hints:
      forZones:
        - name: "us-west-1a"
```

## 最佳实践

### 适用场景

拓扑感知路由特别适用于以下场景：

- **多可用区部署**：应用跨多个可用区部署时
- **成本敏感应用**：需要减少跨区域网络流量费用
- **延迟敏感应用**：对网络延迟有严格要求的应用

### 注意事项

- **负载均衡考虑**：拓扑感知可能导致负载分布不均，需要权衡性能和负载均衡
- **自动模式的保护机制**：`Auto` 模式下，若某个可用区的端点数相对该区 CPU 容量明显不足，或端点数少于可用区数，控制器会**拒绝下发提示**并退回均匀分发，此时 EndpointSlice 中不会出现 `hints` 字段，这是设计行为而非故障
- **与 Pod 反亲和/拓扑分布约束配合**：使用 `topologySpreadConstraints` 保证各区副本数均衡，是让 `Auto` 模式稳定生效的前提
- **故障转移**：当本地端点不可用时，kube-proxy 会回退到其他可用区的端点
- **监控指标**：建议监控跨区域流量比例和端点健康状态

### 与 trafficDistribution 的选择

{{< table title="拓扑感知提示与 trafficDistribution 对比" >}}

| 维度           | 拓扑感知提示（注解 `Auto`）           | `spec.trafficDistribution`             |
|----------------|---------------------------------------|----------------------------------------|
| 配置方式       | Service 注解                           | Service 规范字段，有 API 校验           |
| 决策者         | 控制面按可用区 CPU 容量比例计算        | 用户显式声明                             |
| 是否可能被忽略 | 会，容量不均时退回均匀分发             | 不会，总是生效                           |
| 支持粒度       | 可用区                                 | 可用区（`PreferSameZone`）、节点（`PreferSameNode`） |
| 状态           | 拓扑提示 v1.33 GA，但注解自 v1.33 起弃用 | v1.33 GA（`PreferClose`），`PreferSameZone`/`PreferSameNode` v1.35 GA |
| 推荐场景       | 希望系统兜底避免局部过载                | 延迟敏感、确定性要求高的服务               |

{{< /table >}}

## 故障排查

### 常见问题

1. **提示未生成**：检查 Service 注解配置和特性门控状态
2. **负载不均**：评估端点分布情况，考虑调整副本数量
3. **连接失败**：验证网络策略和防火墙规则

### 诊断命令

以下是相关的代码示例：

```bash
# 查看 EndpointSlice 详情
kubectl get endpointslices -o yaml

# 检查 Service 注解
kubectl get service <service-name> -o yaml

# 查看 kube-proxy 日志
kubectl logs -n kube-system -l k8s-app=kube-proxy
```

## 管理和维护

### 多控制器管理

EndpointSlice 支持多个控制器同时管理，通过 `endpointslice.kubernetes.io/managed-by` 标签进行区分：

- `endpointslice-controller.k8s.io`：默认的 EndpointSlice 控制器
- `custom-controller.example.com`：自定义控制器标识

### 生命周期管理

EndpointSlice 的生命周期通常与对应的 Service 绑定，通过 owner reference 和 `kubernetes.io/service-name` 标签进行关联管理。

## 总结

拓扑感知路由让 Service 流量尽量留在本地可用区或节点，兼顾延迟与跨区流量成本。`topology-mode: Auto` 注解由控制面依据容量自动决策，`spec.trafficDistribution` 则把选择权交给用户；理解两者的差异与各自的保护机制，才能在性能与负载均衡之间取得稳定的平衡。

## 参考文献

- [拓扑感知路由 - kubernetes.io](https://kubernetes.io/zh-cn/docs/concepts/services-networking/topology-aware-routing/)
- [EndpointSlice - kubernetes.io](https://kubernetes.io/zh-cn/docs/concepts/services-networking/endpoint-slices/)
- [Service 流量分发 - kubernetes.io](https://kubernetes.io/zh-cn/docs/concepts/services-networking/service/#traffic-distribution)
