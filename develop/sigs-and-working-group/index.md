---
weight: 104
linktitle: SIG 和 WG
title: Kubernetes 社区组织：SIG 和工作组
date: '2024-01-15T00:00:00+08:00'
type: book
keywords:
- kubernetes
- SIG
- 工作组
- 社区
- 开源
- 协作
- 治理
---

Kubernetes 社区采用 **SIG**（Special Interest Group，特别兴趣小组）和**工作组**（Working Group）的组织形式，通过这种分布式治理模式来推动项目的发展和维护。

## 社区组织架构

![Kubernetes 社区组织结构](https://assets.jimmysong.io/images/book/kubernetes-handbook/develop/sigs-and-working-group/kubernetes-sigs.webp)
{width=2146 height=1868}

### 沟通方式

- **会议**：各 SIG 和工作组定期召开视频会议
- **Slack**：日常讨论和快速沟通
- **邮件列表**：正式通知和深度技术讨论
- **GitHub**：代码协作和 issue 跟踪

## 主要 SIG 列表

### 🔧 核心基础设施

- **api-machinery**：API 服务器、注册发现、CRUD 语义、准入控制、编码解码、持久化层（etcd）、OpenAPI 规范
- **architecture**：维护 Kubernetes 架构设计的一致性和原则
- **auth**：认证、授权、权限管理和安全策略
- **etcd**：etcd 数据库的维护和改进
- **instrumentation**：可观测性最佳实践，包括指标、日志、事件和追踪

### 🚀 应用和工作负载

- **apps**：应用部署和运维，关注开发者和 DevOps 体验
- **batch**：批处理工作负载，如 Job 和 CronJob
- **autoscaling**：集群自动扩缩容、Pod 水平/垂直扩缩容、资源管理

### 🌐 网络和存储

- **network**：网络策略、CNI、服务发现、负载均衡
- **storage**：存储卷、CSI 插件、存储类和持久化
- **multicluster**：多集群管理、服务网格、跨集群通信

### ☁️ 云平台支持

- **cloud-provider**：云提供商集成和支持
- **cluster-api**：声明式集群生命周期管理 API

### 🔨 工具和开发体验

- **cli**：kubectl 和其他命令行工具
- **testing**：测试框架、CI/CD 流程
- **release**：版本发布、质量控制、发布流程

### 🏗️ 运维和部署

- **cluster-lifecycle**：集群部署、升级和生命周期管理
- **node**：节点管理、kubelet、容器运行时
- **scheduling**：资源调度算法和策略

### 📚 社区和文档

- **contributor-experience**：贡献者体验和社区健康
- **docs**：文档维护、翻译和发布流程

### 🖥️ 平台特定

- **windows**：Windows 容器支持
- **iot-edge**：物联网和边缘计算场景

## 工作组列表

工作组通常是跨 SIG 的临时性组织，专注于特定的短期目标：

- **Data Protection**：数据保护和备份恢复解决方案
- **Structured Logging**：结构化日志记录标准化
- **Device Management**：设备管理和硬件资源分配
- **Serving**：机器学习模型服务化工作负载

## 如何参与

1. **选择感兴趣的 SIG**：根据你的技术兴趣和专长选择相应的 SIG
2. **参加会议**：定期参加 SIG 会议，了解最新进展
3. **贡献代码**：通过 GitHub 提交 PR 和 Issue
4. **参与讨论**：在 Slack 频道和邮件列表中积极参与技术讨论

## 参考资源

- [官方 SIG 列表](https://github.com/kubernetes/community/blob/master/sig-list.md)
- [Kubernetes 社区仓库](https://github.com/kubernetes/community)
- [贡献者指南](https://kubernetes.io/docs/contribute/)
