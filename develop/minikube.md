# Minikube

Minikube用于在本地运行kubernetes环境，用来开发和测试。

## 在Mac上安装xhyve-driver

```bash
brew install docker-machine-driver-xhyve
# docker-machine-driver-xhyve need root owner and uid
sudo chown root:wheel $(brew --prefix)/opt/docker-machine-driver-xhyve/bin/docker-machine-driver-xhyve
sudo chmod u+s $(brew --prefix)/opt/docker-machine-driver-xhyve/bin/docker-machine-driver-xhyve
```

到 https://github.com/kubernetes/minikube/releases 下载 minikube，我安装的是minikube v0.22.3

下载完成后修改文件名为`minikube`，然后`chmod +x minikube`，移动到`$PATH`目录下：

```bash
mv ~/Download/minikube-darwin-adm64 /usr/loal/bin/
chmod +x /usr/local/bin/minikube
```

## 安装kubectl

参考[Install and Set Up kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)，直接使用二进制文件安装即可。

```bash
curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/darwin/amd64/kubectl
或者：
先访问https://storage.googleapis.com/kubernetes-release/release/stable.txt
得到返回值，假设为:v1.9.1，然后拼接网址，直接在浏览器访问：
https://storage.googleapis.com/kubernetes-release/release/v1.9.1/bin/darwin/amd64/kubectl
直接下载kubectl文件。
```

若第一种方式访问多次超时，可以使用上述的第二种方式访问。

## 启动Minikube

假设使用xhyve-driver虚拟技术，则需要在minikube start加入参数 `--vm-driver=xhyve`。

```bash
minikube start --vm-driver=xhyve
Starting local Kubernetes v1.7.5 cluster...
Starting VM...
Downloading Minikube ISO
 139.09 MB / 139.09 MB [============================================] 100.00% 0s
Getting VM IP address...
Moving files into cluster...
Setting up certs...
Connecting to cluster...
Setting up kubeconfig...
Starting cluster components...
Kubectl is now configured to use the cluster.
```

这将生成默认的`~/.kube/config`文件，自动指向minikube。

## 停止Minikube

```bash
minikube stop
```

## 参考

[Running Kubernetes Locally via Minikube](https://kubernetes.io/docs/getting-started-guides/minikube/)

[Install minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/)

[Driver plugin installation - xhyve-driver](https://github.com/kubernetes/minikube/blob/master/docs/drivers.md#xhyve-driver)
