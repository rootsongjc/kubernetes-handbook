---
weight: 74
title: 配置 Pod 的 liveness 和 readiness 探针
date: '2022-05-21T00:00:00+08:00'
type: book
---

当你使用 Kubernetes 的时候，有没有遇到过 Pod 在启动后一会就挂掉然后又重新启动这样的恶性循环？你有没有想过 Kubernetes 是如何检测 pod 是否还存活？虽然容器已经启动，但是 Kubernetes 如何知道容器的进程是否准备好对外提供服务了呢？让我们通过 Kubernetes 官网的这篇文章 [Configure Liveness and Readiness Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/)，来一探究竟。

本文将展示如何配置容器的存活和可读性探针。

Kubelet 使用 liveness probe（存活探针）来确定何时重启容器。例如，当应用程序处于运行状态但无法做进一步操作，liveness 探针将捕获到 deadlock，重启处于该状态下的容器，使应用程序在存在 bug 的情况下依然能够继续运行下去（谁的程序还没几个 bug 呢）。

Kubelet 使用 readiness probe（就绪探针）来确定容器是否已经就绪可以接受流量。只有当 Pod 中的容器都处于就绪状态时 kubelet 才会认定该 Pod 处于就绪状态。该信号的作用是控制哪些 Pod 应该作为 service 的后端。如果 Pod 处于非就绪状态，那么它们将会被从 service 的 load balancer 中移除。

## 定义 liveness 命令

许多长时间运行的应用程序最终会转换到 broken 状态，除非重新启动，否则无法恢复。Kubernetes 提供了 liveness probe 来检测和补救这种情况。

在本次练习将基于 `gcr.io/google_containers/busybox` 镜像创建运行一个容器的 Pod。以下是 Pod 的配置文件 `exec-liveness.yaml`：

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    test: liveness
  name: liveness-exec
spec:
  containers:
  - name: liveness
    args:
    - /bin/sh
    - -c
    - touch /tmp/healthy; sleep 30; rm -rf /tmp/healthy; sleep 600
    image: gcr.io/google_containers/busybox
    livenessProbe:
      exec:
        command:
        - cat
        - /tmp/healthy
      initialDelaySeconds: 5
      periodSeconds: 5
