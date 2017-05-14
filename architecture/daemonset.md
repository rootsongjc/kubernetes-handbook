---
title: "DaemonSet"
---

DaemonSet保证在每个Node上都运行一个容器副本，常用来部署一些集群的日志、监控或者其他系统管理程序。典型的应用常见包括：

* 日志收集，比如fluentd，logstash等
* 系统监控，比如Prometheus Node Exporter，collectd，New Relic agent，Ganglia gmond等
* 系统程序，比如kube-proxy, kube-dns, glusterd, ceph等

使用Fluentd收集日志的例子：

```yaml
apiVersion: extensions/v1beta1
kind: DaemonSet
metadata:
  name: fluentd
spec:
  template:
    metadata:
      labels:
        app: logging
        id: fluentd
      name: fluentd
    spec:
      containers:
      - name: fluentd-es
        image: gcr.io/google_containers/fluentd-elasticsearch:1.3
        env:
         - name: FLUENTD_ARGS
           value: -qq
        volumeMounts:
         - name: containers
           mountPath: /var/lib/docker/containers
         - name: varlog
           mountPath: /varlog
      volumes:
         - hostPath:
             path: /var/lib/docker/containers
           name: containers
         - hostPath:
             path: /var/log
           name: varlog
```

## 指定Node节点

DaemonSet会忽略Node的unschedulable状态，有两种方式来指定Pod只运行在指定的Node节点上：

- nodeSelector：只调度到匹配指定label的Node上
- nodeAffinity：功能更丰富的Node选择器，比如支持集合操作
- podAffinity：调度到满足条件的Pod所在的Node上

nodeSelector示例：

```yaml
spec:
  nodeSelector:
    disktype: ssd
```

nodeAffinity示例：

```yaml
metadata:
  name: with-node-affinity
  annotations:
    scheduler.alpha.kubernetes.io/affinity: >
      {
        "nodeAffinity": {
          "requiredDuringSchedulingIgnoredDuringExecution": {
            "nodeSelectorTerms": [
              {
                "matchExpressions": [
                  {
                    "key": "kubernetes.io/e2e-az-name",
                    "operator": "In",
                    "values": ["e2e-az1", "e2e-az2"]
                  }
                ]
              }
            ]
          }
        }
      }
    another-annotation-key: another-annotation-value
```

podAffinity示例：

```yaml
metadata:
  name: with-pod-affinity
  annotations:
    scheduler.alpha.kubernetes.io/affinity: >
        {
          "podAffinity": {
            "requiredDuringSchedulingIgnoredDuringExecution": [
              {
                "labelSelector": {
                  "matchExpressions": [
                    {
                      "key": "security",
                      "operator": "In",
                      "values": ["S1"]
                    }
                  ]
                },
                "topologyKey": "failure-domain.beta.kubernetes.io/zone"
             }
            ]
           },
          "podAntiAffinity": {
            "requiredDuringSchedulingIgnoredDuringExecution": [
              {
                "labelSelector": {
                  "matchExpressions": [
                    {
                      "key": "security",
                      "operator": "In",
                      "values": ["S2"]
                    }
                  ]
                },
                "topologyKey": "kubernetes.io/hostname"
             }
            ]
           }
         }
spec:
  ...
```

## 静态Pod

除了DaemonSet，还可以使用静态Pod来在每台机器上运行指定的Pod，这需要kubelet在启动的时候指定manifest目录：

```
kubelet --pod-manifest-path=<the directory>
```

然后将所需要的Pod定义文件放到指定的manifest目录中即可。

注意：静态Pod不能通过API Server来删除，但可以通过删除manifest文件来自动删除对应的Pod。

