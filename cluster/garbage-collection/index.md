---
weight: 27
title: 垃圾收集
date: '2022-05-21T00:00:00+08:00'
type: book
description: 深入了解 Kubernetes 垃圾收集机制，包括 Owner 和 Dependent 对象关系、级联删除策略（Background、Foreground、Orphan）以及实际操作示例和最佳实践。
keywords:
- dependent
- kubernetes
- owner
- ownerreference
- pod
- replicaset
- 删除
- 对象
- 级联
- 设置
---

Kubernetes 垃圾收集器（Garbage Collector）是集群中的重要组件，负责清理失去所有者关系的孤儿对象。掌握垃圾收集机制对于高效管理 Kubernetes 资源、避免资源泄漏至关重要。

## Owner 和 Dependent 对象关系

### 核心概念

在 Kubernetes 中，对象之间存在所有权关系：

- **Owner 对象**：拥有其他对象的资源
- **Dependent 对象**：被其他对象拥有的资源

常见的所有权关系包括：

| Owner 对象 | Dependent 对象 |
|------------|----------------|
| Deployment | ReplicaSet |
| ReplicaSet | Pod |
| Service | Endpoints |
| Job | Pod |
| StatefulSet | Pod |

每个 Dependent 对象都有一个 `metadata.ownerReferences` 字段，指向其 Owner 对象。

### ownerReference 字段结构

`ownerReference` 字段用于描述当前对象与其所有者（Owner）之间的关系。通过设置 `ownerReference`，Kubernetes 能够自动识别对象的归属关系，并在 Owner 被删除时，根据级联删除策略自动处理 Dependent 对象。这一机制极大地方便了资源的自动化管理和清理，避免了资源孤儿化和集群资源泄漏的问题。

常见场景包括 ReplicaSet 管理的 Pod、Deployment 管理的 ReplicaSet 等。理解和正确使用 `ownerReference`，是掌握 Kubernetes 资源生命周期管理的关键。

```yaml
ownerReferences:
- apiVersion: apps/v1
  kind: ReplicaSet
  name: my-repset
  uid: d9607e19-f88f-11e6-a518-42010a800195
  controller: true
  blockOwnerDeletion: true
```

字段说明：

- `apiVersion`：Owner 对象的 API 版本
- `kind`：Owner 对象的类型
- `name`：Owner 对象的名称
- `uid`：Owner 对象的唯一标识符
- `controller`：是否为控制器管理的对象
- `blockOwnerDeletion`：是否阻止 Owner 对象删除

### 自动设置 ownerReference

Kubernetes 在以下场景自动设置 `ownerReference`：

1. **控制器管理的对象**
   - ReplicationController、ReplicaSet、Deployment
   - StatefulSet、DaemonSet
   - Job、CronJob

2. **服务发现相关**
   - Service 创建的 Endpoints
   - Ingress 相关的资源

3. **存储相关**
   - PersistentVolumeClaim 和 PersistentVolume 的关系

### 实践示例

创建一个 ReplicaSet 来观察 ownerReference 的设置：

```yaml
# my-repset.yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: my-repset
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gc-demo
  template:
    metadata:
      labels:
        app: gc-demo
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
```

部署并查看 ownerReference：

```bash
# 创建 ReplicaSet
kubectl apply -f my-repset.yaml

# 查看 Pod 的 ownerReference
kubectl get pods -l app=gc-demo -o yaml | grep -A 8 ownerReferences

# 查看详细信息
kubectl describe pod <pod-name>
```

## 级联删除策略

删除 Owner 对象时，可以通过不同的级联删除策略控制 Dependent 对象的处理方式。

### Background 级联删除

**默认策略**，适用于大多数场景。

- **执行流程**：
  1. 立即删除 Owner 对象
  2. 垃圾收集器在后台异步删除 Dependent 对象
  3. Owner 对象从 API 服务器中立即移除

- **优势**：删除速度快，不阻塞操作
- **适用场景**：日常资源清理、快速释放资源

### Foreground 级联删除

**顺序删除**，确保完全清理。

- **执行流程**：
  1. Owner 对象进入"删除中"状态
  2. 设置 `deletionTimestamp` 字段
  3. 添加 `foregroundDeletion` finalizer
  4. 等待所有 Dependent 对象删除完成
  5. 最后删除 Owner 对象

- **特点**：
  - Owner 对象在删除过程中仍可通过 API 访问
  - 确保子资源完全清理
  - 删除时间较长

- **适用场景**：需要确保完全清理的关键资源

### Orphan 策略

**孤儿模式**，保留子资源。

- **执行流程**：
  1. 删除 Owner 对象
  2. 清空 Dependent 对象的 `ownerReferences` 字段
  3. Dependent 对象成为孤儿，继续存在

- **适用场景**：
  - 需要保留子资源的场景
  - 资源迁移和重构
  - 手动管理子资源

## 删除策略实际操作

### 使用 kubectl 命令

以下是具体的使用方法：

