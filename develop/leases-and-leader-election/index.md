---
weight: 110
title: "Lease 与领导者选举：控制器高可用的协调原语"
linktitle: Lease 与领导者选举
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: leases-and-leader-election
description: "讲解 coordination.k8s.io 的 Lease 对象在 Kubernetes 中的四种用途（节点心跳、控制面组件领导者选举、API Server 身份、自定义工作负载协调），client-go 领导者选举的工作原理与 LeaseDuration/RenewDeadline/RetryPeriod 参数调优，controller-runtime 中的开启方式，协调式领导者选举（CoordinatedLeaderElection，v1.33 Beta）如何让升级时由最旧版本当选，以及常见的脑裂与失效排障。"
---

> 控制器"多副本"不等于"多活"——Kubernetes 里几乎所有控制器都是一主多备，而决定谁是主的，只是一个每两秒续约一次的小对象。

分布式系统需要一种机制让一组实例中只有一个执行某项工作，其余待命，并在主实例失联时快速接替。Kubernetes 用 `coordination.k8s.io` API 组的 `Lease`（租约）对象实现这一机制：它只是一个带持有者标识与到期时间的小记录，依靠 API Server 的乐观并发控制（`resourceVersion`）保证同一时刻只有一个写入者成功。本文介绍 Lease 的各种用途、领导者选举在客户端库中的实现，以及如何在自己的控制器中正确使用。

## Lease 对象

```yaml
apiVersion: coordination.k8s.io/v1
kind: Lease
metadata:
  name: my-operator-leader
  namespace: my-operator-system
spec:
  holderIdentity: my-operator-7d9f8b6c5-x2k9q_6c1f0a7e-...   # 当前持有者，通常为 Pod 名 + 随机 ID
  leaseDurationSeconds: 15                                   # 非持有者需等待多久才能认为租约过期
  acquireTime: "2026-11-01T02:00:00.000000Z"
  renewTime: "2026-11-01T02:15:04.120000Z"                   # 持有者最近一次续约时间
  leaseTransitions: 3                                        # 持有者变更次数
```

Lease 之所以适合做锁，是因为 Kubernetes 的 `update` 操作要求提供与服务端一致的 `resourceVersion`：两个候选者同时尝试把 `holderIdentity` 改为自己时，只有一个能成功，另一个收到 409 Conflict。它比早期用 ConfigMap/Endpoints 注解做锁的方式轻量得多，也不会污染 Service 的事件流。

## Kubernetes 内部的四种用途

{{< table title="Lease 在 Kubernetes 中的用途" >}}

| 用途 | 位置 | 说明 |
|------|------|------|
| 节点心跳 | `kube-node-lease` 命名空间，每节点一个 Lease | kubelet 默认每 10 秒续约（`nodeLeaseDurationSeconds: 40`），节点控制器据此判断节点是否失联；比更新 Node 对象 `status` 便宜得多，是大规模集群可扩展性的关键 |
| 控制面领导者选举 | `kube-system` 中的 `kube-controller-manager`、`kube-scheduler`、`cloud-controller-manager` | 多副本控制面中只有持有 Lease 的实例执行协调逻辑，其余实例只做备份 |
| API Server 身份 | `kube-system` 中 `apiserver-<hash>` Lease（`APIServerIdentity`，Beta） | 每个 kube-apiserver 实例注册自己的身份，用于聚合发现、存储版本协调等需要知道"有哪些 API Server 在运行"的功能 |
| 工作负载协调 | 任意命名空间 | Operator、自定义控制器与应用用于自己的领导者选举或分布式锁 |

{{< /table >}}

```bash
# 查看控制面组件当前的领导者
kubectl -n kube-system get lease kube-controller-manager kube-scheduler -o custom-columns=NAME:.metadata.name,HOLDER:.spec.holderIdentity,RENEW:.spec.renewTime

# 查看节点心跳
kubectl -n kube-node-lease get lease
```

## client-go 的领导者选举

`k8s.io/client-go/tools/leaderelection` 实现了基于 Lease 的选举算法，controller-runtime、kube-controller-manager、kube-scheduler 以及几乎所有 Operator 都使用它。算法概要：

