---
weight: 23
title: Namespace
date: '2022-05-21T00:00:00+08:00'
type: book
description: 详细介绍 Kubernetes 中 Namespace 的概念、使用场景和管理方法，包括如何创建和管理命名空间以实现资源隔离和环境划分。
keywords:
- default
- kube
- kubernetes
- namespace
- service
- system
- 部署
- 隔离
- 集群
- 默认
---

在 Kubernetes 集群中，Namespace 提供了一种机制来创建多个"虚拟集群"。通过 Namespace，可以实现资源的逻辑分组和隔离，同时也支持跨 Namespace 的服务访问。

## 什么是 Namespace

Namespace 是 Kubernetes 中的一个抽象概念，用于在同一个物理集群中创建多个虚拟的集群环境。它为资源对象提供了作用域，使得不同 Namespace 中的资源可以使用相同的名称而不会产生冲突。

## 使用场景

以下情况适合使用多个 Namespace：

- **环境隔离**：将开发、测试、预生产和生产环境部署在不同的 Namespace 中
- **团队隔离**：为不同的团队或项目分配独立的 Namespace
- **资源配额管理**：对不同 Namespace 设置资源使用限制
- **权限控制**：基于 Namespace 实现细粒度的访问控制

## 基本操作

### 查看 Namespace

下面的命令用于查看集群中所有的 Namespace：

```bash
# 查看所有 namespace
kubectl get namespaces

# 简写形式
kubectl get ns
```

### 创建 Namespace

可以通过命令或 YAML 文件创建新的 Namespace，示例如下：

```bash
# 使用命令创建
kubectl create namespace <namespace-name>

# 使用 YAML 文件创建
kubectl apply -f namespace.yaml
```

### 指定 Namespace 操作

以下命令展示了如何在特定 Namespace 下操作资源，以及如何设置默认 Namespace：

```bash
# 在特定 namespace 中操作资源
kubectl get pods -n <namespace-name>

# 设置默认 namespace
kubectl config set-context --current --namespace=<namespace-name>
```

## 默认 Namespace

Kubernetes 集群默认包含以下 Namespace：

- **default**：用户应用的默认部署位置
- **kube-system**：Kubernetes 系统组件的部署位置
- **kube-public**：所有用户都可以访问的公共资源
- **kube-node-lease**：用于节点心跳检测的租约对象

## 资源作用域

需要注意的是，并非所有 Kubernetes 资源都属于 Namespace 作用域：

**Namespace 作用域的资源**：

- Pod、Service、Deployment
- ConfigMap、Secret
- PersistentVolumeClaim

**集群作用域的资源**：

- Node、PersistentVolume
- StorageClass、ClusterRole
- Namespace 本身

## 最佳实践

1. **命名规范**：使用有意义的命名约定，如 `project-environment` 格式
2. **资源配额**：为每个 Namespace 设置适当的资源限制
3. **网络策略**：根据需要配置 Namespace 间的网络访问控制
4. **标签管理**：使用标签来组织和管理 Namespace
5. **权限控制**：结合 RBAC 实现基于 Namespace 的权限管理
