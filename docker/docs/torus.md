# Torus 

Torus基于ServerSAN和容器生态的kv-store（etcd）打造的容器定义存储Torus，相比单纯的控制面，Torus能够更好的与k8s调度集成，并且具有更快的发放和伸缩能力。 容器定义存储最大的特点在于融合了控制面和数据面能力，并且结合容器特点定制，相对单纯控制面更具优势，产品形态以ServerSAN为主。不足在于存储本身不是cloud-native的，与容器本身还是在两个层面，仍需要解决两层间的调度联动，适配cloud-native的能力。

开源docker-volume-plugin-torus

[https://hub.docker.com/r/steigr/docker-volume-plugin-torus/~/dockerfile/](https://hub.docker.com/r/steigr/docker-volume-plugin-torus/~/dockerfile/)

[https://github.com/steigr/docker-volume-plugin-torus](https://github.com/steigr/docker-volume-plugin-torus)

目前还在POC阶段，暂时还没有验证可行性。

