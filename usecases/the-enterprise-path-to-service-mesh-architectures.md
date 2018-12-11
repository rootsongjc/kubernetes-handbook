# 企业级服务网格架构之路

**注意：本书中的 Service Mesh 章节已不再维护，请转到 [istio-handbook](https://jimmysong.io/istio-handbook) 中浏览。**

本节是根据由Nginx赞助，O’Reilly出版社出品的关于服务网格的书籍总结而来，本书标题是 _The Enterprise Path to Service Mesh_ ，还有个副标题 _Decoupling at Layer 5_ ，第一版发行于2018年8月8日。这本书一共61页，本文是我对该书的一些解读，读者可以在[Nginx的网站](https://www.nginx.com/resources/library/the-enterprise-path-to-service-mesh-architectures/)上免费下载阅读完整内容。

追本溯源，Service Mesh实际上是一种SDN，等同于OSI模型中的会话层。 每一次技术变革，必然要导致生产力和生产关系的变革，我们看到这种趋势正在加速。本书中给出了企业上Service Mesh的路径，可供广大技术和管理人员参考。

**注**：若未加声明，本章中所有图片均来自*The Enterprise Path to Service Mesh*一书。