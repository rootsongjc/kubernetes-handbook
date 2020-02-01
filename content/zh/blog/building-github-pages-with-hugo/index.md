---
draft: false
date: "2017-03-17T22:08:25+08:00"
title: "零基础使用Hugo和GitHub Pages创建自己的博客"
description: "Hugo是一种通用的网站框架，本问教你如何使用Hugo来构建静态网站。"
categories: ["其他"]
tags: ["hugo"]
type: "post"
bg_image: "images/backgrounds/page-title.jpg"
image: "images/banner/hugo-logo.jpg"
---

> 亲，你还在为虚拟主机、域名、空间而发愁吗？你想拥有自己的网站吗？你想拥有一个分享知识、留住感动，为开源事业而奋斗终身吗？那么赶快拿起你手中的📱拨打~~16899168~~，不对，是看这篇文章吧，不用998，也不用168，这一切都是免费的，是的**你没看错，真的不要钱！**

## 准备

当然还是需要你有一点电脑基础的，会不会编程不要紧，还要会一点英文，你需要先申请一下几个账号和安装一些软件环境：

- [GitHub](http://www.github.com) **这是必需的**，因为你需要使用[Github Pages](https://pages.github.com/)来托管你的网站。而且你还需要安装git工具。创建一个以自己用户名命名的username.github.io的project。
- [七牛云存储](http://www.qiniu.com/) **非必需**，为了存储文件方便，建议申请一个，免费10G的存储空间，存储照片和一些小文件是足够的，可以用来做外链，方便存储和管理，这样你就不用把图片也托管到Github上了。流量也是不限的。我没有收七牛的一点好处，以为是我自己用的，所以推荐给大家，七牛还有命令行客户端，方便你上传和同步文件。如上的题图都是存储在七牛云中的。
- [百度统计](tongji.baidu.com) **非必需**，基本的网站数据分析，免费的，质量还行。还有微信公众号可以查看，这一点我发现腾讯分析居然都没有微信公众号，自家的产品咋都不推出微信客户端呢。顺便提一下，这个统计账号跟你的百度账号不是同一个东西，两者是两套体系，当然你可以和自己的百度账号关联。只需要在Web的Header中植入一段JS代码即可。
- [Hugo](http://gohugo.io) **必需的**，静态网站生成工具，用来编译静态网站的。跟Hexo比起来我更喜欢这个工具。
- [Typro](https://typora.io/) **非必需**，但是强烈推荐，我最喜欢的免费的Markdown编辑器，hugo可以编译markdown格式为HTML，所以用它来写博客是最合适不过了。

好了注册好Github后你现在可以尽情的玩耍了！😄

## Let's rock&roll!

**首先介绍下Hugo**

Hugo是一种通用的网站框架。严格来说，Hugo应该被称作静态网站生成器。

静态网站生成器从字面上来理解，就是将你的内容生成静态网站。所谓“静态”的含义其实反映在网站页面的生成的时间。一般的web服务器（WordPress, Ghost, Drupal等等）在收到页面请求时，需要调用数据库生成页面（也就是HTML代码），再返回给用户请求。而静态网站则不需要在收到请求后生成页面，而是在整个网站建立起之前就将所有的页面全部生成完成，页面一经生成便称为静态文件，访问时直接返回现成的静态页面，不需要数据库的参与。

采用静态网站的维护也相当简单，实际上你根本不需要什么维护，完全不用考虑复杂的运行时间，依赖和数据库的问题。再有也不用担心安全性的问题，没有数据库，网站注入什么的也无从下手。

静态网站最大好处就是访问快速，不用每次重新生成页面。当然，一旦网站有任何更改，静态网站生成器需要重新生成所有的与更改相关的页面。然而对于小型的个人网站，项目主页等等，网站规模很小，重新生成整个网站也是非常快的。Hugo在速度方面做得非常好，Dan Hersam在他这个[Hugo教程](https://www.udemy.com/build-static-sites-in-seconds-with-hugo/)里提到，5000篇文章的博客，Hugo生成整个网站只花了6秒，而很多其他的静态网站生成器则需要几分钟的时间。我的博客目前文章只有几十篇，用Hugo生成整个网站只需要0.1秒。官方文档提供的数据是每篇页面的生成时间不到1ms。

认为对于个人博客来说，应该将时间花在内容上而不是各种折腾网站。Hugo会将Markdown格式的内容和设置好模版一起，生成漂亮干净的页面。挑选折腾好一个喜爱的模版，在Sublime Text里用Markdown写博客，再敲一行命令生成同步到服务器就OK了。整个体验是不是非常优雅简单还有点geek的味道呢？

### 了解Hugo

首先建立自己的网站，mysite是网站的路径

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
- content：包括网站内容，全部使用markdown格式
- layouts：包括了网站的模版，决定内容如何呈现
- static：包括了css, js, fonts, media等，决定网站的外观

Hugo提供了一些完整的主题可以使用，下载这些主题：

```bash
$ git clone --recursive https://github.com/spf13/hugoThemes themes
```

此时现成的主题存放在`themes/`文件夹中。

现在我们先熟悉一下Hugo，创建新页面：

```bash
$ hugo new about.md
```

进入`content/`文件夹可以看到，此时多了一个markdown格式的文件`about.md`，打开文件可以看到时间和文件名等信息已经自动加到文件开头，包括创建时间，页面名，是否为草稿等。

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

我在页面中加入了一些内容，然后运行Hugo:

```bash
$ hugo server -t hyde --buildDrafts
```

`-t`参数的意思是使用hyde主题渲染我们的页面，注意到`about.md`目前是作为草稿，即`draft`参数设置为`true`，运行Hugo时要加上`--buildDrafts`参数才会生成被标记为草稿的页面。 在浏览器输入localhost:1313，就可以看到我们刚刚创建的页面。

注意观察当前目录下多了一个文件夹`public/`，这里面是Hugo生成的整个静态网站，如果使用Github pages来作为博客的Host，你只需要将`public/`里的文件上传就可以，这相当于是Hugo的输出。

详细说明请看这位朋友的文章：[Nanshu Wang - Hugo静态网站生成器中文教程](http://nanshu.wang/post/2015-01-31/)

**说明**

使用`hugo new`命令生成的文章前面的加号中包括的那几行，是用来设置文章属性的，这些属性使用的是yaml语法。

- **date** 自动增加时间标签，页面上默认显示n篇最新的文章。
- **draft** 设置为false的时候会被编译为HTML，true则不会编译和发表，在本地修改文章时候用true。
- **title** 设置文章标题
- **tags** 数组，可以设置多个标签，都好隔开，hugo会自动在你博客主页下生成标签的子URL，通过这个URL可以看到所有具有该标签的文章。
- **categories** 文章分类，跟Tag功能差不多，只能设置一个字符串。

今天先说到这里，再次声明下，[Jimmy Song's blog](https://jimmysong.io)就是用👆的步骤建立的。

Jimmy Song's blog的页面比较简陋，你可以在[这里](http://themes.gohugo.io)找到更多可爱的模版。另外我给自己翻译的书[Cloude Native Go](https://jimmysong.io/talks/cloud-native-go/)做一个静态页面，[点此查看](https://jimmysong.io/cloud-native-go/)，欢迎大家关注。🙏

---

以下 2017年8月31日更新

如果你对GitHub的域名不满意，想要用自己的域名，那么申请域名的地方有很多，比如万网、GoDaddy、Namecheap，我的域名 [jimmysong.io](http://jimmysong.io) 就是在 Namecheap 上申请的，申请完域名后还需要做域名解析，我使用的是 DNSPod，免费的，然后在 GitHub 中配置下 CNAME 即可。

