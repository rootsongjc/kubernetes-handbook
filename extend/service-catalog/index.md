---
weight: 67
linktitle: 服务目录
title: 服务目录（Service Catalog）
date: '2022-05-21T00:00:00+08:00'
type: book
description: Service Catalog 是 Kubernetes 的扩展 API，允许集群中的应用程序轻松使用外部托管服务，如云提供商的数据存储服务。通过 Open Service Broker API 规范，实现服务的发现、提供和绑定功能。
keywords:
- api
- catalog
- kubernetes
- service
- 实例
- 应用程序
- 托管
- 服务
- 群集
- 集群
---

Service Catalog 是 Kubernetes 的扩展 API，它使运行在 Kubernetes 集群中的应用程序可以轻松使用外部托管软件产品，例如由云提供商提供的数据存储服务。

它提供列表清单、提供 (provision) 和绑定 (binding) 来自服务代理（Service Brokers）的外部托管服务，而不需要关心如何创建或管理这些服务的详细情况。

由 Open Service Broker API 规范定义的 Service Broker 是由第三方提供和维护的一组托管服务的端点 (endpoint)，该第三方可以是 AWS、GCP 或 Azure 等云提供商。

托管服务可以是 Microsoft Azure Service Bus、Amazon SQS 和 Google Cloud Pub/Sub 等，它们可以是应用可以使用的提供的各种软件。

通过 Service Catalog，集群运营者可以浏览由 Service Broker 提供的托管服务列表，提供的托管服务实例，并与其绑定，使其可被 Kubernetes 集群中的应用程序所使用。

## 使用场景

应用程序开发人员编写基于 Kubernetes 集群的应用程序，他们希望使用消息队列作为其应用程序的一部分。但是，他们不想自己配置和管理这个服务。恰好，有一家云提供商通过其服务代理 (Service Broker) 提供消息队列服务。

集群运营商可以设置 Service Catalog 并使用它与云提供商的 Service Broker 进行通信，以调配消息排队服务的实例并使其可用于 Kubernetes 集群内的应用程序。因此，应用程序开发人员不需要关心消息队列的实现细节或管理，可以简单地像服务一样使用它。

## 架构概述

