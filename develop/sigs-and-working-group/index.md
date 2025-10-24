---
weight: 104
linktitle: SIG 和 WG
title: Kubernetes 社区组织：SIG 和工作组
description: 本文系统梳理 Kubernetes 社区组织架构、主要 SIG/WG 列表、参与路径及资源，帮助读者高效融入全球云原生生态。
date: 2025-10-20T00:00:00+08:00
lastmod: 2025-10-20T03:53:28.181Z
---

Kubernetes 社区通过 SIG（特别兴趣小组）和工作组的分布式治理模式，推动项目持续创新与健康发展。本文系统梳理 2025 年社区组织架构、主要 SIG/WG 列表、参与路径及资源，帮助读者高效融入全球云原生生态。

## 社区组织架构

Kubernetes 社区采用多层次治理结构，确保决策分布、协作透明和社区包容。

```mermaid "Kubernetes 社区组织架构"
graph TD
    subgraph "治理层"
        SC["指导委员会<br/>Steering Committee"]
        TC["技术委员会<br/>Technical Committee"]
    end

    subgraph "协调层"
        EC["选举委员会<br/>Election Committee"]
        CCC["社区联络委员会<br/>Community Communications"]
    end

    subgraph "执行层"
        SIGS["SIGs<br/>特别兴趣小组<br/>30+ 活跃小组"]
        WGS["Working Groups<br/>工作组<br/>临时专项小组"]
        COMMITTEES["专项委员会<br/>Code of Conduct<br/>Security Response"]
    end

    subgraph "支持层"
        CONTRIBUTOR_SUMMIT["贡献者峰会"]
        KUBE_CON["KubeCon + CloudNativeCon"]
        OFFICE_HOURS["办公时间<br/>Community Office Hours"]
    end

    SC --> SIGS
    SC --> WGS
    TC --> SIGS
    EC --> SC
    CCC --> CONTRIBUTOR_SUMMIT
    SIGS --> OFFICE_HOURS
    WGS --> KUBE_CON

    style SC fill:#e3f2fd
    style TC fill:#f3e5f5
    style SIGS fill:#e8f5e8
    style WGS fill:#fff3e0
```

![Kubernetes 社区组织架构](98bae3d277ee07f68a946996b386a5ba.svg)
{width=1920 height=1279}

### 治理原则

Kubernetes 社区治理遵循以下原则，保障开放与可持续发展：

- **分布式决策**：权力分散到各个 SIG，避免单点故障。
- **透明协作**：所有讨论公开，决策过程可追溯。
- **包容性**：欢迎来自不同背景的贡献者参与。
- **可持续性**：确保社区健康发展和知识传承。

### 沟通方式

社区采用多元化沟通渠道，支持同步与异步协作。

```mermaid "Kubernetes 社区沟通方式"
graph TD
    subgraph "同步沟通"
        MEETINGS["定期会议<br/>Zoom/Google Meet<br/>双周/月度"]
        OFFICE_HOURS["办公时间<br/>即兴问答<br/>每周固定"]
        CONTRIBUTOR_SUMMIT["贡献者峰会<br/>面对面交流<br/>每年举办"]
    end

    subgraph "异步沟通"
        SLACK["Slack<br/>实时聊天<br/>#sig-xxx频道"]
        DISCORD["Discord<br/>社区服务器<br/>语音+文字"]
        GITHUB_DISCUSSIONS["GitHub Discussions<br/>深度讨论<br/>问题追踪"]
        MAILING_LISTS["邮件列表<br/>正式通知<br/>kubernetes-sig-xxx@googlegroups.com"]
    end

    subgraph "协作工具"
        GITHUB["GitHub<br/>代码协作<br/>PR/Issue管理"]
        ZULIP["Zulip<br/>结构化聊天<br/>话题组织"]
        CALENDAR["社区日历<br/>会议安排<br/>Google Calendar"]
    end

    MEETINGS --> OFFICE_HOURS
    SLACK --> DISCORD
    GITHUB --> GITHUB_DISCUSSIONS
    MAILING_LISTS --> CALENDAR
```

