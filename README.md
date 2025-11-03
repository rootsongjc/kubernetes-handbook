# Kubernetes 手册

[![GitHub stars](https://img.shields.io/github/stars/rootsongjc/kubernetes-handbook.svg)](https://github.com/rootsongjc/kubernetes-handbook/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/rootsongjc/kubernetes-handbook.svg)](https://github.com/rootsongjc/kubernetes-handbook/network)
[![License](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

> Kubernetes 基础教程 - 全面介绍容器编排技术的实战手册，涵盖核心架构、关键组件和实际应用。

## 关于本教程

本教程内容涵盖容器、Kubernetes、服务网格、Serverless 等云原生的多个领域，使用 Hugo 构建。

本书采用[署名 - 非商业性使用 - 相同方式共享 4.0 (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh) 协议共享。

## 什么是云原生

云原生是一种行为方式和设计理念，其本质是通过一系列技术和方法论来提高云上资源利用率和应用交付效率。云计算的发展史就是一部云原生化的历史。

从技术发展历程来看：

- **Kubernetes** 开启了云原生的序幕，提供了容器编排的标准
- **服务网格（如 Istio）** 引领了后 Kubernetes 时代的微服务治理
- **Serverless** 技术使云原生从基础设施层向应用架构层深入发展

我们正处于一个云原生技术快速演进的新时代。

## Kubernetes 简介

[Kubernetes](https://kubernetes.io) 是 Google 于 2014 年 6 月基于其内部使用的 [Borg](https://research.google/pubs/large-scale-cluster-management-at-google-with-borg/) 系统开源的容器编排调度引擎。Google 将其作为初始和核心项目贡献给 [CNCF](https://cncf.io)（云原生计算基金会），现已成为云原生生态的核心基石。

### Kubernetes 的使命

Kubernetes 的目标不仅仅是一个编排系统，而是：

- 提供规范来描述集群架构
- 定义服务的最终状态
- 使系统自动达到并维持该状态
- 作为云原生应用的操作系统

### 云原生技术栈

根据 CNCF 定义，云原生技术有利于各组织在公有云、私有云和混合云等新型动态环境中，构建和运行可弹性扩展的应用。

核心技术包括：

- **容器** - 应用打包和运行的标准单元
- **服务网格** - 微服务间通信的基础设施层
- **微服务** - 应用架构的设计模式
- **不可变基础设施** - 基础设施的管理理念
- **声明式 API** - 系统配置和管理的方式

这些技术能够构建容错性好、易于管理和便于观察的松耦合系统，结合可靠的自动化手段，使工程师能够轻松地对系统作出频繁和可预测的重大变更。

## 版本信息

本书基于 **Kubernetes v1.31+** 编写，持续更新最新的概念和 API，确保内容的时效性和准确性。

## 项目历程

Kubernetes Handbook 项目始于 2016 年底，开源于 2017 年 3 月，作为第一本系统介绍 Kubernetes 的中文电子书，经过多年持续完善和更新。

## 内容特色

本书记录了从零开始学习和使用 Kubernetes 的完整历程，具有以下特点：

- **实战导向** - 着重于经验总结和最佳实践分享
- **深入浅出** - 详细解析 Kubernetes 核心概念
- **生态完整** - 涵盖微服务、DevOps、服务网格、Serverless 等相关领域
- **持续更新** - 跟进最新技术发展和社区动态

## 在线阅读

你可以通过以下方式阅读本书：

- **官方网站**: [https://jimmysong.io/book/kubernetes-handbook/](https://jimmysong.io/book/kubernetes-handbook/)
- **GitHub**: [https://github.com/rootsongjc/kubernetes-handbook](https://github.com/rootsongjc/kubernetes-handbook)
- **PDF 下载**：[见 Release 页面](https://github.com/rootsongjc/kubernetes-handbook/releases)

## 参与贡献

欢迎提交 Issue 和 Pull Request 来改进本书！

贡献方式：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 作者

**Jimmy Song：**

- 网站：[https://jimmysong.io](https://jimmysong.io)
- GitHub: [@rootsongjc](https://github.com/rootsongjc)
- 微信公众号：几米宋

<div style="text-align: center;">
    <img src="qrcode.jpg" alt="关注微信公众号" style="max-width: 180px; width: 100%; height: auto; display: inline-block;" />
</div>

## 许可证

本项目采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh) 许可证。

## 致谢

感谢所有为本项目做出贡献的朋友们！