1. 候选者尝试读取 Lease；不存在则创建并把自己写为持有者
2. 若 Lease 存在且 `renewTime + leaseDurationSeconds` 尚未过期、持有者不是自己，则等待 `RetryPeriod` 后重试
3. 若已过期，尝试用当前 `resourceVersion` 更新为自己；成功即成为领导者，失败（409）说明有人抢先，回到第 2 步
4. 领导者每 `RetryPeriod` 续约一次（更新 `renewTime`），若连续 `RenewDeadline` 时间内都续约失败，主动放弃领导权并（默认）退出进程

```go
import (
    "k8s.io/client-go/tools/leaderelection"
    "k8s.io/client-go/tools/leaderelection/resourcelock"
)

lock := &resourcelock.LeaseLock{
    LeaseMeta: metav1.ObjectMeta{Name: "my-operator-leader", Namespace: ns},
    Client:    clientset.CoordinationV1(),
    LockConfig: resourcelock.ResourceLockConfig{Identity: podName + "_" + uuid.NewString()},
}

leaderelection.RunOrDie(ctx, leaderelection.LeaderElectionConfig{
    Lock:            lock,
    LeaseDuration:   15 * time.Second,   // 其他候选者认为租约过期前的等待时间
    RenewDeadline:   10 * time.Second,   // 领导者续约失败多久后放弃领导权
    RetryPeriod:     2 * time.Second,    // 续约 / 尝试获取的间隔
    ReleaseOnCancel: true,               // ctx 取消时主动释放租约，加速切换
    Callbacks: leaderelection.LeaderCallbacks{
        OnStartedLeading: func(ctx context.Context) { runControllers(ctx) },
        OnStoppedLeading: func() { klog.Info("lost leadership, exiting"); os.Exit(0) },
        OnNewLeader: func(id string) { klog.Infof("current leader: %s", id) },
    },
})
```

三个时间参数需满足 `LeaseDuration > RenewDeadline > RetryPeriod × 1.2`。它们的权衡：

- **LeaseDuration 越短**，领导者崩溃后接替越快，但对 API Server 延迟与时钟偏差越敏感，可能出现"领导者仍在运行却被认为过期"的双主窗口
- **RenewDeadline** 应给续约留出多次重试机会（默认 10 秒配 2 秒 RetryPeriod 可重试 5 次），避免 API Server 短暂抖动就让领导者退位
- 默认的 15/10/2 秒适合多数控制器；对 API Server 负载敏感的大集群可放宽到 60/40/10 秒以减少续约请求

{{< callout warning "领导者选举不是互斥保证" >}}
基于租约的选举只能保证"大多数时间只有一个领导者"，无法在所有情况下排除双主：旧领导者可能因 GC 停顿、网络分区在失去租约后仍执行了几秒钟的操作。控制器逻辑必须是幂等的，关键写操作应依赖对象的 `resourceVersion` 做乐观并发，而不是假设自己一定是唯一写入者。
{{< /callout >}}

### controller-runtime 中的用法

Kubebuilder/Operator SDK 生成的项目默认通过 `Manager` 选项开启：

```go
mgr, err := ctrl.NewManager(ctrl.GetConfigOrDie(), ctrl.Options{
    LeaderElection:             true,
    LeaderElectionID:           "a1b2c3d4.example.com",   // Lease 名称，须全局唯一
    LeaderElectionNamespace:    "my-operator-system",      // 默认为 Pod 所在命名空间
    LeaderElectionResourceLock: "leases",                  // 默认
    LeaseDuration:              ptr.To(15 * time.Second),
    RenewDeadline:              ptr.To(10 * time.Second),
    RetryPeriod:                ptr.To(2 * time.Second),
    LeaderElectionReleaseOnCancel: true,
})
```

Manager 会在成为领导者后才启动需要选举的控制器与 Webhook 之外的 Runnable；Webhook 服务器不受选举影响，所有副本都处理准入请求。Operator 的 RBAC 必须包含对 `coordination.k8s.io` 组 `leases` 资源的 `get/list/watch/create/update/patch/delete` 权限，Kubebuilder 脚手架已默认生成。

## 协调式领导者选举

