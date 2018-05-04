# Operator SDK

[Operator SDK](https://github.com/operator-framework/operator-sdk) 由 CoreOS 开源，它是用于构建 Kubernetes 原生应用的 SDK，它提供更高级别的 API、抽象和项目脚手架。在阅读本文前请先确认您已经了解 [Operator](operator.md)是什么。

使用 Kubernetes 中原生的对象来部署和管理复杂的应用程序不是那么容易，尤其是要管理整个应用的生命周期、组件的扩缩容，我们之前通常是编写各种脚本，通过调用 Kubernetes 的命令行工具来管理 Kubernetes 上的应用。现在可以通过 CRD（CustomResourceDefinition）来自定义这些复杂操作，通过将运维的知识封装在自定义 API 里来减轻运维人员的负担。同时我们还可以像操作 Kubernetes 的原生资源对象一样，使用 `kubectl` 来操作 CRD。

下面我们将安装和试用一下 Operator SDK。

## 安装 Operator SDK

```bash
$ mkdir -p $GOPATH/src/github.com/operator-framework
$ cd $GOPATH/src/github.com/operator-framework/operator-sdk
$ dep ensure
Create kubernetes-operator-sdk-tutorial/cmd/kubernetes-operator-sdk-tutorial/main.go
Create kubernetes-operator-sdk-tutorial/config/config.yaml
Create kubernetes-operator-sdk-tutorial/deploy/rbac.yaml
Create kubernetes-operator-sdk-tutorial/deploy/cr.yaml
Create kubernetes-operator-sdk-tutorial/pkg/apis/jimmysong/v1alpha1/doc.go
Create kubernetes-operator-sdk-tutorial/pkg/apis/jimmysong/v1alpha1/register.go
Create kubernetes-operator-sdk-tutorial/pkg/apis/jimmysong/v1alpha1/types.go
Create kubernetes-operator-sdk-tutorial/pkg/stub/handler.go
Create kubernetes-operator-sdk-tutorial/tmp/build/build.sh
Create kubernetes-operator-sdk-tutorial/tmp/build/docker_build.sh
Create kubernetes-operator-sdk-tutorial/tmp/build/Dockerfile
Create kubernetes-operator-sdk-tutorial/tmp/codegen/boilerplate.go.txt
Create kubernetes-operator-sdk-tutorial/tmp/codegen/update-generated.sh
Create kubernetes-operator-sdk-tutorial/Gopkg.toml
Create kubernetes-operator-sdk-tutorial/Gopkg.lock
Run dep ensure ...
Root project is "github.com/rootsongjc/kubernetes-operator-sdk-tutorial"
 3 transitively valid internal packages
 12 external packages imported from 4 projects
(0)   ✓ select (root)
(1)	? attempt k8s.io/api with 1 pkgs; at least 1 versions to try
(1)	    try k8s.io/api@kubernetes-1.9.3
(1)	✓ select k8s.io/api@kubernetes-1.9.3 w/1 pkgs
(2)	? attempt k8s.io/apimachinery with 4 pkgs; at least 1 versions to try
(2)	    try k8s.io/apimachinery@kubernetes-1.9.3
(2)	✓ select k8s.io/apimachinery@kubernetes-1.9.3 w/22 pkgs
...

$ go install github.com/operator-framework/operator-sdk/commands/operator-sdk
```

该过程需要几分钟，请耐心等待。确认 `$GOPATH/bin/operator-sdk` 文件位于您的 `$PATH` 目录下。

## 创建项目

```bash
$ cd $GOPATH/src/github.com/<your-github-repo>/
$ operator-sdk new <operator-project-name> --api-version=<your-api-group>/<version> --kind=<custom-resource-kind>
$ cd <operator-project-name>
```

- operator-project-name：创建的项目的名称
- your-api-group：Kubernetes 自定义 API 的组名，一般用域名如 `jimmysong.io`
- version：Kubernetes 自定义资源的 API 版本
- custom-resource-kind：CRD 的名称

```bash
operator-sdk new kubernetes-operator-sdk-tutorial --api-version=jimmysong.io/v1alpha1 --kind=operator-sdk
```

## 参考

- [A complete guide to Kubernetes Operator SDK](https://banzaicloud.com/blog/operator-sdk/)