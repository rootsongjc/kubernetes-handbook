# Kubernetes Handbook

Kubernetes是谷歌开源的容器集群管理系统，是Google多年大规模容器管理技术Borg的开源版本，也是CNCF最重要的组件之一，主要功能包括：

- 基于容器的应用部署、维护和滚动升级
- 负载均衡和服务发现
- 跨机器和跨地区的集群调度
- 自动伸缩
- 无状态服务和有状态服务
- 广泛的Volume支持
- 插件机制保证扩展性

Kubernetes发展非常迅速，已经成为容器编排领域的领导者。Kubernetes的中文资料也非常丰富，但系统化和紧跟社区更新的则就比较少见了。《Kubernetes指南》开源电子书旨在整理平时在开发和使用Kubernetes时的参考指南和实践心得，更是为了形成一个系统化的参考指南以方便查阅。欢迎大家关注，更欢迎大家一起添加更多更好的内容。

本书所有的组件安装、示例和操作等都基于**Kubernetes1.6.0**版本。

文章同步更新到[gitbook](https://www.gitbook.com/book/rootsongjc/kubernetes-handbook/details)，方便大家浏览和下载PDF。

GitHub地址：https://github.com/rootsongjc/kubernetes-handbook

[文章目录](SUMMARY.md)

## 如何阅读

**在线浏览**

访问gitbook：https://www.gitbook.com/book/rootsongjc/kubernetes-handbook/

文中涉及的配置文件和代码链接在gitbook中会无法打开，请下载github源码后，在MarkDown编辑器中打开，点击链接将跳转到你的本地目录，推荐使用[typora](www.typorai.o)。

**本地查看**

1. 将代码克隆到本地
2. 安装gitbook：[Setup and Installation of GitBook](https://github.com/GitbookIO/gitbook/blob/master/docs/setup.md)
3. 执行gitbook serve
4. 在浏览器中访问http://localhost:4000
5. 生成的文档在`_book`目录下

**生成pdf**

[下载Calibre](http://calibre-ebook.com/download)

- **On Mac**

在Mac下安装后，使用该命令创建链接

```
ln -s /Applications/calibre.app/Contents/MacOS/ebook-convert /usr/local/bin
```

在该项目目录下执行以下命令生成`kubernetes-handbook.pdf`文档。

```
gitbook pdf . ./kubernetes-handbook.pdf
```

- **On Windows**

需要用到的工具:`calibre`, `phantomjs`

1. 将上述2个安装,calibre默认安装的路径C:\Program Files\Calibre2,[phantomjs](http://phantomjs.org/download.html)为你解压路径
2. 并将其目录均加入到系统变量path中,参考:目录添加到系统变量path中
3. 在cmd打开你需要转pdf的文件夹,输入gitbook pdf即可

**生成单个章节的pdf**

使用`pandoc`和`latex`来生成pdf格式文档。

```shell
pandoc --latex-engine=xelatex --template=pm-template input.md -o output.pdf
```

## 如何贡献

### 提issue

如果你发现文档中的错误，或者有好的建议，不要犹豫，欢迎[提交issue](https://github.com/rootsongjc/kubernetes-handbook/issues/new)。

### 发起Pull Request

当你发现文章中明确的错误或者逻辑问题，在你自己的fork的分支中，创建一个新的branch，修改错误，push到你的branch，然后在[提交issue](https://github.com/rootsongjc/kubernetes-handbook/issues/new)后直接发起Pull Request。

### 贡献文档

**本书文档的组织规则**

- 如果要创建一个大的主题就在最顶层创建一个目录；
- 所有的图片都放在最顶层的`images`目录下，原则上文章中用到的图片都保存在本地；
- 所有的文档的文件名使用英文命名，可以包含数字和中划线，不要使用下划线，为了生成网站时，分享URL时候的方便，中文会重新编码；
- `etc`、`manifests`目录专门用来保存配置文件；

**添加文档**

1. 在该文章相关主题的目录下创建文档；
2. 在`SUMMARY.md`中在相应的章节下添加文章链接；
3. 在文章相应的主题的头文档，即以该主题命名的文档中添加链接；
4. 执行`gitbook server`测试是否保存，然后访问 http://localhost:4000 查看该文档是否出现在相应主题的目录下；
5. 对该文档有卓越贡献的人将被加入到**贡献者**名单中；

## 贡献者

[Jimmy Song](http://rootsongjc.github.io/about)



