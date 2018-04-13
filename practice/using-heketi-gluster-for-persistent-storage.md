本文翻译自（大部分为google翻译,少许人工调整，红色字体为注解和我个人的示例）https://github.com/heketi/heketi/blob/master/docs/admin/install-kubernetes.md
其中注意事项部分为其他网上查询所得

# 概述
本指南支持在Kubernetes集群中集成，部署和管理GlusterFS 容器化的存储节点。这使得Kubernetes管理员可以为其用户提供可靠的共享存储。
跟这个话题相关的另一个重要资源是 gluster-kubernetes项目。它专注于在Kubernetes集群中部署GlusterFS，并提供简化的工具来完成此任务。它包含一个设置指南。它还包括一个Hello World， 其中包含一个使用动态配置（dynamically-provisioned）的GlusterFS卷进行存储的Web server pod示例。对于那些想要测试或学习更多关于此主题的人，请按照主README中gluster-kubernetes 的快速入门说明 进行操作
本指南旨在展示Heketi在Kubernetes环境中管理Gluster的最简单示例。这是为了强调这种配置的主要组成组件，因此并不适合生产环境。

# 基础设施要求
- **至少三个slave节点，且有可用的存储磁盘**:正在运行的Kubernetes集群，至少有三个Kubernetes工作节点，每个节点至少有一个可用的裸块设备（如EBS卷或本地磁盘）。
- **防火墙开启对应的端口**:用于运行GlusterFS Pod的三个Kubernetes节点必须为GlusterFS通信打开相应的端口（如果开启了防火墙的情况下，没开防火墙就不需要这些操作）。在每个节点上运行以下命令。
```bash
iptables -N HEKETI
iptables -A HEKETI -p tcp -m state --state NEW -m tcp --dport 24007 -j ACCEPT
iptables -A HEKETI -p tcp -m state --state NEW -m tcp --dport 24008 -j ACCEPT
iptables -A HEKETI -p tcp -m state --state NEW -m tcp --dport 2222 -j ACCEPT
iptables -A HEKETI -p tcp -m state --state NEW -m multiport --dports 49152:49251 -j ACCEPT
service iptables save

