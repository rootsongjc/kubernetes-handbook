---
title: "开源软件合规实践3：开源代码审查"
subtitle: "如何进行代码扫描以识别开源组件及片段引用"
date: 2019-06-09T09:13:19+08:00
tags: ["open source","book","compliance"]
description: "本文是开源软件合规实践的第三篇，关于如何进行代码扫描以识别开源组件及片段引用的建议。"
categories: "open source"
bigimg: [{src: "https://ww4.sinaimg.cn/large/006tNc79ly1g3unmazj3sj31mi0u04qq.jpg", desc: "Photo via Unsplash"}]
draft: false
notoc: true
seealso: false
---

这篇文章是 *Recommended Open Source Compliance Practices for the Enterprise* 电子书（可从 [Linux Foundation](https://www.linuxfoundation.org/publications/2019/06/recommended-open-source-compliance-practices/) 网站免费下载）的中文连载第三篇。

- [开源软件合规实践1：总体概述](/posts/open-source-compliance-practices-intro)
- [开源软件合规实践2：成立开源审查委员会（OSRB）](/posts/open-source-compliance-osrb)
- [开源软件合规实践3：开源代码审查](/posts/open-source-compliance-identify)
- [开源软件合规实践4：开源代码溯源](/posts/open-source-compliance-sourcing)
- [开源软件合规实践5：开源法务支持](/posts/open-source-compliance-legal-support)
- [开源软件合规实践6：开源合规流程中的检查点及发布清单](/posts/open-source-compliance-checkpoints)

开源合规性工作的核心是识别开源代码及其各自的许可证，以便组织可以满足适用的许可证义务。开源策略和流程指导此核心活动。合规性政策和流程管理开源软件的使用、贡献、审核和发布的各个方面。如果我们采用下图 5 所示的基本流程并对其进行扩展，我们将考虑端到端的合规流程。下图显示了这样一个流程，它具有源自多个源的源代码输入。源代码经过一系列步骤，流程的最终输出包括书面报价、通知列表（版权、归属、许可证），以及为履行许可义务而发布的源代码包。

图 5 提供了端到端合规流程的详细示例，其中包括软件组件被 OSRB 批准在构建系统中与软件产品集成之前经历的各个步骤。

{{< gallery link="http://ww2.sinaimg.cn/large/006tNc79ly1g3unjbh5amj31900fuac7.jpg" title="图 5. 端到端开源合规流程示例" >}}

图 6 简要描述了每个步骤中发生的情况。

{{< gallery link="http://ww3.sinaimg.cn/large/006tNc79ly1g3uzfnj1lzj327i0kuq71.jpg" title="图 6. 开源合规代码确认步骤详解" >}}

---

### 开源合规实践专栏

- [开源软件合规实践1：总体概述](/posts/open-source-compliance-practices-intro)
- [开源软件合规实践2：成立开源审查委员会（OSRB）](/posts/open-source-compliance-osrb)
- [开源软件合规实践3：开源代码审查](/posts/open-source-compliance-identify)
- [开源软件合规实践4：开源代码溯源](/posts/open-source-compliance-sourcing)
- [开源软件合规实践5：开源法务支持](/posts/open-source-compliance-legal-support)
- [开源软件合规实践6：开源合规流程中的检查点及发布清单](/posts/open-source-compliance-checkpoints)

