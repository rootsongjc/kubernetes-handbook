---
title: "开源项目千千万，如何发现好项目？"
draft: false
date: 2022-06-02T10:27:49+08:00
description: "推荐一个 PingCAP 推出的 OSSInsight.io 网站，可以根据 GitHub 上的事件，提供开源软件洞察，这个项目本身也开源在 GitHub 上。"
categories: ["其他"]
tags: ["开源","GitHub"]
type: "post"
image: "/images/banner/oss-insight.jpg"
---

不知道大家听说没有 PingCAP 推出的一个 OSSInsight.io 网站，可以根据 GitHub 上的事件，提供开源软件洞察，这个项目也开源在 [GitHub](https://github.com/pingcap/ossinsight) 上。它可以提供以下方面的洞察能力，有点类似于 Google Analytics、Trends：

- 比较 GitHub 仓库历史 Star 趋势图
- 开发者地理位置分布
- 开发者贡献时间热力图
- 编码活力，如每月 PR 数量、代码行数变化
- 分类趋势排名

## 网站截图

以下图片来自 [OSSInsight 博客](https://ossinsight.io/blog/explore-deep-in-4.6-billion-github-events/)，展示了该网站的一些功能。

![Kubernetes 和 Moby 的标记 star 的人员地理分布](https://tva1.sinaimg.cn/large/e6c9d24ely1h2trup1v5bj20k00c5my9.jpg)

![K8s（上）和 Moby（下）的月度推送和提交](https://tva1.sinaimg.cn/large/e6c9d24ely1h2trw4iqpyj20wn0gvgnp.jpg)

![分类排名](https://tva1.sinaimg.cn/large/e6c9d24ely1h2ts5cig5kj21mw0u00xv.jpg)

你可以在首页输入一个 GitHub 仓库，查看该仓库的一些洞察信息。我查看了我的 [`rootsongjc/kubernetes-handbook`](https://github.com/rootsongjc/kubernetes-handbook/) 之后，发现它还以获得关注者的公司信息，如下图。

![rootsongjc/kubernetes-handbook 关注者的公司分布](https://tva1.sinaimg.cn/large/e6c9d24ely1h2trz8bpqfj21di0u0gq4.jpg)

这个网站有点类似于 CNCF 推出的 [DevStats](https://devstats.cncf.io/)，不过 DevStats 只能洞察 CNCF 托管的项目。

![DevStats 页面](https://tva1.sinaimg.cn/large/e6c9d24ely1h2ts2o2rirj21mw0u00zv.jpg)

## 评论

OSSInsight 也可以算是 CHAOSS 类软件的一种，比如 Linux 基金会下的 CHAOSS （Community Health Analytics Open Source Software）工作组有一个开源项目 [GrimoireLab](https://chaoss.github.io/grimoirelab/) 就是做软件开发分析的。

![GrimoireLab 网站页面](https://tva1.sinaimg.cn/large/e6c9d24ely1h2ts7e6aiuj21ml0u078o.jpg)

如果你关注开源和技术趋势的话，网上还有一些类似的 GitHub 趋势网站，大家可以根据自己的需要选用。
