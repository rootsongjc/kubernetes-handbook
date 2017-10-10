---
date: "2017-03-23T19:34:33+08:00"
title: "TensorFlow实战（才云郑泽宇著）读书笔记——第二章TensorFlow环境搭建"
draft: false
tags: ["tensorflow","AI","book"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20140810002.jpg", desc: "广州海珠桥 Aug 10,2014"}]
---

> 这是我阅读[才云科技](caicloud.io)郑泽宇的《TensorFlow实战Google深度学习框架》的读书笔记系列文章，按照文章的章节顺序来写的。整本书的笔记归档在[这里](https://jimmysong.io/tags/tensorflow-practice-reading-notes/)。

P.S 本书的**官方读者交流微信群（作者也在群里）**已经超过100人，您可以先加我微信后我拉您进去，我的二维码在[这里](rootsongjc.github.io/about)，或者直接搜索我的微信号jimmysong。

睇完这一章后应该就可以自己搭建出一个TensorFlow的环境，我之前在docker里玩过，镜像比较大，下载慢一点，不过用起来很方便，如果你仅仅是想试用一下TensorFlow，看看它能干什么的话，可以直接在docker里试用一下。在Mac上安装的详细步骤，[官方安装说明文档](https://www.tensorflow.org/install/install_mac)。

## 2.1 TensorFlow的主要依赖包

TensorFlow主要用到以下两个依赖：

- [Protocol buffer](https://developers.google.com/protocol-buffers/)：数据结构化工具。Google开源的结构化数据格式，用于网络传输数据时候的序列化和反序列化，使用的时候需要先定义schema，[github地址](https://github.com/google/protobuf)。分布式TensorFlow使用到额gRPC也是使用Protocol Buffer来组织的，
- [Bazel](https://bazel.build/):自动化编译构建工具。Google开源的，[github地址](https://github.com/bazelbuild/bazel)，它支持多语言、多平台、可重复编译和可伸缩，构建大型软件速度也是很快的。Bazel使用**项目空间**的形式管理编译的，每个项目空间需要包含[BUILD文件](https://github.com/tensorflow/tensorflow/blob/master/bower.BUILD)（定义编译目标）和[WORKSPACE](https://github.com/tensorflow/tensorflow/blob/master/WORKSPACE)文件（定义编译的依赖环境）。这两个文件都有点类似python语法。

## 2.2 TensorFlow安装

TensorFlow的安装方式包括docker镜像、pip安装、源码编译安装。

<u>我选择最方便的docker镜像方式</u>，其他方式对本地环境做很多配置，折腾起来比较麻烦。

我早就在docker中安装过TensorFlow0.9小试过牛刀。现在[1.0.1版本](https://github.com/tensorflow/tensorflow/releases)已经released了。TensorFlow的所有版本都有对应的docker镜像发布在[docker hub](https://hub.docker.com/r/tensorflow/tensorflow/tags/)，可以直接`docker pull`安装。

为了和书中所用的镜像保持统一，我将使用caicloud提供的镜像，基于TensorFlow0.12.0（这个版本是2016年12月20日发布的），他们增加了一些其他机器学习工具包和TensorFlow可视化工具TensorBoard。

**docker镜像方式安装**

首先下载镜像，这个image比较大，下载下来比较费时间，我用了差不多15分钟吧。

```shell
docker pull cargo.caicloud.io/tensorflow/tensorflow:0.12.0
```

下载下来后我们再check下这个大小为**1.41GB**镜像的layers。

另外还有个[**nvidia**版本的docker](https://github.com/NVIDIA/nvidia-docker)，可以将你电脑的**GPU**派山用场，我暂时没用到GPU，我电脑装的是`docker17.03-ce`，就不折腾GPU版本的TensorFlow了。

```bash
IMAGE               CREATED             CREATED BY                                      SIZE                COMMENT
c8a8409297f2        5 weeks ago         /bin/sh -c #(nop)  CMD ["/run_tf.sh"]           0 B                 
<missing>           5 weeks ago         /bin/sh -c #(nop) COPY file:78332d36244852...   122 B               
<missing>           5 weeks ago         /bin/sh -c #(nop) COPY dir:8b6ab7d235e3975...   21 MB               
<missing>           5 weeks ago         /bin/sh -c #(nop) COPY dir:fca915671040399...   360 MB              
<missing>           5 weeks ago         /bin/sh -c #(nop) COPY dir:69314aa937be649...   89.9 kB             
<missing>           5 weeks ago         /bin/sh -c rm -rf /notebooks/*                  0 B                 
<missing>           5 weeks ago         /bin/sh -c pip install caicloud.tensorflow      21.4 MB             
<missing>           5 weeks ago         /bin/sh -c pip install -U scikit-learn          39.9 kB             
<missing>           5 weeks ago         /bin/sh -c apt-get update && apt-get insta...   23.9 MB             
<missing>           5 weeks ago         /bin/sh -c #(nop)  ENV LANG=C.UTF-8             0 B                 
<missing>           3 months ago        /bin/sh -c #(nop)  CMD ["/run_jupyter.sh"]      0 B                 
<missing>           3 months ago        /bin/sh -c #(nop)  WORKDIR /notebooks           0 B                 
<missing>           3 months ago        /bin/sh -c #(nop)  EXPOSE 8888/tcp              0 B                 
<missing>           3 months ago        /bin/sh -c #(nop)  EXPOSE 6006/tcp              0 B                 
<missing>           3 months ago        /bin/sh -c #(nop) COPY file:5485384c641ba7...   733 B               
<missing>           3 months ago        /bin/sh -c #(nop) COPY dir:388d24701b3b5bc...   400 kB              
<missing>           3 months ago        /bin/sh -c #(nop) COPY file:822af972b63c44...   1.06 kB             
<missing>           3 months ago        /bin/sh -c pip --no-cache-dir install http...   191 MB              
<missing>           3 months ago        /bin/sh -c pip --no-cache-dir install     ...   379 MB              
<missing>           3 months ago        /bin/sh -c curl -O https://bootstrap.pypa....   11.4 MB             
<missing>           3 months ago        /bin/sh -c apt-get update && apt-get insta...   212 MB              
<missing>           3 months ago        /bin/sh -c #(nop)  MAINTAINER Craig Citro ...   0 B                 
<missing>           9 months ago        /bin/sh -c #(nop) CMD ["/bin/bash"]             0 B                 
<missing>           9 months ago        /bin/sh -c sed -i 's/^#\s*\(deb.*universe\...   1.9 kB              
<missing>           9 months ago        /bin/sh -c rm -rf /var/lib/apt/lists/*          0 B                 
<missing>           9 months ago        /bin/sh -c set -xe   && echo '#!/bin/sh' >...   195 kB              
<missing>           9 months ago        /bin/sh -c #(nop) ADD file:aca501360d0937b...   188 MB 
```

可以看到这是一个基于**Ubuntu**的docker image，这其中还包含了一个**Jupyter notebook**和一些python packages。

使用`docker image history —no-trunc $IMAGE_ID `命令可以看到每一层的详细信息。

**启动TensorFlow**

直接在docker中启动。

```Shell
docker run -it -d -p 8888:8888 -p 6006:6006 --name tf-dev cargo.caicloud.io/tensorflow/tensorflow:0.12.0 
```

启动后进入`localhost:8888`页面，发现登陆jupyter居然还要输入密码，书中没说要输入密码啊，也没说密码是什么，密码在哪里呢？

> 如何获取Jupyter的登录密码书中没有介绍。其实没必要修改镜像活着进入容器中需钙jupyter的配置，直接查看刚启动的`tf-dev`容器的日志即可，里面包含了登录密码。

```Bash
docker logs tf-dev
[I 10:52:46.200 NotebookApp] Writing notebook server cookie secret to /root/.local/share/jupyter/runtime/notebook_cookie_secret
[W 10:52:46.244 NotebookApp] WARNING: The notebook server is listening on all IP addresses and not using encryption. This is not recommended.
[I 10:52:46.267 NotebookApp] Serving notebooks from local directory: /notebooks
[I 10:52:46.267 NotebookApp] 0 active kernels 
[I 10:52:46.267 NotebookApp] The Jupyter Notebook is running at: http://[all ip addresses on your system]:8888/?token=e64afc31eec843717733d6e4527aecf833ce18383214dc47
[I 10:52:46.267 NotebookApp] Use Control-C to stop this server and shut down all kernels (twice to skip confirmation).
Starting TensorBoard 39 on port 6006
```

看到了吗，`tf-dev`容器的日志输出里就包括了密码，我的容器的jupyter的密码是**token后面的那个字符串**

```ini
e64afc31eec843717733d6e4527aecf833ce18383214dc47
```

现在用刚才从日志里看到的密码就可以登录了，Jupyter页面上可以看到本书所有章节的代码了。

![jupyter页面](https://res.cloudinary.com/jimmysong/image/upload/images/tensorflow-practice-chapter2-jupyter-web.jpg)

**使用pip安装**

另外我在mac上也用pip方式安装了。我安装的是最新版的1.0.1的CPU-only，加上`—user -U`是为了规避mac上的各种权限问题。

```shell
pip install --upgrade tensorflow --user -U
```

下载的整个软件包只有39.3MB，速度还是很快的。
