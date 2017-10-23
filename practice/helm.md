# 使用Helm管理kubernetes应用

Helm是一个kubernetes应用的包管理工具，用来管理[charts](https://github.com/kubernetes/charts)——预先配置好的安装包资源，有点类似于Ubuntu的APT和CentOS中的yum。

## 安装Helm

**前提要求**

kubernetes1.5以上版本

首先需要安装helm客户端：

```bash
curl https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get > get_helm.sh
chmod 700 get_helm.sh
./get_helm.sh
```

然后安装helm服务端tiller：

```bash
helm init -i sz-pg-oam-docker-hub-001.tendcloud.com/library/kubernetes-helm-tiller:v2.3.1
```

我们使用`-i`指定自己的镜像，因为官方的镜像因为某些原因无法拉取。

检查是否安装成功：

```bash
kubectl -n kube-system get pods|grep tiller
tiller-deploy-2372561459-f6p0z         1/1       Running   0          1h
```



## 参考

- [Deploy, Scale And Upgrade An Application On Kubernetes With Helm](https://docs.bitnami.com/kubernetes/how-to/deploy-application-kubernetes-helm/)