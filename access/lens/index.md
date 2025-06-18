---
weight: 97
title: Lens - Kubernetes IDE
linktitle: Lens
date: '2022-05-21T00:00:00+08:00'
type: book
description: Lens 是一款功能强大的开源 Kubernetes IDE，提供实时集群监控、多集群管理、可视化界面等功能，支持跨平台使用，是 Kubernetes 开发和运维的理想工具。
keywords:
- chart
- github
- ide
- kubernetes
- lens
- namespace
- prometheus
- 开源
- 支持
- 集群
---

## 什么是 Lens

[Lens](https://k8slens.dev/) 是一款功能强大的开源 Kubernetes IDE，既可以作为桌面应用程序，也可以作为集群管理工具使用。它为 Kubernetes 开发者和运维人员提供了直观的可视化界面来管理和监控 Kubernetes 集群。

## 核心特性

### 开源与社区支持

- **完全开源**：项目托管在 GitHub 上，地址为 <https://github.com/lensapp/lens>
- **活跃社区**：拥有庞大的用户社区和贡献者群体

### 集群管理功能

- **多集群管理**：支持同时连接和管理多个 Kubernetes 集群
- **多 namespace 支持**：轻松切换和管理不同的命名空间
- **实时状态监控**：提供集群资源的实时状态更新
- **原生 Kubernetes 支持**：完全兼容标准 Kubernetes API

### 监控与可视化

- **内置 Prometheus 集成**：提供丰富的监控指标和图表
- **资源可视化**：直观展示 Pod、Service、Deployment 等资源状态
- **日志查看**：集成的日志查看器，方便调试和排错

### 应用部署

- **Helm Chart 支持**：支持使用 Helm Chart 安装和管理应用
- **YAML 编辑器**：内置的资源配置编辑器
- **kubectl 集成**：提供终端访问，可直接执行 kubectl 命令

### 认证与安全

- **kubeconfig 认证**：支持标准的 kubeconfig 文件认证
- **RBAC 支持**：完全支持 Kubernetes 的角色访问控制

### 跨平台支持

- **多平台兼容**：支持 Windows、macOS、Linux 系统
- **用户友好界面**：采用现代化的 UI 设计，类似 Visual Studio Code 的风格

## 界面预览

Lens 提供了清晰直观的用户界面，如下图所示：

![Lens Kubernetes IDE 界面](https://assets.jimmysong.io/images/book/kubernetes-handbook/access/lens/lens.webp)
{width=1200 height=750}

## 安装和使用

1. 访问官方网站 <https://k8slens.dev> 下载对应平台的安装包
2. 安装完成后，导入你的 kubeconfig 文件
3. 选择要连接的集群，开始管理你的 Kubernetes 环境

## 参考资料

- [Lens 官方网站 - k8slens.dev](https://k8slens.dev/)
- [Lens GitHub 仓库](https://github.com/lensapp/lens)
