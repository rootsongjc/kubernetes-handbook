# 管理namespace中的资源配额

当用多个团队或者用户共用同一个集群的时候难免会有资源竞争的情况发生，这时候就需要对不同团队或用户的资源使用配额做出限制。

## 开启资源配额限制功能

目前有两种资源分配管理相关的控制策略插件 `ResourceQuota` 和 `LimitRange`。

要启用它们只要 API Server 的启动配置的 `KUBE_ADMISSION_CONTROL` 参数中加入了 `ResourceQuota` 的设置，这样就给集群开启了资源配额限制功能，加入 `LimitRange` 可以用来限制一个资源申请的范围限制，参考 [为 namesapce 配置默认的内存请求与限额](https://k8smeetup.github.io/docs/tasks/administer-cluster/memory-default-namespace/) 和 [在 namespace 中配置默认的CPU请求与限额](https://k8smeetup.github.io/docs/tasks/administer-cluster/cpu-default-namespace/)。

两种控制策略的作用范围都是对于某一 namespace，`ResourceQuota` 用来限制 namespace 中所有的 Pod 占用的总的资源 request 和 limit，而 `LimitRange` 是用来设置 namespace 中 Pod 的默认的资源 request 和 limit 值。

资源配额分为三种类型：

- 计算资源配额
- 存储资源配额
- 对象数量配额

关于资源配额的详细信息请参考 kubernetes 官方文档 [资源配额](https://k8smeetup.github.io/docs/concepts/policy/resource-quotas/)。

## 示例

我们为 `spark-cluster` 这个 namespace 设置 `ResouceQuota` 和 `LimitRange`。

以下 yaml 文件可以在 [kubernetes-handbook](https://github.com/rootsongjc/kubernetes-handbook) 的 `manifests/spark-with-kubernetes-native-scheduler` 目录下找到。

### 配置计算资源配额

配置文件：`spark-compute-resources.yaml`

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-resources
  namespace: spark-cluster
spec:
  hard:
    pods: "20"
    requests.cpu: "20"
    requests.memory: 100Gi
    limits.cpu: "40"
    limits.memory: 200Gi
```

要想查看该配置只要执行：

```bash
kubectl -n spark-cluster describe resourcequota compute-resources
```

### 配置对象数量限制

配置文件：`spark-object-counts.yaml`

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: object-counts
  namespace: spark-cluster
spec:
  hard:
    configmaps: "10"
    persistentvolumeclaims: "4"
    replicationcontrollers: "20"
    secrets: "10"
    services: "10"
    services.loadbalancers: "2"
```

### 配置CPU和内存LimitRange

配置文件：`spark-limit-range.yaml`

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: mem-limit-range
spec:
  limits:
  - default:
      memory: 50Gi
      cpu: 5
    defaultRequest:
      memory: 1Gi
      cpu: 1
    type: Container
```

- `default` 即 limit 的值
- `defaultRequest` 即 request 的值

## 参考

[资源配额](https://k8smeetup.github.io/docs/concepts/policy/resource-quotas/)

[为命名空间配置默认的内存请求与限额](https://k8smeetup.github.io/docs/tasks/administer-cluster/memory-default-namespace/)

[在命名空间中配置默认的CPU请求与限额](https://k8smeetup.github.io/docs/tasks/administer-cluster/cpu-default-namespace/)