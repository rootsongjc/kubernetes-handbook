---
weight: 114
title: Minikube
date: '2022-05-21T00:00:00+08:00'
type: book
description: 'Minikube 是在本地运行 Kubernetes 集群的工具，适用于开发、测试和学习 Kubernetes。本文介绍如何安装配置 Minikube，以及常用的操作命令。'
keywords:
- hyperkit
- docker
- install
- kubectl
- kubernetes
- minikube
- 本地开发
- 集群管理
- 容器编排
---

Minikube 是一个轻量级的 Kubernetes 实现，可在本地计算机上创建虚拟机并部署仅包含单个节点的简单集群，非常适合 Kubernetes 的开发、测试和学习。

## 系统要求

在开始安装之前，请确保您的系统满足以下要求：

- **macOS**: 10.12 (Sierra) 或更高版本
- **内存**: 至少 2GB 可用内存
- **CPU**: 支持虚拟化的处理器
- **磁盘空间**: 至少 20GB 可用磁盘空间

## 安装 Minikube

### 使用 Homebrew 安装（推荐）

```bash
# 安装 minikube
brew install minikube

# 验证安装
minikube version
```

### 手动安装

访问 [Minikube Releases](https://github.com/kubernetes/minikube/releases) 下载最新版本：

```bash
# 下载 minikube（以 macOS 为例）
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-darwin-amd64

# 安装到系统路径
sudo install minikube-darwin-amd64 /usr/local/bin/minikube

# 验证安装
minikube version
```

## 安装 kubectl

kubectl 是 Kubernetes 的命令行工具，用于与集群交互。

### 使用 Homebrew 安装（推荐）

```bash
brew install kubectl
```

### 手动安装

```bash
# 下载最新版本的 kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"

# 添加执行权限
chmod +x kubectl

# 移动到系统路径
sudo mv kubectl /usr/local/bin/

# 验证安装
kubectl version --client
```

## 启动和配置 Minikube

### 基本启动

```bash
# 启动 minikube（使用默认驱动）
minikube start

# 指定资源配置启动
minikube start --memory=4096 --cpus=2
```

### macOS 特定配置

对于 macOS 用户，推荐使用 HyperKit 驱动：

```bash
# 安装 HyperKit 驱动
brew install hyperkit

# 使用 HyperKit 启动
minikube start --driver=hyperkit
```

### Docker 驱动

如果您已安装 Docker Desktop：

```bash
minikube start --driver=docker
```

启动成功后，minikube 会自动配置 kubectl 上下文，您可以直接使用 kubectl 命令操作集群。

## 验证安装

```bash
# 查看集群状态
minikube status

# 查看节点信息
kubectl get nodes

# 查看集群信息
kubectl cluster-info
```

## 常用操作命令

### 集群管理

```bash
# 启动集群
minikube start

# 停止集群
minikube stop

# 重启集群
minikube start

# 删除集群
minikube delete

# 暂停集群
minikube pause

# 恢复集群
minikube unpause
```

### 集群信息

```bash
# 查看集群状态
minikube status

# 获取节点 IP
minikube ip

# 进入节点 SSH
minikube ssh

# 查看 Kubernetes 版本
minikube kubectl version
```

### 插件管理

```bash
# 列出可用插件
minikube addons list

# 启用插件（如 dashboard）
minikube addons enable dashboard

# 禁用插件
minikube addons disable dashboard
```

### 服务访问

```bash
# 访问 Kubernetes Dashboard
minikube dashboard

# 获取服务 URL
minikube service <service-name> --url

# 在浏览器中打开服务
minikube service <service-name>
```

## 故障排除

### 常见问题

1. **启动失败**: 检查虚拟化是否启用
2. **网络问题**: 配置代理或使用镜像源
3. **资源不足**: 增加内存和 CPU 配置

### 清理和重置

```bash
# 清理缓存
minikube delete --all --purge

# 重置配置
rm -rf ~/.minikube
```

## 最佳实践

1. **资源配置**: 根据开发需求合理分配内存和 CPU
2. **驱动选择**: macOS 推荐 HyperKit，其他系统可选 VirtualBox 或 Docker
3. **网络配置**: 企业环境下注意配置代理
4. **定期更新**: 保持 Minikube 和 kubectl 版本更新

## 参考资料

- [Minikube 官方文档](https://minikube.sigs.k8s.io/docs/)
- [kubectl 安装指南](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
- [Kubernetes 官方教程](https://kubernetes.io/docs/tutorials/)
