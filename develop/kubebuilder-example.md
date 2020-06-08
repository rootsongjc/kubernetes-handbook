# 使用 kubebuilder 创建 operator 示例

本文作为 Kubebuilder 教程，将指导您如何使用 kubebuilder 创建一个 Kubernetes Operator。

## 准备

本文中的示例运行环境及相关软件版本如下：

- Kubernetes MiniKube v1.9.2
- Kubernetes v1.18.0
- Go 1.14
- Kubebuilder 2.3.1
- kustomize 3.6.1
- Docker 19.03.8

使用 Minikube 安装 Kubernetes 集群，Kubernetes 安装好后，检查集群是否可用。

### Minikube 的 DNS 解析问题

如果遇到 Kubernetes 集群无法拉取镜像，DNS 解析出现问题，解决方式见 [DNS lookup not working when starting minikube with --dns-domain #1674](https://github.com/kubernetes/minikube/issues/1674)。

使用 `minikube ssh` 进入 minikube 主机，修改 `/etc/systemd/resolved.conf` 文件，将其中的 DNS 配置字段修改为 `DNS=8.8.8.8`，然后执行 `sudo systemctl restart systemd-resolved` 即可更改 DNS，切勿直接修改 `/etc/resolv.conf` 文件。

修正 Minikube 的 DNS 配置，请执行下面的命令。

```bash
minikube ssh
sudo sed -i 's/#DNS=/DNS=8.8.8.8/g' /etc/systemd/resolved.conf
sudo systemctl restart systemd-resolved
```

## 名词解释

在阅读下面的文章前，需要先明确以下两个名词的含义。

- CRD：自定义资源定义，Kubernetes 中的资源类型。
- CR：Custom Resource，对使用 CRD 创建出来的自定义资源的统称。

## 安装 kubebuilder

到 kubebuilder 的 [GitHub release 页面](https://github.com/kubernetes-sigs/kubebuilder/releases)上下载与您操作系统对应的 kubebuilder 安装包。

**MacOS**

对于 Mac 系统，将下载好的安装包解压后将其移动到 `/usr/local/kubebuilder` 目录下，并将 `/usr/local/kubebuilder/bin` 添加到您的 `$PATH` 路径下。

## 创建项目

我们首先将使用自动配置创建一个项目，该项目在创建 CR 时不会触发任何资源生成。

### 初始化和创建 API

创建的项目路径位于 `$GOPATH/jimmysong.io/kubebuilder-example`。下文中的操作没有明确说明的话都是在该项目路径下运行。

在项目路径下使用下面的命令初始化项目。

```bash
$ kubebuilder init --domain jimmysong.io
```

在项目根目录下执行下面的命令创建 API。

```bash
$ kubebuilder create api --group webapp --version v1 --kind Guestbook
Create Resource under pkg/apis [y/n]?
y
Create Controller under pkg/controller [y/n]?
y
Writing scaffold for you to edit...
api/v1/guestbook_types.go
controllers/guestbook_controller.go
Running make:
$ make
/Users/jimmysong/Workspace/go/bin/controller-gen object:headerFile="hack/boilerplate.go.txt" paths="./..."
go fmt ./...
go vet ./...
go: finding github.com/onsi/ginkgo v1.11.0
go: finding github.com/onsi/gomega v1.8.1
go: finding github.com/hpcloud/tail v1.0.0
go: finding gopkg.in/tomb.v1 v1.0.0-20141024135613-dd632973f1e7
go build -o bin/manager main.go
```

API 创建完成后，在项目根目录下查看目录结构。

```bash
.
├── Dockerfile # 用于构建 Operator 镜像
├── Makefile # 构建时使用
├── PROJECT # 项目配置
├── api
│   └── v1
│       ├── groupversion_info.go
│       ├── guestbook_types.go
│       └── zz_generated.deepcopy.go
├── bin
│   └── manager
├── config
│   ├── certmanager
│   │   ├── certificate.yaml
│   │   ├── kustomization.yaml
│   │   └── kustomizeconfig.yaml
│   ├── crd # 新增 CRD 定义
│   │   ├── kustomization.yaml
│   │   ├── kustomizeconfig.yaml
│   │   └── patches
│   ├── default
│   │   ├── kustomization.yaml
│   │   ├── manager_auth_proxy_patch.yaml
│   │   ├── manager_webhook_patch.yaml
│   │   └── webhookcainjection_patch.yaml
│   ├── manager
│   │   ├── kustomization.yaml
│   │   └── manager.yaml
│   ├── prometheus
│   │   ├── kustomization.yaml
│   │   └── monitor.yaml
│   ├── rbac
│   │   ├── auth_proxy_client_clusterrole.yaml
│   │   ├── auth_proxy_role.yaml
│   │   ├── auth_proxy_role_binding.yaml
│   │   ├── auth_proxy_service.yaml
│   │   ├── guestbook_editor_role.yaml
│   │   ├── guestbook_viewer_role.yaml
│   │   ├── kustomization.yaml
│   │   ├── leader_election_role.yaml
│   │   ├── leader_election_role_binding.yaml
│   │   └── role_binding.yaml
│   ├── samples
│   │   └── webapp_v1_guestbook.yaml # CRD 示例
│   └── webhook
│       ├── kustomization.yaml
│       ├── kustomizeconfig.yaml
│       └── service.yaml
├── controllers # 新增 controller
│   ├── guestbook_controller.go
│   └── suite_test.go
├── go.mod
├── go.sum
├── hack
│   └── boilerplate.go.txt
└── main.go # 新增处理逻辑

15 directories, 40 files
```

以上就是自动初始化出来的文件。

### 安装 CRD

执行下面的命令安装 CRD。

```bash
$ make install
/Users/jimmysong/Workspace/go/bin/controller-gen "crd:trivialVersions=true" rbac:roleName=manager-role webhook paths="./..." output:crd:artifacts:config=config/crd/bases
kustomize build config/crd | kubectl apply -f -
customresourcedefinition.apiextensions.k8s.io/guestbooks.webapp.jimmysong.io created
$ kubectl get crd |grep jimmysong.io
guestbooks.webapp.jimmysong.io           2020-06-06T21:58:17Z
```

### 部署 controller

在开始部署 controller 之前，我们需要先检查 kubebuilder 自动生成的 YAML 文件。

**修改使用 gcr.io 镜像仓库的镜像地址**

对于中国大陆用户，可能无法访问 Google 镜像仓库 gcr.io，因此需要修改 `config/default/manager_auth_proxy_patch.yaml`  文件中的镜像地址，将其中 `gcr.io/kube-rbac-proxy:v0.5.0` 修改为 `jimmysong/kubebuilder-kube-rbac-proxy:v0.5.0`。

有两种方式运行 controller：

- 本地运行，用于调试
- 部署到 Kubernetes 上运行，作为生产使用

**本地运行 controller**

要想在本地运行 controller，只需要执行下面的命令。

```bash
make run
```

你将看到 controller 启动和运行时输出。

**将 controller 部署到 Kubernetes**

执行下面的命令部署 controller 到 Kubernetes 上，这一步将会在本地构建 controller 的镜像，并推送到 DockerHub 上，然后在 Kubernetes 上部署 Deployment 资源。

```bash
make docker-build docker-push IMG=jimmysong/kubebuilder-example:latest
make deploy IMG=jimmysong/kubebuilder-example:latest
```

在初始化项目时，kubebuilder 会自动根据项目名称创建一个 Namespace，如本文中的 `kubebuilder-example-system`，查看 Deployment 对象和 Pod 资源。

```bash
$ kubectl get deployment -n kubebuilder-example-system
NAME                                     READY   UP-TO-DATE   AVAILABLE   AGE
kubebuilder-example-controller-manager   1/1     1            1           3h26m
$ kubectl get pod -n kubebuilder-example-system
NAME                                                      READY   STATUS    RESTARTS   AGE
kubebuilder-example-controller-manager-77b4c685f9-2npz8   2/2     Running   0          3h16m
```

### 创建 CR

Kubebuilder 在初始化项目的时候已生成了示例 CR，执行下面的命令部署 CR。

```bash
kubectl apply -f config/samples/webapp_v1_guestbook.yaml
```

执行下面的命令查看新创建的 CR。

```bash
$ kubectl get guestbooks.webapp.jimmysong.io guestbook-sample -o yaml
```

你将看到类似如下的输出。

```yaml
apiVersion: webapp.jimmysong.io/v1
kind: Guestbook
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"webapp.jimmysong.io/v1","kind":"Guestbook","metadata":{"annotations":{},"name":"guestbook-sample","namespace":"kubebuilder-example-system"},"spec":{"foo":"bar"}}
  creationTimestamp: "2020-06-07T01:04:48Z"
  generation: 1
  managedFields:
  - apiVersion: webapp.jimmysong.io/v1
    fieldsType: FieldsV1
    fieldsV1:
      f:metadata:
        f:annotations:
          .: {}
          f:kubectl.kubernetes.io/last-applied-configuration: {}
      f:spec:
        .: {}
        f:foo: {}
    manager: kubectl
    operation: Update
    time: "2020-06-07T01:04:48Z"
  name: guestbook-sample
  namespace: kubebuilder-example-system
  resourceVersion: "1795834"
  selfLink: /apis/webapp.jimmysong.io/v1/namespaces/kubebuilder-example-system/guestbooks/guestbook-sample
  uid: 051a4266-7f5a-4c57-8180-64222d462bba
spec:
  foo: bar
```

至此一个基本的 Operator 框架已经创建完成，但这个 Operator 只是修改了 etcd 中的数据而已，实际上什么事情也没做，因为我们没有在 Operator 中的增加业务逻辑。

## 增加业务逻辑

下面我们将修改 CRD 的数据结构并在 controller 中增加一些日志输出。

### 修改 CRD

我们将修改上文中使用 kubebuilder 命令生成的默认 CRD 配置，在 CRD 中增加 `FirstName`、`LastName` 和 `Status` 字段。

下面是修改后的 `api/v1/guestbook_types.go` 文件的内容，对应修改的地方已在代码中注释说明。

```go
/*


Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package v1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// GuestbookSpec defines the desired state of Guestbook
type GuestbookSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	// Foo is an example field of Guestbook. Edit Guestbook_types.go to remove/update
  // 添加两个新的字段
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
}

// GuestbookStatus defines the observed state of Guestbook
type GuestbookStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
	Status string `json:"Status"`
}

// +kubebuilder:object:root=true
// 在这里增加 status 的说明
// +kubebuilder:subresource:status

// Guestbook is the Schema for the guestbooks API
type Guestbook struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   GuestbookSpec   `json:"spec,omitempty"`
	Status GuestbookStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// GuestbookList contains a list of Guestbook
type GuestbookList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Guestbook `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Guestbook{}, &GuestbookList{})
}
```

上面的代码比原先使用 kubebuilder 生成的默认代码增加了以下内容：

```go
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Status string `json:"Status"`
// +kubebuilder:subresource:status
```

### 修改 Reconcile 函数

Reconcile 函数是 Operator 的核心逻辑，Operator 的业务逻辑都位于 `controllers/guestbook_controller.go` 文件的 `func (r *GuestbookReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error)` 函数中。

```go
// +kubebuilder:rbac:groups=webapp.jimmysong.io,resources=guestbooks,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=webapp.jimmysong.io,resources=guestbooks/status,verbs=get;update;patch

