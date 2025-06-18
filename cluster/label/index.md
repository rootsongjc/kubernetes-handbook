---
weight: 24
title: Label
date: '2022-05-21T00:00:00+08:00'
type: book
description: "Kubernetes Label 是附着到对象上的键值对，用于标识和选择对象。本文详细介绍了 Label 的语法规则、选择器类型，以及在不同场景下的使用方法。"
keywords:
- kubernetes
- label
- selector
- 标签
- 对象选择
- 资源管理
---

Label 是附着到 Kubernetes 对象上（如 Pod、Service 等）的键值对标签。可以在创建对象时指定，也可以在对象创建后随时添加或修改。Label 的值对系统本身没有语义含义，主要用于用户识别和组织资源。

```json
"labels": {
  "app": "nginx",
  "version": "v1.2.0",
  "environment": "production"
}
```

Kubernetes 会为 Label 建立索引和反向索引来优化查询和监听操作，在 UI 和命令行中会按字母顺序排序显示。建议不要在 Label 中使用大型、非标识性的结构化数据，此类数据应使用 Annotation。

## 使用场景与最佳实践

Label 能够将组织架构映射到系统架构上，便于微服务的管理和运维。常见的标签类型包括：

**环境标识**

- `environment: dev|staging|production`
- `release: stable|canary|beta`

**应用架构**

- `tier: frontend|backend|database`
- `component: web|api|cache`

**业务划分**

- `team: platform|product|data`
- `project: project-a|project-b`
- `customer: customer-x|customer-y`

**版本管理**

- `version: v1.2.0`
- `track: daily|weekly`

## 语法规则

### Label Key 规范

**格式要求：**

- 总长度不超过 63 个字符
- 可使用前缀，格式为 `prefix/name`，用 `/` 分隔
- 前缀必须是有效的 DNS 子域名，不超过 253 个字符
- 系统组件创建的 Label 必须包含前缀
- `kubernetes.io/` 和 `k8s.io/` 前缀由 Kubernetes 保留

**字符规则：**

- 必须以字母或数字开头和结尾
- 中间可包含字母、数字、连字符（`-`）、下划线（`_`）和点（`.`）

### Label Value 规范

- 长度不超过 63 个字符
- 可以为空字符串
- 非空时必须以字母或数字开头和结尾
- 中间可包含字母、数字、连字符（`-`）、下划线（`_`）和点（`.`）

## Label Selector

Label Selector 用于根据标签选择对象集合，支持两种语法：

### 基于等值的选择器（Equality-based）

使用 `=`、`==`、`!=` 操作符：

```bash
# 选择环境为 production 且层级为 frontend 的 Pod
kubectl get pods -l environment=production,tier=frontend

# 选择不在 development 环境的 Pod
kubectl get pods -l environment!=development
```

### 基于集合的选择器（Set-based）

使用 `in`、`notin`、`exists` 操作符：

```bash
# 选择环境为 production 或 qa 的 Pod
kubectl get pods -l 'environment in (production,qa)'

# 选择层级为 frontend 但环境不是 development 的 Pod
kubectl get pods -l 'tier in (frontend),environment notin (development)'

# 选择包含 environment 标签的 Pod（无论值是什么）
kubectl get pods -l environment

# 选择不包含 environment 标签的 Pod
kubectl get pods -l '!environment'
```

## 在 API 对象中使用

### 简单选择器

在 Service、ReplicationController 等对象中使用等值选择器：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: nginx
    environment: production
  ports:
  - port: 80
```

### 高级选择器

在 Deployment、ReplicaSet、DaemonSet、Job 等对象中支持复杂选择器：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  selector:
    matchLabels:
      app: nginx
    matchExpressions:
    - key: tier
      operator: In
      values: [frontend, backend]
    - key: environment
      operator: NotIn
      values: [development]
    - key: version
      operator: Exists
```

### 节点和 Pod 亲和性

在调度策略中使用更复杂的选择器语法：

```yaml
apiVersion: v1
kind: Pod
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: kubernetes.io/arch
            operator: In
            values: [amd64, arm64]
          - key: node-type
            operator: NotIn
            values: [spot]
    podAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app: cache
          topologyKey: kubernetes.io/hostname
```

## 实际应用示例

通过 Label Selector，Service 可以将具有相同标签的 Pod 组合成一个服务对外提供访问：

![Label 示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/cluster/label/labels.webp)
{width=803 height=588}

## 注意事项

1. **性能考虑**：避免使用过多的唯一标签值，这会影响索引性能
2. **命名约定**：建立统一的标签命名规范，便于团队协作
3. **必要标签**：为所有资源添加基本标签如 `app`、`version`、`environment`
4. **标签传播**：确保相关资源使用一致的标签以便于管理和选择
