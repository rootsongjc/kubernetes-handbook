---
title: "Kubernetes中的CRD（自定义资源）"
subtitle: "使用CRD扩展kubernetes API"
tags: ["kubernetes"]
categories: "kubernetes"
date: 2017-11-28T11:52:40+08:00
draft: false
bigimg: [{src: "/img/banners/006tNbRwly1fyb6ie95x2j318i0mwanw.jpg", desc: "Via unsplash"}]
---

自定义资源是对Kubernetes API的扩展，kubernetes中的每个资源都是一个API对象的集合，例如我们在YAML文件里定义的那些spec都是对kubernetes中的资源对象的定义，所有的自定义资源可以跟kubernetes中内建的资源一样使用kubectl操作。

## 自定义资源

Kubernetes1.6版本中包含一个内建的资源叫做TPR（ThirdPartyResource），可以用它来创建自定义资源，但该资源在kubernetes1.7版本中已被CRD（CustomResourceDefinition）取代。

### CRD

参考下面的CRD，resourcedefinition.yaml：

```yaml
apiVersion: apiextensions.k8s.io/v1beta1
kind: CustomResourceDefinition
metadata:
  # 名称必须符合下面的格式：<plural>.<group>
  name: crontabs.stable.example.com
spec:
  # REST API使用的组名称：/apis/<group>/<version>
  group: stable.example.com
  # REST API使用的版本号：/apis/<group>/<version>
  version: v1
  # Namespaced或Cluster
  scope: Namespaced
  names:
    # URL中使用的复数名称: /apis/<group>/<version>/<plural>
    plural: crontabs
    # CLI中使用的单数名称
    singular: crontab
    # CamelCased格式的单数类型。在清单文件中使用
    kind: CronTab
    # CLI中使用的资源简称
    shortNames:
    - ct
```

创建该CRD：

```bash
kubectl create -f resourcedefinition.yaml
```

访问RESTful API端点如<http://172.20.0.113:8080>将看到如下API端点已创建：

```bash
/apis/stable.example.com/v1/namespaces/*/crontabs/...
```

**创建自定义对象**

如下所示：

```yaml
apiVersion: "stable.example.com/v1"
kind: CronTab
metadata:
  name: my-new-cron-object
spec:
  cronSpec: "* * * * /5"
  image: my-awesome-cron-image
```

引用该自定义资源的API创建对象。

**终止器**

可以为自定义对象添加一个终止器，如下所示：

```yaml
apiVersion: "stable.example.com/v1"
kind: CronTab
metadata:
  finalizers:
  - finalizer.stable.example.com
```

删除自定义对象前，异步执行的钩子。对于具有终止器的一个对象，删除请求仅仅是为`metadata.deletionTimestamp`字段设置一个值，而不是删除它，这将触发监控该对象的控制器执行他们所能处理的任意终止器。

详情参考：[Extend the Kubernetes API with CustomResourceDefinitions](https://kubernetes.io/docs/tasks/access-kubernetes-api/extend-api-custom-resource-definitions/)

使用kubernetes1.7及以上版本请参考[Migrate a ThirdPartyResource to CustomResourceDefinition](https://kubernetes.io/docs/tasks/access-kubernetes-api/migrate-third-party-resource/)。

## 自定义控制器

单纯设置了自定义资源，并没有什么用，只有跟自定义控制器结合起来，才能讲资源对象中的声明式API翻译成用户所期望的状态。自定义控制器可以用来管理任何资源类型，但是一般是跟自定义资源结合使用。

请参考使用[Operator](https://coreos.com/blog/introducing-operators.html)模式，该模式可以让开发者将自己的领域知识转换成特定的kubenretes API扩展。

## API server聚合

Aggregated（聚合的）API  server是为了将原来的API server这个巨石（monolithic）应用给拆分成，为了方便用户开发自己的API server集成进来，而不用直接修改kubernetes官方仓库的代码，这样一来也能将API server解耦，方便用户使用实验特性。这些API server可以跟core API server无缝衔接，试用kubectl也可以管理它们。

详情参考[Aggregated API Server](https://jimmysong.io/kubernetes-handbook/concepts/aggregated-api-server)。

## 参考

- [Custom Resources](https://kubernetes.io/docs/concepts/api-extension/custom-resources/)
- [Extend the Kubernetes API with CustomResourceDefinitions](https://kubernetes.io/docs/tasks/access-kubernetes-api/extend-api-custom-resource-definitions/)
- [Introducing Operators: Putting Operational Knowledge into Software](https://coreos.com/blog/introducing-operators.html)

本文已归档到[kubernetes-handbook](https://jimmysong.io/kubernetes-handbook)，更新请以handbook为准。
