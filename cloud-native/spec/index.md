---
title: "云原生应用规范模型"
linkTitle: "规范模型"
description: "基于 OAM 的云原生应用的规范模型，详细介绍 Workload、Component、Trait、ApplicationScope 和 ApplicationConfiguration 等核心概念。"
weight: 9
aliases:
  - /book/kubernetes-handbook/cloud-native/spec/workload/
  - /book/kubernetes-handbook/cloud-native/spec/component/
  - /book/kubernetes-handbook/cloud-native/spec/trait/
  - /book/kubernetes-handbook/cloud-native/spec/application-scope/
  - /book/kubernetes-handbook/cloud-native/spec/application-configuration/
keywords:
- oam
- workload
- component
- trait
- application scope
- application configuration
- 云原生
- 应用规范
---

OAM（Open Application Model）是一个专注于描述应用程序的规范，它通过定义标准化的应用程序模型来实现平台无关的应用程序描述。本文将详细介绍 OAM 规范中的核心概念和组件。

{{<callout note "版本说明">}}
本文基于 OAM v1alpha2 版本编写。
{{</callout>}}

## 设计原则

OAM 规范的设计遵循了以下原则：

- **关注点分离**：根据功能和行为来定义模型，以此划分不同角色的职责
- **平台中立**：OAM 的实现不绑定到特定平台
- **优雅**：尽量减少设计复杂性
- **复用性**：可移植性好，同一个应用程序可以在不同的平台上不加改动地执行
- **不作为编程模型**：OAM 提供的是应用程序模型，描述了应用程序的组成和组件的拓扑结构，而不关注应用程序的具体实现

## 规范架构

下图是 OAM 规范示意图：

