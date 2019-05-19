---
title: "Kubernetes ConfigMap热更新测试"
date: 2017-11-08T18:58:06+08:00
draft: false
categories: "kubernetes"
subtitle: "探究ConfigMap的创建和更新流程"
description: "测试更新ConfigMap后Pod中的引用的该ConfigMap的Env和Volume中的数据是否同步更新"
tags: ["configmap","kubernetes"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20150503002.jpg", desc: "三河古镇@合肥 May 3,2015"}]
---

# ConfigMap热更新测试

ConfigMap是用来存储配置文件的kubernetes资源对象，所有的配置内容都存储在etcd中，下文主要是探究 ConfigMap 的创建和更新流程，以及对 ConfigMap 更新后容器内挂载的内容是否同步更新的测试。

## 测试示例

假设我们在 `default` namespace 下有一个名为 `nginx-config` 的 ConfigMap，可以使用 `kubectl`命令来获取：

```bash
$ kubectl get configmap nginx-config
NAME           DATA      AGE
nginx-config   1         99d
```

获取该ConfigMap的内容。

```bash
kubectl get configmap nginx-config -o yaml
```

```bash
apiVersion: v1
data:
  nginx.conf: |-
    worker_processes 1;

    events { worker_connections 1024; }

    http {
        sendfile on;

        server {
            listen 80;

            # a test endpoint that returns http 200s
            location / {
                proxy_pass http://httpstat.us/200;
                proxy_set_header  X-Real-IP  $remote_addr;
            }
        }

        server {

            listen 80;
            server_name api.hello.world;

            location / {
                proxy_pass http://l5d.default.svc.cluster.local;
                proxy_set_header Host $host;
                proxy_set_header Connection "";
                proxy_http_version 1.1;

                more_clear_input_headers 'l5d-ctx-*' 'l5d-dtab' 'l5d-sample';
            }
        }

        server {

            listen 80;
            server_name www.hello.world;

            location / {


                # allow 'employees' to perform dtab overrides
                if ($cookie_special_employee_cookie != "letmein") {
                  more_clear_input_headers 'l5d-ctx-*' 'l5d-dtab' 'l5d-sample';
                }

                # add a dtab override to get people to our beta, world-v2
                set $xheader "";

                if ($cookie_special_employee_cookie ~* "dogfood") {
                  set $xheader "/host/world => /srv/world-v2;";
                }

                proxy_set_header 'l5d-dtab' $xheader;


                proxy_pass http://l5d.default.svc.cluster.local;
                proxy_set_header Host $host;
                proxy_set_header Connection "";
                proxy_http_version 1.1;
            }
        }
    }
kind: ConfigMap
metadata:
  creationTimestamp: 2017-08-01T06:53:17Z
  name: nginx-config
  namespace: default
  resourceVersion: "14925806"
  selfLink: /api/v1/namespaces/default/configmaps/nginx-config
  uid: 18d70527-7686-11e7-bfbd-8af1e3a7c5bd
```

ConfigMap中的内容是存储到etcd中的，然后查询etcd：

```bash
ETCDCTL_API=3 etcdctl get /registry/configmaps/default/nginx-config
/registry/configmaps/default/nginx-config
```

注意使用 v3 版本的 etcdctl API，下面是输出结果：

```bash
k8s

v1	ConfigMap�

T

nginx-configdefault"*$18d70527-7686-11e7-bfbd-8af1e3a7c5bd28B
                                                            �ʀ����xz�


nginx.conf�
           worker_processes 1;

events { worker_connections 1024; }

http {
    sendfile on;

    server {
        listen 80;

        # a test endpoint that returns http 200s
        location / {
            proxy_pass http://httpstat.us/200;
            proxy_set_header  X-Real-IP  $remote_addr;
        }
    }

    server {

        listen 80;
        server_name api.hello.world;

        location / {
            proxy_pass http://l5d.default.svc.cluster.local;
            proxy_set_header Host $host;
            proxy_set_header Connection "";
            proxy_http_version 1.1;

            more_clear_input_headers 'l5d-ctx-*' 'l5d-dtab' 'l5d-sample';
        }
    }

    server {

        listen 80;
        server_name www.hello.world;

        location / {


            # allow 'employees' to perform dtab overrides
            if ($cookie_special_employee_cookie != "letmein") {
              more_clear_input_headers 'l5d-ctx-*' 'l5d-dtab' 'l5d-sample';
            }

            # add a dtab override to get people to our beta, world-v2
            set $xheader "";

            if ($cookie_special_employee_cookie ~* "dogfood") {
              set $xheader "/host/world => /srv/world-v2;";
            }

            proxy_set_header 'l5d-dtab' $xheader;


            proxy_pass http://l5d.default.svc.cluster.local;
            proxy_set_header Host $host;
            proxy_set_header Connection "";
            proxy_http_version 1.1;
        }
    }
}"
```

输出中在 `nginx.conf` 配置文件的基础中增加了文件头内容，是kubernetes增加的。 

## 代码

ConfigMap 结构体的定义：

```go
// ConfigMap holds configuration data for pods to consume.
type ConfigMap struct {
	metav1.TypeMeta `json:",inline"`
	// Standard object's metadata.
	// More info: http://releases.k8s.io/HEAD/docs/devel/api-conventions.md#metadata
	// +optional
	metav1.ObjectMeta `json:"metadata,omitempty" protobuf:"bytes,1,opt,name=metadata"`

	// Data contains the configuration data.
	// Each key must be a valid DNS_SUBDOMAIN with an optional leading dot.
	// +optional
	Data map[string]string `json:"data,omitempty" protobuf:"bytes,2,rep,name=data"`
}
```

在 `staging/src/k8s.io/client-go/kubernetes/typed/core/v1/configmap.go` 中ConfigMap 的接口定义：

```go
// ConfigMapInterface has methods to work with ConfigMap resources.
type ConfigMapInterface interface {
	Create(*v1.ConfigMap) (*v1.ConfigMap, error)
	Update(*v1.ConfigMap) (*v1.ConfigMap, error)
	Delete(name string, options *meta_v1.DeleteOptions) error
	DeleteCollection(options *meta_v1.DeleteOptions, listOptions meta_v1.ListOptions) error
	Get(name string, options meta_v1.GetOptions) (*v1.ConfigMap, error)
	List(opts meta_v1.ListOptions) (*v1.ConfigMapList, error)
	Watch(opts meta_v1.ListOptions) (watch.Interface, error)
	Patch(name string, pt types.PatchType, data []byte, subresources ...string) (result *v1.ConfigMap, err error)
	ConfigMapExpansion
}
```

在 `staging/src/k8s.io/client-go/kubernetes/typed/core/v1/configmap.go` 中创建 ConfigMap 的方法如下:

```go
// Create takes the representation of a configMap and creates it.  Returns the server's representation of the configMap, and an error, if there is any.
func (c *configMaps) Create(configMap *v1.ConfigMap) (result *v1.ConfigMap, err error) {
	result = &v1.ConfigMap{}
	err = c.client.Post().
		Namespace(c.ns).
		Resource("configmaps").
		Body(configMap).
		Do().
		Into(result)
	return
}
```

通过 RESTful 请求在 etcd 中存储 ConfigMap 的配置，该方法中设置了资源对象的 namespace 和 HTTP 请求中的 body，执行后将请求结果保存到 result 中返回给调用者。

**注意 Body 的结构**

```java
// Body makes the request use obj as the body. Optional.
// If obj is a string, try to read a file of that name.
// If obj is a []byte, send it directly.
// If obj is an io.Reader, use it directly.
// If obj is a runtime.Object, marshal it correctly, and set Content-Type header.
// If obj is a runtime.Object and nil, do nothing.
// Otherwise, set an error.
```

创建 ConfigMap RESTful 请求中的的 Body 中包含 `ObjectMeta` 和 `namespace`。

HTTP 请求中的结构体：

```go
// Request allows for building up a request to a server in a chained fashion.
// Any errors are stored until the end of your call, so you only have to
// check once.
type Request struct {
	// required
	client HTTPClient
	verb   string

	baseURL     *url.URL
	content     ContentConfig
	serializers Serializers

	// generic components accessible via method setters
	pathPrefix string
	subpath    string
	params     url.Values
	headers    http.Header

	// structural elements of the request that are part of the Kubernetes API conventions
	namespace    string
	namespaceSet bool
	resource     string
	resourceName string
	subresource  string
	timeout      time.Duration

	// output
	err  error
	body io.Reader

	// This is only used for per-request timeouts, deadlines, and cancellations.
	ctx context.Context

	backoffMgr BackoffManager
	throttle   flowcontrol.RateLimiter
}
```

## 测试

分别测试使用 ConfigMap 挂载 Env 和 Volume 的情况。

### 更新使用ConfigMap挂载的Env

使用下面的配置创建 nginx 容器测试更新 ConfigMap 后容器内的环境变量是否也跟着更新。

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: my-nginx
spec:
  replicas: 1
  template:
    metadata:
      labels:
        run: my-nginx
    spec:
      containers:
      - name: my-nginx
        image: sz-pg-oam-docker-hub-001.tendcloud.com/library/nginx:1.9
        ports:
        - containerPort: 80
        envFrom:
        - configMapRef:
            name: env-config
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: env-config
  namespace: default
data:
  log_level: INFO
```

获取环境变量的值

```bash
$ kubectl exec `kubectl get pods -l run=my-nginx  -o=name|cut -d "/" -f2` env|grep log_level
log_level=INFO
```

修改 ConfigMap

```bash
$ kubectl edit configmap env-config
```

修改 `log_level` 的值为 `DEBUG`。

再次查看环境变量的值。

```bash
$ kubectl exec `kubectl get pods -l run=my-nginx  -o=name|cut -d "/" -f2` env|grep log_level
log_level=INFO
```

实践证明修改 ConfigMap 无法更新容器中已注入的环境变量信息。

### 更新使用ConfigMap挂载的Volume

使用下面的配置创建 nginx 容器测试更新 ConfigMap 后容器内挂载的文件是否也跟着更新。

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: my-nginx
spec:
  replicas: 1
  template:
    metadata:
      labels:
        run: my-nginx
    spec:
      containers:
      - name: my-nginx
        image: sz-pg-oam-docker-hub-001.tendcloud.com/library/nginx:1.9
        ports:
        - containerPort: 80
      volumeMounts:
      - name: config-volume
        mountPath: /etc/config
      volumes:
        - name: config-volume
          configMap:
            name: special-config
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: special-config
  namespace: default
data:
  log_level: INFO
```

```bash
$ kubectl exec `kubectl get pods -l run=my-nginx  -o=name|cut -d "/" -f2` cat /tmp/log_level
INFO
```

修改 ConfigMap

```bash
$ kubectl edit configmap special-config
```

修改 `log_level` 的值为 `DEBUG`。

等待大概10秒钟时间，再次查看环境变量的值。

```bash
$ kubectl exec `kubectl get pods -l run=my-nginx  -o=name|cut -d "/" -f2` cat /tmp/log_level
DEBUG
```

我们可以看到使用 ConfigMap 方式挂载的 Volume 的文件中的内容已经变成了 `DEBUG`。

## 总结

更新 ConfigMap 后：

- 使用该 ConfigMap 挂载的 Env **不会**同步更新
- 使用该 ConfigMap 挂载的 Volume 中的数据需要一段时间（实测大概10秒）才能同步更新

ENV 是在容器启动的时候注入的，启动之后 kubernetes 就不会再改变环境变量的值，且同一个 namespace 中的 pod 的环境变量是不断累加的，参考 [Kubernetes中的服务发现与docker容器间的环境变量传递源码探究](https://jimmysong.io/posts/exploring-kubernetes-env-with-docker/)。为了更新容器中使用 ConfigMap 挂载的配置，可以通过滚动更新 pod 的方式来强制重新挂载 ConfigMap，也可以在更新了 ConfigMap 后，先将副本数设置为 0，然后再扩容。

## 参考

- [Kubernetes 1.7 security in practice](https://acotten.com/post/kube17-security)
- [ConfigMap | kubernetes handbook - jimmysong.io](https://jimmysong.io/kubernetes-handbook/concepts/configmap.html)
- [创建高可用ectd集群 | Kubernetes handbook - jimmysong.io](https://jimmysong.io/kubernetes-handbook/practice/etcd-cluster-installation.html)
- [Kubernetes中的服务发现与docker容器间的环境变量传递源码探究](https://jimmysong.io/posts/exploring-kubernetes-env-with-docker/)