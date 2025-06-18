---
weight: 37
title: 准入控制器（Admission Controller）
linktitle: 准入控制器
date: '2022-05-21T00:00:00+08:00'
type: book
description: "深入了解 Kubernetes 准入控制器的工作原理、类型分类和配置方法，包括变更和验证准入控制的详细说明，以及各种内置准入控制器的功能介绍和推荐配置。"
keywords:
- api
- kubernetes
- pod
- server
- 准入
- 命名
- 对象
- 控制器
- 请求
- 验证
---

准入控制器（Admission Controller）是 Kubernetes API Server 中的重要组件，位于认证和授权之后，在对象被持久化到 etcd 之前拦截对 API Server 的请求。准入控制器主要用于执行策略检查、资源验证和对象修改等操作，是 Kubernetes 集群安全和资源管理的关键机制。

## 准入控制器类型

准入控制器分为两种主要类型，它们在请求处理流程中按顺序执行：

### 变更（Mutating）准入控制

- **功能**：修改请求中的对象内容
- **执行时机**：在验证准入控制之前执行
- **典型用途**：自动注入 sidecar 容器、设置默认值、添加标签或注解等
- **代表控制器**：`MutatingAdmissionWebhook`、`DefaultStorageClass`

### 验证（Validating）准入控制

- **功能**：验证请求中的对象是否符合策略要求
- **执行时机**：在变更准入控制之后执行
- **典型用途**：安全策略检查、资源配额验证、命名规范检查等
- **代表控制器**：`ValidatingAdmissionWebhook`、`ResourceQuota`

## 执行流程

当请求到达 API Server 时，准入控制器的执行顺序如下：

1. **认证**（Authentication）
2. **授权**（Authorization）
3. **变更准入控制**（Mutating Admission）
4. **对象模式验证**（Object Schema Validation）
5. **验证准入控制**（Validating Admission）
6. **持久化到 etcd**

## 内置准入控制器详解

### 核心准入控制器

- **NamespaceLifecycle**：确保命名空间的生命周期管理，防止在终止中的命名空间创建资源，保护系统命名空间
- **ServiceAccount**：为 Pod 自动挂载服务账号和相关 Token
- **LimitRanger**：强制执行命名空间中的资源限制策略
- **ResourceQuota**：确保资源使用不超过命名空间配额限制

### 存储相关控制器

- **DefaultStorageClass**：为未指定存储类的 PVC 自动添加默认存储类
- **StorageObjectInUseProtection**：防止删除正在使用的 PV 和 PVC

### 安全相关控制器

- **PodSecurityPolicy**：（已废弃）根据 Pod 安全策略验证 Pod 规格
- **NodeRestriction**：限制 kubelet 只能修改其所在节点的 Node 和 Pod 对象
- **SecurityContextDeny**：阻止设置特权安全上下文

### Webhook 控制器

- **MutatingAdmissionWebhook**：调用外部 webhook 进行对象变更
- **ValidatingAdmissionWebhook**：调用外部 webhook 进行对象验证

### 其他常用控制器

- **DefaultTolerationSeconds**：为 Pod 设置默认的污点容忍时间
- **Priority**：处理 Pod 优先级设置
- **OwnerReferencesPermissionEnforcement**：保护 ownerReferences 字段的访问权限

## 配置和管理

### 启用准入控制器

使用 `--enable-admission-plugins` 参数启用准入控制器：

```bash
--enable-admission-plugins=NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,DefaultTolerationSeconds,MutatingAdmissionWebhook,ValidatingAdmissionWebhook,ResourceQuota
```

### 禁用准入控制器

使用 `--disable-admission-plugins` 参数禁用特定控制器：

```bash
--disable-admission-plugins=DefaultStorageClass
```

## 推荐配置

### Kubernetes 1.25+

```bash
--enable-admission-plugins=NamespaceLifecycle,LimitRanger,ServiceAccount,TaintNodesByCondition,Priority,DefaultTolerationSeconds,DefaultStorageClass,StorageObjectInUseProtection,PersistentVolumeClaimResize,RuntimeClass,CertificateApproval,CertificateSigning,CertificateSubjectRestriction,DefaultIngressClass,MutatingAdmissionWebhook,ValidatingAdmissionWebhook,ResourceQuota
```

### 基础推荐配置

对于大多数生产环境，以下配置提供了良好的安全性和功能性平衡：

```bash
--enable-admission-plugins=NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,DefaultTolerationSeconds,MutatingAdmissionWebhook,ValidatingAdmissionWebhook,ResourceQuota
```

## 自定义准入控制器

### Admission Webhook

通过 Admission Webhook，可以实现自定义的准入控制逻辑：

1. **创建 Webhook 服务**：实现 HTTP 服务处理准入请求
2. **配置 Webhook**：创建 `MutatingAdmissionWebhook` 或 `ValidatingAdmissionWebhook` 资源
3. **证书配置**：配置 TLS 证书确保通信安全

### 最佳实践

- **最小权限原则**：只启用必需的准入控制器
- **性能考虑**：注意 Webhook 的响应时间和可用性
- **故障转移**：配置适当的失败策略（Fail 或 Ignore）
- **监控和日志**：监控准入控制器的性能和错误率

## 故障排查

### 常见问题

1. **请求被拒绝**：检查相关准入控制器的配置和策略
2. **Webhook 超时**：检查 Webhook 服务的可用性和网络连接
3. **证书问题**：验证 Webhook 的 TLS 证书配置

### 调试方法

- 查看 API Server 日志
- 使用 `kubectl` 的 `--v=8` 参数获取详细日志
- 检查 Webhook 服务的日志和指标

## 参考资料

- [Using Admission Controllers - Kubernetes 官方文档](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/)
- [Dynamic Admission Control - Kubernetes 官方文档](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/)
