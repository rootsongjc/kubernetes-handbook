# 容器运行时接口（CRI）

容器运行时接口（Container Runtime Interface），简称 CRI。CRI 中定义了 **容器** 和 **镜像** 的服务的接口，因为容器运行时与镜像的生命周期是彼此隔离的，因此需要定义两个服务。该接口使用 [Protocol Buffer](https://developers.google.com/protocol-buffers/)，基于 [gRPC](https://grpc.io/)，在 Kubernetes v1.10 + 版本中是在 `pkg/kubelet/apis/cri/runtime/v1alpha2` 的 `api.proto` 中定义的。

## CRI 架构

Container Runtime 实现了 CRI gRPC Server，包括 `RuntimeService` 和 `ImageService`。该 gRPC Server 需要监听本地的 Unix socket，而 kubelet 则作为 gRPC Client 运行。

![CRI 架构 - 图片来自 kubernetes blog](../images/cri-architecture.png)

## 启用 CRI

除非集成了 rktnetes，否则 CRI 都是被默认启用了，从 Kubernetes 1.7 版本开始，旧的预集成的 docker CRI 已经被移除。

要想启用 CRI 只需要在 kubelet 的启动参数重传入此参数：`--container-runtime-endpoint` 远程运行时服务的端点。当前 Linux 上支持 unix socket，windows 上支持 tcp。例如：`unix:///var/run/dockershim.sock`、 `tcp://localhost:373`，默认是 `unix:///var/run/dockershim.sock`，即默认使用本地的 docker 作为容器运行时。

## CRI 接口

Kubernetes 1.9 中的 CRI 接口在 `api.proto` 中的定义如下：

```protobuf
// Runtime service defines the public APIs for remote container runtimes
service RuntimeService {
    // Version returns the runtime name, runtime version, and runtime API version.
    rpc Version (VersionRequest) returns (VersionResponse) {}

    // RunPodSandbox creates and starts a pod-level sandbox. Runtimes must ensure
    //the sandbox is in the ready state on success.
    rpc RunPodSandbox (RunPodSandboxRequest) returns (RunPodSandboxResponse) {}
    // StopPodSandbox stops any running process that is part of the sandbox and
    //reclaims network resources (e.g., IP addresses) allocated to the sandbox.
    // If there are any running containers in the sandbox, they must be forcibly
    //terminated.
    // This call is idempotent, and must not return an error if all relevant
    //resources have already been reclaimed. kubelet will call StopPodSandbox
    //at least once before calling RemovePodSandbox. It will also attempt to
    //reclaim resources eagerly, as soon as a sandbox is not needed. Hence,
    //multiple StopPodSandbox calls are expected.
    rpc StopPodSandbox (StopPodSandboxRequest) returns (StopPodSandboxResponse) {}
    // RemovePodSandbox removes the sandbox. If there are any running containers
    //in the sandbox, they must be forcibly terminated and removed.
    // This call is idempotent, and must not return an error if the sandbox has
    //already been removed.
    rpc RemovePodSandbox (RemovePodSandboxRequest) returns (RemovePodSandboxResponse) {}
    // PodSandboxStatus returns the status of the PodSandbox. If the PodSandbox is not
    //present, returns an error.
    rpc PodSandboxStatus (PodSandboxStatusRequest) returns (PodSandboxStatusResponse) {}
    // ListPodSandbox returns a list of PodSandboxes.
    rpc ListPodSandbox (ListPodSandboxRequest) returns (ListPodSandboxResponse) {}

    // CreateContainer creates a new container in specified PodSandbox
    rpc CreateContainer (CreateContainerRequest) returns (CreateContainerResponse) {}
    // StartContainer starts the container.
    rpc StartContainer (StartContainerRequest) returns (StartContainerResponse) {}
    // StopContainer stops a running container with a grace period (i.e., timeout).
    // This call is idempotent, and must not return an error if the container has
    //already been stopped.
    // TODO: what must the runtime do after the grace period is reached?
    rpc StopContainer (StopContainerRequest) returns (StopContainerResponse) {}
    // RemoveContainer removes the container. If the container is running, the
    //container must be forcibly removed.
    // This call is idempotent, and must not return an error if the container has
    //already been removed.
    rpc RemoveContainer (RemoveContainerRequest) returns (RemoveContainerResponse) {}
    // ListContainers lists all containers by filters.
    rpc ListContainers (ListContainersRequest) returns (ListContainersResponse) {}
    // ContainerStatus returns status of the container. If the container is not
    //present, returns an error.
    rpc ContainerStatus (ContainerStatusRequest) returns (ContainerStatusResponse) {}
    // UpdateContainerResources updates ContainerConfig of the container.
    rpc UpdateContainerResources (UpdateContainerResourcesRequest) returns (UpdateContainerResourcesResponse) {}

    // ExecSync runs a command in a container synchronously.
    rpc ExecSync (ExecSyncRequest) returns (ExecSyncResponse) {}
    // Exec prepares a streaming endpoint to execute a command in the container.
    rpc Exec (ExecRequest) returns (ExecResponse) {}
    // Attach prepares a streaming endpoint to attach to a running container.
    rpc Attach (AttachRequest) returns (AttachResponse) {}
    // PortForward prepares a streaming endpoint to forward ports from a PodSandbox.
    rpc PortForward (PortForwardRequest) returns (PortForwardResponse) {}

    // ContainerStats returns stats of the container. If the container does not
    //exist, the call returns an error.
    rpc ContainerStats (ContainerStatsRequest) returns (ContainerStatsResponse) {}
    // ListContainerStats returns stats of all running containers.
    rpc ListContainerStats (ListContainerStatsRequest) returns (ListContainerStatsResponse) {}

    // UpdateRuntimeConfig updates the runtime configuration based on the given request.
    rpc UpdateRuntimeConfig (UpdateRuntimeConfigRequest) returns (UpdateRuntimeConfigResponse) {}

    // Status returns the status of the runtime.
    rpc Status (StatusRequest) returns (StatusResponse) {}}

// ImageService defines the public APIs for managing images.
service ImageService {
    // ListImages lists existing images.
    rpc ListImages (ListImagesRequest) returns (ListImagesResponse) {}
    // ImageStatus returns the status of the image. If the image is not
    //present, returns a response with ImageStatusResponse.Image set to
    //nil.
    rpc ImageStatus (ImageStatusRequest) returns (ImageStatusResponse) {}
    // PullImage pulls an image with authentication config.
    rpc PullImage (PullImageRequest) returns (PullImageResponse) {}
    // RemoveImage removes the image.
    // This call is idempotent, and must not return an error if the image has
    //already been removed.
    rpc RemoveImage (RemoveImageRequest) returns (RemoveImageResponse) {}
    // ImageFSInfo returns information of the filesystem that is used to store images.
    rpc ImageFsInfo (ImageFsInfoRequest) returns (ImageFsInfoResponse) {}}
```

这其中包含了两个 gRPC 服务：

- **RuntimeService**：容器和 Sandbox 运行时管理。
- **ImageService**：提供了从镜像仓库拉取、查看、和移除镜像的 RPC。

## 当前支持的 CRI 后端

我们最初在使用 Kubernetes 时通常会默认使用 Docker 作为容器运行时，其实从 Kubernetes 1.5 开始已经支持 CRI，通过 CRI 接口可以指定使用其它容器运行时作为 Pod 的后端，目前支持 CRI 的后端有：

- [cri-o](https://github.com/kubernetes-incubator/cri-o)：cri-o 是 Kubernetes 的 CRI 标准的实现，并且允许 Kubernetes 间接使用 OCI 兼容的容器运行时，可以把 cri-o 看成 Kubernetes 使用 OCI 兼容的容器运行时的中间层。
- [cri-containerd](https://github.com/containerd/cri-containerd)：基于 [Containerd](https://github.com/containerd/containerd) 的 Kubernetes CRI 实现
- [rkt](https://coreos.com/rkt/)：由 CoreOS 主推的用来跟 docker 抗衡的容器运行时
- [frakti](https://github.com/kubernetes/frakti)：基于 hypervisor 的 CRI
- [docker](https://www.docker.com)：Kuberentes 最初就开始支持的容器运行时，目前还没完全从 kubelet 中解耦，Docker 公司同时推广了 [OCI](https://www.opencontainers.org/) 标准

CRI 是由 [SIG-Node](https://kubernetes.slack.com/archives/sig-node) 来维护的。

## 当前通过 CRI-O 间接支持 CRI 的后端

当前同样存在一些只实现了 [OCI](https://www.opencontainers.org/) 标准的容器，但是它们可以通过 CRI-O 来作为 Kubernetes 的容器运行时。CRI-O 是 Kubernetes 的 CRI 标准的实现，并且允许 Kubernetes 间接使用 OCI 兼容的容器运行时。

- [Clear Containers](https://github.com/clearcontainers)：由 Intel 推出的兼容 OCI 容器运行时，可以通过 CRI-O 来兼容 CRI。
- [Kata Containers](https://katacontainers.io/)：符合 OCI 规范，可以通过 CRI-O 或 [Containerd CRI Plugin](https://github.com/containerd/cri) 来兼容 CRI。
- [gVisor](https://github.com/google/gvisor)：由谷歌推出的容器运行时沙箱 (Experimental)，可以通过 CRI-O 来兼容 CRI。


## 参考

- [Kubernetes CRI and Minikube - sreeninet.wordpress.com](https://sreeninet.wordpress.com/2017/02/11/kubernetes-cri-and-minikube/)
- [CRI-O and Alternative Runtimes in Kubernetes - projectatomic.io](https://projectatomic.io/blog/2017/02/crio-runtimes/)
- [Docker、Containerd、RunC...：你应该知道的所有](https://www.infoq.cn/article/2017/02/Docker-Containerd-RunC/)
- [Introducing Container Runtime Interface (CRI) in Kubernetes - blog.kubernetes.io](https://kubernetes.io/blog/2016/12/container-runtime-interface-cri-in-kubernetes/)
- [cri-o 官网 - cri-o.io](https://cri-o.io/)
- [Kata Containers Architecture - github.com](https://github.com/kata-containers/documentation/blob/master/design/architecture.md#kubernetes-support)
