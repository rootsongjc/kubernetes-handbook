---
weight: 34
title: Ingress 控制器
date: '2022-05-21T00:00:00+08:00'
type: book
---

为了使 Ingress 正常工作，集群中必须运行 Ingress controller。这与其他类型的控制器不同，其他类型的控制器通常作为 `kube-controller-manager` 二进制文件的一部分运行，在集群启动时自动启动。你需要选择最适合自己集群的 Ingress controller 或者自己实现一个。

Kubernetes 社区和众多厂商开发了大量的 Ingress Controller，你可以在 [这里](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/) 找到。

## 使用多个 Ingress 控制器

你可以使用 [IngressClass](https://kubernetes.io/docs/concepts/services-networking/ingress/#ingress-class) 在集群中部署任意数量的 Ingress 控制器。请注意你的 Ingress 类资源的 `.metadata.name` 字段。当你创建 Ingress 时，你需要用此字段的值来设置 Ingress 对象的 `ingressClassName` 字段（请参考 [IngressSpec v1 reference](https://kubernetes.io/docs/reference/kubernetes-api/service-resources/ingress-v1/#IngressSpec)）。 `ingressClassName` 是之前的[注解](https://kubernetes.io/docs/concepts/services-networking/ingress/#deprecated-annotation)做法的替代。

如果你不为 Ingress 指定 IngressClass，并且你的集群中只有一个 IngressClass 被标记为了集群默认，那么 Kubernetes 会应用此[默认 IngressClass](https://kubernetes.io/docs/concepts/services-networking/ingress/#default-ingress-class)。你可以通过将 [`ingressclass.kubernetes.io/is-default-class` 注解](https://kubernetes.io/docs/reference/labels-annotations-taints/#ingressclass-kubernetes-io-is-default-class) 的值设置为 `"true"` 来将一个 IngressClass 标记为集群默认。

理想情况下，所有 Ingress 控制器都应满足此规范，但各种 Ingress 控制器的操作略有不同。
