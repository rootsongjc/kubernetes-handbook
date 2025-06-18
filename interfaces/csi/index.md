---
weight: 9
title: 容器存储接口（CSI）
date: '2022-05-21T00:00:00+08:00'
type: book
linktitle: CSI
aliases:
- /book/kubernetes-handbook/architecture/open-interfaces/csi/
description: 介绍 Kubernetes 容器存储接口（CSI）的概念、架构、使用方法和最佳实践，包括动态配置、预配置卷和 CSI 驱动程序的开发部署。
keywords:
- csi
- driver
- kubernetes
- persistentvolumeclaim
- volume
- 创建
- 容器
- 插件
- 驱动程序
---

## 什么是 CSI

容器存储接口（Container Storage Interface，CSI）是一个行业标准接口规范，旨在统一容器编排系统（Container Orchestration，CO）与存储系统之间的交互方式。通过 CSI，存储供应商可以开发一次驱动程序，即可在多个容器编排平台上使用，而无需为每个平台单独开发。

CSI 在 Kubernetes 中作为 out-of-tree 插件实现，这意味着存储驱动程序与 Kubernetes 核心代码分离，可以独立开发、测试和部署。

## CSI 发展历程

- **Kubernetes v1.9**：CSI 作为 Alpha 特性引入
- **Kubernetes v1.10**：升级为 Beta 特性
- **Kubernetes v1.13**：CSI 正式 GA（General Availability）
- **当前版本**：CSI 已成为 Kubernetes 存储插件的标准方式

## CSI 架构

CSI 驱动程序通常包含以下组件：

### Controller 组件

- **CSI Controller**：负责卷的生命周期管理（创建、删除、扩容等）
- **External-provisioner**：监听 PVC 事件，触发卷的创建和删除
- **External-attacher**：处理卷的挂载和卸载操作
- **External-resizer**：处理卷的扩容操作

### Node 组件  

- **CSI Node**：在每个节点上运行，负责卷的挂载到具体路径
- **Node-driver-registrar**：向 kubelet 注册 CSI 驱动程序

## CSI 持久化卷字段

CSI 持久化卷支持以下关键字段：

- **`driver`**：指定 CSI 驱动程序名称（必填，最多 63 个字符）
- **`volumeHandle`**：唯一标识卷的句柄，由 `CreateVolume` 调用返回
- **`readOnly`**：指示卷是否为只读模式（可选，默认为 false）
- **`fsType`**：文件系统类型（可选）
- **`volumeAttributes`**：传递给驱动程序的额外参数

## 使用 CSI

### 动态配置

通过 StorageClass 实现卷的动态创建：

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd-storage
provisioner: csi.example.com
parameters:
  type: ssd
  replication: "3"
  fsType: ext4
allowVolumeExpansion: true
reclaimPolicy: Delete
```

创建 PVC 触发动态配置：

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-storage-claim
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: fast-ssd-storage
```

### 静态配置

手动创建 PV 来使用已存在的卷：

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: existing-volume-pv
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  csi:
    driver: csi.example.com
    volumeHandle: existing-volume-id
    readOnly: false
    fsType: ext4
    volumeAttributes:
      storage.kubernetes.io/csiProvisionerIdentity: csi.example.com
```

### Pod 中使用 CSI 卷

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app-container
    image: nginx:1.20
    volumeMounts:
    - name: app-storage
      mountPath: /data
  volumes:
  - name: app-storage
    persistentVolumeClaim:
      claimName: app-storage-claim
```

## 开发 CSI 驱动程序

### 实现 CSI 接口

CSI 驱动程序需要实现三个主要接口：

1. **Identity Service**：提供驱动程序身份信息
2. **Controller Service**：管理卷的生命周期
3. **Node Service**：处理节点级别的卷操作

### 推荐的 Sidecar 容器

Kubernetes 社区提供了以下 sidecar 容器来简化 CSI 驱动程序的开发：

| Sidecar 容器 | 功能描述 |
|-------------|----------|
| **external-provisioner** | 监听 PVC 事件，调用 `CreateVolume`/`DeleteVolume` |
| **external-attacher** | 监听 VolumeAttachment 事件，调用 `ControllerPublishVolume`/`ControllerUnpublishVolume` |
| **external-resizer** | 处理 PVC 扩容请求，调用 `ControllerExpandVolume` |
| **external-snapshotter** | 管理卷快照功能 |
| **node-driver-registrar** | 向 kubelet 注册 CSI 驱动程序 |
| **livenessprobe** | 监控 CSI 驱动程序健康状态 |

### 部署最佳实践

1. **使用 DaemonSet 部署 Node 组件**：确保每个节点都有 CSI Node 服务
2. **使用 StatefulSet 或 Deployment 部署 Controller 组件**：通常只需要一个或少数几个副本
3. **配置适当的 RBAC 权限**：确保 sidecar 容器有足够的权限操作 Kubernetes 资源
4. **实现健康检查**：使用 liveness 和 readiness 探针确保服务可用性

## CSI 功能特性

### 卷快照

CSI 支持卷快照功能，允许用户创建卷的时间点副本：

```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: my-snapshot
spec:
  volumeSnapshotClassName: csi-snapclass
  source:
    persistentVolumeClaimName: app-storage-claim
```

### 卷克隆

从现有 PVC 克隆新的卷：

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: cloned-pvc
spec:
  dataSource:
    name: app-storage-claim
    kind: PersistentVolumeClaim
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

### 卷扩容

支持在线扩容已挂载的卷：

```yaml
# 修改 PVC 的存储请求大小
spec:
  resources:
    requests:
      storage: 20Gi  # 从 10Gi 扩容到 20Gi
```

## 故障排查

### 常见问题

1. **驱动程序注册失败**：检查 node-driver-registrar 日志
2. **卷挂载失败**：查看 CSI driver 和 kubelet 日志
3. **动态配置失败**：检查 external-provisioner 和 StorageClass 配置

### 调试命令

```bash
# 查看 CSI 驱动程序状态
kubectl get csidrivers

# 查看 CSI 节点信息
kubectl get csinodes

# 查看卷挂载状态
kubectl get volumeattachments

# 查看存储类
kubectl get storageclass
```

## 参考资源

- [CSI 规范文档](https://github.com/container-storage-interface/spec)
- [Kubernetes CSI 文档](https://kubernetes-csi.github.io/docs/)
- [CSI Sidecar 容器](https://github.com/kubernetes-csi)
- [CSI 驱动程序示例](https://github.com/kubernetes-csi/drivers)
