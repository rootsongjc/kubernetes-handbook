---
weight: 24
title: "审计日志：记录、过滤与分析 API Server 上发生的一切"
linktitle: 审计日志
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: audit-logging
description: "讲解 Kubernetes 审计机制：请求生命周期的四个阶段、None/Metadata/Request/RequestResponse 四个级别、审计策略的匹配规则与推荐模板、日志与 Webhook 两种后端的配置及性能调优，以及将审计事件接入 Falco、SIEM 与 OpenTelemetry 的实践。"
---

> 没有审计日志的集群，安全事件只能靠猜；审计策略写得太宽，又会让你淹没在每秒数千条 kubelet 心跳里。

审计（Auditing）是 kube-apiserver 按时间顺序记录"谁、在何时、对什么资源、做了什么、结果如何"的机制。它是安全事件溯源、合规取证与异常行为检测的基础数据源，也是 [Pod 安全准入](../pod-security-admission) `audit` 模式和 [验证准入策略](../../extend/admission-policy) `Audit` 动作的输出目的地。审计默认**关闭**，需要管理员显式配置策略与后端。

## 审计事件的阶段与级别

每个请求在 API Server 内经历若干阶段，审计可以在以下四个阶段生成事件：

- `RequestReceived`：审计处理器收到请求、尚未交给后续处理链时
- `ResponseStarted`：响应头已发送、响应体未发送时，仅对 `watch` 等长连接请求产生
- `ResponseComplete`：响应体发送完毕
- `Panic`：处理过程中发生 panic

策略为匹配的请求指定记录级别，级别决定事件包含的信息量：

{{< table title="审计级别" >}}

| 级别 | 记录内容 |
|------|----------|
| `None` | 不记录 |
| `Metadata` | 请求元数据：用户、时间戳、资源、动词、来源 IP、响应码等，不含请求与响应体 |
| `Request` | 元数据 + 请求体；不含响应体；对非资源请求不适用 |
| `RequestResponse` | 元数据 + 请求体 + 响应体；对非资源请求不适用 |

{{< /table >}}

一条 `Metadata` 级别的审计事件示例如下，`auditID` 可与 API Server 日志、准入 Webhook 日志关联：

```json
{
  "kind": "Event",
  "apiVersion": "audit.k8s.io/v1",
  "level": "Metadata",
  "auditID": "8b1a3d1c-6d6f-4b5e-9c1e-7f0e2a1b3c4d",
  "stage": "ResponseComplete",
  "requestURI": "/api/v1/namespaces/prod/secrets/db-password",
  "verb": "get",
  "user": { "username": "alice", "groups": ["dev-team", "system:authenticated"] },
  "impersonatedUser": null,
  "sourceIPs": ["10.0.3.17"],
  "userAgent": "kubectl/v1.37.0 (linux/amd64)",
  "objectRef": { "resource": "secrets", "namespace": "prod", "name": "db-password", "apiVersion": "v1" },
  "responseStatus": { "code": 200 },
  "requestReceivedTimestamp": "2026-11-01T02:15:04.120000Z",
  "stageTimestamp": "2026-11-01T02:15:04.123456Z",
  "annotations": {
    "authorization.k8s.io/decision": "allow",
    "authorization.k8s.io/reason": "RBAC: allowed by ClusterRoleBinding \"dev-read\" of ClusterRole \"view\" to Group \"dev-team\""
  }
}
```

`annotations` 中的授权决策与原因（RBAC 命中的绑定）在排查"为什么这个请求被允许/拒绝"时极为有用；Pod 安全准入、VAP 等组件也会在这里追加自己的注解。

## 审计策略

审计策略是一个 `audit.k8s.io/v1` 的 `Policy` 对象，由有序的 `rules` 组成，**请求按顺序匹配第一条规则**，没有匹配时不记录。因此策略应遵循"先特殊后通用、最后兜底"的结构。下面是一份可直接用于生产的策略模板：

