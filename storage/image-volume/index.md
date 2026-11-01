---
weight: 62
title: "OCI 镜像卷"
linktitle: OCI 镜像卷
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: image-volume
description: "介绍 Kubernetes v1.36 GA 的 OCI 镜像卷（volumes[].image）：把容器镜像或 OCI 制品以只读方式挂载为卷，用于分发模型权重、配置包、插件等数据的原理、字段语义、拉取策略、运行时要求与最佳实践。"
---

> 镜像仓库早已是云原生世界里最成熟的分发基础设施，镜像卷让它不再只为可执行代码服务。

在 Kubernetes 中把一份数据交给容器，传统上只有几条路：打进应用镜像、放进 ConfigMap/Secret、用 Init 容器下载到 emptyDir，或者挂载持久卷。它们各有短板：打进镜像导致数据与代码耦合、任何一方更新都要重建镜像；ConfigMap 有 1 MiB 的大小上限；Init 容器下载增加启动时间并需要自行处理凭据与校验；持久卷则需要存储系统配合。OCI 镜像卷（Image Volume，KEP-4639）提供了第四条路：**把任意 OCI 镜像或 OCI 制品直接挂载为 Pod 中的只读卷**，由容器运行时负责拉取、缓存与挂载。该特性 v1.31 Alpha，v1.33 Beta，v1.35 默认开启，v1.36 GA。

## 基本用法

镜像卷通过 `volumes[].image` 声明，`reference` 的写法与 `containers[].image` 完全一致：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: image-volume-demo
spec:
  containers:
  - name: shell
    image: debian:12
    command: ["sleep", "infinity"]
    volumeMounts:
    - name: artifact
      mountPath: /volume
  volumes:
  - name: artifact
    image:
      reference: quay.io/crio/artifact:v2
      pullPolicy: IfNotPresent
```

Pod 启动时 kubelet 通过 CRI 请求运行时解析并拉取该引用，然后把镜像的文件系统内容只读挂载到 `mountPath`。镜像拉取使用与容器镜像相同的凭据链：节点凭据、ServiceAccount 的 `imagePullSecrets` 以及 Pod 规范中的 `imagePullSecrets`，无需为数据分发单独设计认证。

### 字段说明

{{< table title="image 卷类型字段" >}}

| 字段          | 说明                                                                                     |
|---------------|------------------------------------------------------------------------------------------|
| `reference`   | OCI 镜像或制品引用，如 `registry.example.com/models/qwen3-8b:v1`、`...@sha256:...`；该字段可选，以便 Deployment 等上层工具做默认化或覆盖 |
| `pullPolicy`  | `Always`、`IfNotPresent`、`Never`；引用带 `:latest` 时默认 `Always`，否则默认 `IfNotPresent` |

{{< /table >}}

三种拉取策略的失败语义如下：`Always` 拉取失败即把 Pod 置为 `Failed`；`Never` 要求所有层与清单都已在本地，否则 `Failed`；`IfNotPresent` 在本地缺失且拉取失败时 `Failed`。拉取失败会按卷挂载的常规退避重试，并体现在 Pod 的 `reason`/`message` 中。

### 挂载语义

- 卷始终**只读**，并以 `noexec` 挂载，容器无法直接执行其中的二进制（可复制到可写卷后执行）
- v1.33 起支持 `subPath` 与 `subPathExpr`，可只挂载镜像内的某个子目录；路径会做严格校验，拒绝绝对路径与 `..` 穿越
- `fsGroupChangePolicy` 对镜像卷无效
- `AlwaysPullImages` 准入控制器对镜像卷同样生效
- 卷内容在 Pod 创建时解析一次，Pod 被删除重建后才会重新解析，因此更新数据的方式是改引用并滚动更新工作负载，而不是原地覆盖同一个 tag

### 运行时要求

镜像卷依赖容器运行时实现 CRI 中的镜像挂载能力：containerd 2.1+ 与 CRI-O 1.31+ 均已支持。可挂载的对象类型由运行时决定，至少包括所有合法的容器镜像；两者也支持挂载非镜像的 OCI 制品（例如用 ORAS 推送的模型文件包）。

## 典型场景

镜像卷最适合"体积大、只读、需要版本化分发"的数据。

### 分发模型权重

大模型推理服务的权重文件动辄数十 GB，把它打进推理框架镜像意味着框架升级或模型更新都要重建并重新分发整个镜像。镜像卷让权重与框架解耦：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qwen3-8b
spec:
  replicas: 2
  selector:
    matchLabels:
      app: qwen3-8b
  template:
    metadata:
      labels:
        app: qwen3-8b
    spec:
      containers:
      - name: vllm
        image: vllm/vllm-openai:v0.11.0
        args: ["--model", "/models/qwen3-8b", "--served-model-name", "qwen3-8b"]
        volumeMounts:
        - name: model
          mountPath: /models/qwen3-8b
        resources:
          limits:
            nvidia.com/gpu: 1
      volumes:
      - name: model
        image:
          reference: registry.example.com/models/qwen3-8b@sha256:4f1c…
          pullPolicy: IfNotPresent
```

