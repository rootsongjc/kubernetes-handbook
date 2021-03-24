# 云原生（Cloud Native）的定义

云原生（Cloud Native）这个词汇由来已久，以致于何时出现已无据可考。云原生开始大规模出现在受众视线中，与 Pivotal 提出的云原生应用的理念有着莫大的关系。我们现在谈到云原生，更多的指的是[一种文化](https://cloudnative.to/blog/cloud-native-culture-not-container/)，而不具象为哪些技术体系。

> Pivotal 推出过 Pivotal Cloud Foundry 云原生应用平台和 [Spring](https://spring.io/) 开源 Java 开发框架，成为云原生应用架构中先驱者和探路者。Pivotal 是云原生应用平台第一股，2018 年在纽交所上市，2019 年底被 VMWare 以 27 亿美元收购，加入到 VMware 新的产品线 [Tanzu](https://tanzu.vmware.com/)。

## Pivotal 最初的定义

早在 2015 年 Pivotal 公司的 Matt Stine 写了一本叫做 [迁移到云原生应用架构](https://jimmysong.io/migrating-to-cloud-native-application-architectures/) 的小册子，其中探讨了云原生应用架构的几个主要特征：

- 符合 12 因素应用
- 面向微服务架构
- 自服务敏捷架构
- 基于 API 的协作
- 抗脆弱性

我已于 2017 年翻译了本书，详见 [迁移到云原生应用架构](https://jimmysong.io/migrating-to-cloud-native-application-architectures/)。

## CNCF 最初的定义

到了 2015 年 Google 主导成立了云原生计算基金会（CNCF），起初 CNCF 对云原生（Cloud Native）的定义包含以下三个方面：

- 应用容器化
- 面向微服务架构
- 应用支持容器的编排调度

## 重定义

到了 2018 年，随着近几年来云原生生态的不断壮大，所有主流云计算供应商都加入了该基金会，且从 [Cloud Native Landscape](https://i.cncf.io) 中可以看出云原生有意蚕食原先非云原生应用的部分。CNCF 基金会中的会员以及容纳的项目越来越多，该定义已经限制了云原生生态的发展，CNCF 为云原生进行了重新定位。

以下是 CNCF 对云原生的重新定义（中英对照）：

> Cloud native technologies empower organizations to build and run scalable applications in modern, dynamic environments such as public, private, and hybrid clouds. Containers, service meshes, microservices, immutable infrastructure, and declarative APIs exemplify this approach.

云原生技术有利于各组织在公有云、私有云和混合云等新型动态环境中，构建和运行可弹性扩展的应用。云原生的代表技术包括容器、服务网格、微服务、不可变基础设施和声明式 API。

> These techniques enable loosely coupled systems that are resilient, manageable, and observable. Combined with robust automation, they allow engineers to make high-impact changes frequently and predictably with minimal toil.

这些技术能够构建容错性好、易于管理和便于观察的松耦合系统。结合可靠的自动化手段，云原生技术使工程师能够轻松地对系统作出频繁和可预测的重大变更。

> The Cloud Native Computing Foundation seeks to drive adoption of this paradigm by fostering and sustaining an ecosystem of open source, vendor-neutral projects. We democratize state-of-the-art patterns to make these innovations accessible for everyone.

云原生计算基金会（CNCF）致力于培育和维护一个厂商中立的开源生态系统，来推广云原生技术。我们通过将最前沿的模式民主化，让这些创新为大众所用。

## 总结

关于什么是云原生的争论还在进行中，在笔者看来云原生是一种行为方式和设计理念，究其本质，凡是能够提高云上资源利用率和应用交付效率的行为或方式都是云原生的。云计算的发展史就是一部云原生化的历史。Kubernetes 开启了云原生 1.0 的序幕，服务网格 Istio 的出现，引领了后 Kubernetes 时代的微服务，serverless 的再次兴起，使得云原生从基础设施层不断向应用架构层挺进，我们正处于一个云原生 2.0 的新时代。

## 参考

- [CNCF Cloud Native Definition v1.0 - github.com](https://github.com/cncf/toc/blob/master/DEFINITION.md)
- [云原生关乎文化，而不是容器 - cloudnative.to](https://cloudnative.to/blog/cloud-native-culture-not-container/)
