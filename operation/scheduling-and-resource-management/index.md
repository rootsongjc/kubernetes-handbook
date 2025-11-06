---
title: Kubernetes 调度与资源管理
linktitle: 调度与资源管理
date: 2025-10-13
weight: 2
description: 介绍 Kubernetes 的调度与资源管理系统，涵盖调度器工作原理、资源分配、自动扩缩容、抢占与驱逐等机制，帮助优化集群资源利用率。
lastmod: 2025-10-13T08:35:22.023Z
---

> 灵活的调度与资源管理，是 Kubernetes 实现弹性、高可用和高效资源利用的核心竞争力。

Kubernetes 通过灵活的调度与资源管理机制，实现了高效的工作负载分布与资源利用。本文系统梳理调度流程、资源分配、自动扩缩容、优先级抢占、节点压力驱逐等核心内容，助力集群性能与可靠性提升。

## 调度与资源管理概述

Kubernetes 需要复杂的系统来决定工作负载的运行位置及资源分配方式。这些系统确保：

- Pod 被调度到合适的节点
- 资源分配高效且公平
- 高优先级工作负载在资源紧张时能优先运行
- 系统可根据资源需求动态调整

下图展示了调度与资源管理的主要组件关系：

```mermaid "调度与资源管理核心组件"
flowchart TD
    subgraph ControlPlane [Control Plane]
        kSched["kube-scheduler"]
        API["kube-apiserver"]
        CM["controller-manager"]
        HPA["Horizontal Pod Autoscaler"]
    end

    subgraph Node [Node]
        kubelet
        CRI["Container Runtime"]
        subgraph NodeResources [Node Resources]
            CPU
            Memory
            Storage
            Network
        end
    end

    kSched -->|Assigns Pod<br/>to Node| API
    API -->|Pod Assignment| kubelet
    kubelet -->|Create Containers<br/>with Resource Limits| CRI
    CRI -->|Uses / Monitors| NodeResources
    CM -->|Creates / Updates| HPA
    HPA -->|Scales| API
    kubelet -->|Reports Resource Usage| API
    kubelet -->|Evicts Pods<br/>under pressure| API
```

![调度与资源管理核心组件](0b48a892565f7cc99148637858b25f76.svg)
{width=1920 height=5388}

## Kubernetes 调度器原理

Kubernetes 调度器（kube-scheduler）负责为新建 Pod 分配节点。它持续监听未分配节点的 Pod，并为每个 Pod 选择最优节点。

### 调度流程

调度分为两大阶段：

1. **过滤（Filtering）**：筛选出可运行 Pod 的节点集合
2. **打分（Scoring）**：对候选节点评分，选出最优节点

```mermaid "调度流程"
flowchart LR
    Pod["Unscheduled Pod"] --> Scheduler

    subgraph "Scheduling Context"
        subgraph "Scheduling Cycle"
            Scheduler["kube-scheduler"] --> Filter["Filtering</br>
(Predicates)"]
            Filter --> Score["Scoring</br>
(Priorities)"]
            Score --> Select["Select Best Node"]
        end

        subgraph "Binding Cycle"
            Select --> Bind["Bind Pod to Node"]
        end
    end

    Bind --> ScheduledPod["Scheduled Pod"]
```

![调度流程](4a336c158c21caae55e2d82bb47e737e.svg)
{width=2178 height=259}

### 调度框架与插件机制

调度器采用可插拔架构（Scheduling Framework），支持多种扩展点，便于自定义调度逻辑。

```mermaid "调度框架扩展点"
flowchart LR
    subgraph "Extension Points"
        QS["queueSort"]
        PF["preFilter"]
        F["filter"]
        PSF["postFilter"]
        PS["preScore"]
        S["score"]
        NS["normalizeScore"]
        R["reserve"]
        P["permit"]
        PB["preBind"]
        B["bind"]
        POB["postBind"]
    end

    Pod["Pod"] --> QS
    QS --> PF
    PF --> F
    F --> PSF
    PSF --> PS
    PS --> S
    S --> NS
    NS --> R
    R --> P
    P --> PB
    PB --> B
    B --> POB
    POB --> N["Node"]
```

