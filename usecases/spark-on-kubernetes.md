# Spark on Kubernetes

时速云上提供的镜像docker pull index.tenxcloud.com/google_containers/spark:1.5.2_v1都下载不下来。

因此我自己编译的spark的镜像。

编译好后上传到了时速云镜像仓库

```
index.tenxcloud.com/jimmy/spark:1.5.2_v1
index.tenxcloud.com/jimmy/zeppelin:0.7.1
```

代码和使用文档见Github地址：https://github.com/rootsongjc/spark-on-kubernetes

## 在Kubernetes上启动spark

创建名为spark-cluster的namespace，所有操作都在该namespace中进行。

所有yaml文件都在`manifests`目录下。

```
$ kubectl create -f manifests/
```

将会启动一个拥有三个worker的spark集群和zeppelin。

同时在该namespace中增加ingress配置，将spark的UI和zeppelin页面都暴露出来，可以在集群外部访问。

该ingress后端使用traefik。

## 访问spark

通过上面对ingress的配置暴露服务，需要修改本机的/etc/hosts文件，增加以下配置，使其能够解析到上述service。

```
172.20.0.119 zeppelin.traefik.io
172.20.0.119 spark.traefik.io
```

172.20.0.119是我设置的VIP地址，VIP的设置和traefik的配置请查看[kubernetes-handbook](https://github.com/rootsongjc/kubernetes-handbook)。

**spark ui**

访问http://spark.traefik.io

![spark master ui](../images/spark-ui.jpg)

**zeppelin ui**

访问http://zepellin.treafik.io

![zeppelin ui](../images/zeppelin-ui.jpg)