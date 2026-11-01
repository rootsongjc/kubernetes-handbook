---
weight: 13
title: "策略引擎：Kyverno、OPA Gatekeeper 与原生准入策略的选型"
linktitle: 策略引擎
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: policy-engines
description: "对比 Kubernetes 上的三种策略执行路径：原生的 ValidatingAdmissionPolicy/MutatingAdmissionPolicy（CEL，无需 Webhook）、Kyverno（YAML/CEL 策略，含验证、变更、生成、清理与镜像校验）与 OPA Gatekeeper（Rego 约束模板，CNCF 毕业）。讲解策略即代码的工作流（审计模式、例外、报告、CI 预检）、Policy Reports API 以及按组织场景的选型建议。"
---

> Pod 安全标准解决了"最低安全线"，但"镜像必须来自内部仓库、每个 Deployment 必须有 owner 标签、生产命名空间禁止 NodePort"这类组织规则，才是策略引擎的主战场。

Kubernetes 把"允许什么对象进入集群"的决定权交给准入控制。内置的 Pod 安全准入只覆盖 Pod 的安全上下文，而组织特有的合规、成本与运维规则需要更通用的策略引擎。本文比较三条路径——Kubernetes 原生的 CEL 准入策略、Kyverno 与 OPA Gatekeeper——并给出策略即代码（Policy as Code）的落地工作流。

## 三条路径

{{< table title="Kubernetes 策略执行方案对比" >}}

| 维度 | ValidatingAdmissionPolicy / MutatingAdmissionPolicy | Kyverno | OPA Gatekeeper |
|------|------|------|------|
| 实现 | API Server 内置，CEL 表达式（VAP GA v1.30、MAP GA v1.36） | 独立控制器 + Webhook；策略为 YAML，v1.14+ 新一代 `policies.kyverno.io/v1` 全面采用 CEL | 独立控制器 + Webhook；策略为 Rego，v3.18+ 支持 CEL（K8sNativeValidation） |
| 验证 | ✓ | ✓ | ✓ |
| 变更 | ✓（MAP，ApplyConfiguration/JSON Patch） | ✓ | ✓（有限） |
| 生成资源（如为新命名空间创建 NetworkPolicy） | ✗ | ✓（GeneratingPolicy） | ✗ |
| 清理资源（按条件定期删除） | ✗ | ✓（DeletingPolicy） | ✗ |
| 镜像签名/证明校验 | ✗（无法访问仓库） | ✓（ImageValidatingPolicy，Cosign/Notary） | 需 Ratify 等外部数据提供者 |
| 引用集群内其他对象 | `paramKind` 引用单个对象；`variables` 中可用 `authorizer` | 完整 `apiCall`/`resource` 上下文查询 | `sync` 配置缓存资源供 Rego 查询 |
| 存量审计 | 仅对请求生效；无后台扫描 | 后台扫描生成 PolicyReport | Audit 控制器定期扫描并写入 Constraint 状态 |
| 可用性影响 | 无额外组件，无网络调用 | Webhook 不可用时按 `failurePolicy` 处理 | 同左 |
| 项目状态 | Kubernetes 内置 | CNCF 毕业项目（2026-03），v1.19 | CNCF 毕业项目（OPA），Gatekeeper v3.23 |

{{< /table >}}

三者并非互斥：Kyverno 与 Gatekeeper 都能把符合条件的策略**自动编译为 VAP** 在 API Server 内执行（Kyverno 的 ValidatingPolicy 默认生成 VAP，Gatekeeper 通过 `generateVAP: true`），只在需要外部数据或复杂逻辑时回退到 Webhook，兼顾了性能与表达力。

## 原生准入策略

[ValidatingAdmissionPolicy 与 MutatingAdmissionPolicy](../admission-policy) 是零依赖的首选：策略在 API Server 进程内评估，无网络往返、无单点故障、无需为 Webhook 维护证书。适合的规则包括字段约束（禁止 `latest` 标签、要求 requests、限制 `hostPath`）、标签/注解要求、按命名空间参数化的配额差异、以及简单的默认值注入。它们的局限在于无法访问仓库或外部 API，不做后台审计，也不能生成或清理对象。

对大多数组织，建议把能用 CEL 表达的规则都放在原生策略中，再用一个策略引擎补足其余需求。

## Kyverno

