---
title: "开源软件合规实践1：总体概述"
subtitle: "开源合规流程及最佳实践概览"
date: 2019-06-08T18:13:19+08:00
tags: ["open source","book","compliance"]
description: "本文是开源软件合规实践的开篇，从总体上介绍开源软件合规的流程及建议。"
categories: "open source"
bigimg: [{src: "https://gw.alipayobjects.com/mdn/rms_91f3e6/afts/img/A*mIa5TLcoz3sAAAAAAAAAAABkARQnAQ", desc: "Photo via Unsplash"}]
draft: false
---

开源软件合规（Compliance）实践，从狭义上讲就是企业使用开源软件许可证（License）的合规。*Recommended Open Source Compliance Practices for the Enterprise* 电子书（共32 页）由 *Ibrahim Haddad* 博士撰写（可从 [Linux Foundation](https://www.linuxfoundation.org/publications/2019/06/recommended-open-source-compliance-practices/) 网站免费下载），本书从以下几个角度为你的公司的进行开源合规实践以指导：

- 创建开源审查委员会（Open Source Review Committee）
- 代码扫描
- 软件溯源（Software Sourcing）
- 开源法务支持（Open Source Legal Support）
- 流程中的合规检查（Compliance Checkpoints）
- 开发和部署检查器
- 合规事项看板

这篇文章是该电子书的中文连载第一篇。

- [开源软件合规实践1：总体概述](/posts/open-source-compliance-practices-intro)

## 开源合规审查组

企业为了保证自己产品或软件的合规，通常会有一个许可证合规审查组，负责以下几项职责：

1. 遵守开源许可条款
1. 促进在产品和服务中使用开源
1. 遵守第三方商业软件的许可条款
1. 保护您的产品/服务差异化（知识产权/IP）

![开源促进及合规计划](https://gw.alipayobjects.com/mdn/rms_91f3e6/afts/img/A*j6i1R7LOWvsAAAAAAAAAAABkARQnAQ)

## 开源合规流程

下图是开源合规流程闭环。

![开源合规流程闭环](https://gw.alipayobjects.com/mdn/rms_91f3e6/afts/img/A*Awd9SqjQHJkAAAAAAAAAAABkARQnAQ)

该流程中分为以下三步：确认（Identify）、批准（Approve）和确知（Satisfy）。

![开源合规步骤产出](https://gw.alipayobjects.com/mdn/rms_91f3e6/afts/img/A*DodtR5wLIcEAAAAAAAAAAABkARQnAQ)

### 确认（Identify）

此初始步骤的目标是监控软件组合中开源来源，无论该组合是作为独立软件包还是嵌入在第三方或公司开发的软件中。此步骤的输出是详细的软件物料清单（Bill of Materials），用于标识所有开源软件包（Package）和代码片段（Snippet）的来源（Origin）、许可证（License）以及由软件组合分析工具所识别的许可冲突。

### 批准（Approve）

这一步的目标是：

1. 查看上一步的输出，了解管理相关源代码的使用、修改和分发的许可证；
1. 根据其独特的背景（context），确定是否批准使用已识别的开源软件；

### 确知（Satisfy）

在最后一步中，准备好所有已批准的开源软件（整个组件和片段）的许可证、版权（copyright）和归属声明，并将其交给相关的部门，以包含在产品文档中。同样，已经确知和标记了许可义务的开源软件包，就可以在产品/服务上线时发布了。

## 对企业开源合规实践的建议

作者提出了企业可以实施的实践建议，以改进和加强其开源合规性计划：

- 成立开源审查委员会（Open Source Review Board，简称 OSRB）
- 建立自动化系统来识别开源软件
- 让软件供应商遵守开源许可证
- 扩展开源法律支持
- 在业务和开发过程中集成开源合规性检查点
- 提供各种开源合规性任务的清单（checklist）
- 开发和部署支持清单
- 建立开源合规活动基准（benchmark）
- 参与关键合规性开源合规性计划