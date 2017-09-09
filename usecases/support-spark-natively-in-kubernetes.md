# 运行支持kubernetes原生调度的Spark程序

我们之前就在 kubernetes 中运行过 standalone 方式的 spark 集群，见 [Spark standalone on kubernetes](spark-standalone-on-kubernetes.md)。

目前运行支持 kubernetes 原生调度的 spark 程序由 Google 主导，

## Spark 概念说明

[Apache Spark](http://spark.apache.org) 是一个围绕速度、易用性和复杂分析构建的大数据处理框架。最初在2009年由加州大学伯克利分校的AMPLab开发，并于2010年成为Apache的开源项目之一。

在 Spark 中包括如下组件或概念：

- **Application**：Spark Application 的概念和 Hadoop 中的 MapReduce 类似，指的是用户编写的 Spark 应用程序，包含了一个 Driver 功能的代码和分布在集群中多个节点上运行的 Executor 代码；
- **Driver**：Spark 中的 Driver 即运行上述 Application 的 main() 函数并且创建 SparkContext，其中创建 SparkContext 的目的是为了准备Spark应用程序的运行环境。在 Spark 中由 SparkContext 负责和 ClusterManager 通信，进行资源的申请、任务的分配和监控等；当 Executor 部分运行完毕后，Driver负责将SparkContext 关闭。通常用 SparkContext 代表 Driver；
- **Executor**：Application运行在Worker 节点上的一个进程，该进程负责运行Task，并且负责将数据存在内存或者磁盘上，每个Application都有各自独立的一批Executor。在Spark on Yarn模式下，其进程名称为`CoarseGrainedExecutorBackend`，类似于 Hadoop MapReduce 中的 YarnChild。一个 `CoarseGrainedExecutorBackend` 进程有且仅有一个 executor 对象，它负责将 Task 包装成 taskRunner，并从线程池中抽取出一个空闲线程运行 Task。每个 `CoarseGrainedExecutorBackend` 能并行运行 Task 的数量就取决于分配给它的 CPU 的个数了；
- **Cluster Manager**：指的是在集群上获取资源的外部服务，目前有：
  - Standalone：Spark原生的资源管理，由Master负责资源的分配；
  - Hadoop Yarn：由YARN中的ResourceManager负责资源的分配；
- **Worker**：集群中任何可以运行Application代码的节点，类似于YARN中的NodeManager节点。在Standalone模式中指的就是通过Slave文件配置的Worker节点，在Spark on Yarn模式中指的就是NodeManager节点；
- **作业（Job）**：包含多个Task组成的并行计算，往往由Spark Action催生，一个JOB包含多个RDD及作用于相应RDD上的各种Operation；
- **阶段（Stage）**：每个Job会被拆分很多组 Task，每组任务被称为Stage，也可称TaskSet，一个作业分为多个阶段，每一个stage的分割点是action。比如一个job是：（transformation1 -> transformation1 -> action1 -> transformation3 -> action2），这个job就会被分为两个stage，分割点是action1和action2。
- **任务（Task）**： 被送到某个Executor上的工作任务；

- **Context**：启动spark application的时候创建，作为Spark 运行时环境。
- **Dynamic Allocation（动态资源分配）**：一个配置选项，可以将其打开。从Spark1.2之后，对于On Yarn模式，已经支持动态资源分配（Dynamic Resource Allocation），这样，就可以根据Application的负载（Task情况），动态的增加和减少executors，这种策略非常适合在YARN上使用spark-sql做数据开发和分析，以及将spark-sql作为长服务来使用的场景。Executor 的动态分配需要在 cluster mode 下启用 "external shuffle service"。
- **动态资源分配策略**：开启动态分配策略后，application会在task因没有足够资源被挂起的时候去动态申请资源，这意味着该application现有的executor无法满足所有task并行运行。spark一轮一轮的申请资源，当有task挂起或等待 `spark.dynamicAllocation.schedulerBacklogTimeout` (默认1s)时间的时候，会开始动态资源分配；之后会每隔 `spark.dynamicAllocation.sustainedSchedulerBacklogTimeout` (默认1s)时间申请一次，直到申请到足够的资源。每次申请的资源量是指数增长的，即1,2,4,8等。之所以采用指数增长，出于两方面考虑：其一，开始申请的少是考虑到可能application会马上得到满足；其次要成倍增加，是为了防止application需要很多资源，而该方式可以在很少次数的申请之后得到满足。

## 架构设计

关于 spark standalone 的局限性与 kubernetes native spark 架构之间的区别请参考 Anirudh Ramanathan 在 2016年10月8日提交的 issue [Support Spark natively in Kubernetes #34377](https://github.com/kubernetes/kubernetes/issues/34377)。

简而言之，spark standalone on kubernetes 有如下几个缺点：

- 无法对于多租户做隔离，每个用户都想给 pod 申请 node 节点可用的最大的资源。
- Spark 的 master／worker 本来不是设计成使用 kubernetes 的资源调度，这样会存在两层的资源调度问题，不利于与 kuberentes 集成。

而 kubernetes native spark 集群中，spark 可以调用 kubernetes API 获取集群资源和调度。要实现 kubernetes native spark 需要为 spark 提供一个集群外部的 manager 可以用来跟 kubernetes API 交互。

## 安装指南

我们可以直接使用官方已编译好的 docker 镜像来部署。

| 组件                         | 镜像                                       |
| -------------------------- | ---------------------------------------- |
| Spark Driver Image         | `kubespark/spark-driver:v2.1.0-kubernetes-0.3.1` |
| Spark Executor Image       | `kubespark/spark-executor:v2.1.0-kubernetes-0.3.1` |
| Spark Initialization Image | `kubespark/spark-init:v2.1.0-kubernetes-0.3.1` |
| Spark Staging Server Image | `kubespark/spark-resource-staging-server:v2.1.0-kubernetes-0.3.1` |
| PySpark Driver Image       | `kubespark/driver-py:v2.1.0-kubernetes-0.3.1` |
| PySpark Executor Image     | `kubespark/executor-py:v2.1.0-kubernetes-0.3.1` |

我将这些镜像放到了我的私有镜像仓库中了。

还需要安装支持 kubernetes 的 spark 客户端，在这里下载：https://github.com/apache-spark-on-k8s/spark/releases

根据使用的镜像版本，我下载的是 [v2.1.0-kubernetes-0.3.1](https://github.com/apache-spark-on-k8s/spark/releases/tag/v2.1.0-kubernetes-0.3.1) 

**运行 SparkPi 测试**

```bash
./bin/spark-submit \
  --deploy-mode cluster \
  --class org.apache.spark.examples.SparkPi \
  --master k8s://https://172.20.0.113:6443 \
  --kubernetes-namespace spark-cluster \
  --conf spark.executor.instances=5 \
  --conf spark.app.name=spark-pi \
  --conf spark.kubernetes.driver.docker.image=sz-pg-oam-docker-hub-001.tendcloud.com/library/kubespark-spark-driver:v2.1.0-kubernetes-0.3.1 \
  --conf spark.kubernetes.executor.docker.image=sz-pg-oam-docker-hub-001.tendcloud.com/library/kubespark-spark-executor:v2.1.0-kubernetes-0.3.1 \
  --conf spark.kubernetes.initcontainer.docker.image=sz-pg-oam-docker-hub-001.tendcloud.com/library/kubespark-spark-init:v2.1.0-kubernetes-0.3.1 \
local:///opt/spark/examples/jars/spark-examples_2.11-2.1.0-k8s-0.3.1-SNAPSHOT.jar
```

关于该命令参数的介绍请参考：https://apache-spark-on-k8s.github.io/userdocs/running-on-kubernetes.html

**注意：** 该 jar 包实际上是 `spark.kubernetes.executor.docker.image` 镜像中的。

这时候提交任务运行还是失败，报错信息中可以看到两个问题：

- Executor 无法找到 driver pod
- 用户 `system:serviceaccount:spark-cluster:defaul` 没有权限获取 `spark-cluster` 中的 pod 信息。

提了个 issue [Failed to run the sample spark-pi test using spark-submit on the doc #478](https://github.com/apache-spark-on-k8s/spark/issues/478) 

需要为 spark 集群创建一个 `serviceaccount` 和 `clusterrolebinding`：

```bash
kubectl create serviceaccount spark --namespace spark-cluster
kubectl create rolebinding spark-edit --clusterrole=edit --serviceaccount=spark-cluster:spark --namespace=spark-cluster
```

该 Bug 将在新版本中修复。

## 开发文档

Fork 并克隆项目到本地：

```bash
git clone https://github.com/rootsongjc/spark.git
```

编译前请确保你的环境中已经安装 Java8 和 Maven3。

```bash
## 第一次编译前需要安装依赖
build/mvn install -Pkubernetes -pl resource-managers/kubernetes/core -am -DskipTests

## 编译 spark on kubernetes
build/mvn compile -Pkubernetes -pl resource-managers/kubernetes/core -am -DskipTests

## 发布
dev/make-distribution.sh --tgz -Phadoop-2.7 -Pkubernetes
```

第一次编译和发布的过程耗时可能会比较长，请耐心等待，如果有依赖下载不下来，请自备梯子。

详细的开发指南请见：https://github.com/apache-spark-on-k8s/spark/blob/branch-2.2-kubernetes/resource-managers/kubernetes/README.md

## 参考

[Spark动态资源分配-Dynamic Resource Allocation](http://lxw1234.com/archives/2015/12/593.htm)

[Running Spark on Kubernetes](https://apache-spark-on-k8s.github.io/userdocs/running-on-kubernetes.html)

[Apache Spark Jira Issue - 18278 - SPIP: Support native submission of spark jobs to a kubernetes cluster](https://issues.apache.org/jira/browse/SPARK-18278)

[Kubernetes Github Issue - 34377 Support Spark natively in Kubernetes](https://github.com/kubernetes/kubernetes/issues/34377)

[Kubernetes example spark](https://github.com/kubernetes/kubernetes/tree/master/examples/spark)

https://github.com/rootsongjc/spark-on-kubernetes