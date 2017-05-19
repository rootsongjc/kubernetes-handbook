# 容器技术工具与资源#

软件容器技术影响着从开发人员、测试人员、运维人员到分析人员的IT团队中的每一个人，它不像虚拟化一样只是系统管理员的工具。容器包的大小和完整性使得团队成员能够在几秒钟内部署完整的环境。

容器是一个很好的工具，同时带来了一系列下游决策，包括使用何种标准、如何存储旧版本和部署镜像、如何在生产中管理这些镜像等等。

但是，该如何正确的组装产品和服务，才能在环境中有效地构建、运行和管理容器？为了回答这个问题，我们调查了各种容器技术产品和服务，以便您可以衡量对比各种容器架构、集群管理和部署、存储、安全、操作系统、部署等方案的优劣。

## 容器运行##

尽管Docker的高人气让其成为了一个事实标准，但市场上的轻量级Linux虚拟化工具众多，Docker也只是众多竞争者中的一个。你有很多选择，包括：

**Docker**

Docker的同名开源容器化引擎适用于大多数后续产品以及许多开源工具。

**Commercially Supported Docker Engine（CSDE）**

Docker公司拥有扩展Docker的所有权。CSDE支持在Windows服务器上运行docker实例。

**Rkt**

rkt的发音为“rocket”，它是由CoreOS开发的。rkt是Docker容器的主要竞争对手。

**Solaris Containers**

Solaris容器架构比Docker更早出现。想必那些已经在Solaris上标准化的IT企业会继续研究它。

**Microsoft容器**

作为Linux的竞争对手，Microsoft Containers可以在非常特定的情况下支持Windows容器。

## 集群管理和部署##

创建镜像、将它们从开发传递到测试并回传，都是容易的事情，但要在生产环境中支持它们就不那么简单了。因为那意味着要注册工件，要将它们作为系统部署到生产中，还要管理服务器和服务器集合，包括云中的服务器集合（即“集群”）。集群管理工具管理工作负载，包括将实例从一个虚拟主机转移到另一个基于负载的虚拟主机上。集群管理工具还负责分配资源，如CPU和内存。

**Kubernetes**

虽然没有集群管理的标准，但Google的开源产品Kubernetes是最受欢迎的。有Amazon的AWS、Google云引擎（GCE）和Microsoft的Azure容器服务的支持，Kubernetes是相对可移植的，这有助于防止供应商锁定，Kubernetes甚至可以在私有云（如OpenStack）上运行。Microsoft、Amazon和Google都提供运行Kubernetes的容器服务，并提供商业支持。

**Apache Mesos**

一个用于抽象计算资源的工具，Apache Mesos可以在同一个集群中同时运行Docker和rkt镜像。DC/OS是在Mesos上构建的平台，用作数据中心操作系统。

**Docker Swarm**

Docker是用于集群管理的免费产品，Swarm从命令行运行，并与Docker 1.12及更高版本捆绑在一起。现在它只用于Docker的原生编排。

**Docker Data Center**

基于Web的dashboard提供对Docker的全部管理，包括控制面板、注册表、监视、日志记录和持续集成，Docker Data Center通过运行Docker Swarm进行集群管理。虽然Docker是免费的，但Data Center是有商业支持的商业产品。当然，Docker Data Center囊括并扩展了公司的免费开源产品：Docker和Swarm。

**Rancher**

严格上说Rancher不属于单纯的集群部署与管理工具，因为它的本质是一个全栈化的容器管理平台，但是Rancher是全球唯一一家同时支持Kubernetes、Mesos和Swarm的容器管理平台。Rancher可以帮用户自动设置并启动Kubernetes、Mesos或Swarm所建立的集群，并同时提高实施访问控制策略和完整易用的用户管理界面。

## 容器存储##

容器从出现伊始就被设计为可互换的、甚至是可替代的，就像货币一样。这对于Web服务器是非常好的，因为这样就根据需求在集群中添加或删除相同的服务器了。另一方面，存储和数据库需要持久性位置来容纳数据，或者至少需要标准的接口层。如果想要迁移到全容器基础架构的组织就需要存储，以下公司及产品已经满足了这一需求。

**ClusterHQ**

这些工具有助于将数据库放入容器中。虽然开发ClusterHQ的供应商在去年12月停业，但它在github.com/ClusterHQ留下了大量的免费/开源软件。

**BlockBridge**

BlockBridge是“弹性存储平台”公司，作为使用Docker的容器提供存储，具有OpenStack选项和软件定义的安全存储。

**EMC/lib存储**

EMC/lib存储系统提供了一个代码库，使得容器存储得以实现，而且这是免费和开放的。

**Docker插件存储**

EMC、NetApp和其他公司已经创建了支持存储的插件Docker Inc.，并且可供下载。

## 容器网络

**Hades**

京东开源的为Kubernetes进行DNS注册管理的插件。

## 容器安全##

