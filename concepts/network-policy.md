# Network Policy

网络策略说明一组 `Pod` 之间是如何被允许互相通信，以及如何与其它网络 Endpoint 进行通信。 `NetworkPolicy` 资源使用标签来选择 `Pod`，并定义了一些规则，这些规则指明允许什么流量进入到选中的 `Pod` 上。关于 Network Policy 的详细用法请参考 [Kubernetes 官网](https://kubernetes.io/docs/concepts/services-networking/network-policies/)。

Network Policy 的作用对象是 Pod，也可以应用到 Namespace 和集群的 Ingress、Egress 流量。Network Policy 是作用在 L3/4 层的，即限制的是对 IP 地址和端口的访问，如果需要对应用层做访问限制需要使用如 [Istio](https://istio.io/zh) 这类 Service Mesh。

## 前提条件

网络策略通过网络插件来实现，所以必须使用一种支持 `NetworkPolicy` 的网络方案（如 [calico](https://www.projectcalico.org/)）—— 非 Controller 创建的资源，是不起作用的。

## 隔离的与未隔离的 Pod

默认 Pod 是未隔离的，它们可以从任何的源接收请求。 具有一个可以选择 Pod 的网络策略后，Pod 就会变成隔离的。 一旦 Namespace 中配置的网络策略能够选择一个特定的 Pod，这个 Pod 将拒绝任何该网络策略不允许的连接。（Namespace 中其它未被网络策略选中的 Pod 将继续接收所有流量）

## `NetworkPolicy` 资源

下面是一个 `NetworkPolicy` 的例子：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: test-network-policy
  namespace: default
spec:
  podSelector:
    matchLabels:
      role: db
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - ipBlock:
        cidr: 172.17.0.0/16
        except:
        - 172.17.1.0/24
    - namespaceSelector:
        matchLabels:
          project: myproject
    - podSelector:
        matchLabels:
          role: frontend
    ports:
    - protocol: TCP
      port: 6379
  egress:
  - to:
    - ipBlock:
        cidr: 10.0.0.0/24
    ports:
    - protocol: TCP
      port: 5978
```

*将上面配置 POST 到 API Server 将不起任何作用，除非选择的网络方案支持网络策略。*

**必选字段**：像所有其它 Kubernetes 配置一样， `NetworkPolicy` 需要 `apiVersion`、`kind` 和 `metadata` 这三个字段，关于如何使用配置文件的基本信息，可以查看 [这里](https://kubernetes.io/docs/user-guide/configuring-containers) 和 [这里](https://kubernetes.io/docs/user-guide/working-with-resources)。

**spec**：`NetworkPolicy` [spec](https://git.k8s.io/community/contributors/devel/api-conventions.md#spec-and-status) 具有在给定 Namespace 中定义特定网络的全部信息。

**podSelector**：每个 `NetworkPolicy` 包含一个 `podSelector`，它可以选择一组应用了网络策略的 Pod。由于 `NetworkPolicy` 当前只支持定义 `ingress` 规则，这个 `podSelector` 实际上为该策略定义了一组 “目标Pod”。示例中的策略选择了标签为 “role=db” 的 Pod。一个空的 `podSelector` 选择了该 Namespace 中的所有 Pod。

**ingress**：每个`NetworkPolicy` 包含了一个白名单 `ingress` 规则列表。每个规则只允许能够匹配上 `from` 和 `ports`配置段的流量。示例策略包含了单个规则，它从这两个源中匹配在单个端口上的流量，第一个是通过`namespaceSelector` 指定的，第二个是通过 `podSelector` 指定的。

**egress**：每个`NetworkPolicy` 包含了一个白名单 `ingress` 规则列表。每个规则只允许能够匹配上 `to` 和 `ports`配置段的流量。示例策略包含了单个规则，它匹配目的地 `10.0.0.0/24` 单个端口的流量。

因此，上面示例的 NetworkPolicy：

1. 在 “default” Namespace中 隔离了标签 “role=db” 的 Pod（如果他们还没有被隔离）
2. 在 “default” Namespace中，允许任何具有 “role=frontend” 的 Pod，IP 范围在  172.17.0.0–172.17.0.255 和 172.17.2.0–172.17.255.255（整个 172.17.0.0/16 段， 172.17.1.0/24 除外）连接到标签为 “role=db” 的 Pod 的 TCP 端口 6379
3. 允许在 Namespace 中任何具有标签 “project=myproject” ，IP范围在10.0.0.0/24段的 Pod，连接到 “default” Namespace 中标签为 “role=db” 的 Pod 的 TCP 端口 5978

查看 [NetworkPolicy 入门指南](https://kubernetes.io/docs/getting-started-guides/network-policy/walkthrough)给出的更进一步的例子。

## 默认策略

通过创建一个可以选择所有 Pod 但不允许任何流量的 NetworkPolicy，你可以为一个 Namespace 创建一个 “默认的” 隔离策略，如下所示：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
spec:
  podSelector:
```

这确保了即使是没有被任何 NetworkPolicy 选中的 Pod，将仍然是被隔离的。

可选地，在 Namespace 中，如果你想允许所有的流量进入到所有的 Pod（即使已经添加了某些策略，使一些 Pod 被处理为 “隔离的”），你可以通过创建一个策略来显式地指定允许所有流量：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-all
spec:
  podSelector:
  ingress:
  - {}
```
## 参考

- [Network Policies - k8smeetup.github.io](https://k8smeetup.github.io/docs/concepts/services-networking/network-policies/)
- [Network Policies - kubernetes.io](https://kubernetes.io/docs/concepts/services-networking/network-policies/)