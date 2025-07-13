---
weight: 49
title: SPIRE Kubernetes 工作负载注册器
date: '2022-06-08T16:00:00+08:00'
type: book
description: 本文详细介绍了 SPIRE Kubernetes 工作负载注册器的部署方式、配置选项和注册模式，包括 webhook、reconcile 和 CRD 三种模式的特点与最佳实践。
summary: 本文介绍了如何在 Kubernetes 中使用 SPIRE 工作负载注册器，包括工作负载注册器部署的方式，注册模式等。
keywords:
- spire
- kubernetes
- workload-registrar
- svid
- spiffe
- admission-webhook
- crd
- reconcile
---

SPIRE Kubernetes 工作负载注册器是一个强大的工具，用于在 Kubernetes 环境中自动注册工作负载。它支持多种部署模式，包括 ValidatingAdmissionWebhook、控制器协调（reconcile）和自定义资源定义（CRD）模式，为不同场景提供灵活的解决方案。

## 配置选项

### 命令行参数

注册器支持以下命令行选项：

| 参数      | 描述                        | 默认值                        |
| :-------- | :-------------------------- | :---------------------------- |
| `-config` | HCL 配置文件的完整路径      | `k8s-workload-registrar.conf` |

### 核心配置

配置文件使用 [HCL](https://github.com/hashicorp/hcl) 格式，包含以下核心配置项：

#### 基础配置

| 配置项                | 类型     | 必需 | 描述                                                         | 默认值                        |
| :-------------------- | :------- | :--- | :----------------------------------------------------------- | :---------------------------- |
| `log_level`           | string   | 是   | 日志级别（`panic`、`fatal`、`error`、`warn`、`info`、`debug`、`trace`） | `info`                        |
| `log_path`            | string   | 否   | 日志文件路径                                                 | 标准输出                      |
| `trust_domain`        | string   | 是   | SPIRE 服务器的信任域                                         | -                             |
| `server_address`      | string   | 是   | SPIRE 服务器地址，支持 TCP 和 Unix 套接字格式                | -                             |
| `server_socket_path`  | string   | 否   | SPIRE 服务器 Unix 套接字路径（与 server_address 二选一）     | -                             |
| `agent_socket_path`   | string   | 否   | SPIRE 代理 Unix 套接字路径                                   | -                             |
| `cluster`             | string   | 是   | 集群标识符，需与 SPIRE 服务器节点证明配置匹配                | -                             |

#### 工作负载识别配置

| 配置项                | 类型     | 必需 | 描述                                   | 默认值                        |
| :-------------------- | :------- | :--- | :------------------------------------- | :---------------------------- |
| `pod_label`           | string   | 否   | 用于标签模式的 Pod 标签键              | -                             |
| `pod_annotation`      | string   | 否   | 用于注解模式的 Pod 注解键              | -                             |
| `mode`                | string   | 否   | 运行模式：`webhook`、`reconcile`、`crd` | `webhook`                     |
| `disabled_namespaces` | []string | 否   | 禁用自动注册的命名空间列表             | `kube-system`, `kube-public`  |

### Webhook 模式配置

适用于 ValidatingAdmissionWebhook 模式：

| 配置项                                  | 类型    | 必需 | 描述                              | 默认值       |
| :-------------------------------------- | :------ | :--- | :-------------------------------- | :----------- |
| `addr`                                  | string  | 是   | HTTPS 监听地址                    | `:8443`      |
| `cert_path`                             | string  | 是   | TLS 证书文件路径                  | `cert.pem`   |
| `key_path`                              | string  | 是   | TLS 私钥文件路径                  | `key.pem`    |
| `cacert_path`                           | string  | 是   | 客户端验证 CA 证书路径            | `cacert.pem` |
| `insecure_skip_client_verification`     | boolean | 否   | 是否跳过客户端证书验证（不推荐）  | `false`      |

### Reconcile 模式配置

适用于控制器协调模式：

| 配置项                          | 类型   | 必需 | 描述                                    | 默认值                |
| :------------------------------ | :----- | :--- | :-------------------------------------- | :-------------------- |
| `leader_election`               | bool   | 否   | 启用领导者选举（多副本时必需）          | `false`               |
| `leader_election_resource_lock` | string | 否   | 领导选举锁资源类型                      | `configmaps`          |
| `metrics_addr`                  | string | 否   | 指标监听地址，设为 `0` 禁用             | `:8080`               |
| `controller_name`               | string | 否   | 控制器名称，用于构建父 SPIFFE ID        | `spire-k8s-registrar` |
| `add_pod_dns_names`             | bool   | 否   | 是否为 Pod SVID 添加 DNS 名称           | `false`               |
| `cluster_dns_zone`              | string | 否   | Kubernetes 集群 DNS 区域                | `cluster.local`       |

### 配置示例

以下是相关的示例代码：

```hcl
log_level = "info"
trust_domain = "example.org"
server_socket_path = "/tmp/spire-server/private/api.sock"
cluster = "production"
mode = "reconcile"
leader_election = true
add_pod_dns_names = false
disabled_namespaces = ["kube-system", "kube-public", "spire-system"]
```

## 工作负载注册模式

### 注册模式对比

不同模式支持的注册方式如下：

| 注册方式          | Webhook 模式 | Reconcile 模式 | CRD 模式 |
| :---------------- | :----------- | :------------- | :------- |
| 服务账户          | ✅            | ✅              | ❌        |
| Pod 标签          | ✅            | ✅              | ✅        |
| Pod 注解          | ✅            | ✅              | ✅        |
| 身份模板          | ❌            | ❌              | ✅        |

### 服务账户模式

基于 Kubernetes 服务账户自动生成 SPIFFE ID，格式为：

```
spiffe://<TRUST_DOMAIN>/ns/<NAMESPACE>/sa/<SERVICE_ACCOUNT>
```

**示例：**

```yaml
# Pod 使用 production 命名空间中的 blog 服务账户
# 生成的 SPIFFE ID: spiffe://example.org/ns/production/sa/blog

以下是相关的代码示例：

```

**注册条目示例：**

```
Entry ID      : 200d8b19-8334-443d-9494-f65d0ad64eb5
SPIFFE ID     : spiffe://example.org/ns/production/sa/blog
Parent ID     : spiffe://example.org/spire/agent/k8s_psat/production/node-123
Selectors     : k8s:ns:production
        k8s:pod-name:blog-app-98b6b79fd-jnv5m
```

### Pod 标签模式

基于指定的 Pod 标签值生成 SPIFFE ID，格式为：

```
spiffe://<TRUST_DOMAIN>/<LABEL_VALUE>
```

**配置：**

```hcl
pod_label = "spire-workload"
```

**使用示例：**

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
  spire-workload: "payment-service"
spec:
  # Pod 配置
```

### Pod 注解模式

基于指定的 Pod 注解值生成自定义 SPIFFE ID 路径：

**配置：**

```hcl
pod_annotation = "spiffe.io/spiffe-id"
```

**使用示例：**

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
  spiffe.io/spiffe-id: "services/payment/v1"
spec:
  # Pod 配置
```

### 联合身份注册

使用 `spiffe.io/federatesWith` 注解创建跨信任域的联合身份：

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
  spiffe.io/federatesWith: "partner-domain.com,vendor-domain.org"
spec:
  # Pod 配置
```

## 部署方式

### 独立部署

将注册器作为单独的 Deployment 运行：

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

### Sidecar 部署

在 SPIRE 服务器 Pod 中作为 sidecar 容器运行：

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

## 运行模式详解

### Webhook 模式

**特点：**

- 基于 ValidatingAdmissionWebhook 实现
- 实时处理 Pod 创建/删除事件
- 简单易用，但存在可靠性问题

**限制：**

- StatefulSet 存在竞态条件
- 服务不可用时可能阻止 Pod 准入
- SPIFFE ID 会广播到所有代理节点

**适用场景：** 小规模集群或测试环境

### Reconcile 模式（推荐）

**特点：**

- 基于控制器协调机制
- 支持故障恢复和状态同步
- SPIFFE ID 仅限于目标节点
- 支持高可用部署

**优势：**

- 无竞态条件问题
- 自动清理失效条目
- 更好的可扩展性

**适用场景：** 生产环境首选

### CRD 模式

**特点：**

- 基于自定义资源定义
- 支持声明式管理
- 提供身份模板功能
- 可手动创建 SpiffeID 资源

**优势：**

- 最灵活的配置方式
- 支持复杂的身份策略
- 与 GitOps 工作流集成良好

**适用场景：** 需要精细控制的复杂环境

## DNS 名称支持

在 `reconcile` 和 `crd` 模式中，可以为 Pod 的注册条目添加 DNS 名称：

**Reconcile 模式：** 添加所有可能的访问名称
**CRD 模式：** 仅添加 `<service>.<namespace>.svc` 格式的名称

{{<callout warning 注意>}}
某些服务（如 etcd）使用反向 DNS 验证客户端证书中的 DNS SAN。由于 Kubernetes 客户端的 IP 地址可能无法进行有效的反向 DNS 解析，可能导致验证失败。如果使用 X.509-SVID 对此类服务进行身份验证，建议禁用 DNS 名称功能。
{{</callout>}}

## 最佳实践

### 模式选择建议

1. **生产环境：** 优先选择 `reconcile` 模式
2. **复杂身份策略：** 选择 `crd` 模式
3. **简单测试：** 可使用 `webhook` 模式

### 安全配置

1. **启用客户端验证：** 避免设置 `insecure_skip_client_verification = true`
2. **命名空间隔离：** 合理配置 `disabled_namespaces`
3. **最小权限原则：** 为注册器配置最小必需的 RBAC 权限

### 性能优化

1. **领导者选举：** 多副本部署时启用 `leader_election`
2. **DNS 名称：** 根据实际需求决定是否启用 `add_pod_dns_names`
3. **监控指标：** 配置 `metrics_addr` 进行性能监控

## 故障排查

### 常见问题

1. **Pod 无法获取 SVID：**
   - 检查注册器日志
   - 验证网络连接
   - 确认 SPIRE 代理状态

2. **Webhook 模式准入失败：**
   - 检查证书配置
   - 验证网络策略
   - 查看 API 服务器日志

3. **权限错误：**
   - 验证 ServiceAccount 和 RBAC 配置
   - 检查命名空间权限

### 监控指标

在 `reconcile` 模式下，可通过以下指标监控注册器状态：

- Pod 处理速度
- 注册成功/失败率
- 控制器健康状态

## 平台兼容性

- **支持系统：** Linux/Unix 系统
- **Kubernetes 版本：** 1.19+
- **SPIRE 版本：** 1.5.0+
