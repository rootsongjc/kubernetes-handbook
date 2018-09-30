---
title: "jimmysong.io网站更新日志"
subtitle: "2018年国庆节重装改版"
date: 2017-10-04T11:18:27+08:00
draft: false
categories: github
notoc: true
bigimg: [{src: "https://ws4.sinaimg.cn/large/006tNc79ly1fvrtt1dtz0j31kw0ns7wj.jpg", desc: "Picture ©changenow-summit.com"}]
tags: ["github-pages","github","website","hugo"]
---

### TODO

- [x] 移动设备页面适配问题，手机中打开有些长代码页面会需要缩放
- [ ] 评论框一直是个问题，现在使用的 `Gitment` 当文章的 URL 改变后需要重新 initial
- [x] 每篇文章的标题显示还需要优化，对齐方式问题
- [x] ⚠️文章正文部分的如果在 `li` 中有超长的使用点号连接起来的长“词”将无法实现分词，将导致移动设备上显示有问题
- [x] 在主页中增加受欢迎文章和最新文章的入口，丰富首页功能
- [x] 增加主页的个性化banner，并添加 description
- [x] 增加搜索框，使用 [algolia](https://www.algolia.com/doc/tutorials/search-ui/instant-search/build-an-instant-search-results-page/instantsearchjs/)
- [x] 根据文章需求确定是否显示评论框
- [x] 搜索框中的URL高亮标签去除
- [x] 搜索框的大小需要调整
- [x] 每个post的`bigimg`显示有问题
- [ ] 如果使用absURL的话所有的链接最后面要加还是那个/才能访问，但是使用relLangURL在config.tom里设置https地址就不会生效，需要能够在导航栏的列表里直接添加https的地址
- [ ] 让TODO列表不显示前面的bullet
- [ ] Table中每列的宽度需要重新调整
- [x] 浏览器宽度变小后logo可能遮挡导航栏
- [ ] 不支持斜体显示的问题
- [ ] 在主页选择分页后不要再显示banner

### 2017-03-17

1. 我的博客 http://rootsongjc.github.io 上线，使用GitHub pages 托管
2. 使用 Steve Francia 提供的 Nixon 主题
3. 图片保存到七牛云存储
4. 使用百度统计

### 2017-08-18

1. 在 [namecheap](https://namecheap.com) 注册独立域名 jimmysong.io

### 2017-09-03

1. 使用 [cloudflare](https://www.cloudflare.com/) 增加 https 支持
2. 不再使用七牛云存储，直接用GitHub存储图片

### 2017-10-01

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
10. 将默认的代码高亮插件 highlight 替换为 [prism](http://prismjs.com/download.html)

### 2017-10-02

1. 修复了移动设备适配问题，仅仅在 `main.css` 中增加了一行代码而已。

### 2017-10-03

1. 修改文章的标题对齐方式为居中对齐
2. 在文章标题下方增加字数统计、阅读时间建议、文章创建时间记录
3. 给网站首页增加多张图片做动态banner
4. 自定义了hello variation为"Hi,I'm Jimmy"，并修改了subtitle
5. 重新规划了导航栏的下拉菜单顺序

### 2017-10-04

1. 修改下拉菜单、超链接、tag等的配色，使用蓝色系

### 2017-10-07

1. ~~不再使用 maxcdn，切换为 [bootcdn](http://www.bootcdn.cn/)|又拍云，加快国内网站速度更快~~，但是用了这个CDN国外用户访问的速度将大大受影响，有的地方网页基本打不开，退而求其次，继续使用maxcdn
2. 主页 banner 图片使用 [Cloudinary](https://cloudinary.com/) 存储
3. 全站https化，将原来在七牛云存储的图片转移到了Cloudinary

### 2017-10-08

1. 增加文章头部metadata中的`nocomment`标记，如果有此标记则不显示评论框
2. 增加搜索框

### 2017-10-09

1. 修复了搜索框中搜索英文内容后增加html标签的问题
2. 修复了搜索框的宽度问题

### 2017-10-10

1. 重新设置了`subtitle`的位置为居中，原先是靠左对齐
2. 修正了 `header.html` 中的bug，`type`应该设置为posts，而不是默认的post
3. 增加 [addthis](https://www.addthis.com/) 社交分享按钮
4. 可以为每个post设置一个图片，方式在在文章头部添加图片地址和描述，可以添加多张轮播

### 2017-10-11

1. 修复了链接和文字的换行问题
2. 可以在文件头中指定是否显示post meta信息，只要加入`postmeta`就不显示
3. 在[about](https://jimmysong.io/about)页面中增加封面图片
4. 首页增加最新文章展示
5. 在配置文件中增加`sharebutton`开关

### 2017-10-12

1. 增加`errorpage`开关，自定义404页面，并增加链接丢失原因说明后给出建议

### 2017-10-13

1. 增加Gitee站点克隆，方便百度抓取站点中的链接，http://jimmysong.gitee.io
2. 取消导航拦链接的`i18n`配置，直接使用`absURL`，并且在`config.toml`中写明URL，不使用相对路径，因为这些链接了的代码不跟该博客在同一个代码库中
3. 将js文件托管到cloudinary，不使用cloudflare和maxcdn，它们的速度太慢
4. 优化网站加载速度

### 2017-10-18

1. 修复subheading的英文换行问题
2. 设置body的`word-break`为`break-word`
3. 修复footer中文字的切分问题

### 2017-10-19

1. 为文章增加`itemscope itemtype="http://schema.org/Article"`标签方便Google索引

### 2017-10-26

1. 为文章列表增加分页导航Pagination

### 2017-10-27

1. 修复了有题图的页面，大标题下不显示发布时间的问题

### 2017-10-29

1. 开发[cloudinary-go](https://github.com/rootsongjc/cloudinary-go)命令行工具便于向cloudinary上传图片

### 2017-10-31

1. 修复了分页的css布局问题

### 2017-11-03

1. 修复posts列表下的分页显示问题
2. 去除**ARTICLES**导航页，tags导航放到**CATEGORIES**导航页下

### 2017-11-04

1. 使用ELK统计分析博文数据，修复残缺的文件头信息

### 2017-11-05

1. 修复非主页中的最下面多出来的留白

### 2017-11-25

1. 修复在pages页面中打开about链接的错误anchor

### 2017-12-10

1. 博客文章中增加 `seealso` 开关，meta信息中若设置了 `seealso: false` 该文章下方将不显示See Also

### 2018--04-03

1. 增加目录显示，放在侧边栏，浮动显示

### 2018-05-06

1. 使用[来必力](https://livere.com)提供评论功能
2. 修复了当滚动页面时导航栏中间的avatar虽然隐藏但是仍可以点击的问题
3. 在主页下方选择了不同的页面后不再显示个人简介栏目