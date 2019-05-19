---
date: "2017-06-15T21:52:38+08:00"
draft: false
title: "kubernetes管理的容器命名规则解析"
subtitle: "一个Pod名字的由来"
description: "本文带您详细了解Kubernetes中Pod的命名规则"
bigimg: [{src: "/img/banners/0069RVTdly1fv6npwu2qyj30i5081jsc.jpg", desc: "© nombra.com|Apr 5,2018"}]
categories: "kubernetes"
tags: ["kubernetes"]
---

本文将归档到[kubernetes-handbook](https://github.com/rootsongjc/kubernetes-handbook)的【运维管理-监控】章节中，最终版本以kubernetes-handbook中为准。

当我们通过cAdvisor获取到了容器的信息后，例如访问`${NODE_IP}:4194/api/v1.3/docker`获取的json结果中的某个容器包含如下字段：

```json
"labels": {
"annotation.io.kubernetes.container.hash": "f47f0602", 
"annotation.io.kubernetes.container.ports": "[{\"containerPort\":80,\"protocol\":\"TCP\"}]", 
"annotation.io.kubernetes.container.restartCount": "0", 
"annotation.io.kubernetes.container.terminationMessagePath": "/dev/termination-log", 
"annotation.io.kubernetes.container.terminationMessagePolicy": "File", 
"annotation.io.kubernetes.pod.terminationGracePeriod": "30", 
"io.kubernetes.container.logpath": "/var/log/pods/d8a2e995-3617-11e7-a4b0-ecf4bbe5d414/php-redis_0.log", 
"io.kubernetes.container.name": "php-redis", 
"io.kubernetes.docker.type": "container", 
"io.kubernetes.pod.name": "frontend-2337258262-771lz", 
"io.kubernetes.pod.namespace": "default", 
"io.kubernetes.pod.uid": "d8a2e995-3617-11e7-a4b0-ecf4bbe5d414", 
"io.kubernetes.sandbox.id": "843a0f018c0cef2a5451434713ea3f409f0debc2101d2264227e814ca0745677"
},
```

这些信息其实都是kubernetes创建容器时给docker container打的`Labels`。

你是否想过这些label跟容器的名字有什么关系？当你在node节点上执行`docker ps`看到的容器名字又对应哪个应用的Pod呢？

在kubernetes代码中pkg/kubelet/dockertools/docker.go中的BuildDockerName方法定义了容器的名称规范。

这段容器名称定义代码如下：

```go
// Creates a name which can be reversed to identify both full pod name and container name.
// This function returns stable name, unique name and a unique id.
// Although rand.Uint32() is not really unique, but it's enough for us because error will
// only occur when instances of the same container in the same pod have the same UID. The
// chance is really slim.
func BuildDockerName(dockerName KubeletContainerName, container *v1.Container) (string, string, string) {
	containerName := dockerName.ContainerName + "." + strconv.FormatUint(kubecontainer.HashContainerLegacy(container), 16)
	stableName := fmt.Sprintf("%s_%s_%s_%s",
		containerNamePrefix,
		containerName,
		dockerName.PodFullName,
		dockerName.PodUID)
	UID := fmt.Sprintf("%08x", rand.Uint32())
	return stableName, fmt.Sprintf("%s_%s", stableName, UID), UID
}

// Unpacks a container name, returning the pod full name and container name we would have used to
// construct the docker name. If we are unable to parse the name, an error is returned.
func ParseDockerName(name string) (dockerName *KubeletContainerName, hash uint64, err error) {
	// For some reason docker appears to be appending '/' to names.
	// If it's there, strip it.
	name = strings.TrimPrefix(name, "/")
	parts := strings.Split(name, "_")
	if len(parts) == 0 || parts[0] != containerNamePrefix {
		err = fmt.Errorf("failed to parse Docker container name %q into parts", name)
		return nil, 0, err
	}
	if len(parts) < 6 {
		// We have at least 5 fields.  We may have more in the future.
		// Anything with less fields than this is not something we can
		// manage.
		glog.Warningf("found a container with the %q prefix, but too few fields (%d): %q", containerNamePrefix, len(parts), name)
		err = fmt.Errorf("Docker container name %q has less parts than expected %v", name, parts)
		return nil, 0, err
	}

	nameParts := strings.Split(parts[1], ".")
	containerName := nameParts[0]
	if len(nameParts) > 1 {
		hash, err = strconv.ParseUint(nameParts[1], 16, 32)
		if err != nil {
			glog.Warningf("invalid container hash %q in container %q", nameParts[1], name)
		}
	}

	podFullName := parts[2] + "_" + parts[3]
	podUID := types.UID(parts[4])

	return &KubeletContainerName{podFullName, podUID, containerName}, hash, nil
}
```

我们可以看到容器名称中包含如下几个字段，中间用下划线隔开，至少有6个字段，未来可能添加更多字段。

下面的是四个基本字段。

```ini
containerNamePrefix_containerName_PodFullName_PodUID
```

所有kubernetes启动的容器的containerNamePrefix都是k8s。

Kubernetes启动的docker容器的容器名称规范，下面以官方示例guestbook为例，Deployment 名为 frontend中启动的名为php-redis的docker容器的副本书为3。

Deployment frontend的配置如下：

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: frontend
spec:
  template:
    metadata:
      labels:
        app: guestbook
        tier: frontend
    spec:
      containers:
      - name: php-redis
        image: bj-xg-oam-docker-hub-001.tendcloud.com/library/gb-frontend:v4
        resources:
          requests:
            cpu: 100m
            memory: 100Mi
        env:
        - name: GET_HOSTS_FROM
          value: dns
        ports:
        - containerPort: 80
```

我们选取三个实例中的一个运行php-redis的docker容器。

```ini
k8s_php-redis_frontend-2337258262-154p7_default_d8a2e2dd-3617-11e7-a4b0-ecf4bbe5d414_0
```

- containerNamePrefix：k8s
- containerName：php-redis
- podFullName：frontend-2337258262-154p7
- computeHash：154p7
- deploymentName：frontend
- replicaSetName：frontend-2337258262
- namespace：default
- podUID：d8a2e2dd-3617-11e7-a4b0-ecf4bbe5d414
- restartCount：0

kubernetes容器命名规则解析，见下图所示。

![kubernetes的容器命名规则示意图](https://res.cloudinary.com/jimmysong/image/upload/images/kubernetes-container-naming-rule.jpg)
