# 本地持久化存储

本地持久化卷允许用户通过标准 PVC 接口以简单便携的方式访问本地存储。PV 中包含系统用于将 Pod 安排到正确节点的节点亲和性信息。

一旦配置了本地卷，外部静态配置器（provisioner）可用于帮助简化本地存储管理。请注意，本地存储配置器与大多数配置器不同，并且尚不支持动态配置。相反，它要求管理员预先配置每个节点上的本地卷，并且这些卷应该是：

1. Filesystem volumeMode（默认）PV—— 将它们挂载到发现目录下。
2. Block volumeMode PV——在发现目录下为节点上的块设备创建一个符号链接。

配置器将通过为每个卷创建和清除 PersistentVolumes 来管理发现目录下的卷。

## 配置要求

- 本地卷插件希望路径稳定，包括在重新启动时和添加或删除磁盘时。
- 静态配置器仅发现挂载点（对于文件系统模式卷）或符号链接（对于块模式卷）。对于基于目录的本地卷必须绑定到发现目录中。

## 版本兼容性

推荐配置器版本与Kubernetes版本

| Provisioner version                                          | K8s version | Reason                  |
| ------------------------------------------------------------ | ----------- | ----------------------- |
| [2.1.0](https://github.com/kubernetes-incubator/external-storage/tree/local-volume-provisioner-v2.1.0/local-volume) | 1.10        | Beta API default, block |
| [2.0.0](https://github.com/kubernetes-incubator/external-storage/tree/local-volume-provisioner-v2.0.0/local-volume) | 1.8, 1.9    | Mount propagation       |
| [1.0.1](https://github.com/kubernetes-incubator/external-storage/tree/local-volume-provisioner-v1.0.1/local-volume) | 1.7         |                         |

## K8s功能状态

另请参阅[已知问题](https://github.com/kubernetes-incubator/external-storage/blob/master/local-volume/KNOWN_ISSUES.md)和 [CHANGELOG](https://github.com/kubernetes-incubator/external-storage/blob/master/local-volume/CHANGELOG.md)。

### 1.10：Beta

- 添加了新的 `PV.NodeAffinity` 字段。
- **重要：** Alpha PV NodeAffinity annotation 已弃用。用户必须手动更新其 PV 以使用新的 NodeAffinity字段或运行[一次性更新作业](https://github.com/kubernetes-incubator/external-storage/blob/master/local-volume/utils/update-pv-to-beta)。
- Alpha：添加了对 raw block 的支持。

### 1.9：Alpha

- 新的 StorageClass `volumeBindingMode` 参数将延迟PVC绑定，直到 pod 被调度。

### 1.7：Alpha

- 新的`local` PersistentVolume 源，允许指定具有 node affinity 的目录或挂载点。
- 使用绑定到该 PV 的 PVC 的 Pod 将始终调度到该节点。

### 未来的功能

- 本地块设备作为卷源，具有分区和 fs 格式化
- 共享本地持久化存储的动态资源调配
- 当地 PV 健康监测、污点和容忍
- 内联 PV（使用专用本地磁盘作为临时存储）

## 用户指南

这些说明反映了最新版本的代码库。有关旧版本的说明，请参阅[版本兼容性](https://github.com/kubernetes-incubator/external-storage/tree/master/local-volume#version-compatibility)下的版本链接。

### 步骤1：使用本地磁盘启动集群

#### 启用alpha feature gate

##### 1.10+

如果需要原始的本地块功能，

```bash
export KUBE_FEATURE_GATES ="BlockVolume = true"
```

注意：1.10 之前的 Kubernetes 版本需要[几个附加 feature gate](https://github.com/kubernetes-incubator/external-storage/tree/local-volume-provisioner-v2.0.0/local-volume#enabling-the-alpha-feature-gates)，因为持久的本地卷和其他功能处于 alpha 版本。

#### 选项1：裸金属环境

1. 根据应用程序的要求对每个节点上的磁盘进行分区和格式化。
2. 根据 StorageClass 将所有文件系统挂载到同一个目录下。目录在 configmap 中指定，见下文。
3. 使用 `KUBE_FEATURE_GATES `配置 Kubernetes API server、controller manager、scheduler 和所有kubelet，[如上所述](https://github.com/kubernetes-incubator/external-storage/tree/master/local-volume#enabling-the-alpha-feature-gates)。
4. 如果不使用默认 Kubernetes 调度程序策略，则必须启用以下谓词：
   - 1.9之前：`NoVolumeBindConflict`
   - 1.9+：`VolumeBindingChecker`

#### 选项2：本地测试集群

1. 创建 `/mnt/disks `目录并将多个卷挂载到其子目录。下面的示例使用三个 ram 磁盘来模拟真实的本地卷：

   ```bash
   mkdir/mnt/disks
   vol for vol1 vol2 vol3;do
   mkdir/mnt/disks/$vol
   mount -t tmpfs $vol/mnt/disks/$vol
   DONE
   ```

2. 运行本地集群。

   ```bash
   $ALLOW_PRIVILEGED = true LOG_LEVEL = 5 FEATURE_GATES = $KUBE_FEATURE_GATES hack/local-up-cluster.sh
   ```

### 步骤2：创建StorageClass（1.9+）

要延迟卷绑定，直到 pod 被调度，并在单个 pod 中处理多个本地 PV，必须使用设置为 `WaitForFirstConsumer` 的 `volumeBindingMode` 创建 StorageClass。

```bash
$kubectl create -f provisioner/deployment/kubernetes/example/default_example_storageclass.yaml
```

### 步骤3：创建本地持久卷

#### 选项1：使用本地卷静态配置器

1. 生成 Provisioner 的 ServiceAccount、Role、DaemonSet 和 ConfigMap 规范，并对其进行自定义。

   这一步使用 helm 模板来生成规格。有关安装说明，请参阅[helm readme](https://github.com/kubernetes-incubator/external-storage/blob/master/local-volume/helm)。要使用[默认值](https://github.com/kubernetes-incubator/external-storage/blob/master/local-volume/helm/provisioner/values.yaml)生成配置器的规格，请运行：

   ```bash
   helm template ./helm/provisioner > ./provisioner/deployment/kubernetes/provisioner_generated.yaml
   ```

   您也可以提供一个自定义值文件：

   ```bash
   helm template ./helm/provisioner --values custom-values.yaml > ./provisioner/deployment/kubernetes/provisioner_generated.yaml
   ```

2. 部署配置程序

   如果用户对 Provisioner 的 yaml 文件的内容感到满意，可以用 **kubectl** 创建 Provisioner 的 DaemonSet 和 ConfigMap。

   ```bash
   $kubectl create -f ./provisioner/deployment/kubernetes/provisioner_generated.yaml
   ```

3. 检查发现的本地卷

   一旦启动，外部静态配置器将发现并创建本地 PV。

   例如，如果目录 `/mnt/disks/` 包含一个目录 `/mnt/disks/vol1`，则静态配置器会创建以下本地卷 PV：

   ```bash
   $ kubectl get pv
   NAME                CAPACITY    ACCESSMODES   RECLAIMPOLICY   STATUS      CLAIM     STORAGECLASS    REASON    AGE
   local-pv-ce05be60   1024220Ki   RWO           Delete          Available             local-storage             26s

   $ kubectl describe pv local-pv-ce05be60 
   Name:		local-pv-ce05be60
   Labels:		<none>
   Annotations:	pv.kubernetes.io/provisioned-by=local-volume-provisioner-minikube-18f57fb2-a186-11e7-b543-080027d51893
   StorageClass:	local-fast
   Status:		Available
   Claim:		
   Reclaim Policy:	Delete
   Access Modes:	RWO
   Capacity:	1024220Ki
   NodeAffinity:
     Required Terms:
         Term 0:  kubernetes.io/hostname in [my-node]
   Message:	
   Source:
       Type:	LocalVolume (a persistent volume backed by local storage on a node)
       Path:	/mnt/disks/vol1
   Events:		<none>
   ```

   上面描述的 PV 可以通过引用 `local-fast` storageClassName 声明和绑定到 PVC。

#### 选项2：手动创建本地持久化卷

有关示例 PersistentVolume 规范，请参阅[Kubernetes文档](https://kubernetes.io/docs/concepts/storage/volumes/#local)。

### 步骤4：创建本地持久卷声明

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: example-local-claim
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: local-storage
```

请替换以下元素以反映您的配置：

- 卷所需的存储容量“5Gi”
- “local-storage”，与本地 PV 关联的存储类名称应该用于满足此 PVC

对于试图声明 “Block” PV 的 “Block” volumeMode PVC，可以使用以下示例：

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: example-local-claim
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  volumeMode: Block
  storageClassName: local-storage
```

请注意，此处唯一需要注意的字段是 volumeMode，它已被设置为“Block”。

## 最佳实践

- 对于IO隔离，建议每个卷使用整个磁盘
- 对于容量隔离，建议使用单个分区
- 避免重新创建具有相同节点名称的节点，而仍然存在指定了该节点亲和性的旧 PV。否则，系统可能认为新节点包含旧的 PV。
- 对于带有文件系统的卷，建议在 fstab 条目和该挂载点的目录名称中使用它们的 UUID（例如 `ls -l/dev/disk/by-uuid ` 的输出）。这种做法可确保即使设备路径发生变化（例如，如果 `/dev/sda1` 在添加新磁盘时变为 `/dev/sdb1`），也不会错误地挂在本地卷。此外，这种做法将确保如果创建具有相同名称的另一个节点，则该节点上的任何卷都是唯一的，而不会误认为是具有相同名称的另一个节点上的卷。
- 对于没有文件系统的 raw block 卷，使用唯一的 ID 作为符号链接名称。根据您的环境，`/dev/disk/by-id/ `中的卷 ID 可能包含唯一的硬件序列号。否则，应该生成一个唯一的 ID。符号链接名称的唯一性将确保如果创建具有相同名称的另一个节点，则该节点上的任何卷都是唯一的，而不会误认为是具有相同名称的另一个节点上的卷。

### 删除/清理底层卷

当您想要停用本地卷时，以下是可能的工作流程。

1. 停止使用卷的 pod
2. 从节点中删除本地卷（即卸载、拔出磁盘等）
3. 删除 PVC
4. 供应商将尝试清理卷，但由于卷不再存在而会失败
5. 手动删除 PV 对象

## 参考

- [Local Persistent Storage User Guide](https://github.com/kubernetes-incubator/external-storage/tree/master/local-volume)
