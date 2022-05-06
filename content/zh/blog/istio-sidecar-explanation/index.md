---
title: "Istio Sidecar 代理组成详解"
description: "本文将向你介绍 Istio 中 sidecar 代理的组成。"
date: 2022-05-05T14:18:40+08:00
draft: false
tags: ["istio","sidecar"]
categories: ["Istio"]
type: "post"
bg_image: "images/backgrounds/page-title.jpg"
image: "images/banner/oam.png"
---

我曾经讲解过 [Istio 中 sidecar 的注入、使用 iptables 进行透明流量拦截及流量路由的详细过程](https://jimmysong.io/blog/sidecar-injection-iptables-and-traffic-routing/)，但是实际上 sidecar 内的流量并不止对于 sidecar 本身的内部结构却疏于展示。Istio 注入在 Pod 内或虚拟机中安装的所有 sidecar 代理组成了服务网格的数据平面，也是 Istio 的主要工作负载所在地，通过了解 sidecar 代理的组成，就可以窥一斑而知全豹，了解 Istio 的运作方式。

本文将向你展示：

- Istio sidecar 代理的中的组件和组织结构
- Sidecar 代理中开放的端口及端点功能

下图展示的是 Istio 数据平面中 sidecar 的组成。

![Istio sidecar 组成示意图]()

我们可以使用 `nsenter` 命令进入Bookinfo 示例的 `productpage`  Pod的网络空间，查看其内部监听的端口信息。

![Istio sidecar 中监听的端口信息](https://tva1.sinaimg.cn/large/e6c9d24ely1h1xs93b47oj217i0kkdkp.jpg)

```bash
# 假如该进程的 PID 是 4268
$ nsenter -n --target 4268
$ netstat -ntl
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State      
tcp        0      0 127.0.0.1:15004         0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:15006           0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:15006           0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:15021           0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:15021           0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:15090           0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:15090           0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:9080            0.0.0.0:*               LISTEN     
tcp        0      0 127.0.0.1:15000         0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:15001           0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:15001           0.0.0.0:*               LISTEN     
tcp6       0      0 :::15020                :::*                    LISTEN     
```

Sidecar 容器即 `istio-proxy` 容器的根进程是 `pilot-agent`，启动命令如下：

![Sidecar 中的进程](https://tva1.sinaimg.cn/large/e6c9d24ely1h1xo1qu5slj224w0f0q8m.jpg)

```bash
/usr/local/bin/pilot-agent proxy sidecar --domain default.svc.cluster.local --proxyLogLevel=warning --proxyComponentLogLevel=misc:error --log_output_level=default:info --concurrency 2
```

它拉起了 `envoy` 进程，命令如下：

```bash
/usr/local/bin/envoy -c etc/istio/proxy/envoy-rev0.json --restart -epoch 0 --drain-time-s 45 --drain-strategy immediate --parent-shutdown-time-s 60 --local-address-ip-version v4 --file-flush-interval-msec 1000 --disable-hot-restart --log-format %Y-%m-%dT%T.%fZ.%l.envoy %n.%v -l warning --component-log-level misc:error --concurrency 2
```

`pilot-agent` 进程用于拉起 `envoy` 进程。

面向服务的端口：

• 15020：暴露各种功能，主要有以下几个方面：

– 通过查询15090端口的指标、应用指标（如果配置了）和自身的指标，汇总并公开Envoy代理的指标。

– 对Envoy和DNS代理进行健康检查。代理也可以被配置为在这个端点上执行应用程序的健康检查，但这通常只用于非Kubernetes工作负载，如虚拟机。

– 用于调试pilot代理的端点——对Istio开发团队很有用，它暴露了内存、CPU等信息。

- 15021：该端口用于健康检查，以判断已注入sidecar的Pod是否准备好接收流量。如前所述，Envoy代理将健康检查路由到15020端口的Pilot代理，实际的健康检查将发生在那里。
- 15053：本地DNS代理，用于解析Kubernetes DNS解析不了集群内部域名的场景。
- 15001：用于处理出站流量。
- 15006：用于处理入站流量。

对调试和内省代理有用的端口：

• 15000：Envoy代理管理接口（这在第10章，特别是第10.3.1节有介绍）。

• 15090：公开Envoy代理指标，如xDS统计、连接统计、HTTP统计、异常值统计、健康检查统计、断路统计等。

• 15004：通过代理暴露Istio Pilot调试端点（在本附录后面会有更多介绍）。对调试Pilot的连接问题很有用。

• 15020：为调试Pilot代理提供端点（如上述面向服务的端口）。

## 15020 端口

