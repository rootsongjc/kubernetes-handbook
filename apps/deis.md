---
title: "Deis workflow"
layout: "post"
---

## Deis架构

![](https://deis.com/docs/workflow/diagrams/Workflow_Overview.png)

![](https://deis.com/docs/workflow/diagrams/Workflow_Detail.png)

![](https://deis.com/docs/workflow/diagrams/Application_Layout.png)

## Deis安装部署

首先需要部署一套kubernetes（比如minikube，GKE等，记得启用`KUBE_ENABLE_CLUSTER_DNS=true`），并配置好本机的kubectl客户端，然后运行以下脚本安装deis：

```sh
# install deis v2 (workflow)
curl -sSL http://deis.io/deis-cli/install-v2.sh | bash
mv deis /usr/local/bin/

# install helm
wget https://storage.googleapis.com/kubernetes-helm/helm-v2.2.1-linux-amd64.tar.gz
tar zxvf helm-v2.2.1-linux-amd64.tar.gz
mv linux-amd64/helm /usr/local/bin/
rm -rf linux-amd64 helm-v2.2.1-linux-amd64.tar.gz
helm init

# deploy helm components
helm repo add deis https://charts.deis.com/workflow
helm install deis/workflow --namespace deis
kubectl --namespace=deis get pods
```

## Deis基本使用

### 注册用户并登录

```sh
deis register deis-controller.deis.svc.cluster.local
deis login deis-controller.deis.svc.cluster.local
deis perms:create newuser --admin
```

### 部署应用

**注意，deis的大部分操作命令都需要在应用的目录中（即下面的`example-dockerfile-http`）。**

```sh
git clone https://github.com/deis/example-dockerfile-http.git
cd example-dockerfile-http
docker build -t deis/example-dockerfile-http .
docker push deis/example-dockerfile-http

# create app
deis create example-dockerfile-http --no-remote
# deploy app
deis pull deis/example-dockerfile-http:latest

# query application status
deis info
```

扩展应用

```sh
$ deis scale cmd=3
$ deis ps
=== example-dockerfile-http Processes
--- cmd:
example-dockerfile-http-cmd-4246296512-08124 up (v2)
example-dockerfile-http-cmd-4246296512-40lfv up (v2)
example-dockerfile-http-cmd-4246296512-fx3w3 up (v2)
```

也可以配置自动扩展

```sh
deis autoscale:set example-dockerfile-http --min=3 --max=8 --cpu-percent=75
```

这样，就可以通过Kubernetes的DNS来访问应用了（配置了外网负载均衡后，还可以通过负载均衡来访问服务）：

```sh
$ curl example-dockerfile-http.example-dockerfile-http.svc.cluster.local
Powered by Deis
```

### 域名和路由

```sh
# 注意设置CNMAE记录到原来的地址
deis domains:add hello.bacongobbler.com

dig hello.deisapp.com
deis routing:enable
```

这实际上是在deis-router的nginx配置中增加了 virtual hosts ：

```
    server {
        listen 8080;
        server_name ~^example-dockerfile-http\.(?<domain>.+)$;
        server_name_in_redirect off;
        port_in_redirect off;
        set $app_name "example-dockerfile-http";
        vhost_traffic_status_filter_by_set_key example-dockerfile-http application::*;

        location / {
            proxy_buffering off;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $access_scheme;
            proxy_set_header X-Forwarded-Port $forwarded_port;
            proxy_redirect off;
            proxy_connect_timeout 30s;
            proxy_send_timeout 1300s;
            proxy_read_timeout 1300s;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;

            proxy_pass http://10.0.0.224:80;
        }
    }

    server {
        listen 8080;
        server_name hello.bacongobbler.com;
        server_name_in_redirect off;
        port_in_redirect off;
        set $app_name "example-dockerfile-http";
        vhost_traffic_status_filter_by_set_key example-dockerfile-http application::*;

        location / {
            proxy_buffering off;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $access_scheme;
            proxy_set_header X-Forwarded-Port $forwarded_port;
            proxy_redirect off;
            proxy_connect_timeout 30s;
            proxy_send_timeout 1300s;
            proxy_read_timeout 1300s;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_pass http://10.0.0.224:80;
        }
    }
```

### 参考文档

- https://github.com/deis/workflow
- https://deis.com/workflow/

