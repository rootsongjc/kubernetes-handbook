# 服务滚动升级

当有镜像发布新版本，新版本服务上线时如何实现服务的滚动和平滑升级？

如果你使用**ReplicationController**创建的pod可以使用`kubectl rollingupdate`命令滚动升级，如果使用的是**Deployment**创建的Pod可以直接修改yaml文件后执行`kubectl apply`即可。

Deployment已经内置了RollingUpdate strategy，因此不用再调用`kubectl rollingupdate`命令，升级的过程是先创建新版的pod将流量导入到新pod上后销毁原来的旧的pod。

Rolling Update适用于`Deployment`、`Replication Controller`，官方推荐使用Deployment而不再使用Replication Controller。

使用ReplicationController时的滚动升级请参考官网说明：https://kubernetes.io/docs/tasks/run-application/rolling-update-replication-controller/

## ReplicationController与Deployment的关系

ReplicationController和Deployment的RollingUpdate命令有些不同，但是实现的机制是一样的，关于这两个kind的关系我引用了[ReplicationController与Deployment的区别](https://segmentfault.com/a/1190000008232770)中的部分内容如下，详细区别请查看原文。

### ReplicationController

Replication Controller为Kubernetes的一个核心内容，应用托管到Kubernetes之后，需要保证应用能够持续的运行，Replication Controller就是这个保证的key，主要的功能如下：

- 确保pod数量：它会确保Kubernetes中有指定数量的Pod在运行。如果少于指定数量的pod，Replication Controller会创建新的，反之则会删除掉多余的以保证Pod数量不变。
- 确保pod健康：当pod不健康，运行出错或者无法提供服务时，Replication Controller也会杀死不健康的pod，重新创建新的。
- 弹性伸缩 ：在业务高峰或者低峰期的时候，可以通过Replication Controller动态的调整pod的数量来提高资源的利用率。同时，配置相应的监控功能（Hroizontal Pod Autoscaler），会定时自动从监控平台获取Replication Controller关联pod的整体资源使用情况，做到自动伸缩。
- 滚动升级：滚动升级为一种平滑的升级方式，通过逐步替换的策略，保证整体系统的稳定，在初始化升级的时候就可以及时发现和解决问题，避免问题不断扩大。

### Deployment

Deployment同样为Kubernetes的一个核心内容，主要职责同样是为了保证pod的数量和健康，90%的功能与Replication Controller完全一样，可以看做新一代的Replication Controller。但是，它又具备了Replication Controller之外的新特性：

- Replication Controller全部功能：Deployment继承了上面描述的Replication Controller全部功能。
- 事件和状态查看：可以查看Deployment的升级详细进度和状态。
- 回滚：当升级pod镜像或者相关参数的时候发现问题，可以使用回滚操作回滚到上一个稳定的版本或者指定的版本。
- 版本记录: 每一次对Deployment的操作，都能保存下来，给予后续可能的回滚使用。
- 暂停和启动：对于每一次升级，都能够随时暂停和启动。
- 多种升级方案：Recreate：删除所有已存在的pod,重新创建新的; RollingUpdate：滚动升级，逐步替换的策略，同时滚动升级时，支持更多的附加参数，例如设置最大不可用pod数量，最小升级间隔时间等等。

## 创建测试镜像

我们来创建一个特别简单的web服务，当你访问网页时，将输出一句版本信息。通过区分这句版本信息输出我们就可以断定升级是否完成。

所有配置和代码见[../manifests/test/rolling-update-test](https://github.com/rootsongjc/kubernetes-handbook/blob/master/manifests/test/rolling-update-test)目录。

**Web服务的代码main.go**

```go
package main

import (
	"fmt"
	"log"
	"net/http"
)

func sayhello(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "This is version 1.") //这个写入到w的是输出到客户端的
}

func main() {
	http.HandleFunc("/", sayhello) //设置访问的路由
	log.Println("This is version 1.")
	err := http.ListenAndServe(":9090", nil) //设置监听的端口
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
```

**创建Dockerfile**

```docker
FROM alpine:3.5
MAINTAINER Jimmy Song<rootsongjc@gmail.com>
ADD hellov2 /
ENTRYPOINT ["/hellov2"]
```

注意修改添加的文件的名称。

**创建Makefile**

修改镜像仓库的地址为你自己的私有镜像仓库地址。

修改`Makefile`中的`TAG`为新的版本号。

```makefile
all: build push clean
.PHONY: build push clean

TAG = v1

# Build for linux amd64
build:
	GOOS=linux GOARCH=amd64 go build -o hello${TAG} main.go
	docker build -t harbor-001.jimmysong.io/library/hello:${TAG} .

# Push to tenxcloud
push:
	docker push harbor-001.jimmysong.io/library/hello:${TAG}

# Clean 
clean:
	rm -f hello${TAG}
```

**编译**

```bash
make all
```

分别修改main.go中的输出语句、Dockerfile中的文件名称和Makefile中的TAG，创建两个版本的镜像。

## 测试

我们使用Deployment部署服务来测试。

配置文件`rolling-update-test.yaml`：

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
    name: rolling-update-test
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: rolling-update-test
    spec:
      containers:
      - name: rolling-update-test
        image: harbor-001.jimmysong.io/library/hello:v1
        ports:
        - containerPort: 9090
---
apiVersion: v1
kind: Service
metadata:
  name: rolling-update-test
  labels:
    app: rolling-update-test
spec:
  ports:
  - port: 9090
    protocol: TCP
    name: http
  selector:
    app: rolling-update-test
```

**部署service**

```bash
kubectl create -f rolling-update-test.yaml
```

**修改traefik ingress配置**

在`ingress.yaml`文件中增加新service的配置。

```yaml
  - host: rolling-update-test.traefik.io
    http:
      paths:
      - path: /
        backend:
          serviceName: rolling-update-test
          servicePort: 9090
```

修改本地的host配置，增加一条配置：

```
172.20.0.119 rolling-update-test.traefik.io
```

注意：172.20.0.119是我们之前使用keepalived创建的VIP。

打开浏览器访问 `http://rolling-update-test.traefik.io` 将会看到以下输出：

```
This is version 1.
```

**滚动升级**

只需要将`rolling-update-test.yaml`文件中的`image`改成新版本的镜像名，然后执行：

```bash
kubectl apply -f rolling-update-test.yaml
```

也可以参考[Kubernetes Deployment Concept](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)中的方法，直接设置新的镜像。

```
kubectl set image deployment/rolling-update-test rolling-update-test=harbor-001.jimmysong.io/library/hello:v2
```

或者使用`kubectl edit deployment/rolling-update-test`修改镜像名称后保存。

使用以下命令查看升级进度：

```
kubectl rollout status deployment/rolling-update-test
```

升级完成后在浏览器中刷新`http://rolling-update-test.traefik.io`将会看到以下输出：

```
This is version 2.
```

说明滚动升级成功。

## 使用ReplicationController创建的Pod如何RollingUpdate

以上讲解使用**Deployment**创建的Pod的RollingUpdate方式，那么如果使用传统的**ReplicationController**创建的Pod如何Update呢？

举个例子：

```bash
$ kubectl -n spark-cluster rolling-update zeppelin-controller --image harbor-001.jimmysong.io/library/zeppelin:0.7.1
Created zeppelin-controller-99be89dbbe5cd5b8d6feab8f57a04a8b
Scaling up zeppelin-controller-99be89dbbe5cd5b8d6feab8f57a04a8b from 0 to 1, scaling down zeppelin-controller from 1 to 0 (keep 1 pods available, don't exceed 2 pods)
Scaling zeppelin-controller-99be89dbbe5cd5b8d6feab8f57a04a8b up to 1
Scaling zeppelin-controller down to 0
Update succeeded. Deleting old controller: zeppelin-controller
Renaming zeppelin-controller-99be89dbbe5cd5b8d6feab8f57a04a8b to zeppelin-controller
replicationcontroller "zeppelin-controller" rolling updated
```

只需要指定新的镜像即可，当然你可以配置RollingUpdate的策略。

## 参考

- [Rolling update机制解析](http://dockone.io/article/328)
- [Running a Stateless Application Using a Deployment](https://kubernetes.io/docs/tasks/run-application/run-stateless-application-deployment/)
- [使用kubernetes的deployment进行RollingUpdate](https://segmentfault.com/a/1190000008232770)
