# 自定义指标HPA

Kubernetes中支持不仅支持CPU、内存为指标的HPA，还支持自定义指标的HPA，例如QPS。

## 设置自定义指标

**kubernetes1.6**

在设置定义指标HPA之前需要先进行如下配置：

- 将heapster的启动参数 `--api-server` 设置为 true


- 启用custom metric API
- 将kube-controller-manager的启动参数中`--horizontal-pod-autoscaler-use-rest-clients`设置为true，并指定`--master`为API server地址，如`--master=http://172.20.0.113:8080`

在kubernetes1.5以前很容易设置，参考[1.6以前版本的kubernetes中开启自定义HPA](https://medium.com/@marko.luksa/kubernetes-autoscaling-based-on-custom-metrics-without-using-a-host-port-b783ed6241ac)，而在1.6中因为取消了原来的annotation方式设置custom metric，只能通过API server和kube-aggregator来获取custom metric，因为只有两种方式来设置了，一是直接通过API server获取heapster的metrics，二是部署[kube-aggragator](https://github.com/kubernetes/kube-aggregator)来实现。

我们将安装聚合的API server来实现自定义指标的HPA。

**kuberentes1.7**

已经内置了`apiregistration.k8s.io/v1beta1` API，可以直接定义APIService，如：

```yaml
apiVersion: apiregistration.k8s.io/v1beta1
kind: APIService
metadata:
  name: v1alpha1.custom-metrics.metrics.k8s.io
spec:
  insecureSkipTLSVerify: true
  group: custom-metrics.metrics.k8s.io
  groupPriorityMinimum: 1000
  versionPriority: 5
  service:
    name: api
    namespace: custom-metrics
  version: v1alpha1
```

## 参考

[1.6以前版本的kubernetes中开启自定义HPA](https://medium.com/@marko.luksa/kubernetes-autoscaling-based-on-custom-metrics-without-using-a-host-port-b783ed6241ac)

[1.7版本的kubernetes中启用自定义HPA](https://docs.bitnami.com/kubernetes/how-to/configure-autoscaling-custom-metrics/)