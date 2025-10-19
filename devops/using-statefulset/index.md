---
weight: 102
title: 使用 StatefulSet 部署有状态应用
linktitle: 部署有状态应用
date: 2022-05-21T00:00:00+08:00
description: 本文介绍如何使用 Kubernetes 的 StatefulSet 控制器部署有状态应用，以 ZooKeeper 和 Kafka 集群为例，详细说明 StatefulSet 的配置和使用方法。
lastmod: 2025-10-19T07:10:24.161Z
---

{{< callout warning 注意 >}}
该文章内容已过时，仅供学习参考。
{{< /callout>}}

[StatefulSet](../../controllers/statefulset) 是 Kubernetes 专门用来部署有状态应用的控制器，它为 Pod 提供稳定的身份标识，包括主机名、启动顺序、网络标识和持久化存储等特性。

本文以部署 ZooKeeper 和 Kafka 集群为例，详细介绍 StatefulSet 的使用方法。其中 Kafka 依赖于 ZooKeeper，这种依赖关系正好展示了 StatefulSet 在部署复杂有状态应用时的优势。

完整的配置文件和 Dockerfile 可以在 GitHub 仓库中找到：[zookeeper](https://github.com/rootsongjc/kubernetes-handbook/tree/master/manifests/zookeeper) 和 [kafka](https://github.com/rootsongjc/kubernetes-handbook/tree/master/manifests/kafka)。

## StatefulSet 的核心特性

在开始部署之前，让我们先了解 StatefulSet 的核心特性：

- **稳定的网络标识**：每个 Pod 都有唯一且稳定的网络标识
- **有序部署和扩缩容**：Pod 按照顺序创建、删除和扩缩容
- **稳定的持久化存储**：每个 Pod 都可以有自己的持久化存储
- **有序的滚动更新**：更新时按照顺序进行，确保服务的稳定性

## 部署 ZooKeeper 集群

### ZooKeeper 镜像准备

ZooKeeper 的 Docker 镜像包含以下核心脚本：

- **zkGenConfig.sh**：动态生成 ZooKeeper 配置文件
- **zkMetrics.sh**：获取 ZooKeeper 集群的监控指标
- **zkOk.sh**：健康检查脚本，用于就绪和存活探针

让我们查看这些脚本的功能：

**监控指标获取（zkMetrics.sh）**：

```bash
$ echo mntr | nc localhost $ZK_CLIENT_PORT
zk_version 3.4.6-1569965, built on 02/20/2014 09:09 GMT
zk_avg_latency 0
zk_max_latency 5
zk_min_latency 0
zk_packets_received 427879
zk_packets_sent 427890
zk_num_alive_connections 3
zk_outstanding_requests 0
zk_server_state leader
zk_znode_count 18
zk_watch_count 3
zk_ephemerals_count 4
zk_approximate_data_size 613
zk_open_file_descriptor_count 29
zk_max_file_descriptor_count 1048576
zk_followers 1
zk_synced_followers 1
zk_pending_syncs 0
```

**健康检查（zkOk.sh）**：

```bash
$ echo ruok | nc 127.0.0.1 $ZK_CLIENT_PORT
imok
```

### ZooKeeper StatefulSet 配置

以下是部署 3 节点 ZooKeeper 集群的完整配置：

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: zk-svc
  labels:
    app: zk
spec:
  ports:
  - port: 2888
    name: server
  - port: 3888
    name: leader-election
  clusterIP: None  # Headless Service
  selector:
    app: zk
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: zk-cm
data:
  jvm.heap: "1G"
  tick: "2000"
  init: "10"
  sync: "5"
  client.cnxns: "60"
  snap.retain: "3"
  purge.interval: "0"
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: zk-pdb
spec:
  selector:
    matchLabels:
      app: zk
  minAvailable: 2  # 确保至少 2 个实例可用
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: zk
spec:
  serviceName: zk-svc
  replicas: 3
  selector:
    matchLabels:
      app: zk
  template:
    metadata:
      labels:
        app: zk
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchExpressions:
                  - key: "app"
                    operator: In
                    values:
                    - zk
              topologyKey: "kubernetes.io/hostname"
      containers:
      - name: k8szk
        imagePullPolicy: Always
        image: zookeeper:3.6.3  # 使用官方镜像
        resources:
          requests:
            memory: "2Gi"
            cpu: "500m"
          limits:
            memory: "4Gi"
            cpu: "1"
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
          valueFrom:
            configMapKeyRef:
                name: zk-cm
                key: jvm.heap
        - name: ZK_TICK_TIME
          valueFrom:
            configMapKeyRef:
                name: zk-cm
                key: tick
        - name: ZK_INIT_LIMIT
          valueFrom:
            configMapKeyRef:
                name: zk-cm
                key: init
        - name: ZK_SYNC_LIMIT
          valueFrom:
            configMapKeyRef:
                name: zk-cm
                key: tick
        - name: ZK_MAX_CLIENT_CNXNS
          valueFrom:
            configMapKeyRef:
                name: zk-cm
                key: client.cnxns
        - name: ZK_SNAP_RETAIN_COUNT
          valueFrom:
            configMapKeyRef:
                name: zk-cm
                key: snap.retain
        - name: ZK_PURGE_INTERVAL
          valueFrom:
            configMapKeyRef:
                name: zk-cm
                key: purge.interval
        - name: ZK_CLIENT_PORT
          value: "2181"
        - name: ZK_SERVER_PORT
          value: "2888"
        - name: ZK_ELECTION_PORT
          value: "3888"
        command:
        - sh
        - -c
        - zkGenConfig.sh && zkServer.sh start-foreground
        readinessProbe:
          exec:
            command:
            - "zkOk.sh"
          initialDelaySeconds: 10
          timeoutSeconds: 5
          periodSeconds: 10
        livenessProbe:
          exec:
            command:
            - "zkOk.sh"
          initialDelaySeconds: 30
          timeoutSeconds: 5
          periodSeconds: 30
      securityContext:
        runAsUser: 1000
        fsGroup: 1000
```

### 配置说明

1. **Headless Service**：`clusterIP: None` 确保每个 Pod 都有独立的 DNS 记录
2. **PodDisruptionBudget**：确保滚动更新或节点维护时至少保持 2 个实例可用
3. **Pod 反亲和性**：确保 ZooKeeper 实例分布在不同的节点上，提高可用性
4. **资源限制**：合理设置资源请求和限制，确保性能和稳定性

## 部署 Kafka 集群

### Kafka 配置生成脚本

Kafka 依赖于 ZooKeeper，需要动态生成配置文件。`kafkaGenConfig.sh` 脚本的核心逻辑：

```bash
#!/bin/bash
HOST=`hostname -s`
if [[ $HOST =~ (.*)-([0-9]+)$ ]]; then
    NAME=${BASH_REMATCH[1]}
    ORD=${BASH_REMATCH[2]}
else
    echo "Failed to extract ordinal from hostname $HOST"
    exit 1
fi

MY_ID=$((ORD+1))
sed -i "s/broker.id=0/broker.id=$MY_ID/g" /opt/kafka/config/server.properties
sed -i 's/zookeeper.connect=localhost:2181/zookeeper.connect=zk-0.zk-svc.default.svc.cluster.local:2181,zk-1.zk-svc.default.svc.cluster.local:2181,zk-2.zk-svc.default.svc.cluster.local:2181/g' /opt/kafka/config/server.properties
```

这个脚本根据 StatefulSet 生成的 Pod 主机名中的序号设置 Broker ID，并配置 ZooKeeper 连接地址。

### Kafka StatefulSet 配置

以下是相关的配置示例：

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: kafka-svc
  labels:
    app: kafka
spec:
  ports:
  - port: 9092
    name: server
  clusterIP: None
  selector:
    app: kafka
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: kafka-pdb
spec:
  selector:
    matchLabels:
      app: kafka
  minAvailable: 2
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: kafka
spec:
  serviceName: kafka-svc
  replicas: 3
  selector:
    matchLabels:
      app: kafka
  template:
    metadata:
      labels:
        app: kafka
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchExpressions:
                  - key: "app"
                    operator: In
                    values:
                    - kafka
              topologyKey: "kubernetes.io/hostname"
        podAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
             - weight: 1
               podAffinityTerm:
                 labelSelector:
                    matchExpressions:
                      - key: "app"
                        operator: In
                        values:
                        - zk
                 topologyKey: "kubernetes.io/hostname"
      terminationGracePeriodSeconds: 300
      containers:
      - name: k8skafka
        imagePullPolicy: Always
        image: confluentinc/cp-kafka:7.0.1  # 使用 Confluent 官方镜像
        resources:
          requests:
            memory: "1Gi"
            cpu: 500m
          limits:
            memory: "2Gi"
            cpu: "1"
        ports:
        - containerPort: 9092
          name: server
        env:
        - name: KAFKA_BROKER_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: KAFKA_ZOOKEEPER_CONNECT
          value: "zk-0.zk-svc.default.svc.cluster.local:2181,zk-1.zk-svc.default.svc.cluster.local:2181,zk-2.zk-svc.default.svc.cluster.local:2181"
        - name: KAFKA_ADVERTISED_LISTENERS
          value: "PLAINTEXT://$(hostname -f):9092"
        - name: KAFKA_LISTENERS
          value: "PLAINTEXT://0.0.0.0:9092"
        - name: KAFKA_HEAP_OPTS
          value: "-Xmx1G -Xms1G"
        - name: KAFKA_LOG_RETENTION_HOURS
          value: "168"
        - name: KAFKA_LOG_SEGMENT_BYTES
          value: "1073741824"
        - name: KAFKA_LOG_RETENTION_CHECK_INTERVAL_MS
          value: "300000"
        readinessProbe:
          tcpSocket:
            port: 9092
          initialDelaySeconds: 30
          timeoutSeconds: 5
          periodSeconds: 10
        livenessProbe:
          tcpSocket:
            port: 9092
          initialDelaySeconds: 30
          timeoutSeconds: 5
          periodSeconds: 30
```

## 部署和验证

### 部署步骤

1. **部署 ZooKeeper**：

   ```bash
   kubectl apply -f zookeeper.yaml
   ```

2. **等待 ZooKeeper 就绪**：

   ```bash
   kubectl get pods -l app=zk
   ```

3. **部署 Kafka**：

   ```bash
   kubectl apply -f kafka.yaml
   ```

### 验证集群状态

**检查 ZooKeeper 集群状态**：

```bash
kubectl exec zk-0 -- zkServer.sh status
```

**检查 Kafka 集群状态**：

```bash
kubectl exec kafka-0 -- kafka-topics.sh --bootstrap-server localhost:9092 --list
```

**创建测试 Topic**：

```bash
kubectl exec kafka-0 -- kafka-topics.sh --bootstrap-server localhost:9092 --topic test-topic --create --partitions 3 --replication-factor 3
```

## 最佳实践
