---
weight: 90
title: Kubernetes 集群安全性配置最佳实践
linktitle: Kubernetes 安全最佳实践
date: 2022-05-21T00:00:00+08:00
description: 全面介绍 Kubernetes 集群安全配置的最佳实践，包括端口管理、API 安全设置、RBAC 配置以及安全扫描工具的使用指南。
lastmod: 2025-10-27T17:08:53.420Z
---

> Kubernetes 集群安全配置是保障云原生基础设施稳定运行的基石，涵盖端口、API、节点、网络、监控等多维度防护，需系统性落地最佳实践。

## 网络端口安全管理

在 Kubernetes 集群中，合理管理和控制关键端口的访问权限是防止外部攻击和内部越权的第一道防线。

{{< table title="Kubernetes 关键端口安全建议" >}}

| 端口      | 服务组件       | 用途描述                                           | 安全建议   |
| --------- | -------------- | -------------------------------------------------- | ---------- |
| 6443/TCP  | kube-apiserver | Kubernetes API 服务端口                            | 限制访问源 |
| 10250/TCP | kubelet        | Kubelet API 端口，提供节点管理功能                 | 启用认证   |
| 10255/TCP | kubelet        | 只读端口，允许访问节点状态（已废弃）               | 建议禁用   |
| 10256/TCP | kube-proxy     | kube-proxy 健康检查端口                            | 内网访问   |
| 4194/TCP  | kubelet        | cAdvisor 容器监控指标端口                          | 限制访问   |
| 9099/TCP  | calico-felix   | Calico 网络插件健康检查端口                        | 内网访问   |

{{< /table >}}

**端口安全建议：**

- 使用防火墙规则限制不必要的端口访问
- 禁用已废弃的 10255 只读端口
- 为敏感端口配置 TLS 加密传输

## API 服务器安全配置

API 服务器（kube-apiserver）是集群的核心控制面，安全配置至关重要。

### 身份认证与授权

为防止未授权访问，需合理配置认证与授权机制。

- **启用 RBAC 授权模式**  
  避免使用不安全的 `AlwaysAllow` 授权模式，推荐配置：

  ```text
  --authorization-mode=Node,RBAC
  ```

- **禁用匿名访问**  
  通过以下参数禁用匿名身份验证：

  ```text
  --anonymous-auth=false
  ```

- **配置准入控制器**  
  建议启用以下准入控制器：

  ```text
  --enable-admission-plugins=NodeRestriction,ResourceQuota,LimitRanger
  ```

### TLS 和证书管理

- 为所有 API 通信启用 TLS 加密
- 定期轮换 API 服务器证书
- 使用强加密算法和足够长度的密钥

## 节点安全配置

节点安全是集群整体安全的重要一环，需从 kubelet 配置和容器运行时两方面入手。

### Kubelet 安全设置

以下为 kubelet 推荐安全配置示例：

```yaml
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
- 配置 Pod Security Standards（PSS）替代已废弃的 PSP
- 启用容器镜像签名验证，确保镜像来源可信

## 安全扫描与审计工具

为及时发现安全隐患，建议定期使用自动化工具进行安全扫描和合规性检查。

### kube-bench 集群安全评估

[kube-bench](https://github.com/aquasecurity/kube-bench) 是基于 CIS Kubernetes Benchmark 的安全扫描工具，可自动检测集群配置风险。

```bash
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml
kubectl logs job.batch/kube-bench
```

**主要功能：**

- 检查主节点配置安全性
- 验证工作节点合规性
- 评估控制平面组件配置
- 提供详细的修复建议

### 其他推荐安全工具

- **Falco**：运行时安全监控
- **OPA Gatekeeper**：策略即代码管理
- **Trivy**：容器镜像漏洞扫描

## 网络安全策略

网络安全是 Kubernetes 集群防护体系的重要组成部分，需结合网络策略和服务网格实现多层防护。

### Network Policy 配置

通过配置 NetworkPolicy，可实现细粒度的流量控制。以下为拒绝所有入站流量的示例：

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

采用 Istio、Linkerd 等服务网格方案，可进一步提升集群安全性：

- 自动 mTLS 加密
- 细粒度访问控制
- 流量监控和审计

## 监控与日志安全

完善的监控与日志体系有助于及时发现安全事件并追溯问题根因。

### 审计日志配置

启用 Kubernetes 审计功能，记录关键操作：

```text
--audit-log-path=/var/log/audit.log
--audit-policy-file=/etc/kubernetes/policies/audit-policy.yaml
```

### 安全事件监控

建立安全事件响应机制，提升安全运营能力：

- 配置异常行为告警
- 建立事件响应流程
- 定期进行安全演练

## 总结

Kubernetes 集群安全需覆盖端口、API、节点、网络、监控等多个层面。通过合理配置认证授权、强化节点与容器安全、落地网络策略、引入自动化安全工具和完善日志监控体系，可大幅提升集群整体安全性。建议结合实际业务场景，持续优化安全防护措施，构建可信赖的云原生基础设施。

## 参考文献

- [CIS Kubernetes Benchmark - cisecurity.org](https://www.cisecurity.org/benchmark/kubernetes)
- [Kubernetes Security Best Practices - kubernetes.io](https://kubernetes.io/docs/concepts/security/)
- [NIST Container Security Guide - csrc.nist.gov](https://csrc.nist.gov/publications/detail/sp/800-190/final)
- [Kubernetes 官方安全文档 - kubernetes.io](https://kubernetes.io/docs/concepts/security/)
- [OWASP Kubernetes Security Cheat Sheet - cheatsheetseries.owasp.org](https://cheatsheetseries.owasp.org/cheatsheets/Kubernetes_Security_Cheat_Sheet.html)
