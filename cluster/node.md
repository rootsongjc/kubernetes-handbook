---
title: Node
date: 2016-10-21 16:11:07
layout: "post"
---

# Node

## Node维护模式

```
kubectl drain NODE [Options]
```

- 它会删除该NODE上由ReplicationController, ReplicaSet, DaemonSet, StatefulSet or Job创建的Pod
- 不删除mirror pods（因为不可通过API删除mirror pods）
- 如果还有其它类型的Pod（比如不通过RC而直接通过kubectl create的Pod）并且没有--force选项，该命令会直接失败
- 如果命令中增加了--force选项，则会强制删除这些不是通过ReplicationController, Job或者DaemonSet创建的Pod

有的时候不需要evict pod，只需要标记Node不可调用，可以用`kubectl cordon`命令。

恢复的话只需要运行`kubectl uncordon NODE`将NODE重新改成可调度状态。

## Taint tolerant

// taint节点，阻止新的pod上来
kubectl taint nodes node08 dedicated=maintaining:NoSchedule
// label节点，只允许指定的pod上来
kubectl label nodes node08 hyper/nodetype=maintaining

// 然后在Pod定义中加入如下annotation：
```
annotations:
      scheduler.alpha.kubernetes.io/tolerations: '[{"key":"dedicated", "value":"maintaining"}]'
      scheduler.alpha.kubernetes.io/affinity: >
        {
          "nodeAffinity": {
            "requiredDuringSchedulingIgnoredDuringExecution": {
              "nodeSelectorTerms": [
                {
                  "matchExpressions": [
                    {
                      "key": "hyper/nodetype",
                      "operator": "In",
                      "values": ["maintaining"]
                    }
                  ]
                }
              ]
            }
          }
        }
```

