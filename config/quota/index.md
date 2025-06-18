---
weight: 77
title: 管理 Namespace 中的资源配额
date: '2022-05-21T00:00:00+08:00'
type: book
description: 本文介绍了如何在 Kubernetes 集群中通过 ResourceQuota 和 LimitRange 来管理 namespace 的资源配额，包括计算资源、存储资源和对象数量的限制配置。
keywords:
- kubernetes
- limit
- limitrange
- namespace
- spark
- yaml
- qos
- 资源
- 配置文件
- 配额
- 默认
---

当多个团队或用户共享同一个 Kubernetes 集群时，资源竞争问题不可避免。为了确保资源的合理分配和使用，需要对不同团队或用户的资源使用配额进行限制。

## 资源配额控制策略

Kubernetes 提供了两种主要的资源分配管理控制策略：

### ResourceQuota

用于限制 namespace 中所有 Pod 占用的总资源 request 和 limit，包括：

- **计算资源配额**：CPU、内存等
- **存储资源配额**：持久化卷声明等
- **对象数量配额**：Pod、Service、ConfigMap 等 Kubernetes 对象的数量

### LimitRange

用于设置 namespace 中 Pod 的默认资源 request 和 limit 值，以及单个资源对象的使用范围限制。

## 启用资源配额功能

在现代 Kubernetes 集群中，ResourceQuota 和 LimitRange 准入控制器通常默认启用。如果需要手动启用，可以在 API Server 的启动参数中添加：

```bash
--enable-admission-plugins=ResourceQuota,LimitRange
```

## 实战示例

以下示例展示如何为 `spark-cluster` namespace 配置资源配额和限制。

### 计算资源配额配置

创建 `spark-compute-resources.yaml`：

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-resources
  namespace: spark-cluster
spec:
  hard:
    pods: "20"                    # 最多创建 20 个 Pod
    requests.cpu: "20"            # CPU 请求总量不超过 20 核
    requests.memory: 100Gi        # 内存请求总量不超过 100Gi
    limits.cpu: "40"              # CPU 限制总量不超过 40 核
    limits.memory: 200Gi          # 内存限制总量不超过 200Gi
```

应用配置：

```bash
kubectl apply -f spark-compute-resources.yaml
```

查看资源配额状态：

```bash
kubectl -n spark-cluster describe resourcequota compute-resources
```

### 对象数量限制配置

创建 `spark-object-counts.yaml`：

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: object-counts
  namespace: spark-cluster
spec:
  hard:
    configmaps: "10"                    # 最多 10 个 ConfigMap
    persistentvolumeclaims: "4"         # 最多 4 个 PVC
    replicationcontrollers: "20"        # 最多 20 个 RC
    secrets: "10"                       # 最多 10 个 Secret
    services: "10"                      # 最多 10 个 Service
    services.loadbalancers: "2"         # 最多 2 个 LoadBalancer 类型的 Service
```

### LimitRange 配置

创建 `spark-limit-range.yaml`：

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: mem-limit-range
  namespace: spark-cluster
spec:
  limits:
  - default:          # 默认限制值（Pod 中容器的 limit）
      memory: 50Gi
      cpu: 5
    defaultRequest:   # 默认请求值（Pod 中容器的 request）
      memory: 1Gi
      cpu: 1
    type: Container
```

应用所有配置：

```bash
kubectl apply -f spark-object-counts.yaml
kubectl apply -f spark-limit-range.yaml
```

## 验证配置效果

查看 namespace 的资源配额使用情况：

```bash
# 查看所有资源配额
kubectl -n spark-cluster get resourcequota

# 查看 LimitRange
kubectl -n spark-cluster get limitrange

# 详细信息
kubectl -n spark-cluster describe namespace spark-cluster
```

## 最佳实践

1. **合理规划资源配额**：根据团队实际需求和集群总容量合理分配
2. **设置合适的默认值**：通过 LimitRange 为容器设置合理的默认 request 和 limit
3. **监控资源使用**：定期检查资源配额使用情况，及时调整
4. **逐步实施**：在生产环境中逐步引入资源限制，避免影响现有工作负载

## 参考资料

- [资源配额 - Kubernetes 官方文档](https://kubernetes.io/zh-cn/docs/concepts/policy/resource-quotas/)
- [限制范围 - Kubernetes 官方文档](https://kubernetes.io/zh-cn/docs/concepts/policy/limit-range/)
- [为命名空间配置默认的内存请求与限额](https://kubernetes.io/zh-cn/docs/tasks/administer-cluster/manage-resources/memory-default-namespace/)
- [在命名空间中配置默认的 CPU 请求与限额](https://kubernetes.io/zh-cn/docs/tasks/administer-cluster/manage-resources/cpu-default-namespace/)
