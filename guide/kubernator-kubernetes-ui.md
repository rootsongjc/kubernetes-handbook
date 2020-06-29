# Kubernator - 更底层的 Kubernetes UI

[Kubernator](https://github.com/smpio/kubernator) 相较于 [Kubernetes Dashboard](https://github.com/smpio/kubernator) 来说，是一个更底层的 Kubernetes UI，Dashboard 操作的都是 Kubernetes 的底层对象，而 Kubernator 是直接操作 Kubernetes 各个对象的 YAML 文件。

Kubernator 提供了一种基于目录树和关系拓扑图的方式来管理 Kubernetes 的对象的方法，用户可以在 Web 上像通过 GitHub 的网页版一样操作 Kubernetes 的对象，执行修改、拷贝等操作，详细的使用方式见 <https://github.com/smpio/kubernator>。

## 安装 Kubernator

Kubernator 的安装十分简单，可以直接使用 `kubectl` 命令来运行，它不依赖任何其它组件。

```bash
kubectl create ns kubernator
kubectl -n kubernator run --image=smpio/kubernator --port=80 kubernator
kubectl -n kubernator expose deploy kubernator
kubectl proxy
```

然后就可以通过 <http://localhost:8001/api/v1/namespaces/kubernator/services/kubernator/proxy/> 来访问了。

Catalog 页面可以看到 Kubernetes 中资源对象的树形结构，还可以在该页面中对资源对象的配置进行更改和操作。

![Kubernator catalog 页面](../images/kubernator-catalog.jpg)

RBAC 页面可以看到集群中 RBAC 关系及结构。

![Kubernator rbac 页面](../images/kubernator-rbac.jpg)

## 参考

- [Kubernator - github.com](https://github.com/smpio/kubernator) 