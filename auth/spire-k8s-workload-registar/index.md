---
weight: 49
title: SPIRE Kubernetes 工作负载注册器
date: '2022-06-08T16:00:00+08:00'
type: book
summary: 本文介绍了如何在 Kubernetes 中使用 SPIRE 工作负载注册器，包括工作负载注册器部署的方式，注册模式等。
---

SPIRE Kubernetes 工作负载注册器实现了一个 Kubernetes `ValidatingAdmissionWebhook`，便于在 Kubernetes 内自动注册工作负载。

## 配置

### 命令行配置

注册器有以下命令行选项：

| 标志      | 描述                      | 默认值                        |
| :-------- | :------------------------ | :---------------------------- |
| `-config` | 磁盘上 HCL 配置文件的路径 | `k8s-workload-registrar.conf` |

### HCL 配置

配置文件是注册器所必需的。它包含 [HCL](https://github.com/hashicorp/hcl) 编码的配置项。

| 键                    | 类型     | 必需的？ | 描述                                                         | 默认                          |
| :-------------------- | :------- | :------- | :----------------------------------------------------------- | :---------------------------- |
| `log_level`           | string   | 必需的   | 日志级别（`panic`、 `fatal`、 `error`、 `warn`、 `warning`、 `info`、 `debug`、`trace` 之一） | `info`                        |
| `log_path`            | string   | 可选的   | 写入日志的磁盘路径                                           |                               |
| `trust_domain`        | string   | 必需的   | SPIRE 服务器的信任域                                         |                               |
| `agent_socket_path`   | string   | 可选的   | SPIRE 代理的 Unix 域套接字的路径。如果 `server_address` 不是 unix 域套接字地址，则为必需。 |                               |
| `server_address`      | string   | 必需的   | SPIRE 服务器的地址。可以使用 `unix:///path/to/socket` 指定本地套接字。这与代理套接字不同。 |                               |
| `server_socket_path`  | string   | 可选的   | SPIRE 服务器的 Unix 域套接字的路径，相当于指定带有 `unix://` 前缀的 `server_address` |                               |
| `cluster`             | string   | 必需的   | 用于在其下注册节点 / 工作负载的逻辑集群。必须与 SPIRE SERVER PSAT 节点证明者配置相匹配。 |                               |
| `pod_label`           | string   | 可选的   | pod 标签，用于基于标签的工作负载注册                         |                               |
| `pod_annotation`      | string   | 可选的   | pod 注解，用于基于注解的工作负载注册                         |                               |
| `mode`                | string   | 可选的   | 如何使用 `webhook`、 `reconcile` 或运行注册器 `crd`。        | `webhook`                     |
| `disabled_namespaces` | []string | 可选的   | 逗号分隔的命名空间列表，用于禁用自动 SVID 生成               | `kube-system`、 `kube-public` |

以下配置指令是针对 `webhook` 模式的：

| 键                                  | 类型    | 必需的？ | 描述                                                         | 默认         |
| :---------------------------------- | :------ | :------- | :----------------------------------------------------------- | :----------- |
| `addr`                              | string  | 必需的   | 将 HTTPS 监听器绑定到的地址                                  | `:8443`      |
| `cert_path`                         | string  | 必需的   | PEM 编码的服务器 TLS 证书的磁盘路径                          | `cert.pem`   |
| `key_path`                          | string  | 必需的   | PEM 编码的服务器 TLS 密钥的磁盘路径                          | `key.pem`    |
| `cacert_path`                       | string  | 必需的   | 用于验证客户端（即 API 服务器）的 CA 证书的磁盘路径          | `cacert.pem` |
| `insecure_skip_client_verification` | boolean | 必需的   | 如果为 true，则跳过客户端证书验证（在这种情况下 `cacert_path` 被忽略）。 | `false`      |

以下配置是针对 `reconcile` 模式的：

| 键                              | 类型   | 必需的？ | 描述                                                         | 默认                  |
| :------------------------------ | :----- | :------- | :----------------------------------------------------------- | :-------------------- |
| `leader_election`               | bool   | 可选的   | 启用 / 禁用领导者选举。如果你有多个注册器副本正在运行，请启用 | false                 |
| `leader_election_resource_lock` | string | 可选的   | 配置用于领导选举锁的资源类型                                 | `configmaps`          |
| `metrics_addr`                  | string | 可选的   | 公开指标的地址，`0` 用于禁用                                 | `:8080`               |
| `controller_name`               | string | 可选的   | 构成用于父 ID 的 spiffe ID 的一部分                          | `spire-k8s-registrar` |
| `add_pod_dns_names`             | bool   | 可选的   | 启用 / 禁用将 k8s DNS 名称添加到 pod SVID。                  | 错误的                |
| `cluster_dns_zone`              | string | 可选的   | k8s 集群中用于服务的 DNS 区域。                              | `cluster.local`       |

关于 CRD 配置指令，见 [CRD 模式配置](https://github.com/spiffe/spire/blob/main/support/k8s/k8s-workload-registrar/mode-crd/README.md#configuration)。

### 示例

```bash
log_level = "debug"
trust_domain = "domain.test"
server_socket_path = "/tmp/spire-server/private/api.sock"
cluster = "production"
```

## 工作负载注册

当在 webhook、reconcile 或 crd 模式下运行时，`pod_controller=true` 的条目将被自动创建为 Pod。可用的工作负载注册模式包括：

| 注册模式    | pod_label         | pod_annotation         | identity_template         | 基于服务账户 |
| ----------- | ----------------- | ---------------------- | ------------------------- | ------------ |
| `webhook`   | 由 pod_label 指定 | 由 pod_annotation 指定 | *不可用*                  | 服务账户     |
| `reconcile` | 由 pod_label 指定 | 由 pod_annotation 指定 | *不可用*                  | 服务账户     |
| `crd`       | 由 pod_label 指定 | 由 pod_annotation 指定 | 由 identity_template 指定 | *不可用*     |

如果对 [基于服务账户的 SPIFFE ID](#service-account-based-workload-registration) `webhook` 使用和 `reconcile` 模式，请不要指定 `pod_label` 或 `pod_annotation`。如果你使用基于标签的 SPIFFE ID，请仅指定 `pod_label`。如果你使用基于注解的 SPIFFE ID，请仅指定 `pod_annotation`

对于 `crd` 模式，如果既不选择 `pod_label` 也不选择 `pod_annotation` 工作负载注册模式， `identity_template` 则作为默认配置： `ns/{{.Pod.Namespace}}/sa/{{.Pod.ServiceAccount}}`

新创建的 SVID 可能需要几秒钟才能对工作负载可用。

### 联合条目注册

pod 注解 `spiffe.io/federatesWith` 可用于创建与其他信任域联合的 SPIFFE ID。

要指定多个信任域，请用逗号分隔它们。

例子：

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    spiffe.io/federatesWith: example.com,example.io,example.ai
  name: test
spec:
  containers:
  ...
```

### 基于服务账户的工作负载注册{#service-account-based-workload-registration}

授予工作负载的 SPIFFE ID 源自：

1. 服务账户
2. 可配置的 pod 标签
3. 可配置的 pod 注解

服务账户派生的工作负载注册将服务账户映射到表单的 SPIFFE ID `spiffe://<TRUSTDOMAIN>/ns/<NAMESPACE>/sa/<SERVICEACCOUNT>`。例如，如果一个 pod 使用命名空间中的服务账户 `blog` 进入 `production`，则将创建以下注册条目：

```
Entry ID      : 200d8b19-8334-443d-9494-f65d0ad64eb5
SPIFFE ID     : spiffe://example.org/ns/production/sa/blog
Parent ID     : ...
TTL           : default
Selector      : k8s:ns:production
Selector      : k8s:pod-name:example-workload-98b6b79fd-jnv5m
```

### 基于标签的工作负载注册

基于标签的工作负载注册将 pod 标签值映射到表单的 SPIFFE ID `spiffe://<TRUSTDOMAIN>/<LABELVALUE>`。例如，如果注册器配置了 `spire-workload` 标签，并且 pod 带有 `spire-workload=example-workload`，则将创建以下注册条目：

```
Entry ID      : 200d8b19-8334-443d-9494-f65d0ad64eb5
SPIFFE ID     : spiffe://example.org/example-workload
Parent ID     : ...
TTL           : default
Selector      : k8s:ns:production
Selector      : k8s:pod-name:example-workload-98b6b79fd-jnv5m
```

不包含 pod 标签的 pod 将被忽略。

### 基于注解的工作负载注册

基于注解的工作负载注册将 pod 注解值映射到表单的 SPIFFE ID `spiffe://<TRUSTDOMAIN>/<ANNOTATIONVALUE>`。通过使用该模式，可以自由设置 SPIFFE ID 路径。例如，如果注册器配置了 `spiffe.io/spiffe-id` 注解并且 pod 带有 `spiffe.io/spiffe-id: production/example-workload`，则将创建以下注册条目：

```
Entry ID      : 200d8b19-8334-443d-9494-f65d0ad64eb5
SPIFFE ID     : spiffe://example.org/production/example-workload
Parent ID     : ...
TTL           : default
Selector      : k8s:ns:production
Selector      : k8s:pod-name:example-workload-98b6b79fd-jnv5m
```

不包含 pod 注解的 pod 将被忽略。

### 基于身份模板的工作负载注册

这是特定于 `crd` 模式的。请参阅 `crd` 模式文档中的[基于身份模板的工作负载注册](https://github.com/spiffe/spire/blob/main/support/k8s/k8s-workload-registrar/mode-crd/README.md#identity-template-based-workload-registration)。

## 部署

注册器既可以作为独立 Deployment 部署，也可以作为 SPIRE 服务器 pod 中的容器部署。如果它是独立部署的，则需要手动创建与注册器部署相匹配的管理员注册条目。

如果它被部署为 SPIRE 服务器 pod 中的容器，那么它会通过 Unix 域套接字与 SPIRE 服务器通信。它将需要访问包含套接字文件的共享卷。

### 协调模式配置

要使用协调模式（Reconcile Mode），你需要创建适当的角色并将它们绑定到你打算运行控制器的 ServiceAccount。

### CRD 模式配置

请参阅 [CRD Kubernetes Workload Registrar 快速入门](https://github.com/spiffe/spire/blob/main/support/k8s/k8s-workload-registrar/mode-crd/README.md#quick-start)。

### Webhook 模式配置

注册器将需要访问其服务器密钥对和用于验证客户端的 CA 证书。

设置验证准入控制器需要以下 K8s 对象：

- `Service` 指向 spire-server 容器中的注册端口
- `ValidatingWebhookConfiguration` 将注册器配置为验证准入控制器

此外，除非你禁用客户端身份验证 ( `insecure_skip_client_verification`)，否则你将需要：

- `Config` 注册器服务客户端的用户条目包含 API 服务器应用于向注册器进行身份验证的客户端证书 / 密钥。
- `AdmissionConfiguration` 描述 API 服务器可以在哪里找到包含 `Config`。该文件通过 `--admission-control-config-file` 标志传递给 API 服务器。

#### Webhook 模式安全注意事项

注册器默认对客户端进行身份验证。这是注册器整体安全性的一个非常重要的方面，因为注册器可用于提供对 SPIRE 服务器 API 的间接访问，尽管范围有限。除非你完全了解风险，否则不建议跳过客户端验证（通过 `insecure_skip_client_verification` 配置）。

#### 从 webhook 迁移

需要移除 k8s `ValidatingWebhookConfiguration`，否则 pod 可能无法准入。如果你使用默认配置，则可以通过以下方式完成：

```bash
kubectl validatingwebhookconfiguration delete k8s-workload-registrar-webhook
```

## DNS 名称

`reconcile` 和 `crd` 模式都提供了将 DNS 名称添加到 pod 的注册条目的能力。它们目前对应该添加哪些名称有不同的想法，`reconcile` 添加可用于访问 pod 的所有可能名称（通过服务或直接），并将 `crd` 模式限制为 `<service>.<namespace>.svc` 。该功能默认为关闭 `reconcile` 模式和打开 `crd` 模式。

{{<callout warning 注意>}}
已知某些软件会使用反向 DNS“验证”客户端证书中提供的 DNS 和 IP SAN。不能保证 Kubernetes 客户端会从一个具有有效反向 DNS 的 IP 地址进行连接，该地址与这些 DNS 名称实现所创建的名称之一相匹配，在这种情况下验证会失败。如果你打算使用 X509-SVID 对此类服务的客户端进行身份验证，则需要禁用将 DNS 名称添加到条目中。众所周知，这会影响 etcd。
{{</callout>}}

## 模式之间的差异

`webhook` 模式使用验证准入 Webhook 在准入时捕获 pod 创建 / 删除事件。它是注册器实现中的第一个，但存在以下问题：

- StatefulSet 的 add 和 delete 之间的竞争条件会经常导致 StatefulSet 没有条目；
- Webhook 的不可用要么必须完全阻止准入，要么你最终会得到没有条目的 pod；
- SPIRE 服务器错误必须完全阻止准入，否则你最终会得到没有条目的 pod；
- 当 `webhook/spire-server` 不可用时，它不会清理删除的 pod 的遗留条目；
- 条目不是单个节点的父节点，所有 SVID 都被泛洪到集群中的所有代理，这严重限制了可扩展性。因此，强烈建议不要使用 `webhook` 模式，但出于向后兼容的原因，它仍然是默认设置。

`reconcile` 模式和 `crd` 模式都使用协调控制器而不是 webhook。`reconcile` 模式和启用了 `pod_controller` 的 `crd` 模式具有与 webhook 类似的自动工作负载创建功能，但它们不会遭受相同的竞争条件，能够从注册器故障中恢复（并在之后清理），并且两者都还确保为 Pod 自动创建的条目仅限于适当的节点，以防止 SVID 泛滥。以这种方式使用时，`reconcile` 创建新条目可能比 `crd` 模式稍快，并且需要较少的配置。

`crd` 模式还提供了一个命名空间的 SpiffeID 自定义资源。这些资源供注册器内部使用，但也可以手动创建以允许创建任意 Spire 条目。如果你打算直接管理 SpiffeID 自定义资源，那么强烈建议你在运行控制器时启用 `crd` 模式的 webhook。

### 平台支持

该工具仅支持 UNIX 系统。

## 参考

- SPIRE Kubernetes Workload Registar - github.com
