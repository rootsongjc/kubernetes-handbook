---
title: 链路追踪
weight: 4
description: Kubernetes 分布式系统的链路追踪，包括 Jaeger 和 OpenTelemetry。
date: 2025-10-19T00:00:00+08:00
lastmod: 2025-10-19T12:31:56.057Z
---

> 链路追踪是 Kubernetes 可观测性体系的关键技术，通过 Jaeger 和 OpenTelemetry 等工具，帮助开发者全面洞察分布式系统的请求路径，快速定位性能瓶颈与故障源。

## 链路追踪概述

链路追踪（Distributed Tracing）是可观测性的重要组成部分，用于跟踪请求在分布式系统中的完整路径，帮助开发者理解和诊断微服务架构中的性能问题和错误。

### 为什么需要链路追踪？

下图对比了传统监控与链路追踪的优势。

```mermaid "链路追踪与传统监控对比"
graph TD
    subgraph "传统监控的局限性"
        TRADITIONAL[传统监控]
        TRADITIONAL --> METRICS[只看指标]
        TRADITIONAL --> LOGS[分散的日志]
        METRICS --> PROBLEM[无法关联请求]
        LOGS --> PROBLEM
    end

    subgraph "链路追踪的优势"
        TRACING[链路追踪]
        TRACING --> REQUEST_FLOW[完整请求链路]
        TRACING --> LATENCY[端到端延迟分析]
        TRACING --> CORRELATION[跨服务关联]
        REQUEST_FLOW --> SOLUTION[快速定位问题]
        LATENCY --> SOLUTION
        CORRELATION --> SOLUTION
    end
```

![链路追踪与传统监控对比](aad460f5297a7e7ea53727a81bee07c6.svg)
{width=1920 height=502}

链路追踪能够实现：

- 端到端请求链路还原
- 跨服务性能瓶颈定位
- 请求与错误的全链路关联

### 核心概念

链路追踪的核心数据结构包括 Span、Trace 和 Context 传播。

#### Span（跨度）

Span 是分布式追踪的基本单位，表示一个操作的时间跨度。

```mermaid "Span 结构"
graph TD
    SPAN[Span] --> OPERATION[操作名称]
    SPAN --> START_TIME[开始时间]
    SPAN --> DURATION[持续时间]
    SPAN --> TAGS[标签]
    SPAN --> LOGS[日志]
    SPAN --> PARENT[父 Span]
```

![Span 结构](dc3924719762f263fae4651a5e0176cd.svg)
{width=1920 height=394}

#### Trace（链路）

Trace 由多个相关的 Span 组成，表示一个完整的请求链路。

```text
Trace ID: abc123...
├── Span 1: HTTP 请求接收 (服务 A)
│   ├── Span 1.1: 数据库查询
│   └── Span 1.2: 缓存查询
├── Span 2: gRPC 调用 (服务 B)
│   └── Span 2.1: 业务逻辑处理
└── Span 3: HTTP 响应返回 (服务 A)
```

#### Context 传播

Context 传播确保 Trace ID 在服务间正确传递，常见于 HTTP Header。

```yaml
# HTTP Header 传播
X-B3-TraceId: abc123...
X-B3-SpanId: def456...
X-B3-ParentSpanId: ghi789...
X-B3-Sampled: 1
```

## Jaeger 分布式追踪

Jaeger 是 CNCF 毕业项目，广泛用于分布式链路追踪。

### Jaeger 架构

下图展示了 Jaeger 的核心架构及数据流转。

```mermaid "Jaeger 架构总览"
graph TD
    subgraph "应用层"
        APP[应用]
        TRACER[Jaeger Client]
    end

    subgraph "收集层"
        AGENT[Jaeger Agent]
        COLLECTOR[Jaeger Collector]
    end

    subgraph "存储层"
        CASSANDRA[(Cassandra)]
        ELASTICSEARCH[(Elasticsearch)]
        MEMORY[(内存)]
    end

    subgraph "查询层"
        QUERY[Jaeger Query]
        UI[Jaeger UI]
    end

    APP --> TRACER
    TRACER --> AGENT
    AGENT --> COLLECTOR
    COLLECTOR --> CASSANDRA
    COLLECTOR --> ELASTICSEARCH
    COLLECTOR --> MEMORY
    QUERY --> CASSANDRA
    QUERY --> ELASTICSEARCH
    UI --> QUERY
```

![Jaeger 架构总览](a2f49e6fa4fa43b190890f522dbf4724.svg)
{width=1920 height=2813}

### 核心组件

- Jaeger Client：应用集成的客户端库
- Jaeger Agent：轻量级进程，接收和转发 Span
- Jaeger Collector：接收、验证、索引和存储 Span
- Jaeger Query：查询 API
- Jaeger UI：Web 可视化界面

### 采样策略

采样策略决定哪些请求被追踪，常见配置如下：

```yaml
sampler:
  # 常量采样
  type: const
  param: 1

  # 概率采样
  type: probabilistic
  param: 0.1

  # 速率限制采样
  type: ratelimiting
  param: 100

  # 自适应采样
  type: adaptive
  param: 0.1
```

