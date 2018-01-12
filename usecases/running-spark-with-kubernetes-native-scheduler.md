# 运行支持kubernetes原生调度的Spark程序

TL;DR 这个主题比较大，该开源项目也还在不断进行中，我单独做了一个 web 用来记录 spark on kubernetes 的研究和最新进展见: https://jimmysong.io/spark-on-k8s

我们之前就在 kubernetes 中运行过 standalone 方式的 spark 集群，见 [Spark standalone on kubernetes](spark-standalone-on-kubernetes.md)。

目前运行支持 kubernetes 原生调度的 spark 程序由 Google 主导，目前运行支持 kubernetes 原生调度的 spark 程序由 Google 主导，fork 自 spark 的官方代码库，见https://github.com/apache-spark-on-k8s/spark/ ，属于Big Data SIG。

参与到该项目的公司有：

- Bloomberg
- Google
- Haiwen
- Hyperpilot
- Intel
- Palantir
- Pepperdata
- Red Hat

## 为何使用 spark on kubernetes

使用kubernetes原生调度的spark on kubernetes是对现有的spark on yarn/mesos的资源使用方式的革命性的改进，主要表现在以下几点：

1. Kubernetes原生调度：不再需要二层调度，直接使用kubernetes的资源调度功能，跟其他应用共用整个kubernetes管理的资源池；
2. 资源隔离，粒度更细：原先yarn中的queue在spark on kubernetes中已不存在，取而代之的是kubernetes中原生的namespace，可以为每个用户分别指定一个namespace，限制用户的资源quota；
3. 细粒度的资源分配：可以给每个spark任务指定资源限制，实际指定多少资源就使用多少资源，因为没有了像yarn那样的二层调度（圈地式的），所以可以更高效和细粒度的使用资源；
4. 监控的变革：因为做到了细粒度的资源分配，所以可以对用户提交的每一个任务做到资源使用的监控，从而判断用户的资源使用情况，所有的metric都记录在数据库中，甚至可以为每个用户的每次任务提交计量；
5. 日志的变革：用户不再通过yarn的web页面来查看任务状态，而是通过pod的log来查看，可将所有的kuberentes中的应用的日志等同看待收集起来，然后可以根据标签查看对应应用的日志；

所有这些变革都可以让我们更高效的获取资源、更有效率的获取资源！

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

### 调度器后台

使用 kubernetes 原生调度的 spark 的基本设计思路是将 spark 的 driver 和 executor 都放在 kubernetes 的 pod 中运行，另外还有两个附加的组件：`ResourceStagingServer` 和 `KubernetesExternalShuffleService`。

Spark driver 其实可以运行在 kubernetes 集群内部（cluster mode）可以运行在外部（client mode），executor 只能运行在集群内部，当有 spark 作业提交到 kubernetes 集群上时，调度器后台将会为 executor pod 设置如下属性：

- 使用我们预先编译好的包含 kubernetes 支持的 spark 镜像，然后调用 `CoarseGrainedExecutorBackend` main class 启动 JVM。
- 调度器后台为 executor pod 的运行时注入环境变量，例如各种 JVM 参数，包括用户在 `spark-submit` 时指定的那些参数。
- Executor 的 CPU、内存限制根据这些注入的环境变量保存到应用程序的 `SparkConf` 中。
- 可以在配置中指定 spark 运行在指定的 namespace 中。

