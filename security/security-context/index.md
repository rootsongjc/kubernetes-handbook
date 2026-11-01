---
weight: 3
title: "Pod 与容器安全上下文：从 runAsNonRoot 到 seccomp、AppArmor 与 SELinux"
linktitle: 安全上下文
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: security-context
description: "系统梳理 securityContext 的全部字段与最佳实践：用户与组、文件系统权限、Linux Capabilities、只读根文件系统、特权与提权控制、seccomp/AppArmor/SELinux 三类内核安全机制的声明式配置，以及与 Pod 安全标准 restricted 级别的对应关系。"
---

> Pod 安全标准告诉你"什么是安全的"，securityContext 才是你亲手把安全写进每一个容器的地方。

`securityContext` 是 Pod 与容器规约中定义运行时安全属性的字段，它决定进程以哪个用户身份运行、拥有哪些内核能力、能否修改根文件系统、受哪种内核安全模块约束。[Pod 安全准入](../pod-security-admission) 只负责在准入时检查这些字段是否满足标准，真正的加固仍需在工作负载中逐项声明。本文按字段逐一解释其含义、默认值与推荐设置。

## Pod 级与容器级

`securityContext` 可出现在两个层级：`spec.securityContext` 作用于 Pod 中所有容器并包含卷相关的字段（如 `fsGroup`、`sysctls`），`spec.containers[].securityContext` 只作用于单个容器，并包含只在容器层有意义的字段（如 `capabilities`、`privileged`、`readOnlyRootFilesystem`）。两级同时设置时容器级优先。

下面是一份满足 Pod 安全标准 `restricted` 级别的完整示例，后文的各节将解释每个字段：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hardened
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    runAsGroup: 10001
    fsGroup: 10001
    fsGroupChangePolicy: OnRootMismatch
    supplementalGroupsPolicy: Strict
    seccompProfile:
      type: RuntimeDefault
    appArmorProfile:
      type: RuntimeDefault
  containers:
  - name: app
    image: registry.example.com/app:1.0
    securityContext:
      allowPrivilegeEscalation: false
      privileged: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: ["ALL"]
        add: ["NET_BIND_SERVICE"]   # 仅在需要监听 1024 以下端口时添加
    volumeMounts:
    - name: tmp
      mountPath: /tmp
  volumes:
  - name: tmp
    emptyDir: {}
