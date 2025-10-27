---
weight: 95
title: 使用 Service 访问集群中的应用程序
linktitle: 通过 Service 访问
date: 2022-05-21T00:00:00+08:00
description: 学习如何创建 Kubernetes Service 对象来访问集群中运行的应用程序，包括创建 Deployment、配置 NodePort 服务以及实现负载均衡的完整流程。
lastmod: 2025-10-27T17:41:28.257Z
---

> Service 是 Kubernetes 集群中实现应用访问与负载均衡的核心机制，合理配置可让外部客户端安全高效地访问集群内服务。

## 学习目标

本节将带你系统掌握如何通过 Service 访问 Kubernetes 集群中的应用，包括部署多副本应用、创建 NodePort 服务、实现负载均衡及常见故障排查。

- 创建并运行 Hello World 应用程序的多个实例
- 创建 NodePort 类型的 Service 对象
- 通过 Service 访问集群中的应用程序
- 理解 Service 的负载均衡机制

## 准备工作

在操作前，请确保具备以下条件：

- 已安装并配置好 kubectl 命令行工具
- 有一个可用的 Kubernetes 集群
- 具备基本的 Kubernetes 概念了解

## 创建应用程序和 Service

通过以下步骤，完成应用部署与服务暴露。

### 步骤 1：创建 Deployment

首先，创建一个运行 Hello World 应用的 Deployment：

```bash
kubectl create deployment hello-world --image=gcr.io/google-samples/node-hello:1.0 --port=8080
```

扩展为 2 个副本：

```bash
kubectl scale deployment hello-world --replicas=2
```

为 Deployment 添加标签：

```bash
kubectl label deployment hello-world run=load-balancer-example
```

### 步骤 2：验证 Deployment

查看 Deployment 和 ReplicaSet 状态：

```bash
kubectl get deployments hello-world
kubectl describe deployments hello-world
kubectl get replicasets
kubectl describe replicasets
```

### 步骤 3：创建 Service

创建 NodePort 类型的 Service 暴露应用：

```bash
kubectl expose deployment hello-world --type=NodePort --name=example-service
```

### 步骤 4：查看 Service 详情

查看 Service 详细信息，记录 NodePort 端口：

```bash
kubectl describe services example-service
```

输出示例：

```yaml
Name:                   example-service
Namespace:              default
Labels:                 run=load-balancer-example
Selector:               app=hello-world
Type:                   NodePort
IP Family:              IPv4
IP:                     10.96.123.45
IPs:                    10.96.123.45
Port:                   <unset> 8080/TCP
TargetPort:             8080/TCP
NodePort:               <unset> 32156/TCP
Endpoints:              10.244.1.4:8080,10.244.2.5:8080
Session Affinity:       None
External Traffic Policy: Cluster
Events:                 <none>
```

### 步骤 5：查看 Pod 信息

列出运行 Hello World 应用的 Pod：

```bash
kubectl get pods -l app=hello-world -o wide
```

输出示例：

```text
NAME                           READY   STATUS    RESTARTS   AGE   IP           NODE
hello-world-5d8f7c4c9b-8x2mq   1/1     Running   0          2m    10.244.1.4   node1
hello-world-5d8f7c4c9b-v7k9s   1/1     Running   0          2m    10.244.2.5   node2
```

## 访问应用程序

完成 Service 创建后，可通过节点 IP 和 NodePort 端口访问应用。

### 获取节点 IP 地址

根据集群类型，选择合适方式获取节点外部 IP：

- **Minikube：**

  ```bash
  minikube ip
  ```

- **云平台（如 GKE）：**

  ```bash
  kubectl get nodes -o wide
  ```

- **本地集群：**

  ```bash
  kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}'
  ```

### 配置网络访问

如在云平台，需开放 NodePort 端口的防火墙规则：

```bash
gcloud compute firewall-rules create allow-nodeport \
   --allow tcp:30000-32767 \
   --source-ranges 0.0.0.0/0
```

### 测试应用程序访问

使用 curl 测试访问：

```bash
curl http://<node-ip>:<node-port>
# 例如
curl http://192.168.1.100:32156
```

预期输出：

```text
Hello Kubernetes!
```

## 使用配置文件方式

你也可以通过 YAML 文件创建 Service，便于版本管理和自动化。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: example-service
  labels:
    run: load-balancer-example
spec:
  type: NodePort
  selector:
    app: hello-world
  ports:
    - port: 8080
      targetPort: 8080
      protocol: TCP
```

应用配置：

```bash
kubectl apply -f service.yaml
```

## 验证负载均衡

Service 会自动在多个 Pod 之间分发请求。多次执行 curl 命令可验证负载均衡效果：

```bash
for i in {1..10}; do curl http://<node-ip>:<node-port>; echo; done
```

## 清理资源

测试结束后，建议及时清理资源：

```bash
kubectl delete service example-service
kubectl delete deployment hello-world
```

## 故障排除

遇到无法访问或负载均衡异常时，可参考下表进行排查。

{{< table title="Kubernetes Service 常见故障与解决方案" >}}

| 问题                   | 排查建议                                                         |
|------------------------|------------------------------------------------------------------|
| 无法访问应用程序       | 检查 NodePort、验证防火墙规则、确认 Pod 状态正常                 |
| Service 无 Endpoints   | 检查 selector 是否匹配 Pod 标签，确认 Pod 处于 Running 状态      |
| 负载均衡不工作         | 验证有多个 Pod，检查 Service 的 Endpoints 列表                   |

{{< /table >}}

## 总结

通过本节内容，你已掌握如何在 Kubernetes 集群中通过 Service 实现应用访问与负载均衡。建议结合实际场景，灵活选择命令行或 YAML 配置方式，并关注网络安全与资源清理，保障集群高可用与易维护。

## 参考文献

- [Service 和 Pod 的 DNS - kubernetes.io](https://kubernetes.io/zh-cn/docs/concepts/services-networking/dns-pod-service/)
- [Service 类型详解 - kubernetes.io](https://kubernetes.io/zh-cn/docs/concepts/services-networking/service/)
