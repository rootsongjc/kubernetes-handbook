# Kubernetes 1.14 更新日志

北京时间2019年3月26日，Kubernetes 1.14发布，这是2019年发布的第一个版本，距离上个版本发布刚好又是三个月的时间。该版本中最显著地改进包括：

- 对于管理 Windows node 的生产级支持。
- 重写了 kubectl 的文档，并为其专门启用新域名 <https://kubectl.docs.kubernetes.io/>，该文档本身类似 Gitbook 的形式，使用 Resource Config 的形式组织，集成了 [kustomize](https://github.com/kubernetes-sigs/kustomize)，还有了自己的 logo 和吉祥物 kubee-cuddle。

![大鱿鱼：kubectl log](https://ws2.sinaimg.cn/large/006tKfTcly1g1gbdpsdbgj303c03cwel.jpg)

![Kubernetes 吉祥物 kubee-cuddle](https://ws1.sinaimg.cn/large/006tKfTcly1g1gbjvx2ugj305k05mmx9.jpg)

- kubectl 插件机制发布稳定版本。
- Persistent Local Volume GA。
- 限制每个 Pod 的 PID 功能发布 beta 版本。

详细的更新日志请访问 [Kubernetes 1.14: Production-level support for Windows Nodes, Kubectl Updates, Persistent Local Volumes GA](https://kubernetes.io/blog/2019/03/25/kubernetes-1-14-release-announcement/)。

## 参考

- [Kubernetes 1.14: Production-level support for Windows Nodes, Kubectl Updates, Persistent Local Volumes GA - kuberentes.io](https://kubernetes.io/blog/2019/03/25/kubernetes-1-14-release-announcement/)