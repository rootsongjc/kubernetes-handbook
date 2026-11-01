---
weight: 2
title: "Pod 安全准入：用 Pod 安全标准取代 PodSecurityPolicy"
linktitle: Pod 安全准入
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: pod-security-admission
description: "介绍 Kubernetes 内建的 Pod 安全准入（Pod Security Admission，v1.25 GA）与 Pod 安全标准（Privileged/Baseline/Restricted）：命名空间标签的 enforce/audit/warn 三种模式、版本固定、集群级默认值与豁免配置、与用户命名空间的联动、从 PodSecurityPolicy 迁移的步骤，以及与 ValidatingAdmissionPolicy、Kyverno 等策略引擎的分工。"
---

> PodSecurityPolicy 死于"太灵活"，Pod 安全准入活于"够简单"：三个等级、三种模式、一组命名空间标签，覆盖了 90% 的 Pod 安全基线需求。

PodSecurityPolicy（PSP）曾是 Kubernetes 约束 Pod 特权的唯一内建手段，但它把策略定义、RBAC 绑定与变更行为耦合在一起，难以理解、极易误配，最终在 v1.21 弃用、v1.25 移除。取而代之的是两件东西：**Pod 安全标准**（Pod Security Standards，PSS）定义了三个由宽到严的安全等级，**Pod 安全准入**（Pod Security Admission，PSA）是把这些等级按命名空间强制执行的内建准入控制器，v1.25 起 GA 并默认启用。

## Pod 安全标准

Pod 安全标准把 Pod 规范中与安全相关的字段归纳为三个累进的等级：

{{< table title="Pod 安全标准的三个等级" >}}

| 等级         | 目标                                     | 典型约束                                                                 |
|--------------|------------------------------------------|--------------------------------------------------------------------------|
| `privileged` | 不做任何限制                              | 面向系统组件、CNI/CSI 驱动、节点代理等需要宿主机权限的工作负载               |
| `baseline`   | 阻止已知的特权提升，兼容绝大多数应用        | 禁止 `privileged`、`hostNetwork`/`hostPID`/`hostIPC`、`hostPath`、`hostPort`、Windows HostProcess；只允许添加少数默认 capability；限制 AppArmor/SELinux/seccomp/sysctl 取值；v1.34 起禁止探针与钩子使用 `host` 字段 |
| `restricted` | 当前的 Pod 加固最佳实践，牺牲部分兼容性    | 在 Baseline 之上要求 `runAsNonRoot: true`、`allowPrivilegeEscalation: false`、丢弃 `ALL` capability（仅可加回 `NET_BIND_SERVICE`）、显式设置 `RuntimeDefault`/`Localhost` seccomp，卷类型限定为 configMap/secret/emptyDir/projected/downwardAPI/csi/persistentVolumeClaim/ephemeral |

{{< /table >}}

三个等级是**累进**的：Restricted 包含 Baseline 的全部要求。标准本身是一份与实现无关的规范，Kyverno、Gatekeeper 等策略引擎也可以实现它；PSA 则是 Kubernetes 的内建实现。

## Pod 安全准入

PSA 以 **命名空间** 为作用单元，通过标签声明该命名空间内的 Pod 应满足哪个等级，以及违反时采取何种动作：

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: payments
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: v1.37
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/audit-version: latest
    pod-security.kubernetes.io/warn: restricted
    pod-security.kubernetes.io/warn-version: latest
