# 微服务架构

Kubernetes 设计之初就是按照 Cloud Native 的理念设计的，Cloud Native 中有个重要概念就是微服务的架构设计，当将单体应用拆分微服务后， 随着服务数量的增多，如何微服务进行管理以保证服务的 SLA 呢？为了从架构层面上解决这个问题，解放程序员的创造性，避免繁琐的服务发现、监控、分布式追踪等事务，Service mesh 应运而生。

## 微服务

下图是[Bilgin Ibryam](https://developers.redhat.com/blog/author/bibryam/)给出的微服务中应该关心的主题，图片来自[RedHat Developers](https://developers.redhat.com/blog/2016/12/09/spring-cloud-for-microservices-compared-to-kubernetes/)。

![微服务关注的部分](../images/microservices-concerns.jpg)

当前最成熟最完整的微服务框架可以说非[Spring](https://spring.io)莫属，而Spring又仅限于Java语言开发，其架构本身又跟Kubernetes存在很多重合的部分，如何探索将Kubernetes作为微服务架构平台就成为一个热点话题。
