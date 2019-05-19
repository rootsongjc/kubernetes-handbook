---
title: "使用Cloudflare为Github Pages博客开启https支持"
date: 2017-09-03T21:08:18+08:00
draft: false
categories: github
tags: ["github-pages"]
---

实在受不了无耻的运营商劫持，如下图：

![运营商劫持](https://res.cloudinary.com/jimmysong/image/upload/images/operator-dns-hijacking-ad.jpg)

总是在我的网站页面上植入广告，尤其是在微信中打开我的网站链接然后选择在浏览器中打开的时候，最近总是植入广告，迫不得已我要开启https。

因为是用的是 Github Page，启用了自定义域名就无法再在Github中配置开启https，只能自己另想办法。

参考这篇文章 ➡️ [开启 Github Pages 自定义域名 HTTPS 和 HTTP/2 支持](https://zhuanlan.zhihu.com/p/22667528) 👏👏

## 步骤说明

这一切都是免费的，只需要以下几个步骤：

- 在 [cloudflare](https://www.cloudflare.com/) 注册，经过一系列对你的网站自动检测后，获得新的 nameserver 地址；
- 和我的域名注册机构 [namecheap](https://www.namecheap.com) 配置一下，修改 nameservers 记录为刚才在 cloudflare 上获得的 nameserver 地址；
- 在 Cloudflare 上配置 Page Rules：加入一条规则 ` http://jimmysong.io/*` 设置为 `Always Use HTTPS`
- 修改网站代码中的 css 和 js 文件地址为 https；
- 等几分钟访问网站 http://jimmysong.io 后就会跳转为 https://jimmysong.io 。

## 遗留问题

该过程中主要遇到下面两个问题：

- 需要在网站代码中名为指定 css 和 js 文件的路径要包含域名，使用相对路径的话仍然会以 http 的形式加载，将导致网站无法加载样式；
- 第一次使用 https://jimmysong.io 访问的时候可能会提示证书问题，一旦选择信任后在后续访问的过程中就不会再提示。
- 因为图片保存在七牛云中，没有使用证书，访问包括图片的网址后会自动变回 http，考虑今后将图片直接放到 GitHub 中存储。

暂且这样，以后再继续优化！⛽️

