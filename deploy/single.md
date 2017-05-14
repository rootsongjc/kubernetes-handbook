---
layout: "post"
---

# 单机部署

创建Kubernetes cluster（单机版）最简单的方法是[minikube](https://github.com/kubernetes/minikube):

首先下载kubectl

```sh
curl -Lo kubectl https://storage.googleapis.com/kubernetes-release/release/v1.5.2/bin/linux/amd64/kubectl
chmod +x kubectl
```

然后启动minikube

```sh
$ minikube start
Starting local Kubernetes cluster...  
Kubectl is now configured to use the cluster.
$ kubectl cluster-info
Kubernetes master is running at https://192.168.64.12:8443
kubernetes-dashboard is running at https://192.168.64.12:8443/api/v1/proxy/namespaces/kube-system/services/kubernetes-dashboard

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.   
```

## 开发版

minikube/localkube只提供了正式release版本，而如果想要部署master或者开发版的话，则可以用`hack/local-up-cluster.sh`来启动一个本地集群：

```sh
cd $GOPATH/src/k8s.io/kubernetes

export KUBERNETES_PROVIDER=local
hack/local-up-cluster.sh 
```

