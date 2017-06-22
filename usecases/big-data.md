# 大数据

Kubernetes community中已经有了一个[Big data SIG](https://github.com/kubernetes/community/tree/master/sig-big-data)，大家可以通过这个SIG了解kubernetes结合大数据的应用。

其实在Swarm、Mesos、kubernetes这三种流行的容器编排调度架构中，Mesos对于大数据应用支持是最好的，spark原生就是运行在mesos上的，当然也可以容器化运行在kubernetes上。

[Spark on Kubernetes](spark-on-kubernetes.md)