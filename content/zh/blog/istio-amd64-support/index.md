---
title: "Istio 1.15 新增对 amd64 架构的支持"
draft: false
date: 2022-08-31T21:47:49+08:00
description: "随着 Istio 1.15 的发布，你可以很方便得在 arm64 架构上部署 Istio。"
categories: ["Istio"]
tags: ["Istio","arm"]
type: "post"
image: "images/banner/arm.jpg"
---

Istio 是基于容器的云原生技术栈的三大核心技术之一，另外两个是 Kubernetes 和 Knative。其中 Kubernetes 和 Knative 早已支持了 arm64 架构，甚至连 Istio 的数据平面 Envoy 早在 [1.16 版本](https://www.envoyproxy.io/docs/envoy/v1.16.0/install/building#arm-binaries)就已支持 arm64 架构（2020 年 10 月）。随着 [Istio 1.15 的发布](https://istio.io/latest/news/releases/1.15.x/announcing-1.15/)，你可以开箱即用得在 arm64 架构上部署 Istio，不需要自己来编译 arm 架构的镜像。

## 在 Istio 1.15 之前如何在 arm 架构上安装 Istio？

Istio 默认使用 Docker Hub 作为生产镜像仓库，Google Container Registry 作为生产和测试仓库。对于 1.14 及以前的版本，Istio 官方的镜像仓库中只有 amd64 架构的镜像，如果你的 Kubernetes 集群是运行在 arm 架构下，在安装 Istio 时会出现出现如下错误：

```
exec user process caused: exec format error
```

这时你需要为 Istio 安装重新指定一个包含 arm64 架构镜像的仓库，在安装 Istio 时执行下面的命令指定该镜像仓库：

```bash
$ istioctl install --set profile=demo --set hub=docker.io/mydockerhub -y
```

此时要想在 arm64 架构上使用 Istio，你可以使用 Istio 社区中有人为 Istio 单独构建了 arm64 架构的[镜像](https://github.com/resf/istio)，或者自己构建镜像。

## Istio 为了支持 arm 做了哪些工作？

为了让 Istio 支持 arm，需要将以下二进制文件或者镜像基于 arm 架构编译：

- `istioctl`：这是最简单的部分，只需要使用 Go 语言的交叉编译即可，Istio 的早期版本就已经支持；
- `pilot`：控制平面 Istiod 中运行的镜像；
- `proxyv2`：在 Ingress Gateway、Egress Gateway 和 Sidecar 中使用的镜像，通过 Kubernetes [mutating webhook](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/#mutatingadmissionwebhook) 自动注入；

Istio 数据平面中的 Envoy 是从 Envoy 官方仓库中 fork 出来的，但是 Envoy 早就支持了 arm64，为什么 Istio 官方还不支持呢？这是因为一方面 Istio 的官方 CI 环境 [prow.istio.io](https://prow.istio.io/) 运行在 GKE 上的，而 GKE 上并没有 arm64 架构的环境，所以无法执行测试。直到 2022 年 7 月 GKE 才正式提供 arm64 架构的虚拟机，那时才可以方便的编译和测试 arm64 架构的 Istio，详见 [Run your Arm workloads on Google Kubernetes Engine with Tau T2A VMs](https://cloud.google.com/blog/products/containers-kubernetes/gke-supports-new-arm-based-tau-t2a-vms)。

{{<callout note 注意>}}

Istio 官方仅提供了 amd64 和 arm64 架构的镜像，不支持 arm32。

{{</callout>}}

至于 arm 架构的镜像构建，可以使用 Docker BuildKit 来实现多平台构建，你可以使用下面的命令编译指定 arm 平台架构的镜像：

```bash
docker buildx build --platform linux/arm64
```

关于 `docker buildx` 的详细信息请参考 [Docker 文档](https://docs.docker.com/build/buildx/multiplatform-images/)。

你可以像往常一样来安装 Istio，Kubernetes Node 会根据节点的架构自动拉起对应平台架构的镜像。
