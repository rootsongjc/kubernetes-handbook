---
weight: 59
linktitle: 持久化卷
title: 持久化卷（Persistent Volume）
date: '2022-05-21T00:00:00+08:00'
type: book
description: 'Kubernetes 持久化卷详解：深入介绍 PersistentVolume (PV) 和 PersistentVolumeClaim (PVC) 的核心概念、生命周期管理、配置方法和使用方式，涵盖静态和动态配置、存储类、访问模式、回收策略等关键特性，并提供最佳实践指南。'
keywords:
- persistentvolume
- pv
- pvc
- 声明
- 挂载
- 插件
- 用户
- 绑定
- 集群
- 存储
---

Kubernetes 持久化卷（PersistentVolume）子系统为用户和管理员提供了一套完整的 API，将存储的实现细节从使用方式中抽象出来，实现了存储资源的统一管理。本文详细介绍 PV 和 PVC 的核心概念、生命周期管理以及在生产环境中的最佳实践。

## 核心概念

存储资源的管理与计算资源管理存在本质差异。Kubernetes 通过引入三个关键的 API 资源来解决这个挑战：

### PersistentVolume (PV)

集群管理员预先配置或动态创建的存储资源，是集群基础设施的一部分。PV 具有独立于 Pod 的生命周期，封装了底层存储实现的具体细节（如 NFS、iSCSI、云存储等）。

### PersistentVolumeClaim (PVC)

用户对存储资源的请求声明。类似于 Pod 消耗节点资源，PVC 消耗 PV 资源。用户通过 PVC 请求特定大小和访问模式的存储，无需了解底层存储实现。

### StorageClass

为了满足用户对不同性能和特性存储的需求，StorageClass 提供了一种描述存储"类别"的机制。它支持动态配置、不同的服务质量级别，并可定义配置参数和回收策略。

## 生命周期管理

PV 和 PVC 遵循标准的生命周期流程：

### 配置阶段（Provisioning）

#### 静态配置

集群管理员预先创建一组 PV 资源池，这些 PV 包含实际存储的详细信息，供集群用户按需使用。适用于已有存储基础设施的场景。

#### 动态配置

当现有静态 PV 无法满足 PVC 需求时，集群根据 StorageClass 配置自动创建匹配的 PV。这种方式提供了更好的灵活性和自动化程度。

### 绑定阶段（Binding）

控制平面持续监控新创建的 PVC，寻找匹配的 PV 并建立绑定关系。绑定是一对一的排他性关系，确保数据安全。未找到匹配 PV 的 PVC 将保持 Pending 状态。

绑定匹配条件包括：

- 存储容量满足需求
- 访问模式兼容
- StorageClass 匹配
- 标签选择器匹配

### 使用阶段（Using）

Pod 通过在 volume 配置中引用 PVC 来使用持久化存储。集群调度器确保 Pod 被调度到能访问对应存储的节点上，kubelet 负责挂载存储卷。

### 存储对象保护

启用存储对象保护后：

- 正在使用的 PVC 不会被立即删除
- 绑定到 PVC 的 PV 受到保护
- 删除操作将延迟到资源不再被使用时执行

### 回收阶段（Reclaiming）

当 PVC 被删除后，PV 根据其回收策略进行处理：

- **Retain（保留）**：保留 PV 和数据，需要管理员手动处理
- **Delete（删除）**：自动删除 PV 和底层存储资源（推荐用于动态配置）
- **Recycle（回收）**：已废弃，使用动态配置替代

## PersistentVolume 配置详解

### 基础配置示例

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-nfs-example
  labels:
    type: nfs
    environment: production
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  storageClassName: nfs-storage
  mountOptions:
    - hard
    - nfsvers=4.1
    - rsize=1048576
    - wsize=1048576
  nfs:
    path: /data/kubernetes
    server: nfs.example.com
```

### 核心属性详解

#### 存储容量（Capacity）

定义 PV 的存储容量，使用标准 Kubernetes 资源单位。目前主要支持存储大小配置，未来可能扩展支持 IOPS、吞吐量等属性。

#### 访问模式（Access Modes）

定义 PV 的访问方式：

| 模式 | 简写 | 描述 | 使用场景 |
|------|------|------|----------|
| ReadWriteOnce | RWO | 单节点读写 | 数据库、文件系统 |
| ReadOnlyMany | ROX | 多节点只读 | 配置文件、静态资源 |
| ReadWriteMany | RWX | 多节点读写 | 共享文件系统 |
| ReadWriteOncePod | RWOP | 单 Pod 读写 | 1.22+ 版本支持 |

#### 卷模式（Volume Mode）

- **Filesystem**：以文件系统方式挂载（默认）
- **Block**：以原始块设备方式使用，提供更高性能

#### 节点亲和性（Node Affinity）

限制 PV 可以挂载的节点范围：

```yaml
nodeAffinity:
  required:
    nodeSelectorTerms:
    - matchExpressions:
      - key: kubernetes.io/os
        operator: In
        values: ["linux"]
```

## PersistentVolumeClaim 配置详解

### 基础配置示例

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: web-storage-claim
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce
  volumeMode: Filesystem
  resources:
    requests:
      storage: 8Gi
    limits:
      storage: 10Gi
  storageClassName: fast-ssd
  selector:
    matchLabels:
      environment: production
    matchExpressions:
      - key: type
        operator: In
        values: [ssd, nvme]
```