[Kyverno](https://kyverno.io/) 的设计理念是"策略就是 Kubernetes 资源"：不引入新语言，策略以 YAML 编写，匹配规则与 Kubernetes 的选择器语义一致。v1.14 起引入的新一代策略类型按职责拆分，并与原生 VAP/MAP 的结构对齐：

- **ValidatingPolicy**：CEL 校验，默认编译为 VAP 由 API Server 执行，需要 Kyverno 特有能力（上下文查询、例外、报告）时由 Webhook 执行
- **MutatingPolicy**：CEL 变更，支持 ApplyConfiguration 与 JSON Patch，可变更存量资源
- **ImageValidatingPolicy**：镜像签名与证明校验、摘要改写，见 [供应链安全](../../security/supply-chain-security)
- **GeneratingPolicy**：在触发对象创建时生成其他资源，如为每个新命名空间生成默认 NetworkPolicy、ResourceQuota 与 RoleBinding，并可在源对象变化时同步
- **DeletingPolicy**：按 Cron 调度与条件删除资源，如清理超过 7 天的已完成 Job、无 owner 标签的测试命名空间

传统的 `ClusterPolicy`/`Policy`（`kyverno.io/v1`，JMESPath 语法）继续支持，大量社区策略库仍以其编写。下面的 GeneratingPolicy 为每个带 `tenant` 标签的新命名空间生成默认拒绝的 NetworkPolicy：

```yaml
apiVersion: policies.kyverno.io/v1
kind: GeneratingPolicy
metadata:
  name: default-deny-per-namespace
spec:
  matchConstraints:
    resourceRules:
    - apiGroups: [""]
      apiVersions: ["v1"]
      operations: ["CREATE"]
      resources: ["namespaces"]
  matchConditions:
  - name: has-tenant-label
    expression: "has(object.metadata.labels) && 'tenant' in object.metadata.labels"
  variables:
  - name: netpol
    expression: >-
      [{
        "apiVersion": "networking.k8s.io/v1",
        "kind": "NetworkPolicy",
        "metadata": {"name": "default-deny", "namespace": object.metadata.name},
        "spec": {"podSelector": {}, "policyTypes": ["Ingress", "Egress"]}
      }]
  generate:
  - expression: generator.Apply(object.metadata.name, variables.netpol)
```

Kyverno 还提供 `PolicyException` 为特定工作负载豁免规则、Kyverno CLI 在 CI 中对清单做 `kyverno apply` 预检、以及基于 [Policy Reports API](https://github.com/kubernetes-sigs/wg-policy-prototypes/tree/master/policy-report) 的 `PolicyReport`/`ClusterPolicyReport` 对象汇总所有违规，可被 Policy Reporter 等 UI 消费。

## OPA Gatekeeper

[Gatekeeper](https://open-policy-agent.github.io/gatekeeper/) 把通用策略引擎 Open Policy Agent（OPA）接入 Kubernetes 准入。策略分两层：`ConstraintTemplate` 定义 Rego（或 CEL）逻辑与参数模式，`Constraint`（由模板生成的 CRD）绑定具体参数与匹配范围。这种模板化让同一逻辑可被多个团队以不同参数复用：

```yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
      validation:
        openAPIV3Schema:
          type: object
          properties:
            labels:
              type: array
              items: { type: string }
  targets:
  - target: admission.k8s.gatekeeper.sh
    code:
    - engine: K8sNativeValidation            # CEL 引擎，可生成 VAP
      source:
        generateVAP: true
        validations:
        - expression: >-
            variables.params.labels.all(l, has(object.metadata.labels) && l in object.metadata.labels)
          messageExpression: "'missing required labels: ' + variables.params.labels.join(', ')"
    - engine: Rego                           # Rego 引擎作为回退
      source:
        rego: |
          package k8srequiredlabels
          violation[{"msg": msg}] {
            provided := {l | input.review.object.metadata.labels[l]}
            required := {l | l := input.parameters.labels[_]}
            missing := required - provided
            count(missing) > 0
            msg := sprintf("missing required labels: %v", [missing])
          }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: deployments-need-owner
spec:
  enforcementAction: deny                   # deny | warn | dryrun
  match:
    kinds:
    - apiGroups: ["apps"]
      kinds: ["Deployment"]
    excludedNamespaces: ["kube-system"]
  parameters:
    labels: ["owner", "cost-center"]
```

Gatekeeper 的优势是 Rego 的表达力（适合跨对象、跨字段的复杂判断）、OPA 在 Kubernetes 之外（API 网关、CI、Terraform）的通用性，以及 [Gatekeeper Library](https://open-policy-agent.github.io/gatekeeper-library/) 中数十个现成模板。Audit 控制器周期性扫描存量对象并把违规写入 Constraint 的 `status.violations`，`mutation.gatekeeper.sh` 组的 `Assign`/`AssignMetadata`/`ModifySet` 提供声明式变更，`ExternalData` 接口允许调用 Ratify 等外部服务校验镜像签名。Rego 的学习曲线与"策略逻辑脱离 Kubernetes 原生结构"是其主要代价。

## 策略即代码的工作流

无论选择哪个引擎，策略应被当作代码管理：

1. **从审计开始**：新策略先以 `Audit`/`warn`/`dryrun` 模式部署，观察 PolicyReport 或 Constraint 状态中的违规量与来源，避免直接阻断生产发布
2. **CI 预检**：在流水线中用 `kyverno apply`、`gator test`（Gatekeeper）或 `kubectl --dry-run=server` 对清单运行策略，让违规在合并前被发现
3. **例外有迹可循**：用 `PolicyException`（Kyverno）或 Constraint 的 `match.excludedNamespaces`/标签选择器管理豁免，例外本身入库并设置到期审查
4. **分层执行**：平台级硬约束（镜像仓库、特权容器、hostPath）用 `Deny` 执行；团队级最佳实践（资源 requests、探针、标签）用 `Warn` + 报告推动改进
5. **报告与可观测**：Policy Reports API 统一了 Kyverno、Trivy Operator、Falco 等多种来源的合规结果，接入 Grafana 或 Policy Reporter 展示趋势
6. **策略测试**：Kyverno CLI 的 `test` 命令与 Gatekeeper 的 `gator verify` 支持为策略编写通过/失败用例，与应用代码一样纳入单元测试

## 选型建议

{{< table title="策略引擎选型" >}}

| 场景 | 建议 |
|------|------|
| 只需字段校验与简单默认值，追求零依赖 | 原生 VAP + MAP |
| 需要生成资源、清理资源、镜像签名校验、后台审计，团队熟悉 YAML | Kyverno |
| 已在 API 网关、CI、基础设施中使用 OPA/Rego，希望统一策略语言 | Gatekeeper |
| 多租户平台：为租户命名空间自动生成默认配置 | Kyverno GeneratingPolicy（配合 [多租户](../../security/multi-tenancy) 原语） |
| 受监管行业：需要可审计的合规报告 | Kyverno 或 Gatekeeper 的审计 + Policy Reports |

{{< /table >}}

两种引擎都不应与原生 Pod 安全准入重复：PSA 负责 Pod 安全标准三个级别的基线，策略引擎处理其之上的组织规则。同一规则也不应同时由 VAP 与 Webhook 执行，Kyverno/Gatekeeper 的 VAP 生成能力正是为了让一份策略只在一个地方运行。

## 总结

Kubernetes 的策略执行已从"必须写 Webhook"演进为三层选择：原生 CEL 准入策略以零依赖覆盖字段级规则，Kyverno 以 Kubernetes 原生的 YAML/CEL 风格提供验证、变更、生成、清理与镜像校验的完整能力，Gatekeeper 则以 Rego 与 OPA 生态胜在表达力与跨平台一致性。无论选择哪条路径，先审计后执行、CI 预检、有管理的例外与统一的报告，才是让策略真正落地而不是成为发布阻碍的关键。

## 参考文献

- [Validating Admission Policy - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/validating-admission-policy/)
- [Mutating Admission Policy - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/mutating-admission-policy/)
- [Kyverno Documentation - kyverno.io](https://kyverno.io/docs/)
- [Kyverno Policy Types - kyverno.io](https://kyverno.io/docs/policy-types/)
- [OPA Gatekeeper Documentation - open-policy-agent.github.io](https://open-policy-agent.github.io/gatekeeper/website/docs/)
- [Gatekeeper: Validating Admission Policy integration - open-policy-agent.github.io](https://open-policy-agent.github.io/gatekeeper/website/docs/validating-admission-policy/)
- [Gatekeeper Library - open-policy-agent.github.io](https://open-policy-agent.github.io/gatekeeper-library/)
- [Policy Report API - github.com](https://github.com/kubernetes-sigs/wg-policy-prototypes/tree/master/policy-report)