## OpenTelemetry 可观测性标准

OpenTelemetry 是 CNCF 主推的可观测性标准，支持 Trace、Metrics、Logs 三大数据类型。

### OpenTelemetry 架构

下图展示了 OpenTelemetry 的核心架构。

```mermaid "OpenTelemetry 架构"
graph TD
    subgraph "应用层"
        APP[应用]
        API[OpenTelemetry API]
        SDK[OpenTelemetry SDK]
        AUTO_INSTRUMENTATION[自动插桩]
    end

    subgraph "收集器层"
        OTEL_COLLECTOR[OpenTelemetry Collector]
        RECEIVERS[接收器]
        PROCESSORS[处理器]
        EXPORTERS[导出器]
    end

    subgraph "后端系统"
        JAEGER[Jaeger]
        PROMETHEUS[Prometheus]
        ELASTICSEARCH[Elasticsearch]
    end

    APP --> API
    API --> SDK
    SDK --> AUTO_INSTRUMENTATION
    AUTO_INSTRUMENTATION --> OTEL_COLLECTOR
    SDK --> OTEL_COLLECTOR

    OTEL_COLLECTOR --> RECEIVERS
    RECEIVERS --> PROCESSORS
    PROCESSORS --> EXPORTERS

    EXPORTERS --> JAEGER
    EXPORTERS --> PROMETHEUS
    EXPORTERS --> ELASTICSEARCH
```

![OpenTelemetry 架构](78955b3c0bb0fb625b4ce4532c0a5fe1.svg)
{width=1920 height=4385}

### 核心特性

- 标准化：统一 API 和数据格式
- 多语言支持：覆盖主流开发语言
- 厂商中立：不绑定特定供应商
- 可扩展性：插件化架构

### 数据模型

OpenTelemetry 支持标准化 Trace 和 Metrics 数据模型。

#### Traces 数据模型

```yaml
trace:
  trace_id: "abc123..."
  spans:
    - span_id: "def456"
      parent_span_id: "ghi789"
      name: "operation-name"
      start_time: 1234567890
      end_time: 1234567900
      attributes:
        http.method: "GET"
        http.url: "/api/users"
      events:
        - name: "operation-started"
          timestamp: 1234567891
```

#### Metrics 数据模型

```yaml
metrics:
  - name: "http_requests_total"
    type: "counter"
    data_points:
      - attributes:
          method: "GET"
          status: "200"
        value: 42
        timestamp: 1234567890
```

## 应用集成

链路追踪支持多语言应用集成，以下为主流语言示例。

### Java 应用集成

```java
// Jaeger Java 客户端
@Configuration
public class JaegerConfig {
    @Bean
    public Tracer tracer() {
        return Configuration.fromEnv("service-name")
                .withSampler(Samplers.newConstSampler(true))
                .withReporter(ReporterConfiguration.fromEnv()
                        .withSender(SenderConfiguration.fromEnv()
                                .withAgentHost("jaeger-agent")
                                .withAgentPort(14268)))
                .getTracer();
    }
}

// OpenTelemetry Java
public class OtelConfig {
    public static Tracer getTracer() {
        return GlobalOpenTelemetry.getTracer("service-name");
    }
}
```

### Go 应用集成

```go
// Jaeger Go 客户端
import "github.com/uber/jaeger-client-go/config"

func initTracer(service string) (opentracing.Tracer, io.Closer) {
    cfg := &config.Configuration{
        ServiceName: service,
        Sampler: &config.SamplerConfig{
            Type:  "const",
            Param: 1,
        },
        Reporter: &config.ReporterConfig{
            LocalAgentHostPort: "jaeger-agent:14268",
        },
    }
    return cfg.NewTracer()
}

// OpenTelemetry Go
import "go.opentelemetry.io/otel/trace"

func initTracer() *trace.TracerProvider {
    return trace.NewTracerProvider(
        trace.WithBatcher(exporter),
        trace.WithResource(resource.NewWithAttributes(
            semconv.ServiceNameKey.String("service-name"),
        )),
    )
}
```

### Python 应用集成

```python
# Jaeger Python
from jaeger_client import Config

def init_tracer(service_name):
    config = Config(
        config={
            'sampler': {'type': 'const', 'param': 1},
            'local_agent': {
                'reporting_host': 'jaeger-agent',
                'reporting_port': 14268,
            },
        },
        service_name=service_name,
    )
    return config.new_tracer()

# OpenTelemetry Python
from opentelemetry import trace
from opentelemetry.exporter.jaeger import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

def init_tracer():
    tracer_provider = TracerProvider()
    jaeger_exporter = JaegerExporter(
        agent_host_name="jaeger-agent",
        agent_port=14268,
    )
    tracer_provider.add_span_processor(
        BatchSpanProcessor(jaeger_exporter)
    )
    trace.set_tracer_provider(tracer_provider)
    return trace.get_tracer(__name__)
```

## 自动插桩

自动插桩可显著降低链路追踪集成成本，以下为主流语言自动插桩配置示例。

