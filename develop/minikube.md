# Minikube

Minikube 用于在本地运行 kubernetes 环境，用来开发和测试。

## 安装 Minikube

到 https://github.com/kubernetes/minikube/releases 下载 minikube，我安装的是 minikube v1.11.0。

下载完成后修改文件名为 `minikube`，然后 `chmod +x minikube`，移动到 `$PATH` 目录下：

```bash
sudo mv ~/Download/minikube-darwin-adm64 /usr/loal/bin/
sudo chmod +x /usr/local/bin/minikube
```

## 安装 kubectl

**方式一**

参考 [Install and Set Up kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)，直接使用二进制文件安装即可。

```bash
curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/darwin/amd64/kubectl
```

**方式二**

先访问 <https://storage.googleapis.com/kubernetes-release/release/stable.txt>
得到返回值，假设为 `v1.18.4`，然后拼接网址，直接在浏览器访问：
<https://storage.googleapis.com/kubernetes-release/release/v1.18.4/bin/darwin/amd64/kubectl> 直接下载 kubectl 文件。

若第一种方式访问多次超时，可以使用上述的第二种方式访问。

## 启动 Minikube

对于 macOS，执行 `minikube start --vm-driver=hyperkit` （使用 hyperkit 作为虚拟机，不需要安装 docker）即可自动下载依赖文件，开始安装和启动 minikube。该过程中将自动执行以下步骤：

1. 下载 `docker-machine-driver-hyperkit`（10.9 M）
1. 下载虚拟机镜像（近 200M）
1. 下载 Kubernetes 安装包（500 多 M）

安装完成后将生成默认的 `~/.kube/config` 文件，自动指向 minikube 集群。

注意：在安装过程中建议[配置代理](https://minikube.sigs.k8s.io/docs/handbook/vpn_and_proxy/)，否则将会有的镜像无法下载。

## 常用命令

下面是 minkube 的常用命令。

```bash
# 进入集群节点
minikube ssh

# 查看节点 IP
minikube ip

# 停止集群
minikube stop

# 删除集群
minikube delete
```

## 参考

- [Install minikube - kubernetes.io](https://kubernetes.io/docs/tasks/tools/install-minikube/)
