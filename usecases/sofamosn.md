# MOSN

 **注意：本书中的 Service Mesh 章节已不再维护，请转到 [istio-handbook](https://www.servicemesher.com/istio-handbook) 中浏览。**

GitHub地址：https://github.com/sofastack/sofa-mosn

MOSN 是一款使用 Go 语言开发的 Service Mesh 数据平面代理，旨在为服务提供分布式、模块化、可观察和智能化的代理能力。MOSN 是 Modular Observable Smart Network 的简称。MOSN 可以与任何支持 xDS API 的 Service Mesh 集成，亦可以作为独立的四、七层负载均衡使用。未来 MOSN 将支持更多云原生场景，并支持 Nginx 的核心转发功能。

## 核心能力

- Istio 集成
  - 集成 Istio 0.8 版本 Pilot V2 API，可基于全动态资源配置运行
- 核心转发
  - 自包含的网络服务器
  - 支持 TCP 代理
  - 支持 TProxy 模式
- 多协议
  - 支持 HTTP/1.1，HTTP/2
  - 支持 SOFARPC
  - 支持 Dubbo 协议（开发中）
  - 支持 HSF 协议（开发中）
- 核心路由
  - 支持 virtual host 路由
  - 支持 headers/url/prefix 路由
  - 支持基于 host metadata 的 subset 路由
  - 支持重试
- 后端管理&负载均衡
  - 支持连接池
  - 支持熔断
  - 支持后端主动健康检查
  - 支持 random/rr 等负载策略
  - 支持基于 host metadata 的 subset 负载策略
- 可观察性
  - 观察网络数据
  - 观察协议数据
- TLS
  - 支持 HTTP/1.1 on TLS
  - 支持 HTTP/2 on TLS
  - 支持 SOFARPC on TLS
- 进程管理
  - 支持平滑 reload
  - 支持平滑升级
- 扩展能力
  - 支持自定义私有协议
  - 支持在 TCP IO 层，协议层面加入自定义扩展

## 参考

- 详细信息请参考[MOSN GitHub仓库](https://github.com/sofastack/sofa-mosn)
