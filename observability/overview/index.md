---
title: 可观测性概览
linktitle: 概览
weight: 1
description: Kubernetes 集群和应用的全面可观测性指南，涵盖监控、日志、链路追踪等核心领域的最佳实践。
date: 2025-10-19T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
---

> 可观测性是云原生系统稳定性和高效运维的基石，通过指标、日志和链路追踪等手段，帮助团队全面洞察 Kubernetes 集群与应用的运行状态，实现快速故障定位与性能优化。

## 什么是可观测性？

可观测性（Observability）指通过外部输出推断系统内部状态的能力。在云原生环境中，可观测性帮助我们理解分布式系统的行为，快速诊断问题并优化性能。

### 可观测性的三个支柱

下图展示了可观测性的三大核心支柱及其作用。

![可观测性三支柱：Metrics、Logs、Traces 及各自作用](observability-three-pillars.svg)

#### Metrics（指标）

- 系统指标：CPU、内存、磁盘、网络使用率
- 应用指标：响应时间、错误率、吞吐量
- 业务指标：用户活跃度、订单量、转化率

#### Logs（日志）

- 应用日志：业务逻辑执行记录
- 系统日志：操作系统和中间件日志
- 审计日志：安全和合规相关记录

#### Traces（链路追踪）

- 分布式追踪：跨服务请求跟踪
- 性能分析：识别瓶颈和延迟源
- 错误关联：连接相关事件和错误

## Kubernetes 可观测性架构

Kubernetes 提供了丰富的可观测性原语和集成点。下图展示了各层组件与数据流动关系。

![Kubernetes 可观测性架构：控制面与节点组件产出指标、日志、链路，由 Prometheus、Loki、Tempo 采集，Grafana 可视化](kubernetes-observability-architecture.svg)

### Kubernetes 原生可观测性

Kubernetes 提供了多种原生 API，便于基础观测和故障排查。

#### Metrics API

通过 Metrics API 可获取节点和 Pod 的资源指标：

```bash
# 查看节点指标
kubectl top nodes

# 查看 Pod 指标
kubectl top pods
```

#### Events API

Events API 记录集群中的重要事件，便于追踪变更和异常：

```bash
# 查看集群事件
kubectl get events --sort-by=.metadata.creationTimestamp

# 查看特定命名空间的事件
kubectl get events -n kube-system
```

#### Logs API

通过 kubectl logs 命令访问容器日志，支持实时流式查看：

```bash
# 查看 Pod 日志
kubectl logs <pod-name>

# 查看多容器 Pod 的特定容器日志
kubectl logs <pod-name> -c <container-name>

# 实时查看日志
kubectl logs -f <pod-name>
```

## 可观测性最佳实践

为实现高效的观测体系，建议分层设计、标准化指标与日志、合理采样链路追踪。

### 分层观测策略

下图展示了可观测性分层策略，从基础设施到业务层逐步覆盖。

![分层观测策略：基础设施层、平台层、应用层、业务层自下而上逐层覆盖](layered-observability-strategy.svg)

### 指标层次结构

- 基础设施指标：CPU、内存、磁盘、网络
- 系统指标：Kubernetes 组件状态、etcd 性能
- 应用指标：响应时间、错误率、吞吐量
- 业务指标：用户行为、业务流程完成率

### 日志聚合策略

- 结构化日志：推荐使用 JSON 格式，便于查询和分析
- 日志级别管理：ERROR、WARN、INFO、DEBUG 分层
- 日志轮转：避免磁盘空间耗尽
- 集中存储：使用 Elasticsearch 或 Loki 进行日志聚合

### 链路追踪实施

- 采样策略：生产环境使用适当采样率，平衡性能与可见性
- 上下文传播：确保 trace ID 在服务间正确传递
- 错误关联：将异常与具体请求关联，便于定位问题

## 常用可观测性工具栈

Kubernetes 可观测性生态丰富，CNCF 毕业和孵化项目为主流选择。

![常用可观测性工具栈：CNCF 毕业项目、孵化项目与第三方工具](cncf-observability-projects.svg)

### 推荐工具组合

- 指标监控：Prometheus + Grafana
- 日志管理：EFK（Elasticsearch + Fluentd + Kibana）或 PLG（Promtail + Loki + Grafana）
- 链路追踪：Jaeger 或 SkyWalking

## 实施指南

可观测性体系建设建议分阶段推进，确保覆盖全面且易于运维。

### 规划阶段

- 需求分析：明确需观测的组件和指标
- 工具选型：结合团队技能和现有基础设施选择合适工具
- 资源规划：评估存储和计算资源需求

### 部署阶段

- 基础设施准备：配置存储和网络
- 工具安装：按最佳实践部署可观测性栈
- 集成配置：完善数据收集与处理管道

### 运维阶段

- 监控监控系统：确保观测系统自身可用
- 告警配置：合理设置告警阈值和通知渠道
- 性能优化：定期审查和优化数据收集策略

### 持续改进

- 指标审查：定期评估指标有效性和完整性
- 工具升级：保持可观测性工具的更新
- 流程优化：基于观测数据持续改进开发与运维流程

## 总结

可观测性是确保 Kubernetes 集群和应用稳定运行的关键。通过合理设计和实施可观测性策略，结合强大的工具栈，团队可以实现对系统的全面了解，快速响应问题，并持续优化性能和用户体验。

## 参考文献

1. [Prometheus 官方文档 - prometheus.io](https://prometheus.io/docs/introduction/overview/)
2. [Kubernetes 官方文档 - kubernetes.io](https://kubernetes.io/docs/)
3. [OpenTelemetry 官方文档 - opentelemetry.io](https://opentelemetry.io/)
4. [Grafana 官方文档 - grafana.com](https://grafana.com/docs/)
5. [Jaeger 官方文档 - jaegertracing.io](https://www.jaegertracing.io/docs/)
