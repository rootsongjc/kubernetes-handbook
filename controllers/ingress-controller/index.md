---
weight: 34
title: Ingress 控制器
date: 2022-05-21T00:00:00+08:00
description: 深入了解 Kubernetes Ingress 控制器的作用、官方支持的控制器类型、第三方控制器选择，以及如何在集群中部署和管理多个 Ingress 控制器。
lastmod: 2025-10-27T16:07:37.713Z
---

> Ingress 控制器是 Kubernetes 网络流量管理的关键组件，决定了外部请求如何安全、高效地路由到集群内部服务，是实现弹性和可扩展网络架构的基础。

在 Kubernetes 集群中，若希望 [Ingress](../../service-discovery/ingress) 资源能够正常工作，必须部署至少一个 Ingress 控制器。与作为 `kube-controller-manager` 组件自动启动的其他控制器不同，Ingress 控制器需要用户根据实际需求单独部署和管理。选择合适的 Ingress 控制器对于集群的网络能力和安全性至关重要。

## 官方支持的控制器

Kubernetes 社区官方维护和支持多种 Ingress 控制器，适用于不同的云平台和场景。下表总结了主流官方控制器及其适用环境。

{{< table title="Kubernetes 官方支持的 Ingress 控制器" >}}

| 控制器名称                      | 适用平台/说明           |
|---------------------------------|------------------------|
| AWS Load Balancer Controller    | 专为 AWS 环境设计      |
| GCE Ingress Controller          | Google Cloud 原生支持  |
| NGINX Ingress Controller        | 基于 NGINX 的开源实现  |

{{< /table >}}

## 第三方控制器

除了官方控制器，社区还提供了丰富的第三方 Ingress 控制器选择，满足不同云环境、企业级和开源需求。

{{< table title="第三方 Ingress 控制器" >}}

<table>
    <thead>
        <tr>
            <th>类别</th>
            <th>控制器名称</th>
            <th>说明/适用场景</th>
            <th>链接</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td rowspan="3">云服务商</td>
            <td>AKS 应用程序网关 Ingress 控制器</td>
            <td>Microsoft Azure 集成</td>
            <td><a href="https://docs.microsoft.com/zh-cn/azure/application-gateway/tutorial-ingress-controller-add-on-existing" target="_blank">文档</a></td>
        </tr>
        <tr>
            <td>阿里云 MSE Ingress</td>
            <td>阿里云微服务引擎</td>
            <td><a href="https://www.alibabacloud.com/help/zh/mse/user-guide/overview-of-mse-ingress-gateways" target="_blank">文档</a></td>
        </tr>
        <tr>
            <td>OCI Native Ingress Controller</td>
            <td>Oracle Cloud Infrastructure</td>
            <td><a href="https://github.com/oracle/oci-native-ingress-controller#readme" target="_blank">GitHub</a></td>
        </tr>
        <tr>
            <td rowspan="5">企业级/商业</td>
            <td>Citrix Ingress 控制器</td>
            <td>企业级负载均衡与安全</td>
            <td><a href="https://github.com/citrix/citrix-k8s-ingress-controller#readme" target="_blank">GitHub</a></td>
        </tr>
        <tr>
            <td>F5 BIG-IP Ingress 服务</td>
            <td>高级流量管理与安全</td>
            <td><a href="https://clouddocs.f5.com/products/connectors/k8s-bigip-ctlr/latest" target="_blank">文档</a></td>
        </tr>
        <tr>
            <td>FortiADC Ingress 控制器</td>
            <td>集成 Fortinet 安全能力</td>
            <td><a href="https://docs.fortinet.com/document/fortiadc/7.0.0/fortiadc-ingress-controller/742835/fortiadc-ingress-controller-overview" target="_blank">文档</a></td>
        </tr>
        <tr>
            <td>NGINX Ingress 控制器（商业版）</td>
            <td>NGINX Plus 增强功能</td>
            <td><a href="https://www.nginx.com/products/nginx-ingress-controller/" target="_blank">官网</a></td>
        </tr>
        <tr>
            <td>Wallarm Ingress Controller</td>
            <td>集成 WAF，API 安全</td>
            <td><a href="https://www.wallarm.com/solutions/waf-for-kubernetes" target="_blank">官网</a></td>
        </tr>
        <tr>
            <td rowspan="7">开源社区</td>
            <td>Apache APISIX Ingress 控制器</td>
            <td>高性能 API 网关</td>
            <td><a href="https://github.com/apache/apisix-ingress-controller" target="_blank">GitHub</a></td>
        </tr>
        <tr>
            <td>Traefik Kubernetes Ingress 提供程序</td>
            <td>现代反向代理</td>
            <td><a href="https://doc.traefik.io/traefik/providers/kubernetes-ingress/" target="_blank">文档</a></td>
        </tr>
        <tr>
            <td>Contour</td>
            <td>基于 Envoy 的 Ingress 控制器</td>
            <td><a href="https://projectcontour.io/" target="_blank">官网</a></td>
        </tr>
        <tr>
            <td>Emissary-Ingress</td>
            <td>云原生 API 网关</td>
            <td><a href="https://www.getambassador.io/products/api-gateway" target="_blank">官网</a></td>
        </tr>
        <tr>
            <td>Istio Ingress</td>
            <td>服务网格集成</td>
            <td><a href="https://istio.io/latest/zh/docs/tasks/traffic-management/ingress/kubernetes-ingress/" target="_blank">文档</a></td>
        </tr>
        <tr>
            <td>Kong Ingress 控制器</td>
            <td>云原生 API 网关</td>
            <td><a href="https://github.com/Kong/kubernetes-ingress-controller#readme" target="_blank">GitHub</a></td>
        </tr>
        <tr>
            <td>HAProxy Ingress</td>
            <td>基于 HAProxy 的负载均衡器</td>
            <td><a href="https://haproxy-ingress.github.io/" target="_blank">官网</a></td>
        </tr>
        <tr>
            <td rowspan="5">新兴/专业化</td>
            <td>Cilium Ingress 控制器</td>
            <td>基于 eBPF 的网络方案</td>
            <td><a href="https://docs.cilium.io/en/stable/network/servicemesh/ingress/" target="_blank">文档</a></td>
        </tr>
        <tr>
            <td>Higress</td>
            <td>阿里云原生网关</td>
            <td><a href="https://github.com/alibaba/higress" target="_blank">GitHub</a></td>
        </tr>
        <tr>
            <td>Kusk Gateway</td>
            <td>OpenAPI 驱动的 API 网关</td>
            <td><a href="https://kusk.kubeshop.io/" target="_blank">官网</a></td>
        </tr>
        <tr>
            <td>ngrok Kubernetes Ingress 控制器</td>
            <td>隧道与边缘连接</td>
            <td><a href="https://github.com/ngrok/kubernetes-ingress-controller" target="_blank">GitHub</a></td>
        </tr>
        <tr>
            <td>Pomerium Ingress 控制器</td>
            <td>零信任网络访问</td>
            <td><a href="https://www.pomerium.com/docs/k8s/ingress.html" target="_blank">文档</a></td>
        </tr>
    </tbody>
