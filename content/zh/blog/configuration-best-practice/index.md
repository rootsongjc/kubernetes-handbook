---
date: "2017-06-14T20:03:09+08:00"
draft: false
title: "Kubernetes配置最佳实践"
description: "本文档旨在汇总和强调用户指南、快速开始文档和示例中的最佳实践。"
categories: ["kubernetes"]
tags: ["Kubernetes"]
type: "post"
aliases: "/posts/configuration-best-practice"
image: "images/banner/kubernetes.jpg"
---

## 前言

本文档旨在汇总和强调用户指南、快速开始文档和示例中的最佳实践。该文档会很很活跃并持续更新中。如果你觉得很有用的最佳实践但是本文档中没有包含，欢迎给我们提Pull Request。

本文已上传到[kubernetes-handbook](https://github.com/rootsongjc/kubernetes-handbook)中的第四章最佳实践章节，本文仅作归档，更新以[kubernetes-handbook](https://github.com/rootsongjc/kubernetes-handbook)为准。

## 通用配置建议

- 定义配置文件的时候，指定最新的稳定API版本（目前是V1）。
- 在配置文件push到集群之前应该保存在版本控制系统中。这样当需要的时候能够快速回滚，必要的时候也可以快速的创建集群。
- 使用YAML格式而不是JSON格式的配置文件。在大多数场景下它们都可以作为数据交换格式，但是YAML格式比起JSON更易读和配置。
- 尽量将相关的对象放在同一个配置文件里。这样比分成多个文件更容易管理。参考[guestbook-all-in-one.yaml](https://github.com/kubernetes/kubernetes/tree/master/examples/guestbook/all-in-one/guestbook-all-in-one.yaml)文件中的配置（注意，尽管你可以在使用`kubectl`命令时指定配置文件目录，你也可以在配置文件目录下执行`kubectl create`——查看下面的详细信息）。
- 为了简化和最小化配置，也为了防止错误发生，不要指定不必要的默认配置。例如，省略掉`ReplicationController`的selector和label，如果你希望它们跟`podTemplate`中的label一样的话，因为那些配置默认是`podTemplate`的label产生的。更多信息请查看 [guestbook app](https://github.com/kubernetes/kubernetes/tree/master/examples/guestbook/) 的yaml文件和 [examples](https://github.com/kubernetes/kubernetes/tree/master/examples/guestbook/frontend-deployment.yaml) 。
- 将资源对象的描述放在一个annotation中可以更好的内省。

## 裸奔的Pods vs Replication Controllers和 Jobs

- 如果有其他方式替代“裸奔的pod”（如没有绑定到[replication controller ](https://kubernetes.io/docs/user-guide/replication-controller)上的pod），那么就使用其他选择。在node节点出现故障时，裸奔的pod不会被重新调度。Replication Controller总是会重新创建pod，除了明确指定了[`restartPolicy: Never`](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#restart-policy) 的场景。[Job](https://kubernetes.io/docs/concepts/jobs/run-to-completion-finite-workloads/) 也许是比较合适的选择。

## Services

- 通常最好在创建相关的[replication controllers](https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller/)之前先创建[service](https://kubernetes.io/docs/concepts/services-networking/service/)（没有这个必要吧？）你也可以在创建Replication Controller的时候不指定replica数量（默认是1），创建service后，在通过Replication Controller来扩容。这样可以在扩容很多个replica之前先确认pod是正常的。
- 除非时分必要的情况下（如运行一个node daemon），不要使用`hostPort`（用来指定暴露在主机上的端口号）。当你给Pod绑定了一个`hostPort`，该pod可被调度到的主机的受限了，因为端口冲突。如果是为了调试目的来通过端口访问的话，你可以使用 [kubectl proxy and apiserver proxy](https://kubernetes.io/docs/tasks/access-kubernetes-api/http-proxy-access-api/) 或者 [kubectl port-forward](https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/)。你可使用 Service 来对外暴露服务。如果你确实需要将pod的端口暴露到主机上，考虑使用 [NodePort](https://kubernetes.io/docs/user-guide/services/#type-nodeport) service。
- 跟`hostPort`一样的原因，避免使用 `hostNetwork`。
- 如果你不需要kube-proxy的负载均衡的话，可以考虑使用使用[headless services](https://kubernetes.io/docs/user-guide/services/#headless-services)。

## 使用Label

- 定义 [labels](https://kubernetes.io/docs/user-guide/labels/) 来指定应用或Deployment的 **semantic attributes** 。例如，不是将label附加到一组pod来显式表示某些服务（例如，`service:myservice`），或者显式地表示管理pod的replication controller（例如，`controller:mycontroller`），附加label应该是标示语义属性的标签， 例如

```ini
{app:myapp,tier:frontend,phase:test,deployment:v3}
```

- 这将允许您选择适合上下文的对象组——例如，所有的”tier:frontend“pod的服务或app是“myapp”的所有“测试”阶段组件。 有关此方法的示例，请参阅[guestbook](https://github.com/kubernetes/kubernetes/tree/master/examples/guestbook/)应用程序。可以通过简单地从其service的选择器中省略特定于发行版本的标签，而不是更新服务的选择器来完全匹配replication controller的选择器，来实现跨越多个部署的服务，例如滚动更新。


- 为了滚动升级的方便，在Replication Controller的名字中包含版本信息，例如作为名字的后缀。设置一个`version`标签页是很有用的。滚动更新创建一个新的controller而不是修改现有的controller。因此，version含混不清的controller名字就可能带来问题。查看[Rolling Update Replication Controller](https://kubernetes.io/docs/tasks/run-application/rolling-update-replication-controller/)文档获取更多关于滚动升级命令的信息。

  注意 [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) 对象不需要再管理 replication controller 的版本名。Deployment 中描述了对象的期望状态，如果对spec的更改被应用了话，Deployment controller 会以控制的速率来更改实际状态到期望状态。（Deployment目前是 [`extensions` API Group](https://kubernetes.io/docs/concepts/overview/kubernetes-api/#api-groups)的一部分）。

- 利用label做调试。因为Kubernetes replication controller和service使用label来匹配pods，这允许你通过移除pod中的label的方式将其从一个controller或者service中移除，原来的controller会创建一个新的pod来取代移除的pod。这是一个很有用的方式，帮你在一个隔离的环境中调试之前的“活着的” pod。查看 [`kubectl label`](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) 命令。

## 容器镜像

- [默认容器镜像拉取策略](https://kubernetes.io/docs/concepts/containers/images/) 是 `IfNotPresent`, 当本地已存在该镜像的时候 [Kubelet](https://kubernetes.io/docs/admin/kubelet/) 不会再从镜像仓库拉取。如果你希望总是从镜像仓库中拉取镜像的话，在yaml文件中指定镜像拉取策略为`Always`（ `imagePullPolicy: Always`）或者指定镜像的tag为 `:latest` 。

  如果你没有将镜像标签指定为`:latest`，例如指定为`myimage:v1`，当该标签的镜像进行了更新，kubelet也不会拉取该镜像。你可以在每次镜像更新后都生成一个新的tag（例如`myimage:v2`），在配置文件中明确指定该版本。

  **注意：** 在生产环境下部署容器应该尽量避免使用`:latest`标签，因为这样很难追溯到底运行的是哪个版本的容器和回滚。

## 使用kubectl

- 尽量使用 `kubectl create -f <directory>`  。kubeclt会自动查找该目录下的所有后缀名为`.yaml`、`.yml`和`.json`文件并将它们传递给`create`命令。
- 使用 `kubectl delete` 而不是 `stop`. `Delete` 是 `stop`的超集，`stop` 已经被弃用。
- 使用 kubectl bulk 操作（通过文件或者label）来get和delete。查看[label selectors ](https://kubernetes.io/docs/user-guide/labels/#label-selectors)和 [using labels effectively](https://kubernetes.io/docs/concepts/cluster-administration/manage-deployment/#using-labels-effectively)。
- 使用 `kubectl run` 和 `expose` 命令快速创建直有耽搁容器的Deployment。查看 [quick start guide](https://kubernetes.io/docs/user-guide/quick-start/)中的示例。

## 参考

- [Configuration Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
