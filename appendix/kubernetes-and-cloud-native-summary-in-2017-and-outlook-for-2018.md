# Kubernetes与云原生2017年年终总结及2018年展望

本文主要关于Kubernetes及云原生生态圈在2017年取得的进展，及对2018年的展望。

云计算技术发展至今已经10多个年头了，从最开始的硬件虚拟化、IaaS、OpenStack、PaaS、容器设置到Serverless发展至今，已经越来约接近应用逻辑，容器实现了应用的分装，方便了应用在不同环境间的迁移，轻量级的特性又使它能够消耗更少的资源而带来更多的便利，但是独木难支，容器如果在单节点上运行并不能发挥它的最大效益，容器编排领域在2016年就成为了兵家必争之地。在新的一年即将到来时，本文将带您一起梳理2017年Kubernetes及云原生的发展，并对其在2018年的趋势作出预测。

## Kubernetes

谈到[Kuberentes](https://kubernetes.io)就不得不谈到容器，容器从几年前的大热到现在的归于平淡，之前大家说容器通常是指Docker容器，甚至很多人就将容器等同于Docker，还有很多人像操作虚拟机一样得使用容器。

Kubernetes是谷歌根据其内部使用的Borg改造成一个通用的容器编排调度器，于2014年将其发布到开源社区，并于2015年将其捐赠给Linux基金会的下属的[云原生计算基金会（CNCF）](https://cncf.io)，也是GIFEE（Google Infrastructure For Everyone Else）中的一员，其他还包括HDFS、Hbase、Zookeeper等，见<https://github.com/GIFEE/GIFEE>，下面就让我们来回顾一下Kubernetes的技术发展史。

### Kubernetes发展历史

相信凡是关注容器生态圈的人都不会否认，Kubernetes已经成为容器编排调度的实际标准，不论Docker官方还是Mesos都已经支持Kubernetes，Docker公司在今年10月16日至19日举办的DockerCon EU 2017大会上宣布支持Kubernetes调度，就在这不久前Mesos的商业化公司Mesosphere的CTO Tobi Knaup也在官方博客中宣布Kubernetes on DC/OS。而回想下2016年时，我们还在为Swarm、Mesos、Kubernetes谁能够在容器编排调度大战中胜出而猜测时，而经过不到一年的发展，Kubernetes就以超过70%的市场占有率（据[TheNewStack](https://www.thenewstack.io)的调研报告）将另外两者遥遥的甩在了身后，其已经在大量的企业中落地，还有一些重量级的客户也宣布将服务迁移到Kubernetes上，比如GitHub（见[Kubernetes at GitHub](https://githubengineering.com/kubernetes-at-github/)），还有eBay、彭博社等。

Kubernetes自2014年由Google开源以来，至今已经发展到了1.9版本，下面是Kubernetes的版本发布路线图：

- 2014年10月由Google正式开源。
- 2015年7月22日发布1.0版本，在OSCON（开源大会）上发布了1.0版本。
- 2015年11月16日发布1.1版本，性能提升，改进了工具并创建了日益强大的社区。
- 2016年4月16日发布1.2版本，更多的性能升级加上简化应用程序部署和管理。
- 2016年7月22日发布1.3版本，对接了云原生和企业级工作负载。
- 2016年9月26日发布1.4版本，该版本起Kubernetes开始支持不同的运行环境，并使部署变得更容易。
- 2016年12月13日发布1.5版本，该版本开始支持生产级别工作负载。
- 2017年3月28日发布1.6版本，该版本支持多租户和在集群中自动化部署不同的负载。
- 2017年6月29日发布1.7版本，该版本的kubernetes在安全性、存储和可扩展性方面有了很大的提升。
- 2017年9月28日发布1.8版本，该版本中包括了一些功能改进和增强，并增加了项目的成熟度，将强了kubernetes的治理模式，这些都将有利于kubernetes项目的持续发展。
- 2017年12月15日发布1.9版本，该版本最大的改进是Apps Workloads API成为稳定版本，这消除了很多潜在用户对于该功能稳定性的担忧。还有一个重大更新，就是测试支持了Windows了，这打开了在kubernetes中运行Windows工作负载的大门。

从上面的时间线中我们可以看到，Kubernetes的产品迭代周期越来越快，从2014年开源，2015年发布了两个版本，2016年发布了三个版本，而今年一年内就发布了4个大版本，Kubernetes已经变了的越来越稳定，越来越易用。

Kubernetes的架构做的足够开放，通过系列的接口，如CRI（Container Runtime Interface）作为Kubelet与容器之间的通信接口、CNI（Container Networking Interface)来管理网络、而持久化存储通过各种Volume Plugin来实现，同时Kubernetes的API本身也可以通过CRD（Custom Resource Define）来扩展，还可以自己编写[Operator](https://coreos.com/operators/)和[Service Catalog](https://github.com/kubernetes-incubator/service-catalog)来基于Kubernetes实现更高级和复杂的功能。

## Cloud Native

在Kubernetes出现之前，就已经有人提出了云原生的概念，如2010年Paul Fremantle就在他的博客中提出了云原生的核心理念，但是还没有切实的技术解决方案。而那时候PaaS才刚刚出现，PaaS平台提供商Heroku提出了[12因素应用](http://12factor.net)的理念，为构建SaaS应用提供了方法论，该理念在云原生时代依然适用。

现如今云已经可以为我们提供稳定的可以唾手可得的基础设施，但是业务上云成了一个难题，Kubernetes的出现与其说是从最初的容器编排解决方案，倒不如说是为了解决应用上云（即云原生应用）这个难题。[CNCF](https://cncf.io)中的托管的一系列项目即致力于云原生应用整个生命周期的管理，从部署平台、日志收集、Service Mesh（服务网格）、服务发现、分布式追踪、监控以及安全等各个领域通过开源的软件为我们提供一揽子解决方案。

国外已经有众多的Kubernetes和Cloud Native meetup定期举办，在中国今年可以说是小荷才露尖尖角。

- 2017年6月19日-20日，北京，[L3大会](https://www.bagevent.com/event/561769)（LinuxCon+ContainerCon+CloudOpen China）。CNCF（Cloud Native Computing Foundation）作为云原生应用的联合推广团体，也是由Google一手培植起来的强大“市场媒体”（Kubernetes是第一个入选该基金会的项目），第一次进入中国，华为、Google、Rancher、红帽等公司分别做了关于Kubernetes及Cloud Native的演讲。
- 2017年7月25日，北京、上海，[k8smeetup](http://www.k8smeetup.com)，Kubernetes二周年北京-上海 Meetup双城庆生。
- 2017年9月12日，北京，[T11大会](https://www.talkingdata.com/activity/T11-2017/index.html)，前Pivotal技术专家，现CapitalOne高级专家Kevin Hoffman做了[High Level Cloud Native Concepts](https://jimmysong.io/posts/high-level-cloud-native-from-kevin-hoffman/)的演讲。
- 2017年10月15日，杭州，[KEUC 2017- Kubernetes 中国用户大会](https://www.bagevent.com/event/827437)。由才云科技（Caicloud）、美国 The Linux Foundation 基金会旗下 Cloud Native Computing Foundation (CNCF)、「K8sMeetup 中国社区」联合主办的聚焦Kubernetes中国行业应用与技术落地的盛会。
- 2017年12月13日-15日，杭州，[云原生技术大会——CNTC](https://www.huodongjia.com/event-5854212.html)。这次会议由谐云科技与网易云共同主办，主要探讨云原生技术与应用，同时还进行了云原生集训。

另外还有由才云科技分别在北京、上海、深圳、青岛等地举办了多场k8smeetup。

### 容器是云原生的基石

容器最初是通过开发者工具而流行，可以使用它来做隔离的开发测试环境和持续集成环境，这些都是因为容器轻量级，易于配置和使用带来的优势，docker和docker-compose这样的工具极大的方便的了应用开发环境的搭建，同时基于容器的CI/CD工具如雨后春笋般出现。

隔离的环境、良好的可移植性、模块化的组件、易于扩展和轻量级的特性，使得容器成为云原生的基石。但是容器不光是docker一种，还有[cri-o](http://cri-o.io/)、[rkt](https://github.com/rkt/rkt)等支持OCI标准的容器，以及OpenStack基金会推出的兼容容器标准的号称是轻量级虚拟机的[Kata Containers](https://katacontainers.io/)，Kubernetes并不绑定到某一容器引擎，而是支持所有满足OCI运行时标准的容器。

### 下一代云计算标准

Google通过将云应用进行抽象简化出的Kubernetes中的各种概念对象，如Pod、Deployment、Job、StatefulSet等，形成了Cloud Native应用的通用的可移植的模型，Kubernetes作为云应用的部署标准，直接面向业务应用，将大大提高云应用的可移植性，解决云厂商锁定的问题，让云应用可以在跨云之间无缝迁移，甚至用来管理混合云，成为企业IT云平台的新标准。

## 现状及影响

Kubernetes既然是下一代云计算的标准，那么它当前的现状如何，距离全面落地还有存在什么问题？

### 当前存在的问题

如果Kubernetes被企业大量采用，将会是对企业IT价值的重塑，IT将是影响业务速度和健壮性的中流砥柱，但是对于Kubernetes真正落地还存在诸多问题：

- 部署和运维起来复杂，需要有经过专业的培训才能掌握；
- 企业的组织架构需要面向DevOps转型，很多问题不是技术上的，而是管理和心态上的；
- 对于服务级别尤其是微服务的治理不足，暂没有一套切实可行可落地的完整微服务治理方案；
- 对于上层应用的支持不够完善，需要编写配置大量的YAML文件，难于管理；
- 当前很多传统应用可能不适合迁移到Kuberentes，或者是成本太高，因此可以落地的项目不多影响推广；

以上这些问题是企业真正落地Kubernetes时将会遇到的比较棘手的问题，针对这些问题，Kubernetes社区早就心领神会有多个[SIG](https://github.com/kubernetes/kubernetes/wiki/Special-Interest-Groups-(SIGs))（Special Interest Group）专门负责不同领域的问题，而初创公司和云厂商们也在虎视眈眈觊觎这份大蛋糕。

### 日益强大的社区

Kubernetes已成为GitHub上参与和讨论人数最多的开源项目，在其官方Slack上有超过两万多名注册用户（其中包括中文用户频道**cn-users**），而整个Kubernetes中文用户群可达数千名之众。

目前关于Kubernetes和云原生图书也已经琳琳总总，让人眼花缭乱。

英文版的讲解Kubernetes的书籍有：The Kubernetes Book、Kubernetes in Action、Kubernetes Microservices with Docker，关于云原生架构的Cloud Native Infrastructure: Patterns for Scalable Infrastructure and Applications in a Dynamic Environment等已发行和2018年即将发行的有十几本之多，同时还有关于云原生开发的书籍也鳞次栉比，如[Cloud Native Go](https://jimmysong.io/cloud-native-go)（这本书已经被翻译成中文，由电子工业出版社引进出版）、[Cloud Native Python](https://jimmysong.io/cloud-native-python)（已由电子工业出版社引进，预计2018年推出中文版），Cloud Native Java等。

关于Kuberentes和云原生的中文版的书籍有：《Kubernetes权威指南:从Docker到Kubernetes实践全接触》，《Java云原生》（预计2018年出版），还有一系列开源的电子书和教程，比如我写的[kubernetes-handbook](https://jimmysong.io/kubernetes-handbook)，同时Kubernetes官方官网文档也即将推出完整的汉化版本，该项目目前还在进行中，见[kubernetes-docs-cn](https://github.com/kubernetes/kubernetes-docs-cn)。

另外，除了图书和官方Slack外，在中国还有很多厂商、社区、爱好者组织的meetup、微信群推广Kubernetes，同时吸引了大量的用户关注和使用Kubernetes。

### 创业公司与厂商支持

国外的Google的GKE、微软的Azure ACS、AWS的[Fargate](https://aws.amazon.com/fargate/)和2018年即将推出的EKS、Rancher联合Ubuntu推出的RKE，国内的华为云、腾讯云、阿里云等都已推出了公有云上的Kuberentes服务，Kubernetes已经成为公有云的容器部署的标配，私有云领域也有众多厂商在做基于Kubernetes的PaaS平台。随着企业落地Kubernetes的日益增长，相关的人才缺口也将日益显现。CNCF又就此推出了CKA（Certified Kubernetes Administrator）和CKD（Certified Kubernetes Developer），假若在Kubernetes的生态构建与市场发展顺利的情况下，该证书将会展现其含金量。

另外在国外还有一大批基于Kubernetes的创业公司，如Kubernetes创始人之一Joe Beda创立了Heptio（于今年9月获获得2500万美元B轮融资），还有Platform9、Kismatic、Diamanti、Bitnami、CoreOS、Hypernetes、Weave、NavOps等，他们中有的提供Kubernetes的技术咨询和培训，有的专研某项具体技术，还有一系列基于Kubernetes的自动化工具、监控厂商如雨后春笋般出现。

国内前几年诞生了多家容器创业公司，例如DaoCloud、精灵云、时速云、数人云、灵雀云、有容云、好雨云、希云、才云、博云等，这些厂商有的可能一开始不是基于Kubernetes作为容器编排调度引擎，但是现在已经全部支持，其中灵雀云于11月8日获得腾讯云领投的B轮融资。这些容器厂商全部涉及私有云业务，主要对接金融、政府和电信行业，帮助传统企业进行IT转型，虽然很多厂商都生成支持Kubernetes，但是在Kubernetes的易用性上还需要很多改进，单纯基于容器部署应用已经无法满足企业的需求，帮助企业上云、将传统应用改造以适应云的弹性与高效，构建PaaS平台，通过基于容器的基础调度平台运行大数据及AI应用，成为创业公司的众矢之的，对于特定行业的整体的解决方案将是国内的容器厂商的主要商业化方式。

目前大部分容器云提供的产品大同小异，从云平台管理、容器应用的生命周期管理、DevOps、微服务架构等，这些大多是对原有应用的部署和资源申请流程的优化，没有形成杀手级的平台级服务，这些都是原来容器时代的产物。而容器云进化到高级阶段Cloud Native（云原生）后，容器技术将成为该平台的基础，虽然大家都生成具有全面的功能，但是厂商在推行容器技术时需要结合企业的具体应用场景下进行优化。

## 2018年展望

2017年可以说是Cloud Native蓬勃发展和大发异彩之年，Kuberentes在这一年中连续发布了4个版本，从1.6到1.9，[Containerd](https://github.com/containerd/containerd)、[Fluentd](https://github.com/fluent/fluentd/)、[CoreDNS](https://github.com/coredns/coredns)、[Jeager](https://github.com/jaegertracing/jaeger)分别发布自己的1.0版本。

在今年12月的KubeCon&CloudNativeCon Austin会议上，已经为2018年的云原生生态圈的发展确定几大关键词：

- 服务网格（Service Mesh），在Kubernetes上践行微服务架构进行服务治理所必须的组件；
- 无服务器架构（Serverless），以FaaS为代表的无服务器架构将会流行开来；
- 加强数据服务承载能力，例如在Kubernetes上运行大数据应用；
- 简化应用部署与运维包括云应用的监控与日志收集分析等；

这些功能是Kubernetes生态已有但是亟待加强的功能，它们能够解决我们在上文中提到的当前生态中存在的问题。

2018年的IaaS的运营商将主要提供基础架构服务，如虚拟机、存储和数据库等传统的基础架构和服务，仍然会使用现有的工具如Chef、Terraform、Ansible等来管理；Kubernetes则可能直接运行在裸机上运行，结合CI/CD成为DevOps的得力工具，并成为高级开发人员的应用部署首选；Kubernetes也将成为PaaS层的重要组成部分，为开发者提供应用程序部署的简单方法，但是开发者可能不会直接与Kubernetes或者PaaS交互，实际的应用部署流程很可能落在自动化CI工具如Jenkins上。

2018年，Kubernetes将更加稳定好用，云原生将会出现更多的落地与最佳实践，这都值得我们期待！
