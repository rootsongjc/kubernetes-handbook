---
weight: 34
title: Ingress 控制器
date: '2022-05-21T00:00:00+08:00'
type: book
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
为了让 [Ingress](../../service-discovery/ingress) 资源工作，集群必须有一个运行中的 Ingress 控制器。与 `kube-controller-manager` 一起运行的其他类型的控制器不同，Ingress 控制器不是随集群自动启动的。你可以选择最适合你的集群的 Ingress 控制器。

Kubernetes 官方支持以下 Ingress 控制器：
- [AWS](https://github.com/kubernetes-sigs/aws-load-balancer-controller#readme)
- [GCE](https://git.k8s.io/ingress-gce/README.md#readme)
- [Nginx](https://git.k8s.io/ingress-nginx/README.md#readme)

### 其他控制器

以下是一些第三方 Ingress 控制器：
- [AKS 应用程序网关 Ingress 控制器](https://docs.microsoft.com/zh-cn/azure/application-gateway/tutorial-ingress-controller-add-on-existing)
- [阿里云 MSE Ingress](https://www.alibabacloud.com/help/zh/mse/user-guide/overview-of-mse-ingress-gateways)
- [Apache APISIX Ingress 控制器](https://github.com/apache/apisix-ingress-controller)
- [Avi Kubernetes Operator](https://github.com/vmware/load-balancer-and-ingress-services-for-kubernetes)
- [BFE Ingress 控制器](https://github.com/bfenetworks/ingress-bfe)
- [Cilium Ingress 控制器](https://docs.cilium.io/en/stable/network/servicemesh/ingress/)
- [Citrix Ingress 控制器](https://github.com/citrix/citrix-k8s-ingress-controller#readme)
- [Contour](https://projectcontour.io/)
- [Emissary-Ingress](https://www.getambassador.io/products/api-gateway)
- [EnRoute](https://getenroute.io/)
- [Easegress IngressController](https://megaease.com/docs/easegress/04.cloud-native/4.1.kubernetes-ingress-controller/)
- [F5 BIG-IP Ingress 服务](https://clouddocs.f5.com/products/connectors/k8s-bigip-ctlr/latest)
- [FortiADC Ingress 控制器](https://docs.fortinet.com/document/fortiadc/7.0.0/fortiadc-ingress-controller/742835/fortiadc-ingress-controller-overview)
- [Gloo](https://gloo.solo.io/)
- [HAProxy Ingress](https://haproxy-ingress.github.io/)
- [Higress](https://github.com/alibaba/higress)
- [Istio Ingress](https://istio.io/latest/zh/docs/tasks/traffic-management/ingress/kubernetes-ingress/)
- [Kong Ingress 控制器](https://github.com/Kong/kubernetes-ingress-controller#readme)
- [Kusk Gateway](https://kusk.kubeshop.io/)
- [NGINX Ingress 控制器](https://www.nginx.com/products/nginx-ingress-controller/)
- [ngrok Kubernetes Ingress 控制器](https://github.com/ngrok/kubernetes-ingress-controller)
- [OCI Native Ingress Controller](https://github.com/oracle/oci-native-ingress-controller#readme)
- [OpenNJet Ingress Controller](https://gitee.com/njet-rd/open-njet-kic)
- [Pomerium Ingress 控制器](https://www.pomerium.com/docs/k8s/ingress.html)
- [Skipper](https://opensource.zalando.com/skipper/kubernetes/ingress-controller/)
- [Traefik Kubernetes Ingress 提供程序](https://doc.traefik.io/traefik/providers/kubernetes-ingress/)
- [Tyk Operator](https://github.com/TykTechnologies/tyk-operator)
- [Voyager](https://voyagermesh.com/)
- [Wallarm Ingress Controller](https://www.wallarm.com/solutions/waf-for-kubernetes)

## 使用多个 Ingress 控制器

你可以使用 [Ingress 类](../../service-discovery/ingress/#ingress-class)在集群中部署多个 Ingress 控制器。在创建 Ingress 时，需要设置 `ingressClassName` 字段。

如果不指定 IngressClass，且集群中有一个默认的 IngressClass，Kubernetes 会将默认 IngressClass 应用到 Ingress 上。你可以通过将 IngressClass 资源的 `ingressclass.kubernetes.io/is-default-class` 注解设置为 `true` 来标记默认 IngressClass。

不同的 Ingress 控制器操作略有不同，请查阅相关文档。

## 参考

- [Awesome Cloud Native - jimmysong.io](https://jimmysong.io/awesome-cloud-native/#api-gateway)
- [Ingress Controllers - kubernetes.io](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/)
