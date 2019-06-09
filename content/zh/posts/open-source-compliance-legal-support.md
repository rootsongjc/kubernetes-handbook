---
title: "开源软件合规实践5：开源法务支持"
subtitle: "如何进行代码扫描以识别开源组件及片段引用"
date: 2019-06-09T11:13:19+08:00
tags: ["open source","book","compliance"]
description: "本文是开源软件合规实践的第五篇，关于开源 License 使用及法务支持的建议。"
categories: "open source"
bigimg: [{src: "http://ww2.sinaimg.cn/large/006tNc79ly1g3uqftlpthj31f20o0h33.jpg", desc: "Photo via Unsplash"}]
draft: false
notoc: true
seealso: false
---

这篇文章是 *Recommended Open Source Compliance Practices for the Enterprise* 电子书（可从 [Linux Foundation](https://www.linuxfoundation.org/publications/2019/06/recommended-open-source-compliance-practices/) 网站免费下载）的中文连载第五篇。

- [开源软件合规实践1：总体概述](/posts/open-source-compliance-practices-intro)
- [开源软件合规实践2：成立开源审查委员会（OSRB）](/posts/open-source-compliance-osrb)
- [开源软件合规实践3：开源代码审查](/posts/open-source-compliance-identify)
- [开源软件合规实践4：开源代码溯源](/posts/open-source-compliance-sourcing)
- [开源软件合规实践5：开源法务支持](/posts/open-source-compliance-legal-support)
- [开源软件合规实践6：开源合规流程中的检查点及发布清单](/posts/open-source-compliance-checkpoints)

## 提供便捷的法务支持

大多数组织都会创建开源合规性计划并建立核心团队以确保合规性。大多数公司往往会会与开源法律支持的瓶颈，因为您公司里可能有成百上千的使用和集成开源代码的开发人员，而很少有法务人员提供所需的法律支持。扩展开源法律支持需要一些`开箱即用`的思考，但可以借助以下实用方法实现。

## 许可证手册（License Playbooks）

提供面向软件开发人员的易于阅读和摘要的开源许可证摘要。提供有关这些许可证的易于理解的信息，例如许可证授予、限制、义务、专利影响等。使用开源软件许可证手册可以大量减少发送给法律顾问的基本问题的数量，并为开发人员提供了对常见查询的即时指导、信息和答案。

## 许可证兼容性矩阵（License Compatibility Matrix）

许可证兼容性是指确定某个许可证是否与另一个许可证兼容。GPL 兼容性是指确定某个许可证是否与 GPL 条款兼容。当合并源自不兼容许可下软件组件的源代码时，开发团队经常会遇到许可兼容性问题。当开发团队将不同许可证下的代码组合在一起时，可以参考许可证兼容性矩阵来验证在单个软件组件中是否存在加入源代码的许可冲突。如果开发团队使用的许可证源不在矩阵中，则可以后续获得法律顾问的建议。

## 许可证分类

为了减少开源法律顾问收到的问题数量并增加许可和合规流程教育，一些公司选择在几个类别下对其产品中最常用的许可进行分类。图11显示了许可证分类系统的一个简单示例，其中大多数使用的开源许可证分为四类。

{{< gallery link="http://ww3.sinaimg.cn/large/006tNc79ly1g3ur9rfeqaj310c0gkdip.jpg" title="图 8. 开源许可证分类（仅供参考）" >}}

上述许可证类别是对许可证进行分类的简单方法，使开发人员在根据这些许可证集成代码时更容易了解操作过程。下面这个例子是开发人员想要使用在以下许可下的开源软件包的：

- License A - Action：尽管用，没有什么问题
- License E - Action：获得工程经理的批准
- License I - Action：获得法律顾问的批准
- License M - Action：根据政策禁止适用该 License
- 其他 - Action：向经理询问行动方案

有关此话题的进一步阅读，我们建议阅读**[扩展开源法律支持的实用建议](https://www2.thelinuxfoundation.org/pub-practical-advice-to-scale-legal)**。本文探讨了法律顾问在确保开源合规方面的作用，并为法律顾问提供了可以为软件开发团队提供的实用建议。这些实用建议将使软件开发人员能够做出与开源许可相关的日常决策，而无需再去找负责每个问题的法律顾问。

---

### 开源合规实践专栏

- [开源软件合规实践1：总体概述](/posts/open-source-compliance-practices-intro)
- [开源软件合规实践2：成立开源审查委员会（OSRB）](/posts/open-source-compliance-osrb)
- [开源软件合规实践3：开源代码审查](/posts/open-source-compliance-identify)
- [开源软件合规实践4：开源代码溯源](/posts/open-source-compliance-sourcing)
- [开源软件合规实践5：开源法务支持](/posts/open-source-compliance-legal-support)
- [开源软件合规实践6：开源合规流程中的检查点及发布清单](/posts/open-source-compliance-checkpoints)