### 资源配置

支持请求和限制配置：

- **requests**：最小存储需求
- **limits**：最大存储限制（某些存储类型支持）

### 选择器配置

通过标签选择器精确匹配符合条件的 PV：

```yaml
selector:
  matchLabels:
    environment: production
    tier: frontend
  matchExpressions:
    - key: type
      operator: NotIn
      values: [slow-disk]
```

## Pod 中使用持久化存储

### 文件系统模式使用

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-server
spec:
  containers:
  - name: nginx
    image: nginx:1.21
    volumeMounts:
    - name: web-content
      mountPath: /usr/share/nginx/html
      readOnly: false
    - name: nginx-config
      mountPath: /etc/nginx/conf.d
      readOnly: true
  volumes:
  - name: web-content
    persistentVolumeClaim:
      claimName: web-storage-claim
  - name: nginx-config
    persistentVolumeClaim:
      claimName: nginx-config-claim
```

### 块设备模式使用

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: database-pod
spec:
  containers:
  - name: database
    image: postgres:13
    volumeDevices:
    - name: db-storage
      devicePath: /dev/block-device
    env:
    - name: PGDATA
      value: /dev/block-device
  volumes:
  - name: db-storage
    persistentVolumeClaim:
      claimName: database-block-claim
```

## StorageClass 配置

### 基础 StorageClass 示例

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
  annotations:
    storageclass.kubernetes.io/is-default-class: "false"
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
  encrypted: "true"
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
reclaimPolicy: Delete
mountOptions:
  - debug
  - noatime
```

### 卷绑定模式

- **Immediate**：PVC 创建时立即绑定 PV
- **WaitForFirstConsumer**：等待 Pod 调度后再绑定（推荐）

## 主流存储插件支持

### 云原生存储

**AWS**：

- EBS：高性能块存储
- EFS：托管文件系统
- FSx：高性能文件系统

**Google Cloud**：

- Persistent Disk：块存储
- Filestore：托管 NFS

**Azure**：

- Disk：托管磁盘
- Files：托管文件共享

### 企业存储解决方案

**开源方案**：

- Ceph：统一存储平台
- GlusterFS：分布式文件系统
- OpenEBS：容器原生存储
- Longhorn：轻量级分布式存储

**商业方案**：

- NetApp Trident
- Pure Storage
- VMware vSAN
- Dell EMC

### 存储类型访问模式支持矩阵

| 存储类型 | RWO | ROX | RWX | RWOP |
|---------|-----|-----|-----|------|
| AWS EBS | ✓ | - | - | ✓ |
| Azure Disk | ✓ | - | - | ✓ |
| Google PD | ✓ | ✓ | - | ✓ |
| NFS | ✓ | ✓ | ✓ | ✓ |
| Ceph RBD | ✓ | ✓ | - | ✓ |
| CephFS | ✓ | ✓ | ✓ | ✓ |
| GlusterFS | ✓ | ✓ | ✓ | ✓ |

## 卷扩展

### 启用卷扩展

在 StorageClass 中启用：

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: expandable-storage
provisioner: ebs.csi.aws.com
allowVolumeExpansion: true
parameters:
  type: gp3
  encrypted: "true"
```

### 扩展 PVC

直接编辑 PVC 的存储请求：

```yaml
spec:
  resources:
    requests:
      storage: 20Gi  # 从 10Gi 扩展到 20Gi
```

### 扩展限制

- 只能增加容量，不能减少
- 某些存储类型需要 Pod 重启才能识别新容量
- 文件系统扩展可能需要额外时间

## 监控和故障排查

### 关键监控指标

- PV/PVC 绑定状态
- 存储容量使用率
- I/O 性能指标
- 挂载/卸载延迟

### 常见问题排查

#### PVC 无法绑定

```bash
# 检查 PVC 状态
kubectl describe pvc <pvc-name>

# 查看可用 PV
kubectl get pv --show-labels

# 检查 StorageClass
kubectl describe storageclass <class-name>
```

#### Pod 无法启动

```bash
# 检查 Pod 事件
kubectl describe pod <pod-name>

# 查看 PVC 状态
kubectl get pvc -o wide

# 检查节点存储插件状态
kubectl get pods -n kube-system | grep csi
```

## 生产环境最佳实践

### 设计原则

1. **分层存储策略**：为不同工作负载配置相应的 StorageClass
2. **资源配额管理**：设置合理的存储配额和限制
3. **备份策略**：制定数据备份和恢复计划
4. **性能优化**：选择合适的存储类型和配置参数

### 配置建议

1. **使用标签和注解**：便于管理和自动化
2. **设置适当的回收策略**：根据数据重要性选择
3. **启用存储加密**：保护敏感数据
4. **监控存储使用情况**：避免容量不足

### 安全考虑

- 使用 RBAC 控制存储资源访问
- 启用存储加密和传输加密
- 定期备份重要数据
- 审计存储资源使用情况

### 成本优化

- 选择合适的存储类型和性能级别
- 启用卷扩展避免过度配置
- 定期清理未使用的 PV
- 使用存储生命周期管理

通过合理配置和使用 Kubernetes 持久化卷，可以为应用提供可靠、高性能的存储服务，同时简化存储管理复杂性，提高运维效率。
