---
weight: 48
title: SPIRE
date: '2022-06-10T00:00:00+08:00'
type: book
description: SPIRE 是 SPIFFE API 的生产就绪实现，提供节点和工作负载认证，安全地向工作负载发布 SVID 并验证其他工作负载的 SVID。本文详细介绍 SPIRE 的架构、核心组件、证明机制和工作原理。
summary: 这篇文章将向你介绍 SPIRE 的架构、基本概念及原理。
keywords:
- spire
- spiffe
- 身份认证
- 工作负载
- 证明
- 服务器
- 代理
- 插件
- 选择器
- SVID
---

SPIRE（SPIFFE Runtime Environment）是 [SPIFFE API](../spiffe) 的生产就绪实现，它执行节点和工作负载认证，根据预定义条件安全地向工作负载发布 SVID（SPIFFE Verifiable Identity Document），并验证其他工作负载的 SVID。

## 核心架构

SPIRE 部署由一个 SPIRE 服务器和一个或多个 SPIRE 代理组成。服务器充当证书颁发机构，通过代理向工作负载分发身份。它维护工作负载身份注册表，以及签发这些身份所需验证的条件。代理在本地向工作负载公开 SPIFFE 工作负载 API，必须部署在每个运行工作负载的节点上。

![SPIRE 架构图](https://assets.jimmysong.io/images/book/kubernetes-handbook/auth/spire/spire-arch.svg)
{width=860 height=1444}

## SPIRE 服务器

SPIRE 服务器负责管理和发布其配置的 SPIFFE 信任域中的所有身份。其主要职责包括：

- 存储注册条目（指定决定特定 SPIFFE ID 签发条件的选择器）
- 管理签名密钥
- 使用节点证明自动验证代理身份
- 在已验证代理请求时为工作负载创建 SVID

![SPIRE 服务器](https://assets.jimmysong.io/images/book/kubernetes-handbook/auth/spire/spire-server.svg)
{width=1298 height=674}

### 服务器插件体系

服务器通过一系列插件决定其行为，支持的插件类型包括：

**节点证明器插件**
与代理节点证明器协作，验证代理运行节点的身份。

**节点解析器插件**
通过验证节点的附加属性来扩展服务器识别节点的选择器集合。

**数据存储插件**
存储、查询和更新注册条目、已认证节点及其选择器等信息。内置支持 MySQL、SQLite3 或 PostgreSQL 数据库，默认使用 SQLite3。

**密钥管理器插件**
控制服务器如何存储用于签署 X.509-SVID 和 JWT-SVID 的私钥。

**上游权威机构插件**
默认情况下，SPIRE 服务器充当自身的证书颁发机构。此插件允许使用来自不同 PKI 系统的外部 CA。

你可以通过配置插件和其他配置变量来定制服务器行为。详见 [SPIRE 服务器配置参考](https://spiffe.io/docs/latest/deploying/spire_server/)。

## SPIRE 代理

SPIRE 代理在每个运行工作负载的节点上运行，主要功能包括：

- 从服务器请求 SVID 并缓存，直至工作负载请求
- 向节点上的工作负载公开 SPIFFE 工作负载 API
- 证明调用工作负载 API 的工作负载身份
- 为已识别的工作负载提供其 SVID

![SPIRE 代理](https://assets.jimmysong.io/images/book/kubernetes-handbook/auth/spire/spire-agent.svg)
{width=1233 height=933}

### 代理核心组件

**节点证明器插件**
与服务器节点证明器协作，验证代理运行节点的身份。

**工作负载证明器插件**
通过查询节点操作系统中工作负载进程信息，并与注册时提供的选择器信息比较，验证节点上工作负载进程的身份。

**密钥管理器插件**
生成和管理颁发给工作负载的 X.509-SVID 私钥。

你可以通过配置插件和其他配置变量来定制代理行为。详见 [SPIRE 代理配置参考](https://spiffe.io/docs/latest/deploying/spire_agent/)。

## 扩展性

### 自定义插件开发

SPIRE 支持为特定平台和架构创建自定义服务器和代理插件。例如：

- 为特定架构创建服务器和代理节点验证器
- 创建自定义密钥管理器插件，以 SPIRE 目前不支持的方式处理私钥
- 为特定平台开发工作负载证明器

由于 SPIRE 在运行时加载自定义插件，无需重新编译 SPIRE 即可启用它们。

## 工作负载注册

为使 SPIRE 识别工作负载，必须通过注册条目向 SPIRE 服务器注册工作负载。工作负载注册定义了：

- 如何识别工作负载
- 为工作负载提供哪个 SPIFFE ID

注册条目将身份（SPIFFE ID）映射到一组称为选择器的属性，工作负载必须具备这些属性才能获得特定身份。在工作负载证明期间，代理使用这些选择器值验证工作负载身份。

详细的工作负载注册过程请参考 [SPIRE 文档](https://spiffe.io/docs/latest/spire/using/registering/)。

## 身份证明机制

SPIRE 中的证明（attestation）是断言工作负载身份的过程。SPIRE 通过从可信第三方收集工作负载进程及其运行节点的属性，并将这些属性与工作负载注册时定义的选择器进行比较来实现证明。

用于执行证明的可信第三方因平台而异。SPIRE 分两阶段执行证明：

1. **节点证明** - 验证工作负载运行节点的身份
2. **工作负载证明** - 验证节点上的工作负载

### 节点证明

每个代理在首次连接服务器时必须进行身份验证和自我验证，这个过程称为节点证明。代理和服务器通过节点证明器插件协作验证运行代理的节点身份。

节点证明器向节点及其环境询问只有该节点拥有的信息片段，以证明节点身份。

#### 证明方式示例

- **云平台身份文档** - 如 AWS Instance 身份证明文件
- **硬件安全模块** - 验证存储在 HSM 或 TPM 上的私钥
- **加入令牌** - 安装代理时通过预共享密钥进行手动验证
- **编排系统凭据** - 如 Kubernetes 服务账户令牌
- **其他机器身份证明** - 如部署的服务器证书

下图展示了以 AWS 为底层平台的节点证明过程：

![SPIRE 节点证明步骤](https://assets.jimmysong.io/images/book/kubernetes-handbook/auth/spire/spire-node-attestor.svg)
{width=1359 height=954}

#### 节点证明流程

1. 代理 AWS 节点证明器插件向 AWS 查询节点身份证明
2. 代理将身份证明传递给服务器
3. 服务器 AWS 节点证明器独立验证身份证明，创建代理 SPIFFE ID
4. 服务器返回代理节点的 SVID

#### 支持的节点证明器

SPIRE 支持多种环境的节点证明器：

- **AWS EC2** - 使用 EC2 实例身份文档
- **Microsoft Azure** - 使用 Azure 托管服务标识
- **Google Cloud Platform** - 使用 GCE 实例身份令牌
- **Kubernetes** - 使用 Kubernetes 服务账户令牌
- **加入令牌** - 服务器生成的预共享密钥
- **X.509 证书** - 使用现有证书进行证明

#### 节点解析

节点解析器插件在节点证明完成后运行，通过验证节点的附加属性来扩展选择器集合。目前支持：

- Amazon Web Services (AWS)
- Microsoft Azure

### 工作负载证明

工作负载证明回答"这是谁的进程？"这一问题。代理通过询问本地权限（如节点操作系统内核或本地 kubelet）来确定调用工作负载 API 的进程属性。

这些属性可能包括：

- **操作系统调度信息** - 在 Unix 系统上可能是用户 ID (uid)、组 ID (gid)、文件系统路径等
- **编排系统调度信息** - 如 Kubernetes 服务账户或命名空间

![工作负载证明](https://assets.jimmysong.io/images/book/kubernetes-handbook/auth/spire/workload-attestation.svg)
{width=615 height=903}

#### 工作负载证明流程

1. 工作负载调用工作负载 API 请求 SVID
2. 代理询问节点内核识别调用者进程 ID，并调用工作负载证明器插件
3. 工作负载证明器使用进程 ID 发现工作负载的附加信息
4. 证明器将发现的信息以选择器形式返回给代理
5. 代理通过比较选择器与注册条目确定工作负载身份，并返回相应的 SVID

#### 支持的工作负载证明器

SPIRE 包含适用于以下环境的工作负载证明器插件：

- Unix/Linux 系统
- Kubernetes
- Docker

{{<callout note 注意>}}
节点证明不需要节点选择器，除非你需要[将工作负载映射到多个节点](https://spiffe.io/docs/latest/spire/using/registering/#mapping-workloads-to-multiple-nodes)。
{{</callout>}}

## 参考资料

- [SPIRE Concepts - spiffe.io](https://spiffe.io/docs/latest/spire-about/spire-concepts/)
- [SPIRE 服务器配置参考](https://spiffe.io/docs/latest/deploying/spire_server/)
- [SPIRE 代理配置参考](https://spiffe.io/docs/latest/deploying/spire_agent/)