![调度框架扩展点](fad38edf823ac0fb98b8b11ff3469623.svg)
{width=3241 height=177}

### 默认调度插件

下表列举了常用内置调度插件及其作用：

{{< table title="Kubernetes 默认调度插件及扩展点" >}}

| 插件 | 说明 | 扩展点 |
| --- | --- | --- |
| NodeResourcesFit | 检查节点资源是否充足 | preFilter, filter, score |
| PodTopologySpread | 实现拓扑分布约束 | preFilter, filter, preScore, score |
| NodeAffinity | 节点亲和性与选择器 | filter, score |
| TaintToleration | 污点与容忍度 | filter, preScore, score |
| NodeName | 节点名匹配 | filter |
| NodePorts | 检查端口可用性 | preFilter, filter |
| NodeUnschedulable | 过滤不可调度节点 | filter |
| InterPodAffinity | Pod 间亲和/反亲和 | preFilter, filter, preScore, score |
| PrioritySort | 优先级排序 | queueSort |
| DefaultBinder | 默认绑定机制 | bind |
| DefaultPreemption | 抢占逻辑 | postFilter |

{{< /table >}}

## 资源管理机制

Kubernetes 支持为 Pod 中的容器指定资源请求（requests）与限制（limits），用于调度与资源分配。

### 资源类型

主要资源类型如下：

{{< table title="Kubernetes 支持的资源类型" >}}

| 资源类型 | 说明 | 单位 |
| --- | --- | --- |
| CPU | 计算资源 | 核心数（1、0.5、100m 等） |
| Memory | 内存 | 字节（Ki、Mi、Gi 等） |
| Ephemeral Storage | 临时存储 | 字节（Ki、Mi、Gi 等） |
| Huge Pages | 大页内存（Linux） | 指定大小（如 hugepages-2Mi） |
| Extended Resources | 自定义扩展资源 | 整数单位 |

{{< /table >}}

### Requests 与 Limits

每个容器可指定资源请求与限制。下图展示了 Pod 内多容器资源汇总关系：

```mermaid "Pod 资源请求与限制示意"
flowchart TD
    subgraph "Pod"
        subgraph "Container 1"
            C1R["Requests:</br>
CPU: 250m</br>
Memory: 64Mi"]
            C1L["Limits:</br>
CPU: 500m</br>
Memory: 128Mi"]
        end

        subgraph "Container 2"
            C2R["Requests:</br>
CPU: 250m</br>
Memory: 64Mi"]
            C2L["Limits:</br>
CPU: 500m</br>
Memory: 128Mi"]
        end
    end

    subgraph "Pod Total"
        PR["Requests:</br>
CPU: 500m</br>
Memory: 128Mi"]
        PL["Limits:</br>
CPU: 1</br>
Memory: 256Mi"]
    end

    C1R --> PR
    C2R --> PR
    C1L --> PL
    C2L --> PL
```

![Pod 资源请求与限制示意](97d371b394c2e5dca0e1607ceb0a294f.svg)
{width=1920 height=1181}

- **Requests**：调度时保证的最小资源
- **Limits**：运行时允许的最大资源

调度器依据 requests 进行节点选择，kubelet 依据 limits 强制资源上限。

### 资源限制的强制机制

kubelet 与容器运行时协作，强制资源限制：

- **CPU 限制**：通过限流实现，超出部分被限制
- **内存限制**：超限时触发 OOM 杀手，容器被终止

若容器超出 requests 但未超 limits，且节点资源紧张，Pod 可能被驱逐。

## Pod 调度策略

Kubernetes 提供多种机制控制 Pod 在节点间的分布。

### 拓扑分布约束（Topology Spread Constraints）

拓扑分布约束可控制 Pod 在不同故障域（如区域、可用区、节点）间的分布。

```mermaid "拓扑分布约束示意"
flowchart TD
    subgraph "zoneA"
        n1["Node 1"] 
        n2["Node 2"]
    end

    subgraph "zoneB"
        n3["Node 3"]
        n4["Node 4"]
    end

    p1["Pod 1"] --> n1
    p2["Pod 2"] --> n2
    p3["Pod 3"] --> n3

    newPod["New Pod"] -.- n4
```

![拓扑分布约束示意](16f568d0cfe6ce9f423c95d2d649e8ae.svg)
{width=1920 height=716}

