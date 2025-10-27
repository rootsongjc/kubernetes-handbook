---
weight: 60
title: Storage Class
date: 2022-05-21T00:00:00+08:00
description: 介绍 Kubernetes 中 StorageClass 的概念、资源定义、分配器类型、参数配置和使用方法，帮助管理员更好地管理集群存储资源。
lastmod: 2025-10-27T16:52:44.360Z
---

> StorageClass 为 Kubernetes 存储资源管理提供了标准化、自动化和多样化的能力，是实现弹性、分层和高效存储架构的基础。

StorageClass 为管理员提供了描述和管理存储资源的标准化方法。本文将详细介绍 StorageClass 的概念、配置和使用方式。在阅读本文之前，建议先熟悉 [卷](https://kubernetes.io/docs/concepts/storage/volumes) 和 [持久卷](https://kubernetes.io/docs/concepts/storage/persistent-volumes) 的相关概念。

## StorageClass 概述

StorageClass 为管理员提供了描述存储“类”的方法。不同的类可以对应不同的服务质量等级、备份策略、访问模式或地理位置等。Kubernetes 不预设这些类的具体含义，需由集群管理员根据实际需求定义。该机制在其他存储系统中通常被称为“存储配置文件”或“存储策略”。

## StorageClass 资源定义

StorageClass 是集群级别的资源对象，包含多个核心字段。以下为典型配置示例：

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
  annotations:
    storageclass.kubernetes.io/is-default-class: "false"
provisioner: kubernetes.io/gce-pd
parameters:
  type: pd-ssd
  replication-type: regional-pd
reclaimPolicy: Delete
allowVolumeExpansion: true
mountOptions:
  - debug
  - noatime
volumeBindingMode: WaitForFirstConsumer
```

### 核心字段说明

- **metadata.name**：StorageClass 名称，PVC 通过此名称引用
- **provisioner**：指定用于动态创建 PV 的存储分配器
- **parameters**：传递给分配器的参数，因分配器而异
- **reclaimPolicy**：PV 的回收策略，可选 `Delete` 或 `Retain`
- **allowVolumeExpansion**：是否允许卷扩容
- **mountOptions**：卷挂载选项
- **volumeBindingMode**：卷绑定模式

## 存储分配器

存储分配器（Provisioner）决定了如何创建和管理持久卷。Kubernetes 支持内置分配器、CSI 分配器和外部分配器。

### 内置分配器

下表总结了主流云平台的内置分配器类型。

{{< table title="主流云平台内置存储分配器" >}}

| 存储类型 | 分配器名称 | 云平台 |
|---------|-----------|--------|
| AWS EBS | ebs.csi.aws.com | Amazon Web Services |
| GCE PD | pd.csi.storage.gke.io | Google Cloud Platform |
| Azure Disk | disk.csi.azure.com | Microsoft Azure |
| Azure File | file.csi.azure.com | Microsoft Azure |
| vSphere | csi.vsphere.vmware.com | VMware vSphere |

{{< /table >}}

### CSI 分配器

现代 Kubernetes 推荐使用 CSI（Container Storage Interface）分配器，支持更丰富的功能和生态。

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: csi-example
provisioner: example.csi.driver.io
parameters:
  csi.storage.k8s.io/provisioner-secret-name: "csi-secret"
  csi.storage.k8s.io/provisioner-secret-namespace: "default"
  type: "fast"
volumeBindingMode: WaitForFirstConsumer
```

### 外部分配器

对于不支持内置分配器的存储系统，可使用外部分配器：

- NFS 分配器：`nfs-client-provisioner`
- Longhorn：`driver.longhorn.io`
- OpenEBS：`openebs.io/provisioner-iscsi`

## 配置参数详解

StorageClass 支持多种参数配置，提升存储管理灵活性。

### 回收策略（reclaimPolicy）

- **Delete**（默认）：删除 PVC 时自动删除对应 PV 和底层存储
- **Retain**：保留 PV 和数据，需手动清理

```yaml
reclaimPolicy: Retain  # 数据安全优先
```

### 卷绑定模式（volumeBindingMode）

- **Immediate**（默认）：PVC 创建时立即绑定 PV
- **WaitForFirstConsumer**：等待 Pod 调度后再绑定，适用于拓扑感知和本地存储

```yaml
volumeBindingMode: WaitForFirstConsumer
```

### 卷扩容

允许在线扩展持久卷大小：

```yaml
allowVolumeExpansion: true
```

### 挂载选项

指定卷挂载时的选项：

```yaml
mountOptions:
  - noatime
  - nodiratime
  - rsize=1048576
  - wsize=1048576
```

## 默认 StorageClass

集群可设置一个默认 StorageClass，供未指定 `storageClassName` 的 PVC 使用：

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: kubernetes.io/gce-pd
parameters:
  type: pd-standard
```

## 使用示例

以下为 StorageClass 和 PVC 的典型使用方法。

### 创建 StorageClass

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-storage
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-ssd
  disk-encryption-key: "projects/PROJECT_ID/locations/LOCATION/keyRings/RING_NAME/cryptoKeys/KEY_NAME"
reclaimPolicy: Delete
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
```

### 在 PVC 中使用

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: fast-storage
```

## 最佳实践

- **命名规范**：使用描述性名称，如 `ssd-retain`、`hdd-delete`
- **环境区分**：为不同环境创建不同的 StorageClass
- **成本优化**：根据应用需求选择合适的存储类型
- **监控告警**：监控存储使用情况和成本
- **测试验证**：在生产环境使用前充分测试

## 故障排查

常见问题及解决方法：

- **分配失败**：检查分配器是否正确安装和配置
- **挂载失败**：验证挂载选项是否被存储系统支持
- **权限问题**：确认服务账户具有必要的存储权限
- **拓扑约束**：检查节点标签和拓扑域配置

## 总结

StorageClass 为 Kubernetes 存储资源管理提供了标准化、自动化和多样化的能力。通过合理配置分配器、参数和策略，可以实现弹性、高效和安全的存储架构，满足不同业务场景的需求。建议结合实际环境，充分测试和监控存储配置，持续优化集群存储管理。

## 参考文献

- [Kubernetes 官方文档 - Storage Classes](https://kubernetes.io/docs/concepts/storage/storage-classes/)
- [CSI 驱动程序列表 - kubernetes-csi.github.io](https://kubernetes-csi.github.io/docs/drivers.html)
- [持久卷声明 - kubernetes.io](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims)
