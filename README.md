# My blog's source code

[Jimmy Song's blog](https://jimmysong.io) source code

Proudly powered by [Hugo](https://github.com/gohugoio/hugo) ❤️, Theme by [Beautiful Jekyll](http://deanattali.com/beautiful-jekyll/) adapted to [Beautiful Hugo](https://github.com/halogenica/beautifulhugo)

## Usage

Let me show you how to add and debug a new post and push it to Github pages and building a new searching index.

### 1. Add a new post

Use this command to create a new post:

```bash
hugo add posts/new.md
```

After the new post created, it is located at `./content/posts/new.md`.

### 2. Post head matters

Classic example:

```yaml
date: "2017-06-01T20:18:57+08:00"
draft: false
title: "微服务管理框架service mesh——istio安装笔记"
subtitle: "手把手教你安装Istio service mesh"
categories: "cloud-native"
tags: ["kubernetes","istio","service-mesh"]
noreward: true
notoc: true
noadsense: true
noad: true
seealso: false
description: "对文章的简要描述 SEO used for description"
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20170528033.jpg", desc: "威海东部海湾 May 28,2017"}]
nocomment: true
postmeta: false
```

**bigimg**：an array, you can specify multiple images in map lists.

**postmeta**：whether show the post meta data below a post title/subtitle

**nocomment**: whether show the comment box

**Lightbox effect**

With [shortcodes](https://gohugo.io/templates/shortcode-templates/):

```html
{{< gallery link="https://ws4.sinaimg.cn/large/006tKfTcly1g0isiw4qmij30u013ce02.jpg" title="Istio handbook" >}}
```

With HTML:

```html
<div class="gallery">
    <a href="https://ws3.sinaimg.cn/large/006tNbRwly1fujrgeesk7j316c0tz10y.jpg" title="What is Istio?">
    <img src="https://ws3.sinaimg.cn/large/006tNbRwly1fujrgeesk7j316c0tz10y.jpg" alt="What is Istio?">
    </a>
</div>
```

### 3. Preview and debug

Execute this command the build a preview:

```bash
hugo server
```

Visit <http://localhost:1313> for the website preview.

**4. Update algolia index**

Execute this command to build a new algolia index at the project's base path:

```Bash
hugo-alogolia
grep -v '"content":' algolia.json>rootsongjc-hugo.json
rm -f algolia.json
```

As the  new post created there should be a new record added to this file `public/rootongjc-hugo.json`.

## Acknowledgements

- [AddThis](https://www.addthis.com/): social share botton
- [Algolia](https://www.algolia.com/): search platform
- [autocomplete.js](https://github.com/algolia/autocomplete.js): search frontend
- [Baidu analysis](http://tongji.baidu.com/): website analysis
- [Beautiful Hugo](https://github.com/halogenica/beautifulhugo): theme
- [Bitlinks](https://bitly.com/) Short links
- [Cloudfare](https://www.cloudflare.com/): DNS and https
- [Cloudinary](https://www.cloudinary.com/): CDN and static images hosting
- [Github Pages](https://pages.github.com/): website hosting
- [Gitment](https://github.com/imsun/gitment): comments plugin
- [Hugo](https://gohugo.io/): static website builder
- [Hugo-algolia](https://www.npmjs.com/package/hugo-algolia): index json builder
- [Namecheap](https://namecheap.com/): domain name registry
- [Prism](http://prism.com/): code highlight

