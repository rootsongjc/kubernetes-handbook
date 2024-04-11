---
weight: 36
title: 自定义指标 HPA
date: '2022-05-21T00:00:00+08:00'
type: book
---

Kubernetes 中不仅支持 CPU、内存为指标的 HPA，还支持自定义指标的 HPA，例如 QPS。

## 设置自定义指标

**Kubernetes 1.6**

> 在 Kubernetes1.6 集群中配置自定义指标的 HPA 的说明已废弃。

在设置定义指标 HPA 之前需要先进行如下配置：

- 将 heapster 的启动参数 `--api-server` 设置为 true


- 启用 custom metric API
- 将 kube-controller-manager 的启动参数中 `--horizontal-pod-autoscaler-use-rest-clients` 设置为 true，并指定 `--master` 为 API server 地址，如 `--master=http://172.20.0.113:8080`

在 Kubernetes1.5 以前很容易设置，参考 [1.6 以前版本的 kubernetes 中开启自定义 HPA](https://medium.com/@marko.luksa/kubernetes-autoscaling-based-on-custom-metrics-without-using-a-host-port-b783ed6241ac)，而在 1.6 中因为取消了原来的 annotation 方式设置 custom metric，只能通过 API server 和 kube-aggregator 来获取 custom metric，因为只有两种方式来设置了，一是直接通过 API server 获取 heapster 的 metrics，二是部署 [kube-aggragator](https://github.com/kubernetes/kube-aggregator) 来实现。

我们将在 Kubernetes1.8 版本的 Kubernetes 中，使用聚合的 API server 来实现自定义指标的 HPA。

**Kuberentes1.7+**

确认您的 Kubernetes 版本在 1.7 或以上，修改以下配置：

- 将 kube-controller-manager 的启动参数中 `--horizontal-pod-autoscaler-use-rest-clients` 设置为 true，并指定 `--master` 为 API server 地址，如 `--master=http://172.20.0.113:8080`
- 修改 kube-apiserver 的配置文件 apiserver，增加一条配置 `--requestheader-client-ca-file=/etc/kubernetes/ssl/ca.pem --requestheader-allowed-names=aggregator --requestheader-extra-headers-prefix=X-Remote-Extra- --requestheader-group-headers=X-Remote-Group --requestheader-username-headers=X-Remote-User --proxy-client-cert-file=/etc/kubernetes/ssl/kubernetes.pem --proxy-client-key-file=/etc/kubernetes/ssl/kubernetes-key.pem`，用来配置 aggregator 的 CA 证书。

已经内置了 `apiregistration.k8s.io/v1beta1` API，可以直接定义 APIService，如：

```yaml
apiVersion: apiregistration.k8s.io/v1
kind: APIService
metadata:
  name: v1.custom-metrics.metrics.k8s.io
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

**部署 Prometheus**

使用 [prometheus-operator.yaml](https://github.com/rootsongjc/kubernetes-handbook/blob/master/manifests/HPA/prometheus-operator.yaml) 文件部署 Prometheus operator。

**注意：** 将镜像修改为你自己的镜像仓库地址。

这产生一个自定义的 API，可以通过浏览器访问，还可以使用下面的命令可以检查该 API：

```bash
$ kubectl get --raw=apis/custom-metrics.metrics.k8s.io/v1alpha1
{"kind":"APIResourceList","apiVersion":"v1","groupVersion":"custom-metrics.metrics.k8s.io/v1alpha1","resources":[{"name":"jobs.batch/http_requests","singularName":"","namespaced":true,"kind":"MetricValueList","verbs":["get"]},{"name":"namespaces/http_requests","singularName":"","namespaced":false,"kind":"MetricValueList","verbs":["get"]},{"name":"jobs.batch/up","singularName":"","namespaced":true,"kind":"MetricValueList","verbs":["get"]},{"name":"pods/up","singularName":"","namespaced":true,"kind":"MetricValueList","verbs":["get"]},{"name":"services/scrape_samples_scraped","singularName":"","namespaced":true,"kind":"MetricValueList","verbs":["get"]},{"name":"namespaces/scrape_samples_scraped","singularName":"","namespaced":false,"kind":"MetricValueList","verbs":["get"]},{"name":"pods/scrape_duration_seconds","singularName":"","namespaced":true,"kind":"MetricValueList","verbs":["get"]},{"name":"services/scrape_duration_seconds","singularName":"","namespaced":true,"kind":"MetricValueList","verbs":["get"]},{"name":"pods/http_requests","singularName":"","namespaced":true,"kind":"MetricValueList","verbs":["get"]},{"name":"pods/scrape_samples_post_metric_relabeling","singularName":"","namespaced":true,"kind":"MetricValueList","verbs":["get"]},{"name":"jobs.batch/scrape_samples_scraped","singularName":"","namespaced":true,"kind":"MetricValueList","verbs":["get"]},{"name":"jobs.batch/scrape_duration_seconds","singularName":"","namespaced":true,"kind":"MetricValueList","verbs":["get"]},{"name":"namespaces/scrape_duration_seconds","singularName":"","namespaced":false,"kind":"MetricValueList","verbs":["get"]},{"name":"namespaces/scrape_samples_post_metric_relabeling","singularName":"","namespaced":false,"kind":"MetricValueList","verbs":["get"]},{"name":"services/scrape_samples_post_metric_relabeling","singularName":"","namespaced":true,"kind":"MetricValueList","verbs":["get"]},{"name":"services/up","singularName":"","namespaced":true,"kind":"MetricValueList","verbs":["get"]},{"name":"pods/scrape_samples_scraped","singularName":"","namespaced":true,"kind":"MetricValueList","verbs":["get"]},{"name":"services/http_requests","singularName":"","namespaced":true,"kind":"MetricValueList","verbs":["get"]},{"name":"jobs.batch/scrape_samples_post_metric_relabeling","singularName":"","namespaced":true,"kind":"MetricValueList","verbs":["get"]},{"name":"namespaces/up","singularName":"","namespaced":false,"kind":"MetricValueList","verbs":["get"]}]}
```

## 参考

- [1.6 以前版本的 kubernetes 中开启自定义 HPA - medium.com](https://medium.com/@marko.luksa/kubernetes-autoscaling-based-on-custom-metrics-without-using-a-host-port-b783ed6241ac)
- [Horizontal Pod Autoscaler Walkthrough - kubernetes.io](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/)
- [Kubernetes 1.8: Now with 100% Daily Value of Custom Metrics - blog.openshift.com](https://blog.openshift.com/kubernetes-1-8-now-custom-metrics/)
- [Arbitrary/Custom Metrics in the Horizontal Pod Autoscaler#117 - github.com](https://github.com/kubernetes/features/issues/117)
