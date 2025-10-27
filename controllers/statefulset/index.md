---
weight: 30
title: StatefulSet
date: 2022-05-21T00:00:00+08:00
description: StatefulSet 是 Kubernetes 中用于管理有状态应用的控制器，提供稳定的网络标识、持久化存储和有序部署等特性，适用于数据库、消息队列等需要状态保持的应用场景。
lastmod: 2025-10-27T16:13:40.867Z
---

> StatefulSet 控制器为 Kubernetes 有状态应用提供了稳定标识、持久存储和有序部署，是数据库、消息队列等关键服务高可用的基础保障。

StatefulSet 是 Kubernetes 中专门用于管理有状态应用的控制器。与 Deployment 和 ReplicaSet 为无状态服务设计不同，StatefulSet 为 Pod 提供唯一标识，并保证部署和扩缩容的有序性。

## 应用场景

StatefulSet 主要解决有状态服务的问题，其典型应用场景包括：

- **稳定的持久化存储**：Pod 重新调度后仍能访问相同的持久化数据，基于 PVC 实现
- **稳定的网络标识**：Pod 重新调度后 PodName 和 HostName 保持不变，基于 Headless Service 实现
- **有序部署和扩展**：Pod 按照定义的顺序依次部署（从 0 到 N-1），下一个 Pod 运行前所有之前的 Pod 必须处于 Running 和 Ready 状态
- **有序收缩和删除**：按照从 N-1 到 0 的顺序进行
- **有序滚动更新**：支持分段更新和金丝雀发布

## 核心组件

StatefulSet 由以下几个关键部分组成：

- **Headless Service**：用于定义网络标识的 DNS 域
- **volumeClaimTemplates**：用于创建 PersistentVolumes 的模板
- **StatefulSet 规约**：定义具体应用的配置

## DNS 命名规则

StatefulSet 中每个 Pod 的 DNS 格式如下，便于集群内服务发现和通信：

```text
<statefulSetName>-<ordinal>.<serviceName>.<namespace>.svc.cluster.local
```

其中：

- `statefulSetName`：StatefulSet 的名称
- `ordinal`：Pod 的序号（从 0 开始）
- `serviceName`：Headless Service 的名称
- `namespace`：所在的命名空间
- `cluster.local`：集群域名

## 适用条件

StatefulSet 适用于具有以下一个或多个需求的应用：

- 稳定且唯一的网络标识
- 稳定的持久化存储
- 有序的部署和扩缩容
- 有序的删除和终止
- 有序的自动滚动更新

如果应用不需要稳定的标识符或有序部署，建议使用 Deployment 或 ReplicaSet。

## 使用限制

- 给定 Pod 的存储必须由 PersistentVolume Provisioner 根据 storage class 配置，或由管理员预先配置
- 删除或缩容 StatefulSet 不会删除相关联的存储卷，需要手动清理
- StatefulSet 需要 Headless Service 来管理 Pod 的网络身份
- 不建议将 `pod.Spec.TerminationGracePeriodSeconds` 设置为 0，这样做不安全

## 基础示例

以下 YAML 示例展示了一个典型的 nginx StatefulSet 配置方式：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  ports:
  - port: 80
    name: web
  clusterIP: None
  selector:
    app: nginx
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: web
spec:
  serviceName: "nginx"
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      terminationGracePeriodSeconds: 10
      containers:
      - name: nginx
        image: nginx:1.20
        ports:
        - containerPort: 80
          name: web
        volumeMounts:
        - name: www
          mountPath: /usr/share/nginx/html
  volumeClaimTemplates:
  - metadata:
      name: www
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: "fast-ssd"
      resources:
        requests:
          storage: 1Gi
```

## Pod 身份管理

StatefulSet 通过序数和 DNS 规则为每个 Pod 提供唯一身份，便于服务发现和数据隔离。

### 序数标识

对于有 N 个副本的 StatefulSet，每个副本都有一个唯一的整数序数，范围在 [0,N) 之间。

### 稳定的网络标识

每个 Pod 的主机名遵循 `$(statefulset 名称)-$(序数)` 的模式。上述示例将创建名为 `web-0`、`web-1`、`web-2` 的 Pod。

DNS 解析示例：

{{< table title="StatefulSet Pod DNS 解析示例" >}}

| 集群域 | Service | StatefulSet | Pod DNS | Pod 主机名 |
|--------|---------|-------------|---------|-----------|
| cluster.local | default/nginx | default/web | web-{0..N-1}.nginx.default.svc.cluster.local | web-{0..N-1} |

{{< /table >}}

### 稳定存储

Kubernetes 会为每个 VolumeClaimTemplate 创建 PersistentVolume。Pod 重新调度时，volumeMounts 会挂载对应的 PersistentVolume。需要注意的是，删除 Pod 或 StatefulSet 时，PersistentVolume 不会被自动删除。

## 部署和扩缩容保证

StatefulSet 在部署和扩缩容过程中，严格保证 Pod 的有序性和依赖关系。

- **有序创建**：Pod 按 {0..N-1} 顺序创建和部署
- **有序删除**：Pod 按 {N-1..0} 逆序终止
- **扩容前提**：执行扩容前，所有前序 Pod 必须处于 Running 和 Ready 状态
- **缩容前提**：终止 Pod 前，所有后续 Pod 必须完全关闭

## Pod 管理策略

StatefulSet 支持两种 Pod 管理策略，适应不同业务场景。

### OrderedReady（默认）

按序启动和终止 Pod，确保前一个 Pod 就绪后再启动下一个。

### Parallel

并行启动和终止所有 Pod，不等待其他 Pod 状态。

```yaml
spec:
  podManagementPolicy: "Parallel"
