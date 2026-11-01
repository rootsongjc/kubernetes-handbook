---
weight: 6
title: Pause 容器
date: 2022-05-21T00:00:00+08:00
type: book
description: 深入探究 Kubernetes 中 Pause 容器（Infra 容器）的作用与原理，了解它如何实现 Pod 内容器间的网络命名空间共享，以及在 Pod 生命周期管理中的关键作用。
lastmod: 2026-11-01T00:00:00+08:00
---

> Pause 容器（Infra 容器）是 Kubernetes Pod 架构的核心机制，负责实现容器间命名空间共享和 Pod 生命周期管理，是多容器协作的基础。

## Pause 容器配置

Pause 容器又称沙箱（Sandbox）容器或 Infra 容器。在当前的 CRI 架构下，**沙箱镜像由容器运行时而非 kubelet 决定**：kubelet 通过 CRI 的 `RunPodSandbox` 调用让运行时创建沙箱，运行时据自身配置拉起 Pause 容器。以 containerd 为例：

```toml
# containerd 2.x：/etc/containerd/config.toml
version = 3
[plugins."io.containerd.cri.v1.runtime"]
  sandbox_image = "registry.k8s.io/pause:3.10"

# containerd 1.7：/etc/containerd/config.toml
version = 2
[plugins."io.containerd.grpc.v1.cri"]
  sandbox_image = "registry.k8s.io/pause:3.10"
```

CRI-O 则在 `/etc/crio/crio.conf` 的 `pause_image` 字段中配置。kubelet 的 `--pod-infra-container-image` 参数如今只用于告知 kubelet 的镜像垃圾回收不要删除该镜像，并已在 v1.30 后逐步弃用；若该参数与运行时配置不一致，以运行时配置为准。使用 kubeadm 部署时，`kubeadm config images pull` 会按 Kubernetes 版本拉取匹配的 Pause 镜像，并在 `kubeadm init` 阶段提示修正 containerd 中不一致的 `sandbox_image`。

