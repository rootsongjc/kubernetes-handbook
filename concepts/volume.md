# Volume

容器磁盘上的文件的生命周期是短暂的，这就使得在容器中运行重要应用时会出现一些问题。首先，当容器崩溃时，kubelet 会重启它，但是容器中的文件将丢失——容器以干净的状态（镜像最初的状态）重新启动。其次，在 `Pod` 中同时运行多个容器时，这些容器之间通常需要共享文件。Kubernetes 中的 `Volume` 抽象就很好的解决了这些问题。

建议先熟悉 [pod](https://kubernetes.io/docs/user-guide/pods)。

## 背景

Docker 中也有一个 [volume](https://docs.docker.com/engine/admin/volumes/) 的概念，尽管它稍微宽松一些，管理也很少。在 Docker 中，卷就像是磁盘或是另一个容器中的一个目录。它的生命周期不受管理，直到最近才有了 local-disk-backed 卷。Docker 现在提供了卷驱动程序，但是功能还非常有限（例如Docker1.7只允许每个容器使用一个卷驱动，并且无法给卷传递参数）。

另一方面，Kubernetes 中的卷有明确的寿命——与封装它的 Pod 相同。所f以，卷的生命比 Pod 中的所有容器都长，当这个容器重启时数据仍然得以保存。当然，当 Pod 不再存在时，卷也将不复存在。也许更重要的是，Kubernetes 支持多种类型的卷，Pod 可以同时使用任意数量的卷。

卷的核心是目录，可能还包含了一些数据，可以通过 pod 中的容器来访问。该目录是如何形成的、支持该目录的介质以及其内容取决于所使用的特定卷类型。

要使用卷，需要为 pod 指定为卷（`spec.volumes` 字段）以及将它挂载到容器的位置（`spec.containers.volumeMounts` 字段）。

容器中的进程看到的是由其 Docker 镜像和卷组成的文件系统视图。[Docker 镜像](https://docs.docker.com/userguide/dockerimages/)位于文件系统层次结构的根目录，任何卷都被挂载在镜像的指定路径中。卷无法挂载到其他卷上或与其他卷有硬连接。Pod 中的每个容器都必须独立指定每个卷的挂载位置。

## 卷的类型

Kubernetes 支持以下类型的卷：

- `awsElasticBlockStore`
- `azureDisk`
- `azureFile`
- `cephfs`
- `csi`
- `downwardAPI`
- `emptyDir`
- `fc` (fibre channel)
- `flocker`
- `gcePersistentDisk`
- `gitRepo`
- `glusterfs`
- `hostPath`
- `iscsi`
- `local`
- `nfs`
- `persistentVolumeClaim`
- `projected`
- `portworxVolume`
- `quobyte`
- `rbd`
- `scaleIO`
- `secret`
- `storageos`
- `vsphereVolume`


我们欢迎额外贡献。

### awsElasticBlockStore

`awsElasticBlockStore` 卷将Amazon Web Services（AWS）EBS Volume 挂载到您的容器中。与 `emptyDir` 类型会在删除 Pod 时被清除不同，EBS 卷的的内容会保留下来，仅仅是被卸载。这意味着 EBS 卷可以预先填充数据，并且可以在数据包之间“切换”数据。

**重要提示**：您必须使用 `aws ec2 create-volume` 或 AWS API 创建 EBS 卷，才能使用它。

使用 awsElasticBlockStore 卷时有一些限制：

- 运行 Pod 的节点必须是 AWS EC2 实例
- 这些实例需要与 EBS 卷位于相同的区域和可用区域
- EBS 仅支持卷和 EC2 实例的一对一的挂载

#### 创建 EBS 卷

在 pod 中使用的 EBS 卷之前，您需要先创建它。

```bash
aws ec2 create-volume --availability-zone=eu-west-1a --size=10 --volume-type=gp2
```

确保区域与您启动集群的区域相匹配（并且检查大小和 EBS 卷类型是否适合您的使用！）

### AWS EBS 示例配置

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: test-ebs
spec:
  containers:
  - image: k8s.gcr.io/test-webserver
    name: test-container
    volumeMounts:
    - mountPath: /test-ebs
      name: test-volume
  volumes:
  - name: test-volume
    # This AWS EBS volume must already exist.
    awsElasticBlockStore:
      volumeID: <volume-id>
      fsType: ext4
```

### azureDisk

`AzureDisk` 用于将 Microsoft Azure [Data Disk](https://azure.microsoft.com/zh-cn/documentation/articles/virtual-machines-linux-about-disks-vhds) 挂载到 Pod 中。

### azureFile

`azureFile` 用于将 Microsoft Azure File Volume（SMB 2.1 和 3.0）挂载到 Pod 中。

### cephfs

`cephfs` 卷允许将现有的 CephFS 卷挂载到您的容器中。不像 `emptyDir`，当删除 Pod 时被删除，`cephfs` 卷的内容将被保留，卷仅仅是被卸载。这意味着 CephFS 卷可以预先填充数据，并且可以在数据包之间“切换”数据。 CephFS 可以被多个写设备同时挂载。

**重要提示**：您必须先拥有自己的 Ceph 服务器，然后才能使用它。

有关更多详细信息，请参见[CephFS示例](https://github.com/kubernetes/examples/tree/master/staging/volumes/cephfs/)。

### csi

CSI 代表[容器存储接口](https://github.com/container-storage-interface/spec/blob/master/spec.md)，CSI 试图建立一个行业标准接口的规范，借助 CSI 容器编排系统（CO）可以将任意存储系统暴露给自己的容器工作负载。有关详细信息，请查看[设计方案](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/storage/container-storage-interface.md)。

`csi` 卷类型是一种 in-tree 的 CSI 卷插件，用于 Pod 与在同一节点上运行的外部 CSI 卷驱动程序交互。部署 CSI 兼容卷驱动后，用户可以使用 `csi` 作为卷类型来挂载驱动提供的存储。

CSI 持久化卷支持是在 Kubernetes v1.9 中引入的，作为一个 alpha 特性，必须由集群管理员明确启用。换句话说，集群管理员需要在 apiserver、controller-manager 和 kubelet 组件的 “`--feature-gates =`” 标志中加上 “`CSIPersistentVolume = true`”。

CSI 持久化卷具有以下字段可供用户指定：

- `driver`：一个字符串值，指定要使用的卷驱动程序的名称。必须少于 63 个字符，并以一个字符开头。驱动程序名称可以包含 “`.`”、“`-` ”、“`_`” 或数字。
- `volumeHandle`：一个字符串值，唯一标识从 CSI 卷插件的 `CreateVolume` 调用返回的卷名。随后在卷驱动程序的所有后续调用中使用卷句柄来引用该卷。
- `readOnly`：一个可选的布尔值，指示卷是否被发布为只读。默认是 false。

### downwardAPI

`downwardAPI` 卷用于使向下 API 数据（downward API data）对应用程序可用。它挂载一个目录，并将请求的数据写入纯文本文件。

参考 [`downwardAPI` 卷示例](https://kubernetes.io/docs/tasks/inject-data-application/downward-api-volume-expose-pod-information/)查看详细信息。

### emptyDir

当 Pod 被分配给节点时，首先创建 `emptyDir` 卷，并且只要该 Pod 在该节点上运行，该卷就会存在。正如卷的名字所述，它最初是空的。Pod 中的容器可以读取和写入 `emptyDir` 卷中的相同文件，尽管该卷可以挂载到每个容器中的相同或不同路径上。当出于任何原因从节点中删除 Pod 时，`emptyDir` 中的数据将被永久删除。

**注意**：容器崩溃不会从节点中移除 pod，因此 `emptyDir` 卷中的数据在容器崩溃时是安全的。

`emptyDir` 的用法有：

- 暂存空间，例如用于基于磁盘的合并排序
- 用作长时间计算崩溃恢复时的检查点
- Web服务器容器提供数据时，保存内容管理器容器提取的文件

#### Pod 示例

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: test-pd
spec:
  containers:
  - image: k8s.gcr.io/test-webserver
    name: test-container
    volumeMounts:
    - mountPath: /cache
      name: cache-volume
  volumes:
  - name: cache-volume
    emptyDir: {}
```

### fc (fibre channel)

fc 卷允许将现有的 `fc` 卷挂载到 pod 中。您可以使用卷配置中的 `targetWWN` 参数指定单个或多个目标全球通用名称（World Wide Name）。如果指定了多个 WWN，则 targetWWN 期望这些 WWN 来自多路径连接。

**重要提示**：您必须配置 FC SAN 区域划分，并预先将这些 LUN（卷）分配并屏蔽到目标 WWN，以便 Kubernetes 主机可以访问它们。

参考 [FC  示例](https://github.com/kubernetes/examples/tree/master/staging/volumes/fibre_channel)获取详细信息。

### flocker

Flocker 是一款开源的集群容器数据卷管理器。它提供了由各种存储后端支持的数据卷的管理和编排。

`flocker` 允许将 Flocker 数据集挂载到 pod 中。如果数据集在 Flocker 中不存在，则需要先使用 Flocker CLI 或使用 Flocker API 创建数据集。如果数据集已经存在，它将被 Flocker 重新连接到 pod 被调度的节点上。这意味着数据可以根据需要在数据包之间“切换”。

**重要提示**：您必须先运行自己的 Flocker 安装程序才能使用它。

参考 [Flocker 示例](https://github.com/kubernetes/examples/tree/master/staging/volumes/flocker)获取更多详细信息。

### gcePersistentDisk

`gcePersistentDisk` 卷将 Google Compute Engine（GCE）[Persistent Disk](http://cloud.google.com/compute/docs/disks) 挂载到您的容器中。与删除 Pod 时删除的 `emptyDir` 不同，PD 的内容被保留，只是卸载了卷。这意味着 PD 可以预先填充数据，并且数据可以在 Pod 之间“切换”。

**重要提示**：您必须先使用 gcloud 或 GCE API 或 UI 创建一个 PD，然后才能使用它。

使用 `gcePersistentDisk` 时有一些限制：

- 运行 Pod 的节点必须是 GCE 虚拟机
- 那些虚拟机需要在与 PD 一样在 GCE 项目和区域中

PD 的一个特点是它们可以同时被多个用户以只读方式挂载。这意味着您可以预先使用您的数据集填充 PD，然后根据需要给多个 Pod 中并行提供。不幸的是，只能由单个消费者以读写模式挂载 PD，而不允许同时写入。
在由 ReplicationController 控制的 pod 上使用 PD 将会失败，除非 PD 是只读的或者副本数是 0 或 1。

#### 创建 PD

在您在 pod 中使用 GCE PD 之前，需要先创建它。

```bash
gcloud compute disks create --size=500GB --zone=us-central1-a my-data-disk
```

#### Pod 示例

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: test-pd
spec:
  containers:
  - image: k8s.gcr.io/test-webserver
    name: test-container
    volumeMounts:
    - mountPath: /test-pd
      name: test-volume
  volumes:
  - name: test-volume
    # This GCE PD must already exist.
    gcePersistentDisk:
      pdName: my-data-disk
      fsType: ext4
```

### gitRepo

`gitRepo` 卷是一个可以演示卷插件功能的示例。它会挂载一个空目录并将 git 存储库克隆到您的容器中。将来，这样的卷可能会转移到一个更加分离的模型，而不是为每个这样的用例扩展 Kubernetes API。

下面是 gitRepo 卷示例：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: server
spec:
  containers:
  - image: nginx
    name: nginx
    volumeMounts:
    - mountPath: /mypath
      name: git-volume
  volumes:
  - name: git-volume
    gitRepo:
      repository: "git@somewhere:me/my-git-repository.git"
      revision: "22f1d8406d464b0c0874075539c1f2e96c253775"
```

### glusterfs

`glusterfs` 卷允许将 [Glusterfs](http://www.gluster.org)（一个开放源代码的网络文件系统）卷挂载到您的集群中。与删除 Pod 时删除的 `emptyDir` 不同，`glusterfs` 卷的内容将被保留，而卷仅仅被卸载。这意味着 glusterfs 卷可以预先填充数据，并且可以在数据包之间“切换”数据。 GlusterFS 可以同时由多个写入挂载。

**重要提示**：您必须先自行安装 GlusterFS，才能使用它。

有关更多详细信息，请参阅 [GlusterFS](https://github.com/kubernetes/examples/tree/master/staging/volumes/glusterfs) 示例。

### hostPath

`hostPath` 卷将主机节点的文件系统中的文件或目录挂载到集群中。该功能大多数 Pod 都用不到，但它为某些应用程序提供了一个强大的解决方法。

例如，`hostPath` 的用途如下：

- 运行需要访问 Docker 内部的容器；使用 `/var/lib/docker` 的 `hostPath`
- 在容器中运行 cAdvisor；使用 `/dev/cgroups` 的 `hostPath`
- 允许 pod 指定给定的 hostPath 是否应该在 pod 运行之前存在，是否应该创建，以及它应该以什么形式存在

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

使用这种卷类型是请注意，因为：

- 由于每个节点上的文件都不同，具有相同配置（例如从 podTemplate 创建的）的 pod 在不同节点上的行为可能会有所不同
- 当 Kubernetes 按照计划添加资源感知调度时，将无法考虑 `hostPath` 使用的资源
- 在底层主机上创建的文件或目录只能由 root 写入。您需要在特权容器中以 root 身份运行进程，或修改主机上的文件权限以便写入 `hostPath` 卷

#### Pod 示例

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: test-pd
spec:
  containers:
  - image: k8s.gcr.io/test-webserver
    name: test-container
    volumeMounts:
    - mountPath: /test-pd
      name: test-volume
  volumes:
  - name: test-volume
    hostPath:
      # directory location on host
      path: /data
      # this field is optional
      type: Directory
```

### iscsi

`iscsi` 卷允许将现有的 iSCSI（SCSI over IP）卷挂载到容器中。不像 `emptyDir`，删除 Pod 时 `iscsi` 卷的内容将被保留，卷仅仅是被卸载。这意味着 iscsi 卷可以预先填充数据，并且这些数据可以在 pod 之间“切换”。

**重要提示**：必须先创建自己的 iSCSI 服务器，然后才能使用它。

iSCSI 的一个特点是它可以同时被多个用户以只读方式安装。这意味着您可以预先使用您的数据集填充卷，然后根据需要向多个额 pod 同时提供。不幸的是，iSCSI 卷只能由单个使用者以读写模式挂载——不允许同时写入。

### local

这个 alpha 功能要求启用 `PersistentLocalVolumes` feature gate。

**注意**：从 1.9 开始，`VolumeScheduling` feature gate 也必须启用。

`local` 卷表示挂载的本地存储设备，如磁盘、分区或目录。

本地卷只能用作静态创建的 PersistentVolume。

与 HostPath 卷相比，local 卷可以以持久的方式使用，而无需手动将 pod 调度到节点上，因为系统会通过查看 PersistentVolume 上的节点关联性来了解卷的节点约束。

但是，local 卷仍然受底层节点的可用性影响，并不适用于所有应用程序。

以下是使用 `local` 卷的示例 PersistentVolume 规范：

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: example-pv
  annotations:
        "volume.alpha.kubernetes.io/node-affinity": '{
            "requiredDuringSchedulingIgnoredDuringExecution": {
                "nodeSelectorTerms": [
                    { "matchExpressions": [
                        { "key": "kubernetes.io/hostname",
                          "operator": "In",
                          "values": ["example-node"]
                        }
                    ]}
                 ]}
              }'
spec:
    capacity:
      storage: 100Gi
    accessModes:
    - ReadWriteOnce
    persistentVolumeReclaimPolicy: Delete
    storageClassName: local-storage
    local:
      path: /mnt/disks/ssd1
```

**注意**：本地 PersistentVolume 清理和删除需要手动干预，无外部提供程序。

从 1.9 开始，本地卷绑定可以被延迟，直到通过具有 StorageClass 中的 `WaitForFirstConsumer` 设置为`volumeBindingMode` 的 pod 开始调度。请参阅示例。延迟卷绑定可确保卷绑定决策也可以使用任何其他节点约束（例如节点资源需求，节点选择器，pod 亲和性和 pod 反亲和性）进行评估。

有关 `local` 卷类型的详细信息，请参见[本地持久化存储用户指南](https://github.com/kubernetes-incubator/external-storage/tree/master/local-volume)。

### nfs

`nfs` 卷允许将现有的 NFS（网络文件系统）共享挂载到您的容器中。不像 `emptyDir`，当删除 Pod 时，`nfs` 卷的内容被保留，卷仅仅是被卸载。这意味着 NFS 卷可以预填充数据，并且可以在 pod 之间“切换”数据。 NFS 可以被多个写入者同时挂载。

**重要提示**：您必须先拥有自己的 NFS 服务器才能使用它，然后才能使用它。

有关更多详细信息，请参见 [NFS 示例](https://github.com/kubernetes/examples/tree/master/staging/volumes/nfs)。

### persistentVolumeClaim

`persistentVolumeClaim` 卷用于将 [PersistentVolume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) 挂载到容器中。PersistentVolumes 是在用户不知道特定云环境的细节的情况下“声明”持久化存储（例如 GCE PersistentDisk 或 iSCSI 卷）的一种方式。

有关更多详细信息，请参阅 [PersistentVolumes 示例](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)。

### projected

`projected` 卷将几个现有的卷源映射到同一个目录中。

目前，可以映射以下类型的卷来源：

- [`secret`](#secret)
- [`downwardAPI`](#downwardapi)
- `configMap`

所有来源都必须在与 pod 相同的命名空间中。

#### 带有 secret、downward API 和 configmap 的 pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: volume-test
spec:
  containers:
  - name: container-test
    image: busybox
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
            - path: "cpu_limit"
              resourceFieldRef:
                containerName: container-test
                resource: limits.cpu
      - configMap:
          name: myconfigmap
          items:
            - key: config
              path: my-group/my-config
```

#### 使用非默认权限模式设置多个 secret 的示例 pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: volume-test
spec:
  containers:
  - name: container-test
    image: busybox
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
      - secret:
          name: mysecret2
          items:
            - key: password
              path: my-group/my-password
              mode: 511
```

每个映射的卷来源在 `sources` 下的规格中列出。除了以下两个例外，参数几乎相同：

- 对于 secret，`secretName` 字段已经被更改为 `name` 以与 ConfigMap 命名一致。
- `defaultMode` 只能在映射级别指定，而不能针对每个卷源指定。但是，如上所述，您可以明确设置每个映射的 `mode`。

### portworxVolume

`portworxVolume` 是一个与 Kubernetes 一起，以超融合模式运行的弹性块存储层。Portwork 指纹存储在服务器中，基于功能的分层，以及跨多个服务器聚合容量。 Portworx 在虚拟机或裸机 Linux 节点上运行。

`portworxVolume` 可以通过 Kubernetes 动态创建，也可以在 Kubernetes pod 中预先设置和引用。

以下是一个引用预先配置的 PortworxVolume 的示例 pod：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: test-portworx-volume-pod
spec:
  containers:
  - image: k8s.gcr.io/test-webserver
    name: test-container
    volumeMounts:
    - mountPath: /mnt
      name: pxvol
  volumes:
  - name: pxvol
    # This Portworx volume must already exist.
    portworxVolume:
      volumeID: "pxvol"
      fsType: "<fs-type>"
```

**重要提示**：在 pod 中使用之前，请确保您有一个名为 `pxvol` 的现有 PortworxVolume。

### quobyte

`quobyte` 卷允许将现有的 [Quobyte](http://www.quobyte.com) 卷挂载到容器中。

**重要提示**：您必须先创建自己的 Quobyte 安装程序，然后才能使用它。

### rbd

`rbd` 卷允许将 [Rados Block Device](http://ceph.com/docs/master/rbd/rbd/) 卷挂载到容器中。不像 `emptyDir`，删除 Pod 时 `rbd `卷的内容被保留，卷仅仅被卸载。这意味着 RBD 卷可以预先填充数据，并且可以在 pod 之间“切换”数据。

**重要提示**：您必须先自行安装 Ceph，然后才能使用 RBD。

RBD 的一个特点是它可以同时为多个用户以只读方式挂载。这意味着可以预先使用您的数据集填充卷，然后根据需要同时为多个 pod 并行提供。不幸的是，RBD 卷只能由单个用户以读写模式安装——不允许同时写入。

### scaleIO

ScaleIO 是一个基于软件的存储平台，可以使用现有的硬件来创建可扩展的共享块网络存储集群。`scaleIO` 卷插件允许已部署的 pod 访问现有的 ScaleIO 卷（或者它可以为持久性卷声明动态调配新卷，请参阅 [ScaleIO 持久卷](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#scaleio)）。

**重要提示**：您必须有一个已经配置好的 ScaleIO 集群，并和创建的卷一同运行，然后才能使用它们。

以下是使用 ScaleIO 的示例 pod 配置：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-0
spec:
  containers:
  - image: k8s.gcr.io/test-webserver
    name: pod-0
    volumeMounts:
    - mountPath: /test-pd
      name: vol-0
  volumes:
  - name: vol-0
    scaleIO:
      gateway: https://localhost:443/api
      system: scaleio
      protectionDomain: sd0
      storagePool: sp1
      volumeName: vol-0
      secretRef:
        name: sio-secret
      fsType: xfs
```

有关更多详细信息，请参阅 [ScaleIO 示例](https://github.com/kubernetes/examples/tree/master/staging/volumes/scaleio)。

### secret

`secret` 卷用于将敏感信息（如密码）传递到 pod。您可以将 secret 存储在 Kubernetes API 中，并将它们挂载为文件，以供 Pod 使用，而无需直接连接到 Kubernetes。 `secret` 卷由 tmpfs（一个 RAM 支持的文件系统）支持，所以它们永远不会写入非易失性存储器。

**重要提示**：您必须先在 Kubernetes API 中创建一个 secret，然后才能使用它。

### storageOS

`storageos` 卷允许将现有的 [StorageOS](https://www.storageos.com) 卷挂载到容器中。

StorageOS 在 Kubernetes 环境中以容器方式运行，使本地或附加存储可以从 Kubernetes 集群中的任何节点访问。可以复制数据以防止节点故障。精简配置和压缩可以提高利用率并降低成本。

StorageOS 的核心是为容器提供块存储，可以通过文件系统访问。

StorageOS 容器需要 64 位 Linux，没有额外的依赖关系。可以使用免费的开发者许可证。

**重要提示**：您必须在每个要访问 StorageOS 卷的节点上运行 StorageOS 容器，或者为该池提供存储容量。相关的安装说明，请参阅 [StorageOS文档](https://docs.storageos.com)。

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    name: redis
    role: master
  name: test-storageos-redis
spec:
  containers:
    - name: master
      image: kubernetes/redis:v1
      env:
        - name: MASTER
          value: "true"
      ports:
        - containerPort: 6379
      volumeMounts:
        - mountPath: /redis-master-data
          name: redis-data
  volumes:
    - name: redis-data
      storageos:
        # The `redis-vol01` volume must already exist within StorageOS in the `default` namespace.
        volumeName: redis-vol01
        fsType: ext4
```

### vsphereVolume

**先决条件**：配置了 vSphere Cloud Provider 的 Kubernetes。有关云提供商的配置，请参阅 [vSphere 入门指南](https://vmware.github.io/vsphere-storage-for-kubernetes/documentation/)。

`vsphereVolume` 用于将 vSphere VMDK 卷挂载到 Pod 中。卷的内容在卸载时会被保留。支持 VMFS 和 VSAN 数据存储。

**重要提示**：在 Pod 中使用它之前，您必须使用以下一种方法创建 VMDK。

#### 创建 VMDK 卷

选择以下方法之一来创建 VMDK。

首先进入 ESX，然后使用以下命令创建一个 VMDK：

```bash
vmkfstools -c 2G /vmfs/volumes/DatastoreName/volumes/myDisk.vmdk
```

使用下列命令创建一个 VMDK：

```bash
vmware-vdiskmanager -c -t 0 -s 40GB -a lsilogic myDisk.vmdk
```

#### vSphere VMDK 示例配置

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: test-vmdk
spec:
  containers:
  - image: k8s.gcr.io/test-webserver
    name: test-container
    volumeMounts:
    - mountPath: /test-vmdk
      name: test-volume
  volumes:
  - name: test-volume
    # This VMDK volume must already exist.
    vsphereVolume:
      volumePath: "[DatastoreName] volumes/myDisk"
      fsType: ext4
```

更多的例子可以在[这里](https://github.com/kubernetes/examples/tree/master/staging/volumes/vsphere)找到。

## 使用 subPath

有时，在单个容器中共享一个卷用于多个用途是有用的。`volumeMounts.subPath` 属性可用于在引用的卷内而不是其根目录中指定子路径。

下面是一个使用单个共享卷的 LAMP 堆栈（Linux Apache Mysql PHP）的示例。 HTML 内容被映射到它的 html 目录，数据库将被存储在它的 mysql 目录中：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-lamp-site
spec:
    containers:
    - name: mysql
      image: mysql
      env:
      - name: MYSQL_ROOT_PASSWORD
        value: "rootpasswd" 
      volumeMounts:
      - mountPath: /var/lib/mysql
        name: site-data
        subPath: mysql
    - name: php
      image: php:7.0-apache
      volumeMounts:
      - mountPath: /var/www/html
        name: site-data
        subPath: html
    volumes:
    - name: site-data
      persistentVolumeClaim:
        claimName: my-lamp-site-data
```

## 资源

`emptyDir` 卷的存储介质（磁盘、SSD 等）由保存在 kubelet 根目录的文件系统的介质（通常是 `/var/lib/kubelet`）决定。 `emptyDir` 或 `hostPath` 卷可占用多少空间并没有限制，容器之间或 Pod 之间也没有隔离。

在将来，我们预计 `emptyDir` 和 `hostPath` 卷将能够使用 [resource](https://kubernetes.io/docs/user-guide/compute-resources) 规范请求一定的空间，并选择要使用的介质，适用于具有多种媒体类型的集群。

## Out-of-Tree 卷插件

除了之前列出的卷类型之外，存储供应商可以创建自定义插件而不将其添加到 Kubernetes 存储库中。可以通过使用 `FlexVolume` 插件来实现。

`FlexVolume`使用户能够将供应商卷挂载到容器中。供应商插件是使用驱动程序实现的，该驱动程序支持由 `FlexVolume` API定义的一系列卷命令。驱动程序必须安装在每个节点的预定义卷插件路径中。

更多细节可以在[这里](https://github.com/kubernetes/community/blob/master/contributors/devel/flexvolume.md)找到。

## 挂载传播

**注意**：挂载传播是 Kubernetes 1.8 中的一个 alpha 特性，在将来的版本中可能会重新设计甚至删除。

挂载传播允许将由容器挂载的卷共享到同一个 Pod 中的其他容器上，甚至是同一节点上的其他 Pod。

如果禁用 MountPropagation 功能，则不会传播 pod 中的卷挂载。也就是说，容器按照 [Linux内核文档](https://www.kernel.org/doc/Documentation/filesystems/sharedsubtree.txt)中所述的 `private` 挂载传播运行。

要启用此功能，请在 `--feature-gates` 命令行选项中指定 `MountPropagation = true`。启用时，容器的 `volumeMounts` 字段有一个新的 `mountPropagation` 子字段。它的值为：

- `HostToContainer`：此卷挂载将接收所有后续挂载到此卷或其任何子目录的挂载。这是 MountPropagation 功能启用时的默认模式。

  同样的，如果任何带有 `Bidirectional` 挂载传播的 pod 挂载到同一个卷上，带有 `HostToContainer` 挂载传播的容器将会看到它。

  该模式等同于[Linux内核文档](https://www.kernel.org/doc/Documentation/filesystems/sharedsubtree.txt)中描述的 `rslave` 挂载传播。

- `Bidirectional` 卷挂载与 `HostToContainer` 挂载相同。另外，由容器创建的所有卷挂载将被传播回主机和所有使用相同卷的容器的所有容器。

  此模式的一个典型用例是带有 Flex 卷驱动器或需要使用 HostPath 卷在主机上挂载某些内容的 pod。

  该模式等同于 [Linux内核文档](https://www.kernel.org/doc/Documentation/filesystems/sharedsubtree.txt)中所述的 `rshared` 挂载传播。

**小心**：双向挂载传播可能是危险的。它可能会损坏主机操作系统，因此只能在特权容器中使用。强烈建议熟悉 Linux 内核行为。另外，容器在 Pod 中创建的任何卷挂载必须在容器终止时销毁（卸载）。

## 参考

- https://kubernetes.io/docs/concepts/storage/volumes/

- [使用持久化卷来部署 WordPress 和 MySQL](https://kubernetes.io/docs/tutorials/stateful-application/mysql-wordpress-persistent-volume/)