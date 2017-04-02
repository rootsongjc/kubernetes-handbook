+++
date = "2017-04-02T20:27:00+08:00"
title = "两个图片处理工具——Google Guetzli和基于AI的Deep Photo Style Transfer"
draft = false
Tags = ["picture","tools"]

+++

## 前言

如果你看过美剧「硅谷」会记得剧中主角们所在的创业公司[PiedPipper](www.piedpiper.com)，他们就是靠自己发明的视频压缩算法来跟大公司Hooli竞争的，这部剧现在已经发展到第4季，在[腾讯视频](http://v.qq.com/detail/d/dr2zn76oez8tyt4.html?ptag=baidu.aladdin.tv)上可以免费观看。

最近关注了两个**图像处理**的Open Source Projects。

- [Google Guetzli](https://github.com/google/guetzli) 图像压缩工具
- [Luan Fujun's Deep Photo Style Transfer](https://github.com/luanfujun/deep-photo-styletransfer) 图像style转换工具

## Google Guetzli

我在Mac上试用了一下，安装很简单，只要一条命令：

```shlell
brew install guetzli
```

但是当我拿一张`22M`大小的照片使用guetzli压缩的时候，我是绝望的，先后三次kill掉了进程。

**因为实在是太慢了**，也能是我软件对内存和CPU的利用率不高，效果你们自己看看。

原图是这个样子的，拍摄地点在景山上的，俯瞰紫禁城的绝佳位置。

![原图](http://olz1di9xf.bkt.clouddn.com/guetzli/IMG_5430.JPG)

```
guetzli --quality 84 --verbose 20160403052.jpg output.jpg
```

为什么quality要设置成84呢？因为只能设置为84+的quality，如果要设置的更低的话需要自己修改代码。

![process](http://olz1di9xf.bkt.clouddn.com/guetzli/IMG_5429.JPG)

耗时了一个小时，后台进程信息。

![后台进程](http://olz1di9xf.bkt.clouddn.com/guetzli/IMG_5428.JPG)

这个是使用**Squash**压缩后的大小效果，压缩每张照片差不多只要3秒钟。

> Squash的logo就是个正在被剥皮的🍊，这是[下载地址](http://xclient.info/s/squash.html)。

压缩比分别为`70%`和`30%`。

![Img](http://olz1di9xf.bkt.clouddn.com/guetzli/IMG_5434.JPG)

**压缩比70%后的细节放大图**

![70](http://olz1di9xf.bkt.clouddn.com/guetzli/IMG_5432.JPG)

**压缩比30%的细节放大图**

![30](http://olz1di9xf.bkt.clouddn.com/guetzli/IMG_5433.JPG)

你看出什么区别了吗？反正我是没有。

下面再来看看耗时一个小时，千呼万唤始出来的guetzli压缩后的效果和使用squash压缩比为30%的效果对比。

![对比](http://olz1di9xf.bkt.clouddn.com/img/guetzli/FullSizeRender.jpg)

左面是使用guetzli压缩后（4.1M），右面使用的squash压缩后（3.1M）的照片。

*似乎还是没有什么区别啊？你看出来了吗？*

### Guetzli总结

可能是我使用Guetzli的方式不对，但是命令行里确实没有设置CPU和内存资源的选项啊，为啥压缩照片会这么慢呢？效果也并不出彩，不改代码的话照片质量只能设置成84以上，但是这个是**Open Source**的，使用的C++开发，可以研究下它的图像压缩算法。

# Deep Photo Style Transfer 

来自康奈尔大学的Luan Fujun开源的图像sytle转换工具，看了[README](https://github.com/luanfujun/deep-photo-styletransfer)的介绍，真的很惊艳，市面上好像还没有这种能够，给定任意一张照片，自动将另一张照片转换成该照片的style。

这个工具使用Matlab和Lua开发，基于[Torch](https://github.com/torch/torch7)运行的时候需要[CUDA](https://developer.nvidia.com/cuda-downloads)，[cudnn](https://developer.nvidia.com/cudnn)，[Matlab](https://www.mathworks.com/)，环境实在太复杂，就没折腾，启动有人发布[Docker镜像](https://github.com/luanfujun/deep-photo-styletransfer/issues/29)，已经有人提了issue。

如果它能够被商用，绝对是继**Prisma**后又一人工智能照片处理应用利器。