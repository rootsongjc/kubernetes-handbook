---
weight: 12
title: "特性门控与 API 弃用策略：读懂 Alpha/Beta/GA 并安全地升级"
linktitle: 特性门控与 API 弃用
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: feature-gates-and-api-deprecation
description: "解释 Kubernetes 特性门控的三阶段生命周期与默认开关规则（含 v1.24 起新 Beta API 默认关闭的转变）、各组件启用门控的方式、API 版本的弃用时间表与十条弃用规则、兼容性版本（--emulated-version）如何把升级与新特性解耦，以及用 kubectl 警告、审计注解、apiserver_requested_deprecated_apis 指标与 kubent/pluto 等工具在升级前定位废弃 API 用法。"
---

> Kubernetes 每四个月一个版本却极少破坏兼容，靠的不是克制，而是一套写在纸面上、由测试强制执行的弃用规则。

每个 Kubernetes 版本都会引入、推进或移除几十项特性，用户面对的问题是：哪些可以在生产启用？哪些 API 下个版本会消失？升级前要改什么？特性门控（Feature Gate）与 API 弃用策略是回答这些问题的制度基础。理解它们，升级就从一场赌博变成可预期的例行工作。

## 特性门控

特性门控是一组键值对开关，控制各组件中尚未稳定或可选的功能。所有组件共用一张门控表，通过 `--feature-gates=Name=true,Other=false` 参数设置，大多数组件也支持在配置文件中声明（如 KubeletConfiguration 的 `featureGates` 字段）。

### 三个阶段

{{< table title="特性门控的生命周期阶段" >}}

| 阶段 | 默认状态 | 稳定性承诺 | 适用场景 |
|------|----------|-----------|----------|
| Alpha | 关闭 | 可能有 bug、随时可移除、API 可能不兼容变更、不保证升级时数据可迁移 | 仅测试集群 |
| Beta | 通常开启（API 类 Beta 自 v1.24 起默认关闭） | 有完整测试，细节可能变化但会提供迁移路径；默认开启意味着已被广泛使用 | 可在生产评估，建议跟踪变更 |
| GA（Stable） | 开启且锁定 | 长期支持，不可关闭 | 生产 |

{{< /table >}}

一个特性从 Alpha 到 GA 通常经历 3 – 6 个版本。门控表中以 `Since`/`Until` 标注每个阶段的起止版本，GA 后门控在 2 – 3 个版本后从表中移除（Rule #9 要求 Beta→GA 的门控至少保留 6 个月或 2 个版本）；表中出现 `Deprecated` 阶段的门控，说明对应特性正在被淘汰，如 `KMSv1`。

### Beta 默认开启的例外

v1.24 之前，Beta 特性与 Beta API 版本都默认开启，使得大量生产集群依赖尚未稳定的 API，Beta API 的移除（如 v1.22、v1.25 的大批清理）造成了显著的升级阵痛。自 v1.24 起，**新引入的 Beta API 版本默认关闭**，需要通过 `--runtime-config=<group>/<version>=true` 显式启用；Beta 阶段的功能门控（非 API）仍默认开启。这意味着 GA 之前的新 API（如早期的 Gateway API 以外的核心 Beta API、`resource.k8s.io/v1beta1` 等）在普通集群中要手动打开。

### 启用方式

```yaml
# kubeadm ClusterConfiguration：控制面组件
apiServer:
  extraArgs:
  - name: feature-gates
    value: "GenericWorkload=true"
  - name: runtime-config
    value: "scheduling.k8s.io/v1alpha1=true"
controllerManager:
  extraArgs:
  - name: feature-gates
    value: "GenericWorkload=true"
scheduler:
  extraArgs:
  - name: feature-gates
    value: "GenericWorkload=true"
---
# KubeletConfiguration：节点组件
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
featureGates:
  PodLevelResourceManagers: true
```

跨组件的特性必须在所有相关组件上一致启用，否则会出现"API 接受了字段但调度器忽略它"之类的半开状态。门控表中的说明通常会注明需要哪些组件。托管集群通常不允许开启 Alpha 门控，部分允许 Beta。

### 兼容性版本

v1.31 引入、持续完善的兼容性版本（Compatibility Version）机制让升级二进制与启用新行为分离：`--emulated-version=kube=1.36` 使 v1.37 的 kube-apiserver 模拟 v1.36 的 API 与特性集合（可模拟当前版本向前的 3 个小版本，v1.37 支持 `1.34..1.37`）。管理员可以先升级二进制验证稳定性，再逐步提升模拟版本启用新特性，出问题时降低模拟版本即可回退，而无需回滚二进制。`--emulation-forward-compatible` 则允许在模拟旧版本的同时自动启用新版本中更稳定的 API 版本。该机制目前主要覆盖 kube-apiserver，是大型集群运营者降低升级风险的重要工具。

## API 版本与弃用策略

API 版本（`v1alpha1`、`v1beta2`、`v1`）标识 API 的稳定性等级，弃用策略规定了每个等级的 API 在宣布弃用后必须继续服务的时间：

{{< table title="API 版本的弃用与移除时间表" >}}

| 等级 | 弃用后继续服务 | 移除条件 |
|------|---------------|----------|
| GA（`v1`） | 在同一大版本内不得移除；可标记弃用 | 目前没有移除 GA API 的计划 |
| Beta（`v1betaN`） | 引入后 9 个月或 3 个小版本内必须弃用；弃用后再服务 9 个月或 3 个小版本 | 到期后停止服务 |
| Alpha（`v1alphaN`） | 无承诺 | 任意版本可直接移除 |

{{< /table >}}

