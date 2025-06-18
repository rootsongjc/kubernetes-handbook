---
weight: 39
title: Service
date: '2022-05-21T00:00:00+08:00'
type: book
description: 'Kubernetes Service 为 Pod 提供稳定的网络访问抽象，通过标签选择器将流量路由到后端 Pod，支持多种服务发现方式和代理模式，是微服务架构中的核心组件。'
keywords:
- backend
- dns
- ip
- kubernetes
- my
- pod
- service
- 代理
- 端口
- 集群
---

Kubernetes 中的 Pod 具有生命周期性，它们可以被创建和销毁，但一旦被销毁就无法复活。通过 ReplicaSet 或 Deployment 等控制器可以动态地创建和销毁 Pod。每个 Pod 都会获得自己的 IP 地址，但这些 IP 地址并不总是稳定可靠的。这就带来了一个关键问题：在 Kubernetes 集群中，如果一组 Pod（后端服务）为其他 Pod（前端应用）提供服务，那么前端应用应该如何发现并连接到这些后端 Pod 呢？

## Service 概述

Kubernetes Service 定义了一种抽象：将一组功能相同的 Pod 进行逻辑分组，并提供访问这些 Pod 的统一策略——这通常被称为微服务。Service 能够通过标签选择器（Label Selector）来识别和访问后端 Pod。

例如，假设有一个图像处理服务运行了三个副本的后端 Pod。这些副本是可互换的——前端应用不需要关心调用的是哪个具体的后端副本。组成后端服务的 Pod 可能会因为各种原因发生变化（重启、扩缩容等），前端客户端不应该也不需要感知这些变化。Service 抽象很好地解耦了这种依赖关系。

对于 Kubernetes 集群内的应用，Kubernetes 提供了简单的 Endpoints API，当 Service 中的 Pod 发生变更时，应用程序会自动更新。对于集群外的应用，Kubernetes 提供了基于虚拟 IP（VIP）的访问方式，通过 Service 将请求路由到后端 Pod。

## 定义 Service

Service 是 Kubernetes 中的一个 REST 对象，类似于 Pod。像所有 REST 对象一样，可以通过 POST 请求向 API Server 提交 Service 定义来创建新实例。

假设有一组 Pod 对外暴露 9376 端口，并且被标记为 `"app=MyApp"`：

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

上述配置将创建一个名为 "my-service" 的 Service，它会将请求代理到具有 `"app=MyApp"` 标签的 Pod 的 9376 端口上。该 Service 会被分配一个集群内部 IP 地址（Cluster IP），用于服务代理。Service 的选择器会持续评估，结果会更新到同名的 Endpoints 对象中。

需要注意的是，Service 可以将接收端口映射到任意的 `targetPort`。默认情况下，`targetPort` 会被设置为与 `port` 字段相同的值。`targetPort` 也可以是字符串，引用后端 Pod 端口的名称。这种方式为 Service 的部署和设计提供了更大的灵活性，例如可以在后端软件的新版本中修改 Pod 暴露的端口，而不会影响客户端调用。

Kubernetes Service 支持 TCP、UDP 和 SCTP 协议，默认使用 TCP 协议。

### 无选择器的 Service

Service 不仅可以抽象对 Kubernetes Pod 的访问，还可以抽象其他类型的后端服务，例如：

- 在生产环境中使用外部数据库集群，在测试环境中使用集群内数据库
- 将 Service 指向其他 Namespace 或集群中的服务
- 将工作负载逐步迁移到 Kubernetes 集群，同时保留集群外的后端服务

在这些场景中，可以定义没有选择器的 Service：

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

由于此 Service 没有选择器，不会自动创建对应的 Endpoints 对象。需要手动将 Service 映射到指定的 Endpoints：

```yaml
apiVersion: v1
kind: Endpoints
metadata:
  name: my-service
subsets:
  - addresses:
      - ip: 1.2.3.4
    ports:
      - port: 9376
```

**注意**：Endpoint IP 地址不能是回环地址（127.0.0.0/8）、链路本地地址（169.254.0.0/16）或链路本地多播地址（224.0.0.0/24）。

访问无选择器的 Service 与有选择器的 Service 原理相同，请求会被路由到用户定义的 Endpoint（如示例中的 `1.2.3.4:9376`）。

## Service 类型

某些应用场景下，可能希望通过 Kubernetes 集群外部的 IP 地址暴露 Service。Kubernetes ServiceType 允许指定所需的 Service 类型，默认是 `ClusterIP`。

### ClusterIP

通过集群内部 IP 暴露服务。选择此类型时，服务只能在集群内部访问，这是默认的 ServiceType。

### NodePort

通过每个 Node 的 IP 和静态端口（NodePort）暴露服务。NodePort 服务会路由到自动创建的 ClusterIP 服务。通过 `<NodeIP>:<NodePort>` 可以从集群外部访问 NodePort 服务。