常用字段包括：

- `maxSkew`：最大分布偏差
- `topologyKey`：节点标签键
- `whenUnsatisfiable`：无法满足约束时的处理方式
- `labelSelector`：约束作用的 Pod 选择器

### 污点与容忍（Taints & Tolerations）

污点与容忍机制确保 Pod 不会被调度到不合适的节点。

```mermaid "污点与容忍调度示意"
flowchart LR
    subgraph "Nodes"
        n1["Node 1<br/>
Taint: key=value:NoSchedule"]
        n2["Node 2<br/>
No Taints"]
    end

    subgraph "Pods"
        p1["Pod 1<br/>
No Tolerations"]
        p2["Pod 2<br/>
Toleration: key=value:NoSchedule"]
    end

    p1 -. "Cannot schedule" .-> n1
    p1 --> n2
    p2 --> n1
    p2 --> n2
```

![污点与容忍调度示意](e8fca8cb32bd1b1c98a99fe07ccc755e.svg)
{width=1920 height=856}

常见场景包括专用节点、特殊硬件节点、节点压力驱逐等。

## 优先级与抢占

Kubernetes 支持通过优先级（Priority）指定 Pod 重要性。高优先级 Pod 无法调度时，调度器可抢占低优先级 Pod。

### Pod 优先级

通过 PriorityClass 对象和 `priorityClassName` 字段指定。优先级值越高，Pod 越重要。

```mermaid "Pod 优先级示意"
flowchart TD
    subgraph "PriorityClasses"
        PC1["system-cluster-critical</br>
value: 2000000000"]
        PC2["high-priority</br>
value: 1000000"]
        PC3["default</br>
value: 0"]
    end

    subgraph "Pods"
        P1["kube-dns</br>
priority: 2000000000"]
        P2["monitoring</br>
priority: 1000000"]
        P3["frontend</br>
priority: 0"]
    end

    PC1 -->|"referenced by"| P1
    PC2 -->|"referenced by"| P2
    PC3 -->|"referenced by"| P3
```

![Pod 优先级示意](e78caf0e1d15dd924aab8e9ddba408c0.svg)
{width=1920 height=1249}

内置优先级类包括 `system-cluster-critical` 和 `system-node-critical`。

### 抢占机制

抢占流程如下：

1. 高优先级 Pod 无法调度
2. 调度器查找可抢占节点
3. 选择低优先级 Pod 进行驱逐
4. 高优先级 Pod 获得调度机会

## 节点压力驱逐

kubelet 监控节点资源压力，主动驱逐 Pod 以防节点故障。

### 驱逐信号与阈值

kubelet 依据多种信号判断资源压力：

{{< table title="节点驱逐信号说明" >}}

| 驱逐信号 | 说明 |
| --- | --- |
| memory.available | 节点可用内存 |
| nodefs.available | 节点文件系统可用空间 |
| nodefs.inodesFree | 节点文件系统可用 inode |
| imagefs.available | 镜像存储可用空间 |
| pid.available | 可用进程数 |

{{< /table >}}

阈值分为软阈值（有宽限期）和硬阈值（立即驱逐）。驱逐顺序依次考虑 QoS 类别、资源使用与优先级。

## Pod 中断预算（PDB）

Pod Disruption Budget（PDB）用于限制自愿中断（如节点维护、升级）时可同时中断的 Pod 数量。

```mermaid "PDB 保护机制示意"
flowchart TD
    subgraph "Deployment: web-app"
        P1["Pod 1"]
        P2["Pod 2"]
        P3["Pod 3"]
        P4["Pod 4"]
        P5["Pod 5"]
    end

    PDB["PDB</br>
minAvailable: 4"]

    P1 --- PDB
    P2 --- PDB
    P3 --- PDB
    P4 --- PDB
    P5 --- PDB

    Admin["Administrator"] -->|"Drains node</br>
with Pod 5"| P5
    PDB -->|"Allows disruption"| P5
```

![PDB 保护机制示意](f27af411de4700b90a5753f9cc319a4d.svg)
{width=1920 height=902}

PDB 可指定 `minAvailable` 或 `maxUnavailable`，仅保护自愿中断，不防止节点故障或资源驱逐。

