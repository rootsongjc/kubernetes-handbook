# Pod 安全策略

`PodSecurityPolicy` 类型的对象能够控制，是否可以向 Pod 发送请求，该 Pod 能够影响被应用到 Pod 和容器的 `SecurityContext`。 查看 [Pod 安全策略建议](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/auth/pod-security-policy.md) 获取更多信息。

## 什么是 Pod 安全策略？

*Pod 安全策略* 是集群级别的资源，它能够控制 Pod 运行的行为，以及它具有访问什么的能力。 `PodSecurityPolicy`对象定义了一组条件，指示 Pod 必须按系统所能接受的顺序运行。 它们允许管理员控制如下方面：

| 控制面                   | 字段名称                                     |
| --------------------- | ---------------------------------------- |
| 已授权容器的运行              | `privileged`                             |
| 为容器添加默认的一组能力          | `defaultAddCapabilities`                 |
| 为容器去掉某些能力             | `requiredDropCapabilities`               |
| 容器能够请求添加某些能力          | `allowedCapabilities`                    |
| 控制卷类型的使用              | [`volumes`](https://kubernetes.io/docs/concepts/policy/pod-security-policy/#controlling-volumes) |
| 主机网络的使用               | [`hostNetwork`](https://kubernetes.io/docs/concepts/policy/pod-security-policy/#host-network) |
| 主机端口的使用               | `hostPorts`                              |
| 主机 PID namespace 的使用  | `hostPID`                                |
| 主机 IPC namespace 的使用  | `hostIPC`                                |
| 主机路径的使用               | [`allowedHostPaths`](https://kubernetes.io/docs/concepts/policy/pod-security-policy/#allowed-host-paths) |
| 容器的 SELinux 上下文       | [`seLinux`](https://kubernetes.io/docs/concepts/policy/pod-security-policy/#selinux) |
| 用户 ID                 | [`runAsUser`](https://kubernetes.io/docs/concepts/policy/pod-security-policy/#runasuser) |
| 配置允许的补充组              | [`supplementalGroups`](https://kubernetes.io/docs/concepts/policy/pod-security-policy/#supplementalgroups) |
| 分配拥有 Pod 数据卷的 FSGroup | [`fsGroup`](https://kubernetes.io/docs/concepts/policy/pod-security-policy/#fsgroup) |
| 必须使用一个只读的 root 文件系统   | `readOnlyRootFilesystem`                 |

*Pod 安全策略* 由设置和策略组成，它们能够控制 Pod 访问的安全特征。这些设置分为如下三类：

- *基于布尔值控制*：这种类型的字段默认为最严格限制的值。
- *基于被允许的值集合控制*：这种类型的字段会与这组值进行对比，以确认值被允许。
- *基于策略控制*：设置项通过一种策略提供的机制来生成该值，这种机制能够确保指定的值落在被允许的这组值中。

### RunAsUser

- *MustRunAs* - 必须配置一个 `range`。使用该范围内的第一个值作为默认值。验证是否不在配置的该范围内。
- *MustRunAsNonRoot* - 要求提交的 Pod 具有非零 `runAsUser` 值，或在镜像中定义了 `USER` 环境变量。不提供默认值。
- *RunAsAny* - 没有提供默认值。允许指定任何 `runAsUser` 。

### SELinux

- *MustRunAs* - 如果没有使用预分配的值，必须配置 `seLinuxOptions`。默认使用 `seLinuxOptions`。验证 `seLinuxOptions`。
- *RunAsAny* - 没有提供默认值。允许任意指定的 `seLinuxOptions` ID。

### SupplementalGroups

- *MustRunAs* - 至少需要指定一个范围。默认使用第一个范围的最小值。验证所有范围的值。
- *RunAsAny* - 没有提供默认值。允许任意指定的 `supplementalGroups` ID。

### FSGroup

- *MustRunAs* - 至少需要指定一个范围。默认使用第一个范围的最小值。验证在第一个范围内的第一个 ID。
- *RunAsAny* - 没有提供默认值。允许任意指定的 `fsGroup` ID。

### 控制卷

通过设置 PSP 卷字段，能够控制具体卷类型的使用。当创建一个卷的时候，与该字段相关的已定义卷可以允许设置如下值：

1. azureFile
2. azureDisk
3. flocker
4. flexVolume
5. hostPath
6. emptyDir
7. gcePersistentDisk
8. awsElasticBlockStore
9. gitRepo
10. secret
11. nfs
12. iscsi
13. glusterfs
14. persistentVolumeClaim
15. rbd
16. cinder
17. cephFS
18. downwardAPI
19. fc
20. configMap
21. vsphereVolume
22. quobyte
23. photonPersistentDisk
24. projected
25. portworxVolume
26. scaleIO
27. storageos
28. \* (allow all volumes)

对新的 PSP，推荐允许的卷的最小集合包括：configMap、downwardAPI、emptyDir、persistentVolumeClaim、secret 和 projected。

### 主机网络

- *HostPorts*， 默认为 `empty`。`HostPortRange` 列表通过 `min`(包含) and `max`(包含) 来定义，指定了被允许的主机端口。

### 允许的主机路径

- *AllowedHostPaths* 是一个被允许的主机路径前缀的白名单。空值表示所有的主机路径都可以使用。

## 许可

包含 `PodSecurityPolicy` 的 *许可控制*，允许控制集群资源的创建和修改，基于这些资源在集群范围内被许可的能力。

许可使用如下的方式为 Pod 创建最终的安全上下文：

1. 检索所有可用的 PSP。
2. 生成在请求中没有指定的安全上下文设置的字段值。
3. 基于可用的策略，验证最终的设置。

如果某个策略能够匹配上，该 Pod 就被接受。如果请求与 PSP 不匹配，则 Pod 被拒绝。

Pod 必须基于 PSP 验证每个字段。

## 创建 Pod 安全策略

下面是一个 Pod 安全策略的例子，所有字段的设置都被允许：

```Yaml
apiVersion: extensions/v1beta1
kind: PodSecurityPolicy
metadata:
  name: permissive
spec:
  seLinux:
    rule: RunAsAny
  supplementalGroups:
    rule: RunAsAny
  runAsUser:
    rule: RunAsAny
  fsGroup:
    rule: RunAsAny
  hostPorts:
  - min: 8000
    max: 8080
  volumes:
  - '*'
```

下载示例文件可以创建该策略，然后执行如下命令：

```bash
$ kubectl create -f ./psp.yaml
podsecuritypolicy "permissive" created
```

## 获取 Pod 安全策略列表

获取已存在策略列表，使用 `kubectl get`：

```bash
$ kubectl get psp
NAME        PRIV   CAPS  SELINUX   RUNASUSER         FSGROUP   SUPGROUP  READONLYROOTFS  VOLUMES
permissive  false  []    RunAsAny  RunAsAny          RunAsAny  RunAsAny  false           [*]
privileged  true   []    RunAsAny  RunAsAny          RunAsAny  RunAsAny  false           [*]
restricted  false  []    RunAsAny  MustRunAsNonRoot  RunAsAny  RunAsAny  false           [emptyDir secret downwardAPI configMap persistentVolumeClaim projected]
```

## 修改 Pod 安全策略

通过交互方式修改策略，使用 `kubectl edit`：

```bash
$ kubectl edit psp permissive
```

该命令将打开一个默认文本编辑器，在这里能够修改策略。

## 删除 Pod 安全策略

一旦不再需要一个策略，很容易通过 `kubectl` 删除它：

```bash
$ kubectl delete psp permissive
podsecuritypolicy "permissive" deleted
```

## 启用 Pod 安全策略

为了能够在集群中使用 Pod 安全策略，必须确保如下：

1. 启用 API 类型 `extensions/v1beta1/podsecuritypolicy`（仅对 1.6 之前的版本）
2. 启用许可控制器 `PodSecurityPolicy`
3. 定义自己的策略

## 使用 RBAC

在 Kubernetes 1.5 或更新版本，可以使用 PodSecurityPolicy 来控制，对基于用户角色和组的已授权容器的访问。访问不同的 PodSecurityPolicy 对象，可以基于认证来控制。基于 Deployment、ReplicaSet 等创建的 Pod，限制访问 PodSecurityPolicy 对象，[Controller Manager](https://kubernetes.io/docs/admin/kube-controller-manager/) 必须基于安全 API 端口运行，并且不能够具有超级用户权限。

PodSecurityPolicy 认证使用所有可用的策略，包括创建 Pod 的用户，Pod 上指定的服务账户（service acount）。当 Pod 基于 Deployment、ReplicaSet 创建时，它是创建 Pod 的 Controller Manager，所以如果基于非安全 API 端口运行，允许所有的 PodSecurityPolicy 对象，并且不能够有效地实现细分权限。用户访问给定的 PSP 策略有效，仅当是直接部署 Pod 的情况。更多详情，查看 [PodSecurityPolicy RBAC 示例](https://git.k8s.io/kubernetes/examples/podsecuritypolicy/rbac/README.md)，当直接部署 Pod 时，应用 PodSecurityPolicy 控制基于角色和组的已授权容器的访问 。

原文地址：https://k8smeetup.github.io/docs/concepts/policy/pod-security-policy/

译者：[shirdrn](https://github.com/shirdrn)