当设置 `type` 为 `"NodePort"` 时，Kubernetes 控制平面会从配置的端口范围内（默认：30000-32767）分配端口。每个 Node 都会从该端口代理到 Service。该端口通过 `Service` 的 `spec.ports[*].nodePort` 字段指定。

### LoadBalancer

使用云提供商的负载均衡器向外部暴露服务。外部负载均衡器会路由到 NodePort 和 ClusterIP 服务。

设置 `type` 为 `"LoadBalancer"` 时，云提供商会创建负载均衡器。负载均衡器信息通过 `Service` 的 `status.loadBalancer` 字段发布。

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

通过返回 CNAME 记录将服务映射到 `externalName` 字段的内容（如 `foo.bar.example.com`）。不会创建任何形式的代理。

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

**注意**：ExternalName 接受 IPv4 地址格式的字符串，但它被视为由数字组成的 DNS 名称，而不是 IP 地址。类似 IPv4 地址的 ExternalName 不能被 CoreDNS 解析，因为 ExternalName 的目的是指定规范的 DNS 名称。如需硬编码 IP 地址，请考虑使用 Headless Service。

## Service 代理模式

在 Kubernetes 集群中，每个 Node 运行一个 `kube-proxy` 进程。`kube-proxy` 负责为 Service 实现虚拟 IP（VIP）形式的代理，而不是 ExternalName 形式。

### iptables 代理模式

在此模式下，kube-proxy 监视 Kubernetes 控制平面对 Service 和 Endpoints 对象的添加和删除。对每个 Service，它会创建 iptables 规则来捕获到达该 Service ClusterIP 和端口的请求，并将请求重定向到 Service 的后端 Pod 之一。对于每个 Endpoints 对象，它也会创建 iptables 规则来选择后端 Pod。

默认策略是随机选择后端。可以通过将 `service.spec.sessionAffinity` 设置为 `"ClientIP"`（默认为 `"None"`）来实现基于客户端 IP 的会话亲和性。