镜像层被节点缓存后，同一节点上的多个副本共享同一份数据，不再需要每个 Pod 单独下载或占用 PVC。

### 分发配置与插件

超过 ConfigMap 大小限制的配置包、WebAssembly 插件、语言运行时的依赖包、合规扫描规则库等，都可以打成 OCI 制品挂载，复用镜像仓库的访问控制、签名校验（cosign/notation）与就近分发能力。

### 替代 Init 容器拷贝

以往"Init 容器从镜像里 `cp` 文件到 emptyDir 再供主容器使用"的模式，可以直接用镜像卷替代，省去一次容器启动与磁盘拷贝。

## 与其他方式的对比

{{< table title="向 Pod 分发只读数据的方式对比" >}}

| 方式                | 大小限制          | 版本化与签名        | 更新方式                     | 启动开销             |
|---------------------|-------------------|---------------------|------------------------------|----------------------|
| ConfigMap / Secret  | 1 MiB             | 无                  | 原地更新，kubelet 周期同步    | 极低                 |
| 打进应用镜像        | 无                | 随镜像              | 重建镜像                     | 随镜像大小           |
| Init 容器下载       | 无                | 自行实现            | 修改下载地址并重建 Pod        | 每个 Pod 下载一次    |
| 持久卷              | 受存储系统限制    | 自行实现            | 写入存储                     | 依赖存储挂载         |
| OCI 镜像卷          | 无                | 复用镜像仓库与签名工具 | 改引用并重建 Pod；节点缓存共享 | 首次拉取后极低       |

{{< /table >}}

## 最佳实践

- 使用摘要（`@sha256:`）而不是可变 tag 引用数据制品，配合 `IfNotPresent` 获得可重复的部署
- 为大体积制品规划节点镜像垃圾回收阈值（`imageGCHighThresholdPercent` 等），避免模型层被过早清理
- 需要可执行文件时，用 Init 容器把镜像卷中的文件复制到可写卷，而不是试图关闭 `noexec`
- 在准入策略中限制镜像卷的 `reference` 只能来自受信任的仓库，与容器镜像的来源策略保持一致
- 通过 Pod 状态观察卷解析进度：v1.35 起（Alpha，`ImageVolumeWithDigest`）Pod 状态可记录镜像卷实际解析到的摘要，便于审计

## 总结

OCI 镜像卷把容器镜像生态成熟的分发、缓存、签名与访问控制能力扩展到了任意只读数据，尤其适合模型权重、配置包与插件等"大而只读"的场景。它要求 containerd 2.1+ 或 CRI-O 1.31+，与原生 Sidecar、用户命名空间一起构成了新一代节点基线上值得优先采用的特性。

## 参考文献

- [Volumes: image - kubernetes.io](https://kubernetes.io/docs/concepts/storage/volumes/#image)
- [Use an Image Volume With a Pod - kubernetes.io](https://kubernetes.io/docs/tasks/configure-pod-container/image-volumes/)
- [Kubernetes v1.31: Read Only Volumes Based On OCI Artifacts (alpha) - kubernetes.io](https://kubernetes.io/blog/2024/08/16/kubernetes-1-31-image-volume-source/)
- [KEP-4639: OCI VolumeSource - github.com](https://github.com/kubernetes/enhancements/tree/master/keps/sig-node/4639-oci-volume-source)
