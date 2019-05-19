---
date: "2017-04-07T20:13:24+08:00"
title: "使用Fluentd和ElasticSearch收集Kubernetes集群日志"
draft: false
categories: "kubernetes"
tags: ["kubernetes","fluentd","elasticsearch"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20160430080.jpg", desc: "码头@古北水镇 Apr 30,2016"}]
---

## 前言

在[安装好了Kubernetes集群](https://jimmysong.io/posts/kubernetes-installation-on-centos/)、[配置好了flannel网络](https://jimmysong.io/posts/kubernetes-network-config/)、[安装了Kubernetes Dashboard](https://jimmysong.io/posts/kubernetes-dashboard-installation/)和[配置Heapster监控插件](https://jimmysong.io/posts/kubernetes-heapster-installation/)后，还有一项重要的工作，为了调试和故障排查，还需要进行日志收集工作。

**官方文档**

[Kubernetes Logging and Monitoring Cluster Activity](https://kubernetes.io/docs/concepts/cluster-administration/logging/)

[Logging Using Elasticsearch and Kibana](https://kubernetes.io/docs/tasks/debug-application-cluster/logging-elasticsearch-kibana/)：不过这篇文章是在GCE上配置的，参考价值不大。

## 容器日志的存在形式

目前容器日志有两种输出形式：

**stdout,stderr标准输出**

这种形式的日志输出我们可以直接使用`docker logs`查看日志，kubernetes集群中同样可以使用`kubectl logs`类似的形式查看日志。

**日志文件记录**

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

```Bash
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


```ini
sz-pg-oam-docker-hub-001.tendcloud.com/library/elasticsearch:v2.4.1-2
sz-pg-oam-docker-hub-001.tendcloud.com/library/kibana:v4.6.1-1
sz-pg-oam-docker-hub-001.tendcloud.com/library/fluentd-elasticsearch:1.22
```

**备份到时速云上的镜像名称**

```ini
index.tenxcloud.com/jimmy/elasticsearch:v2.4.1-2
index.tenxcloud.com/jimmy/kibana:v4.6.1-1
index.tenxcloud.com/jimmy/fluentd-elasticsearch:1.22
```

修改上面的那三个yaml文件，将其中的镜像名称改成我们测试环境中的。

### 启动集群

使用刚修改好yaml文件的那个目录启动fluentd-elasticsearch。

```bash
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

```bash
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

应该在个node节点上启动的**fluentd**没有看到。查看logging pod的日志。

```bash
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

```bash
discovery.zen.ping.unicast failed to send ping to [{#zen_unicast_1#}{127.0.0.1}{127.0.0.1:9300}]
SendRequestTransportException[[internal:discovery/zen/unicast]]; nested: NodeNotConnectedException[ Node not connected]
```

这里面有两个错误：

- 无法访问到API Server
- elasticsearch两个节点间互ping失败

这个是镜像中的配置问题，配置文件在`fluentd-es-image/td-agent.conf`。

参考[使用Fluentd和ElasticSearch Stack实现Kubernetes的集群Logging](http://tonybai.com/2017/03/03/implement-kubernetes-cluster-level-logging-with-fluentd-and-elasticsearch-stack/)，Tony Bai也遇到了这个问题，我们了解下[ConfigMap](https://kubernetes.io/docs/user-guide/configmap/)还有[fluent-plugin-kubernetes_metadata_filter](https://github.com/fabric8io/fluent-plugin-kubernetes_metadata_filter)。

参考我的另一片译文[Kubernetes中ConfigMap解析](rootsongjc.github.io/posts/kubernetes-configmap-introduction)。

## 问题排查

前面写的是直接使用`kubectl create -f flucentd-elasticsearch`命令启动整个fluentd+elasticsearch集群，这样启动看似很简单，但是对于问题排查的时候不便于我们分析出错原因，因为你根本不知道服务之间的依赖关系和启动顺序，所以现在我们依次启动每个服务，看看背后都做了什么。

### 启动fluentd

首先启动fluentd收集日志的服务，从`fluentd-es-ds.yaml`的配置中可以看到fluentd是以[DaemonSet](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/)方式来运行的。

**DaemonSet简介**

DaemonSet能够让所有（或者一些特定）的Node节点运行同一个pod。当节点加入到kubernetes集群中，pod会被（DaemonSet）调度到该节点上运行，当节点从kubernetes集群中被移除，被（DaemonSet）调度的pod会被移除，如果删除DaemonSet，所有跟这个DaemonSet相关的pods都会被删除。

[DaemonSet详细介绍](http://www.dockerinfo.net/1139.html)，这是官方文档的中文翻译，其中还有示例。

**启动fluentd**

```bash
$kubectl create -f fluentd-es-ds.yaml
daemonset "fluentd-es-v1.22" created
$kubectl get -f fluentd-es-ds.yaml 
NAME               DESIRED   CURRENT   READY     UP-TO-DATE   AVAILABLE   NODE-SELECTOR                              AGE
fluentd-es-v1.22   0         0         0         0            0           beta.kubernetes.io/fluentd-ds-ready=true   2m
```

我们在没有修改`fluentd-es-ds.yaml`的情况下直接启动fluentd，实际上一个Pod也没有启动起来，这是为什么呢？因为**NODE-SELECTOR**选择的label是`beta.kubernetes.io/fluentd-ds-ready=true`。

我们再来看下**node**的**label**。

```bash
$kubectl describe node sz-pg-oam-docker-test-001.tendcloud.com
Name:			sz-pg-oam-docker-test-001.tendcloud.com
Role:			
Labels:			beta.kubernetes.io/arch=amd64
			beta.kubernetes.io/os=linux
			kubernetes.io/hostname=sz-pg-oam-docker-test-001.tendcloud.com
Annotations:		node.alpha.kubernetes.io/ttl=0
			volumes.kubernetes.io/controller-managed-attach-detach=true
```

我们没有给node设置`beta.kubernetes.io/fluentd-ds-ready=true`的label，所以DaemonSet没有调度上去。

我们需要手动给kubernetes集群的三个node添加label。

```bash
$kubectl label node sz-pg-oam-docker-test-001.tendcloud.com beta.kubernetes.io/fluentd-ds-ready=true
node "sz-pg-oam-docker-test-001.tendcloud.com" labeled
```

给另外两个node执行同样的操作。

现在再查看下DaemonSet的状态。

```bash
$kubectl get -f fluentd-es-ds.yaml 
NAME               DESIRED   CURRENT   READY     UP-TO-DATE   AVAILABLE   NODE-SELECTOR                              AGE
fluentd-es-v1.22   3         3         0         3            0           beta.kubernetes.io/fluentd-ds-ready=true   31m
```

现在可以看到三个DeamonSet都启动起来了。

查看下fluentd的日志`/var/log/fluentd.log`，日志是mount到本地的。

```bash
2017-04-07 03:53:42 +0000 [info]: adding match pattern="fluent.**" type="null"
2017-04-07 03:53:42 +0000 [info]: adding filter pattern="kubernetes.**" type="kubernetes_metadata"
2017-04-07 03:53:42 +0000 [error]: config error file="/etc/td-agent/td-agent.conf" error="Invalid Kubernetes API v1 endpoint https://10.254.0.1:443/api: SSL_connect returned=1 errno=0 state=error: certificate verify failed"
2017-04-07 03:53:42 +0000 [info]: process finished code=256
2017-04-07 03:53:42 +0000 [warn]: process died within 1 second. exit.
```

从日志的最后几行中可以看到，`Invalid Kubernetes API v1 endpoint https://10.254.0.1:443/api: SSL_connect returned=1 errno=0 state=error: certificate verify failed`这样的错误，这些需要在`/etc/td-agent/td-agent.conf`文件中配置的。

但是这些配置已经在创建`gcr.io/google_containers/fluentd-elasticsearch:1.22`镜像（该镜像是运行带有elasticsearch插件的fluentd的）的时候就已经copy进去了，从`fluentd-elasticsearch/fluentd-es-image/Dockerfile`文件中就可以看到：

```bash
# Copy the Fluentd configuration file.
COPY td-agent.conf /etc/td-agent/td-agent.conf
```

我们可以使用[ConfigMap](https://jimmysong.io/posts/kubernetes-configmap-introduction/)，不用重新再build镜像，通过文件挂载的形式替换镜像中已有的td-agent.conf文件。

[Tony Bai](tonybai.com)给出的两点建议：

* 在基于td-agent.conf创建configmap资源之前，需要将td-agent.conf中的注释行都删掉，否则生成的configmap的内容可能不正确；
* fluentd pod将创建在kube-system下，因此ConfigMap资源也需要创建在kube-system namespace下面，否则kubectl create无法找到对应的ConfigMap。

在td-agent.conf的配置文件的<filter kubernetes.**>中增加两条配置配置：

```bash
<filter kubernetes.**>
  type kubernetes_metadata
  kubernetes_url sz-pg-oam-docker-test-001.tendcloud.com:8080
  verify_ssl false
</filter>
```

**创建ConfigMap**

```bash
kubectl create configmap td-agent-config --from-file=fluentd-elasticsearch/fluentd-es-image/td-agent.conf -n kube-system
```

查看刚创建的ConfigMap

```bash
$kubectl -n kube-system get configmaps td-agent-config -o yaml
apiVersion: v1
data:
  td-agent.conf: |
    <match fluent.**>
      type null
    </match>
...
<filter kubernetes.**>
  type kubernetes_metadata
  kubernetes_url http://sz-pg-oam-docker-test-001.tendcloud.com:8080
  verify_ssl false
</filter>
...
```

> ⚠️ kubernetes_url地址要加上**http**。

修改`fluentd-es-ds.yaml`文件，在其中增加`td-agent.conf`文件的volume。

该文件的部分内容如下：

```yaml
apiVersion: extensions/v1beta1
kind: DaemonSet
metadata:
...
    spec:
     ...
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
        - name: td-agent-config
          mountPath: /etc/td-agent
...
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
      - name: td-agent-config
        configMap:
          name: td-agent-config
```

启动日志收集服务

```bash
kubectl create -f ./fluentd-elasticsearch
```

现在再查看`/var/log/fluentd.log`日志里面就没有错误了。

查看下elasticsearch pod日志，发现里面还有错误，跟以前的一样：

```bash
[2017-04-07 10:54:57,858][WARN ][discovery.zen.ping.unicast] [elasticsearch-logging-v1-wxd5f] failed to send ping to [{#zen_unicast_1#}{127.0.0.1}{127.0.0.1:9300}]
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
```

查看下elasticsearch:v2.4.1-2镜像的代码，在`fluentd-elasticsearch/es-image`目录下，该目录结构：

```bash
config
Dockerfile
elasticsearch_logging_discovery.go
Makefile
run.sh
template-k8s-logstash.json
```

从**Dockerfile**中可以看到：

```Dockerfile
RUN mkdir -p /elasticsearch/config/templates
COPY template-k8s-logstash.json /elasticsearch/config/templates/template-k8s-logstash.json

COPY config /elasticsearch/config

COPY run.sh /
COPY elasticsearch_logging_discovery /

RUN useradd --no-create-home --user-group elasticsearch \
    && mkdir /data \
    && chown -R elasticsearch:elasticsearch /elasticsearch

VOLUME ["/data"]
EXPOSE 9200 9300

CMD ["/run.sh"]
```

将本地的`config`目录作为配置文件拷贝到了镜像里，`run.sh`启动脚本中有三行：

```shell
/elasticsearch_logging_discovery >> /elasticsearch/config/elasticsearch.yml
chown -R elasticsearch:elasticsearch /data
exec gosu elasticsearch /elasticsearch/bin/elasticsearch
```

我们再进入到镜像里查看下

```ini
/elasticsearch/config/elasticsearch.yml
```
文件的内容。

```yaml
cluster.name: kubernetes-logging

node.name: ${NODE_NAME}
node.master: ${NODE_MASTER}
node.data: ${NODE_DATA}

transport.tcp.port: ${TRANSPORT_PORT}
http.port: ${HTTP_PORT}

path.data: /data

network.host: 0.0.0.0

discovery.zen.minimum_master_nodes: ${MINIMUM_MASTER_NODES}
discovery.zen.ping.multicast.enabled: false
```

**记录几个问题**

- Kubernetes中的DNS没有配置。
- ElasticSearch的配置有问题。
- 是否要用ServiceAccount？

## 参考

- [使用Fluentd和ElasticSearch Stack实现Kubernetes的集群Logging](http://tonybai.com/2017/03/03/implement-kubernetes-cluster-level-logging-with-fluentd-and-elasticsearch-stack/) 
- [在Kubernetes上搭建EFK（Fluentd＋Elasticsearch＋Kibana）](https://my.oschina.net/newlife111/blog/714574)
- [elasticsearch2.2 集群搭建各种坑](http://www.cnblogs.com/muzhiye/p/elasticsearch_set_cluster.html)
- [elasticsearch_logging_discovery.go](https://github.com/kubernetes/kubernetes/blob/master/cluster/addons/fluentd-elasticsearch/es-image/elasticsearch_logging_discovery.go)
- [fluent-plugin-kubernetes_metadata_filter](https://github.com/fabric8io/fluent-plugin-kubernetes_metadata_filter)

**To be continued…**

