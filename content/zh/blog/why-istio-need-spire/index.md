---
title: "为什么 Istio 要使用 SPIRE 做身份认证？"
draft: false
date: 2022-06-21T19:27:49+08:00
description: "本文将带你了解 SPIRE 对于零信任架构的意义，以及 Istio 是为什么使用 SPIRE 实现身份认证。"
categories: ["Istio"]
tags: ["Istio","SPIFFE","SPIRE"]
type: "post"
image: "images/banner/spiffe.jpg"
---

今年 6 月初，[Istio 1.14 发布](https://istio.io/latest/news/releases/1.14.x/announcing-1.14/)，该版本中最值得关注的特性是新增对 SPIRE 的支持。[SPIFFE](https://spiffe.io) 和 SPIRE 都是 CNCF 孵化项目，其中 SPIRE 是 SPIFFE 的实现之一。本文将带你了解 SPIRE 对于零信任架构的意义，以及 Istio 是为何使用 SPIRE 实现身份认证。

## Kubernetes 中的身份认证

我们都知道 Istio 最初是基于 Kubernetes 建立起来的，在谈在 Istio 中使用 SPIRE 做身份认证之前，我们先来看下 Kubernetes 中如何做身份认证。

我们来看一个 pod 的 token 的例子，下面是 default 命名空间下 sleep pod 的 Service Account 的 token。

```bash
apiVersion: v1
data:
  ca.crt: {CA_CRT}
  namespace: ZGVmYXVsdA==
  token: {TOKEN_STRING}
kind: Secret
metadata:
  annotations:
    kubernetes.io/service-account.name: sleep
    kubernetes.io/service-account.uid: 2c0d00e8-13a2-48d0-9ff8-f987f3325ecf
  creationTimestamp: "2022-06-14T03:01:35Z"
  name: sleep-token-gwhwd
  namespace: default
  resourceVersion: "244535398"
  uid: b8822ceb-9553-4a17-96dc-d525bbaed0e0
type: kubernetes.io/service-account-token
```

我们看到其中有 `ca.crt` 和 `token` 字段，如果这个 token 被窃取，会有什么后果？Kubernetes 中使用 Service Account 来管理 Pod 的身份，然后利用 RBAC 指定具有某 Service Account 的 Pod 对 Kubernetes  API 的权限。Service Account 的 token 存储在 Secret 中，token 中并不包含工作负载所运行的节点、pod 的声明，一旦 token 被窃取破坏者就获得了该账户的所有权限，伪装成该用户窃取信息或破坏。

一个 token 只能在一个集群中标记负载身份，Istio 同时支持 Kubernetes 环境和虚拟机，还有多集群多网格，如何统一这些异构环境中的工作负载身份？这时，一个统一的工作负载身份标准就呼之欲出了。

## SPIFFE 与 SPIRE 简介

SPIFFE 的目的是基于零信任的理念，建立一个开放、统一的工作负载身份标准，这有助于建立一个零信任的全面身份化的数据中心网络。SPIFFE 的核心是通过简单 API 定义了一个短期的加密身份文件 SVID，用作工作负载认证时使用的身份文件，例如建立 TLS 连接或签署和验证 JWT 令牌等。SPIRE 可以根据管理员定义的策略自动轮换 X.509 SVID 证书和秘钥。Istio 可以通过 SPIRE 动态的消费工作负载标识，SPIRE 可以动态的提供工作负载标识。

下面我将为你简单介绍一下与 SPIFFE 相关的一些术语。

- **SPIFFE**（Secure Production Identity Framework For Everyone）是一套身份认证标准。
- **SPIRE**（SPIFFE Runtime Environment）是 SPIFFE 标准的一套生产就绪实现。
- **SVID**（SPIFFE Verifiable Identity Document）是工作负载向资源或调用者证明其身份的文件。SVID 包含一个 SPIFFE ID，代表了服务的身份。它将 SPIFFE ID 编码在一个可加密验证的文件中，目前支持两种格式：X.509 证书或 JWT 令牌。
- **SPIFFE ID** 是一个统一资源标识符（URI），其格式如下：`spiffe://trust_domain/workload_identifier`。

SPIRE 包含 Server 和 Agent 两个部分，它们的作用如下。

**SPIRE Server**

- 身份映射
- 节点认证
- SVID 颁发

**SPIRE Agent**

- 工作负载认证
- 提供工作负载 API

## SPIFFE 与零信任安全

零信任的本质是以身份为中心的动态访问控制。动态证书轮换、动态证书下发、动态权限控制。SPIFFE 解决的是标识工作负载的问题。

在虚拟机时代我们可能根据一个 IP 地址和端口来标识一个工作负载，基于 IP 地址标识存在多个服务共享一个 IP 地址，IP 地址伪造和访问控制列表过大等问题。到了 Kubernetes 时代，容器的生命周期是短暂的，我们无法再用 IP 地址来标识负载，而是通过 pod 或 service 名称。但是，不同的云、软件平台对工作负载标识的方法不同，相互之间存在兼容性问题。尤其是在异构混合云的中，同时存在虚拟机和容器的工作负载。这时，建立一个细粒度、具有互操作性的标识系统，将具有重要意义。

## 在 Istio 中使用 SPIRE 做身份认证

Istio 会利用 SPIRE 为每个工作负载提供一个唯一标识，服务网格中的工作负载在进行对等身份认证、请求身份认证和授权策略都会使用到服务标识，用于验证访问是否被允许。SPIRE 原生支持 Envoy SDS API，SPIRE Agent 中的通过与工作负载中共享的 UNIX Domain Socket 通信，为工作负载颁发 SVID。请参考 [Istio 文档](https://istio.io/latest/docs/ops/integrations/spire)了解如何在 Istio 中使用 SPIRE 做身份认证。

SDS 最重要的好处就是简化了证书管理。如果没有这个特性，在 Kubernetes deployment 中，证书就必须以 secret 的方式被创建，然后挂载进代理容器。如果证书过期了，就需要更新 secret 且代理容器需要被重新部署。如果使用 SDS，Istio 可以使用 SDS 服务器会将证书推送给所有的 Envoy 实例。如果证书过期了，服务器仅需要将新证书推送至 Envoy 实例，Envoy 将会立即使用新证书且不需要重新部署代理容器。

下图展示了 Istio 中使用 SPIRE 进行身份认证的架构。

![Istio 中使用 SPIRE 进行身份认证的架构图](spire-with-kubernetes.svg)

在 Kubernetes 集群中的 `spire` 命名空间中使用 StatefulSet 部署 SPIRE Server 和 Kubernetes Workload Registrar，使用 DaemonSet 资源为每个节点部署一个 SPIRE Agent。假设你在安装 Kubernetes 时使用的是默认的 DNS 名称 `cluster.local`，[Kubernetes Workload Registar](https://github.com/spiffe/spire/blob/main/support/k8s/k8s-workload-registrar/README.md) 会为 Istio Mesh 中的工作负载创建如下格式的身份：

- SPRRE Server:`spiffe://cluster.local/ns/spire/sa/server`
- SPIRE Agent:`spiffe://cluster.local/ns/spire/sa/spire-agent`
- Kubernetes Node:`spiffe://cluster.local/k8s-workload-registrar/demo-cluster/node/`
- Kubernetes Worload Pod:`spiffe://cluster.local/{namespace}/spire/sa/{service_acount}`

这样不论是节点还是每个工作负载都有它们全局唯一的身份，而且还可以根据集群（信任域）扩展。

Istio 中的工作负载身份验证过程如下图所示。

{{<figure title="Istio 服务网格中的工作负载身份认证过程示意图" alt="Istio 服务网格中的工作负载身份认证过程示意图" src="workload-attestation.svg" width="50%">}}

详细过程如下：

1. 工作负载的 sidecar 中的 `pilot-agent` 会通过共享的 UDS 调用 SPIRE Agent 来获取 SVID
2. SPIRE Agent 询问 Kubernetes（准确的说是节点上的 kubelet）获取负载的信息
3. Kubelet 将从 API server 查询到的信息返回给工作负载验证器
4. 验证器将 kubelet 返回的结果与 sidecar 共享的身份信息比对，如果相同，则将正确的 SVID 缓存返回给工作负载，如果不同，则身份认证失败

关于工作负载的注册和认证的详细过程请参考 [SPIRE 文档](https://lib.jimmysong.io/kubernetes-handbook/concepts/spire/)。

## 总结

身份是零信任网络的基础，SPIFFE 统一了异构环境下的身份标准。在 Istio 中不论我们是否使用 SPIRE，身份验证对于工作负载来说是不会有任何感知的。通过 SPIRE 来为工作负载提供身份验证，可以有效的管理工作负载的身份，为实现零信任网络打好基础。
