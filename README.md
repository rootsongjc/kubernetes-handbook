# Kubernetes Handbook

[Kubernetes](http://kubernetes.io)是Google基于[Borg](https://research.google.com/pubs/pub43438.html)开源的容器编排调度引擎，作为[CNCF](http://cncf.io)（Cloud Native Computing Foundation）最重要的组件之一，它的目标不仅仅是一个编排系统，而是提供一个规范，可以让你来描述集群的架构，定义服务的最终状态，kubernetes可以帮你将系统自动地达到和维持在这个状态。Kubernetes作为云原生应用的基石，相当于一个云操作系统，其重要性不言而喻。

本书记录了本人从零开始学习和使用Kubernetes的心路历程，着重于经验分享和总结，同时也会有相关的概念解析，希望能够帮助大家少踩坑，少走弯路，还会指引大家关于关注kubernetes生态周边，如微服务构建、DevOps、大数据应用、Service Mesh、Cloud Native等领域。

起初写作本书时，安装的所有组件、所用示例和操作等皆基于**Kubernetes1.6.0** 版本，同时我们也将密切关注kubernetes的版本更新，随着它的版本更新升级，本书中的kubernetes版本和示例也将随之更新。

GitHub 地址：https://github.com/rootsongjc/kubernetes-handbook

Gitbook 在线浏览：https://jimmysong.io/kubernetes-handbook/

## 如何使用本书

**在线浏览**

访问 https://jimmysong.io/kubernetes-handbook/

**注意：文中涉及的配置文件和代码链接在网页中将无法访问，请下载GitHub源码后，在Markdown编辑器中打开，点击链接将跳转到你的本地目录，推荐使用[typora](https://typora.io)，或者直接登录[github](https://github.com/rootsongjc/kubernetes-handbook) 查看。**

**本地查看**

1. 将代码克隆到本地
2. 安装 gitbook：[Setup and Installation of GitBook](https://github.com/GitbookIO/gitbook/blob/master/docs/setup.md)
3. 执行 gitbook serve
4. 在浏览器中访问 http://localhost:4000
5. 生成的文档在 `_book` 目录下

**下载 PDF/ePub/Mobi 格式文档本地查看**

访问 [gitbook](https://www.gitbook.com/book/rootsongjc/kubernetes-handbook/details) 可以看到下载地址，可以下载根据最新文档生成的 **PDF/ePub/Mobi** 格式文档（文档的注脚中注明了更新时间），同时也可以直接在 gitbook 中阅读，不过 gitbook 不太稳定打开速度较慢，建议大家直接在 https://jimmysong.io/kubernetes-handbook/ 浏览。

**生成 pdf**

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

需要用到的工具：[calibre](http://calibre-ebook.com/)，[phantomjs](http://phantomjs.org/download.html)

1. 将上述2个安装，calibre 默认安装的路径 `C:\Program Files\Calibre2` 为你解压路径；
2. 并将其目录均加入到系统变量 path 中,参考:目录添加到系统变量 path 中；
3. 在 cmd 打开你需要转 pdf 的文件夹,输入`gitbook pdf`即可；

**生成单个章节的pdf**

使用`pandoc`和`latex`来生成pdf格式文档。

```shell
pandoc --latex-engine=xelatex --template=pm-template input.md -o output.pdf
```

## 如何贡献

### 提 issue

如果你发现文档中的错误，或者有好的建议、不明白的问题、不要犹豫，欢迎[提交issue](https://github.com/rootsongjc/kubernetes-handbook/issues/new)。

### 发起 Pull Request

当你发现文章中明确的错误或者逻辑问题，在你自己的fork的分支中，创建一个新的branch，修改错误，push 到你的branch，然后在[提交issue](https://github.com/rootsongjc/kubernetes-handbook/issues/new) 后直接发起Pull Request。

### 贡献文档

#### 文档的组织规则

- 如果要创建一个大的主题就在最顶层创建一个目录；
- 全书五大主题，每个主题一个目录，其下不再设二级目录；
- 所有的图片都放在最顶层的 `images` 目录下，原则上文章中用到的图片都保存在本地；
- 所有的文档的文件名使用英文命名，可以包含数字和中划线；
- `etc`、`manifests`目录专门用来保存配置文件和文档中用到的其他相关文件；

#### 添加文档

1. 在该文章相关主题的目录下创建文档；
2. 在 `SUMMARY.md` 中在相应的章节下添加文章链接；
3. 执行 `gitbook serve` 测试是否报错，访问 http://localhost:4000 查看该文档是否出现在相应主题的目录下；
4. 提交PR

## 关于

[贡献者列表](https://github.com/rootsongjc/kubernetes-handbook/graphs/contributors)

## 加入K8S🤘Cloud Native实战群

- 微信群：扫描二维码，[Jimmy Song](http://jimmysong.io/about)，或直接搜索微信号**jimmysong**后拉您入群，请增加备注。
- Slack：全球中文用户可以加入[Kubernetes官方Slack](http://slack.k8s.io)中文频道**cn-users channel**