```bash
# 默认级联删除（Background 模式）
kubectl delete replicaset my-repset

# 显式指定 Background 模式
kubectl delete replicaset my-repset --cascade=background

# Foreground 模式
kubectl delete replicaset my-repset --cascade=foreground

# Orphan 模式
kubectl delete replicaset my-repset --cascade=orphan
```

### 使用 YAML 文件控制

以下是具体的使用方法：

```yaml
# delete-options.yaml
apiVersion: v1
kind: DeleteOptions
propagationPolicy: Foreground
```

```bash
kubectl delete -f my-repset.yaml --delete-options=./delete-options.yaml
```

### 使用 API 直接控制

以下是具体的使用方法：

```bash
# 启动代理
kubectl proxy --port=8080 &

# Background 删除
curl -X DELETE localhost:8080/apis/apps/v1/namespaces/default/replicasets/my-repset \
  -d '{"kind":"DeleteOptions","apiVersion":"v1","propagationPolicy":"Background"}' \
  -H "Content-Type: application/json"

# Foreground 删除
curl -X DELETE localhost:8080/apis/apps/v1/namespaces/default/replicasets/my-repset \
  -d '{"kind":"DeleteOptions","apiVersion":"v1","propagationPolicy":"Foreground"}' \
  -H "Content-Type: application/json"

# Orphan 删除
curl -X DELETE localhost:8080/apis/apps/v1/namespaces/default/replicasets/my-repset \
  -d '{"kind":"DeleteOptions","apiVersion":"v1","propagationPolicy":"Orphan"}' \
  -H "Content-Type: application/json"
```

## 高级特性

### blockOwnerDeletion 机制

`blockOwnerDeletion` 字段控制是否阻止 Owner 对象的删除：

```yaml
ownerReferences:
- apiVersion: apps/v1
  kind: ReplicaSet
  name: my-repset
  uid: d9607e19-f88f-11e6-a518-42010a800195
  controller: true
  blockOwnerDeletion: true  # 阻止 Owner 删除
```

- **生效条件**：仅在 Foreground 删除模式下生效
- **自动设置**：Kubernetes 自动为控制器管理的对象设置
- **权限控制**：需要相应的 RBAC 权限

### Finalizers 与垃圾收集

Finalizers 是防止对象被删除的机制：

```yaml
metadata:
  finalizers:
  - kubernetes.io/pv-protection
  - custom-finalizer
```

查看和管理 finalizers：

```bash
# 查看对象的 finalizers
kubectl get pv <pv-name> -o yaml | grep -A 5 finalizers

# 移除 finalizer（谨慎操作）
kubectl patch pv <pv-name> -p '{"metadata":{"finalizers":null}}'
```

## 最佳实践

### 选择合适的删除策略

1. **日常运维**：使用 Background 删除（默认）
2. **生产环境清理**：使用 Foreground 删除确保完全清理
3. **资源迁移**：使用 Orphan 删除保留子资源
4. **紧急情况**：使用 Background 删除快速释放资源

### 监控和观察

以下是相关的代码示例：

```bash
# 监控垃圾收集器状态
kubectl get events --field-selector reason=SuccessfulDelete

# 查看孤儿对象
kubectl get pods --all-namespaces -o custom-columns=NAME:.metadata.name,NAMESPACE:.metadata.namespace,OWNER:.metadata.ownerReferences[0].name

# 检查长时间未删除的对象
kubectl get all --show-labels | grep deletionTimestamp
```

### 权限配置

确保垃圾收集器有足够权限：

```yaml
# gc-rbac.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: system:gc-controller
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["list", "watch", "delete"]
```

### 性能优化

1. **批量删除**：使用标签选择器批量删除相关对象
2. **定期清理**：定期清理孤儿对象和无用资源
3. **监控指标**：监控垃圾收集器的性能指标

## 故障排查

### 常见问题及解决方案

1. **对象无法删除**

   ```bash
   # 检查 finalizers
   kubectl get <resource> <name> -o yaml | grep -A 5 finalizers
   
   # 检查 blockOwnerDeletion
   kubectl get <resource> <name> -o yaml | grep -A 10 ownerReferences
   ```

2. **删除时间过长**

   ```bash
   # 查看删除进度
   kubectl get events --field-selector involvedObject.name=<name>
   
   # 检查 Dependent 对象状态
   kubectl get all -l <label-selector>
   ```

3. **孤儿对象累积**

   ```bash
   # 查找孤儿对象
   kubectl get pods -o json | jq '.items[] | select(.metadata.ownerReferences == null)'
   
   # 清理孤儿对象
   kubectl delete pods -l <label-selector> --cascade=orphan
   ```

### 调试工具

以下是相关的代码示例：

```bash
# 查看垃圾收集器日志
kubectl logs -n kube-system kube-controller-manager-<node-name> | grep garbage

# 查看对象删除历史
kubectl get events --sort-by='.lastTimestamp' | grep Delete

# 检查对象依赖关系
kubectl get <resource> <name> -o yaml | yq '.metadata.ownerReferences'
```

通过理解和正确使用 Kubernetes 垃圾收集机制，可以有效管理集群资源，避免资源泄漏，确保集群的稳定运行。
