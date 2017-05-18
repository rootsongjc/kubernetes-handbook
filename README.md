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

## 贡献者

[Jimmy Song](http://rootsongjc.github.io/about)

[feiskyer](https://github.com/feiskyer)



