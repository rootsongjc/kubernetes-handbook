---
weight: 5
title: "Windows 节点：混合集群中运行 Windows 容器"
linktitle: Windows 节点
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: windows-nodes
description: "介绍在 Kubernetes 混合集群中运行 Windows 节点与容器的要点：Windows Server 2022/2025 的版本兼容矩阵与进程隔离要求、containerd 运行时、与 Linux 的功能差异（无特权容器与 hostNetwork、securityContext 差异、HostProcess 容器）、节点加入与调度隔离（污点与节点选择器）、网络（Calico/Flannel/Cilium 的 Windows 支持与 WinDSR）、存储、以及 v1.33–v1.37 中 Windows 相关的变化。"
---

> Windows 节点不是"换个操作系统的 Linux 节点"，而是一套有自己边界条件的运行环境——镜像版本必须与宿主机严格匹配就是第一道门槛。

许多企业仍有大量 .NET Framework、IIS 与 Windows 服务型应用，Kubernetes 自 v1.14 起正式支持在同一集群中混合 Linux 与 Windows 节点：控制面始终运行在 Linux 上，Windows 节点作为工作节点加入，由 kubelet 与 kube-proxy 的 Windows 构建管理。本文梳理 Windows 节点的兼容性要求、与 Linux 的差异以及运维实践。

## 兼容性要求

Windows 容器只支持**进程隔离**模式，Kubernetes 不支持 Hyper-V 隔离。这意味着容器基础镜像的 Windows 版本必须与节点操作系统版本一致（Windows Server 2022 节点只能运行基于 `servercore:ltsc2022`/`nanoserver:ltsc2022` 的镜像）。v1.37 测试覆盖的宿主系统为：

{{< table title="Kubernetes v1.37 的 Windows 节点兼容性" >}}

| 项目 | 支持情况 |
|------|----------|
| 操作系统 | Windows Server 2022（LTSC）、Windows Server 2025（LTSC） |
| 容器运行时 | containerd 1.7+/2.x（推荐）、Mirantis Container Runtime |
| 隔离模式 | 进程隔离；不支持 Hyper-V 隔离 |
| 架构 | amd64 |
| 版本偏差 | 与 Linux 节点相同，kubelet 最多落后控制面三个小版本 |

{{< /table >}}

Windows Server 2019 已不在 v1.37 的测试矩阵中，基于 `ltsc2019` 的镜像需要迁移到 2022 或 2025。由于半年通道（SAC）已停止，LTSC 版本之间的升级意味着节点与镜像必须同步重建，建议用节点标签 `node.kubernetes.io/windows-build` 区分不同版本的节点池并在 Pod 上用节点选择器匹配。

## 与 Linux 节点的差异

Kubernetes 的 API 对象在 Windows 上大多按相同语义工作，但一些依赖 Linux 内核特性的功能在 Windows 上不可用或行为不同：

{{< table title="Windows 节点上的功能差异" >}}

| 功能 | Windows 上的情况 |
|------|------------------|
| 特权容器 | 不支持；用 HostProcess 容器替代 |
| `hostNetwork` | 不支持（`WindowsHostNetwork` 门控 v1.33 起弃用），Pod 始终使用容器网络；`ClusterFirstWithHostNet` 无效 |
| `hostPID`、`hostIPC` | 不支持 |
| Linux securityContext 字段 | `runAsUser`/`runAsGroup`、`capabilities`、`seLinuxOptions`、`seccompProfile`、`appArmorProfile`、`procMount`、`allowPrivilegeEscalation`、`readOnlyRootFilesystem`、`sysctls`、`fsGroup` 等不受支持，Pod 安全标准有专门豁免 |
| `runAsNonRoot` | 可用，校验用户名不是 `ContainerAdministrator` |
| HugePages | 不支持 |
| 资源管理 | CPU 与内存 limits 由 Job Object 强制；内存 OOM 行为与 Linux 不同（更可能影响整个节点，应预留更多 `systemReserved`） |
| 存储 | 支持 CSI（SMB、Azure Disk/File、AWS EBS、vSphere 等）、`emptyDir`（不支持 `medium: Memory`）、`hostPath`、ConfigMap/Secret/Projected（复制到可写层，无 tmpfs、无 `fsGroup`）；不支持 `mountPropagation`、卷的 UID/GID 映射 |
| 终止 | `terminationGracePeriodSeconds` 需 containerd；容器收到 `CTRL_SHUTDOWN_EVENT` 而非 SIGTERM |
| 探针 | HTTP/TCP/gRPC/exec 均支持 |
| DNS | 通过容器网络使用集群 DNS；`ndots` 等 resolv.conf 选项不适用，搜索域由 Windows DNS 客户端处理 |
| NodeSwap、用户命名空间、cgroup | 不适用 |

