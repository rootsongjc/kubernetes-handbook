---
weight: 81
title: Kubectl 命令技巧大全
date: '2022-05-21T00:00:00+08:00'
type: book
description: 'kubectl 是操作 Kubernetes 集群最直接高效的命令行工具。本文涵盖了 kubectl 的核心功能和实用技巧，包括自动补全、上下文配置、资源管理、调试技巧等，帮助您快速掌握 Kubernetes 集群操作。'
keywords:
- api
- json
- jsonpath
- kubectl
- kubernetes
- yaml
- 打印
- 日志
- 格式
- 输出
---

`kubectl` 是操作 Kubernetes 集群最直接和最高效的命令行工具。这个功能强大的二进制文件提供了完整的集群管理能力，本文将为您详细介绍其核心功能和实用技巧。

## Kubectl 自动补全

为了提高命令行操作效率，建议配置 kubectl 的自动补全功能：

```bash
# Bash
source <(kubectl completion bash)
echo "source <(kubectl completion bash)" >> ~/.bashrc

# Zsh  
source <(kubectl completion zsh)
echo "source <(kubectl completion zsh)" >> ~/.zshrc

# Fish
kubectl completion fish | source
```

## 上下文和配置管理

kubectl 通过 kubeconfig 文件管理多个集群的访问配置。以下是常用的配置管理命令：

```bash
# 查看当前配置
kubectl config view

# 合并多个 kubeconfig 文件
KUBECONFIG=~/.kube/config:~/.kube/config2 kubectl config view

# 查看当前上下文
kubectl config current-context

# 切换上下文
kubectl config use-context my-cluster-name

# 列出所有上下文
kubectl config get-contexts

# 设置集群凭据
kubectl config set-credentials kubeuser/foo.kubernetes.com \
  --username=kubeuser --password=kubepassword

# 设置上下文
kubectl config set-context my-context \
  --cluster=my-cluster \
  --user=my-user \
  --namespace=my-namespace
```

## 资源创建

Kubernetes 支持多种方式创建资源，推荐使用声明式配置：

```bash
# 从文件创建资源
kubectl apply -f ./manifest.yaml
kubectl apply -f ./dir/                    # 应用目录下所有文件
kubectl apply -f https://example.com/manifest.yaml

# 命令式创建（适用于快速测试）
kubectl create deployment nginx --image=nginx:1.21
kubectl create service clusterip my-svc --tcp=80:80

# 获取资源文档
kubectl explain pod.spec.containers
kubectl explain deployment --recursive

# 从标准输入创建多个资源
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-config
data:
  config.yaml: |
    key: value
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: nginx:1.21
        ports:
        - containerPort: 80
EOF
```

## 资源查询和显示

kubectl 提供了强大的资源查询功能：

```bash
# 基本查询
kubectl get pods                           # 当前命名空间的 pods
kubectl get pods -A                        # 所有命名空间的 pods  
kubectl get pods -o wide                   # 显示更多信息
kubectl get pods --show-labels             # 显示标签

# 按标签筛选
kubectl get pods -l app=nginx
kubectl get pods -l 'environment in (production,staging)'

# 排序
kubectl get pods --sort-by=.metadata.creationTimestamp
kubectl get pods --sort-by=.status.startTime

# JSONPath 查询
kubectl get pods -o jsonpath='{.items[*].metadata.name}'
kubectl get nodes -o jsonpath='{.items[*].status.addresses[?(@.type=="InternalIP")].address}'

# 自定义列输出
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase

# 监听资源变化
kubectl get pods --watch
kubectl get events --watch --field-selector involvedObject.name=my-pod

# 详细描述
kubectl describe pod my-pod
kubectl describe node my-node
```

## 资源更新

```bash
# 声明式更新（推荐）
kubectl apply -f updated-manifest.yaml

# 直接编辑资源
kubectl edit deployment my-deployment

# 打补丁更新
kubectl patch deployment my-deployment -p '{"spec":{"replicas":5}}'
kubectl patch pod my-pod --type='json' -p='[{"op": "replace", "path": "/spec/containers/0/image", "value":"nginx:1.22"}]'

# 标签和注解
kubectl label pods my-pod version=v2
kubectl annotate pods my-pod description="Updated pod"

# 扩缩容
kubectl scale deployment my-deployment --replicas=5
kubectl autoscale deployment my-deployment --min=2 --max=10 --cpu-percent=80
```

## 资源删除

```bash
# 删除指定资源
kubectl delete pod my-pod
kubectl delete -f manifest.yaml

# 批量删除
kubectl delete pods,services -l app=my-app
kubectl delete all -l app=my-app              # 删除常见资源类型

# 强制删除
kubectl delete pod my-pod --force --grace-period=0

# 清空命名空间
kubectl delete all --all -n my-namespace
```

