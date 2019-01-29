# 使用StatefulSet部署有状态应用

[StatefulSet](../concepts/statefulset.md) 这个对象是专门用来部署用状态应用的，可以为Pod提供稳定的身份标识，包括hostname、启动顺序、DNS名称等。

下面以在kubernetes1.6版本中部署zookeeper和kafka为例讲解StatefulSet的使用，其中kafka依赖于zookeeper。

Dockerfile和配置文件见 [zookeeper](https://github.com/rootsongjc/kubernetes-handbook/tree/master/manifests/zookeeper) 和 [kafka](https://github.com/rootsongjc/kubernetes-handbook/tree/master/manifests/kafka)。

**注：**所有的镜像基于CentOS系统的JDK制作，为我的私人镜像，外部无法访问，yaml中没有配置持久化存储。

## 部署Zookeeper

Dockerfile中从远程获取zookeeper的安装文件，然后在定义了三个脚本：

- zkGenConfig.sh：生成zookeeper配置文件
- zkMetrics.sh：获取zookeeper的metrics
- zkOk.sh：用来做ReadinessProb

我们在来看下这三个脚本的执行结果：

zkGenConfig.sh

zkMetrics.sh脚本实际上执行的是下面的命令：

```bash
$ echo mntr | nc localhost $ZK_CLIENT_PORT >& 1
zk_version	3.4.6-1569965, built on 02/20/2014 09:09 GMT
zk_avg_latency	0
zk_max_latency	5
zk_min_latency	0
zk_packets_received	427879
zk_packets_sent	427890
zk_num_alive_connections	3
zk_outstanding_requests	0
zk_server_state	leader
zk_znode_count	18
zk_watch_count	3
zk_ephemerals_count	4
zk_approximate_data_size	613
zk_open_file_descriptor_count	29
zk_max_file_descriptor_count	1048576
zk_followers	1
zk_synced_followers	1
zk_pending_syncs	0
```

zkOk.sh脚本实际上执行的是下面的命令：

```bash
$ echo ruok | nc 127.0.0.1 $ZK_CLIENT_PORT
imok
```

**zookeeper.yaml**

下面是启动三个zookeeper实例的yaml配置文件：

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: zk-svc
  labels:
    app: zk-svc
spec:
  ports:
  - port: 2888
    name: server
  - port: 3888
    name: leader-election
  clusterIP: None
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
apiVersion: policy/v1beta1
kind: PodDisruptionBudget
metadata:
  name: zk-pdb
spec:
  selector:
    matchLabels:
      app: zk
  minAvailable: 2
---
apiVersion: apps/v1beta1
kind: StatefulSet
metadata:
  name: zk
spec:
  serviceName: zk-svc
  replicas: 3
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
        image: harbor-001.jimmysong.io/library/zookeeper:3.4.6
        resources:
          requests:
            memory: "2Gi"
            cpu: "500m"
        ports:
        - containerPort: 2181
          name: client
        - containerPort: 2888
          name: server
        - containerPort: 3888
          name: leader-election
        env:
        - name : ZK_REPLICAS
          value: "3"
        - name : ZK_HEAP_SIZE
          valueFrom:
            configMapKeyRef:
                name: zk-cm
                key: jvm.heap
        - name : ZK_TICK_TIME
          valueFrom:
            configMapKeyRef:
                name: zk-cm
                key: tick
        - name : ZK_INIT_LIMIT
          valueFrom:
            configMapKeyRef:
                name: zk-cm
                key: init
        - name : ZK_SYNC_LIMIT
          valueFrom:
            configMapKeyRef:
                name: zk-cm
                key: tick
        - name : ZK_MAX_CLIENT_CNXNS
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
        livenessProbe:
          exec:
            command:
            - "zkOk.sh"
          initialDelaySeconds: 10
          timeoutSeconds: 5
      securityContext:
        runAsUser: 1000
        fsGroup: 1000
```

我们再主要下上面那三个脚本的用途。

## 部署kafka

Kafka的docker镜像制作跟zookeeper类似，都是从远程下载安装包后，解压安装。

与zookeeper不同的是，只要一个脚本，但是又依赖于我们上一步安装的zookeeper，kafkaGenConfig.sh用来生成kafka的配置文件。

我们来看下这个脚本。

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
sed -i s"/broker.id=0/broker.id=$MY_ID/g" /opt/kafka/config/server.properties
sed -i s'/zookeeper.connect=localhost:2181/zookeeper.connect=zk-0.zk-svc.brand.svc:2181,zk-1.zk-svc.brand.svc:2181,zk-2.zk-svc.brand.svc:2181/g' /opt/kafka/config/server.properties
```

该脚本根据statefulset生成的pod的hostname的后半截数字部分作为broker ID，同时再替换zookeeper的地址。

**Kafka.yaml**

下面是创建3个kafka实例的yaml配置。

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
  - port: 9093
    name: server
  clusterIP: None
  selector:
    app: kafka
---
apiVersion: policy/v1beta1
kind: PodDisruptionBudget
metadata:
  name: kafka-pdb
spec:
  selector:
    matchLabels:
      app: kafka
  minAvailable: 2
---
apiVersion: apps/v1beta1
kind: StatefulSet
metadata:
  name: kafka
spec:
  serviceName: kafka-svc
  replicas: 3
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
        image: harbor-001.jimmysong.io/library/kafka:2.10-0.8.2.1
        resources:
          requests:
            memory: "1Gi"
            cpu: 500m
        env:
        - name: KF_REPLICAS
          value: "3"
        ports:
        - containerPort: 9093
          name: server
        command:
        - /bin/bash
        - -c
        - "/opt/kafka/bin/kafkaGenConfig.sh && /opt/kafka/bin/kafka-server-start.sh /opt/kafka/config/server.properties"
        env:
        - name: KAFKA_HEAP_OPTS
          value : "-Xmx512M -Xms512M"
        - name: KAFKA_OPTS
          value: "-Dlogging.level=DEBUG"
        readinessProbe:
           tcpSocket:
             port: 9092
           initialDelaySeconds: 15
           timeoutSeconds: 1
```

## 参考

- https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/
- [kubernetes contrib - statefulsets](https://github.com/kubernetes/contrib/tree/master/statefulsets)