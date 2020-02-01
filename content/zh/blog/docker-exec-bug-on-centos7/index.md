---
title: "CentOS7官方Docker发行版现重大Bug可致Kubernetes中的健康检测探针失败并影响容器交互"
date: 2018-12-06T21:08:02+08:00
draft: false
description: "CentOS7官方Docker版本docker 1.13现Bug导致docker exec失败，可致Kubernetes中的检测探针失败，官方推荐降级docker版本解决。"
categories: ["容器"]
tags: ["docker"]
type: "post"
bg_image: "images/backgrounds/page-title.jpg"
aliases: "/posts/docker-exec-bug-on-centos7"
image: "images/banner/docker-logo.jpg"
---

**TL;DR**

[Cannot ssh into a running pod/container -- rpc error: code = 2 desc = oci runtime error: exec failed: container_linux.go:247: starting container process caused "process_linux.go:110: decoding init error from pipe caused \"read parent: connection reset by peer\"" command terminated with exit code 126 #21590](https://github.com/openshift/origin/issues/21590)

## Bug 影响

如果你使用的是 CentOS7，需要用到 `kubectl exec` 或者为 Pod 配置了**基于命令返回值**的健康检查（非常用的 HTTP Get 方式）的话，该 Bug 将导致命令返回错误，Pod 无法正常启动，引起大规模故障，而且也无法使用 `kubectl exec` 或者 `docker exec` 与容器交互。

例如下面的健康检查配置：

```yaml
   livenessProbe:
     exec:
       command:
       - /usr/local/bin/sidecar-injector
       - probe
       - --probe-path=/health
       - --interval=4s
     failureThreshold: 3
     initialDelaySeconds: 10
     periodSeconds: 4
     successThreshold: 1
     timeoutSeconds: 1
   readinessProbe:
     exec:
       command:
       - /usr/local/bin/sidecar-injector
       - probe
       - --probe-path=/health
       - --interval=4s
     failureThreshold: 3
     initialDelaySeconds: 10
     periodSeconds: 4
     successThreshold: 1
     timeoutSeconds: 1
```

以上 YAML 配置摘自 [Istio](https://istio.io/zh) 发行版中的 `istio-demo.yaml` 文件。

## Bug 成因

根据 [RedHat 的 Bug 报告](https://bugzilla.redhat.com/show_bug.cgi?id=1655214)，导致该 Bug 的原因是：

CentOS7 发行版中的 Docker 使用的 docker-runc 二进制文件使用旧版本的 golang 构建的，这里面一些可能导致  [FIPS 模式](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/NSS/FIPS_Mode_-_an_explanation)崩溃的错误。

至于该 Bug 是如何触发的官方只是说因为某些镜像导致的。

## 发现过程

本周 [Kubernetes 1.13](https://jimmysong.io/kubernetes-handbook/appendix/kubernetes-1.13-changelog.html) 发布，想着更新下我的 [kubernetes-vagrant-centos-cluster](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster) 使用 Vagrant 和 VirtualBox 在本地搭建分布式 Kubernetes 1.13 集群和 [Istio](https://istio.io/zh) Service Mesh 的最新版本 1.0.4， 可是在安装 Istio 的时候发现 Istio 有两个 Pod 启动不起来，`istio-sidecar-injector` 和 `istio-galley` 这两个 Pod，检查其启动过程，发现它们都是因为 Readiness Probe 和 Liveness Probe 失败导致的。再联想到之前安装较老版本的 Istio 的时候也遇到该问题，见 [Increase health probe interval #6610](https://github.com/istio/istio/pull/6610) 通过增加健康检查的时间间隔可以解决该问题，可是经过反复的测试后发现还是不行。然后我想到先去掉健康检查，然后我手动使用 `kubectl exec` 来执行健康检查的命令，解决却遇到下面的错误：

```bash
$ kubectl exec -it istio-sidecar-injector-6fc974b6c8-pts4t -- istio-sidecar-injector-b484dfcbb-9x9l9 probe --probe-path=/health --interval=4s
Cannot ssh into a running pod/container -- rpc error: code = 2 desc = oci runtime error: exec failed: container_linux.go:247: starting container process caused "process_linux.go:110: decoding init error from pipe caused "read parent: connection reset by peer"" command terminated with exit code 126
```

然后直接到 Pod 所在的主机使用 `docker exec` 命令执行，依然报上面的错误，我就确定这不是 Kubernetes 的问题了。更何况前之前 [kubernetes-vagrant-centos-cluster](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster) 屡试不爽，突然出现问题，有点让人摸不着头脑。知道我搜到了这个四天前才有人提出的 [issue](https://github.com/openshift/origin/issues/21590)。根据网友反馈，现在 [kubernetes-vagrant-centos-cluster](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster) 中已经通过降级 Docker 的方式临时修复了该问题，并支持 Kubernetes 1.13 和  Istio 1.0.4，欢迎试用。

## 解决方法

有两种解决方法，都需要替换 Docker 版本。

**一、降级到旧的 RedHat CentOS 官方源中的 Docker 版本**

将 RedHat 官方源中的 Docker 版本降级，这样做的好处是所有的配置无需改动，参考 <https://github.com/openshift/origin/issues/21590>。

查看 Docker 版本：

```bash
$ rpm -qa | grep -i docker
docker-common-1.13.1-84.git07f3374.el7.centos.x86_64
docker-client-1.13.1-84.git07f3374.el7.centos.x86_64
docker-1.13.1-84.git07f3374.el7.centos.x86_64
```

降级 Docker 版本。

```bash
yum downgrade docker-1.13.1-75.git8633870.el7.centos.x86_64 docker-client-1.13.1-75.git8633870.el7.centos.x86_64 docker-common-1.13.1-75.git8633870.el7.centos.x86_64
```

降级之后再查看 Docker 版本：

```bash
$ rpm -qa | grep -i docker
docker-common-1.13.1-75.git8633870.el7.centos.x86_64
docker-1.13.1-75.git8633870.el7.centos.x86_64
docker-client-1.13.1-75.git8633870.el7.centos.x86_64
```

此为临时解决方法，RedHat 也在着手解决该问题，为了可能会提供补丁，见 [**Bug 1655214**](https://bugzilla.redhat.com/show_bug.cgi?id=1655214) - docker exec does not work with registry.access.redhat.com/rhel7:7.3。

**二、更新到 Docker-CE**

众所周知，Docker 自1.13版本之后更改了版本的命名方式，也提供了官方的 CentOS 源，替换为 Docker-CE 亦可解决该问题，不过 Docker-CE 的配置可能会与 Docker 1.13 有所不同，所以可能需要修改配置文件。

## 参考

- [配置Pod的liveness和readiness探针 - jimmysong.io](https://jimmysong.io/kubernetes-handbook/guide/configure-liveness-readiness-probes.html)
- [Bug 1655214 - docker exec does not work with registry.access.redhat.com/rhel7:7.3 - redhat.com](https://bugzilla.redhat.com/show_bug.cgi?id=1655214)
- [kubernetes-vagrant-centos-cluster - github.com](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster)
- [FIPS Mode - an explanation - mozilla.org](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/NSS/FIPS_Mode_-_an_explanation)

