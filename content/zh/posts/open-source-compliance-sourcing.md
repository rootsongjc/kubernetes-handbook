---
title: "开源软件合规实践4：开源代码溯源"
subtitle: "软件的多源开发模型"
date: 2019-06-09T10:23:19+08:00
tags: ["open source","book","compliance"]
description: "本文是开源软件合规实践的第四篇，关于软件的多源开发模型及供应链更新实践。"
categories: "open source"
bigimg: [{src: "https://ww4.sinaimg.cn/large/006tNc79ly1g3up4d9wapj31f20l4nfm.jpg", desc: "Photo via Unsplash"}]
draft: false
notoc: true
seealso: false
---

这篇文章是 *Recommended Open Source Compliance Practices for the Enterprise* 电子书（可从 [Linux Foundation](https://www.linuxfoundation.org/publications/2019/06/recommended-open-source-compliance-practices/) 网站免费下载）的中文连载第四篇。

- [开源软件合规实践1：总体概述](/posts/open-source-compliance-practices-intro)
- [开源软件合规实践2：成立开源审查委员会（OSRB）](/posts/open-source-compliance-osrb)
- [开源软件合规实践3：开源代码审查](/posts/open-source-compliance-identify)
- [开源软件合规实践4：开源代码溯源](/posts/open-source-compliance-sourcing)
- [开源软件合规实践5：开源法务支持](/posts/open-source-compliance-legal-support)
- [开源软件合规实践6：开源合规流程中的检查点及发布清单](/posts/open-source-compliance-checkpoints)

让您的软件提供商参与开源合规中至关重要。软件提供商必须披露其可交付成果中包含的开源代码，并提供包括适用源代码在内的所有通知（notice）。

{{< gallery link="https://ww4.sinaimg.cn/large/006tNc79ly1g3upmcjnl5j31di0ncdjd.jpg" title="图 7. 多源开发模型" >}}

图 7 描绘了多源开发模型和传入源代码的各种源组合。在此模型下，产品或软件堆栈可以包含专有软件、第三方商业和第三方开源软件的任意组合。例如，除了第三方专有源代码之外，软件组件 A 可以包括专有源代码，而软件组件 B 除了可以包含来自开源项目的源代码之外还可以包括专有源代码。

当今的公司处于必须更新其供应链（软件采购）程序以解决获取和使用开源软件的状态。通常会有供应链人员参与将软件从供应商转移到贵公司。他们可以通过两种主要方式支持开源合规性活动：

- 要求第三方软件提供商披露他们在其可交付成果中使用的任何开源，以及
- 协助许可与开源软件包捆绑在一起或与之集成的第三方软件。

此领域的推荐做法是强制第三方软件提供商披露其产品中使用的所有开源组件，并声明他们计划如何满足适用的开源许可证义务。如果第三方软件包含开源，供应链必须确保在初始入口后满足开源许可证义务——您作为提供开源产品或服务的分销商将承担这些义务和责任。

---

### 开源合规实践专栏

- [开源软件合规实践1：总体概述](/posts/open-source-compliance-practices-intro)
- [开源软件合规实践2：成立开源审查委员会（OSRB）](/posts/open-source-compliance-osrb)
- [开源软件合规实践3：开源代码审查](/posts/open-source-compliance-identify)
- [开源软件合规实践4：开源代码溯源](/posts/open-source-compliance-sourcing)
- [开源软件合规实践5：开源法务支持](/posts/open-source-compliance-legal-support)
- [开源软件合规实践6：开源合规流程中的检查点及发布清单](/posts/open-source-compliance-checkpoints)

