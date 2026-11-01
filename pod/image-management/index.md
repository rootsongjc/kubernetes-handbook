---
weight: 23
title: "镜像管理：拉取策略、私有仓库凭据、凭据提供者与节点镜像生命周期"
linktitle: 镜像管理
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: image-management
description: "全面讲解 Kubernetes 的容器镜像管理：镜像引用与摘要固定、imagePullPolicy 的默认推导规则、ImagePullBackOff 排障、串行与并行拉取、私有仓库的 imagePullSecrets 与 kubelet 凭据提供者插件（含 ServiceAccount 令牌换取短期凭据）、已拉取镜像的凭据复核、镜像预热与 P2P 分发、多架构镜像索引以及镜像垃圾回收。"
---

> 大模型时代一个镜像动辄几十 GB，"拉镜像"从启动前的一个小步骤变成了决定扩容速度与成本的关键路径。

容器镜像是 Pod 的根基，kubelet 对镜像的拉取、缓存、鉴权与清理直接影响工作负载的启动时间、安全性和节点磁盘健康。本文从镜像引用开始，系统梳理 kubelet 在镜像生命周期各阶段的行为与配置，并讨论 AI 工作负载带来的超大镜像分发问题。

## 镜像引用与拉取策略

镜像引用由仓库主机、路径、标签与摘要组成，例如 `registry.example.com/team/app:1.4.2@sha256:9f8e...`。未指定仓库时默认为 Docker Hub，未指定标签时默认为 `latest`。标签可变而摘要不可变，生产部署应固定摘要（见 [供应链安全](../../security/supply-chain-security)）；同时给出标签与摘要时，kubelet 只按摘要拉取，标签仅作可读性用途。

`imagePullPolicy` 控制 kubelet 何时联系仓库。未显式设置时，API Server 按以下规则推导默认值：

{{< table title="imagePullPolicy 的默认推导" >}}

| 镜像引用形式 | 默认策略 | 说明 |
|--------------|----------|------|
| 带摘要 `@sha256:...` | `IfNotPresent` | 内容不可变，本地存在即可复用 |
| 标签为 `:latest` 或省略标签 | `Always` | 标签可能频繁更新 |
| 其他标签 | `IfNotPresent` | 默认假定标签稳定 |

{{< /table >}}

`Always` 并不意味着每次都下载整个镜像：kubelet 会先向仓库解析引用对应的摘要，若与本地缓存一致则跳过下载，成本只是一次 HTTP 请求。因此 `Always` 对带摘要的引用几乎无开销，而对可变标签则保证了"重启后拿到的是当前版本"。`Never` 则完全不联系仓库，仅适用于预热镜像或离线节点，镜像缺失时 Pod 直接报 `ErrImageNeverPull`。

{{< callout warning "不要依赖 :latest" >}}
使用 `:latest` 配合 `Always` 看似能"自动更新"，实际上同一 Deployment 的不同副本可能运行不同版本，回滚也无从谈起。应使用不可变标签或摘要，并通过修改 Pod 模板触发有记录的滚动更新。
{{< /callout >}}

## 拉取失败与退避

镜像拉取失败时容器状态为 `ErrImagePull`，随后进入 `ImagePullBackOff`：kubelet 以指数退避重试，间隔从 10 秒开始翻倍，上限为 300 秒。常见原因与排查方式如下：

- 镜像名或标签拼写错误：`kubectl describe pod` 的事件中可见 `manifest unknown`/`not found`
- 私有仓库鉴权失败：事件包含 `unauthorized` 或 `pull access denied`，检查 `imagePullSecrets` 是否存在于 Pod 所在命名空间且仓库地址匹配
- 网络问题：节点到仓库的 DNS、代理或防火墙；`crictl pull` 在节点上直接复现
- 仓库限流：Docker Hub 对匿名拉取限速，使用镜像代理或私有缓存
- 架构不匹配：镜像索引中缺少节点的 CPU 架构（如 ARM 节点拉取仅 amd64 的镜像），报错 `no match for platform`

## 串行与并行拉取

kubelet 默认**串行**拉取镜像（`serializeImagePulls: true`），一个节点上同一时间只有一个镜像在下载，避免 containerd 1.x 时代的并发拉取问题拖慢节点。现代运行时已能很好地处理并发，大规模扩容或多容器 Pod 场景应开启并行并限制并发数：

```yaml
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
serializeImagePulls: false
maxParallelImagePulls: 5       # 同时拉取的镜像数上限，防止带宽与磁盘 IO 被打满
```

