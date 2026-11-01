---
weight: 81
title: Kubectl 命令技巧大全
date: 2022-05-21T00:00:00+08:00
description: kubectl 是操作 Kubernetes 集群最直接高效的命令行工具。本文涵盖了 kubectl 的核心功能和实用技巧，包括自动补全、上下文配置、资源管理、调试技巧等，帮助您快速掌握 Kubernetes 集群操作。
lastmod: 2026-11-01T00:00:00+08:00
---

> kubectl 是 Kubernetes 集群调试与日常管理的核心工具，掌握其命令技巧和调试方法，是高效排障和运维的基础。

## Kubectl 自动补全

为提升命令行操作效率，建议配置 kubectl 的自动补全功能。以下为不同 shell 环境的配置方法：

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

kubectl 通过 kubeconfig 文件管理多个集群的访问配置。常用命令如下：

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

Kubernetes 支持多种方式创建资源，推荐使用声明式配置。以下为常用命令示例：

```bash
# 从文件创建资源
kubectl apply -f ./manifest.yaml
kubectl apply -f ./dir/                    # 应用目录下所有文件
kubectl apply -f https://example.com/manifest.yaml

# 命令式创建（适用于快速测试）
kubectl create deployment nginx --image=nginx:1.27
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
        image: nginx:1.27
        ports:
        - containerPort: 80
EOF
```

## 资源查询和显示

kubectl 提供了强大的资源查询功能，便于快速定位和分析集群状态。

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

资源更新支持声明式、命令式和补丁等多种方式，适应不同场景需求。

```bash
# 声明式更新（推荐）
kubectl apply -f updated-manifest.yaml

# 直接编辑资源
kubectl edit deployment my-deployment

# 打补丁更新
kubectl patch deployment my-deployment -p '{"spec":{"replicas":5}}'
kubectl patch pod my-pod --type='json' -p='[{"op": "replace", "path": "/spec/containers/0/image", "value":"nginx:1.27"}]'

# 标签和注解
kubectl label pods my-pod version=v2
kubectl annotate pods my-pod description="Updated pod"

# 扩缩容
kubectl scale deployment my-deployment --replicas=5
kubectl autoscale deployment my-deployment --min=2 --max=10 --cpu-percent=80
```

## 资源删除

资源删除支持单个、批量和强制等多种方式，便于高效清理集群资源。

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

kubectl 提供多种调试与交互命令，助力定位和解决 Pod 运行问题。

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

# 临时调试容器（kubectl debug，v1.25 起 GA）
kubectl debug my-pod -it --image=busybox:1.37 --target=my-container      # 向运行中的 Pod 注入临时容器，共享目标容器的进程命名空间
kubectl debug my-pod -it --copy-to=my-pod-debug --container=app -- sh   # 复制 Pod 并替换命令，适合 CrashLoopBackOff
kubectl debug node/worker-1 -it --image=ubuntu:24.04                    # 在节点上启动特权 Pod，宿主机文件系统挂载于 /host
kubectl debug my-pod -it --image=busybox:1.37 --profile=sysadmin        # 调试 profile（v1.31 GA）：general/baseline/restricted/netadmin/sysadmin
kubectl debug my-pod -it --image=busybox:1.37 --custom=profile.yaml     # 自定义 profile（v1.32 GA），按需补齐 securityContext/卷等

