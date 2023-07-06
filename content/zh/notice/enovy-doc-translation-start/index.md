---
title: "Envoy 最新官方文档翻译工作启动"
date: 2018-05-16T14:47:19+08:00
description: "SerivceMesher 社区共同参与翻译 Envoy 最新版本的官方文档。"
draft: false
type: "notice"
link: "https://github.com/servicemesher/envoy/"
aliases: "/posts/servicemesher-community"
---

[Envoy](https://envoyproxy.io) 是一款由 Lyft 开源的，使用 C++ 编写的 L7 代理和通信总线，目前是 [CNCF](https://cncf.io) 旗下的开源项目，代码托管在 GitHub 上，它也是 [Istio](https://istio.io) service mesh 中默认的 data plane。我们发现它有很好的性能，同时也不断有基于 Envoy 的开源项目出现，如 [Ambassador](https://github.com/envoy/Ambassador)、[Gloo](https://github.com/solo-io/gloo) 等，而目前 Envoy 的官方文档还没有得到很好的汉化，因此我们 Service Mesh 爱好者们觉得发动社区的力量共同翻译 Enovy 最新的（1.7 版本）的官方文档，并通过 GitHub 组织。

Service Mesh 爱好者们联合翻译了 [Envoy 最新版本的官方文档](https://www.envoyproxy.io/docs/envoy/latest/)，翻译的代码托管在 <https://github.com/servicemesher/envoy>，如果你也是 Service Mesh 爱好者可以加入到 [SerivceMesher GitHub 组织](https://github.com/servicemesher)里共同参与。

Envoy 官方文档排除 v1 API 参考 和 v2 API 参考的两个目录下的所有文章后一共有 120 余篇文档，文档的长短不一，原英文的官方文档都是使用 RST 格式，我手动将它们转成了 Markdown 格式，并使用 Gitbook 编译。按照文档相对于主目录的路径生成了 GitHub Issue，想参与翻译的朋友可以[联系我](https://jimmysong.io/about)加入 ServiceMesher 组织，然后可以在 [Issue](https://github.com/servicemesher/envoy/issues) 中选择你想要翻译的文章，然后回复“认领”。

[在这里](https://github.com/servicemesher/envoy/graphs/contributors)可以看到所有的贡献者。未来我们也会创建 Service Mesh 爱好者网站，网站使用静态页面，所有的代码都会托管在 Github 上，欢迎大家参与进来。