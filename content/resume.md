+++

date = "2017-03-01T22:21:21+08:00"

title = "Jimmy Song's Resume"

Description = " Jimmy Song's Resume"

+++


# $whoami

![me](https://avatars2.githubusercontent.com/u/3328185?v=3&u=84d2689cef6b2f92a651661b8931f7b09b3cf4c0&s=400)

宋净超  Jimmy Song

男 未婚

出生：1990年

现居：北京

籍贯：山东威海

学历：大学本科

毕业：武汉理工大学

专业：软件工程

微信：jimmysong

手机：18514468566

Github: [github.com/rootsonjc](https://github.com/rootsongjc)

Blog：[rootsongjc.github.io](http://rootsongjc.github.io)

## 自我介绍

Geek，热爱分享和写作，早年混迹Hadoop生态圈（2013-2015），后来（2015年末至今）沉浸于容器生态圈不能自拔，现在正研究kubernetes和CNCF组件，期待容器技术能为企业带来管理的变革、效率的提高、成本的改善。电子工业出版社[Cloud Native Go](http://rootsongjc.github.io/talks/cloud-native-go/)图书译者，先后在Qcon上海2016[大数据应用优化与实践](http://www.infoq.com/cn/presentations/yarn-on-docker-container-technology-in-big-data-scenarios?utm_campaign=rightbar_v2&utm_source=infoq&utm_medium=presentations_link&utm_content=link_text)、[上海全球微服务架构大会](http://msa-summit.com/)做大数据集群和微服务相关主题分享，参与了2016年云栖大会[大规模容器集群的管理与调度](https://yunqi.aliyun.com/2016/hangzhou/schedule?spm=5176.8098788.535884.3.NYPF3E)的圆桌论坛。

## 技能树

![tree](http://olz1di9xf.bkt.clouddn.com/jimmy-tech-tree.png)



## 工作经历

### TalkingData

<u>大数据及云计算工程师</u>

2015.07至今

- 负责TalkingData大数据平台数十PB数据的管理。
- 主导完成了TakingData大数据集群Docker虚拟化项目[yarn on docker](http://rootsongjc.github.io/projects/yarn-on-docker/)，目前正在进行微服务化的推广。

### 科大讯飞（sz.002230）  

<u>软件开发工程师</u>

2013.07-2015.07

- 个性化数据同步系统开发。
- 讯飞大数据管理平台[maple](http://www.infoq.com/cn/articles/build-big-data-open-platform)开发。
- 讯飞语音云Hadoop集群建设

## 项目经验

**2016.08至2016.12：微服务和Paas平台建设**

项目描述：构建基于Docker的微服务平台。

- Docker版本选型：docker1.11
- Docker网络选型：[Shrike](https://github.com/rootsongjc/docker-ipam-plugin)自研网络插件。
- Docker镜像制作：制定镜像制作流程，优化镜像制作过程，探究镜像使用技巧。
- 私有仓库搭建：harbor。

**2016.01至2016.07：Hadoop计算资源虚拟化**

项目描述：为了实现Hadoop的计算资源隔离与弹性调度，使用Docker虚拟化技术。

- Docker集群管理工具：[Magpie](https://github.com/rootsongjc/magpie )
- [Yarn on docker——大数据集群的计算资源虚拟化](http://rootsongjc.github.io/projects/yarn-on-docker/)

**2015.08至2015.12：Hadoop管理与优化**

项目描述：负责TalkingData几个Hadoop管理、迁移、升级与优化。

- Hadoop集群监控管理平台开发：使用技术`Java`、`Play Framework`、`High-chart`、`JavaScript`、`Bootstrap`、`Cassandra`。
- Hadoop集群的迁移与升级：升级到版本CDH5.5.2，使用Cloudera Manager管理。

**2015.01至2015.07：Hadoop集群升级**

项目描述：升级公司原来的Hadoop集群到CDH5并增加安全性配置。

- CDH5新特性调研
- Hadoop新集群搭建
- Hadoop安全性配置
- Hadoop集群参数优化

**2014.08至2014.12：大数据运维管理平台开发**

项目描述：BDWS（BigData WorkStation）之Hadoop运维管理平台开发。

- 使用python基于Django框架和puppet工具完成Hadoop集群的自动部署，监控和运维。
- 负责Django后台的python代码和shell自动执行脚本、puppet module的编写，puppet和puppet dashboard环境搭建，实现通过Web页面管理主机同时为主机创建Hadoop角色并自动分发配置文件。  

**2014.03至2014.07：个性化数据同步**

项目描述：同步北京、合肥、广州三地的用户的个性化数据。 数据源客户端个性化数据，目的地mysql、hbase。

- 负责开发公司个性化数据同步组件`RMQRepeater`的研发。
- 消息中间件调研与选型：研究过Kafka、Zookeeper，最终使用淘宝的开源的`RocketMQ`实现。  

**2013.07至2014.02：Hadoop集群监控告警**

项目描述：北京、广州、合肥三地数据分析Hadoop集群的机器和服务监控与告警。 

- 建立和完善公司大数据集群的监控与告警系统：使用Ganglia、Nagios开源软件，监控集群规模约300台。
- 短信告警：使用Shell与 Python监控Hadoop节点状态完成短信告警服务。
- 监控个人用户空间占用与主机磁盘使用率：每日定时运行Java程序将Hadoop集群每个节点的磁盘空间利用率和HDFS个人用户目录的空间占用统计值保存在数据库中再使用Django呈现在Web页面中。