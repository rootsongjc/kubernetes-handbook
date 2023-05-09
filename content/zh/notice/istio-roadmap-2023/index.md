---
title: "Istio 2023 年路线图"
draft: false
date: 2023-05-09T15:27:49+08:00
description: "根据 KubeCon EU Istio Day 上的分享整理。"
type: "notice"
link: "https://static.sched.com/hosted_files/colocatedeventseu2023/3d/Istio%20Roadmap%20Update.pdf"
image: "images/backgrounds/favicon.png"
---

本文根据 KubeCon EU 2023 上的 Istio Day 上 Lin Sun 和 Louis Ryan 的分享整理。

## 2022 年要点

Istio 是 CNCF 的一部分 引入 Istio ambient 功能提升：External Authorization、Gateway API、WorkloadGroup 增强安全性：

- 正式审核
- 模糊测试

额外功能：

- ARM 支持
- 双栈实验

## 2023 主题

- 加速服务网格的价值实现（0 → mTLS）
- TCO（Total Cost of Ownership）革命：需要考虑软件的全生命周期成本，包括采购、安装、配置、使用、升级、维护等各个方面。通过对软件全生命周期成本的全面考虑，企业可以更好地控制软件成本，并实现更好的 ROI。
- 开放的社区成长
- 持续保持平凡和可预测

## 2023 重点领域

- Ambient mesh 到生产
- Gateway API & GAMMA
- 继续稳定和功能提升
- 与其他开源云原生项目和标准的集成

## Ambient Mesh 到生产

- 多集群支持
- 虚拟机支持
- 使用 zTunnel 进行性能改进
- 多个 Kubernetes 平台支持
- Ambient 和 Network CNI 兼容性

Ambient mesh 发布计划：

- Istio 1.18 - Alpha
- Istio 1.19 - Beta 
- Istio 1.20 - Production

## Gateway API

- Kubernetes 标准的流量管理
- Istio 社区是定义和实现的领导者
- Istio 的实现达到 Beta，并通过100%的一致性测试

## 稳定性和功能提升

- Istio 安全（未来）模式
- Telemetry API
- IPV6 和 Dual Stack
- 基于 eBPF 的流量重定向
- WasmPlugin
- 带有 Gateway API 的 gRPC 控制平面

## 集成

与企业生态系统合作：

- Open Telemetry
- SPIRE
- Kiali
- Prometheus
- Jaeger
- WASM
