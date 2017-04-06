+++
date = "2017-04-06T14:30:24+08:00"
title = "使用Fluentd和ElasticSearch收集Kubernetes集群日志"
draft = false
Tags = ["kubernetes","cloud computing","fluentd","elasticsearch","logging"]

+++

![古北水镇](http://olz1di9xf.bkt.clouddn.com/20160430080.jpg)

*（题图：码头@古北水镇 Apr 30,2016）*

## 前言

在[安装好了Kubernetes集群](http://rootsongjc.github.io/blogs/kubernetes-installation-on-centos/)、[配置好了flannel网络](http://rootsongjc.github.io/blogs/kubernetes-network-config/)、[安装了Kubernetes Dashboard](http://rootsongjc.github.io/blogs/kubernetes-dashboard-installation/)和[配置Heapster监控插件](http://rootsongjc.github.io/blogs/kubernetes-heapster-installation/)后，还有一项重要的工作，为了调试和故障排查，还需要进行日志收集工作。

**官方文档**

[Kubernetes Logging and Monitoring Cluster Activity](https://kubernetes.io/docs/concepts/cluster-administration/logging/)

[Logging Using Elasticsearch and Kibana](https://kubernetes.io/docs/tasks/debug-application-cluster/logging-elasticsearch-kibana/)：不过这篇文章是在GCE上配置的，参考价值不大。

## 容器日志的存在形式

目前容器日志有两种输出形式：

1. stdout,stderr标准输出

   这种形式的日志输出我们可以直接使用`docker logs`查看日志，kubernetes集群中同样可以使用`kubectl logs`类似的形式查看日志。

2. 日志文件记录

   这种日志输出我们无法从以上方法查看日志内容，只能`tail`日志文件查看。

## Fluentd介绍

[Fluentd](https://github.com/fluent/fluentd)是使用Ruby编写的，通过在后端系统之间提供**统一的日志记录层**来从后端系统中解耦数据源。
此层允许开发人员和数据分析人员在生成日志时使用多种类型的日志。
统一的日志记录层可以让您和您的组织更好地使用数据，并更快地在您的软件上进行迭代。
也就是说fluentd是一个面向多种数据来源以及面向多种数据出口的日志收集器。另外它附带了日志转发的功能。

![arch](https://camo.githubusercontent.com/c4abfe337c0b54b36f81bce78481f8965acbc7a9/687474703a2f2f646f63732e666c75656e74642e6f72672f696d616765732f666c75656e74642d6172636869746563747572652e706e67)

Fluentd收集的**event**由以下几个方面组成：

- **Tag**：字符串，中间用点隔开，如myapp.access
- **Time**：UNIX时间格式
- **Record**：JSON格式

### Fluentd特点

1. 部署简单灵活
2. 开源
3. 经过验证的可靠性和性能
4. 社区支持，插件较多
5. 使用json格式事件格式
6. 可拔插的架构设计
7. 低资源要求
8. 内置高可靠性

## 安装

查看`cluster/addons/fluentd-elasticsearch`插件目录，获取到需要用到的docker镜像名称。

```
$grep -rn "gcr.io" *.yaml
es-controller.yaml:24:      - image: gcr.io/google_containers/elasticsearch:v2.4.1-2
fluentd-es-ds.yaml:26:        image: gcr.io/google_containers/fluentd-elasticsearch:1.22
kibana-controller.yaml:22:        image: gcr.io/google_containers/kibana:v4.6.1-1
```

**需要用到的镜像**

- gcr.io/google_containers/kibana:v4.6.1-1
- gcr.io/google_containers/elasticsearch:v2.4.1-2
- gcr.io/google_containers/fluentd-elasticsearch:1.22

因为这些镜像在墙外，所以我特意备份了一份在本地还有时速云上。

**测试环境镜像名称**

- sz-pg-oam-docker-hub-001.tendcloud.com/library/elasticsearch:v2.4.1-2
- sz-pg-oam-docker-hub-001.tendcloud.com/library/kibana:v4.6.1-1
- sz-pg-oam-docker-hub-001.tendcloud.com/library/fluentd-elasticsearch:1.22

**备份到时速云上的镜像名称**

- index.tenxcloud.com/jimmy/elasticsearch:v2.4.1-2
- index.tenxcloud.com/jimmy/kibana:v4.6.1-1
- index.tenxcloud.com/jimmy/fluentd-elasticsearch:1.22

修改上面的那三个yaml文件，将其中的镜像名称改成我们测试环境中的。

### 启动集群

使用刚修改好yaml文件的那个目录启动fluentd-elasticsearch。

```
$kubectl create -f flucentd-elasticsearch
$kubectl get -f fluentd-elasticsearch/
NAME                          DESIRED   CURRENT   READY     AGE
rc/elasticsearch-logging-v1   2         2         2         13m

NAME                        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
svc/elasticsearch-logging   10.254.107.114   <none>        9200/TCP   13m

NAME                  DESIRED   CURRENT   READY     UP-TO-DATE   AVAILABLE   NODE-SELECTOR                              AGE
ds/fluentd-es-v1.22   0         0         0         0            0           beta.kubernetes.io/fluentd-ds-ready=true   13m

NAME                    DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deploy/kibana-logging   1         1         1            1           13m

NAME                 CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
svc/kibana-logging   10.254.104.215   <none>        5601/TCP   13m

$kubectl cluster-info
Kubernetes master is running at http://sz-pg-oam-docker-test-001:8080
Elasticsearch is running at http://sz-pg-oam-docker-test-001:8080/api/v1/proxy/namespaces/kube-system/services/elasticsearch-logging
Heapster is running at http://sz-pg-oam-docker-test-001:8080/api/v1/proxy/namespaces/kube-system/services/heapster
Kibana is running at http://sz-pg-oam-docker-test-001:8080/api/v1/proxy/namespaces/kube-system/services/kibana-logging
monitoring-grafana is running at http://sz-pg-oam-docker-test-001:8080/api/v1/proxy/namespaces/kube-system/services/monitoring-grafana
monitoring-influxdb is running at http://sz-pg-oam-docker-test-001:8080/api/v1/proxy/namespaces/kube-system/services/monitoring-influxdb

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
```

启动完成，但是查看pod的日志后会发现出错了。

如何保证每个节点启动一个Fluentd呢？答案是使用DaemonSet。

### 排错

查看启动的pod。

```
$kubectl --namespace=kube-system get all
NAME                                       READY     STATUS    RESTARTS   AGE
po/elasticsearch-logging-v1-nshz2          1/1       Running   0          16m
po/elasticsearch-logging-v1-q515j          1/1       Running   0          16m
po/heapster-3669180046-06n3d               1/1       Running   0          23h
po/kibana-logging-4247188994-h8jxx         1/1       Running   0          16m
po/kubernetes-dashboard-1074266307-hsgxx   1/1       Running   0          1d
po/monitoring-grafana-127711743-xl9v1      1/1       Running   0          23h
po/monitoring-influxdb-1411048194-cvxmm    1/1       Running   0          23h
```

查看logging pod的日志。

```
$kubectl -n kube-system logs po/elasticsearch-logging-v1-nshz2
F0406 08:30:05.488197       7 elasticsearch_logging_discovery.go:49] Failed to make client: open /var/run/secrets/kubernetes.io/serviceaccount/token: no such file or directory
goroutine 1 [running]:
...
[2017-04-06 08:30:23,450][WARN ][discovery.zen.ping.unicast] [elasticsearch-logging-v1-nshz2] failed to send ping to [{#zen_unicast_1#}{127.0.0.1}{127.0.0.1:9300}]
SendRequestTransportException[[][127.0.0.1:9300][internal:discovery/zen/unicast]]; nested: NodeNotConnectedException[[][127.0.0.1:9300] Node not connected];
	at org.elasticsearch.transport.TransportService.sendRequest(TransportService.java:340)
	at org.elasticsearch.discovery.zen.ping.unicast.UnicastZenPing.sendPingRequestToNode(UnicastZenPing.java:440)
	at org.elasticsearch.discovery.zen.ping.unicast.UnicastZenPing.sendPings(UnicastZenPing.java:426)
	at org.elasticsearch.discovery.zen.ping.unicast.UnicastZenPing.ping(UnicastZenPing.java:240)
	at org.elasticsearch.discovery.zen.ping.ZenPingService.ping(ZenPingService.java:106)
	at org.elasticsearch.discovery.zen.ping.ZenPingService.pingAndWait(ZenPingService.java:84)
	at org.elasticsearch.discovery.zen.ZenDiscovery.findMaster(ZenDiscovery.java:945)
	at org.elasticsearch.discovery.zen.ZenDiscovery.innerJoinCluster(ZenDiscovery.java:360)
	at org.elasticsearch.discovery.zen.ZenDiscovery.access$4400(ZenDiscovery.java:96)
	at org.elasticsearch.discovery.zen.ZenDiscovery$JoinThreadControl$1.run(ZenDiscovery.java:1296)
	at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1142)
	at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:617)
	at java.lang.Thread.run(Thread.java:745)
Caused by: NodeNotConnectedException[[][127.0.0.1:9300] Node not connected]
	at org.elasticsearch.transport.netty.NettyTransport.nodeChannel(NettyTransport.java:1141)
	at org.elasticsearch.transport.netty.NettyTransport.sendRequest(NettyTransport.java:830)
	at org.elasticsearch.transport.TransportService.sendRequest(TransportService.java:329)
	... 12 more
...
```

我们可以看到报错中有这样的描述：

```
discovery.zen.ping.unicast failed to send ping to [{#zen_unicast_1#}{127.0.0.1}{127.0.0.1:9300}]
SendRequestTransportException[[internal:discovery/zen/unicast]]; nested: NodeNotConnectedException[ Node not connected]
```

这里面有两个错误：

- 无法访问到API Server
- elasticsearch两个节点间互ping失败

这个是镜像中的配置问题，配置文件在`fluentd-es-image/td-agent.conf`。

参考[使用Fluentd和ElasticSearch Stack实现Kubernetes的集群Logging](http://tonybai.com/2017/03/03/implement-kubernetes-cluster-level-logging-with-fluentd-and-elasticsearch-stack/)，Tony Bai也遇到了这个问题，我们了解下[ConfigMap](https://kubernetes.io/docs/user-guide/configmap/)还有[fluent-plugin-kubernetes_metadata_filter](https://github.com/fabric8io/fluent-plugin-kubernetes_metadata_filter)。

参考我的另一片译文[Kubernetes中ConfigMap解析](rootsongjc.github.io/blogs/kubernetes-configmap-introduction)。

<u>问题尚未解决，同志仍需努力。</u>

**To be continued…**