Service Catalog 使用 [Open Service Broker API](https://github.com/openservicebrokerapi/servicebroker) 与 Service Broker 进行通信，充当 Kubernetes API 服务器的中介，发起供应并返回应用程序使用托管服务所需的凭据。

Service Catalog 通过扩展 API 服务器和控制器实现，使用 etcd 进行存储。它还使用 Kubernetes 的聚合层来呈现其 API。

![Service Catalog 架构](https://assets.jimmysong.io/images/book/kubernetes-handbook/extend/service-catalog/service-catalog-architecture.webp)
{width=1421 height=772}

### 核心资源

Service Catalog 安装 `servicecatalog.k8s.io` API 并提供以下 Kubernetes 资源：

- **ClusterServiceBroker**：作为 Service Broker 的群集内代理，封装其服务器连接详细信息。这些由集群运营者创建和管理，希望使用 Broker 服务在其集群中提供新类型的托管服务。

- **ClusterServiceClass**：由特定 Service Broker 提供的托管服务。将新 ClusterServiceBroker 资源添加到群集时，Service Catalog 控制器将连接到 Service Broker 以获取可用托管服务的列表清单。然后它会创建新的 ClusterServiceClass 资源，与每个托管服务相对应。

- **ClusterServicePlan**：托管服务的特定产品套餐。例如，托管服务可能有不同的可用套餐，例如免费套餐或付费套餐，或者可能有不同的配置选项，例如使用 SSD 存储或拥有更多资源。

- **ServiceInstance**：一个提供好的 ClusterServiceClass 实例。这些是由集群运营者创建的托管服务的特定实例，供一个或多个集群内应用程序使用。

- **ServiceBinding**：访问 ServiceInstance 的凭据。由想让他们的应用利用 ServiceInstance 的集群运营者创建。创建之后，Service Catalog 控制器将创建一个与此服务实例对应的 Kubernetes Secret，包含此服务实例的连接详细信息和凭证。

### 认证方式

Service Catalog 支持以下认证方法：

- Basic (username/password)
- OAuth 2.0 Bearer Token

## 使用流程

群集运营者可以使用 Service Catalog API 资源来提供托管服务，并使其在 Kubernetes 群集中可用。主要步骤包括：

1. 列出 Service Broker 提供的托管服务清单和服务套餐
2. 提供托管服务的新实例
3. 绑定到托管服务，获取连接凭证
4. 将连接凭证映射到应用程序中

### 列出托管服务和服务套餐

首先，群集运营者必须在 `servicecatalog.k8s.io` 群组内创建 ClusterServiceBroker 资源。此资源包含访问服务代理端点所需的 URL 和连接详细信息。

这是一个 ClusterServiceBroker 资源的例子：

```yaml
apiVersion: servicecatalog.k8s.io/v1beta1
kind: ClusterServiceBroker
metadata:
  name: cloud-broker
spec:
  # Points to the endpoint of a service broker. (This example is not a working URL.)
  url: https://servicebroker.somecloudprovider.com/v1alpha1/projects/service-catalog/brokers/default
  #####
  # Additional values can be added here, such as bearer token info or caBundle for TLS.
  #####
```

以下是说明从一个 Service Broker 列出托管服务和套餐所涉及步骤的顺序图：

![列出服务](https://assets.jimmysong.io/images/book/kubernetes-handbook/extend/service-catalog/service-catalog-list.webp)
{width=1421 height=772}

1. 将 ClusterServiceBroker 资源添加到 Service Catalog 中时，会触发对外部 Service Broker 的调用以获取可用服务的清单。

2. Service Broker 返回可用托管服务的清单和服务套餐的列表，它们分别在本地缓存为 `ClusterServiceClass` 资源和 `ClusterServicePlan` 资源。

3. 然后，集群运营者可以使用以下命令获取可用托管服务的清单：

   ```sh
   kubectl get clusterserviceclasses -o=custom-columns=SERVICE\ NAME:.metadata.name,EXTERNAL\ NAME:.spec.externalName
   ```

   它应该输出一个类似于以下格式的服务名称列表：

   ```sh
   SERVICE NAME                           EXTERNAL NAME
   4f6e6cf6-ffdd-425f-a2c7-3c9258ad2468   cloud-provider-service
   ...                                    ...
   ```

   他们还可以使用以下命令查看可用的服务套餐：

   ```sh
   kubectl get clusterserviceplans -o=custom-columns=PLAN\ NAME:.metadata.name,EXTERNAL\ NAME:.spec.externalName
   ```

   它应该输出一个类似于以下格式的套餐名称列表：

   ```sh
   PLAN NAME                              EXTERNAL NAME
   86064792-7ea2-467b-af93-ac9694d96d52   service-plan-name
   ...                                    ...
   ```

### 提供新的实例

集群运营者可以通过创建 ServiceInstance 资源来启动新实例的供应。

如下是一个 ServiceInstance 资源的例子：

```yaml
apiVersion: servicecatalog.k8s.io/v1beta1
kind: ServiceInstance
metadata:
  name: cloud-queue-instance
  namespace: cloud-apps
spec:
  # References one of the previously returned services
  clusterServiceClassExternalName: cloud-provider-service
  clusterServicePlanExternalName: service-plan-name
  #####
  # Additional parameters can be added here,
  # which may be used by the service broker.
  #####
```

以下序列图说明了提供一个新的托管服务的实例所涉及的步骤：

![启用一个服务](https://assets.jimmysong.io/images/book/kubernetes-handbook/extend/service-catalog/service-catalog-provision.webp)
{width=964 height=654}

1. 当 `ServiceInstance` 资源创建后，Service Catalog 发起到外部 Service Broker 来提供服务的一个实例。
2. Service Broker 创建托管服务的新实例并返回 HTTP 响应。
3. 然后，群集运营者可以检查实例的状态，来确认它是否准备就绪。

### 绑定到托管服务

在提供新实例后，群集运营者必须绑定到托管服务才能获取到应用程序使用服务所需的连接凭证和服务帐户详细信息。这是通过创建 `ServiceBinding` 资源完成的。

以下是一个 `ServiceBinding` 资源的例子：

```yaml
apiVersion: servicecatalog.k8s.io/v1beta1
kind: ServiceBinding
metadata:
  name: cloud-queue-binding
  namespace: cloud-apps
spec:
  instanceRef:
    name: cloud-queue-instance
  #####
  # Additional information can be added here, such as a secretName or
  # service account parameters, which may be used by the service broker.
  #####
```

以下序列图说明了绑定到托管服务实例所涉及的步骤：

![绑定到托管服务](https://assets.jimmysong.io/images/book/kubernetes-handbook/extend/service-catalog/service-catalog-bind.webp)
{width=962 height=656}

1. 在 ServiceBinding 创建后，Service Catalog 给外部 Service Broker 发一个调用请求，获取与服务实例绑定所需的信息。

2. Service Broker 为相应的服务帐户启用应用程序权限/角色。

3. Service Broker 返回连接和访问托管服务实例所需的信息。根据不同的提供商和不同的服务，返回的信息可能在服务提供商和其管理服务之间有所不同。

### 映射连接凭证

绑定后，最后一步是将连接凭证和服务特定的信息映射到应用程序中。这些信息存储在 Secret 中，应用程序可以用来访问并与托管服务连接。

![映射连接凭证](https://assets.jimmysong.io/images/book/kubernetes-handbook/extend/service-catalog/service-catalog-map.webp)
{width=1421 height=772}

#### Pod 配置示例

执行此映射的一种方法是使用声明式 Pod 配置文件。

以下示例描述了如何将服务帐户凭证映射到应用程序中。被调用的 `sa-key` 密钥存储在名为 `provider-cloud-key` 的卷中，并且应用程序将此卷挂载到 `/var/secrets/provider/key.json`。环境变量 `PROVIDER_APPLICATION_CREDENTIALS` 是从挂载文件的值映射而来的。

```yaml
spec:
  volumes:
    - name: provider-cloud-key
      secret:
        secretName: sa-key
  containers:
    - name: app
      image: myapp:latest
      volumeMounts:
        - name: provider-cloud-key
          mountPath: /var/secrets/provider
      env:
        - name: PROVIDER_APPLICATION_CREDENTIALS
          value: "/var/secrets/provider/key.json"
```

以下示例描述如何将 Secret 值映射到应用程序环境变量。在此示例中，消息传递队列的 `topic` 名称从名为 `provider-queue-credentials` 的 Secret 的 key topic 值映射到环境变量 `TOPIC`。

```yaml
env:
  - name: "TOPIC"
    valueFrom:
      secretKeyRef:
        name: provider-queue-credentials
        key: topic
```

## 安装和配置

### 前提条件

- Kubernetes 1.7 或更高版本
- 启用 RBAC
- 启用集群内 DNS
- Helm 3.x

### 安装 Service Catalog

使用 Helm 安装 Service Catalog：

```bash
# 添加 Service Catalog Helm 仓库
helm repo add svc-cat https://kubernetes-sigs.github.io/service-catalog

# 更新仓库
helm repo update

# 安装 Service Catalog
helm install catalog svc-cat/catalog --namespace catalog --create-namespace
```

### 验证安装

检查 Service Catalog 是否正确安装：

```bash
kubectl get pods -n catalog
kubectl get apiservice | grep servicecatalog
```

## 最佳实践

1. **安全性**：使用 TLS 连接到 Service Broker，并妥善管理认证凭据
2. **监控**：监控 Service Catalog 组件的健康状态和性能
3. **资源管理**：合理设置资源限制和请求
4. **备份**：定期备份 Service Catalog 的配置和状态信息

## 项目状态

> **注意**：Service Catalog 项目目前处于维护模式。对于新的部署，建议考虑使用 [Crossplane](https://crossplane.io/) 或其他现代的云资源管理工具。

Service Catalog 项目在 Kubernetes 生态系统中发挥了重要作用，但随着云原生技术的发展，社区推荐使用更现代的解决方案来管理外部服务。

## 相关资源

- [Open Service Broker API 规范](https://github.com/openservicebrokerapi/servicebroker)
- [Service Catalog GitHub 项目](https://github.com/kubernetes-sigs/service-catalog)
- [Crossplane 项目](https://crossplane.io/)
- [Kubernetes API 聚合文档](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/apiserver-aggregation/)
