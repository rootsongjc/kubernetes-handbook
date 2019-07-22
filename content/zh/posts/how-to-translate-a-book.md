---
title: "如何翻译一本外文书"
date: 2017-10-27T22:55:43+08:00
draft: false
subtitle: "从图书引进到翻译出版全攻略"
tags: ["talk","book"]
description: "如何翻译一本外文书，从图书引进到翻译出版全攻略"
bigimg: [{src: "https://gw.alipayobjects.com/mdn/rms_91f3e6/afts/img/A*wwyaRIdLTGwAAAAAAAAAAABkARQnAQ", desc: "青海湖畔 Jun 25,2016"}]
---

截止本文发稿时，我是以下两本Cloud Native图书的译者：

- [Cloud Native Go](https://jimmysong.io/cloud-native-go)：已由电子工业出版社出版
- [Cloud Native Python](https://jimmysong.io/posts/cloud-native-python)：正在翻译中

同时我还参与了[kubernetes](https://kubernetes.io/)、[Istio](http://istio.doczh.cn)的文档翻译，撰写了开源电子书[kubernetes-handbook](https://jimmysong.io/kubernetes-handbook)，下面是我本人在翻译过程中的的一些心得。

## 图书引进

### 1. 联系出版社

假如您看到一本很好的外文书籍想要翻译，首先需要联系出版社，询问该书是否已被引进，因为每年国内引进的外文书籍是有数量控制的，而且有的书也不是你先给引进就可以引进的，每年都有版权引进会议，国内的出版社统一参加确定引进的书籍，哪家引进多少本，哪一本分给哪一家等。可以与出版社编辑沟通，查看该书是否可以引进，是否已经有别的出版社引进且在翻译中，这个过程基本不需要你与原作者沟通。

### 2. 取得图书引进的版权

如果很幸运的，这本书可以引进到国内，而且还没有人来翻译，可以跟出版社编辑要求翻译这本书，如果书籍内容适当可以一个人翻译，如果内容较多可以分多个人翻译，建议人数不要超过4人。

## 环境准备

首先需要准备如下环境：

- **Git**：用户版本管理，也方便在线查看，我使用[码云](https://gitee.com)私有代码库管理。
- **Markdown编辑器**：我推荐使用[typora](https://typora.io)。
- **Gitbook**：使用[Gitbook](https://gitbook.com)生成web页面便于阅读和查看，注意不要公开发布到Github上。
- **Word**：虽然我们使用markdown编辑器来编辑，但是word还是需要的，因为编辑会在word中批注，再返回给你修改。
- **Translation-shell**：命令行翻译工具，https://github.com/soimort/translate-shell

## 翻译过程

以下是我个人总结的图书翻译流程，仅供参考。

### 1. 分析原版压缩包的结构

以[Cloud Native Python](https://jimmysong.io/posts/cloud-native-python)这本书为例，原文的压缩包里包含以下目录：

- **Code**：书中的代码示例
- **Cover**：本书的封面图片
- **E-Book**：本书的完成PDF文档（一个文件）
- **Graphics**：书中的图片，按照章节和顺序编号，放在一个目录下，不一定与图片在书中出现的顺序相同，有些后来补充的图片会另外编号
- **Printers**：用于印刷的PDF文档，分为封面和正文

### 2. 初始化翻译项目

我们使用Git来管理，使用Gitbook来预览，需要先初始化一些目录结构和gitbook配置。

**初始化的目录和文件**

- **LANGS.md**：语言配置文件
- **README.md**：项目说明
- **book.json**：gitbook配置文件
- **cn**：中文翻译（按章节划分成不同的文件）
- **corrigendum.md**：勘误表
- **cover.jpg**：书籍封面
- **en**：英文原文（按章节划分成不同的文件）
- **glossary.md**：术语表
- **images**：保存书中的图片

让Gitbook支持多语言的`book.json`配置如下：

```json
{
    "title": "Cloud Native Python",
    "description": "Cloud Native Python",
    "language": "zh-hans",
    "author": "Jimmy Song",
    "links": {
    "sidebar": {
        "Home": "https://jimmysong.io"
        }
    },
    "plugins": [
        "codesnippet",
        "splitter",
        "page-toc-button",
        "back-to-top-button",
        "-lunr", "-search", "search-plus",
        "tbfed-pagefooter@^0.0.1"
    ],
    "pluginsConfig": {
        "tbfed-pagefooter": {
            "copyright": "Copyright © jimmysong.io 2017 ",
            "modify_label": "Updated:",
            "modify_format": "YYYY-MM-DD HH:mm:ss"
        }
    }
}
```

`LANG.md`文件中定义不同语言的文件目录：

```markdown
# Languages

* [中文](cn/)
* [English](en/)
```

### 3. 原文Markdown化

之所以将原文Markdown化一是便于我们后续翻译的时候对照英文和引用其中的原文，二是为了生成gitbook便于浏览。将每一章的内容都划分成一个Markdown文件，按照章节的名字为文档命名，分别在`cn`和`en`目录下都放一份。

![中英文目录](https://res.cloudinary.com/jimmysong/image/upload/images/cloud-native-python-cn-en.jpg)

### 4. 开始正文的翻译

建议从头开始按顺序翻译，如果前后章节联系不大的可以跳跃翻译，翻译的过程中将一些关键的术语，包括翻译不明确的，需要后续参考的数据记录在`glossary.md`文档中。

格式如下所示：

| English                       | 中文     | 说明             | 是否翻译 |
| ----------------------------- | ------ | -------------- | ---- |
| Cross-Origin Resource Sharing | 跨源资源共享 |                | 是    |
| HTTP header                   |        |                | 否    |
| Observable                    | 观察者    | 可以不翻译，中文翻译比较模糊 | 否    |
| cookies                       |        | 不翻译，保持复数       | 否    |
| module                        | 模块     |                | 是    |
| origin                        | 源      | 有争议            | 是    |
| session                       | 会话     |                | 否    |

可以不断向其中追加新的术语。

翻译的过程中需要用到翻译工具，我使用的是[translation-shell](https://github.com/soimort/translate-shell)，一款基于命令行的翻译工具，可以使用Google、bing或者Yandex翻译，十分方便快捷。

**Translation-shell**

使用`trans :zh -b -shell`进入translation-shell交互式界面，拷贝英文段落进去翻译成中文。

![Translation-shell](https://res.cloudinary.com/jimmysong/image/upload/images/translation-trans-terminal.jpg)

**使用Typora编辑中文翻译**

同时打开`en`和`cn`目录下的同一章节开始翻译。

![中英文翻译界面](https://res.cloudinary.com/jimmysong/image/upload/images/translation-typora-multi-language.jpg)

**在Gitbook中查看**

使用`gitbook serve`启用gitbook服务，在http://localhost:4000页面上查看内容。

首先会出来语言选择页面，我们可以分别选择中文和英文内容浏览，语言是在`LAGNS.md`文件中定义的。

![Gitbook](https://res.cloudinary.com/jimmysong/image/upload/images/translation-gitbook-cn-en.jpg)

**导出为不同格式**

使用typora编辑完中文翻译后，可以导出为pdf、word等其它格式，我们导出为word格式后发送给编辑批阅。

生成的word内容格式是这样的：

![word文档格式](https://res.cloudinary.com/jimmysong/image/upload/images/translation-word-cn.jpg)

我们可以看到生产的word文档仍然保留了代码的高亮，而且可读性也很好。

### 5. 审校

每当翻译完一章内容后就发送给编辑，编辑会使用word进行审校批注，根据编辑的批注修改后再发回给编辑。

![word review界面](https://res.cloudinary.com/jimmysong/image/upload/images/translation-word-review.jpg)

### 6. 二审

当所有的章节分别翻译和审校完成后，需要在通读一遍全书，更正前后不一致和翻译中的谬误，然后交给编辑等待排版。这时候还要准备写译者序，还要找人写推荐序。翻译版的图书封面会沿用原书的封面。

### 7. 印刷

当正文、译者序、推荐序都完成后就可以交给出版社印刷了，一般初次会印刷几千本。

### 8. 后续事宜

书籍印刷后后续事宜主要包括：

- **出版社支付稿费**：翻译图书稿费=图书销量x定价x4%，著作一般为8%
- **配合图书宣传**：一些meetup、大会、线上交流时推荐图书
- **读者交流**：可以开设社区、微信群、网站等交流

## 贴士

图书翻译耗时费力，倾注了原作者和译者的很多心力，**打击盗版，维护正版**！

## 有用的链接

- [术语在线](http://www.termonline.cn/index.htm)
- [非文学翻译理论与实践 - 王长栓](https://book.douban.com/subject/1289408/)