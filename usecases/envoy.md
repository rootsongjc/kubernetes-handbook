# Envoy

[Envoy](https://github.com/envoyproxy/envoy) 是一款由 Lyft 开源的，使用 C++ 编写的 L7 代理和通信总线，目前是 [CNCF](https://cncf.io) 旗下的开源项目，代码托管在 GitHub 上，它也是 [Istio](https://istio.io) service mesh 中默认的 data plane。

## 特性

Envoy 包括如下特性：

- 进程外架构，不侵入应用进程
- 使用现代版 C++11 代码
- L3/L4 filter 架构
- HTTP L7 filter 架构
- 支持 HTTP/2
- HTTP L7 routing
- 支持 gRPC
- 支持 MongoDB L7
- 动态配置
- 最佳可观测性
- 支持 front/edge proxy
- 高级负载均衡
- 健康检查
- 服务发现
- 支持 DynamoDB L7

## 更多

Envoy 本身无法构成一个完整的 Service Mesh，但是它可以作为 service mesh 中的应用间流量的代理，负责 service mesh 中的数据层。

更多信息请参考 [Envoy 官网](https://www.envoyproxy.io/)。