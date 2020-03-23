# 服务编排管理

Kubernetes虽然提供了多种容器编排对象，例如Deployment、StatefulSet、DeamonSet、Job等，还有多种基础资源封装例如ConfigMap、Secret、Serivce等，但是一个应用往往有多个服务，有的可能还要依赖持久化存储，当这些服务之间直接互相依赖，需要有一定的组合的情况下，使用YAML文件的方式配置应用往往十分繁琐还容易出错，这时候就需要服务编排工具。

服务编排管理工具就是构建在kubernetes的基础[object](../concepts/objects.md)之上，统筹各个服务之间的关系和依赖的。目前常用到的工具是 [Helm](https://github.com/kubernetes/helm)。
