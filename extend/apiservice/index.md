---
weight: 66
title: APIService
date: '2022-05-21T00:00:00+08:00'
type: book

description: 深入了解 Kubernetes APIService 的概念、配置和使用方法，包括如何查看和管理集群中的 API 服务。
keywords:
- api
- apiregistration
- apiservice
- io
- k8s
- service
- v1
- 使用
- 排序
- 查看
---

APIService 是 Kubernetes 中用来表示特定 GroupVersion 服务器的资源对象，它允许扩展 Kubernetes API 以支持自定义资源和功能。APIService 的结构定义位于 `staging/src/k8s.io/kube-aggregator/pkg/apis/apiregistration/types.go` 中。

## APIService 配置示例

以下是一个典型的 APIService 配置示例：

```yaml
apiVersion: apiregistration.k8s.io/v1
kind: APIService
metadata:
  name: v1alpha1.custom-metrics.metrics.k8s.io
spec:
  insecureSkipTLSVerify: false
  caBundle: <base64-encoded-ca-bundle>
  group: custom-metrics.metrics.k8s.io
  groupPriorityMinimum: 1000
  versionPriority: 5
  service:
    name: custom-metrics-apiserver
    namespace: custom-metrics
    port: 443
  version: v1alpha1
```

## APIService 字段详解

### 基本配置

- **apiVersion**: 使用 `apiregistration.k8s.io/v1` 版本
- **metadata.name**: 定义 API 的唯一标识符，格式为 `<version>.<group>`

### Spec 字段

- **group**: API 组名称，用于组织相关的 API 资源
- **version**: API 版本标识符
- **service**: 处理该 APIService 请求的后端服务配置
  - `name`: 服务名称
  - `namespace`: 服务所在的命名空间
  - `port`: 服务端口（可选，默认为 443）

### 安全配置

- **caBundle**: Base64 编码的 CA 证书包，用于验证服务的 TLS 证书
- **insecureSkipTLSVerify**: 是否跳过 TLS 证书验证（**强烈不推荐**设置为 true）

### 优先级配置

- **groupPriorityMinimum**: API 组的处理优先级
  - 数值越大优先级越高
  - 主要用于决定客户端与哪个 API 组通信
  - 次要排序基于字母顺序

- **versionPriority**: 同一组内 API 版本的优先级
  - 必须大于零
  - 数值越大优先级越高（如 20 > 10）
  - 用于控制版本选择顺序

## 查看 APIService 状态

创建 APIService 后，可以查看其详细状态：

```bash
kubectl get apiservice v1alpha1.custom-metrics.metrics.k8s.io -o yaml
```

输出示例：

```yaml
apiVersion: apiregistration.k8s.io/v1
kind: APIService
metadata:
  creationTimestamp: "2023-10-15T08:27:35Z"
  name: v1alpha1.custom-metrics.metrics.k8s.io
  resourceVersion: "35194598"
  uid: a31a3412-e0a8-11e7-9fa4-f4e9d49f8ed0
spec:
  caBundle: LS0tLS1CRUdJTi... # Base64 encoded CA bundle
  group: custom-metrics.metrics.k8s.io
  groupPriorityMinimum: 1000
  insecureSkipTLSVerify: false
  service:
    name: custom-metrics-apiserver
    namespace: custom-metrics
    port: 443
  version: v1alpha1
  versionPriority: 5
status:
  conditions:
  - lastTransitionTime: "2023-10-15T08:27:38Z"
    message: all checks passed
    reason: Passed
    status: "True"
    type: Available
```

## 管理集群中的 APIService

### 查看所有 APIService

```bash
kubectl get apiservices
```

输出示例：

```bash
NAME                                     SERVICE                      AVAILABLE   AGE
v1.                                      Local                        True        2d
v1.apps                                  Local                        True        2d
v1.authentication.k8s.io                Local                        True        2d
v1.authorization.k8s.io                 Local                        True        2d
v1.autoscaling                           Local                        True        2d
v1.batch                                 Local                        True        2d
v1.networking.k8s.io                    Local                        True        2d
v1.rbac.authorization.k8s.io            Local                        True        2d
v1.storage.k8s.io                       Local                        True        2d
v1alpha1.custom-metrics.metrics.k8s.io  custom-metrics/api           True        2h
v1.apiextensions.k8s.io                 Local                        True        2d
v1.certificates.k8s.io                  Local                        True        2d
v1.policy                               Local                        True        2d
v2.autoscaling                          Local                        True        2d
```

### 查看支持的 API 版本

使用以下命令查看集群支持的所有 API 版本：

```bash
kubectl api-versions
```

输出示例：

```bash
admissionregistration.k8s.io/v1
apiextensions.k8s.io/v1
apiregistration.k8s.io/v1
apps/v1
authentication.k8s.io/v1
authorization.k8s.io/v1
autoscaling/v1
autoscaling/v2
batch/v1
certificates.k8s.io/v1
coordination.k8s.io/v1
custom-metrics.metrics.k8s.io/v1alpha1
events.k8s.io/v1
networking.k8s.io/v1
node.k8s.io/v1
policy/v1
rbac.authorization.k8s.io/v1
storage.k8s.io/v1
v1
```

## 最佳实践

1. **安全性**: 始终使用 `caBundle` 进行 TLS 验证，避免设置 `insecureSkipTLSVerify: true`
2. **命名规范**: 使用清晰的命名约定，格式为 `<version>.<group>`
3. **优先级设置**: 合理设置优先级以避免 API 冲突
4. **监控状态**: 定期检查 APIService 的 `Available` 状态，确保服务正常运行
5. **版本管理**: 在更新 API 版本时，保持向后兼容性

通过合理配置和管理 APIService，可以有效扩展 Kubernetes API 功能，为自定义应用程序提供原生的 Kubernetes API 体验。
