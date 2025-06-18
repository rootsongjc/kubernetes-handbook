---
weight: 16
title: Pod 安全策略
date: '2022-05-21T00:00:00+08:00'
type: book
aliases:
  - /book/kubernetes-handbook/objects/pod-security-policy/
description: 'Pod 安全策略（PodSecurityPolicy）是 Kubernetes 中已废弃的集群级别安全控制机制，用于控制 Pod 的安全上下文和运行行为。本文介绍其基本概念、配置方法以及替代方案。'
keywords:
- pod
- podsecuritypolicy
- psp
- pod security admission
- 容器安全
- 安全策略
- kubernetes 安全
- 已废弃
---

## 概述

`PodSecurityPolicy` 是 Kubernetes 中的一种集群级别资源，用于控制 Pod 的安全上下文和运行行为。

{{<callout warning "重要">}}
**PodSecurityPolicy 已在 Kubernetes v1.25 中被移除**。建议迁移到 [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/) 和 [Pod Security Admission](https://kubernetes.io/docs/concepts/security/pod-security-admission/)，或使用其他第三方安全策略解决方案如 OPA Gatekeeper。
{{</callout>}}

## 什么是 Pod 安全策略？

Pod 安全策略是集群级别的资源，它定义了一组安全规则和约束条件，用于控制 Pod 的创建和运行。PSP 允许集群管理员在集群级别实施安全策略，确保 Pod 符合组织的安全要求。

### 主要控制维度

Pod 安全策略可以控制以下安全方面：

| 控制项 | 字段名称 | 描述 |
|--------|----------|------|
| **权限控制** |
| 特权容器 | `privileged` | 是否允许运行特权容器 |
| 能力管理 | `defaultAddCapabilities` | 为容器默认添加的能力 |
| | `requiredDropCapabilities` | 必须移除的能力 |
| | `allowedCapabilities` | 允许请求的能力 |
| **资源访问** |
| 存储卷类型 | `volumes` | 允许使用的卷类型 |
| 主机网络 | `hostNetwork` | 是否允许使用主机网络 |
| 主机端口 | `hostPorts` | 允许使用的主机端口范围 |
| 主机命名空间 | `hostPID` | 是否允许使用主机 PID 命名空间 |
| | `hostIPC` | 是否允许使用主机 IPC 命名空间 |
| 主机路径 | `allowedHostPaths` | 允许挂载的主机路径 |
| **用户和组** |
| 运行用户 | `runAsUser` | 容器运行的用户 ID 规则 |
| 附加组 | `supplementalGroups` | 允许的附加组 ID |
| 文件系统组 | `fsGroup` | 拥有 Pod 卷的文件系统组 |
| **其他安全设置** |
| SELinux 上下文 | `seLinux` | SELinux 安全上下文规则 |
| 只读根文件系统 | `readOnlyRootFilesystem` | 是否强制使用只读根文件系统 |

## 策略规则类型

PSP 的安全控制分为三种类型：

### 1. 布尔值控制

直接启用或禁用某项功能，默认为最严格的限制。

### 2. 枚举值控制

从预定义的允许值集合中选择，例如允许的卷类型。

### 3. 策略控制

通过策略机制生成和验证值，主要包括：

#### RunAsUser 策略

- **MustRunAs**: 必须在指定范围内运行
- **MustRunAsNonRoot**: 必须以非 root 用户运行
- **RunAsAny**: 允许任意用户 ID

#### SELinux 策略

- **MustRunAs**: 必须使用指定的 SELinux 选项
- **RunAsAny**: 允许任意 SELinux 上下文

#### SupplementalGroups 策略

- **MustRunAs**: 必须在指定范围内
- **RunAsAny**: 允许任意附加组

#### FSGroup 策略

- **MustRunAs**: 必须在指定范围内
- **RunAsAny**: 允许任意文件系统组

## 卷类型控制

PSP 可以控制 Pod 使用的存储卷类型，支持的卷类型包括：

**云存储卷**：

- `awsElasticBlockStore`
- `azureDisk`
- `azureFile`
- `gcePersistentDisk`
- `vsphereVolume`

**网络存储卷**：

- `nfs`
- `iscsi`
- `glusterfs`
- `cephFS`
- `rbd`

**本地存储卷**：

- `hostPath`
- `emptyDir`
- `persistentVolumeClaim`

**配置和密钥卷**：

- `configMap`
- `secret`
- `downwardAPI`
- `projected`

**其他卷类型**：

- `flexVolume`
- `portworxVolume`
- `scaleIO`
- `storageos`
- `quobyte`
- `*` (允许所有卷类型)

{{<callout note "建议">}}
对于新的 PSP，建议的最小卷类型集合包括：`configMap`、`downwardAPI`、`emptyDir`、`persistentVolumeClaim`、`secret` 和 `projected`。
{{</callout>}}

## 配置示例

### 宽松策略示例

```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: permissive
spec:
  privileged: false
  allowPrivilegeEscalation: true
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  hostNetwork: false
  hostIPC: false
  hostPID: false
  runAsUser:
    rule: 'RunAsAny'
  supplementalGroups:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
  seLinux:
    rule: 'RunAsAny'
```

### 严格策略示例

```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  hostNetwork: false
  hostIPC: false
  hostPID: false
  runAsUser:
    rule: 'MustRunAsNonRoot'
  supplementalGroups:
    rule: 'MustRunAs'
    ranges:
      - min: 1
        max: 65535
  fsGroup:
    rule: 'MustRunAs'
    ranges:
      - min: 1
        max: 65535
  seLinux:
    rule: 'RunAsAny'
  readOnlyRootFilesystem: true
```

## 管理操作

### 创建 PSP

```bash
kubectl apply -f pod-security-policy.yaml
```

### 查看 PSP 列表

```bash
kubectl get psp
```

输出示例：

```
NAME         PRIV    CAPS   SELINUX    RUNASUSER          FSGROUP     SUPGROUP    READONLYROOTFS   VOLUMES
permissive   false   []     RunAsAny   RunAsAny           RunAsAny    RunAsAny    false           [configMap emptyDir projected secret downwardAPI persistentVolumeClaim]
restricted   false   []     RunAsAny   MustRunAsNonRoot   MustRunAs   MustRunAs   true            [configMap emptyDir projected secret downwardAPI persistentVolumeClaim]
```

### 修改 PSP

```bash
kubectl edit psp permissive
```

### 删除 PSP

```bash
kubectl delete psp permissive
```

## RBAC 集成

PSP 需要与 RBAC 配合使用才能生效：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: psp-user
rules:
- apiGroups: ['policy']
  resources: ['podsecuritypolicies']
  verbs: ['use']
  resourceNames: ['restricted']
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: psp-user-binding
roleRef:
  kind: ClusterRole
  name: psp-user
  apiGroup: rbac.authorization.k8s.io
subjects:
- kind: ServiceAccount
  name: default
  namespace: default
```

## 迁移到 Pod Security Standards

由于 PSP 已被移除，建议迁移到新的 Pod Security Standards：

### 1. 启用 Pod Security Admission

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: my-namespace
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

### 2. 安全级别说明

- **Privileged**: 无限制策略
- **Baseline**: 最小限制策略，防止已知的特权升级
- **Restricted**: 严格限制策略，遵循当前的 Pod 安全最佳实践

### 3. 替代方案

- **OPA Gatekeeper**: 基于 Open Policy Agent 的准入控制器
- **Falco**: 运行时安全监控
- **Kyverno**: 基于 YAML 的 Kubernetes 策略引擎

{{<callout tip "迁移建议">}}
在迁移过程中，建议先在测试环境中验证新的安全策略，然后逐步在生产环境中部署。可以使用 `warn` 和 `audit` 模式来观察策略的影响，再切换到 `enforce` 模式。
{{</callout>}}

## 总结

虽然 PodSecurityPolicy 已被废弃，但了解其概念和工作原理仍然有助于理解 Kubernetes 的安全模型。新的 Pod Security Standards 提供了更简单、更标准化的方式来实现 Pod 安全控制，建议及时迁移到新的安全机制。
