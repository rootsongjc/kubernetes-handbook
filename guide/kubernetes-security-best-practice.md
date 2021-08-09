# Kubernetes 集群安全性配置最佳实践

本文是对 Kubernetes 集群安全性管理的最佳实践。

## 端口

请注意管理好以下端口。

| 端口      | 进程           | 描述                                               |
| --------- | -------------- | -------------------------------------------------- |
| 4149/TCP  | kubelet        | 用于查询容器监控指标的 cAdvisor 端口               |
| 10250/TCP | kubelet        | 访问节点的 API 端口                                |
| 10255/TCP | kubelet        | 未认证的只读端口，允许访问节点状态                 |
| 10256/TCP | kube-proxy     | kube-proxy 的健康检查服务端口                      |
| 9099/TCP  | calico-felix   | calico 的健康检查服务端口（如果使用 calico/canal） |
| 6443/TCP  | kube-apiserver | Kubernetes API 端口                                |

## Kubernetes 安全扫描工具 kube-bench

[kube-bench](https://github.com/aquasecurity/kube-bench) 可以消除大约 kubernetes 集群中 95％的配置缺陷。通过应用 CIS Kubernetes Benchmark 来检查 master 节点、node 节点及其控制平面组件，从而确保集群设置了特定安全准则。在经历特定的 Kubernetes 安全问题或安全增强功能之前，这应该是第一步。

## API 设置

**授权模式和匿名认证**

像 kops 这样的一些安装程序会为集群使用 `AlwaysAllow` 授权模式。这将授予任何经过身份验证的实体拥有完全访问集群的权限。应该使用 RBAC 基于角色的访问控制。检查您的 kube-apiserver 进程的 `--authorization-mode` 参数。有关该主题的更多信息，请访问[认证概览](https://kubernetes.io/docs/admin/authorization/)。要强制进行身份验证，请确保通过设置 `--anonymous-auth = false` 禁用匿名身份验证。

注意这不影响 Kubelet 授权模式。kubelet 本身公开了一个 API 来执行命令，通过它可以完全绕过 Kubernetes API。

更多关于使用 kops 等工具自动安装 Kubernetes 集群的安全配置注意事项请参考 [Kubernetes Security - Best Practice Guide](https://github.com/freach/kubernetes-security-best-practice)。

## Kubernetes 加固指南

*Kubernetes Hardening Guidance*（[查看英文原版 PDF](https://media.defense.gov/2021/Aug/03/2002820425/-1/-1/1/CTR_KUBERNETES HARDENING GUIDANCE.PDF)） 是由美国国家安全局（NSA）于 2021 年 8 月发布的，详见[出版信息](https://jimmysong.io/kubernetes-hardening-guidance/publication-infomation.md)。其中文版《Kubernetes 加固指南》（或译作《Kubernetes 强化指南》）是由 [Jimmy Song](https://jimmysong.i/) 翻译，[点击在线阅读](https://jimmysong.io/kubernetes-hardening-guidance)，如您发现错误，欢迎在 [GitHub](https://github.com/rootsongjc/kubernetes-hardening-guidance) 上提交勘误（已知[勘误](https://jimmysong.io/kubernetes-hardening-guidance/corrigendum.html)）。

## 参考

- [Kubernetes Security - Best Practice Guide - github.com](https://github.com/freach/kubernetes-security-best-practice)
- [Kubernetes v1.7 security in practice - acotten.com](https://acotten.com/post/kube17-security)
- [Isolate containers with a user namespace - docs.docker.com](https://docs.docker.com/engine/security/userns-remap/)
- [Docker Security – It’s a Layered Approach - logz.io](https://logz.io/blog/docker-security/)
- [Kubernetes 1.8: Security, Workloads and Feature Depth - blog.kubernetes.io](https://blog.kubernetes.io/2017/09/kubernetes-18-security-workloads-and.html)
- [Security Matters: RBAC in Kubernetes - blog.heptio.com](https://blog.heptio.com/security-matters-rbac-in-kubernetes-e369b483c8d8)
- [《Kubernetes 加固指南》中文版 - jimmysong.io](https://jimmysong.io/kubernetes-hardening-guidance/)
