---
weight: 100
title: 适用于 Kubernetes 的应用开发部署流程
linktitle: 应用开发部署流程
date: 2022-05-21T00:00:00+08:00
description: 本文详细介绍了如何开发容器化应用，使用现代 CI/CD 工具构建 Docker 镜像，通过 Docker Compose 本地测试，生成 Kubernetes YAML 配置文件，并集成到 Istio 服务网格的完整流程。
lastmod: 2025-10-19T07:07:20.087Z
---

本文详细介绍了现代化容器应用的完整开发部署流程：从容器化应用开发、CI/CD 自动化构建、本地 Docker Compose 测试，到 Kubernetes 集群部署，最终集成 Istio 服务网格的端到端实践。

整个流程架构如下图所示：

![流程图](https://assets.jimmysong.io/images/book/kubernetes-handbook/devops/deploy-applications-in-kubernetes/how-to-use-kubernetes-with-istio.webp)
{width=1115 height=960}

## 示例应用介绍

为了演示完整的开发部署流程，本文使用两个 Go 语言开发的微服务应用作为示例：

- **k8s-app-monitor-test**：监控数据生成服务，提供 RESTful API 返回 JSON 格式的模拟监控指标
- **k8s-app-monitor-agent**：监控数据展示服务，获取监控指标并生成可视化图表

这两个服务构成了一个典型的微服务架构，展现了服务间通信、服务发现等关键概念。

### API 文档规范

API 文档采用 API Blueprint 格式定义，使用 [aglio](https://github.com/danielgtaylor/aglio) 工具生成静态文档：

![API](https://assets.jimmysong.io/images/book/kubernetes-handbook/devops/deploy-applications-in-kubernetes/k8s-app-monitor-test-api-doc.webp)
{width=958 height=941}

## 服务发现机制

在 Kubernetes 环境中，`k8s-app-monitor-agent` 需要访问 `k8s-app-monitor-test` 服务。Kubernetes 提供了多种服务发现方式：

### 环境变量方式

Kubernetes 会为每个 Pod 注入相关服务的环境变量，但这种方式存在顺序依赖问题。

### DNS 服务发现（推荐）

使用 Kubernetes 内置的 DNS 服务（CoreDNS），通过服务的 FQDN 进行访问：

```text
<service-name>.<namespace>.svc.cluster.local
```

例如：`k8s-app-monitor-test.default.svc.cluster.local`

**推荐使用 DNS 方式**，因为它没有启动顺序限制，更加灵活可靠。详细原理可参考 [Kubernetes 中的服务发现与环境变量传递机制](/blog/exploring-kubernetes-env-with-docker/)。

## CI/CD 持续集成

### 现代化 CI/CD 选择

虽然原文使用 Wercker（已停止服务），现在推荐使用以下现代化 CI/CD 工具：

- **GitHub Actions**：与 GitHub 深度集成，配置简单
- **GitLab CI/CD**：功能强大的 DevOps 平台
- **Jenkins**：老牌开源 CI/CD 工具
- **Tekton**：Kubernetes 原生的 CI/CD 解决方案

### 典型构建流程

以下是相关的代码示例：

```yaml
# GitHub Actions 示例
name: Build and Push
on:
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Build Docker image
      run: docker build -t ${{ secrets.DOCKER_REGISTRY }}/app:${{ github.sha }} .
    - name: Push to registry
      run: docker push ${{ secrets.DOCKER_REGISTRY }}/app:${{ github.sha }}
```

构建过程会生成带有 Git commit hash 标签的 Docker 镜像，确保版本可追溯。

## 本地开发测试

### Docker Compose 配置

使用 Docker Compose 在本地环境中测试微服务组合：

```yaml
version: '3.8'
services:
  k8s-app-monitor-agent:
    image: jimmysong/k8s-app-monitor-agent:latest
    container_name: monitor-agent
    depends_on:
      - k8s-app-monitor-test
    ports:
      - "8888:8888"
    environment:
      - SERVICE_NAME=k8s-app-monitor-test
      - LOG_LEVEL=debug
    networks:
      - monitor-network

  k8s-app-monitor-test:
    image: jimmysong/k8s-app-monitor-test:latest
    container_name: monitor-test
    ports:
      - "3000:3000"
    environment:
      - LOG_LEVEL=debug
    networks:
      - monitor-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  monitor-network:
    driver: bridge
```

### 本地测试流程

以下是测试相关的代码：

```bash
# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 访问监控页面
curl http://localhost:8888/metrics

# 清理环境
docker-compose down
```

## Kubernetes 部署配置

### 生成 Kubernetes YAML

可以使用 [Kompose](https://kompose.io/) 工具将 Docker Compose 配置转换为 Kubernetes 清单：

```bash
# 安装 kompose
curl -L https://github.com/kubernetes/kompose/releases/latest/download/kompose-linux-amd64 -o kompose
chmod +x kompose && sudo mv kompose /usr/local/bin/

# 转换配置
kompose convert -f docker-compose.yaml
```

### 手动编写 Kubernetes 清单

以下是相关的代码示例：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: k8s-app-monitor-test
  labels:
    app: k8s-app-monitor-test
spec:
  replicas: 2
  selector:
    matchLabels:
      app: k8s-app-monitor-test
  template:
    metadata:
      labels:
        app: k8s-app-monitor-test
    spec:
      containers:
      - name: k8s-app-monitor-test
        image: jimmysong/k8s-app-monitor-test:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: k8s-app-monitor-test
spec:
  selector:
    app: k8s-app-monitor-test
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
```

## 服务外部暴露

### Ingress 配置

以下是相关的配置示例：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: k8s-app-monitor-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - monitor.example.com
    secretName: monitor-tls
  rules:
  - host: monitor.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: k8s-app-monitor-agent
            port:
              number: 8888
```

### Service Mesh 集成方案

#### 使用 Istio 服务网格

安装 Istio 并启用自动 sidecar 注入：

```bash
# 安装 Istio
istioctl install --set values.defaultRevision=default

# 为命名空间启用自动注入
kubectl label namespace default istio-injection=enabled

# 部署应用（自动注入 sidecar）
kubectl apply -f k8s-manifests/
```

#### Istio Gateway 配置

以下是相关的配置示例：

```yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: monitor-gateway
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - monitor.example.com
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: monitor-vs
spec:
  hosts:
  - monitor.example.com
  gateways:
  - monitor-gateway
  http:
  - route:
    - destination:
        host: k8s-app-monitor-agent
        port:
          number: 8888
```

## 可观测性与监控

### 服务监控验证

应用部署完成后，可以通过以下方式验证服务状态：

![图表](https://assets.jimmysong.io/images/book/kubernetes-handbook/devops/deploy-applications-in-kubernetes/k8s-app-monitor-agent.webp)
{width=1015 height=579}

### Istio 可观测性

集成 Istio 后，可以通过以下工具获得丰富的可观测性数据：

#### Grafana 监控面板

访问 Grafana 可以查看详细的服务指标和性能数据：

![Grafana 页面](https://assets.jimmysong.io/images/book/kubernetes-handbook/devops/deploy-applications-in-kubernetes/k8s-app-monitor-istio-grafana.webp)
{width=2582 height=1688}

#### 服务拓扑图

通过 Kiali 查看服务间的依赖关系和流量分布：

![servicegraph 页面](https://assets.jimmysong.io/images/book/kubernetes-handbook/devops/deploy-applications-in-kubernetes/k8s-app-monitor-istio-servicegraph-dotviz.webp)
{width=1168 height=1046}

#### 分布式链路追踪

使用 Jaeger 进行分布式请求追踪分析：

![Zipkin 页面](https://assets.jimmysong.io/images/book/kubernetes-handbook/devops/deploy-applications-in-kubernetes/k8s-app-monitor-istio-zipkin.webp)
{width=2582 height=1688}

## 最佳实践总结

### 开发阶段

- 使用多阶段 Docker 构建优化镜像大小
- 实施容器安全扫描
- 编写全面的单元测试和集成测试

### 部署阶段

- 使用 Helm Charts 管理复杂应用
- 实施滚动更新和回滚策略
- 配置适当的资源限制和健康检查

### 运维阶段

- 建立完善的监控和告警体系
- 实施日志聚合和分析
- 定期进行容灾演练

### 安全考虑

- 使用私有镜像仓库
- 实施 RBAC 权限控制
- 定期更新依赖和基础镜像

通过以上完整的流程，我们实现了从代码提交到生产环境部署的全自动化 DevOps 流水线，并通过服务网格获得了强大的可观测性和流量管理能力。
