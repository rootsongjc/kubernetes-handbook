---
weight: 6
title: "结构化认证与鉴权配置"
linktitle: 结构化认证与鉴权配置
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: structured-authentication-authorization
description: "介绍 kube-apiserver 的结构化认证配置（AuthenticationConfiguration，v1.34 GA）与结构化鉴权配置（AuthorizationConfiguration，v1.32 GA）：用声明式文件取代 --oidc-* 与 --authorization-mode 等命令行参数，支持多 JWT 签发方、CEL 声明映射与校验、多 Webhook 授权链、匹配条件与失败策略，并可热加载。"
---

> 把认证与鉴权从一长串命令行参数搬进可版本化、可热加载、可用 CEL 表达的配置文件，是 API Server 安全配置近年最实用的一步。

kube-apiserver 的认证与鉴权长期依赖命令行参数：OIDC 用 `--oidc-issuer-url`、`--oidc-client-id` 等十余个参数且只能配置一个签发方；授权链用 `--authorization-mode=Node,RBAC,Webhook` 加一组 `--authorization-webhook-*` 参数，且只能有一个 Webhook。任何变更都要重启 API Server，复杂的声明映射更是无从谈起。Kubernetes v1.29 同时引入了结构化认证配置与结构化鉴权配置两个 Alpha 特性，分别在 v1.34 与 v1.32 GA，用 `apiserver.config.k8s.io/v1` API 组下的两种配置对象替代上述参数。

## 结构化认证配置

结构化认证配置（KEP-3331）通过 `--authentication-config=<文件路径>` 指定，文件内容为 `AuthenticationConfiguration` 对象。它与 `--oidc-*` 参数**互斥**：同时指定会导致 API Server 启动失败。

### 核心能力

- 最多配置 64 个 JWT 认证器，每个拥有唯一的 `issuer.url`，可以同时接入企业 IdP、CI 系统、云厂商身份服务等多个签发方
- 用 `discoveryURL` 把 OIDC 发现端点与 `issuer.url` 解耦，支持签发方位于集群内或经代理访问
- 单个签发方可接受多个 `audiences`
- 用 CEL 表达式把 JWT 声明映射为用户名、组、UID 与 extra 属性，并对声明和最终用户对象做校验
- 配置可选 `anonymous` 段控制匿名访问只对特定路径开放（v1.34 GA）
- API Server 监听文件变化自动重载，无需重启；可通过 `apiserver_authentication_config_controller_automatic_reload_last_timestamp_seconds` 指标观察

### 配置示例

以下示例接入两个签发方：企业 OIDC 用于人员登录，GitHub Actions 的 OIDC 用于 CI 流水线；并把匿名访问限制在健康检查端点：

```yaml
apiVersion: apiserver.config.k8s.io/v1
kind: AuthenticationConfiguration
jwt:
- issuer:
    url: https://login.example.com
    audiences:
    - kubernetes
    audienceMatchPolicy: MatchAny
  claimValidationRules:
  - expression: 'claims.hd == "example.com"'
    message: 仅允许 example.com 域的账号
  - expression: 'claims.exp - claims.nbf <= 86400'
    message: Token 有效期不得超过 24 小时
  claimMappings:
    username:
      claim: email
      prefix: "oidc:"
    groups:
      expression: 'claims.groups.map(g, "oidc:" + g)'
    uid:
      claim: sub
    extra:
    - key: example.com/department
      valueExpression: claims.department
  userValidationRules:
  - expression: "!user.username.startsWith('system:')"
    message: 用户名不得使用 system: 保留前缀
- issuer:
    url: https://token.actions.githubusercontent.com
    audiences:
    - https://kubernetes.example.com
  claimMappings:
    username:
      expression: '"gha:" + claims.repository'
    groups:
      expression: 'claims.ref == "refs/heads/main" ? ["gha:prod-deployers"] : ["gha:dev-deployers"]'
anonymous:
  enabled: true
  conditions:
  - path: /livez
  - path: /readyz
  - path: /healthz
```

几个关键字段的语义如下：

{{< table title="AuthenticationConfiguration 关键字段" >}}

| 字段                         | 说明                                                                                  |
|------------------------------|---------------------------------------------------------------------------------------|
| `issuer.url`                 | JWT 的 `iss` 声明必须与之相等；不得与 `--service-account-issuer` 冲突                    |
| `issuer.discoveryURL`        | 可选，覆盖 `{url}/.well-known/openid-configuration` 的拉取地址                           |
| `issuer.audiences`           | 可接受的 `aud` 集合；多个值时 `audienceMatchPolicy` 必须为 `MatchAny`                     |
| `claimValidationRules`       | `claim`+`requiredValue` 或 CEL `expression`，全部通过才认证成功                          |
| `claimMappings.username`     | 唯一必填的映射；`claim`+`prefix` 与 `expression` 二选一；使用 `email` 时必须同时校验 `email_verified` |
| `claimMappings.groups/uid/extra` | 组、UID、extra 属性映射，均支持 CEL                                                  |
| `userValidationRules`        | 对映射后的 `user` 对象做最终校验，常用于禁止 `system:` 前缀                              |
| `anonymous`                  | 控制匿名认证开关与允许的路径；设置后不能再用 `--anonymous-auth` 参数                      |

{{< /table >}}

CEL 表达式中 `claims` 变量是 JWT 载荷的映射，`user` 变量是映射后的用户信息对象，可用 `has()`、`?.`、`orValue()` 等安全访问可选声明。

### 与 ServiceAccount Token 的关系

