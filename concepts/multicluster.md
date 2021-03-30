# 多集群管理

组织需要部署多个 Kubernetes 集群来为不同的业务提供隔离，增强可用性和可扩展性。

## 什么是多集群？

多集群是一种在多个Kubernetes集群上或跨集群部署应用的策略，目的是提高可用性、隔离性和可扩展性。多集群对于确保遵守不同的和相互冲突的法规非常重要，因为单个集群可以进行调整，以遵守特定地域或认证的法规。软件交付的速度和安全性也可以提高，单个开发团队将应用程序部署到隔离的集群中，并有选择地暴露哪些服务可用于测试和发布。

## 配置多集群访问

你可以使用 `kubectl config` 命令配置要访问的集群，详见[配置对多集群的访问](https://kubernetes.io/zh/docs/tasks/access-application-cluster/configure-access-multiple-clusters/)。

## 集群联邦

集群联邦（Federation）是指通过 Federation API 资源来统一管理多个集群的资源，如定义 Deployment 如何部署到不同集群上，其集群所需的副本数等。这些集群可能位于不同的可用区、地区或者供应商。实施集群联邦一般是为了达到以下目的：

- 简化管理多个集群的 Kubernetes 组件 (如 Deployment、Service 等；
- 在多个集群之间分散工作负载（Pod），以提升应用（服务）的可靠性；
- 跨集群的资源编排，依据编排策略在多个集群进行应用（服务）部署；
- 在不同集群中，能更快速更容易地迁移应用（服务）；
- 跨集群的服务发现，服务可以提供给当地存取，以降低延迟；
- 实践多云（Multi-cloud）或混合云（Hybird Cloud）的部署；

更多内容请见[集群联邦](../practice/federation.md)。

## 参考

- [Multicluster Special Interest Group - github.com](https://github.com/kubernetes/community/blob/master/sig-multicluster/README.md)
- [配置对多集群的访问 - kubernetes.io](https://kubernetes.io/zh/docs/tasks/access-application-cluster/configure-access-multiple-clusters/)

