---
weight: 25
title: "多租户：命名空间隔离、控制面与数据面边界以及虚拟集群"
linktitle: 多租户
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: multi-tenancy
description: "系统讨论 Kubernetes 多租户的两种模型（多团队与多客户）、隔离的三个层面（控制面、数据面、网络与存储），命名空间即租户的完整配置清单（RBAC、ResourceQuota、LimitRange、NetworkPolicy、PSA、优先级类），以及分层命名空间、Capsule、vCluster 等多租户项目与沙箱运行时的适用场景。"
---

> Kubernetes 本身没有"租户"对象——多租户是把 RBAC、配额、网络策略、准入控制这些积木按正确的方式搭起来后涌现出的能力。

当一个集群要同时服务多个团队、多个业务线乃至多个外部客户时，就进入了多租户（Multi-tenancy）场景。共享集群能显著降低控制面与节点的冗余开销，但也要求管理员在隔离强度、运维复杂度与成本之间找到平衡。本文梳理 Kubernetes 原生提供的隔离原语、推荐的命名空间级租户配置，以及社区项目对原生能力的补足。

## 两种租户模型

官方文档把多租户分为两类，二者对隔离强度的要求差异很大：

{{< table title="多团队租户与多客户租户" >}}

| 维度 | 多团队（Multi-team） | 多客户（Multi-customer / SaaS） |
|------|---------------------|-------------------------------|
| 租户是谁 | 同一组织内的不同团队 | 彼此不信任的外部客户 |
| 是否访问 API | 是，通过 kubectl、GitOps 等直接操作 | 通常不直接访问 Kubernetes API，由 SaaS 控制面代为创建资源 |
| 威胁模型 | 防误操作、防资源争抢，假定非恶意 | 假定恶意，需防容器逃逸与侧信道 |
| 典型隔离手段 | 命名空间 + RBAC + 配额 + 网络策略 | 以上全部 + 专用节点池 + 沙箱运行时 + 严格准入 |

{{< /table >}}

多数企业内部平台属于第一类，"命名空间即租户"的软隔离已经足够；面向外部客户运行不可信代码时，需要考虑虚拟集群或物理隔离。

## 隔离的三个层面

多租户隔离需要同时覆盖控制面、数据面与共享基础设施，任何一层缺失都会成为短板。

**控制面隔离**解决"租户能看见和操作什么"：

- 命名空间：绝大多数资源的作用域边界，也是 RBAC、配额、策略的挂载点
- RBAC：租户管理员在自己命名空间内获得 `admin` 角色，禁止授予集群级角色与 `escalate`/`bind`/`impersonate` 动词
- ResourceQuota 与 LimitRange：限制租户可消耗的计算资源、对象数量与单 Pod 的资源范围，详见 [资源配额与 LimitRange](../../cluster/resource-quota-and-limitrange)
- 准入控制：Pod 安全准入在命名空间上强制 `baseline`/`restricted`；验证准入策略限制租户可用的 StorageClass、镜像仓库、节点选择器等

**数据面隔离**解决"租户的工作负载能否互相影响"：

- 内核隔离：securityContext 最小权限（见 [安全上下文](../security-context)）、用户命名空间（`hostUsers: false`）让容器 root 映射为宿主机普通用户
- 沙箱运行时：gVisor、Kata Containers 通过 RuntimeClass 为不可信负载提供独立内核
- 节点隔离：用污点/容忍与节点亲和把租户固定在专属节点池，避免噪音邻居与节点级逃逸影响其他租户
- 优先级与抢占：为每个租户分配 PriorityClass 并用配额限制高优先级的使用量，防止一个租户的抢占驱逐他人（见 [优先级与抢占](../../cluster/priority-and-preemption)）

**网络与存储隔离**：

- NetworkPolicy：默认拒绝所有入站/出站，只放行命名空间内部与必要的平台服务（DNS、可观测性），详见 [网络策略](../network-policy)
- DNS：CoreDNS 默认让所有命名空间互相可解析，严格场景可用 CoreDNS 的 `firewall` 插件或网络策略限制跨租户解析
- 存储：StorageClass 的 `reclaimPolicy: Delete` 防止 PV 被下一个租户复用；配额限制每类 StorageClass 的 PVC 数量与容量；CSI 驱动需支持卷级加密时按租户分配密钥
- Ingress/Gateway：Gateway API 的角色分离天然适配多租户——平台团队拥有 `Gateway`，租户在自己命名空间创建 `HTTPRoute` 并通过 `allowedRoutes` 受控附加（见 [Gateway API](../../service-discovery/gateway)）

## 命名空间即租户的完整清单

下面是为一个租户 `team-a` 建立软隔离的最小配置集合，可作为平台自动化的模板：

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: team-a
  labels:
    tenant: team-a
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/warn: restricted
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-a-admins
  namespace: team-a
subjects:
- kind: Group
  name: team-a
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: admin                 # 内置聚合角色，不含修改配额与命名空间本身的权限
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-a
  namespace: team-a
spec:
  hard:
    requests.cpu: "40"
    requests.memory: 160Gi
    limits.cpu: "80"
    limits.memory: 320Gi
    requests.nvidia.com/gpu: "4"
    pods: "200"
    services.loadbalancers: "0"
    persistentvolumeclaims: "50"
    requests.storage: 2Ti
---
apiVersion: v1
kind: LimitRange
metadata:
  name: team-a
  namespace: team-a