func (r *GuestbookReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	_ = context.Background()
	_ = r.Log.WithValues("guestbook", req.NamespacedName)

	// your logic here
	ctx := context.Background()
	_ = r.Log.WithValues("apiexamplea", req.NamespacedName)

  // 获取当前的 CR，并打印
	obj := &webappv1.Guestbook{}
	if err := r.Get(ctx, req.NamespacedName, obj); err != nil {
		log.Println(err, "Unable to fetch object")
	} else {
		log.Println("Geeting from Kubebuilder to", obj.Spec.FirstName, obj.Spec.LastName)
	}
  
  // 初始化 CR 的 Status 为 Running
	obj.Status.Status = "Running"
	if err := r.Status().Update(ctx, obj); err != nil {
		log.Println(err, "unable to update status")
	}

	return ctrl.Result{}, nil
}
```

这段代码的业务逻辑是当发现有 `guestbooks.webapp.jimmysong.io` 的 CR 变更时，在控制台中输出日志。

### 运行测试

修改好 Operator 的业务逻辑后，再测试一下新的逻辑是否可以正常运行。

**部署 CRD**

跟上文的做法一样，执行下面的命令部署 CRD。

```bash
make install
```

**运行 controller**

跟上文的做法一样，执行下面的命令运行 controller。为了方便起见，我们将在本地运行 controller，当然您也可以将其部署到 Kubernetes 上运行。

```bash
make run
```

保持该窗口在前台运行。

**部署 CR**

修改 `config/samples/webapp_v1_guestbook.yaml` 文件中的配置。

```yaml
apiVersion: webapp.jimmysong.io/v1
kind: Guestbook
metadata:
  name: guestbook-sample
