---
weight: 101
title: 迁移传统应用到 Kubernetes 步骤详解——以 Hadoop YARN 为例
linktitle: 迁移传统应用
date: '2022-05-21T00:00:00+08:00'
type: book
description: >-
  详细说明如何将已有的传统分布式应用程序迁移到 Kubernetes 中，以 Spark on YARN
  为实际案例，涵盖应用拆解、镜像制作、配置管理、资源定义等完整迁移流程。
keywords:
  - hadoop
  - kubernetes
  - spark
  - yarn
  - 启动
  - 应用
  - 服务
  - 迁移
  - 配置文件
  - 镜像
lastmod: '2025-08-23'
---

本文档主要介绍如何将已有的传统分布式应用程序迁移到 Kubernetes 中。如果你想要直接开发 Kubernetes 原生应用，可以参考 [适用于 Kubernetes 的应用开发部署流程](../deploy-applications-in-kubernetes)。

应用迁移的难易程度很大程度上取决于原应用是否符合云原生应用规范（如 12 因素应用）。符合规范的应用迁移会比较顺利，否则可能遇到较大阻碍。

## 迁移策略概述

下图展示了将单体应用迁移到云原生的整体策略：

![将单体应用迁移到云原生 (图片来自 DevOpsDay Toronto)](https://assets.jimmysong.io/images/book/kubernetes-handbook/devops/migrating-hadoop-yarn-to-kubernetes/migrating-monolith-to-kubernetes.webp)
{width=4096 height=2098}

本文将以 Spark on YARN 迁移为例进行详细说明。该例子具有足够的复杂性和典型性，掌握这个案例有助于理解大部分传统应用的迁移过程。

下图是整个架构的示意图，所有进程管理和容器扩容通过 Makefile 实现：

![spark on yarn with kubernetes](https://assets.jimmysong.io/images/book/kubernetes-handbook/devops/migrating-hadoop-yarn-to-kubernetes/spark-on-yarn-with-kubernetes.webp)
{width=2395 height=1156}

> **重要提示**：本案例仅用于演示迁移步骤和复杂性，生产环境使用需要进一步验证和优化。

## 核心概念与术语

在开始迁移之前，需要了解过程中涉及的关键概念：

![术语](https://assets.jimmysong.io/images/book/kubernetes-handbook/devops/migrating-hadoop-yarn-to-kubernetes/terms-in-kubernetes-app-deployment.webp)
{width=1312 height=1766}

为了更好地理解迁移细节，本文所有操作都通过命令手动完成，不使用自动化工具。待充分理解细节后，可以引入自动化工具优化流程，提高效率并减少人为错误。

## 迁移实施步骤

![分解步骤解析](https://assets.jimmysong.io/images/book/kubernetes-handbook/devops/migrating-hadoop-yarn-to-kubernetes/migrating-hadoop-yarn-to-kubernetes.webp)
{width=967 height=462}

### 第一步：应用服务化拆解

在制作镜像和编写配置之前，首先需要梳理应用架构，识别哪些组件可以作为独立服务运行。

**拆解原则**：

- 遵循最小可变原则
- 将不变的部分编译到同一个镜像中
- 保持服务的功能内聚性

对于 Spark on YARN，可以拆解为以下核心服务：

- **ResourceManager**：资源管理服务
- **NodeManager**：节点管理服务  
- **Spark Client**：Spark 应用客户端

### 第二步：容器镜像制作

根据服务拆解结果，需要制作以下镜像：

#### Hadoop 基础镜像

以下是相关的代码示例：

```dockerfile
FROM my-docker-repo/jdk:8u321

# 添加原生库
ARG HADOOP_VERSION=3.3.4
ADD hadoop-${HADOOP_VERSION}.tar.gz /usr/local
ADD ./lib/* /usr/local/hadoop-${HADOOP_VERSION}/lib/native/
ADD ./jars/* /usr/local/hadoop-${HADOOP_VERSION}/share/hadoop/yarn/

# 环境变量配置
ENV HADOOP_PREFIX=/usr/local/hadoop \
  HADOOP_COMMON_HOME=/usr/local/hadoop \
  HADOOP_HDFS_HOME=/usr/local/hadoop \
  HADOOP_MAPRED_HOME=/usr/local/hadoop \
  HADOOP_YARN_HOME=/usr/local/hadoop \
  HADOOP_CONF_DIR=/usr/local/hadoop/etc/hadoop \
  YARN_CONF_DIR=/usr/local/hadoop/etc/hadoop \
  PATH=${PATH}:/usr/local/hadoop/bin

RUN cd /usr/local && \
  ln -s ./hadoop-${HADOOP_VERSION} hadoop && \
  rm -f ${HADOOP_PREFIX}/logs/* && \
  mkdir -p ${HADOOP_PREFIX}/logs

WORKDIR $HADOOP_PREFIX

# 端口暴露
EXPOSE 8020 8030 8031 8032 8033 8040 8042 8088 9000 50070
```

#### Spark 镜像

基于 Hadoop 镜像构建 Spark 镜像，并包装 Web 服务：

```dockerfile
FROM hadoop-base:latest

ARG SPARK_VERSION=3.3.2
ADD spark-${SPARK_VERSION}-bin-hadoop3.tgz /usr/local
ENV SPARK_HOME=/usr/local/spark
ENV PATH=${PATH}:${SPARK_HOME}/bin:${SPARK_HOME}/sbin

RUN cd /usr/local && \
  ln -s ./spark-${SPARK_VERSION}-bin-hadoop3 spark

EXPOSE 4040 7077 8080 8081
```

**注意**：镜像制作时不需要在 Dockerfile 中指定 ENTRYPOINT 和 CMD，这些在 Kubernetes YAML 中定义。

### 第三步：配置文件准备

准备服务运行所需的配置文件，存放在 `artifacts` 目录：

```text
artifacts/hadoop/
├── bootstrap.sh              # 启动脚本
├── capacity-scheduler.xml    # 容量调度器配置
├── core-site.xml            # Hadoop 核心配置
├── hadoop-env.sh            # Hadoop 环境变量
├── hdfs-site.xml            # HDFS 配置
├── log4j2.properties        # 日志配置
├── mapred-site.xml          # MapReduce 配置
├── start-yarn-nm.sh         # NodeManager 启动脚本
├── start-yarn-rm.sh         # ResourceManager 启动脚本
├── yarn-env.sh              # YARN 环境变量
└── yarn-site.xml            # YARN 配置
```

### 第四步：Kubernetes 资源定义

根据应用特性选择合适的 Kubernetes 资源对象。由于 NodeManager 需要使用主机名向 ResourceManager 注册，采用 StatefulSet 和 Headless Service。

配置文件存储在 `manifests` 目录：

```text
manifests/
├── namespace.yaml           # 命名空间
├── configmap.yaml          # 配置映射
├── yarn-rm-statefulset.yaml # ResourceManager
├── yarn-nm-statefulset.yaml # NodeManager  
├── spark-statefulset.yaml  # Spark 服务
└── ingress.yaml            # 外部访问
```

#### ResourceManager StatefulSet 示例

以下是相关的示例代码：

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: yarn-rm
  namespace: yarn-cluster
spec:
  serviceName: yarn-rm
  replicas: 1
  selector:
  matchLabels:
    app: yarn-rm
  template:
  metadata:
    labels:
    app: yarn-rm
  spec:
    containers:
    - name: yarn-rm
    image: hadoop:latest
    resources:
      requests:
      memory: "2Gi"
      cpu: "1000m"
      limits:
      memory: "4Gi" 
      cpu: "2000m"
    env:
    - name: HADOOP_ROLE
      value: "resourcemanager"
    volumeMounts:
    - name: hadoop-config
      mountPath: /tmp/hadoop-config
    volumes:
    - name: hadoop-config
    configMap:
      name: hadoop-config
```

### 第五步：启动脚本编写

Bootstrap 脚本根据 Pod 环境变量和主机名动态修改配置并启动相应服务：

```bash
#!/bin/bash

# 复制配置文件
cp /tmp/hadoop-config/* $HADOOP_CONF_DIR/

# 根据角色启动不同服务
if [[ "${HOSTNAME}" =~ "yarn-rm" ]]; then
  echo "Starting ResourceManager..."
  # 修改 ResourceManager 特定配置
  sed -i "s/RESOURCEMANAGER_HOST/${HOSTNAME}/g" $HADOOP_CONF_DIR/yarn-site.xml
  
  # 启动 ResourceManager
  $HADOOP_PREFIX/sbin/yarn-daemon.sh start resourcemanager
  
elif [[ "${HOSTNAME}" =~ "yarn-nm" ]]; then
  echo "Starting NodeManager..."
  # 动态设置资源限制
  sed -i "s/MEMORY_LIMIT/${MY_MEM_LIMIT:-2048}/g" $HADOOP_CONF_DIR/yarn-site.xml
  sed -i "s/CPU_LIMIT/${MY_CPU_LIMIT:-2}/g" $HADOOP_CONF_DIR/yarn-site.xml
  
  # 启动 NodeManager
  $HADOOP_PREFIX/sbin/yarn-daemon.sh start nodemanager
fi

# 输出日志到标准输出
if [[ $1 == "-d" ]]; then
  until find ${HADOOP_PREFIX}/logs -mmin -1 | egrep -q '.*'; do 
    echo "`date`: Waiting for logs..."
    sleep 2
  done
  tail -F ${HADOOP_PREFIX}/logs/* &
  while true; do sleep 1000; done
fi
```

### 第六步：ConfigMap 创建

将配置文件作为 ConfigMap 资源保存：

```bash
# 创建 Hadoop 配置
kubectl create configmap hadoop-config \
  --from-file=artifacts/hadoop/ \
  --namespace=yarn-cluster

# 创建 Spark 配置  
kubectl create configmap spark-config \
  --from-file=artifacts/spark/ \
  --namespace=yarn-cluster
```

## 部署与管理

配置完成后，可以使用以下命令部署和管理集群：

```bash
# 创建命名空间
kubectl apply -f manifests/namespace.yaml

# 部署 ConfigMaps
kubectl apply -f manifests/configmap.yaml

# 部署服务
kubectl apply -f manifests/yarn-rm-statefulset.yaml
kubectl apply -f manifests/yarn-nm-statefulset.yaml
kubectl apply -f manifests/spark-statefulset.yaml

# 配置外部访问
kubectl apply -f manifests/ingress.yaml
```

## 最佳实践与注意事项

1. **资源限制**：合理设置 CPU 和内存限制，避免资源争抢
2. **健康检查**：配置 liveness 和 readiness 探针
3. **数据持久化**：对于有状态服务，使用 PersistentVolume
4. **网络策略**：配置适当的网络安全策略
5. **监控告警**：集成监控系统，及时发现问题
6. **备份恢复**：制定完整的备份恢复策略

通过以上步骤，可以成功将传统的 Hadoop YARN 应用迁移到 Kubernetes 平台。整个过程需要充分理解原应用架构和 Kubernetes 特性，确保迁移后的系统稳定可靠。
