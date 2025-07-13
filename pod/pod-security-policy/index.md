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

Pod 安全策略（PodSecurityPolicy，简称 PSP）是 Kubernetes 早期用于控制 Pod 安全上下文和运行行为的集群级安全机制。

**注意：自 Kubernetes v1.25 起，PSP 已被官方移除。建议迁移到 Pod Security Standards（PSS）和 Pod Security Admission（PSA），或采用 OPA Gatekeeper 等第三方方案。**

## Pod 安全策略简介

PSP 是一种集群级别的资源，允许管理员通过一组规则约束 Pod 的创建和运行，确保其符合组织安全要求。

**主要控制维度包括：**

- 权限控制（如特权容器、能力管理）
- 资源访问（如卷类型、主机网络、主机端口、主机命名空间、主机路径）
- 用户和组（如运行用户、附加组、文件系统组）
- 其他安全设置（如 SELinux 上下文、只读根文件系统）

**常见字段说明：**

| 控制项         | 字段名称                    | 描述                         |
| -------------- | -------------------------- | ---------------------------- |
| 特权容器       | privileged                 | 是否允许运行特权容器         |
| 能力管理       | defaultAddCapabilities     | 默认添加的能力               |
|                | requiredDropCapabilities   | 必须移除的能力               |
|                | allowedCapabilities        | 允许请求的能力               |
| 存储卷类型     | volumes                    | 允许使用的卷类型             |
| 主机网络       | hostNetwork                | 是否允许主机网络             |
| 主机端口       | hostPorts                  | 允许的主机端口范围           |
| 主机命名空间   | hostPID, hostIPC           | 是否允许主机 PID/IPC 命名空间|
| 主机路径       | allowedHostPaths           | 允许挂载的主机路径           |
| 运行用户       | runAsUser                  | 容器运行的用户 ID 规则       |
| 附加组         | supplementalGroups         | 允许的附加组 ID              |
| 文件系统组     | fsGroup                    | 拥有 Pod 卷的文件系统组      |
| SELinux 上下文 | seLinux                    | SELinux 安全上下文规则       |
| 只读根文件系统 | readOnlyRootFilesystem     | 是否强制只读根文件系统       |

## PSP 策略规则类型

- 布尔值控制：直接启用或禁用某项功能，默认最严格。
- 枚举值控制：从允许值集合中选择，如卷类型。
- 策略控制：通过策略机制生成和验证值，如 RunAsUser、SELinux、SupplementalGroups、FSGroup。

**RunAsUser 策略示例：**

- MustRunAs：必须在指定范围内
- MustRunAsNonRoot：必须非 root
- RunAsAny：允许任意用户 ID

**SELinux 策略示例：**

- MustRunAs：必须使用指定的 SELinux 选项
- RunAsAny：允许任意 SELinux 上下文

**SupplementalGroups/FSGroup 策略示例：**

- MustRunAs：必须在指定范围内
- RunAsAny：允许任意值

## 卷类型控制

PSP 可限制 Pod 使用的存储卷类型。常见卷类型有：

- 云存储卷：awsElasticBlockStore、azureDisk、gcePersistentDisk 等
- 网络存储卷：nfs、iscsi、glusterfs、cephFS 等
- 本地存储卷：hostPath、emptyDir、persistentVolumeClaim
- 配置和密钥卷：configMap、secret、downwardAPI、projected
- 其他卷类型：flexVolume、portworxVolume、scaleIO、storageos、quobyte、*（允许所有）

**建议：**新建 PSP 时，最小卷类型集合建议包含 configMap、downwardAPI、emptyDir、persistentVolumeClaim、secret、projected。

## 配置示例

下面是宽松和严格策略的 PSP 配置示例。

宽松策略示例说明：允许大部分操作，适合开发环境。

```yaml
# 宽松策略 PSP 配置示例
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

严格策略示例说明：限制更严格，适合生产环境。

```yaml
# 严格策略 PSP 配置示例
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

创建 PSP：使用如下命令创建 PodSecurityPolicy 资源。

```bash
kubectl apply -f pod-security-policy.yaml
```

查看当前集群中所有 PSP 资源的命令如下：

```bash
kubectl get psp
```

以下是 `kubectl get psp` 命令的输出示例：

```text
NAME         PRIV    CAPS   SELINUX    RUNASUSER          FSGROUP     SUPGROUP    READONLYROOTFS   VOLUMES
permissive   false   []     RunAsAny   RunAsAny           RunAsAny    RunAsAny    false           [configMap emptyDir projected secret downwardAPI persistentVolumeClaim]
restricted   false   []     RunAsAny   MustRunAsNonRoot   MustRunAs   MustRunAs   true            [configMap emptyDir projected secret downwardAPI persistentVolumeClaim]
```

如需编辑已存在的 PSP，可使用如下命令：

```bash
kubectl edit psp permissive
```

如需删除指定的 PSP，可使用如下命令：

```bash
kubectl delete psp permissive
```

## RBAC 集成

PSP 需与 RBAC 配合，以下是角色和绑定的 YAML 示例，允许 default ServiceAccount 使用 restricted PSP：

```yaml
# RBAC 配置示例，允许 default ServiceAccount 使用 restricted PSP
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

下面是为命名空间启用 Pod Security Admission 的标签配置示例：

```yaml
# 在命名空间上启用 Pod Security Admission 的示例
apiVersion: v1
kind: Namespace
metadata:
  name: my-namespace
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

**迁移建议：**建议先在测试环境验证新策略，使用 warn/audit 观察影响，再切换到 enforce 模式。

## 总结

虽然 PSP 已被废弃，但理解其原理有助于把握 Kubernetes 安全模型。Pod Security Standards 提供了更简单、标准化的安全控制方式，建议尽快迁移。
