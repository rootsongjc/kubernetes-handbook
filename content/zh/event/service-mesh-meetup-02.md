---
title: "Service Mesh Meetup #2 北京站"
date: 2018-07-29T13:00:00+08:00
draft: false
# page title background image
bg_image: "images/backgrounds/page-title.jpg"
# meta description
description : "第二届 Service Mesh Meetup，2018 年 7 月 29 日，中国北京。"
# Event image
image: "images/events/service-mesh-meetup-02-beijing.jpg"
# location
location: "中国北京"
# entry fee
fee: "免费"
topic: "Service Mesh"
sponsor : "[ServiceMesher](https://www.servicemesher.com)"
# apply url
apply_url : "http://www.itdks.com/eventlist/detail/2455"
# event speaker
speaker:
  # speaker loop
  - name : "张亮"
    image : "images/event-speakers/zhangliang.jpg"
    designation : "京东金融数据研发负责人"

  # speaker loop
  - name : "吴晟"
    image : "images/event-speakers/wusheng.png"
    designation : "比特大陆, 资深技术专家; Apache SkyWalking 原创者"

  # speaker loop
  - name : "朵晓东"
    image : "images/event-speakers/duoxiaodong.jpg"
    designation : "蚂蚁集团高级技术专家"

  # speaker loop
  - name : "丁振凯"
    image : "images/event-speakers/dingzhenkai.jpg"
    designation : "新浪微博搜索架构师"

# type
type: "event"
---

### 关于本次活动

时间：2018年7月29日（星期日）下午 1:00 - 5:30

地点：北京市海淀区中关村大街11号e世界财富中心A座B2

视频回放：http://www.itdks.com/eventlist/detail/2455

PPT下载：https://github.com/servicemesher/meetup-slides

## 讲师与演讲话题

**张亮（京东金融数据研发负责人）：Service Mesh的延伸 —— 论道Database Mesh**

个人简介：张亮，京东金融数据研发负责人。热爱开源，目前主导两个开源项目Elastic-Job和Sharding-Sphere(Sharding-JDBC)。擅长以java为主分布式架构以及以Kubernetes和Mesos为主的云平台方向，推崇优雅代码，对如何写出具有展现力的代码有较多研究。2018年初加入京东金融，现担任数据研发负责人。目前主要精力投入在将Sharding-Sphere打造为业界一流的金融级数据解决方案之上。

随着Service Mesh概念的推广与普及，云原生、低接入成本以及分布式组件下移等理念，已逐渐被认可。在Service Mesh依旧处于高速迭代的发展期的同时，以它的理念为参考，其他的Mesh思想也在崭露萌芽。 Database Mesh即是Service Mesh的其中一种延伸，虽然理念与Service Mesh相近，但数据库与无状态的服务却有着巨大的差别。Database Mesh与分布式数据库（如NoSQL和NewSQL）的功能范畴并非重叠而是互补，它更加关注数据库之上的中间啮合层。本次将与您一起交流Database Mesh的一些思考，以及探讨如何与现有产品相结合，实现更加强大与优雅的云原生数据库解决方案。

---

**吴晟（Apache SkyWalking创始人）：Observability on Service Mesh —— Apache SkyWalking 6.0**

个人简介：Apache SkyWalking 创始人，PPMC和Committer，比特大陆资深技术专家，[Tetrate.io](http://tetrate.io/) Founding Engineer，专注APM和自动化运维相关领域。Microsoft MVP。CNCF OpenTracing标准化委员会成员。Sharding-Sphere PMC 成员。

APM在传统意义上，都是通过语言探针，对应用性能进行整体分析。但随着Cloud Native, K8s容器化之后，以Istio为代表的Service Mesh的出现，为可观测性和APM提供了一种新的选择。SkyWalking作为传统上提供多语言自动探针的Apache开源项目，在service mesh的大背景下，也开始从新的角度提供可观测性支持。

SkyWalking和Tetrate Inc. Istio核心团队合作，从Mixer接口提取遥感数据，提供SkyWalking语言探针一样的功能，展现service mesh风格探针的强大力量。之后，也会和更多的mesh实现进行合作，深入在此领域的运用。

---

**朵晓东（蚂蚁集团，高级技术专家）：蚂蚁集团开源的Service Mesh数据平面SOFA MOSN深层揭秘**

个人简介：蚂蚁集团高级技术专家，专注云计算技术及产品。Apache Kylin创始团队核心成员；蚂蚁金融云PaaS创始团队核心成员，Antstack网络产品负责人；SOFAMesh创始团队核心成员。

Service Mesh技术体系在蚂蚁落地过程中，我们意识到Mesh结合云原生在多语言，流量调度等各方面的优势，同时面对蚂蚁内部语言体系与运维构架深度融合，7层流量调度规则方式复杂多样，金融级安全要求等诸多特征带来的问题和挑战，最终选择结合蚂蚁自身情况自研Golang版本数据平面MOSN，同时拥抱开源社区，支持作为Envoy替代方案与Istio集成工作。本次session将从功能、构架、跨语言、安全、性能、开源等多方面分享Service Mesh在蚂蚁落地过程中在数据平面的思考和阶段成果。

---

**丁振凯（新浪微博，微博搜索架构师）：微博Service Mesh实践 - WeiboMesh**

个人简介：微博搜索架构师，主要负责搜索泛前端架构工作。主导搜索结果和热搜榜峰值应对及稳定性解决方案，以及微服务化方案落地。在Web系统架构方面拥有比较丰富的实践和积累。喜欢思考，深究技术本质。去年十一鹿晗关晓彤事件中一不小心成为网红工程师，并成功登上自家热搜榜。

WeiboMesh源自于微博内部对异构体系服务化的强烈需求以及对历史沉淀的取舍权衡，它没有把历史作为包袱，而是巧妙的结合自身实际情况完成了对Service Mesh规范的实现。目前WeiboMesh在公司内部已经大规模落地，并且已经开源，WeiboMesh是非常接地气的Service Mesh实现。本次分享主要介绍微博在跨语言服务化面临的问题及WeiboMesh方案介绍，并结合业务实例分析WeiboMesh的独到之处。