注意 kubelet 从不为同一 Pod 并行拉取多个镜像（init 容器与应用容器按序拉取），并行只发生在不同 Pod 之间。

## 私有仓库的凭据

### imagePullSecrets

传统方式是创建 `kubernetes.io/dockerconfigjson` 类型的 Secret 并在 Pod 或 ServiceAccount 上引用：

```bash
kubectl create secret docker-registry regcred \
  --docker-server=registry.example.com \
  --docker-username=robot$deploy \
  --docker-password='<token>' \
  --namespace=team-a

# 绑定到 ServiceAccount，使该命名空间下所有使用它的 Pod 自动携带
kubectl patch serviceaccount default -n team-a \
  -p '{"imagePullSecrets": [{"name": "regcred"}]}'
```

kubelet 会按镜像的仓库主机匹配 Secret 中 `auths` 的键，支持 `*.example.com` 这类通配与带路径的前缀匹配（如 `registry.example.com/team-a`），匹配越具体优先级越高。这种方式简单直接，但凭据是长期有效的静态密钥，泄露后需要在所有命名空间轮换。

### kubelet 凭据提供者插件

更安全的方式是让 kubelet 在拉取时动态获取短期凭据。凭据提供者（Credential Provider）是 kubelet 调用的外部二进制，通过 `--image-credential-provider-config` 与 `--image-credential-provider-bin-dir` 配置：

```yaml
apiVersion: kubelet.config.k8s.io/v1
kind: CredentialProviderConfig
providers:
- name: ecr-credential-provider
  matchImages:
  - "*.dkr.ecr.*.amazonaws.com"
  - "*.dkr.ecr-fips.*.amazonaws.com"
  defaultCacheDuration: "12h"
  apiVersion: credentialprovider.kubelet.k8s.io/v1
  args: ["get-credentials"]
  env:
  - name: AWS_REGION
    value: us-west-2
```

AWS（`ecr-credential-provider`）、Azure（`acr-credential-provider`）、GCP（`gcr-credential-provider`）都提供了官方实现，它们利用节点的云身份（实例角色、托管身份）换取仓库令牌，集群中不再需要存放任何仓库密码。

v1.34 Beta 的 `KubeletServiceAccountTokenForCredentialProviders` 把这一模型推进到工作负载粒度：在 `CredentialProviderConfig` 中声明 `tokenAttributes` 后，kubelet 会为 Pod 的 ServiceAccount 签发一个受众受限的令牌传给插件，插件以该令牌向仓库（或身份联合服务）换取只对该工作负载有效的拉取凭据。这样"哪个 ServiceAccount 能拉哪个镜像"完全由仓库侧的身份策略决定，`imagePullSecrets` 可以被彻底移除。

```yaml
providers:
- name: oidc-registry-provider
  matchImages: ["registry.example.com"]
  apiVersion: credentialprovider.kubelet.k8s.io/v1
  defaultCacheDuration: "1h"
  tokenAttributes:
    serviceAccountTokenAudience: registry.example.com
    cacheType: ServiceAccount          # 按 ServiceAccount 缓存，或 Token 按令牌缓存
    requireServiceAccount: true
    requiredServiceAccountAnnotationKeys:
    - registry.example.com/role
```

由于 `ServiceAccountNodeAudienceRestriction` 默认开启，还需通过 RBAC 授予 `system:nodes` 组对该受众的 `request-serviceaccounts-token-audience` 权限，否则 kubelet 不会调用插件。

## 已拉取镜像的凭据复核

默认情况下，节点上已存在的镜像可以被任何 Pod 直接使用，即使该 Pod 没有拉取凭据——这在多租户节点上构成信息泄露：租户 B 只要猜到租户 A 私有镜像的名称，就能以 `IfNotPresent` 策略复用租户 A 已拉取的镜像。

`KubeletEnsureSecretPulledImages`（v1.35 Beta 默认开启）解决了这一问题。kubelet 记录每个镜像是用哪些凭据拉取的；后续 Pod 若要使用本地已有的镜像，必须持有拉取过该镜像的凭据之一，或者 kubelet 会用新 Pod 的凭据向仓库重新验证（仅校验清单，不下载层）。行为由 kubelet 配置控制：

{{< table title="imagePullCredentialsVerificationPolicy 取值" >}}

