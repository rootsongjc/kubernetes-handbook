# 1. 在容器中获取 Pod 的IP

通过环境变量来实现，该环境变量直接引用 resource 的状态字段，示例如下：

```Yaml
apiVersion: v1
kind: ReplicationController
metadata:
  name: world-v2
spec:
  replicas: 3
  selector:
    app: world-v2
  template:
    metadata:
      labels:
        app: world-v2
    spec:
      containers:
      - name: service
        image: test
        env:
        - name: POD_IP
          valueFrom:
            fieldRef:
              fieldPath: status.podIP
        ports:
        - name: service
          containerPort: 777
```

容器中可以直接使用 `POD_IP` 环境变量获取容器的 IP。

# 2. 指定容器的启动参数

我们可以在 Pod 中为容器使用 command 为容器指定启动参数：

```Bash
command: ["/bin/bash","-c","bootstrap.sh"]
```

看似很简单，使用数组的方式定义，所有命令使用跟 Dockerfile 中的 CMD 配置是一样的，但是有一点不同的是，`bootsttap.sh` 必须具有可执行权限，否则容器启动时会出错。

## 3. 让Pod调用宿主机的docker能力

我们可以想象一下这样的场景，让 Pod 来调用宿主机的 docker 能力，只需要将宿主机的 `docker` 命令和 `docker.sock` 文件挂载到 Pod 里面即可，如下：

```Yaml
apiVersion: v1
kind: Pod
metadata:
 name: busybox-cloudbomb
spec:
 containers:
 - image: busybox
 command:
 - /bin/sh
 - "-c"
 - "while true; \
 do \
 docker run -d --name BOOM_$(cat /dev/urandom | tr -cd 'a-f0-9' | head -c 6) nginx ; \
 done"
 name: cloudbomb
 volumeMounts:
 - mountPath: /var/run/docker.sock
 name: docker-socket
 - mountPath: /bin/docker
 name: docker-binary
 volumes:
 - name: docker-socket
 hostPath:
 path: /var/run/docker.sock
 - name: docker-binary
 hostPath:
 path: /bin/docker
```

参考：[Architecture Patterns for Microservices in Kubernetes](https://www.infoq.com/presentations/patterns-microservices-kubernetes)