```

## 更新策略

StatefulSet 支持多种更新策略，满足不同的升级需求。

### OnDelete

手动删除 Pod 后才会重新创建新版本的 Pod。

```yaml
spec:
  updateStrategy:
    type: OnDelete
```

### RollingUpdate（推荐）

自动滚动更新，按序数从大到小更新 Pod。

```yaml
spec:
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: 0
```

#### 分区更新

通过设置 `partition` 参数可以实现分段更新：

```yaml
spec:
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: 2  # 只更新序数 >= 2 的 Pod
```

## 实际操作示例

以下命令展示了 StatefulSet 的常用运维操作。

### 部署 StatefulSet

```bash
# 创建 StatefulSet
kubectl apply -f web.yaml

# 查看 Service 和 StatefulSet
kubectl get service nginx
kubectl get statefulset web

# 查看自动创建的 PVC
kubectl get pvc

# 查看 Pod 状态
kubectl get pods -l app=nginx
```

### 基本运维操作

```bash
# 扩容到 5 个副本
kubectl scale statefulset web --replicas=5

# 缩容到 3 个副本
kubectl patch statefulset web -p '{"spec":{"replicas":3}}'

# 更新镜像
kubectl patch statefulset web --type='json' \
  -p='[{"op": "replace", "path": "/spec/template/spec/containers/0/image", "value":"nginx:1.21"}]'

# 删除 StatefulSet（保留 PVC）
kubectl delete statefulset web

# 删除 Service
kubectl delete service nginx

# 清理 PVC（可选）
kubectl delete pvc www-web-0 www-web-1 www-web-2
```

### DNS 验证

```bash
# 创建测试 Pod 验证 DNS 解析
kubectl run dns-test --image=busybox:1.28 --rm -it --restart=Never -- nslookup web-0.nginx.default.svc.cluster.local
```

## 高级示例：ZooKeeper 集群

以下 YAML 示例展示了生产级 ZooKeeper StatefulSet 的配置方式：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: zk-headless
  labels:
    app: zookeeper
spec:
  ports:
  - port: 2888
    name: server
  - port: 3888
    name: leader-election
  clusterIP: None
  selector:
    app: zookeeper
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: zk
spec:
  serviceName: zk-headless
  replicas: 3
  selector:
    matchLabels:
      app: zookeeper
  template:
    metadata:
      labels:
        app: zookeeper
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - zookeeper
            topologyKey: kubernetes.io/hostname
      containers:
      - name: zookeeper
        image: zookeeper:3.7
        ports:
        - containerPort: 2181
          name: client
        - containerPort: 2888
          name: server
        - containerPort: 3888
          name: leader-election
        env:
        - name: ZK_REPLICAS
          value: "3"
        - name: ZK_HEAP_SIZE
          value: "1G"
        - name: ZK_CLIENT_PORT
          value: "2181"
        - name: ZK_SERVER_PORT
          value: "2888"
        - name: ZK_ELECTION_PORT
          value: "3888"
        readinessProbe:
          exec:
            command:
            - sh
            - -c
            - "echo ruok | nc localhost 2181 | grep imok"
          initialDelaySeconds: 10
          timeoutSeconds: 5
        livenessProbe:
          exec:
            command:
            - sh
            - -c
            - "echo ruok | nc localhost 2181 | grep imok"
          initialDelaySeconds: 10
          timeoutSeconds: 5
        volumeMounts:
        - name: datadir
          mountPath: /data
      securityContext:
        runAsUser: 1000
        fsGroup: 1000
  volumeClaimTemplates:
  - metadata:
      name: datadir
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: "fast-ssd"
      resources:
        requests:
          storage: 10Gi
```

## 外部访问

对于需要从集群外部访问 StatefulSet 中特定 Pod 的场景，可以通过以下方式实现。

### 方法一：NodePort Service

```bash
# 为特定 Pod 添加标签
kubectl label pod zk-0 instance=zk-0
kubectl label pod zk-1 instance=zk-1

# 暴露为 NodePort 服务
kubectl expose pod zk-0 --port=2181 --target-port=2181 \
  --name=zk-0-external --selector=instance=zk-0 --type=NodePort

kubectl expose pod zk-1 --port=2181 --target-port=2181 \
  --name=zk-1-external --selector=instance=zk-1 --type=NodePort
```

### 方法二：LoadBalancer Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: zk-0-lb
spec:
  type: LoadBalancer
  ports:
  - port: 2181
    targetPort: 2181
  selector:
    statefulset.kubernetes.io/pod-name: zk-0
```

## 最佳实践

在生产环境中，建议遵循以下最佳实践以提升有状态服务的可靠性和可维护性。

- **资源配置**：合理设置 CPU 和内存资源限制
- **存储选择**：根据性能需求选择合适的 StorageClass
- **健康检查**：配置适当的 readiness 和 liveness 探针
- **反亲和性**：使用 Pod 反亲和性确保高可用性
- **监控告警**：配置完善的监控和告警机制
- **备份策略**：制定数据备份和恢复策略

## 故障排查

常见问题及解决方案如下：

- **Pod 启动失败**：检查存储配置和资源限制
- **DNS 解析问题**：验证 Headless Service 配置
- **数据丢失**：确认 PVC 配置和存储类设置
- **更新卡住**：检查 Pod 反亲和性和资源可用性

## 总结

StatefulSet 是 Kubernetes 管理有状态应用的核心控制器，提供稳定标识、持久存储和有序部署等能力。通过合理配置 Headless Service、PVC、Pod 管理策略和更新策略，可以高效支撑数据库、消息队列等关键业务场景。建议结合最佳实践和监控体系，持续优化有状态服务的高可用性和可维护性。

## 参考文献

- [Kubernetes 官方文档 - StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
- [有状态应用部署教程 - kubernetes.io](https://kubernetes.io/docs/tutorials/stateful-application/)
