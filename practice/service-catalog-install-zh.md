* Service Catalog的安装(利用Helm)和交互

本文翻译自[官方项目文档](https://github.com/kubernetes-incubator/service-catalog/blob/master/docs/install.md)。与[官方网站文档](https://kubernetes.io/docs/tasks/service-catalog/install-service-catalog-using-helm/)大致一致。

Kubernetes 1.7或更高版本的集群运行 API Aggregator，它位于core API Server前面的专用proxy服务器。

服务目录(Service Catalog)提供了一个位于API aggregator后面的API服务器，因此可以用kubectl像平常一样与Service Catalog进行交互。

要了解更多关于API aggregation的信息，请参阅 [Kubernetes文档](https://kubernetes.io/docs/concepts/api-extension/apiserver-aggregation/)。

本文档的其余部分详细介绍了如何：

- 在群集上设置Service Catalog
- 与Service Catalog API进行交互

# 步骤1 - 前提条件

## Kubernetes版本
Service Catalog需要Kubernetes v1.7或更高版本。您还需要 在主机上安装[Kubernetes configuration file](https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/) 。你需要这个文件，以便你可以使用kubectl和 helm与群集通信。许多Kubernetes安装工具或云提供商会为你设置此配置文件。有关详细信息，请与您的工具或提供商联系。

### `kubectl`版本
大多数与Service Catalog系统的交互都是通过`kubectl`命令行界面实现的。与群集版本一样，Service Catalog需要kubectl版本1.7或更高版本。

首先，检查你的`kubectl`版本：

```bash
kubectl version
```
确保Kubernetes版本和kubectl版本均为1.7或更高。

如果需要升级客户端，请按照[安装说明](https://kubernetes.io/docs/tasks/kubectl/install/)  获取新的`kubectl`二进制文件。

例如，运行以下命令以在Mac OS上获取最新的二进制文件：

```bash
curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/darwin/amd64/kubectl
chmod +x ./kubectl
```
## 群集内DNS

您需要启用Kubernetes集群内的DNS。大多数常用的安装方法会为您自动配置群集内DNS：

- [Minikube](https://github.com/kubernetes/minikube)
- [`hack/local-up-cluster.sh`](https://github.com/kubernetes/kubernetes/blob/master/hack/local-up-cluster.sh)
- 大多数云提供商

## Helm
使用Helm安装Service Catalog ，需要v2.7.0或更高版本。请参阅以下步骤进行安装。

### 如果你还没有安装Helm
如果尚未安装Helm，请下载[`helm` CLI](https://github.com/kubernetes/helm#install)，然后运行helm init（这会将Helm的服务器端组件Tiller安装到你的Kubernetes群集中）。

### 如果已经安装了Helm
如果已经安装了Helm，请运行helm version并确保客户端和服务器版本均为v2.7.0或更高。

如果不是， 请安装[更新版本的helm CLI](https://github.com/kubernetes/helm#install)并运行`helm init --upgrade`。

有关安装的更多详细信息，请参阅 [Helm安装说明](https://github.com/kubernetes/helm/blob/master/docs/install.md)。

### Tiller 权限
Tiller是Helm的服务端组件。默认情况下， helm init将Tiller pod安装到kube-system名称空间中，并将Tiller配置为使用default服务帐户（service account）。

需要对Tiller进行配置`cluster-admin`权限，才能正确安装Service Catalog：

```bash
kubectl create clusterrolebinding tiller-cluster-admin \
    --clusterrole=cluster-admin \
    --serviceaccount=kube-system:default
```
## Helm Repository设置
Service Catalog很容易通过[Helm chart](https://github.com/kubernetes/helm/blob/master/docs/charts.md)安装 。

此chart位于 [chart repository](https://github.com/kubernetes/helm/blob/master/docs/chart_repository.md)中。将此repository添加到本地计算机：

```bash
helm repo add svc-cat https://svc-catalog-charts.storage.googleapis.com
```
然后，确保repository已成功添加：

```bash
helm search service-catalog
```
应该看到以下输出：


```bash
NAME           	VERSION	DESCRIPTION
svc-cat/catalog	x,y.z  	service-catalog API server and controller-manag...
```
## RBAC
Kubernetes群集必须启用[RBAC](https://kubernetes.io/docs/admin/authorization/rbac/) 才能使用Service Catalog。

与群集内DNS一样，许多安装方法都有对应启用RBAC的途径。

### Minikube
如果您正在使用Minikube，请使用以下命令启动群集：

```bash
minikube start --extra-config=apiserver.Authorization.Mode=RBAC
```
### hack/local-cluster-up.sh
如果使用[`hack/local-up-cluster.sh`](https://github.com/kubernetes/kubernetes/blob/master/hack/local-up-cluster.sh)脚本，请使用以下命令启动群集：

```bash
AUTHORIZATION_MODE=Node,RBAC hack/local-up-cluster.sh -O
```
### 云提供商
许多云提供商为你启用了RBAC的新集群。有关详细信息，请查阅你的提供商的文档。

# 第2步 - 安装Service Catalog
集群和Helm配置正确，安装Service Catalog很简单：

```bash
helm install svc-cat/catalog \
    --name catalog --namespace catalog
```
# 安装Service Catalog CLI
按照适用于操作系统的说明安装svcat。二进制文件可以单独使用，也可以作为kubectl插件使用。

## MacOS

```
curl -sLO https://download.svcat.sh/cli/latest/darwin/amd64/svcat
chmod +x ./svcat
mv ./svcat /usr/local/bin/
svcat version --client
```

## Linux

```
curl -sLO https://download.svcat.sh/cli/latest/linux/amd64/svcat
chmod +x ./svcat
mv ./svcat /usr/local/bin/
svcat version --client
```
## Windows
下面的代码片段仅在当前会话中为你的PATH添加一个目录。您需要为它找到位置并将其添加到PATH中。


```
iwr 'https://download.svcat.sh/cli/latest/windows/amd64/svcat.exe' -UseBasicParsing -OutFile svcat.exe
mkdir -f ~\bin
$env:PATH += ";${pwd}\bin"
svcat version --client
```

## 手动下载
1. 对应操作系统下载相应的二进制文件：
  * macOS: https://download.svcat.sh/cli/latest/darwin/amd64/svcat
  * Windows: https://download.svcat.sh/cli/latest/windows/amd64/svcat.exe
  * Linux: https://download.svcat.sh/cli/latest/linux/amd64/svcat
2. 使二进制可执行文件。
3. 将二进制文件移动到PATH相应的目录。

## 插件
要将svcat用作插件，请在下载后运行以下命令：

```bash
$ ./svcat install plugin
Plugin has been installed to ~/.kube/plugins/svcat. Run kubectl plugin svcat --help for help using the plugin.
```
当作为插件运行时，这些命令与添加全局kubectl配置标志相同。其中一个例外是，在插件模式下运行时不支持布尔标志，所以不要使用`--flag`,你必须指定`--flag=true`。
