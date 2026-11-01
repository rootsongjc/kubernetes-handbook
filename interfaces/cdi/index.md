---
weight: 5
title: "容器设备接口（CDI）"
linktitle: 容器设备接口（CDI）
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: cdi
description: "介绍容器设备接口（Container Device Interface，CDI）：由 CNCF TAG Runtime 维护的设备注入规范，用 JSON/YAML 描述把 GPU 等设备暴露给容器所需的设备节点、挂载、环境变量与钩子。涵盖规范结构、设备命名、运行时支持、与 Kubernetes 设备插件（v1.31 GA）及 DRA 的关系。"
---

> CNI 让网络插件不必关心运行时，CSI 让存储驱动不必关心运行时，CDI 做的是同一件事——让 GPU 厂商只写一份设备描述，就能被所有容器运行时理解。

在 Linux 上把一块 GPU 交给容器，早已不是"挂一个 `/dev/nvidia0` 设备节点"那么简单：还需要挂载用户态驱动库、设置环境变量、暴露控制设备、有时还要执行厂商钩子。过去每个厂商都要分别为 Docker、containerd、CRI-O、Podman 编写运行时钩子或插件，Kubernetes 设备插件也只能用"设备节点 + 挂载 + 环境变量"这几种有限原语表达注入意图。**容器设备接口**（Container Device Interface，CDI）由此而来：它是一份与运行时无关的 JSON/YAML 规范，描述"把某个设备暴露给容器需要对 OCI 运行时规范做哪些修改"，运行时在创建容器时按名称查找并应用这些修改。CDI 由 CNCF TAG Runtime 维护，设计上直接借鉴了 CNI 的模型，当前规范版本为 v1.1。

## CDI 在接口体系中的位置

CRI、CNI、CSI 分别解耦了计算、网络、存储，CDI 则解耦了**设备**。它与 Kubernetes 的关系与 CNI 类似：Kubernetes 本身不实现 CDI，而是由设备插件或 DRA 驱动生成 CDI 规范文件并把设备名传给 kubelet，kubelet 通过 CRI 把设备名交给容器运行时，运行时负责解析 CDI 文件并修改容器配置。

{{< table title="CDI 与其他开放接口的对比" >}}

| 接口 | 解耦对象 | 规范维护方 | Kubernetes 侧消费者 | 运行时侧实现 |
|------|----------|------------|---------------------|--------------|
| CRI  | 容器生命周期 | Kubernetes SIG Node | kubelet | containerd、CRI-O |
| CNI  | Pod 网络 | CNCF（containernetworking） | 容器运行时调用插件 | Cilium、Calico、Flannel 等 |
| CSI  | 存储卷 | CSI 社区（kubernetes-csi） | kubelet、external-* Sidecar | 各存储厂商 CSI 驱动 |
| CDI  | 设备注入 | CNCF TAG Runtime | 设备插件、DRA 驱动生成规范；kubelet 经 CRI 传递设备名 | containerd、CRI-O、Podman、Docker 解析并注入 |

{{< /table >}}

CDI 刻意把**资源管理**（哪个 Pod 能拿到哪块卡、能否共享）排除在外，交给编排器处理；它只回答"拿到这块卡之后，容器里应该看到什么"。

## 规范结构

CDI 规范文件放在节点的 `/etc/cdi`（静态）或 `/var/run/cdi`（动态生成）目录下，扩展名为 `.json` 或 `.yaml`。每个文件声明一个设备种类（`kind`）及其下的若干设备，核心结构如下：

```json
{
  "cdiVersion": "1.0.0",
  "kind": "nvidia.com/gpu",
  "containerEdits": {
    "env": ["NVIDIA_VISIBLE_DEVICES=void"],
    "deviceNodes": [{"path": "/dev/nvidiactl"}, {"path": "/dev/nvidia-uvm"}],
    "mounts": [
      {"hostPath": "/usr/lib/x86_64-linux-gnu/libcuda.so.580.65", "containerPath": "/usr/lib/x86_64-linux-gnu/libcuda.so.580.65", "options": ["ro", "nosuid", "nodev", "bind"]}
    ],
    "hooks": [
      {"hookName": "createContainer", "path": "/usr/bin/nvidia-cdi-hook", "args": ["nvidia-cdi-hook", "update-ldcache"]}
    ]
  },
  "devices": [
    {
      "name": "0",
      "containerEdits": {
        "deviceNodes": [{"path": "/dev/nvidia0"}]
      }
    },
    {
      "name": "GPU-6f3c8a1e-0d2b-4b1f-9c0d-1a2b3c4d5e6f",
      "containerEdits": {
        "deviceNodes": [{"path": "/dev/nvidia0"}]
      }
    }
  ]
}
```

各字段含义如下：

{{< table title="CDI 规范核心字段" >}}

| 字段 | 说明 |
|------|------|
| `cdiVersion` | 规范版本（SemVer）；运行时按文件中用到的字段推断最低要求版本，字段未知则拒绝加载 |
| `kind` | 设备种类，格式为 `厂商域名/类别`，如 `nvidia.com/gpu`、`intel.com/qat`、`amd.com/gpu` |
| `containerEdits`（顶层） | 该种类下所有设备共用的修改，典型为驱动库挂载、控制设备节点、环境变量 |
| `devices[].name` | 设备名，与 `kind` 组合成全限定名 `nvidia.com/gpu=0`；同一物理设备可用索引、UUID 等多个名字发布 |
| `devices[].containerEdits` | 单个设备特有的修改 |
| `containerEdits.deviceNodes` | 设备节点：`path`、`hostPath`、`type`、`major`/`minor`、`permissions`、`uid`/`gid` |
| `containerEdits.mounts` | 绑定挂载：`hostPath`、`containerPath`、`type`、`options` |
| `containerEdits.env` | 注入的环境变量 |
| `containerEdits.hooks` | OCI 钩子（`prestart`、`createRuntime`、`createContainer`、`startContainer`、`poststart`、`poststop`） |
| `containerEdits.intelRdt` | Intel RDT 缓存/带宽分配（v0.7+） |
| `containerEdits.additionalGids` | 附加 GID（v0.7+） |
| `containerEdits.netDevices` | 把宿主机网络设备移入容器网络命名空间（v1.1+），面向 RDMA/SR-IOV 等场景 |

