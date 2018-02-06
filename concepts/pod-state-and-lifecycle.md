# Pod状态与生命周期管理

该节将带领大家了解Kubernetes中的基本概念，尤其是作为Kubernetes中调度的最基本单位Pod。

本节中包括以下内容：

- 了解Pod的构成
- Pod的生命周期
- Pod中容器的启动顺序模板定义

Kubernetes中的基本组件`kube-controller-manager`就是用来控制Pod的状态和生命周期的，在了解各种controller之前我们有必要先了解下Pod本身和其生命周期。