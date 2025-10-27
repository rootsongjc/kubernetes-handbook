---
weight: 58
title: Volume
date: 2022-05-21T00:00:00+08:00
type: book
description: 本文详细介绍 Kubernetes Volume 的概念、类型和使用方法，包括各种存储卷类型的配置示例、挂载传播、subPath 等高级特性，以及最佳实践和使用场景。
lastmod: 2025-10-27T17:09:43.574Z
---

> Kubernetes Volume（卷）为容器提供持久化和共享存储能力，是实现数据持久化、配置注入和多容器协作的核心机制。合理选择和使用卷类型，是保障应用高可用与数据安全的关键。

## 概述

在容器化环境下，文件默认存储于临时磁盘，这会带来如下挑战：

1. **容器崩溃时文件丢失**：当容器崩溃并被 kubelet 重启时，容器内的文件会丢失，因为容器会以全新状态启动。
2. **Pod 内多容器文件共享**：同一 Pod 内的多个容器需要共享文件时，临时存储无法满足需求。

为了解决这些问题，Kubernetes 引入了 Volume（卷）的概念。虽然 Docker 也有 [volume](https://docs.docker.com/storage/volumes/)（卷），但其管理和生命周期与 Kubernetes 有所不同。在 Kubernetes 中，卷的生命周期与 Pod 一致，且支持多种类型，能够满足不同场景下的存储需求。

卷本质上是一个目录，可能包含数据，Pod 内的容器可以访问。卷的实现方式、底层介质和内容取决于具体类型。要在 Pod 中使用卷，需要在 `spec.volumes` 字段声明卷，并在 `spec.containers[].volumeMounts` 字段指定挂载路径。

容器进程看到的文件系统由镜像和挂载的卷组成。卷无法相互嵌套挂载，每个容器需独立声明挂载路径。

## 卷的类型

Kubernetes 支持多种卷类型，适用于不同的存储场景：

- **临时卷类型**：`emptyDir`、`configMap`、`downwardAPI`、`secret`、`projected`
- **持久卷类型**：`persistentVolumeClaim`、`local`、`hostPath`
- **网络存储卷类型**：`nfs`、`cephfs`、`glusterfs`、`iscsi`、`fc`
- **云存储卷类型**：`awsElasticBlockStore`、`azureDisk`、`azureFile`、`gcePersistentDisk`、`vsphereVolume`
- **特殊用途卷类型**：`csi`、`gitRepo`（已弃用）

**注意**：部分卷类型（如 `gitRepo`、`flocker`、`quobyte`、`storageos`）已被弃用，建议优先使用 CSI 驱动或主流存储方案。

## 常用卷类型详解

在实际应用中，以下几类卷最为常见。下面分别介绍其原理、适用场景及配置示例。

### emptyDir

`emptyDir` 卷在 Pod 分配到节点时创建，Pod 运行期间一直存在。最初为空，Pod 内所有容器可读写该卷。Pod 从节点移除时，卷数据被删除。

**应用场景**：

- 临时缓存空间（如磁盘排序）
- 崩溃恢复检查点
- 多容器间数据共享

**注意**：容器崩溃不会导致 `emptyDir` 数据丢失，只有 Pod 被移除才会清空。

**示例配置**：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: test-pd
spec:
  containers:
  - image: nginx:1.20
    name: test-container
    volumeMounts:
    - mountPath: /cache
      name: cache-volume
  volumes:
  - name: cache-volume
    emptyDir: {}
```

### configMap

`configMap` 卷用于将配置信息注入 Pod。ConfigMap 中的数据可作为文件挂载到容器，便于应用读取。

**示例配置**：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: configmap-pod
spec:
  containers:
  - name: test-container
    image: nginx:1.20
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
  volumes:
  - name: config-volume
    configMap:
      name: my-config
```

### secret

`secret` 卷用于传递敏感信息（如密码、密钥）。Secret 数据以文件形式挂载，底层由 tmpfs（内存文件系统）支持，避免写入磁盘。

**重要提示**：需先在 Kubernetes API 创建 Secret 资源。

**示例配置**：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-pod
spec:
  containers:
  - name: test-container
    image: nginx:1.20
    volumeMounts:
    - name: secret-volume
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secret-volume
    secret:
      secretName: my-secret
```

### persistentVolumeClaim

`persistentVolumeClaim`（PVC）卷用于将 [PersistentVolume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) 挂载到容器，实现数据持久化。PVC 屏蔽了底层存储细节，便于跨平台迁移。

**示例配置**：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pvc-pod
spec:
  containers:
  - name: test-container
    image: nginx:1.20
    volumeMounts:
    - mountPath: /data
      name: storage-volume
  volumes:
  - name: storage-volume
    persistentVolumeClaim:
      claimName: my-pvc
```

### hostPath

`hostPath` 卷将主机节点的文件或目录挂载到 Pod。适用于需要直接访问主机资源的场景，但存在安全风险。

**常见用途**：

- 访问主机 Docker 目录（如 `/var/lib/docker`）
- 运行 cAdvisor 监控（如挂载 `/sys`）

在 `hostPath` 卷中，可通过 `type` 字段指定挂载路径类型。下表对各类型进行说明：

{{< table title="hostPath type 字段取值说明" >}}

| 值                   | 行为说明                                                                 |
|----------------------|--------------------------------------------------------------------------|
| 空字符串（默认）     | 不做检查，直接挂载                                                      |
| DirectoryOrCreate    | 路径不存在则创建空目录，权限 0755                                       |
| Directory            | 路径必须为已存在目录                                                    |
| FileOrCreate         | 路径不存在则创建空文件，权限 0644                                       |
| File                 | 路径必须为已存在文件                                                    |
| Socket               | 路径必须为已存在 UNIX 套接字                                            |
| CharDevice           | 路径必须为已存在字符设备                                                |
| BlockDevice          | 路径必须为已存在块设备                                                  |

{{< /table >}}

**注意事项**：

- 不同节点的主机文件不同，Pod 行为可能不一致
- 主机文件通常需 root 权限写入
- 建议仅在特权容器或必要场景下使用

**示例配置**：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hostpath-pod
spec:
  containers:
  - image: nginx:1.20
    name: test-container
    volumeMounts:
    - mountPath: /test-pd
      name: test-volume
  volumes:
  - name: test-volume
    hostPath:
      path: /data
      type: Directory
```

### nfs

`nfs` 卷支持将 NFS（网络文件系统）共享挂载到 Pod，实现多 Pod 共享数据。NFS 卷内容不会因 Pod 删除而丢失。

**前提**：需先搭建 NFS 服务器。

**示例配置**：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nfs-pod
spec:
  containers:
  - name: test-container
    image: nginx:1.20
    volumeMounts:
    - mountPath: /data
      name: nfs-volume
  volumes:
  - name: nfs-volume
    nfs:
      server: nfs-server.example.com
      path: /path/to/share
```

### csi

CSI（Container Storage Interface）是容器存储接口标准，支持第三方存储插件。通过 CSI 卷，Pod 可使用任意符合规范的存储驱动。

**示例配置**：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: csi-pod
spec:
  containers:
  - name: test-container
    image: nginx:1.20
    volumeMounts:
    - mountPath: /data
      name: csi-volume
  volumes:
  - name: csi-volume
    csi:
      driver: my-csi-driver
      volumeAttributes:
        storage.kubernetes.io/csiProvisionerIdentity: my-provisioner
```

## 使用 subPath

有时需在同一卷中为不同用途分配子目录。`volumeMounts.subPath` 属性可指定挂载卷的子路径。

以下为 LAMP 堆栈（Linux Apache MySQL PHP）示例，分别将 html 和 mysql 目录挂载到不同容器：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-lamp-site
spec:
  containers:
  - name: mysql
    image: mysql:8.0
    env:
    - name: MYSQL_ROOT_PASSWORD
      value: "rootpasswd" 
    volumeMounts:
    - mountPath: /var/lib/mysql
      name: site-data
      subPath: mysql
  - name: php
    image: php:8.0-apache
    volumeMounts:
    - mountPath: /var/www/html
      name: site-data
      subPath: html
  volumes:
  - name: site-data
    persistentVolumeClaim:
      claimName: my-lamp-site-data
```

## 动态子路径

Kubernetes 支持通过 `subPathExpr` 字段结合环境变量动态生成子路径，适用于按 Pod 名称等属性区分目录的场景。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-with-dynamic-subpath
spec:
  containers:
  - name: test-container
    image: nginx:1.20
    env:
    - name: POD_NAME
      valueFrom:
        fieldRef:
          fieldPath: metadata.name
    volumeMounts:
    - mountPath: /data
      name: storage-volume
      subPathExpr: $(POD_NAME)
  volumes:
  - name: storage-volume
    persistentVolumeClaim:
      claimName: my-storage
```

## projected 卷

`projected` 卷可将多种卷源（如 `secret`、`downwardAPI`、`configMap`、`serviceAccountToken`）合并挂载到同一目录，便于统一管理。

**示例配置**：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: projected-pod
spec:
  containers:
  - name: test-container
    image: busybox:1.35
    volumeMounts:
    - name: all-in-one
      mountPath: "/projected-volume"
      readOnly: true
  volumes:
  - name: all-in-one
    projected:
      sources:
      - secret:
          name: mysecret
          items:
          - key: username
            path: my-group/my-username
      - downwardAPI:
          items:
          - path: "labels"
            fieldRef:
              fieldPath: metadata.labels
      - configMap:
          name: myconfigmap
          items:
          - key: config
            path: my-group/my-config
```

## 挂载传播

挂载传播（mount propagation）允许容器间或 Pod 间共享挂载的卷。通过 `volumeMounts.mountPropagation` 字段配置：

- `None`：不接收后续挂载（默认）
- `HostToContainer`：接收主机到容器的挂载
- `Bidirectional`：双向传播，需特权容器

**注意**：双向传播有安全风险，仅限特权容器。

**示例配置**：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mount-propagation-pod
spec:
  containers:
  - name: test-container
    image: busybox:1.35
    volumeMounts:
    - mountPath: /mnt
      name: host-volume
      mountPropagation: HostToContainer
  volumes:
  - name: host-volume
    hostPath:
      path: /mnt/shared
```

## 资源限制

对于 `emptyDir` 卷，可通过 `sizeLimit` 字段限制最大空间，防止资源滥用。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: emptydir-with-limit
spec:
  containers:
  - name: test-container
    image: nginx:1.20
    volumeMounts:
    - mountPath: /cache
      name: cache-volume
  volumes:
  - name: cache-volume
    emptyDir:
      sizeLimit: 1Gi
```

## 最佳实践

在实际生产环境中，建议遵循以下最佳实践：

{{< table title="Kubernetes Volume 使用最佳实践" >}}

| 最佳实践类别           | 建议与说明                                 | 具体举例                |
|------------------------|--------------------------------------------|-------------------------|
| 选择合适的卷类型       | 临时数据                                   | `emptyDir`              |
|                        | 持久化数据                                 | `persistentVolumeClaim` |
|                        | 配置数据                                   | `configMap`             |
|                        | 敏感数据                                   | `secret`                |
| 安全考虑               | 避免不必要的 `hostPath` 挂载               | —                       |
|                        | 使用 `readOnly` 防止误修改                 | —                       |
|                        | 对敏感数据设置访问控制                     | —                       |
| 性能优化               | 选择合适的存储介质（SSD/HDD）              | —                       |
|                        | 考虑数据本地性与网络延迟                   | —                       |
|                        | 选用合适的文件系统类型                     | —                       |
| 备份与恢复             | 制定数据备份策略                           | —                       |
|                        | 定期测试恢复流程                           | —                       |
|                        | 利用快照功能（如支持）                     | —                       |

{{< /table >}}

## 总结

Kubernetes Volume 提供了丰富的存储类型和灵活的挂载方式，满足了容器化应用对数据持久化、配置管理和多容器协作的多样需求。合理选择卷类型、规范配置和关注安全性能，是保障云原生应用高可用和数据安全的基础。建议结合实际业务场景，充分利用 Kubernetes 的存储能力，提升系统的可靠性与可维护性。

## 参考文献

- [Volumes - kubernetes.io](https://kubernetes.io/docs/concepts/storage/volumes/)
- [Persistent Volumes - kubernetes.io](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [Configure a Pod to Use a PersistentVolume for Storage - kubernetes.io](https://kubernetes.io/docs/tasks/configure-pod-container/configure-persistent-volume-storage/)
