---
layout: "post"
---

# Kubernetes Dashboard

Kubernetes Dashboard的部署非常简单，只需要运行

```
kubectl create -f https://git.io/kube-dashboard
```

稍等一会，dashborad就会创建好

```
$ kubectl -n kube-system get service kubernetes-dashboard
NAME                   CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
kubernetes-dashboard   10.101.211.212   <nodes>       80:32729/TCP   1m
$ kubectl -n kube-system describe service kubernetes-dashboard
Name:            kubernetes-dashboard
Namespace:        kube-system
Labels:            app=kubernetes-dashboard
Annotations:        <none>
Selector:        app=kubernetes-dashboard
Type:            NodePort
IP:            10.101.211.212
Port:            <unset>    80/TCP
NodePort:        <unset>    32729/TCP
Endpoints:        10.244.1.3:9090
Session Affinity:    None
Events:            <none>
```

然后就可以通过`http://nodeIP:32729`来访问了。

## https

通常情况下，建议Dashboard服务以https的方式运行，在访问它之前我们需要将证书导入系统中:

```
openssl pkcs12 -export -in apiserver-kubelet-client.crt -inkey apiserver-kubelet-client.key -out kube.p12
curl -sSL -E ./kube.p12:password -k https://nodeIP:6443/api/v1/proxy/namespaces/kube-system/services/kubernetes-dashboard
```

将kube.p12导入系统就可以用浏览器来访问了。注意，如果nodeIP不在证书CN里面，则需要做个hosts映射。

