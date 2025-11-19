---
weight: 48
title: SPIRE
date: 2022-06-10T00:00:00+08:00
description: 本文详细介绍 SPIRE 的架构、核心组件、证明机制和工作原理。
lastmod: 2025-10-27T16:30:08.433Z
---

> SPIRE 是 SPIFFE 标准的生产级实现，为云原生环境下的工作负载提供自动化、可扩展的身份分发和证明机制，是实现零信任安全架构的关键基础设施。

SPIRE（SPIFFE Runtime Environment）是 [SPIFFE API](../spiffe) 的生产就绪实现，它执行节点和工作负载认证，根据预定义条件安全地向工作负载发布 SVID（SPIFFE Verifiable Identity Document），并验证其他工作负载的 SVID。

## 核心架构

SPIRE 的部署架构由 SPIRE 服务器和一个或多个 SPIRE 代理组成。服务器作为证书颁发机构（CA），通过代理向工作负载分发身份，并维护身份注册表和验证条件。代理需部署在每个运行工作负载的节点上，负责本地暴露 SPIFFE 工作负载 API 并完成本地证明。

下图展示了 SPIRE 的整体架构：

![SPIRE 架构图](https://assets.jimmysong.io/images/book/kubernetes-handbook/auth/spire/spire-arch.svg)
{width=860 height=1444}

## SPIRE 服务器

SPIRE 服务器负责管理和发布其信任域内的所有身份，核心职责包括：

- 存储注册条目（决定 SPIFFE ID 签发条件的选择器）
- 管理签名密钥
- 自动验证代理身份（节点证明）
- 为已验证代理请求的工作负载创建 SVID

![SPIRE 服务器](https://assets.jimmysong.io/images/book/kubernetes-handbook/auth/spire/spire-server.svg)
{width=1298 height=674}

### 服务器插件体系

SPIRE 服务器通过插件机制实现高度可扩展性，支持以下插件类型：

- **节点证明器插件**：与代理协作，验证代理节点身份
- **节点解析器插件**：扩展节点选择器集合，增强节点识别能力
- **数据存储插件**：存储注册条目、节点和选择器，支持 MySQL、SQLite3、PostgreSQL
- **密钥管理器插件**：管理签署 SVID 的私钥
- **上游权威机构插件**：支持外部 CA 集成

详细配置参考 [SPIRE 服务器配置参考](https://spiffe.io/docs/latest/deploying/spire_server/)。

## SPIRE 代理

SPIRE 代理需在每个节点上运行，主要功能包括：

- 从服务器请求并缓存 SVID
- 向本地工作负载暴露 SPIFFE 工作负载 API
- 证明调用 API 的工作负载身份
- 为已识别的工作负载分发 SVID

![SPIRE 代理](https://assets.jimmysong.io/images/book/kubernetes-handbook/auth/spire/spire-agent.svg)
{width=1233 height=933}

### 代理核心组件

- **节点证明器插件**：与服务器协作，完成节点身份验证
- **工作负载证明器插件**：通过进程信息等方式证明本地工作负载身份
- **密钥管理器插件**：生成和管理工作负载 SVID 的私钥

详细配置参考 [SPIRE 代理配置参考](https://spiffe.io/docs/latest/deploying/spire_agent/)。

## 扩展性

SPIRE 支持自定义插件开发，适配不同平台和安全需求：

- 定制节点/代理节点验证器
- 自定义密钥管理器插件
- 平台专用工作负载证明器

插件可在运行时动态加载，无需重新编译 SPIRE。

## 工作负载注册

SPIRE 通过注册条目（Registration Entry）识别和授权工作负载。注册条目定义了：

- 工作负载的识别方式（选择器）
- 分配的 SPIFFE ID

代理在证明过程中会将本地发现的选择器与注册条目比对，只有匹配的工作负载才能获得对应身份。

详细注册流程见 [SPIRE 文档](https://spiffe.io/docs/latest/spire/using/registering/)。

## 身份证明机制

SPIRE 的证明（attestation）分为两阶段：

1. **节点证明**：验证代理节点身份
2. **工作负载证明**：验证节点上具体工作负载身份

### 节点证明

代理首次连接服务器时需完成节点证明。常见方式包括：

- 云平台实例身份文档（如 AWS EC2、Azure、GCP）
- 硬件安全模块（HSM、TPM）
- 预共享加入令牌
- Kubernetes 服务账户令牌
- 现有 X.509 证书

下图展示了 AWS 节点证明流程：

![SPIRE 节点证明步骤](https://assets.jimmysong.io/images/book/kubernetes-handbook/auth/spire/spire-node-attestor.svg)
{width=1359 height=954}

节点证明流程：

1. 代理节点证明器获取节点身份证明
2. 代理将证明材料传递给服务器
3. 服务器节点证明器独立验证，生成代理 SPIFFE ID
4. 服务器返回代理节点 SVID

SPIRE 支持多种节点证明器，详见官方文档。

### 节点解析

节点解析器插件可扩展节点属性，增强选择器能力，支持 AWS、Azure 等云平台。

### 工作负载证明

代理通过本地权限（如内核、kubelet）识别调用 API 的进程属性，包括：

- 操作系统调度信息（uid、gid、路径等）
- 编排系统信息（Kubernetes 服务账户、命名空间等）

![工作负载证明](https://assets.jimmysong.io/images/book/kubernetes-handbook/auth/spire/workload-attestation.svg)
{width=615 height=903}

工作负载证明流程：

1. 工作负载调用 API 请求 SVID
2. 代理获取进程 ID，调用工作负载证明器
3. 证明器发现进程属性，返回选择器
4. 代理比对选择器与注册条目，返回 SVID

SPIRE 内置支持 Unix/Linux、Kubernetes、Docker 等环境。

{{< callout note 注意 >}}
节点证明不需要节点选择器，除非你需要[将工作负载映射到多个节点](https://spiffe.io/docs/latest/spire/using/registering/#mapping-workloads-to-multiple-nodes)。
{{< /callout >}}

## SVID 身份颁发过程

以下为 SPIRE 向工作负载颁发身份的完整流程（以 AWS EC2 为例，X.509 SVID）：

1. SPIRE 服务器启动，生成自签名证书（或通过 UpstreamAuthority 插件集成外部 CA）。
2. 服务器初始化信任包并开放注册 API。
3. 节点上的 SPIRE 代理启动，执行节点证明（如 AWS 实例身份文档）。
4. 代理通过 TLS 连接向服务器提交证明材料。
5. 服务器调用云平台 API 验证证明。
6. 服务器完成节点解析，更新注册条目。
7. 服务器向代理发放节点 SVID。
8. 代理用节点 SVID 认证服务器，获取授权注册条目。
9. 代理为工作负载生成 CSR，服务器签发工作负载 SVID。
10. 代理缓存 SVID 并监听 Workload API。
11. 工作负载调用 API 请求 SVID，代理完成工作负载证明并返回 SVID。

### 授权注册条目

服务器仅向代理下发授权注册条目，具体流程包括：

1. 查询以代理 SPIFFE ID 为父 ID 的注册条目
2. 查询节点选择器相关条目
3. 查询选择器匹配的注册条目
4. 递归查询所有子节点注册条目

详见[多节点映射](https://spiffe.io/docs/latest/spire/using/registering/#mapping-workloads-to-multiple-nodes)。

## SPIRE Kubernetes 工作负载注册器

SPIRE Kubernetes 工作负载注册器支持多种自动注册模式，适配不同场景：

- ValidatingAdmissionWebhook
- 控制器协调（reconcile）
- CRD 声明式管理

### 配置选项

注册器支持命令行参数和 HCL 配置文件，核心配置项如下：

{{< table title="基础配置" >}}

| 配置项               | 类型   | 必需 | 描述                                                         | 默认值   |
| :------------------- | :----- | :--- | :----------------------------------------------------------- | :------- |
| `log_level`          | string | 是   | 日志级别（`panic`、`fatal`、`error`、`warn`、`info`、`debug`、`trace`） | `info`   |
| `log_path`           | string | 否   | 日志文件路径                                                 | 标准输出 |
| `trust_domain`       | string | 是   | SPIRE 服务器的信任域                                         | -        |
| `server_address`     | string | 是   | SPIRE 服务器地址，支持 TCP 和 Unix 套接字格式                | -        |
| `server_socket_path` | string | 否   | SPIRE 服务器 Unix 套接字路径（与 server_address 二选一）     | -        |
| `agent_socket_path`  | string | 否   | SPIRE 代理 Unix 套接字路径                                   | -        |
| `cluster`            | string | 是   | 集群标识符，需与 SPIRE 服务器节点证明配置匹配                | -        |

{{< /table >}}

{{< table title="工作负载识别配置" >}}

| 配置项                | 类型     | 必需 | 描述                                    | 默认值                       |
| :-------------------- | :------- | :--- | :-------------------------------------- | :--------------------------- |
| `pod_label`           | string   | 否   | 用于标签模式的 Pod 标签键               | -                            |
| `pod_annotation`      | string   | 否   | 用于注解模式的 Pod 注解键               | -                            |
| `mode`                | string   | 否   | 运行模式：`webhook`、`reconcile`、`crd` | `webhook`                    |
| `disabled_namespaces` | []string | 否   | 禁用自动注册的命名空间列表              | `kube-system`, `kube-public` |

{{< /table >}}

### 工作负载注册模式

不同模式支持的注册方式如下：

{{< table title="SPIRE 工作负载注册模式对比" >}}

| 注册方式 | Webhook 模式 | Reconcile 模式 | CRD 模式 |
| :------- | :----------- | :------------- | :------- |
| 服务账户 | ✅            | ✅              | ❌        |
| Pod 标签 | ✅            | ✅              | ✅        |
| Pod 注解 | ✅            | ✅              | ✅        |
| 身份模板 | ❌            | ❌              | ✅        |

{{< /table >}}

#### 服务账户模式

基于 Kubernetes 服务账户自动生成 SPIFFE ID，格式为：

```text
spiffe://<TRUST_DOMAIN>/ns/<NAMESPACE>/sa/<SERVICE_ACCOUNT>
```

**注册条目示例：**

```text
Entry ID      : 200d8b19-8334-443d-9494-f65d0ad64eb5
SPIFFE ID     : spiffe://example.org/ns/production/sa/blog
Parent ID     : spiffe://example.org/spire/agent/k8s_psat/production/node-123
Selectors     : k8s:ns:production
        k8s:pod-name:blog-app-98b6b79fd-jnv5m
```

#### Pod 标签模式

基于指定 Pod 标签值生成 SPIFFE ID：

```hcl
pod_label = "spire-workload"
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    spire-workload: "payment-service"
spec:
  # Pod 配置
```

#### Pod 注解模式

基于指定 Pod 注解值生成自定义 SPIFFE ID 路径：

```hcl
pod_annotation = "spiffe.io/spiffe-id"
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    spiffe.io/spiffe-id: "services/payment/v1"
spec:
  # Pod 配置
```

#### 联合身份注册

通过 `spiffe.io/federatesWith` 注解实现跨信任域联合身份：

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    spiffe.io/federatesWith: "partner-domain.com,vendor-domain.org"
spec:
  # Pod 配置
```

### 部署方式

SPIRE Kubernetes 工作负载注册器支持独立部署和 Sidecar 部署两种方式。

#### 独立部署

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spire-k8s-registrar
  namespace: spire-system
spec:
  replicas: 2
  selector:
    matchLabels:
      app: spire-k8s-registrar
  template:
    metadata:
      labels:
        app: spire-k8s-registrar
    spec:
      serviceAccountName: spire-k8s-registrar
      containers:
      - name: k8s-workload-registrar
        image: ghcr.io/spiffe/k8s-workload-registrar:1.8.0
        args:
        - -config
        - /opt/spire/conf/k8s-workload-registrar.conf
        volumeMounts:
        - name: config
          mountPath: /opt/spire/conf
        - name: spire-agent-socket
          mountPath: /tmp/spire-agent/public
      volumes:
      - name: config
        configMap:
          name: k8s-workload-registrar
      - name: spire-agent-socket
        hostPath:
          path: /run/spire/sockets
          type: DirectoryOrCreate
```

#### Sidecar 部署

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: spire-server
spec:
  template:
    spec:
      containers:
      - name: spire-server
        # SPIRE 服务器配置
      - name: k8s-workload-registrar
        image: ghcr.io/spiffe/k8s-workload-registrar:1.8.0
        args:
        - -config
        - /opt/spire/conf/k8s-workload-registrar.conf
        volumeMounts:
        - name: spire-server-socket
          mountPath: /tmp/spire-server/private
        - name: registrar-config
          mountPath: /opt/spire/conf
      volumes:
      - name: spire-server-socket
        emptyDir: {}
      - name: registrar-config
        configMap:
          name: k8s-workload-registrar
```

### 运行模式详解

#### Webhook 模式

- 基于 ValidatingAdmissionWebhook 实现
- 实时处理 Pod 创建/删除事件
- 简单易用但可靠性有限，适合小规模或测试环境

#### Reconcile 模式（推荐）

- 基于控制器协调机制
- 支持故障恢复、状态同步和高可用
- SPIFFE ID 仅限目标节点，自动清理失效条目
- 生产环境首选

#### CRD 模式

- 基于自定义资源定义
- 支持声明式管理和身份模板
- 灵活适配复杂身份策略，适合 GitOps 流程

### DNS 名称支持

在 `reconcile` 和 `crd` 模式下，可为 Pod 注册条目添加 DNS 名称。需注意部分服务（如 etcd）对 DNS 反向解析有特殊要求，必要时建议禁用该功能。

{{< callout warning 注意 >}}
部分服务（如 etcd）使用反向 DNS 验证客户端证书中的 DNS SAN。由于 Kubernetes 客户端 IP 可能无法有效反向解析，建议对这类服务禁用 DNS 名称功能。
{{< /callout >}}

## 最佳实践

- **模式选择**：生产环境优先使用 `reconcile`，复杂策略用 `crd`，测试可选 `webhook`
- **安全配置**：启用客户端验证，合理配置 `disabled_namespaces`，最小权限原则
- **性能优化**：多副本部署启用 `leader_election`，按需启用 DNS 名称，监控注册器指标

## 故障排查

常见问题及排查建议：

- **Pod 无法获取 SVID**：检查注册器日志、网络连接、SPIRE 代理状态
- **Webhook 模式准入失败**：检查证书、网络策略、API 服务器日志
- **权限错误**：核查 ServiceAccount、RBAC 和命名空间权限

`reconcile` 模式下可监控 Pod 处理速度、注册成功率和控制器健康状态。

## 平台兼容性

- **支持系统**：Linux/Unix
- **Kubernetes 版本**：1.19+
- **SPIRE 版本**：1.5.0+

## 总结

SPIRE 作为 SPIFFE 标准的生产级实现，为云原生环境下的工作负载提供了自动化、可扩展的身份分发和证明机制。通过灵活的插件体系和多种注册模式，SPIRE 能够适配多样化的基础设施和安全需求，是实现零信任架构和细粒度身份管理的关键组件。建议结合实际场景选择合适的注册模式和安全配置，持续优化身份管理体系。

## 参考文献

- [SPIRE Concepts - spiffe.io](https://spiffe.io/docs/latest/spire-about/spire-concepts/)
- [SPIRE 服务器配置参考 - spiffe.io](https://spiffe.io/docs/latest/deploying/spire_server/)
- [SPIRE 代理配置参考 - spiffe.io](https://spiffe.io/docs/latest/deploying/spire_agent/)
