---
title: "在kubernetes集群上安装istio并测试bookinfo示例微服务"
subtitle: "本文翻译自istio官方文档"
date: 2017-11-06T22:54:40+08:00
draft: false
description: "在kubernetes集群上安装istio并测试bookinfo示例微服务，基于Istio0.22版本，kubernetes1.7及以上，翻译自Istio官方文档"
categories: "microservices"
tags: ["istio","kubernetes","microservices","cloud-native"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20160813015.jpg", desc: "Shanghai Pudong International Airport Aug 13,2016"}]
---

今年来以 [Istio](https://istio.io) 和 [Linkderd](https://linkerd.io) 为代表的 Service Mesh 蓬勃发展，大有成为下一代语言异构微服务架构的王者之范，今天又碰巧看到了 Red Hat 的 [Burr Sutter](https://twitter.com/burrsutter) 提出了**8 Steps to Becoming Awesome with Kubernetes**，整个PPT一共60多页，很有建设性，[点此](https://github.com/rootsongjc/cloud-native-slides-share/blob/master/kubernetes/8-Steps-to-Becoming-Awesome-with-Kubernetes-readhat-burrsutter.pdf)跳转到我的GitHub上下载，我将其归档到[cloud-native-slides-share](https://github.com/rootsongjc/cloud-native-slides-share)中了。

![下一代异构微服务架构](https://res.cloudinary.com/jimmysong/image/upload/images/polyglot-microservices-serivce-mesh.png)

自我6月份初接触Istio依赖就发觉service mesh很好的解决了异构语言中的很多问题，而且是kuberentes service 上层不可或缺的服务间代理。关于istio的更多内容请参考 [istio中文文档](http://istio.doczh.cn)。

# 快速开始

## 前置条件

下面的操作说明需要您可以访问 kubernetes **1.7.3 后更高版本** 的集群，并且启用了 [RBAC (基于角色的访问控制)](https://kubernetes.io/docs/admin/authorization/rbac/)。您需要安装了 **1.7.3 或更高版本** 的 `kubectl` 命令。如果您希望启用 [自动注入 sidecar](http://istio.doczh.cn/docs/setup/kubernetes/sidecar-injection.html#自动注入-sidecar)，您需要启用 kubernetes 集群的 alpha 功能。

> 注意：如果您安装了 Istio 0.1.x，在安装新版本前请先 [卸载](http://istio.doczh.cn/docs/setup/kubernetes/quick-start.html#卸载) 它们（包括已启用 Istio 应用程序 Pod 中的 sidecar）。

- 取决于您的 kubernetes 提供商：

  - 本地安装 Istio，安装最新版本的 [Minikube](https://kubernetes.io/docs/getting-started-guides/minikube/) (version 0.22.1 或者更高)。

  - [Google Container Engine](https://cloud.google.com/container-engine)

    - 使用 kubectl 获取证书 （使用您自己的集群的名字替换 `<cluster-name>` ，使用集群实际所在的位置替换 `<zone>` ）：

      ```bash
      gcloud container clusters get-credentials <cluster-name> --zone <zone> --project <project-name>
      ```

    - 将集群管理员权限授予当前用户（需要管理员权限才能为Istio创建必要的RBAC规则）：

      ```bash
      kubectl create clusterrolebinding cluster-admin-binding --clusterrole=cluster-admin --user=$(gcloud config get-value core/account)
      ```

  - [IBM Bluemix Container Service](https://www.ibm.com/cloud-computing/bluemix/containers)

    - 使用 kubectl 获取证书 （使用您自己的集群的名字替换）： 

      ```bash
      <cluster-name>
      ```

      ```bash
      $(bx cs cluster-config <cluster-name>|grep "export KUBECONFIG")
      ```

  - [Openshift Origin](https://www.openshift.org/) 3.7 或者以上版本：

    - 默认情况下，Openshift 不允许以 UID 0运行容器。为 Istio 的入口（ingress）和出口（egress）service account 启用使用UID 0运行的容器：

      ```bash
      oc adm policy add-scc-to-user anyuid -z istio-ingress-service-account -n istio-system
      oc adm policy add-scc-to-user anyuid -z istio-egress-service-account -n istio-system
      oc adm policy add-sc-to-user anyuid -z default -n istio-system
      ```

    - 运行应用程序 Pod 的 service account 需要特权安全性上下文限制，以此作为 sidecar 注入的一部分:

      ```bash
      oc adm policy add-scc-to-user privileged -z default -n <target-namespace>
      ```

- 安装或升级 Kubernetes 命令行工具 [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) 以匹配您的集群版本（1.7或以上版本）。

## 安装步骤

不论对于哪个 Istio 发行版，都安装到 `istio-system` namespace 下，即可以管理所有其它 namespace 下的微服务。

1. 到 [Istio release](https://github.com/istio/istio/releases) 页面上，根据您的操作系统下载对应的发行版。如果您使用的是 MacOS 或者 Linux 系统，可以使用下面的额命令自动下载和解压最新的发行版：

   ```bash
   curl -L https://git.io/getLatestIstio | sh -
   ```

2. 解压安装文件，切换到文件所在目录。安装文件目录下包含：

   - `install/` 目录下是 kubernetes 使用的 `.yaml` 安装文件
   - `samples/` 目录下是示例程序
   - `istioctl` 客户端二进制文件在 `bin` 目录下。`istioctl` 文件用户手动注入 Envoy sidecar 代理、创建路由和策略等。
   - `istio.VERSION` 配置文件

3. 切换到 istio 包的解压目录。例如 istio-0.2.7：

   ```bash
   cd istio-0.2.7
   ```

4. 将 `istioctl` 客户端二进制文件加到 PATH 中。

   例如，在 MacOS 或 Linux 系统上执行下面的命令：

   ```bash
   export PATH=$PWD/bin:$PATH
   ```

5. 安装 Istio 的核心部分。选择面两个 **互斥** 选项中的之一：

   a) 安装 Istio 的时候不启用 sidecar 之间的 [TLS 交互认证](http://istio.doczh.cn/docs/concepts/security/mutual-tls.md)：

   为具有现在应用程序的集群选择该选项，使用 Istio sidecar 的服务需要能够与非 Istio Kubernetes 服务以及使用 [liveliness 和 readiness 探针](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/)、headless service 和 StatefulSet 的应用程序通信。

   ```bash
   kubectl apply -f install/kubernetes/istio.yaml
   ```

   **或者**

   b) 安装 Istio 的时候启用 sidecar 之间的 [TLS 交互认证](http://istio.doczh.cn/docs/concepts/security/mutual-tls.md)：

   ```bash
   kubectl apply -f install/kubernetes/istio-auth.yaml
   ```

   这两个选项都会创建 `istio-system` 命名空间以及所需的 RBAC 权限，并部署 Istio-Pilot、Istio-Mixer、Istio-Ingress、Istio-Egress 和 Istio-CA（证书颁发机构）。

6. *可选的*：如果您的 kubernetes 集群开启了 alpha 功能，并想要启用 [自动注入 sidecar](http://istio.doczh.cn/docs/setup/kubernetes/sidecar-injection.html#automatic-sidecar-injection)，需要安装 Istio-Initializer：

   ```bash
   kubectl apply -f install/kubernetes/istio-initializer.yaml
   ```

## 验证安装

1. 确认系列 kubernetes 服务已经部署了： `istio-pilot`、 `istio-mixer`、`istio-ingress`、 `istio-egress`：

   ```bash
   kubectl get svc -n istio-system
   ```

   ```bash
   NAME            CLUSTER-IP      EXTERNAL-IP       PORT(S)                       AGE
   istio-egress    10.83.247.89    <none>            80/TCP                        5h
   istio-ingress   10.83.245.171   35.184.245.62     80:32730/TCP,443:30574/TCP    5h
   istio-pilot     10.83.251.173   <none>            8080/TCP,8081/TCP             5h
   istio-mixer     10.83.244.253   <none>            9091/TCP,9094/TCP,42422/TCP   5h
   ```

   注意：如果您运行的集群不支持外部负载均衡器（如 minikube）， `istio-ingress` 服务的 `EXTERNAL-IP` 显示`<pending>`。你必须改为使用 NodePort service 或者 端口转发方式来访问应用程序。

2. 确人对应的 Kubernetes pod 已部署并且所有的容器都启动并运行： `istio-pilot-*`、 `istio-mixer-*`、 `istio-ingress-*`、 `istio-egress-*`、`istio-ca-*`， `istio-initializer-*` 是可以选的。

   ```bash
   kubectl get pods -n istio-system
   ```

   ```bash
   istio-ca-3657790228-j21b9           1/1       Running   0          5h
   istio-egress-1684034556-fhw89       1/1       Running   0          5h
   istio-ingress-1842462111-j3vcs      1/1       Running   0          5h
   istio-initializer-184129454-zdgf5   1/1       Running   0          5h
   istio-pilot-2275554717-93c43        1/1       Running   0          5h
   istio-mixer-2104784889-20rm8        2/2       Running   0          5h
   ```

## 部署应用

您可以部署自己的应用或者示例应用程序如 [BookInfo](http://istio.doczh.cn/docs/guides/bookinfo.html)。 注意：应用程序必须使用 HTTP/1.1 或 HTTP/2.0 协议来传递 HTTP 流量，因为 HTTP/1.0 已经不再支持。

如果您启动了 [Istio-Initializer](http://istio.doczh.cn/docs/setup/kubernetes/sidecar-injection.html)，如上所示，您可以使用 `kubectl create` 直接部署应用。Istio-Initializer 会向应用程序的 pod 中自动注入 Envoy 容器：

```bash
kubectl create -f <your-app-spec>.yaml
```

如果您没有安装 Istio-initializer 的话，您必须使用 [istioctl kube-inject](http://istio.doczh.cn/docs/reference/commands/istioctl.md#istioctl-kube-inject) 命令在部署应用之前向应用程序的 pod 中手动注入 Envoy 容器：

```bash
kubectl create -f <(istioctl kube-inject -f <your-app-spec>.yaml)
```

## 卸载

- 卸载 Istio initializer:

  如果您安装 Isto 的时候启用了 initializer，请卸载它：

  ```bash
  kubectl delete -f install/kubernetes/istio-initializer.yaml
  ```

- 卸载 Istio 核心组件。对于某一 Istio 版本，删除 RBAC 权限，`istio-system` namespace，和该命名空间的下的各层级资源。

  不必理会在层级删除过程中的各种报错，因为这些资源可能已经被删除的。

  a) 如果您在安装 Istio 的时候关闭了 TLS 交互认证：

  ```bash
   kubectl delete -f install/kubernetes/istio.yaml
  ```

  **或者**

  b) 如果您在安装 Istio 的时候启用到了 TLS 交互认证：

  ```bash
   kubectl delete -f install/kubernetes/istio-auth.yaml
  ```

# 安装 Istio Sidecar

## Pod Spec 需满足的条件

为了成为 Service Mesh 中的一部分，kubernetes 集群中的每个 Pod 都必须满足如下条件：

1. **Service 注解**：每个 pod 都必须只属于某**一个** [Kubernetes Service](https://kubernetes.io/docs/concepts/services-networking/service/) （当前不支持一个 pod 同时属于多个 service）。
2. **命名的端口**：Service 的端口必须命名。端口的名字必须遵循如下格式 `<protocol>[-<suffix>]`，可以是http、http2、 grpc、 mongo、 或者 redis 作为 `<protocol>` ，这样才能使用 Istio 的路由功能。例如`name: http2-foo` 和 `name: http` 都是有效的端口名称，而 `name: http2foo` 不是。如果端口的名称是不可识别的前缀或者未命名，那么该端口上的流量就会作为普通的 TCP 流量（除非使用 `Protocol: UDP` 明确声明使用 UDP 端口）。
3. **带有 app label 的 Deployment**：我们建议 kubernetes 的`Deploymenet` 资源的配置文件中为 Pod 明确指定 `app` label。每个Deployment 的配置中都需要有个不同的有意义的 `app` 标签。`app` label 用于在分布式坠重中添加上下文信息。
4. **Mesh 中的每个 pod 里都有一个 Sidecar**： 最后，Mesh 中的每个 pod 都必须运行与 Istio 兼容的sidecar。遗爱部分介绍了将 sidecar 注入到 pod 中的两种方法：使用`istioctl` 命令行工具手动注入，或者使用 istio initializer 自动注入。注意 sidecar 不涉及到容器间的流量，因为他们都在同一个 pod 中。

## 手动注入 sidecar

`istioctl` 命令行中有一个称为 [kube-inject](http://istio.doczh.cn/docs/reference/commands/istioctl.md#istioctl-kube-inject) 的便利工具，使用它可以将 Istio 的 sidecar 规范添加到 kubernetes 工作负载的规范配置中。与 Initializer 程序不同，`kube-inject` 只是将 YAML 规范转换成包含 Istio sidecar 的规范。您需要使用标准的工具如 `kubectl` 来部署修改后的 YAML。例如，以下命令将 sidecar 添加到 sleep.yaml 文件中指定的 pod 中，并将修改后的规范提交给 kubernetes：

```bash
kubectl apply -f <(istioctl kube-inject -f samples/sleep/sleep.yaml)
```

### 示例

我们来试一试将 Istio sidecar  注入到 sleep 服务中去。

```bash
kubectl apply -f <(istioctl kube-inject -f samples/sleep/sleep.yaml)
```

Kube-inject 子命令将 Istio sidecar 和 init 容器注入到 deployment 配置中，转换后的输出如下所示：

```yaml
... 略过 ...
---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  annotations:
    sidecar.istio.io/status: injected-version-root@69916ebba0fc-0.2.6-081ffece00c82cb9de33cd5617682999aee5298d
  name: sleep
spec:
  replicas: 1
  template:
    metadata:
      annotations:
        sidecar.istio.io/status: injected-version-root@69916ebba0fc-0.2.6-081ffece00c82cb9de33cd5617682999aee5298d
      labels:
        app: sleep
    spec:
      containers:
      - name: sleep
        image: tutum/curl
        command: ["/bin/sleep","infinity"]
        imagePullPolicy: IfNotPresent
      - name: istio-proxy
        image: docker.io/istio/proxy_debug:0.2.6
        args:
        ... 略过 ...
      initContainers:
      - name: istio-init
        image: docker.io/istio/proxy_init:0.2.6
        imagePullPolicy: IfNotPresent
        args:
        ... 略过 ...
---
```

注入 sidecar 的关键在于 `initContainers` 和 istio-proxy 容器。为了简洁起见，上述输出有所省略。

验证 sleep deployment 中包含 sidecar。injected-version 对应于注入的 sidecar 镜像的版本和镜像的 TAG。在您的设置的可能会有所不同。

```bash
echo $(kubectl get deployment sleep -o jsonpath='{.metadata.annotations.sidecar\.istio\.io\/status}')
```

```bash
injected-version-9c7c291eab0a522f8033decd0f5b031f5ed0e126
```

你可以查看包含注入的容器和挂载的 volume 的完整 deployment 信息。

```bash
kubectl get deployment sleep -o yaml
```

## 自动注入 sidecar

Istio sidecar 可以在部署之前使用 Kubernetes 中一个名为 [Initializer](https://kubernetes.io/docs/admin/extensible-admission-controllers/#what-are-initializers) 的 Alpha 功能自动注入到 Pod 中。

> 注意：Kubernetes InitializerConfiguration没有命名空间，适用于整个集群的工作负载。不要在共享测试环境中启用此功能。

### 前置条件

Initializer 需要在集群设置期间显示启用，如 [此处](https://kubernetes.io/docs/admin/extensible-admission-controllers/#enable-initializers-alpha-feature) 所述。
假设集群中已启用RBAC，则可以在不同环境中启用初始化程序，如下所示：

- _GKE_

  ```bash
  gcloud container clusters create NAME \
      --enable-kubernetes-alpha \
      --machine-type=n1-standard-2 \
      --num-nodes=4 \
      --no-enable-legacy-authorization \
      --zone=ZONE
  ```

- _IBM Bluemix_ kubernetes v1.7.4 或更高版本的集群已默认启用 initializer。

- _Minikube_

  Minikube v0.22.1 或更高版本需要为 GenericAdmissionWebhook 功能配置适当的证书。获取最新版本： https://github.com/kubernetes/minikube/releases.

  ```bash
  minikube start \
      --extra-config=apiserver.Admission.PluginNames="Initializers,NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,GenericAdmissionWebhook,ResourceQuota" \
      --kubernetes-version=v1.7.5
  ```

### 安装

您现在可以从 Istio 安装根目录设置 Istio Initializer。

```bash
kubectl apply -f install/kubernetes/istio-initializer.yaml
```

将会创建下列资源：

1. `istio-sidecar` InitializerConfiguration 资源，指定 Istio sidecar 注入的资源。默认情况下  Istio sidecar 将被注入到 `deployment`、 `statefulset`、 `job` 和 `daemonset`中。
2. `istio-inject` ConfigMap，initializer 的默认注入策略，一组初始化 namespace，以及注入时使用的模版参数。这些配置的详细说明请参考 [配置选项](#configuration-options)。
3. `istio-initializer` Deployment，运行 initializer 控制器。
4. `istio-initializer-service-account` ServiceAccount，用于 `istio-initializer` deployment。`ClusterRole` 和 `ClusterRoleBinding` 在 `install/kubernetes/istio.yaml` 中定义。注意所有的资源类型都需要有 `initialize` 和 `patch` 。正式处于这个原因，initializer 要作为 deployment 的一部分来运行而不是嵌入到其它控制器中，例如 istio-pilot。

### 验证

为了验证 sidecar 是否成功注入，为上面的 sleep 服务创建 deployment 和 service。

```bash
kubectl apply -f samples/sleep/sleep.yaml
```

验证 sleep deployment 中包含 sidecar。injected-version 对应于注入的 sidecar 镜像的版本和镜像的 TAG。在您的设置的可能会有所不同。

```bash
$ echo $(kubectl get deployment sleep -o jsonpath='{.metadata.annotations.sidecar\.istio\.io\/status}')
```

```bash
injected-version-9c7c291eab0a522f8033decd0f5b031f5ed0e126
```

你可以查看包含注入的容器和挂载的 volume 的完整 deployment 信息。

```bash
kubectl get deployment sleep -o yaml
```

### 了解发生了什么

以下是将工作负载提交给 Kubernetes 后发生的情况：

1) kubernetes 将 `sidecar.initializer.istio.io` 添加到工作负载的 pending initializer 列表中。

2) istio-initializer 控制器观察到有一个新的未初始化的工作负载被创建了。pending initializer 列表中的第一个个将作为 `sidecar.initializer.istio.io` 的名称。

3) istio-initializer 检查它是否负责初始化 namespace 中的工作负载。如果没有为该 namespace 配置 initializer，则不需要做进一步的工作，而且 initializer 会忽略工作负载。默认情况下，initializer 负责所有的 namespace（参考 [配置选项](#配置选项)）。

4) istio-initializer 将自己从  pending initializer 中移除。如果 pending initializer 列表非空，则 Kubernetes 不回结束工作负载的创建。错误配置的 initializer 意味着破损的集群。

5) istio-initializer 检查 mesh 的默认注入策略，并检查所有单个工作负载的策略负载值，以确定是否需要注入 sidecar。

6) istio-initializer 向工作负载中注入 sidecar 模板，然后通过 PATCH 向 kubernetes 提交。

7) kubernetes 正常的完成了工作负载的创建，并且工作负载中已经包含了注入的 sidecar。

### 配置选项

istio-initializer 具有用于注入的全局默认策略以及每个工作负载覆盖配置。全局策略由 `istio-inject` ConfigMap 配置（请参见下面的示例）。Initializer pod 必须重新启动以采用新的配置更改。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: istio-inject
  namespace: istio-system
data:
  config: |-
    policy: "enabled"
    namespaces: [""] # everything, aka v1.NamepsaceAll, aka cluster-wide
    # excludeNamespaces: ["ns1", "ns2"]
    initializerName: "sidecar.initializer.istio.io"
    params:
      initImage: docker.io/istio/proxy_init:0.2.6
      proxyImage: docker.io/istio/proxy:0.2.6
      verbosity: 2
      version: 0.2.6
      meshConfigMapName: istio
      imagePullPolicy: IfNotPresent
```

下面是配置中的关键参数：

1. **policy**

   `off` - 禁用 initializer 修改资源。pending 的 `sidecar.initializer.istio.io` initializer 将被删除以避免创建阻塞资源。

   `disable` - initializer 不会注入 sidecar 到 watch 的所有 namespace 的资源中。启用 sidecar 注入请将 `sidecar.istio.io/inject` 注解的值设置为 `true`。

   `enable` - initializer 将会注入 sidecar 到 watch 的所有 namespace 的资源中。禁用 sidecar 注入请将 `sidecar.istio.io/inject` 注解的值设置为 `false`。

2.  **namespaces**

   要 watch 和初始化的 namespace 列表。特殊的 `""` namespace 对应于 `v1.NamespaceAll` 并配置初始化程序以初始化所有 namespace。`kube-system`、`kube-publice` 和 `istio-system` 被免除初始化。


3. **excludeNamespaces**

   从 Istio initializer 中排除的 namespace 列表。不可以定义为 `v1.NamespaceAll` 或者与 `namespaces` 一起定义。


4. **initializerName**

   这必须与 InitializerConfiguration 中 initializer 设定项的名称相匹配。Initializer 只处理匹配其配置名称的工作负载。


5. **params**

   这些参数允许您对注入的 sidecar 进行有限的更改。更改这些值不会影响已部署的工作负载。

### 重写自动注入

单个工作负载可以通过使用 `sidecar.istio.io/inject` 注解重写全局策略。如果注解被省略，则使用全局策略。

如果注解的值是 `true`，则不管全局策略如何，sidecar 都将被注入。

如果注解的值是 `false`，则不管全局策略如何，sidecar 都不会被注入。

下表显示全局策略和每个工作负载覆盖的组合。

| policy   | workload annotation | injected |
| -------- | ------------------- | -------- |
| off      | N/A                 | no       |
| disabled | omitted             | no       |
| disabled | false               | no       |
| disabled | true                | yes      |
| enabled  | omitted             | yes      |
| enabled  | false               | no       |
| enabled  | true                | yes      |

例如，即使全局策略是 `disable`，下面的 deployment 也会被注入sidecar。

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: myapp
  annotations:
    sidecar.istio.io/inject: "true"
spec:
  replicas: 1
  template:
    ...
```

这是在包含 Istio 和非 Istio 服务的混合群集中使用自动注入的好方法。

### 卸载 Initializer

运行下面的命令，删除 Istio initializer：

```bash
kubectl delete -f install/kubernetes/istio-initializer.yaml
```

注意上述命令并不会删除已注入到 Pod 中的 sidecar。要想删除这些 sidecar，需要在不使用 initializer 的情况下重新部署这些 pod。

TBD

---

## 部署 bookinfo 示例应用

该示例部署由四个单独的微服务组成的简单应用程序，用于演示Istio服务网格的各种功能。

## 概况

在本示例中，我们将部署一个简单的应用程序，显示书籍的信息，类似于网上书店的书籍条目。在页面上有书籍的描述、详细信息（ISBN、页数等）和书评。

BookInfo 应用程序包括四个独立的微服务：

- productpage：productpage(产品页面)微服务，调用 *details* 和 *reviews* 微服务来填充页面。
- details：details 微服务包含书籍的详细信息。
- reviews：reviews 微服务包含书籍的点评。它也调用 *ratings* 微服务。
- ratings：ratings 微服务包含随书评一起出现的评分信息。

有3个版本的 reviews 微服务：

- 版本v1不调用 ratings 服务。
- 版本v2调用 ratings ，并将每个评级显示为1到5个黑色星。
- 版本v3调用 ratings ，并将每个评级显示为1到5个红色星。

应用程序的端到端架构如下所示。

![BookInfo Application without Istio](https://res.cloudinary.com/jimmysong/image/upload/images/noistio.png)

该应用程序是多语言构建的，即这些微服务是用不同的语言编写的。值得注意的是，这些服务与 Istio 没有任何依赖关系，单这是个有趣的 Service Mesh 示例，特别是因为评论服务和众多的语言和版本。

## 开始之前

如果您还没有这样做，请按照与您的平台 [安装指南](http://istio.doczh.cn/docs/setup/index.md) 对应的说明安装Istio。

## 部署应用程序

使用 Istio 运行应用程序示例不需要修改应用程序本身。相反，我们只需要在支持 Istio 的环境中配置和运行服务， Envoy sidecar 将会注入到每个服务中。所需的命令和配置根据运行时环境的不同而有所不同，但在所有情况下，生成的部署将如下所示：

![BookInfo Application without Istio](https://res.cloudinary.com/jimmysong/image/upload/images/noistio.png)

所有的微服务都将与一个 Envoy sidecar 一起打包，拦截这些服务的入站和出站的调用请求，提供通过 Istio 控制平面从外部控制整个应用的路由，遥测收集和策略执行所需的 hook。

要启动该应用程序，请按照以下对应于您的 Istio 运行时环境的说明进行操作。

### 在 Kubernetes 中运行

> 注意：如果您使用 GKE，清确保您的集群至少有 4 个标准的 GKE 节点。如果您使用 Minikube，请确保您至少有 4GB 内存。

1. 将目录更改为 Istio 安装目录的根目录。

2. 构建应用程序容器：

   如果您使用 **自动注入 sidecar** 的方式部署的集群，那么只需要使用 `kubectl` 命令部署服务：

   ```bash
   kubectl apply -f samples/bookinfo/kube/bookinfo.yaml
   ```

   如果您使用 **手动注入 sidecar** 的方式部署的集群，清使用下面的命令：

   ```bash
   kubectl apply -f <(istioctl kube-inject -f samples/apps/bookinfo/bookinfo.yaml)
   ```

   请注意，该 `istioctl kube-inject` 命令用于在创建部署之前修改 `bookinfo.yaml` 文件。这将把 Envoy 注入到 Kubernetes 资源。

   上述命令启动四个微服务并创建网关入口资源，如下图所示。3 个版本的评论的服务 v1、v2、v3 都已启动。

   > 请注意在实际部署中，随着时间的推移部署新版本的微服务，而不是同时部署所有版本。

3. 确认所有服务和 pod 已正确定义并运行：

   ```bash
   kubectl get services
   ```

   这将产生以下输出：

   ```bash
   NAME                       CLUSTER-IP   EXTERNAL-IP   PORT(S)              AGE
   details                    10.0.0.31    <none>        9080/TCP             6m
   istio-ingress              10.0.0.122   <pending>     80:31565/TCP         8m
   istio-pilot                10.0.0.189   <none>        8080/TCP             8m
   istio-mixer                10.0.0.132   <none>        9091/TCP,42422/TCP   8m
   kubernetes                 10.0.0.1     <none>        443/TCP              14d
   productpage                10.0.0.120   <none>        9080/TCP             6m
   ratings                    10.0.0.15    <none>        9080/TCP             6m
   reviews                    10.0.0.170   <none>        9080/TCP             6m
   ```

   而且

   ```bash
   kubectl get pods
   ```

   将产生:

   ```bash
   NAME                                        READY     STATUS    RESTARTS   AGE
   details-v1-1520924117-48z17                 2/2       Running   0          6m
   istio-ingress-3181829929-xrrk5              1/1       Running   0          8m
   istio-pilot-175173354-d6jm7                 2/2       Running   0          8m
   istio-mixer-3883863574-jt09j                2/2       Running   0          8m
   productpage-v1-560495357-jk1lz              2/2       Running   0          6m
   ratings-v1-734492171-rnr5l                  2/2       Running   0          6m
   reviews-v1-874083890-f0qf0                  2/2       Running   0          6m
   reviews-v2-1343845940-b34q5                 2/2       Running   0          6m
   reviews-v3-1813607990-8ch52                 2/2       Running   0          6m
   ```

# 确定 ingress IP 和端口

1. 如果您的 kubernetes 集群环境支持外部负载均衡器的话，可以使用下面的命令获取 ingress 的IP地址：

   ```bash
   kubectl get ingress -o wide
   ```

   输出如下所示：

   ```bash
   NAME      HOSTS     ADDRESS                 PORTS     AGE
   gateway   *         130.211.10.121          80        1d
   ```

   Ingress 服务的地址是：

   ```bash
   export GATEWAY_URL=130.211.10.121:80
   ```

2. GKE：如果服务无法获取外部 IP，`kubectl get ingress -o wide` 会显示工作节点的列表。在这种情况下，您可以使用任何地址以及 NodePort 访问入口。但是，如果集群具有防火墙，则还需要创建防火墙规则以允许TCP流量到NodePort，您可以使用以下命令创建防火墙规则：

   ```bash
   export GATEWAY_URL=<workerNodeAddress>:$(kubectl get svc istio-ingress -n istio-system -o jsonpath='{.spec.ports[0].nodePort}')
   gcloud compute firewall-rules create allow-book --allow tcp:$(kubectl get svc istio-ingress -n istio-system -o jsonpath='{.spec.ports[0].nodePort}')
   ```

3. IBM Bluemix Free Tier：在免费版的 Bluemix 的 kubernetes 集群中不支持外部负载均衡器。您可以使用工作节点的公共 IP，并通过 NodePort 来访问 ingress。工作节点的公共 IP可以通过如下命令获取：

   ```bash
   bx cs workers <cluster-name or id>
   export GATEWAY_URL=<public IP of the worker node>:$(kubectl get svc istio-ingress -n istio-system -o jsonpath='{.spec.ports[0].nodePort}')
   ```

4. Minikube：Minikube 不支持外部负载均衡器。您可以使用 ingress 服务的主机 IP 和 NodePort 来访问 ingress：

   ```bash
   export GATEWAY_URL=$(kubectl get po -l istio=ingress -o 'jsonpath={.items[0].status.hostIP}'):$(kubectl get svc istio-ingress -o 'jsonpath={.spec.ports[0].nodePort}')
   ```

### 在 Consul 或 Eureka 环境下使用 Docker 运行

1. 切换到 Istio 的安装根目录下。

2. 启动应用程序容器。

   1. 执行下面的命令测试 Consul：

      ```bash
       docker-compose -f samples/bookinfo/consul/bookinfo.yaml up -d
      ```

   2. 执行下面的命令测试 Eureka：

      ```bash
       docker-compose -f samples/bookinfo/eureka/bookinfo.yaml up -d
      ```

3. 确认所有容器都在运行：

   ```bash
   docker ps -a
   ```

   > 如果 Istio Pilot 容器终止了，重新执行上面的命令重新运行。

4. 设置 `GATEWAY_URL`:

   ```bash
   export GATEWAY_URL=localhost:9081
   ```

## 下一步

使用以下 `curl` 命令确认 BookInfo 应用程序正在运行:

```bash
curl -o /dev/null -s -w "%{http_code}\n" http://${GATEWAY_URL}/productpage
```

```bash
200
```

你也可以通过在浏览器中打开 `http://$GATEWAY_URL/productpage` 页面访问 Bookinfo 网页。如果您多次刷新浏览器将在 productpage 中看到评论的不同的版本，它们会按照 round robin（红星、黑星、没有星星）的方式展现，因为我们还没有使用 Istio 来控制版本的路由。

现在，您可以使用此示例来尝试 Istio 的流量路由、故障注入、速率限制等功能。要继续的话，请参阅 [Istio 指南](http://istio.doczh.cn/docs/guides/index.md)，具体取决于您的兴趣。[智能路由](http://istio.doczh.cn/docs/guides/intelligent-routing.md) 是初学者入门的好方式。

## 清理

在完成 BookInfo 示例后，您可以卸载它，如下所示：

### 卸载 Kubernetes 环境

1. 删除路由规则，终止应用程序 pod

   ```bash
   samples/bookinfo/kube/cleanup.sh
   ```

2. 确认关闭

   ```bash
   istioctl get routerules   #-- there should be no more routing rules
   kubectl get pods          #-- the BookInfo pods should be deleted
   ```

### 卸载 docker 环境

1. 删除路由规则和应用程序容器

   1. 若使用 Consul 环境安装，执行下面的命令：

      ```bash
      samples/bookinfo/consul/cleanup.sh
      ```

   2. 若使用 Eureka 环境安装，执行下面的命令：

      ```bash
      samples/bookinfo/eureka/cleanup.sh
      ```

2. 确认清理完成：

   ```bash
   istioctl get routerules   #-- there should be no more routing rules
   docker ps -a              #-- the BookInfo containers should be deleted
   ```