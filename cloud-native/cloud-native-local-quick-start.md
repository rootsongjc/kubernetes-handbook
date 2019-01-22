# 快速部署一个云原生本地实验环境

本文旨在帮助您快速部署一个云原生本地实验环境，让您可以基本不需要任何Kubernetes和云原生技术的基础就可以对云原生环境一探究竟。

本文中使用[kubernetes-vagrant-centos-cluster](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster)在本地使用 Vagrant 启动三个虚拟机部署分布式的Kubernetes集群。

如仅需要体验云原生环境和测试服务功能，可以使用更加轻量级的[cloud-native-sandbox](https://github.com/rootsongjc/cloud-native-sandbox)，通过个人电脑的Docker部署单节点的Kubernetes、Istio等云原生环境。

## 准备环境

需要准备以下软件和环境：

- 8G以上内存
- [Vagrant 2.0+](https://www.vagrantup.com/)
- [VirtualBox 5.0 +](https://www.virtualbox.org/wiki/Downloads)
- 提前下载kubernetes1.9.1以上版本的release压缩包，[至百度网盘下载](https://pan.baidu.com/s/1zkg2xEAedvZHObmTHDFChg)
- Mac/Linux，**不支持Windows**
- 支持Kubernetes1.9以上版本（支持当前Kubernetes最新版本1.11.1）

## 集群

我们使用Vagrant和Virtualbox安装包含3个节点的kubernetes集群，其中master节点同时作为node节点。

| IP           | 主机名 | 组件                                                         |
| ------------ | ------ | ------------------------------------------------------------ |
| 172.17.8.101 | node1  | kube-apiserver、kube-controller-manager、kube-scheduler、etcd、kubelet、docker、flannel、dashboard |
| 172.17.8.102 | node2  | kubelet、docker、flannel、traefik                            |
| 172.17.8.103 | node3  | kubelet、docker、flannel                                     |

**注意**：以上的IP、主机名和组件都是固定在这些节点的，即使销毁后下次使用vagrant重建依然保持不变。

容器IP范围：172.33.0.0/30

Kubernetes service IP范围：10.254.0.0/16

## 安装的组件

安装完成后的集群包含以下组件：

- flannel（`host-gw`模式）
- kubernetes dashboard
- etcd（单节点）
- kubectl
- CoreDNS
- kubernetes（版本根据下载的kubernetes安装包而定）

**可选插件**

- Heapster + InfluxDB  + Grafana
- ElasticSearch + Fluentd + Kibana
- Istio service mesh

## 使用说明

确保安装好以上的准备环境后，执行下列命令启动kubernetes集群：

```bash
git clone https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster.git
cd kubernetes-vagrant-centos-cluster
vagrant up
```

**注意**：克隆完Git仓库后，需要提前下载kubernetes的压缩包到`kubenetes-vagrant-centos-cluster`目录下，包括如下两个文件：

- kubernetes-client-linux-amd64.tar.gz
- kubernetes-server-linux-amd64.tar.gz

如果是首次部署，会自动下载`centos/7`的box，这需要花费一些时间，另外每个节点还需要下载安装一系列软件包，整个过程大概需要10几分钟。

如果您在运行`vagrant up`的过程中发现无法下载`centos/7`的box，可以手动下载后将其添加到vagrant中。

**手动添加centos/7 box**

```bash
wget -c http://cloud.centos.org/centos/7/vagrant/x86_64/images/CentOS-7-x86_64-Vagrant-1801_02.VirtualBox.box
vagrant box add CentOS-7-x86_64-Vagrant-1801_02.VirtualBox.box --name centos/7
```

这样下次运行`vagrant up`的时候就会自动读取本地的`centos/7` box而不会再到网上下载。

### 访问kubernetes集群

访问Kubernetes集群的方式有三种：

- 本地访问
- 在VM内部访问
- kubernetes dashboard

**通过本地访问**

可以直接在你自己的本地环境中操作该kubernetes集群，而无需登录到虚拟机中，执行以下步骤：

将`conf/admin.kubeconfig`文件放到`~/.kube/config`目录下即可在本地使用`kubectl`命令操作集群。

```bash
mkdir -p ~/.kube
cp conf/admin.kubeconfig ~/.kube/config
```

我们推荐您使用这种方式。

**在虚拟机内部访问**

如果有任何问题可以登录到虚拟机内部调试：

```bash
vagrant ssh node1
sudo -i
kubectl get nodes
```

**Kubernetes dashboard**

还可以直接通过dashboard UI来访问：https://172.17.8.101:8443

可以在本地执行以下命令获取token的值（需要提前安装kubectl）：

```bash
kubectl -n kube-system describe secret `kubectl -n kube-system get secret|grep admin-token|cut -d " " -f1`|grep "token:"|tr -s " "|cut -d " " -f2
```

**注意**：token的值也可以在`vagrant up`的日志的最后看到。

![Kubernetes dashboard](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster/raw/master/images/dashboard-animation.gif)

**Heapster监控**

创建Heapster监控：

```bash
kubectl apply -f addon/heapster/
```

访问Grafana

使用Ingress方式暴露的服务，在本地`/etc/hosts`中增加一条配置：

```ini
172.17.8.102 grafana.jimmysong.io
```

访问Grafana：`http://grafana.jimmysong.io`

![Grafana](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster/raw/master/images/grafana-animation.gif)

**Traefik**

部署Traefik ingress controller和增加ingress配置：

```bash
kubectl apply -f addon/traefik-ingress
```

在本地`/etc/hosts`中增加一条配置：

```ini
172.17.8.102 traefik.jimmysong.io
```

访问Traefik UI：<http://traefik.jimmysong.io>

![Traefik dashboard](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster/raw/master/images/traefik-ingress.gif)

**EFK**

使用EFK做日志收集。

```bash
kubectl apply -f addon/efk/
```

**注意**：运行EFK的每个节点需要消耗很大的CPU和内存，请保证每台虚拟机至少分配了4G内存。

**Helm**

用来部署helm。

```bash
hack/deploy-helm.sh
```

### Service Mesh

我们使用 [istio](https://istio.io) 作为 service mesh。

**安装**

```bash
kubectl apply -f addon/istio/
```

**运行示例**

```bash
kubectl apply -n default -f <(istioctl kube-inject -f yaml/istio-bookinfo/bookinfo.yaml)
istioctl create -f yaml/istio-bookinfo/bookinfo-gateway.yaml
```

在您自己的本地主机的`/etc/hosts`文件中增加如下配置项。

```
172.17.8.102 grafana.istio.jimmysong.io
172.17.8.102 servicegraph.istio.jimmysong.io
```

我们可以通过下面的URL地址访问以上的服务。

| Service      | URL                                                          |
| ------------ | ------------------------------------------------------------ |
| grafana      | `http://grafana.istio.jimmysong.io`                          |
| servicegraph | `http://servicegraph.istio.jimmysong.io/dotviz`, `http://servicegraph.istio.jimmysong.io/graph`, `http://servicegraph.istio.jimmysong.io/force/forcegraph.htm` |
| tracing      | `http://172.17.8.101:$JAEGER_PORT`                           |
| productpage  | `http://172.17.8.101:$GATEWAY_PORT/productpage`              |

**注意**：`JAEGER_PORT`可以通过`kubectl -n istio-system get svc tracing -o jsonpath='{.spec.ports[0].nodePort}'`获取，`GATEWAY_PORT`可以通过`kubectl -n istio-system get svc istio-ingressgateway -o jsonpath='{.spec.ports[0].nodePort}'`获取。

详细信息请参阅 https://istio.io/zh/docs/examples/bookinfo/

![bookinfo示例](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster/raw/master/images/bookinfo-demo.gif)

### Vistio

[Vizceral](https://github.com/Netflix/vizceral)是Netflix发布的一个开源项目，用于近乎实时地监控应用程序和集群之间的网络流量。Vistio是使用Vizceral对Istio和网格监控的改进。它利用Istio Mixer生成的指标，然后将其输入Prometheus。Vistio查询Prometheus并将数据存储在本地以允许重播流量。

```bash
# Deploy vistio via kubectl
kubectl apply -f addon/vistio/

# Expose vistio-api
kubectl -n default port-forward $(kubectl -n default get pod -l app=vistio-api -o jsonpath='{.items[0].metadata.name}') 9091:9091 &

# Expose vistio in another terminal window
kubectl -n default port-forward $(kubectl -n default get pod -l app=vistio-web -o jsonpath='{.items[0].metadata.name}') 8080:8080 &
```

如果一切都已经启动并准备就绪，您就可以访问Vistio UI，开始探索服务网格网络，访问[http://localhost:8080](http://localhost:8080/) 您将会看到类似下图的输出。

![vistio视图动画](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster/raw/master/images/vistio-animation.gif)

更多详细内容请参考[Vistio—使用Netflix的Vizceral可视化Istio service mesh](https://servicemesher.github.io/blog/vistio-visualize-your-istio-mesh-using-netflixs-vizceral/)。

### Kiali

Kiali是一个用于提供Istio service mesh观察性的项目，更多信息请查看 [https://kiali.io](https://kiali.io/)。

在本地该项目的根路径下执行下面的命令：

```bash
kubectl apply -n istio-system -f addon/kiali
```

Kiali web地址：`http://172.17.8.101:31439`

用户名/密码：admin/admin

![Kiali页面](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster/raw/master/images/kiali.gif)

**注意**：Kilia使用Jaeger做追踪，请不用屏蔽kilia页面的弹出窗口。

### Weave scope

[Weave scope](https://github.com/weaveworks/scope)可用于监控、可视化和管理Docker&Kubernetes集群，详情见 https://www.weave.works/oss/scope/ 

在本地该项目的根路径下执行下面的命令：

```bash
kubectl apply -f addon/weave-scope
```

在本地的`/etc/hosts`下增加一条记录。

```
172.17.8.102 scope.weave.jimmysong.io
```

现在打开浏览器，访问 `http://scope.weave.jimmysong.io/`

![Scope页面](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster/raw/master/images/weave-scope-animation.gif)

## 管理

除了特别说明，以下命令都在当前的repo目录下操作。

### 挂起

将当前的虚拟机挂起，以便下次恢复。

```bash
vagrant suspend
```

### 恢复

恢复虚拟机的上次状态。

```bash
vagrant resume
```

注意：我们每次挂起虚拟机后再重新启动它们的时候，看到的虚拟机中的时间依然是挂载时候的时间，这样将导致监控查看起来比较麻烦。因此请考虑先停机再重新启动虚拟机。

### 重启

停机后重启启动。

```bash
vagrant halt
vagrant up
# login to node1
vagrant ssh node1
# run the prosivision scripts
/vagrant/hack/k8s-init.sh
exit
# login to node2
vagrant ssh node2
# run the prosivision scripts
/vagrant/hack/k8s-init.sh
exit
# login to node3
vagrant ssh node3
# run the prosivision scripts
/vagrant/hack/k8s-init.sh
sudo -i
cd /vagrant/hack
./deploy-base-services.sh
exit
```

现在你已经拥有一个完整的基础的kubernetes运行环境，在该repo的根目录下执行下面的命令可以获取kubernetes dahsboard的admin用户的token。

```bash
hack/get-dashboard-token.sh
```

根据提示登录即可。

### 清理

清理虚拟机。

```bash
vagrant destroy
rm -rf .vagrant
```

### 注意

仅做开发测试使用，不要在生产环境使用该项目。

## 参考

- [Kubernetes handbook - jimmysong.io](https://jimmysong.io/kubernetes-handbook)
- [duffqiu/centos-vagrant](https://github.com/duffqiu/centos-vagrant)
- [coredns/deployment](https://github.com/coredns/deployment)
- [Kubernetes 1.8 kube-proxy 开启 ipvs](https://mritd.me/2017/10/10/kube-proxy-use-ipvs-on-kubernetes-1.8/#%E4%B8%80%E7%8E%AF%E5%A2%83%E5%87%86%E5%A4%87)
- [Vistio—使用Netflix的Vizceral可视化Istio service mesh](https://servicemesher.github.io/blog/vistio-visualize-your-istio-mesh-using-netflixs-vizceral/)