对不少想进行容器化的公司而言，单点登录、LDAP集成、审计、入侵检测和预防以及漏洞扫描都存在困难。甚至传统的设备和软件也可能难以或不可能在容器集群上配置。幸运的是，有一些厂商正在努力解决这一需求，但这一领域还很新，有两个新公司尚没有可用的产品。

**Twistlock** 

您可以不通过组件（如操作系统、Web服务器或内容管理系统）来构建Docker图像。但问题是，图像上未修补或过时的软件都可能会带来安全风险。Twistlock的漏洞扫描器通过将图像与已知威胁的数据库进行对比来解决这一问题。这是针对不断更新的数据库的自动审核。其它核心功能包括更典型的入侵检测和法规遵从性系统。

**Aqua Container Security**

像Twistlock一样，Aqua专注于创建、监视容器和在容器中实施策略，以及与CI集成，对每个构建运行安全检查。

**StackRox**

由Google的前安全主管、美国总统执行办公室网络安全高级总监Sameer Bhalotra联合创立的StackRox，目前正在准备类似的容器安全产品。虽然创业公司仍处于极低调模式，其网站上也没有产品供应，但该公司是一个值得关注的公司。

**Aporeto**

Aporeto是另一个极低调的创业公司，公司总部位于加利福尼亚州的San Jose，而且Aporeto是Nauge Networks的前CTO。Aporeto表示，公司将提供一个“用于部署和运行现代应用程序的全面的云本地安全解决方案”的微服务和容器。

## 操作系统##

大多数Linux操作系统分发版都是以“方便”为准则，包含体积很大的预安装包，以防用户可能需要它们。相比之下，Docker是为轻量级虚拟化而设计的，以尽可能少的内存、磁盘和CPU运行许多相同的机器。作为回应，不少供应商已经开发了“容器优化型”的Linux构建，尝试在Linux分发版需要的功能与容器需要的极简主义之间达到平衡。以下列出的是市场上最受欢迎的几个：

**RancherOS**

RancherOS仅包含Linux内核和Docker本身，RancherOS系统镜像只需要22 MB的磁盘空间。RancherOS不再将类似systemd这样的服务管理系统内置在大多数版本的Linux中，而是启动Docker Daemon本身作为init或“bootstrap”系统。

**CoreOS Container Linux**

设计为与CoreOS Linux工具和系统配合使用，CoreOS Container Linux已预配置为运行Linux容器。它还带有自动更新打开的功能，操作系统无需人工处理就可以自动更新。

**Ubuntu Snappy**

Canonical是Ubuntu Linux的母公司，又叫Snappy，它能比其他任何Linux分发版多运行七倍多的容器。Snappy性能高，占用空间小，并且能对操作系统和应用程序进行增量（差异）更新，从而保持轻量下载。

**Red Hat Atomic Host**

这些工具将使您可以在最小版本的Red Hat Enterprise Linux中使用Linux容器。那些运行Red Hat enterprise并有意向使用容器的企业，通常希望其主机运行Red Hat Atomic Host操作系统。

**Microsoft Nano Server**

Nano Server是一个小型的、远程管理的命令行操作系统，旨在以容器的形式托管和运行，也可能在云中运行。是的，Microsoft具有创造基于Windows Server的容器的能力，Nano是专门为此而构建的。其他可以使用Windows容器的Microsoft操作系统包括Windows Server 2016和Windows Pro 10 Enterprise。

**VMware Photon**

相较于其它容器操作系统，220MB大小的Photon可谓体积很大了，不过它仍然只是最新版本的Windows的大小的百分之一。这个Linux容器主机旨在与VMware的vSphere虚拟化产品集成。

## 容器相关大会和技术资源##

一旦你真的决定开始使用容器，那么最难的部分一定是实施和支持它们。从行业大会、技术支持论坛到商业支持，这里有你需要的资源。

**DockerCon**

如果您的公司追求的是全Docker架构，并且使用的是Docker Data Center、Swarm和Docker的商业伙伴的其他产品，那DockerCon是必参加的大会之一。DockerCon涵盖的内容从入门教程，到提示、技巧和尖端想法，一应俱全。

**Container Summit**

这个大会规模比DockerCon小，但范围更广。在2016年，Containe Summit在美国召开了两个大型会议和12个小型会议。Container Summit是与正在努力实施和管理容器技术的同行交流的好地方。

**ContainerCon**

这是一个更大的大会，其特别之处在于，参加大会的通常是容器领域的思想领袖，以及各类的供应商。 ContainerCon通常与LinuxCon和CloudOpen同时举办。

**CoreOS Fest**

CoreOS Fest可以视为CoreOS对DockerCon的回答了。参加CoreOS Fest可以获得和rkt/CoreOs技术栈有关的培训与支持信息。

**StackOverflow**

最大的程序员在线问答网站，StackOverflow提供了大量有关在容器中部署应用程序的信息。

**Docker社区网站**

Docker组建的社区网站，提供以Docker为中心的信息和论坛。

**CoreOS社区网站** 

CoreOS的社区网站专注于通过聚会和聊天将人们和专家连接起来。