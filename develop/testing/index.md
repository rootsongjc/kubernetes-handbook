---
weight: 108
title: Kubernetes 测试指南
linktitle: 测试指南
date: '2024-01-15T00:00:00+08:00'
type: book
keywords:
  - kubernetes
  - 测试
  - 单元测试
  - 集成测试
  - e2e 测试
  - go test
  - 测试策略
lastmod: '2025-08-23'
---

本文介绍 Kubernetes 项目中的各种测试方法和最佳实践。

## 测试类型概述

Kubernetes 项目采用多层测试策略：

- **单元测试**：测试单个函数或组件的逻辑
- **集成测试**：测试多个组件之间的交互
- **端到端 (E2E) 测试**：模拟真实用户场景的完整测试

## 单元测试

单元测试专注于测试单个代码单元的功能，运行速度快，依赖最少。

### 运行所有单元测试

以下是测试相关的代码：

```bash
make test
```

### 测试指定包

以下是测试相关的代码：

```bash
# 测试单个包
make test WHAT=./pkg/kubelet

# 测试多个包
make test WHAT=./pkg/{kubelet,scheduler}
```

也可以直接使用 `go test`：

```bash
go test -v k8s.io/kubernetes/pkg/kubelet
```

### 测试指定用例

以下是测试相关的代码：

```bash
# 运行特定测试函数
make test WHAT=./pkg/api/validation KUBE_GOFLAGS="-v" KUBE_TEST_ARGS='-run ^TestValidatePod$'

# 使用正则表达式匹配多个测试
make test WHAT=./pkg/api/validation KUBE_TEST_ARGS="-run ValidatePod\|ValidateConfigMap"
```

使用 `go test` 的等效命令：

```bash
go test -v k8s.io/kubernetes/pkg/api/validation -run ^TestValidatePod$
```

### 并行测试

并行测试有助于发现竞态条件和不稳定的测试：

```bash
# 2个工作进程，每个运行5次（总共10次）
make test PARALLEL=2 ITERATION=5
```

### 生成覆盖率报告

以下是相关的代码示例：

```bash
make test KUBE_COVER=y
```

### 基准测试

以下是测试相关的代码：

```bash
go test ./pkg/apiserver -benchmem -run=XXX -bench=BenchmarkWatch
```

## 集成测试

集成测试验证多个组件协同工作的能力。

### 环境准备

集成测试需要 etcd，可以使用以下脚本安装：

```bash
hack/install-etcd.sh
export PATH="$PATH:$(pwd)/third_party/etcd"
```

### 运行集成测试

以下是测试相关的代码：

```bash
# 运行所有集成测试
make test-integration

# 运行特定测试用例
make test-integration KUBE_GOFLAGS="-v" KUBE_TEST_ARGS="-run ^TestPodUpdateActiveDeadlineSeconds$"
```

## E2E 测试

端到端测试模拟真实用户操作，验证整个系统的行为。

### 环境准备

以下是相关的代码示例：

```bash
# 编译测试二进制文件
make WHAT='test/e2e/e2e.test'
make ginkgo

# 设置提供商（可选：local, gce, aws 等）
export KUBERNETES_PROVIDER=local
```

### 完整测试流程

以下是测试相关的代码：

```bash
# 构建、启动集群、运行测试、清理
go run hack/e2e.go -- -v --build --up --test --down
```

### 运行特定测试

以下是测试相关的代码：

```bash
# 运行特定测试用例
go run hack/e2e.go -v -test --test_args='--ginkgo.focus=Kubectl.*rolling.*update'

# 跳过特定测试
go run hack/e2e.go -- -v --test --test_args="--ginkgo.skip=Pods.*env"
```

### 并行 E2E 测试

以下是测试相关的代码：

```bash
# 并行运行测试，跳过必须串行的测试
GINKGO_PARALLEL=y go run hack/e2e.go --v --test --test_args="--ginkgo.skip=\[Serial\]"

# 测试失败时保留命名空间以便调试
GINKGO_PARALLEL=y go run hack/e2e.go --v --test --test_args="--ginkgo.skip=\[Serial\] --delete-namespace-on-failure=false"
```

### 测试环境管理

以下是测试相关的代码：

```bash
# 清理测试环境
go run hack/e2e.go -- -v --down

# 使用 kubectl 操作测试集群
go run hack/e2e.go -- -v -ctl='get pods --all-namespaces'
go run hack/e2e.go -- -v -ctl='logs pod-name'
```

## Node E2E 测试

Node E2E 测试专门验证 kubelet 的功能：

```bash
export KUBERNETES_PROVIDER=local

# 运行特定测试
make test-e2e-node FOCUS="InitContainer"

# 使用额外参数
make test_e2e_node TEST_ARGS="--experimental-cgroups-per-qos=true"
```

## 测试技巧和工具

### 使用 kubectl 模板查询

以下是具体的使用方法：

```bash
# 获取特定容器的镜像信息
kubectl get pods nginx-xxx -o template \
    '--template={{range .status.containerStatuses}}{{if eq .name "nginx"}}{{.image}}{{end}}{{end}}'
```

### 日志收集

以下是相关的代码示例：

```bash
# 收集测试相关日志
cluster/log-dump.sh <output-directory>
```

## Kubernetes 测试基础设施

[test-infra](https://github.com/kubernetes/test-infra) 是 Kubernetes 官方的测试框架，提供了完整的 CI/CD 测试解决方案。

![test-infra 架构图（图片来自官方 GitHub）](https://assets.jimmysong.io/images/book/kubernetes-handbook/develop/testing/kubernetes-test-architecture.webp)
{width=1313 height=1284}

主要特性：

- 支持多云环境测试
- 自动化测试流水线
- 测试结果可视化
- 支持 Kubernetes 1.6+ 版本

## 最佳实践

1. **测试金字塔**：单元测试 > 集成测试 > E2E 测试
2. **快速反馈**：优先运行单元测试，然后是集成测试
3. **并行执行**：使用并行测试提高效率
4. **环境隔离**：确保测试环境的独立性
5. **失败重试**：对不稳定的测试设置合理的重试机制

## 参考资源

- [test-infra 项目](https://github.com/kubernetes/test-infra)
- [Ginkgo 测试框架](https://onsi.github.io/ginkgo/)