| 取值 | 行为 |
|------|------|
| `NeverVerify` | 关闭复核，恢复旧行为 |
| `NeverVerifyPreloadedImages` | **默认**。kubelet 之外预热的镜像（如节点镜像内置）不复核，其余都复核 |
| `NeverVerifyAllowListedImages` | 只豁免 `preloadedImagesVerificationAllowlist` 中列出的镜像 |
| `AlwaysVerify` | 全部复核 |

{{< /table >}}

使用凭据提供者插件的镜像同样受此保护：复核时 kubelet 会再次调用插件获取凭据进行校验。

## 镜像预热与大镜像分发

AI 推理镜像（CUDA + 框架 + 依赖）普遍在 10 – 30 GB，模型权重若打进镜像更可达上百 GB。按需拉取会让节点扩容后的首个 Pod 等待数分钟到数十分钟，常见的优化手段有：

- **节点镜像预热**：把基础镜像烘焙进节点操作系统镜像（Packer、云厂商自定义镜像），或用 DaemonSet 在节点加入后立即拉取常用镜像；结合 `NeverVerifyPreloadedImages` 策略
- **P2P 分发**：[Dragonfly](https://d7y.io/)、[Spegel](https://github.com/spegel-org/spegel)、Kraken 让节点之间互相分发镜像层，仓库只需向集群传输一份；Spegel 作为纯 containerd 镜像代理无需额外存储
- **镜像懒加载**：[Nydus](https://nydus.dev/)、[SOCI](https://github.com/awslabs/soci-snapshotter)、eStargz 等 containerd 快照器让容器在镜像完整下载前即可启动，按需读取被访问的文件
- **模型与镜像分离**：模型权重不打进镜像，而是用 [镜像卷](../../storage/image-volume)（v1.36 GA）以 OCI 工件形式挂载，或从对象存储/共享文件系统加载，使应用镜像保持精简且可独立更新
- **仓库就近缓存**：每个可用区或机房部署仓库缓存（Harbor 代理项目、containerd 的 registry mirror），减少跨区流量

## 多架构镜像

一个镜像引用可以指向 OCI 镜像索引（Image Index），其中包含多个平台（`linux/amd64`、`linux/arm64`、`windows/amd64` 等）的镜像清单。kubelet 通过 CRI 把节点的操作系统与架构传给运行时，运行时自动选择匹配的清单。构建侧使用 `docker buildx build --platform linux/amd64,linux/arm64` 或 ko、Jib 等工具生成索引即可，在 ARM 节点（Graviton、Ampere、Apple Silicon 开发机）与 x86 混合集群中无需为架构维护不同的标签。

## 节点镜像生命周期

镜像拉取到节点后由容器运行时管理，kubelet 负责垃圾回收：磁盘使用率超过 `imageGCHighThresholdPercent`（默认 85%）时按最近最少使用顺序删除未被引用的镜像至 `imageGCLowThresholdPercent`（默认 80%）；`imageMaximumGCAge`（v1.35 GA）按时间回收长期未使用的镜像。节点级细节见 [kubelet 节点资源管理](../../cluster/kubelet-resource-management)。

运维上可用以下命令观察与干预：

```bash
crictl images                                 # 列出节点上的镜像
crictl rmi --prune                            # 删除未被容器使用的镜像
kubectl get --raw /api/v1/nodes/<node>/proxy/stats/summary | jq .node.runtime.imageFs
```

## 总结

镜像管理贯穿 Pod 的整个生命周期：引用形式与拉取策略决定了版本的确定性，凭据提供者与 ServiceAccount 令牌换取把仓库鉴权从静态 Secret 升级为短期身份凭据，已拉取镜像的凭据复核堵住了多租户节点的旁路，预热、P2P 与懒加载则是应对 AI 时代超大镜像的工程手段。把这些配置纳入节点池与平台模板，才能让"镜像"这个最基础的环节既安全又快速。

## 参考文献

- [Images - kubernetes.io](https://kubernetes.io/docs/concepts/containers/images/)
- [Configure a kubelet image credential provider - kubernetes.io](https://kubernetes.io/docs/tasks/administer-cluster/kubelet-credential-provider/)
- [Pull an Image from a Private Registry - kubernetes.io](https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/)
- [Kubelet Credential Provider Configuration (v1) - kubernetes.io](https://kubernetes.io/docs/reference/config-api/kubelet-credentialprovider.v1/)
- [Dragonfly - d7y.io](https://d7y.io/)
- [Spegel - github.com](https://github.com/spegel-org/spegel)
- [Nydus - nydus.dev](https://nydus.dev/)
