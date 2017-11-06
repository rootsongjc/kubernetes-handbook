---
title: "在kubernetes集群上安装istio并测试bookinfo示例微服务"
subtitle: "本文翻译自istio官方文档"
date: 2017-11-06T22:54:40+08:00
draft: false
descripton: "在kubernetes集群上安装istio并测试bookinfo示例微服务，基于Istio0.22版本，kubernetes1.7及以上，翻译自Istio官方文档"
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