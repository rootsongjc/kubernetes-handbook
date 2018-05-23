# GlusterD-2.0

GlusterD-2.0是Gluster的组成部分，用来做分布式管理引擎。Gluster 是一种免费的开源软件可扩展网络文件系统。它是更加适合云原生开发人员使用的基础架构。Gluster的设计可满足各种规模的安装环境的需求，拥有灵活的部署选项，可适用于各种环境和基础架构中，比如裸机硬件、虚拟机、容器和公有云。

GlusterD-2.0是针对Gluster的分布式管理引擎，可以为可信任存储池中的服务器提供更好的扩展能力。GlusterD-2.0是一种引入了多项改进的架构重写模式，可以让Gluster更具可扩展性，同时更易于配置、使用、集成和维护，尤其是适用于大规模部署。

GlusterD-2.0包含一组用于卷和成员操作的ReSTful界面，允许将DevOps实践用于基础架构的自动化及使用。GlusterD-2.0还集成了嵌入式etcd库，因此它可以为可信任存储池中的状态管理提供更高的一致性。GlusterD-2.0还提供了更加灵活的插件框架，能够让开发人员更轻松地添加更多指标。

**可以与Kubernetes更紧密地集成**

利用动态配置工具Heketi实现管理GlusterFS卷的生命周期。Heketi的最新版本引入了多项新特性，能够使Gluster更紧密地集成Kubernetes，这些新性能包括：支持配置基于Gluster块的持久卷和扩展持久卷、为持久卷自定义卷名称、Gluster卷的Prometheus指标集、更强的设备管理能力，以及更丰富的数据库。
协议变更：得益于全新的在线远程过程调用 (RPC) 版本。新的RPC版本改进了XDR构造，并且增加了更多已定义的成员和新的目录，从而优化了编码和解码流程。

关于 GlusterD-2.0 的更多细节请参考 https://github.com/gluster/glusterd2 。

## 参考

- [新品Gluster 4.0：更强容器集成能力](https://mp.weixin.qq.com/s/eHAz6keGC7CC1yVYpzBVnA)
- [Gluster 官网](https://www.gluster.org/)
- [GlusterD-2.0 Github开源地址](https://github.com/gluster/glusterd2)