{{< /table >}}

Windows 容器的用户通过 `securityContext.windowsOptions.runAsUserName` 指定（默认 `ContainerUser`，管理操作用 `ContainerAdministrator`），域身份则通过组托管服务账户（gMSA）的 `gmsaCredentialSpecName` 提供，需要集群安装 gMSA Webhook 与凭据规约 CRD。

### HostProcess 容器

Linux 上的 DaemonSet（CNI、监控代理、日志采集）依赖特权容器与 hostPath 访问节点，Windows 对应的机制是 HostProcess 容器（v1.26 GA）：容器以节点上的进程身份直接运行，可以访问宿主机文件系统、网络与服务，等价于 Linux 的特权 + hostNetwork + hostPID。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: node-agent
spec:
  nodeSelector:
    kubernetes.io/os: windows
  securityContext:
    windowsOptions:
      hostProcess: true
      runAsUserName: "NT AUTHORITY\\SYSTEM"     # 或 Local service / Network service / 本地用户组
  hostNetwork: true                             # HostProcess 容器必须设置
  containers:
  - name: agent
    image: registry.example.com/win-agent:ltsc2022
    command: ["powershell.exe", "-File", "C:\\agent\\run.ps1"]
    volumeMounts:
    - name: host-logs
      mountPath: C:\host-logs
  volumes:
  - name: host-logs
    hostPath:
      path: C:\var\log
```

Pod 中所有容器必须同为 HostProcess；镜像可使用 `mcr.microsoft.com/oss/kubernetes/windows-host-process-containers-base-image` 这类极小的基础镜像，因为进程直接跑在宿主机上不需要完整的 Windows 用户态。Calico、Flannel、CSI 节点插件、Prometheus windows-exporter 等都以 HostProcess DaemonSet 的形式部署。

## 加入集群与调度隔离

Windows 节点通过 kubeadm `join`（需预先安装 containerd 与 kubelet 的 Windows 二进制，社区的 `sig-windows-tools` 提供 PowerShell 脚本）或云厂商节点池（EKS、AKS、GKE 均支持 Windows 节点池）加入集群。kubelet 自动添加 `kubernetes.io/os=windows` 与 `kubernetes.io/arch=amd64` 标签。

混合集群的首要问题是防止 Linux 工作负载被调度到 Windows 节点（反之亦然）。推荐做法是给 Windows 节点加上污点，并要求 Windows 工作负载同时携带节点选择器与容忍：

```yaml
# 节点：kubelet 启动参数或 kubectl taint
# --register-with-taints=os=windows:NoSchedule
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: iis
spec:
  replicas: 2
  selector:
    matchLabels: { app: iis }
  template:
    metadata:
      labels: { app: iis }
    spec:
      nodeSelector:
        kubernetes.io/os: windows
        node.kubernetes.io/windows-build: "10.0.20348"    # Server 2022
      tolerations:
      - key: os
        operator: Equal
        value: windows
        effect: NoSchedule
      containers:
      - name: iis
        image: mcr.microsoft.com/windows/servercore/iis:windowsservercore-ltsc2022
        resources:
          requests: { cpu: 500m, memory: 1Gi }
          limits: { cpu: "2", memory: 2Gi }
        ports:
        - containerPort: 80