Pause 容器可自定义，官方源代码见 [Kubernetes GitHub 仓库](https://github.com/kubernetes/kubernetes/tree/master/build/pause)，采用 C 语言实现。

## 容器特点

Pause 容器具备以下显著特性：

- **轻量级**：镜像极小，约 300-700KB
- **持久运行**：始终处于 Pause（暂停）状态
- **多架构支持**：兼容 AMD64、ARM64 等主流架构
- **资源消耗极低**：几乎不占用 CPU 和内存

## 设计背景

Pod 是 Kubernetes 的基本调度单元，本质为逻辑概念。为实现 Pod 内多容器高效共享资源，需打破 Linux Namespace 和 cgroups 的隔离。Kubernetes 通过 Pause 容器实现网络和存储共享，具体包括：

- **网络共享**：通过 Network Namespace
- **存储共享**：通过 Volume 挂载

## 实现原理

Pause 容器的核心作用是为 Pod 内所有业务容器提供统一的命名空间基础。下图展示了 Pause 容器实现网络共享的流程：

![Pause 容器网络共享机制](pause-network-sharing.svg)

### 网络共享机制

Pod 内容器的网络共享按如下步骤实现：

1. 创建 Pause 容器，持有 Network Namespace
2. 业务容器通过 `--net=container:pause` 加入同一 Network Namespace
3. 所有容器共享 IP、端口、路由表等网络资源

### 关键特性

- **统一网络视图**：Pod 内所有容器共享网络设备、IP、MAC 地址
- **生命周期管理**：Pod 生命周期等同于 Pause 容器生命周期
- **独立更新**：可单独更新业务容器，无需重建整个 Pod

## 实际作用

Pause 容器在 Pod 中承担以下职责：

- **命名空间共享基础**：Network、IPC、PID Namespace 共享
- **Init 进程角色**：作为 Pod 内 PID 1，负责回收僵尸进程和信号处理

## 查看运行状态

可通过以下命令在节点上查看 Pause 容器运行情况：

```bash
crictl ps | grep pause
```

示例输出：

```text
9cec6c0ef583   registry.k8s.io/pause:3.10   3 hours ago   Running   k8s_POD_nginx-deployment-...
5a5ef33b0d58   registry.k8s.io/pause:3.10   3 hours ago   Running   k8s_POD_redis-cluster-...
```

## 实战演示

下图展示了 Pause 容器在 Pod 内部的资源共享机制：

![Pause 容器示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/objects/pause-container/pause-container.webp)
{width=1598 height=948}

以下演示借助 Docker CLI 手动复现 kubelet 与 CRI 运行时创建 Pod 的过程。Docker 在这里只是便于观察的实验工具，真实集群中这些动作由 containerd/CRI-O 通过 CRI 完成，读者也可以用 `nerdctl` 执行相同命令。

### 步骤一：启动 Pause 容器

手动启动 Pause 容器作为命名空间基础：

```bash
docker run -d --name pause -p 8880:80 --ipc=shareable registry.k8s.io/pause:3.10
```

### 步骤二：启动 Nginx 容器并共享命名空间

通过 `--net=container:pause` 等参数将 Nginx 容器加入 Pause 容器命名空间：

```bash
cat <<EOF > nginx.conf
error_log stderr;
events { worker_connections 1024; }
http {
    access_log /dev/stdout combined;
    server {
        listen 80 default_server;
        server_name example.com www.example.com;
        location / {
            proxy_pass http://127.0.0.1:2368;
        }
    }
}
EOF

docker run -d --name nginx \
  -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf \
  --net=container:pause \
  --ipc=container:pause \
  --pid=container:pause \
  nginx
```

### 步骤三：启动 Ghost 应用容器

将 Ghost 容器加入 Pause 容器命名空间，实现多容器协作：

```bash
docker run -d --name ghost \
  --net=container:pause \
  --ipc=container:pause \
  --pid=container:pause \
  ghost
```

访问 `http://localhost:8880/` 即可看到 Ghost 博客界面。

### 验证共享效果

进入 Ghost 容器查看进程：

```bash
docker exec -it ghost ps aux
```

示例输出：

```text
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.0   1024     4 ?        Ss   13:49   0:00 /pause
root         5  0.0  0.1  32432  5736 ?        Ss   13:51   0:00 nginx: master process
systemd+     9  0.0  0.0  32980  3304 ?        S    13:51   0:00 nginx: worker process
node        10  0.3  2.0 1254200 83788 ?       Ssl  13:53   0:03 node current/index.js
```

可见：

- Pause 容器进程 PID 为 1（Init 进程）
- 所有容器进程在同一 PID 命名空间
- 容器间可通过 `localhost` 通信

## 版本演进

Pause 镜像的版本与 Kubernetes 版本松耦合，下表列出了近年来主要版本的对应关系：

{{< table title="Pause 容器版本演进与变化" >}}

| Kubernetes 版本 | Pause 容器版本 | 主要变化                                           |
|-----------------|----------------|----------------------------------------------------|
| 1.20 及以前     | pause:3.2      | 基础功能                                           |
| 1.21-1.24       | pause:3.5      | 多架构支持                                         |
| 1.25-1.30       | pause:3.9      | 镜像仓库迁移到 registry.k8s.io                       |
| 1.31+           | pause:3.10     | 构建链升级、Windows 镜像基于 nanoserver 更新；沙箱镜像配置权转移至运行时 |

{{< /table >}}

需要注意的是，Pause 进程并不会随 Kubernetes 版本升级而发生功能变化，上表中的版本差异主要来自构建工具链与镜像基础层。

## 最佳实践

Pause 容器相关建议如下：

- **镜像选择**：使用与集群版本匹配的 Pause 容器镜像，并在容器运行时（而非 kubelet）配置中声明
- **镜像预置**：离线或私有仓库环境应把 Pause 镜像预先同步到每个节点，否则所有 Pod 都会卡在 `ContainerCreating`
- **监控观察**：通过 Pause 容器状态判断 Pod 健康
- **故障排查**：Pause 容器异常通常意味着整个 Pod 存在问题；`crictl pods` 可直接列出沙箱状态

## 总结

Pause 容器是 Kubernetes Pod 内部资源共享和生命周期管理的基础。通过 Pause 容器实现命名空间统一，保障多容器高效协作和稳定运行。建议在实际运维中关注 Pause 容器状态，提升故障排查和集群可靠性。

## 参考文献

- [The Almighty Pause Container - ianlewis.org](https://www.ianlewis.org/en/almighty-pause-container)
- [Kubernetes Pause Container Source Code - github.com](https://github.com/kubernetes/kubernetes/tree/master/build/pause)
- [Kubernetes Container Runtime Interface - kubernetes.io](https://kubernetes.io/docs/concepts/architecture/cri/)