{{< /table >}}

设备的全限定名 `vendor.com/class=name` 是整个机制的"主键"：编排器与运行时之间只传递这个字符串，运行时据此在规范目录中查找匹配的设备并合并顶层与设备级的 `containerEdits`。

## 运行时支持

主流运行时已普遍支持 CDI，配置方式略有差异：

{{< table title="容器运行时对 CDI 的支持" >}}

| 运行时 | 支持情况 | 配置要点 |
|--------|----------|----------|
| containerd | 1.7 起支持（默认关闭）；**2.0 起默认开启**；2.2 起 `enable_cdi` 选项弃用，2.4 起始终开启 | 1.7：`[plugins."io.containerd.grpc.v1.cri"] enable_cdi = true`；2.x：`[plugins."io.containerd.cri.v1.runtime"] cdi_spec_dirs` |
| CRI-O | 1.24 起支持，默认开启 | `crio config \| grep cdi_spec_dirs` 查看目录 |
| Podman | 4.1 起支持 v0.3+ 规范，默认开启 | `podman run --device nvidia.com/gpu=0` |
| Docker Engine | 25.0 起支持（需在 `daemon.json` 中开启 `features.cdi`）；**28.2 起默认开启** | `docker run --device nvidia.com/gpu=all` |

{{< /table >}}

在 Kubernetes 中，设备名通过 CRI 的 `CDIDevice` 字段从 kubelet 传给运行时，无需用户感知；在单机使用 Podman/Docker 时，则直接把全限定名写在 `--device` 参数里。

## 与 Kubernetes 设备插件的关系

传统设备插件在 `ContainerAllocateResponse` 中只能返回设备节点、挂载、环境变量与注解，表达能力有限且与运行时耦合。自 Kubernetes v1.28 起，设备插件可以改为返回**全限定 CDI 设备名**（`DevicePluginCDIDevices` 特性门控，v1.29 Beta，v1.31 GA），由 kubelet 透传给运行时完成注入。NVIDIA 设备插件自 0.14 起支持以 CDI 方式注入（0.15 起支持通过 CRI 的 `CDIDevices` 字段而非注解传递），Intel 设备插件等也已跟进，厂商不再需要维护 `nvidia-container-runtime` 这类运行时钩子。

## 与 DRA 的关系

动态资源分配（DRA，v1.34 GA）**只支持 CDI** 作为设备注入机制：DRA 驱动的节点组件在 `NodePrepareResources` 中为被分配的设备生成 CDI 规范（通常写入 `/var/run/cdi`），并把全限定设备名返回给 kubelet；kubelet 经 CRI 交给运行时，容器启动时完成注入；Pod 结束后 `NodeUnprepareResources` 清理规范文件。这正是 CDI 把"资源管理"留给编排器的设计收益——DRA 负责按属性选择与分配设备，CDI 负责把分配结果落到容器里，两者各司其职。可以说，没有 CDI 作为统一的运行时侧接口，DRA 的结构化参数模型无法落地。

## 调试与工具

CDI 项目提供 `cdi` 命令行工具，用于检查节点上的规范与设备：

```bash
cdi specs        # 列出规范文件
cdi devices      # 列出所有全限定设备名
cdi validate     # 按 JSON Schema 校验规范
cdi monitor      # 监听规范目录变化
```

NVIDIA Container Toolkit 提供 `nvidia-ctk cdi generate` 直接生成节点上 GPU 的 CDI 规范，是手工验证驱动与设备可见性的常用手段：

```bash
nvidia-ctk cdi generate --output=/etc/cdi/nvidia.yaml
nvidia-ctk cdi list
```

排障时若 Pod 报 `CDI device injection failed` 或找不到设备，通常检查三点：规范目录是否在运行时配置的 `cdi_spec_dirs` 中、规范文件 `cdiVersion` 是否超出运行时支持范围、设备名是否与规范中的 `kind` 与 `name` 完全一致。

## 总结

CDI 以一份与运行时无关的设备描述文件，统一了 GPU、FPGA、NIC 等设备注入容器的方式，终结了"每个厂商为每个运行时写一套钩子"的局面。它既是设备插件现代化的基础（v1.31 GA），更是 DRA 唯一的注入通道；随着 containerd 2.x 与 Docker 28 默认开启 CDI，它已与 CRI、CNI、CSI 一起成为 Kubernetes 节点侧的第四个标准接口。

## 参考文献

- [Container Device Interface - github.com](https://github.com/cncf-tags/container-device-interface)
- [CDI Specification - github.com](https://github.com/cncf-tags/container-device-interface/blob/main/SPEC.md)
- [Device Plugins - kubernetes.io](https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/device-plugins/)
- [Dynamic Resource Allocation - kubernetes.io](https://kubernetes.io/docs/concepts/scheduling-eviction/dynamic-resource-allocation/)
- [NVIDIA Container Toolkit: Support for Container Device Interface - docs.nvidia.com](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/cdi-support.html)
