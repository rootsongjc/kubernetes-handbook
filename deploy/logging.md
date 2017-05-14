---
title: Kubernetes日志
layout: "post"
---

ELK可谓是容器日志收集、处理和搜索的黄金搭档:

* Logstash（或者Fluentd）负责收集日志
* Elasticsearch存储日志并提供搜索
* Kibana负责日志查询和展示

注意：Kubernetes默认使用fluentd（以DaemonSet的方式启动）来收集日志，并将收集的日志发送给elasticsearch。

**小提示**

在使用`cluster/kube-up.sh`部署集群的时候，可以设置`KUBE_LOGGING_DESTINATION`环境变量自动部署Elasticsearch和Kibana，并使用fluentd收集日志(配置参考[addons/fluentd-elasticsearch](https://github.com/kubernetes/kubernetes/tree/master/cluster/addons/fluentd-elasticsearch))：

```
KUBE_LOGGING_DESTINATION=elasticsearch
KUBE_ENABLE_NODE_LOGGING=true
cluster/kube-up.sh
```

如果使用GCE或者GKE的话，还可以[将日志发送给Google Cloud Logging](https://kubernetes.io/docs/user-guide/logging/stackdriver/)，并可以集成Google Cloud Storage和BigQuery。

如果需要集成其他的日志方案，还可以自定义docker的log driver，将日志发送到splunk或者awslogs等。

