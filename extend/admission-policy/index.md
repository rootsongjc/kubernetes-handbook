---
weight: 21
title: "准入策略：用 CEL 替代 Webhook（ValidatingAdmissionPolicy 与 MutatingAdmissionPolicy）"
linktitle: 准入策略（CEL）
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: admission-policy
description: "介绍 Kubernetes 内建的声明式准入策略：ValidatingAdmissionPolicy（v1.30 GA）与 MutatingAdmissionPolicy（v1.36 GA）。涵盖策略/绑定/参数三件套、CEL 表达式可用变量、validationActions、matchConditions、变量组合、ApplyConfiguration 与 JSONPatch 两种变更方式、重调用策略、与 Webhook 的取舍及迁移建议。"
---

> 大多数准入 Webhook 做的事情不过是"检查几个字段"或"补几个默认值"，为此部署、签发证书、保证高可用一个 HTTP 服务并不值得——CEL 准入策略让这些逻辑回到 API Server 进程内。

准入 Webhook 自 v1.9 起就是扩展 Kubernetes 校验与变更逻辑的标准方式，但它的运维代价一直被低估：需要部署并维护一个高可用的 HTTPS 服务、管理证书轮换、处理超时与失败策略，Webhook 不可用时轻则写操作变慢、重则整个集群无法创建 Pod。而现实中大量 Webhook 做的只是"镜像必须来自内部仓库""Deployment 必须带 owner 标签""给 Pod 注入默认的 seccomp 配置"这类简单逻辑。