```

### 三种模式

{{< table title="Pod 安全准入的三种模式" >}}

| 模式      | 标签键                                 | 违反时的行为                                             | 用途                               |
|-----------|----------------------------------------|----------------------------------------------------------|------------------------------------|
| `enforce` | `pod-security.kubernetes.io/enforce`   | 拒绝创建 Pod                                             | 真正的强制执行                      |
| `audit`   | `pod-security.kubernetes.io/audit`     | 允许创建，但在审计日志中添加 `pod-security.kubernetes.io/audit-violations` 注解 | 评估影响、合规留痕    |
| `warn`    | `pod-security.kubernetes.io/warn`      | 允许创建，但向客户端返回 Warning 头（kubectl 会打印）        | 提前提醒用户                        |

{{< /table >}}

三种模式可以设置不同等级。一种常见的渐进策略是 `enforce: baseline` 兜底，同时 `warn: restricted`、`audit: restricted` 观察有多少工作负载距离 Restricted 还有差距。

### 版本固定

每个模式对应一个 `*-version` 标签，取值为 `latest`（默认）或具体的小版本（如 `v1.37`）。Pod 安全标准会随版本演进（例如 v1.34 把"禁止探针 `host` 字段"加入 Baseline），把版本固定到某个值可以避免控制面升级后原本合规的 Pod 突然被拒绝；审核过新版本的差异后再把版本号调高。

### 作用范围

PSA 检查的是**Pod** 对象的创建与更新，以及 Deployment、StatefulSet、Job 等**内建工作负载控制器**的 Pod 模板（对后者只有 `warn` 与 `audit` 生效，不会拒绝控制器对象本身，以免破坏 GitOps 流程；真正拒绝发生在控制器创建 Pod 时）。修改命名空间标签把等级调严时，PSA 会对该命名空间现有的 Pod 做一次评估，并以 Warning 的形式列出哪些 Pod 将不再合规，但不会驱逐它们。

## 集群级默认值与豁免

命名空间没有打标签时，PSA 使用集群级默认配置，默认为全部 `privileged`，即不做任何限制。可以通过 kube-apiserver 的 `--admission-control-config-file` 修改默认值并配置豁免：

```yaml
apiVersion: apiserver.config.k8s.io/v1
kind: AdmissionConfiguration
plugins:
- name: PodSecurity
  configuration:
    apiVersion: pod-security.admission.config.k8s.io/v1
    kind: PodSecurityConfiguration
    defaults:
      enforce: baseline            # 未打标签的命名空间默认执行 Baseline
      enforce-version: latest
      audit: restricted
      audit-version: latest
      warn: restricted
      warn-version: latest
    exemptions:
      usernames: []                # 豁免的认证用户名，例如某些平台控制器的 ServiceAccount
      runtimeClasses: [kata]       # 使用指定 RuntimeClass 的 Pod（如 Kata 等强隔离运行时）不受限制
      namespaces: [kube-system]    # 整个命名空间豁免