```

## 用户、组与文件系统所有权

容器进程默认以镜像中指定的用户运行，大量镜像默认是 root。`runAsUser`/`runAsGroup` 覆盖进程的 UID/GID；`runAsNonRoot: true` 让 kubelet 在启动前校验最终 UID 不为 0——若镜像未声明数字 UID 且未设置 `runAsUser`，容器会拒绝启动而不是悄悄以 root 运行。

卷的所有权是另一个常见问题：挂载的 PV 往往属于 root，非 root 进程无法写入。`fsGroup` 让 kubelet 在挂载时把卷内文件的组改为指定 GID 并设置 setgid 位；`fsGroupChangePolicy: OnRootMismatch` 只在根目录属主不匹配时才递归修改，避免大卷上每次挂载都遍历全部文件。

`supplementalGroups` 为进程附加额外的组；`supplementalGroupsPolicy: Strict`（v1.33 起 Beta 默认开启）让 kubelet 忽略镜像 `/etc/group` 中为该用户定义的附加组，只使用 Pod 规约里声明的组，防止镜像私自赋予进程访问宿主机组资源的权限。Pod 状态中的 `containerStatuses[].user.linux` 字段会报告进程实际获得的 UID/GID/附加组，便于审计。

如果希望容器内的 root 不是宿主机的 root，应结合 [用户命名空间](../../pod/user-namespaces)（`hostUsers: false`，v1.36 GA），这是比单纯 `runAsNonRoot` 更彻底的隔离。

## 特权、提权与 Capabilities

`privileged: true` 让容器获得宿主机几乎全部能力（所有 Capabilities、访问所有设备、关闭 seccomp/AppArmor），只应用于 CNI、存储驱动等基础设施组件。绝大多数"需要特权"的场景实际上只需要个别 Capability。

`allowPrivilegeEscalation` 控制进程能否通过 setuid 二进制或文件 Capability 获得比父进程更多的权限（对应 `no_new_privs` 标志）。`restricted` 标准要求显式设为 `false`；它在 `privileged: true` 或添加了 `CAP_SYS_ADMIN` 时会被强制为 `true`。

`capabilities` 精细控制 Linux 能力。容器运行时默认授予约 14 个 Capability（如 `CHOWN`、`NET_RAW`、`SETUID`），推荐先 `drop: ["ALL"]` 再按需 `add`。常见需求与对应能力如下：

{{< table title="常见 Capability 需求" >}}

| 需求 | Capability | 说明 |
|------|-----------|------|
| 监听 1024 以下端口 | `NET_BIND_SERVICE` | `restricted` 标准唯一允许添加的能力；也可改为监听高端口由 Service 映射 |
| 修改网络配置（CNI、服务网格 init 容器） | `NET_ADMIN` | Istio Ambient 模式已不再需要在应用 Pod 中赋予该能力 |
| 原始套接字（ping、tcpdump） | `NET_RAW` | 多数运行时默认授予，应主动 drop |
| 修改文件属主 | `CHOWN`、`FOWNER`、`DAC_OVERRIDE` | 通常用 `fsGroup` 替代 |
| 挂载文件系统、修改内核参数 | `SYS_ADMIN` | 等同于半个特权容器，应避免 |

{{< /table >}}

## 只读根文件系统与可写目录

`readOnlyRootFilesystem: true` 把容器的根文件系统挂载为只读，攻击者即使获得代码执行也无法篡改二进制或植入后门。应用需要写入的路径（`/tmp`、缓存、日志目录）通过 `emptyDir` 卷挂载提供，可配合 `sizeLimit` 限制用量，或使用 `medium: Memory` 的内存盘提升性能。

## procMount 与 sysctls

`procMount` 控制 `/proc` 的挂载方式：默认 `Default` 会屏蔽 `/proc/kcore` 等敏感路径；`Unmasked`（v1.36 GA）仅允许在开启用户命名空间（`hostUsers: false`）的 Pod 中使用，用于在容器内运行嵌套容器（如 CI 中的 Docker-in-Docker、Kata 之外的轻量沙箱）。

`sysctls` 在 Pod 级设置内核参数。安全的（命名空间化且不影响其他 Pod）sysctl 如 `net.ipv4.ip_local_port_range`、`net.ipv4.tcp_syncookies`、`net.ipv4.ip_unprivileged_port_start` 可直接使用；非安全 sysctl（如 `kernel.shm*`、`net.core.*`）需 kubelet 通过 `--allowed-unsafe-sysctls` 显式放行，且 `restricted` 标准禁止。

## 内核安全模块：seccomp、AppArmor、SELinux

三者从不同维度约束进程：seccomp 过滤系统调用，AppArmor 与 SELinux 基于路径或标签做强制访问控制。它们都已在 Pod 规约中有了声明式字段，不再依赖注解。

### seccomp

```yaml
securityContext:
  seccompProfile:
    type: RuntimeDefault        # 使用容器运行时的默认配置（约 300 个系统调用白名单）
    # type: Localhost
    # localhostProfile: profiles/fine-grained.json   # kubelet --root-dir/seccomp 下的自定义配置
    # type: Unconfined          # 不过滤，restricted 标准禁止
```

默认情况下 Pod **不启用** seccomp（`Unconfined`）。kubelet 的 `seccompDefault: true`（v1.27 GA）可将默认改为 `RuntimeDefault`，建议所有新集群开启。自定义配置可用 [Security Profiles Operator](https://github.com/kubernetes-sigs/security-profiles-operator) 通过录制工作负载的系统调用自动生成并以 CRD 分发。

### AppArmor

AppArmor（v1.30 GA）在支持它的节点（Ubuntu、Debian、SUSE 系）上限制程序可访问的文件、网络与能力：

```yaml
securityContext:
  appArmorProfile:
    type: RuntimeDefault        # 运行时默认配置（containerd 为 cri-containerd.apparmor.d）
    # type: Localhost
    # localhostProfile: k8s-nginx    # 须预先加载到节点内核
