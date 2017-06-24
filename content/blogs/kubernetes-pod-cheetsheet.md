+++
date = "2017-06-24T14:20:39+08:00"
draft = false
title = "Kubernetes Pod Cheatsheet——Pod数据结构参考图"
Tags = ["kubernetes"]

+++

昨天晚上构思，今天花了一上午的时间翻阅了下[kubernetes api reference](https://kubernetes.io/docs/api-reference/v1.6)，画了一个kubernetes pod cheetsheet。

从Pod的数据结构和API入手，管中窥豹，可见一斑。通过该图基本可以对kubernetes中这个最基本的object——Pod的功能和配置有一个感性的认识了，也许具体的某个组件的实现你不了解，但是从high level的视角来看待Pod整体有助于今后深入研究某个feature。

该图是根据kubernetes 1.6版本的Pod v1 core API绘制。

![kubernetes pod cheetsheet](http://olz1di9xf.bkt.clouddn.com/kubernetes-pod-cheatsheet-v1-20170624.png)

图片归档在[kubernetes-handbook]([https://github.com/rootsongjc/kubernetes-handbook/blob/master/images/kubernetes-pod-cheetsheet.png](https://github.com/rootsongjc/kubernetes-handbook/blob/master/images/kubernetes-pod-cheetsheet.png)),请以GitHub中的图片为准。

今后我将陆续推出其他object的cheat sheet，敬请关注。