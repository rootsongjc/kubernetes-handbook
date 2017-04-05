+++
date = "2017-04-05T10:18:51+08:00"
title = "Kubernetes Dashboard/Web UI安装全记录"
draft = false
Tags = ["kubernetes","cloud computing"]
+++

![晒太阳的袋鼠](http://olz1di9xf.bkt.clouddn.com/2017040301.jpg)

*（题图：晒太阳的袋鼠@北京动物园 Apr 3,2017）*

## 前言

前几天[在CentOS7.2上安装Kubernetes1.6](http://rootsongjc.github.io/blogs/kubernetes-installation-on-centos/)和安装好[flannel网络配置](http://rootsongjc.github.io/blogs/kubernetes-network-config/)，今天我们来安装下kuberentnes的dashboard。

[Dashboard](https://github.com/kubernetes/dashboard)是Kubernetes的一个插件，代码在单独的开源项目里。1年前还是特别简单的一个UI，只能在上面查看pod的信息和部署pod而已，现在已经做的跟[Docker Enterprise Edition](https://www.docker.com/enterprise-edition)的**Docker Datacenter**很像了。

## 安装Dashboard

官网的安装文档https://kubernetes.io/docs/user-guide/ui/，其实官网是让我们使用现成的image来用kubernetes部署即可。

首先需要一个**kubernetes-dashboard.yaml**的配置文件，可以直接在[Github的src/deploy/kubernetes-dashboard.yaml](https://github.com/kubernetes/dashboard/blob/master/src/deploy/kubernetes-dashboard.yaml)下载。

我们能看下这个文件的内容：

```yaml
# Copyright 2015 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Configuration to deploy release version of the Dashboard UI.
#
# Example usage: kubectl create -f <this_file>

kind: Deployment
apiVersion: extensions/v1beta1
metadata:
  labels:
    app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kube-system
spec:
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app: kubernetes-dashboard
  template:
    metadata:
      labels:
        app: kubernetes-dashboard
      # Comment the following annotation if Dashboard must not be deployed on master
      annotations:
        scheduler.alpha.kubernetes.io/tolerations: |
          [
            {
              "key": "dedicated",
              "operator": "Equal",
              "value": "master",
              "effect": "NoSchedule"
            }
          ]
    spec:
      containers:
      - name: kubernetes-dashboard
        image: sz-pg-oam-docker-hub-001.tendcloud.com/library/kubernetes-dashboard-amd64:v1.6.0
        imagePullPolicy: Always
        ports:
        - containerPort: 9090
          protocol: TCP
        args:
          # Uncomment the following line to manually specify Kubernetes API server Host
          # If not specified, Dashboard will attempt to auto discover the API server and connect
          # to it. Uncomment only if the default does not work.
          # - --apiserver-host=http://my-address:port
        livenessProbe:
          httpGet:
            path: /
            port: 9090
          initialDelaySeconds: 30
          timeoutSeconds: 30
---
kind: Service
apiVersion: v1
metadata:
  labels:
    app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kube-system
spec:
  type: NodePort
  ports:
  - port: 80
    targetPort: 9090
  selector:
    app: kubernetes-dashboard
```

⚠️ 官方提供的image名为`gcr.io/google_containers/kubernetes-dashboard-amd64:v1.6.0`，需要翻墙才能访问，我自己拉下来push到我们的私有镜像仓库了。我将这个镜像push到了docker hub上，如果你无法翻墙的话，可以到下载这个镜像：`index.tenxcloud.com/jimmy/kubernetes-dashboard-amd64:v1.6.0`。时速云的镜像存储，速度就是快。

准备好image后就可以部署了。

```
kubectl create -f kubernetes-dashboard.yaml
```

## 出错

启动service的时候出错了。

```
kubectl --namespace=kube-system logs kubernetes-dashboard-1680927228-pdv45
Using HTTP port: 9090
Error while initializing connection to Kubernetes apiserver. This most likely means that the cluster is misconfigured (e.g., it has invalid apiserver certificates or service accounts configuration) or the --apiserver-host param points to a server that does not exist. Reason: open /var/run/secrets/kubernetes.io/serviceaccount/token: no such file or directory
Refer to the troubleshooting guide for more information: https://github.com/kubernetes/dashboard/blob/master/docs/user-guide/troubleshooting.md
```

[troubleshooting.md](https://github.com/kubernetes/dashboard/blob/master/docs/user-guide/troubleshooting.md)文件已经说明了，这是**Service Account**的问题。

这时候又要借鉴Tony Bai的[Kubernetes集群Dashboard插件安装](http://tonybai.com/2017/01/19/install-dashboard-addon-for-k8s/)这篇文章。

**启动**

```
kubectl proxy --address='0.0.0.0' --accept-hosts='^*$'
```

报错

```
{
  "kind": "Status",
  "apiVersion": "v1",
  "metadata": {},
  "status": "Failure",
  "message": "no endpoints available for service \"kubernetes-dashboard\"",
  "reason": "ServiceUnavailable",
  "code": 503
}
```

看来身份认证是绕不过去了。

```
# start a container that contains curl
$ kubectl run test --image=sz-pg-oam-docker-hub-001.tendcloud.com/library/curl:latest -- sleep 10000
$kubectl get pod
NAME                     READY     STATUS    RESTARTS   AGE
test-2428763157-pxkps    1/1       Running   0          6s
$kubectl exec test-2428763157-pxkps ls /var/run/secrets/kubernetes.io/serviceaccount/
ls: cannot access /var/run/secrets/kubernetes.io/serviceaccount/: No such file or directory
$kubectl get secrets
No resources found.
```

/var/run/secrets/kubernetes.io/serviceaccount/这个目录还是不存在，我们安装的Kubernetes压根就没有设置secret。

[troubleshooting.md](https://github.com/kubernetes/dashboard/blob/master/docs/user-guide/troubleshooting.md)上说需要用`—admission-control`配置API Server，在配置这个之前还要了解下[Service Accounts](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)和[如何管理Service Accounts](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)。

## 配置Serivce Accounts

Service Account是为Pod提供一个身份认证。

当你使用kubectl来访问集群的时候，一般是使用的**admin**的User Account来跟API server交互的，除非管理员指定了其它的Account。当Pod中的容器跟APIservice交互的时候，需要Service Account（比如default）的身份授权。

### 使用Default Service Account来访问API server

如果你创建pod的时候不指定Service Account的话，系统会自动指定为**default**。`spec.serviceAccount=default`。

**我系统中的Service Account**

```
$kubectl get serviceAccounts
NAME      SECRETS   AGE
default   0         4d
```



