---
weight: 90
title: Kubernetes 集群安全性配置最佳实践
linktitle: Kubernetes 安全最佳实践
date: '2022-05-21T00:00:00+08:00'
type: book
description: 全面介绍 Kubernetes 集群安全配置的最佳实践，包括端口管理、API 安全设置、RBAC 配置以及安全扫描工具的使用指南。
keywords:
- api
- kube
- kubelet
- kubernetes
- security
- rbac
- 端口
- 节点
- 身份验证
- 集群
- 安全扫描
---

本文提供 Kubernetes 集群安全性管理的最佳实践指南，帮助您构建更安全的容器化环境。

## 网络端口安全管理

合理管理和控制以下关键端口的访问权限：

| 端口      | 服务组件       | 用途描述                                           | 安全建议 |
| --------- | -------------- | -------------------------------------------------- | -------- |
| 6443/TCP  | kube-apiserver | Kubernetes API 服务端口                            | 限制访问源 |
| 10250/TCP | kubelet        | Kubelet API 端口，提供节点管理功能                 | 启用认证 |
| 10255/TCP | kubelet        | 只读端口，允许访问节点状态（已废弃）               | 建议禁用 |
| 10256/TCP | kube-proxy     | kube-proxy 健康检查端口                            | 内网访问 |
| 4194/TCP  | kubelet        | cAdvisor 容器监控指标端口                          | 限制访问 |
| 9099/TCP  | calico-felix   | Calico 网络插件健康检查端口                        | 内网访问 |

**端口安全建议：**

- 使用防火墙规则限制不必要的端口访问
- 禁用已废弃的 10255 只读端口
- 为敏感端口配置 TLS 加密传输

## API 服务器安全配置

### 身份认证与授权

**1. 启用 RBAC 授权模式**

避免使用不安全的 `AlwaysAllow` 授权模式，推荐配置：

```yaml
--authorization-mode=Node,RBAC
```

**2. 禁用匿名访问**

通过以下参数禁用匿名身份验证：

```yaml
--anonymous-auth=false
```

**3. 配置准入控制器**

建议启用以下准入控制器：

```yaml
--enable-admission-plugins=NodeRestriction,PodSecurityPolicy,ResourceQuota,LimitRanger
```

### TLS 和证书管理

- 为所有 API 通信启用 TLS 加密
- 定期轮换 API 服务器证书
- 使用强加密算法和密钥长度

## 节点安全配置

### Kubelet 安全设置

```yaml
# kubelet 配置示例
authentication:
    anonymous:
        enabled: false
    webhook:
        enabled: true
authorization:
    mode: Webhook
```

### 容器运行时安全

- 使用非特权容器运行工作负载
- 配置 Pod Security Standards 替代已废弃的 PSP
- 启用容器镜像签名验证

## 安全扫描与审计工具

### kube-bench 集群安全评估

[kube-bench](https://github.com/aquasecurity/kube-bench) 是基于 CIS Kubernetes Benchmark 的安全扫描工具：

```bash
# 运行 kube-bench
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml

# 查看扫描结果
kubectl logs job.batch/kube-bench
```

**主要功能：**

- 检查主节点配置安全性
- 验证工作节点合规性
- 评估控制平面组件配置
- 提供详细的修复建议

### 其他推荐安全工具

- **Falco**: 运行时安全监控
- **OPA Gatekeeper**: 策略即代码管理
- **Trivy**: 容器镜像漏洞扫描

## 网络安全策略

### Network Policy 配置

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
    name: deny-all-ingress
spec:
    podSelector: {}
    policyTypes:
    - Ingress
```

### 服务网格安全

考虑使用 Istio 或 Linkerd 等服务网格解决方案：

- 自动 mTLS 加密
- 细粒度访问控制
- 流量监控和审计

## 监控与日志安全

### 审计日志配置

启用 Kubernetes 审计功能：

```yaml
--audit-log-path=/var/log/audit.log
--audit-policy-file=/etc/kubernetes/policies/audit-policy.yaml
```

### 安全事件监控

建立安全事件响应机制：

- 配置异常行为告警
- 建立事件响应流程
- 定期进行安全演练

## 参考资源

- [CIS Kubernetes Benchmark](https://www.cisecurity.org/benchmark/kubernetes)
- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)
- [NIST Container Security Guide](https://csrc.nist.gov/publications/detail/sp/800-190/final)
- [Kubernetes 官方安全文档](https://kubernetes.io/docs/concepts/security/)
- [OWASP Kubernetes Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Kubernetes_Security_Cheat_Sheet.html)
