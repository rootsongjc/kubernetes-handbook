---
title: "喜迎国庆节jimmysong.io博客盛装改版"
date: 2017-10-02T09:18:27+08:00
draft: false
categories: github
tags: ["github-pages"]
---

经过昨天一天的努力，我的博客(https://jimmysong.io) 成功改版，度过一个十分有意义的国庆节。🎈💐👏

## 更新与优化

1. 替换了原来的 [nixon](https://themes.gohugo.io/nixon/) 主题，使用新的 [Beautiful Hugo](https://themes.gohugo.io/beautifulhugo/) 主题
2. 增加 **categories**，为之前写的所有文章分门别类，并在主页上使用下拉菜单导航
3. 设计了网站的主页，明确网站的 topic 为 **Building Cloud Native Confidence**
4. 使用了 menu 导航，快速进入相关文章列表，暂时规划为如下几个类别：
   - Kubernetes：所有与 kubernetes 相关的文章
   - Cloud Native：非 kubernetes 技术本身的与云原生相关的内容，如 service mesh
   - Container：容器生态、工具和开发
   - Github：开源项目、GitHub Pages、本博客相关的内容
   - DevOps：CI、CD、流程自动化
   - Code：程序设计、代码、编程语言相关
   - Architecture：软件架构
5. 在导航栏中增加 **Books** 和 **Projects** 内容，为我的书籍和开源项目导航
6. 优化了文章的标签，并提供标签导航页面
7. 使用 CDN，优化了网站的加载速度
8. 删除原有的划分不合理的 `blogs`、`talks`、`projetcs` 路径，所有文章都从 `posts` 路径直接访问
9. 页面上终于可以看到我的 logo 了，Jimminetes、Kubesong 😂

## 仍需完善

虽然做出了这么多更新和优化，但是仍然还有一些需要完善的地方：

1. 移动设备页面适配问题，手机中打开有些长代码页面会需要缩放
2. 默认的 highlight 代码高亮不够美观，无法滚动代码，考虑替换代码高亮插件
3. 评论框一直是个问题，现在使用的 `Gitment` 当文章的 URL 改变后需要重新 initial