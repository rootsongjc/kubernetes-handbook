---
date: "2017-03-30T21:34:33+08:00"
title: "TensorFlow实战（才云郑泽宇著）读书笔记——第三章TensorFlow入门"
draft: false
tags: ["tensorflow","AI","book"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/2015052401.jpg", desc: "扬州东关 May 24,2015"}]
---

*这是我阅读[才云科技](caicloud.io)郑泽宇的《TensorFlow实战Google深度学习框架》的读书笔记系列文章，按照文章的章节顺序来写的。整本书的笔记归档在[这里](https://jimmysong.io/tags/tensorflow-practice-reading-notes/)。*

P.S 本书的**官方读者交流微信群（作者也在群里）**已经超过100人，您可以先加我微信后我拉您进去，我的二维码在[这里](rootsongjc.github.io/about)，或者直接搜索我的微信号jimmysong。

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

书中这里都有例子讲解，可以从Github中[下载代码](https://github.com/caicloud/tensorflow-tutorial)，或者如果你使用才云提供的docker镜像的方式安装的话，在jupyter中可以看到各个章节的代码。

**定义两个不同的图**

```python
import tensorflow as tf

g1 = tf.Graph()
with g1.as_default():
    v = tf.get_variable("v", [1], initializer = tf.zeros_initializer) # 设置初始值为0

g2 = tf.Graph()
with g2.as_default():
    v = tf.get_variable("v", [1], initializer = tf.ones_initializer())  # 设置初始值为1
    
with tf.Session(graph = g1) as sess:
    tf.global_variables_initializer().run()
    with tf.variable_scope("", reuse=True):
        print(sess.run(tf.get_variable("v")))

with tf.Session(graph = g2) as sess:
    tf.global_variables_initializer().run()
    with tf.variable_scope("", reuse=True):
        print(sess.run(tf.get_variable("v")))
```

我们看到这里面用了[python中的with语法](https://www.ibm.com/developerworks/cn/opensource/os-cn-pythonwith/)，不了解的可以到前面那个链接看看。

> with 语句适用于对资源进行访问的场合，确保不管使用过程中是否发生异常都会执行必要的“清理”操作，释放资源，比如文件使用后自动关闭、线程中锁的自动获取和释放等。

**TensorFlow中维护的集合列表**

| 集合名称                                  | 集合内容                | 使用场景              |
| ------------------------------------- | ------------------- | ----------------- |
| tf.GraphKeys.VARIABLES                | 所有变量                | 持久化TensorFlow模型   |
| tf.GraphKeys.TRAINABLE_VARIABLES      | 可学习的变量（一般指神经网络中的参数） | 模型训练、生活从呢个模型可视化内容 |
| tf.GraphKeys.SUMMARIES                | 与日志有关的张量            | TensorFlow计算可视化   |
| tf.GraphKeys.QUEUE_RUNNERS            | 处理输入的QueueRunner    | 输入处理              |
| tf.GraphKeys.MOVING_AVERAGE_VARIABLES | 所有计算了滑动平均值的变量       | 计算变量的滑动平均值        |

*所谓的滑动平均值即移动平均值，熟悉股票的应该都知道均线的概念吧，5日均线，20日均线，30日均线啥的，一般称作MA(Moving Average)。*

## 3.2 TensorFlow数据模型——张量

张量（Tensor）是TensorFlow中所有数据的表现形式。我们可以简单的将Tensor理解为**多维数组**：

- 0阶的话就是一个标量（Scalar），可以是一个数也可以是一个字符串
- 一阶的话是向量（Vector）
- n阶的话就是n维数组

Tensor在TensorFlow中并不是直接采用数组的形式，而是**对TF中计算结果的引用**，保存的是如何得到这些数字的过程。

**举个例子**

```Python
import tensorflow as tf
a = tf.constant([1.0, 2.0], name="a")
b = tf.constant([2.0, 3.0], name="b")
result = tf.add(a,b,name="add")
print result
```

输出结果：

```python
Tensor("add:0", shape=(2,), dtype=float32)
[ 3.  5.]
```

这个例子只是简单的做了个加法，下面结合上面的例子来讲解。

**Tensor的3个属性**：

- **名字（Name）**：Tensor的唯一标识符，如例子中的a, b, result，这是我们手动指定的，实际上Tensor是与计算图上的每个节点一一对应的，tensor的命名可以通过`node:src_output`的形式给出，如例子输出中的计算结果名字为**add:0**，0表示的是计算节点**add**输出的第一个结果。
- **维度（Shape）**：如上面例子结果输出中的**shape=(2,)**，表示这个张量是一维数组，数组的长度是2。
- **类型（Type）**：所有参与运算的张量的类型必须是相同的，比如不能float和int之间运算。TensorFlow会自动检查张量的类型，可以通过**dtype=df.float32**这样的声明来指定类型，如果不指定的话，TF会根据值确定默认类型。

**Tensor的用途**

- 作为对计算中间结果的引用，比如上面例子中的a和b，在复杂计算中使用tensor能够增加代码的可阅读性。
- 用来获取计算结果。张量本身没有存储具体的数字，但是可以使用**会话**的tf.Session().run(result)来获取计算结果。

## 3.3 TensorFlow的运行模型——会话

**会话（Session）拥有和管理TensorFlow中所有的运算，可以执行定义好的运算。**

**创建和关闭会话**

```python
# 创建一个会话。
sess = tf.Session()

# 使用会话得到之前计算的结果。
print(sess.run(result))

# 关闭会话使得本次运行中使用到的资源可以被释放。
sess.close()
```

建议使用Python的**上下文管理器**，即通过**with**语法来创建会话，能够避免资源泄漏。

```python
with tf.Session() as sess:
    print(sess.run(result))
```

在交互式环境下（比如Jupyter）直接使用**tf.InteractiveSession**函数创建**交互式会话**，将产生的会话直接注册为默认会话。

```python
sess = tf.InteractiveSession ()
print(result.eval())
sess.close()
```

不论使用哪种会话都可以通过**ConfigProto**来配置`并行线程数`、`GPU分配策略`、`运算超时时间`等。

常用的两个配置有：

- **allow_soft_placement**：布尔值，默认false，以下任何一个条件满足时则为true，允许将GPU上的运算放到CPU上进行。
  - 运算无法在GPU上运行
  - GPU资源不足（没有GPU或者指定的GPU个数不够）
  - 运算输入包括对CPU计算结果的引用
- **log_device_placement**：布尔值，默认值是？如果为true的话，日志中将会记录每个节点被安排在哪个设备上，这方便调试。生产环境中一般设置为false，能够减少日志量。

## 3.4 TensorFlow实现神经网络

To be continued…

10:39 p.m Thu Mar 30,2017
