# 自定义指标HPA

Kubernetes中不仅支持CPU、内存为指标的HPA，还支持自定义指标的HPA，例如QPS。

本文中使用的yaml文件见[manifests/HPA](https://github.com/rootsongjc/kubernetes-handbook/tree/master/manifests/HPA)。

## 设置自定义指标

**kubernetes1.6**

> 在kubernetes1.6集群中配置自定义指标的HPA的说明已废弃。

在设置定义指标HPA之前需要先进行如下配置：

- 将heapster的启动参数 `--api-server` 设置为 true


- 启用custom metric API
- 将kube-controller-manager的启动参数中`--horizontal-pod-autoscaler-use-rest-clients`设置为true，并指定`--master`为API server地址，如`--master=http://172.20.0.113:8080`

在kubernetes1.5以前很容易设置，参考[1.6以前版本的kubernetes中开启自定义HPA](https://medium.com/@marko.luksa/kubernetes-autoscaling-based-on-custom-metrics-without-using-a-host-port-b783ed6241ac)，而在1.6中因为取消了原来的annotation方式设置custom metric，只能通过API server和kube-aggregator来获取custom metric，因为只有两种方式来设置了，一是直接通过API server获取heapster的metrics，二是部署[kube-aggragator](https://github.com/kubernetes/kube-aggregator)来实现。

我们将在kubernetes1.8版本的kubernetes中，使用聚合的API server来实现自定义指标的HPA。

**kuberentes1.7+**

确认您的kubernetes版本在1.7或以上，修改以下配置：

- 将kube-controller-manager的启动参数中`--horizontal-pod-autoscaler-use-rest-clients`设置为true，并指定`--master`为API server地址，如`--master=http://172.20.0.113:8080
- 修改kube-apiserver的配置文件apiserver，增加一条配置`--requestheader-client-ca-file=/etc/kubernetes/ssl/ca.pem --requestheader-allowed-names=aggregator --requestheader-extra-headers-prefix=X-Remote-Extra- --requestheader-group-headers=X-Remote-Group --requestheader-username-headers=X-Remote-User --proxy-client-cert-file=/etc/kubernetes/ssl/kubernetes.pem --proxy-client-key-file=/etc/kubernetes/ssl/kubernetes-key.pem`，用来配置aggregator的CA证书。

已经内置了`apiregistration.k8s.io/v1beta1` API，可以直接定义APIService，如：

```yaml
apiVersion: apiregistration.k8s.io/v1
kind: APIService
metadata:
  name: v1.custom-metrics.metrics.k8s.io
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

**部署Prometheus**

使用下面的yaml文件部署Prometheus operator：

```yaml
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRoleBinding
metadata:
  name: prometheus-operator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: prometheus-operator
subjects:
- kind: ServiceAccount
  name: prometheus-operator
  namespace: default
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRole
metadata:
  name: prometheus-operator
rules:
- apiGroups:
  - extensions
  resources:
  - thirdpartyresources
  verbs:
  - "*"
- apiGroups:
  - apiextensions.k8s.io
  resources:
  - customresourcedefinitions
  verbs:
  - "*"
- apiGroups:
  - monitoring.coreos.com
  resources:
  - alertmanagers
  - prometheuses
  - servicemonitors
  verbs:
  - "*"
- apiGroups:
  - apps
  resources:
  - statefulsets
  verbs: ["*"]
- apiGroups: [""]
  resources:
  - configmaps
  - secrets
  verbs: ["*"]
- apiGroups: [""]
  resources:
  - pods
  verbs: ["list", "delete"]
- apiGroups: [""]
  resources:
  - services
  - endpoints
  verbs: ["get", "create", "update"]
- apiGroups: [""]
  resources:
  - nodes
  verbs: ["list", "watch"]
- apiGroups: [""]
  resources:
  - namespaces
  verbs: ["list"]
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prometheus-operator
---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  labels:
    k8s-app: prometheus-operator
  name: prometheus-operator
spec:
  replicas: 1
  template:
    metadata:
      labels:
        k8s-app: prometheus-operator
    spec:
      containers:
      - args:
        - --kubelet-service=kube-system/kubelet
        - --config-reloader-image=sz-pg-oam-docker-hub-001.tendcloud.com/library/configmap-reload:v0.0.1
        image: sz-pg-oam-docker-hub-001.tendcloud.com/library/prometheus-operator:v0.15.0
        name: prometheus-operator
        ports:
        - containerPort: 8080
          name: http
        resources:
          limits:
            cpu: 200m
            memory: 100Mi
          requests:
            cpu: 100m
            memory: 50Mi
      serviceAccountName: prometheus-operator
```

**注意：**将镜像修改为你自己的镜像仓库地址。

这产生一个自定义的API：http://172.20.0.113:8080/apis/custom-metrics.metrics.k8s.io/v1alpha1

TODO

## 参考

[1.6以前版本的kubernetes中开启自定义HPA](https://medium.com/@marko.luksa/kubernetes-autoscaling-based-on-custom-metrics-without-using-a-host-port-b783ed6241ac)

[1.7版本的kubernetes中启用自定义HPA](https://docs.bitnami.com/kubernetes/how-to/configure-autoscaling-custom-metrics/)

[Horizontal Pod Autoscaler Walkthrough](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/)

[Kubernetes 1.8: Now with 100% Daily Value of Custom Metrics](https://blog.openshift.com/kubernetes-1-8-now-custom-metrics/)

[Arbitrary/Custom Metrics in the Horizontal Pod Autoscaler#117](https://github.com/kubernetes/features/issues/117)

