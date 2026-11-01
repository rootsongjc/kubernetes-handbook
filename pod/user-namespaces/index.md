---
weight: 11
title: "Pod 用户命名空间"
linktitle: 用户命名空间
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: user-namespaces
description: "介绍 Kubernetes v1.36 GA 的 Pod 用户命名空间（hostUsers: false）：原理、对容器逃逸的缓解效果、内核与运行时要求、kubelet 的 ID 范围配置、与 Pod 安全标准的联动，以及当前限制与采用建议。"
---

> 容器里的 root 终于不再等于宿主机上的 root，用户命名空间是容器隔离模型十年来最重要的一次加固。

容器本质上是共享宿主机内核的一组进程。默认情况下，容器内以 UID 0 运行的进程在宿主机上同样是 UID 0——只要有一个内核漏洞或配置失误让进程逃出容器，攻击者就直接获得了节点 root 权限。Linux 用户命名空间（User Namespace）允许把容器内的 UID/GID 映射到宿主机上另一段非特权 ID，容器内的 root 在宿主机看来只是一个普通用户。Kubernetes 在 v1.28 以 Alpha 形式引入该能力，v1.33 Beta 默认开启，v1.36 正式 GA 并锁定。

## 工作原理

Pod 通过 `spec.hostUsers: false` 选择启用用户命名空间：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: userns-demo
spec:
  hostUsers: false
  containers:
  - name: app
    image: nginx:1.27
```

启用后 kubelet 会为该 Pod 分配一段宿主机 UID/GID 区间（默认每个 Pod 65536 个 ID），并保证同一节点上不同 Pod 的区间互不重叠。容器内的 UID 0 – 65535 被映射到这段宿主机区间，例如 Pod A 的容器 root 可能对应宿主机 UID 131072，Pod B 的对应 196608。在容器内执行 `id` 看到的是 0，而在节点上 `ps aux` 看到的则是映射后的非特权 UID。

这一映射带来三层保护：

- **容器逃逸降级**：即便进程突破容器，在宿主机上也只是一个没有任何文件所有权的普通用户
- **Pod 之间隔离**：不同 Pod 映射到不同区间，一个 Pod 的进程无法以"同 UID"身份访问另一个 Pod 的文件
- **Capability 失效**：授予容器的 capability 只在其用户命名空间内有效，`CAP_SYS_MODULE` 完全无效（无法加载内核模块），`CAP_SYS_ADMIN` 等在宿主机层面同样不生效

官方文档指出，多个被评为 HIGH/CRITICAL 的历史漏洞（例如允许 Pod 读取宿主机任意文件的 CVE-2021-25741）在用户命名空间开启时无法被利用，并预期它还能缓解未来的一部分漏洞。

### 卷与文件所有权

`runAsUser`、`runAsGroup`、`fsGroup` 等字段始终指**容器内**的 ID。Kubernetes 依靠内核的 idmap 挂载能力让卷中的文件所有权以容器视角呈现，因此同一个 PVC 既可以被启用用户命名空间的 Pod 使用，也可以被普通 Pod 使用，文件 UID/GID 不会因为切换 `hostUsers` 而改变。超出 0 – 65535 范围的文件所有者会显示为溢出 ID（通常是 65534），且不可修改。

## 节点要求

用户命名空间是 Linux 专属特性，对节点有明确要求：

{{< table title="Pod 用户命名空间的节点要求" >}}

| 组件            | 最低版本 / 条件                                              | 说明                                             |
|-----------------|--------------------------------------------------------------|--------------------------------------------------|
| Linux 内核      | 6.3+                                                         | tmpfs 自 6.3 起支持 idmap 挂载；ServiceAccount Token、Secret 等默认卷均基于 tmpfs |
| 文件系统        | 支持 idmap 挂载：ext4、xfs、btrfs、tmpfs、overlayfs、fat     | `/var/lib/kubelet/pods` 所在文件系统与 Pod 所有卷的文件系统都需支持 |
| 容器运行时      | containerd 2.0+ 或 CRI-O 1.25+                                | containerd 1.7 不支持；cri-dockerd 的支持仍在推进 |
| OCI 运行时      | runc 1.2+ 或 crun 1.9+（推荐 1.13+）                         |                                                  |

{{< /table >}}

kubelet 会通过 CRI 的 `RuntimeConfig`/`Status` 响应得知运行时是否支持用户命名空间，并把结果写入 Node 对象的 `status.runtimeHandlers[].features.userNamespaces`。不满足条件的节点上，`hostUsers: false` 的 Pod 会创建失败并给出明确事件。

### 配置 ID 范围

默认情况下 kubelet 从 65536 开始为 Pod 分配 ID，避免与宿主机常规用户（0 – 65535）重叠。若需要自定义范围，节点需满足：

- 存在名为 `kubelet` 的系统用户
- 安装 `getsubids`（shadow-utils 的一部分）并位于 kubelet 的 `PATH` 中
- 在 `/etc/subuid` 与 `/etc/subgid` 中为 `kubelet` 用户配置**同一段**从属 ID

```text
# /etc/subuid 与 /etc/subgid
# 起始 ID 必须是 65536 的倍数且不小于 65536
# 数量必须是 65536 的倍数，且不少于 65536 × maxPods（默认 110）
kubelet:65536:7208960
```

v1.33 起还可以在 KubeletConfiguration 中调整每个 Pod 占用的 ID 数量，以支持容器内使用更大的 UID：

```yaml
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
userNamespaces:
  idsPerPod: 1048576   # 必须是 65536 的倍数，默认 65536