```

该配置文件给 Pod 配置了一个容器。`periodSeconds` 规定 kubelet 要每隔 5 秒执行一次 liveness probe。 `initialDelaySeconds` 告诉 kubelet 在第一次执行 probe 之前要的等待 5 秒钟。探针检测命令是在容器中执行 `cat /tmp/healthy` 命令。如果命令执行成功，将返回 0，kubelet 就会认为该容器是活着的并且很健康。如果返回非 0 值，kubelet 就会杀掉这个容器并重启它。

容器启动时，执行该命令：

```bash
/bin/sh -c "touch /tmp/healthy; sleep 30; rm -rf /tmp/healthy; sleep 600"
```

在容器生命的最初 30 秒内有一个 `/tmp/healthy` 文件，在这 30 秒内 `cat /tmp/healthy` 命令会返回一个成功的返回码。30 秒后， `cat /tmp/healthy` 将返回失败的返回码。

创建 Pod：

```bash
kubectl create -f https://k8s.io/docs/tasks/configure-pod-container/exec-liveness.yaml
```

在 30 秒内，查看 Pod 的 event：

```
kubectl describe pod liveness-exec
```

结果显示没有失败的 liveness probe：

```bash
FirstSeen    LastSeen    Count   From            SubobjectPath           Type        Reason      Message
--------- --------    -----   ----            -------------           --------    ------      -------
24s       24s     1   {default-scheduler }                    Normal      Scheduled   Successfully assigned liveness-exec to worker0
23s       23s     1   {kubelet worker0}   spec.containers{liveness}   Normal      Pulling     pulling image "gcr.io/google_containers/busybox"
23s       23s     1   {kubelet worker0}   spec.containers{liveness}   Normal      Pulled      Successfully pulled image "gcr.io/google_containers/busybox"
23s       23s     1   {kubelet worker0}   spec.containers{liveness}   Normal      Created     Created container with docker id 86849c15382e; Security:[seccomp=unconfined]
23s       23s     1   {kubelet worker0}   spec.containers{liveness}   Normal      Started     Started container with docker id 86849c15382e
```

启动 35 秒后，再次查看 pod 的 event：

```bash
kubectl describe pod liveness-exec
```

在最下面有一条信息显示 liveness probe 失败，容器被删掉并重新创建。

```bash
FirstSeen LastSeen    Count   From            SubobjectPath           Type        Reason      Message
--------- --------    -----   ----            -------------           --------    ------      -------
37s       37s     1   {default-scheduler }                    Normal      Scheduled   Successfully assigned liveness-exec to worker0
36s       36s     1   {kubelet worker0}   spec.containers{liveness}   Normal      Pulling     pulling image "gcr.io/google_containers/busybox"
36s       36s     1   {kubelet worker0}   spec.containers{liveness}   Normal      Pulled      Successfully pulled image "gcr.io/google_containers/busybox"
36s       36s     1   {kubelet worker0}   spec.containers{liveness}   Normal      Created     Created container with docker id 86849c15382e; Security:[seccomp=unconfined]
36s       36s     1   {kubelet worker0}   spec.containers{liveness}   Normal      Started     Started container with docker id 86849c15382e
2s        2s      1   {kubelet worker0}   spec.containers{liveness}   Warning     Unhealthy   Liveness probe failed: cat: can't open '/tmp/healthy': No such file or directory
```

再等 30 秒，确认容器已经重启：

```bash
kubectl get pod liveness-exec
```

从输出结果来 `RESTARTS` 值加 1 了。

```bash
NAME            READY     STATUS    RESTARTS   AGE
liveness-exec   1/1       Running   1          1m
```

## 定义一个 liveness HTTP 请求

我们还可以使用 HTTP GET 请求作为 liveness probe。下面是一个基于 `gcr.io/google_containers/liveness` 镜像运行了一个容器的 Pod 的例子 `http-liveness.yaml`：

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    test: liveness
  name: liveness-http
spec:
  containers:
  - name: liveness
    args:
    - /server
    image: gcr.io/google_containers/liveness
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8080
        httpHeaders:
          - name: X-Custom-Header
            value: Awesome
      initialDelaySeconds: 3
      periodSeconds: 3
```

该配置文件只定义了一个容器，`livenessProbe` 指定 kubelet 需要每隔 3 秒执行一次 liveness probe。`initialDelaySeconds` 指定 kubelet 在该执行第一次探测之前需要等待 3 秒钟。该探针将向容器中的 server 的 8080 端口发送一个 HTTP GET 请求。如果 server 的 `/healthz` 路径的 handler 返回一个成功的返回码，kubelet 就会认定该容器是活着的并且很健康。如果返回失败的返回码，kubelet 将杀掉该容器并重启它。

任何大于 200 小于 400 的返回码都会认定是成功的返回码。其他返回码都会被认为是失败的返回码。

最开始的 10 秒该容器是活着的， `/healthz` handler 返回 200 的状态码。这之后将返回 500 的返回码。

```go
http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
    duration := time.Now().Sub(started)
    if duration.Seconds() > 10 {
        w.WriteHeader(500)
        w.Write([]byte(fmt.Sprintf("error: %v", duration.Seconds())))
    } else {
        w.WriteHeader(200)
        w.Write([]byte("ok"))
    }
})
```

容器启动 3 秒后，kubelet 开始执行健康检查。第一次健康监测会成功，但是 10 秒后，健康检查将失败，kubelet 将杀掉和重启容器。

创建一个 Pod 来测试一下 HTTP liveness 检测：

```bash
kubectl create -f https://k8s.io/docs/tasks/configure-pod-container/http-liveness.yaml
```

After 10 seconds, view Pod events to verify that liveness probes have failed and the Container has been restarted:

10 秒后，查看 Pod 的 event，确认 liveness probe 失败并重启了容器。

```bash
kubectl describe pod liveness-http
```

## 定义 TCP liveness 探针

第三种 liveness probe 使用 TCP Socket。使用此配置，kubelet 将尝试在指定端口上打开容器的套接字。如果可以建立连接，容器被认为是健康的，如果不能就认为是失败的。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: goproxy
  labels:
    app: goproxy