```

豁免是**完全跳过检查**而不是降级，应尽量缩小范围；`kube-system` 一般需要豁免，因为 CNI、CSI、kube-proxy 等 DaemonSet 天然需要宿主机权限。托管 Kubernetes 服务通常已经为系统命名空间配置好豁免。

## 与用户命名空间的联动

当 Pod 设置了 `hostUsers: false` 启用用户命名空间（v1.36 GA）时，容器内的 root 不再对应宿主机特权用户，PSA 会**有条件地放宽**检查：在 Baseline 与 Restricted 下不再要求 `runAsNonRoot` 与非零 `runAsUser`，Baseline 下额外放宽 `procMount`。这为必须以 root 启动的遗留镜像进入 Restricted 命名空间提供了一条无需改造镜像的路径，详见 [Pod 用户命名空间](../../pod/user-namespaces)。

## 从 PodSecurityPolicy 迁移

仍停留在 v1.24 及更早版本并使用 PSP 的集群，官方建议按以下步骤迁移：

1. **盘点现有 PSP**：把每个 PSP 映射到最接近的 Pod 安全标准等级（大多数 `restricted` 风格的 PSP 对应 `baseline` 或 `restricted`，允许 `privileged`/`hostPath` 的对应 `privileged`）
2. **消除变更依赖**：PSP 会静默为 Pod 补默认值（如 seccomp、`runAsNonRoot`），PSA 只校验不变更；需要把这些默认值写进工作负载清单，或用 `MutatingAdmissionPolicy`/策略引擎补齐
3. **先 warn/audit 后 enforce**：为每个命名空间打上 `warn` 与 `audit` 标签，观察审计日志与警告，修复不合规工作负载
4. **启用 enforce**：按命名空间逐步切换到 `enforce`
5. **禁用 PSP 准入插件**：确认无依赖后从 `--enable-admission-plugins` 移除 `PodSecurityPolicy`，再升级到 v1.25+

`kubectl label --dry-run=server --overwrite ns <name> pod-security.kubernetes.io/enforce=restricted` 可以在不实际修改标签的情况下，列出该命名空间中哪些现有 Pod 会违反目标等级。

## 与其他策略机制的分工

PSA 刻意保持简单：没有自定义规则、没有按工作负载粒度的例外、没有变更能力。这些需求交给其他机制：

{{< table title="Pod 安全准入与其他策略机制的分工" >}}

| 需求                                       | 推荐机制                                                  |
|--------------------------------------------|-----------------------------------------------------------|
| 按命名空间强制 Pod 安全基线                 | Pod 安全准入                                              |
| 限制镜像仓库、要求特定标签、校验资源配额等自定义校验 | `ValidatingAdmissionPolicy`（CEL，v1.30 GA）             |
| 自动注入 seccomp、`runAsNonRoot` 等默认值    | `MutatingAdmissionPolicy`（CEL，v1.36 GA）                |
| 复杂的跨资源策略、策略即代码、合规报告        | Kyverno、OPA Gatekeeper 等策略引擎                         |
| 单个工作负载需要突破命名空间等级              | 迁移到专用命名空间，或用 RuntimeClass 豁免配合强隔离运行时   |

{{< /table >}}

Kyverno 与 Gatekeeper 都内置了 Pod 安全标准的策略集，可以在 PSA 之上提供按工作负载的细粒度例外与审计报告；但对大多数集群，"PSA 做基线 + 准入策略做自定义规则"已经足够，且不引入额外的 Webhook 可用性风险。

## 最佳实践

- 新集群把 `defaults.enforce` 设为 `baseline`，所有业务命名空间显式打标签，`kube-system` 等系统命名空间走豁免
- 业务命名空间以 `restricted` 为目标，`enforce-version` 固定到当前小版本，升级后再审核放开
- 把命名空间标签纳入 GitOps 或命名空间供给流程，避免手工漏打
- 为 Restricted 工作负载准备一份标准 `securityContext` 片段（`runAsNonRoot`、`allowPrivilegeEscalation: false`、`capabilities.drop: [ALL]`、`seccompProfile.type: RuntimeDefault`），用 Helm 库 Chart 或 `MutatingAdmissionPolicy` 统一注入
- 监控审计日志中的 `pod-security.kubernetes.io/audit-violations` 注解以及 `pod_security_evaluations_total` 指标

## 总结

Pod 安全准入用三个等级、三种模式与一组命名空间标签，以最低的认知成本提供了 Pod 安全基线的内建执行；它放弃了 PSP 的灵活性，换来的是可预测与易运维。把 PSA 作为基线、`ValidatingAdmissionPolicy`/`MutatingAdmissionPolicy` 处理自定义规则、用户命名空间解决遗留 root 镜像，是当前 Kubernetes 工作负载安全的推荐组合。

## 参考文献

- [Pod Security Admission - kubernetes.io](https://kubernetes.io/docs/concepts/security/pod-security-admission/)
- [Pod Security Standards - kubernetes.io](https://kubernetes.io/docs/concepts/security/pod-security-standards/)
- [Enforce Pod Security Standards with Namespace Labels - kubernetes.io](https://kubernetes.io/docs/tasks/configure-pod-container/enforce-standards-namespace-labels/)
- [Enforce Pod Security Standards by Configuring the Built-in Admission Controller - kubernetes.io](https://kubernetes.io/docs/tasks/configure-pod-container/enforce-standards-admission-controller/)
- [Migrate from PodSecurityPolicy to the Built-In PodSecurity Admission Controller - kubernetes.io](https://kubernetes.io/docs/tasks/configure-pod-container/migrate-from-psp/)
