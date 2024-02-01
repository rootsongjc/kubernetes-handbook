---
date: "2017-07-19T23:15:01+08:00"
draft: false
title: "Kubernetes 中的服务发现与 docker 容器间的环境变量传递源码探究"
type: "post"
description: "基于实际应用研究。"
categories: ["kubernetes"]
tags: ["Kubernetes"]
aliases: "/posts/configuring-kubernetes-kube-dns"
image: "images/banner/kubernetes-7.jpg"
aliases: "/posts/exploring-kubernetes-env-with-docker"
---

## 前言

今天创建了两个 kubernetes 示例应用：

- [k8s-app-monitor-test](https://github.com/rootsongjc/k8s-app-monitor-test)：启动 server 用来产生 metrics
- [k8s-app-monitor-agent](https://github.com/rootsongjc/k8s-app-monitor-agent)：获取 metrics 并绘图，显示在 web 上

*注：相关的 kubernetes 应用`manifest.yaml`文件分别见以上两个应用的 GitHub。*

当我查看 Pod 中的环境变量信息时，例如 kubernetes 中的 service `k8s-app-monitor-test`注入的环境变量时，包括了以下变量：

```ini
K8S_APP_MONITOR_TEST_PORT_3000_TCP_ADDR=10.254.56.68
K8S_APP_MONITOR_TEST_PORT=tcp://10.254.56.68:3000
K8S_APP_MONITOR_TEST_PORT_3000_TCP_PROTO=tcp
K8S_APP_MONITOR_TEST_SERVICE_PORT_HTTP=3000
K8S_APP_MONITOR_TEST_PORT_3000_TCP_PORT=3000
K8S_APP_MONITOR_TEST_PORT_3000_TCP=tcp://10.254.56.68:3000
K8S_APP_MONITOR_TEST_SERVICE_HOST=10.254.56.68
K8S_APP_MONITOR_TEST_SERVICE_PORT=3000
```

我们知道 Kubernetes 在启动 Pod 的时候为容器注入环境变量，这些环境变量将在该 Pod 所在的 namespace 中共享。但是既然使用这些环境变量就已经可以访问到对应的 service，那么获取应用的地址信息，究竟是使用变量呢？还是直接使用 DNS 解析来发现？下面我们从代码中来寻求答案。

如果不想看下面的文字，可以直接看图。

![kubernetes 中传递 ENV 的探索过程](kubernetes-service-discovery-with-dns-or-env.png)

## 探索

docker 的`docker/engine-api/types/container/config.go`中的`Config`结构体中有对环境变量的定义：

```Go
// Config contains the configuration data about a container.
// It should hold only portable information about the container.
// Here, "portable" means "independent from the host we are running on".
// Non-portable information *should* appear in HostConfig.
// All fields added to this struct must be marked `omitempty` to keep getting
// predictable hashes from the old `v1Compatibility` configuration.
type Config struct {
	Hostname        string                // Hostname
	Domainname      string                // Domainname
	User            string                // User that will run the command(s) inside the container
...
	Env             []string              // List of environment variable to set in the container
	Cmd             strslice.StrSlice     // Command to run when starting the container
	...
}
```

Kubernetes 中在`pkg/kubelet/container/runtime.go`中的`RunContainerOptions`结构体中定义：

```go
// RunContainerOptions specify the options which are necessary for running containers
type RunContainerOptions struct {
	// The environment variables list.
	Envs []EnvVar
  	// The mounts for the containers.
	Mounts []Mount
	// The host devices mapped into the containers.
...
}
```

Kubelet 向容器中注入环境变量的配置是在下面的方法中定义：

```ini
pkg/kubelet/kuberuntime/kuberuntime_container.go
```

```Go
// generateContainerConfig generates container config for kubelet runtime v1.
func (m *kubeGenericRuntimeManager) generateContainerConfig(container *v1.Container, pod *v1.Pod, restartCount int, podIP, imageRef string) (*runtimeapi.ContainerConfig, error) {
    opts, _, err := m.runtimeHelper.GenerateRunContainerOptions(pod, container, podIP)
    ...
	// set environment variables
	envs := make([]*runtimeapi.KeyValue, len(opts.Envs))
	for idx := range opts.Envs {
		e := opts.Envs[idx]
		envs[idx] = &runtimeapi.KeyValue{
			Key:   e.Name,
			Value: e.Value,
		}
	}
	config.Envs = envs

	return config, nil
}
```

kubelet 的`pkg/kubelet/kubelet_pods.go`的如下方法中生成了`RunContainerOptions`：

```Go
// GenerateRunContainerOptions generates the RunContainerOptions, which can be used by
// the container runtime to set parameters for launching a container.
func (kl *Kubelet) GenerateRunContainerOptions(pod *v1.Pod, container *v1.Container, podIP string) (*kubecontainer.RunContainerOptions, bool, error) {
	...
	opts := &kubecontainer.RunContainerOptions{CgroupParent: cgroupParent}
	...
	opts.Envs, err = kl.makeEnvironmentVariables(pod, container, podIP)
    return opts, useClusterFirstPolicy, nil
}
```

我们再看下`makeEnvironmentVariables(pod, container, podIP)`方法中又做了什么（该方法也在`pkg/kubelet/kubelet_pods.go`文件中）。

```Go
// Make the environment variables for a pod in the given namespace.
func (kl *Kubelet) makeEnvironmentVariables(pod *v1.Pod, container *v1.Container, podIP string) ([]kubecontainer.EnvVar, error) {
	var result []kubecontainer.EnvVar
	// Note:  These are added to the docker Config, but are not included in the checksum computed
	// by dockertools.BuildDockerName(...).  That way, we can still determine whether an
	// v1.Container is already running by its hash. (We don't want to restart a container just
	// because some service changed.)
	//
	// Note that there is a race between Kubelet seeing the pod and kubelet seeing the service.
	// To avoid this users can: (1) wait between starting a service and starting; or (2) detect
	// missing service env var and exit and be restarted; or (3) use DNS instead of env vars
	// and keep trying to resolve the DNS name of the service (recommended).
	...
}
```

该代码段比较长，kubernetes 究竟如何将环境变量注入到 docker 容器中的奥秘就在这里，按图索骥到了这里，从代码注释中已经可以得出结论，使用 DNS 解析而不要使用环境变量来做服务发现，究竟为何这样做，改天我们再详细解读。