除时间表之外，弃用策略还包含一系列保证兼容的规则，其中最重要的有：

- **Rule #1**：API 元素只能通过提升 API 版本来移除，同一版本内不得删除字段或显著改变行为
- **Rule #2**：对象必须能在同一发布版本的所有 API 版本之间无损往返转换
- **Rule #3**：不得用更不稳定的版本替代稳定版本（GA 不能被 Beta 取代）
- **Rule #4b**：存储版本与首选版本只有在"同时支持新旧版本"的发布之后才能推进，保证 N→N+1 升级与回滚安全
- **Rule #5/#6**：kubectl 等用户侧 CLI 的 GA 元素弃用后至少保留 12 个月或 2 个版本，并打印警告
- **Rule #7/#8**：非 API 的行为弃用后至少保留 1 年，且不能用更不稳定的实现替代
- **Rule #9/#10**：特性门控在特性升级后保留期限，弃用的门控使用时发出警告

### 近年的 API 移除

遵循上述策略，近年的 API 移除集中在少数版本：v1.25 移除了 PodSecurityPolicy 与 `batch/v1beta1` CronJob 等，v1.26 移除 `autoscaling/v2beta2` HPA 与 `flowcontrol/v1beta1`，v1.27 移除 `storage.k8s.io/v1beta1` CSIStorageCapacity，v1.29 移除 `flowcontrol/v1beta2`，v1.32 移除 `flowcontrol/v1beta3`。**v1.33 至 v1.37 没有移除任何已服务的 API 版本**——这反映出核心 API 已趋于稳定，新功能多以 GA 字段或新 API 组（`resource.k8s.io`、`coordination.k8s.io` 等）的形式加入。

与之相对，*行为*层面的弃用更常见：cgroup v1 自 v1.31 进入维护模式并于 v1.35 正式弃用；kube-proxy 的 IPVS 模式 v1.35 弃用（计划 v1.40 默认关闭、v1.43 移除）；容器运行时方面 v1.36 起不再支持 containerd 1.x；Windows 的 `hostNetwork` v1.33 弃用；`kubectl` 的部分旧标志也在持续清理。它们同样遵循"至少保留一年"的规则并在发布说明的 Deprecation 节中列出。

## 升级前定位废弃用法

### 服务端信号

API Server 为每个请求提供了三种废弃信号：

- **HTTP Warning 头**：请求弃用 API 时返回 `Warning: 299 - "... is deprecated in v1.xx+, unavailable in v1.yy+; use ..."`，kubectl 1.19+ 会在终端打印；客户端库可自定义 `WarningHandler`
- **审计注解**：对弃用 API 的请求在 [审计日志](../../security/audit-logging) 中带有 `k8s.io/deprecated: "true"`，若已知移除版本还会有 `k8s.io/removed-release: "1.yy"`，可据此精确找出调用方（用户、UserAgent、来源 IP）
- **指标**：`apiserver_requested_deprecated_apis{group,version,resource,removed_release}` 按资源记录弃用 API 是否被请求过，结合 `apiserver_request_total` 可知调用频率

```bash
# 查看哪些弃用 API 仍在被使用
kubectl get --raw /metrics | grep apiserver_requested_deprecated_apis

# 统计审计日志中的调用方
jq -r 'select(.annotations["k8s.io/deprecated"]=="true") | [.user.username, .userAgent, .requestURI] | @tsv' audit.log | sort | uniq -c | sort -rn
```

### 清单扫描工具

[kubent](https://github.com/doitintl/kube-no-trouble)（kube-no-trouble）与 [Pluto](https://github.com/FairwindsOps/pluto) 扫描集群内对象、Helm Release 与本地清单文件，报告在目标版本中将被移除的 API；[kubeconform](https://github.com/yannh/kubeconform) 可在 CI 中按指定 Kubernetes 版本的 OpenAPI 模式校验清单。对 CRD，还应检查其 `status.storedVersions` 与 Operator 的兼容性声明。

### 升级演练

稳妥的流程是：在与生产同版本的测试集群上用 `--runtime-config=<group>/<version>=false` 关闭计划移除的 API，运行完整的部署与控制器，确认没有组件报错；再把 API Server 的 `--emulated-version` 调到目标版本验证新默认行为；最后按控制面→节点的顺序升级，并遵守 [版本偏差策略](../release-evolution)（kubelet 最多落后 API Server 三个小版本）。

## 总结

特性门控用 Alpha/Beta/GA 三阶段为新功能划定了明确的成熟度，弃用策略则以可执行的规则承诺了 API 与行为的最短存活期，两者共同构成 Kubernetes 快速演进与长期稳定并存的基础。运维者应把门控表与发布说明的 Deprecation 节作为每次升级的必读材料，用 Warning 头、审计注解与 `apiserver_requested_deprecated_apis` 指标找出残余的废弃调用，并借助兼容性版本把"升级二进制"与"启用新行为"拆成两个可独立回退的步骤。

## 参考文献

- [Feature Gates - kubernetes.io](https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates/)
- [Kubernetes Deprecation Policy - kubernetes.io](https://kubernetes.io/docs/reference/using-api/deprecation-policy/)
- [Deprecated API Migration Guide - kubernetes.io](https://kubernetes.io/docs/reference/using-api/deprecation-guide/)
- [Version Skew Policy - kubernetes.io](https://kubernetes.io/releases/version-skew-policy/)
- [kube-apiserver reference (--emulated-version) - kubernetes.io](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-apiserver/)
- [kube-no-trouble - github.com](https://github.com/doitintl/kube-no-trouble)
- [Pluto - github.com](https://github.com/FairwindsOps/pluto)
