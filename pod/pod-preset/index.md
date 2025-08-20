---
weight: 19
title: Pod Preset
date: '2022-05-21T00:00:00+08:00'
type: book
aliases:
  - /book/kubernetes-handbook/objects/pod-preset/
description: "Pod Preset 是 Kubernetes 中用于在 Pod 创建时自动注入配置信息的机制。本文介绍了 Pod Preset 的概念、工作原理以及替代方案，帮助理解如何在现代 Kubernetes 环境中实现类似功能。"
keywords:
- api
- io
- kubernetes
- pod
- podpreset
- preset
- spec
- volume
- 创建
- initcontainer
- 控制器
---

Pod Preset 是 Kubernetes 中的一个概念，用于在 Pod 创建时自动注入预设的配置信息，如 Secret、Volume、环境变量等，而无需逐个修改 Pod 模板。

{{< callout warning "重要提醒" >}}
Pod Preset 功能已在 Kubernetes v1.24 中正式移除。对于类似需求，推荐使用以下替代方案：

- **Init Container**：用于初始化工作
- **自定义准入控制器**：实现自动配置注入
- **Operator 模式**：通过自定义控制器管理应用配置
- **Helm Charts** 或 **Kustomize**：通过模板化管理配置
{{< /callout >}}

## Pod Preset 概述

Pod Preset 是一种 API 资源，用于在 Pod 创建阶段自动注入特定的运行时配置。这些配置可以包括：

- **环境变量**：应用运行时需要的环境配置
- **Secret 挂载**：敏感信息的安全注入
- **Volume 和 Volume Mount**：存储卷的自动挂载
- **其他运行时配置**：如资源限制、安全上下文等

### 核心优势

- **配置复用**：避免在每个 Pod 模板中重复配置
- **关注点分离**：应用开发者无需关心基础设施细节
- **统一管理**：集中管理通用配置和策略

## 工作机制

Pod Preset 基于 Kubernetes 的准入控制器（Admission Controller）机制工作：

### 执行流程

1. **检索阶段**：系统检索所有可用的 Pod Preset 资源
2. **匹配阶段**：通过标签选择器匹配目标 Pod
3. **合并阶段**：将 Pod Preset 定义的配置合并到 Pod 规范中
4. **错误处理**：合并失败时记录事件，不影响 Pod 创建
5. **标注阶段**：为修改过的 Pod 添加注释标记

### 配置范围

- **容器级别**：环境变量、卷挂载等会应用到所有容器
- **Pod 级别**：卷定义等会应用到整个 Pod
- **排除机制**：支持通过注释排除特定 Pod

{{< callout note "注意" >}}
Pod Preset 不会影响 Init Container，仅对主容器生效。
{{< /callout >}}

## 现代替代方案

在 Kubernetes v1.24 及以后版本，Pod Preset 功能已被移除。以下将介绍几种常见的现代替代方案，并分别给出简要说明和示例，帮助你实现自动化配置注入的需求。

### Init Container 方案

在使用 Init Container 方案时，可以通过初始化容器在主容器启动前完成配置文件、环境变量等的准备工作。下面是一个简单示例，展示如何通过 Init Container 生成配置并共享给主容器：

```yaml
apiVersion: v1
kind: Pod
spec:
    initContainers:
    - name: setup
        image: busybox
        command: ['sh', '-c', 'echo "初始化配置" > /shared/config']
        volumeMounts:
        - name: shared-data
            mountPath: /shared
    containers:
    - name: app
        image: nginx
        volumeMounts:
        - name: shared-data
            mountPath: /usr/share/nginx/html
```

### 自定义准入控制器

使用 Mutating Admission Webhook 实现类似功能：

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingAdmissionWebhook
metadata:
    name: pod-injector
webhooks:
- name: inject.example.com
    clientConfig:
        service:
            name: pod-injector
            namespace: default
            path: "/mutate"
```

### Operator 模式

通过自定义控制器监听 Pod 创建事件并进行配置注入。

### 配置管理工具

- **Helm**：通过模板和 values 文件管理配置
- **Kustomize**：通过补丁和变换管理配置变更

## 最佳实践建议

### 迁移策略

1. **评估现有用法**：识别当前 Pod Preset 的使用场景
2. **选择合适方案**：根据需求选择最适合的替代方案
3. **逐步迁移**：采用蓝绿部署等策略平滑迁移
4. **测试验证**：确保新方案的功能完整性

### 设计原则

- **最小权限**：仅注入必要的配置信息
- **环境隔离**：不同环境使用不同的配置策略
- **可观测性**：确保配置注入过程可追踪
- **向后兼容**：考虑配置变更对现有应用的影响

## 总结

虽然 Pod Preset 已被移除，但其设计理念仍然有价值。在现代 Kubernetes 环境中，我们可以通过多种方式实现类似功能，关键是选择最适合具体场景的解决方案。建议优先考虑标准化的方法，如 Init Container 和配置管理工具，以确保解决方案的可维护性和可移植性。
