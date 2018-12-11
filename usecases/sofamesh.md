## SOFAMesh

 **注意：本书中的 Service Mesh 章节已不再维护，请转到 [istio-handbook](https://jimmysong.io/istio-handbook) 中浏览。**

SOFAMesh由蚂蚁金服开源，在兼容Istio整体架构和协议的基础上，做出部分调整：

![SOFAMesh architecture](https://ws4.sinaimg.cn/large/0069RVTdgy1fu08m7p22kj31kw1biq98.jpg)

1. **使用Go语言开发全新的Sidecar，替代Envoy**
2. **为了避免Mixer带来的性能瓶颈，合并Mixer部分功能进入Sidecar**
3. **Pilot和Citadel模块进行了大幅的扩展和增强**

我们的目标：打造一个更加务实的Istio落地版本！

> 备注：以上架构调整的细节以及我们做调整的出发点和原因，请浏览 [蚂蚁金服大规模微服务架构下的Service Mesh探索之路](http://www.servicemesher.com/blog/the-way-to-service-mesh-in-ant-financial/)一文，有非常详尽的解释。

## 开源内容

在本轮开源中，我们将推出SOFAMesh目前正在开发的两大模块：MOSN和SOFAPilot。

### 1.MOSN

SOFAMesh中Golang版本的Sidecar，是一个名为MOSN(Modular Observable Smart Netstub)的全新开发的模块，实现Envoy的功能，兼容Envoy的API，可以和Istio集成。

![SOFAMesh MOSN](https://ws1.sinaimg.cn/large/006tKfTcgy1ft75ot24lzj31ec18479s.jpg)

此外，我们会增加对SOFARPC、Dubbo等通讯协议的支持，以便更好的迎合国内用户包括我们自身的实际需求。

由于Sidecar相对独立，而且我们也预期会有单独使用MOSN的场景，因此MOSN的代码仓库是独立于SOFAMesh的，地址为： https://github.com/alipay/sofa-mosn 

欢迎大家使用，提供需求、反馈问题、贡献代码或者合作开发。

### 2.SOFAPilot

我们将大幅扩展和增强Istio中的Pilot模块：

![SOFAMesh Pilot architecture](https://ws1.sinaimg.cn/large/006tKfTcgy1ft75pq8rplj31kw19sn5q.jpg)

1. **增加SOFARegistry的Adapter，提供超大规模服务注册和发现的解决方案**
2. **增加数据同步模块，以实现多个服务注册中心之间的数据交换。**
3. **增加Open Service Registry API，提供标准化的服务注册功能**

MOSN和SOFAPilot配合，将可以提供让传统侵入式框架（如Spring Cloud，Dubbo，SOFA RPC等）和Service Mesh产品可以相互通讯的功能，以便可以平滑的向Service Mesh产品演进和过渡。

**Pilot和后面会陆续开放的Mixer\Citadel等Istio模块**，会统一存放在同一个从Istio Fork出来的代码仓库中。未来会持续更新Istio最新代码，以保持和Istio的一致。

## Roadmap

![SOFA Mesh roadmap](https://ws2.sinaimg.cn/large/0069RVTdgy1fu08liarftj31kw0spkeg.jpg)

## 参考

- [SOFA MOSN](https://github.com/alipay/sofa-mosn)
- [SOFAMesh](https://github.com/alipay/sofa-mesh)
- [SOFAMesh官方文档](http://www.sofastack.tech/sofa-mesh/docs/Home)
- [蚂蚁金服大规模微服务架构下的Service Mesh探索之路](http://www.servicemesher.com/blog/the-way-to-service-mesh-in-ant-financial/)