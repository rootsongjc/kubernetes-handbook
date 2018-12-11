# Istio 中 sidecar 的注入及示例

**注意：本文档已失效，请浏览 [Istio 官方文档](https://istio.io/zh)。本书中的 Service Mesh 章节已不再维护，请转到 [istio-handbook](https://jimmysong.io/istio-handbook) 中浏览。**

我们知道 Istio 通过向 Pod 中注入一个 sidecar 容器来将 Pod 纳入到 Istio service mesh 中的，那么这些 sidecar 容器的注入遵循什么样的规范，需要给每个 Pod 增加哪些配置信息才能纳入 Istio service mesh 中呢？这篇文章将给您答案。

## Pod Spec 中需满足的条件

为了成为 Service Mesh 中的一部分，kubernetes 集群中的每个 Pod 都必须满足如下条件，这些规范不是由 Istio 自动注入的，而需要 生成 kubernetes 应用部署的 YAML 文件时需要遵守的：

1. **Service 关联**：每个 pod 都必须只属于某**一个** [Kubernetes Service](https://kubernetes.io/docs/concepts/services-networking/service/) （当前不支持一个 pod 同时属于多个 service）。
2. **命名的端口**：Service 的端口必须命名。端口的名字必须遵循如下格式 `<protocol>[-<suffix>]`，可以是 `http`、`http2`、 `grpc`、 `mongo`、 或者 `redis` 作为 `<protocol>` ，这样才能使用 Istio 的路由功能。例如 `name: http2-foo` 和 `name: http` 都是有效的端口名称，而 `name: http2foo` 不是。如果端口的名称是不可识别的前缀或者未命名，那么该端口上的流量就会作为普通的 TCP 流量来处理（除非使用 `Protocol: UDP` 明确声明使用 UDP 端口）。
3. **带有 app label 的 Deployment**：我们建议 kubernetes 的`Deploymenet` 资源的配置文件中为 Pod 明确指定 `app`label。每个 Deployment 的配置中都需要有个与其他 Deployment 不同的含有意义的 `app` label。`app` label 用于在分布式追踪中添加上下文信息。
4. **Mesh 中的每个 pod 里都有一个 Sidecar**：最后，Mesh 中的每个 pod 都必须运行与 Istio 兼容的 sidecar。以下部分介绍了将 sidecar 注入到 pod 中的两种方法：使用`istioctl` 命令行工具手动注入，或者使用 Istio Initializer 自动注入。注意 sidecar 不涉及到流量，因为它们与容器位于同一个 pod 中。

## 将普通应用添加到 Istio service mesh 中

Istio官方的示例[Bookinfo](https://istio.io/docs/guides/bookinfo.html)中并没有讲解如何将服务集成 Istio，只给出了 YAML 配置文件，而其中需要注意哪些地方都没有说明，假如我们自己部署的服务如何使用 Istio 呢？现在我们有如下两个普通应用（代码在 GitHub 上），它们都不具备微服务的高级特性，比如限流和熔断等，通过将它们部署到 kubernetes 并使用 Istio 来管理：

- [k8s-app-monitor-test](https://github.com/rootsongjc/k8s-app-monitor-test)：用来暴露 json 格式的 metrics
- [k8s-app-monitor-agent](https://github.com/rootsongjc/k8s-app-monitor-agent)：访问上面那个应用暴露的 metrics 并生成监控图

这两个应用的 YAML 配置如下，其中包含了 Istio ingress 配置，并且符合 Istio 对 Pod 的 spec 配置所指定的规范。

**k8s-app-monitor-istio-all-in-one.yaml文件**

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  annotations:
    kompose.cmd: kompose convert -f docker-compose.yaml
    kompose.version: 1.10.0 ()
  creationTimestamp: null
  labels:
    app: k8s-app-monitor-agent
  name: k8s-app-monitor-agent
spec:
  replicas: 1
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: k8s-app-monitor-agent
    spec:
      containers:
      - env:
        - name: SERVICE_NAME
          value: k8s-app-monitor-test
        image: jimmysong/k8s-app-monitor-agent:749f547
        name: monitor-agent
        ports:
        - containerPort: 8888
      restartPolicy: Always
---
apiVersion: v1
kind: Service
metadata:
  annotations:
    kompose.cmd: kompose convert -f docker-compose.yaml
    kompose.version: 1.10.0 ()
  creationTimestamp: null
  labels:
    app: k8s-app-monitor-agent
  name: k8s-app-monitor-agent
spec:
  ports:
  - name: "http"
    port: 8888
    targetPort: 8888
  selector:
    app: k8s-app-monitor-agent
---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  annotations:
    kompose.cmd: kompose convert -f docker-compose.yaml
    kompose.version: 1.10.0 ()
  creationTimestamp: null
  labels:
    app: k8s-app-monitor-test
  name: k8s-app-monitor-test
spec:
  replicas: 1
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: k8s-app-monitor-test
    spec:
      containers:
      - image: jimmysong/k8s-app-monitor-test:9c935dd
        name: monitor-test
        ports:
        - containerPort: 3000
      restartPolicy: Always
---
apiVersion: v1
kind: Service
metadata:
  annotations:
    kompose.cmd: kompose convert -f docker-compose.yaml
    kompose.version: 1.10.0 ()
  creationTimestamp: null
  labels:
    app: k8s-app-monitor-test
  name: k8s-app-monitor-test
spec:
  ports:
  - name: "http"
    port: 3000
    targetPort: 3000
  selector:
    app: k8s-app-monitor-test
---
## Istio ingress
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: k8s-app-monitor-agent-ingress
  annotations:
    kubernetes.io/ingress.class: "istio"
spec:
  rules:
  - http:
      paths:
      - path: /k8s-app-monitor-agent
        backend:
          serviceName: k8s-app-monitor-agent
          servicePort: 8888
```

其中有两点配置需要注意。

- `Deployment` 和 `Service` 中的 label 名字必须包含 `app`，zipkin 中的 tracing 需要使用到这个标签才能追踪
- `Service` 中的 `ports` 配置和必须包含一个名为 `http` 的 port，这样在 Istio ingress 中才能暴露该服务

**注意**：该 YAML 文件中 `annotations` 是因为我们一开始使用 `docker-compose` 部署在本地开发测试，后来再使用 [kompose](https://github.com/kubernetes/kompose) 将其转换为 kubernetes 可识别的 YAML 文件。

然后执行下面的命令就可以基于以上的 YAML 文件注入 sidecar 配置并部署到 kubernetes 集群中。

```bash
kubectl apply -n default -f <(istioctl kube-inject -f manifests/istio/k8s-app-monitor-istio-all-in-one.yaml)
```

如何在本地启动 kubernetes 集群进行测试可以参考 [kubernetes-vagrant-centos-cluster](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster) 中的说明。

## Sidecar 注入说明

手动注入需要修改控制器的配置文件，如 deployment。通过修改 deployment 文件中的 pod 模板规范可实现该deployment 下创建的所有 pod 都注入 sidecar。添加/更新/删除 sidecar 需要修改整个 deployment。

自动注入会在 pod 创建的时候注入 sidecar，无需更改控制器资源。Sidecar 可通过以下方式更新：

- 选择性地手动删除 pod 
- 系统得进行 deployment 滚动更新

手动或者自动注入都使用同样的模板配置。自动注入会从 `istio-system` 命名空间下获取 `istio-inject` 的 ConfigMap。手动注入可以通过本地文件或者 Configmap 。

## 参考

- [Installing Istio Sidecar](https://istio.io/docs/setup/kubernetes/sidecar-injection.html)