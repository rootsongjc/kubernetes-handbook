---
title: "个人网站中的静态文件云存储选择"
subtitle: "七牛云 VS Cloudinary"
date: 2017-10-17T22:33:34+08:00
draft: false
tags: ["website","storage","cloudinary"]
bigimg: [{src: "https://ws3.sinaimg.cn/large/006tNc79ly1fzpl8tq8cij31ba0peb2a.jpg", desc: "Photo via unsplash"}]
description: "网站中的静态文件云储存免费方案选择cloudinary与七牛云对比，推荐微博图床。"
---

我推荐将静态文件跟网站的代码、主题、主体文件分开存储，这样的好处是：

- 可以使用CDN加快静态文件的访问速度
- 单独管理静态文件，方便重复应用
- 可以使用其他工具对静态文件的使用和流量进行控制

本文已归档到[hugo-handbook](https://jimmysong.io/hugo-handbook)。

## 云存储

我推荐使用如下两种云存储：

- 七牛云：[https://www.qiniu.com](https://www.qiniu.com/)
- Cloudinary: [https://www.cloudinary.com](https://www.cloudinary.com/)

我将分别介绍两种云储存服务，及其各自的优缺点。

### 七牛云存储

[七牛云](https://www.qiniu.com/)是中国知名的云存储公司，提供对象存储、CDN和PaaS平台等企业级服务。

七牛云存储提供了免费CDN配额：存储空间10GB，每月下载流量10GB，每月PUT/DELETE 10万次请求，每月GET 100万次请求。月流量在10GB以下的网站基本上可以一直免费使用七牛云存储CDN服务。

![七牛云对象存储页面](https://jimmysong.io/hugo-handbook/images/qiniu-storage-bucket.jpg)图片 - 七牛云对象存储页面

七牛云可以通过API也可以直接通过Web上传文件和对文件进行简单的管理。

![七牛云存储文件管理页面](https://jimmysong.io/hugo-handbook/images/qiniu-storage-content-management.jpg)图片 - 七牛云存储文件管理页面

### Cloudinary

Cloudinary的免费套餐如下：

- **20,000 + 7,500 Extra** Monthly Transformations
- **300,000 + 300,000 Extra** Total Images
- **10 GB + 3 GB Extra** Managed Storage
- **20 GB + 6 GB Extra** Monthly Viewing Bandwidth

Extra的资源是通过facebook和Twitter给他们分享后获得的，这些免费资源基本可以满足一个普通博客的需求。

下图是媒体库，可以选择`图片`、`音视频`、`文件`、`中断队列`来对整个媒体库的内容进行分类。

![Cloudniary媒体库](https://jimmysong.io/hugo-handbook/images/cloudinary-media-library.jpg)图片 - Cloudniary媒体库

点击单张图片进入详情页面，可以分别对每张图片进行操作，例如裁剪、增加水印、缩略图等。

![图片详情页面](https://jimmysong.io/hugo-handbook/images/cloudinary-media-library-image-detail.jpg)图片 - 图片详情页面

## 对比

下面将从以下几个方面对两种云存储进行对比，供大家参考。

| 云储存     | 七牛云                                      | Cloudinary                               |
| ------- | ---------------------------------------- | ---------------------------------------- |
| 易用性     | 适应国内用户的操作习惯，提供命令行工具和众多的开源工具支持            | 纯英文界面，web操作不够友好，页面在国内访问比较慢，但是提供了多种语言的API支持，很多国外的博客管理软件默认使用的云存储，支持文件访问次数和访问来源等多种统计功能 |
| 免费额度    | 10G存储，每月10G流量                            | 13G存储、月26G流量、30万张图片、月27,500张图片转换         |
| https支持 | 需要自行设置证书，默认不支持，https流量需要单独计费，不提供免费https流量 | 默认支持https，不区分https和http流量                |
| 访问速度    | 国内用户访问速度极快                               | 访问速度很快，完全满足要求                            |
| 文件操作    | 没有文件的历史版本信息                              | 保留文件的历史版本，提供免费的图片转换额度                    |

因为cloudinary保存的文件默认支持https并且月流量为26G，远远大于七牛云，并且提供很很友好的图片引用和调用统计功能，因此我将原来在七牛云中的存储的文件迁移到了cloudinary中。

## 微博图床

另外除了以上两款工具可以作为图床之外，我还推荐新浪微博图床，该图床免费，没有存储大小限制，甚至不需要登陆微博账号。可以上传原图（所有图片会被转换成JPG格式）、GIF动图。

下面给大家推荐几款支持新浪微博图床的软件。

**iPic**⭑⭑⭑⭑⭑

Mac用户可以直接到App Store中搜索**iPic**就可以免费下载和使用了，与Typora结合使用更佳。安装了iPic后可以在typora中直接上传Markdown中引用的本地图片的新浪微博图床。

**PicGo**⭑⭑⭑⭑

[下载PicGo](https://github.com/Molunerfinn/PicGo/releases)。PicGo是一款开源的微博图床工具，使用起来十分简便。可以通过设置微博的用户名密码方式登录，也可以通过设置 Cookie 来登录。

如果选择使用 Cookie 来认证，需要打开 <https://weibo.com/minipublish> 页面，在 Chrome 中打开调试模式，然后选择【网络】标签页，刷新页面，看到有对 minipublish 的请求，在 Headers 里找到 Cookie，复制它的值填写到 PicGo 的微博设置中即可。

因为需要设置Cookie而且Cookie每隔一段时间就会过期，需要重新设置，所以PicGo用起来比较麻烦。

**Chrome 插件**⭑⭑⭑

在 Chrome store 中搜索 “微博图床” 就可以安装了，在 Chrome 浏览器中登陆新浪微博后就可以使用该插件上传图片了。