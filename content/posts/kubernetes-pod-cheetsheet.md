---
date: "2017-06-24T14:20:39+08:00"
draft: false
categories: "kubernetes"
title: "Kubernetes Pod Cheat Sheet——Pod数据结构参考图"
tags: ["kubernetes","cheatsheet"]
---

昨天晚上构思，今天花了一上午的时间翻阅了下[kubernetes api reference](https://kubernetes.io/docs/api-reference/v1.6)，画了一个Kubernetes Pod Cheat Sheet。

从Pod的数据结构和API入手，管中窥豹，可见一斑。通过该图基本可以对kubernetes中这个最基本的object——Pod的功能和配置有一个感性的认识了，也许具体的某个组件的实现你不了解，但是从high level的视角来看待Pod整体有助于今后深入研究某个feature。

该图是根据kubernetes 1.6版本的Pod v1 core API绘制。

![kubernetes pod cheatsheet](https://res.cloudinary.com/jimmysong/image/upload/images/kubernetes-pod-cheatsheet-v1-20170624-01.png)

图片归档在[kubernetes-handbook](https://github.com/rootsongjc/kubernetes-handbook/blob/master/images/kubernetes-pod-cheatsheet.png),请以GitHub中的图片为准。

注：在移动设备上打开该链接后会提示<u>图片太大无法查看</u>请选择**Desktop version**方可查看原图。

今后我将陆续推出其他object的cheat sheet，敬请关注。
