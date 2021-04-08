# Kubernetes 与云原生 2017 年年终总结及 2018 年展望

本文主要关于 Kubernetes 及云原生生态圈在 2017 年取得的进展，及对 2018 年的展望。

云计算技术发展至今已经 10 多个年头了，从最开始的硬件虚拟化、IaaS、OpenStack、PaaS、容器设置到 Serverless 发展至今，已经越来约接近应用逻辑，容器实现了应用的分装，方便了应用在不同环境间的迁移，轻量级的特性又使它能够消耗更少的资源而带来更多的便利，但是独木难支，容器如果在单节点上运行并不能发挥它的最大效益，容器编排领域在 2016 年就成为了兵家必争之地。在新的一年即将到来时，本文将带您一起梳理 2017 年 Kubernetes 及云原生的发展，并对其在 2018 年的趋势作出预测。

## Kubernetes

谈到 [Kuberentes](https://kubernetes.io/) 就不得不谈到容器，容器从几年前的大热到现在的归于平淡，之前大家说容器通常是指 Docker 容器，甚至很多人就将容器等同于 Docker，还有很多人像操作虚拟机一样得使用容器。

Kubernetes 是谷歌根据其内部使用的 Borg 改造成一个通用的容器编排调度器，于 2014 年将其发布到开源社区，并于 2015 年将其捐赠给 Linux 基金会的下属的[云原生计算基金会（CNCF）](https://cncf.io/)，也是 GIFEE（Google Infrastructure For Everyone Else）中的一员，其他还包括 HDFS、Hbase、Zookeeper 等，见 https://github.com/GIFEE/GIFEE，下面就让我们来回顾一下 Kubernetes 的技术发展史。

### Kubernetes 发展历史

相信凡是关注容器生态圈的人都不会否认，Kubernetes 已经成为容器编排调度的实际标准，不论 Docker 官方还是 Mesos 都已经支持 Kubernetes，Docker 公司在今年 10 月 16 日至 19 日举办的 DockerCon EU 2017 大会上宣布支持 Kubernetes 调度，就在这不久前 Mesos 的商业化公司 Mesosphere 的 CTO Tobi Knaup 也在官方博客中宣布 Kubernetes on DC/OS。而回想下 2016 年时，我们还在为 Swarm、Mesos、Kubernetes 谁能够在容器编排调度大战中胜出而猜测时，而经过不到一年的发展，Kubernetes 就以超过 70% 的市场占有率（据 [TheNewStack](https://www.thenewstack.io/) 的调研报告）将另外两者遥遥的甩在了身后，其已经在大量的企业中落地，还有一些重量级的客户也宣布将服务迁移到 Kubernetes 上，比如 GitHub（见 [Kubernetes at GitHub](https://githubengineering.com/kubernetes-at-github/)），还有 eBay、彭博社等。

Kubernetes 自 2014 年由 Google 开源以来，至今已经发展到了 1.9 版本，下面是 Kubernetes 的版本发布路线图：

- 2014 年 10 月由 Google 正式开源。
- 2015 年 7 月 22 日发布 1.0 版本，在 OSCON（开源大会）上发布了 1.0 版本。
- 2015 年 11 月 16 日发布 1.1 版本，性能提升，改进了工具并创建了日益强大的社区。
- 2016 年 4 月 16 日发布 1.2 版本，更多的性能升级加上简化应用程序部署和管理。
- 2016 年 7 月 22 日发布 1.3 版本，对接了云原生和企业级工作负载。
- 2016 年 9 月 26 日发布 1.4 版本，该版本起 Kubernetes 开始支持不同的运行环境，并使部署变得更容易。
- 2016 年 12 月 13 日发布 1.5 版本，该版本开始支持生产级别工作负载。
- 2017 年 3 月 28 日发布 1.6 版本，该版本支持多租户和在集群中自动化部署不同的负载。
- 2017 年 6 月 29 日发布 1.7 版本，该版本的 kubernetes 在安全性、存储和可扩展性方面有了很大的提升。
- 2017 年 9 月 28 日发布 1.8 版本，该版本中包括了一些功能改进和增强，并增加了项目的成熟度，将强了 kubernetes 的治理模式，这些都将有利于 kubernetes 项目的持续发展。
- 2017 年 12 月 15 日发布 1.9 版本，该版本最大的改进是 Apps Workloads API 成为稳定版本，这消除了很多潜在用户对于该功能稳定性的担忧。还有一个重大更新，就是测试支持了 Windows 了，这打开了在 kubernetes 中运行 Windows 工作负载的大门。

从上面的时间线中我们可以看到，Kubernetes 的产品迭代周期越来越快，从 2014 年开源，2015 年发布了两个版本，2016 年发布了三个版本，而今年一年内就发布了 4 个大版本，Kubernetes 已经变了的越来越稳定，越来越易用。

Kubernetes 的架构做的足够开放，通过系列的接口，如 CRI（Container Runtime Interface）作为 Kubelet 与容器之间的通信接口、CNI（Container Networking Interface) 来管理网络、而持久化存储通过各种 Volume Plugin 来实现，同时 Kubernetes 的 API 本身也可以通过 CRD（Custom Resource Define）来扩展，还可以自己编写 [Operator](https://coreos.com/operators/) 和 [Service Catalog](https://github.com/kubernetes-incubator/service-catalog) 来基于 Kubernetes 实现更高级和复杂的功能。

## 云原生

在 Kubernetes 出现之前，就已经有人提出了云原生的概念，如 2010 年 Paul Fremantle 就在他的博客中提出了云原生的核心理念，但是还没有切实的技术解决方案。而那时候 PaaS 才刚刚出现，PaaS 平台提供商 Heroku 提出了 [12 因素应用](http://12factor.net/)的理念，为构建 SaaS 应用提供了方法论，该理念在云原生时代依然适用。

现如今云已经可以为我们提供稳定的可以唾手可得的基础设施，但是业务上云成了一个难题，Kubernetes 的出现与其说是从最初的容器编排解决方案，倒不如说是为了解决应用上云（即云原生应用）这个难题。[CNCF](https://cncf.io/) 中的托管的一系列项目即致力于云原生应用整个生命周期的管理，从部署平台、日志收集、Service Mesh（服务网格）、服务发现、分布式追踪、监控以及安全等各个领域通过开源的软件为我们提供一揽子解决方案。

国外已经有众多的 Kubernetes 和 Cloud Native meetup 定期举办，在中国今年可以说是小荷才露尖尖角。

- 2017 年 6 月 19 日 - 20 日，北京，[L3 大会](https://www.bagevent.com/event/561769)（LinuxCon+ContainerCon+CloudOpen China）。CNCF（Cloud Native Computing Foundation）作为云原生应用的联合推广团体，也是由 Google 一手培植起来的强大 “市场媒体”（Kubernetes 是第一个入选该基金会的项目），第一次进入中国，华为、Google、Rancher、红帽等公司分别做了关于 Kubernetes 及 Cloud Native 的演讲。
- 2017 年 7 月 25 日，北京、上海，[k8smeetup](http://www.k8smeetup.com/)，Kubernetes 二周年北京 - 上海 Meetup 双城庆生。
- 2017 年 9 月 12 日，北京，[T11 大会](https://www.talkingdata.com/activity/T11-2017/index.html)，前 Pivotal 技术专家，现 CapitalOne 高级专家 Kevin Hoffman 做了 [High Level Cloud Native Concepts](https://jimmysong.io/posts/high-level-cloud-native-from-kevin-hoffman/) 的演讲。
- 2017 年 10 月 15 日，杭州，[KEUC 2017- Kubernetes 中国用户大会](https://www.bagevent.com/event/827437)。由才云科技（Caicloud）、美国 The Linux Foundation 基金会旗下 Cloud Native Computing Foundation (CNCF)、「K8sMeetup 中国社区」联合主办的聚焦 Kubernetes 中国行业应用与技术落地的盛会。
- 2017 年 12 月 13 日 - 15 日，杭州，[云原生技术大会 ——CNTC](https://www.huodongjia.com/event-5854212.html)。这次会议由谐云科技与网易云共同主办，主要探讨云原生技术与应用，同时还进行了云原生集训。

另外还有由才云科技分别在北京、上海、深圳、青岛等地举办了多场 k8smeetup。

### 容器是云原生的基石

容器最初是通过开发者工具而流行，可以使用它来做隔离的开发测试环境和持续集成环境，这些都是因为容器轻量级，易于配置和使用带来的优势，docker 和 docker-compose 这样的工具极大的方便的了应用开发环境的搭建，同时基于容器的 CI/CD 工具如雨后春笋般出现。

隔离的环境、良好的可移植性、模块化的组件、易于扩展和轻量级的特性，使得容器成为云原生的基石。但是容器不光是 docker 一种，还有 [cri-o](http://cri-o.io/)、[rkt](https://github.com/rkt/rkt) 等支持 OCI 标准的容器，以及 OpenStack 基金会推出的兼容容器标准的号称是轻量级虚拟机的 [Kata Containers](https://katacontainers.io/)，Kubernetes 并不绑定到某一容器引擎，而是支持所有满足 OCI 运行时标准的容器。

### 下一代云计算标准

Google 通过将云应用进行抽象简化出的 Kubernetes 中的各种概念对象，如 Pod、Deployment、Job、StatefulSet 等，形成了 Cloud Native 应用的通用的可移植的模型，Kubernetes 作为云应用的部署标准，直接面向业务应用，将大大提高云应用的可移植性，解决云厂商锁定的问题，让云应用可以在跨云之间无缝迁移，甚至用来管理混合云，成为企业 IT 云平台的新标准。

## 现状及影响

Kubernetes 既然是下一代云计算的标准，那么它当前的现状如何，距离全面落地还有存在什么问题？

### 当前存在的问题

如果 Kubernetes 被企业大量采用，将会是对企业 IT 价值的重塑，IT 将是影响业务速度和健壮性的中流砥柱，但是对于 Kubernetes 真正落地还存在诸多问题：

- 部署和运维起来复杂，需要有经过专业的培训才能掌握；
- 企业的组织架构需要面向 DevOps 转型，很多问题不是技术上的，而是管理和心态上的；
- 对于服务级别尤其是微服务的治理不足，暂没有一套切实可行可落地的完整微服务治理方案；
- 对于上层应用的支持不够完善，需要编写配置大量的 YAML 文件，难于管理；
- 当前很多传统应用可能不适合迁移到 Kuberentes，或者是成本太高，因此可以落地的项目不多影响推广；

以上这些问题是企业真正落地 Kubernetes 时将会遇到的比较棘手的问题，针对这些问题，Kubernetes 社区早就心领神会有多个 [SIG](https://github.com/kubernetes/kubernetes/wiki/Special-Interest-Groups-(SIGs))（Special Interest Group）专门负责不同领域的问题，而初创公司和云厂商们也在虎视眈眈觊觎这份大蛋糕。

### 日益强大的社区

Kubernetes 已成为 GitHub 上参与和讨论人数最多的开源项目，在其官方 Slack 上有超过两万多名注册用户（其中包括中文用户频道 **cn-users**），而整个 Kubernetes 中文用户群可达数千名之众。

目前关于 Kubernetes 和云原生图书也已经琳琳总总，让人眼花缭乱。

英文版的讲解 Kubernetes 的书籍有：The Kubernetes Book、Kubernetes in Action、Kubernetes Microservices with Docker，关于云原生架构的 Cloud Native Infrastructure: Patterns for Scalable Infrastructure and Applications in a Dynamic Environment 等已发行和 2018 年即将发行的有十几本之多，同时还有关于云原生开发的书籍也鳞次栉比，如 [Cloud Native Go](https://jimmysong.io/cloud-native-go)（这本书已经被翻译成中文，由电子工业出版社引进出版）、[Cloud Native Python](https://jimmysong.io/cloud-native-python)（已由电子工业出版社引进，预计 2018 年推出中文版），Cloud Native Java 等。

关于 Kuberentes 和云原生的中文版的书籍有：《Kubernetes 权威指南：从 Docker 到 Kubernetes 实践全接触》，《Java 云原生》（预计 2018 年出版），还有一系列开源的电子书和教程，比如我写的 [kubernetes-handbook](https://jimmysong.io/kubernetes-handbook)，同时 Kubernetes 官方官网文档也即将推出完整的汉化版本，该项目目前还在进行中，见 [kubernetes-docs-cn](https://github.com/kubernetes/kubernetes-docs-cn)。

另外，除了图书和官方 Slack 外，在中国还有很多厂商、社区、爱好者组织的 meetup、微信群推广 Kubernetes，同时吸引了大量的用户关注和使用 Kubernetes。

### 创业公司与厂商支持

国外的 Google 的 GKE、微软的 Azure ACS、AWS 的 [Fargate](https://aws.amazon.com/fargate/) 和 2018 年即将推出的 EKS、Rancher 联合 Ubuntu 推出的 RKE，国内的华为云、腾讯云、阿里云等都已推出了公有云上的 Kuberentes 服务，Kubernetes 已经成为公有云的容器部署的标配，私有云领域也有众多厂商在做基于 Kubernetes 的 PaaS 平台。随着企业落地 Kubernetes 的日益增长，相关的人才缺口也将日益显现。CNCF 又就此推出了 CKA（Certified Kubernetes Administrator）和 CKD（Certified Kubernetes Developer），假若在 Kubernetes 的生态构建与市场发展顺利的情况下，该证书将会展现其含金量。

另外在国外还有一大批基于 Kubernetes 的创业公司，如 Kubernetes 创始人之一 Joe Beda 创立了 Heptio（于今年 9 月获获得 2500 万美元 B 轮融资），还有 Platform9、Kismatic、Diamanti、Bitnami、CoreOS、Hypernetes、Weave、NavOps 等，他们中有的提供 Kubernetes 的技术咨询和培训，有的专研某项具体技术，还有一系列基于 Kubernetes 的自动化工具、监控厂商如雨后春笋般出现。

国内前几年诞生了多家容器创业公司，例如 DaoCloud、精灵云、时速云、数人云、灵雀云、有容云、好雨云、希云、才云、博云等，这些厂商有的可能一开始不是基于 Kubernetes 作为容器编排调度引擎，但是现在已经全部支持，其中灵雀云于 11 月 8 日获得腾讯云领投的 B 轮融资。这些容器厂商全部涉及私有云业务，主要对接金融、政府和电信行业，帮助传统企业进行 IT 转型，虽然很多厂商都生成支持 Kubernetes，但是在 Kubernetes 的易用性上还需要很多改进，单纯基于容器部署应用已经无法满足企业的需求，帮助企业上云、将传统应用改造以适应云的弹性与高效，构建 PaaS 平台，通过基于容器的基础调度平台运行大数据及 AI 应用，成为创业公司的众矢之的，对于特定行业的整体的解决方案将是国内的容器厂商的主要商业化方式。

目前大部分容器云提供的产品大同小异，从云平台管理、容器应用的生命周期管理、DevOps、微服务架构等，这些大多是对原有应用的部署和资源申请流程的优化，没有形成杀手级的平台级服务，这些都是原来容器时代的产物。而容器云进化到高级阶段 Cloud Native（云原生）后，容器技术将成为该平台的基础，虽然大家都生成具有全面的功能，但是厂商在推行容器技术时需要结合企业的具体应用场景下进行优化。

## 2018 年展望

2017 年可以说是 Cloud Native 蓬勃发展和大发异彩之年，Kuberentes 在这一年中连续发布了 4 个版本，从 1.6 到 1.9，[Containerd](https://github.com/containerd/containerd)、[Fluentd](https://github.com/fluent/fluentd/)、[CoreDNS](https://github.com/coredns/coredns)、[Jeager](https://github.com/jaegertracing/jaeger) 分别发布自己的 1.0 版本。

在今年 12 月的 KubeCon&CloudNativeCon Austin 会议上，已经为 2018 年的云原生生态圈的发展确定几大关键词：

- 服务网格（Service Mesh），在 Kubernetes 上践行微服务架构进行服务治理所必须的组件；
- 无服务器架构（Serverless），以 FaaS 为代表的无服务器架构将会流行开来；
- 加强数据服务承载能力，例如在 Kubernetes 上运行大数据应用；
- 简化应用部署与运维包括云应用的监控与日志收集分析等；

这些功能是 Kubernetes 生态已有但是亟待加强的功能，它们能够解决我们在上文中提到的当前生态中存在的问题。

2018 年的 IaaS 的运营商将主要提供基础架构服务，如虚拟机、存储和数据库等传统的基础架构和服务，仍然会使用现有的工具如 Chef、Terraform、Ansible 等来管理；Kubernetes 则可能直接运行在裸机上运行，结合 CI/CD 成为 DevOps 的得力工具，并成为高级开发人员的应用部署首选；Kubernetes 也将成为 PaaS 层的重要组成部分，为开发者提供应用程序部署的简单方法，但是开发者可能不会直接与 Kubernetes 或者 PaaS 交互，实际的应用部署流程很可能落在自动化 CI 工具如 Jenkins 上。

2018 年，Kubernetes 将更加稳定好用，云原生将会出现更多的落地与最佳实践，这都值得我们期待！