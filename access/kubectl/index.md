---
title: Kubernetes API 访问与 kubectl 实践
linktitle: kubectl 命令行工具
date: 2025-10-13
weight: 2
description: 详解如何通过 kubectl 命令行工具与 Kubernetes API 交互，涵盖认证机制、请求模式、资源管理与自动化实践，助力高效管理集群资源。
lastmod: 2026-11-01T00:00:00+08:00
aliases:
  - /book/kubernetes-handbook/cli/using-kubectl/
---

kubectl 是 Kubernetes 官方命令行工具，极大简化了 API 交互、认证、资源管理与自动化操作。掌握 kubectl 与 API 的工作原理，有助于提升集群运维与开发效率。

## kubectl 与 API Server 交互原理

Kubernetes API 是控制面的核心，提供 HTTP REST 接口，支持用户、集群组件及外部系统通信。kubectl 作为官方 CLI，负责处理认证、请求格式化与响应解析。

![kubectl 到 API Server 交互流程](kubectl-apiserver-flow.svg)

## Kubernetes API 基础

Kubernetes API 遵循 RESTful 设计，支持标准 HTTP 动作（GET、POST、PUT、PATCH、DELETE）操作资源。资源按 API 组、版本、类型组织。

![Kubernetes API 结构](kubernetes-api-structure.svg)

常见 API 路径模式：

- 集群级资源：`/apis/GROUP/VERSION/RESOURCETYPE`
- 命名空间资源：`/apis/GROUP/VERSION/namespaces/NAMESPACE/RESOURCETYPE`
- 单个资源：`/apis/GROUP/VERSION/namespaces/NAMESPACE/RESOURCETYPE/NAME`

## kubectl 工作机制

kubectl 作为 API 客户端，将用户命令转为 HTTP 请求，读取 kubeconfig 配置集群、认证与上下文信息。

![kubectl 证书签发流程](csr-signing-sequence.svg)

## kubectl 认证机制

kubectl 通过 kubeconfig 自动完成 API Server 认证，支持多种方式：

- 客户端证书
- Bearer Token
- 基本认证
- OAuth2 Token（外部插件）
- 服务账号 Token（集群内）

![kubectl 认证流程](kubectl-auth-flow.svg)

## kubectl 基本用法

kubectl 命令基本格式如下：

```text
kubectl [command] [TYPE] [NAME] [flags]
```

- `command`：操作类型（如 create、get、describe、delete）
- `TYPE`：资源类型（如 pods、deployments、services）
- `NAME`：资源名称（列表操作可省略）
- `flags`：可选参数

常用 kubectl 命令如下：

{{< table title="常用 kubectl 命令与示例" >}}

| Command      | Description           | Example                                      |
| ------------ | -------------------- | -------------------------------------------- |
| get          | 列出资源              | `kubectl get pods`                           |
| describe     | 查看详细信息          | `kubectl describe pod nginx`                 |
| create       | 创建资源              | `kubectl create deployment nginx --image=nginx` |
| apply        | 文件创建/更新         | `kubectl apply -f manifest.yaml`             |
| delete       | 删除资源              | `kubectl delete pod nginx`                   |
| logs         | 查看容器日志          | `kubectl logs nginx`                         |
| exec         | 容器内执行命令        | `kubectl exec -it nginx -- bash`             |
| port-forward | 端口转发              | `kubectl port-forward pod/nginx 8080:80`     |

{{< /table >}}

## 直接访问 API

kubectl 支持 `kubectl proxy` 启动本地代理，便于 curl 等工具直接访问 API，适合高级场景。

```bash
# 启动本地代理
kubectl proxy --port=8080

# 使用 curl 访问 API
curl http://localhost:8080/api/v1/namespaces/default/pods
```

## 输出格式与 JSONPath

kubectl 支持多种输出格式，便于脚本与自动化：

{{< table title="kubectl 输出格式与示例" >}}

| Format         | Description         | Example                                                        |
| -------------- | ------------------ | -------------------------------------------------------------- |
| json           | JSON 格式           | `kubectl get pods -o json`                                     |
| yaml           | YAML 格式           | `kubectl get pods -o yaml`                                     |
| wide           | 详细信息            | `kubectl get pods -o wide`                                     |
| name           | 仅资源名            | `kubectl get pods -o name`                                     |
| custom-columns | 自定义列            | `kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase` |
| jsonpath       | JSONPath 过滤       | `kubectl get pods -o jsonpath='{.items[0].metadata.name}'`     |
| go-template    | Go 模板格式化       | `kubectl get pods -o go-template='{{range .items}}{{.metadata.name}}{{"\n"}}{{end}}'` |

{{< /table >}}

### JSONPath 常用表达式

{{< table title="kubectl JSONPath 常用表达式" >}}

| Expression                | Description         |
| ------------------------- | ------------------ |
| `{.items[*]}`             | 所有列表项         |
| `{.metadata.name}`        | 资源名称           |
| `{.status.phase}`         | 资源状态           |
| `{range .items[*]}{end}`  | 遍历所有项         |
| `{.spec.containers[*].image}` | 所有容器镜像   |

{{< /table >}}

## Server-Side Apply 原理

Server-Side Apply 支持多管理者协作管理同一对象，追踪字段所有权，避免相互覆盖。