spec:
  containers:
  - name: goproxy
    image: gcr.io/google_containers/goproxy:0.1
    ports:
    - containerPort: 8080
    readinessProbe:
      tcpSocket:
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 10
    livenessProbe:
      tcpSocket:
        port: 8080
      initialDelaySeconds: 15
      periodSeconds: 20
```

如您所见，TCP 检查的配置与 HTTP 检查非常相似。此示例同时使用了 readiness 和 liveness probe。容器启动后 5 秒钟，kubelet 将发送第一个 readiness probe。这将尝试连接到端口 8080 上的 goproxy 容器。如果探测成功，则该 pod 将被标记为就绪。Kubelet 将每隔 10 秒钟执行一次该检查。

除了 readiness probe 之外，该配置还包括 liveness probe。容器启动 15 秒后，kubelet 将运行第一个 liveness probe。就像 readiness probe 一样，这将尝试连接到 goproxy 容器上的 8080 端口。如果 liveness probe 失败，容器将重新启动。

## 使用命名的端口

可以使用命名的 ContainerPort 作为 HTTP 或 TCP liveness 检查：

```yaml
ports:
- name: liveness-port
  containerPort: 8080
  hostPort: 8080

livenessProbe:
  httpGet:
  path: /healthz
  port: liveness-port
```

## 定义 readiness 探针

有时，应用程序暂时无法对外部流量提供服务。例如，应用程序可能需要在启动期间加载大量数据或配置文件。在这种情况下，你不想杀死应用程序，但你也不想发送请求。Kubernetes 提供了 readiness probe 来检测和减轻这些情况。Pod 中的容器可以报告自己还没有准备，不能处理 Kubernetes 服务发送过来的流量。

Readiness probe 的配置跟 liveness probe 很像。唯一的不同是使用 `readinessProbe` 而不是 `livenessProbe`。

```yaml
readinessProbe:
  exec:
    command:
    - cat
    - /tmp/healthy
  initialDelaySeconds: 5
  periodSeconds: 5
```

Readiness probe 的 HTTP 和 TCP 的探测器配置跟 liveness probe 一样。

Readiness 和 livenss probe 可以并行用于同一容器。使用两者可以确保流量无法到达未准备好的容器，并且容器在失败时重新启动。

## 配置 Probe

Probe 中有很多精确和详细的配置，通过它们你能准确的控制 liveness 和 readiness 检查：

- `initialDelaySeconds`：容器启动后第一次执行探测是需要等待多少秒。
- `periodSeconds`：执行探测的频率。默认是 10 秒，最小 1 秒。
- `timeoutSeconds`：探测超时时间。默认 1 秒，最小 1 秒。
- `successThreshold`：探测失败后，最少连续探测成功多少次才被认定为成功。默认是 1。对于 liveness 必须是 1。最小值是 1。
- `failureThreshold`：探测成功后，最少连续探测失败多少次才被认定为失败。默认是 3。最小值是 1。

HTTP probe 中可以给 `httpGet` 设置其他配置项：

- `host`：连接的主机名，默认连接到 pod 的 IP。你可能想在 http header 中设置 "Host" 而不是使用 IP。
- `scheme`：连接使用的 schema，默认 HTTP。
- `path`: 访问的 HTTP server 的 path。
- `httpHeaders`：自定义请求的 header。HTTP 运行重复的 header。
- `port`：访问的容器的端口名字或者端口号。端口号必须介于 1 和 65535 之间。

对于 HTTP 探测器，kubelet 向指定的路径和端口发送 HTTP 请求以执行检查。Kubelet 将 probe 发送到容器的 IP 地址，除非地址被 `httpGet` 中的可选 `host` 字段覆盖。在大多数情况下，你不想设置主机字段。有一种情况下你可以设置它。假设容器在 127.0.0.1 上侦听，并且 Pod 的 `hostNetwork` 字段为 true。然后，在 `httpGet` 下的 `host` 应该设置为 127.0.0.1。如果你的 pod 依赖于虚拟主机，这可能是更常见的情况，你不应该是用 `host`，而是应该在 `httpHeaders` 中设置 `Host` 头。

## 参考

- [Container Probes - kubernetes.io](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#container-probes)
