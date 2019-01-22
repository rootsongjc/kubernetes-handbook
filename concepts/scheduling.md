# 资源调度

Kubernetes作为一个容器编排调度引擎，资源调度是它的最基本也是最重要的功能，这一节中我们将着重讲解Kubernetes中是如何做资源调度的。

Kubernetes中有一个叫做`kube-scheduler`的组件，该组件就是专门监听`kube-apiserver`中是否有还未调度到node上的pod，再通过特定的算法为pod指定分派node运行。

Kubernetes中的众多资源类型，例如Deployment、DaemonSet、StatefulSet等都已经定义了Pod运行的一些默认调度策略，但是如果我们细心的根据node或者pod的不同属性，分别为它们打上标签之后，我们将发现Kubernetes中的高级调度策略是多么强大。当然如果要实现动态的资源调度，即pod已经调度到某些节点上后，因为一些其它原因，想要让pod重新调度到其它节点。

考虑以下两种情况：

- 集群中有新增节点，想要让集群中的节点的资源利用率比较均衡一些，想要将一些高负载的节点上的pod驱逐到新增节点上，这是kuberentes的scheduler所不支持的，需要使用如[descheduler](https://github.com/kubernetes-incubator/descheduler)这样的插件来实现。
- 想要运行一些大数据应用，设计到资源分片，pod需要与数据分布达到一致均衡，避免个别节点处理大量数据，而其它节点闲置导致整个作业延迟，这时候可以考虑使用[kube-batch](https://github.com/kubernetes-incubator/kube-batch)。