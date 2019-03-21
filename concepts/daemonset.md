# DaemonSet

## 什么是 DaemonSet？

 _DaemonSet_ 确保全部（或者一些）Node 上运行一个 Pod 的副本。当有 Node 加入集群时，也会为他们新增一个 Pod 。当有 Node 从集群移除时，这些 Pod 也会被回收。删除 DaemonSet 将会删除它创建的所有 Pod。

使用 DaemonSet 的一些典型用法：

- 运行集群存储 daemon，例如在每个 Node 上运行 `glusterd`、`ceph`。
- 在每个 Node 上运行日志收集 daemon，例如`fluentd`、`logstash`。
- 在每个 Node 上运行监控 daemon，例如 [Prometheus Node Exporter](https://github.com/prometheus/node_exporter)、`collectd`、Datadog 代理、New Relic 代理，或 Ganglia `gmond`。

一个简单的用法是，在所有的 Node 上都存在一个 DaemonSet，将被作为每种类型的 daemon 使用。
一个稍微复杂的用法可能是，对单独的每种类型的 daemon 使用多个 DaemonSet，但具有不同的标志，和/或对不同硬件类型具有不同的内存、CPU要求。

## 编写 DaemonSet Spec

### 必需字段

和其它所有 Kubernetes 配置一样，DaemonSet 需要 `apiVersion`、`kind` 和 `metadata`字段。有关配置文件的通用信息，详见文档 [部署应用](https://kubernetes.io/docs/user-guide/deploying-applications/)、[配置容器](https://kubernetes.io/docs/user-guide/configuring-containers/) 和 [资源管理](https://kubernetes.io/docs/concepts/tools/kubectl/object-management-overview/) 。

DaemonSet 也需要一个 [`.spec`](https://git.k8s.io/community/contributors/devel/api-conventions.md#spec-and-status) 配置段。

### Pod 模板

`.spec` 唯一必需的字段是 `.spec.template`。

`.spec.template` 是一个 [Pod 模板](https://kubernetes.io/docs/user-guide/replication-controller/#pod-template)。
它与 [Pod](https://kubernetes.io/docs/user-guide/pods) 具有相同的 schema，除了它是嵌套的，而且不具有 `apiVersion` 或 `kind` 字段。

Pod 除了必须字段外，在 DaemonSet 中的 Pod 模板必须指定合理的标签（查看 [pod selector](#pod-selector)）。

在 DaemonSet 中的 Pod 模板必需具有一个值为 `Always` 的 [`RestartPolicy`](https://kubernetes.io/docs/user-guide/pod-states)，或者未指定它的值，默认是 `Always`。

### Pod Selector

`.spec.selector` 字段表示 Pod Selector，它与 [Job](https://kubernetes.io/docs/concepts/jobs/run-to-completion-finite-workloads/) 或其它资源的 `.spec.selector` 的原理是相同的。

`spec.selector` 表示一个对象，它由如下两个字段组成：

* `matchLabels` - 与 [ReplicationController](https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller/) 的 `.spec.selector` 的原理相同。
* `matchExpressions` - 允许构建更加复杂的 Selector，可以通过指定 key、value 列表，以及与 key 和 value 列表的相关的操作符。

当上述两个字段都指定时，结果表示的是 AND 关系。

如果指定了 `.spec.selector`，必须与 `.spec.template.metadata.labels` 相匹配。如果没有指定，它们默认是等价的。如果与它们配置的不匹配，则会被 API 拒绝。

如果 Pod 的 label 与 selector 匹配，或者直接基于其它的 DaemonSet、或者 Controller（例如 ReplicationController），也不可以创建任何 Pod。
否则 DaemonSet Controller 将认为那些 Pod 是它创建的。Kubernetes 不会阻止这样做。一个场景是，可能希望在一个具有不同值的、用来测试用的 Node 上手动创建 Pod。

### 仅在相同的 Node 上运行 Pod

如果指定了 `.spec.template.spec.nodeSelector`，DaemonSet Controller 将在能够匹配上 [Node Selector](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/) 的 Node 上创建 Pod。
类似这种情况，可以指定 `.spec.template.spec.affinity`，然后 DaemonSet Controller 将在能够匹配上 [Node Affinity](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/) 的 Node 上创建 Pod。
如果根本就没有指定，则 DaemonSet Controller 将在所有 Node 上创建 Pod。

## 如何调度 Daemon Pod

正常情况下，Pod 运行在哪个机器上是由 Kubernetes 调度器进行选择的。然而，由 Daemon Controller 创建的 Pod 已经确定了在哪个机器上（Pod 创建时指定了 `.spec.nodeName`），因此：

- DaemonSet Controller 并不关心一个 Node 的 [`unschedulable`](https://kubernetes.io/docs/admin/node/#manual-node-administration) 字段。
- DaemonSet Controller 可以创建 Pod，即使调度器还没有被启动，这对集群启动是非常有帮助的。

Daemon Pod 关心 [Taint 和 Toleration](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#taints-and-tolerations-beta-feature)，它们会为没有指定 `tolerationSeconds` 的 `node.alpha.kubernetes.io/notReady` 和 `node.alpha.kubernetes.io/unreachable` 的 Taint，而创建具有 `NoExecute` 的 Toleration。这确保了当 alpha 特性的 `TaintBasedEvictions` 被启用，当 Node 出现故障，比如网络分区，这时它们将不会被清除掉（当 `TaintBasedEvictions` 特性没有启用，在这些场景下也不会被清除，但会因为 NodeController 的硬编码行为而被清除，Toleration  是不会的）。

## 与 Daemon Pod 通信

与 DaemonSet 中的 Pod 进行通信，几种可能的模式如下：

- **Push**：配置 DaemonSet 中的 Pod 向其它 Service 发送更新，例如统计数据库。它们没有客户端。
- **NodeIP 和已知端口**：DaemonSet 中的 Pod 可以使用 `hostPort`，从而可以通过 Node IP 访问到 Pod。客户端能通过某种方法知道 Node IP 列表，并且基于此也可以知道端口。
- **DNS**：创建具有相同 Pod Selector 的 [Headless Service](https://kubernetes.io/docs/user-guide/services/#headless-services)，然后通过使用 `endpoints` 资源或从 DNS 检索到多个 A 记录来发现 DaemonSet。
- **Service**：创建具有相同 Pod Selector 的 Service，并使用该 Service 访问到某个随机 Node 上的 daemon。（没有办法访问到特定 Node）

## 更新 DaemonSet

如果修改了 Node Label，DaemonSet 将立刻向新匹配上的 Node 添加 Pod，同时删除新近无法匹配上的 Node 上的 Pod。

可以修改 DaemonSet 创建的 Pod。然而，不允许对 Pod 的所有字段进行更新。当下次 Node（即使具有相同的名称）被创建时，DaemonSet Controller 还会使用最初的模板。

可以删除一个 DaemonSet。如果使用 `kubectl` 并指定 `--cascade=false` 选项，则 Pod 将被保留在 Node 上。然后可以创建具有不同模板的新 DaemonSet。具有不同模板的新 DaemonSet 将鞥能够通过 Label 匹配识别所有已经存在的 Pod。它不会修改或删除它们，即使是错误匹配了 Pod 模板。通过删除 Pod 或者 删除 Node，可以强制创建新的 Pod。

在 Kubernetes 1.6 或以后版本，可以在 DaemonSet 上 [执行滚动升级](https://kubernetes.io/docs/tasks/manage-daemon/update-daemon-set/)。

### init 脚本

很可能通过直接在一个 Node 上启动 daemon 进程（例如，使用 `init`、`upstartd`、或 `systemd`）。这非常好，然而基于 DaemonSet 来运行这些进程有如下一些好处：

- 像对待应用程序一样，具备为 daemon 提供监控和管理日志的能力。
- 为 daemon 和应用程序使用相同的配置语言和工具（如 Pod 模板、`kubectl`）。
- Kubernetes 未来版本可能会支持对 DaemonSet 创建 Pod 与 Node升级工作流进行集成。
- 在资源受限的容器中运行 daemon，能够增加 daemon 和应用容器的隔离性。然而这也实现了在容器中运行 daemon，但却不能在 Pod 中运行（例如，直接基于 Docker 启动）。

### 裸 Pod

可能要直接创建 Pod，同时指定其运行在特定的 Node 上。
然而，DaemonSet 替换了由于任何原因被删除或终止的 Pod，例如 Node 失败、例行节点维护，比如内核升级。由于这个原因，我们应该使用 DaemonSet 而不是单独创建 Pod。

### 静态 Pod

很可能，通过在一个指定目录下编写文件来创建 Pod，该目录受 Kubelet 所监视。这些 Pod 被称为 [静态 Pod](https://kubernetes.io/docs/concepts/cluster-administration/static-pod/)。
不像 DaemonSet，静态 Pod 不受 kubectl 和 其它 Kubernetes API 客户端管理。静态 Pod 不依赖于 apiserver，这使得它们在集群启动的情况下非常有用。
而且，未来静态 Pod 可能会被废弃掉。

### Replication Controller

DaemonSet 与 [Replication Controller](https://kubernetes.io/docs/user-guide/replication-controller) 非常类似，它们都能创建 Pod，这些 Pod 都具有不期望被终止的进程（例如，Web 服务器、存储服务器）。
为无状态的 Service 使用 Replication Controller，像 frontend，实现对副本的数量进行扩缩容、平滑升级，比之于精确控制 Pod 运行在某个主机上要重要得多。需要 Pod 副本总是运行在全部或特定主机上，并需要先于其他 Pod 启动，当这被认为非常重要时，应该使用 Daemon Controller。

