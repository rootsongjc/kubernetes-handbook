+++
date = "2017-03-23T19:34:33+08:00"
title = "TensorFlow实战（才云郑泽宇著）读书笔记——第三章TensorFlow入门"
draft = false
Tags = ["tensorflow","deep learning","AI","google","machine learning","reading notes","book","tensorflow practice reading notes"]

+++

![扬州东关](http://olz1di9xf.bkt.clouddn.com/2015052401.jpg)

*（题图：扬州东关 May 24,2015）*

*这是我阅读[才云科技](caicloud.io)郑泽宇的《TensorFlow实战Google深度学习框架》的读书笔记系列文章，按照文章的章节顺序来写的。整本书的笔记归档在[这里](http://rootsongjc.github.io/tags/tensorflow-practice-reading-notes/)。*

这一章从三个角度带大家入门。

分别是TensorFlow的

- 计算模型
- 数据模型
- 运行模型

## 3.1 TensorFlow的计算模型——图计算

**计算图**是TensorFlow中的一个最基本的概念，<u>TensorFlow中的所有计算都会转化成计算图上的节点</u>。

其实TensorFlow的名字已经暗示了它的实现方式了，**Tensor**表示的是数据结构——张量，**Flow**表示数据流——Tensor通过数据流相互转化。

**常用的方法**

- 在python中导入tensorflow：import tensorflow as tf

- 获取当前默认的计算图：tf.get_default_graph()

- 生成新的计算图：tf.Graph()

  ​

