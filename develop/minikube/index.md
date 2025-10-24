---
weight: 114
title: Minikube
date: 2022-05-21T00:00:00+08:00
description: 介绍如何安装配置 Minikube，以及常用的操作命令。
lastmod: 2025-10-20T05:05:02.233Z
---

> Minikube 是本地开发和测试 Kubernetes 应用的理想工具，支持多平台、多驱动和丰富插件，极大简化了集群搭建与管理流程。本文系统梳理 Minikube 的架构、安装、配置、常用命令及最佳实践，助你高效掌握本地 K8s 环境。

## Minikube 简介

Minikube 是一个开源工具，支持在 macOS、Linux 和 Windows 上本地运行单节点 Kubernetes 集群。它让开发者无需访问完整集群即可便捷测试和开发 Kubernetes 应用。

Minikube 的主要目标包括：

- 成为本地 Kubernetes 应用开发的最佳工具
- 支持所有适合本地环境的 Kubernetes 特性

**最新版本**：v1.37.0（2025 年 9 月 9 日发布）  
[更新日志](https://github.com/kubernetes/minikube/blob/master/CHANGELOG.md)

## 系统要求

在安装 Minikube 前，请确保系统满足以下要求：

- **macOS**：10.12 (Sierra) 或更高版本
- **内存**：至少 2GB 可用内存
- **CPU**：支持虚拟化的处理器
- **磁盘空间**：至少 20GB 可用磁盘空间

## 架构与核心组件

Minikube 采用分层架构，通过抽象不同组件，为多平台和多虚拟化技术提供一致体验。

```mermaid "Minikube 高级架构"
graph TD
    User(["用户"])
    CLI["minikube CLI"]
    Commands["命令处理器"]
    Lifecycle["集群生命周期管理器"]
    Config["配置系统"]
    Driver["驱动接口"]
    Bootstrap["K8s 引导器"]
    VM["VM 或容器主机"]
    Runtime["容器运行时"]
    Images["镜像管理器"]
    Network["网络插件"]
    K8sCore["K8s 核心组件"]
    Addons["插件系统"]
    Services["服务访问"]

    User --> CLI
    CLI --> Commands
    Commands --> Lifecycle
    Lifecycle --> Config
    Lifecycle --> Driver
    Lifecycle --> Bootstrap
    Driver --> VM
    Bootstrap --> Runtime
    Bootstrap --> Images
    Bootstrap --> Network
    Runtime --> K8sCore
    Bootstrap --> K8sCore
    K8sCore --> Addons
    K8sCore --> Services
```

![Minikube 高级架构](9477a007a5f0ffcfbb59ff705ef9ac0a.svg)
{width=1920 height=2065}

### 驱动系统

Minikube 通过驱动接口抽象机器配置，支持多种虚拟化和容器化技术。

```mermaid "Minikube 驱动系统"
graph TD
    subgraph "驱动接口"
        DriverMgr["驱动管理器"]
        DriverAPI["驱动 API"]
    end

    subgraph "VM 驱动"
        VBox["VirtualBox 驱动"]
        KVM["KVM 驱动"]
        HyperKit["HyperKit 驱动"]
        HyperV["Hyper-V 驱动"]
    end

    subgraph "容器驱动"
        KIC["Kubernetes in Container (KIC)"]
        Docker["Docker 驱动"]
        Podman["Podman 驱动"]
    end

    subgraph "其他驱动"
        None["None 驱动"]
        SSH["SSH 驱动"]
    end

    DriverMgr --> DriverAPI
    DriverAPI --> VBox
    DriverAPI --> KVM
    DriverAPI --> HyperKit
    DriverAPI --> HyperV
    DriverAPI --> KIC
    KIC --> Docker
    KIC --> Podman
    DriverAPI --> None
    DriverAPI --> SSH
```

![Minikube 驱动系统](f68120fd421372d4fb101b6cbde6ba9a.svg)
{width=2074 height=810}

KIC（Kubernetes in Container）通过专用基础镜像在容器中运行 Kubernetes。

### 容器运行时支持

Minikube 支持多种容器运行时，便于模拟生产环境。

```mermaid "Minikube 容器运行时支持"
graph TD
    subgraph "容器运行时接口"
        RuntimeMgr["运行时管理器"]
        RuntimeAPI["运行时 API"]
    end

    subgraph "支持的运行时"
        Docker["Docker - v28.0.4"]
        Containerd["containerd - v1.7.23"]
        CRIO["CRI-O"]
    end

    RuntimeMgr --> RuntimeAPI
    RuntimeAPI --> Docker
    RuntimeAPI --> Containerd
    RuntimeAPI --> CRIO
```

![Minikube 容器运行时支持](8f5625b03b6231780d83398731d3bc3b.svg)
{width=1920 height=1443}

### 插件系统

Minikube 通过插件系统扩展功能，便于集群内部署常用组件。

```mermaid "Minikube 插件系统"
graph TD
    subgraph "插件管理"
        AddonCmd["插件命令"]
        AddonMgr["插件管理器"]
        Registry["插件注册表"]
    end

    subgraph "插件部署"
        Templates["插件模板"]
        Manifests["K8s 清单"]
        RBAC["RBAC 资源"]
    end

    AddonCmd --> AddonMgr
    AddonMgr --> Registry
    Registry --> Templates
    Templates --> Manifests
    Manifests --> RBAC
```

![Minikube 插件系统](af6877deb062d5f8232a1abb37a60595.svg)
{width=1920 height=7869}

插件可包含 RBAC 资源，保障集群安全。

## 主要特性

下表总结了 Minikube 的核心特性及相关命令标志：

{{< table title="Minikube 主要特性与命令标志" >}}

| 特性             | 描述                         | 相关标志                           |
| ---------------- | ---------------------------- | ---------------------------------- |
| 多集群支持       | 运行多个独立集群             | `-p, --profile`                    |
| 多 Kubernetes 版本 | 运行特定 Kubernetes 版本     | `--kubernetes-version`             |
| 容器运行时选择   | 支持 Docker、containerd、CRI-O | `--container-runtime`              |
| 资源自定义       | 配置 CPU、内存和磁盘资源     | `--cpus`, `--memory`, `--disk-size`|
| 自定义镜像仓库   | 支持替代注册表               | `--image-repository`               |
| GPU 直通         | NVIDIA/AMD GPU 支持          | `--gpus`                           |
| 仅下载模式       | 预加载镜像不启动集群         | `--download-only`                  |
| 文件系统挂载     | 本地目录挂载到集群           | `--mount`                          |
| CNI 网络         | 支持多种网络实现             | `--cni`                            |

{{< /table >}}

## 内部机制

### 基础镜像与依赖

KIC 驱动使用预装依赖的基础镜像，便于快速启动。

```mermaid "KIC 基础镜像与依赖"
graph TD
    subgraph "KIC 基础镜像"
        BaseImage["kicbase 镜像"]
        MainRepo["gcr.io/k8s-minikube/kicbase-builds"]
        FallbackRepo["docker.io/kicbase/build"]
    end

    subgraph "组件"
        Docker["Docker v28.0.4"]
        Containerd["containerd v1.7.23"]
        K8sTools["Kubernetes 工具"]
        CNIPlugins["CNI 插件"]
    end

    BaseImage --> MainRepo
    BaseImage --> FallbackRepo
    BaseImage --> Docker
    BaseImage --> Containerd
    BaseImage --> K8sTools
    BaseImage --> CNIPlugins
```

![KIC 基础镜像与依赖](4209db37bf8d13c253d076e6f295ed7d.svg)
{width=1920 height=443}

## 安装与配置

### 安装 Minikube

#### Homebrew 安装（推荐）

```bash
brew install minikube
minikube version
```

#### 手动安装

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-darwin-amd64
sudo install minikube-darwin-amd64 /usr/local/bin/minikube
minikube version
```

### 安装 kubectl

#### Homebrew 安装（推荐）

```bash
brew install kubectl
```

#### 手动安装

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
kubectl version --client
```

## 启动与配置 Minikube

### 基本启动

```bash
minikube start
minikube start --memory=4096 --cpus=2
```

### macOS 特定配置

推荐使用 HyperKit 或 Krunkit 驱动：

```bash
brew install hyperkit
minikube start --driver=hyperkit
minikube start --driver=krunkit
```

### Docker 驱动

如已安装 Docker Desktop：

```bash
minikube start --driver=docker
```

启动成功后，minikube 会自动配置 kubectl 上下文，可直接使用 kubectl 操作集群。

## 验证安装

```bash
minikube status
kubectl get nodes
kubectl cluster-info
```

## 常用操作命令

### 集群管理

```bash
minikube start
minikube stop
minikube start
minikube delete
minikube pause
minikube unpause
```

### 集群信息

```bash
minikube status
minikube ip
minikube ssh
minikube kubectl version
```

### 插件管理

```bash
minikube addons list
minikube addons enable dashboard
minikube addons disable dashboard
```

### 服务访问

```bash
minikube dashboard
minikube service <service-name> --url
minikube service <service-name>
```

## 故障排除

### 常见问题

- 启动失败：检查虚拟化是否启用
- 网络问题：配置代理或使用镜像源
- 资源不足：增加内存和 CPU 配置

### 清理与重置

```bash
minikube delete --all --purge
rm -rf ~/.minikube
```

## 最佳实践

- 资源配置：根据开发需求合理分配内存和 CPU
- 驱动选择：macOS 推荐 HyperKit 或 Krunkit，其他系统可选 VirtualBox 或 Docker
- GPU 支持：AI/ML 工作负载建议用 `--gpus` 启用 GPU
- 网络配置：企业环境注意配置代理
- 定期更新：保持 Minikube 和 kubectl 版本最新

## 总结

Minikube 为本地 Kubernetes 开发和测试提供了极致便捷的体验。通过多驱动、多运行时和丰富插件支持，开发者可快速搭建与生产环境高度一致的集群，灵活模拟各种场景。掌握 Minikube 的架构、安装、配置和常用命令，将极大提升本地 K8s 开发效率。

## 参考文献

1. [Minikube 官方文档 - minikube.sigs.k8s.io](https://minikube.sigs.k8s.io/docs/)
2. [kubectl 安装指南 - kubernetes.io](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
3. [Kubernetes 官方教程 - kubernetes.io](https://kubernetes.io/docs/tutorials/)