ServiceAccount Token 由 API Server 自身签发，其签发方由 `--service-account-issuer` 指定，不需要也不允许写进 `jwt` 列表。但集群对外暴露的 OIDC 发现端点让 ServiceAccount Token 可以反过来被云厂商 IAM、Vault 等外部系统验证，形成工作负载身份联合。

## 结构化鉴权配置

结构化鉴权配置（KEP-3221）通过 `--authorization-config=<文件路径>` 指定，文件内容为 `AuthorizationConfiguration` 对象，与 `--authorization-mode`、`--authorization-webhook-*` 参数互斥。授权器按列表顺序依次评估，任一授权器给出允许或拒绝即终止；全部无意见则拒绝。

### 核心能力

- 授权链中可以包含**多个** Webhook 授权器，每个有独立的名称、缓存 TTL、超时与失败策略
- 用 CEL `matchConditions` 预过滤请求，只把需要的请求发给 Webhook，避免无谓的网络往返
- `failurePolicy` 明确 Webhook 不可用时是 `Deny` 还是 `NoOpinion`（交给后续授权器）
- 每个授权器的名称会出现在指标中，便于观测各授权器的延迟与裁决分布
- 文件变化自动重载

### 配置示例

以下示例把对 `kube-system` 命名空间的资源请求先交给外部策略引擎审查，其余请求走 Node 与 RBAC，最后由一个集群内 Webhook 兜底：

```yaml
apiVersion: apiserver.config.k8s.io/v1
kind: AuthorizationConfiguration
authorizers:
- type: Webhook
  name: kube-system-guard
  webhook:
    authorizedTTL: 30s
    unauthorizedTTL: 30s
    timeout: 3s
    subjectAccessReviewVersion: v1
    matchConditionSubjectAccessReviewVersion: v1
    failurePolicy: Deny
    connectionInfo:
      type: KubeConfigFile
      kubeConfigFile: /etc/kubernetes/authz-webhook.kubeconfig
    matchConditions:
    - expression: has(request.resourceAttributes)
    - expression: request.resourceAttributes.namespace == 'kube-system'
    - expression: "!('system:serviceaccounts:kube-system' in request.groups)"
- type: Node
  name: node
- type: RBAC
  name: rbac
- type: Webhook
  name: in-cluster-policy
  webhook:
    authorizedTTL: 5m
    unauthorizedTTL: 30s
    timeout: 3s
    subjectAccessReviewVersion: v1
    matchConditionSubjectAccessReviewVersion: v1
    failurePolicy: NoOpinion
    connectionInfo:
      type: InClusterConfig
```

`matchConditions` 的求值规则是：任一表达式为 `false` 则跳过该 Webhook；全部为 `true` 才调用；若出现求值错误且没有 `false`，则按 `failurePolicy` 处理。表达式可访问 `request` 变量（v1 版本的 `SubjectAccessReview.spec`），包括 `request.user`、`request.groups`、`request.resourceAttributes`、`request.nonResourceAttributes` 等。

### 与 RBAC 的分工

RBAC 仍然是绝大多数集群的主力授权器，结构化配置并不取代它，而是让它与 Webhook 的组合更可控：

- 把 Webhook 放在 RBAC **之前**并设 `failurePolicy: Deny`，适合"必须经外部策略引擎批准"的高敏感操作
- 把 Webhook 放在 RBAC **之后**并设 `failurePolicy: NoOpinion`，适合"RBAC 无意见时再问外部系统"的补充授权
- 用 `matchConditions` 把 Webhook 的作用范围限制在特定命名空间、资源或用户组，RBAC 继续以零网络开销处理其余请求

v1.34 GA 的按选择器授权（`AuthorizeWithSelectors`）进一步让 Webhook 授权器可以读取 `list`/`watch` 请求中的字段与标签选择器，实现"节点只能列出自己的 Pod"这类细粒度规则。

## 运维注意事项

- 所有控制面节点必须使用**内容一致**的配置文件；kubeadm 集群可通过 `extraArgs` 与 `extraVolumes` 把文件挂入静态 Pod
- 升级/降级前确认文件格式与目标版本兼容，v1.32/v1.34 之前的版本只接受 `v1beta1`
- 文件语法错误会导致重载失败但不影响正在运行的 API Server；监控 `apiserver_authentication_config_controller_automatic_reload_last_timestamp_seconds` 与对应的鉴权指标确认重载成功
- 认证侧与 `--oidc-*` 互斥、鉴权侧与 `--authorization-mode` 互斥，迁移时需一次性切换
- CEL 表达式有运行成本上限，过于复杂的映射会在启动时被拒绝

## 总结

结构化认证与鉴权配置把 API Server 的身份与权限边界从命令行参数升级为声明式、可热加载、可用 CEL 表达的配置对象：认证侧支持多签发方与灵活的声明映射，鉴权侧支持多 Webhook 授权链与请求预过滤。它们与 RBAC、ServiceAccount 绑定 Token 一起，构成了当前 Kubernetes 访问控制的完整图景。

## 参考文献

- [Authenticating: Authentication configuration from a file - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/authentication/#using-authentication-configuration)
- [Authorization: Configuring the API Server using an authorization config file - kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/authorization/#configuring-the-api-server-using-an-authorization-config-file)
- [kube-apiserver Configuration (v1) - kubernetes.io](https://kubernetes.io/docs/reference/config-api/apiserver-config.v1/)
- [KEP-3331: Structured Authentication Configuration - github.com](https://github.com/kubernetes/enhancements/tree/master/keps/sig-auth/3331-structured-authentication-configuration)
- [KEP-3221: Structured Authorization Configuration - github.com](https://github.com/kubernetes/enhancements/tree/master/keps/sig-auth/3221-structured-authorization-configuration)
