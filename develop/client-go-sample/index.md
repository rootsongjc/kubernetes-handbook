---
weight: 106
title: client-go 示例
date: '2022-05-21T00:00:00+08:00'
type: book
keywords:
- client-go
- kubernetes
- deployment
- 镜像更新
- 客户端
- go
---

## Kubernetes 集群访问方式对比

访问 Kubernetes 集群有以下几种主要方式：

| 方式 | 特点 | 支持者 | 适用场景 |
|:-----|:-----|:-------|:---------|
| **Kubernetes Dashboard** | Web UI 操作，简单直观，可定制化程度低 | 官方支持 | 快速查看和简单操作 |
| **kubectl** | 命令行操作，功能最全，适合自动化和脚本化 | 官方支持 | 生产环境管理，CI/CD |
| **[client-go](https://github.com/kubernetes/client-go)** | Go 语言客户端库，功能强大，类型安全 | 官方支持 | 自定义应用开发 |
| **[client-python](https://github.com/kubernetes-client/python)** | Python 客户端库，易于集成 | 官方支持 | Python 生态应用 |
| **[Java client](https://github.com/kubernetes-client/java)** | Java 客户端库，企业级应用 | 官方支持 | Java 企业应用 |

## client-go 实战示例

下面基于 [client-go](https://github.com/kubernetes/client-go) 实现一个 Deployment 镜像更新工具，支持通过命令行参数指定 Deployment 名称、容器名和新镜像来进行滚动更新。

### 完整代码实现

[kubernetes-client-go-sample](https://github.com/rootsongjc/kubernetes-client-go-sample) 项目的 `main.go` 代码：

```go
package main

import (
  "context"
  "flag"
  "fmt"
  "os"
  "path/filepath"

  "k8s.io/apimachinery/pkg/api/errors"
  metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
  "k8s.io/client-go/kubernetes"
  "k8s.io/client-go/tools/clientcmd"
)

func main() {
  var kubeconfig *string
  if home := homeDir(); home != "" {
    kubeconfig = flag.String("kubeconfig", filepath.Join(home, ".kube", "config"), 
      "(可选) kubeconfig 文件的绝对路径")
  } else {
    kubeconfig = flag.String("kubeconfig", "", "kubeconfig 文件的绝对路径")
  }
  
  deploymentName := flag.String("deployment", "", "Deployment 名称")
  imageName := flag.String("image", "", "新镜像名称")
  appName := flag.String("app", "app", "应用容器名称")
  namespace := flag.String("namespace", "default", "命名空间")

  flag.Parse()
  
  // 参数验证
  if *deploymentName == "" {
    fmt.Println("错误：必须指定 Deployment 名称")
    os.Exit(1)
  }
  if *imageName == "" {
    fmt.Println("错误：必须指定新镜像名称")
    os.Exit(1)
  }

  // 构建 Kubernetes 配置
  config, err := clientcmd.BuildConfigFromFlags("", *kubeconfig)
  if err != nil {
    panic(fmt.Sprintf("构建配置失败: %v", err))
  }

  // 创建客户端
  clientset, err := kubernetes.NewForConfig(config)
  if err != nil {
    panic(fmt.Sprintf("创建客户端失败: %v", err))
  }

  ctx := context.TODO()
  
  // 获取 Deployment
  deployment, err := clientset.AppsV1().Deployments(*namespace).Get(ctx, *deploymentName, metav1.GetOptions{})
  if err != nil {
    if errors.IsNotFound(err) {
      fmt.Printf("错误：在命名空间 %s 中未找到 Deployment %s\n", *namespace, *deploymentName)
      os.Exit(1)
    }
    panic(fmt.Sprintf("获取 Deployment 失败: %v", err))
  }

  fmt.Printf("✓ 找到 Deployment: %s\n", deployment.GetName())
  
  // 更新容器镜像
  containers := &deployment.Spec.Template.Spec.Containers
  found := false
  
  for i := range *containers {
    c := *containers
    if c[i].Name == *appName {
      found = true
      fmt.Printf("原镜像: %s\n", c[i].Image)
      fmt.Printf("新镜像: %s\n", *imageName)
      c[i].Image = *imageName
      break
    }
  }
  
  if !found {
    fmt.Printf("错误：在 Deployment 中未找到名为 '%s' 的容器\n", *appName)
    os.Exit(1)
  }

  // 执行更新
  _, err = clientset.AppsV1().Deployments(*namespace).Update(ctx, deployment, metav1.UpdateOptions{})
  if err != nil {
    panic(fmt.Sprintf("更新 Deployment 失败: %v", err))
  }
  
  fmt.Println("✓ Deployment 更新成功")
}

func homeDir() string {
  if h := os.Getenv("HOME"); h != "" {
    return h
  }
  return os.Getenv("USERPROFILE") // Windows
}
```

### 关键改进说明

1. **API 版本更新**：使用 `AppsV1()` 替代已废弃的 `AppsV1beta1()`
2. **Context 支持**：添加 `context.TODO()` 以符合最新 API 规范
3. **错误处理优化**：提供更清晰的错误消息和退出码
4. **参数扩展**：支持指定命名空间参数
5. **代码结构优化**：提高可读性和维护性

## 编译和使用

### 编译步骤

```bash
# 克隆项目
git clone https://github.com/rootsongjc/kubernetes-client-go-sample
cd kubernetes-client-go-sample

# 初始化 Go 模块（如果需要）
go mod init kubernetes-client-go-sample
go mod tidy

# 编译
go build -o update-deployment main.go
```

### 使用方法

```bash
# 查看帮助
./update-deployment -h

# 基本用法
./update-deployment \
  -deployment myapp \
  -image myregistry/myapp:v2.0.0 \
  -app myapp \
  -namespace production
```

**参数说明：**

- `-deployment`：Deployment 名称（必需）
- `-image`：新镜像名称（必需）
- `-app`：容器名称（默认："app"）
- `-namespace`：命名空间（默认："default"）
- `-kubeconfig`：kubeconfig 文件路径（默认：`~/.kube/config`）

## 实际演示

### 场景 1：正常镜像更新

```bash
$ ./update-deployment -deployment nginx-app -image nginx:1.21 -app nginx
✓ 找到 Deployment: nginx-app
原镜像: nginx:1.20
新镜像: nginx:1.21
✓ Deployment 更新成功
```

### 场景 2：使用不存在的镜像

```bash
$ ./update-deployment -deployment nginx-app -image nginx:nonexistent -app nginx
✓ 找到 Deployment: nginx-app
原镜像: nginx:1.21
新镜像: nginx:nonexistent
✓ Deployment 更新成功
```

检查 Pod 状态：

```bash
$ kubectl get pods -l app=nginx-app
NAME                         READY   STATUS             RESTARTS   AGE
nginx-app-7d4b9c9d6f-abc12   1/1     Running            0          5m
nginx-app-7d4b9c9d6f-def34   1/1     Running            0          5m
nginx-app-8f5a1b2c3d-ghi56   0/1     ImagePullBackOff   0          1m
nginx-app-8f5a1b2c3d-jkl78   0/1     ImagePullBackOff   0          1m
```

### 场景 3：回滚到正常镜像

```bash
$ ./update-deployment -deployment nginx-app -image nginx:1.21 -app nginx
✓ 找到 Deployment: nginx-app
原镜像: nginx:nonexistent
新镜像: nginx:1.21
✓ Deployment 更新成功
```

## 监控和故障排查

### 使用 kubectl 监控更新过程

```bash
# 实时查看 Deployment 状态
kubectl rollout status deployment/nginx-app

# 查看 Deployment 详情
kubectl describe deployment nginx-app

# 查看 Pod 状态
kubectl get pods -l app=nginx-app -w
```

### 使用 Kubernetes Dashboard

通过 Kubernetes Dashboard 可以直观地查看：

- **Deployment 状态**：实时查看副本数量和更新进度
- **Pod 状态**：监控 Pod 的创建、运行、失败状态
- **事件日志**：查看详细的操作事件和错误信息
- **滚动更新历史**：跟踪版本变更历史

![Kubernetes Dashboard 监控界面](https://assets.jimmysong.io/images/book/kubernetes-handbook/develop/client-go-sample/kubernetes-client-go-sample-update.webp)
{width=1536 height=547}

## 最佳实践

1. **镜像标签管理**：使用具体版本标签而非 `latest`
2. **健康检查**：配置适当的 readiness 和 liveness 探针
3. **滚动更新策略**：根据业务需求调整 `maxUnavailable` 和 `maxSurge`
4. **回滚准备**：保留足够的历史版本用于快速回滚
5. **监控告警**：设置适当的监控和告警机制

通过这个示例，您可以了解如何使用 client-go 库进行 Kubernetes 资源的编程式管理，为构建更复杂的 Kubernetes 自动化工具奠定基础。
