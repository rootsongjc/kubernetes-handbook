# 分布式追踪

当我将单体应用拆成多个微服务之后，它们可能分布在上千个服务器、不同的数据中心和可用区中，如何监控服务之间的依赖关系和调用链，以判断应用在哪个服务环节出了问题，哪些地方可以优化？这就需要用到分布式追踪（Distributed Tracing）。

CNCF 提出了分布式追踪的标准 [OpenTracing](https://opentracing.io/)，它提供用厂商中立的 API，并提供 Go、Java、JavaScript、Python、Ruby、PHP、Objective-C、C++ 和 C# 这九种语言的库。

大部分分布式追踪系统都是根据 Google 的 [Dapper 论文](https://bigbully.github.io/Dapper-translation/) 实现的，比如 CNCF  中还有个端到端的支持 OpenTracing API 的分布式追踪项目 [Jaeger](https://www.jaegertracing.io/)。另外 Apache 基金会项目也有个中国开源的应用性能监控工具 [SkyWalking](https://skywalking.apache.org/) 也可以实现分布式追踪。

## 分布式追踪系统要求

我们对分布式追踪系统的要求如下：

1. **对应用程序的消耗足够低**：一是指占用的系统资源要足够低，二是指造成的延迟要足够低。
2. **对应用程序透明**：为了做到 7x24 小时无所不在的部署，在向应用程序中集成分布式追踪系统时，要让程序员对程序的改动尽可能的小，这样才便于大范围低成本接入。
3. **可扩展**：为了将所有服务接入分布式追踪系统，该系统必须是可以承载大规模服务的可扩展的。

另外还有一些其他要求，比如该系统对产生的追踪数据的处理要尽可能的快，可以方便的对追踪结果进行查询和可视化等。

## 参考

- [OpenTracing 官方网站 - opentracing.io](https://opentracing.io/)
- [Jaeger 官方网站 - jeagertracing.io](https://www.jaegertracing.io/)
- [Apache SkyWalking 官方网站](https://skywalking.apache.org/)
- [Dapper，大规模分布式系统的跟踪系统 - bigbully.github.io](https://bigbully.github.io/Dapper-translation/)