## 自动扩缩容（Autoscaling）

Kubernetes 支持基于指标的自动扩缩容，提升资源利用率。

### 水平 Pod 自动扩缩容（HPA）

HPA 控制器根据指标自动调整副本数。下图展示了 HPA 工作流程：

```mermaid "HPA 工作流程"
flowchart TD
    subgraph "HPA Controller"
        Metrics["Metrics Collector"]
        Calc["Scale Calculator"]
    end

    subgraph "Metrics Server"
        MS["metrics.k8s.io API"]
    end

    subgraph "Deployment"
        RS["ReplicaSet"]
        P1["Pod 1"]
        P2["Pod 2"]
        P3["Pod 3"]
    end

    Metrics -->|"Fetch metrics"| MS
    MS -->|"Pod CPU/Memory"| Metrics
    Metrics --> Calc
    Calc -->|"Calculate desired replicas"| RS
    RS --> P1
    RS --> P2
    RS --> P3
```

![HPA 工作流程](2156e4e4f5429e8cc0cea41478bd5386.svg)
{width=1920 height=2029}

HPA 支持 CPU、内存、自定义与外部指标。核心算法如下：

```text
desiredReplicas = ceil[currentReplicas * (currentMetricValue / desiredMetricValue)]
```

### 可配置扩缩容策略

HPA 支持分别配置扩容与缩容策略：

```yaml
behavior:
  scaleDown:
    stabilizationWindowSeconds: 300
    policies:
    - type: Percent
      value: 10
      periodSeconds: 60
  scaleUp:
    stabilizationWindowSeconds: 0
    policies:
    - type: Percent
      value: 100
      periodSeconds: 15
    - type: Pods
      value: 4
      periodSeconds: 15
    selectPolicy: Max
```

可控制扩缩容速度、窗口期与单次变更幅度。

## 资源装箱（Bin Packing）策略

Kubernetes 支持多种资源装箱策略，提升集群利用率。

### MostAllocated 策略

MostAllocated 策略倾向于将 Pod 调度到资源利用率高的节点。

```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
profiles:
- pluginConfig:
  - args:
      scoringStrategy:
        resources:
        - name: cpu
          weight: 1
        - name: memory
          weight: 1
        type: MostAllocated
    name: NodeResourcesFit
```

### RequestedToCapacityRatio 策略

该策略可更细粒度控制资源分配比例，适用于复杂场景。

## 多调度器支持

Kubernetes 支持同时运行多个调度器，满足特殊调度需求。

```mermaid "多调度器调度示意"
flowchart TD
    API["kube-apiserver"]

    subgraph "Schedulers"
        KS["default-scheduler"]
        CS["custom-scheduler"]
    end

    subgraph "Pods"
        P1["Pod 1</br>
schedulerName: default-scheduler"]
        P2["Pod 2</br>
schedulerName: custom-scheduler"]
    end

    API --> KS
    API --> CS

    KS -->|"Schedules"| P1
    CS -->|"Schedules"| P2
```

![多调度器调度示意](6ed71126383050f86c1b8c4f5c9553c7.svg)
{width=1920 height=1742}

通过 Pod 的 `schedulerName` 字段指定调度器。

## 集群规模与可扩展性

Kubernetes 支持大规模集群，常见上限如下：

- 节点数：5000
- 总 Pod 数：150,000
- 总容器数：300,000
- 单节点最大 Pod 数：110

大集群需关注控制面容量、资源配额、云厂商限制、网络与存储性能等。

## 总结

Kubernetes 通过灵活的调度与资源管理体系，实现了高效的工作负载分布、资源利用与弹性伸缩。合理配置调度策略、资源限制、优先级与自动扩缩容机制，可显著提升集群的性能、可靠性与可维护性。

## 参考文献

1. [Pod Priority and Preemption - kubernetes.io](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/)
2. [Kubernetes Scheduling - kubernetes.io](https://kubernetes.io/docs/concepts/scheduling-eviction/scheduling-framework/)
3. [Resource Management for Pods and Containers - kubernetes.io](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
4. [Horizontal Pod Autoscaler - kubernetes.io](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
5. [Pod Disruption Budgets - kubernetes.io](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/)
