---
weight: 34
title: Ingress 控制器
date: '2022-05-21T00:00:00+08:00'
type: book
description: 深入了解 Kubernetes Ingress 控制器的作用、官方支持的控制器类型、第三方控制器选择，以及如何在集群中部署和管理多个 Ingress 控制器。
keywords:
- controller
- ingress
- ingressclass
- io
- kubernetes
- native
- operator
- 控制器
- 集群
- 默认
---

为了让 [Ingress](../../service-discovery/ingress) 资源正常工作，Kubernetes 集群必须运行一个 Ingress 控制器。与作为 `kube-controller-manager` 组件一部分自动启动的其他控制器不同，Ingress 控制器需要单独部署。你可以根据集群的具体需求选择最合适的 Ingress 控制器实现。

## 官方支持的控制器

Kubernetes 社区官方维护和支持以下 Ingress 控制器：

- [AWS Load Balancer Controller](https://github.com/kubernetes-sigs/aws-load-balancer-controller#readme) - 专为 AWS 环境设计
- [GCE Ingress Controller](https://git.k8s.io/ingress-gce/README.md#readme) - Google Cloud Platform 原生支持
- [NGINX Ingress Controller](https://git.k8s.io/ingress-nginx/README.md#readme) - 基于 NGINX 的开源实现

## 第三方控制器

除了官方控制器，社区还提供了丰富的第三方 Ingress 控制器选择：

### 云服务商提供的控制器

- [AKS 应用程序网关 Ingress 控制器](https://docs.microsoft.com/zh-cn/azure/application-gateway/tutorial-ingress-controller-add-on-existing) - Microsoft Azure 集成
- [阿里云 MSE Ingress](https://www.alibabacloud.com/help/zh/mse/user-guide/overview-of-mse-ingress-gateways) - 阿里云微服务引擎
- [OCI Native Ingress Controller](https://github.com/oracle/oci-native-ingress-controller#readme) - Oracle Cloud Infrastructure

### 企业级和商业控制器

- [Citrix Ingress 控制器](https://github.com/citrix/citrix-k8s-ingress-controller#readme)
- [F5 BIG-IP Ingress 服务](https://clouddocs.f5.com/products/connectors/k8s-bigip-ctlr/latest)
- [FortiADC Ingress 控制器](https://docs.fortinet.com/document/fortiadc/7.0.0/fortiadc-ingress-controller/742835/fortiadc-ingress-controller-overview)
- [NGINX Ingress 控制器](https://www.nginx.com/products/nginx-ingress-controller/) - NGINX 商业版
- [Wallarm Ingress Controller](https://www.wallarm.com/solutions/waf-for-kubernetes) - 集成 WAF 功能

### 开源社区控制器

- [Apache APISIX Ingress 控制器](https://github.com/apache/apisix-ingress-controller) - 高性能 API 网关
- [Traefik Kubernetes Ingress 提供程序](https://doc.traefik.io/traefik/providers/kubernetes-ingress/) - 现代反向代理
- [Contour](https://projectcontour.io/) - 基于 Envoy 的 Ingress 控制器
- [Emissary-Ingress](https://www.getambassador.io/products/api-gateway) - 云原生 API 网关
- [Istio Ingress](https://istio.io/latest/zh/docs/tasks/traffic-management/ingress/kubernetes-ingress/) - 服务网格集成
- [Kong Ingress 控制器](https://github.com/Kong/kubernetes-ingress-controller#readme) - 云原生 API 网关
- [HAProxy Ingress](https://haproxy-ingress.github.io/) - 基于 HAProxy 的负载均衡器

### 新兴和专业化控制器

- [Cilium Ingress 控制器](https://docs.cilium.io/en/stable/network/servicemesh/ingress/) - 基于 eBPF 的网络解决方案
- [Higress](https://github.com/alibaba/higress) - 阿里云原生网关
- [Kusk Gateway](https://kusk.kubeshop.io/) - OpenAPI 驱动的 API 网关
- [ngrok Kubernetes Ingress 控制器](https://github.com/ngrok/kubernetes-ingress-controller) - 隧道和边缘连接
- [Pomerium Ingress 控制器](https://www.pomerium.com/docs/k8s/ingress.html) - 零信任网络访问

## 多控制器管理

在复杂的生产环境中，你可能需要同时运行多个 Ingress 控制器来满足不同的业务需求。

### 使用 IngressClass 资源

通过 IngressClass 资源，可以在同一集群中部署和管理多个 Ingress 控制器：

```yaml
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
    name: nginx
spec:
    controller: k8s.io/ingress-nginx
```

### 指定控制器类型

创建 Ingress 资源时，通过 `ingressClassName` 字段指定使用的控制器：

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

如果未指定 `ingressClassName`，Kubernetes 会自动应用默认的 IngressClass。通过为 IngressClass 资源添加 `ingressclass.kubernetes.io/is-default-class: "true"` 注解来设置默认控制器。

## 选择建议

选择 Ingress 控制器时，建议考虑以下因素：

- **云环境兼容性** - 选择与你的云平台深度集成的控制器
- **功能需求** - 考虑是否需要高级功能如 WAF、缓存、认证等
- **性能要求** - 评估控制器的性能表现和资源消耗
- **社区支持** - 选择活跃维护且文档完善的项目
- **运维复杂度** - 考虑部署、配置和维护的复杂性

## 参考资源

- [Awesome Cloud Native - jimmysong.io](https://awesome-cloud-native.jimmysong.io/#api-gateway)
- [Ingress Controllers - kubernetes.io](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/)
