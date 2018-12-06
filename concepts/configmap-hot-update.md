# ConfigMap的热更新

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
ETCDCTL_API=3 etcdctl get /registry/configmaps/default/nginx-config -w json|python -m json.tool
```

注意使用 v3 版本的 etcdctl API，下面是输出结果：

```json
{
    "count": 1,
    "header": {
        "cluster_id": 12091028579527406772,
        "member_id": 16557816780141026208,
        "raft_term": 36,
        "revision": 29258723
    },
    "kvs": [
        {
            "create_revision": 14925806,
            "key": "L3JlZ2lzdHJ5L2NvbmZpZ21hcHMvZGVmYXVsdC9uZ2lueC1jb25maWc=",
            "mod_revision": 14925806,
            "value": "azhzAAoPCgJ2MRIJQ29uZmlnTWFwEqQMClQKDG5naW54LWNvbmZpZxIAGgdkZWZhdWx0IgAqJDE4ZDcwNTI3LTc2ODYtMTFlNy1iZmJkLThhZjFlM2E3YzViZDIAOABCCwjdyoDMBRC5ss54egASywsKCm5naW54LmNvbmYSvAt3b3JrZXJfcHJvY2Vzc2VzIDE7CgpldmVudHMgeyB3b3JrZXJfY29ubmVjdGlvbnMgMTAyNDsgfQoKaHR0cCB7CiAgICBzZW5kZmlsZSBvbjsKCiAgICBzZXJ2ZXIgewogICAgICAgIGxpc3RlbiA4MDsKCiAgICAgICAgIyBhIHRlc3QgZW5kcG9pbnQgdGhhdCByZXR1cm5zIGh0dHAgMjAwcwogICAgICAgIGxvY2F0aW9uIC8gewogICAgICAgICAgICBwcm94eV9wYXNzIGh0dHA6Ly9odHRwc3RhdC51cy8yMDA7CiAgICAgICAgICAgIHByb3h5X3NldF9oZWFkZXIgIFgtUmVhbC1JUCAgJHJlbW90ZV9hZGRyOwogICAgICAgIH0KICAgIH0KCiAgICBzZXJ2ZXIgewoKICAgICAgICBsaXN0ZW4gODA7CiAgICAgICAgc2VydmVyX25hbWUgYXBpLmhlbGxvLndvcmxkOwoKICAgICAgICBsb2NhdGlvbiAvIHsKICAgICAgICAgICAgcHJveHlfcGFzcyBodHRwOi8vbDVkLmRlZmF1bHQuc3ZjLmNsdXN0ZXIubG9jYWw7CiAgICAgICAgICAgIHByb3h5X3NldF9oZWFkZXIgSG9zdCAkaG9zdDsKICAgICAgICAgICAgcHJveHlfc2V0X2hlYWRlciBDb25uZWN0aW9uICIiOwogICAgICAgICAgICBwcm94eV9odHRwX3ZlcnNpb24gMS4xOwoKICAgICAgICAgICAgbW9yZV9jbGVhcl9pbnB1dF9oZWFkZXJzICdsNWQtY3R4LSonICdsNWQtZHRhYicgJ2w1ZC1zYW1wbGUnOwogICAgICAgIH0KICAgIH0KCiAgICBzZXJ2ZXIgewoKICAgICAgICBsaXN0ZW4gODA7CiAgICAgICAgc2VydmVyX25hbWUgd3d3LmhlbGxvLndvcmxkOwoKICAgICAgICBsb2NhdGlvbiAvIHsKCgogICAgICAgICAgICAjIGFsbG93ICdlbXBsb3llZXMnIHRvIHBlcmZvcm0gZHRhYiBvdmVycmlkZXMKICAgICAgICAgICAgaWYgKCRjb29raWVfc3BlY2lhbF9lbXBsb3llZV9jb29raWUgIT0gImxldG1laW4iKSB7CiAgICAgICAgICAgICAgbW9yZV9jbGVhcl9pbnB1dF9oZWFkZXJzICdsNWQtY3R4LSonICdsNWQtZHRhYicgJ2w1ZC1zYW1wbGUnOwogICAgICAgICAgICB9CgogICAgICAgICAgICAjIGFkZCBhIGR0YWIgb3ZlcnJpZGUgdG8gZ2V0IHBlb3BsZSB0byBvdXIgYmV0YSwgd29ybGQtdjIKICAgICAgICAgICAgc2V0ICR4aGVhZGVyICIiOwoKICAgICAgICAgICAgaWYgKCRjb29raWVfc3BlY2lhbF9lbXBsb3llZV9jb29raWUgfiogImRvZ2Zvb2QiKSB7CiAgICAgICAgICAgICAgc2V0ICR4aGVhZGVyICIvaG9zdC93b3JsZCA9PiAvc3J2L3dvcmxkLXYyOyI7CiAgICAgICAgICAgIH0KCiAgICAgICAgICAgIHByb3h5X3NldF9oZWFkZXIgJ2w1ZC1kdGFiJyAkeGhlYWRlcjsKCgogICAgICAgICAgICBwcm94eV9wYXNzIGh0dHA6Ly9sNWQuZGVmYXVsdC5zdmMuY2x1c3Rlci5sb2NhbDsKICAgICAgICAgICAgcHJveHlfc2V0X2hlYWRlciBIb3N0ICRob3N0OwogICAgICAgICAgICBwcm94eV9zZXRfaGVhZGVyIENvbm5lY3Rpb24gIiI7CiAgICAgICAgICAgIHByb3h5X2h0dHBfdmVyc2lvbiAxLjE7CiAgICAgICAgfQogICAgfQp9GgAiAA==",
            "version": 1
        }
    ]
}
```

其中的value就是 `nginx.conf` 配置文件的内容。

可以使用base64解码查看具体值，关于etcdctl的使用请参考[使用etcdctl访问kuberentes数据](../guide/using-etcdctl-to-access-kubernetes-data.md)。

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
        image: harbor-001.jimmysong.io/library/nginx:1.9
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
        image: harbor-001.jimmysong.io/library/nginx:1.9
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
$ kubectl exec `kubectl get pods -l run=my-nginx  -o=name|cut -d "/" -f2` cat /etc/config/log_level
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

Known Issue：
如果使用ConfigMap的**subPath**挂载为Container的Volume，Kubernetes不会做自动热更新:
https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/#mounted-configmaps-are-updated-automatically

## ConfigMap 更新后滚动更新 Pod

更新 ConfigMap 目前并不会触发相关 Pod 的滚动更新，可以通过修改 pod annotations 的方式强制触发滚动更新。

```bash
$ kubectl patch deployment my-nginx --patch '{"spec": {"template": {"metadata": {"annotations": {"version/config": "20180411" }}}}}'
```

这个例子里我们在 `.spec.template.metadata.annotations` 中添加 `version/config`，每次通过修改 `version/config` 来触发滚动更新。

## 总结

更新 ConfigMap 后：

- 使用该 ConfigMap 挂载的 Env **不会**同步更新
- 使用该 ConfigMap 挂载的 Volume 中的数据需要一段时间（实测大概10秒）才能同步更新

ENV 是在容器启动的时候注入的，启动之后 kubernetes 就不会再改变环境变量的值，且同一个 namespace 中的 pod 的环境变量是不断累加的，参考 [Kubernetes中的服务发现与docker容器间的环境变量传递源码探究](https://jimmysong.io/posts/exploring-kubernetes-env-with-docker/)。为了更新容器中使用 ConfigMap 挂载的配置，需要通过滚动更新 pod 的方式来强制重新挂载 ConfigMap。

## 参考

- [Kubernetes 1.7 security in practice](https://acotten.com/post/kube17-security)
- [ConfigMap | kubernetes handbook - jimmysong.io](https://jimmysong.io/kubernetes-handbook/concepts/configmap.html)
- [创建高可用ectd集群 | Kubernetes handbook - jimmysong.io](https://jimmysong.io/kubernetes-handbook/practice/etcd-cluster-installation.html)
- [Kubernetes中的服务发现与docker容器间的环境变量传递源码探究](https://jimmysong.io/posts/exploring-kubernetes-env-with-docker/)
- [Automatically Roll Deployments When ConfigMaps or Secrets change](https://github.com/kubernetes/helm/blob/master/docs/charts_tips_and_tricks.md#automatically-roll-deployments-when-configmaps-or-secrets-change) 
