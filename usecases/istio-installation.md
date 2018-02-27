# 安装并试用Istio service mesh

本文根据官网的文档整理而成，步骤包括安装`istio 0.1.5`并创建一个bookinfo的微服务来测试istio的功能。

文中使用的yaml文件可以在[kubernetes-handbook](https://github.com/rootsongjc/kubernetes-handbook)的`manifests/istio`目录中找到，所有的镜像都换成了我的私有镜像仓库地址，请根据官网的镜像自行修改。

## 安装环境

- CentOS 7.3.1611
- Docker 1.12.6
- Kubernetes 1.6.0

## 安装

**1.下载安装包**

下载地址：https://github.com/istio/istio/releases

下载Linux版本的当前最新版安装包

```bash
wget https://github.com/istio/istio/releases/download/0.1.5/istio-0.1.5-linux.tar.gz
```

**2.解压**

解压后，得到的目录结构如下：

```
.
├── bin
│   └── istioctl
├── install
│   └── kubernetes
│       ├── addons
│       │   ├── grafana.yaml
│       │   ├── prometheus.yaml
│       │   ├── servicegraph.yaml
│       │   └── zipkin.yaml
│       ├── istio-auth.yaml
│       ├── istio-rbac-alpha.yaml
│       ├── istio-rbac-beta.yaml
│       ├── istio.yaml
│       ├── README.md
│       └── templates
│           ├── istio-auth
│           │   ├── istio-auth-with-cluster-ca.yaml
│           │   ├── istio-cluster-ca.yaml
│           │   ├── istio-egress-auth.yaml
│           │   ├── istio-ingress-auth.yaml
│           │   └── istio-namespace-ca.yaml
│           ├── istio-egress.yaml
│           ├── istio-ingress.yaml
│           ├── istio-manager.yaml
│           └── istio-mixer.yaml
├── istio.VERSION
├── LICENSE
└── samples
    ├── apps
    │   ├── bookinfo
    │   │   ├── bookinfo.yaml
    │   │   ├── cleanup.sh
    │   │   ├── destination-ratings-test-delay.yaml
    │   │   ├── loadbalancing-policy-reviews.yaml
    │   │   ├── mixer-rule-additional-telemetry.yaml
    │   │   ├── mixer-rule-empty-rule.yaml
    │   │   ├── mixer-rule-ratings-denial.yaml
    │   │   ├── mixer-rule-ratings-ratelimit.yaml
    │   │   ├── README.md
    │   │   ├── route-rule-all-v1.yaml
    │   │   ├── route-rule-delay.yaml
    │   │   ├── route-rule-reviews-50-v3.yaml
    │   │   ├── route-rule-reviews-test-v2.yaml
    │   │   ├── route-rule-reviews-v2-v3.yaml
    │   │   └── route-rule-reviews-v3.yaml
    │   ├── httpbin
    │   │   ├── httpbin.yaml
    │   │   └── README.md
    │   └── sleep
    │       ├── README.md
    │       └── sleep.yaml
    └── README.md

11 directories, 41 files
```

从文件里表中可以看到，安装包中包括了kubernetes的yaml文件，示例应用和安装模板。

**3.安装istioctl**

将`./bin/istioctl`拷贝到你的`$PATH`目录下。

**4.检查RBAC**

因为我们安装的kuberentes版本是1.6.0默认支持RBAC，这一步可以跳过。如果你使用的其他版本的kubernetes，请参考[官方文档](https://istio.io/docs/tasks/installing-istio.html)操作。

执行以下命令，正确的输出是这样的：

```bash
$ kubectl api-versions | grep rbac
rbac.authorization.k8s.io/v1alpha1
rbac.authorization.k8s.io/v1beta1
```

**5.创建角色绑定**

```bash
$ kubectl create -f install/kubernetes/istio-rbac-beta.yaml
clusterrole "istio-manager" created
clusterrole "istio-ca" created
clusterrole "istio-sidecar" created
clusterrolebinding "istio-manager-admin-role-binding" created
clusterrolebinding "istio-ca-role-binding" created
clusterrolebinding "istio-ingress-admin-role-binding" created
clusterrolebinding "istio-sidecar-role-binding" created
```

注意：官网的安装包中的该文件中存在RoleBinding错误，应该是集群级别的`clusterrolebinding`，而release里的代码只是普通的`rolebinding`，查看该Issue [Istio manager cannot list of create k8s TPR when RBAC enabled #327](https://github.com/istio/istio/issues/327)。

**6.安装istio核心组件**

用到的镜像有：

```
docker.io/istio/mixer:0.1.5
docker.io/istio/manager:0.1.5
docker.io/istio/proxy_debug:0.1.5
```

我们暂时不开启[Istio Auth](https://istio.io/docs/concepts/network-and-auth/auth.html)。

> 本文中用到的所有yaml文件中的`type: LoadBalancer`去掉，使用默认的ClusterIP，然后配置Traefik ingress，就可以在集群外部访问。请参考[安装Traefik ingress](../practice/traefik-ingress-installation.md)。

```bash
kubectl apply -f install/kubernetes/istio.yaml
```

**7.安装监控插件**

用到的镜像有：

```
docker.io/istio/grafana:0.1.5
quay.io/coreos/prometheus:v1.1.1
gcr.io/istio-testing/servicegraph:latest
docker.io/openzipkin/zipkin:latest
```

为了方便下载，其中两个镜像我备份到了时速云：

```
index.tenxcloud.com/jimmy/prometheus:v1.1.1
index.tenxcloud.com/jimmy/servicegraph:latest
```

安装插件

```bash
kubectl apply -f install/kubernetes/addons/prometheus.yaml
kubectl apply -f install/kubernetes/addons/grafana.yaml
kubectl apply -f install/kubernetes/addons/servicegraph.yaml
kubectl apply -f install/kubernetes/addons/zipkin.yaml
```

在traefik ingress中增加增加以上几个服务的配置，同时增加istio-ingress配置。

```yaml
    - host: grafana.istio.io
      http:
        paths:
        - path: /
          backend:
            serviceName: grafana
            servicePort: 3000
    - host: servicegraph.istio.io
      http:
        paths:
        - path: /
          backend:
            serviceName: servicegraph
            servicePort: 8088
    - host: prometheus.istio.io
      http:
        paths:
        - path: /
          backend:
            serviceName: prometheus
            servicePort: 9090
    - host: zipkin.istio.io
      http:
        paths:
        - path: /
          backend:
            serviceName: zipkin
            servicePort: 9411
    - host: ingress.istio.io
      http:
        paths:
        - path: /
          backend:
            serviceName: istio-ingress
            servicePort: 80
```

## 测试

我们使用Istio提供的测试应用[bookinfo](https://istio.io/docs/samples/bookinfo.html)微服务来进行测试。

该微服务用到的镜像有：

```
istio/examples-bookinfo-details-v1
istio/examples-bookinfo-ratings-v1
istio/examples-bookinfo-reviews-v1
istio/examples-bookinfo-reviews-v2
istio/examples-bookinfo-reviews-v3
istio/examples-bookinfo-productpage-v1
```

该应用架构图如下：

![BookInfo Sample应用架构图](../images/bookinfo-sample-arch.png)

**部署应用**

```
kubectl create -f <(istioctl kube-inject -f samples/apps/bookinfo/bookinfo.yaml)
```

`Istio kube-inject`命令会在`bookinfo.yaml`文件中增加Envoy sidecar信息。参考：https://istio.io/docs/reference/commands/istioctl.html#istioctl-kube-inject

在本机的`/etc/hosts`下增加VIP节点和`ingress.istio.io`的对应信息。具体步骤参考：[边缘节点配置](../practice/edge-node-configuration.md)

在浏览器中访问http://ingress.istio.io/productpage

![BookInfo Sample页面](../images/bookinfo-sample.jpg)

多次刷新页面，你会发现有的页面上的评论里有星级打分，有的页面就没有，这是因为我们部署了三个版本的应用，有的应用里包含了评分，有的没有。Istio根据默认策略随机将流量分配到三个版本的应用上。

查看部署的bookinfo应用中的`productpage-v1` service和deployment，查看`productpage-v1`的pod的详细json信息可以看到这样的结构：

```bash
$ kubectl get productpage-v1-944450470-bd530 -o json
```

见[productpage-v1-istio.json](../manifests/istio/productpage-v1-istio.json)文件。从详细输出中可以看到这个Pod中实际有两个容器，这里面包括了`initContainer`，作为istio植入到kubernetes deployment中的sidecar。

```json
"initContainers": [
            {
                "args": [
                    "-p",
                    "15001",
                    "-u",
                    "1337"
                ],
                "image": "docker.io/istio/init:0.1",
                "imagePullPolicy": "Always",
                "name": "init",
                "resources": {},
                "securityContext": {
                    "capabilities": {
                        "add": [
                            "NET_ADMIN"
                        ]
                    }
                },
                "terminationMessagePath": "/dev/termination-log",
                "terminationMessagePolicy": "File",
                "volumeMounts": [
                    {
                        "mountPath": "/var/run/secrets/kubernetes.io/serviceaccount",
                        "name": "default-token-3l9f0",
                        "readOnly": true
                    }
                ]
            },
            {
                "args": [
                    "-c",
                    "sysctl -w kernel.core_pattern=/tmp/core.%e.%p.%t \u0026\u0026 ulimit -c unlimited"
                ],
                "command": [
                    "/bin/sh"
                ],
                "image": "alpine",
                "imagePullPolicy": "Always",
                "name": "enable-core-dump",
                "resources": {},
                "securityContext": {
                    "privileged": true
                },
                "terminationMessagePath": "/dev/termination-log",
                "terminationMessagePolicy": "File",
                "volumeMounts": [
                    {
                        "mountPath": "/var/run/secrets/kubernetes.io/serviceaccount",
                        "name": "default-token-3l9f0",
                        "readOnly": true
                    }
                ]
            }
        ],
```

## 监控

不断刷新productpage页面，将可以在以下几个监控中看到如下界面。

**Grafana页面**

http://grafana.istio.io

![Istio Grafana界面](../images/istio-grafana.jpg)

**Prometheus页面**

http://prometheus.istio.io

![Prometheus页面](../images/istio-prometheus.jpg)

**Zipkin页面**

http://zipkin.istio.io

![Zipkin页面](../images/istio-zipkin.jpg)

**ServiceGraph页面**

http://servicegraph.istio.io/dotviz

可以用来查看服务间的依赖关系。

访问 http://servicegraph.istio.io/graph 可以获得json格式的返回结果。

![ServiceGraph页面](../images/istio-servicegraph.jpg)

## 更进一步

BookInfo示例中有三个版本的`reviews`，可以使用istio来配置路由请求，将流量分发到不同版本的应用上。参考[Configuring Request Routing](https://istio.io/docs/tasks/request-routing.html)。

还有一些更高级的功能，我们后续将进一步探索。

## 参考

[Installing Istio](https://istio.io/docs/tasks/installing-istio.html)

[BookInfo sample](https://istio.io/docs/samples/bookinfo.html)