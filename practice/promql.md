# Prometheus 查询语言 PromQL 使用说明

目前很多云原生应用使用了 Prometheus 作为监控，例如在 [Istio 中查询 Prometheus 指标](https://istio.io/zh/docs/tasks/telemetry/querying-metrics/)。

Prometheus 提供了一种功能表达式语言，允许用户实时选择和汇总时间序列数据。表达式的结果可以显示为图形、表格数据或者由外部系统通过 [RESTful API](https://prometheus.io/docs/prometheus/latest/querying/api/) 消费。


## 表达式语言数据类型

Prometheus 查询语言简称 PromQL，其中包含以下四类数据类型：

- **Instant vector（即时向量）**：一组时间序列，拥有共同的时间戳，每个时间序列中都包含一个样本。
- **Range vector（范围向量）**：一组时间序列，其中每个时间序列都包含一系列时间范围内的数据点。
- **Scalar（标量）**：一个简单的浮点值。
- **String（字符串）**：一个简单的字符串，目前暂未使用。

## 示例

可以通过 Prometheus web 页面查询。

![Prometheus 的查询页面](https://ws2.sinaimg.cn/large/006tNbRwly1fwcl7v28rhj30xl0onadv.jpg)

还可以使用 HTTP API 直接请求查询，例如你使用 [kubernetes-vagrant-centos-cluster](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster) 部署了 [Istio](https://istio.io/zh)，会默认安装 Prometheus，你可以在浏览器中请求 <http://prometheus.istio.jimmysong.io/api/v1/query?query=http_requests_total{job=%22kubernetes-nodes%22}>，将会看到如下格式的 json 返回值。

```json
{
  "status": "success",
  "data": {
    "resultType": "vector",
    "result": [
      {
        "metric": {
          "__name__": "http_requests_total",
          "beta_kubernetes_io_arch": "amd64",
          "beta_kubernetes_io_os": "linux",
          "code": "200",
          "handler": "prometheus",
          "instance": "node1",
          "job": "kubernetes-nodes",
          "kubernetes_io_hostname": "node1",
          "method": "get"
        },
        "value": [
          1539861026.814,
          "556"
        ]
      },
      {
        "metric": {
          "__name__": "http_requests_total",
          "beta_kubernetes_io_arch": "amd64",
          "beta_kubernetes_io_os": "linux",
          "code": "200",
          "handler": "prometheus",
          "instance": "node2",
          "job": "kubernetes-nodes",
          "kubernetes_io_hostname": "node2",
          "method": "get"
        },
        "value": [
          1539861026.814,
          "555"
        ]
      },
      {
        "metric": {
          "__name__": "http_requests_total",
          "beta_kubernetes_io_arch": "amd64",
          "beta_kubernetes_io_os": "linux",
          "code": "200",
          "handler": "prometheus",
          "instance": "node3",
          "job": "kubernetes-nodes",
          "kubernetes_io_hostname": "node3",
          "method": "get"
        },
        "value": [
          1539861026.814,
          "556"
        ]
      }
    ]
  }
}
```

**HTTP API 说明**

上面是对最常用也是比较简单的即时查询，下面是对以上返回结果的简要说明。

- `status`：可以为 `success` 和 `error`， 如果为 `error`，则不会显示 `data` 字段，而显示 `errorType` 和 `error`。
- `resultType`：返回结果类型，可以为 `matrix`、`vector`、`scalar` 或 `string`。
- `metric`：即时查询的到的监控 metric，其中的项为 label，可以在查询 URL 中增加标签选择器来过滤 metric。
- `value` ：第一个数字是 UNIX 格式的时间戳，例如 `1539861026.814` 表示的是北京时间 `2018/10/18 19:10:26.814`（注意：小数点后毫秒数）。Prometheus 中的 metric 时间都是以 UTC（协调世界时间）为单位的，无法调整时区，需要在前端展示时自己来调整。

您也可以查询一个时间段、根据标签选择一组 metric、Prometheus 中的 target、rule、metadata 等配置进行查询。关于 Prometheus RESTful API 的详细用法请参考 [HTTP API](https://prometheus.io/docs/prometheus/latest/querying/api/)。

## 参考

- [QUERYING PROMETHEUS - prometheus.io](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Setting up a distributed Kubernetes cluster along with Istio service mesh locally with Vagrant and VirtualBox - github.com](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster)