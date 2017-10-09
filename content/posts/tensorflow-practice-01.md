---
date: "2017-03-20T22:04:33+08:00"
title: "TensorFlow实战（才云郑泽宇著）读书笔记——第一章深度学习简介"
draft: false
tags: ["tensorflow","AI","book","tensorflow"]
---

![tensorflow实战图书封面](https://res.cloudinary.com/jimmysong/image/upload/images/tensorflow-book-page.jpg)

*（题图：TensofFlow实战图书封面）*

*🙏电子工业出版社编辑赠书，能够这么快的拿到这本书，也🙏[才云科技](www.caicloud.io)的郑泽宇大哥耐心的写了这本书，能够让我等小白一窥深度学习的真容。另外要强烈推荐下这本书，这是本TensorFlow深度学习很好的入门书。书中提供的代码[下载地址](https://github.com/caicloud/tensorflow-tutorial)，整本书的笔记归档在[这里](https://jimmysong.io/tags/tensorflow-practice-reading-notes)。*

P.S 本书的**官方读者交流微信群（作者也在群里）**已经超过100人，您可以先加我微信后我拉您进去，我的二维码在[这里](rootsongjc.github.io/about)，或者直接搜索我的微信号jimmysong。

## 1.1 人工智能、机器学习与深度学习

这一节是讲解三者之间的关系。

首先以**垃圾邮件分类问题**引入机器学习的**逻辑回归算法**。

逻辑回归算法的准确性取决于训练数据中的特征的提取，以及训练的数据数量。

文章中又提了一个从实体中提取特征的例子：通过笛卡尔坐标系活极角坐标系来表示不同颜色的点，看看能否用一条直线划分。这个例子用来说明**一旦解决了数据表达和特征提取，很多人工智能的问题就能迎刃而解**。

深度学习是机器学习的一个分支，除了能够学习特征和任务之间的关联之外，还能**自动从简单特征中提取更加复杂的特征**，这是其区别于机器学习的关键点。

总的来说，人工智能>机器学习>深度学习。

## 1.2深度学习的发展历程

本节介绍了深度网络历史的三个发展阶段。

2012年的**ImageNet**图像分类竞赛上，深度学习系统**AlexNet**赢得冠军，自此深度学习作为深层神经网络的代名词而被人熟知。

## 1.3深度学习的应用

这一节讲的是深度学习的应用，首先还是从ImageNet的图像识别开始，应用到了OCR（提到了卷积神经网络）、语音识别（提到了混合搞高斯模型）、自然语言处理（提到了语料库、单词向量、机器翻译、情感分析）、人机对弈（提到了AlphaGO）。

## 1.4 深度学习工具介绍与对比

TensorFlow的渊源是Google大脑团队在2011年开发，在内部使用的**DistBelief**，并赢得了ImageNet 2014年的比赛，TF是其开源版本，还发表了一篇论文`TensorFlow: Large-Scale Machine Learning on Heteogeneous Distributed systems`，这就跟当年的**HDFS**、**MapReduce**一个套路啊。

Google还把它用来做**RankBrain**和很多其他的产品线上使用。

当然，还有很多其他的深度学习工具，比如**Caffe**、**Deeplearning4j**、**Torch**等不一而足。从各种指标来看，TensorFlow都是目前最受关注的深度学习框架。

