---
weight: 61
title: 本地持久化存储
date: '2022-05-21T00:00:00+08:00'
type: book
description: 了解如何在 Kubernetes 中配置和使用本地持久化存储，包括静态配置器的部署、PV/PVC 的创建以及最佳实践指南。
keywords:
- kubernetes
- pv
- pvc
- 本地存储
- 持久化卷
- 静态配置器
- 存储类
---

本地持久化卷允许用户通过标准 PVC 接口以简单便携的方式访问本地存储。PV 中包含系统用于将 Pod 调度到正确节点的节点亲和性信息。

本地存储与传统网络存储不同，它提供了更好的性能但需要特殊的管理方式。外部静态配置器（provisioner）可用于帮助简化本地存储管理，但它不支持动态配置，需要管理员预先在每个节点上配置本地卷。

## 存储模式

本地存储配置器支持两种卷模式：

1. **Filesystem volumeMode**（默认）—— 将卷挂载到发现目录下作为文件系统使用
2. **Block volumeMode** —— 在发现目录下为节点上的块设备创建符号链接，提供原始块设备访问

## 配置要求

使用本地持久化存储需要满足以下要求：

- **路径稳定性**：本地卷插件要求路径在重启和磁盘变更时保持稳定
- **发现机制**：静态配置器只能发现挂载点（文件系统模式）或符号链接（块模式）
- **绑定要求**：基于目录的本地卷必须绑定挂载到发现目录中

## 版本兼容性

不同版本的配置器与 Kubernetes 版本的兼容性：

| 配置器版本 | Kubernetes 版本 | 主要特性 |
|-----------|----------------|----------|
| 2.3.0+ | 1.14+ | 稳定版 API，完整功能支持 |
| 2.1.0 | 1.10 | Beta API 默认启用，支持块存储 |
| 2.0.0 | 1.8, 1.9 | 挂载传播支持 |
| 1.0.1 | 1.7 | 初始 Alpha 版本 |

## 功能发展历程

### 当前状态（1.14+）：稳定版

- 本地持久化卷已进入稳定版（GA）
- `PV.NodeAffinity` 字段正式可用
- 完整支持原始块设备
- `volumeBindingMode` 特性稳定

### 历史版本特性

**1.10 版本（Beta）**：

- 引入新的 `PV.NodeAffinity` 字段
- 弃用 Alpha 版本的 NodeAffinity annotation
- Alpha 支持原始块设备

**1.9 版本（Alpha）**：

- 新增 StorageClass `volumeBindingMode` 参数，支持延迟绑定

**1.7 版本（Alpha）**：

- 引入 `local` PersistentVolume 源
- 支持具有节点亲和性的目录或挂载点

## 部署指南

### 环境准备

#### 功能特性启用

对于 Kubernetes 1.14+ 版本，本地持久化存储已默认启用。如需使用原始块设备功能：

```bash
# 对于较旧版本可能需要启用特性门控
export KUBE_FEATURE_GATES="BlockVolume=true"
```

#### 集群环境配置

**生产环境部署**：

1. 根据应用需求对每个节点的磁盘进行分区和格式化
2. 将所有文件系统挂载到相同的发现目录下
3. 确保调度器启用了相应的调度策略：

- Kubernetes 1.9+：`VolumeBindingChecker`
- Kubernetes 1.9 之前：`NoVolumeBindConflict`

**测试环境配置**：

创建模拟的本地卷用于测试：

```bash
# 创建发现目录
mkdir /mnt/disks

# 创建多个测试卷（使用 tmpfs 模拟）
for vol in vol1 vol2 vol3; do
   mkdir /mnt/disks/$vol
   mount -t tmpfs $vol /mnt/disks/$vol
done
```

### StorageClass 配置

创建支持延迟绑定的 StorageClass：

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Delete
```

`WaitForFirstConsumer` 模式确保 PVC 绑定会延迟到 Pod 被调度时，这对于本地存储至关重要。

### 静态配置器部署

#### 使用 Helm 部署（推荐）

1. 生成配置器规范：

```bash
# 使用默认配置
helm template local-volume-provisioner \
  --namespace kube-system \
  ./helm/provisioner > provisioner.yaml

# 或使用自定义配置
helm template local-volume-provisioner \
  --namespace kube-system \
  --values custom-values.yaml \
  ./helm/provisioner > provisioner.yaml
