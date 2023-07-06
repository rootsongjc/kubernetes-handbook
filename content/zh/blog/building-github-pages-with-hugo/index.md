---
draft: false
date: "2017-03-17T22:08:25+08:00"
title: "零基础使用 Hugo 和 GitHub Pages 创建自己的博客"
description: "Hugo 是一种通用的网站框架，本问教你如何使用 Hugo 来构建静态网站。"
categories: ["其他"]
tags: ["Hugo","Github Pages"]
type: "post"
image: "images/banner/hugo-logo.jpg"
---

> 亲，你还在为虚拟主机、域名、空间而发愁吗？你想拥有自己的网站吗？你想拥有一个分享知识、留住感动，为开源事业而奋斗终身吗？那么赶快拿起你手中的📱拨打~~16899168~~，不对，是看这篇文章吧，不用 998，也不用 168，这一切都是免费的，是的**你没看错，真的不要钱！**

## 准备

当然还是需要你有一点电脑基础的，会不会编程不要紧，还要会一点英文，你需要先申请一下几个账号和安装一些软件环境：

- [GitHub](http://www.github.com) **这是必需的**，因为你需要使用[Github Pages](https://pages.github.com/)来托管你的网站。而且你还需要安装 git 工具。创建一个以自己用户名命名的 username.github.io 的 project。
- [七牛云存储](http://www.qiniu.com/) **非必需**，为了存储文件方便，建议申请一个，免费 10G 的存储空间，存储照片和一些小文件是足够的，可以用来做外链，方便存储和管理，这样你就不用把图片也托管到 Github 上了。流量也是不限的。我没有收七牛的一点好处，以为是我自己用的，所以推荐给大家，七牛还有命令行客户端，方便你上传和同步文件。如上的题图都是存储在七牛云中的。
- [百度统计](tongji.baidu.com) **非必需**，基本的网站数据分析，免费的，质量还行。还有微信公众号可以查看，这一点我发现腾讯分析居然都没有微信公众号，自家的产品咋都不推出微信客户端呢。顺便提一下，这个统计账号跟你的百度账号不是同一个东西，两者是两套体系，当然你可以和自己的百度账号关联。只需要在 Web 的 Header 中植入一段 JS 代码即可。
- [Hugo](http://gohugo.io) **必需的**，静态网站生成工具，用来编译静态网站的。跟 Hexo 比起来我更喜欢这个工具。
- [Typro](https://typora.io/) **非必需**，但是强烈推荐，我最喜欢的免费的 Markdown 编辑器，hugo 可以编译 markdown 格式为 HTML，所以用它来写博客是最合适不过了。

好了注册好 Github 后你现在可以尽情的玩耍了！😄

## Let's rock&roll!

**首先介绍下 Hugo**

Hugo 是一种通用的网站框架。严格来说，Hugo 应该被称作静态网站生成器。

静态网站生成器从字面上来理解，就是将你的内容生成静态网站。所谓“静态”的含义其实反映在网站页面的生成的时间。一般的 web 服务器（WordPress, Ghost, Drupal 等等）在收到页面请求时，需要调用数据库生成页面（也就是 HTML 代码），再返回给用户请求。而静态网站则不需要在收到请求后生成页面，而是在整个网站建立起之前就将所有的页面全部生成完成，页面一经生成便称为静态文件，访问时直接返回现成的静态页面，不需要数据库的参与。

采用静态网站的维护也相当简单，实际上你根本不需要什么维护，完全不用考虑复杂的运行时间，依赖和数据库的问题。再有也不用担心安全性的问题，没有数据库，网站注入什么的也无从下手。

静态网站最大好处就是访问快速，不用每次重新生成页面。当然，一旦网站有任何更改，静态网站生成器需要重新生成所有的与更改相关的页面。然而对于小型的个人网站，项目主页等等，网站规模很小，重新生成整个网站也是非常快的。Hugo 在速度方面做得非常好，Dan Hersam 在他这个[Hugo 教程](https://www.udemy.com/build-static-sites-in-seconds-with-hugo/)里提到，5000 篇文章的博客，Hugo 生成整个网站只花了 6 秒，而很多其他的静态网站生成器则需要几分钟的时间。我的博客目前文章只有几十篇，用 Hugo 生成整个网站只需要 0.1 秒。官方文档提供的数据是每篇页面的生成时间不到 1ms。

认为对于个人博客来说，应该将时间花在内容上而不是各种折腾网站。Hugo 会将 Markdown 格式的内容和设置好模版一起，生成漂亮干净的页面。挑选折腾好一个喜爱的模版，在 Sublime Text 里用 Markdown 写博客，再敲一行命令生成同步到服务器就 OK 了。整个体验是不是非常优雅简单还有点 geek 的味道呢？

### 了解 Hugo

首先建立自己的网站，mysite 是网站的路径

```bash
$ hugo new site mysite
```

然后进入该路径

```bash
$ cd mysite
```

在该目录下你可以看到以下几个目录和`config.toml`文件

```bash
 ▸ archetypes/ 
 ▸ content/
 ▸ layouts/
 ▸ static/
   config.toml
```

`config.toml`是网站的配置文件，包括`baseurl`, `title`, `copyright`等等网站参数。

这几个文件夹的作用分别是：

- archetypes：包括内容类型，在创建新内容时自动生成内容的配置
- content：包括网站内容，全部使用 markdown 格式
- layouts：包括了网站的模版，决定内容如何呈现
- static：包括了 css, js, fonts, media 等，决定网站的外观

Hugo 提供了一些完整的主题可以使用，下载这些主题：

```bash
$ git clone --recursive https://github.com/spf13/hugoThemes themes
```

此时现成的主题存放在`themes/`文件夹中。

现在我们先熟悉一下 Hugo，创建新页面：

```bash
$ hugo new about.md
```

进入`content/`文件夹可以看到，此时多了一个 markdown 格式的文件`about.md`，打开文件可以看到时间和文件名等信息已经自动加到文件开头，包括创建时间，页面名，是否为草稿等。

```markdown
---
date: "2015-02-01T18:19:54+08:00"
draft: true
title: "about"
categories: "github-pages"
tag: ["blog","post"]
---

# About me
- Jimmy Song
- rootsongjc@gmail.com
```

我在页面中加入了一些内容，然后运行 Hugo:

```bash
$ hugo server -t hyde --buildDrafts
```

`-t`参数的意思是使用 hyde 主题渲染我们的页面，注意到`about.md`目前是作为草稿，即`draft`参数设置为`true`，运行 Hugo 时要加上`--buildDrafts`参数才会生成被标记为草稿的页面。在浏览器输入 localhost:1313，就可以看到我们刚刚创建的页面。

注意观察当前目录下多了一个文件夹`public/`，这里面是 Hugo 生成的整个静态网站，如果使用 Github pages 来作为博客的 Host，你只需要将`public/`里的文件上传就可以，这相当于是 Hugo 的输出。

详细说明请看这位朋友的文章：[Nanshu Wang - Hugo 静态网站生成器中文教程](http://nanshu.wang/post/2015-01-31/)

**说明**

使用`hugo new`命令生成的文章前面的加号中包括的那几行，是用来设置文章属性的，这些属性使用的是 yaml 语法。

- **date** 自动增加时间标签，页面上默认显示 n 篇最新的文章。
- **draft** 设置为 false 的时候会被编译为 HTML，true 则不会编译和发表，在本地修改文章时候用 true。
- **title** 设置文章标题
- **tags** 数组，可以设置多个标签，都好隔开，hugo 会自动在你博客主页下生成标签的子 URL，通过这个 URL 可以看到所有具有该标签的文章。
- **categories** 文章分类，跟 Tag 功能差不多，只能设置一个字符串。

今天先说到这里，再次声明下，[Jimmy Song's blog](https://jimmysong.io)就是用👆的步骤建立的。

Jimmy Song's blog 的页面比较简陋，你可以在[这里](http://themes.gohugo.io)找到更多可爱的模版。另外我给自己翻译的书[Cloude Native Go](https://jimmysong.io/talks/cloud-native-go/)做一个静态页面，[点此查看](https://jimmysong.io/cloud-native-go/)，欢迎大家关注。🙏

---

以下 2017 年 8 月 31 日更新

如果你对 GitHub 的域名不满意，想要用自己的域名，那么申请域名的地方有很多，比如万网、GoDaddy、Namecheap，我的域名 [jimmysong.io](http://jimmysong.io) 就是在 Namecheap 上申请的，申请完域名后还需要做域名解析，我使用的是 DNSPod，免费的，然后在 GitHub 中配置下 CNAME 即可。

