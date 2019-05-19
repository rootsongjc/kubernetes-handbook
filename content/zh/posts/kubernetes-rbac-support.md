---
date: "2017-04-21T19:53:18+08:00"
title: "Kubernetes中的RBAC支持"
draft: false
categories: "kubernetes"
tags: ["kubernetes","rbac"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20160402017.jpg", desc: "无题 Apr 2,2016"}]
---

> 在Kubernetes1.6版本中新增角色访问控制机制（Role-Based Access，RBAC）让集群管理员可以针对特定使用者或服务账号的角色，进行更精确的资源访问控制。在RBAC中，权限与角色相关联，用户通过成为适当角色的成员而得到这些角色的权限。这就极大地简化了权限的管理。在一个组织中，角色是为了完成各种工作而创造，用户则依据它的责任和资格来被指派相应的角色，用户可以很容易地从一个角色被指派到另一个角色。

### 前言

本文翻译自[RBAC Support in Kubernetes](http://blog.kubernetes.io/2017/04/rbac-support-in-kubernetes.html)，转载自[kubernetes中文社区](https://www.kubernetes.org.cn/1879.html)，译者催总，[Jimmy Song](http://rootsongjc.github.com/about)做了稍许修改。该文章是[5天内了解Kubernetes1.6新特性](http://blog.kubernetes.io/2017/03/five-days-of-kubernetes-1.6.html)的系列文章之一。

One of the highlights of the [Kubernetes 1.6](http://blog.kubernetes.io/2017/03/kubernetes-1.6-multi-user-multi-workloads-at-scale.html)中的一个亮点时RBAC访问控制机制升级到了beta版本。RBAC，基于角色的访问控制机制，是用来管理kubernetes集群中资源访问权限的机制。使用RBAC可以很方便的更新访问授权策略而不用重启集群。

本文主要关注新特性和最佳实践。

### RBAC vs ABAC

目前kubernetes中已经有一系列l [鉴权机制](https://kubernetes.io/docs/admin/authorization/)。鉴权的作用是，决定一个用户是否有权使用 Kubernetes API 做某些事情。它除了会影响 kubectl 等组件之外，还会对一些运行在集群内部并对集群进行操作的软件产生作用，例如使用了 Kubernetes 插件的 Jenkins，或者是利用 Kubernetes API 进行软件部署的 Helm。ABAC 和 RBAC 都能够对访问策略进行配置。

ABAC（Attribute Based Access Control）本来是不错的概念，但是在 Kubernetes 中的实现比较难于管理和理解，而且需要对 Master 所在节点的 SSH 和文件系统权限，而且要使得对授权的变更成功生效，还需要重新启动 API Server。

而 RBAC 的授权策略可以利用 kubectl 或者 Kubernetes API 直接进行配置。**RBAC 可以授权给用户，让用户有权进行授权管理，这样就可以无需接触节点，直接进行授权管理。**RBAC 在 Kubernetes 中被映射为 API 资源和操作。

因为 Kubernetes 社区的投入和偏好，相对于 ABAC 而言，RBAC 是更好的选择。

### 基础概念

需要理解 RBAC 一些基础的概念和思路，RBAC 是让用户能够访问 [Kubernetes API 资源](https://kubernetes.io/docs/api-reference/v1.6/)的授权方式。

[![img](https://1.bp.blogspot.com/-v6KLs1tT_xI/WOa0anGP4sI/AAAAAAAABBo/KIgYfp8PjusuykUVTfgu9-2uKj_wXo4lwCLcB/s400/rbac1.png)](https://1.bp.blogspot.com/-v6KLs1tT_xI/WOa0anGP4sI/AAAAAAAABBo/KIgYfp8PjusuykUVTfgu9-2uKj_wXo4lwCLcB/s1600/rbac1.png)

在 RBAC 中定义了两个对象，用于描述在用户和资源之间的连接权限。

**role**

角色是一系列权限的集合，例如一个角色可以包含读取 Pod 的权限和列出 Pod 的权限， ClusterRole 跟 Role 类似，但是可以在集群中到处使用（ Role 是 namespace 一级的）。

**role binding**

RoleBinding 把角色映射到用户，从而让这些用户继承角色在 namespace 中的权限。ClusterRoleBinding 让用户继承 ClusterRole 在整个集群中的权限。

[![img](https://1.bp.blogspot.com/-ixDe91-cnqw/WOa0auxC0mI/AAAAAAAABBs/4LxVsr6shEgTYqUapt5QPISUeuTuztVwwCEw/s640/rbac2.png)](https://1.bp.blogspot.com/-ixDe91-cnqw/WOa0auxC0mI/AAAAAAAABBs/4LxVsr6shEgTYqUapt5QPISUeuTuztVwwCEw/s1600/rbac2.png)



另外还要考虑cluster roles和cluster role binding。cluster role和cluster role binding方法跟role和role binding一样，出了它们有更广的scope。详细差别请访问 [role binding与clsuter role binding](https://kubernetes.io/docs/admin/authorization/rbac/#rolebinding-and-clusterrolebinding).

### Kubernetes中的RBAC

RBAC 现在被 Kubernetes 深度集成，并使用他给系统组件进行授权。[System Roles](https://kubernetes.io/docs/admin/authorization/rbac/#default-roles-and-role-bindings) 一般具有前缀`system:`，很容易识别：

```bash
$ kubectl get clusterroles --namespace=kube-system
NAME                                           AGE
admin                                          10d
cluster-admin                                  10d
edit                                           10d
system:auth-delegator                          10d
system:basic-user                              10d
system:controller:attachdetach-controller      10d
system:controller:certificate-controller       10d
system:controller:cronjob-controller           10d
system:controller:daemon-set-controller        10d
system:controller:deployment-controller        10d
system:controller:disruption-controller        10d
system:controller:endpoint-controller          10d
system:controller:generic-garbage-collector    10d
system:controller:horizontal-pod-autoscaler    10d
system:controller:job-controller               10d
system:controller:namespace-controller         10d
system:controller:node-controller              10d
system:controller:persistent-volume-binder     10d
system:controller:pod-garbage-collector        10d
system:controller:replicaset-controller        10d
system:controller:replication-controller       10d
system:controller:resourcequota-controller     10d
system:controller:route-controller             10d
system:controller:service-account-controller   10d
system:controller:service-controller           10d
system:controller:statefulset-controller       10d
system:controller:ttl-controller               10d
system:discovery                               10d
system:heapster                                10d
system:kube-aggregator                         10d
system:kube-controller-manager                 10d
system:kube-dns                                10d
system:kube-scheduler                          10d
system:node                                    10d
system:node-bootstrapper                       10d
system:node-problem-detector                   10d
system:node-proxier                            10d
system:persistent-volume-provisioner           10d
view                                           10d
```

RBAC 系统角色已经完成足够的覆盖，让集群可以完全在 RBAC 的管理下运行。

在 ABAC 到 RBAC 进行迁移的过程中，有些在 ABAC 集群中缺省开放的权限，在 RBAC 中会被视为不必要的授权，会对其进行[降级](https://kubernetes.io/docs/admin/authorization/rbac/#upgrading-from-15)。这种情况会影响到使用 Service Account 的负载。ABAC 配置中，从 Pod 中发出的请求会使用 Pod Token，API Server 会为其授予较高权限。例如下面的命令在 ABAC 集群中会返回 JSON 结果，而在 RBAC 的情况下则会返回错误。

```bash
$ kubectl run nginx --image=nginx:latest
$ kubectl exec -it $(kubectl get pods -o jsonpath='{.items[0].metadata.name}') bash
$ apt-get update && apt-get install -y curl
$ curl -ik \
  -H "Authorization: Bearer $(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
  https://kubernetes/api/v1/namespaces/default/pods
```

所有在 Kubernetes 集群中运行的应用，一旦和 API Server 进行通信，都会有可能受到迁移的影响。

要平滑的从 ABAC 升级到 RBAC，在创建 1.6 集群的时候，可以同时启用[ABAC 和 RBAC](https://kubernetes.io/docs/admin/authorization/rbac/#parallel-authorizers)。当他们同时启用的时候，对一个资源的权限请求，在任何一方获得放行都会获得批准。然而在这种配置下的权限太过粗放，很可能无法在单纯的 RBAC 环境下工作。

目前RBAC已经足够了，ABAC可能会被弃用。在可见的未来ABAC依然会保留在kubernetes中，不过开发的重心已经转移到了RBAC。 

### 参考

 [RBAC documentation](https://kubernetes.io/docs/admin/authorization/rbac/)

[Google Cloud Next talks 1](https://www.youtube.com/watch?v=Cd4JU7qzYbE#t=8m01s )

[Google Cloud Next talks 2](https://www.youtube.com/watch?v=18P7cFc6nTU#t=41m06s )

[在Kubernetes Pod中使用Service Account访问API Server](http://tonybai.com/2017/03/03/access-api-server-from-a-pod-through-serviceaccount/)