```

修改这些配置前必须先排空节点上所有使用用户命名空间的 Pod，否则 kubelet 可能因无法满足已有 Pod 的映射而拒绝启动。

## 与 Pod 安全标准的联动

启用用户命名空间后，容器内的 root 不再对应宿主机特权用户，因此 Pod 安全准入会**有条件地放宽**部分检查：

- 在 Baseline 与 Restricted 级别下，不再强制要求 `runAsNonRoot: true` 与非零 `runAsUser`
- 在 Baseline 级别下，额外放宽对 `procMount` 的限制（Restricted 仍要求默认值）

这意味着那些"必须以 root 启动但并不需要宿主机权限"的传统应用（如需要 `apt`/`dnf` 的镜像、监听 1024 以下端口的旧程序），只需加上 `hostUsers: false` 就可以进入 Restricted 命名空间，而无需重构镜像。

## 当前限制

- 启用用户命名空间的 Pod 不能同时使用 `hostNetwork`、`hostPID`、`hostIPC`
- 不能使用 `volumeDevices`（裸块设备卷）
- 仅支持 Linux 节点
- 容器内默认只能使用 0 – 65535 范围的 UID/GID，更大 ID 需要调整 `idsPerPod`
- 依赖宿主机 UID 的特性（如 `hostPath` 卷上按宿主机 UID 设置的权限、某些设备插件）需要逐一评估

## 采用建议

- 新集群把节点基线定为内核 6.3+、containerd 2.x、cgroup v2，一次性满足用户命名空间、swap、内存 QoS 等新特性的要求
- 先在非特权的无状态工作负载上开启 `hostUsers: false`，观察卷权限与日志采集等 Sidecar 是否正常
- 对无法改造为非 root 的遗留镜像，用用户命名空间替代为其单独开放 `privileged` 命名空间的做法
- 用准入策略（`ValidatingAdmissionPolicy` 或 `MutatingAdmissionPolicy`）为特定命名空间默认注入 `hostUsers: false`
- 通过 Node 的 `status.runtimeHandlers` 或节点声明特性（`status.declaredFeatures`，v1.37 GA）确认节点支持情况，再配合节点亲和性调度

## 总结

用户命名空间以极低的应用改造成本，把"容器 root = 节点 root"这一最大的隐患转化为"容器 root = 节点普通用户"。随着 v1.36 GA 与 containerd 2.x、6.x 内核在各发行版中的普及，它应当成为新集群的默认安全基线之一，与 Pod 安全标准、seccomp、AppArmor/SELinux 共同构成纵深防御。

## 参考文献

- [User Namespaces - kubernetes.io](https://kubernetes.io/docs/concepts/workloads/pods/user-namespaces/)
- [Use a User Namespace With a Pod - kubernetes.io](https://kubernetes.io/docs/tasks/configure-pod-container/user-namespaces/)
- [KEP-127: Support User Namespaces in pods - github.com](https://github.com/kubernetes/enhancements/tree/master/keps/sig-node/127-user-namespaces)
- [user_namespaces(7) - man7.org](https://man7.org/linux/man-pages/man7/user_namespaces.7.html)
