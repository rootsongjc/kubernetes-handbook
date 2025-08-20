---
weight: 8
title: 容器网络接口（CNI）
linktitle: CNI
date: '2022-05-21T00:00:00+08:00'
type: book
aliases:
- /book/kubernetes-handbook/architecture/open-interfaces/cni/
description: 深入了解容器网络接口（CNI）的设计原理、接口定义、插件实现和使用方式，掌握 Kubernetes 网络管理的核心机制。
keywords:
- cni
- container network interface
- kubernetes networking
- 容器网络
- 网络插件
- ipam
- 云原生网络
---

容器网络接口（Container Network Interface，CNI）是 CNCF 旗下的一个重要项目，提供了一套标准化的容器网络配置规范和库。CNI 专注于容器创建时的网络资源分配和容器删除时的网络资源释放，为容器编排平台提供了统一的网络管理接口。

{{< callout type="info"  >}}
CNI 项目地址：[github.com/containernetworking/cni](https://github.com/containernetworking/cni)
{{< /callout >}}

## CNI 在 Kubernetes 中的集成

Kubernetes 已经深度集成了 CNI，相关代码位于 `vendor/github.com/containernetworking/cni/libcni` 目录。kubelet 通过 CNI 插件为 Pod 配置网络，实现了容器网络的标准化管理。

## 核心接口定义

CNI 定义了简洁而强大的接口，包含四个核心方法：

```go
type CNI interface {
  AddNetworkList(net *NetworkConfigList, rt *RuntimeConf) (types.Result, error)
  DelNetworkList(net *NetworkConfigList, rt *RuntimeConf) error
  AddNetwork(net *NetworkConfig, rt *RuntimeConf) (types.Result, error)
  DelNetwork(net *NetworkConfig, rt *RuntimeConf) error
}
```

### 接口说明

- **AddNetwork/AddNetworkList**：为容器添加网络配置
- **DelNetwork/DelNetworkList**：删除容器的网络配置
- **NetworkConfig**：单个网络配置
- **NetworkConfigList**：多个网络配置的有序列表

## 设计原则与规范

CNI 的设计遵循以下核心原则：

### 生命周期管理

1. **网络命名空间**：容器运行时必须在调用插件前为容器创建独立的网络命名空间
2. **网络确定**：运行时需确定容器所属网络及相应的插件执行顺序
3. **配置格式**：采用 JSON 格式存储网络配置，包含必需字段如 `name`、`type` 等

### 执行顺序

- **添加操作**：按配置顺序依次执行插件
- **删除操作**：按添加操作的相反顺序执行插件
- **幂等性**：DELETE 操作必须支持多次调用

### 并发控制

- **容器隔离**：同一容器不允许并行操作
- **容器间并行**：不同容器可以并行处理
- **唯一标识**：每个容器通过 ContainerID 唯一标识

## CNI 插件实现

### 基本要求

CNI 插件必须实现为可执行文件，支持容器管理系统调用。插件负责：

- 将网络接口插入容器网络命名空间
- 在主机上执行必要的网络配置
- 通过 IPAM 插件分配 IP 地址和配置路由

### 标准操作

#### ADD 操作（添加容器到网络）

**输入参数：**

- **CNI_VERSION**：CNI 规范版本
- **CNI_CONTAINERID**：容器唯一标识符
- **CNI_NETNS**：网络命名空间路径（如 `/proc/[pid]/ns/net`）
- **CNI_IFNAME**：容器内接口名称
- **CNI_ARGS**：额外参数
- **网络配置**：JSON 格式的网络配置文档

**返回结果：**

- 接口列表及硬件地址信息
- IP 配置信息（IPv4/IPv6 地址、网关、路由）
- DNS 配置信息

#### DEL 操作（从网络中删除容器）

**输入参数：**

- 与 ADD 操作相同的参数集合
- 必须释放容器 ID 拥有的所有网络资源

#### VERSION 操作（版本查询）

返回插件支持的 CNI 规范版本：

```json
{
  "cniVersion": "1.0.0",
  "supportedVersions": ["0.3.0", "0.3.1", "0.4.0", "1.0.0"]
}
```

## IP 地址管理（IPAM）

### IPAM 插件架构

为了解耦 IP 管理策略与 CNI 插件类型，CNI 引入了 IPAM（IP Address Management）插件：

- **职责分离**：CNI 插件专注网络接口管理，IPAM 插件专注 IP 分配
- **灵活配置**：支持多种 IP 管理方案（DHCP、静态分配等）
- **标准接口**：IPAM 插件遵循与 CNI 插件相同的调用约定

### IPAM 插件调用

IPAM 插件通过以下方式工作：

- 接收与 CNI 插件相同的环境变量
- 通过 stdin 接收网络配置
- 返回 IP/子网、网关和路由信息
- 可执行文件位于 `CNI_PATH` 指定的路径中

## 常用插件生态

### 主插件（Main Plugins）

| 插件名称 | 功能描述 |
|---------|---------|
| **bridge** | 创建 Linux 网桥，连接主机和容器 |
| **ipvlan** | 创建 IPvlan 接口，支持 L2/L3 模式 |
| **macvlan** | 创建 MACvlan 接口，分配独立 MAC 地址 |
| **ptp** | 创建点对点 veth 对连接 |
| **host-device** | 将主机设备移入容器网络命名空间 |
| **vlan** | 创建 VLAN 子接口 |

### IPAM 插件

| 插件名称 | 功能描述 |
|---------|---------|
| **host-local** | 本地静态 IP 地址池管理 |
| **dhcp** | 通过 DHCP 协议动态分配 IP |
| **static** | 静态 IP 地址分配 |

### Meta 插件

| 插件名称 | 功能描述 |
|---------|---------|
| **portmap** | 基于 iptables 的端口映射 |
| **bandwidth** | 网络带宽限制 |
| **firewall** | 基于 iptables 的防火墙规则 |
| **tuning** | 网络接口参数调优 |

## 配置示例

### 基本网桥配置

以下是相关的配置示例：

```json
{
  "cniVersion": "1.0.0",
  "name": "mynet",
  "type": "bridge",
  "bridge": "mynet0",
  "isDefaultGateway": true,
  "forceAddress": false,
  "ipMasq": true,
  "hairpinMode": true,
  "ipam": {
  "type": "host-local",
  "subnet": "10.10.0.0/16"
  }
}
```

### 链式插件配置

以下是相关的配置示例：

```json
{
  "cniVersion": "1.0.0",
  "name": "mynet",
  "plugins": [
  {
    "type": "bridge",
    "bridge": "mynet0",
    "ipam": {
    "type": "host-local",
    "subnet": "10.10.0.0/16"
    }
  },
  {
    "type": "portmap",
    "capabilities": {"portMappings": true}
  }
  ]
}
```

## 最佳实践

### 插件选择

1. **生产环境**：推荐使用成熟的网络方案如 Calico、Flannel、Cilium
2. **开发测试**：可使用简单的 bridge + host-local 组合
3. **高性能需求**：考虑使用 SR-IOV 或 DPDK 相关插件

### 故障排查

1. **日志检查**：查看 kubelet 和 CNI 插件日志
2. **网络验证**：使用 `cni` 命令行工具测试配置
3. **网络连通性**：检查路由表和 iptables 规则

## 参考资源

- [CNI 官方规范](https://github.com/containernetworking/cni/blob/main/SPEC.md)
- [CNI 插件仓库](https://github.com/containernetworking/plugins)
- [CNI 扩展约定](https://github.com/containernetworking/cni/blob/main/CONVENTIONS.md)
- [CNCF CNI 项目主页](https://www.cni.dev/)
