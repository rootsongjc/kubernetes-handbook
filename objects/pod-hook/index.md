---
weight: 18
title: Pod Hook
date: '2022-05-21T00:00:00+08:00'
type: book
---

Pod Hook（钩子）是由 Kubernetes 管理的 kubelet 发起的，当容器中的进程启动前或者容器中的进程终止之前运行，这是包含在容器的生命周期之中。可以同时为 Pod 中的所有容器都配置 hook。

Hook 的类型包括两种：

- exec：执行一段命令
- HTTP：发送 HTTP 请求。

参考下面的配置：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: lifecycle-demo
spec:
  containers:
  - name: lifecycle-demo-container
    image: nginx
    lifecycle:
      postStart:
        exec:
          command: ["/bin/sh", "-c", "echo Hello from the postStart handler> /usr/share/message"]
      preStop:
        exec:
          command: ["/usr/sbin/nginx","-s","quit"]
```

Kubernetes 在容器创建后立即发送 postStart 事件。但是，不能保证在调用容器的入口点之前调用 postStart 处理程序。postStart 处理程序相对于容器的代码异步运行，但 Kubernetes 对容器的管理将被阻止，直到 postStart 处理程序完成。在 postStart 处理程序完成之前，容器的状态不会设置为 RUNNING。

PreStop 在容器终止之前被同步阻塞调用，常用于在容器结束前优雅的释放资源。

如果 postStart 或者 preStop hook 失败，将会终止容器。

## 调试 hook

Hook 调用的日志没有暴露给 Pod 的 event，所以只能通过 `describe` 命令来获取，如果有错误将可以看到 `FailedPostStartHook` 或 `FailedPreStopHook` 这样的 event。

## 参考

- [Attach Handlers to Container Lifecycle Events - kuberentes.io](https://kubernetes.io/docs/tasks/configure-pod-container/attach-handler-lifecycle-event/)
- [Container Lifecycle Hooks - kubernetes.io](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/)