![Server-Side Apply 工作原理](server-side-apply-flow.svg)

关键点：

- 字段所有权追踪，避免冲突
- `--field-manager` 标识管理者
- `--force-conflicts` 强制覆盖冲突字段

## 其他 API 访问方式

除 kubectl 外，还可通过多种方式访问 Kubernetes API。

### 官方客户端库

Kubernetes 提供多语言官方客户端库：

{{< table title="Kubernetes 官方客户端库" >}}

| Language   | Client Library                        |
| ---------- | ------------------------------------- |
| Go         | github.com/kubernetes/client-go       |
| Python     | github.com/kubernetes-client/python   |
| Java       | github.com/kubernetes-client/java     |
| JavaScript | github.com/kubernetes-client/javascript |
| .NET       | github.com/kubernetes-client/csharp   |

{{< /table >}}

### API 代理与端口转发

- 使用 `kubectl proxy` 启动本地代理
- 直接带认证访问 API Server
- 端口转发访问服务

```bash
kubectl proxy --port=8080
curl http://localhost:8080/api/v1/namespaces/default/pods
```

## kubectl 命令分类

kubectl 的子命令按功能主要分为以下几个类别：

- **基础命令（入门级）**：create、expose、run、set 等基本操作命令
- **基础命令（进阶级）**：explain、get、edit、delete 等常用管理命令
- **部署命令**：rollout、scale、autoscale 等部署相关命令
- **集群管理命令**：certificate、cluster-info、top 等集群维护命令
- **故障排查和调试命令**：describe、logs、exec、port-forward 等诊断命令
- **高级命令**：diff、apply、patch、replace 等高级操作命令
- **设置命令**：label、annotate、completion 等配置命令
- **其他命令**：auth、config、plugin、version 等辅助命令

熟练掌握这些命令分类有助于提高 Kubernetes 集群的操作效率。

## kubectl 命令行增强工具

为提升 kubectl 的调试与管理效率，推荐结合多种开源增强工具。

![kubectl 增强工具推荐](https://assets.jimmysong.io/images/book/kubernetes-handbook/cli/using-kubectl/tools-to-supercharge-kubectl.webp)

### 推荐工具清单

- **[kubectx](https://github.com/ahmetb/kubectx)**：快速切换 Kubernetes context 和 namespace
- **[kube-ps1](https://github.com/jonmosco/kube-ps1)**：在命令行提示符中显示当前的 Kubernetes context 和 namespace
- **[k9s](https://github.com/derailed/k9s)**：终端 UI，集群资源可视化管理
- **[kubens](https://github.com/ahmetb/kubectx)**：快速切换 namespace
- **[stern](https://github.com/stern/stern)**：多 Pod 日志聚合查看工具
- **[krew](https://krew.sigs.k8s.io/)**：kubectl 插件管理器，`kubectl krew install` 即可安装 `neat`、`tree`、`view-secret` 等上百个社区插件
- **kuberc**：kubectl 内建的用户偏好文件（v1.34 Beta 默认开启），可定义命令别名与默认参数，部分替代 shell alias 的用途

### kube-shell 交互式终端

[kube-shell](https://github.com/cloudnativelabs/kube-shell) 为 kubectl 提供交互式命令行体验，适合复杂调试和命令探索。

![kube-shell 交互终端界面](https://assets.jimmysong.io/images/book/kubernetes-handbook/cli/using-kubectl/kube-shell.webp)

**主要特性**：

- 智能命令提示和使用说明
- 自动补全和模糊搜索
- 语法高亮显示
- Tab 键列出可选对象
- 支持 vim 编辑模式

**安装方法**：

```bash
# 使用 pip 安装
pip install kube-shell --user -U

# 或使用 pipx 安装（推荐）
pipx install kube-shell
```

## kubectl 脚本与自动化最佳实践

- 明确指定输出格式（json、yaml、name），便于解析
- 明确资源版本（如 `apps/v1/deployments`）
- 不依赖默认 context，必要时显式指定
- 使用 `--dry-run=client/server` 预览变更
- 长时间命令设置超时
- 使用标签与选择器过滤资源
- 配合版本控制管理 YAML 文件，推荐用 apply
- 利用 kubectl 插件扩展功能

```bash
kubectl get deployment.apps/nginx -o json
kubectl apply -f deployment.yaml
kubectl apply -f deployment.yaml --dry-run=server
```

## 总结

kubectl 极大简化了 Kubernetes API 交互，支持丰富的资源管理、输出格式与自动化能力。深入理解 kubectl 与 API 的工作机制，有助于高效管理和自动化 Kubernetes 集群。

## 参考文献

1. [Kubernetes 官方文档 - kubernetes.io](https://kubernetes.io/zh-cn/docs/)
2. [kubectl 命令参考 - kubernetes.io](https://kubernetes.io/zh-cn/docs/reference/kubectl/)
3. [Kubernetes API 访问 - kubernetes.io](https://kubernetes.io/zh-cn/docs/concepts/overview/kubernetes-api/)
4. [Server-Side Apply 机制 - kubernetes.io](https://kubernetes.io/zh-cn/docs/reference/using-api/server-side-apply/)
5. [Kubernetes 客户端库 - kubernetes.io](https://kubernetes.io/zh-cn/docs/reference/using-api/client-libraries/)