### Java 自动插桩

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: java-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: my-java-app:latest
        env:
        - name: OTEL_TRACES_EXPORTER
          value: "jaeger"
        - name: OTEL_EXPORTER_JAEGER_ENDPOINT
          value: "http://jaeger-collector:14268/api/traces"
        - name: OTEL_SERVICE_NAME
          value: "java-app"
        - name: JAVA_TOOL_OPTIONS
          value: "-javaagent:/opt/opentelemetry-javaagent.jar"
        volumeMounts:
        - name: opentelemetry-agent
          mountPath: /opt/opentelemetry-javaagent.jar
      volumes:
      - name: opentelemetry-agent
        configMap:
          name: opentelemetry-javaagent
```

### .NET 自动插桩

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dotnet-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: my-dotnet-app:latest
        env:
        - name: OTEL_TRACES_EXPORTER
          value: "jaeger"
        - name: OTEL_EXPORTER_JAEGER_ENDPOINT
          value: "http://jaeger-collector:14268/api/traces"
        - name: OTEL_SERVICE_NAME
          value: "dotnet-app"
        - name: OTEL_DOTNET_AUTO_HOME
          value: "/opt/opentelemetry-dotnet-auto"
        - name: DOTNET_STARTUP_HOOKS
          value: "/opt/opentelemetry-dotnet-auto/OpenTelemetry.AutoInstrumentation.StartupHook.dll"
        volumeMounts:
        - name: opentelemetry-agent
          mountPath: /opt/opentelemetry-dotnet-auto
      volumes:
      - name: opentelemetry-agent
        configMap:
          name: opentelemetry-dotnet-auto
```

## 语义约定

OpenTelemetry 采用统一语义约定，便于跨系统分析。

### HTTP 语义约定

```yaml
http.method: "GET"
http.url: "https://api.example.com/users/123"
http.scheme: "https"
http.host: "api.example.com"
http.target: "/users/123"
http.status_code: 200
http.flavor: "1.1"
```

### 数据库语义约定

```yaml
db.system: "postgresql"
db.connection_string: "postgresql://user:pass@host:5432/db"
db.user: "user"
db.name: "myapp"
db.statement: "SELECT * FROM users WHERE id = ?"
db.operation: "SELECT"
```

### RPC 语义约定

```yaml
rpc.system: "grpc"
rpc.service: "UserService"
rpc.method: "GetUser"
rpc.grpc.status_code: 0
```

## 性能优化

链路追踪系统需合理配置采样、收集器和存储，保障性能与成本。

### 采样优化

```yaml
sampler:
  rules:
    - service: "critical-service"
      sampler: "const"
      param: 1
    - service: "*"
      sampler: "probabilistic"
      param: 0.01  # 1% 采样率
```

### 收集器优化

```yaml
processors:
  batch:
    send_batch_size: 1024
    timeout: 1s
  memory_limiter:
    check_interval: 5s
    limit_mib: 512
  tail_sampling:
    policies:
      - name: error-policy
        type: status_code
        status_code: {status_codes: [ERROR]}
      - name: latency-policy
        type: latency
        latency: {threshold_ms: 5000}
```

### 存储优化

```yaml
storage:
  type: elasticsearch
  options:
    es:
      bulk:
        size: 5000000
        workers: 1
        flush-interval: 200ms
```

## 故障排除

链路追踪系统常见故障及排查方法如下。

### 常见问题

- Span 数据丢失：检查 Agent 和 Collector 日志

  ```bash
  kubectl logs -n observability jaeger-agent-pod
  kubectl logs -n observability jaeger-collector-pod
  ```

- 采样配置不生效：检查应用配置与环境变量

  ```bash
  kubectl describe deployment app-name
  kubectl exec -it pod-name -- env | grep OTEL
  ```

- UI 无法显示链路：检查 Query 服务与存储连接

  ```bash
  kubectl get pods -n observability -l app=jaeger
  kubectl logs -n observability jaeger-query-pod
  ```

### 调试技巧

- 启用调试日志

  ```yaml
  spec:
    containers:
    - name: jaeger-collector
      env:
      - name: SPAN_STORAGE_TYPE
        value: "memory"
  ```

- 使用测试 Span

  ```bash
  curl -X POST http://otel-collector:4318/v1/traces \
    -H "Content-Type: application/json" \
    -d @test-span.json
  ```

## 总结

链路追踪是理解分布式系统行为的关键技术，通过 Jaeger 和 OpenTelemetry，可以获得完整的请求链路视图，帮助快速定位性能瓶颈和错误源。在 Kubernetes 环境中实施链路追踪需关注采样策略、资源开销和集成复杂度，建议从关键业务路径开始，逐步扩展到全系统。OpenTelemetry 作为新兴标准，提供了更好的可移植性和生态集成。

## 参考文献

1. [Jaeger 官方文档 - jaegertracing.io](https://www.jaegertracing.io/docs/)
2. [OpenTelemetry 官方文档 - opentelemetry.io](https://opentelemetry.io/)
3. [Kubernetes 官方文档 - kubernetes.io](https://kubernetes.io/docs/)
4. [Prometheus 官方文档 - prometheus.io](https://prometheus.io/docs/introduction/overview/)
5. [CNCF 项目列表 - cncf.io](https://www.cncf.io/projects/)
