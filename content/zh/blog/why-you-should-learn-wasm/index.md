---
title: "为什么要学习 WebAssembly？"
description: "2023 年我决定学习一门新技术——WebAssembly。"
date: 2023-01-13T12:09:40+08:00
draft: false
tags: ["wasm"]
categories: ["Wasm"]
type: "post"
image: "images/banner/wasm.jpg"
---

2023 年你有什么学习计划？我计划要学习一门新技术——WebAssembly！

## 为什么要学习 WebAssembly？{#why}

2019 年，Docker 创始人 Solomon Hykes 发布了一条推特在业界引起了轩然大波（见下面的推文），他说如果 2008 年 WebAssembly 和 WASI 就存在的话，他就没必要创建 Docker。一时间，关于 WebAssembly 取代 Docker 的讨论此起彼伏。也是从那时起，WebAssembly 正式进入我的视线。

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">If WASM+WASI existed in 2008, we wouldn&#39;t have needed to created Docker. That&#39;s how important it is. Webassembly on the server is the future of computing. A standardized system interface was the missing link. Let&#39;s hope WASI is up to the task! <a href="https://t.co/wnXQg4kwa4">https://t.co/wnXQg4kwa4</a></p>&mdash; Solomon Hykes / @shykes@hachyderm.io (@solomonstre) <a href="https://twitter.com/solomonstre/status/1111004913222324225?ref_src=twsrc%5Etfw">March 27, 2019</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

到了 2021 年，网上突然多了很多关于 WebAssembly 的炒作文章，包括我长期关注的 Istio 也在当年发布的 1.12 版本开始支持 WebAssembly（见 [Istio 1.12 引入 Wasm 插件配置 API 用于扩展 Istio 生态](https://cloudnative.to/blog/istio-wasm-extensions-and-ecosystem/)），通过引入 [WasmPlugin](https://istio.io/latest/docs/reference/config/proxy_extensions/wasm-plugin/) API，使开发人员更方便扩展服务网格和网关。

最近我看到一篇介绍 WebAssembly 在 2023 年有哪些新趋势的[文章](https://cloudnative.to/blog/webassembly-5-predictions-for-2023/)，文章的作者 Matt Butcher 颇有来头，他是 WebAssembly Cloud 公司 Fermyon 的联合创始人和 CEO，也是 Helm、Brigade、CNAB、OAM、Glide 和 Krustlet 的原始创建者之一。通过他的介绍让我笃定，WebAssembly 是一门颇有前景的技术，是时候学习它了。

## WebAssembly 的市场前景 {#prospect}

更何况 WebAssembly 的应用领域越来越广，像 [WasmEdge](https://wasmedge.org/) 这样的公司正在使用 Tensorflow 来突破可以使用 Wasm 运行的边界。[Fermyon](https://www.fermyon.com/) 正在构建用于微服务的 WebAssembly 工具，而 [Vercel](https://vercel.com/docs/concepts/functions/edge-functions/wasm)、[Fastly](https://docs.fastly.com/products/compute-at-edge)、[Shopify](https://shopify.engineering/shopify-webassembly) 和 [Cloudflare](https://developers.cloudflare.com/workers/platform/languages/) 使用 WebAssembly 在边缘运行代码。[Figma](https://www.figma.com/blog/webassembly-cut-figmas-load-time-by-3x/)（2022 年以 200 亿美元被 Adobe 公司收购）正在使用 WebAssembly 为其应用程序在浏览器中提供更高的性能，而他们的新母公司 [Adobe](https://web.dev/ps-on-the-web/) 正在使用 WebAssembly 将他们的桌面应用程序带到 Web。

## 如何学习 WebAssembly？{#how-to-learn-wasm}

为了学习 WebAssembly，我制定了以下学习目标：

1. 了解 WebAssembly 的基本概念，包括它是什么、为什么要使用它、如何在浏览器中运行它；

2. 学习 WebAssembly 的语言，这是一种类似于汇编语言的低级语言，可以编译成二进制文件；

3. 使用工具将代码编译成 WebAssembly 格式；

4. 在 JavaScript 中调用 WebAssembly 模块；

5. 学习 WebAssembly 的其他特性，如内存管理、多线程和 WebAssembly System Interface（WASI）；

6. 了解 WebAssembly 如何增强安全防护；

7. 学习 WebAssembly 的最佳实践，如代码优化和调试；

8. 在 Istio 中开发 WebAssembly 插件；

9. 学习使用 WebAssembly 开发的开源项目；

## WebAssembly 参考资料 {#materials}

下面列出了一些有助于学习 WebAssembly 的参考资料，包括网站和图书：

- [WebAssembly 官网](https://webassembly.org/)
- [WebAssembly 教程](https://developer.mozilla.org/zh-CN/docs/WebAssembly)
- [WebAssembly 在线编译器](https://wasdk.github.io/WasmFiddle/)
- [WebAssembly 学习资源](https://webassembly.org/getting-started/developers-guide/)
- [《WebAssembly：权威指南：安全、快速和可移植的代码，第 1 版，2022 年 1 月》](https://www.amazon.com/WebAssembly-Definitive-Guide-Safe-Portable/dp/1492089842/)
- [wazero: the zero dependency WebAssembly runtime for Go developers](https://wazero.io/)

## 总结 {#summary}

WebAssembly 不仅是用于浏览器端有效弥补 JavaScript 缺陷的一门技术，凭借它的小巧、高效和可移植性在后端也会有很广泛的应用。2023 年，让我们一起来学习 WebAssembly 吧！我也会适时得在云原生社区中创建 Wasm 学习小组，欢迎大家[加入云原生社区](https://cloudnative.to/community/join/)共同交流学习。

## 参考 {#summary}

- [Istio 1.12 引入 Wasm 插件配置 API 用于扩展 Istio 生态 - cloudnative.to](https://cloudnative.to/blog/istio-wasm-extensions-and-ecosystem/)
- [在 Istio 中引入 Wasm 意味着什么？- cloudnative.to](https://cloudnative.to/blog/importance-of-wasm-in-istio/)
- [2023 年 WebAssembly 技术五大趋势预测 - cloudnative.to](https://cloudnative.to/blog/webassembly-5-predictions-for-2023/)