![iptables 代理模式下 Service 概览图](https://assets.jimmysong.io/images/book/kubernetes-handbook/service-discovery/service/services-iptables-overview.webp)
{width=600 height=400}

### IPVS 代理模式

在此模式下，kube-proxy 监视 Kubernetes Service 和 Endpoints，调用 netlink 接口创建 IPVS 规则，并定期同步以确保 IPVS 状态与预期一致。访问服务时，流量会被重定向到后端 Pod 之一。

IPVS 代理模式基于内核空间的哈希表，比 iptables 代理模式具有更好的性能，特别是在大规模集群中。IPVS 还支持多种负载均衡算法：

- rr：round-robin（轮询）
- lc：least connection（最少连接数）
- dh：destination hashing（目标哈希）
- sh：source hashing（源哈希）
- sed：shortest expected delay（最短预期延迟）
- nq：never queue（从不排队）

## 多端口 Service

许多 Service 需要暴露多个端口。Kubernetes 支持在 Service 对象中定义多个端口。使用多个端口时，必须为所有端口提供名称，以避免 Endpoint 产生歧义：

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

## 选择集群 IP 地址

在创建 Service 时，可以通过设置 `spec.clusterIP` 字段来指定自定义的集群 IP 地址。例如，希望替换现有 DNS 条目或遗留系统已配置特定 IP 且难以重新配置的情况。

用户选择的 IP 地址必须是有效的，并且在 API Server 通过 `--service-cluster-ip-range` 标志指定的 CIDR 范围内。如果 IP 地址无效，API Server 会返回 HTTP 状态码 422，表示值不合法。

### 为什么不使用轮询 DNS？

一个经常出现的问题是，为什么使用 VIP 方式而不是标准的轮询 DNS，原因如下：

- 长期以来，DNS 库没有认真对待 DNS TTL，缓存域名查询结果
- 许多应用只查询一次 DNS 并缓存结果
- 即使应用和库能够正确查询解析，每个客户端重复解析造成的负载也难以管理

## 服务发现

Kubernetes 支持两种基本的服务发现模式：环境变量和 DNS。

### 环境变量

当 Pod 在 Node 上运行时，kubelet 会为每个活跃的 Service 添加一组环境变量。它支持 Docker links 兼容变量和简单的 `{SVCNAME}_SERVICE_HOST` 和 `{SVCNAME}_SERVICE_PORT` 变量，其中 Service 名称需要大写，连字符转换为下划线。

例如，一个名为 `"redis-master"` 的 Service 暴露 TCP 端口 6379，分配的 Cluster IP 为 10.0.0.11，会生成以下环境变量：

```bash
REDIS_MASTER_SERVICE_HOST=10.0.0.11
REDIS_MASTER_SERVICE_PORT=6379
REDIS_MASTER_PORT=tcp://10.0.0.11:6379
REDIS_MASTER_PORT_6379_TCP=tcp://10.0.0.11:6379
REDIS_MASTER_PORT_6379_TCP_PROTO=tcp
REDIS_MASTER_PORT_6379_TCP_PORT=6379
REDIS_MASTER_PORT_6379_TCP_ADDR=10.0.0.11
```

**注意**：这种方式有顺序要求——Pod 要访问的任何 Service 必须在 Pod 创建之前存在，否则环境变量不会被设置。DNS 没有这个限制。

### DNS

DNS 服务器是推荐的集群插件。DNS 服务器监视 Kubernetes API 中新 Service 的创建，并为每个 Service 创建一组 DNS 记录。如果在整个集群中启用了 DNS，那么所有 Pod 都应该能够自动解析 Service。

例如，在 `"my-ns"` Namespace 中有一个名为 `"my-service"` 的 Service，会创建 `"my-service.my-ns"` 的 DNS 记录。

在 `"my-ns"` Namespace 中的 Pod 可以简单地通过名称查找 `"my-service"`。其他 Namespace 中的 Pod 必须使用限定名称 `"my-service.my-ns"`。这些名称查询的结果是 Cluster IP。

Kubernetes 还支持端口名称的 DNS SRV（Service）记录。如果 `"my-service.my-ns"` Service 有一个名为 `"http"` 的 TCP 端口，可以对 `"_http._tcp.my-service.my-ns"` 执行 DNS SRV 查询来获取 `"http"` 端口号。

Kubernetes DNS 服务器是访问 ExternalName 类型 Service 的唯一方式。

## Headless Service

有时不需要负载均衡和单独的 Service IP。这种情况下，可以通过将 Cluster IP（`spec.clusterIP`）设置为 `"None"` 来创建 Headless Service。

这个选项允许开发人员自由选择服务发现方式，降低与 Kubernetes 系统的耦合。应用可以使用自注册模式，其他需要发现机制的系统也可以基于此 API 构建。

对于 Headless Service，不会分配 Cluster IP，kube-proxy 不会处理它们，平台也不会进行负载均衡和路由。DNS 的自动配置取决于 Service 是否定义了选择器。

### 配置选择器

对于定义了选择器的 Headless Service，Endpoint 控制器在 API 中创建 Endpoints 记录，并修改 DNS 配置返回 A 记录（地址），直接指向 Service 的后端 Pod。

### 不配置选择器

对于没有定义选择器的 Headless Service，Endpoint 控制器不会创建 Endpoints 记录。DNS 系统会查找和配置：

- ExternalName 类型 Service 的 CNAME 记录
- 与 Service 共享名称的任何 Endpoints，以及所有其他类型的记录

## 外部 IP

如果外部 IP 路由到集群中的一个或多个 Node，Kubernetes Service 可以通过这些 `externalIPs` 暴露。通过外部 IP（作为目标 IP 地址）进入集群并到达 Service 端口的流量会被路由到 Service 的 Endpoint。`externalIPs` 不由 Kubernetes 管理，属于集群管理员的职责范围。

根据 Service 规范，`externalIPs` 可以与任意 ServiceType 一起使用：

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

在上面的示例中，客户端可以通过 `80.11.12.10:80`（外部 IP:端口）访问 `my-service`。

## ExternalName 的限制

使用 ExternalName 时，某些常见协议（包括 HTTP 和 HTTPS）可能会出现问题。如果使用 ExternalName，集群内客户端使用的主机名与 ExternalName 引用的名称不同。

对于使用主机名的协议，这种差异可能导致错误或意外响应。HTTP 请求会有源服务器不认识的 `Host:` 标头，TLS 服务器无法提供与客户端连接主机名匹配的证书。

## 虚拟 IP 实现

### 避免冲突

Kubernetes 的主要设计理念之一是用户不应该遇到可能导致操作失败但不是他们过错的情况。对于网络端口，用户不应该必须选择可能与其他用户冲突的端口号。

为了让用户能够为 Service 选择端口号，我们必须确保两个 Service 不会发生冲突。Kubernetes 通过为每个 Service 分配自己的 IP 地址来实现这一点。

为了确保每个 Service 都分配到唯一的 IP，内部分配器会原子性地更新 etcd 中的全局分配映射，此操作先于每个 Service 的创建。

### IP 和 VIP

与 Pod 的 IP 地址（实际路由到固定目标）不同，Service 的 IP 实际上不会由单个主机应答。相反，我们使用 iptables（Linux 中的数据包处理逻辑）来定义虚拟 IP 地址（VIP），它可以根据需要透明地重定向。当客户端连接到 VIP 时，它们的流量会自动传输到合适的 Endpoint。环境变量和 DNS 实际上会根据 Service 的 VIP 和端口进行填充。

## API 对象

在 Kubernetes REST API 中，Service 是顶级资源。您可以在 [Service API 对象](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#service-v1-core) 中找到更多详细信息。

## 参考链接

- [使用 Service 连接前端和后端 - kubernetes.io](https://kubernetes.io/docs/tutorials/connecting-apps/connecting-frontend-backend/)
- [DNS for Services and Pods - kubernetes.io](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)