spec:
  # Add fields here
  firstname: Jimmy
  lastname: Song
```

将其应用到 Kubernetes。

```bash
kubectl apply -f config/samples/webapp_v1_guestbook.yaml
```

此时转到上文中运行 controller 的窗口，将在命令行前台中看到如下输出。

```bash
go fmt ./...
go vet ./...
/Users/jimmysong/Workspace/go/bin/controller-gen "crd:trivialVersions=true" rbac:roleName=manager-role webhook paths="./..." output:crd:artifacts:config=config/crd/bases
go run ./main.go
2020-06-07T16:48:29.966+0800	INFO	controller-runtime.metrics	metrics server is starting to listen	{"addr": ":8080"}
2020-06-07T16:48:29.967+0800	INFO	setup	starting manager
2020-06-07T16:48:29.967+0800	INFO	controller-runtime.manager	starting metrics server	{"path": "/metrics"}
2020-06-07T16:48:29.967+0800	INFO	controller-runtime.controller	Starting EventSource	{"controller": "guestbook", "source": "kind source: /, Kind="}
2020-06-07T16:48:30.068+0800	INFO	controller-runtime.controller	Starting Controller	{"controller": "guestbook"}
2020-06-07T16:48:30.068+0800	INFO	controller-runtime.controller	Starting workers	{"controller": "guestbook", "worker count": 1}
2020/06/07 16:48:30 Geeting from Kubebuilder to Jimmy Song
2020-06-07T16:48:30.080+0800	DEBUG	controller-runtime.controller	Successfully Reconciled	{"controller": "guestbook", "request": "kubebuilder-example-system/guestbook-sample"}
```

从上面的日志中，可以看到这条输出。

```bash
2020/06/07 16:48:30 Geeting from Kubebuilder to Jimmy Song
```

这正是在 `Reconcile` 函数中的输出。

**获取当前的 CR**

使用下面的命令获取当前的 CR。

```bash
# kubectl get guestbooks.webapp.jimmysong.io guestbook-sample -o yaml
```

将看到如下输出。

```yaml
apiVersion: webapp.jimmysong.io/v1
kind: Guestbook
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"webapp.jimmysong.io/v1","kind":"Guestbook","metadata":{"annotations":{},"name":"guestbook-sample","namespace":"kubebuilder-example-system"},"spec":{"firstname":"Jimmy","lastname":"Song"}}
  creationTimestamp: "2020-06-07T02:54:46Z"
  generation: 1
  managedFields:
  - apiVersion: webapp.jimmysong.io/v1
    fieldsType: FieldsV1
    fieldsV1:
      f:metadata:
        f:annotations:
          .: {}
          f:kubectl.kubernetes.io/last-applied-configuration: {}
      f:spec:
        .: {}
        f:firstname: {}
        f:lastname: {}
    manager: kubectl
    operation: Update
    time: "2020-06-07T02:54:46Z"
  - apiVersion: webapp.jimmysong.io/v1
    fieldsType: FieldsV1
    fieldsV1:
      f:status:
        .: {}
        f:Status: {}
    manager: main
    operation: Update
    time: "2020-06-07T02:56:38Z"
  name: guestbook-sample
  namespace: kubebuilder-example-system
  resourceVersion: "1813769"
  selfLink: /apis/webapp.jimmysong.io/v1/namespaces/kubebuilder-example-system/guestbooks/guestbook-sample
  uid: 17da5eae-1020-40d2-821a-9a1f990dd767