![OAM 规范示意图](https://assets.jimmysong.io/images/book/kubernetes-handbook/cloud-native/spec/oam-spec.webp)
{width=1361 height=811}

*图片来自 [oam/spec issue #346](https://github.com/oam-dev/spec/issues/346)*

OAM 规范包含以下核心组件：

- **Workload**：定义工作负载的类型
- **Component**：定义应用程序的基本组件
- **Trait**：定义 Component 的运维属性
- **ApplicationScope**：定义 Component 的边界以用于逻辑分组
- **ApplicationConfiguration**：将 Component 和 Trait 组合成完整的应用程序

## Workload - 工作负载定义

### 概述

`Workload` 用于定义工作负载的类型。应用程序可用的 `Workload` 类型是由平台提供商和基础设施运维人员提供的。`Workload` 模型参照 Kubernetes 规范定义，理论上，平台商可以定义如容器、Pod、Serverless 函数、虚拟机、数据库、消息队列等任何类型的 `Workload`。

### Workload 定义示例

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: WorkloadDefinition
metadata:
  name: schema.example.jimmysong.io
spec:
  definitionRef:
    name: schema.example.jimmysong.io
```

{{<callout tip "关于 definitionRef">}}
CR 即 Custom Resource（自定义资源），指的是实例化后的 Kubernetes CRD。应用开发者可以在 `Component` 的 `Workload` 中直接定义 CR。`definitionRef` 将 `Workload` schema 在 OAM 解释器中注册，通过增加一个抽象层，使其与 Operator 框架解耦（毕竟不是说有 CRD 都是面向应用开发者的），表示可作为负载类型使用。
{{</callout>}}

### 重要说明

请保持 `spec.definitionRef.name` 的值与 `metadata.name` 的值相同，因为 `definitionRef` 是对相应的 `Workload` schema 的引用，对于 Kubernetes 平台来说，即对 CRD 的引用。应用开发者在定义 `Component` 引用该 `Workload` 的时候需要直接实例化一个 CRD 的配置（及创建一个 CR）。

### Workload 分类

OAM 中将 `Workload` 分成了三个类别：

- **core.oam.dev**（核心）
- **standard.oam.dev**（标准）
- **自定义扩展类别**

目前 OAM 中支持的核心 `Workload` 有 `ContainerizedWorkload`。

## Component - 应用组件

### 概述

`Component` 用于定义应用程序的基本组件，其中包含了对 Workload 的引用。一个 Component 中只能定义一个 Workload，这个 Workload 是与平台无关的，可以直接引用 Kubernetes 中的 CRD。

### Component 定义示例

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: Component
metadata:
  name: my-component
spec:
  workload:
    apiVersion: core.oam.dev/v1alpha2
    kind: ContainerizedWorkload
    spec:
      os: linux
      containers:
        - name: server
          image: my-image:latest
  parameters:
  - name: myServerImage
    required: true
    fieldPaths:
    - ".spec.containers[0].image"
```

### Component 组成部分

`Component` 定义由以下几个部分组成：

#### 1. metadata

关于 Component 的信息，主要是针对应用运维的信息。

#### 2. workload

该 Component 的实际工作负载。具体有哪些负载类型可用可以咨询平台提供商，平台运维也可以根据 Workload 规范来扩展负载类型，比如：

- `Containers`
- `Functions`
- `VirtualMachine`
- `VirtualService`

OAM 目前定义的核心负载类型有 `ContainerizedWorkload`（与 Kubernetes 中的 Pod 定义类似，同样支持定义多个容器，但是缺少了 Pod 中的一些属性）。

#### 3. parameters

在应用程序运行时可以调整的参数，即应用开发者在 `Component` 中的原有定义可以在运行时被应用运维人员覆盖。`parameters` 使用 JSONPath 的方式引用 `spec` 中的字段。

{{<callout note "Component 是可变的">}}
`Component` 的配置在应用后是**可更改的（Mutable）**，有的 `Trait` 可能会监听 `Component` 的变更并作出相应的操作，每次变更都会导致新的 `ApplicationConfiguration` 发布。
{{</callout>}}

## Trait - 运维特性

### 概述

`Trait` 用于定义 `Component` 的运维属性，是对 `Component` 运行时的叠加，需要通过 `ApplicationConfiguration` 的配置将其与 `Component` 绑定，用于动态修改 `Component` 中 `workload` 的行为。

不同的 `Trait` 可能适用于不同的 `Component`（因为不同的 `Component` 中的 `workload` 可能不同，因此它们的运维特性也可能不同），如流量路由规则（如负载均衡策略、入口路由、出口路由、百分比路由、限流、熔断、超时限制、故障注入等）、自动缩放策略、升级策略、发布策略等。

### Trait 特征

`Trait` 还具有以下几个特征：

- `Trait` 是根据在 `Component` 中引用的顺序应用的，如果某些运维特征本身具有依赖性，可以通过显式排序来解决
- 对于某一类型的 `Trait` 在同一个 `Component` 实例只能应用一个
- 在应用 `Trait` 时，需要进行冲突检查，如果一组 `Trait` 的特性不能满足运维组合，则判定为不合法

### Trait 的优势

将运维属性从应用组件本身的定义（`Component`）中剥离有如下几个好处：

- `Trait` 通常由应用运维人员定义和维护，而不需要应用开发人员参与，应用开发人员对 `Trait` 可能无感知，减轻了应用开发人员的负担
- `Trait` 将云原生应用程序的一些通用运维属性从应用配置中剥离出来，大大提高了运维逻辑的可复用性
- 应用 `Trait` 组合前进行运维特性检查，可以有效防止配置冲突和无法预期的情况发生

### Trait 定义示例

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: TraitDefinition
metadata:
  name: manualscalertrait.core.oam.dev
spec:
  appliesToWorkloads:
    - core.oam.dev/v1alpha2.ContainerizedWorkload
  definitionRef:
    name: manualscalertrait.core.oam.dev
```

{{<callout note "关于 definitionRef">}}
CR 即 Custom Resource（自定义资源），指的是实例化后的 Kubernetes CRD。`definitionRef` 将 `Trait` schema 在 OAM 解释器中注册，通过增加一个抽象层，使其与 Operator 框架解耦（毕竟不是说有 CRD 都是面向应用开发者的）。
{{</callout>}}

### Trait 分类

OAM 中将 `Trait` 分成了三个类别：

- **core.oam.dev**（核心）
- **standard.oam.dev**（标准）
- **自定义扩展类别**

一个 `Trait` 具体适用于哪些 `workload` 可以在 `Trait` 的 `TraitDefinition` 中定义。目前 OAM 中支持的核心 `Trait` 有 `ManualScalerTrait`。

## ApplicationScope - 应用范围

### 概述

`ApplicationScope` 根据 `Component` 中的应用逻辑或共同行为划定作用域，将其分组以便于管理。

### ApplicationScope 特征

`ApplicationScope` 具有以下特征：

- 一个 `Component` 可能属于一个或多个 `ApplicationScope`
- 有的 `ApplicationScope` 可以限定其中是否可以部署同一个 `Component` 的多个实例
- `ApplicationScope` 可以作为 `Component` 与基础设施的连接层，提供身份、网络或安全能力
- `Trait` 可以根据 `Component` 中定义的 `ApplicationScope` 来执行适当的运维特性

### 支持的 ApplicationScope 类型

目前 OAM 中支持的核心应用范围类型有：

- `NetworkScope`
- `HealthScope`

### NetworkScope 示例

下面是使用 `NetworkScope` 来声明作用域的示例：

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: NetworkScope
metadata:
  name: my-network
  labels:
    region: my-region
    environment: production
spec:
  networkId: my-network
  subnetIds:
  - my-subnetwork-01
  - my-subnetwork-02
  - my-subnetwork-03
  internetGatewayType: nat
```

上面的示例的作用是将三个子网划定为一组网络边界，这通常是使用 VPC 实现。

## ApplicationConfiguration - 应用配置

### 概述

`ApplicationConfiguration` 将 `Component` 与 `Trait` 组合，定义了一个应用程序的配置。`Component` 每部署一次就会产生一个实例（`Instance`），实例是可以被升级的（包括回滚和重新部署），而每次部署和升级就会产生一次新的发布（`Release`）。

{{<callout note "关于 Release">}}
[12 因素应用](https://12factor.net/zh_cn/)严格区分构建、发布、运行这三个步骤。每次构建和修改配置后都会产生一次新的发布（`Release`）。OAM 中将 `Component`、`Trait`、`ApplicationScope` 组合而成的 `ApplicationConfiguration` 即等同于 `Release`。每次对 `ApplicationConfiguration` 的更新都会创建一个新的 `Release`（跟 Helm 中的 `Release` 概念一致）。
{{</callout>}}

### ApplicationConfiguration 示例

下面是一个 `ApplicationConfiguration` 示例：

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: ApplicationConfiguration
metadata:
  name: my-app
  annotations:
    version: v1.0.0
    description: "My first application deployment."
spec:
  components:
    - componentName: my-component
      parameterValues:
        - name: PARAMETER_NAME
          value: SUPPLIED_VALUE
        - name: ANOTHER_PARAMETER
          value: "AnotherValue"
      traits:
        - name: manualscaler.core.oam.dev
          version: v1
          spec:
            replicaCount: 3
      scopes:
        - scopeRef:
            apiVersion: core.oam.dev/v1alpha2
            kind: NetworkScope
            name: my-network
```

### 完整应用示例

以下是一个完整的应用部署示例，展示了如何将各个组件组合起来：

#### 1. 定义 Component

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: Component
metadata:
  name: frontend
spec:
  workload:
    apiVersion: core.oam.dev/v1alpha2
    kind: ContainerizedWorkload
    spec:
      containers:
        - name: web
          image: nginx:1.20
          ports:
          - containerPort: 80
            name: http
          resources:
            limits:
              cpu: 100m
              memory: 128Mi
  parameters:
  - name: image
    required: false
    fieldPaths:
    - ".spec.containers[0].image"
  - name: replicas
    required: false
    fieldPaths:
    - ".spec.replicas"
```

#### 2. 定义 NetworkScope

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: NetworkScope
metadata:
  name: production-network
spec:
  networkId: prod-vpc
  subnetIds:
  - prod-subnet-1
  - prod-subnet-2
```

#### 3. 创建 ApplicationConfiguration

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: ApplicationConfiguration
metadata:
  name: web-app
  labels:
    app: frontend
    environment: production
spec:
  components:
  - componentName: frontend
    parameterValues:
    - name: image
      value: nginx:1.21
    - name: replicas
      value: 3
    traits:
    - name: manualscaler.core.oam.dev
      spec:
        replicaCount: 3
    - name: ingress.standard.oam.dev
      spec:
        rules:
        - host: myapp.example.com
          paths:
          - path: /
            backend:
              serviceName: frontend
              servicePort: 80
    scopes:
    - scopeRef:
        apiVersion: core.oam.dev/v1alpha2
        kind: NetworkScope
        name: production-network
```

## 角色分工

OAM 规范明确定义了三种角色及其职责：

### 1. 应用开发者（Application Developer）

- 定义 `Component`，描述应用的功能逻辑
- 专注于业务代码实现，无需关心运维细节
- 可以定义 `parameters` 来允许运维人员调整配置

### 2. 应用运维人员（Application Operator）

- 创建 `ApplicationConfiguration`，组合 `Component` 和 `Trait`
- 配置运维特性如扩缩容、路由、监控等
- 管理应用的部署、升级和监控

### 3. 基础设施运维人员（Infrastructure Operator）

- 定义可用的 `Workload` 类型
- 提供各种 `Trait` 定义
- 管理 `ApplicationScope` 和底层基础设施

## 最佳实践

### 1. Component 设计

- 保持 Component 的单一职责，一个 Component 只做一件事
- 合理设计 parameters，让运维人员能够灵活配置
- 使用语义化的命名和详细的描述

### 2. Trait 应用

- 优先使用平台提供的标准 Trait
- 避免在同一个 Component 上应用冲突的 Trait
- 按照依赖关系合理排序 Trait

### 3. ApplicationScope 规划

- 根据网络拓扑和安全要求合理划分 Scope
- 考虑 Scope 对性能和成本的影响
- 保持 Scope 定义的简洁和易于理解

### 4. 版本管理

- 为 ApplicationConfiguration 添加版本标识
- 实施渐进式发布策略
- 保留历史版本以支持回滚

## 总结

OAM 规范通过定义标准化的应用程序模型，实现了关注点分离，让不同角色能够专注于自己的领域：

- **应用开发者**专注于业务逻辑的实现
- **应用运维人员**专注于应用的部署和运维
- **基础设施运维人员**专注于平台能力的提供

这种分层的设计不仅提高了开发效率，也增强了应用的可移植性和可维护性，是云原生应用开发和部署的重要规范。

## 参考资料

- [OAM 官方规范](https://github.com/oam-dev/spec)

