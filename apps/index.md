---
title: "Kubernetes应用管理"
layout: "post"
---

Kubernetes应用及manifest的管理方法。

## Helm

[Helm](helm-app.html)是一个类似于yum/apt/[homebrew](https://brew.sh/)的Kubernetes应用管理工具。Helm使用[Chart](https://github.com/kubernetes/charts)来管理Kubernetes manifest文件。

Helm的使用方法见[这里](helm-app.html)。

## Deis workflow

Deis workflow是基于Kubernetes的PaaS管理平台，进一步简化了应用的打包、部署和服务发现。

![](https://deis.com/docs/workflow/diagrams/Git_Push_Flow.png)

## Operator

- https://github.com/coreos/etcd-operator
- https://github.com/coreos/prometheus-operator
- https://github.com/sapcc/kubernetes-operators
- https://github.com/kbst/memcached
- https://github.com/krallistic/kafka-operator
- https://github.com/huawei-cloudfederation/redis-operator
- https://github.com/upmc-enterprises/elasticsearch-operator
- https://github.com/pires/nats-operator
- https://github.com/rosskukulinski/rethinkdb-operator


## 其他

当然，目前大家最常用了还是自己管理manifest，比如kubernetes项目就提供了很多应用的示例

- https://github.com/kubernetes/kubernetes/tree/master/examples
- https://github.com/kubernetes/contrib
- https://github.com/kubernetes/ingress
