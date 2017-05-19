# Docker存储插件

容器存储的几种形态：

[http://mp.weixin.qq.com/s/cTFkQooDVK8IO7cSJUYiVg](http://mp.weixin.qq.com/s/cTFkQooDVK8IO7cSJUYiVg)

[https://clusterhq.com/2015/12/09/difference-docker-volumes-flocker-volumes/](https://clusterhq.com/2015/12/09/difference-docker-volumes-flocker-volumes/)

目前流行的Docker有状态服务的持久化存储方案有以下几种

- Infinit：[https://infinit.sh](https://infinit.sh/) 2016年11月被Docker公司收购
- ~~Torus：CoreOS开源的容器分布式存储 [https://github.com/coreos/torus](https://github.com/coreos/torus)~~ **已停止开发**
- Flocker：Container data volume manager for your Dockerized application [https://clusterhq.com](https://clusterhq.com/)
- Convoy：Rancher开源的Docker volume plugin [https://github.com/rancher/convoy](https://github.com/rancher/convoy)
- REX-Ray：运营商无关的存储引擎。[https://github.com/codedellemc/rexray](https://github.com/codedellemc/rexray)，只能使用商业存储

对比

| 名称        | 主导公司       | 开源时间         | 是否自建存储 | 是否开源  | 开发语言   | 存储格式                                     | 环境依赖     |
| --------- | ---------- | ------------ | ------ | ----- | ------ | ---------------------------------------- | -------- |
| Infinit   | Docker     | 2017年开源      | 是      | 否     | C++    | local、Amazon S3、Google Cloud Storage     | fuse     |
| ~~Torus~~ | ~~CoreOS~~ | ~~2015年11月~~ | ~~是~~  | ~~是~~ | ~~Go~~ | ~~local~~                                | ~~etcd~~ |
| Convoy    | Rancher    | 2015年5月      | 否      | 是     | Go     | NFS、Amazon EBS、VFS 、Device Mapper        |          |
| Flocker   | ClusterHQ  | 2015年8月      | 否      | 是     | Python | Amazon EBS、OpenStack Cinder、GCE PD、VMware vSphere、Ceph... |          |
| REX-Ray   | EMC        | 2015年12月     | 否      | 是     | Go     | GCE、Amazon EC2、OpenStack                 |          |

Infinit和Torus是一个类型的，都是通过分布式存储来实现容器中数据的持久化，而Convoy和Flocker是通过docker volume plugin实现volume的备份与迁移，需要很多手动操作。