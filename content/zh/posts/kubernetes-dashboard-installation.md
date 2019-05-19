---
date: "2017-04-05T14:28:51+08:00"
title: "Kubernetes Dashboard/Web UI安装全记录"
draft: false
categories: "kubernetes"
tags: ["kubernetes","cloud computing","dashboard","frontend"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/2017040301.jpg", desc: "晒太阳的袋鼠@北京动物园 Apr 3,2017"}]
---

几天[在CentOS7.2上安装Kubernetes1.6](https://jimmysong.io/posts/kubernetes-installation-on-centos/)和安装好[flannel网络配置](https://jimmysong.io/posts/kubernetes-network-config/)，今天我们来安装下kuberentnes的dashboard。

[Dashboard](https://github.com/kubernetes/dashboard)是Kubernetes的一个插件，代码在单独的开源项目里。1年前还是特别简单的一个UI，只能在上面查看pod的信息和部署pod而已，现在已经做的跟[Docker Enterprise Edition](https://www.docker.com/enterprise-edition)的**Docker Datacenter**很像了。

## 安装Dashboard

[官网的安装文档](https://kubernetes.io/docs/user-guide/ui/)，其实官网是让我们使用现成的image来用kubernetes部署即可。

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
          - --apiserver-host=http://sz-pg-oam-docker-test-001.tendcloud.com:8080
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

⚠️ 官方提供的image名为

```ini
gcr.io/google_containers/kubernetes-dashboard-amd64:v1.6.0
```
需要翻墙才能访问，我自己拉下来push到我们的私有镜像仓库了。我将这个镜像push到了docker hub上，如果你无法翻墙的话，可以到下载这个镜像：
```ini
index.tenxcloud.com/jimmy/kubernetes-dashboard-amd64:v1.6.0
```
时速云的镜像存储，速度就是快。

准备好image后就可以部署了。

```bash
$kubectl create -f kubernetes-dashboard.yaml
deployment "kubernetes-dashboard" created
service "kubernetes-dashboard" created
$kubectl get -f kubernetes-dashboard.yaml
NAME                          DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deploy/kubernetes-dashboard   1         1         1            1           9s

NAME                       CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
svc/kubernetes-dashboard   10.254.113.226   <nodes>       80:31370/TCP   8s
```

现在就可以访问http://sz-pg-oam-docker-test-001.tendcloud.com:8080/ui了，效果如图：

![kubernetes-dashboard](https://res.cloudinary.com/jimmysong/image/upload/images/kubernetes-dashboard-01.jpg)

## Troubleshooting

### 如果你没启动Service Account身份认证

那就好办了，检查下你的**kubernetes-dashboard.yaml**文件，看看是不是API Server地址配错了，或者查看下pod的log，我就是在log里发现，原来API Server的主机名无法解析导致服务启动失败。在DNS里添加API Server主机的DNS记录即可。

### 如果你启动API Server的ServiceAccount身份认证

启动service的时候出错。

```bash
kubectl --namespace=kube-system logs kubernetes-dashboard-1680927228-pdv45
Using HTTP port: 9090
Error while initializing connection to Kubernetes apiserver. This most likely means that the cluster is misconfigured (e.g., it has invalid apiserver certificates or service accounts configuration) or the --apiserver-host param points to a server that does not exist. Reason: open /var/run/secrets/kubernetes.io/serviceaccount/token: no such file or directory
Refer to the troubleshooting guide for more information: https://github.com/kubernetes/dashboard/blob/master/docs/user-guide/troubleshooting.md
```

[troubleshooting.md](https://github.com/kubernetes/dashboard/blob/master/docs/user-guide/troubleshooting.md)文件已经说明了，这是可能是你配置API server地址或**Service Account**的问题。

如果是配置Service Account的问题，可以借鉴Tony Bai的[Kubernetes集群Dashboard插件安装](http://tonybai.com/2017/01/19/install-dashboard-addon-for-k8s/)这篇文章。

**启动**

```bash
kubectl proxy --address='0.0.0.0' --accept-hosts='^*$'
```

报错信息

```Bash
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

```bash
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

```ini
/var/run/secrets/kubernetes.io/serviceaccount/
```

这个目录还是不存在，我们安装的Kubernetes压根就没有设置secret。

[troubleshooting.md](https://github.com/kubernetes/dashboard/blob/master/docs/user-guide/troubleshooting.md)上说需要用`—admission-control`配置API Server，在配置这个之前还要了解下[Service Accounts](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)和[如何管理Service Accounts](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)。

## 后记

一年前我安装Kubernetes Dashboard（那时候好像还叫Kube-UI）的时候没有其功能还极其不完善，经过一年多的发展，已经有模有样了，如果不启用**Service Account**的话，安装Dashboard还是很简单的。接下来我还要在Dashboard上安装其它Add-on，如Heapster用来监控Pod状态。
