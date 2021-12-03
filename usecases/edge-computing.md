# 边缘计算

本节将为大家介绍什么是边缘计算、应用场景及开源项目。

## 什么是边缘计算？

关于边缘计算（Edge Computing）的定义莫衷一是，概括得讲，边缘计算是在移动网络边缘提供 IT **服务环境和计算能力**；在靠近物或数据源头的网络边缘侧，融合网络、计算、存储、应用核心能力的开放**平台**；就近提供边缘智能的**服务**。

边缘计算与云计算是相辅相成的，是在云计算发展到一定阶段的产物，它有以下优点：

- 低延迟：计算能力部署在设备侧附近，设备请求实时响应；
- 低带宽运行：将工作迁移至更接近于用户或是数据采集终端的能力能够降低站点带宽限制所带来的影响。尤其是当边缘节点服务减少了向中枢发送大量数据处理的请求时。
- 隐私保护：数据本地采集，本地分析，本地处理，有效减少了数据暴露在公共网络的机会，保护了数据隐私。

## 边缘计算的适用场景

以下是边缘计算的适用场景：

- 第一类是前端采集的数据量过大，如果按照传统模式，将数据全部上传，成本高、效率低，例如风机发电场景；
- 第二类是需要即时交互的场景，如果数据全部上传，在中央节点处理再下发，往往传输成本高、时延长，比如无人驾驶场景；
- 第三类是对连续性要求比较高的业务，如果遇到网络问题或者中央节点故障，即便是短时间的云服务中断都会带来重大损失，比如智慧交通场景；
- 第四类是对安全要求比较高的业务，一些客户不允许数据脱离自己的控制，更不能离开自己的系统，这就需要使用边缘计算技术实现本地部署，比如人脸识别场景。

## 边缘计算开源项目

边缘计算是云原生领域的一个重要分支，该领域在几年来涌现了众多的开源项目，例如：

- [akri](https://github.com/project-akri/akri)：适用于边缘的 Kubernetes 资源接口。
- [baetyl](https://github.com/baetyl/baetyl)：将云计算、数据和服务无缝扩展到边缘设备。
- [eliot](https://github.com/ernoaapa/eliot)：用于管理物联网设备中容器化应用的开源系统。
- [iotedge](https://github.com/Azure/iotedge)： 由微软开源的 IoT Edge 开源项目。
- [k0s](https://github.com/k0sproject/k0s)：k0s 是一个包罗万象的 Kubernetes 发行版，配置了建立 Kubernetes 集群所需的所有功能，并被打包成一个二进制文件，以方便使用。
- [k3s](https://github.com/k3s-io/k3s)：由 Rancher 开源的轻量级的 Kubernetes.
- [kubeedge](https://github.com/kubeedge/kubeedge)：由华为开源的 Kubernetes 原生边缘计算框架，已贡献给 CNCF。
- [octopus](https://github.com/cnrancher/octopus)：由 Rancher 中国开源的用于 Kubernetes/k3s 的轻量级设备管理系统。
- [openyurt](https://github.com/openyurtio/openyurt)：由阿里云开源的，将原生 Kubernetes 扩展到边缘，已贡献给 CNCF。
- [superedge](https://github.com/superedge/superedge)：由腾讯开源的，用于边缘计算的边缘原生容器管理系统。

另外还有很多其他边缘计算相关开源项目请见[云原生开源项目大全（Awesome Cloud Native）](https://jimmysong.io/awesome-cloud-native/#edge-computing)。

## 参考

- [The Birth of an Edge Orchestrator – Cloudify Meets Edge Computing](https://cloudify.co/blog/birth-of-edge-orchestrator-cloudify/)