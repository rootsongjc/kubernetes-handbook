# StorageClass

本文介绍了 Kubernetes 中 `StorageClass` 的概念。在阅读本文之前建议先熟悉 [卷](https://kubernetes.io/docs/concepts/storage/volumes) 和 [Persistent Volume（持久卷）](https://kubernetes.io/docs/concepts/storage/persistent-volumes)。

## 介绍

`StorageClass` 为管理员提供了描述存储 "class（类）" 的方法。 不同的 class 可能会映射到不同的服务质量等级或备份策略，或由群集管理员确定的任意策略。 Kubernetes 本身不清楚各种 class 代表的什么。这个概念在其他存储系统中有时被称为“配置文件”。

## StorageClass 资源

`StorageClass` 中包含 `provisioner`、`parameters` 和 `reclaimPolicy` 字段，当 class 需要动态分配 `PersistentVolume` 时会使用到。

`StorageClass` 对象的名称很重要，用户使用该类来请求一个特定的方法。 当创建 `StorageClass` 对象时，管理员设置名称和其他参数，一旦创建了对象就不能再对其更新。

管理员可以为没有申请绑定到特定 class 的 PVC 指定一个默认的 `StorageClass` ： 更多详情请参阅 [`PersistentVolumeClaim` 章节](https://kubernetes.io/docs/concepts/storage/storage-classes.md#persistentvolumeclaims)。

```yaml
kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
  name: standard
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp2
reclaimPolicy: Retain
mountOptions:
  - debug
```

### Provisioner（存储分配器）

Storage class 有一个分配器，用来决定使用哪个卷插件分配 PV。该字段必须指定。

| Volume Plugin        | Internal Provisioner | Config Example                           |
| -------------------- | -------------------- | ---------------------------------------- |
| AWSElasticBlockStore | ✓                    | [AWS](https://kubernetes.io/docs/concepts/storage/storage-classes.md#aws) |
| AzureFile            | ✓                    | [Azure File](https://kubernetes.io/docs/concepts/storage/storage-classes.md#azure-file) |
| AzureDisk            | ✓                    | [Azure Disk](https://kubernetes.io/docs/concepts/storage/storage-classes.md#azure-disk) |
| CephFS               | -                    | -                                        |
| Cinder               | ✓                    | [OpenStack Cinder](https://kubernetes.io/docs/concepts/storage/storage-classes.md#openstack-cinder) |
| FC                   | -                    | -                                        |
| FlexVolume           | -                    | -                                        |
| Flocker              | ✓                    | -                                        |
| GCEPersistentDisk    | ✓                    | [GCE](https://kubernetes.io/docs/concepts/storage/storage-classes.md#gce) |
| Glusterfs            | ✓                    | [Glusterfs](https://kubernetes.io/docs/concepts/storage/storage-classes.md#glusterfs) |
| iSCSI                | -                    | -                                        |
| PhotonPersistentDisk | ✓                    | -                                        |
| Quobyte              | ✓                    | [Quobyte](https://kubernetes.io/docs/concepts/storage/storage-classes.md#quobyte) |
| NFS                  | -                    | -                                        |
| RBD                  | ✓                    | [Ceph RBD](https://kubernetes.io/docs/concepts/storage/storage-classes.md#ceph-rbd) |
| VsphereVolume        | ✓                    | [vSphere](https://kubernetes.io/docs/concepts/storage/storage-classes.md#vsphere) |
| PortworxVolume       | ✓                    | [Portworx Volume](https://kubernetes.io/docs/concepts/storage/storage-classes.md#portworx-volume) |
| ScaleIO              | ✓                    | [ScaleIO](https://kubernetes.io/docs/concepts/storage/storage-classes.md#scaleio) |
| StorageOS            | ✓                    | [StorageOS](https://kubernetes.io/docs/concepts/storage/storage-classes.md#storageos) |

您不限于指定此处列出的"内置"分配器（其名称前缀为 kubernetes.io 并打包在 Kubernetes 中）。 您还可以运行和指定外部分配器，这些独立的程序遵循由 Kubernetes 定义的 [规范](https://git.k8s.io/community/contributors/design-proposals/storage/volume-provisioning.md)。 外部供应商的作者完全可以自由决定他们的代码保存于何处、打包方式、运行方式、使用的插件（包括Flex）等。 代码仓库 [kubernetes-incubator/external-storage](https://github.com/kubernetes-incubator/external-storage) 包含一个用于为外部分配器编写功能实现的类库，以及各种社区维护的外部分配器。

例如，NFS 没有内部分配器，但可以使用外部分配器。一些外部分配器在代码仓库 [kubernetes-incubator/external-storage](https://github.com/kubernetes-incubator/external-storage) 中。 也有第三方存储供应商提供自己的外部分配器。

关于内置的 StorageClass 的配置请参考 [Storage Classes](https://kubernetes.io/docs/concepts/storage/storage-classes/)。

### 回收策略

由 storage class 动态创建的 Persistent Volume 会在的 `reclaimPolicy` 字段中指定回收策略，可以是 `Delete` 或者 `Retain`。如果 `StorageClass` 对象被创建时没有指定 `reclaimPolicy` ，它将默认为 `Delete`。

通过 storage class 手动创建并管理的 Persistent Volume 会使用它们被创建时指定的回收政策。

### 挂载选项

由 storage class 动态创建的 Persistent Volume 将使用 class 中 `mountOptions` 字段指定的挂载选项。

如果卷插件不支持挂载选项，却指定了该选项，则分配操作失败。 安装选项在 class 和 PV 上都不会做验证，所以如果挂载选项无效，那么这个 PV 就会失败。

## 参数

Storage class 具有描述属于 storage class 卷的参数。取决于`分配器`，可以接受不同的参数。 例如，参数 `type` 的值 `io1` 和参数 `iopsPerGB` 特定于 EBS PV。当参数被省略时，会使用默认值。

## 参考

- https://kubernetes.io/docs/concepts/storage/storage-classes/