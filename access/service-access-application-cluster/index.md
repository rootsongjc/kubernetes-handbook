---
weight: 95
title: 使用 Service 访问集群中的应用程序
linktitle: 通过 Service 访问
date: '2022-05-21T00:00:00+08:00'
type: book
description: 学习如何创建 Kubernetes Service 对象来访问集群中运行的应用程序，包括创建 Deployment、配置 NodePort 服务以及实现负载均衡的完整流程。
keywords:
- deployment
- service
- nodeport
- pod
- kubernetes
- 负载均衡
- 集群访问
- 应用程序
---

本文将指导你创建 Kubernetes Service 对象，使外部客户端能够访问集群中运行的应用程序。我们将创建一个具有负载均衡功能的 Service，为运行两个实例的应用程序提供服务。

## 学习目标

- 创建并运行 Hello World 应用程序的多个实例
- 创建 NodePort 类型的 Service 对象
- 通过 Service 访问集群中的应用程序
- 理解 Service 的负载均衡机制

## 准备工作

在开始之前，请确保：

- 已安装并配置好 kubectl 命令行工具
- 有一个可用的 Kubernetes 集群
- 具备基本的 Kubernetes 概念了解

## 创建应用程序和 Service

### 步骤 1：创建 Deployment

首先，我们创建一个运行 Hello World 应用程序的 Deployment：

```bash
kubectl create deployment hello-world --image=gcr.io/google-samples/node-hello:1.0 --port=8080
```

然后将其扩展到 2 个副本：

```bash
kubectl scale deployment hello-world --replicas=2
```

为 Deployment 添加标签：

```bash
kubectl label deployment hello-world run=load-balancer-example
```

### 步骤 2：验证 Deployment

查看 Deployment 状态：

```bash
kubectl get deployments hello-world
kubectl describe deployments hello-world
```

查看 ReplicaSet 信息：

```bash
kubectl get replicasets
kubectl describe replicasets
```

### 步骤 3：创建 Service

创建一个 NodePort 类型的 Service 来暴露 Deployment：

```bash
kubectl expose deployment hello-world --type=NodePort --name=example-service
```

### 步骤 4：查看 Service 详情

查看 Service 的详细信息：

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

记录 NodePort 的值（如上例中的 32156）。

### 步骤 5：查看 Pod 信息

列出运行 Hello World 应用程序的 Pod：

```bash
kubectl get pods -l app=hello-world -o wide
```

输出示例：

```
NAME                           READY   STATUS    RESTARTS   AGE   IP           NODE
hello-world-5d8f7c4c9b-8x2mq   1/1     Running   0          2m    10.244.1.4   node1
hello-world-5d8f7c4c9b-v7k9s   1/1     Running   0          2m    10.244.2.5   node2
```

## 访问应用程序

### 获取节点 IP 地址

根据你的集群类型，使用以下方法之一获取节点的外部 IP 地址：

**对于 Minikube：**

```bash
minikube ip
```

**对于云平台（如 GKE）：**

```bash
kubectl get nodes -o wide
```

**对于本地集群：**

```bash
kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}'
```

### 配置网络访问

如果使用云平台，可能需要配置防火墙规则允许 NodePort 端口的流量：

```bash
# 示例：在 GCP 中创建防火墙规则
gcloud compute firewall-rules create allow-nodeport \
   --allow tcp:30000-32767 \
   --source-ranges 0.0.0.0/0
```

### 测试应用程序访问

使用 curl 命令测试应用程序：

```bash
curl http://<node-ip>:<node-port>
```

例如：

```bash
curl http://192.168.1.100:32156
```

成功的响应应该是：

```
Hello Kubernetes!
```

## 使用配置文件方式

除了使用 `kubectl expose` 命令，你也可以使用 YAML 配置文件创建 Service：

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

应用配置文件：

```bash
kubectl apply -f service.yaml
```

## 验证负载均衡

Service 会自动在多个 Pod 之间进行负载均衡。你可以多次执行 curl 命令来验证请求被分发到不同的 Pod：

```bash
for i in {1..10}; do curl http://<node-ip>:<node-port>; echo; done
```

## 清理资源

完成测试后，删除创建的资源：

```bash
# 删除 Service
kubectl delete service example-service

# 删除 Deployment
kubectl delete deployment hello-world
```

## 故障排除

### 常见问题和解决方案

1. **无法访问应用程序**
   - 检查 NodePort 是否正确
   - 验证防火墙规则
   - 确认 Pod 状态正常

2. **Service 没有 Endpoints**
   - 检查 Service 的 selector 是否匹配 Pod 标签
   - 确认 Pod 处于 Running 状态

3. **负载均衡不工作**
   - 验证有多个 Pod 在运行
   - 检查 Service 的 Endpoints 列表

## 进一步学习

- [Service 和 Pod 的 DNS](https://kubernetes.io/zh-cn/docs/concepts/services-networking/dns-pod-service/)
- [使用 Service 连接应用程序](https://kubernetes.io/zh-cn/docs/concepts/services-networking/connect-applications-service/)
- [Service 类型详解](https://kubernetes.io/zh-cn/docs/concepts/services-networking/service/)
