---
title: "Kubernetes中的开放接口CRI、CNI、CSI"
tags: ["kubernetes"]
categories: "kubernetes"
date: 2018-01-29T12:26:38+08:00
subtitle: "容器运行时接口、容器网络接口、容器存储接口解析"
draft: false
descriptions: "Kubernetes作为云原生应用的最佳部署平台，已经开放了容器运行时接口（CRI）、容器网络接口（CNI）和容器存储接口（CSI），这些接口让Kubernetes的开放性变得最大化，而Kubernetes本身则专注于容器调度。本文节选自Kubernetes Handbook - jimmysong.io"
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/2018012901.jpg", desc: "Fantasy"}]

---

Kubernetes作为云原生应用的最佳部署平台，已经开放了容器运行时接口（CRI）、容器网络接口（CNI）和容器存储接口（CSI），这些接口让Kubernetes的开放性变得最大化，而Kubernetes本身则专注于容器调度。

本文节选自[Kubernetes Handbook - jimmysong.io](http://link.zhihu.com/?target=https%3A//jimmysong.io/kubernetes-handbook/)

CRI中定义了**容器**和**镜像**的服务的接口，因为容器运行时与镜像的生命周期是彼此隔离的，因此需要定义两个服务。该接口使用[Protocol Buffer](https://developers.google.com/protocol-buffers/)，基于[gRPC](https://grpc.io/)，在kubernetes v1.7+版本中是在[pkg/kubelet/apis/cri/v1alpha1/runtime](https://github.com/kubernetes/kubernetes/tree/master/pkg/kubelet/apis/cri/v1alpha1/runtime)的`api.proto`中定义的。

## CRI架构

Container Runtime实现了CRI gRPC Server，包括`RuntimeService`和`ImageService`。该gRPC Server需要监听本地的Unix socket，而kubelet则作为gRPC Client运行。

![CRI架构-图片来自kubernetes blog](https://jimmysong.io/kubernetes-handbook/images/cri-architecture.png)图片 - CRI架构-图片来自kubernetes blog

## 启用CRI

除非集成了rktnetes，否则CRI都是被默认启用了，kubernetes1.7版本开始旧的预集成的docker CRI已经被移除。

要想启用CRI只需要在kubelet的启动参数重传入此参数：`--container-runtime-endpoint`远程运行时服务的端点。当前Linux上支持unix socket，windows上支持tcp。例如：`unix:///var/run/dockershim.sock`、 `tcp://localhost:373`，默认是`unix:///var/run/dockershim.sock`，即默认使用本地的docker作为容器运行时。

关于CRI的详细进展请参考[CRI: the Container Runtime Interface](https://github.com/kubernetes/community/blob/master/contributors/devel/container-runtime-interface.md)。

## CRI接口

Kubernetes1.9中的CRI接口在`api.proto`中的定义如下：

```go
// Runtime service defines the public APIs for remote container runtimes
service RuntimeService {
    // Version returns the runtime name, runtime version, and runtime API version.
    rpc Version(VersionRequest) returns (VersionResponse) {}

    // RunPodSandbox creates and starts a pod-level sandbox. Runtimes must ensure
    // the sandbox is in the ready state on success.
    rpc RunPodSandbox(RunPodSandboxRequest) returns (RunPodSandboxResponse) {}
    // StopPodSandbox stops any running process that is part of the sandbox and
    // reclaims network resources (e.g., IP addresses) allocated to the sandbox.
    // If there are any running containers in the sandbox, they must be forcibly
    // terminated.
    // This call is idempotent, and must not return an error if all relevant
    // resources have already been reclaimed. kubelet will call StopPodSandbox
    // at least once before calling RemovePodSandbox. It will also attempt to
    // reclaim resources eagerly, as soon as a sandbox is not needed. Hence,
    // multiple StopPodSandbox calls are expected.
    rpc StopPodSandbox(StopPodSandboxRequest) returns (StopPodSandboxResponse) {}
    // RemovePodSandbox removes the sandbox. If there are any running containers
    // in the sandbox, they must be forcibly terminated and removed.
    // This call is idempotent, and must not return an error if the sandbox has
    // already been removed.
    rpc RemovePodSandbox(RemovePodSandboxRequest) returns (RemovePodSandboxResponse) {}
    // PodSandboxStatus returns the status of the PodSandbox. If the PodSandbox is not
    // present, returns an error.
    rpc PodSandboxStatus(PodSandboxStatusRequest) returns (PodSandboxStatusResponse) {}
    // ListPodSandbox returns a list of PodSandboxes.
    rpc ListPodSandbox(ListPodSandboxRequest) returns (ListPodSandboxResponse) {}

    // CreateContainer creates a new container in specified PodSandbox
    rpc CreateContainer(CreateContainerRequest) returns (CreateContainerResponse) {}
    // StartContainer starts the container.
    rpc StartContainer(StartContainerRequest) returns (StartContainerResponse) {}
    // StopContainer stops a running container with a grace period (i.e., timeout).
    // This call is idempotent, and must not return an error if the container has
    // already been stopped.
    // TODO: what must the runtime do after the grace period is reached?
    rpc StopContainer(StopContainerRequest) returns (StopContainerResponse) {}
    // RemoveContainer removes the container. If the container is running, the
    // container must be forcibly removed.
    // This call is idempotent, and must not return an error if the container has
    // already been removed.
    rpc RemoveContainer(RemoveContainerRequest) returns (RemoveContainerResponse) {}
    // ListContainers lists all containers by filters.
    rpc ListContainers(ListContainersRequest) returns (ListContainersResponse) {}
    // ContainerStatus returns status of the container. If the container is not
    // present, returns an error.
    rpc ContainerStatus(ContainerStatusRequest) returns (ContainerStatusResponse) {}
    // UpdateContainerResources updates ContainerConfig of the container.
    rpc UpdateContainerResources(UpdateContainerResourcesRequest) returns (UpdateContainerResourcesResponse) {}

    // ExecSync runs a command in a container synchronously.
    rpc ExecSync(ExecSyncRequest) returns (ExecSyncResponse) {}
    // Exec prepares a streaming endpoint to execute a command in the container.
    rpc Exec(ExecRequest) returns (ExecResponse) {}
    // Attach prepares a streaming endpoint to attach to a running container.
    rpc Attach(AttachRequest) returns (AttachResponse) {}
    // PortForward prepares a streaming endpoint to forward ports from a PodSandbox.
    rpc PortForward(PortForwardRequest) returns (PortForwardResponse) {}

    // ContainerStats returns stats of the container. If the container does not
    // exist, the call returns an error.
    rpc ContainerStats(ContainerStatsRequest) returns (ContainerStatsResponse) {}
    // ListContainerStats returns stats of all running containers.
    rpc ListContainerStats(ListContainerStatsRequest) returns (ListContainerStatsResponse) {}

    // UpdateRuntimeConfig updates the runtime configuration based on the given request.
    rpc UpdateRuntimeConfig(UpdateRuntimeConfigRequest) returns (UpdateRuntimeConfigResponse) {}

    // Status returns the status of the runtime.
    rpc Status(StatusRequest) returns (StatusResponse) {}
}

// ImageService defines the public APIs for managing images.
service ImageService {
    // ListImages lists existing images.
    rpc ListImages(ListImagesRequest) returns (ListImagesResponse) {}
    // ImageStatus returns the status of the image. If the image is not
    // present, returns a response with ImageStatusResponse.Image set to
    // nil.
    rpc ImageStatus(ImageStatusRequest) returns (ImageStatusResponse) {}
    // PullImage pulls an image with authentication config.
    rpc PullImage(PullImageRequest) returns (PullImageResponse) {}
    // RemoveImage removes the image.
    // This call is idempotent, and must not return an error if the image has
    // already been removed.
    rpc RemoveImage(RemoveImageRequest) returns (RemoveImageResponse) {}
    // ImageFSInfo returns information of the filesystem that is used to store images.
    rpc ImageFsInfo(ImageFsInfoRequest) returns (ImageFsInfoResponse) {}
}
```

这其中包含了两个gRPC服务：

- **RuntimeService**：容器和Sandbox运行时管理
- **ImageService**：提供了从镜像仓库拉取、查看、和移除镜像的RPC。

## 当前支持的CRI后端

我们最初在使用Kubernetes时通常会默认使用Docker作为容器运行时，其实从Kubernetes1.5开始已经开始支持CRI，目前是处于Alpha版本，通过CRI接口可以指定使用其它容器运行时作为Pod的后端，目前支持CNI的后端有：

- [cri-o](https://github.com/kubernetes-incubator/cri-o)：同时兼容OCI和CRI的容器运行时
- [cri-containerd](https://github.com/containerd/cri-containerd)：基于[Containerd](https://github.com/containerd/containerd)的Kubernetes CNI实现
- [rkt](https://coreos.com/rkt/)：由于CoreOS主推的用来跟docker抗衡的容器运行时
- [frakti](https://github.com/kubernetes/frakti)：基于hypervisor的CRI
- [docker](https://www.docker.com/)：kuberentes最初就开始支持的容器运行时，目前还没完全从kubelet中解耦，docker公司同时推广了[OCI](https://www.opencontainers.org/)标准
- [clear-containers](https://github.com/clearcontainers)：由Intel推出的同时兼容OCI和CRI的容器运行时
- [kata-containers](https://katacontainers.io/)：符合OCI规范同时兼容CRI

CRI是由[SIG-Node](https://kubernetes.slack.com/archives/sig-node)来维护的。

# CNI - Container Network Interface（容器网络接口）

CNI（Container Network Interface）是CNCF旗下的一个项目，由一组用于配置Linux容器的网络接口的规范和库组成，同时还包含了一些插件。CNI仅关心容器创建时的网络分配，和当容器被删除时释放网络资源。通过此链接浏览该项目：<https://github.com/containernetworking/cni>。

Kubernetes源码的`vendor/github.com/containernetworking/cni/libcni`目录中已经包含了CNI的代码，也就是说kubernetes中已经内置了CNI。

## 接口定义

CNI的接口中包括以下几个方法：

```go
type CNI interface {
    AddNetworkList(net *NetworkConfigList, rt *RuntimeConf) (types.Result, error)
    DelNetworkList(net *NetworkConfigList, rt *RuntimeConf) error

    AddNetwork(net *NetworkConfig, rt *RuntimeConf) (types.Result, error)
    DelNetwork(net *NetworkConfig, rt *RuntimeConf) error
}

```

该接口只有四个方法，添加网络、删除网络、添加网络列表、删除网络列表。

## 设计考量

CNI设计的时候考虑了以下问题：

- 容器运行时必须在调用任何插件之前为容器创建一个新的网络命名空间。
- 然后，运行时必须确定这个容器应属于哪个网络，并为每个网络确定哪些插件必须被执行。
- 网络配置采用JSON格式，可以很容易地存储在文件中。网络配置包括必填字段，如`name`和`type`以及插件（类型）。网络配置允许字段在调用之间改变值。为此，有一个可选的字段`args`，必须包含不同的信息。
- 容器运行时必须按顺序为每个网络执行相应的插件，将容器添加到每个网络中。
- 在完成容器生命周期后，运行时必须以相反的顺序执行插件（相对于执行添加容器的顺序）以将容器与网络断开连接。
- 容器运行时不能为同一容器调用并行操作，但可以为不同的容器调用并行操作。
- 容器运行时必须为容器订阅ADD和DEL操作，这样ADD后面总是跟着相应的DEL。 DEL可能跟着额外的DEL，但是，插件应该允许处理多个DEL（即插件DEL应该是幂等的）。
- 容器必须由ContainerID唯一标识。存储状态的插件应该使用（网络名称，容器ID）的主键来完成。
- 运行时不能调用同一个网络名称或容器ID执行两次ADD（没有相应的DEL）。换句话说，给定的容器ID必须只能添加到特定的网络一次。

## CNI插件

CNI插件必须实现一个可执行文件，这个文件可以被容器管理系统（例如rkt或Kubernetes）调用。

CNI插件负责将网络接口插入容器网络命名空间（例如，veth对的一端），并在主机上进行任何必要的改变（例如将veth的另一端连接到网桥）。然后将IP分配给接口，并通过调用适当的IPAM插件来设置与“IP地址管理”部分一致的路由。

### 参数

CNI插件必须支持以下操作：

#### 将容器添加到网络

参数：

- **版本**。调用者正在使用的CNI规范（容器管理系统或调用插件）的版本。
- **容器ID**。由运行时分配的容器的唯一明文标识符。一定不能是空的。
- **网络命名空间路径**。要添加的网络名称空间的路径，即`/proc/[pid]/ns/net`或绑定挂载/链接。
- **网络配置**。描述容器可以加入的网络的JSON文档。架构如下所述。
- **额外的参数**。这提供了一个替代机制，允许在每个容器上简单配置CNI插件。
- **容器内接口的名称**。这是应该分配给容器（网络命名空间）内创建的接口的名称；因此它必须符合Linux接口名称上的标准限制。

结果：

- **接口列表**。根据插件的不同，这可以包括沙箱（例如容器或管理程序）接口名称和/或主机接口名称，每个接口的硬件地址以及接口所在的沙箱（如果有的话）的详细信息。
- **分配给每个接口的IP配置**。分配给沙箱和/或主机接口的IPv4和/或IPv6地址，网关和路由。
- **DNS信息**。包含nameserver、domain、search domain和option的DNS信息的字典。

#### 从网络中删除容器

参数：

- **版本**。调用者正在使用的CNI规范（容器管理系统或调用插件）的版本。
- **容器ID**，如上所述。
- **网络命名空间路径**，如上定义。
- **网络配置**，如上所述。
- **额外的参数**，如上所述。
- **上面定义的容器**内的接口的名称。
- 所有参数应与传递给相应的添加操作的参数相同。
- 删除操作应释放配置的网络中提供的containerid拥有的所有资源。

报告版本

- 参数：无。
- 结果：插件支持的CNI规范版本信息。

```json
{
"cniVersion"："0.3.1"，//此输出使用的CNI规范的版本
"supportedVersions"：["0.1.0"，"0.2.0"，"0.3.0"，"0.3.1"] //此插件支持的CNI规范版本列表
}
```

CNI插件的详细说明请参考：[CNI SPEC](https://github.com/containernetworking/cni/blob/master/SPEC.md)。

### IP分配

作为容器网络管理的一部分，CNI插件需要为接口分配（并维护）IP地址，并安装与该接口相关的所有必要路由。这给了CNI插件很大的灵活性，但也给它带来了很大的负担。众多的CNI插件需要编写相同的代码来支持用户需要的多种IP管理方案（例如dhcp、host-local）。

为了减轻负担，使IP管理策略与CNI插件类型解耦，我们定义了IP地址管理插件（IPAM插件）。CNI插件的职责是在执行时恰当地调用IPAM插件。 IPAM插件必须确定接口IP/subnet，网关和路由，并将此信息返回到“主”插件来应用配置。 IPAM插件可以通过协议（例如dhcp）、存储在本地文件系统上的数据、网络配置文件的“ipam”部分或上述的组合来获得信息。

#### IPAM插件

像CNI插件一样，调用IPAM插件的可执行文件。可执行文件位于预定义的路径列表中，通过`CNI_PATH`指示给CNI插件。 IPAM插件必须接收所有传入CNI插件的相同环境变量。就像CNI插件一样，IPAM插件通过stdin接收网络配置。

## 可用插件

### Main：接口创建

- **bridge**：创建网桥，并添加主机和容器到该往桥
- **ipvlan**：在容器中添加一个[ipvlan](https://www.kernel.org/doc/Documentation/networking/ipvlan.txt)接口
- **loopback**：创建一个回环接口
- **macvlan**：创建一个新的MAC地址，将所有的流量转发到容器
- **ptp**：创建veth对
- **vlan**：分配一个vlan设备

### IPAM：IP地址分配

- **dhcp**：在主机上运行守护程序，代表容器发出DHCP请求
- **host-local**：维护分配IP的本地数据库

### Meta：其它插件

- **flannel**：根据flannel的配置文件创建接口
- **tuning**：调整现有接口的sysctl参数
- **portmap**：一个基于iptables的portmapping插件。将端口从主机的地址空间映射到容器。

# CSI - Container Storage Interface（容器存储接口）

CSI 代表[容器存储接口](https://github.com/container-storage-interface/spec/blob/master/spec.md)，CSI 试图建立一个行业标准接口的规范，借助 CSI 容器编排系统（CO）可以将任意存储系统暴露给自己的容器工作负载。有关详细信息，请查看[设计方案](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/storage/container-storage-interface.md)。

`csi` 卷类型是一种 in-tree（即跟其它存储插件在同一个代码路径下，随 Kubernetes 的代码同时编译的） 的 CSI 卷插件，用于 Pod 与在同一节点上运行的外部 CSI 卷驱动程序交互。部署 CSI 兼容卷驱动后，用户可以使用 `csi` 作为卷类型来挂载驱动提供的存储。

CSI 持久化卷支持是在 Kubernetes v1.9 中引入的，作为一个 alpha 特性，必须由集群管理员明确启用。换句话说，集群管理员需要在 apiserver、controller-manager 和 kubelet 组件的 “`--feature-gates =`” 标志中加上 “`CSIPersistentVolume = true`”。

CSI 持久化卷具有以下字段可供用户指定：

- `driver`：一个字符串值，指定要使用的卷驱动程序的名称。必须少于 63 个字符，并以一个字符开头。驱动程序名称可以包含 “。”、“ - ”、“_” 或数字。
- `volumeHandle`：一个字符串值，唯一标识从 CSI 卷插件的 `CreateVolume` 调用返回的卷名。随后在卷驱动程序的所有后续调用中使用卷句柄来引用该卷。
- `readOnly`：一个可选的布尔值，指示卷是否被发布为只读。默认是 false。

## 使用说明

下面将介绍如何使用 CSI。

### 动态配置

可以通过为 CSI 创建插件 `StorageClass` 来支持动态配置的 CSI Storage 插件启用自动创建/删除 。

例如，以下 `StorageClass` 允许通过名为 `com.example.team/csi-driver` 的 CSI Volume Plugin 动态创建 “fast-storage” Volume。

```yaml
kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
  name: fast-storage
provisioner: com.example.team/csi-driver
parameters:
  type: pd-ssd
```

要触发动态配置，请创建一个 `PersistentVolumeClaim` 对象。例如，下面的 PersistentVolumeClaim 可以使用上面的 StorageClass 触发动态配置。

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-request-for-storage
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: fast-storage
```

当动态创建 Volume 时，通过 CreateVolume 调用，将参数 `type：pd-ssd` 传递给 CSI 插件 `com.example.team/csi-driver` 。作为响应，外部 Volume 插件会创建一个新 Volume，然后自动创建一个 `PersistentVolume` 对象来对应前面的 PVC 。然后，Kubernetes 会将新的 `PersistentVolume` 对象绑定到 `PersistentVolumeClaim`，使其可以使用。

如果 `fast-storage` StorageClass 被标记为默认值，则不需要在 `PersistentVolumeClaim` 中包含 StorageClassName，它将被默认使用。

### 预配置 Volume

您可以通过手动创建一个 `PersistentVolume` 对象来展示现有 Volumes，从而在 Kubernetes 中暴露预先存在的 Volume。例如，暴露属于 `com.example.team/csi-driver` 这个 CSI 插件的 `existingVolumeName Volume`：

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: my-manually-created-pv
spec:
  capacity:
    storage: 5Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  csi:
    driver: com.example.team/csi-driver
    volumeHandle: existingVolumeName
    readOnly: false
```

### 附着和挂载

您可以在任何的 pod 或者 pod 的 template 中引用绑定到 CSI volume 上的 `PersistentVolumeClaim`。

```yaml
kind: Pod
apiVersion: v1
metadata:
  name: my-pod
spec:
  containers:
    - name: my-frontend
      image: dockerfile/nginx
      volumeMounts:
      - mountPath: "/var/www/html"
        name: my-csi-volume
  volumes:
    - name: my-csi-volume
      persistentVolumeClaim:
        claimName: my-request-for-storage
```

当一个引用了 CSI Volume 的 pod 被调度时， Kubernetes 将针对外部 CSI 插件进行相应的操作，以确保特定的 Volume 被 attached、mounted， 并且能被 pod 中的容器使用。

关于 CSI 实现的详细信息请参考[设计文档](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/storage/container-storage-interface.md)。

## 创建 CSI 驱动

Kubernetes 尽可能少地指定 CSI Volume 驱动程序的打包和部署规范。[这里](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/storage/container-storage-interface.md#third-party-csi-volume-drivers)记录了在 Kubernetes 上部署 CSI Volume 驱动程序的最低要求。

最低要求文件还包含[概述部分](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/storage/container-storage-interface.md#recommended-mechanism-for-deploying-csi-drivers-on-kubernetes)，提供了在 Kubernetes 上部署任意容器化 CSI 驱动程序的建议机制。存储提供商可以运用这个机制来简化 Kubernetes 上容器式 CSI 兼容 Volume 驱动程序的部署。

作为推荐部署的一部分，Kubernetes 团队提供以下 sidecar（辅助）容器：

- [External-attacher](https://github.com/kubernetes-csi/external-attacher)

  可监听 Kubernetes VolumeAttachment 对象并触发 ControllerPublish 和 ControllerUnPublish 操作的 sidecar 容器，通过 CSI endpoint 触发 ；

- [External-provisioner](https://github.com/kubernetes-csi/external-provisioner)

  监听 Kubernetes PersistentVolumeClaim 对象的 sidecar 容器，并触发对 CSI 端点的 CreateVolume 和DeleteVolume 操作；

- [Driver-registrar](https://github.com/kubernetes-csi/driver-registrar)

  使用 Kubelet（将来）注册 CSI 驱动程序的 sidecar 容器，并将 `NodeId` （通过 `GetNodeID` 调用检索到 CSI endpoint）添加到 Kubernetes Node API 对象的 annotation 里面。

存储供应商完全可以使用这些组件来为其插件构建 Kubernetes Deployment，同时让它们的 CSI 驱动程序完全意识不到 Kubernetes 的存在。

## 参考

- [Kubernetes CRI and Minikube](https://sreeninet.wordpress.com/2017/02/11/kubernetes-cri-and-minikube/)
- [Kubernetes container runtime interface](https://feisky.xyz/2016/09/24/Kubernetes-container-runtime-interface/)
- [CRI-O and Alternative Runtimes in Kubernetes](https://www.projectatomic.io/blog/2017/02/crio-runtimes/)
- [Docker、Containerd、RunC...：你应该知道的所有](http://www.infoq.com/cn/news/2017/02/Docker-Containerd-RunC)
- [Introducing Container Runtime Interface (CRI) in Kubernetes](http://blog.kubernetes.io/2016/12/container-runtime-interface-cri-in-kubernetes.html)
- <https://github.com/containernetworking/cni>
- <https://github.com/containernetworking/plugins>
- [Container Networking Interface Specification](https://github.com/containernetworking/cni/blob/master/SPEC.md#container-networking-interface-specification)
- [CNI Extension conventions](https://github.com/containernetworking/cni/blob/master/CONVENTIONS.md)
- [Introducing Container Storage Interface (CSI) Alpha for Kubernetes](http://blog.kubernetes.io/2018/01/introducing-container-storage-interface.html)
- [Container Storage Interface (CSI)](https://github.com/container-storage-interface/spec/blob/master/spec.md)