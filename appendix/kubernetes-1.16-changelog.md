# Kubernetes 1.16 更新日志

北京时间 2019 年 9 月 19 日，Kubernetes 1.16 发布，这是 2019 年的第三个版本，距离上个版本发布刚好又是三个月的时间。该版本中最显著地改进包括：

- CRD，现在 GA（General Availability）了
- Kubernetes 之前已经大量使用了全局的度量注册表来注册要暴露的 Metrics。通过实现度量注册表，度量的注册方式更加透明。此前，Kubernetes 的度量一直被排除在任何形式的稳定性要求之外。
- 在这个版本中，有不少与 volume 和 volume 修改有关的增强功能。在 CSI  spec 中的 volume 大小调整支持转移到了 beta 版，允许任何 CSI spec 的 volume 插件进行大小调整。

## 参考

- [Kubernetes 1.16: Custom Resources, Overhauled Metrics, and Volume Extensions](https://kubernetes.io/blog/2019/09/18/kubernetes-1-16-release-announcement/)

