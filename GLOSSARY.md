# 术语表

## CRD

CRD，全称 Custom Resource Definition（自定义资源定义）是默认的 Kubernetes API 扩展。

## eBPF

eBPF 是**扩展的柏克莱封包过滤器**（extented Berkeley Packet Filter）的缩写，它是类 Unix 系统上数据链路层的一种原始接口，提供原始链路层封包的收发，除此之外，如果网卡驱动支持洪泛模式，那么它可以让网卡处于此种模式，这样可以收到网络上的所有包，不管他们的目的地是不是所在主机。

## Mutual TLS Authentication

双向 TLS 通过内置身份和凭证管理，提供强大的服务到服务身份验证。 了解更多关于双向 TLS 身份验证。

## OpenAPI

OpenAPI 一般指的是 OpenAPI 规范（OAS），它为 HTTP API 定义了一个标准的、与编程语言无关的接口描述，允许人类和计算机发现和理解一个服务的能力，而不需要访问源代码、额外的文档或检查网络流量。

## OpenTracing

OpenTracing 是一个分布式追踪标准规范，它定义了一套通用的数据上报接口，提供平台无关、厂商无关的 API，要求各个分布式追踪系统都来实现这套接口，使得开发人员能够方便的添加（或更换）追踪系统的实现。

## Operator

Operator 是打包、部署和管理 Kubernetes 应用程序的一种方法。

## SNI

SNI 全称 Server Name Indication（服务器名称指示），是 TLS 的扩展，用来解决一个服务器拥有多个域名的情况。

## Sidecar

Sidecar，全称 Sidecar proxy，为在应用程序旁运行的单独的进程，它可以为应用程序添加许多功能，而无需在应用程序中添加额外的第三方组件，或修改应用程序的代码或配置。

## SPIFFE

SPIFFE，即每个人的安全生产身份框架（Secure Production Identity Framework for Everyone），是一套开源标准，用于在动态和异构环境中安全地进行身份识别。采用 SPIFFE 的系统无论在哪里运行，都可以轻松可靠地相互认证。

## SPIRE

SPIRE 是 SPIFFE API 的一个生产就绪的实现，用于执行节点和工作负载认证，以便根据一组预先定义的条件，安全地向工作负载发出 SVID，并验证其他工作负载的 SVID。

## SPIFFE ID

SPIFFE ID 是一个统一资源标识符（URI），其格式如下：`spiffe://信任域/工作负载标识符`，用来唯一地、具体地标识一个工作负载。

## SVID

SVID（SPIFFE Verifiable Identity Document） 是工作负载向资源或调用者证明其身份的**文件**。SVID 包含一个 SPIFFE ID，代表了服务的身份。它将 SPIFFE ID 编码在一个可加密验证的文件中。