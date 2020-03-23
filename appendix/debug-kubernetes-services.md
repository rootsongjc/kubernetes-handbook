# Kubernetes service中的故障排查

- 查看某个资源的定义和用法

```bash
kubectl explain
```

- 查看Pod的状态

```bash
kubectl get pods
kubectl describe pods my-pod
```

- 监控Pod状态的变化

```bash
kubectl get pod -w
```

可以看到一个 namespace 中所有的 pod 的 phase 变化，请参考 [Pod 的生命周期](../concepts/pod-lifecycle.md)。

- 查看 Pod 的日志

```bash
kubectl logs my-pod
kubectl logs my-pod -c my-container
kubectl logs -f my-pod
kubectl logs -f my-pod -c my-container
```

`-f` 参数可以 follow 日志输出。

- 交互式 debug

```bash
kubectl exec my-pod -it /bin/bash
kubectl top pod POD_NAME --containers
```
