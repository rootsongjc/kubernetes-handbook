---
date: "2017-05-16T17:46:15+08:00"
draft: false
title: "使用Logstash收集Kubernetes的应用日志"
categories: "kubernetes"
tags: ["kubernetes","logging"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20170514005.jpg", desc: "798艺术区 May 14,2017"}]
---

## 前言

本文同步更新到Github仓库[kubernetes-handbook](http://github.com/rootsongjc/kubernetes-handbook)中。

很多企业内部都有自己的ElasticSearch集群，我们没有必要在kubernetes集群内部再部署一个，而且这样还难于管理，因此我们考虑在容器里部署logstash收集日志到已有的ElasticSearch集群中。

## 方案选择

Kubernetes官方提供了EFK的日志收集解决方案，但是这种方案并不适合所有的业务场景，它本身就有一些局限性，例如：

- 所有日志都必须是out前台输出，真实业务场景中无法保证所有日志都在前台输出
- 只能有一个日志输出文件，而真实业务场景中往往有多个日志输出文件
- Fluentd并不是常用的日志收集工具，我们更习惯用logstash
- 我们已经有自己的ELK集群且有专人维护，没有必要再在kubernetes上做一个日志收集服务

基于以上几个原因，我们决定使用自己的ELK集群。

**Kubernetes集群中的日志收集解决方案**

| **编号** | **方案**                               | **优点**                                   | **缺点**                          |
| ------ | ------------------------------------ | ---------------------------------------- | ------------------------------- |
| **1**  | 每个app的镜像中都集成日志收集组件                   | 部署方便，kubernetes的yaml文件无须特别配置，可以为每个app自定义日志收集配置 | 强耦合，不方便应用和日志收集组件升级和维护且会导致镜像过大   |
| **2**  | 单独创建一个日志收集组件跟app的容器一起运行在同一个pod中      | 低耦合，扩展性强，方便维护和升级                         | 需要对kubernetes的yaml文件进行单独配置，略显繁琐 |
| **3**  | 将所有的Pod的日志都挂载到宿主机上，每台主机上单独起一个日志收集Pod | 完全解耦，性能最高，管理起来最方便                        | 需要统一日志收集规则，目录和输出方式              |

综合以上优缺点，我们选择使用方案二。

该方案在扩展性、个性化、部署和后期维护方面都能做到均衡，因此选择该方案。

![logstash日志收集架构图](https://res.cloudinary.com/jimmysong/image/upload/images/logstash-log-collector.jpg)

我们创建了自己的logstash镜像。创建过程和使用方式见 [Github - docker images](https://github.com/rootsongjc/docker-images)

镜像地址：

```ini
index.tenxcloud.com/jimmy/logstash:5.3.0
```

## 测试

我们部署一个应用对logstash的日志收集功能进行测试。

创建应用yaml文件`logstash-test.yaml`。

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: logstash-test
  namespace: default
spec:
  replicas: 3
  template:
    metadata:
      labels:
        k8s-app: logstash-test
    spec:
      containers:
      - image: sz-pg-oam-docker-hub-001.tendcloud.com/library/logstash:5.3.0
        name: logstash
        resources:
          requests:
            cpu: 100m
            memory: 500M
        volumeMounts:
        - name: app-logs
          mountPath: /log
        env: 
        - name: LogFile
          value: '["/log/*","/log/usermange/common/*"]'
        - name: ES_SERVER
          value: 172.23.5.255:9200
        - name: INDICES
          value: logstash-docker
        - name: CODEC
          value: plain 
      - image: sz-pg-oam-docker-hub-001.tendcloud.com/library/analytics-docker-test:Build_8
        name : app
        volumeMounts:
        - name: app-logs
          mountPath: /usr/local/TalkingData/logs
      volumes:
      - name: app-logs
        emptyDir: {}
```

**注意事项**

- 将app的`/usr/local/TalkingData/logs`目录挂载到logstash的`/log`目录下。
- logstash容器大概需要500M以上内存。
- 该文件可以在`manifests/test/logstash-test.yaml`找到。 
- 我使用了自己的私有镜像仓库，测试时请换成自己的应用镜像。
- logstash的环境变量的值配置请参考 [Github - docker-images](https://github.com/rootsongjc/docker-images)

**创建应用**

部署Deployment

```bash
kubectl create -f logstash-test.yaml
```

查看下面的地址：

```http
http://172.23.5.255:9200/_cat/indices
```

```bash
green open logstash-docker-2017.05.16      VkFWx3b_Ss6n4keDmXm-TQ 5 1   2078     0   1.6mb 795.3kb
```

访问Kibana的web页面，查看`logstash-docker-2017.05.16`的索引，可以看到logstash收集到了app日志。

![Kibana页面](https://res.cloudinary.com/jimmysong/image/upload/images/logstash-test-kibana.jpg)

## 后记

该方案因为logstash消耗内存才多而否决，我们改用了**filebeat**，请参考我的另一篇文章[使用filebeat收集应用日志](https://jimmysong.io/posts/kubernetes-filebeat/)。
