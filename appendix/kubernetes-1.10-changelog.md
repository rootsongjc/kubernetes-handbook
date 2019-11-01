# Kubernetes1.10更新日志

2018年3月26日，kubernetes1.10版本发布，这是2018年发布的第一个版本。该版本的Kubernetes主要提升了Kubernetes的成熟度、可扩展性与可插入性。

该版本提升了三大关键性功能的稳定度，分别为存储、安全与网络。另外，此次新版本还引入了外部kubectl凭证提供程序（处于alpha测试阶段）、在安装时将默认的DNS服务切换为CoreDNS（beta测试阶段）以及容器存储接口（简称CSI）与持久化本地卷的beta测试版。

下面再分别说下三大关键更新。

## 存储

- CSI（容器存储接口）迎来Beta版本，可以通过插件的形式安装存储。
- 持久化本地存储管理也迎来Beta版本。
- 对PV的一系列更新，可以自动阻止Pod正在使用的PVC的删除，阻止已绑定到PVC的PV的删除操作，这样可以保证所有存储对象可以按照正确的顺序被删除。

## 安全

- kubectl可以对接不同的凭证提供程序
- 各云服务供应商、厂商以及其他平台开发者现在能够发布二进制插件以处理特定云供应商IAM服务的身价验证

## 网络

- 将原来的kube-dns切换为CoreDNS

## 获取

Kubernetes1.10已经可以通过[GitHub下载](https://github.com/kubernetes/kubernetes/releases/tag/v1.10.0)。