![Kubernetes 社区沟通方式](4054aefebac3358dbff4c299a34d919d.svg)
{width=2141 height=705}

- **会议平台**：主要使用 Zoom/Google Meet，支持实时字幕和录制。
- **即时通讯**：Slack 为主，Discord 为补充，支持语音频道。
- **异步讨论**：GitHub Discussions 替代传统邮件，Zulip 用于结构化对话。
- **文档协作**：Google Docs/Microsoft Teams，支持实时协作。
- **视频存档**：YouTube 频道存储会议录像，便于后续查看。

## 主要 SIG 列表

Kubernetes 社区 SIG 覆盖核心基础设施、应用、网络、云平台、开发工具、运维、社区等多个领域。

```mermaid "Kubernetes 主要 SIG 列表"
graph TD
    subgraph "核心基础设施"
        API[api-machinery<br/>API服务器]
        ARCH[architecture<br/>架构设计]
        AUTH[auth<br/>认证授权]
        ETCD[etcd<br/>数据库]
        INSTR[instrumentation<br/>可观测性]
    end

    subgraph "应用与工作负载"
        APPS[apps<br/>应用部署]
        BATCH[batch<br/>批处理]
        AUTOSCALE[autoscaling<br/>自动扩缩容]
        SERVING[serving<br/>服务化工作负载]
        AI_ML[ai-ml<br/>AI/ML集成]
    end

    subgraph "网络与存储"
        NETWORK[network<br/>网络策略]
        STORAGE[storage<br/>存储卷]
        MULTICLUSTER[multicluster<br/>多集群]
    end

    subgraph "云平台与集群"
        CLOUD_PROVIDER[cloud-provider<br/>云提供商]
        CLUSTER_API[cluster-api<br/>集群API]
        CLUSTER_LIFECYCLE[cluster-lifecycle<br/>集群生命周期]
    end

    subgraph "开发工具"
        CLI[cli<br/>命令行工具]
        TESTING[testing<br/>测试框架]
        RELEASE[release<br/>版本发布]
        DEV_TOOLS[dev-tools<br/>开发工具链]
    end

    subgraph "运维与调度"
        NODE[node<br/>节点管理]
        SCHEDULING[scheduling<br/>资源调度]
    end

    subgraph "社区与文档"
        CONTRIBUTOR[contributor-experience<br/>贡献者体验]
        DOCS[docs<br/>文档维护]
    end

    subgraph "平台特定"
        WINDOWS[windows<br/>Windows支持]
        IOT_EDGE[iot-edge<br/>物联网边缘]
        WASM[wasm<br/>WebAssembly]
        SERVERLESS[serverless<br/>Serverless]
        SECURITY[security<br/>安全专项]
    end

    API --> ARCH
    ARCH --> AUTH
    APPS --> SERVING
    SERVING --> AI_ML
    NETWORK --> MULTICLUSTER
    CLOUD_PROVIDER --> CLUSTER_API
    CLI --> DEV_TOOLS
    NODE --> SCHEDULING
    CONTRIBUTOR --> DOCS
    WINDOWS --> WASM
    IOT_EDGE --> SERVERLESS
    AUTH --> SECURITY
```

![Kubernetes 主要 SIG 列表](18196d19ae94a440d97d3ca32f172579.svg)
{width=4876 height=1268}

**核心基础设施**

- **api-machinery**：API 服务器、注册发现、CRUD 语义、准入控制、编码解码、持久化层（etcd）、OpenAPI 规范  
  - 领导者：Jordan Liggitt (Google)
  - 会议：每周二 9:00 PST

- **architecture**：维护 Kubernetes 架构设计的一致性和原则  
  - 领导者：Stephen Augustus (Cisco)
  - 会议：每月第二个周三

- **auth**：认证、授权、权限管理和安全策略  
  - 领导者：Jordan Liggitt (Google)
  - 会议：每周四 9:00 PST

- **etcd**：etcd 数据库的维护和改进  
  - 领导者：Marek Siarkowicz (Google)
  - 会议：每月第一个周二

- **instrumentation**：可观测性最佳实践，包括指标、日志、事件和追踪  
  - 领导者：Han Kang (Google)
  - 会议：每周三 8:00 PST

