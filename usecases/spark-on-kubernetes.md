# Spark 与 Kubernetes

Spark 原生支持 standalone、mesos 和 YARN 的调度方式，当前 kubernetes 社区正在支持 kubernetes 的原生调度来运行 spark。当然您也可以在 Kubernetes 直接部署 spark on YARN 或者 spark standalone 模式。

## Spark Standalone

使用 spark standalone 模式在 Kubernetes 上运行，kubernetes 不负责 spark 任务的调度。这种模式中使用的 spark 本身负责任务调度，kubernetes 只是作为一个 spark 的部署平台。

## Spark on Yarn

使用 StatefulSet 和 Headless serverless 来实现。这种模式中 kubernetes 依然不负责 spark 应用的调度，而只是将 Yarn 换了一个部署环境而已。

下面是架构图：

![Spark on yarn with kubernetes](../images/spark-on-yarn-with-kubernetes.png)

### Spark on Kubernetes

Spark on kubernetes，使用 kubernetes 作为调度引擎，spark 的任务直接调度到 node 节点上。参考：[运行支持 kubernetes 原生调度的 Spark 程序](./running-spark-with-kubernetes-native-scheduler.md)。

### 调度方式总结

下图显示的是三种调度方式中单个 kubernetes node 节点上运行的 spark 相关容器的调度情况。

![在 kubernetes 上使用多种调度方式](../images/spark-on-kubernetes-with-different-schedulers.jpg)

毫无疑问，使用 kubernetes 原生调度的 spark 任务才是最节省资源的。