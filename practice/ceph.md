# Ceph
本文将向你简要介绍开源的分布式对象存储 Ceph。

Ceph 是一个开源的分布式对象，块和文件存储。该项目诞生于 2003 年，是塞奇・韦伊的博士论文的结果，然后在 2006 年在 LGPL 2.1 许可证发布。Ceph 已经与 Linux 内核 KVM 集成，并且默认包含在许多 GNU / Linux 发行版中。

## 介绍

当前的工作负载和基础设施需要不同的数据访问方法（对象，块，文件），Ceph 支持所有这些方法。它旨在具有可扩展性，并且没有单点故障。它是一款开源软件，可以在生产环境，通用硬件上运行。

RADOS （可靠的自动分布式对象存储）是 Ceph 的核心组件。RADOS 对象和当今流行的对象之间存在着重要的区别，例如 Amazon S3，OpenStack Swift 或 Ceph 的 RADOS 对象网关提供的对象。从 2005 年到 2010 年，对象存储设备（OSD）成为一个流行的概念。这些 OSD 提供了强大的一致性，提供不同的接口，并且每个对象通常驻留在单个设备上。

在 RADOS 中有几种操作对象的方法：

- 在用 C，C ++，Java，PHP 和 Python 编写的应用程序中使用客户端库（librados）
- 使用命令行工具 'rados'
- 使用与 S3（Amazon）和 Swift（OpenStack）兼容的现有 API

RADOS 是一个由 Ceph 节点组成的集群。有两种类型的节点：

- Ceph 存储设备节点
- Ceph 监控节点

每个 Ceph 存储设备节点运行一个或多个 Ceph OSD 守护进程，每个磁盘设备一个。OSD 是一个 Linux 进程（守护进程），可处理与其分配的磁盘（HDD 或 SSD）相关的所有操作。所述 OSD 守护程序访问本地文件系统来存储数据和元数据，而不是直接与磁盘通信。Ceph 常用的文件系统是 XFS，btrfs 和 ext4。每个 OSD 还需要一个日志，用于对 RADOS 对象进行原子更新。日志可能驻留在单独的磁盘上（通常是 SSD 以提高性能），但同一个磁盘可以被同一节点上的多个 OSD 使用。

该 Ceph 的监控节点上运行的单个 Ceph 的监控守护。Ceph Monitor 守护程序维护集群映射的主副本。虽然 Ceph 集群可以与单个监控节点一起工作，但需要更多设备来确保高可用性。建议使用三个或更多 Ceph Monitor 节点，因为它们使用法定数量来维护集群映射。需要大多数 Monitor 来确认仲裁数，因此建议使用奇数个 Monitor。例如，3 个或 4 个 Monitor 都可以防止单个故障，而 5 个 Monitor 可以防止两个故障。

Ceph OSD 守护进程和 Ceph 客户端可以感知群集，因此每个 Ceph OSD 守护进程都可以直接与其他 Ceph OSD 守护进程和 Ceph 监视器进行通信。此外，Ceph 客户端可直接与 Ceph OSD 守护进程通信以读取和写入数据。

Ceph 对象网关守护进程（radosgw） 提供了两个 API：

- API 与 Amazon S3 RESTful AP 的子集兼容
- API 与 OpenStack Swift API 的子集兼容

如果 RADOS 和 radosgw 为客户提供对象存储服务，那么 Ceph 如何被用作块和文件存储？

Ceph 中的分布式块存储（Ceph RDB）实现为对象存储顶部的薄层。Ceph RADOS 块设备（RBD）存储分布在群集中多个 Ceph OSD 上的数据。RBD 利用 RADOS 功能，如快照，复制和一致性。RBD 使用 Linux 内核模块或 librbd 库与 RADOS 通信。此外，KVM 管理程序可以利用 librbd 允许虚拟机访问 Ceph 卷。

Ceph 文件系统（CephFS）是一个符合 POSIX 的文件系统，使用 Ceph 集群来存储其数据。所述 Ceph 的文件系统要求 Ceph 的集群中的至少一个 Ceph 的元数据服务器（MDS）。MDS 处理所有文件操作，例如文件和目录列表，属性，所有权等。MDS 利用 RADOS 对象来存储文件系统数据和属性。它可以水平扩展，因此您可以将更多的 Ceph 元数据服务器添加到您的群集中，以支持更多的文件系统操作客户端。

## Kubernetes 和 Ceph

Kubernetes 支持 Ceph 的块存储（Ceph RBD）和文件存储（CephFS）作为 Kubernetes 的持久存储后端。Kubernetes 自带 Ceph RBD 的 internal provisioner，可以配置动态提供，如果要使用 CephFS 作为动态存储提供，需要安装外置的 provisioner。

请参考与 Ceph 相关的 Kubernetes StorageClass 的[官方文档介绍](https://kubernetes.io/docs/concepts/storage/storage-classes/)。

| Volume Plugin        | Internal Provisioner |  Config Example  |
| :------------------- | :------------------: | :--------------: |
| AWSElasticBlockStore |          ✓           |       AWS        |
| AzureFile            |          ✓           |    Azure File    |
| AzureDisk            |          ✓           |    Azure Disk    |
| CephFS               |          -           |        -         |
| Cinder               |          ✓           | OpenStack Cinder |
| FC                   |          -           |        -         |
| FlexVolume           |          -           |        -         |
| Flocker              |          ✓           |        -         |
| GCEPersistentDisk    |          ✓           |       GCE        |
| Glusterfs            |          ✓           |    Glusterfs     |
| iSCSI                |          -           |        -         |
| PhotonPersistentDisk |          ✓           |        -         |
| Quobyte              |          ✓           |     Quobyte      |
| NFS                  |          -           |        -         |
| RBD                  |          ✓           |     Ceph RBD     |
| VsphereVolume        |          ✓           |     vSphere      |
| PortworxVolume       |          ✓           | Portworx Volume  |
| ScaleIO              |          ✓           |     ScaleIO      |
| StorageOS            |          ✓           |    StorageOS     |
| Local                |          -           |      Local       |

后续章节将介绍 Kubernetes 如何与 Ceph RDB 和 CephFS 集成。
