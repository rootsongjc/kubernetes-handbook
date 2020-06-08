# APIService

APIService 是用来表示一个特定的 `GroupVersion` 的中的 server，它的结构定义位于代码 `staging/src/k8s.io/kube-aggregator/pkg/apis/apiregistration/types.go` 中。

下面是一个 APIService 的示例配置：

```yaml
apiVersion: apiregistration.k8s.io/v1beta1
kind: APIService
metadata:
  name: v1alpha1.custom-metrics.metrics.k8s.io
spec:
  insecureSkipTLSVerify: true
  group: custom-metrics.metrics.k8s.io
  groupPriorityMinimum: 1000
  versionPriority: 5
  service:
    name: api
    namespace: custom-metrics
  version: v1alpha1
```

## APIService 详解

使用 `apiregistration.k8s.io/v1beta1` 版本的 APIService，在 metadata.name 中定义该 API 的名字。

使用上面的 yaml 的创建 `v1alpha1.custom-metrics.metrics.k8s.io` APIService。

- `insecureSkipTLSVerify`：当与该服务通信时，禁用 TLS 证书认证。强加建议不要设置这个参数，默认为 false。应该使用 CABundle 代替。
- `service`：与该 APIService 通信时引用的 service，其中要注明 service 的名字和所属的 namespace，如果为空的话，则所有的服务都会该 API groupversion 将在本地 443 端口处理所有通信。
- `groupPriorityMinimum`：该组 API 的处理优先级，主要排序是基于 `groupPriorityMinimum`，该数字越大表明优先级越高，客户端就会与其通信处理请求。次要排序是基于字母表顺序，例如 v1.bar 比 v1.foo 的优先级更高。
- `versionPriority`：VersionPriority 控制其组内的 API 版本的顺序。必须大于零。主要排序基于 VersionPriority，从最高到最低（20 大于 10）排序。次要排序是基于对象名称的字母比较。 （v1.foo 在 v1.bar 之前）由于它们都是在一个组内，因此数字可能很小，一般都小于 10。

查看我们使用上面的 yaml 文件创建的 APIService。

```bash
kubectl get apiservice v1alpha1.custom-metrics.metrics.k8s.io -o yaml
​``````yaml
apiVersion: apiregistration.k8s.io/v1beta1
kind: APIService
metadata:
  creationTimestamp: 2017-12-14T08:27:35Z
  name: v1alpha1.custom-metrics.metrics.k8s.io
  resourceVersion: "35194598"
  selfLink: /apis/apiregistration.k8s.io/v1beta1/apiservices/v1alpha1.custom-metrics.metrics.k8s.io
  uid: a31a3412-e0a8-11e7-9fa4-f4e9d49f8ed0
spec:
  caBundle: null
  group: custom-metrics.metrics.k8s.io
  groupPriorityMinimum: 1000
  insecureSkipTLSVerify: true
  service:
    name: api
    namespace: custom-metrics
  version: v1alpha1
  versionPriority: 5
status:
  conditions:
  - lastTransitionTime: 2017-12-14T08:27:38Z
    message: all checks passed
    reason: Passed
    status: "True"
    type: Available
```

## 查看集群支持的 APISerivce

作为 Kubernetes 中的一种资源对象，可以使用 `kubectl get apiservice` 来查看。

例如查看集群中所有的 APIService：

```bash
$ kubectl get apiservice
NAME                                     AGE
v1.                                      2d
v1.authentication.k8s.io                 2d
v1.authorization.k8s.io                  2d
v1.autoscaling                           2d
v1.batch                                 2d
v1.monitoring.coreos.com                 1d
v1.networking.k8s.io                     2d
v1.rbac.authorization.k8s.io             2d
v1.storage.k8s.io                        2d
v1alpha1.custom-metrics.metrics.k8s.io   2h
v1beta1.apiextensions.k8s.io             2d
v1beta1.apps                             2d
v1beta1.authentication.k8s.io            2d
v1beta1.authorization.k8s.io             2d
v1beta1.batch                            2d
v1beta1.certificates.k8s.io              2d
v1beta1.extensions                       2d
v1beta1.policy                           2d
v1beta1.rbac.authorization.k8s.io        2d
v1beta1.storage.k8s.io                   2d
v1beta2.apps                             2d
v2beta1.autoscaling                      2d
```

另外查看当前 kubernetes 集群支持的 API 版本还可以使用`kubectl api-versions`：

```bash
$ kubectl api-versions
apiextensions.k8s.io/v1beta1
apiregistration.k8s.io/v1beta1
apps/v1beta1
apps/v1beta2
authentication.k8s.io/v1
authentication.k8s.io/v1beta1
authorization.k8s.io/v1
authorization.k8s.io/v1beta1
autoscaling/v1
autoscaling/v2beta1
batch/v1
batch/v1beta1
certificates.k8s.io/v1beta1
custom-metrics.metrics.k8s.io/v1alpha1
extensions/v1beta1
monitoring.coreos.com/v1
networking.k8s.io/v1
policy/v1beta1
rbac.authorization.k8s.io/v1
rbac.authorization.k8s.io/v1beta1
storage.k8s.io/v1
storage.k8s.io/v1beta1
v1
```