Kubernetes 用 [CEL](https://kubernetes.io/docs/reference/using-api/cel/)（Common Expression Language）解决这一问题：先在 v1.29 让 CRD 的 CEL 校验规则 GA，随后把同一套表达式能力带到准入阶段——`ValidatingAdmissionPolicy`（KEP-3488，v1.26 Alpha、v1.30 GA）负责校验，`MutatingAdmissionPolicy`（KEP-3962，v1.32 Alpha、v1.34 Beta、v1.36 GA）负责变更。两者都在 kube-apiserver 进程内执行，无网络往返、无额外部署，且都属于 `admissionregistration.k8s.io/v1`。

## 策略的三件套

无论校验还是变更，一个完整的准入策略由三类资源组成：

{{< table title="准入策略的组成资源" >}}

| 资源                                            | 职责                                                                 | 类比                   |
|-------------------------------------------------|----------------------------------------------------------------------|------------------------|
| `ValidatingAdmissionPolicy` / `MutatingAdmissionPolicy` | 定义抽象逻辑：匹配哪些资源、执行什么表达式                          | "必须带 owner 标签"      |
| 参数资源（可选）                                 | 为策略提供具体取值，可以是 ConfigMap 或任意 CRD 实例，由 `paramKind` 声明类型 | "owner 必须是 team-a"    |
| `ValidatingAdmissionPolicyBinding` / `MutatingAdmissionPolicyBinding` | 把策略与参数绑定，并限定作用范围（命名空间选择器、对象选择器）与执行动作 | "对 prod 命名空间启用"   |

{{< /table >}}

策略本身不生效，必须有至少一个绑定引用它。这种拆分让平台团队编写策略、各业务团队通过绑定与参数自助启用成为可能。

## ValidatingAdmissionPolicy

### 基本示例

以下策略要求所有 Deployment 的副本数不超过参数中给定的上限，并对带 `environment: test` 标签的命名空间启用：

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingAdmissionPolicy
metadata:
  name: replica-limit.example.com
spec:
  failurePolicy: Fail
  paramKind:
    apiVersion: v1
    kind: ConfigMap
  matchConstraints:
    resourceRules:
    - apiGroups: ["apps"]
      apiVersions: ["v1"]
      operations: ["CREATE", "UPDATE"]
      resources: ["deployments"]
  validations:
  - expression: "object.spec.replicas <= int(params.data.maxReplicas)"
    messageExpression: "'副本数 ' + string(object.spec.replicas) + ' 超过上限 ' + params.data.maxReplicas"
    reason: Invalid
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: replica-limit-test
  namespace: platform-policies
data:
  maxReplicas: "5"
---
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingAdmissionPolicyBinding
metadata:
  name: replica-limit-test.example.com
spec:
  policyName: replica-limit.example.com
  validationActions: [Deny, Audit]
  paramRef:
    name: replica-limit-test
    namespace: platform-policies
    parameterNotFoundAction: Deny
  matchResources:
    namespaceSelector:
      matchLabels:
        environment: test
```

违反时客户端收到的错误形如 `ValidatingAdmissionPolicy 'replica-limit.example.com' with binding 'replica-limit-test.example.com' denied request: 副本数 8 超过上限 5`。

### 关键字段

- **`validations[].expression`**：返回布尔值的 CEL 表达式，`false` 即为违反；可配 `message`（静态）或 `messageExpression`（动态）以及 `reason`（`Invalid`、`Forbidden` 等）
- **`validationActions`**（绑定上）：`Deny` 拒绝请求、`Warn` 返回警告、`Audit` 写入审计事件；三者可组合，便于先观察再强制
- **`matchConstraints`**：按 API 组、版本、资源、操作、命名空间/对象选择器圈定范围；绑定上的 `matchResources` 可进一步收窄
- **`matchConditions`**：额外的 CEL 前置条件，不满足则整条策略跳过，适合排除特定用户或 ServiceAccount
- **`failurePolicy`**：表达式求值出错（而非返回 `false`）时的处理：`Fail` 拒绝，`Ignore` 放行
- **`auditAnnotations`**：按表达式结果向审计事件写入注解，键会自动加上策略名前缀
- **`variables`**：定义可复用的命名子表达式，在 `validations`、`messageExpression`、`auditAnnotations` 中以 `variables.<name>` 引用，惰性求值

### 可用变量

CEL 表达式可访问以下变量：

{{< table title="准入策略 CEL 表达式中的变量" >}}

| 变量              | 含义                                                       |
|-------------------|------------------------------------------------------------|
| `object`          | 请求中的对象，DELETE 时为 `null`                              |
| `oldObject`       | 已存在的对象，CREATE 时为 `null`                              |
| `request`         | 请求属性：`request.operation`、`request.userInfo`、`request.namespace` 等 |
| `params`          | 绑定引用的参数对象，策略未声明 `paramKind` 时不可用             |
| `namespaceObject` | 对象所在命名空间的 Namespace 对象（含标签/注解），集群级资源为 `null`；`matchConditions` 中不可用 |
| `authorizer`      | 用于对请求用户做 SubjectAccessReview 式检查，如 `authorizer.group('').resource('pods').check('delete').allowed()` |
| `variables`       | 策略中定义的组合变量                                         |

{{< /table >}}

API Server 在策略创建时做**类型检查**：若 `matchConstraints` 指向的资源类型已知，表达式中的字段访问错误会在策略的 `status.typeChecking` 中给出警告（不会阻止创建，因为同一策略可能匹配多种类型）。每个表达式还有运行成本预算，复杂度过高的表达式会在创建时被拒绝，以保护 API Server 不被恶意策略拖垮。

### 常见校验模式

```yaml
validations:
# 镜像必须来自内部仓库（遍历所有容器）
- expression: >
    object.spec.template.spec.containers.all(c, c.image.startsWith('registry.example.com/'))
  message: 镜像必须来自 registry.example.com
# 禁止修改不可变标签
- expression: "oldObject == null || object.metadata.labels['team'] == oldObject.metadata.labels['team']"
  message: team 标签创建后不可修改
# 按命名空间标签决定是否允许 hostNetwork
- expression: >
    !has(object.spec.hostNetwork) || !object.spec.hostNetwork ||
    (namespaceObject.metadata.labels['allow-host-network'] == 'true')
  message: 该命名空间不允许 hostNetwork
```

## MutatingAdmissionPolicy

`MutatingAdmissionPolicy` 的结构与校验策略几乎一致，区别在于用 `mutations` 列表声明如何修改对象。每条变更有两种 `patchType`：

- **`ApplyConfiguration`**：表达式返回一个用 `Object{...}` 构造的局部对象，API Server 以 Server-Side Apply 的合并语义把它合入请求对象。这是推荐方式：只需写出要设置的字段，列表按 `listType=map` 的键合并，不会误删未提及的内容
- **`JSONPatch`**：表达式返回 `JSONPatch{op, path, value}` 列表，精确控制每一步修改，适合 `ApplyConfiguration` 无法表达的操作（如删除字段、操作原子列表）

### 示例：自动注入 Sidecar

以下策略为所有新建 Pod 注入一个原生 Sidecar 容器（若尚未存在），并用 `reinvocationPolicy: IfNeeded` 保证在其他变更准入修改了 Pod 之后仍能再次评估：

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingAdmissionPolicy
metadata:
  name: sidecar-policy.example.com
spec:
  paramKind:
    kind: Sidecar
    apiVersion: mutations.example.com/v1
  matchConstraints:
    resourceRules:
    - apiGroups: [""]
      apiVersions: ["v1"]
      operations: ["CREATE"]
      resources: ["pods"]
  matchConditions:
  - name: does-not-already-have-sidecar
    expression: "!object.spec.initContainers.exists(ic, ic.name == \"mesh-proxy\")"
  failurePolicy: Fail
  reinvocationPolicy: IfNeeded
  mutations:
  - patchType: ApplyConfiguration
    applyConfiguration:
      expression: >
        Object{
          spec: Object.spec{
            initContainers: [
              Object.spec.initContainers{
                name: "mesh-proxy",
                image: params.spec.image,
                args: ["proxy", "sidecar"],
                restartPolicy: "Always"
              }
            ]
          }
        }
---
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingAdmissionPolicyBinding
metadata:
  name: sidecar-policy-binding.example.com
spec:
  policyName: sidecar-policy.example.com
  paramRef:
    name: mesh-proxy-default
    namespace: platform-policies
    parameterNotFoundAction: Deny
  matchResources:
    namespaceSelector:
      matchLabels:
        mesh: enabled
```

### 示例：用 JSONPatch 补默认安全上下文

```yaml
mutations:
- patchType: JSONPatch
  jsonPatch:
    expression: >
      [
        JSONPatch{op: "add", path: "/spec/securityContext", value: Object.spec.securityContext{
          runAsNonRoot: true,
          seccompProfile: Object.spec.securityContext.seccompProfile{type: "RuntimeDefault"}
        }}
      ]
```

JSONPatch 表达式中可用 `jsonpatch.escapeKey()` 转义路径里的 `/` 与 `~`。

### 执行顺序与重调用

变更准入先于校验准入执行，顺序为：内建变更插件 → `MutatingAdmissionPolicy` → Mutating Webhook → 内建校验插件 → `ValidatingAdmissionPolicy` → Validating Webhook。多条变更策略之间按策略名称排序依次执行。由于一条变更可能让另一条策略的匹配条件发生变化，`reinvocationPolicy: IfNeeded` 会在任何变更准入修改了对象后再次评估该策略；默认的 `Never` 只评估一次。无论如何，最终对象都会再经过一次完整的校验准入。

## 与 Webhook 的取舍

{{< table title="准入策略与准入 Webhook 对比" >}}

| 维度             | CEL 准入策略                                             | 准入 Webhook                                           |
|------------------|----------------------------------------------------------|--------------------------------------------------------|
| 部署             | 只需创建 API 对象                                         | 需部署 HTTPS 服务、证书、Service、高可用                |
| 性能             | 进程内求值，微秒级                                        | 网络往返，毫秒级，受超时影响                             |
| 可用性风险       | 无额外故障点                                              | 服务不可用时按 `failurePolicy` 拒绝或放行全部匹配请求     |
| 表达能力         | CEL：字段比较、列表遍历、字符串处理、`authorizer` 检查      | 任意语言，可调用外部系统（镜像签名验证、CMDB、漏洞库）    |
| 外部数据         | 仅限参数资源与命名空间对象                                 | 任意                                                   |
| 类型安全         | 创建时类型检查                                            | 无                                                     |
| 可观测性         | `status.typeChecking`、审计注解、内建指标                  | 自行实现                                               |

{{< /table >}}

官方建议：新的校验或变更需求**先评估能否用准入策略实现**，只有在需要外部数据、复杂计算或 CEL 无法表达时才引入 Webhook。即便保留 Webhook，也可以为其配置 `matchConditions`（v1.30 GA）用 CEL 预过滤请求，减少调用次数。

## 迁移现有 Webhook

把 Webhook 迁移到准入策略的典型步骤：

1. 盘点 Webhook 的每条规则，区分"纯字段逻辑"与"依赖外部数据"
2. 为纯字段逻辑编写策略，绑定先只用 `validationActions: [Warn, Audit]`（变更策略可先在测试命名空间绑定）与现有 Webhook 并行运行
3. 对比审计日志与 Webhook 的裁决，修正表达式差异
4. 切换为 `Deny` 并缩小 Webhook 的匹配范围，直至移除

Kyverno、Gatekeeper 等策略引擎也在逐步把自身规则编译为 `ValidatingAdmissionPolicy`，让"策略即代码"的编写体验与进程内执行的性能兼得。

## 最佳实践

- 策略名使用域名后缀（如 `.example.com`）避免冲突；以 `.static.k8s.io` 结尾的名称保留给基于清单的静态准入配置（v1.37 Beta）
- 校验策略默认 `failurePolicy: Fail`，但对非关键规则可用 `Ignore` 防止表达式缺陷阻塞集群
- 用 `variables` 抽取重复的子表达式，提升可读性并降低运行成本
- 绑定上始终设置 `matchResources`，避免无意中作用于 `kube-system`
- 变更策略尽量使用 `ApplyConfiguration`，仅在必须删除字段或操作原子列表时用 `JSONPatch`
- 在 CI 中用 `kubectl apply --dry-run=server` 验证策略对典型清单的效果

## 总结

`ValidatingAdmissionPolicy` 与 `MutatingAdmissionPolicy` 把准入控制从"外部 HTTP 服务"变成"API Server 内的声明式表达式"，消除了 Webhook 的部署与可用性成本，并通过类型检查、成本预算与审计注解提供了更好的安全性与可观测性。对绝大多数字段级校验与默认值注入需求，它们已经是首选方案；Webhook 则退守到需要外部数据与复杂计算的少数场景。

## 参考文献

- [Validating Admission Policy - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/validating-admission-policy/)
- [Mutating Admission Policy - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/mutating-admission-policy/)
- [Common Expression Language in Kubernetes - kubernetes.io](https://kubernetes.io/docs/reference/using-api/cel/)
- [KEP-3488: CEL for Admission Control - github.com](https://github.com/kubernetes/enhancements/tree/master/keps/sig-api-machinery/3488-cel-admission-control)
- [KEP-3962: Mutating Admission Policies - github.com](https://github.com/kubernetes/enhancements/tree/master/keps/sig-api-machinery/3962-mutating-admission-policies)
