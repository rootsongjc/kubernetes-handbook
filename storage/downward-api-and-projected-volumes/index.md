---
weight: 11
title: "Downward API 与投射卷：向容器注入 Pod 元数据、令牌、信任包与证书"
linktitle: Downward API 与投射卷
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: downward-api-and-projected-volumes
description: "讲解 Downward API 通过环境变量与卷向容器暴露 Pod/容器字段的两种方式及可用字段清单，以及 projected 卷把 secret、configMap、downwardAPI、serviceAccountToken、clusterTrustBundle（v1.37 GA）与 podCertificate（v1.37 GA）六类来源合并挂载到同一目录的用法——这是现代工作负载身份（短期令牌、自动轮换的 mTLS 证书）的基础设施。"
---

> 应用不应该为了知道"我是谁、我在哪、我能用多少资源"而去调用 Kubernetes API——这些信息应当像空气一样在容器启动时就已经在那里。

容器通常需要了解自身所处的环境：Pod 名称与命名空间用于日志与追踪的标注，节点名与 IP 用于亲和决策，资源限制用于 JVM/Go 运行时的内存与线程调优，服务账户令牌与证书用于向其他服务证明身份。Downward API 与投射卷（Projected Volume）正是 Kubernetes 把这些信息"向下"注入容器的标准机制，无需应用依赖客户端库或 RBAC 权限。

## Downward API

Downward API 提供两种注入途径：环境变量在容器启动时一次性求值，卷文件则由 kubelet 持续同步（标签与注解变化会在约一分钟内更新到文件）。两种方式可用的字段略有差异。

{{< table title="Downward API 可用字段" >}}

| 字段 | 环境变量 | 卷 | 说明 |
|------|:--------:|:--:|------|
| `metadata.name` / `metadata.namespace` / `metadata.uid` | ✓ | ✓ | Pod 标识 |
| `metadata.labels` / `metadata.annotations` | 单个键 `metadata.labels['key']` | 全部（每行一个 `key="value"`）或单个键 | 卷方式会随对象变化更新 |
| `spec.serviceAccountName` | ✓ | — | |
| `spec.nodeName` | ✓ | — | 调度后才有值 |
| `status.hostIP` / `status.hostIPs` | ✓ | — | 节点 IP；`hostIPs` 为双栈列表 |
| `status.podIP` / `status.podIPs` | ✓ | — | Pod IP；`podIPs` 为双栈列表 |
| `resources.requests.*` / `resources.limits.*`（`resourceFieldRef`） | ✓ | ✓ | `cpu`、`memory`、`ephemeral-storage`、`hugepages-*`；可用 `divisor` 换算单位 |

{{< /table >}}

典型用法是同时注入标识信息与资源限制：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: downward-demo
  labels:
    app: demo
    version: v2
spec:
  containers:
  - name: app
    image: registry.example.com/app:1.0
    env:
    - name: POD_NAME
      valueFrom:
        fieldRef:
          fieldPath: metadata.name
    - name: POD_NAMESPACE
      valueFrom:
        fieldRef:
          fieldPath: metadata.namespace
    - name: NODE_NAME
      valueFrom:
        fieldRef:
          fieldPath: spec.nodeName
    - name: POD_IP
      valueFrom:
        fieldRef:
          fieldPath: status.podIP
    - name: APP_VERSION
      valueFrom:
        fieldRef:
          fieldPath: metadata.labels['version']
    - name: GOMAXPROCS                      # Go 运行时按 CPU limit 设置并发度
      valueFrom:
        resourceFieldRef:
          resource: limits.cpu
          divisor: "1"
    - name: MEMORY_LIMIT_MB                 # JVM -Xmx 等按 limit 推导
      valueFrom:
        resourceFieldRef:
          resource: limits.memory
          divisor: 1Mi
    resources:
      requests: { cpu: 500m, memory: 512Mi }
      limits: { cpu: "2", memory: 1Gi }
    volumeMounts:
    - name: podinfo
      mountPath: /etc/podinfo
      readOnly: true
  volumes:
  - name: podinfo
    downwardAPI:
      items:
      - path: labels
        fieldRef:
          fieldPath: metadata.labels
      - path: annotations
        fieldRef:
          fieldPath: metadata.annotations
```

`resourceFieldRef` 未指定 `divisor` 时 CPU 以核为单位向上取整（500m → 1），内存以字节为单位；容器未设置 limits 时返回节点的可分配值。这一特性让 Go（`GOMAXPROCS`）、Java（`-XX:MaxRAMPercentage` 或 `-Xmx`）、.NET 等运行时能够与 cgroup 限制对齐，尽管现代运行时多已能自动识别 cgroup，显式注入仍是最可靠的方式。需要注意 [原地资源调整](../../pod/in-place-pod-resize) 后环境变量不会更新，只有卷文件会同步新值。

## 投射卷

ConfigMap、Secret、Downward API 分别挂载时每个卷都要占用一个挂载点，且多个 Secret 不能放进同一目录。投射卷把多种来源合并到一个目录，当前支持六种来源：

{{< table title="projected 卷支持的来源" >}}

| 来源 | 内容 | 状态 |
|------|------|------|
| `secret` | Secret 的键 | GA |
| `configMap` | ConfigMap 的键 | GA |
| `downwardAPI` | Pod 字段 | GA |
| `serviceAccountToken` | 受众与有效期受限、自动轮换的服务账户令牌 | GA（v1.20） |
| `clusterTrustBundle` | 按签名者名称或标签选择的 `ClusterTrustBundle` 中的 CA 证书，合并为一个 PEM 文件 | GA（v1.37） |
| `podCertificate` | kubelet 为 Pod 生成私钥、通过 `PodCertificateRequest` 向签名者申请并自动轮换的 X.509 证书 | GA（v1.37） |

{{< /table >}}

所有来源必须与 Pod 同命名空间；`defaultMode` 只能在 `projected` 级别设置，各来源的 `items[].mode` 可以覆盖单个文件的权限。

### 服务账户令牌

自动挂载的服务账户令牌（`/var/run/secrets/kubernetes.io/serviceaccount/token`）本质上就是一个 `projected` 卷，它由 API Server 的准入插件注入，受众为 API Server、有效期 1 小时、由 kubelet 在到期前轮换。应用在访问其他服务（Vault、云 IAM、自建 OIDC 依赖方）时应显式声明目标受众，避免复用面向 API Server 的令牌：

```yaml
volumes:
- name: vault-token
  projected:
    sources:
    - serviceAccountToken:
        audience: vault.example.com
        expirationSeconds: 3600
        path: token
