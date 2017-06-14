# 最佳实践

本章节从零开始创建我们自己的kubernetes集群，并在该集群的基础上，配置服务发现、负载均衡和日志收集等功能，使我们的集群能够成为一个真正线上可用、功能完整的集群。

第一部分[ 在CentOS上部署kubernetes1.6集群](install-kbernetes1.6-on-centos.md)中介绍了如何通过二进制文件在CentOS物理机上快速部署一个kubernetes集群，而[安装EFK插件](efk-addon-installation.md)是官方提供的一种日志收集方案，不一定适用于我们的业务，在此仅是介绍，并没有在实际生产中应用，后面的运维管理部分有详细的[应用日志收集](app-log-collection.md)方案介绍。