---
title: "Kubernetes中的Persistent Volume解析"
subtitle: "持久化卷使用方式详解"
description: "本文是关于Kubernetes中的Persistent Volume（持久化卷）的官方中文文档"
date: 2018-01-08T20:00:48+08:00
draft: false
tags: ["kubernetes"]
categories: "kubernetes"
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/2016013001.jpg", desc: "China National Library@北京 Jan 30,2016"}]
---

本文档介绍了 Kubernetes 中 `PersistentVolume` 的当前状态。这是 Kubernetes 官方中文文档的初稿，欢迎[在官方PR反馈问题](https://github.com/kubernetes/kubernetes-docs-cn/pull/164)，建议您在阅读本文档前先熟悉 [volume](https://kubernetes.io/docs/concepts/storage/volumes/)。本文同时归档到 [kubernetes-handbook](https://jimmysong.io/kubernetes-handbook)。

## 介绍

对于管理计算资源来说，管理存储资源明显是另一个问题。`PersistentVolume` 子系统为用户和管理员提供了一个 API，该 API 将如何提供存储的细节抽象了出来。为此，我们引入两个新的 API 资源：`PersistentVolume` 和 `PersistentVolumeClaim`。

`PersistentVolume`（PV）是由管理员设置的存储，它是群集的一部分。就像节点是集群中的资源一样，PV 也是集群中的资源。 PV 是 Volume 之类的卷插件，但具有独立于使用 PV 的 Pod 的生命周期。此 API 对象包含存储实现的细节，即 NFS、iSCSI 或特定于云供应商的存储系统。

`PersistentVolumeClaim`（PVC）是用户存储的请求。它与 Pod 相似。Pod 消耗节点资源，PVC 消耗 PV 资源。Pod 可以请求特定级别的资源（CPU 和内存）。声明可以请求特定的大小和访问模式（例如，可以以读/写一次或 只读多次模式挂载）。

虽然 `PersistentVolumeClaims` 允许用户使用抽象存储资源，但用户需要具有不同性质（例如性能）的 `PersistentVolume` 来解决不同的问题。集群管理员需要能够提供各种各样的 `PersistentVolume`，这些`PersistentVolume` 的大小和访问模式可以各有不同，但不需要向用户公开实现这些卷的细节。对于这些需求，`StorageClass` 资源可以实现。

请参阅[工作示例的详细过程](https://kubernetes.io/docs/tasks/configure-pod-container/configure-persistent-volume-storage/)。

## 卷和声明的生命周期

PV 属于集群中的资源。PVC 是对这些资源的请求，也作为对资源的请求的检查。 PV 和 PVC 之间的相互作用遵循这样的生命周期：

### 配置（Provision）

有两种方式来配置 PV：静态或动态。

#### 静态

集群管理员创建一些 PV。它们带有可供群集用户使用的实际存储的细节。它们存在于 Kubernetes API 中，可用于消费。

#### 动态

当管理员创建的静态 PV 都不匹配用户的 `PersistentVolumeClaim` 时，集群可能会尝试动态地为 PVC 创建卷。此配置基于 `StorageClasses`：PVC 必须请求[存储类](https://kubernetes.io/docs/concepts/storage/storage-classes/)，并且管理员必须创建并配置该类才能进行动态创建。声明该类为 `""` 可以有效地禁用其动态配置。

要启用基于存储级别的动态存储配置，集群管理员需要启用 API server 上的 `DefaultStorageClass` [准入控制器](https://kubernetes.io/docs/admin/admission-controllers/#defaultstorageclass)。例如，通过确保 `DefaultStorageClass` 位于 API server 组件的 `--admission-control` 标志，使用逗号分隔的有序值列表中，可以完成此操作。有关 API  server 命令行标志的更多信息，请检查 [kube-apiserver](https://kubernetes.io/docs/admin/kube-apiserver/) 文档。

### 绑定

再动态配置的情况下，用户创建或已经创建了具有特定存储量的 `PersistentVolumeClaim` 以及某些访问模式。master 中的控制环路监视新的 PVC，寻找匹配的 PV（如果可能），并将它们绑定在一起。如果为新的 PVC 动态调配 PV，则该环路将始终将该 PV 绑定到 PVC。否则，用户总会得到他们所请求的存储，但是容量可能超出要求的数量。一旦 PV 和 PVC 绑定后，`PersistentVolumeClaim` 绑定是排他性的，不管它们是如何绑定的。 PVC 跟 PV 绑定是一对一的映射。

如果没有匹配的卷，声明将无限期地保持未绑定状态。随着匹配卷的可用，声明将被绑定。例如，配置了许多 50Gi PV的集群将不会匹配请求 100Gi 的PVC。将100Gi PV 添加到群集时，可以绑定 PVC。

### 使用

Pod 使用声明作为卷。集群检查声明以查找绑定的卷并为集群挂载该卷。对于支持多种访问模式的卷，用户指定在使用声明作为容器中的卷时所需的模式。

用户进行了声明，并且该声明是绑定的，则只要用户需要，绑定的 PV 就属于该用户。用户通过在 Pod 的 volume 配置中包含 `persistentVolumeClaim` 来调度 Pod 并访问用户声明的 PV。[请参阅下面的语法细节](#claims-as-volumes)。

### 持久化卷声明的保护

PVC 保护的目的是确保由 pod 正在使用的 PVC 不会从系统中移除，因为如果被移除的话可能会导致数据丢失。

注意：当 pod 状态为 `Pending` 并且 pod 已经分配给节点或 pod 为 `Running` 状态时，PVC 处于活动状态。

当启用[PVC 保护 alpha 功能](https://kubernetes.io/docs/tasks/administer-cluster/pvc-protection/)时，如果用户删除了一个 pod 正在使用的 PVC，则该 PVC 不会被立即删除。PVC 的删除将被推迟，直到 PVC 不再被任何 pod 使用。

您可以看到，当 PVC 的状态为 `Teminatiing` 时，PVC 受到保护，`Finalizers` 列表中包含 `kubernetes.io/pvc-protection`：

```shell
kubectl described pvc hostpath
Name:          hostpath
Namespace:     default
StorageClass:  example-hostpath
Status:        Terminating
Volume:        
Labels:        <none>
Annotations:   volume.beta.kubernetes.io/storage-class=example-hostpath
               volume.beta.kubernetes.io/storage-provisioner=example.com/hostpath
Finalizers:    [kubernetes.io/pvc-protection]
...
```

### 回收

用户用完 volume 后，可以从允许回收资源的 API 中删除 PVC 对象。`PersistentVolume` 的回收策略告诉集群在存储卷声明释放后应如何处理该卷。目前，volume 的处理策略有保留、回收或删除。

#### 保留

保留回收策略允许手动回收资源。当 `PersistentVolumeClaim` 被删除时，`PersistentVolume` 仍然存在，volume 被视为“已释放”。但是由于前一个声明人的数据仍然存在，所以还不能马上进行其他声明。管理员可以通过以下步骤手动回收卷。

1. 删除 `PersistentVolume`。在删除 PV 后，外部基础架构中的关联存储资产（如 AWS EBS、GCE PD、Azure Disk 或 Cinder 卷）仍然存在。
2. 手动清理相关存储资产上的数据。
3. 手动删除关联的存储资产，或者如果要重新使用相同的存储资产，请使用存储资产定义创建新的 `PersistentVolume`。

#### 回收

如果存储卷插件支持，回收策略会在 volume上执行基本擦除（`rm -rf / thevolume / *`），可被再次声明使用。

但是，管理员可以使用如[此处](https://kubernetes.io/docs/admin/kube-controller-manager/)所述的 Kubernetes controller manager 命令行参数来配置自定义回收站 pod 模板。自定义回收站 pod 模板必须包含 `volumes` 规范，如下面的示例所示：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pv-recycler
  namespace: default
spec:
  restartPolicy: Never
  volumes:
  - name: vol
    hostPath:
      path: /any/path/it/will/be/replaced
  containers:
  - name: pv-recycler
    image: "k8s.gcr.io/busybox"
    command: ["/bin/sh", "-c", "test -e /scrub && rm -rf /scrub/..?* /scrub/.[!.]* /scrub/*  && test -z \"$(ls -A /scrub)\" || exit 1"]
    volumeMounts:
    - name: vol
      mountPath: /scrub
```

但是，`volumes` 部分的自定义回收站模块中指定的特定路径将被替换为正在回收的卷的特定路径。

#### 删除

对于支持删除回收策略的卷插件，删除操作将从 Kubernetes 中删除 `PersistentVolume` 对象，并删除外部基础架构（如 AWS EBS、GCE PD、Azure Disk 或 Cinder 卷）中的关联存储资产。动态配置的卷继承其 [`StorageClass` 的回收策略](#reclaim-policy)，默认为 Delete。管理员应该根据用户的期望来配置 `StorageClass`，否则就必须要在 PV 创建后进行编辑或修补。请参阅[更改 PersistentVolume 的回收策略](https://kubernetes.iohttps://kubernetes.io/docs/tasks/administer-cluster/change-pv-reclaim-policy/)。

### 扩展持久化卷声明

Kubernetes 1.8 增加了对扩展持久化存储卷的 Alpha 支持。在 v1.9 中，以下持久化卷支持扩展持久化卷声明：

- gcePersistentDisk
- awsElasticBlockStore
- Cinder
- glusterfs
- rbd

管理员可以通过将 `ExpandPersistentVolumes` 特性门设置为true来允许扩展持久卷声明。管理员还应该启用[`PersistentVolumeClaimResize` 准入控制插件](https://kubernetes.io/docs/admin/admission-controllers/#persistentvolumeclaimresize)来执行对可调整大小的卷的其他验证。

一旦 `PersistentVolumeClaimResize` 准入插件已打开，将只允许其 `allowVolumeExpansion` 字段设置为 true 的存储类进行大小调整。

```yaml
kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
  name: gluster-vol-default
provisioner: kubernetes.io/glusterfs
parameters:
  resturl: "http://192.168.10.100:8080"
  restuser: ""
  secretNamespace: ""
  secretName: ""
allowVolumeExpansion: true
```

一旦功能门和前述准入插件打开后，用户就可以通过简单地编辑声明以请求更大的 `PersistentVolumeClaim` 卷。这反过来将触发 `PersistentVolume` 后端的卷扩展。

在任何情况下都不会创建新的 `PersistentVolume` 来满足声明。 Kubernetes 将尝试调整现有 volume 来满足声明的要求。

对于扩展包含文件系统的卷，只有在 ReadWrite 模式下使用 `PersistentVolumeClaim` 启动新的 Pod 时，才会执行文件系统调整大小。换句话说，如果正在扩展的卷在 pod 或部署中使用，则需要删除并重新创建要进行文件系统调整大小的pod。此外，文件系统调整大小仅适用于以下文件系统类型：

- XFS
- Ext3、Ext4

**注意**：扩展 EBS 卷是一个耗时的操作。另外，每6个小时有一个修改卷的配额。

## 持久化卷类型

`PersistentVolume` 类型以插件形式实现。Kubernetes 目前支持以下插件类型：

- GCEPersistentDisk
- AWSElasticBlockStore
- AzureFile
- AzureDisk
- FC (Fibre Channel)
- FlexVolume
- Flocker
- NFS
- iSCSI
- RBD (Ceph Block Device)
- CephFS
- Cinder (OpenStack block storage)
- Glusterfs
- VsphereVolume
- Quobyte Volumes
- HostPath （仅限于但节点测试—— 不会以任何方式支持本地存储，也无法在多节点集群中工作）
- VMware Photon
- Portworx Volumes
- ScaleIO Volumes
- StorageOS

原始块支持仅适用于以上这些插件。

## 持久化卷

每个 PV 配置中都包含一个 sepc 规格字段和一个 status 卷状态字段。

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv0003
spec:
  capacity:
    storage: 5Gi
  volumeMode: Filesystem
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Recycle
  storageClassName: slow
  mountOptions:
    - hard
    - nfsvers=4.1
  nfs:
    path: /tmp
    server: 172.17.0.2
```

### 容量

通常，PV 将具有特定的存储容量。这是使用 PV 的容量属性设置的。查看 Kubernetes [资源模型](https://git.k8s.io/community/contributors/design-proposals/scheduling/resources.md) 以了解 `capacity` 预期。

目前，存储大小是可以设置或请求的唯一资源。未来的属性可能包括 IOPS、吞吐量等。

### 卷模式

在 v1.9 之前，所有卷插件的默认行为是在持久卷上创建一个文件系统。在 v1.9 中，用户可以指定一个 volumeMode，除了文件系统之外，它现在将支持原始块设备。 volumeMode 的有效值可以是“Filesystem”或“Block”。如果未指定，volumeMode 将默认为“Filesystem”。这是一个可选的 API 参数。

**注意**：该功能在 V1.9 中是 alpha的，未来可能会更改。

### 访问模式

`PersistentVolume` 可以以资源提供者支持的任何方式挂载到主机上。如下表所示，供应商具有不同的功能，每个 PV 的访问模式都将被设置为该卷支持的特定模式。例如，NFS 可以支持多个读/写客户端，但特定的 NFS PV 可能以只读方式导出到服务器上。每个 PV 都有一套自己的用来描述特定功能的访问模式。

存储模式包括：

- ReadWriteOnce——该卷可以被单个节点以读/写模式挂载
- ReadOnlyMany——该卷可以被多个节点以只读模式挂载
- ReadWriteMany——该卷可以被多个节点以读/写模式挂载

在命令行中，访问模式缩写为：

- RWO - ReadWriteOnce
- ROX - ReadOnlyMany
- RWX - ReadWriteMany

> **重要**！一个卷一次只能使用一种访问模式挂载，即使它支持很多访问模式。例如，GCEPersistentDisk 可以由单个节点作为 ReadWriteOnce 模式挂载，或由多个节点以 ReadOnlyMany 模式挂载，但不能同时挂载。

| Volume 插件            | ReadWriteOnce | ReadOnlyMany |  ReadWriteMany  |
| :------------------- | :-----------: | :----------: | :-------------: |
| AWSElasticBlockStore |   &#x2713;    |      -       |        -        |
| AzureFile            |   &#x2713;    |   &#x2713;   |    &#x2713;     |
| AzureDisk            |   &#x2713;    |      -       |        -        |
| CephFS               |   &#x2713;    |   &#x2713;   |    &#x2713;     |
| Cinder               |   &#x2713;    |      -       |        -        |
| FC                   |   &#x2713;    |   &#x2713;   |        -        |
| FlexVolume           |   &#x2713;    |   &#x2713;   |        -        |
| Flocker              |   &#x2713;    |      -       |        -        |
| GCEPersistentDisk    |   &#x2713;    |   &#x2713;   |        -        |
| Glusterfs            |   &#x2713;    |   &#x2713;   |    &#x2713;     |
| HostPath             |   &#x2713;    |      -       |        -        |
| iSCSI                |   &#x2713;    |   &#x2713;   |        -        |
| PhotonPersistentDisk |   &#x2713;    |      -       |        -        |
| Quobyte              |   &#x2713;    |   &#x2713;   |    &#x2713;     |
| NFS                  |   &#x2713;    |   &#x2713;   |    &#x2713;     |
| RBD                  |   &#x2713;    |   &#x2713;   |        -        |
| VsphereVolume        |   &#x2713;    |      -       | - （当 pod 并列时有效） |
| PortworxVolume       |   &#x2713;    |      -       |    &#x2713;     |
| ScaleIO              |   &#x2713;    |   &#x2713;   |        -        |
| StorageOS            |   &#x2713;    |      -       |        -        |

### 类

PV 可以具有一个类，通过将 `storageClassName` 属性设置为 [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) 的名称来指定该类。一个特定类别的 PV 只能绑定到请求该类别的 PVC。没有 `storageClassName` 的 PV 就没有类，它只能绑定到不需要特定类的 PVC。

过去，使用的是 `volume.beta.kubernetes.io/storage-class` 注解而不是 `storageClassName` 属性。这个注解仍然有效，但是将来的 Kubernetes 版本中将会完全弃用它。

### 回收策略

当前的回收策略包括：

- Retain（保留）——手动回收
- Recycle（回收）——基本擦除（`rm -rf /thevolume/*`）
- Delete（删除）——关联的存储资产（例如 AWS EBS、GCE PD、Azure Disk 和 OpenStack Cinder 卷）将被删除

当前，只有 NFS 和 HostPath 支持回收策略。AWS EBS、GCE PD、Azure Disk 和 Cinder 卷支持删除策略。

### 挂载选项

Kubernetes 管理员可以指定在节点上为挂载持久卷指定挂载选项。

**注意**：不是所有的持久化卷类型都支持挂载选项。

以下卷类型支持挂载选项：

- GCEPersistentDisk
- AWSElasticBlockStore
- AzureFile
- AzureDisk
- NFS
- iSCSI
- RBD （Ceph Block Device）
- CephFS
- Cinder （OpenStack 卷存储）
- Glusterfs
- VsphereVolume
- Quobyte Volumes
- VMware Photon

挂载选项没有校验，如果挂载选项无效则挂载失败。

过去，使用 `volume.beta.kubernetes.io/mount-options` 注解而不是 `mountOptions` 属性。这个注解仍然有效，但在将来的 Kubernetes 版本中它将会被完全弃用。

### 状态

卷可以处于以下的某种状态：

- Available（可用）——一块空闲资源还没有被任何声明绑定
- Bound（已绑定）——卷已经被声明绑定
- Released（已释放）——声明被删除，但是资源还未被集群重新声明
- Failed（失败）——该卷的自动回收失败

命令行会显示绑定到 PV 的 PVC 的名称。

## PersistentVolumeClaim

每个 PVC 中都包含一个 spec 规格字段和一个 status 声明状态字段。

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: myclaim
spec:
  accessModes:
    - ReadWriteOnce
  volumeMode: Filesystem
  resources:
    requests:
      storage: 8Gi
  storageClassName: slow
  selector:
    matchLabels:
      release: "stable"
    matchExpressions:
      - {key: environment, operator: In, values: [dev]}
```

### 访问模式

在请求具有特定访问模式的存储时，声明使用与卷相同的约定。

### 卷模式

声明使用与卷相同的约定，指示将卷作为文件系统或块设备使用。

### 资源

像 pod 一样，声明可以请求特定数量的资源。在这种情况下，请求是用于存储的。相同的[资源模型](https://git.k8s.io/community/contributors/design-proposals/scheduling/resources.md)适用于卷和声明。

### 选择器

声明可以指定一个[标签选择器](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#label-selectors)来进一步过滤该组卷。只有标签与选择器匹配的卷可以绑定到声明。选择器由两个字段组成：

- matchLabels：volume 必须有具有该值的标签
- matchExpressions：这是一个要求列表，通过指定关键字，值列表以及与关键字和值相关的运算符组成。有效的运算符包括 In、NotIn、Exists 和 DoesNotExist。

所有来自 `matchLabels` 和 `matchExpressions` 的要求都被“与”在一起——它们必须全部满足才能匹配。

### 类

声明可以通过使用属性 `storageClassName` 指定 [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) 的名称来请求特定的类。只有所请求的类与 PVC 具有相同 `storageClassName` 的 PV 才能绑定到 PVC。

PVC 不一定要请求类。其 `storageClassName` 设置为 `""` 的 PVC 始终被解释为没有请求类的 PV，因此只能绑定到没有类的 PV（没有注解或 `""`）。没有 `storageClassName` 的 PVC 根据是否打开[`DefaultStorageClass` 准入控制插件](https://kubernetes.io/docs/admin/admission-controllers/#defaultstorageclass)，集群对其进行不同处理。

- 如果打开了准入控制插件，管理员可以指定一个默认的 `StorageClass`。所有没有 `StorageClassName` 的 PVC 将被绑定到该默认的 PV。通过在 `StorageClass` 对象中将注解 `storageclassclass.ubernetes.io/is-default-class` 设置为 “true” 来指定默认的 `StorageClass`。如果管理员没有指定缺省值，那么集群会响应 PVC 创建，就好像关闭了准入控制插件一样。如果指定了多个默认值，则准入控制插件将禁止所有 PVC 创建。
- 如果准入控制插件被关闭，则没有默认 `StorageClass` 的概念。所有没有 `storageClassName` 的 PVC 只能绑定到没有类的 PV。在这种情况下，没有 `storageClassName` 的 PVC 的处理方式与 `storageClassName` 设置为 `""` 的 PVC 的处理方式相同。

根据安装方法的不同，默认的 `StorageClass` 可以在安装过程中通过插件管理器部署到 Kubernetes 集群。

当 PVC 指定了 `selector`，除了请求一个 `StorageClass` 之外，这些需求被“与”在一起：只有被请求的类的 PV 具有和被请求的标签才可以被绑定到 PVC。

**注意**：目前，具有非空 `selector` 的 PVC 不能为其动态配置 PV。

过去，使用注解 `volume.beta.kubernetes.io/storage-class` 而不是 `storageClassName` 属性。这个注解仍然有效，但是在未来的 Kubernetes 版本中不会支持。

## 声明作为卷

通过将声明用作卷来访问存储。声明必须与使用声明的 pod 存在于相同的命名空间中。集群在 pod 的命名空间中查找声明，并使用它来获取支持声明的 `PersistentVolume`。该卷然后被挂载到主机的 pod 上。

```yaml
kind: Pod
apiVersion: v1
metadata:
  name: mypod
spec:
  containers:
    - name: myfrontend
      image: dockerfile/nginx
      volumeMounts:
      - mountPath: "/var/www/html"
        name: mypd
  volumes:
    - name: mypd
      persistentVolumeClaim:
        claimName: myclaim
```

### 命名空间注意点

`PersistentVolumes` 绑定是唯一的，并且由于 `PersistentVolumeClaims` 是命名空间对象，因此只能在一个命名空间内挂载具有“多个”模式（`ROX`、`RWX`）的声明。

## 原始块卷支持

原始块卷的静态配置在 v1.9 中作为 alpha 功能引入。由于这个改变，需要一些新的 API 字段来使用该功能。目前，Fibre Channl 是支持该功能的唯一插件。

### 使用原始块卷作为持久化卷

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: block-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  volumeMode: Block
  persistentVolumeReclaimPolicy: Retain
  fc:
    targetWWNs: ["50060e801049cfd1"]
    lun: 0
    readOnly: false
```

### 持久化卷声明请求原始块卷

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: block-pvc
spec:
  accessModes:
    - ReadWriteOnce
  volumeMode: Block
  resources:
    requests:
      storage: 10Gi
```

### 在 Pod 规格配置中为容器添加原始块设备

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-with-block-volume
spec:
  containers:
    - name: fc-container
      image: fedora:26
      command: ["/bin/sh", "-c"]
      args: [ "tail -f /dev/null" ]
      volumeDevices:
        - name: data
          devicePath: /dev/xvda
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: block-pvc
```

**注意**：当为 Pod 增加原始块设备时，我们在容器中指定设备路径而不是挂载路径。

### 绑定块卷

如果用户通过使用 `PersistentVolumeClaim` 规范中的 `volumeMode` 字段指示此请求来请求原始块卷，则绑定规则与以前不认为该模式为规范一部分的版本略有不同。

下面是用户和管理员指定请求原始块设备的可能组合的表格。该表指示卷是否将被绑定或未给定组合。静态设置的卷的卷绑定矩阵：

| PV volumeMode | PVC volumeMode |   结果 |
| ------------- | :------------: | ---: |
| unspecified   |  unspecified   |   绑定 |
| unspecified   |     Block      |  不绑定 |
| unspecified   |   Filesystem   |   绑定 |
| Block         |  unspecified   |  不绑定 |
| Block         |     Block      |   绑定 |
| Block         |   Filesystem   |  不绑定 |
| Filesystem    |   Filesystem   |   绑定 |
| Filesystem    |     Block      |  不绑定 |
| Filesystem    |  unspecified   |   绑定 |

**注意**：alpha 版本只支持静态配置卷。使用原始块设备时，管理员应该注意考虑这些值。

## 编写可移植配置

如果您正在编写在多种群集上运行并需要持久存储的配置模板或示例，我们建议您使用以下模式：

- 不要在您的在配置组合中包含 `PersistentVolumeClaim` 对象（与 Deployment、ConfigMap等一起）。
- 不要在配置中包含 `PersistentVolume` 对象，因为用户实例化配置可能没有创建 `PersistentVolume` 的权限。
- 给用户在实例化模板时提供存储类名称的选项。
  - 如果用户提供存储类名称，则将该值放入 `persistentVolumeClaim.storageClassName` 字段中。如果集群具有由管理员启用的 StorageClass，这将导致 PVC 匹配正确的存储类别。
  - 如果用户未提供存储类名称，则将 `persistentVolumeClaim.storageClassName` 字段保留为 nil。
    - 这将导致使用集群中默认的 StorageClass 为用户自动配置 PV。许多集群环境都有默认的 StorageClass，或者管理员可以创建自己的默认 StorageClass。
- 在您的工具中，请注意一段时间之后仍未绑定的 PVC，并向用户展示它们，因为这表示集群可能没有动态存储支持（在这种情况下用户应创建匹配的 PV），或集群没有存储系统（在这种情况下用户不能部署需要 PVC 的配置）。

原文地址：https://kubernetes.io/docs/concepts/storage/persistent-volumes

译者：[rootsongjc](https://github.com/rootsongjc)