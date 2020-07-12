# Node

Node 是 Kubernetes 集群的工作节点，可以是物理机也可以是虚拟机。

## Node 的状态

Node 包括如下状态信息：

- Address
  - HostName：可以被 kubelet 中的 `--hostname-override` 参数替代。
  - ExternalIP：可以被集群外部路由到的 IP 地址。
  - InternalIP：集群内部使用的 IP，集群外部无法访问。
- Condition
  - OutOfDisk：磁盘空间不足时为 `True`
  - Ready：Node controller 40 秒内没有收到 node 的状态报告为 `Unknown`，健康为 `True`，否则为 `False`。
  - MemoryPressure：当 node 有内存压力时为 `True`，否则为 `False`。
  - DiskPressure：当 node 有磁盘压力时为 `True`，否则为 `False`。
- Capacity
  - CPU
  - 内存
  - 可运行的最大 Pod 个数
- Info：节点的一些版本信息，如 OS、kubernetes、docker 等

## Node 管理

禁止 Pod 调度到该节点上。

```bash
kubectl cordon <node>
```

驱逐该节点上的所有 Pod。

```bash
kubectl drain <node>
```

该命令会删除该节点上的所有 Pod（DaemonSet 除外），在其他 node 上重新启动它们，通常该节点需要维护时使用该命令。直接使用该命令会自动调用`kubectl cordon <node>`命令。当该节点维护完成，启动了 kubelet 后，再使用`kubectl uncordon <node>` 即可将该节点添加到 kubernetes 集群中。