```

旧的 `container.apparmor.security.beta.kubernetes.io/<container>` 注解仍被识别但已弃用，应迁移到字段形式。

### SELinux

在启用 SELinux 的发行版（RHEL、Fedora、CoreOS 系）上，`seLinuxOptions` 为容器进程与卷设置标签：

```yaml
securityContext:
  seLinuxOptions:
    level: "s0:c123,c456"      # MCS 级别，使不同 Pod 的进程无法互访彼此的文件
  seLinuxChangePolicy: MountOption   # v1.36 GA
```

传统做法是递归为卷中每个文件打标签，大卷耗时极长。`SELinuxMount`（v1.37 GA）改为通过 `-o context=` 挂载选项一次性设置标签，`seLinuxChangePolicy` 允许为与多 Pod 共享卷的旧应用退回 `Recursive` 行为。

## Windows 容器

Windows 节点的安全上下文使用 `windowsOptions`：`runAsUserName` 指定运行用户，`hostProcess: true` 创建等价于 Linux 特权容器的 HostProcess 容器（用于节点管理 DaemonSet），`gmsaCredentialSpecName` 引用组托管服务账户。Linux 特有字段在 Windows Pod 中会被忽略，Pod 安全标准对此有专门的豁免规则。

## 与 Pod 安全标准的对应

{{< table title="Pod 安全标准 restricted 级别的 securityContext 要求" >}}

| 要求 | 字段 | 取值 |
|------|------|------|
| 非 root 运行 | `runAsNonRoot` | `true`（或 `runAsUser` 非 0） |
| 禁止提权 | `allowPrivilegeEscalation` | `false` |
| 丢弃全部能力 | `capabilities.drop` | `["ALL"]`，只允许 add `NET_BIND_SERVICE` |
| seccomp | `seccompProfile.type` | `RuntimeDefault` 或 `Localhost` |
| 非特权 | `privileged` | 未设置或 `false` |
| 卷类型 | — | 仅允许 configMap、secret、emptyDir、PVC、projected、downwardAPI、ephemeral、csi、image 等 |
| 主机命名空间 | `hostNetwork`/`hostPID`/`hostIPC` | 未设置或 `false` |
| procMount | `procMount` | 未设置或 `Default` |
| sysctl | `sysctls` | 仅限安全子集 |

{{< /table >}}

建议在命名空间上以 `warn`/`audit` 模式启用 `restricted`，用 `kubectl get events` 与审计日志发现不合规的工作负载，逐一补全 securityContext 后再切换到 `enforce`。

## 总结

securityContext 是最小权限原则在 Kubernetes 中的直接体现：以非 root 身份运行、丢弃全部 Capabilities、只读根文件系统、禁止提权并启用 seccomp 默认配置，这五项组合可以消除绝大多数容器逃逸的前提条件。随着 AppArmor、`procMount`、SELinux 挂载优化与用户命名空间相继 GA，v1.37 的安全上下文已经能够以声明式方式覆盖内核安全机制的全部主流手段，运维者应把它作为每个工作负载模板的必备部分而非事后补丁。

## 参考文献

- [Configure a Security Context for a Pod or Container - kubernetes.io](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/)
- [Pod Security Standards - kubernetes.io](https://kubernetes.io/docs/concepts/security/pod-security-standards/)
- [Restrict a Container's Syscalls with seccomp - kubernetes.io](https://kubernetes.io/docs/tutorials/security/seccomp/)
- [Restrict a Container's Access to Resources with AppArmor - kubernetes.io](https://kubernetes.io/docs/tutorials/security/apparmor/)
- [Linux kernel security constraints for Pods and containers - kubernetes.io](https://kubernetes.io/docs/concepts/security/linux-kernel-security-constraints/)
- [Security Profiles Operator - github.com](https://github.com/kubernetes-sigs/security-profiles-operator)