```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
# 省略 RequestReceived 阶段，避免每个请求产生两条事件
omitStages:
- RequestReceived
# 省略 managedFields，可显著缩小 Request/RequestResponse 级别的事件体积
omitManagedFields: true
rules:
# 1. 高频只读心跳类请求不记录
- level: None
  users: ["system:kube-proxy"]
  verbs: ["watch"]
  resources:
  - group: ""
    resources: ["endpoints", "services", "services/status"]
- level: None
  userGroups: ["system:nodes"]
  verbs: ["get"]
  resources:
  - group: ""
    resources: ["nodes", "nodes/status"]
- level: None
  users: ["system:kube-controller-manager", "system:kube-scheduler", "system:serviceaccount:kube-system:endpoint-controller"]
  verbs: ["get", "update"]
  namespaces: ["kube-system"]
  resources:
  - group: ""
    resources: ["endpoints"]
  - group: "coordination.k8s.io"
    resources: ["leases"]
- level: None
  nonResourceURLs: ["/healthz*", "/livez*", "/readyz*", "/version", "/metrics", "/openapi*"]
# 2. Secret、ConfigMap、TokenRequest 等敏感资源只记录元数据，避免把密文写入日志
- level: Metadata
  resources:
  - group: ""
    resources: ["secrets", "configmaps", "serviceaccounts/token"]
  - group: "authentication.k8s.io"
    resources: ["tokenreviews"]
# 3. RBAC、准入策略、PSA 等安全配置的变更记录完整请求与响应
- level: RequestResponse
  verbs: ["create", "update", "patch", "delete", "deletecollection"]
  resources:
  - group: "rbac.authorization.k8s.io"
  - group: "admissionregistration.k8s.io"
  - group: "policy"
  - group: "certificates.k8s.io"
  - group: "authentication.k8s.io"
  - group: "authorization.k8s.io"
  - group: "node.k8s.io"
# 4. Pod exec/attach/portforward 这类"进入容器"的操作记录请求体
- level: Request
  resources:
  - group: ""
    resources: ["pods/exec", "pods/attach", "pods/portforward", "pods/proxy", "nodes/proxy", "services/proxy"]
# 5. 其他工作负载的写操作记录请求体
- level: Request
  verbs: ["create", "update", "patch", "delete", "deletecollection"]
  resources:
  - group: ""
  - group: "apps"
  - group: "batch"
  - group: "networking.k8s.io"
  - group: "gateway.networking.k8s.io"
  - group: "storage.k8s.io"
  - group: "resource.k8s.io"
# 6. 兜底：其余所有请求记录元数据
- level: Metadata
  omitStages:
  - RequestReceived
```

规则的匹配维度包括 `users`、`userGroups`、`verbs`、`resources`（含 `group`、`resources`、`resourceNames`）、`namespaces` 与 `nonResourceURLs`。需要注意 `resources: ["pods"]` 不匹配 `pods/log` 等子资源，子资源必须显式列出。

## 后端

审计事件由后端持久化，API Server 支持两种后端并可同时启用。

### 日志后端

把事件以 JSON Lines 格式写入本地文件，是最简单也最常用的方式，通常再由节点上的日志采集器（Fluent Bit、Vector、OpenTelemetry Collector）转发到集中存储：

```yaml
# kubeadm ClusterConfiguration 片段
apiServer:
  extraArgs:
  - name: audit-policy-file
    value: /etc/kubernetes/audit/policy.yaml
  - name: audit-log-path
    value: /var/log/kubernetes/audit/audit.log
  - name: audit-log-maxage
    value: "30"          # 保留天数
  - name: audit-log-maxbackup
    value: "10"          # 保留的轮转文件数
  - name: audit-log-maxsize
    value: "100"         # 单文件 MB，超过即轮转
  - name: audit-log-mode
    value: blocking-strict   # 写入失败则请求失败，适用于强合规场景；默认 batch
  extraVolumes:
  - name: audit-policy
    hostPath: /etc/kubernetes/audit
    mountPath: /etc/kubernetes/audit
    readOnly: true
    pathType: DirectoryOrCreate
  - name: audit-log
    hostPath: /var/log/kubernetes/audit
    mountPath: /var/log/kubernetes/audit
    pathType: DirectoryOrCreate
```

API Server 以静态 Pod 运行时，策略文件与日志目录都必须通过 `extraVolumes` 挂载进容器。

