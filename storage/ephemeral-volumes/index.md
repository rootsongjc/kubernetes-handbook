---
weight: 64
title: "临时卷：emptyDir、通用临时卷、CSI 临时卷与本地临时存储配额"
linktitle: 临时卷
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: ephemeral-volumes
description: "梳理随 Pod 生命周期存在的几类临时卷：emptyDir（磁盘与内存介质、sizeLimit）、通用临时卷（按 PVC 模板动态供应、支持任意 CSI 驱动与快照恢复）、CSI 临时卷（Secrets Store 等节点本地注入），以及 ephemeral-storage 资源的 requests/limits、驱逐与配额——为缓存、暂存与 AI 训练检查点选择合适的临时存储。"
---

> 不是所有数据都值得持久化——缓存、临时解压、中间产物只需要"跟着 Pod 一起消失"，选对临时卷类型能省下大量存储成本与运维负担。

持久卷解决的是"数据比 Pod 活得久"的问题，而大量应用只需要在 Pod 运行期间可用的暂存空间：解压的包、编译缓存、分片排序的中间文件、推理服务的模型缓存、训练任务的本地检查点。Kubernetes 把这类随 Pod 创建与删除的卷统称为临时卷（Ephemeral Volume）。本文介绍各类临时卷的特性、取舍，以及约束它们磁盘用量的 `ephemeral-storage` 资源模型。

## 临时卷的类型

{{< table title="Kubernetes 临时卷类型" >}}

| 类型 | 存储位置 | 大小约束 | 典型用途 | 状态 |
|------|----------|----------|----------|------|
| `emptyDir` | 节点根盘（kubelet 目录）或内存 tmpfs | `sizeLimit`，超出触发驱逐 | 暂存、容器间共享、内存盘 | GA |
| `configMap` / `secret` / `downwardAPI` / `projected` | 节点 tmpfs | 由对象大小决定（≤ 1 MiB） | 注入配置与身份，见 [投射卷](../downward-api-and-projected-volumes) | GA |
| `image` | 容器运行时镜像存储 | 镜像大小 | 以只读方式挂载 OCI 镜像/工件（模型、数据集），见 [镜像卷](../image-volume) | GA（v1.36） |
| 通用临时卷（`ephemeral`） | 任意 CSI/动态供应存储 | PVC 请求的容量，由存储后端强制 | 需要固定大小、网络存储或从快照初始化的暂存 | GA（v1.23） |
| CSI 临时卷（`csi` 内联） | 由 CSI 驱动在节点本地管理 | 驱动决定 | Secrets Store、cert-manager csi-driver 等节点侧注入 | GA（v1.25） |

{{< /table >}}

## emptyDir

`emptyDir` 在 Pod 被调度到节点时创建为空目录，Pod 中所有容器可挂载同一个 `emptyDir` 共享数据（这是 Sidecar 与主容器交换文件的标准方式），容器崩溃重启不丢数据，Pod 删除后随之清除。

```yaml
volumes:
- name: scratch
  emptyDir:
    sizeLimit: 2Gi              # 超过即触发 Pod 驱逐（需 kubelet 开启本地临时存储隔离，默认开启）
- name: cache
  emptyDir:
    medium: Memory              # tmpfs，读写极快；用量计入容器内存 limit
    sizeLimit: 512Mi
```

磁盘介质的 `emptyDir` 存放在节点的 kubelet 根目录下（默认 `/var/lib/kubelet/pods/<uid>/volumes/kubernetes.io~empty-dir/`），与容器可写层、日志共用根盘。`medium: Memory` 则挂载 tmpfs，其容量取节点可分配内存、Pod 内存 limit 总和与 `sizeLimit` 三者中的最小值（`SizeMemoryBackedVolumes`，v1.32 GA）。内存盘的用量**计入容器的内存 cgroup**，写满会导致 OOM 而不是磁盘满，使用时应把它纳入内存 limits 的预算。v1.37 Alpha 的 `InPlacePodVerticalScalingMemoryBackedVolumes` 使 [原地调整](../../pod/in-place-pod-resize) 内存 limit 后 tmpfs 大小也随之更新。

## 通用临时卷

`emptyDir` 的容量受限于节点根盘，也无法从快照初始化。通用临时卷（Generic Ephemeral Volume）让 Pod 以内联方式声明一个 PVC 模板，控制器在 Pod 创建时自动生成 PVC、按 StorageClass 动态供应卷并在 Pod 删除时一并回收：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: trainer
spec:
  containers:
  - name: train
    image: registry.example.com/trainer:1.0
    volumeMounts:
    - name: ckpt
      mountPath: /checkpoints
  volumes:
  - name: ckpt
    ephemeral:
      volumeClaimTemplate:
        metadata:
          labels:
            app: trainer
        spec:
          accessModes: ["ReadWriteOnce"]
          storageClassName: fast-nvme          # 任意支持动态供应的 StorageClass
          resources:
            requests:
              storage: 200Gi
          # dataSource:                        # 可从快照或已有 PVC 初始化
          #   kind: VolumeSnapshot
          #   name: dataset-v3
          #   apiGroup: snapshot.storage.k8s.io