传统选举中"谁先抢到谁当领导者"，这在控制面滚动升级时会造成问题：新版本的 kube-controller-manager 可能先于旧版本成为领导者，而此时 kube-apiserver 还是旧版本，新控制器使用的 API 字段尚不存在。协调式领导者选举（Coordinated Leader Election，v1.33 Beta，默认关闭）把选举决定权交给 API Server：

- 每个候选者创建一个 `LeaseCandidate` 对象（`coordination.k8s.io/v1beta1`），声明自己的二进制版本与模拟版本
- API Server 中的选举控制器按策略挑选领导者并写入 Lease，当前策略 `OldestEmulationVersion` 优先选择模拟版本最低、其次二进制版本最低、再次创建时间最早的候选者
- 领导者变更时 API Server 标记 Lease 为"应被抢占"，当前领导者优雅让位

```bash
# 启用（控制面所有组件）
--feature-gates=CoordinatedLeaderElection=true
--runtime-config=coordination.k8s.io/v1beta1=true

kubectl -n kube-system get leasecandidates
```

这让控制面升级遵循"API Server 先升级、控制器最后切换到新版本"的安全顺序，与 [兼容性版本](../../architecture/feature-gates-and-api-deprecation) 机制配合可以把升级风险进一步降低。目前主要面向 kube-controller-manager 与 kube-scheduler，client-go 的 `LeaderElectionConfig.Coordinated` 字段允许自定义控制器参与。

## 排障

常见的领导者选举问题与定位方式：

- **所有副本都报 `failed to acquire lease`**：检查 RBAC 是否授予 Lease 权限、命名空间是否存在、Lease 是否被另一个同名应用占用（`holderIdentity` 不属于当前副本集）
- **领导者频繁切换（`leaseTransitions` 快速增长）**：续约超时，通常是 API Server 延迟高、控制器 Pod CPU 被限流导致 GC 停顿或节点时钟漂移；放宽 `RenewDeadline` 并检查 `apiserver_request_duration_seconds`
- **旧领导者 Pod 删除后新领导者等了很久**：没有设置 `ReleaseOnCancel`，必须等待 `LeaseDuration` 过期；或旧 Pod 的 `terminationGracePeriodSeconds` 过长
- **节点 NotReady 但 kubelet 正常**：检查 `kube-node-lease` 中对应 Lease 的 `renewTime`，若不更新则 kubelet 到 API Server 的连接有问题；若更新正常但节点仍 NotReady，问题在 Node 对象 status 的更新
- **双主迹象（同一对象被两个副本反复改写）**：查看两副本日志中的 `OnStartedLeading` 时间是否重叠；确认控制器逻辑幂等

Lease 相关的指标包括 client-go 暴露的 `leader_election_master_status{name}`（1 为领导者）与 controller-runtime 的 `leader_election_*`，应为每个 Operator 配置"领导者数量不等于 1"的告警。

## 总结

Lease 是 Kubernetes 中最小却最关键的协调原语：它让万级节点的心跳成本可控，让控制面组件与成千上万的 Operator 以一致的方式实现一主多备，并通过协调式领导者选举让升级顺序变得可控。对控制器开发者而言，正确使用它只需三件事——通过 controller-runtime 或 client-go 开启选举、按 API Server 的延迟特征调整三个时间参数、以及始终记住租约不等于互斥，让协调逻辑保持幂等。

## 参考文献

- [Leases - kubernetes.io](https://kubernetes.io/docs/concepts/architecture/leases/)
- [Coordinated Leader Election - kubernetes.io](https://kubernetes.io/docs/concepts/cluster-administration/coordinated-leader-election/)
- [Nodes: Heartbeats - kubernetes.io](https://kubernetes.io/docs/concepts/architecture/nodes/#heartbeats)
- [client-go leaderelection package - pkg.go.dev](https://pkg.go.dev/k8s.io/client-go/tools/leaderelection)
- [controller-runtime Manager Options - pkg.go.dev](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/manager#Options)
- [Simple leader election with Kubernetes and Docker - kubernetes.io](https://kubernetes.io/blog/2016/01/simple-leader-election-with-kubernetes/)