```

令牌为 JWT，包含 `kubernetes.io` 声明组：Pod 名称与 UID、ServiceAccount 名称与 UID、以及节点名称与 UID（`ServiceAccountTokenPodNodeInfo`，v1.32 GA）。外部系统可通过集群的 OIDC 发现端点（`/.well-known/openid-configuration` 与 `/openid/v1/jwks`）验证令牌，这是云厂商"工作负载身份联合"（IRSA、Workload Identity）的基础。

### 集群信任包

`ClusterTrustBundle` 是集群级对象，由签名者（如 cert-manager、内部 CA 控制器）发布其 CA 证书。Pod 不再需要把 CA 证书打进镜像或复制到每个命名空间的 ConfigMap：

```yaml
volumes:
- name: trust
  projected:
    sources:
    - clusterTrustBundle:
        signerName: example.com/internal-ca       # 选择该签名者的所有信任包并合并
        labelSelector:
          matchLabels:
            env: prod
        path: ca-bundle.pem
        optional: true                            # 无匹配时写入空文件而非阻塞启动
```

kubelet 会去重并合并匹配到的所有证书，CA 轮换时文件自动更新。配合 `podCertificate`，应用可以在不引入服务网格的情况下获得端到端的 mTLS 原材料。

### Pod 证书

`podCertificate` 来源让 kubelet 为每个 Pod 生成私钥（私钥不离开节点），创建 `PodCertificateRequest` 对象交给指定签名者签发，并在证书接近过期时自动续签：

```yaml
volumes:
- name: identity
  projected:
    sources:
    - podCertificate:
        signerName: example.com/workload-identity
        keyType: ECDSAP256                        # ED25519 / ECDSAP256 / ECDSAP384 / ECDSAP521 / RSA3072 / RSA4096
        maxExpirationSeconds: 86400               # 1 小时至 91 天，默认 24 小时
        credentialBundlePath: credentials.pem     # 私钥 + 证书链合并为一个 PEM，便于原子重载
        # 或分开写入：keyPath / certificateChainPath
        userAnnotations:
          example.com/service: payments           # 原样传给签名者，签名者须自行校验
```

签名者可从 `PodCertificateRequest` 中获得 API Server 校验过的 Pod 与 ServiceAccount 身份（名称、UID、节点），据此决定证书的 Subject 与 SAN，杜绝了应用自行生成 CSR 时"声称自己是谁"的信任问题。应用需要用 inotify 或定期轮询监听文件变化并重载证书。Kubernetes 内置签名者限制最长 24 小时，自定义签名者（如 cert-manager 的实现）可按策略放宽。

### 综合示例

把身份相关的全部材料投射到一个目录，是零信任工作负载的推荐布局：

```yaml
volumes:
- name: workload-identity
  projected:
    defaultMode: 0400
    sources:
    - serviceAccountToken:
        audience: internal-api
        expirationSeconds: 3600
        path: token
    - podCertificate:
        signerName: example.com/workload-identity
        keyType: ECDSAP256
        credentialBundlePath: tls/credentials.pem
    - clusterTrustBundle:
        signerName: example.com/workload-identity
        path: tls/ca.pem
    - downwardAPI:
        items:
        - path: pod-name
          fieldRef:
            fieldPath: metadata.name
```

## 安全上下文的影响

投射卷在 Linux 上以 tmpfs 挂载，文件属主默认为 root。设置了 `fsGroup` 时，`serviceAccountToken`、`clusterTrustBundle`、`podCertificate` 等由 kubelet 生成的文件会归属该组并设置 0640 等权限，容器内非 root 进程才能读取。文件通过符号链接指向带时间戳的目录实现原子更新，应用若使用 `subPath` 挂载单个文件则会失去自动更新能力。

Windows 节点的投射卷会被复制到容器可写层而非 tmpfs，且不支持 `fsGroup`，令牌与证书的权限需由应用自行约束。

## 总结

Downward API 让容器以零依赖的方式获知自身的元数据与资源边界，投射卷则把配置、密钥、令牌、信任包与证书统一为一个目录的文件。随着 `clusterTrustBundle` 与 `podCertificate` 在 v1.37 GA，Kubernetes 首次在平台层提供了完整的工作负载身份原语——短期受众令牌、自动轮换的私钥与证书、以及集中分发的 CA——应用无需服务网格 Sidecar 或自建 PKI 代理即可实现 mTLS 与零信任认证。

## 参考文献

- [Downward API - kubernetes.io](https://kubernetes.io/docs/concepts/workloads/pods/downward-api/)
- [Projected Volumes - kubernetes.io](https://kubernetes.io/docs/concepts/storage/projected-volumes/)
- [Expose Pod Information to Containers Through Files - kubernetes.io](https://kubernetes.io/docs/tasks/inject-data-application/downward-api-volume-expose-pod-information/)
- [Certificates and Certificate Signing Requests - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/certificate-signing-requests/)
- [Managing Service Accounts - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)
