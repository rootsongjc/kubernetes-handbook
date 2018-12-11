# 如何参与 Istio 社区及注意事项

**注意：本文档已失效，请浏览 [Istio 官方文档](https://istio.io/zh)。本书中的 Service Mesh 章节已不再维护，请转到 [istio-handbook](https://jimmysong.io/istio-handbook) 中浏览。**

本文讲述了如何参与 Istio 社区和进行 Istio 开发时需要注意的事项。

### 工作组

绝大多数复杂的开源项目都是以工作组的方式组织的，要想为 Istio 社区做贡献可以加入到以下的工作组（Working Group）：

- [API Management](https://github.com/istio/community/blob/master/WORKING-GROUPS.md#api-management)
- [Config](https://github.com/istio/community/blob/master/WORKING-GROUPS.md#config)
- [Environments](https://github.com/istio/community/blob/master/WORKING-GROUPS.md#environments)
- [Networking](https://github.com/istio/community/blob/master/WORKING-GROUPS.md#networking)
- [Performance & Scalability](https://github.com/istio/community/blob/master/WORKING-GROUPS.md#performance-and-scalability)
- [Policies & Telemetry](https://github.com/istio/community/blob/master/WORKING-GROUPS.md#policies-and-telemetry)
- [Security](https://github.com/istio/community/blob/master/WORKING-GROUPS.md#security)
- [Test & Release](https://github.com/istio/community/blob/master/WORKING-GROUPS.md#test-and-release)

### 代码规范

Istio 的代码规范沿用 [CNCF 社区的代码规范](https://github.com/cncf/foundation/blob/master/code-of-conduct.md)。

### 开发指南

进行 Istio 开发之前需要做下面几件事情：

- 配置基础环境，如 Kubernetes
- 配置代码库、下载依赖和测试
- 配置 CircleCI 集成环境
- 编写参考文档
- Git workflow 配置

详见 [Dev Guide wiki](https://github.com/istio/istio/wiki/Dev-Guide)。

### 设计文档

所有的设计文档都保存在 [Google Drive](https://drive.google.com/drive/u/0/folders/0AIS5p3eW9BCtUk9PVA) 中，其中包括以下资源：

- Technical Oversight Committee：ToC管理的文档
- Misc：一些杂项
- Working Groups：最重要的部分，各个工作组相关的设计文档
- Presentations：Istio 相关的演讲幻灯片，从这些文稿中可以快速了解 Istio
- Logo：Istio logo
- Eng：社区相关的维护文档

### 社区角色划分

根据对开发者和要求和贡献程度的不同，Istio 社区中包含以下角色：

- [Collaborator](https://github.com/istio/community/blob/master/ROLES.md#collaborator)：非正式贡献者，偶尔贡献，任何人都可以成为该角色
- [Member](https://github.com/istio/community/blob/master/ROLES.md#member)：正式贡献者，经常贡献，必须有2个已有的 member 提名
- [Approver](https://github.com/istio/community/blob/master/ROLES.md#approver)：老手，可以批准 member 的贡献
- [Lead](https://github.com/istio/community/blob/master/ROLES.md#lead)：管理功能、项目和提议，必须由 [ToC](https://github.com/istio/community/blob/master/WORKING-GROUP-PROCESSES.md) 提名
- [Administrator](https://github.com/istio/community/blob/master/ROLES.md#administrator)：管理员，管理和控制权限，必须由 ToC 提名
- [Vendor](https://github.com/istio/community/blob/master/ROLES.md#vendor)：贡献 Istio 项目的扩展

详见 [Istio Community Roles](https://github.com/istio/community/blob/master/ROLES.md)。

### 各种功能的状态

Istio 中的所有 feature 根据**是否生产可用**、**API兼容性**、**性能**、**维护策略**分为三种状态：

- Alpha：仅仅可以作为 demo，无法生产上使用，也没有性能保证，随时都可能不维护
- Beta：可以在生产上使用了，也有版本化的 API 但是无法保证性能，保证三个月的维护
- Stable：可以上生产而且还能保证性能，API 向后兼容，保证一年的维护

Istio 的 feature 分为四大类：

- 流量管理：各种协议的支持、路由规则配置、Ingress TLS 等
- 可观察性：监控、日志、分布式追踪、服务依赖拓扑
- 安全性：各种 checker 和安全性配置
- Core：核心功能

功能划分与各种功能的状态详情请见：<https://istio.io/about/feature-stages.html>