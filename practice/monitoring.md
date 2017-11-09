# 监控

Kubernetes 使得管理复杂环境变得更简单，但是对 kubernetes 本身的各种组件还有运行在 kubernetes 集群上的各种应用程序做到很好的洞察就很难了。Kubernetes 本身对应用程序的做了很多抽象，在生产环境下对这些不同的抽象组件的健康就是迫在眉睫的事情。

我们在安装 kubernetes 集群的时候，默认安装了 kubernetes 官方提供的 [heapster](https://github.com/kubernetes/heapster) 插件，可以对 kubernetes 集群上的应用进行简单的监控，获取 pod 级别的**内存**、**CPU**和**网络**监控信息，同时还能够通过 API 监控 kubernetes 中的基本资源监控指标。

然而，[Prometheus](https://prometheus.io) 的出现让人眼前一亮，与 kubernetes 一样同样为 CNCF 中的项目，而且是第一个加入到 CNCF 中的项目。

[Prometheus](https://prometheus.io) 是由 SoundCloud 开源监控告警解决方案，从 2012 年开始编写代码，再到 2015 年 GitHub 上开源以来，已经吸引了 9k+ 关注，以及很多大公司的使用；2016 年 Prometheus 成为继 k8s 后，第二名 CNCF\([Cloud Native Computing Foundation](https://cncf.io/)\) 成员。

作为新一代开源解决方案，很多理念与 Google SRE 运维之道不谋而合。