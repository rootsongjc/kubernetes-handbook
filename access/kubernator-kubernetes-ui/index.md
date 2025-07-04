---
weight: 98
title: Kubernator - 更底层的 Kubernetes UI
linktitle: Kubernator
date: '2022-05-21T00:00:00+08:00'
type: book
description: Kubernator 是一个底层的 Kubernetes UI 工具，提供基于目录树和关系拓扑图的方式来管理 Kubernetes 对象，支持直接编辑 YAML 配置文件，相比 Dashboard 更加灵活和强大。
keywords:
- dashboard
- kubernator
- kubernetes
- rbac
- ui
- 对象
- 底层
- 拓扑图
- 操作
- 页面
---

[Kubernator](https://github.com/smpio/kubernator) 是一个专为 Kubernetes 设计的底层 UI 管理工具。与 [Kubernetes Dashboard](https://github.com/kubernetes/dashboard) 相比，Kubernator 提供了更加底层和灵活的操作方式 - 它允许用户直接编辑和操作 Kubernetes 各个对象的 YAML 配置文件。

## 主要特性

Kubernator 的核心优势在于其独特的管理方式：

- **目录树视图**：以树形结构展示 Kubernetes 资源对象的层次关系
- **关系拓扑图**：可视化展示对象之间的关联关系
- **直接 YAML 编辑**：支持在 Web 界面中直接修改资源配置
- **类 GitHub 操作体验**：提供类似代码仓库的操作界面
- **RBAC 可视化**：清晰展示集群中的权限控制关系

## 安装部署

### 快速部署

Kubernator 支持多种部署方式，推荐使用以下方法：

```bash
# 创建命名空间
kubectl create namespace kubernator

# 部署 Kubernator
kubectl apply -f https://raw.githubusercontent.com/smpio/kubernator/main/deploy/kubernator.yaml

# 创建端口转发访问
kubectl port-forward -n kubernator service/kubernator 8080:80
```

部署完成后，访问 `http://localhost:8080` 即可使用。

### 临时运行

如果只是临时使用，可以通过以下命令快速启动：

```bash
kubectl create ns kubernator
kubectl -n kubernator run --image=smpio/kubernator --port=80 kubernator
kubectl -n kubernator expose deployment kubernator --port=80
kubectl proxy
```

然后通过 `http://localhost:8001/api/v1/namespaces/kubernator/services/kubernator/proxy/` 访问。

## 界面功能

### Catalog 资源管理页面

Catalog 页面以树形结构展示 Kubernetes 中的所有资源对象，用户可以：

- 浏览不同命名空间下的资源
- 直接编辑资源的 YAML 配置
- 执行创建、更新、删除等操作
- 查看资源之间的依赖关系

![Kubernator catalog 页面](https://assets.jimmysong.io/images/book/kubernetes-handbook/access/kubernator-kubernetes-ui/kubernator-catalog.webp)
{width=1655 height=993}

### RBAC 权限管理页面

RBAC 页面提供了集群权限控制的可视化视图，帮助管理员：

- 查看用户、角色和权限绑定关系
- 理解复杂的权限继承结构
- 快速定位权限问题
- 优化权限配置

![Kubernator rbac 页面](https://assets.jimmysong.io/images/book/kubernetes-handbook/access/kubernator-kubernetes-ui/kubernator-rbac.webp)
{width=1655 height=993}

## 使用场景

Kubernator 特别适合以下场景：

- **开发调试**：需要频繁修改资源配置的开发环境
- **问题排查**：通过可视化方式快速定位问题
- **学习 Kubernetes**：直观了解资源对象的结构和关系
- **权限管理**：复杂 RBAC 配置的管理和优化

## 注意事项

- Kubernator 需要适当的 RBAC 权限才能正常工作
- 生产环境使用时建议配置认证和授权
- 直接编辑 YAML 配置需要谨慎操作，建议先在测试环境验证

## 参考资料

- [Kubernator GitHub 仓库](https://github.com/smpio/kubernator)
