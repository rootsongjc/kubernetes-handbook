# Ceph的简要介绍
本文参考翻译自[这篇文章](https://www.stratoscale.com/blog/storage/introduction-to-ceph/)的部分内容。

Ceph是一个开源的分布式对象，块和文件存储。该项目诞生于2003年，是塞奇·韦伊的博士论文的结果，然后在2006年在LGPL 2.1许可证发布。Ceph已经与Linux内核KVM集成，并且默认包含在许多GNU / Linux发行版中。

## 介绍
当前的工作负载和基础设施需要不同的数据访问方法（对象，块，文件），Ceph支持所有这些方法。它旨在具有可扩展性，并且没有单点故障。它是一款开源软件，可以在生产环境，通用硬件上运行。

RADOS （可靠的自动分布式对象存储）是Ceph的核心组件。RADOS对象和当今流行的对象之间存在着重要的区别，例如Amazon S3，OpenStack Swift或Ceph的RADOS对象网关提供的对象。从2005年到2010年，对象存储设备（OSD）成为一个流行的概念。这些OSD提供了强大的一致性，提供不同的接口，并且每个对象通常驻留在单个设备上。

在RADOS中有几种操作对象的方法：
* 在用C，C ++，Java，PHP和Python编写的应用程序中使用客户端库（librados）
* 使用命令行工具'rados'
* 使用与S3（Amazon）和Swift（OpenStack）兼容的现有API

RADOS是一个由Ceph节点组成的集群。有两种类型的节点：
* Ceph存储设备节点
* Ceph监控节点

每个Ceph存储设备节点运行一个或多个Ceph OSD守护进程，每个磁盘设备一个。OSD是一个Linux进程（守护进程），可处理与其分配的磁盘（HDD或SSD）相关的所有操作。所述OSD守护程序访问本地文件系统来存储数据和元数据，而不是直接与磁盘通信。Ceph常用的文件系统是XFS，btrfs和ext4。每个OSD还需要一个日志，用于对RADOS对象进行原子更新。日志可能驻留在单独的磁盘上（通常是SSD以提高性能），但同一个磁盘可以被同一节点上的多个OSD使用。

该Ceph的监控节点上运行的单个Ceph的监控守护。Ceph Monitor守护程序维护集群映射的主副本。虽然Ceph集群可以与单个监控节点一起工作，但需要更多设备来确保高可用性。建议使用三个或更多Ceph Monitor节点，因为它们使用法定数量来维护集群映射。需要大多数Monitor来确认仲裁数，因此建议使用奇数个Monitor。例如，3个或4个Monitor都可以防止单个故障，而5个Monitor可以防止两个故障。

Ceph OSD守护进程和Ceph客户端可以感知群集，因此每个Ceph OSD守护进程都可以直接与其他Ceph OSD守护进程和Ceph监视器进行通信。此外，Ceph客户端可直接与Ceph OSD守护进程通信以读取和写入数据。

Ceph对象网关守护进程（radosgw） 提供了两个API：
* API与Amazon S3 RESTful AP的子集兼容
* API与OpenStack Swift API的子集兼容

如果RADOS和radosgw为客户提供对象存储服务，那么Ceph如何被用作块和文件存储？

Ceph中的分布式块存储（Ceph RDB）实现为对象存储顶部的薄层。Ceph RADOS块设备（RBD）存储分布在群集中多个Ceph OSD上的数据。RBD利用RADOS功能，如快照，复制和一致性。RBD使用Linux内核模块或librbd库与RADOS通信。此外，KVM管理程序可以利用librbd允许虚拟机访问Ceph卷。

Ceph文件系统（CephFS）是一个符合POSIX的文件系统，使用Ceph集群来存储其数据。所述Ceph的文件系统要求Ceph的集群中的至少一个Ceph的元数据服务器（MDS）。MDS处理所有文件操作，例如文件和目录列表，属性，所有权等。MDS利用RADOS对象来存储文件系统数据和属性。它可以水平扩展，因此您可以将更多的Ceph元数据服务器添加到您的群集中，以支持更多的文件系统操作客户端。

## Kubernetes和Ceph
Kubernetes支持Ceph的块存储（Ceph RBD）和文件存储（CephFS）作为Kubernetes的持久存储后端。Kubernetes自带Ceph RBD的internal provisioner，可以配置动态提供，如果要使用CephFS作为动态存储提供，需要安装外置的provisioner。

与Ceph相关的Kubernetes StorageClass的[官方文档介绍](https://kubernetes.io/docs/concepts/storage/storage-classes/)

| Volume Plugin        | Internal Provisioner| Config Example                       |
| :---                 |     :---:           |    :---:                             |
| AWSElasticBlockStore | &#x2713;            | [AWS](#aws)                          |
| AzureFile            | &#x2713;            | [Azure File](#azure-file)            |
| AzureDisk            | &#x2713;            | [Azure Disk](#azure-disk)            |
| CephFS               | -                   | -                                    |
| Cinder               | &#x2713;            | [OpenStack Cinder](#openstack-cinder)|
| FC                   | -                   | -                                    |
| FlexVolume           | -                   | -                                    |
| Flocker              | &#x2713;            | -                                    |
| GCEPersistentDisk    | &#x2713;            | [GCE](#gce)                          |
| Glusterfs            | &#x2713;            | [Glusterfs](#glusterfs)              |
| iSCSI                | -                   | -                                    |
| PhotonPersistentDisk | &#x2713;            | -                                    |
| Quobyte              | &#x2713;            | [Quobyte](#quobyte)                  |
| NFS                  | -                   | -                                    |
| RBD                  | &#x2713;            | [Ceph RBD](#ceph-rbd)                |
| VsphereVolume        | &#x2713;            | [vSphere](#vsphere)                  |
| PortworxVolume       | &#x2713;            | [Portworx Volume](#portworx-volume)  |
| ScaleIO              | &#x2713;            | [ScaleIO](#scaleio)                  |
| StorageOS            | &#x2713;            | [StorageOS](#storageos)              |
| Local                | -                   | [Local](#local)              |

后续文档将介绍Kubernetes如何与Ceph RDB 和 CephFS集成。