```

Pod 的 `spec.os.name: windows` 字段（v1.25 GA）让 API Server 在准入时校验 Pod 不包含 Linux 特有字段，并让 kubelet 拒绝运行操作系统不匹配的 Pod，建议所有 Windows 工作负载都设置。由于 Windows 镜像动辄数 GB（`servercore` 约 5 GB），节点扩容后首个 Pod 的拉取时间很长，节点镜像预热与就近仓库缓存（见 [镜像管理](../../pod/image-management)）尤为重要。

## 网络

Windows 节点的网络由 Host Networking Service（HNS）提供，CNI 插件通过 HNS API 创建网络与端点，支持的模式主要是 Overlay（VXLAN）与 L2Bridge（主机网关/BGP）。主流 CNI 的 Windows 支持：

- **Calico**：VXLAN 与 BGP 模式均支持，支持 NetworkPolicy，以 HostProcess DaemonSet 部署，是自建集群最常见的选择
- **Flannel**：VXLAN（Overlay）与 host-gw（L2Bridge）模式，不支持 NetworkPolicy
- **Cilium**：Windows 支持仍在早期阶段，生产环境应以官方文档的支持声明为准
- **云厂商 CNI**：Azure CNI、AWS VPC CNI 均提供 Windows 支持，可直接为 Pod 分配 VPC/VNet IP

kube-proxy 在 Windows 上使用 HNS 负载均衡策略实现 Service，`WinOverlay` 与 `WinDSR`（直接服务器返回，减少 NAT 开销）均于 v1.34 GA。Windows 上不支持 IPVS、nftables 模式，也没有 Linux 的 `externalTrafficPolicy: Local` 以外的一些精细特性；NetworkPolicy 的支持取决于 CNI。双栈（IPv4/IPv6）在 Windows 上支持 Overlay 与 L2Bridge 网络。服务网格方面，Istio Sidecar 不支持 Windows，Ambient 模式的 ztunnel 同样暂无 Windows 构建，Windows 工作负载通常通过网格入口网关间接接入。

## 近期变化

近年 Windows 支持的变化集中在运维体验：

- `WindowsGracefulNodeShutdown`（v1.34 Beta）让 Windows 节点在关机时像 Linux 一样按优先级分批终止 Pod
- `WindowsCPUAndMemoryAffinity`（v1.32 Alpha）引入 CPU 管理器与内存管理器的 Windows 实现，面向需要 NUMA 亲和的 Windows 工作负载
- `WindowsHostNetwork` 门控 v1.33 起弃用，Windows 的 `hostNetwork` 不再作为发展方向，HostProcess 容器是节点级访问的唯一路径
- kube-proxy 的 WinDSR 与 WinOverlay v1.34 GA
- 镜像与节点版本矩阵更新为 Server 2022/2025，2019 退出测试

## 总结

Windows 节点让组织能用同一套 Kubernetes 平台管理 Linux 与 Windows 工作负载，但它有自己的边界：镜像版本必须与宿主机严格匹配、没有特权容器与 hostNetwork、Linux 的内核级安全机制不适用、镜像体积大且节点资源开销高。通过污点与节点选择器严格隔离调度、以 HostProcess 容器部署节点组件、选用支持 Windows 的 CNI 与 CSI 驱动，并为 Windows 节点池预留更多系统资源，就能把 Windows 工作负载稳妥地纳入混合集群。

## 参考文献

- [Windows containers in Kubernetes - kubernetes.io](https://kubernetes.io/docs/concepts/windows/intro/)
- [Guide for Running Windows Containers in Kubernetes - kubernetes.io](https://kubernetes.io/docs/concepts/windows/user-guide/)
- [Create a Windows HostProcess Pod - kubernetes.io](https://kubernetes.io/docs/tasks/configure-pod-container/create-hostprocess-pod/)
- [Configure GMSA for Windows Pods and containers - kubernetes.io](https://kubernetes.io/docs/tasks/configure-pod-container/configure-gmsa/)
- [Adding Windows nodes - kubernetes.io](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/adding-windows-nodes/)
- [Windows Containers on Kubernetes - calico](https://docs.tigera.io/calico/latest/getting-started/kubernetes/windows-calico/)