# 原地调整资源（v1.35 GA）
kubectl patch pod my-pod --subresource=resize --patch '{"spec":{"containers":[{"name":"app","resources":{"requests":{"cpu":"1"}}}]}}'
```

## 节点和集群管理

节点和集群管理命令有助于维护集群健康和资源调度。

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

灵活运用字段选择器、标签、输出格式等高级技巧，可高效筛选和导出资源信息。

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

{{< table title="Kubernetes 常用资源类型简写对照表" >}}

| 资源类型 | 简写 | 资源类型 | 简写 |
|---------|------|---------|------|
| pods | po | services | svc |
| deployments | deploy | replicasets | rs |
| configmaps | cm | secrets | secret |
| namespaces | ns | nodes | no |
| persistentvolumes | pv | persistentvolumeclaims | pvc |
| serviceaccounts | sa | daemonsets | ds |
| statefulsets | sts | cronjobs | cj |
| horizontalpodautoscalers | hpa | ingresses | ing |

{{< /table >}}

## 输出格式选项

{{< table title="kubectl 输出格式选项说明" >}}

| 格式 | 描述 |
|------|------|
| -o yaml | YAML 格式输出 |
| -o json | JSON 格式输出 |
| -o wide | 额外列信息 |
| -o name | 仅显示名称 |
| -o jsonpath=<expr> | JSONPath 表达式 |
| -o custom-columns=<spec> | 自定义列 |
| -o go-template=<template> | Go 模板 |
| -o kyaml | KYAML：更接近 JSON 风格、对缩进不敏感的 YAML 子集，避免 Norway 问题与缩进错误（v1.37 GA） |

{{< /table >}}

KYAML 输出示例如下，花括号与方括号显式界定结构，字符串统一加引号：

```yaml
{
  apiVersion: "v1",
  kind: "Pod",
  metadata: {name: "my-pod", namespace: "default"},
  spec: {containers: [{name: "app", image: "nginx:1.27"}]},
}
```

KYAML 是合法的 YAML，可以直接 `kubectl apply`。

## 调试和详细输出

通过 `-v` 参数可控制日志详细程度，便于调试和问题定位。

{{< table title="kubectl 日志详细级别说明" >}}

| 级别 | 描述 |
|------|------|
| --v=0 | 仅显示错误 |
| --v=1 | 基本信息（默认） |
| --v=2 | 详细信息 |
| --v=4 | 调试信息 |
| --v=6 | 显示请求资源 |
| --v=8 | 显示 HTTP 请求内容 |

{{< /table >}}

## 实用技巧

结合以下命令可提升调试和日常运维效率。

```bash
# 快速创建测试Pod
kubectl run debug --image=busybox --rm -it --restart=Never -- sh

# 创建临时调试容器（详见上文"Pod 交互和调试"）
kubectl debug my-pod -it --image=busybox:1.37 --target=my-container

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
kubectl events --for pod/my-pod --watch         # kubectl events 子命令（v1.26 起），按时间排序并支持 --types

# 查看当前身份
kubectl auth whoami

# 子资源操作
kubectl get deployment my-deployment --subresource=status
kubectl patch deployment my-deployment --subresource=scale --type=merge -p '{"spec":{"replicas":3}}'
```

## 用户偏好文件 kuberc

kubectl v1.33 引入、v1.34 起默认开启的 `kuberc`（`~/.kube/kuberc`）用于存放**与集群无关**的个人偏好：命令别名与默认参数。它与 kubeconfig 分离，避免把偏好写进会被分发的集群配置文件：

```yaml
apiVersion: kubectl.config.k8s.io/v1beta1
kind: Preference
aliases:
- name: getn
  command: get
  prependArgs: [nodes]
  options:
  - name: output
    default: wide
defaults:
- command: apply
  options:
  - name: server-side
    default: "true"
- command: delete
  options:
  - name: interactive
    default: "true"
```

配置后 `kubectl getn` 等价于 `kubectl get nodes -o wide`，`kubectl apply` 默认使用 Server-Side Apply。可用 `kubectl kuberc view` 查看、`kubectl kuberc set` 修改，`--kuberc` 参数或 `KUBERC` 环境变量指定文件路径，`KUBERC=off` 临时禁用。

## 总结

kubectl 是 Kubernetes 集群调试与管理的核心工具。通过掌握命令技巧、调试方法和高效用法，能够大幅提升集群运维与故障排查效率。建议结合实际场景持续优化命令行操作，打造高效的 Kubernetes 运维体验。

## 参考文献

- [Kubectl 官方文档 - kubernetes.io](https://kubernetes.io/docs/reference/kubectl/)
- [JSONPath 表达式指南 - kubernetes.io](https://kubernetes.io/docs/reference/kubectl/jsonpath/)
- [Kubectl 速查表 - kubernetes.io](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Go 模板语法 - pkg.go.dev](https://pkg.go.dev/text/template)
