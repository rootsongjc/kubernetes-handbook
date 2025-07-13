---
weight: 58
title: Volume
date: '2022-05-21T00:00:00+08:00'
type: book
description: 本文详细介绍 Kubernetes Volume 的概念、类型和使用方法，包括各种存储卷类型的配置示例、挂载传播、subPath 等高级特性，以及最佳实践和使用场景。
keywords:
- emptydir
- kubernetes
- pod
- volume
- 存储
- 挂载
- 容器
- 持久化
- 存储卷
---

## 概述

容器中的文件在磁盘上是临时存放的，这给容器中运行的应用带来一些问题：

1. **容器崩溃时文件丢失**：当容器崩溃时，kubelet 会重新启动容器，但容器中的文件将会丢失——因为容器会以干净的状态重新启动
2. **Pod 中容器间文件共享**：当在一个 Pod 中同时运行多个容器时，容器间需要共享文件

Docker 中也有一个 [volume](https://docs.docker.com/storage/volumes/) 的概念，尽管它稍微宽松一些，管理也很少。在 Docker 中，卷就像是磁盘或是另一个容器中的一个目录。它的生命周期不受管理，直到最近才有了本地磁盘支持的卷。Docker 现在提供了卷驱动程序，但是功能还比较有限。

另一方面，Kubernetes 中的卷有明确的寿命——与封装它的 Pod 相同。所以，卷的生命周期比 Pod 中的所有容器都长，当这个容器重启时数据仍然得以保存。当然，当 Pod 不再存在时，卷也将不复存在。也许更重要的是，Kubernetes 支持多种类型的卷，Pod 可以同时使用任意数量的卷。

卷的核心是目录，可能还包含了一些数据，可以通过 Pod 中的容器来访问。该目录是如何形成的、支持该目录的介质以及其内容取决于所使用的特定卷类型。

要使用卷，需要为 Pod 指定为卷（`spec.volumes` 字段）以及将它挂载到容器的位置（`spec.containers[].volumeMounts` 字段）。

容器中的进程看到的是由其 Docker 镜像和卷组成的文件系统视图。[Docker 镜像](https://docs.docker.com/get-started/overview/)位于文件系统层次结构的根目录，任何卷都被挂载在镜像的指定路径中。卷无法挂载到其他卷上或与其他卷有硬连接。Pod 中的每个容器都必须独立指定每个卷的挂载位置。

## 卷的类型

Kubernetes 支持以下类型的卷：

### 临时卷类型

- `emptyDir`
- `configMap`
- `downwardAPI`
- `secret`
- `projected`

### 持久卷类型

- `persistentVolumeClaim`
- `local`
- `hostPath`

### 网络存储卷类型

- `nfs`
- `cephfs`
- `glusterfs`
- `iscsi`
- `fc` (光纤通道)

### 云存储卷类型

- `awsElasticBlockStore`
- `azureDisk`
- `azureFile`
- `gcePersistentDisk`
- `vsphereVolume`

### 特殊用途卷类型

- `csi`
- `gitRepo` (已弃用)

**注意**：一些卷类型（如 `gitRepo`、`flocker`、`quobyte`、`storageos` 等）已经被弃用或移除。建议使用 CSI 驱动程序或其他现代存储解决方案。

## 常用卷类型详解

### emptyDir

当 Pod 被分配给节点时，首先创建 `emptyDir` 卷，并且只要该 Pod 在该节点上运行，该卷就会存在。正如卷的名字所述，它最初是空的。Pod 中的容器可以读取和写入 `emptyDir` 卷中的相同文件，尽管该卷可以挂载到每个容器中的相同或不同路径上。当出于任何原因从节点中删除 Pod 时，`emptyDir` 中的数据将被永久删除。

**注意**：容器崩溃不会从节点中移除 Pod，因此 `emptyDir` 卷中的数据在容器崩溃时是安全的。

`emptyDir` 的用法有：

- 暂存空间，例如用于基于磁盘的合并排序
- 用作长时间计算崩溃恢复时的检查点
- Web 服务器容器提供数据时，保存内容管理器容器提取的文件
- 容器间共享数据

#### 示例配置

以下是相关的示例代码：

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

`configMap` 卷用于将配置数据注入到 Pod 中。存储在 ConfigMap 中的数据可以在 `configMap` 类型的卷中引用，然后被运行在 Pod 中的容器化应用使用。

#### 示例配置

以下是相关的示例代码：

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

`secret` 卷用于将敏感信息（如密码）传递到 Pod。你可以将 Secret 存储在 Kubernetes API 中，并将它们挂载为文件，以供 Pod 使用，而无需直接连接到 Kubernetes。`secret` 卷由 tmpfs（一个 RAM 支持的文件系统）支持，所以它们永远不会写入非易失性存储器。

**重要提示**：你必须先在 Kubernetes API 中创建一个 Secret，然后才能使用它。

#### 示例配置

以下是相关的示例代码：

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

`persistentVolumeClaim` 卷用于将 [PersistentVolume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) 挂载到容器中。PersistentVolume 是在用户不知道特定云环境的细节的情况下"声明"持久化存储（例如 GCE PersistentDisk 或 iSCSI 卷）的一种方式。

#### 示例配置

以下是相关的示例代码：

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

`hostPath` 卷将主机节点的文件系统中的文件或目录挂载到 Pod 中。该功能大多数 Pod 都用不到，但它为某些应用程序提供了一个强大的解决方案。

例如，`hostPath` 的用途如下：

- 运行需要访问 Docker 内部的容器；使用 `/var/lib/docker` 的 `hostPath`
- 在容器中运行 cAdvisor；使用 `/sys` 的 `hostPath`
- 允许 Pod 指定给定的 hostPath 是否应该在 Pod 运行之前存在，是否应该创建，以及它应该以什么形式存在

除了所需的 `path` 属性之外，用户还可以为 `hostPath` 卷指定 `type`。

`type` 字段支持以下值：

| 值                   | 行为                                       |
| :------------------ | :--------------------------------------- |
|                     | 空字符串（默认）用于向后兼容，这意味着在挂载 hostPath 卷之前不会执行任何检查。 |
| `DirectoryOrCreate` | 如果在给定的路径上没有任何东西存在，那么将根据需要在那里创建一个空目录，权限设置为 0755，与 Kubelet 具有相同的组和所有权。 |
| `Directory`         | 给定的路径下必须存在目录                             |
| `FileOrCreate`      | 如果在给定的路径上没有任何东西存在，那么会根据需要创建一个空文件，权限设置为 0644，与 Kubelet 具有相同的组和所有权。 |
| `File`              | 给定的路径下必须存在文件                             |
| `Socket`            | 给定的路径下必须存在 UNIX 套接字                      |
| `CharDevice`        | 给定的路径下必须存在字符设备                           |
| `BlockDevice`       | 给定的路径下必须存在块设备                            |

使用这种卷类型时请注意：

- 由于每个节点上的文件都不同，具有相同配置（例如从 PodTemplate 创建的）的 Pod 在不同节点上的行为可能会有所不同
- 当 Kubernetes 按照调度要求添加资源感知调度时，将无法考虑 `hostPath` 使用的资源
- 在底层主机上创建的文件或目录只能由 root 写入。你需要在特权容器中以 root 身份运行进程，或修改主机上的文件权限以便写入 `hostPath` 卷

#### 示例配置

以下是相关的示例代码：

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

`nfs` 卷允许将现有的 NFS（网络文件系统）共享挂载到你的 Pod 中。不像 `emptyDir`，当删除 Pod 时，`nfs` 卷的内容被保留，卷仅仅是被卸载。这意味着 NFS 卷可以预填充数据，并且可以在 Pod 之间"切换"数据。NFS 可以被多个写入者同时挂载。

**重要提示**：你必须先拥有自己的 NFS 服务器，然后才能使用它。

#### 示例配置

以下是相关的示例代码：

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

CSI（Container Storage Interface）是容器存储接口的标准，允许存储供应商编写插件来支持其存储系统。CSI 卷类型允许 Pod 使用任何符合 CSI 规范的存储驱动程序。

#### 示例配置

以下是相关的示例代码：

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

有时，在单个容器中共享一个卷用于多个用途是有用的。`volumeMounts.subPath` 属性可用于在引用的卷内而不是其根目录中指定子路径。

下面是一个使用单个共享卷的 LAMP 堆栈（Linux Apache MySQL PHP）的示例。HTML 内容被映射到它的 html 目录，数据库将被存储在它的 mysql 目录中：

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

除了静态子路径外，Kubernetes 还支持动态子路径。你可以使用 `subPathExpr` 字段来引用容器环境变量构造子路径。这对于需要根据 Pod 名称或其他属性创建不同子目录的场景很有用。

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

`projected` 卷将几个现有的卷源映射到同一个目录中。目前支持的卷源包括：

- `secret`
- `downwardAPI`
- `configMap`
- `serviceAccountToken`

所有来源都必须在与 Pod 相同的命名空间中。

#### 示例配置

以下是相关的示例代码：

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

挂载传播允许将由容器挂载的卷共享到同一个 Pod 中的其他容器上，甚至是同一节点上的其他 Pod。这个特性在 Kubernetes 1.10 中变为 Beta 版本。

容器的 `volumeMounts` 字段有一个 `mountPropagation` 子字段，它的值可以是：

- `None`：此卷挂载不接收任何后续挂载。这是默认模式。
- `HostToContainer`：此卷挂载将接收所有后续挂载到此卷或其任何子目录的挂载。
- `Bidirectional`：此卷挂载与 `HostToContainer` 挂载相同。另外，由容器创建的所有卷挂载将被传播回主机和所有使用相同卷的容器。

**注意**：双向挂载传播可能是危险的。它可能会损坏主机操作系统，因此只能在特权容器中使用。

#### 示例配置

以下是相关的示例代码：

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

对于 `emptyDir` 卷，可以通过指定 `sizeLimit` 来限制其大小：

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

1. **选择合适的卷类型**：
   - 临时数据使用 `emptyDir`
   - 持久化数据使用 `persistentVolumeClaim`
   - 配置数据使用 `configMap`
   - 敏感数据使用 `secret`

2. **安全考虑**：
   - 尽量避免使用 `hostPath`，除非绝对必要
   - 使用 `readOnly` 标志来防止意外修改
   - 对于敏感数据，确保使用适当的访问控制

3. **性能优化**：
   - 选择合适的存储类型（SSD vs HDD）
   - 考虑数据本地性和网络延迟
   - 使用适当的文件系统类型

4. **备份和恢复**：
   - 为重要数据建立备份策略
   - 测试恢复过程
   - 使用快照功能（如果支持）

## 参考

- [Volumes - kubernetes.io](https://kubernetes.io/docs/concepts/storage/volumes/)
- [Persistent Volumes - kubernetes.io](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [Configure a Pod to Use a PersistentVolume for Storage](https://kubernetes.io/docs/tasks/configure-pod-container/configure-persistent-volume-storage/)
