# Pause容器

Pause容器，又叫Infra容器，本文将探究该容器的作用与原理。

我们知道在kubelet的配置中有这样一个参数：

```bash
KUBELET_POD_INFRA_CONTAINER=--pod-infra-container-image=registry.access.redhat.com/rhel7/pod-infrastructure:latest
```

上面是openshift中的配置参数，kubernetes中默认的配置参数是：

```bash
KUBELET_POD_INFRA_CONTAINER=--pod-infra-container-image=gcr.io/google_containers/pause-amd64:3.0
```

Pause容器，是可以自己来定义，官方使用的`gcr.io/google_containers/pause-amd64:3.0`容器的代码见[Github](https://github.com/kubernetes/kubernetes/tree/master/build/pause)，使用C语言编写。

## Pause容器的作用

我们检查nod节点的时候会发现每个node上都运行了很多的pause容器，例如如下。

```bash
$ docker ps
CONTAINER ID        IMAGE                                                                                                                    COMMAND                  CREATED             STATUS              PORTS               NAMES
2c7d50f1a7be        docker.io/jimmysong/heapster-grafana-amd64@sha256:d663759b3de86cf62e64a43b021f133c383e8f7b0dc2bdd78115bc95db371c9a       "/run.sh"                3 hours ago         Up 3 hours                              k8s_grafana_monitoring-influxdb-grafana-v4-5697c6b59-76zqs_kube-system_5788a3c5-29c0-11e8-9e88-525400005732_0
5df93dea877a        docker.io/jimmysong/heapster-influxdb-amd64@sha256:a217008b68cb49e8f038c4eeb6029261f02adca81d8eae8c5c01d030361274b8      "influxd --config ..."   3 hours ago         Up 3 hours                              k8s_influxdb_monitoring-influxdb-grafana-v4-5697c6b59-76zqs_kube-system_5788a3c5-29c0-11e8-9e88-525400005732_0
9cec6c0ef583        jimmysong/pause-amd64:3.0                                                                                                "/pause"                 3 hours ago         Up 3 hours                              k8s_POD_monitoring-influxdb-grafana-v4-5697c6b59-76zqs_kube-system_5788a3c5-29c0-11e8-9e88-525400005732_0
54d06e30a4c7        docker.io/jimmysong/kubernetes-dashboard-amd64@sha256:668710d034c4209f8fa9a342db6d8be72b6cb5f1f3f696cee2379b8512330be4   "/dashboard --inse..."   3 hours ago         Up 3 hours                              k8s_kubernetes-dashboard_kubernetes-dashboard-65486f5fdf-lshl7_kube-system_27c414a1-29c0-11e8-9e88-525400005732_0
5a5ef33b0d58        jimmysong/pause-amd64:3.0                                                                                                "/pause"                 3 hours ago         Up 3 hours                              k8s_POD_kubernetes-dashboard-65486f5fdf-lshl7_kube-system_27c414a1-29c0-11e8-9e88-525400005732_0
```

kubernetes中的pause容器主要为每个业务容器提供以下功能：

- 在pod中担任Linux命名空间共享的基础；
- 启用pid命名空间，开启init进程。

在[The Almighty Pause Container](https://www.ianlewis.org/en/almighty-pause-container)这篇文章中做出了详细的说明，pause容器的作用可以从这个例子中看出，首先见下图：

![Pause容器](../images/pause-container.png)

我们首先在节点上运行一个pause容器。

```bash
docker run -d --name pause -p 8880:80 jimmysong/pause-amd64:3.0
```

然后再运行一个nginx容器，nginx将为`localhost:2368`创建一个代理。

```bash
$ cat <<EOF >> nginx.conff
error_log stderr;
events { worker_connections  1024; }
http {
    access_log /dev/stdout combined;
    server {
        listen 80 default_server;
        server_name example.com www.example.com;
        location / {
            proxy_pass http://127.0.0.1:2368;
        }
    }
}
EOF
$ docker run -d --name nginx -v `pwd`/nginx.conf:/etc/nginx/nginx.conf --net=container:pause --ipc=container:pause --pid=container:pause nginx
```

然后再为[ghost](https://github.com/TryGhost/Ghost)创建一个应用容器，这是一款博客软件。

```bash
$ docker run -d --name ghost --net=container:pause --ipc=container:pause --pid=container:pause ghost
```

现在访问<http://localhost:8880/>就可以看到ghost博客的界面了。

**解析**

pause容器将内部的80端口映射到宿主机的8880端口，pause容器在宿主机上设置好了网络namespace后，nginx容器加入到该网络namespace中，我们看到nginx容器启动的时候指定了`--net=container:pause`，ghost容器同样加入到了该网络namespace中，这样三个容器就共享了网络，互相之间就可以使用`localhost`直接通信，`--ipc=contianer:pause --pid=container:pause`就是三个容器处于同一个namespace中，init进程为`pause`，这时我们进入到ghost容器中查看进程情况。

```bash
# ps aux
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.0   1024     4 ?        Ss   13:49   0:00 /pause
root         5  0.0  0.1  32432  5736 ?        Ss   13:51   0:00 nginx: master p
systemd+     9  0.0  0.0  32980  3304 ?        S    13:51   0:00 nginx: worker p
node        10  0.3  2.0 1254200 83788 ?       Ssl  13:53   0:03 node current/in
root        79  0.1  0.0   4336   812 pts/0    Ss   14:09   0:00 sh
root        87  0.0  0.0  17500  2080 pts/0    R+   14:10   0:00 ps aux
```

在ghost容器中同时可以看到pause和nginx容器的进程，并且pause容器的PID是1。而在kubernetes中容器的PID=1的进程即为容器本身的业务进程。

## 参考

- [The Almighty Pause Container](https://www.ianlewis.org/en/almighty-pause-container)
- [Kubernetes之Pause容器](https://o-my-chenjian.com/2017/10/17/The-Pause-Container-Of-Kubernetes/)

