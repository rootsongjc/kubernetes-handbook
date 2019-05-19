---
title: "Kiali——Istio Service Mesh 的可观察性工具"
subtitle: "解决服务网格中微服务的可观察性问题的利器"
description: "本文介绍了 Istio Service Mesh 中的可观察性工具 Kiali 的功能、架构和部分代码。"
date: 2018-10-16T20:05:28+08:00
bigimg: [{src: "/img/banners/006tNbRwly1fwabqycy9gj30hg08qdhy.jpg", desc: "Photo via Getty Images"}]
draft: false
tags: ["istio","service mesh","kiali"]
categories: ["service mesh"]
---

Istio 中有个 [issue #9066](https://github.com/istio/istio/issues/9066) 要求将 Istio 中默认使用的 Service Graph 替换成 [Kiali](https://www.kiali.io)。Kiali 最初是由 Red Hat 开源的，用于解决 Service Mesh 中可观察性即微服务的可视性问题。目前已获得 Istio 社区的官方支持。

## 关于 Kiali

单体应用使用微服务架构拆分成了许多微服务的组合。服务的数量显著增加，就对需要了解服务之间的通信模式，例如容错（通过超时、重试、断路等）以及分布式跟踪，以便能够看到服务调用的去向。服务网格可以在平台级别上提供这些服务，并使应用程序编写者从以上繁重的通信模式中解放出来。路由决策在网格级别完成。Kiali 与Istio 合作，可视化服务网格拓扑、断路器和请求率等功能。Kiali还包括 Jaeger Tracing，可以提供开箱即用的分布式跟踪功能。

## Kiali 提供的功能

Kiali 提供以下功能：

- 服务拓扑图
- 分布式跟踪
- 指标度量收集和图标
- 配置校验
- 健康检查和显示
- 服务发现

下图展示了 kiali 中显示的 Bookinfo 示例的服务拓扑图。

<div class="gallery">
    <a href="https://ws2.sinaimg.cn/large/006tNbRwly1fw33xjfxtij31kw0veai7.jpg" title="Kiali 页面">
    <img src="https://ws2.sinaimg.cn/large/006tNbRwly1fw33xjfxtij31kw0veai7.jpg"></a>
</div>

你可以使用 [kubernetes-vagrant-centos-cluster](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster) 来快速启动一个运行 Kiali 的 Kubernetes 集群。

## 编译安装与试用

Kilia pod 中运行的进程是 `/opt/kiali/kiali -config /kiali-configuration/config.yaml -v 4`。

`/kiali-configuration/config.yaml` 是使用 ConfigMap 挂载进去的，用于配置 Kiali 的 Web 根路径和外部服务地址。

```yaml
server:
  port: 20001
  web_root: /
external_services:
  jaeger:
    url: "http://172.17.8.101:31888"
  grafana:
    url: "http://grafana.istio-system:3000"
```

## Kiali 中的基本概念

在了解 Kiali 如何提供 Service Mesh 中微服务可观察性之前，我们需要先了解下 Kiali 如何划分监控类别的。

- **Application**：使用运行的工作负载，必须使用 Istio 的将 Label 标记为 `app` 才算。注意，如果一个应用有多个版本，只要 `app` 标签的值相同就是属于同一个应用。
- **Deployment**：即 Kubernetes 中的 Deployment。
- **Label**：这个值对于 Istio 很重要，因为 Istio 要用它来标记 metrics。每个 Application 要求包括 `app` 和 `version` 两个 label。
- **Namespace**：通常用于区分项目和用户。
- **Service**：即 Kubernetes 中的 Service，不过要求必须有 `app` label。
- **Workload**：Kubernetes 中的所有常用资源类型如 Deployment、StatefulSet、Job 等都可以检测到，不论这些负载是否加入到 Istio Service Mesh 中。

Application、Workload 与 Service 的关系如下图所示。

<div class="gallery">
    <a href="https://ws4.sinaimg.cn/large/006tNbRwly1fw5mxl7c2wj31260psq5y.jpg">
    <img src="https://ws4.sinaimg.cn/large/006tNbRwly1fw5mxl7c2wj31260psq5y.jpg">
    </a>
</div>

Kilia 的详细 API 使用说明请查看 Swagger API 文档，在 Kiali 的根目录下运行下面的命令可以查看 API 文档。

```bash
make swagger-serve
```

Swagger UI 如下图。

<div class="gallery">
    <a href="https://ws1.sinaimg.cn/large/006tNbRwly1fw5kr3srpkj31kw14awo6.jpg" title="Kiali API 文档">
    <img src="https://ws1.sinaimg.cn/large/006tNbRwly1fw5kr3srpkj31kw14awo6.jpg"></a>
</div>

## 架构

Kiali 部署完成后只启动了一个 Pod，前后端都集成在这一个 Pod 中。Kiali 也有一些依赖的组件，例如如果要在 Kiali 的页面中获取到监控 metric 需要使用在 `istio-system` 中部署 Prometheus。分布式卓总直接下图是 Kiali 的架构，来自 Kiali 官网。

<div class="gallery">
    <a href="https://ws1.sinaimg.cn/large/006tNbRwly1fw5je6mg6aj30jg0ayaar.jpg" title="kiali架构图">
    <img src="https://ws1.sinaimg.cn/large/006tNbRwly1fw5je6mg6aj30jg0ayaar.jpg">
    </a>
</div>



Kiali 使用传统的前后端分离架构：

- 后端使用 Go 编写：<https://github.com/kiali/kiali>，为前端提供 API，所有消息使用 JSON 编码，使用 ConfigMap 和 Secret 来存储配置。直接与 Kubernetes 和 Istio 通信来获取数据。
- 前端使用 Typescript 编写：<https://github.com/kiali/kiali-ui>，无状态，除了一些证书保存在浏览器中。于查询后端 API，可以跳转访问 Jaeger 分布式追踪和 Grafana 监控页面。

Jaeger 和 Grafana 都是可选组件，使用的都是外部服务，不是由 Kiali 部署的，需要在 `kiali-configmap.yaml` 中配置 URL。注意该 URL 必须是从你本地浏览器中可以直接访问到的地址。

**注意：**如果服务之间没有任何请求就不会在 Prometheus 中保存数据也就无法显示服务拓扑图，所以大家在部署完 `Bookinfo` 服务之后向 `productpage` 服务发送一些请求用于生成服务拓扑图。

## 服务拓扑图

Kiali 中的服务拓扑图比起 Istio 原来默认部署的 ServiceGraph 的效果更炫也更加直观，具有更多选项。

<div class="gallery">
    <a href="https://ws2.sinaimg.cn/large/006tNbRwly1fw5l2ntj0hj31kw0ze48t.jpg" title="Kiali 中的服务拓扑图">
    <img src="https://ws2.sinaimg.cn/large/006tNbRwly1fw5l2ntj0hj31kw0ze48t.jpg">
    </a>
</div>

例如使用 CURL 模拟请求。

```bash
$ curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZXhwIjoxNTM5NjczOTYyfQ.6gNz4W6yA9Bih4RkTbcSvqdaiRqsyj8c8o6ictM9iDs" http://172.17.8.101:32439/api/namespaces/all/graph?duration=60s&graphType=versionedApp&injectServiceNodes=false&appenders=dead_node,sidecars_check,istio
```

会得到如下的返回的 JSON 返回值，为了节省篇幅其中省略了部分结果：

```json
{
  "timestamp": 1539296648,
  "graphType": "versionedApp",
  "elements": {
    "nodes": [
      {
        "data": {
          "id": "6519157be154675342fb76c41edc731c",
          "nodeType": "app",
          "namespace": "default",
          "app": "reviews",
          "isGroup": "version"
        }
      },
        ...
      {
        "data": {
          "id": "6249668dd0a91adb9e62994d36563365",
          "nodeType": "app",
          "namespace": "istio-system",
          "workload": "istio-ingressgateway",
          "app": "istio-ingressgateway",
          "version": "unknown",
          "rateOut": "0.691",
          "isOutside": true,
          "isRoot": true
        }
      }
    ],
    "edges": [
      {
        "data": {
          "id": "d51ca2a95d721427bbe27ed209766ec5",
          "source": "06e488a37fc9aa5b0e0805db4f16ae69",
          "target": "31150e7e5adf85b63f22fbd8255803d7",
          "rate": "0.236",
          "percentRate": "17.089",
          "responseTime": "0.152"
        }
      },
        ...
      {
        "data": {
          "id": "1dda06d9904bcf727d1b6a113be58556",
          "source": "80f71758099020586131c3565075935d",
          "target": "4b64bda48e5a3c7e50ab1c63836c9469",
          "rate": "0.236",
          "responseTime": "0.022"
        }
      }
    ]
  }
}
```

该值中包含了每个 `node` 和 `edge` 的信息，Node 即图中的每个节点，其中包含了节点的配置信息，Edge 即节点间的关系还有流量情况。前端可以根据该信息绘制服务拓扑图，我们下面将查看下 kiali 的后端，看看它是如何生成以上格式的 JSON 信息的。

**注**：详细的 REST API 使用和字段说明请查看 swagger 生成的 API 文档。

## 代码解析

下面将带大家了解 Kiali 的后端代码基本结构。

**路由配置**

服务拓扑图的路由信息保存在 `kiali/routing/routes.go` 文件中。

```json
{
	"GraphNamespace",
	"GET",
	"/api/namespaces/{namespace}/graph",
	handlers.GraphNamespace,
	true,
},
{
	"GraphAppVersion",
	"GET",
	"/api/namespaces/{namespace}/applications/{app}/versions/{version}/graph",
	handlers.GraphNode,
	true,
},
{
	"GraphApp",
	"GET",
	"/api/namespaces/{namespace}/applications/{app}/graph",
	handlers.GraphNode,
	true,
},
{
	"GraphService",
	"GET",
	"/api/namespaces/{namespace}/services/{service}/graph",
	handlers.GraphNode,
	true,
},
{
	"GraphWorkload",
	"GET",
	"/api/namespaces/{namespace}/workloads/{workload}/graph",
	handlers.GraphNode,
	true,
}
```

直接查看 Swagger 生成的 API 文档也可以。

**PQL 查询语句构建**

`kiali/handlers/graph.go` 中处理 HTTP 请求，服务拓扑图中所有的指标信息都是从 Prometheus 中查询得到的。

Kiali 的服务状态拓扑是根据 namespace 来查询的，例如 `default` namespace 下的服务指标查询 PQL：

```bash
round(sum(rate(istio_requests_total{reporter="source",source_workload_namespace="default",response_code=~"[2345][0-9][0-9]"} [600s])) by (source_workload_namespace,source_workload,source_app,source_version,destination_service_namespace,destination_service_name,destination_workload,destination_app,destination_version,response_code),0.001)
```

其中的参数都是通过页面选择传入的（构建的 PQL 中的选项在 `kiali/graph/options/options.go` 中定义）：

- `reporter="source"`：metric 报告来源，源服务（source）是 [envoy](https://istio.io/zh/help/glossary/#envoy) 代理的下游客户端。在[服务网格](https://istio.io/zh/help/glossary/#%E6%9C%8D%E5%8A%A1%E7%BD%91%E6%A0%BC)里，一个源服务通常是一个[工作负载](https://istio.io/zh/help/glossary/#%E5%B7%A5%E4%BD%9C%E8%B4%9F%E8%BD%BD)，但是入口流量的源服务有可能包含其他客户端，例如浏览器，或者一个移动应用。
- `source_workload_namespace="default"`：选择命名空间。
- `response_code`：返回码区间。
- `[600s]`：查询的数据中的时间间隔。

关于 PQL 的详细使用方式请参考 [QUERY EXAMPLES - prometheus.io](https://prometheus.io/docs/prometheus/latest/querying/examples/)。

<div class="gallery">
<a href="https://ws1.sinaimg.cn/large/006tNbRwly1fw966a6ki3j31hc0tdagx.jpg" title="Prometheus">
<img src="https://ws1.sinaimg.cn/large/006tNbRwly1fw966a6ki3j31hc0tdagx.jpg" alt="Prometheus">
</a>
</div>

这里面包含了所有 workload 的流量信息，做简单的操作就可以计算出 application/service 的流量状况。

**HTTP 处理逻辑**

HTTP 请求的处理逻辑入口位于 `kiali/handlers/graph.go`，路径为：

```go
func graphNamespaces(o options.Options, client *prometheus.Client) graph.TrafficMap {
	switch o.Vendor {
	case "cytoscape":
	default:
		checkError(errors.New(fmt.Sprintf("Vendor [%s] not supported", o.Vendor)))
	}

	log.Debugf("Build [%s] graph for [%v] namespaces [%s]", o.GraphType, len(o.Namespaces), o.Namespaces)

	trafficMap := graph.NewTrafficMap()
	for _, namespace := range o.Namespaces {
		log.Debugf("Build traffic map for namespace [%s]", namespace)
		namespaceTrafficMap := buildNamespaceTrafficMap(namespace, o, client)

		for _, a := range o.Appenders {
			a.AppendGraph(namespaceTrafficMap, namespace) // Appender 用于添加 service graph
		}
		mergeTrafficMaps(trafficMap, namespaceTrafficMap) //将不同的 namespace 下的服务状态合并
	}

	// appender 用于添加/删除/修改 node 信息。操作完成后可以做出如下判断：
	// - 将其标记外来者（即不在请求的 namespace 中的 node）
	// - 将其标记内部流量制造者（即位于 namespace 中只有向外的 edge）
	markOutsiders(trafficMap, o)
	markTrafficGenerators(trafficMap)

	if graph.GraphTypeService == o.GraphType {
		trafficMap = reduceToServiceGraph(trafficMap)
	}

	return trafficMap
}
```

Appender 是一个接口，在 service graph 中注入详细的信息，它的定义如下：

```go
// Appender 由任何代码提供实现，以附加具有补充信息的 service graph。如果出错，appender应该执行 panic 并将其作为错误响应处理。
type Appender interface {
	// AppendGraph 在提供的 traffic map 上执行 appender 工作。Map 最初可能是空的。允许 appender 添加或删除映射条目。
	AppendGraph(trafficMap graph.TrafficMap, namespace string)
}
```

Appender 位于 `kiali/graph/appender` 目录下，目前一共有如下实现：

- **DeadNodeAppender**：用于将不想要 node 从 service graph 中删除。
- **IstioAppender**：获取指定 namespace 下 Istio 的详细信息，当前版本获取指定 namespace 下的 VirtualService 和 DestinationRule 信息。
- **ResponseTimeAppender**：获取响应时间。
- **SecurityPolicyAppender**：在 service graph 中添加安全性策略信息。
- **SidecarsCheckAppender**：检查 Sidecar 的配置信息，例如 Pod 中是否有 App label。
- **UnusedNodeAppender**：未加入 Service Mesh 的 node。

我们再来看下在 `kiali/graph/graph.go` 中定义的 `TrafficMap` 结构。

```go
// TrafficMap 是 App 与 Node 之间的映射，每个节点都可选择保存 Edge 数据。Metadata 是用于保存任何期望的 node 或 edge 信息的通用映射。每个 app 节点应具有唯一的 namespace + workload。请注意，在同一 namespace 中有两个具有相同 name + version 的节点是可行的但可能并不常见。
type TrafficMap map[string]*Node

type Node struct {
	ID        string                 // unique identifier for the node
	NodeType  string                 // Node type
	Namespace string                 // Namespace
	Workload  string                 // Workload (deployment) name
	App       string                 // Workload app label value
	Version   string                 // Workload version label value
	Service   string                 // Service name
	Edges     []*Edge                // child nodes
	Metadata  map[string]interface{} // app-specific data
}

type Edge struct {
	Source   *Node
	Dest     *Node
	Metadata map[string]interface{} // app-specific data
}
```

以上只是对 Kiali 部分代码的解读，更详细的实现大家可以克隆 [kiali](https://github.com/kiali/kiali) 的代码自己研究。

## 参考

- [Kiali.io](https://www.kiali.io)
- [QUERY EXAMPLES - prometheus.io](https://prometheus.io/docs/prometheus/latest/querying/examples/)
- [replace Service Graph with Kiali #9066 - github.com](https://github.com/istio/istio/issues/9066)
- [rootsongjc/kubernetes-vagrant-centos-cluster - github.com](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster)

