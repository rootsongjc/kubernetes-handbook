---
weight: 39
title: Service
date: 2022-05-21T00:00:00+08:00
description: Kubernetes Service 为 Pod 提供稳定的网络访问抽象，通过标签选择器将流量路由到后端 Pod，支持多种服务发现方式和代理模式，是微服务架构中的核心组件。
lastmod: 2026-11-01T00:00:00+08:00
---

> Service 是 Kubernetes 微服务架构中实现稳定服务发现与流量调度的基础设施，合理设计可极大提升系统的可用性与可维护性。

## Service 概述

在 Kubernetes 集群中，Pod 具有生命周期性，IP 地址并不总是稳定可靠。通过 ReplicaSet 或 Deployment 等控制器可以动态地创建和销毁 Pod。对于需要为其他 Pod 提供服务的一组后端 Pod，前端应用如何发现并连接这些后端 Pod，是微服务架构中的关键问题。

Kubernetes Service（服务）定义了一种抽象，将一组功能相同的 Pod 逻辑分组，并通过标签选择器（Label Selector）实现流量路由。Service 能够为后端 Pod 提供统一的访问入口，解耦前后端依赖，提升系统弹性。

例如，一个图像处理服务运行了多个副本，前端应用无需关心具体调用哪个 Pod，Service 负责将请求分发到后端所有可用副本。Pod 的变更（如重启、扩缩容）不会影响客户端访问，Service 抽象实现了这种解耦。

对于集群内应用，Kubernetes 通过 EndpointSlice API 自动维护后端地址列表（早期的 Endpoints 对象仍会生成以兼容旧客户端，但已不再是主要数据源，v1.33 起正式弃用）。对于集群外访问，Service 通过虚拟 IP（VIP）实现统一入口，自动路由到后端 Pod。

## 定义 Service

Service 是 Kubernetes 的 REST 对象，可通过 YAML/JSON 配置并提交到 API Server 创建。

以下为典型 Service 配置示例：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: MyApp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 9376
```

该 Service 会将流量转发到所有带有 `app=MyApp` 标签的 Pod 的 9376 端口，并分配一个集群内部 IP（Cluster IP）。Service 的选择器持续评估，控制面自动创建并更新带有 `kubernetes.io/service-name: my-service` 标签的 EndpointSlice 对象。

`targetPort` 可为数字或字符串（引用容器端口名），便于后端升级时端口变更而不影响客户端调用。Service 支持 TCP、UDP、SCTP 协议，默认 TCP。

### 无选择器的 Service

Service 也可用于代理集群外部服务或特殊场景（如跨 Namespace、混合部署），此时无需 selector：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  ports:
    - protocol: TCP
      port: 80
      targetPort: 9376
```

需手动创建 EndpointSlice，并通过 `kubernetes.io/service-name` 标签与 Service 关联：

```yaml
apiVersion: discovery.k8s.io/v1
kind: EndpointSlice
metadata:
  name: my-service-1
  labels:
    kubernetes.io/service-name: my-service
addressType: IPv4
ports:
  - name: ""            # 与 Service 端口名对应，Service 只有一个未命名端口时留空
    protocol: TCP
    port: 9376
endpoints:
  - addresses:
      - "1.2.3.4"
```

> 端点 IP 不能为回环、链路本地或多播地址。手动创建 `v1` `Endpoints` 对象的旧做法仍可用，但 Endpoints API 已于 v1.33 弃用，新配置应直接使用 EndpointSlice。

## Service 类型

Kubernetes 支持多种 ServiceType，满足不同访问需求。

{{< table title="Kubernetes Service 类型对比" >}}

| 类型           | 说明                                                         | 典型场景           |
|----------------|--------------------------------------------------------------|--------------------|
| ClusterIP      | 仅集群内可访问（默认）                                       | 内部微服务通信     |
| NodePort       | 每个 Node 分配静态端口，外部可通过 `<NodeIP>:<NodePort>` 访问 | 开发测试、简单暴露 |
| LoadBalancer   | 云厂商负载均衡器，自动分配外部 IP                             | 生产级外部访问     |
| ExternalName   | 通过 CNAME 指向外部 DNS 名称                                 | 代理外部服务       |

{{< /table >}}

### ClusterIP

仅集群内部可访问，适合微服务间通信。

### NodePort

每个 Node 分配静态端口，外部可通过 `<NodeIP>:<NodePort>` 访问。端口范围默认 30000-32767。

### LoadBalancer

云平台自动创建负载均衡器，分配外部 IP，适合生产环境暴露服务。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: MyApp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 9376
  type: LoadBalancer
status:
  loadBalancer:
    ingress:
      - ip: 146.148.47.155
```

### ExternalName

通过 CNAME 方式代理外部服务，无需代理流量。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
  namespace: prod
spec:
  type: ExternalName
  externalName: my.database.example.com
```

> ExternalName 不能直接解析为 IP，推荐用于 DNS 名称代理。

## Service 代理模式

每个 Node 运行 `kube-proxy`，负责实现 Service 虚拟 IP（VIP）代理。Linux 上 kube-proxy 支持三种数据面模式，由 `--proxy-mode` 或配置文件中的 `mode` 字段指定。

### iptables 代理模式

默认模式。kube-proxy 监控 Service/EndpointSlice 变化，自动生成 iptables 规则，将流量重定向到后端 Pod。支持基于客户端 IP 的会话亲和性（`service.spec.sessionAffinity: ClientIP`）。规则数量随 Service 与端点数线性增长，大规模集群下规则同步耗时明显。

![iptables 代理模式下 Service 概览图](https://assets.jimmysong.io/images/book/kubernetes-handbook/service-discovery/service/services-iptables-overview.webp)
{width=600 height=400}

### IPVS 代理模式

基于内核 IPVS，支持多种负载均衡算法（轮询、最少连接、哈希等）。IPVS 模式已在 v1.35 被标记为弃用（计划 v1.40 起默认关闭、v1.43 移除），官方建议迁移到 nftables 模式或使用 Cilium 等替代 kube-proxy 的方案。官方给出的原因是内核 IPVS API 与 Kubernetes Service 语义匹配度不佳。

### nftables 代理模式

v1.33 起 GA，基于 nftables 构建，在大规模 Service/端点数量下的规则同步与数据面性能均优于 iptables。v1.37 中 Linux 默认模式仍为 iptables，官方已明确未来版本将把默认值切换为 nftables。nftables 模式要求内核 5.13+，并且对部分依赖 iptables 行为的边缘场景（如本机访问 NodePort 需走 `127.0.0.1`）有所调整。三种模式的详细对比与迁移建议见 [kube-proxy 模式演进](../../networking/kube-proxy-modes)。

### 替代 kube-proxy

Cilium 等基于 eBPF 的 CNI 插件可以完全接管 Service 负载均衡（`kubeProxyReplacement`），无需部署 kube-proxy。

## 多端口 Service

Service 支持暴露多个端口，需为每个端口命名，避免歧义。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: MyApp
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 9376
    - name: https
      protocol: TCP
      port: 443
      targetPort: 9377
```

## 自定义 ClusterIP

可通过 `spec.clusterIP` 指定自定义集群 IP，需在 `--service-cluster-ip-range` 范围内。若无效，API Server 返回 422 错误。

## 服务发现机制

Kubernetes 支持环境变量和 DNS 两种服务发现方式。

### 环境变量

Pod 启动时，kubelet 为每个 Service 注入环境变量（如 `REDIS_MASTER_SERVICE_HOST`）。需注意 Service 必须先于 Pod 创建。

### DNS

推荐方式。集群内 DNS 服务器为每个 Service 创建 DNS 记录，支持 A 记录和 SRV 记录。跨 Namespace 需使用全限定名（如 `my-service.my-ns`）。

## Headless Service

如无需负载均衡和 VIP，可将 `spec.clusterIP` 设为 `"None"`，实现 Headless Service。此时 DNS 直接返回所有后端 Pod 的 IP，适合自注册、状态同步等场景。

- 有选择器：DNS 返回 Pod IP 列表
- 无选择器：需手动创建 EndpointSlice

## 流量分发策略

默认情况下 Service 会把流量均匀分发到所有就绪端点，不考虑拓扑位置。`spec.trafficDistribution` 字段（v1.33 GA）允许表达"优先就近"的偏好：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: MyApp
  trafficDistribution: PreferSameZone   # 等价于早期的 PreferClose
  ports:
    - port: 80
      targetPort: 9376
```

{{< table title="trafficDistribution 取值说明" >}}

| 取值             | 行为                                                         | 引入版本   |
|------------------|--------------------------------------------------------------|------------|
| 未设置           | 均匀分发到所有端点                                            | —          |
| `PreferClose`    | 优先同可用区端点，无可用端点时回退到全集群（v1.34 起弃用，作为 `PreferSameZone` 的别名保留） | v1.30 Alpha，v1.33 GA |
| `PreferSameZone` | 与 `PreferClose` 语义相同，命名更明确                           | v1.33 Alpha，v1.35 GA |
| `PreferSameNode` | 优先同节点端点，其次同可用区，最后全集群                          | v1.33 Alpha，v1.35 GA |

{{< /table >}}

`trafficDistribution` 是对 `service.kubernetes.io/topology-mode: Auto` 注解的简化与替代（该注解已于 v1.33 弃用）：后者由控制面按各可用区 CPU 容量比例自动决定是否下发拓扑提示，可能因容量不均而拒绝启用；前者则是用户显式声明的偏好，总会生效。两者的差异与运维细节见 [拓扑感知路由](../topology-aware-routing)。

与之互补的还有两个策略字段：`internalTrafficPolicy: Local` 让集群内访问只路由到本节点端点；`externalTrafficPolicy: Local` 让 NodePort/LoadBalancer 的外部流量只路由到本节点端点并保留客户端源 IP。

## 外部 IP 与 externalIPs

Service 可通过 `externalIPs` 字段暴露外部 IP，需由集群管理员保证路由可达。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: MyApp
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 9376
  externalIPs: 
    - 80.11.12.10
```

## 虚拟 IP 实现与冲突避免

Kubernetes 为每个 Service 分配唯一 VIP，避免端口冲突。VIP 通过 iptables、IPVS、nftables 规则或 eBPF 程序实现，客户端访问 VIP 时自动转发到后端 Pod。v1.33 起 Service IP 分配使用基于 `IPAddress` 与 `ServiceCIDR` 对象的新分配器（`networking.k8s.io/v1`），允许在不重启控制面的情况下为集群追加 Service CIDR。

## API 对象与参考

Service 是 Kubernetes 顶级 REST 资源，详细字段见 [Service API 对象](https://kubernetes.io/docs/reference/kubernetes-api/service-resources/service-v1/)。

## 总结

Kubernetes Service 通过标签选择器、虚拟 IP、灵活的代理和服务发现机制，实现了微服务架构下的高可用、可扩展和易维护的服务访问。建议结合实际场景选择合适的 Service 类型和发现方式，提升系统健壮性。

## 参考文献

- [使用 Service 连接前端和后端 - kubernetes.io](https://kubernetes.io/docs/tutorials/connecting-apps/connecting-frontend-backend/)
- [DNS for Services and Pods - kubernetes.io](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)
- [EndpointSlices - kubernetes.io](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/)
- [Traffic Distribution - kubernetes.io](https://kubernetes.io/docs/concepts/services-networking/service/#traffic-distribution)
