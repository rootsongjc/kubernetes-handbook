---
title: "Tetrate 公司开源项目介绍"
description: "本文介绍了企业级服务网格公司 Tetrate 的几个围绕服务网格领域的开源项目。"
date: 2022-04-25T17:16:50+08:00
draft: false
tags: ["tetrate"]
categories: ["开源"]
type: "post"
bg_image: "images/backgrounds/page-title.webp"
image: "images/banner/open.jpg"
---

[Tetrate](https://tetrate.io) 是企业级服务网格领域的主要玩家之一，是 Istio、Envoy 和 SkyWalking 开源项目的发起者或主要参与者。本文将向你介绍 Tetrate 发起的几个开源项目：

- [Tetrate Istio Distro/GetMesh](https://github.com/tetratelabs/getmesh)：Tetrate Istio 发行版
- [wazero](https://github.com/tetratelabs/wazero)：使用 Go 语言编写的无需平依赖性的 WebAssembly 运行时
- [func-e](https://github.com/tetratelabs/func-e)：Envoy 构建命令行
- [istio-security-analyzer](https://github.com/tetratelabs/istio-security-analyzer)：Istio 安全扫描工具

## Tetrate Istio Distro/GetMesh

Tetrate Istio 发行版，又名 GetMesh，为 Kubernetes 或应用平台安装和管理经过审核的 Istio。

- 最简单的安装、操作和升级 Istio 的方法
- 为您的应用和云平台进行测试和加固
- 用户、生态系统和合作伙伴的社区中心

GetMesh 是一个命令行工具，你可以用它来：

- 强制获取 Istio 的认证版本，并只允许安装 Istio 的兼容版本
- 允许在多个 `istioctl` 版本之间无缝切换
- 符合 FIPS 标准
- 通过整合多个来源的验证库，提供基于平台的 Istio 配置验证
- 使用一些云提供商证书管理系统来创建 Istio CA 证书，用于签署服务网格管理工作负载
- 提供附加的与云提供商多个集成点

使用下面的命令就可以安装 GetMesh：

```bash
curl -sL https://istio.tetratelabs.io/getmesh/install.sh | bash
```

注意：如果你位于中国大陆，执行上面的命令需要翻墙。

想要了解更多关于 Tetrate Istio Distro/GetMesh 的信息请访问 <https://istio.tetratelabs.io>

## wazero

wazero 是一个用 Go 语言编写的符合 [WebAssembly 1.0（20191205）](https://www.w3.org/TR/2019/REC-wasm-core-1-20191205/)规范的运行时。

WebAssembly 是一种安全运行用其他语言编译的代码的方法。运行时
执行 WebAssembly 模块（Wasm），它通常是以 `.wasm` 为扩展名的二进制文件。

wazero 仅依赖 Go 语言而无依赖，且不依赖 CGO。你可以运行其他语言的应用程序，但仍然保持交叉编译。也就是说它可以嵌入到应用程序中，而不依赖特定的操作系统。这是 wazero 与其他 WebAssembly 运行时的主要区别。wazero 还可以在 Docker 的 [scratch 镜像](https://docs.docker.com/develop/develop-images/baseimages/#create-a-simple-parent-image-using-scratch)中运行。 

想要了解更多关于 wazero 的信息请访问：<https://github.com/tetratelabs/wazero>

## func-e

func-e 是一个用来安装和运行 Envoy 代理的命令行工具。func-e（发音为funky）允许你快速查看 Envoy 的可用版本并进行试用。这使得你很容易验证在生产中使用的配置。每次你结束运行时，都会以你的名义获取运行时状态的快照。这使得知识共享和故障排除更加容易，特别是在升级时。

想要了解更多关于 func-e 的信息请访问：<https://github.com/tetratelabs/func-e>

## Istio Security Analyzer

Istio Security Analyzer 是一个用于 Istio 安全性分析的命令行工具。该工具可以：

- 确保配置遵守 Istio 安全最佳实践。
- 检查正在运行的 Istio 版本，看是否有任何已知的 CVE 问题。

想要了解更多关于 Istio Security Analyzer 的信息请访问：<https://github.com/tetratelabs/istio-security-analyzer>

更多 Tetrate 开源的项目请访问：<https://github.com/tetratelabs>