```

自动创建的 PVC 名称为 `<Pod 名>-<卷名>`（此例为 `trainer-ckpt`），`ownerReference` 指向 Pod，因此 Pod 删除时 PVC 被垃圾回收，PV 按 StorageClass 的 `reclaimPolicy` 处理。命名的确定性也带来一个注意点：若命名空间中已存在同名 PVC 且不属于该 Pod，Pod 会一直处于 Pending 并报告冲突，避免误用他人的卷。

通用临时卷与 StatefulSet 的 `volumeClaimTemplates` 形似但语义相反：后者的 PVC 在 Pod 删除后保留，用于有状态副本；前者的 PVC 与 Pod 同生共死。它适合这些场景：

- 需要比节点根盘更大或性能更可控的暂存空间（本地 NVMe StorageClass、云块存储）
- 从数据集快照快速克隆一份可写副本供单次任务使用
- 希望暂存用量由存储后端硬性限制而非依赖驱逐
- 使用 `WaitForFirstConsumer` 绑定模式时，卷与 Pod 自然同区

由于通用临时卷会真实创建 PVC，它受 ResourceQuota 中 `persistentvolumeclaims` 与 `requests.storage` 的约束，且创建 Pod 的用户必须有权创建 PVC——这一点由 API Server 在准入阶段隐式检查。

## CSI 临时卷

CSI 临时卷（CSI Ephemeral / Inline Volume）由支持 `Ephemeral` 生命周期模式的 CSI 驱动直接在节点上创建，不经过 PVC/PV 对象，概念上更接近 `secret`/`configMap`。它主要用于把外部系统的数据以文件形式注入 Pod：

```yaml
volumes:
- name: secrets-store
  csi:
    driver: secrets-store.csi.k8s.io
    readOnly: true
    volumeAttributes:
      secretProviderClass: vault-db-creds     # 由驱动解释的参数
```

常见实现包括 [Secrets Store CSI Driver](https://secrets-store-csi-driver.sigs.k8s.io/)（从 Vault、云 Secrets Manager 挂载密钥）、cert-manager 的 csi-driver（为 Pod 签发证书，与 `podCertificate` 投射卷目标相近）以及部分本地存储驱动。驱动必须在其 `CSIDriver` 对象的 `volumeLifecycleModes` 中声明 `Ephemeral`；由于 `volumeAttributes` 由 Pod 作者任意填写并直接传给特权的驱动进程，Pod 安全标准只在 `baseline`/`restricted` 级别允许 `csi` 卷类型本身，集群管理员应通过 `CSIDriver` 的 `volumeLifecycleModes` 与准入策略限制哪些驱动可以内联使用。

## 本地临时存储资源

`emptyDir`（磁盘介质）、容器可写层与容器日志共同消耗节点的**本地临时存储**（`ephemeral-storage`），Kubernetes 把它作为一种可请求、可限制的资源：

```yaml
containers:
- name: app
  resources:
    requests:
      ephemeral-storage: "2Gi"
    limits:
      ephemeral-storage: "8Gi"
```

调度器按 `requests.ephemeral-storage` 的总和与节点 Allocatable 匹配；kubelet 定期（默认 10 秒）统计每个容器的可写层与日志、每个 Pod 的 `emptyDir` 用量，容器超过 limit 或 Pod 中所有容器 limit 之和被超过时驱逐 Pod（`emptyDir` 的 `sizeLimit` 同理）。由于统计是周期性扫描，短时间内的突发写入可能超过限制后才被发现；开启 `LocalStorageCapacityIsolationFSQuotaMonitoring`（v1.31 起 Beta，默认关闭）可改用 XFS/ext4 项目配额做精确、实时的用量统计。

节点级的磁盘保护则由 [节点压力驱逐](../../cluster/kubelet-resource-management) 的 `nodefs.available`/`imagefs.available` 阈值兜底；若节点为镜像与容器可写层配置了独立磁盘（`KubeletSeparateDiskGC`），`emptyDir` 与日志仍在 nodefs 上统计。命名空间级的总量可通过 ResourceQuota 的 `requests.ephemeral-storage`/`limits.ephemeral-storage` 限制，LimitRange 可为未声明的容器设置默认值。

## 选型建议

{{< table title="临时存储选型" >}}

| 需求 | 推荐 |
|------|------|
| 几百 MB 以内的暂存、容器间共享文件 | `emptyDir` + `sizeLimit` + `ephemeral-storage` limit |
| 低延迟缓存、不希望落盘 | `emptyDir` 的 `medium: Memory`，纳入内存预算 |
| 数十 GB 以上暂存、训练检查点、需要本地 NVMe | 通用临时卷 + 本地或块存储 StorageClass |
| 从数据集快照克隆可写副本 | 通用临时卷 + `dataSource` |
| 只读模型/数据集分发 | `image` 卷 |
| 注入外部密钥、证书 | CSI 临时卷（Secrets Store、cert-manager）或 `projected` 卷 |

{{< /table >}}

## 总结

临时卷覆盖了"数据不需要比 Pod 活得久"的全部场景：`emptyDir` 简单直接但受节点根盘约束，内存介质提供极致性能却占用内存预算，通用临时卷把动态供应与快照能力带入暂存空间并随 Pod 自动回收，CSI 临时卷与投射卷负责注入外部数据。无论选择哪一种，都应为容器声明 `ephemeral-storage` 的 requests/limits 并为 `emptyDir` 设置 `sizeLimit`，让暂存用量成为可调度、可限制、可驱逐的一等资源，而不是悄悄吃光节点磁盘的隐患。

## 参考文献

- [Ephemeral Volumes - kubernetes.io](https://kubernetes.io/docs/concepts/storage/ephemeral-volumes/)
- [Volumes: emptyDir - kubernetes.io](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir)
- [Resource Management for Pods and Containers: Local ephemeral storage - kubernetes.io](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#local-ephemeral-storage)
- [Secrets Store CSI Driver - sigs.k8s.io](https://secrets-store-csi-driver.sigs.k8s.io/)
- [Kubernetes CSI Drivers list - kubernetes-csi.github.io](https://kubernetes-csi.github.io/docs/drivers.html)
