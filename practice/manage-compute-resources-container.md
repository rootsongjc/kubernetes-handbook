# 管理容器的计算资源

当您定义 [Pod](http://kubernetes.io/docks/user-guide/pods) 的时候可以选择为每个容器指定需要的 CPU 和内存（RAM）大小。当为容器指定了资源请求后，调度器就能够更好的判断出将容器调度到哪个节点上。如果您还为容器指定了资源限制，节点上的资源就可以按照指定的方式做竞争。关于资源请求和限制的不同点和更多资料请参考 [Resource QoS](https://git.k8s.io/community/contributors/design-proposals/resource-qos.md)。

## 资源类型

*CPU* 和 *memory* 都是 *资源类型*。资源类型具有基本单位。CPU 的单位是 core，memory 的单位是 byte。

CPU和内存统称为*计算资源*，也可以称为*资源*。计算资源的数量是可以被请求、分配和消耗的可测量的。它们与 [API 资源](https://kubernetes.io/docks/api/) 不同。 API 资源（如 Pod 和 [Service](https://kubernetes.io/docks/user-guide/services)）是可通过 Kubernetes API server 读取和修改的对象。

## Pod 和 容器的资源请求和限制

Pod 中的每个容器都可以指定以下的一个或者多个值：

- spec.containers[].resources.limits.cpu`
- `spec.containers[].resources.limits.memory`
- `spec.containers[].resources.requests.cpu`
- `spec.containers[].resources.requests.memory`

尽管只能在个别容器上指定请求和限制，但是我们可以方便地计算出 Pod 资源请求和限制。特定资源类型的Pod 资源请求/限制是 Pod 中每个容器的该类型的资源请求/限制的总和。

## CPU 的含义

CPU 资源的限制和请求以 *cpu* 为单位。

Kubernetes 中的一个 cpu 等于：

- 1 AWS vCPU
- 1 GCP Core
- 1 Azure vCore
- 1 *Hyperthread* 在带有超线程的裸机 Intel 处理器上

允许浮点数请求。具有 `spec.containers[].resources.requests.cpu` 为 0.5 的容器保证了一半 CPU 要求 1 CPU的一半。表达式 `0.1` 等价于表达式 `100m`，可以看作 “100 millicpu”。有些人说成是“一百毫 cpu”，其实说的是同样的事情。具有小数点（如 `0.1`）的请求由 API 转换为`100m`，精度不超过 `1m`。因此，可能会优先选择 `100m` 的形式。

## 内存的含义

内存的限制和请求以字节为单位。您可以使用以下后缀之一作为平均整数或定点整数表示内存：E，P，T，G，M，K。您还可以使用两个字母的等效的幂数：Ei，Pi，Ti ，Gi，Mi，Ki。例如，以下代表大致相同的值：

```shell
128974848, 129e6, 129M, 123Mi
```

下面是个例子。

以下 Pod 有两个容器。每个容器的请求为 0.25 cpu 和 64MiB（2<sup>26</sup>）内存，每个容器的限制为 0.5 cpu 和 128MiB 内存。您可以说该 Pod 请求 0.5 cpu 和 128 MiB 的内存，限制为 1 cpu 和 256MiB 的内存。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: frontend
spec:
  containers:
  - name: db
    image: mysql
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
  - name: wp
    image: wordpress
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
```

## 具有资源请求的 Pod 如何调度

当您创建一个 Pod 时，Kubernetes 调度程序将为 Pod 选择一个节点。每个节点具有每种资源类型的最大容量：可为 Pod 提供的 CPU 和内存量。调度程序确保对于每种资源类型，调度的容器的资源请求的总和小于节点的容量。请注意，尽管节点上的实际内存或 CPU 资源使用量非常低，但如果容量检查失败，则调度程序仍然拒绝在该节点上放置 Pod。当资源使用量稍后增加时，例如在请求率的每日峰值期间，这可以防止节点上的资源短缺。

## 具有资源限制的 Pod 如何运行

当 kubelet 启动一个 Pod 的容器时，它会将 CPU 和内存限制传递到容器运行时。

当使用 Docker 时：

- `spec.containers[].resources.requests.cpu` 的值将转换成 core 值，这是个浮点数，并乘以1024，这个数字中的较大者或2用作 `docker run` 命令中的[ `--cpu-shares`](https://docs.docker.com/engine/reference/run/#/cpu-share-constraint) 标志的值。
- `spec.containers[].resources.limits.cpu` 被转换成 millicore 值。被乘以 100000 然后 除以 1000。这个数字用作 `docker run` 命令中的 [`--cpu-quota`](https://docs.docker.com/engine/reference/run/#/cpu-quota-constraint) 标志的值。[`--cpu-quota` ] 标志被设置成了 100000，表示测量配额使用的默认100ms 周期。如果 [`--cpu-cfs-quota`] 标志设置为 true，则 kubelet 会强制执行 cpu 限制。从 Kubernetes 1.2 版本起，此标志默认为 true。
- `spec.containers[].resources.limits.memory` 被转换为整型，作为 `docker run` 命令中的 [`--memory`](https://docs.docker.com/engine/reference/run/#/user-memory-constraints) 标志的值。

如果容器超过其内存限制，则可能会被终止。如果可重新启动，则与所有其他类型的运行时故障一样，kubelet 将重新启动它。

如果一个容器超过其内存请求，那么当节点内存不足时，它的 Pod 可能被逐出。

容器可能被允许也可能不被允许超过其 CPU 限制时间。但是，由于 CPU 使用率过高，不会被杀死。

要确定容器是否由于资源限制而无法安排或被杀死，请参阅 [疑难解答](#troubleshooting) 部分。

## 监控计算资源使用

Pod 的资源使用情况被报告为 Pod 状态的一部分。

如果为集群配置了 [可选监控](http://releases.k8s.io/{{page.githubbranch}}/cluster/addons/cluster-monitoring/README.md)，则可以从监视系统检索 Pod 资源的使用情况。

## 疑难解答

