# 使用 SOFAMosn 构建 SOFAMesh

 **注意：本书中的 Service Mesh 章节已不再维护，请转到 [istio-handbook](https://jimmysong.io/istio-handbook) 中浏览。**

本文介绍的内容将包括 : 

- [SOFAMosn](https://github.com/alipay/sofa-mosn) 与 [SOFAMesh](https://github.com/alipay/sofa-mesh) 的关系
- 部署 SOFAMesh

至于 SOFAMesh 的使用跟 Istio 没有区别，只是截止本文发稿时 SOFAMosn 的流量管理只支持：

- 按 version 路由
- 按 weight 路由
- 按照特定 header 路由

其他更高级功能仍在进一步开发中。

## SOFAMosn 与 SOFAMesh 的关系

**SOFAMosn 是使用 Go 语言开发的 Service Mesh 数据平面代理**，而 SOFAMesh 则是基于 Istio 改进和扩展而来的 Service Mesh 大规模落地实践方案， SOFAMosn **是** SOFAMesh 的关键组件。目前由于 SOFAMosn 相比 Envoy 做了一些改造，无法在 Istio 下直接使用，所以本文的实验需要在 SOFAMesh 体系中进行。下图是 SOFAMesh 整体框架下，SOFAMosn 的工作示意图。

![SOFAMosn 架构图](https://ws3.sinaimg.cn/large/006tNbRwly1fwdlx22rv9j31ec184dlr.jpg)

## 部署 SOFAMesh

我们直接使用 `sofa-mesh-demo.yaml` 文件来安装 SOFAMesh，不过在安装前你需要先使用 [kubernetes-vagrant-centos-cluster](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster) 安装 Kubernetes 集群，建议安装 Kubernetes 1.11+，并在你的本地电脑上安装 `kubectl` 命令行工具。

执行下面的命令部署 SOFAMesh。

```bash
$ kubectl create -f manifests/sofa-mesh
```

# SOFAMosn in SOFAMesh

部署完成后，我们再检查下在 `istio-system` 命名空间下启动的 pod 和 service。

```bash
# 获取 pod 状态
$ kubectl -n istio-system get pod
NAME                                        READY     STATUS    RESTARTS   AGE
istio-citadel-5cf74d467f-c8dkr              1/1       Running   0          1h
istio-egressgateway-d4c9f6864-hpz86         1/1       Running   0          1h
istio-galley-6886984468-szfhc               1/1       Running   0          1h
istio-ingressgateway-64465cbb5f-5rmrf       1/1       Running   0          1h
istio-pilot-86c787bbfb-2n4rt                1/1       Running   0          1h
istio-policy-6ff7df778c-x87k7               1/1       Running   0          1h
istio-sidecar-injector-69577c64c5-b86sc     1/1       Running   0          1h
istio-statsd-prom-bridge-55965ff9c8-22hrf   1/1       Running   0          1h
istio-telemetry-65d66f78f6-l8mkc            1/1       Running   0          1h
prometheus-7456f56c96-mptww                 1/1       Running   0          1h
# 获取服务状态
$ kubectl -n istio-system get svc
NAME                       TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                                                                     AGE
istio-citadel              ClusterIP   10.254.216.170   <none>        8060/TCP,9093/TCP                                                                                           1h
istio-egressgateway        ClusterIP   10.254.150.44    <none>        80/TCP,443/TCP                                                                                              1h
istio-galley               ClusterIP   10.254.70.174    <none>        443/TCP,9093/TCP                                                                                            1h
istio-ingressgateway       NodePort    10.254.116.52    <none>        80:31380/TCP,443:31390/TCP,31400:31400/TCP,15011:32270/TCP,8060:30226/TCP,15030:31883/TCP,15031:31955/TCP   1h
istio-pilot                ClusterIP   10.254.150.248   <none>        15010/TCP,15011/TCP,8080/TCP,9093/TCP                                                                       1h
istio-policy               ClusterIP   10.254.80.42     <none>        9091/TCP,15004/TCP,9093/TCP                                                                                 1h
istio-sidecar-injector     ClusterIP   10.254.183.202   <none>        443/TCP                                                                                                     1h
istio-statsd-prom-bridge   ClusterIP   10.254.51.10     <none>        9102/TCP,9125/UDP                                                                                           1h
istio-telemetry            ClusterIP   10.254.176.114   <none>        9091/TCP,15004/TCP,9093/TCP,42422/TCP                                                                       1h
prometheus                 ClusterIP   10.254.17.234    <none>        9090/TCP                                                                                                    1h
```

**注意**：因为我的集群不支持 `LoadBalancer` ，所以`istio-ingressgateway` 服务我们使用 `NodePort` 方式对外暴露。

## 参考

- [SOFAMesh - github.com](https://github.com/alipay/sofa-mesh)
- [SOFAMosn - github.com](https://github.com/alipay/sofa-mosn)