</table>

{{< /table >}}

## 多控制器管理

在复杂的生产环境中，往往需要同时运行多个 Ingress 控制器，以满足不同业务或团队的需求。Kubernetes 提供了灵活的机制来实现多控制器共存和精细化流量管理。

### 使用 IngressClass 资源

通过 IngressClass 资源，可以在同一集群中部署和管理多个 Ingress 控制器。以下 YAML 示例展示了如何定义一个名为 `nginx` 的 IngressClass：

```yaml
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: nginx
spec:
  controller: k8s.io/ingress-nginx
```

### 指定控制器类型

创建 Ingress 资源时，可以通过 `ingressClassName` 字段明确指定所用控制器类型。以下 YAML 示例演示了如何将 Ingress 资源绑定到特定控制器：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: example-ingress
spec:
  ingressClassName: nginx
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: example-service
            port:
              number: 80
```

### 默认控制器设置

如果未在 Ingress 资源中指定 `ingressClassName`，Kubernetes 会自动应用默认的 IngressClass。可以通过为 IngressClass 资源添加如下注解来设置默认控制器：

```yaml
metadata:
  annotations:
    ingressclass.kubernetes.io/is-default-class: "true"
```

## 选择建议

选择合适的 Ingress 控制器时，建议综合考虑以下因素，以确保网络架构的稳定性和可扩展性。

{{< table title="Ingress 控制器选择建议" >}}

| 考虑因素         | 说明                                   |
|------------------|----------------------------------------|
| 云环境兼容性     | 优先选择与云平台深度集成的控制器       |
| 功能需求         | 是否需要 WAF、缓存、认证等高级功能      |
| 性能要求         | 控制器的性能表现和资源消耗             |
| 社区支持         | 项目活跃度和文档完善性                 |
| 运维复杂度       | 部署、配置和维护的易用性               |

{{< /table >}}

## 总结

Ingress 控制器是 Kubernetes 网络流量管理的核心，直接影响集群的可扩展性、安全性和高可用性。合理选择和配置 Ingress 控制器，结合 IngressClass 等机制实现多控制器协同，是构建现代云原生网络架构的关键。建议根据实际业务需求、云平台特性和团队运维能力，选择最适合的 Ingress 控制器方案，并持续关注社区动态和最佳实践。

## 参考文献

- [Awesome Cloud Native - jimmysong.io](https://awesome.jimmysong.io/#api-gateway)
- [Ingress Controllers - kubernetes.io](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/)
