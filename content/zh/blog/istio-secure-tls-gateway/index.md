---
title: "如何为 Istio 中的网关配置 TLS 证书？"
description: "本文是为 Bookinfo 应用配置实际域名 TLS 证书的实战。"
date: 2022-12-14T11:09:40+08:00
draft: true
tags: ["Istio","安全","证书"]
categories: ["Istio"]
type: "post"
image: "images/banner/cert.jpg"
---

Istio 中的 Bookinfo 示例相关的任务中，没有给它的入口网关设置 TLS 相关的任务，而在生产中这又是一个很强的需求，因此，笔者特地撰写这篇博客来在实际环境中演示，如何为 Bookinfo 网关配置 TLS。

## 步骤

为 Istio 中的网关配置 TLS 证书需要以下步骤：

1. 准备 TLS 证书和私钥，并将它们放在 Kubernetes Secret 中。
2. 在 Istio Gateway 中定义一个 TLS 访问策略，使用上一步中创建的 Kubernetes Secret。
3. 在 Istio Gateway 中定义一个路由规则，使用刚才定义的 TLS 访问策略。
4. 部署 Istio Gateway 到 Kubernetes 集群。

这些步骤的具体实现方法可能会因为 Istio 的版本和部署方式而有所差异，建议您参考 Istio 的官方文档来获取更多信息。

## 参考 {#reference}

- [安全网关 - istio.io](https://istio.io/latest/zh/docs/tasks/traffic-management/ingress/secure-ingress/)
- [如何设置 SSL 证书 - istio.tetratelabs.io](https://istio.tetratelabs.io/zh/istio-in-practice/setting-up-ssl-certs/)
