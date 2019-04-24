# CNCF特别兴趣小组（SIG）说明

本文译自 [CNCF Special Interest Groups（SIGs）](https://github.com/cncf/toc/blob/master/sigs/cncf-sigs.md)最终草案v1.0。

本提案创作于2018年11月至2019年1月期间，由CNCF TOC和”Contributors Primary Author“ Alexis Richardson，Quinton Hoole共同起草。

## 总体目的

为了我们的[使命](https://github.com/cncf/foundation/blob/master/charter.md#1-mission-of-the-cloud-native-computing-foundation)，在扩展CNCF技术版图、增加用户社区贡献的同时保持其完整性和提高贡献质量。

## 具体目标

- 加强项目生态系统建设以满足最终用户和项目贡献者的需求。
- 识别CNCF项目组合中的鸿沟（gap），寻找并吸引项目填补这些鸿沟。
- 教育和指导用户，为用户提供无偏见、有效且实用的信息。
- 将注意力和资源集中在促进CNCF项目的成熟度上。
- 明确项目、CNCF项目人员和社区志愿者之间的关系。
- 吸引更多社区参与，创建有效的TOC贡献和认可的入口。
- 在减少TOC在某些项目上工作量的同时保留选举机构的执行控制和音调完整性。
- 避免在供应商之间建立政治平台。

## 介绍

CNCF SIG将监督和协调与最终用户和（或）项目需求的逻辑领域相关的利益。这些领域如安全性、测试、可观察性、存储、网络等。通常由一组CNCF项目来满足SIG监督的领域，也可能是多个项目共享的跨领域特征组（如安全性和可观察性）。 SIG是：

- 是一个长期存在的群体，向技术监督委员会报告
- 主要由相关领域的公认专家领导，并得到其他贡献者的支持

CNCF SIG以Kubernetes SIG为模型，旨在最小化差异以避免混淆——[此处](https://docs.google.com/document/d/1oSGhx5Hw7Hs_qawYB46BvRSPh0ZvFoxvHx-NWaf5Nsc/edit?usp=sharing)描述了两者之间不可避免的差异。

## SIG的职责与权利

CNCF SIG在TOC的指导下，提供高质量的专业技术知识、无偏见的信息及其领域内的领导力。TOC作为知情方和高效的执行委员会，利用这一输入来选择和推广适当的CNCF项目与实践，并向最终用户和云原生社区传播高质量的信息。可以很明确的说，SIG对CNCF项目没有直接的权力。特别是，CNCF SIG的创建并没有改变现有已成功实施的[章程](https://github.com/cncf/foundation/blob/master/charter.md)目标，即“项目......轻松地受技术监督委员会管辖”。

SIG应努力向TOC提供易于理解和可投票的“提议（proposition）”，提议需要有明确的书面证据支持。这些提议可以是：“基于此[书面尽职调查](https://github.com/cncf/toc/blob/master/process/due-diligence-guidelines.md)“或”根据明确的目标和证据来批准这个landscape文件“。SIG提供给TOC的信息和建议必须高度准确和公正，这一点至关重要，这也是受整体上改进CNCF的目标所驱动，而不是使一个项目或公司受益于其他项目或公司。我们相信涨潮会抬升所有船只，这是我们的目标。

之所以这样设计是考虑到：

- TOC是仲裁者和撰写者，可能总是会干预和驳回提议。
- SIG是受人尊敬的人才。

SIG可以选择组建有时间限制的集中式工作组来实现某些职责（例如，制作特定的教育白皮书或组合空白分析报告）。工作组应有明确记录的章程、时间表（通常最多几个季度）和一套可交付的成果。一旦时间表过去或成果交付，工作组就会解散重组。

### 特定SIG责任

#### 项目处理：

- 了解并记录该领域内项目的宏观（high-level）路线图，包括CNCF和非CNCF项目。确定项目前景中的差距。
- 对于CNCF的项目，执行健康检查（health check）。
- 发掘和展出对候选项目。
- 帮助候选项目准备向TOC提交。
- 每个CNCF项目将由TOC分配给一个合适的SIG。

#### 最终用户教育（输出）

- 提供最新、高质量、无偏见且易于使用的材料，帮助最终用户理解并有效采用SIG领域内的云原生技术和实践，例如：
  - 白皮书、演示文稿、视频或其他形式的培训、阐明术语、比较不同的方法，可用的项目或产品、常见或推荐的做法、趋势、说明性的成功和失败等。
  - 信息应尽可能基于研究和事实收集，而不是纯粹的营销或推测。

#### 最终用户输入收集（输入）

- 收集有用的最终用户输入和有关期望、痛点、主要用例等的反馈。
- 将其编译成易于使用的报告和（或）演示文稿，以帮助项目进行功能设计、优先级排序、UX等。

#### 社区支持

- SIG是开放式组织，提供会议、会议议程和笔记，邮件列表以及其他公开通信。
- SIG的邮件列表、SIG会议日历和其他通信文件将公开发布和维护。

#### 作为TOC的值得信赖的专家顾问

- 对新项目和毕业项目进行技术尽职调查，并就调查结果向TOC提出建议。
- 参与或定期检查其所在领域的项目，并根据需要或应要求向TOC提供有关健康、状态和措施（如果有）的建议。

#### SIG章程：

- 每年正式审核，并由TOC批准。章程必须明确表达：
  - 哪些属于SIG的范围，哪些不属于；
  - 与其他CNCF SIG或其他相关团体交流，明确是否有重叠；
  - 如何运作和管理，具体是否以及如何偏离TOC提供的标准SIG操作指南。不鼓励偏离这些指导原则，除非有TOC批准的对这种分歧的良好且记录良好的原因。

请参阅[CNCF SIG的责任示例](https://docs.google.com/document/d/1L9dJl5aBFnN5KEf82J689FY0UtnUawnt9ooCq8SkO_w/edit?usp=sharing)。

## 运营模式

重要提示：每个SIG都由CNCF执行人员的指定成员提供支持，该成员负责与CNCF执行董事（Executive Director）的联络、SIG的沟通和绩效，并向理事会（Governing Board）和TOC提交季度和年度报告。

作为起点，我们受到CNCF OSS项目和K8S SIG的启发。这意味着最小的可行治理和基于社区的组织。

### SIG组建、领导和成员构成

1. SIG由TOC组建。初始SIG列在下面，并将根据需要随时间进行调整。如果社区成员认为需要增加额外的SIG，应该向TOC提出，并给出明确的理由，最好是由志愿者领导SIG。TOC希望拥有最小的可行SIG数量，并且所有SIG都是高效的（与具有大量相对无效的SIG的“SIG蔓延（SIG sprawl）”相反）。
2. SIG有三名联席主席，他们是TOC贡献者，该领域的公认专家，并且有能力共同领导SIG以产生无偏见信息。
3. SIG有一名TOC联络员，作为TOC的投票成员，在TOC或SIG主席认为有必要提交TOC时，作为额外的非执行主席。
4. SIG拥有多名技术领导者，他们被公认为（1）SIG领域的专家，（2）SIG领域的项目负责人（3）展示了提供产生SIG所需的无偏见信息所需的平衡技术领导能力。采取独立主席和技术主管角色的原因主要是想将行政职能的责任与深层技术职能和相关的时间承诺和技能组合分开。在适当的情况下，个人可以同时担任两种角色（见下文）。
5. 强烈鼓励SIG内部的思想和兴趣多样性。为此，TOC将主动阻止绝大多数技术主管来自单一公司、市场细分等的绝大多数（⅔或更多）主席。
6. SIG成员是自己任命的，因此一些SIG工作由TOC贡献者和社区的志愿者完成。为了识别随着时间的推移对SIG做出持续和有价值贡献的成员，可以创建SIG定义和分配的角色（例如，抄写员、培训或文档协调员等）。 SIG应该记录这些角色和职责是什么，执行者是谁，并让SIG领导批准。

### SIG成员角色

#### 主席

- 每周/两周/每月轮转的三个活动席位。
- 主要执行管理功能，包括收集和编制每周（双周）议程的主题、主持会议、确保发布高质量的会议记录，以及跟踪和解决后续行动。
- 如果有人有时间和能力同时担任这两个角色，只要TOC和SIG成员满意，则可以由技术主管兼任。

#### 技术主管

- 领导SIG领域的项目。
- 是否有时间和能力对项目进行深度技术探索。项目可能包括正式的CNCF项目或SIG所涵盖领域的其他项目。

#### 其他命名角色

- 由SIG命名和定义（例如抄写员、公关主管、文档/培训负责人等）
- 由绝大多数主席批准。

#### 其他成员

- 自我任命
- 可能没有明确的角色或职责，也没有正式分配的角色（见上文）。
- 除了指定的角色外，不得为公众造成他们在SIG中拥有任何权限或正式职责的印象。

### 选举

- TOC提名主席
- 在TOC的2/3多数票后，分配了主席
- 任期2年但交错排列，使至少有一个席位能够保持连续性
- TOC和主席提名技术主管
- 技术主管需要获得TOC的2/3多数票和SIG主席的2/3多数票
- 在获得TOC的2/3多数票通过后，SIG主席和技术主管可以被随时取消任命

### 治理

- 所有SIG都继承并遵循CNCF TOC操作原则。
- SIG必须有一个记录在案的治理流程，鼓励社区参与和明确的指导方针，以避免有偏见的决策。
  - 注意：这里的目标是与CNCF项目的“最小可行”模型保持一致，并且只需要这样的治理，而不是任何过于繁琐的事情
- 如果符合CNCF运营原则，他们可能会像OSS项目一样，随着时间的推移逐步实施一系列实践。
- 与CNCF项目一样，所有例外和争议均由TOC和CNCF员工帮助处理

### 预算和资源

- 此时没有正式的系统预算，除了CNCF执行人员承诺提供指定人员作为联络点。
- 正如CNCF项目可能需要通过CNCF提供的“帮助”，SIG可以通过[ServiceDesk](https://github.com/cncf/servicedesk)求人办事。

## 退休

- 在SIG无法建立履行职责和（或）定期向TOC报告的情况下，TOC将：
  - 考虑在3个月后解散（retire）SIG
  - 必须在6个月后解散SIG
- TOC可以通过2/3多数票通过对SIG的“不信任（no confidence）”。 在这种情况下，TOC可以投票解散或重组SIG。

## 初始SIG

为了开始该过程，TOC提出以下SIG和分配给每个SIG的项目。显然，所有这些SIG都不会在一夜之间完全形成或立即开始运作，因此TOC本身将履行尚未形成的SIG的职责，直到SIG形成为止。 然而，我们可以立即指定TOC的一个投票成员作为每个SIG的联络员，并优先考虑SIG的组建顺序，立即从最紧迫的SIG开始。

| 命名（待定）                   | 领域                                                         | 当前的CNCF项目                                               |
| ------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Traffic                        | networking, service discovery, load balancing, service mesh, RPC, pubsub, etc. | Envoy, Linkerd, NATS, gRPC, CoreDNS, CNI                     |
| Observability                  | monitoring, logging, tracing, profiling, etc.                | Prometheus, OpenTracing, Fluentd, Jaeger, Cortex, OpenMetrics, |
| Governance                     | security, authentication, authorization, auditing, policy enforcement, compliance, GDPR, cost management, etc | SPIFFE, SPIRE, Open Policy Agent, Notary, TUF, Falco,        |
| App Dev, Ops & Testing         | PaaS, Serverless, Operators,... CI/CD, Conformance, Chaos Eng, Scalability and Reliability measurement etc. | Helm, CloudEvents, Telepresence, Buildpacks                  |
| Core and Applied Architectures | orchestration, scheduling, container runtimes, sandboxing technologies, packaging and distribution, specialized architectures thereof (e.g. Edge, IoT, Big Data, AI/ML, etc). | Kubernetes, containerd, rkt, Harbor, Dragonfly, Virtual Kubelet |
| Storage                        | Block, File and Object Stores, Databases, Key-Value stores etc. | TiKV, etcd, Vitess, Rook                                     |

TOC和CNCF工作人员将一起起草一套上述初步章程，并征集/选举合适的席位。

## 附录A：工作示例 -  CNCF治理SIG

请参阅[单独文档](https://docs.google.com/document/d/18ufx6TjPavfZubwrpyMwz6KkU-YA_aHaHmBBQkplnr0/edit?usp=sharing)。

## 参考

- [CNCF Special Interest Groups（SIGs）](https://github.com/cncf/toc/blob/master/sigs/cncf-sigs.md)