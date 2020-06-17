# Pod hook

Pod hook（钩子）是由 Kubernetes 管理的 kubelet 发起的，当容器中的进程启动前或者容器中的进程终止之前运行，这是包含在容器的生命周期之中。可以同时为 Pod 中的所有容器都配置 hook。

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

在容器创建之后，容器的 Entrypoint 执行之前，这时候 Pod 已经被调度到某台 node 上，被某个 kubelet 管理了，这时候 kubelet 会调用 postStart 操作，该操作跟容器的启动命令是在同步执行的，也就是说在 postStart 操作执行完成之前，kubelet 会锁住容器，不让应用程序的进程启动，只有在 postStart 操作完成之后容器的状态才会被设置成为 RUNNING。

如果 postStart 或者 preStop hook 失败，将会终止容器。

## 调试 hook

Hook 调用的日志没有暴露给 Pod 的 event，所以只能通过 `describe` 命令来获取，如果有错误将可以看到 `FailedPostStartHook` 或 `FailedPreStopHook` 这样的 event。

## 参考

- [Attach Handlers to Container Lifecycle Events](https://kubernetes.io/docs/tasks/configure-pod-container/attach-handler-lifecycle-event/)
- [Container Lifecycle Hooks](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/)