### Webhook 后端

把事件 POST 到远端 HTTP 服务，配置文件是一个 kubeconfig：

```yaml
apiServer:
  extraArgs:
  - name: audit-webhook-config-file
    value: /etc/kubernetes/audit/webhook.kubeconfig
  - name: audit-webhook-batch-max-size
    value: "400"
  - name: audit-webhook-batch-buffer-size
    value: "10000"
  - name: audit-webhook-initial-backoff
    value: 10s
```

Webhook 后端默认以批处理模式工作：事件先进入内存缓冲区（默认 10000），按批（默认 400 条）或按时间间隔（默认 30 秒）发送。缓冲区满时事件会被**丢弃**，`apiserver_audit_event_total` 与 `apiserver_audit_error_total` 指标可用于监控丢失情况。为避免丢失，应提高缓冲区大小、减小批间隔，或改用日志后端 + 采集器的方式。

### 事件截断

`--audit-log-truncate-enabled` / `--audit-webhook-truncate-enabled` 开启后，超过 `--audit-*-truncate-max-event-size`（默认 100 KB）的事件会先尝试去掉请求/响应体，仍超限则丢弃；单批超过 `truncate-max-batch-size`（默认 10 MB）时拆分发送。`omitManagedFields: true` 可以显著减少超限事件的数量。

## 托管集群与多租户

云厂商托管的控制面不暴露 API Server 的启动参数，审计日志通过各自的日志服务提供：EKS 在 CloudWatch Logs 中开启 `audit` 类型的控制面日志，GKE 使用 Cloud Audit Logs（Admin Activity 默认开启，Data Access 需手动开启），AKS 通过诊断设置把 `kube-audit`/`kube-audit-admin` 类别发送到 Log Analytics。策略不可自定义，但通常已覆盖 `Metadata` 级别的全部请求。

多租户集群中，审计日志按 `objectRef.namespace` 与 `user.username` 字段即可切分给各租户，但原始日志中可能包含其他租户的资源名称，分发前应经过过滤。

## 分析与告警

审计日志的价值在于被查询与告警。常见的检测规则包括：

- `verb=create resource=pods/exec`：谁进入了哪个容器
- `resource=secrets verb in (get,list)` 且 `user` 非预期服务账户：Secret 读取异常
- `resource=clusterrolebindings verb in (create,update,patch)`：权限提升
- `responseStatus.code=403` 短时间内激增：凭据被滥用或配置错误
- `user.username=system:anonymous` 的非健康检查请求
- `impersonatedUser` 非空：模拟请求
- `annotations["pod-security.kubernetes.io/audit-violations"]` 非空：Pod 安全标准违规
- 来自预期网段之外的 `sourceIPs`

[Falco](https://falco.org/) 的 `k8saudit` 插件可直接消费 Webhook 后端推送的事件并应用上述规则；日志也可接入 Elasticsearch/OpenSearch、Loki 或 SIEM 系统。OpenTelemetry Collector 的 `k8s_events`/`filelog` 接收器则可把审计事件统一纳入可观测性管线（见 [OpenTelemetry](../../observability/opentelemetry)）。

## 总结

审计日志是 Kubernetes 安全体系中成本最低、价值最高的一项配置：一份结构合理的策略让每个 API 操作都可追溯，同时通过 `None` 规则过滤心跳噪音、以 `Metadata` 级别保护 Secret 内容、以 `omitManagedFields` 控制体积。无论自建还是托管集群，都应在上线前就确认审计已开启、日志已集中保存，并针对 exec、Secret 读取、RBAC 变更等高风险操作建立告警。

## 参考文献

- [Auditing - kubernetes.io](https://kubernetes.io/docs/tasks/debug/debug-cluster/audit/)
- [kube-apiserver Audit Configuration (v1) - kubernetes.io](https://kubernetes.io/docs/reference/config-api/apiserver-audit.v1/)
- [Falco Kubernetes Audit Events plugin - falco.org](https://falco.org/docs/concepts/plugins/)
- [Security Checklist - kubernetes.io](https://kubernetes.io/docs/concepts/security/security-checklist/)
