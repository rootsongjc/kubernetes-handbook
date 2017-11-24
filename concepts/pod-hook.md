# Pod hook

Pod hook（钩子）是由Kubernetes管理的kubelet发起的，当容器中的进程启动前或者容器中的进程终止之前运行，这是包含在容器的生命周期之中。可以同时为Pod中的所有容器都配置hook。

Hook的类型包括两种：

- exec：执行一段命令
- HTTP：发送HTTP请求。

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
          command: ["/bin/sh", "-c", "echo Hello from the postStart handler > /usr/share/message"]
      preStop:
        exec:
          command: ["/usr/sbin/nginx","-s","quit"]
```

在容器创建之后，容器的Entrypoint执行之前，这时候Pod已经被调度到某台node上，被某个kubelet管理了，这时候kubelet会调用postStart操作，该操作跟容器的启动命令是在异步执行的，也就是说在postStart操作执行完成之前，kubelet会锁住容器，不让应用程序的进程启动，只有在 postStart操作完成之后容器的状态才会被设置成为RUNNING。

如果postStart或者preStop hook失败，将会终止容器。

## 调试hook

Hook调用的日志没有暴露个给Pod的event，所以只能通过`describe`命令来获取，如果有错误将可以看到`FailedPostStartHook`或`FailedPreStopHook`这样的event。

## 参考

- [Attach Handlers to Container Lifecycle Events](https://kubernetes.io/docs/tasks/configure-pod-container/attach-handler-lifecycle-event/)
- [Container Lifecycle Hooks](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/)