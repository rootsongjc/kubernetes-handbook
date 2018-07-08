---
date: "2017-06-06T22:23:54+08:00"
title: "Cloud Native Go - 基于Go和React的web云原生应用构建指南"
subtitle: "Kevin Hoffman & Dan Nemeth著 宋净超 吴迎松 徐蓓 马超 译"
draft: false
description: "Cloud Native Go 图书 电子工业出版社 Kevin Hoffman Dan Nemeth 云原生 Cloud Native React Web应用"
categories: "cloud-native"
notoc: true
tags:  ["book","go","microservices","cloud-native"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20160326003.jpg", desc: "北京植物园桃花 Mar 26,2016"}]
---

Kevin Hoffman和Dan Nemeth著的《Cloud Native Go - 基于Go和React的web云原生应用构建指南》已由**电子工业出版社**出版。

![Cloud Native Go 宋净超](https://ws1.sinaimg.cn/large/00704eQkgy1fs4t18v1vyj30m80t0tm3.jpg)

**扫码购买**

![Cloud Native Go购买地址](https://ws1.sinaimg.cn/large/00704eQkly1fs1e91nn4pj308c08cmx7.jpg)

## 简介

Cloud Native Go向开发人员展示如何构建大规模云应用程序，在满足当今客户的强大需求的同时还可以动态扩展来处理几乎任何规模的数据量、流量或用户。

Kevin Hoffman和Dan Nemeth详细描述了现代云原生应用程序，阐明了与快速、可靠的云原生开发相关的因素、规则和习惯。他们还介绍了Go这种“简单优雅”的高性能语言，它特别适合于云开发。

在本书中你将使用Go语言创建微服务，使用ReactJS和Flux添加前端Web组件，并掌握基于Go的高级云原生技术。Hoffman和Nemeth展示了如何使用Wercker、Docker和Dockerhub等工具构建持续交付管道; 自动推送应用程序到平台上; 并系统地监控生产中的应用程序性能。

-  学习“云之道”：为什么开发好的云软件基本上是关于心态和规则
-  了解为什么使用Go语言是云本地微服务开发的理想选择
-  规划支持持续交付和部署的云应用程序
-  设计服务生态系统，然后以test-first的方式构建它们
-  将正在进行的工作推送到云
-  使用事件源和CQRS模式来响应大规模和高吞吐量
-  安全的基于云的Web应用程序：做与不做的选择
-  使用第三方消息传递供应商创建响应式云应用程序
-  使用React和Flux构建大规模，云友好的GUI
-  监控云中的动态扩展，故障转移和容错

章节简介如下图。

![Cloud Native Go各章节简介](https://res.cloudinary.com/jimmysong/image/upload/images/cloud-native-go-abstract.png)

## 关于作者

**Kevin Hoffman**通过现代化和以多种不同语言构建云原生服务的方式帮助企业将其应用程序引入云端。他10岁时开始编程，在重新组装的CommodoreVIC-20上自习BASIC。从那时起，他已经沉迷于构建软件，并花了很多时间学习语言、框架和模式。他已经构建了从遥控摄影无人机、仿生性安全系统、超低延迟金融应用程序到移动应用程序等一系列软件。他在构建需要与Pivotal Cloud Foundry配合使用的自定义组件时爱上了Go语言。

Kevin 是流行的幻想书系列（[The Sigilord Chronicles](http://amzn.to/2fc8iES) ）的作者，他热切地期待着最终能够将自己对构建软件的热爱与对构建幻想世界的热爱结合起来。

**Dan Nemeth**目前在Pivotal担任咨询解决方案架构师，负责支持Pivotal Cloud Foundry。他从Commodore 64开始就一直在开发软件，从1995年起开始专业编码，使用ANSIC编写了用于本地ISP的CGI脚本。从那时起，他职业生涯的大部分时间里是作为独立顾问为从金融到制药行业提供解决方案，并使用当时流行的各种语言和框架。Dan最近接受了Go作为自己的归宿，并热情地将它用于所有的项目。

如果你发现Dan没在电脑前，他很可能就是在靠近安纳波利斯的水域玩帆船或飞钓。

下面先罗列下目录，以飨读者。

## 目录

### 云之道.. 1

云之道的优点.. 2

遵循简单.. 2

测试优先，测试一切.. 3

尽早发布，频繁发布.. 5

自动化一切.. 6

建立服务生态系统.. 7

为什么使用Go. 8

简单.. 8

开源.. 8

易于自动化和IDE自由化.. 8

本章小结.. 9

### 2  开始.. 11

正确的工具.. 11

配置Git 12

安装Homebrew. 12

安装Git客户端.. 13

安装Mercurial和Bazaar 13

创建Github账户.. 14

创建Go环境.. 14

配置Go工作区.. 14

检查环境.. 15

本章小结.. 16

### 3  Go入门.. 17

建立Hello Cloud. 18

使用基本函数.. 19

使用结构体.. 22

介绍Go接口.. 25

向结构体添加方法.. 25

Go中的接口动态类型检查.. 26

使用第三方包.. 28

创建自有包.. 30

导出函数和数据.. 31

创建包.. 31

本章小结.. 34

### 4  持续交付.. 35

Docker介绍.. 36

为什么要使用Docker 36

安装Docker 36

运行Docker镜像.. 38

与Wercker的持续集成.. 39

持续集成的最佳实践.. 39

为什么使用Wercker 40

创建Wercker应用程序.. 41

安装Wercker CLI 42

创建Wercker配置文件.. 43

使用Wercker进行构建.. 48

部署到DockerHub. 50

读者练习：创建完整的开发管道.. 51

高级挑战：集成第三方库.. 53

本章小结.. 53

### 5  在Go中构建微服务.. 55

设计API First的服务.. 55

设计Matches API 56

创建APIBlueprint 56

通过Apiary测试和发布文档.. 58

架设微服务.. 59

构建Test First的服务.. 62

创建第一个失败测试.. 63

测试LocationHeader 66

壮丽的蒙太奇：迭代测试.. 67

在云端部署和运行.. 70

创建PWS帐户.. 70

配置PCF开发环境.. 70

提交到Cloud Foundry. 71

本章小结.. 72

### 6  运用后端服务.. 75

设计服务系统.. 75

测试优先构建依赖服务.. 77

构建Fulfillment服务.. 78

构建Catalog服务.. 81

在服务之间共享结构化数据.. 87

客户端引用服务端包.. 88

客户端复制服务端结构.. 88

客户端与服务端引用共享包.. 89

使用服务捆绑来外部化地址与元数据.. 90

服务发现.. 93

动态服务发现.. 94

Netflix的服务发现系统Eureka 94

读者练习.. 97

进阶操作.. 97

本章小结.. 98

### 7  构建数据服务.. 99

构建MongoDB存储库.. 100

为什么选择MongoDB. 100

更新存储库模型.. 100

通过Go来操作MongoDB. 101

以Test-First方式编写MongoDB存储库.. 102

集成测试一个Mongo-Backed服务.. 107

集成临时MongoDB数据库.. 108

编写一个集成测试.. 110

在云中运行.. 115

后端服务的配置.. 115

本章小结.. 117

### 8  事件溯源和CQRS. 119

现实源自事件.. 120

幂等.. 121

隔离.. 121

可测试.. 122

可再现，可恢复.. 123

大数据.. 123

拥抱最终一致性.. 123

CQRS（命令查询责任分离）简介.. 124

事件溯源案例.. 126

天气监测.. 126

互联网汽车.. 127

社交媒体消息处理.. 127

代码示例：管理无人机舰队.. 128

构建命令处理程序服务.. 129

介绍RabbitMQ. 129

构建命令处理器服务.. 133

构建事件处理器.. 135

对事件处理器进行集成测试.. 140

构建查询处理程序服务.. 140

本章小结.. 141

### 9  使用Go构建web应用程序.. 143

处理静态文件和asset 143

支持JavaScript客户端.. 145

使用服务端模板.. 148

处理表单.. 150

使用cookies和会话状态.. 151

写入cookies 152

读取cookies 153

使用Wercker构建和部署.. 153

本章小结.. 155

### 10  云安全.. 157

保护Web应用程序.. 157

应用程序安全性选项.. 158

设置Auth0账户.. 159

构建一个OAuth安全的Web应用程序.. 160

运行安全的Web应用程序.. 164

保护微服务.. 166

客户端凭据模式概述.. 166

使用客户端凭据保护微服务.. 168

关于SSL的注意事项.. 169

隐私和数据安全.. 170

黑客不能得到你没有的.. 170

读者练习.. 172

本章小结.. 173

### 11  使用WebSockets. 175

WebSockets解析.. 175

WebSockets如何工作.. 176

WebSockets与服务器发送事件对比.. 177

设计WebSockets服务器 . 177

WebSockets的云原生适应性.. 178

使用消息服务创建WebSockets应用.. 180

关于JavaScript框架.. 183

运行WebSockets示例.. 183

本章小结.. 184

### 12  使用React构建Web视图.. 185

JavaScript的形势 . 186

为什么选择React 186

虚拟DOM.. 187

组件组合.. 187

响应式数据流.. 188

集中焦点.. 188

使用的便利性.. 189

React应用程序剖析.. 189

package.json文件.. 189

Webpack.config.js 文件.. 191

.babelrc文件.. 191

理解JSX和Webpack. 191

React组件.. 192

构建简单的React应用程序.. 192

不赞成的做法.. 199

测试React应用程序.. 200

进一步阅读.. 200

React网站.. 200

React书籍.. 201

其他资料 . 201

本章小结 . 201

### 13  使用Flux构建可扩展的UI 203

Flux介绍.. 203

dispatcher 204

store 204

view. 205

action. 205

source 205

Flux的复杂性.. 205

创建Flux应用程序.. 206

本章小结.. 215

### 14  创建完整应用World of FluxCraft 217

World of FluxCraft介绍.. 218

架构概览.. 219

独立扩展、版本控制和部署.. 221

数据库不是集成层.. 221

单向不可变数据流.. 221

Flux GUI 222

Go UI宿主服务.. 223

玩家移动时序图.. 224

命令处理.. 225

事件处理.. 226

维持现实服务的状态.. 227

地图管理.. 227

自动验收测试.. 228

本章小结.. 230

### 15  结论.. 231

我们学到了什么.. 231

Go不是小众语言.. 231

微服务应该有多“微” 232

持续交付和部署.. 232

测试一切.. 232

尽早发布，频繁发布.. 232

事件溯源、CQRS和更多首字母缩略词.. 233

下一步.. 233

### 附录A  云应用的故障排查.. 235

### 索引.. 239

*本文最后更新于2017年6月24日*
