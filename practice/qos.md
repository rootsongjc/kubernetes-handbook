# QoS（服务质量等级）

QoS（Quality of Service），大部分译为“服务质量等级”，又译作“服务质量保证”，是作用在 Pod 上的一个配置，当 Kubernetes 创建一个 Pod 时，它就会给这个 Pod 分配一个 QoS 等级，可以是以下等级之一：

- **Guaranteed**：Pod 里的每个容器都必须有内存/CPU 限制和请求，而且值必须相等。
- **Burstable**：Pod 里至少有一个容器有内存或者 CPU 请求且不满足 Guarantee 等级的要求，即内存/CPU 的值设置的不同。
- **BestEffort**：容器必须没有任何内存或者 CPU 的限制或请求。

该配置不是通过一个配置项来配置的，而是通过配置 CPU/内存的 `limits` 与 `requests` 值的大小来确认服务质量等级的。使用 `kubectl get pod -o yaml` 可以看到 pod 的配置输出中有 `qosClass` 一项。该配置的作用是为了给资源调度提供策略支持，调度算法根据不同的服务质量等级可以确定将 pod 调度到哪些节点上。

例如，下面这个 YAML 配置中的 Pod 资源配置部分设置的服务质量等级就是 `Guarantee`。

```yaml
spec:
  containers:
    ...
    resources:
      limits:
        cpu: 100m
        memory: 128Mi
      requests:
        cpu: 100m
        memory: 128Mi
```

下面的 YAML 配置的 Pod 的服务质量等级是 `Burstable`。

```yaml
spec:
  containers:
    ...
    resources:
      limits:
        memory: "180Mi"
      requests:
        memory: "100Mi"
```

## 参考

- [Configure Quality of Service for Pods](https://kubernetes.io/docs/tasks/configure-pod-container/quality-service-pod/)