spec:
  firstname: Jimmy
  lastname: Song
status:
  Status: Running
```

我们输出的最后部分：

```yaml
spec:
  firstname: Jimmy
  lastname: Song
status:
  Status: Running
```

这正是我们在 CRD 里定义的字段。

**删除 CR**

使用下面的命令删除 CR。

```bash
kubectl delete guestbooks.webapp.jimmysong.io guestbook-sample
```

此时在 controller 的前台输出中可以看到以下内容。

```bash
2020/06/07 20:09:50 Guestbook.webapp.jimmysong.io "guestbook-sample" not found Unable to fetch object
2020/06/07 20:09:50 resource name may not be empty unable to update status
2020-06-07T20:09:50.380+0800	DEBUG	controller-runtime.controller	Successfully Reconciled	{"controller": "guestbook", "request": "kubebuilder-example-system/guestbook-sample"}
```

因为该 CR 被删除，因此日志中会提示资源找不到。

## 更多

本示例仅展示了使用 kubebuilder 创建 Operator 的基本逻辑，步骤为：

- 初始化项目和 API
- 安装 CRD
- 部署 Controller
- 创建 CR

Operator 的核心逻辑都在 controller 的 `Reconcile` 函数中，请参考 [Awesome Cloud Native](https://jimmysong.io/awesome-cloud-native/#kubernetes-operators) 中的 Operator 实现，本书后续将会讨论。

## 参考

- [如何使用 KubeBuilder 开发一个 Operator - chenshaowen.com](https://chenshaowen.com/blog/how-to-develop-a-operator-using-kubebuilder.html)
- [Kubernetes CRD 如何简单 - sealyun.com](https://sealyun.com/blog/2019/07/20/crd/)
- [Kubebuilder book - kubebuilder.io](https://kubebuilder.io/quick-start.html)