**应用和工作负载**

- **apps**：应用部署和运维，关注开发者和 DevOps 体验  
  - 领导者：Maciej Szulik (Red Hat)
  - 会议：每周五 10:00 PST

- **batch**：批处理工作负载，如 Job 和 CronJob  
  - 领导者：Michael Michael (Red Hat)
  - 会议：每月第三个周四

- **autoscaling**：集群自动扩缩容、Pod 水平/垂直扩缩容、资源管理  
  - 领导者：Viji Sarathy (Google)
  - 会议：每周二 9:00 PST

- **serving**：服务化工作负载，包括 Knative 和模型服务  
  - 领导者：Kendall Nelson (Google)
  - 会议：每周四 9:00 PST

- **ai-ml**：AI/ML 工作负载集成和最佳实践 *(2025 年新增)*  
  - 领导者：Kubeflow 社区联合领导
  - 会议：每周三 8:00 PST

**网络和存储**

- **network**：网络策略、CNI、服务发现、负载均衡  
  - 领导者：Tim Hockin (Google)
  - 会议：每周三 14:00 PST

- **storage**：存储卷、CSI 插件、存储类和持久化  
  - 领导者：Saad Ali (Google)
  - 会议：每周四 14:00 PST

- **multicluster**：多集群管理、服务网格、跨集群通信  
  - 领导者：Jeremy Olmsted-Thompson (Google)
  - 会议：每周五 9:00 PST

**云平台支持**

- **cloud-provider**：云提供商集成和支持  
  - 领导者：Andrew Sy Kim (Google)
  - 会议：每周二 15:00 PST

- **cluster-api**：声明式集群生命周期管理 API  
  - 领导者：Vince Prignano (VMware)
  - 会议：每周四 10:00 PST

**工具和开发体验**

- **cli**：kubectl 和其他命令行工具  
  - 领导者：Maciej Szulik (Red Hat)
  - 会议：每月第二个周二

- **testing**：测试框架、CI/CD 流程  
  - 领导者：Steve Kuznetsov (Red Hat)
  - 会议：每周五 10:00 PST

- **release**：版本发布、质量控制、发布流程  
  - 领导者：Sascha Grunert (SUSE)
  - 会议：每周二 13:00 PST

- **dev-tools**：开发工具链和 SDK *(2025 年新增)*  
  - 领导者：开源社区联合领导
  - 会议：每月第三个周五

**运维和部署**

- **cluster-lifecycle**：集群部署、升级和生命周期管理  
  - 领导者：Fabrizio Pandini (VMware)
  - 会议：每周三 10:00 PST

- **node**：节点管理、kubelet、容器运行时  
  - 领导者：Dawn Chen (Google)
  - 会议：每周五 9:00 PST

- **scheduling**：资源调度算法和策略  
  - 领导者：Kensei Nakada (Tetrate)
  - 会议：每周三 9:00 PST

**社区和文档**

- **contributor-experience**：贡献者体验和社区健康  
  - 领导者：Nabarun Pal (Microsoft)
  - 会议：每月第一个周三

- **docs**：文档维护、翻译和发布流程  
  - 领导者：Tim Bannister (The Scale Factory)
  - 会议：每周四 8:00 PST

**平台特定和新兴技术**

- **windows**：Windows 容器支持  
  - 领导者：Mark Rossetti (Microsoft)
  - 会议：每周五 15:00 PST

- **iot-edge**：物联网和边缘计算场景  
  - 领导者：Jorge Alarcon (Red Hat)
  - 会议：每月第四个周四

- **wasm**：WebAssembly 工作负载支持 *(2025 年新增)*  
  - 领导者：开源社区联合领导
  - 会议：每月第二个周五

- **serverless**：Serverless 计算模式 *(2025 年新增)*  
  - 领导者：Knative 社区联合领导
  - 会议：每周五 11:00 PST

- **security**：安全专项和最佳实践 *(2025 年新增)*  
  - 领导者：Tabitha Sable (Google)
  - 会议：每周一 14:00 PST

## 工作组列表

工作组（WG）是跨 SIG 的临时性组织，专注于特定短期目标和新兴技术领域。

