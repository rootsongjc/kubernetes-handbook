---
title: "使用Helm安装Nginx ingress"
date: 2017-10-27T19:10:59+08:00
draft: false
tags: ["helm","kubernetes"]
description: "Nginx ingress 使用ConfigMap来管理Nginx配置，nginx是大家熟知的代理和负载均衡软件，比起Traefik来说功能更加强大，我们使用helm来部署，chart保存在私有的仓库中。"
categories: ["Kubernetes"]
bg_image: "images/backgrounds/page-title.jpg"
image: "images/banner/helm.jpg"
aliases: "/posts/install-nginx-ingress-with-helm"
type: "post"
---

[Nginx ingress](https://github.com/kubernetes/ingress-nginx) 使用ConfigMap来管理Nginx配置，nginx是大家熟知的代理和负载均衡软件，比起[Traefik](https://traefik.io)来说功能更加强大，我们使用[helm](http://helm.sh)来部署，[chart](https://github.com/kubernetes/charts)保存在私有的仓库中，helm安装使用见[使用Helm管理kubernetes应用](https://jimmysong.io/kubernetes-handbook/practice/helm.html)。

安装时需要用到的镜像有：

- sophos/nginx-vts-exporter:v0.6
- gcr.io/google_containers/nginx-ingress-controller:0.9.0-beta.15
- gcr.io/google_containers/defaultbackend:1.3

gcr.io中的那个两个镜像我复制了一份到时速云，可供大家下载：

- index.tenxcloud.com/jimmy/defaultbackend:1.3
- index.tenxcloud.com/jimmy/nginx-ingress-controller:0.9.0-beta.15

Docker hub上的那个镜像可以直接下载，所有的安装时需要的配置保存在[../manifests/nginx-ingress](https://github.com/rootsongjc/kubernetes-handbook/blob/master/manifests/nginx-ingress)目录下。

**安装nginx-ingress chart到本地repo中**

修改`values.yaml`配置，启用RBAC支持，相关配置见[nginx-ingress chart](https://github.com/kubernetes/charts/tree/master/stable/nginx-ingress#configuration)。

```bash
helm package .
```

**查看niginx-ingress**

```bash
$ helm search nginx-ingress
NAME                	VERSION	DESCRIPTION
local/nginx-ingress 	0.8.9  	An nginx Ingress controller that uses ConfigMap...
stable/nginx-ingress	0.8.9  	An nginx Ingress controller that uses ConfigMap...
stable/nginx-lego   	0.3.0  	Chart for nginx-ingress-controller and kube-lego
```

**使用helm部署nginx-ingress**

```bash
$ helm install --name nginx-ingress local/nginx-ingress
NAME:   nginx-ingress
LAST DEPLOYED: Fri Oct 27 18:26:58 2017
NAMESPACE: default
STATUS: DEPLOYED

RESOURCES:
==> rbac.authorization.k8s.io/v1beta1/Role
NAME                         KIND
nginx-ingress-nginx-ingress  Role.v1beta1.rbac.authorization.k8s.io

==> rbac.authorization.k8s.io/v1beta1/RoleBinding
nginx-ingress-nginx-ingress  RoleBinding.v1beta1.rbac.authorization.k8s.io

==> v1/Service
NAME                                         CLUSTER-IP      EXTERNAL-IP  PORT(S)                     AGE
nginx-ingress-nginx-ingress-controller       10.254.100.108  <nodes>      80:30484/TCP,443:31053/TCP  1s
nginx-ingress-nginx-ingress-default-backend  10.254.58.156   <none>       80/TCP                      1s

==> extensions/v1beta1/Deployment
NAME                                         DESIRED  CURRENT  UP-TO-DATE  AVAILABLE  AGE
nginx-ingress-nginx-ingress-default-backend  1        1        1           0          1s
nginx-ingress-nginx-ingress-controller       1        1        1           0          1s

==> v1/ConfigMap
NAME                                    DATA  AGE
nginx-ingress-nginx-ingress-controller  1     1s

==> v1/ServiceAccount
NAME                         SECRETS  AGE
nginx-ingress-nginx-ingress  1        1s

==> rbac.authorization.k8s.io/v1beta1/ClusterRole
NAME                         KIND
nginx-ingress-nginx-ingress  ClusterRole.v1beta1.rbac.authorization.k8s.io

==> rbac.authorization.k8s.io/v1beta1/ClusterRoleBinding
nginx-ingress-nginx-ingress  ClusterRoleBinding.v1beta1.rbac.authorization.k8s.io


NOTES:
The nginx-ingress controller has been installed.
Get the application URL by running these commands:
  export HTTP_NODE_PORT=$(kubectl --namespace default get services -o jsonpath="{.spec.ports[0].nodePort}" nginx-ingress-nginx-ingress-controller)
  export HTTPS_NODE_PORT=$(kubectl --namespace default get services -o jsonpath="{.spec.ports[1].nodePort}" nginx-ingress-nginx-ingress-controller)
  export NODE_IP=$(kubectl --namespace default get nodes -o jsonpath="{.items[0].status.addresses[1].address}")

  echo "Visit http://$NODE_IP:$HTTP_NODE_PORT to access your application via HTTP."
  echo "Visit https://$NODE_IP:$HTTPS_NODE_PORT to access your application via HTTPS."

An example Ingress that makes use of the controller:

  apiVersion: extensions/v1beta1
  kind: Ingress
  metadata:
    annotations:
      kubernetes.io/ingress.class: nginx
    name: example
    namespace: foo
  spec:
    rules:
      - host: www.example.com
        http:
          paths:
            - backend:
                serviceName: exampleService
                servicePort: 80
              path: /
    # This section is only required if TLS is to be enabled for the Ingress
    tls:
        - hosts:
            - www.example.com
          secretName: example-tls

If TLS is enabled for the Ingress, a Secret containing the certificate and key must also be provided:

  apiVersion: v1
  kind: Secret
  metadata:
    name: example-tls
    namespace: foo
  data:
    tls.crt: <base64 encoded cert>
    tls.key: <base64 encoded key>
  type: kubernetes.io/tls
```

**访问Nginx**

首先获取Nginx的地址，从我们使用helm安装nginx-ingress命令的输出中那个可以看到提示，根据提示执行可以看到nginx的http和https地址：

```bash
  export HTTP_NODE_PORT=$(kubectl --namespace default get services -o jsonpath="{.spec.ports[0].nodePort}" nginx-ingress-nginx-ingress-controller)
  export HTTPS_NODE_PORT=$(kubectl --namespace default get services -o jsonpath="{.spec.ports[1].nodePort}" nginx-ingress-nginx-ingress-controller)
  export NODE_IP=$(kubectl --namespace default get nodes -o jsonpath="{.items[0].status.addresses[1].address}")

  echo "Visit http://$NODE_IP:$HTTP_NODE_PORT to access your application via HTTP."
  echo "Visit https://$NODE_IP:$HTTPS_NODE_PORT to access your application via HTTPS."
  Visit http://172.20.0.113:30484 to access your application via HTTP.
  Visit https://172.20.0.113:31053 to access your application via HTTPS.
```

- http地址：http://172.20.0.113:30484
- https地址：https://172.20.0.113:31053

我们分别在http和https地址上测试一下：

- `/healthz`返回200
- `/`返回404错误

```bash
curl -v http://172.20.0.113:30484/healthz
# 返回200
curl -v http://172.20.0.113:30484/
# 返回404
curl -v --insecure http://172.20.0.113:30484/healthz
# 返回200
curl -v --insecure http://172.20.0.113:30484/
# 返回404
```

**删除nginx-ingress**

```bash
helm delete --purge nginx-ingress
```

使用`--purge`参数可以彻底删除release不留下记录，否则下一次部署的时候不能使用重名的release。

## 参考

- [Ingress-nginx github](https://github.com/kubernetes/ingress-nginx)
- [Nginx chart configuration](https://github.com/kubernetes/charts/tree/master/stable/nginx-ingress)
- [使用Helm管理kubernetes应用](https://jimmysong.io/kubernetes-handbook/practice/helm.html)
