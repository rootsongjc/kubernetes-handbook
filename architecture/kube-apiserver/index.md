---
weight: 5
title: "kube-apiserver 深入：请求处理链、存储层、Watch 缓存、API 优先级与公平性"
linktitle: kube-apiserver 深入
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: kube-apiserver
description: "剖析 kube-apiserver 的内部结构：请求从认证、授权、准入到持久化的处理链，聚合层与 API 发现，etcd 存储层的编码与存储版本迁移，Watch 缓存与一致性读优化（ConsistentListFromCache、WatchList 流式列表），API 优先级与公平性（APF）的 FlowSchema/PriorityLevelConfiguration 配置、关键指标与过载调优，以及高可用部署与性能最佳实践。"
---

> API Server 是整个集群唯一的"真相出口"——所有组件都通过它读写状态，它的吞吐与延迟上限就是集群规模的上限。

kube-apiserver 是 Kubernetes 控制面中唯一直接与 etcd 通信的组件，也是所有客户端（kubectl、控制器、kubelet、Operator）共同的入口。它既是 REST 服务器、又是鉴权网关、还是集群状态的缓存层。本文从一个请求的完整旅程出发，深入 API Server 的几个关键子系统，帮助读者理解大规模集群中的性能瓶颈与调优手段。

## 请求处理链

每个到达 API Server 的 HTTP 请求都要经过一条固定的处理链（Handler Chain），任何一环失败都会以相应的 HTTP 状态码终止：

1. **TLS 终止与 HTTP/2**：默认监听 6443 端口，仅 HTTPS；`UnauthenticatedHTTP2DOSMitigation` 限制未认证连接的 HTTP/2 流数量，缓解拒绝服务攻击
2. **认证（Authentication）**：按配置的认证器链依次尝试——客户端证书、Bearer Token（ServiceAccount JWT、OIDC、Webhook）、认证代理等，任一成功即确定用户身份与组；全部失败返回 401。v1.34 GA 的 [结构化认证配置](../../auth/structured-authentication-authorization) 让多 OIDC 颁发者与 CEL 声明映射成为可能
3. **审计（Audit）**：记录 `RequestReceived` 阶段事件（若策略未省略）
4. **模拟（Impersonation）**：处理 `Impersonate-User` 等头，供有权限的用户以他人身份操作
5. **API 优先级与公平性（APF）**：按 FlowSchema 分类请求、排队或拒绝（429），详见后文
6. **授权（Authorization）**：按授权器链（Node、RBAC、Webhook，或结构化授权配置中的任意顺序）判断该用户是否可对该资源执行该动词；拒绝返回 403
7. **准入控制（Admission）**：仅对写请求。先执行变更准入（内置插件与 MutatingAdmissionPolicy/Webhook），再进行对象模式校验，然后执行验证准入（内置插件、ValidatingAdmissionPolicy、Webhook）。v1.36 GA 的声明式验证（`DeclarativeValidation`）把越来越多内置类型的校验规则从手写 Go 代码迁移为类型上的声明标签
8. **存储层**：序列化为存储版本并写入 etcd；读请求可能由 Watch 缓存直接响应
9. **响应与审计**：返回结果并记录 `ResponseComplete` 事件

`--request-timeout`（默认 60 秒）限制非长连接请求的最大处理时间；`watch` 等长连接受 `--min-request-timeout`（默认 1800 秒，实际随机取 1 – 2 倍以打散重连）约束。

## API 组织与聚合层

API Server 以**组/版本/资源**（GVR）组织 API：核心组位于 `/api/v1`，其他组位于 `/apis/<group>/<version>`。`/apis` 的聚合发现（Aggregated Discovery，v1.30 GA）让客户端用一次请求获取全部组、版本与资源的清单，kubectl 1.27+ 据此把启动时的发现请求从上百次降到两次。

API Server 本身可以被扩展：

- **CRD**：由 API Server 内置的 `apiextensions-apiserver` 直接服务，对象存入主 etcd，是扩展 API 的主流方式
- **聚合层（Aggregation Layer）**：通过 `APIService` 对象把某个组/版本代理到集群内运行的扩展 API Server（如 `metrics.k8s.io` 的 metrics-server），扩展服务器自行决定存储方式，适合需要自定义存储或子资源语义的场景

细节见 [扩展 Kubernetes](../../extend/overview) 一章。`kube-aggregator` 还负责 `/openapi/v2`、`/openapi/v3` 的合并，使 `kubectl explain` 与客户端校验能覆盖 CRD 与聚合 API。

## 存储层与 etcd

API Server 把每个对象以 `/registry/<resource>/<namespace>/<name>` 为键存入 etcd，值为对象的**存储版本**编码——内置类型默认使用 Protobuf（`--storage-media-type=application/vnd.kubernetes.protobuf`），CRD 使用 JSON。v1.32 Alpha 的 CBOR 编码（`CBORServingAndStorage`）试图为 CRD 提供比 JSON 更紧凑、比 Protobuf 更通用的二进制格式。