```mermaid "Kubernetes 工作组结构"
graph TD
    subgraph "基础设施专项"
        WG_DATA_PROTECTION["Data Protection<br/>数据保护<br/>跨SIG备份恢复"]
        WG_MULTICLUSTER["Multicluster<br/>多集群<br/>集群联邦化"]
        WG_EDGE["Edge<br/>边缘计算<br/>IoT和边缘场景"]
    end

    subgraph "新兴技术"
        WG_AI_ML["AI/ML<br/>人工智能<br/>ML工作负载标准"]
        WG_WASM["WASM<br/>WebAssembly<br/>字节码工作负载"]
        WG_SERVERLESS["Serverless<br/>无服务器<br/>函数即服务"]
    end

    subgraph "开发工具"
        WG_DEV_TOOLS["Dev Tools<br/>开发工具<br/>工具链标准化"]
        WG_SECURITY["Security<br/>安全<br/>安全最佳实践"]
        WG_COMPLIANCE["Compliance<br/>合规<br/>监管合规框架"]
    end

    subgraph "社区运营"
        WG_CONTRIBUTOR["Contributor Experience<br/>贡献者体验<br/>新人引导"]
        WG_DIVERSITY["Diversity & Inclusion<br/>多样性包容<br/>社区包容性"]
    end

    WG_DATA_PROTECTION --> WG_MULTICLUSTER
    WG_EDGE --> WG_AI_ML
    WG_WASM --> WG_SERVERLESS
    WG_DEV_TOOLS --> WG_SECURITY
    WG_COMPLIANCE --> WG_CONTRIBUTOR
    WG_DIVERSITY --> WG_CONTRIBUTOR
```

![Kubernetes 工作组结构](fba39fec25dc23eab77e13b9aa2eb8f7.svg)
{width=1962 height=422}

### 活跃工作组详情

- **Data Protection**：数据保护和备份恢复解决方案  
  - 牵头 SIG：storage, apps
  - 目标：标准化 Kubernetes 数据保护 API
  - 状态：活跃，计划 2026 年转为 SIG

- **Multicluster**：多集群管理和集群联邦化  
  - 牵头 SIG：multicluster, cluster-api
  - 目标：统一多集群管理接口
  - 状态：活跃，与 SIG-multicluster 密切合作

- **AI/ML**：人工智能和机器学习工作负载 *(2025 年新增)*  
  - 牵头 SIG：ai-ml, serving
  - 目标：定义 AI/ML 工作负载标准和最佳实践
  - 状态：高度活跃，社区关注度高

- **Security**：安全专项和最佳实践 *(2025 年重组)*  
  - 牵头 SIG：security, auth
  - 目标：建立全面的安全框架和指南
  - 状态：战略级重要性

- **Serverless**：无服务器计算模式  
  - 牵头 SIG：serverless, serving
  - 目标：标准化 Serverless 工作负载
  - 状态：与 Knative 社区深度合作

- **WASM**：WebAssembly 工作负载支持 *(2025 年新增)*  
  - 牵头 SIG：wasm, node
  - 目标：在 Kubernetes 中运行 WASM 应用
  - 状态：快速发展中

- **Edge**：边缘计算和物联网场景  
  - 牵头 SIG：iot-edge, network
  - 目标：边缘部署和管理的标准化
  - 状态：工业物联网应用驱动

## 如何参与

想要参与 Kubernetes 社区，可以按照以下流程逐步深入：

```mermaid "Kubernetes 参与路径"
flowchart TD
    A[发现兴趣] --> B[选择SIG/WG]
    B --> C[加入Slack频道]
    C --> D[参加会议]
    D --> E[阅读文档]
    E --> F[开始贡献]

    F --> G[小贡献开始]
    G --> H[深度参与]
    H --> I[成为Reviewer]
    I --> J[成为Approver/Maintainer]

    A --> A1["浏览SIG列表<br/>参加Office Hours"]
    B --> B1["查看会议日历<br/>加入邮件列表"]
    C --> C1["#sig-xxx频道<br/>#wg-xxx频道"]
    D --> D1["观看录像<br/>实时参与"]
    E --> E1["KEP文档<br/>设计提案"]
    F --> F1["修复文档<br/>编写测试"]
    G --> G1["提交PR<br/>修复bug"]
    H --> H1["设计评审<br/>代码审查"]
    I --> I1["SIG成员<br/>技术决策"]
    J --> J1["核心维护者<br/>架构决策"]
```

