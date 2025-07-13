---
weight: 7
title: 容器运行时接口（CRI）
linktitle: CRI
aliases:
- /book/kubernetes-handbook/architecture/open-interfaces/cri/
date: '2022-05-21T00:00:00+08:00'
type: book
description: 容器运行时接口（CRI）是 Kubernetes 中定义容器和镜像服务的核心接口，基于 gRPC 协议，支持多种容器运行时后端如 containerd、CRI-O 等，为 Kubernetes 提供了灵活的容器运行时选择。
keywords:
- cri
- docker
- grpc
- gvisor
- kubernetes
- 容器
- 接口
- 运行
- 默认
---

容器运行时接口（Container Runtime Interface），简称 CRI，是 Kubernetes 中定义**容器**和**镜像**服务的核心接口。由于容器运行时与镜像的生命周期相互独立，因此 CRI 定义了两个独立的服务接口。该接口采用 [Protocol Buffer](https://developers.google.com/protocol-buffers/) 格式，基于 [gRPC](https://grpc.io/) 协议实现。

## CRI 架构

CRI 的核心架构包含以下组件：

- **Container Runtime**：实现 CRI gRPC Server，包括 `RuntimeService` 和 `ImageService` 两个服务
- **gRPC Server**：监听本地 Unix socket，接收来自 kubelet 的请求
- **kubelet**：作为 gRPC Client，通过 CRI 接口与容器运行时通信

![CRI 架构 - 图片来自 kubernetes blog](https://assets.jimmysong.io/images/book/kubernetes-handbook/architecture/open-interfaces/cri/cri-architecture.webp)
{width=572 height=136}

## CRI 配置

### 启用 CRI

从 Kubernetes 1.7 版本开始，CRI 已成为默认的容器运行时接口。要配置 CRI，需要在 kubelet 启动参数中指定：

```bash
--container-runtime-endpoint=<endpoint>
```

**支持的端点格式：**

- Linux：`unix:///var/run/containerd/containerd.sock`
- Windows：`tcp://localhost:3730`
- 默认值：`unix:///var/run/containerd/containerd.sock`

### 常用配置示例

以下为常见的 CRI 配置示例，可根据实际使用的容器运行时进行选择：

```bash
# 使用 containerd
--container-runtime-endpoint=unix:///var/run/containerd/containerd.sock

# 使用 CRI-O
--container-runtime-endpoint=unix:///var/run/crio/crio.sock
```

## CRI 接口定义

CRI 接口定义了两个主要的 gRPC 服务：

### RuntimeService

负责容器和 Pod 沙箱的生命周期管理，主要包括：

- Pod 沙箱管理（创建、启动、停止、删除）
- 容器管理（创建、启动、停止、删除、列出）
- 容器状态查询和日志获取
- 执行命令和端口转发

### ImageService

负责镜像的管理操作，主要包括：

- 从镜像仓库拉取镜像
- 列出本地镜像
- 删除本地镜像
- 查询镜像状态和信息

## 主流 CRI 实现

### 生产级容器运行时

| 运行时 | 维护者 | 特点 | 使用场景 |
|--------|--------|------|----------|
| **containerd** | CNCF | 轻量级、高性能、生产就绪 | 云原生环境、生产部署 |
| **CRI-O** | Red Hat/CNCF | 专为 Kubernetes 设计、OCI 兼容 | OpenShift、企业环境 |

### 安全增强型运行时

虽然以下运行时不直接实现 CRI 接口，但通过适配器可以与 Kubernetes 集成：

- **[Kata Containers](https://katacontainers.io/)**：基于轻量级虚拟机的容器运行时，提供硬件级隔离
- **[gVisor](https://gvisor.dev/)**：用户空间内核的容器沙箱，提供系统调用级别的隔离

### 集成方式

以下示例展示了如何通过 RuntimeClass 集成 Kata Containers 等安全增强型运行时：

```yaml
# 通过 RuntimeClass 使用不同的容器运行时
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
    name: kata-containers
handler: kata
---
apiVersion: v1
kind: Pod
metadata:
    name: secure-pod
spec:
    runtimeClassName: kata-containers
    containers:
    - name: app
        image: nginx
```

## 最佳实践

### 选择容器运行时的考虑因素

1. **性能要求**：containerd 通常提供更好的性能
2. **安全需求**：高安全要求场景考虑 Kata Containers 或 gVisor
3. **生态兼容性**：CRI-O 与 OpenShift 生态集成更好
4. **维护成本**：考虑团队的技术栈和维护能力

### 监控和故障排查

在日常运维和故障排查中，建议结合 `crictl` 工具对容器运行时进行监控和诊断。常见操作包括：

- **查看运行时信息**：快速了解当前 CRI 运行时的详细状态
- **列出容器**：获取所有正在运行的容器列表
- **查看容器日志**：排查应用异常或启动失败原因
- **容器内执行命令**：进入容器内部进行实时调试

以下为常用 `crictl` 命令示例：

```bash
# 查看 CRI 运行时状态
crictl info

# 列出容器
crictl ps

# 查看容器日志
crictl logs <container-id>

# 执行容器命令
crictl exec -it <container-id> /bin/bash
```

## 参考资料

- [Container Runtime Interface (CRI) - Kubernetes 官方文档](https://kubernetes.io/docs/concepts/architecture/cri/)
- [containerd 官方文档](https://containerd.io/)
- [CRI-O 官方文档](https://cri-o.io/)
- [gVisor 官方文档](https://gvisor.dev/docs/)