参考：[Scheduler backend 文档](https://github.com/apache-spark-on-k8s/spark/blob/branch-2.2-kubernetes/resource-managers/kubernetes/architecture-docs/scheduler-backend.md)

## 安装指南

我们可以直接使用官方已编译好的 docker 镜像来部署，下面是官方发布的镜像：

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

我们将任务运行在 `spark-cluster` 的 namespace 中，启动 5 个 executor 实例。

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

## 用户指南

### 编译

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

### 构建镜像

使用该脚本来自动构建容器镜像：https://github.com/apache-spark-on-k8s/spark/pull/488

将该脚本放在 `dist` 目录下，执行：

```bash
./build-push-docker-images.sh -r sz-pg-oam-docker-hub-001.tendcloud.com/library -t v2.1.0-kubernetes-0.3.1-1 build
./build-push-docker-images.sh -r sz-pg-oam-docker-hub-001.tendcloud.com/library -t v2.1.0-kubernetes-0.3.1-1 push
```

**注意：**如果你使用的 MacOS，bash 的版本可能太低，执行改脚本将出错，请检查你的 bash 版本：

```bash
bash --version
GNU bash, version 3.2.57(1)-release (x86_64-apple-darwin16)
Copyright (C) 2007 Free Software Foundation, Inc.
```

上面我在升级 bash 之前获取的版本信息，使用下面的命令升级 bash：

```bash
brew install bash
```

升级后的 bash 版本为 `4.4.12(1)-release (x86_64-apple-darwin16.3.0)`。

编译并上传镜像到我的私有镜像仓库，将会构建出如下几个镜像：

```bash
sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-driver:v2.1.0-kubernetes-0.3.1-1
sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-resource-staging-server:v2.1.0-kubernetes-0.3.1-1
sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-init:v2.1.0-kubernetes-0.3.1-1
sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-shuffle:v2.1.0-kubernetes-0.3.1-1
sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-executor:v2.1.0-kubernetes-0.3.1-1
sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-executor-py:v2.1.0-kubernetes-0.3.1-1
sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-driver-py:v2.1.0-kubernetes-0.3.1-1
```

## 运行测试

在 `dist/bin` 目录下执行 spark-pi 测试：

```bash
./spark-submit \
  --deploy-mode cluster \
  --class org.apache.spark.examples.SparkPi \
  --master k8s://https://172.20.0.113:6443 \
  --kubernetes-namespace spark-cluster \
  --conf spark.kubernetes.authenticate.driver.serviceAccountName=spark \
  --conf spark.executor.instances=5 \
  --conf spark.app.name=spark-pi \
  --conf spark.kubernetes.driver.docker.image=sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-driver:v2.1.0-kubernetes-0.3.1-1 \
  --conf spark.kubernetes.executor.docker.image=sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-executor:v2.1.0-kubernetes-0.3.1-1 \
  --conf spark.kubernetes.initcontainer.docker.image=sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-init:v2.1.0-kubernetes-0.3.1-1 \
local:///opt/spark/examples/jars/spark-examples_2.11-2.2.0-k8s-0.4.0-SNAPSHOT.jar
```

详细的参数说明见：https://apache-spark-on-k8s.github.io/userdocs/running-on-kubernetes.html

**注意：**`local:///opt/spark/examples/jars/spark-examples_2.11-2.2.0-k8s-0.4.0-SNAPSHOT.jar` 文件是在 `spark-driver` 和 `spark-executor` 镜像里的，在上一步构建镜像时已经构建并上传到了镜像仓库中。

执行日志显示：

```bash
2017-09-14 14:59:01 INFO  Client:54 - Waiting for application spark-pi to finish...
2017-09-14 14:59:01 INFO  LoggingPodStatusWatcherImpl:54 - State changed, new state:
	 pod name: spark-pi-1505372339796-driver
	 namespace: spark-cluster
	 labels: spark-app-selector -> spark-f4d3a5d3ad964a05a51feb6191d50357, spark-role -> driver
	 pod uid: 304cf440-991a-11e7-970c-f4e9d49f8ed0
	 creation time: 2017-09-14T06:59:01Z
	 service account name: spark
	 volumes: spark-token-zr8wv
	 node name: N/A
	 start time: N/A
	 container images: N/A
	 phase: Pending
	 status: []
2017-09-14 14:59:01 INFO  LoggingPodStatusWatcherImpl:54 - State changed, new state:
	 pod name: spark-pi-1505372339796-driver
	 namespace: spark-cluster
	 labels: spark-app-selector -> spark-f4d3a5d3ad964a05a51feb6191d50357, spark-role -> driver
	 pod uid: 304cf440-991a-11e7-970c-f4e9d49f8ed0
	 creation time: 2017-09-14T06:59:01Z
	 service account name: spark
	 volumes: spark-token-zr8wv
	 node name: 172.20.0.114
	 start time: N/A
	 container images: N/A
	 phase: Pending
	 status: []
2017-09-14 14:59:01 INFO  LoggingPodStatusWatcherImpl:54 - State changed, new state:
	 pod name: spark-pi-1505372339796-driver
	 namespace: spark-cluster
	 labels: spark-app-selector -> spark-f4d3a5d3ad964a05a51feb6191d50357, spark-role -> driver
	 pod uid: 304cf440-991a-11e7-970c-f4e9d49f8ed0
	 creation time: 2017-09-14T06:59:01Z
	 service account name: spark
	 volumes: spark-token-zr8wv
	 node name: 172.20.0.114
	 start time: 2017-09-14T06:59:01Z
	 container images: sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-driver:v2.1.0-kubernetes-0.3.1-1
	 phase: Pending
	 status: [ContainerStatus(containerID=null, image=sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-driver:v2.1.0-kubernetes-0.3.1-1, imageID=, lastState=ContainerState(running=null, terminated=null, waiting=null, additionalProperties={}), name=spark-kubernetes-driver, ready=false, restartCount=0, state=ContainerState(running=null, terminated=null, waiting=ContainerStateWaiting(message=null, reason=ContainerCreating, additionalProperties={}), additionalProperties={}), additionalProperties={})]
2017-09-14 14:59:03 INFO  LoggingPodStatusWatcherImpl:54 - State changed, new state:
	 pod name: spark-pi-1505372339796-driver
	 namespace: spark-cluster
	 labels: spark-app-selector -> spark-f4d3a5d3ad964a05a51feb6191d50357, spark-role -> driver
	 pod uid: 304cf440-991a-11e7-970c-f4e9d49f8ed0
	 creation time: 2017-09-14T06:59:01Z
	 service account name: spark
	 volumes: spark-token-zr8wv
	 node name: 172.20.0.114
	 start time: 2017-09-14T06:59:01Z
	 container images: sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-driver:v2.1.0-kubernetes-0.3.1-1
	 phase: Running
	 status: [ContainerStatus(containerID=docker://5c5c821c482a1e35552adccb567020532b79244392374f25754f0050e6cd4c62, image=sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-driver:v2.1.0-kubernetes-0.3.1-1, imageID=docker-pullable://sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-driver@sha256:beb92a3e3f178e286d9e5baebdead88b5ba76d651f347ad2864bb6f8eda26f94, lastState=ContainerState(running=null, terminated=null, waiting=null, additionalProperties={}), name=spark-kubernetes-driver, ready=true, restartCount=0, state=ContainerState(running=ContainerStateRunning(startedAt=2017-09-14T06:59:02Z, additionalProperties={}), terminated=null, waiting=null, additionalProperties={}), additionalProperties={})]
2017-09-14 14:59:12 INFO  LoggingPodStatusWatcherImpl:54 - State changed, new state:
	 pod name: spark-pi-1505372339796-driver
	 namespace: spark-cluster
	 labels: spark-app-selector -> spark-f4d3a5d3ad964a05a51feb6191d50357, spark-role -> driver
	 pod uid: 304cf440-991a-11e7-970c-f4e9d49f8ed0
	 creation time: 2017-09-14T06:59:01Z
	 service account name: spark
	 volumes: spark-token-zr8wv
	 node name: 172.20.0.114
	 start time: 2017-09-14T06:59:01Z
	 container images: sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-driver:v2.1.0-kubernetes-0.3.1-1
	 phase: Succeeded
	 status: [ContainerStatus(containerID=docker://5c5c821c482a1e35552adccb567020532b79244392374f25754f0050e6cd4c62, image=sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-driver:v2.1.0-kubernetes-0.3.1-1, imageID=docker-pullable://sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-driver@sha256:beb92a3e3f178e286d9e5baebdead88b5ba76d651f347ad2864bb6f8eda26f94, lastState=ContainerState(running=null, terminated=null, waiting=null, additionalProperties={}), name=spark-kubernetes-driver, ready=false, restartCount=0, state=ContainerState(running=null, terminated=ContainerStateTerminated(containerID=docker://5c5c821c482a1e35552adccb567020532b79244392374f25754f0050e6cd4c62, exitCode=0, finishedAt=2017-09-14T06:59:11Z, message=null, reason=Completed, signal=null, startedAt=null, additionalProperties={}), waiting=null, additionalProperties={}), additionalProperties={})]
2017-09-14 14:59:12 INFO  LoggingPodStatusWatcherImpl:54 - Container final statuses:


	 Container name: spark-kubernetes-driver
	 Container image: sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-driver:v2.1.0-kubernetes-0.3.1-1
	 Container state: Terminated
	 Exit code: 0
2017-09-14 14:59:12 INFO  Client:54 - Application spark-pi finished.
```

从日志中可以看到任务运行的状态信息。

使用下面的命令可以看到 kubernetes 启动的 Pod 信息：

```bash
kubectl --namespace spark-cluster get pods -w
```

将会看到 `spark-driver` 和 `spark-exec` 的 Pod 信息。

## 依赖管理

上文中我们在运行测试程序时，命令行中指定的 jar 文件已包含在 docker 镜像中，是不是说我们每次提交任务都需要重新创建一个镜像呢？非也！如果真是这样也太麻烦了。

#### 创建 resource staging server

为了方便用户提交任务，不需要每次提交任务的时候都创建一个镜像，我们使用了 **resource staging server** 。

```
kubectl create -f conf/kubernetes-resource-staging-server.yaml
```

我们同样将其部署在 `spark-cluster` namespace 下，该 yaml 文件见 [kubernetes-handbook](https://github.com/rootsongjc/kubernetes-handbook) 的 `manifests/spark-with-kubernetes-native-scheduler` 目录。

#### 优化

其中有一点需要优化，在使用下面的命令提交任务时，使用 `--conf spark.kubernetes.resourceStagingServer.uri` 参数指定 *resource staging server* 地址，用户不应该关注 *resource staging server* 究竟运行在哪台宿主机上，可以使用下面两种方式实现：

- 使用 `nodeSelector` 将 *resource staging server* 固定调度到某一台机器上，该地址依然使用宿主机的 IP 地址
- 改变 `spark-resource-staging-service` service 的 type 为 **ClusterIP**， 然后使用 **Ingress** 将其暴露到集群外部，然后加入的内网 DNS 里，用户使用 DNS 名称指定 *resource staging server* 的地址。

然后可以执行下面的命令来提交本地的 jar 到 kubernetes 上运行。

```bash
./spark-submit \
  --deploy-mode cluster \
  --class org.apache.spark.examples.SparkPi \
  --master k8s://https://172.20.0.113:6443 \
  --kubernetes-namespace spark-cluster \
  --conf spark.kubernetes.authenticate.driver.serviceAccountName=spark \
  --conf spark.executor.instances=5 \
  --conf spark.app.name=spark-pi \
  --conf spark.kubernetes.driver.docker.image=sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-driver:v2.1.0-kubernetes-0.3.1-1 \
  --conf spark.kubernetes.executor.docker.image=sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-executor:v2.1.0-kubernetes-0.3.1-1 \
  --conf spark.kubernetes.initcontainer.docker.image=sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-init:v2.1.0-kubernetes-0.3.1-1 \
  --conf spark.kubernetes.resourceStagingServer.uri=http://172.20.0.114:31000 \
  ../examples/jars/spark-examples_2.11-2.2.0-k8s-0.4.0-SNAPSHOT.jar
```

该命令将提交本地的 `../examples/jars/spark-examples_2.11-2.2.0-k8s-0.4.0-SNAPSHOT.jar` 文件到 *resource staging server*，executor 将从该 server 上获取 jar 包并运行，这样用户就不需要每次提交任务都编译一个镜像了。

详见：https://apache-spark-on-k8s.github.io/userdocs/running-on-kubernetes.html#dependency-management

#### 设置 HDFS 用户

如果 Hadoop 集群没有设置 kerbros 安全认证的话，在指定 `spark-submit` 的时候可以通过指定如下四个环境变量， 设置 Spark 与 HDFS 通信使用的用户：

```bash
  --conf spark.kubernetes.driverEnv.SPARK_USER=hadoop 
  --conf spark.kubernetes.driverEnv.HADOOP_USER_NAME=hadoop 
  --conf spark.executorEnv.HADOOP_USER_NAME=hadoop 
  --conf spark.executorEnv.SPARK_USER=hadoop 
```

使用 hadoop 用户提交本地 jar 包的命令示例：

```bash
./spark-submit \
  --deploy-mode cluster \
  --class com.talkingdata.alluxio.hadooptest \
  --master k8s://https://172.20.0.113:6443 \
  --kubernetes-namespace spark-cluster \
  --conf spark.kubernetes.driverEnv.SPARK_USER=hadoop \
  --conf spark.kubernetes.driverEnv.HADOOP_USER_NAME=hadoop \
  --conf spark.executorEnv.HADOOP_USER_NAME=hadoop \
  --conf spark.executorEnv.SPARK_USER=hadoop \
  --conf spark.kubernetes.authenticate.driver.serviceAccountName=spark \
  --conf spark.executor.instances=5 \
  --conf spark.app.name=spark-pi \
  --conf spark.kubernetes.driver.docker.image=sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-driver:v2.1.0-kubernetes-0.3.1-1 \
  --conf spark.kubernetes.executor.docker.image=sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-executor:v2.1.0-kubernetes-0.3.1-1 \
  --conf spark.kubernetes.initcontainer.docker.image=sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-init:v2.1.0-kubernetes-0.3.1-1 \
  --conf spark.kubernetes.resourceStagingServer.uri=http://172.20.0.114:31000 \
~/Downloads/tendcloud_2.10-1.0.jar
```

详见：https://github.com/apache-spark-on-k8s/spark/issues/408

#### 限制 Driver 和 Executor 的资源使用

在执行 `spark-submit` 时使用如下参数设置内存和 CPU 资源限制：

```bash
--conf spark.driver.memory=3G
--conf spark.executor.memory=3G
--conf spark.driver.cores=2
--conf spark.executor.cores=10
```

这几个参数中值如何传递到 Pod 的资源设置中的呢？

比如我们设置在执行 `spark-submit` 的时候传递了这样的两个参数：`--conf spark.driver.cores=2` 和 `--conf spark.driver.memory=100G` 那么查看 driver pod 的 yaml 输出结果将会看到这样的资源设置：

```yaml
    resources:
      limits:
        memory: 110Gi
      requests:
        cpu: "2"
        memory: 100Gi
```

以上参数是对 `request` 值的设置，那么 `limit` 的资源设置的值又是从何而来？

可以使用 `spark.kubernetes.driver.limit.cores` 和 `spark.kubernetes.executor.limit.cores` 来设置 CPU的 hard limit。

memory limit 的值是根据 memory request 的值加上 `spark.kubernetes.executor.memoryOverhead` 的值计算而来的，该配置项用于设置分配给每个 executor 的超过 heap 内存的值（可以使用k、m、g单位）。该值用于虚拟机的开销、其他本地服务开销。根据 executor 的大小设置（通常是 6%到10%）。

我们可以这样来提交一个任务，同时设置 driver 和 executor 的 CPU、内存的资源 request 和 limit 值（driver 的内存 limit 值为 request 值的 110%）。

```bash
./spark-submit \
  --deploy-mode cluster \
  --class org.apache.spark.examples.SparkPi \
  --master k8s://https://172.20.0.113:6443 \
  --kubernetes-namespace spark-cluster \
  --conf spark.kubernetes.authenticate.driver.serviceAccountName=spark \
  --conf spark.driver.memory=100G \
  --conf spark.executor.memory=10G \
  --conf spark.driver.cores=30 \
  --conf spark.executor.cores=2 \
  --conf spark.driver.maxResultSize=10240m \
  --conf spark.kubernetes.driver.limit.cores=32 \
  --conf spark.kubernetes.executor.limit.cores=3 \
  --conf spark.kubernetes.executor.memoryOverhead=2g \
  --conf spark.executor.instances=5 \
  --conf spark.app.name=spark-pi \
  --conf spark.kubernetes.driver.docker.image=sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-driver:v2.1.0-kubernetes-0.3.1-1 \
  --conf spark.kubernetes.executor.docker.image=sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-executor:v2.1.0-kubernetes-0.3.1-1 \
  --conf spark.kubernetes.initcontainer.docker.image=sz-pg-oam-docker-hub-001.tendcloud.com/library/spark-init:v2.1.0-kubernetes-0.3.1-1 \
local:///opt/spark/examples/jars/spark-examples_2.11-2.2.0-k8s-0.4.0-SNAPSHOT.jar 10000000
```

这将启动一个包含一千万个 task 的计算 pi 的 spark 任务，任务运行过程中，drvier 的 CPU 实际消耗大约为 3 核，内存 40G，每个 executor 的 CPU 实际消耗大约不到 1 核，内存不到 4G，我们可以根据实际资源消耗不断优化资源的 request 值。

`SPARK_DRIVER_MEMORY` 和 `SPARK_EXECUTOR_MEMORY` 和分别作为 Driver 容器和 Executor 容器启动的环境变量，比如下面这个 Driver 启动的 CMD 中：

```bash
CMD SPARK_CLASSPATH="${SPARK_HOME}/jars/*" && \
    env | grep SPARK_JAVA_OPT_ | sed 's/[^=]*=\(.*\)/\1/g' > /tmp/java_opts.txt && \
    readarray -t SPARK_DRIVER_JAVA_OPTS < /tmp/java_opts.txt && \
    if ! [ -z ${SPARK_MOUNTED_CLASSPATH+x} ]; then SPARK_CLASSPATH="$SPARK_MOUNTED_CLASSPATH:$SPARK_CLASSPATH"; fi && \
    if ! [ -z ${SPARK_SUBMIT_EXTRA_CLASSPATH+x} ]; then SPARK_CLASSPATH="$SPARK_SUBMIT_EXTRA_CLASSPATH:$SPARK_CLASSPATH"; fi && \
    if ! [ -z ${SPARK_EXTRA_CLASSPATH+x} ]; then SPARK_CLASSPATH="$SPARK_EXTRA_CLASSPATH:$SPARK_CLASSPATH"; fi && \
    if ! [ -z ${SPARK_MOUNTED_FILES_DIR+x} ]; then cp -R "$SPARK_MOUNTED_FILES_DIR/." .; fi && \
    if ! [ -z ${SPARK_MOUNTED_FILES_FROM_SECRET_DIR} ]; then cp -R "$SPARK_MOUNTED_FILES_FROM_SECRET_DIR/." .; fi && \
    ${JAVA_HOME}/bin/java "${SPARK_DRIVER_JAVA_OPTS[@]}" -cp $SPARK_CLASSPATH -Xms$SPARK_DRIVER_MEMORY -Xmx$SPARK_DRIVER_MEMORY $SPARK_DRIVER_CLASS $SPARK_DRIVER_ARGS
```

我们可以看到对 `SPARK_DRIVER_MEMORY` 环境变量的引用。Executor 的设置与 driver 类似。

而我们可以使用这样的参数来传递环境变量的值 `spark.executorEnv.[EnvironmentVariableName]`，只要将 `EnvironmentVariableName` 替换为环境变量名称即可。

## 参考

- [Spark动态资源分配-Dynamic Resource Allocation](http://lxw1234.com/archives/2015/12/593.htm)
- [Running Spark on Kubernetes](https://apache-spark-on-k8s.github.io/userdocs/running-on-kubernetes.html)
- [Apache Spark Jira Issue - 18278 - SPIP: Support native submission of spark jobs to a kubernetes cluster](https://issues.apache.org/jira/browse/SPARK-18278)
- [Kubernetes Github Issue - 34377 Support Spark natively in Kubernetes](https://github.com/kubernetes/kubernetes/issues/34377)
- [Kubernetes example spark](https://github.com/kubernetes/kubernetes/tree/master/examples/spark)
- https://github.com/rootsongjc/spark-on-kubernetes
- [Scheduler backend](https://github.com/apache-spark-on-k8s/spark/blob/branch-2.2-kubernetes/resource-managers/kubernetes/architecture-docs/scheduler-backend.md)
- [Introduction to Spark on Kubernetes - banzaicloud.com](https://banzaicloud.github.io/blog/spark-k8s/)
- [Scaling Spark made simple on Kubernetes - banzaicloud.com](https://banzaicloud.com/blog/scaling-spark-k8s/)
- [The anatomy of Spark applications on Kubernetes - banzaicloud.com](https://banzaicloud.com/blog/spark-k8s-internals/)
- [Monitoring Apache Spark with Prometheus - banzaicloud.com](https://banzaicloud.com/blog/spark-monitoring/)
- [Running Zeppelin Spark notebooks on Kubernetes - banzaicloud.com](https://banzaicloud.com/blog/zeppelin-spark-k8/)
- [Apache Spark CI/CD workflow howto - banzaicloud.com](https://banzaicloud.com/blog/pipeline-howto/)