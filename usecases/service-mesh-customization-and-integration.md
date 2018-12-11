# 定制和集成

**注意：本书中的 Service Mesh 章节已不再维护，请转到 [istio-handbook](https://jimmysong.io/istio-handbook) 中浏览。**

例如Istio这样的Service Mesh中有很多地方可以给大家定制，例如作为数据平面的sidecar，虽然默认使用的是Envoy，但是你可以开发自己的sidecar代理；还有Mixer中的各种adpater，你也可以开发自己的adapter来扩展遥测和鉴权功能，[Consul Connect](http://www.servicemesher.com/blog/consul-1-2-service-mesh/)就是个例子。

当前可选择的开源的代理可以在[landscape](http://layer5.io/landscape/)里找到，例如使用nginMesh替代Envoy作为数据平面。下图是使用nginMesh作为sidecar的架构图。

**nginMesh**

![nginMesh架构图](https://ws4.sinaimg.cn/large/006tNbRwly1fucp8yralaj30vu0sijx8.jpg)

通过扩展Istio Mixer adapter来对接不同的监控后端。

![Mixer adapter](https://ws3.sinaimg.cn/large/006tNbRwly1fucplat3l9j30vo0lw43l.jpg)

**SOFAMosn**

还有蚂蚁金服开源的Go语言版的数据平面[SOFAMosn](https://github.com/alipay/sofa-mosn)，这是也兼容Istio的SOFAMesh的一部分，也可以单独作为代理使用，详见：[SOFAMesh & SOFA MOSN—基于Istio构建的用于应对大规模流量的Service Mesh解决方案](https://jimmysong.io/posts/sofamesh-and-mosn-proxy-sidecar-service-mesh-by-ant-financial/)。

![SOFAMesh](https://ws4.sinaimg.cn/large/006tNbRwly1fucpano6gsj31kw1biq98.jpg)

[SOFAMosn](https://github.com/alipay/sofa-mosn)的模块架构图。

![SOFAMosn模块架构图](https://ws3.sinaimg.cn/large/006tNbRwly1fucpc5fn8wj31kw0sfdnu.jpg)

在未来我们会看到更多定制的数据平面和Mixer适配器出现。