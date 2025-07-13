---
weight: 104
title: 使用 Kustomize 配置 Kubernetes 应用
linktitle: Kustomize
date: '2023-07-04T08:40:00+08:00'
type: book
description: Kustomize 是一个强大的 Kubernetes 配置管理工具，支持声明式配置定制、多环境管理和配置复用。本文介绍 Kustomize 的核心功能、最佳实践以及与 kubectl 的集成使用方法。
keywords:
- kubectl
- kubernetes
- kustomize
- 使用
- 命令
- 定制
- 应用程序
- 文件
- 生成
- 配置
---

[Kustomize](https://kustomize.io/) 是一个专为 Kubernetes 设计的声明式配置管理工具，它允许用户通过分层和声明式的方式定制和管理应用程序配置，而无需直接修改原始的清单文件。Kustomize 现已集成到 kubectl 中，成为 Kubernetes 原生的配置管理解决方案。

## Kustomize 核心功能

### 配置合并与分层管理

Kustomize 采用基础配置（base）和覆盖配置（overlay）的分层架构：

- **基础配置**：作为应用程序的基准配置，包含通用的 Kubernetes 资源定义
- **覆盖配置**：针对特定环境或需求的定制配置，可以修改、添加或删除基础配置中的内容

这种分层方式实现了配置的继承和定制，提高了配置管理的灵活性。

### 声明式配置管理

Kustomize 使用 YAML 格式的 `kustomization.yaml` 文件来描述配置定制规则，支持：

- 资源引用和组合
- 名称前缀和后缀添加
- 标签和注释的统一管理
- 环境变量和配置映射的替换
- 镜像标签的动态修改

### 配置复用与共享

通过定义可重用的配置组件和补丁（patches），Kustomize 支持：

- 跨项目的配置共享
- 组件化的配置管理
- 减少重复配置的维护成本

### 多环境配置管理

Kustomize 天然支持多环境部署，允许为不同环境（开发、测试、生产）创建特定的覆盖配置，实现一套基础配置适配多个环境的需求。

## 实践示例

以下是一个完整的 Kustomize 配置管理示例，展示如何管理一个名为 "webapp" 的应用程序。

### 基础配置结构

以下是相关的配置示例：

```
base/
├── kustomization.yaml
├── deployment.yaml
├── service.yaml
└── configmap.yaml
```

**base/kustomization.yaml**：

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- deployment.yaml
- service.yaml
- configmap.yaml

commonLabels:
   app: webapp
```

### 环境特定配置

以下是相关的配置示例：

```
overlays/
├── dev/
│   ├── kustomization.yaml
│   └── replica-patch.yaml
└── prod/
      ├── kustomization.yaml
      ├── replica-patch.yaml
      └── resource-limits.yaml
```

**overlays/dev/kustomization.yaml**：

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: webapp-dev

resources:
- ../../base

patchesStrategicMerge:
- replica-patch.yaml

images:
- name: webapp
   newTag: dev-latest
```

**overlays/prod/kustomization.yaml**：

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: webapp-prod

resources:
- ../../base

patchesStrategicMerge:
- replica-patch.yaml
- resource-limits.yaml

images:
- name: webapp
   newTag: v1.2.3

replicas:
- name: webapp-deployment
   count: 3
```

## 与 kubectl 集成使用

自 Kubernetes 1.14 版本起，Kustomize 已内置于 kubectl 中，提供了原生的配置管理能力。

### 常用命令

1. **直接应用配置**：

    ```bash
    kubectl apply -k overlays/dev
    ```

2. **预览生成的清单**：

    ```bash
    kubectl kustomize overlays/prod
    ```

3. **查看配置差异**：

    ```bash
    kubectl diff -k overlays/prod
    ```

4. **删除应用的资源**：

    ```bash
    kubectl delete -k overlays/dev
    ```

### 高级功能

**使用 Kustomize 进行配置验证**：

```bash
# 验证配置语法
kubectl kustomize overlays/prod --enable-alpha-plugins

# 结合其他工具进行验证
kubectl kustomize overlays/prod | kubectl apply --dry-run=client -f -
```

**与 CI/CD 集成**：

```bash
# 在 CI/CD 流水线中使用
kubectl kustomize overlays/prod > final-manifest.yaml
kubectl apply -f final-manifest.yaml
```

## 最佳实践

1. **目录结构规范**：采用清晰的目录结构，区分 base 和 overlays
2. **版本控制**：将所有配置文件纳入版本控制系统
3. **配置验证**：在部署前验证生成的配置文件
4. **文档维护**：为复杂的配置定制添加说明文档
5. **安全考虑**：避免在配置文件中硬编码敏感信息

通过 Kustomize，你可以实现 Kubernetes 配置的标准化管理，提高配置的可维护性和部署的一致性。更多详细信息请参考 [Kubernetes 官方文档](https://kubernetes.io/zh-cn/docs/tasks/manage-kubernetes-objects/kustomization/)。
