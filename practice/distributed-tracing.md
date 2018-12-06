# 分布式追踪

当我将单体应用拆成多个微服务之后，如何监控服务之间的依赖关系和调用链，以判断应用在哪个服务环节出了问题，哪些地方可以优化？这就需要用到分布式追踪（Distributed Tracing）。

CNCF 提出了分布式追踪的标准 [OpenTracing](https://opentracing.io/)，它提供用厂商中立的 API，并提供 Go、Java、JavaScript、Python、Ruby、PHP、Objective-C、C++ 和 C# 这九种语言的库。

同时 CNCF  中还有个端到端的支持 OpenTracing API 的分布式追踪项目 [Jaeger](https://www.jaegertracing.io/)。

## 参考

- [OpenTracing 官方网站](https://opentracing.io/)
- [Jaeger 官方网站](https://www.jaegertracing.io/)