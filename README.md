# Kubernetes Handbook

玩转Kubernetes，我就看kubernetes handbook！

本书所有的组件安装、示例和操作等都基于**Kubernetes1.6.0**版本。

文章同步更新到[gitbook](https://www.gitbook.com/book/rootsongjc/kubernetes-handbook/details)，方便大家浏览和下载PDF。

GitHub地址：https://github.com/rootsongjc/kubernetes-handbook

## 目录

- [0.0 介绍](README.md)
- [1.0 Kubernetes集群安装](00-kubernetes安装前言.md)
  - [1.1 创建 TLS 证书和秘钥](01-创建TLS证书和密钥.md)
  - [1.2 创建kubeconfig 文件](02-创建kubeconfig文件.md)
  - [1.3 创建高可用etcd集群](03-创建高可用etcd集群.md)
  - [1.4 安装kubectl命令行工具](04-安装kubectl命令行工具.md)
  - [1.5 部署高可用master集群](05-部署高可用master集群.md)
  - [1.6 部署node节点](06-部署node节点.md)
  - [1.7 安装kubedns插件](07-安装kubedns插件.md)
  - [1.8 安装dashboard插件](08-安装dashboard插件.md)
  - [1.9 安装heapster插件](09-安装heapster插件.md)
  - [1.10 安装EFK插件](10-安装EFK插件.md)
- 2.0 Kubernetes服务发现与负载均衡
  - [2.1 Ingress解析](11-ingress解析.md)
  - [2.2 安装traefik ingress](12-安装traefik-ingress.md)
  - [2.3 分布式负载测试](14-分布式负载测试.md)
  - [2.4 kubernetes网络和集群性能测试](15-kubernetes网络和集群性能测试.md)
  - [2.5 边缘节点配置](18-边缘节点配置.md)
- 3.0 Kubernetes中的容器设计模式 TODO
- 4.0 Kubernetes中的概念解析
  - [4.1 Deployment概念解析](20-deployment概念解析.md)
  - [4.2 kubernetes配置最佳实践.md](22-kubernetes配置最佳实践.md)
- 5.0 Kubernetes的安全设置
  - [5.1 Kubernetes中的RBAC支持](13-kubernetes中的RBAC支持.md)
- 6.0 Kubernetes网络配置
  - [6.1 Kubernetes中的网络模式解析](16-kubernetes中的网络模式解析.md)
- 7.0 Kubernetes存储配置
  - [7.1 使用glusterfs做持久化存储](17-使用glusterfs做持久化存储.md)
- 8.0 集群运维管理
  - [8.1 服务滚动升级](19-服务滚动升级.md)
  - [8.2 应用日志收集](21-应用日志收集.md)
- 9.0 Kubernetes领域应用
  - 9.1 Spark on Kubernetes TODO
- [10.0 问题记录](issues.md)

## 说明

文中涉及的配置文件和代码链接在gitbook中会无法打开，请下载github源码后，在MarkDown编辑器中打开，点击链接将跳转到你的本地目录，推荐使用[typaro](www.typorai.o)。

[Kubernetes集群安装部分](00-kubernetes安装前言.md)（1.0-1.10章节）在[opsnull](https://github.com/opsnull/follow-me-install-kubernetes-cluster)的基础上进行了编辑、修改和整理而成。

## 如何使用

**在线浏览**

访问gitbook：https://www.gitbook.com/book/rootsongjc/kubernetes-handbook/

**本地查看**

1. 将代码克隆到本地
2. 安装gitbook：[Setup and Installation of GitBook](https://github.com/GitbookIO/gitbook/blob/master/docs/setup.md)
3. 执行gitbook serve
4. 在浏览器中访问http://localhost:4000
5. 生成的文档在`_book`目录下

**生成pdf**

[下载Calibre](http://calibre-ebook.com/download)

- On Mac

在Mac下安装后，使用该命令创建链接

```
ln -s /Applications/calibre.app/Contents/MacOS/ebook-convert /usr/local/bin
```

在该项目目录下执行以下命令生成`kubernetes-handbook.pdf`文档。

```
gitbook pdf . ./kubernetes-handbook.pdf
```

- On Windows

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

[opsnull](http://github.com/opsnull)

