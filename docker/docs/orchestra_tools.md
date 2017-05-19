# 容器编排工具#

容器编排工具都有一些共同的特征，如容器配置、发布和发现、系统监控和故障恢复、声明式系统配置以及有关容器布置和性能的规则和约束定义机制。除此之外，有些工具还提供了处理特定需求的特性。

开源编排工具包括Docker Swarm、Kubernetes、Marathon和Nomad。这些工具既可以安装在企业内部你自己的数据中心里，也可以安装在大多数的云上。其中，作为谷歌容器引擎的一部分，Kubernetes还作为托管解决方案提供。它对逻辑单元pods进行调度——pods是一组部署在一起的容器，用来完成特定的任务。Pods可以用于构成更高层次的抽象，如部署。每个pod都提供了标准的监控，也有用户自定义的健康检查。Kubernetes在类似OpenStack这样的项目中也有应用，它得到了社区及供应商的支持。

**Docker Swarm & Kubernetes**

Docker Swarm是Docker的原生编排工具。Docker 1.12新增了“swarm模式”特性，用于跨多个主机进行编排。Docker Swarm仍然是一个独立的产品。可以通过Docker API访问它，也可以用它调用类似docker compose这样的工具，对服务和容器进行声明式编排。Docker Swarm是Docker Datacenter这个更大的产品的一部分，后者是针对企业级容器部署。

Swarm和Kubernetes都使用YAML配置文件。虽然二者都是开源的，但Kubernetes对Docker没有任何依赖，它是Cloud Native Computing Foundation（CNCF）项目的一部分。不过，两种工具都是既可以在本地运行，也可以在类似AWS这样的公有云上运行。

**Marathon**

编排框架Marathon基于Apache Mesos项目。Apache Mesos通过API提供了跨数据中心的资源管理和调度抽象，而这些数据中心可能是物理上分散的。Mesos上的系统可以使用底层的计算、网络和存储资源，就像虚拟机通过虚拟机管理程序使用底层资源一样。Marathon使用了Mesos并在它上面运行，针对长期运行的应用程序提供了容器编排功能。它既支持Mesos容器运行时，也支持Docker容器运行时。

Amazon EC2容器服务（ECS）和Azure容器服务是两个托管解决方案，其中后者是最新的解决方案。ECS仅支持在AWS的基础设施上运行的容器，它可以利用弹性负载均衡、日志工具CloudTrail等AWS特性。ECS任务调度器将任务分组成服务进行编排。对于持久化数据存储，用户可以使用数据卷或者Amazon弹性文件系统（EFS）。Azure的容器服务使用Mesos作为底层集群管理器。用户也可以选用Apache Mesosphere数据中心操作系统（DC/OS）、Kubernetes或者Docker Swarm进行编排。

**[Nomad](nomad.md)**

Hashicorp的Nomad是一个开源产品，可以支持Docker容器、VM和独立应用程序。Nomad基于代理模型，每个代理部署到一台主机上，它会和中央Nomad服务器通信。Nomad服务器负责任务调度，其依据是哪台主机有可用的资源。Nomad可以跨数据中心，而且也可以和其他Hashicorp工具（如Consul）集成。

**总结**

在选择使用哪种编排工具时，其中一个决定性因素是，是否可以接受被锁定到特定的基础设施（如AWS或Azure）。