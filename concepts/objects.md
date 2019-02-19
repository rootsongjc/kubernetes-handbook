# Objects

以下列举的内容都是 kubernetes 中的 Object，这些对象都可以在 yaml 文件中作为一种 API 类型来配置。

- Pod
- Node
- Namespace
- Service
- Volume
- PersistentVolume
- Deployment
- Secret
- StatefulSet
- DaemonSet
- ServiceAccount
- ReplicationController
- ReplicaSet
- Job
- CronJob
- SecurityContext
- ResourceQuota
- LimitRange
- HorizontalPodAutoscaling
- Ingress
- ConfigMap
- Label
- CustomResourceDefinition
- Role
- ClusterRole

我将它们简单的分类为以下几种资源对象：

| 类别     | 名称                                                         |
| :------- | ------------------------------------------------------------ |
| 资源对象 | Pod、ReplicaSet、ReplicationController、Deployment、StatefulSet、DaemonSet、Job、CronJob、HorizontalPodAutoscaling、Node、Namespace、Service、Ingress、Label、CustomResourceDefinition |
| 存储对象 | Volume、PersistentVolume、Secret、ConfigMap                  |
| 策略对象 | SecurityContext、ResourceQuota、LimitRange                   |
| 身份对象 | ServiceAccount、Role、ClusterRole                            |

## 理解 kubernetes 中的对象

在 Kubernetes 系统中，*Kubernetes 对象* 是持久化的条目。Kubernetes 使用这些条目去表示整个集群的状态。特别地，它们描述了如下信息：

- 什么容器化应用在运行（以及在哪个 Node 上）
- 可以被应用使用的资源
- 关于应用如何表现的策略，比如重启策略、升级策略，以及容错策略

Kubernetes 对象是 “目标性记录” —— 一旦创建对象，Kubernetes 系统将持续工作以确保对象存在。通过创建对象，可以有效地告知 Kubernetes 系统，所需要的集群工作负载看起来是什么样子的，这就是 Kubernetes 集群的 **期望状态**。

与 Kubernetes 对象工作 —— 是否创建、修改，或者删除 —— 需要使用 [Kubernetes API](https://git.k8s.io/community/contributors/devel/api-conventions.md)。当使用 `kubectl` 命令行接口时，比如，CLI 会使用必要的 Kubernetes API 调用，也可以在程序中直接使用 Kubernetes API。为了实现该目标，Kubernetes 当前提供了一个 `golang` [客户端库](https://github.com/kubernetes/client-go) ，其它语言库（例如[Python](https://github.com/kubernetes-incubator/client-python)）也正在开发中。

### 对象 Spec 与状态

每个 Kubernetes 对象包含两个嵌套的对象字段，它们负责管理对象的配置：对象 *spec* 和 对象 *status*。*spec* 必须提供，它描述了对象的 *期望状态*—— 希望对象所具有的特征。*status* 描述了对象的 *实际状态*，它是由 Kubernetes 系统提供和更新。在任何时刻，Kubernetes 控制平面一直处于活跃状态，管理着对象的实际状态以与我们所期望的状态相匹配。

例如，Kubernetes Deployment 对象能够表示运行在集群中的应用。当创建 Deployment 时，可能需要设置 Deployment 的 spec，以指定该应用需要有 3 个副本在运行。Kubernetes 系统读取 Deployment spec，启动我们所期望的该应用的 3 个实例 —— 更新状态以与 spec 相匹配。如果那些实例中有失败的（一种状态变更），Kubernetes 系统通过修正来响应 spec 和状态之间的不一致 —— 这种情况，启动一个新的实例来替换。

关于对象 spec、status 和 metadata 更多信息，查看 [Kubernetes API Conventions]( https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md)。

### 描述 Kubernetes 对象

当创建 Kubernetes 对象时，必须提供对象的 spec，用来描述该对象的期望状态，以及关于对象的一些基本信息（例如，名称）。当使用 Kubernetes API 创建对象时（或者直接创建，或者基于`kubectl`），API 请求必须在请求体中包含 JSON 格式的信息。**更常用的是，需要在 .yaml 文件中为 kubectl 提供这些信息**。 `kubectl` 在执行 API 请求时，将这些信息转换成 JSON 格式。

这里有一个 `.yaml` 示例文件，展示了 Kubernetes Deployment 的必需字段和对象 spec：

```yaml
apiVersion: apps/v1beta1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.7.9
        ports:
        - containerPort: 80
```

一种创建 Deployment 的方式，类似上面使用 `.yaml` 文件，是使用 `kubectl` 命令行接口（CLI）中的 `kubectl create` 命令，传递 `.yaml` 作为参数。下面是一个示例：

```bash
$ kubectl create -f docs/user-guide/nginx-deployment.yaml --record
```

输出类似如下这样：

```bash
deployment "nginx-deployment" created
```

### 必需字段

在想要创建的 Kubernetes 对象对应的 `.yaml` 文件中，需要配置如下的字段：

- `apiVersion` - 创建该对象所使用的 Kubernetes API 的版本
- `kind` - 想要创建的对象的类型
- `metadata` - 帮助识别对象唯一性的数据，包括一个 `name` 字符串、UID 和可选的 `namespace`

也需要提供对象的 `spec` 字段。对象 `spec` 的精确格式对每个 Kubernetes 对象来说是不同的，包含了特定于该对象的嵌套字段。[Kubernetes API 参考](https://kubernetes.io/docs/api/)能够帮助我们找到任何我们想创建的对象的 spec 格式。
