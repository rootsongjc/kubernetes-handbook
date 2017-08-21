# 在 Kubernetes 中开发部署应用

理论上只要可以使用主机名做服务注册的应用都可以迁移到 kubernetes 集群上。看到这里你可能不禁要问，为什么使用 IP 地址做服务注册发现的应用不适合迁移到 kubernetes 集群？因为这样的应用不适合自动故障恢复，因为目前 kubernetes 中不支持固定 Pod 的 IP 地址，当 Pod 故障后自动转移到其他 Node 的时候该 Pod 的 IP 地址也随之变化。

将传统应用迁移到 kubernetes 中可能还有很长的路要走，但是直接开发 Cloud native 应用，kubernetes 就是最佳运行时环境了。