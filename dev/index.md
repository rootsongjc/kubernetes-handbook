---
layout: "post"
---

# Kubernetes开发环境

## 配置开发环境

```sh
apt-get install -y gcc make socat git

# install docker
curl -fsSL https://get.docker.com/ | sh

# install etcd
curl -L https://github.com/coreos/etcd/releases/download/v3.0.10/etcd-v3.0.10-linux-amd64.tar.gz -o etcd-v3.0.10-linux-amd64.tar.gz && tar xzvf etcd-v3.0.10-linux-amd64.tar.gz && /bin/cp -f etcd-v3.0.10-linux-amd64/{etcd,etcdctl} /usr/bin && rm -rf etcd-v3.0.10-linux-amd64*

# install golang
curl -sL https://storage.googleapis.com/golang/go1.7.1.linux-amd64.tar.gz | tar -C /usr/local -zxf -
export GOPATH=/gopath
export PATH=$PATH:$GOPATH/bin:/usr/local/bin:/usr/local/go/bin/

# Get essential tools for building kubernetes
go get -u github.com/jteeuwen/go-bindata/go-bindata

# Get kubernetes code
mkdir -p $GOPATH/src/k8s.io
git clone https://github.com/kubernetes/kubernetes $GOPATH/src/k8s.io/kubernetes
cd $GOPATH/src/k8s.io/kubernetes

# Start a local cluster
export KUBERNETES_PROVIDER=local
# export EXPERIMENTAL_CRI=true
# export ALLOW_SECURITY_CONTEXT=yes
# set dockerd --selinux-enabled
# export NET_PLUGIN=kubenet
hack/local-up-cluster.sh
```

打开另外一个终端，配置kubectl:

```sh
export KUBERNETES_PROVIDER=local
cluster/kubectl.sh config set-cluster local --server=http://127.0.0.1:8080 --insecure-skip-tls-verify=true
cluster/kubectl.sh config set-context local --cluster=local
cluster/kubectl.sh config use-context local
```


## 容器集成开发环境

```
docker run -it feisky/kubernetes-dev bash
# /hack/start-hyperd.sh
# /hack/start-docker.sh
# /hack/start-frakti.sh
# /hack/start-kubernetes-frakti.sh
# /hack/setup-kubectl.sh
# cluster/kubectl.sh
```

There are some useful scripts in the images:

1. /hack/cgroupfs-mount
2. /hack/fetch-pr.sh
3. /hack/run-e2e-test.sh
4. /hack/run-unit-tests.sh
5. /hack/run-node-e2e-test.sh
6. /hack/setup-kubectl.sh
7. /hack/start-frakti.sh
8. /hack/start-docker.sh
9. /hack/start-hyperd.sh
10. /hack/start-ocid.sh
11. /hack/start-kubernetes.sh
12. /hack/start-kubernetes-cri.sh
13. /hack/start-kubernetes-frakti.sh

## 单元测试

```sh
# unit test a special package
go test -v k8s.io/kubernetes/pkg/kubelet/kuberuntime
```

## e2e测试

```sh
make WHAT='test/e2e/e2e.test'
make ginkgo

export KUBERNETES_PROVIDER=local
go run hack/e2e.go -v -test --test_args='--ginkgo.focus=Port\sforwarding'
go run hack/e2e.go -v -test --test_args='--ginkgo.focus=Feature:SecurityContext'
```

## Node e2e测试

```sh
export KUBERNETES_PROVIDER=local
make test-e2e-node FOCUS="InitContainer" TEST_ARGS="--runtime-integration-type=cri"
```

## Bot命令

- Jenkins verification: `@k8s-bot verify test this`
- GCE E2E: `@k8s-bot cvm gce e2e test this`
- Test all: `@k8s-bot test this please, issue #IGNORE`
- CRI test: `@k8s-bot cri test this.`
- Verity test: `@k8s-bot verify test this`
- **LGTM (only applied if you are one of assignees):**: `/lgtm`
- LGTM cancel: `/lgtm cancel`

更多命令见[kubernetes test-infra](https://github.com/kubernetes/test-infra/blob/master/prow/commands.md)。

## 有用的git命令

拉取pull request到本地：

```sh
git fetch upstream pull/324/head:branch
git fetch upstream pull/365/merge:branch
```

或者配置`.git/config`并运行`git fetch`拉取所有的pull requests:

```
    fetch = +refs/pull/*:refs/remotes/origin/pull/*
```

## 用docker-machine创建虚拟机的方法

```sh
docker-machine create --driver google --google-project xxxx --google-machine-type n1-standard-2 --google-disk-size 30 kubernetes
```

## Minikube启动本地cluster

```sh
$ minikube get-k8s-versions
The following Kubernetes versions are available:
    - v1.5.1
    - v1.4.3
    ...

# http proxy is required in China
$ minikube start --docker-env HTTP_PROXY=http://proxy-ip:port --docker-env HTTPS_PROXY=http://proxy-ip:port --vm-driver=xhyve --kubernetes-version="v1.4.3"
```

