---
title: "Hugo Universal主题使用指南"
subtitle: "一套适用于产品展示的最佳主题"
date: 2018-05-25T18:43:51+08:00
description: "一套适用于产品展示的最佳主题 hugo-universal 主题使用说明"
bigimg: [{src: "/img/banners/00704eQkgy1friw07in66j30rs0am75f.jpg", desc: "On the overpass|Hangzhou|May 13,2018"}]
tags: ["hugo","website"]
categories: "github"
draft: false
---

[hugo-universal](https://github.com/devcows/hugo-universal-theme) 这款主题适用于产品简介、公司介绍和门户网站。经过我修改后该主题有以下特点：

- 响应式设计
- 可自定义的登陆页面
- 多套 CSS style 可选，自由选择网站色系
- 移动端友好
- 代码高亮

关于Hugo使用请参考[hugo-handbook](https://jimmysong.io/hugo-handbook)，本主题的使用文档同时归档其中。

**示例网站**

下面是几个使用该主题的示例网站。

- https://dataikudss.com
- https://servicemesher.github.io
- https://themes.gohugo.io/theme/hugo-universal-theme

## hugo-universal主题模块说明

使用该主题的网站的`config.toml`配置文件示例如下（以<https://servicemesher.github.io/>为示例）：

```toml
# 网站的根URL
baseurl = "https://servicemesher.github.io/"
# 首页的标题
title = "ServiceMesher"
# 设置使用的主题
theme = "hugo-universal-theme"
# 设置网站默认的语言，所有的语言翻译文件在i18n目录下，文件名于此处配置的语言代码相同
languageCode = "zh"
defaultContentLanguage = "zh"
# 值为空的话则不启用disqus，因为需要翻墙才能访问，所以我们不启用
disqusShortname = ""
# 取消默认的代码高亮，我们使用prism代码高亮
pygmentsUseClasses = false
pygmentCodeFences = true

# 每页显示的文章数量用于分页
paginate = 10

[menu]

# 板块化分
# 权重对应在页面上显示的次序

[[menu.main]]
    name = "主页"
    url  = "/"
    weight = 1

[[menu.main]]
    name = "博客"
    url  = "/blog/"
    weight = 2

[[menu.main]]
    name = "活动"
    identifier = "activity"
    url  = "/activity/"
    weight = 3

[[menu.main]]
    name="黄页"
    url = "/awesome-servicemesh/"
    weight = 4

[[menu.main]]
    name = "联系我们"
    url  = "/contact/"
    weight = 5

# 顶栏，可选择显示

[[menu.topbar]]
    weight = 1
    name = "GitHub"
    url = "https://github.com/servicemesher"
    pre = "<i class='fa fa-2x fa-github'></i>"

[[menu.topbar]]
    weight = 4
    name = "Email"
    url = "mailto:jimmysong@jimmysong.io"
    pre = "<i class='fa fa-2x fa-envelope'></i>"

# 配置参数，HTML中可以引用
[params]
    viewMorePostLink = "/blog/"
    author = "ServiceMesher"
    # 文章默认的SEO设置
    defaultKeywords = ["service mesh"]
    defaultDescription = "Service Mesh爱好者网站"
    
    # 浏览器中看到每一页的后缀，与原文标题使用·分隔
    description = "Service Mesh爱好者"
    # 留空，不启用谷歌地图
    googleMapsApiKey = ""
    # Baidu统计的token
    baiduKey="761ec5e305f799778975c1f71c47a520"
    
    # 选用的 CSS，可选的有：default（浅蓝）、blue、green、marsala,、pink、red、turquoise、violet（我用的这个）
    style = "violet"

    # 404页面显示的图片
    errorimage = "https://ws1.sinaimg.cn/large/00704eQkgy1frkahxdca2j30hd08wq52.jpg"
	# 页脚显示的关于信息
    about_us = "<p>Service Mesh 爱好者</p>"
    copyright = "Copyright ©️ 2018, ServiceMesher all rights reserved."

    # Go语言格式的时间模板
    date_format = "2006-01-02"
	# 网站logo
    logo = "img/logo.png"
    address = """<p><strong>ServiceMesher.</strong>
      """

[Permalinks]
	# 博客中文章的URL规则，可以为/blog/2018/05/24/mypost/
    #blog = "/blog/:year/:month/:day/:filename/"
    blog = "/blog/:filename/"

# 是否启用顶层通知栏
[params.topbar]
    enable = false 
    text = """<p class="hidden-sm hidden-xs">欢迎来到 Service Mesh 爱好者网站</p>
      """

# 是否启用右侧的小工具
[params.widgets]
    categories = true
    tags = true
    search = true

[params.carousel]
    enable = true
    # 设置首页大风车的背景图片
    background = "https://ws1.sinaimg.cn/large/00704eQkgy1frlkpcfzt4j30zk0k0at2.jpg" 

# 功能显示栏目
[params.features]
    enable = true

# 社区活动栏目
[params.testimonials]
    enable = true
    title = "社区活动"
    subtitle = "我们会不定期得在线上和线下举办精彩的活动，敬请关注，下面是历史活动记录"

# 参与进来栏目
[params.see_more]
    enable = true
    icon = "fa fa-pagelines"
    title = "参与进来"
    subtitle = "加入 Service Mesh 爱好者群体"
    link_url = "/contact"
    link_text = "查看加入方式"

# 参与者栏目
[params.clients]
    enable = true
    title = "参与者"
    subtitle = "Envoy官方文档中文版卓越贡献者"

# 最新博客栏目
[params.recent_posts]
    enable = true
    title = "最新博客"
    subtitle = "社区参与者的博客与最 in 的新闻都在这里"
```

### 资源目录

所有的静态资源保存在`static`目录下。

所有的自定义模块的配置都在`data`目录下，使用YAML格式配置。

JPG格式的图片使用微博图床保存。

因为微博图床只能保存JPG格式的图片，主题中使用了部分PNG格式（图片支持透明）保存在GitHub中。

## hugo-universal主题配置说明

该主题包括以下几个分模块，用来配置登录页面上的六个模块，其中有四个模块的自定义配置在`data`目录下，下面的模块顺序按出现在主页上的顺序排列：

- carousel：登录页面上的以风车形式显示的背景也页面以及页面上的文字
- features：功能特性模块
- clients：参与者配置
- see_more：查看更多/参与进来，在`config.toml`中配置
- recent_posts：最新博客，在`config.toml`中配置
- testimonials：最新活动与客户评价

### carousel

![风车模块](https://ws1.sinaimg.cn/large/00704eQkgy1frnoluj5z8j32520pmwvi.jpg)

示例配置如下：

```yaml
weight: 1
title: "Envoy proxy"
description: >
  <ul class="list-style-none">
    <li>开源</li>
    <li>专为云原生应用而设计</li>
    <li>边缘和服务间代理</li>
    <li>Istio 默认的数据平面</li>
    <li><a href="https://servicemesher.github.io/envoy">访问 Envoy 中文文档</a></li>
  </ul>
image: "img/carousel/envoy-gitbook.png"
```

- weight：权重，决定显示顺序
- title：标题
- description：支持HTML
- image：显示的图片

可以配置多个页面，每个页面分别在一个YAML文件中配置，可以配置多个，建议是偶数个，因为这样当在大页面中显示会比较好看。

### features

![](https://ws1.sinaimg.cn/large/00704eQkgy1frnp9ss738j32360xajuj.jpg)

示例配置如下：

```yaml
weight: 1
name: "智能路由和负载均衡"
icon: "fa fa-exchange"
description: "控制服务间流量并进行动态负载均衡"
```

- weight：图标的权重
- name：显示的标题
- icon：使用[awesome-font](www.bootcss.com/p/font-awesome/) CSS中的icon
- description：描述

每个图标的配置都在一个单独的YAML中，可以配置多个，建议是偶数个，因为这样当在大页面中显示会比较好看。

### testimonials

![testimonials模块](https://ws1.sinaimg.cn/large/00704eQkgy1frnoobj2wcj32580uunin.jpg)

示例配置如下：

```yaml
text: "Envoy 最新版的官方文档中文版翻译活动正在进行中，赶快参与进来吧！参与翻译和校对，为社区贡献力量！[查看参与方式](https://github.com/servicemesher/envoy/blob/master/CODE_OF_CONDUCT.md)"
name: "Jimmy Song"
position: "发起者"
avatar: "https://ws1.sinaimg.cn/large/00704eQkgy1frmobjwmuoj31z21z61ky.jpg"
```

- text：支持HTML
- name：发布者名字
- position：发布者头衔（SM capital即网站管理员）
- avatar：发布者头像，使用微博图床，图片为正方形，至少200*200像素

### see_more

![see more模块](https://ws1.sinaimg.cn/large/00704eQkgy1frnox9lwmfj32520ky1kx.jpg)

示例配置如下：

```yaml
[params.see_more]
    enable = true
    icon = "fa fa-pagelines"
    title = "参与进来"
    subtitle = "加入 Service Mesh 爱好者群体"
    link_url = "/contact"
    link_text = "查看加入方式"
```

- icon：图标配置，图标来自[awesome-font](www.bootcss.com/p/font-awesome/) CSS
- title：标题
- subtitle：副标题
- link_url：链接URL
- link_text：按钮上的文字

### recent_posts

![](https://ws1.sinaimg.cn/large/00704eQkgy1frnpesf006j320c1461kx.jpg)

配置项如下：

```yaml
[params.recent_posts]
    enable = true
    title = "最新博客"
    subtitle = "社区参与者的博客与最 in 的新闻都在这里"
```

该配置是在`config.toml`中配置的。

### 图片说明

除了PNG格式的图片，其它图片都使用微博图床，默认的本地图片位置在`static/img`目录下，该目录下包括如下图片：

| 文件/目录名称        | 说明                                                         | 大小（像素） | 是否透明 |
| -------------------- | ------------------------------------------------------------ | ------------ | -------- |
| apple-touch-icon.png | 在苹果触摸设备上（如iPhone和iPad上）显示的网站favicon        | 128*128      | 是       |
| carousel目录         | 风车中的图片                                                 | 800*400      | 是       |
| clients              | 参与者配置中的图片，图片中间显示为原型                       | 320*180      | 是       |
| favicon.ico          | favicon                                                      | 128*128      | 是       |
| logo-small.png       | 在小屏幕上（如手机）显示的logo图片，现在默认使用图片根logo.png，可以再弄个小点的图片 | 187*42       | 是       |
| logo.png             | 默认的网站logo，显示在页面左上角                             | 187*42       | 是       |

以上图片是必须在网站中存储和使用的图片，还有一些地方使用图床中的图片，不需要在本地保存，请参考`config.toml`中的说明。

### 其它配置

其它配置都在 `config.toml` 中，请参考[hugo-universal主题模块说明](#hugo-universal主题模块说明)。

## 内容管理指南

本站除主页外的所有内容都是用 Markdown 格式文档编写，然后由 Hugo 渲染出 HTML 页面。所有的 Markdown 内容都保存在 `content` 目录下。

### 默认模板

创建博客的默认模版位于 `archetypes/default.md`。

```yaml
title: "{{ replace .Name "-" " " | title }}"
date: {{ .Date }}
draft: true
banner: "https://ws1.sinaimg.cn/large/00704eQkgy1frk001fkixj30rs0ku4qp.jpg"
author: "N/A"
summary: "文章摘要"
tags: [""]
categories: [""]
```

其中包含了博客文章的一些元数据。

- title：文章标题
- date：博客文章创建时间
- draft：是否是草稿，设置为 `false` 才会发布出去，默认是 `true`
- banner：“最新文章”一栏下的博客横幅
- author：文章作者
- summary：文章摘要，会在“最新文章”一栏显示
- tags：标签，可以写多个
- categories：分类，可以写多个，一般写一个就行

下图是以上元数据对应的单个博客页面上的地方。

![](https://ws1.sinaimg.cn/large/00704eQkgy1frqwaf6ulnj31t616s7wh.jpg)

注意：页面右侧的“分类”和“标签“显示的是所有博客的，而非当前博客页面的”分类“和”标签“。

### 创建新的博客

如果需要创建新的博客，只需要运行下面的命令：

```bash
hugo new blog/new-blog.md
```

新创建的博客位于 `content/blog/new-blog.md`。

打开该文件，修改文档的元数据，然后就可以欢快的编辑内容了。

### 创建新的 tab 页面

使用下面的命令创建新的 tab 页面：

```bash
hugo new new-tab.md
```

新的页面文件位于 `content/new-tab.md`。

在 `config.toml` 中增加一个 tab 配置：

```toml
[[menu.main]]
	name = "新的页面"
	url = "/new-tab/"
	weight = 6
```

- name：tab 显示在主页上的名称
- url：对应于新的 tab 页面的文件名
- weight：在主页上的排列顺序

