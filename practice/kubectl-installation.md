# 安装kubectl命令行工具

本文档介绍下载和配置 kubernetes 集群命令行工具 kubelet 的步骤。

## 下载 kubectl

注意请下载对应的Kubernetes版本的安装包。

``` bash
wget https://dl.k8s.io/v1.6.0/kubernetes-client-linux-amd64.tar.gz
tar -xzvf kubernetes-client-linux-amd64.tar.gz
cp kubernetes/client/bin/kube* /usr/bin/
chmod a+x /usr/bin/kube*
```

## 创建 kubectl kubeconfig 文件

``` bash
export KUBE_APISERVER="https://172.20.0.113:6443"
# 设置集群参数
kubectl config set-cluster kubernetes \
  --certificate-authority=/etc/kubernetes/ssl/ca.pem \
  --embed-certs=true \
  --server=${KUBE_APISERVER}
# 设置客户端认证参数
kubectl config set-credentials admin \
  --client-certificate=/etc/kubernetes/ssl/admin.pem \
  --embed-certs=true \
  --client-key=/etc/kubernetes/ssl/admin-key.pem
# 设置上下文参数
kubectl config set-context kubernetes \
  --cluster=kubernetes \
  --user=admin
# 设置默认上下文
kubectl config use-context kubernetes
```

+ `admin.pem` 证书 OU 字段值为 `system:masters`，`kube-apiserver` 预定义的 RoleBinding `cluster-admin` 将 Group `system:masters` 与 Role `cluster-admin` 绑定，该 Role 授予了调用`kube-apiserver` 相关 API 的权限；
+ 生成的 kubeconfig 被保存到 `~/.kube/config` 文件；

**注意：**`~/.kube/config`文件拥有对该集群的最高权限，请妥善保管。

## 更多资料

- [kubectl命令概览](../guide/using-kubectl.md)
- [kubectl命令技巧大全](../guide/kubectl-cheatsheet.md)