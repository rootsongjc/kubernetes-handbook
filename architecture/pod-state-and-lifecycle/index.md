---
weight: 10
title: Kubernetes 中的资源对象
linkTitle: 资源对象
date: '2022-05-21T00:00:00+08:00'
type: book
aliases:
  - /book/kubernetes-handbook/objects/
description: >-
  深入了解 Kubernetes 中的各种资源对象类型，包括 Pod、Service、Deployment 等核心概念，以及如何通过 YAML
  文件定义和管理这些对象的 spec 和 status。
lastmod: '2025-08-23'
---

Kubernetes 作为容器编排平台，通过各种资源对象来管理应用程序的部署、扩展和运行。这些对象都可以通过 YAML 或 JSON 文件进行声明式配置。

## Kubernetes 资源对象分类

以下是 Kubernetes 中常用的资源对象：

### 工作负载对象

- **Pod** - 最小部署单元，包含一个或多个容器
- **Deployment** - 管理无状态应用的部署和扩展
- **StatefulSet** - 管理有状态应用
- **DaemonSet** - 确保每个节点运行特定 Pod
- **Job** - 运行一次性任务
- **CronJob** - 按计划运行任务
- **ReplicaSet** - 维护指定数量的 Pod 副本

### 服务发现与负载均衡

- **Service** - 为 Pod 提供稳定的网络访问
- **Ingress** - 管理外部访问集群服务的 HTTP 和 HTTPS 路由

### 配置与存储

- **ConfigMap** - 存储非敏感配置数据
- **Secret** - 存储敏感信息如密码、令牌
- **Volume** - 为容器提供存储
- **PersistentVolume**（**PV**） - 集群级别的存储资源
- **PersistentVolumeClaim**（**PVC**） - 用户对存储的请求

### 集群管理

- **Node** - 集群中的工作节点
- **Namespace** - 虚拟集群，用于资源隔离
- **Label** - 键值对标签，用于资源选择和组织

### 安全与权限

- **ServiceAccount** - 为 Pod 提供身份标识
- **Role** - 命名空间级别的权限规则
- **ClusterRole** - 集群级别的权限规则
- **SecurityContext** - 定义 Pod 或容器的安全设置

### 资源管理

- **ResourceQuota** - 限制命名空间的资源使用
- **LimitRange** - 设置资源使用的默认值和限制
- **HorizontalPodAutoscaler**（**HPA**） - 基于 CPU/内存使用率自动扩缩容

### 扩展性

- **CustomResourceDefinition**（**CRD**） - 定义自定义资源类型

## 理解 Kubernetes 对象

Kubernetes 对象是集群中的持久化实体，用于表示集群的期望状态。每个对象描述：

- **运行内容** - 哪些容器化应用在运行，运行在哪些节点上
- **可用资源** - 应用可以使用的计算、存储和网络资源  
- **行为策略** - 重启策略、升级策略、容错策略等

Kubernetes 对象采用**声明式管理**模式 - 你声明期望的状态，Kubernetes 控制平面持续工作以确保实际状态与期望状态保持一致。

### 对象规范与状态

每个 Kubernetes 对象包含两个关键字段：

#### spec（规范）

- **用途**：描述对象的期望状态
- **来源**：用户提供
- **示例**：Deployment 中指定副本数为 3

#### status（状态）  

- **用途**：描述对象的当前实际状态
- **来源**：Kubernetes 系统维护
- **示例**：当前实际运行的副本数

**工作机制**：Kubernetes 控制器持续监控对象状态，当发现实际状态与期望状态不符时，会采取措施进行修正。

### 对象定义格式

创建 Kubernetes 对象时，通常使用 YAML 格式文件，包含以下必需字段：

```yaml
apiVersion: apps/v1      # API 版本
kind: Deployment         # 对象类型  
metadata:               # 元数据
    name: nginx-deployment # 对象名称
    namespace: default     # 命名空间（可选）
    labels:               # 标签（可选）
        app: nginx
spec:                   # 对象规范
    replicas: 3           # 期望状态配置
    selector:
        matchLabels:
            app: nginx
    template:
        metadata:
            labels:
                app: nginx
        spec:
            containers:
            - name: nginx
                image: nginx:1.25
                ports:
                - containerPort: 80
```

### 对象管理操作

创建对象：

```bash
kubectl apply -f nginx-deployment.yaml
```

查看对象状态：

```bash
kubectl get deployment nginx-deployment
kubectl describe deployment nginx-deployment  
```

更新对象：

```bash
# 修改 YAML 文件后重新应用
kubectl apply -f nginx-deployment.yaml
```

删除对象：

```bash
kubectl delete -f nginx-deployment.yaml
# 或者
kubectl delete deployment nginx-deployment
```

## 最佳实践

1. **使用声明式管理**：优先使用 `kubectl apply` 而非命令式操作
2. **版本控制**：将 YAML 文件纳入版本控制系统
3. **标签规范**：为对象添加有意义的标签便于管理
4. **命名规范**：使用清晰、一致的命名约定
5. **资源限制**：为容器设置合适的资源请求和限制

## 相关参考

- [Kubernetes API 参考文档](https://kubernetes.io/docs/reference/kubernetes-api/)
- [kubectl 命令参考](https://kubernetes.io/docs/reference/kubectl/)
- [YAML 语法指南](https://yaml.org/spec/1.2/spec.html)
