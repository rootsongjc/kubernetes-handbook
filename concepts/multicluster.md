# 多集群管理

组织需要部署多个 Kubernetes 集群来为不同的业务提供隔离，增强可用性和可扩展性。

## 什么是多集群？

多集群是一种在多个Kubernetes集群上或跨集群部署应用的策略，目的是提高可用性、隔离性和可扩展性。多集群对于确保遵守不同的和相互冲突的法规非常重要，因为单个集群可以进行调整，以遵守特定地域或认证的法规。软件交付的速度和安全性也可以提高，单个开发团队将应用程序部署到隔离的集群中，并有选择地暴露哪些服务可用于测试和发布。

## 参考

- [Multicluster Special Interest Group](https://github.com/kubernetes/community/blob/master/sig-multicluster/README.md)