```

2. 部署配置器：

```bash
kubectl apply -f provisioner.yaml
```

#### 手动配置部署

创建配置器的 ConfigMap：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: local-provisioner-config
  namespace: kube-system
data:
  storageClassMap: |
   local-storage:
     hostDir: /mnt/disks
     mountDir: /mnt/disks
```

### PV 创建验证

部署配置器后，检查自动发现的本地卷：

```bash
# 查看创建的 PV
kubectl get pv

# 查看 PV 详细信息
kubectl describe pv <pv-name>
```

成功创建的 PV 示例：

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: local-pv-node1-vol1
spec:
  capacity:
   storage: 10Gi
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
   path: /mnt/disks/vol1
  nodeAffinity:
   required:
    nodeSelectorTerms:
    - matchExpressions:
      - key: kubernetes.io/hostname
       operator: In
       values:
       - node1
```

## 使用示例

### 创建 PVC

**文件系统模式 PVC**：

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: local-storage-claim
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: local-storage
  resources:
   requests:
    storage: 5Gi
```

**块设备模式 PVC**：

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: local-block-claim
spec:
  accessModes:
  - ReadWriteOnce
  volumeMode: Block
  storageClassName: local-storage
  resources:
   requests:
    storage: 5Gi
```

### Pod 中使用本地存储

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: local-storage-pod
spec:
  containers:
  - name: app
   image: nginx
   volumeMounts:
   - name: local-vol
    mountPath: /usr/share/nginx/html
  volumes:
  - name: local-vol
   persistentVolumeClaim:
    claimName: local-storage-claim
```

## 最佳实践

### 性能优化

- **IO 隔离**：建议每个卷使用独立的物理磁盘以获得最佳 IO 性能
- **容量规划**：使用单个分区进行容量隔离，避免多个应用竞争同一磁盘空间
- **文件系统选择**：根据工作负载特性选择合适的文件系统（ext4、xfs 等）

### 高可用性配置

- **UUID 标识**：对于文件系统卷，在 fstab 和目录名中使用 UUID 标识：

  ```bash
  # 查看磁盘 UUID
  ls -l /dev/disk/by-uuid
  
  # fstab 示例
  UUID=12345678-1234-1234-1234-123456789012 /mnt/disks/vol1 ext4 defaults 0 2
  ```

- **符号链接管理**：对于块设备卷，使用唯一 ID 作为符号链接名称：

  ```bash
  # 基于硬件序列号创建符号链接
  ln -s /dev/sda1 /mnt/disks/disk-serial-ABC123
  ```

### 节点管理

- **节点替换**：避免在旧 PV 仍然存在时重新创建同名节点
- **磁盘热插拔**：确保磁盘路径在热插拔操作后保持稳定
- **监控告警**：设置磁盘空间和健康状态监控

## 生命周期管理

### 卷回收流程

当需要停用本地卷时，按以下顺序操作：

1. **停止应用**：确保所有使用该卷的 Pod 已停止
2. **删除 PVC**：删除 PersistentVolumeClaim

  ```bash
  kubectl delete pvc local-storage-claim
  ```

3. **物理移除**：从节点卸载或移除物理卷
4. **清理 PV**：手动删除对应的 PersistentVolume

  ```bash
  kubectl delete pv local-pv-name
  ```

### 故障恢复

**磁盘故障处理**：

- 及时更换故障磁盘
- 更新节点上的挂载配置
- 重新创建相应的 PV

**数据迁移**：

- 本地存储不支持自动迁移
- 需要应用层面实现数据备份和恢复
- 考虑使用多副本或分布式存储架构

## 监控和故障排除

### 常用监控指标

- 磁盘使用率和 IOPS
- PV 绑定状态
- Pod 调度成功率
- 存储配置器运行状态

### 故障排除步骤

1. **检查配置器状态**：

  ```bash
  kubectl logs -n kube-system -l app=local-volume-provisioner
  ```

2. **验证节点亲和性**：

  ```bash
  kubectl describe pv <pv-name> | grep -A 10 NodeAffinity
  ```

3. **检查 StorageClass 配置**：

  ```bash
  kubectl describe storageclass local-storage
  ```

## 参考资源

- [Kubernetes 本地持久化卷官方文档](https://kubernetes.io/docs/concepts/storage/volumes/#local)
- [外部存储配置器项目](https://github.com/kubernetes-sigs/sig-storage-local-static-provisioner)
- [本地存储最佳实践指南](https://kubernetes.io/blog/2019/04/04/kubernetes-1.14-local-persistent-volumes-ga/)
