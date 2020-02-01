---
title: "适用于kubernetes的应用开发部署流程同时集成Istio service mesh"
date: 2018-03-26T22:48:44+08:00
description: "本文讲解了如何开发容器化应用，并集成Istio service mesh中的详细过程。"
draft: false
categories: ["Kubernetes"]
tags: ["istio"]
type: "post"
bg_image: "images/backgrounds/page-title.jpg"
aliases: "/posts/creating-cloud-native-app-with-kubernetes"
image: "images/banner/kubernetes.jpg"
---

本文讲解了如何开发容器化应用，并使用Wercker持续集成工具构建docker镜像上传到docker镜像仓库中，然后在本地使用`docker-compose`测试后，再使用`kompose`自动生成kubernetes的yaml文件，再将注入Envoy sidecar容器，集成Istio service mesh中的详细过程。

当我们有了一个kubernetes集群后，如何在上面开发和部署应用，应该遵循怎样的流程？本次分享将向您展示如何使用go语言开发和部署一个kubernetes native应用，使用wercker进行持续集成与持续发布，我将以一个很简单的前后端访问，获取伪造数据并展示的例子来说明。

**注**：本文部分内容曾是我2017年9月14日在DockOne社区分享的内容，本文同时归档到[kubernetes-handbook](https://jimmysong.io/kubernetes-handbook)中。

整个过程如下图所示。

![流程图](https://jimmysong.io/kubernetes-handbook/images/how-to-use-kubernetes-with-istio.jpg)

**主要内容**

- 服务API的定义
- 使用Go语言开发kubernetes原生应用
- 使用wercker做持续构建与发布
- 使用traefik和VIP做边缘节点提供外部访问路由
- 集成Istio Service Mesh

## 环境声明

首先声明下我们使用的集群环境：

- Docker1.12.5
- flannel network host-gw
- kubernetes 1.6.0+
- TLS enabled

详细的部署文档和更多资料请参考 [kubernetes-handbook](https://github.com/rootsongjc/kubernetes-handbook)

## 应用示例

我们的这两个示例仅仅是为了演示，开发部署一个伪造的 metric 并显示在 web 页面上，包括两个service：

- [k8s-app-monitor-test](https://github.com/rootsongjc/k8s-app-monitor-test)：生成模拟的监控数据，发送http请求，获取json返回值
- [K8s-app-monitor-agent](https://github.com/rootsongjc/k8s-app-monitor-agent)：获取监控数据并绘图，访问浏览器获取图表

这两个镜像可以直接从docker hub上下载

- jimmysong/k8s-app-monitor-test:latest
- jimmysong/k8s-app-monitor-agent:latest

### 定义API

[API文档](https://github.com/rootsongjc/k8s-app-monitor-test) 中的`api.html`文件，该文档在API blueprint中定义，使用[aglio](https://github.com/danielgtaylor/aglio) 生成，打开后如图所示：

![API文档](https://res.cloudinary.com/jimmysong/image/upload/images/k8s-app-monitor-test-api-doc.jpg)

### 关于服务发现

`K8s-app-monitor-agent`服务需要访问`k8s-app-monitor-test`服务，这就涉及到服务发现的问题，我们在代码中直接写死了要访问的服务的内网DNS地址（kubedns中的地址，即`k8s-app-monitor-test.default.svc.cluster.local`）。

我们知道Kubernetes在启动Pod的时候为容器注入环境变量，这些环境变量在所有的 namespace 中共享（环境变量是不断追加的，新启动的Pod中将拥有老的Pod中所有的环境变量，而老的Pod中的环境变量不变）。但是既然使用这些环境变量就已经可以访问到对应的service，那么获取应用的地址信息，究竟是使用变量呢？还是直接使用DNS解析来发现？

答案是使用DNS，详细说明见[Kubernetes中的服务发现与Docker容器间的环境变量传递源码探究](http://jimmysong.io/posts/exploring-kubernetes-env-with-docker/)

## 持续集成

开源项目的构建离不开CI工具，你可能经常会在很多GitHub的开源项目首页上看到这样的东西：

![wercker status badge](https://res.cloudinary.com/jimmysong/image/upload/images/wercker-budget.jpg)

这些图标都是CI工具提供的，可以直观的看到当前的构建状态，例如wercker中可以在`Application`-`magpie`-`options`中看到：

![wercker status badge设置](https://res.cloudinary.com/jimmysong/image/upload/images/wercker-status-budge-setting.jpg)

将文本框中的代码复制到你的项目的`README`文件中，就可以在项目主页上看到这样的标志了。

现在市面上有很多流行的CI/CD工具和DevOps工具有很多，这些工具提高了软件开发的效率，增加了开发人员的幸福感。这些工具有：

适用于GitHub上的开源项目，可以直接使用GitHub账户登陆，对于公开项目可以直接使用：[Travis-ci](https://travis-ci.org/)、[CircleCI](https://circleci.com/)、[Wercker](http://www.wercker.com/)。从目前GitHub上开源项目的使用情况来看，Travis-ci的使用率更高一些。

适用于企业级的：[Jenkins](https://jenkins.io/)

不仅包括CI/CD功能的DevOps平台：[JFrog](https://www.jfrog.com/)、[Spinnaker](https://spinnaker.io/)、[Fabric8](https://fabric8.io/)

#### Wercker简介

Wercker是一家为现代云服务提供容器化应用及微服务的快速开发、部署工具的初创企业，成立于2012年，总部位于荷兰阿姆斯特丹。其以容器为中心的平台可以对微服务和应用的开发进行自动化。开发者通过利用其命令行工具能够生成容器到桌面，然后自动生成应用并部署到各种云平台上面。其支持的平台包括Heroku、AWS以及Rackspace等。

Wercker于2016年获得450万美元A轮融资，此轮融资由Inkef Capital领投，Notion Capital跟投，融资所得将用于商业版产品的开发。此轮融资过后其总融资额为750万美元。

Wercker于2017年4月被Oracle甲骨文于收购。

#### 如何使用

通过Wercker搭建CI环境只需经过三个基本步骤。

1．在Wercker网站中创建一个应用程序。

2．将wercker.yml添加到应用程序的代码库中。

3．选择打包和部署构建的位置。

可以使用GitHub帐号直接登录[Wercker](http://www.wercker.com/)，整个创建应用CI的流程一共3步。

一旦拥有了账户，那么只需简单地点击位于顶部的**应用程序**菜单，然后选择**创建**选项即可。如果系统提示是否要创建组织或应用程序，请选择**应用程序**。Wercker组织允许多个Wercker用户之间进行协作，而无须提供信用卡。下图为设置新应用程序的向导页面。

![向导页面](https://res.cloudinary.com/jimmysong/image/upload/images/wercker-create-application.jpg)

选择了GitHub中的repo之后，第二步配置访问权限，最后一步Wercker会尝试生成一个wercker.yml文件（后面会讨论）。不过至少对于Go应用程序来说，这个配置很少会满足要求，所以我们总是需要创建自己的Wercker配置文件。

#### 创建Wercker配置文件Wercker.yaml

Wercker配置文件是一个YAML文件，该文件必须在GitHub repo的最顶层目录，该文件主要包含三个部分，对应可用的三个主要管道。

 **Dev**：定义了开发管道的步骤列表。与所有管道一样，可以选定一个**box**用于构建，也可以全局指定一个box应用于所有管道。box可以是Wercker内置的预制Docker镜像之一，也可以是Docker Hub托管的任何Docker镜像。

**Build**：定义了在Wercker构建期间要执行的步骤和脚本的列表。与许多其他服务（如Jenkins和TeamCity）不同，构建步骤位于代码库的配置文件中，而不是隐藏在服务配置里。

**Deploy**：在这里可以定义构建的部署方式和位置。

Wercker中还有**工作流**的概念，通过使用分支、条件构建、多个部署目标和其他高级功能扩展了管道的功能，这些高级功能读着可以自己在wercker的网站中探索。

因为我使用wercker自动构建，构建完成后自动打包成docker镜像并上传到docker hub中（需要先在docker hub中创建repo），如何使用 wercker 做持续构建与发布，并集成docker hub插件请参考：[wercker构建](https://jimmysong.io/posts/continuous-integration-with-wercker/)

K8s-app-monitor-agent的wercker配置文件如下：

```yaml
box: golang

build:

  steps:
    - setup-go-workspace

    - script:
        name: go get
        code: |
          cd $WERCKER_SOURCE_DIR
          go version
          go get -u github.com/Masterminds/glide
          export PATH=$WERCKER_SOURCE_DIR/bin:$PATH
          glide install
    # Build the project
    - script:
        name: go build
        code: |
          go build
    - script:
        name: copy files to wercker output 
        code: |
          cp -R ./ ${WERCKER_OUTPUT_DIR}
deploy:
 steps:
   - internal/docker-push:
       username: $USERNAME
       password: $PASSWORD
       cmd: /pipeline/source/k8s-app-monitor-agent
       port: "3000"
       tag: latest
       repository: jimmysong/k8s-app-monitor-agent
```

其中的`$USERNAME`和`$PASSWORD`是docker hub的用户名和密码，这些是作为wercker构建时候的环境变量，在wercker的web端进行配置的。

此文件包含两个管道：build和deploy。在开发流程中，我们使用Wercker和Docker创建一个干净的Docker镜像，然后将它push到Docker Hub中。Wercker包含一个叫做`Internal/docker-push`的deploy plugin，可以将构建好的docker镜像push到镜像仓库中，默认是Docker Hub，也可以配置成私有镜像仓库。

box键的值是golang。这意味着我们使用的是一个基础的Docker镜像，它已经安装了Go环境。这一点至关重要，因为执行Wercker构建的基准Docker镜像需要包含应用程序所需的构建工具。

[查看详细构建流程](https://app.wercker.com/jimmysong/k8s-app-monitor-agent)

> 当然你还可以使用其他的CI工具，因为wercker的插件比较方便，可以直接构建成docker镜像上传到docker hub中，比较方便，所以我选择了wercker，作为个人项目和开源项目的话可以选择它，企业内部建议选择Jenkins。

生成了如下两个docker镜像：

- jimmysong/k8s-app-monitor-test:latest
- jimmysong/k8s-app-monitor-agent:latest

## 本地测试

在将服务发布到线上之前，我们可以先使用`docker-compose`在本地测试一下，这两个应用的`docker-compose.yaml`文件如下：

```yaml
version: '2'
services:
  k8s-app-monitor-agent:
    image: jimmysong/k8s-app-monitor-agent:234d51c
    container_name: monitor-agent
    depends_on:
      - k8s-app-monitor-test
    ports:
      - 8888:8888
    environment:
      - SERVICE_NAME=k8s-app-monitor-test
  k8s-app-monitor-test:
    image: jimmysong/k8s-app-monitor-test:9c935dd
    container_name: monitor-test
    ports:
      - 3000:3000
```

执行下面的命令运行测试。

```bash
docker-compose up
```

在浏览器中访问<http://localhost:8888/k8s-app-monitor-test>就可以看到监控页面。

## 启动服务

所有的kubernetes应用启动所用的yaml配置文件都保存在那两个GitHub仓库的`manifest.yaml`文件中。

比如`k8s-app-monitor-agent`的`manifest.yaml`文件如下：

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: k8s-app-monitor-agent
  namespace: default
spec:
  replicas: 1
  template:
    metadata:
      labels:
        k8s-app: k8s-app-monitor-agent
    spec:
      containers:
      - image: jimmysong/k8s-app-monitor-agent:latest
        imagePullPolicy: Always
        name: app
        ports:
        - containerPort: 8080
        env: 
        - name: APP_PORT
          value: "3000"
        - name: SERVICE_NAME
          value: "k8s-app-monitor-test"
---
apiVersion: v1
kind: Service
metadata:
  name: k8s-app-monitor-agent
  labels:
    k8s-svc: k8s-app-monitor-agent
spec:
  ports:
  - port: 8080
    protocol: TCP
    name: http
  selector:
    k8s-app: k8s-app-monitor-agent
```

注意其中的`env`，包括了两个环境变量（注意：环境变量名称必须为大写字母）：`APP_PORT`和`SERVICE_NAME`，这两个环境变量，在 `main.go`的代码中我们可以看到：

```go
func drawChart(res http.ResponseWriter, req *http.Request) {
	port := os.Getenv("APP_PORT")
	service := os.Getenv("SERVICE_NAME")
	if len(port) == 0 {
		port = "3000"
	}
	if len(service) == 0 {
		service = "localhost"
	}
```

如果程序启动的时候找不到该环境变量，将会使用程序内置的默认值，当然我们不该将服务地址写死在程序内部，而应该是可配置的，在kubernetes中最佳配置方式是环境变量或者ConfigMap。

分别在两个GitHub目录下执行`kubectl create -f manifest.yaml`即可启动服务。

## 边缘节点配置

边缘节点架构图

![边缘节点架构图](https://res.cloudinary.com/jimmysong/image/upload/images/kubernetes-edge-node-architecture.png)

选择Kubernetes的三个node作为边缘节点，并安装keepalived，上图展示了边缘节点的配置，同时展示了向Kubernetes中添加服务的过程。

**边缘节点定义**

首先解释下什么叫边缘节点（Edge Node），所谓的边缘节点即集群内部用来向集群外暴露服务能力的节点，集群外部的服务通过该节点来调用集群内部的服务，边缘节点是集群内外交流的一个Endpoint。

**边缘节点要考虑两个问题**

- 边缘节点的高可用，不能有单点故障，否则整个kubernetes集群的外部访问将不可用
- 对外的一致暴露端口，即只能有一个外网访问IP和端口

为了满足边缘节点的以上需求，我们使用[keepalived](http://www.keepalived.org/)来实现。

在Kubernetes中添加了service的同时，在DNS中增加一个记录，这条记录需要跟ingress中的`host`字段相同，IP地址即VIP的地址，本示例中是`172.20.0.119`，这样集群外部就可以通过service的DNS名称来访问服务了。

参考[详细操作步骤和配置](https://github.com/rootsongjc/kubernetes-handbook/blob/master/practice/edge-node-configuration.md)

## 发布

所有的kubernetes应用启动所用的yaml配置文件都保存在那两个GitHub仓库的`manifest.yaml`文件中。也可以使用[kompose](https://github.com/kubernetes/kompose)这个工具，可以将*docker-compose*的YAML文件转换成kubernetes规格的YAML文件。

分别在两个GitHub目录下执行`kubectl create -f manifest.yaml`即可启动服务。也可以直接在*k8s-app-monitor-agent*代码库的`k8s`目录下执行`kubectl apply -f kompose`。

在以上YAML文件中有包含了Ingress配置，是为了将*k8s-app-monitor-agent*服务暴露给集群外部访问。

**方式一**

服务启动后需要更新ingress配置，在[ingress.yaml](https://jimmysong.io/kubernetes-handbook/manifests/traefik-ingress/ingress.yaml)文件中增加以下几行：

```yaml
  - host: k8s-app-monitor-agent.jimmysong.io
    http:
      paths:
      - path: /k8s-app-monitor-agent
        backend:
          serviceName: k8s-app-monitor-agent
          servicePort: 8888
```

保存后，然后执行`kubectl replace -f ingress.yaml`即可刷新ingress。

修改本机的`/etc/hosts`文件，在其中加入以下一行：

```ini
172.20.0.119 k8s-app-monitor-agent.jimmysong.io
```

当然你也可以将该域名加入到内网的DNS中，为了简单起见我使用hosts。

**方式二**

或者不修改已有的Ingress，而是为该队外暴露的服务单独创建一个Ingress，如下：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: k8s-app-monitor-agent-ingress
  annotations:
    kubernetes.io/ingress.class: "treafik"
spec:
  rules:
  - host: k8s-app-monitor-agent.jimmysong.io
    http:
      paths:
      - path: /
        backend:
          serviceName: k8s-app-monitor-agent
          servicePort: 8888
```

详见[边缘节点配置](https://jimmysong.io/kubernetes-handbook/practice/edge-node-configuration.html)。

## 集成Istio service mesh

上一步中我们生成了kubernetes可读取的应用的YAML配置文件，我们可以将所有的YAML配置和并到同一个YAML文件中假如文件名为`k8s-app-monitor-istio-all-in-one.yaml`，如果要将其集成到Istio service mesh，只需要执行下面的命令。

```bash
kubectl apply -n default -f <(istioctl kube-inject -f k8s-app-monitor-istio-all-in-one.yaml)
```

这样就会在每个Pod中注入一个sidecar容器。

## 验证

如果您使用的是Traefik ingress来暴露的服务，那么在浏览器中访问<http://k8s-app-monitor-agent.jimmysong.io/k8s-app-monitor-agent>，可以看到如下的画面，每次刷新页面将看到新的柱状图。

![图表](https://jimmysong.io/kubernetes-handbook/images/k8s-app-monitor-agent.jpg)

使用[kubernetes-vagrant-centos-cluster](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster)来部署的kubernetes集群，该应用集成了Istio service mesh后可以通过<http://172.17.8.101:32000/k8s-app-monitor-agent>来访问。

在对`k8s-app-monitor-agent`服务进行了N此访问之后，再访问[http://grafana.istio.jimmysong.io](http://grafana.istio.jimmysong.io/)可以看到Service Mesh的监控信息。

![Grafana页面](https://jimmysong.io/kubernetes-handbook/images/k8s-app-monitor-istio-grafana.png)

访问<http://servicegraph.istio.jimmysong.io/dotviz>可以看到服务的依赖和QPS信息。

![servicegraph页面](https://jimmysong.io/kubernetes-handbook/images/k8s-app-monitor-istio-servicegraph-dotviz.png)

访问[http://zipkin.istio.jimmysong.io](http://zipkin.istio.jimmysong.io/)可以选择查看`k8s-app-monitor-agent`应用的追踪信息。

![Zipkin页面](https://jimmysong.io/kubernetes-handbook/images/k8s-app-monitor-istio-zipkin.png)

至此从代码提交到上线到Kubernetes集群上并集成Istio service mesh的过程就全部完成了。

> 本文首发于2017年9月14日，更新于2018年3月26日。

## 参考

- [适用于Kubernetes的应用开发与部署流程详解](https://jimmysong.io/posts/deploy-applications-in-kubernetes/)
- [示例的项目代码服务器端](https://app.wercker.com/jimmysong/k8s-app-monitor-agent/)
- [示例项目代码前端](https://github.com/rootsongjc/k8s-app-monitor-agent)
- [kubernetes-handbok](https://jimmysong.io/kubernetes-handbook/)
- [边缘节点配置](https://github.com/rootsongjc/kubernetes-handbook/blob/master/practice/edge-node-configuration.md)

