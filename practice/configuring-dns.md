# 安装配置kube-dns

在我们安装Kubernetes集群的时候就已经安装了kube-dns插件，这个插件也是官方推荐安装的。通过将 Service 注册到 DNS 中，Kuberentes 可以为我们提供一种简单的服务注册发现与负载均衡方式。

[CoreDNS](https://coredns.io)作为CNCF中的托管的一个项目，在Kuberentes1.9版本中，使用kubeadm方式安装的集群可以通过以下命令直接安装CoreDNS。

```bash
kubeadm init --feature-gates=CoreDNS=true
```

您也可以使用CoreDNS替换Kubernetes插件kube-dns，可以使用 Pod 部署也可以独立部署，请参考[Using CoreDNS for Service Discovery](https://kubernetes.io/docs/tasks/administer-cluster/coredns/)，下文将介绍如何配置kube-dns。

## kube-dns

kube-dns是Kubernetes中的一个内置插件，目前作为一个独立的开源项目维护，见<https://github.com/kubernetes/dns>。

下文中给出了配置 DNS Pod 的提示和定义 DNS 解析过程以及诊断 DNS 问题的指南。

## 前提要求

- Kubernetes 1.6 及以上版本。
- 集群必须使用 `kube-dns` 插件进行配置。

## kube-dns 介绍

从 Kubernetes v1.3 版本开始，使用 cluster add-on 插件管理器回自动启动内置的 DNS。

Kubernetes DNS pod 中包括 3 个容器：

- `kubedns`：`kubedns` 进程监视 Kubernetes master 中的 Service 和 Endpoint 的变化，并维护内存查找结构来服务DNS请求。
- `dnsmasq`：`dnsmasq` 容器添加 DNS 缓存以提高性能。
- `sidecar`：`sidecar` 容器在执行双重健康检查（针对 `dnsmasq` 和 `kubedns`）时提供单个健康检查端点（监听在10054端口）。

DNS  pod 具有静态 IP 并作为 Kubernetes 服务暴露出来。该静态 IP 分配后，kubelet 会将使用 `--cluster-dns = <dns-service-ip>` 标志配置的 DNS 传递给每个容器。

DNS 名称也需要域名。本地域可以使用标志 `--cluster-domain = <default-local-domain>` 在 kubelet 中配置。

Kubernetes集群DNS服务器基于 [SkyDNS](https://github.com/skynetservices/skydns) 库。它支持正向查找（A 记录），服务查找（SRV 记录）和反向 IP 地址查找（PTR 记录）

## kube-dns 支持的 DNS 格式

kube-dns 将分别为 service 和 pod 生成不同格式的 DNS 记录。

**Service**

- A记录：生成`my-svc.my-namespace.svc.cluster.local`域名，解析成 IP 地址，分为两种情况：
  - 普通 Service：解析成 ClusterIP
  - Headless Service：解析为指定 Pod 的 IP 列表
- SRV记录：为命名的端口（普通 Service 或 Headless Service）生成 `_my-port-name._my-port-protocol.my-svc.my-namespace.svc.cluster.local` 的域名

**Pod**

- A记录：生成域名 `pod-ip.my-namespace.pod.cluster.local`

## kube-dns 存根域名

可以在 Pod 中指定 hostname 和 subdomain：`hostname.custom-subdomain.default.svc.cluster.local`，例如：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: busybox
  labels:
    name: busybox
spec:
  hostname: busybox-1
  subdomain: busybox-subdomain
  containers:
  name: busybox
  - image: busybox
    command:
    - sleep
    - "3600"
```

该 Pod 的域名是 `busybox-1.busybox-subdomain.default.svc.cluster.local`。

## 继承节点的 DNS

运行 Pod 时，kubelet 将预先配置集群 DNS 服务器到 Pod 中，并搜索节点自己的 DNS 设置路径。如果节点能够解析特定于较大环境的 DNS 名称，那么 Pod 应该也能够解析。请参阅下面的已知问题以了解警告。

如果您不想要这个，或者您想要为 Pod 设置不同的 DNS 配置，您可以给 kubelet 指定 `--resolv-conf` 标志。将该值设置为 "" 意味着 Pod 不继承 DNS。将其设置为有效的文件路径意味着 kubelet 将使用此文件而不是 `/etc/resolv.conf` 用于 DNS 继承。

## 配置存根域和上游 DNS 服务器

通过为 kube-dns （`kube-system:kube-dns`）提供一个 ConfigMap，集群管理员能够指定自定义存根域和上游 nameserver。

例如，下面的 ConfigMap 建立了一个 DNS 配置，它具有一个单独的存根域和两个上游 nameserver：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: kube-dns
  namespace: kube-system
data:
  stubDomains: |
    {“acme.local”: [“1.2.3.4”]}
  upstreamNameservers: |
    [“8.8.8.8”, “8.8.4.4”]
```

如上面指定的那样，带有“.acme.local”后缀的 DNS 请求被转发到 1.2.3.4 处监听的 DNS。Google Public DNS 为上游查询提供服务。

下表描述了如何将具有特定域名的查询映射到其目标DNS服务器：

| 域名                                   | 响应查询的服务器                   |
| ------------------------------------ | -------------------------- |
| kubernetes.default.svc.cluster.local | kube-dns                   |
| foo.acme.local                       | 自定义 DNS (1.2.3.4)          |
| widget.com                           | 上游 DNS (8.8.8.8 或 8.8.4.4) |

查看 ConfigMap 选项获取更多关于配置选项格式的详细信息。

### 对 Pod 的影响

自定义的上游名称服务器和存根域不会影响那些将自己的 `dnsPolicy` 设置为 `Default` 或者 `None` 的 Pod。

如果 Pod 的 `dnsPolicy` 设置为 “`ClusterFirst`”，则其名称解析将按其他方式处理，具体取决于存根域和上游 DNS 服务器的配置。

**未进行自定义配置**：没有匹配上配置的集群域名后缀的任何请求，例如 “www.kubernetes.io”，将会被转发到继承自节点的上游 nameserver。

**进行自定义配置**：如果配置了存根域和上游 DNS 服务器（和在前面例子配置的一样），DNS 查询将根据下面的流程进行路由：

1. 查询首先被发送到 kube-dns 中的 DNS 缓存层。

2. 从缓存层，检查请求的后缀，并转发到合适的 DNS 上，基于如下的示例：

   - *具有集群后缀的名字*（例如 “.cluster.local”）：请求被发送到 kube-dns。
   - *具有存根域后缀的名字*（例如 “.acme.local”）：请求被发送到配置的自定义 DNS 解析器（例如：监听在 1.2.3.4）。
   - *不具有能匹配上后缀的名字*（例如 “widget.com”）：请求被转发到上游 DNS（例如：Google 公共 DNS 服务器，8.8.8.8 和 8.8.4.4）。

   ![DNS lookup flow](https://d33wubrfki0l68.cloudfront.net/340889cb80e81dcd19a16bc34697a7907e2b229a/24ad0/docs/tasks/administer-cluster/dns-custom-nameservers/dns.png)

## ConfigMap 选项

kube-dns `kube-system:kube-dns` ConfigMap 的选项如下所示：

| 字段                        | 格式                                       | 描述                                       |
| ------------------------- | ---------------------------------------- | ---------------------------------------- |
| `stubDomains`（可选）         | 使用 DNS 后缀 key 的 JSON map（例如 “acme.local”），以及 DNS IP 的 JSON 数组作为 value。 | 目标 nameserver 可能是一个 Kubernetes Service。例如，可以运行自己的 dnsmasq 副本，将 DNS 名字暴露到 ClusterDNS namespace 中。 |
| `upstreamNameservers`（可选） | DNS IP 的 JSON 数组。                        | 注意：如果指定，则指定的值会替换掉被默认从节点的 `/etc/resolv.conf` 中获取到的 nameserver。限制：最多可以指定三个上游 nameserver。 |

### 示例

#### 示例：存根域

在这个例子中，用户有一个 Consul DNS 服务发现系统，他们希望能够与 kube-dns 集成起来。 Consul 域名服务器地址为 10.150.0.1，所有的 Consul 名字具有后缀 `.consul.local`。 要配置 Kubernetes，集群管理员只需要简单地创建一个 ConfigMap 对象，如下所示：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: kube-dns
  namespace: kube-system
data:
  stubDomains: |
    {“consul.local”: [“10.150.0.1”]}
```

注意，集群管理员不希望覆盖节点的上游 nameserver，所以他们不会指定可选的 `upstreamNameservers` 字段。

#### 示例：上游 nameserver

在这个示例中，集群管理员不希望显式地强制所有非集群 DNS 查询进入到他们自己的 nameserver 172.16.0.1。 而且这很容易实现：他们只需要创建一个 ConfigMap，`upstreamNameservers` 字段指定期望的 nameserver 即可。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: kube-dns
  namespace: kube-system
data:
  upstreamNameservers: |
    [“172.16.0.1”]
```

## 调试 DNS 解析

### 创建一个简单的 Pod 用作测试环境

创建一个名为 busybox.yaml 的文件，其中包括以下内容：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: busybox
  namespace: default
spec:
  containers:
  - name: busybox
    image: busybox
    command:
      - sleep
      - "3600"
    imagePullPolicy: IfNotPresent
  restartPolicy: Always
```

使用该文件创建 Pod 并验证其状态：

$ kubectl create -f busybox.yaml
pod "busybox" created

$ kubectl get pods busybox
NAME      READY     STATUS    RESTARTS   AGE
busybox   1/1       Running   0          <some-time>
```

该 Pod 运行后，您可以在它的环境中执行 `nslookup`。如果您看到类似如下的输出，表示 DNS 正在正确工作。

​```bash
$ kubectl exec -ti busybox -- nslookup kubernetes.default
Server:    10.0.0.10
Address 1: 10.0.0.10

Name:      kubernetes.default
Address 1: 10.0.0.1
```

如果 `nslookup` 命令失败，检查如下内容：

### 首先检查本地 DNS 配置

查看下 resolv.conf 文件。

```bash
$ kubectl exec busybox cat /etc/resolv.conf
```

验证搜索路径和名称服务器设置如下（请注意，搜索路径可能因不同的云提供商而异）：

```
search default.svc.cluster.local svc.cluster.local cluster.local google.internal c.gce_project_id.internal
nameserver 10.0.0.10
options ndots:5
```

如果看到如下错误表明错误来自 kube-dns 或相关服务：

```
$ kubectl exec -ti busybox -- nslookup kubernetes.default
Server:    10.0.0.10
Address 1: 10.0.0.10

nslookup: can't resolve 'kubernetes.default'
```

或者

```
$ kubectl exec -ti busybox -- nslookup kubernetes.default
Server:    10.0.0.10
Address 1: 10.0.0.10 kube-dns.kube-system.svc.cluster.local

nslookup: can't resolve 'kubernetes.default'
```

### 检查 DNS pod 是否在运行

使用 `kubectl get pods` 命令验证 DNS pod 是否正在运行。

```bash
$ kubectl get pods --namespace=kube-system -l k8s-app=kube-dns
NAME                    READY     STATUS    RESTARTS   AGE
...
kube-dns-v19-ezo1y      3/3       Running   0           1h
...
```

如果您看到没有 Pod 运行或者 Pod 处于 失败/完成 状态，DNS 插件可能没有部署到您的当前环境中，您需要手动部署。

### 检查 DNS pod 中的错误

使用 `kubectl logs` 命令查看 DNS 守护进程的日志。

```bash
$ kubectl logs --namespace=kube-system $(kubectl get pods --namespace=kube-system -l k8s-app=kube-dns -o name) -c kubedns
$ kubectl logs --namespace=kube-system $(kubectl get pods --namespace=kube-system -l k8s-app=kube-dns -o name) -c dnsmasq
$ kubectl logs --namespace=kube-system $(kubectl get pods --namespace=kube-system -l k8s-app=kube-dns -o name) -c sidecar
```

看看有没有可疑的日志。以字母“`W`”，“`E`”，“`F`”开头的代表警告、错误和失败。请搜索具有这些日志级别的条目，并使用 [kubernetes issues](https://github.com/kubernetes/kubernetes/issues)来报告意外错误。

### DNS 服务启动了吗？

使用 `kubectl get service` 命令验证 DNS 服务是否启动。

```bash
$ kubectl get svc --namespace=kube-system
NAME          CLUSTER-IP     EXTERNAL-IP   PORT(S)             AGE
...
kube-dns      10.0.0.10      <none>        53/UDP,53/TCP        1h
...
```

如果您已经创建了该服务或它本应该默认创建但没有出现，参考[调试服务](https://kubernetes.io/docs/tasks/debug-application-cluster/debug-service/)获取更多信息。

### DNS 端点暴露出来了吗？

您可以使用`kubectl get endpoints`命令验证 DNS 端点是否被暴露。

```bash
$ kubectl get ep kube-dns --namespace=kube-system
NAME       ENDPOINTS                       AGE
kube-dns   10.180.3.17:53,10.180.3.17:53    1h
```

如果您没有看到端点，查看[调试服务](https://kubernetes.io/docs/tasks/debug-application-cluster/debug-service/)文档中的端点部分。

获取更多的 Kubernetes DNS 示例，请参考 Kubernetes GitHub 仓库中的[cluster-dns示例](https://github.com/kubernetes/examples/tree/master/staging/cluster-dns)。

## 已知问题

Kubernetes安装时不会将节点的 resolv.conf 文件配置为默认使用集群 DNS，因为该过程本身是特定于发行版的。这一步应该放到最后实现。

Linux 的 libc 不可思议的卡住（[查看该2005年起暴出来的bug](https://bugzilla.redhat.com/show_bug.cgi?id=168253)）限制只能有 3 个 DNS `nameserver` 记录和 6 个 DNS `search` 记录。Kubernetes 需要消耗 1 个 `nameserver` 记录和 3 个 `search` 记录。这意味着如果本地安装已经使用 3 个 `nameserver` 或使用 3 个以上的 `search` 记录，那么其中一些设置将会丢失。有个部分解决该问题的方法，就是节点可以运行 `dnsmasq`，它将提供更多的 `nameserver` 条目，但不会有更多的 `search` 条目。您也可以使用 kubelet 的 `--resolv-conf` 标志。

如果您使用的是 Alpine 3.3 或更低版本作为基础映像，由于已知的 Alpine 问题，DNS 可能无法正常工作。点击[这里](https://github.com/kubernetes/kubernetes/issues/30215)查看更多信息。

## Kubernetes 集群联邦（多可用区支持）

Kubernetes 1.3 版本起引入了支持多站点 Kubernetes 安装的集群联邦支持。这需要对 Kubernetes 集群 DNS 服务器处理 DNS 查询的方式进行一些小的（向后兼容的）更改，以便于查找联邦服务（跨多个 Kubernetes 集群）。有关集群联邦和多站点支持的更多详细信息，请参阅[集群联邦管理员指南](https://kubernetes.io/docs/concepts/cluster-administration/federation/)。

## 参考

- [Configure DNS Service](https://kubernetes.io/docs/tasks/administer-cluster/dns-custom-nameservers/)
- [Service 和 Pod 的 DNS](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)
- [自动扩容集群中的 DNS 服务](https://kubernetes.io/docs/tasks/administer-cluster/dns-horizontal-autoscaling/)
- [Using CoreDNS for Service Discovery](https://kubernetes.io/docs/tasks/administer-cluster/coredns/)