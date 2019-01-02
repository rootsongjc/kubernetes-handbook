# 云原生（Cloud Native）的定义

[Pivotal](https://pivotal.io/) 是云原生应用的提出者，并推出了 [Pivotal Cloud Foundry](https://pivotal.io/platform) 云原生应用平台和 [Spring](https://spring.io/) 开源 Java 开发框架，成为云原生应用架构中先驱者和探路者。

## Pivotal最初的定义

早在2015年Pivotal公司的Matt Stine写了一本叫做[迁移到云原生应用架构](https://jimmysong.io/migrating-to-cloud-native-application-architectures/)的小册子，其中探讨了云原生应用架构的几个主要特征：

- 符合12因素应用
- 面向微服务架构
- 自服务敏捷架构
- 基于API的协作
- 抗脆弱性

我已于2017年翻译了本书，详见[迁移到云原生应用架构](https://jimmysong.io/migrating-to-cloud-native-application-architectures/)。

## CNCF最初的定义

到了2015年Google主导成立了云原生计算基金会（CNCF），起初CNCF对云原生（Cloud Native）的定义包含以下三个方面：

- 应用容器化
- 面向微服务架构
- 应用支持容器的编排调度

## 重定义

到了2018年，随着近几年来云原生生态的不断壮大，所有主流云计算供应商都加入了该基金会，且从[Cloud Native Landscape](https://i.cncf.io)中可以看出云原生有意蚕食原先非云原生应用的部分。CNCF基金会中的会员以及容纳的项目越来越多，该定义已经限制了云原生生态的发展，CNCF为云原生进行了重新定位。

以下是CNCF对云原生的重新定义（中英对照）：

> Cloud native technologies empower organizations to build and run scalable applications in modern, dynamic environments such as public, private, and hybrid clouds. Containers, service meshes, microservices, immutable infrastructure, and declarative APIs exemplify this approach.

云原生技术帮助公司和机构在公有云、私有云和混合云等新型动态环境中，构建和运行可弹性扩展的应用。云原生的代表技术包括容器、服务网格、微服务、不可变基础设施和声明式API。

> These techniques enable loosely coupled systems that are resilient, manageable, and observable. Combined with robust automation, they allow engineers to make high-impact changes frequently and predictably with minimal toil.

这些技术能够构建容错性好、易于管理和便于观察的松耦合系统。结合可靠的自动化手段，云原生技术可以使开发者轻松地对系统进行频繁并可预测的重大变更。

> The Cloud Native Computing Foundation seeks to drive adoption of this paradigm by fostering and sustaining an ecosystem of open source, vendor-neutral projects. We democratize state-of-the-art patterns to make these innovations accessible for everyone.

云原生计算基金会（CNCF）致力于培育和维护一个厂商中立的开源生态系统，来推广云原生技术。我们通过将最前沿的模式普惠，让这些创新为大众所用。

**注**：该定义的中文译本还未正式确定，详见[Cloud Native Definition in Chinese](https://github.com/cncf/toc/blob/master/DEFINITION.md)。