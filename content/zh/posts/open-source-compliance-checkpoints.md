---
title: "开源软件合规实践6：开源合规流程中的检查点及发布清单"
subtitle: "在开源合规流程中纳入检查点及发布前检查清单"
date: 2019-06-09T14:01:19+08:00
tags: ["open source","book","compliance"]
description: "本文是开源软件合规实践的第六篇，关于如何在开源合规流程中纳入检查点，在软件发布前检查清单。"
categories: "open source"
bigimg: [{src: "https://gw.alipayobjects.com/mdn/rms_91f3e6/afts/img/A*XM3SRJFETWEAAAAAAAAAAABkARQnAQ", desc: "Photo via Unsplash"}]
draft: false
notoc: true
---

这篇文章是 *Recommended Open Source Compliance Practices for the Enterprise* 电子书（可从 [Linux Foundation](https://www.linuxfoundation.org/publications/2019/06/recommended-open-source-compliance-practices/) 网站免费下载）的中文连载第六篇。

- [开源软件合规实践1：总体概述](/posts/open-source-compliance-practices-intro)
- [开源软件合规实践2：成立开源审查委员会（OSRB）](/posts/open-source-compliance-osrb)
- [开源软件合规实践3：开源代码审查](/posts/open-source-compliance-identify)
- [开源软件合规实践4：开源代码溯源](/posts/open-source-compliance-sourcing)
- [开源软件合规实践5：开源法务支持](/posts/open-source-compliance-legal-support)
- [开源软件合规实践6：开源合规流程中的检查点及发布清单](/posts/open-source-compliance-checkpoints)

## 在开源合规流程中纳入检查点

有必要将合规性实践纳入开发流程，以确保开源合规工作的成功。您可以通过多种方式实现这一目标。

1. **每个内部版本的合规性**：更新流程管理，以确保在产品开发周期中尽早包含开源合规性活动，以使组织能够满足其发布时间表。遵循此模型，未来版本的增量合规性也变得简单明了。
2. **更新供应链程序**：定制供应链的供应商选择程序，以确保在对供应商及其可交付成果进行尽职调查（Due Diligence）时考虑开源合规性要求。
3. **执行验证**：使用验证步骤确保在发生发行外部版本之前满足所有合规性要求。
4. **培训员工**：为所有员工提供开源合规培训。
5. **采用 SPDX 报告许可证信息**：以 SDPX 格式提供许可证信息，以尽量减少任何可能的错误，并标准化报告信息的方式。

> **SPDX**
>
> [SPDX®](https://spdx.org/)（Software Package Data Exchange®）是用于传达软件物料清单信息（包括组件、许可证、版权和安全参考）的开放标准。
>
> SPDX 通过为公司和社区提供共享格式来共享软件许可、版权和安全参考的重要数据，从而简化和改进合规性，从而减少冗余工作。
>
> SPDX 规范由 SPDX 工作组开发，该工作组由 Linux 基金会托管。基层工作包括来自 20 多个组织的代表——软件、系统和工具供应商、基金会和系统集成商——都致力于为软件包数据交换格式创建标准。

## 开发和部署清单

清单很有用，可确保执行合规性任务的一致性和完整性。强烈建议根据员工职责建立合规里程碑清单和目标清单。

清单的示例包括：

- 批准将传入代码集成到产品的源代码存储库之前的核对表
- 确保履行义务的清单
- 开发人员的清单
- 工程经理的清单
- 合规人员清单
- 开源法律人员的清单
- 软件采购人员清单

为了说明这一点，我们提供了一个示例清单，展示了在组织发布源代码包之前必须检查的各种任务，以履行在交付产品中包含的开源代码的许可义务：

预发行清单（Pre-Distribution Checklist）

- 验证引入开源软件包的修改是否已记录，并作为更改日志的一部分包含在开源发行说明中。
- 确保每个修改后的源代码文件都包含版权声明，免责声明和通用“更改日志”（Changelog）条目的附加条目。
- 确认源代码包的所有内容均已由工程团队审核并由 OSRB 确认。
- 确保在非公司标准 Linux 计算机上编译开源软件包。此步骤的目标是确保您要发布的开源软件包在通用最终用户系统上进行编译。
- 将产品手册更新为：
     - 提及该产品包含开源软件。
     - 包括与产品中包含的不同开源软件相对应的所有许可证的列表。
     - 提供适当的版权和归属通知。
     - 通过网页下载或通过产品手册中提供的指定地址通过电子邮件或邮寄方式与贵公司联系，说明如何访问开源软件包的代码（书面提供）。
 - 执行语言检查（linguistic review）以确保源代码中没有任何不适当的注释。
   - 注意：有些公司忘记进行语言检查，当代码发布时，他们会因源代码中留下的不当注释而尴尬。执行语言检查的另一个重要原因是确保源代码和注释不涉及未来的产品代码名称或功能。
- 确保现有许可、版权和归属通知不受干扰。
    - 验证要分发的源代码是否与产品一起使用的二进制文件对应，源代码构建到与产品一起分发的同一个库中，并且源代码分发中包含适当的指令（除时间/日期戳外派生的二进制文件通常是相同的）。
    - 验证包是否遵循开源策略中定义的链接关系和交互。
    - 确保在开源软件包的根文件夹中的 LICENSE 文件中包含许可证文本的副本（如果尚未存在）。
    - 如果源代码包需要特殊的构建工具或环境设置，则将详细信息包含在 README 文件或类似文件中。
   这些清单，特别是在实现自动化并与业务和开发流程集成时，可以提醒您必须完成的所有事项，以确保合规性并减少发生错误的几率。

## 最后

本书中的最后还推广了波 OpenChain 项目，该项目提供了一组自我认证的选项，由该领域的利益相关者创建，用于合规性规范，该规范允许给定的组织进行自我测试并声明其遵守特定的合规级别。您可以访问 **https://www.openchainproject.org/conformance** 了解更多信息。

---

### 开源合规实践专栏

- [开源软件合规实践1：总体概述](/posts/open-source-compliance-practices-intro)
- [开源软件合规实践2：成立开源审查委员会（OSRB）](/posts/open-source-compliance-osrb)
- [开源软件合规实践3：开源代码审查](/posts/open-source-compliance-identify)
- [开源软件合规实践4：开源代码溯源](/posts/open-source-compliance-sourcing)
- [开源软件合规实践5：开源法务支持](/posts/open-source-compliance-legal-support)
- [开源软件合规实践6：开源合规流程中的检查点及发布清单](/posts/open-source-compliance-checkpoints)

