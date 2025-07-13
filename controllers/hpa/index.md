---
weight: 35
title: Horizontal Pod Autoscaling
linkTitle: HPA
date: '2022-05-21T00:00:00+08:00'
type: book
aliases:
  - /book/kubernetes-handbook/controllers/hpa/custom-metrics-hpa/
description: 深入了解 Kubernetes HPA（Horizontal Pod Autoscaling）的工作原理、配置方法和自定义指标支持，包括基于 CPU、内存和自定义指标的自动扩缩容实现。
keywords:
- hpa
- kubernetes
- autoscaling
- 自动扩缩容
- 自定义指标
- prometheus
- metrics
---

应用的资源使用率通常都有高峰和低谷的时候，如何削峰填谷，提高集群的整体资源利用率，让 service 中的 Pod 个数自动调整呢？这就有赖于 Horizontal Pod Autoscaling 了，顾名思义，使 Pod 水平自动缩放。

HPA 是最能体现 Kubernetes 相比传统运维价值的功能之一，不再需要手动扩容，真正实现了自动化运维，还可以基于自定义指标进行扩缩容。

## 概述

HPA 属于 Kubernetes 中的 **autoscaling** SIG（Special Interest Group），其下有两个主要特性：

- [Arbitrary/Custom Metrics in the Horizontal Pod Autoscaler#117](https://github.com/kubernetes/features/issues/117)
- [Monitoring Pipeline Metrics HPA API #118](https://github.com/kubernetes/features/issues/118)

### 版本演进

- **Kubernetes 1.2**：引入 HPA 机制
- **Kubernetes 1.6**：从 kubelet 获取指标转为通过 API server、Heapster 或 kube-aggregator 获取
- **Kubernetes 1.6+**：支持自定义指标
- **现在**：推荐使用 `autoscaling/v2` API

## 架构原理

Horizontal Pod Autoscaling 仅适用于 Deployment 和 ReplicaSet，由 API server 和 controller 共同实现：

![HPA 示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/controllers/hpa/horizontal-pod-autoscaler.webp)
{width=969 height=554}

### 工作机制

HPA 由一个控制循环实现，循环周期由 controller manager 中的 `--horizontal-pod-autoscaler-sync-period` 标志指定（默认 30 秒）。

在每个周期内，controller manager 执行以下操作：

1. **查询指标**：从 resource metric API 或自定义 metric API 获取指标
2. **计算利用率**：
   - **Resource metrics**：计算与容器 resource request 的百分比
   - **自定义 metrics**：使用原始值进行比较
   - **Object metrics**：获取单个对象的指标与目标值比较
3. **计算副本数**：基于所有指标计算新的副本数，取最大值
4. **执行扩缩容**：通过 Scale 子资源调整副本数

{{<callout note "注意">}}
如果 Pod 的容器没有设置 resource request，则无法定义 CPU 利用率，HPA 不会对该指标采取任何操作。
{{</callout>}}

## 支持的指标类型

### API 版本对比

| API 版本 | 支持的指标 |
|---------|-----------|
| `autoscaling/v1` | CPU 利用率 |
| `autoscaling/v2` | CPU、内存、自定义指标、多指标组合 |

### 指标获取方式

HPA 控制器可通过两种方式获取指标：

1. **直接 Heapster 访问**：通过 API 服务器的服务代理查询 Heapster
2. **REST 客户端访问**：通过 metrics API 获取指标

## 基本使用

### kubectl 命令

以下是相关的代码示例：

```bash
# 基本管理命令
kubectl create hpa
kubectl get hpa
kubectl describe hpa
kubectl delete hpa

# 快速创建 HPA
kubectl autoscale deployment nginx --min=2 --max=10 --cpu-percent=80
```

### 命令参数说明

以下是相关的代码示例：

```bash
kubectl autoscale (-f FILENAME | TYPE NAME | TYPE/NAME) [--min=MINPODS] --max=MAXPODS [--cpu-percent=CPU] [flags]
```

**示例**：为 Deployment foo 创建 autoscaler，CPU 利用率达到 80% 时扩缩容，副本数在 2-5 之间：

```bash
kubectl autoscale deployment foo --min=2 --max=5 --cpu-percent=80
```

### YAML 配置示例

以下是相关的示例代码：

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nginx-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nginx
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

{{<callout warning "滚动更新注意事项">}}
- ✅ **支持**：HPA 绑定到 Deployment，支持滚动更新
- ❌ **不支持**：HPA 直接绑定到 ReplicationController 进行滚动更新

原因：滚动更新会创建新的 ReplicationController，HPA 不会自动绑定到新的 RC。
{{</callout>}}

## 自定义指标配置

### 前提条件

要使用自定义指标，需要满足以下条件：

1. **Controller Manager 配置**：
   ```bash
   --horizontal-pod-autoscaler-use-rest-clients=true
   --master=http://API_SERVER_ADDRESS:8080
   ```

2. **API Server 配置**（Kubernetes 1.7+）：
   ```bash
   --requestheader-client-ca-file=/etc/kubernetes/ssl/ca.pem
   --requestheader-allowed-names=aggregator
   --requestheader-extra-headers-prefix=X-Remote-Extra-
   --requestheader-group-headers=X-Remote-Group
   --requestheader-username-headers=X-Remote-User
   --proxy-client-cert-file=/etc/kubernetes/ssl/kubernetes.pem
   --proxy-client-key-file=/etc/kubernetes/ssl/kubernetes-key.pem
   ```

### APIService 配置

创建自定义指标 API 服务：

```yaml
apiVersion: apiregistration.k8s.io/v1
kind: APIService
metadata:
  name: v1beta2.custom-metrics.metrics.k8s.io
spec:
  insecureSkipTLSVerify: true
  group: custom-metrics.metrics.k8s.io
  groupPriorityMinimum: 1000
  versionPriority: 5
  service:
    name: custom-metrics-apiserver
    namespace: custom-metrics
  version: v1beta2
```

### Prometheus 集成

1. **部署 Prometheus Operator**：
   ```bash
   kubectl apply -f prometheus-operator.yaml
   ```

2. **验证自定义指标 API**：
   ```bash
   kubectl get --raw="/apis/custom-metrics.metrics.k8s.io/v1beta2" | jq .
   ```

3. **自定义指标 HPA 示例**：
   ```yaml
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata:
     name: nginx-custom-hpa
   spec:
     scaleTargetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: nginx
     minReplicas: 2
     maxReplicas: 10
     metrics:
     - type: Pods
       pods:
         metric:
           name: http_requests_per_second
         target:
           type: AverageValue
           averageValue: "100"
     - type: Object
       object:
         metric:
           name: requests-per-second
         describedObject:
           apiVersion: networking.k8s.io/v1
           kind: Ingress
           name: main-route
         target:
           type: Value
           value: "10k"
   ```

## 多指标支持

Kubernetes 1.6+ 支持基于多个指标的扩缩容：

- HPA 会根据每个指标计算所需的副本数
- **取最大值**作为最终的扩缩容结果
- 确保所有指标都满足要求

### 指标类型说明

| 指标类型 | 描述 | 用途 |
|---------|------|------|
| `Resource` | CPU、内存等资源指标 | 基础资源监控 |
| `Pods` | Pod 级别的自定义指标 | 应用特定指标 |
| `Object` | Kubernetes 对象指标 | 外部资源监控 |
| `External` | 外部系统指标 | 云服务指标 |

## 最佳实践

### 资源请求设置

以下是相关的代码示例：

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

### 合理的扩缩容参数

以下是相关的代码示例：

```yaml
behavior:
  scaleDown:
    stabilizationWindowSeconds: 300
    policies:
    - type: Percent
      value: 10
      periodSeconds: 60
  scaleUp:
    stabilizationWindowSeconds: 60
    policies:
    - type: Percent
      value: 50
      periodSeconds: 60
```

### 监控和告警

- 监控 HPA 状态和扩缩容事件
- 设置合理的告警阈值
- 定期检查指标的准确性

## 故障排除

### 常见问题

1. **HPA 不生效**
   - 检查 Pod 是否设置了 resource requests
   - 验证 metrics-server 是否正常运行
   - 确认 HPA 配置正确

2. **自定义指标无法获取**
   - 检查自定义指标 API 是否注册
   - 验证 APIService 配置
   - 确认指标数据源正常

3. **频繁扩缩容**
   - 调整 `stabilizationWindowSeconds`
   - 优化指标阈值设置
   - 检查应用负载模式

### 调试命令

以下是相关的代码示例：

```bash
# 查看 HPA 状态
kubectl describe hpa <hpa-name>

# 查看 HPA 事件
kubectl get events --field-selector involvedObject.kind=HorizontalPodAutoscaler

# 查看可用指标
kubectl get --raw "/apis/metrics.k8s.io/v1beta1/nodes" | jq .
kubectl get --raw "/apis/custom-metrics.metrics.k8s.io/v1beta2" | jq .
```

## 参考资料

- [HPA 官方文档 - kubernetes.io](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [HPA Walkthrough - kubernetes.io](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/)
- [自定义指标开发 - github.com](https://github.com/kubernetes/metrics)
- [Kubernetes autoscaling based on custom metrics - medium.com](https://medium.com/@marko.luksa/kubernetes-autoscaling-based-on-custom-metrics-without-using-a-host-port-b783ed6241ac)