![Kubernetes 参与路径](dba5c6104ecc66ba4abf587bf0311935.svg)
{width=1920 height=2598}

### 参与步骤

1. **发现兴趣领域**  
   浏览 [SIG 列表](https://github.com/kubernetes/community/blob/master/sig-list.md)、参加社区办公时间（Office Hours）、阅读 [贡献者指南](https://kubernetes.io/docs/contribute/)。

2. **选择合适的 SIG/WG**  
   根据技术专长匹配，查看会议日历和活跃度，加入相关 Slack 频道（#sig-xxx, #wg-xxx）。

3. **开始参与**  
   订阅邮件列表（kubernetes-sig-xxx@googlegroups.com），观看会议录像了解讨论内容，在 GitHub 上关注相关仓库。

4. **贡献内容**  
   从小任务开始：文档修复、测试编写，参与代码审查和设计讨论，提交功能增强和 bug 修复。

5. **职业发展**  
   成为 SIG 成员和 Reviewer，参与技术决策和架构设计，晋升为 Approver 和 Maintainer。

### 贡献者级别

- **新手贡献者**：修复文档、编写测试、报告问题
- **活跃贡献者**：提交 PR、参与代码审查
- **评审者 (Reviewer)**：批准 PR、指导新人
- **批准者 (Approver)**：最终批准变更、维护代码质量
- **维护者 (Maintainer)**：架构决策、技术指导

### 社区礼仪

- **尊重多样性**：包容不同背景和观点
- **建设性反馈**：提供具体、可操作的建议
- **及时响应**：在合理时间内回复讨论
- **透明沟通**：公开讨论技术决策

## 社区活动和事件

Kubernetes 社区每年举办多种线上线下活动，促进技术交流与合作。

### 年度盛会

- **KubeCon + CloudNativeCon**：全球最大云原生大会
- **Kubernetes Contributor Summit**：贡献者年度峰会
- **Regional Meetups**：各地社区聚会

### 在线活动

- **Office Hours**：每周社区问答时间
- **SIG 会议**：各 SIG 定期技术讨论
- **Community Bridge**：开源项目资助计划

## 总结

Kubernetes 社区通过分布式治理、SIG 和工作组的协同创新，持续引领云原生技术发展。无论你是开发者、运维工程师还是技术爱好者，都能在这里找到适合自己的成长路径。积极参与社区，不仅能提升技术能力，还能与全球顶尖工程师共创云计算未来。

## 参考资源

以下资源有助于进一步了解 Kubernetes 社区治理与参与方式：

1. [Kubernetes Community - github.com](https://github.com/kubernetes/community)
2. [SIG 列表 - github.com](https://github.com/kubernetes/community/blob/master/sig-list.md)
3. [贡献者指南 - kubernetes.io](https://kubernetes.io/docs/contribute/)
4. [社区日历 - calendar.google.com](https://calendar.google.com/calendar/embed?src=kubernetes.io)
5. [CNCF 培训 - training.linuxfoundation.org](https://training.linuxfoundation.org/training/kubernetes-training/)
6. [Kubernetes 文档 - kubernetes.io](https://kubernetes.io/docs/)
7. [Awesome Kubernetes - github.com](https://github.com/ramitsurana/awesome-kubernetes)
8. [GitHub - github.com](https://github.com/kubernetes)
9. [Slack - slack.k8s.io](https://slack.k8s.io/)
10. [Discuss - discuss.kubernetes.io](https://discuss.kubernetes.io/)
11. [YouTube - youtube.com](https://www.youtube.com/c/KubernetesCommunity)
12. [CNCF Landscape - landscape.cncf.io](https://landscape.cncf.io/)
13. [OperatorHub - operatorhub.io](https://operatorhub.io/)
14. [Artifact Hub - artifacthub.io](https://artifacthub.io/)