## Pod 交互和调试

```bash
# 查看日志
kubectl logs my-pod                         # 单容器 pod
kubectl logs my-pod -c container-name       # 多容器 pod
kubectl logs my-pod --previous              # 查看上一个容器的日志
kubectl logs -f my-pod                      # 流式日志
kubectl logs my-pod --since=1h              # 最近1小时的日志

# 执行命令
kubectl exec my-pod -- ls /app
kubectl exec my-pod -c my-container -- sh
kubectl exec -it my-pod -- /bin/bash        # 交互式shell

# 端口转发
kubectl port-forward pod/my-pod 8080:80
kubectl port-forward service/my-service 8080:80

# 文件传输
kubectl cp my-pod:/path/to/file ./local-file
kubectl cp ./local-file my-pod:/path/to/file

# 资源使用情况
kubectl top pod my-pod
kubectl top pod --containers
kubectl top node
```

## 节点和集群管理

```bash
# 节点管理
kubectl get nodes
kubectl describe node my-node
kubectl cordon my-node                      # 标记不可调度
kubectl drain my-node --ignore-daemonsets   # 驱逐Pod进行维护
kubectl uncordon my-node                    # 恢复调度

# 污点管理
kubectl taint nodes my-node key=value:NoSchedule
kubectl taint nodes my-node key=value:NoSchedule-  # 移除污点

# 集群信息
kubectl cluster-info
kubectl cluster-info dump
kubectl version
kubectl api-resources                       # 查看所有资源类型
kubectl api-versions                        # 查看API版本
```

## 高级查询技巧

```bash
# 使用字段选择器
kubectl get pods --field-selector status.phase=Running
kubectl get events --field-selector type=Warning

# 组合查询
kubectl get pods -l app=nginx --field-selector status.phase=Running

# 输出到文件
kubectl get pods -o yaml > pods-backup.yaml
kubectl get all -o yaml --export > cluster-backup.yaml

# 监控资源变化
kubectl get pods --watch-only
kubectl get events --watch --field-selector involvedObject.name=my-pod
```

## 常用资源类型简写

| 资源类型 | 简写 | 资源类型 | 简写 |
|---------|------|---------|------|
| `pods` | `po` | `services` | `svc` |
| `deployments` | `deploy` | `replicasets` | `rs` |
| `configmaps` | `cm` | `secrets` | `secret` |
| `namespaces` | `ns` | `nodes` | `no` |
| `persistentvolumes` | `pv` | `persistentvolumeclaims` | `pvc` |
| `serviceaccounts` | `sa` | `daemonsets` | `ds` |
| `statefulsets` | `sts` | `cronjobs` | `cj` |
| `horizontalpodautoscalers` | `hpa` | `ingresses` | `ing` |

## 输出格式选项

| 格式 | 描述 |
|------|------|
| `-o yaml` | YAML 格式输出 |
| `-o json` | JSON 格式输出 |
| `-o wide` | 额外列信息 |
| `-o name` | 仅显示名称 |
| `-o jsonpath=<expr>` | JSONPath 表达式 |
| `-o custom-columns=<spec>` | 自定义列 |
| `-o go-template=<template>` | Go 模板 |

## 调试和详细输出

使用 `-v` 参数控制日志详细程度：

| 级别 | 描述 |
|------|------|
| `--v=0` | 仅显示错误 |
| `--v=1` | 基本信息（默认） |
| `--v=2` | 详细信息 |
| `--v=4` | 调试信息 |
| `--v=6` | 显示请求资源 |
| `--v=8` | 显示 HTTP 请求内容 |

## 实用技巧

```bash
# 快速创建测试Pod
kubectl run debug --image=busybox --rm -it --restart=Never -- sh

# 创建临时调试容器（Kubernetes 1.23+）
kubectl debug my-pod -it --image=busybox --target=my-container

# 生成资源模板
kubectl create deployment my-app --image=nginx --dry-run=client -o yaml

# 验证配置文件
kubectl apply --dry-run=client -f manifest.yaml
kubectl apply --validate=true -f manifest.yaml

# 等待资源就绪
kubectl wait --for=condition=ready pod -l app=my-app --timeout=300s
kubectl wait --for=condition=available deployment/my-deployment --timeout=300s

# 获取资源事件
kubectl get events --sort-by=.metadata.creationTimestamp
kubectl get events --field-selector involvedObject.name=my-pod
```

## 参考资源

- [Kubectl 官方文档](https://kubernetes.io/docs/reference/kubectl/)
- [JSONPath 表达式指南](https://kubernetes.io/docs/reference/kubectl/jsonpath/)
- [Kubectl 速查表](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Go 模板语法](https://pkg.go.dev/text/template)
