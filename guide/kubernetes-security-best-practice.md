# Kubernetes集群安全性配置最佳实践

本文是对Kubernetes集群安全性管理的最佳实践。

## 端口

请注意管理好以下端口。

| 端口      | 进程           | 描述                                             |
| --------- | -------------- | ------------------------------------------------ |
| 4149/TCP  | kubelet        | 用于查询容器监控指标的cAdvisor端口               |
| 10250/TCP | kubelet        | 访问节点的API端口                                |
| 10255/TCP | kubelet        | 未认证的只读端口，允许访问节点状态               |
| 10256/TCP | kube-proxy     | kube-proxy的健康检查服务端口                     |
| 9099/TCP  | calico-felix   | calico的健康检查服务端口（如果使用calico/canal） |
| 6443/TCP  | kube-apiserver | Kubernetes API端口                               |

## Kubernetes安全扫描工具kube-bench

[kube-bench](https://github.com/aquasecurity/kube-bench)可以消除大约kubernetes集群中95％的配置缺陷。通过应用CIS Kubernetes Benchmark来检查master节点、node节点及其控制平面组件，从而确保集群设置了特定安全准则。在经历特定的Kubernetes安全问题或安全增强功能之前，这应该是第一步。

## API设置

**授权模式和匿名认证**

像kops这样的一些安装程序会为集群使用`AlwaysAllow`授权模式。这将授予任何经过身份验证的实体拥有完全访问集群的权限。应该使用RBAC基于角色的访问控制。检查您的kube-apiserver进程的`--authorization-mode`参数。有关该主题的更多信息，请访问<https://kubernetes.io/docs/admin/authorization/>。要强制进行身份验证，请确保通过设置`--anonymous-auth = false`禁用匿名身份验证。

注意这不影响Kubelet授权模式。kubelet本身公开了一个API来执行命令，通过它可以完全绕过Kubernetes API。

更多关于使用kops等工具自动安装Kubernetes集群的安全配置注意事项请参考[Kubernetes Security - Best Practice Guide](https://github.com/freach/kubernetes-security-best-practice)。

## 参考

- [Kubernetes Security - Best Practice Guide](https://github.com/freach/kubernetes-security-best-practice)
- [Kubernetes v1.7 security in practice](https://acotten.com/post/kube17-security)
- [Isolate containers with a user namespace](https://docs.docker.com/engine/security/userns-remap/)
- [Docker Security – It’s a Layered Approach](https://logz.io/blog/docker-security/)
- [Kubernetes 1.8: Security, Workloads and Feature Depth](http://blog.kubernetes.io/2017/09/kubernetes-18-security-workloads-and.html)
- [Security Matters: RBAC in Kubernetes](https://blog.heptio.com/security-matters-rbac-in-kubernetes-e369b483c8d8)