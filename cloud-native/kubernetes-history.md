# Kubernetes 的诞生

众所周知，[Kubernetes](http://kubernetes.io) 是 Google 于 2014 年 6 月基于其内部使用的 [Borg](https://research.google.com/pubs/pub43438.html) 系统开源出来的容器编排调度引擎。其实从 2000 年开始，Google 就开始基于容器研发三个容器管理系统，分别是 Borg、Omega 和 Kubernetes。这篇由 Google 工程师 Brendan Burns、Brian Grant、David Oppenheimer、Eric Brewer 和 John Wilkes 几人在 2016 年发表的[《Borg, Omega, and Kubernetes》](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/44843.pdf)论文里，阐述了 Google 从 Borg 到 Kubernetes 这个旅程中所获得知识和经验教训。

## Borg、Omega 和 Kubernetes

Google 从 2000 年初就开始使用容器（Linux 容器）系统，Google 开发出来的第一个统一的容器管理系统在内部称之为 “Borg”，用来管理长时间运行的生产服务和批处理服务。由于 Borg 的规模、功能的广泛性和超高的稳定性，一直到现在 Borg 在 Google 内部依然是主要的容器管理系统。

Google 的第二套容器管理系统叫做 Omega，作为 Borg 的延伸，它的出现是出于提升 Borg 生态系统软件工程的愿望。Omega 应用到了很多在 Borg 内已经被认证的成功的模式，但是是从头开始来搭建以期更为一致的构架。由于越来越多的应用被开发并运行在 Borg 上，Google 开发了一个广泛的工具和服务的生态系统。它被应用到了很多在 Borg 内已经被认证的成功的模式，但是是从头开始来搭建以期更为一致的构架。这些系统提供了配置和更新 job 的机制，能够预测资源需求，动态地对在运行中的程序推送配置文件、服务发现、负载均衡、自动扩容、机器生命周期管理、额度管理等。许多 Omega 的创新（包括多个调度器）都被收录进了 Borg。

Google 的第三套容器管理系统就是我们所熟知的 Kubernetes，它是针对在 Google 外部的对 Linux 容器感兴趣的开发者以及 Google 在公有云底层商业增长的考虑而研发的。和 Borg、Omega 完全是谷歌内部系统相比，Kubernetes 是开源的。像 Omega 一样，Kubernetes 在其核心有一个被分享的持久存储，有组件来检测相关 object 的变化。跟 Omega 不同的是，Omega 把存储直接暴露给信任的控制平面的组件，而在 Kubernete 中，提供了完全由特定领域更高层面的版本控制、认证、语义、策略的 REST API 接口，以服务更多的用户。更重要的是，Kubernetes 是由一群底层开发能力更强的开发者开发的，他们主要的设计目标是用更容易的方法去部署和管理复杂的分布式系统，同时仍能从容器提升的效率中受益。

2014 年 Kubernetes 正式开源，2015 年被作为初创项目贡献给了云原生计算基金会（CNCF），从此开启了 Kubernetes 及云原生化的大潮。

## 参考

- [Borg, Omega, and Kubernetes: Lessons learned from three container-management systems over a decade - queue.acm.org](https://queue.acm.org/detail.cfm?id=2898444)
- [Borg、Omega 和 Kubernetes：谷歌十几年来从这三个容器管理系统中得到的经验教训 - dockone.io](http://dockone.io/article/1153)