同一资源的多个 API 版本在 API Server 内通过**内部版本**（internal version）相互转换，读取时按请求的版本解码返回。当存储版本因升级而改变（如 `v1beta1` → `v1`），已持久化的旧对象不会自动重写，需要通过 `kube-storage-version-migrator`（`StorageVersionMigrator`，v1.35 Beta）或 `kubectl get ... | kubectl replace -f -` 触发重写；这也是 [静态数据加密](../../security/encryption-at-rest) 变更后"全量重写"的同一机制。

多个 API Server 实例写入同一 etcd 时必须使用相同的 `--etcd-servers` 与 `--etcd-prefix`。API Server 还负责 etcd 的周期压缩（`--etcd-compaction-interval`，默认 5 分钟），保留足够的历史版本供 Watch 重放。更多见 [etcd](../etcd)。

## Watch 缓存与一致性读

控制器通过 Informer 以"List 一次 + Watch 增量"的方式维护本地缓存，`watch` 请求的数量与节点数、控制器数成正比，是 API Server 最重要的负载来源。为此 API Server 为每种资源维护一个 **Watch 缓存**（watch cache）：它自身对 etcd 发起单一 Watch，把事件按 `resourceVersion` 排序放入内存环形缓冲与 B-tree 索引（`BtreeWatchCache`，v1.33 GA），再扇出给成百上千的客户端 Watch，使 etcd 只承受一份负载。

传统上，`list` 请求需要直接读 etcd 才能保证线性一致（最新数据），大量 Informer 同时重启（"惊群"）会瞬间打垮 etcd。近年的多项改进把这些读操作移到了缓存：

{{< table title="List/Watch 性能相关改进" >}}

| 特性 | 作用 | 状态 |
|------|------|------|
| `ConsistentListFromCache` | 先向 etcd 请求当前 revision（廉价），等待缓存追上后从缓存提供一致 List，etcd 负载下降一个数量级 | GA v1.34 |
| `WatchList`（流式列表） | 客户端以 `watch` + `sendInitialEvents=true` 替代 `list`，初始状态以事件流分批返回，API Server 内存峰值不再随 List 结果体积膨胀；client-go 侧为 `WatchListClient` | Beta v1.34（默认开启） |
| `StreamingCollectionEncodingToJSON`/`ToProtobuf` | 列表响应流式编码，避免一次性在内存构造完整响应体 | GA v1.34 |
| `ResilientWatchCacheInitialization` | 缓存初始化期间请求排队而非失败，避免重启时的 429 风暴 | GA v1.34 |
| `ListFromCacheSnapshot` | 从缓存的历史快照服务带 `resourceVersion` 的分页 List，减少 etcd 访问 | Beta v1.34 |
| `SizeBasedListCostEstimate` | APF 按预估响应体积而非对象数估算 List 的座位数，让大对象的 List 得到合理限流 | Beta v1.34 |
| `DetectCacheInconsistency` | 周期性比对缓存与 etcd 的哈希，发现不一致时自动重建缓存并暴露指标 | Beta v1.34 |

{{< /table >}}

这些改进共同作用下，v1.34+ 的 API Server 在万级节点、数十万 Pod 的集群中，etcd 读流量与 API Server 内存峰值较 v1.28 时代都有显著下降。运维者无需配置即可受益，但需确保客户端（client-go、controller-runtime）版本足够新以使用 WatchList。

## API 优先级与公平性

当请求总量超过 API Server 的处理能力时，早期的 `--max-requests-inflight`（默认 400）与 `--max-mutating-requests-inflight`（默认 200）只能一刀切地拒绝多余请求，无法区分 kubelet 心跳与失控的客户端脚本。API 优先级与公平性（APF，API Priority and Fairness，v1.29 GA）用两类对象把总并发预算按优先级分配，并在同一优先级内对不同"流"公平排队：

- **PriorityLevelConfiguration**：定义一个优先级的并发份额（`nominalConcurrencyShares`）、可出借比例（`lendablePercent`）、借用上限（`borrowingLimitPercent`）与排队参数（队列数、队列长度、手抖洗牌份数）；`type: Exempt` 的级别不受限制
- **FlowSchema**：按主体（用户、组、ServiceAccount）与资源/动词规则把请求匹配到某个优先级，并用 `distinguisherMethod`（按用户或按命名空间）把请求分成多个流，保证一个失控的流不会独占该优先级的全部座位

API Server 预置了一组强制与建议的配置：`exempt`（system:masters）、`system`（节点与核心组件）、`node-high`、`leader-election`、`workload-high`（内置控制器）、`workload-low`（其他 ServiceAccount，即集群内运行的所有自定义控制器）、`global-default`（普通用户的 kubectl）与 `catch-all`。常见的调优是为关键 Operator 或 CI 系统单独划分优先级：

