---
weight: 90
title: Kubernetes 集群安全性配置最佳实践
date: '2022-05-21T00:00:00+08:00'
type: book
---

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

## 参考

- [Kubernetes Security - Best Practice Guide - github.com](https://github.com/freach/kubernetes-security-best-practice)
- Kubernetes v1.7 security in practice - acotten.com
- [Isolate containers with a user namespace - docs.docker.com](https://docs.docker.com/engine/security/userns-remap/)
- [Docker Security – It’s a Layered Approach - logz.io](https://logz.io/blog/docker-security/)
- [Kubernetes 1.8: Security, Workloads and Feature Depth - blog.kubernetes.io](https://blog.kubernetes.io/2017/09/kubernetes-18-security-workloads-and.html)
- [Security Matters: RBAC in Kubernetes - blog.heptio.co](https://blog.heptio.com/security-matters-rbac-in-kubernetes-e369b483c8d8)