spec:
  limits:
  - type: Container
    defaultRequest: { cpu: 100m, memory: 128Mi }
    default: { cpu: "1", memory: 1Gi }
    max: { cpu: "8", memory: 32Gi }
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: team-a
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
  ingress:
  - from:
    - podSelector: {}                      # 允许命名空间内互访
    - namespaceSelector:
        matchLabels: { kubernetes.io/metadata.name: ingress-system }
  egress:
  - to:
    - podSelector: {}
  - to:
    - namespaceSelector:
        matchLabels: { kubernetes.io/metadata.name: kube-system }
    ports:
    - protocol: UDP
      port: 53
```

在此基础上，用 ValidatingAdmissionPolicy 补上原生原语覆盖不到的规则，例如禁止租户使用 `hostPath`、限制镜像来自企业仓库、禁止 `nodeSelector` 指向平台节点池：

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingAdmissionPolicy
metadata:
  name: tenant-image-registry
spec:
  failurePolicy: Fail
  matchConstraints:
    resourceRules:
    - apiGroups: [""]
      apiVersions: ["v1"]
      operations: ["CREATE", "UPDATE"]
      resources: ["pods"]
  validations:
  - expression: >-
      object.spec.containers.all(c, c.image.startsWith('registry.example.com/'))
    message: "镜像必须来自 registry.example.com"
---
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingAdmissionPolicyBinding
metadata:
  name: tenant-image-registry
spec:
  policyName: tenant-image-registry
  validationActions: [Deny]
  matchResources:
    namespaceSelector:
      matchExpressions:
      - key: tenant
        operator: Exists
```

## 多租户项目

原生原语缺少"租户"这一聚合概念，每个命名空间都要重复配置，且租户无法自助创建命名空间。社区项目从不同角度补足这一空白：

{{< table title="Kubernetes 多租户项目对比" >}}

| 项目 | 模型 | 核心能力 | 适用场景 |
|------|------|----------|----------|
| [Hierarchical Namespace Controller（HNC）](https://github.com/kubernetes-sigs/hierarchical-namespaces) | 命名空间树 | 子命名空间自助创建，RBAC/NetworkPolicy 等对象自动向下继承 | 团队内部再分环境、子项目 |
| [Capsule](https://capsule.clastix.io/) | Tenant CRD | 租户拥有多个命名空间，统一配额、节点选择、Ingress 类、StorageClass 白名单，租户可自助建命名空间 | 企业内部平台、SaaS 控制面 |
| [vCluster](https://www.vcluster.com/) | 虚拟集群 | 在宿主集群的一个命名空间内运行完整的 API Server（k3s/k8s）+ 数据存储，租户拥有独立控制面与 CRD 空间，Pod 同步到宿主集群执行 | 需要集群管理员权限或自定义 CRD/Operator 的租户，CI 临时环境 |
| [Kamaji](https://kamaji.clastix.io/) | 托管控制面 | 把多个租户集群的控制面作为 Pod 运行在管理集群中，数据面节点独立 | 托管 Kubernetes 服务、边缘多集群 |
| Cluster API + 专用集群 | 物理隔离 | 每租户一个集群 | 强合规、完全不信任 |

{{< /table >}}

vCluster 代表了"控制面虚拟化"的思路：租户获得几乎完整的 Kubernetes 体验（可安装自己的 CRD 和 Operator，可拥有 cluster-admin），而节点、网络与存储仍由宿主集群复用；在隔离强度与资源效率之间取得了较好的折中，也成为多租户 AI 平台中为不同团队提供独立 Kubeflow/Ray 环境的常见选择。

## 隔离强度与成本的权衡

{{< table title="多租户方案的隔离强度与开销" >}}

| 方案 | 控制面隔离 | 数据面隔离 | 每租户额外开销 | 租户自主度 |
|------|-----------|-----------|---------------|-----------|
| 命名空间 + 原生原语 | 弱（共享 API Server 与 CRD） | 弱（共享内核与节点） | 几乎为零 | 低 |
| 命名空间 + Capsule/HNC | 中 | 弱 | 极低 | 中 |
| 命名空间 + 专用节点池 + 沙箱运行时 | 弱 | 强 | 节点资源碎片 | 低 |
| vCluster | 强（独立 API Server） | 弱至中（可配合专用节点池） | 数百 MB 内存的控制面 Pod | 高 |
| 独立集群 | 强 | 强 | 完整控制面 + 节点 | 最高 |

{{< /table >}}

实践中常见的组合是：企业内部团队使用命名空间 + Capsule 级别的软隔离，运行不可信代码（用户上传的函数、AI Agent 生成的代码）的工作负载额外使用 gVisor/Kata 与专用节点池，需要独立控制面的平台团队或 CI 使用 vCluster。

## 总结

Kubernetes 的多租户不是单个功能，而是命名空间、RBAC、配额、网络策略、Pod 安全准入、准入策略、优先级类与运行时沙箱的组合运用。明确租户模型（多团队还是多客户）后，先用原生原语搭建命名空间级软隔离，再根据威胁模型逐层加固——专用节点池与沙箱运行时加强数据面，Capsule/HNC 提供租户级抽象与自助能力，vCluster 在需要独立控制面时以较低成本逼近独立集群的体验。

## 参考文献

- [Multi-tenancy - kubernetes.io](https://kubernetes.io/docs/concepts/security/multi-tenancy/)
- [Hierarchical Namespaces - github.com](https://github.com/kubernetes-sigs/hierarchical-namespaces)
- [Capsule - capsule.clastix.io](https://capsule.clastix.io/)
- [vCluster - vcluster.com](https://www.vcluster.com/)
- [Kamaji - kamaji.clastix.io](https://kamaji.clastix.io/)
- [Security Checklist - kubernetes.io](https://kubernetes.io/docs/concepts/security/security-checklist/)