```yaml
apiVersion: flowcontrol.apiserver.k8s.io/v1
kind: PriorityLevelConfiguration
metadata:
  name: platform-operators
spec:
  type: Limited
  limited:
    nominalConcurrencyShares: 40
    lendablePercent: 50
    borrowingLimitPercent: 200
    limitResponse:
      type: Queue
      queuing:
        queues: 64
        queueLengthLimit: 50
        handSize: 6
---
apiVersion: flowcontrol.apiserver.k8s.io/v1
kind: FlowSchema
metadata:
  name: platform-operators
spec:
  priorityLevelConfiguration:
    name: platform-operators
  matchingPrecedence: 500            # 数值越小越先匹配，须小于 workload-low 的 9000
  distinguisherMethod:
    type: ByUser                     # 每个 ServiceAccount 一条流
  rules:
  - subjects:
    - kind: Group
      group:
        name: system:serviceaccounts:platform-system
    resourceRules:
    - verbs: ["*"]
      apiGroups: ["*"]
      resources: ["*"]
      clusterScope: true
      namespaces: ["*"]
```

被限流的请求收到 429 并带 `Retry-After` 头，client-go 会自动退避重试。响应头 `X-Kubernetes-PF-FlowSchema-UID` 与 `X-Kubernetes-PF-PriorityLevel-UID` 可用于确认某个请求被分到了哪一级。关键指标包括：

- `apiserver_flowcontrol_rejected_requests_total`：按优先级统计的拒绝数，持续非零说明预算不足
- `apiserver_flowcontrol_current_inqueue_requests` / `apiserver_flowcontrol_request_wait_duration_seconds`：排队深度与等待时间
- `apiserver_flowcontrol_current_executing_seats` 与 `apiserver_flowcontrol_nominal_limit_seats`：实际占用与名义上限，用于判断座位借用情况
- `apiserver_flowcontrol_dispatched_requests_total`：按 FlowSchema 统计的流量来源

常见误区是看到 429 就调大 `--max-requests-inflight`——这往往只是把压力推给 etcd；应先用 `apiserver_flowcontrol_dispatched_requests_total` 找出流量来源，修正失控的客户端（如没有 Informer 缓存、轮询 List 的脚本），再为确有需要的工作负载分配独立优先级。

## 高可用与性能实践

控制面通常运行 3 个 API Server 实例，前置负载均衡器（或 kube-vip/keepalived 的 VIP）分发客户端连接；实例之间无状态，通过 `APIServerIdentity`（`kube-system` 中的 Lease）互相感知以协调存储版本与聚合发现。kubelet 与控制器使用长连接，负载均衡器需支持 HTTP/2 与足够长的空闲超时，并在滚动升级时配合 `--shutdown-delay-duration` 与 `/readyz` 实现优雅下线。

性能方面值得关注的参数与实践：

- 为 API Server 预留充足内存：Watch 缓存会保留每种资源的全部对象，内存需求与集群对象总量成正比；大集群常见 16 – 64 GiB
- `--watch-cache-sizes` 通常无需手动调整，缓存容量会按负载动态伸缩，只在特定资源出现 `too old resource version` 频繁重列时才考虑显式设置
- `--etcd-servers-overrides` 可把 Event 等高写入资源分流到独立的 etcd 集群
- `--enable-priority-and-fairness` 保持开启；为 CI、批处理等大流量来源建立独立 FlowSchema
- 开启 `APIServerTracing`（v1.34 GA）把请求链路导出到 OpenTelemetry，定位慢请求发生在认证、准入 Webhook 还是 etcd
- 关注 `apiserver_request_duration_seconds`（按动词/资源的 P99）、`apiserver_current_inflight_requests`、`etcd_request_duration_seconds` 与 `apiserver_storage_objects` 四组核心指标
- 准入 Webhook 是最常见的延迟来源，设置合理的 `timeoutSeconds`、`failurePolicy` 与精确的 `objectSelector`/`namespaceSelector`，能用 ValidatingAdmissionPolicy 表达的规则优先用 CEL 实现

## 总结

kube-apiserver 的本质是一个在 etcd 之上提供认证、授权、准入、缓存与扇出的 REST 网关。它通过 Watch 缓存把成千上万客户端的读取压力收敛为对 etcd 的单一 Watch，通过一致性缓存读与流式列表让 List 不再成为惊群时的雪崩点，通过 APF 把有限的并发预算按优先级与公平性分配给不同来源的请求。理解这些机制后，面对 API Server 的高延迟或 429，运维者就能从"调大参数"转向"找出谁在制造负载、给谁分配预算"的正确路径。

## 参考文献

- [The Kubernetes API - kubernetes.io](https://kubernetes.io/docs/concepts/overview/kubernetes-api/)
- [Kubernetes API Concepts - kubernetes.io](https://kubernetes.io/docs/reference/using-api/api-concepts/)
- [API Priority and Fairness - kubernetes.io](https://kubernetes.io/docs/concepts/cluster-administration/flow-control/)
- [Operating etcd clusters for Kubernetes - kubernetes.io](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/)
- [Admission Control in Kubernetes - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/)
- [kube-apiserver reference - kubernetes.io](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-apiserver/)
- [Aggregated Discovery - kubernetes.io](https://kubernetes.io/docs/concepts/overview/kubernetes-api/#discovery-api)
