# Conduit - 基于Kubernetes的轻量级Service Mesh

> **注意**：Conduit在发布0.5版本后已经停止开发，而是合并入Linkerd 2.0，详见[Conduit 0.5发布—以及R.I.P. Conduit](http://www.servicemesher.com/blog/rip-conduit/)。

2017年12月在得克萨斯州的Asdin，KubeCon和CloudNativeCon上，创造了Service Mesh这个词汇并开源了[Linkerd](https://linkerd.io)的公司[Buoyant](https://buoyant.io)，又开源了一款针对Kubernetes的超轻量Service Sesh——[Conduit](https://github.com/runconduit/conduit)。它可以透明得管理服务运行时之间的通信，使得在Kubernetes上运行服务更加安全和可靠；它还具有不用修改任何应用程序代码即可改进应用程序的可观测性、可靠性及安全性等方面的特性。

Condiut与[Linkerd](https://linkerd.io)的设计方式不同，它跟[Istio](https://istio.io)一样使用的是Sidecar模式，但架构又没Istio那么复杂。Conduit只支持Kubernetes，且只支持HTTP2（包括gRPC）协议。

Conduit使用Rust和Go语言开发，GitHub地址https://github.com/runconduit/conduit

安装Conduit必须使用Kubernetes1.8以上版本。

## 参考

- Conduit GitHub：https://github.com/runconduit/conduit
- 关于Conduit的更多资源请参考官方网站：https://conduit.io/
- Conduit的官方文档中文版：https://github.com/doczhcn/conduit
- 关于Service Mesh的更多内容请访问ServiceMesher：http://www.servicemesher.com
