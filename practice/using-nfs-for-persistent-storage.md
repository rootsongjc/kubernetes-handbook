# 利用NFS动态提供Kubernetes后端存储卷
本文翻译自nfs-client-provisioner的[说明文档](https://github.com/kubernetes-incubator/external-storage/tree/master/nfs-client)，本文将介绍使用nfs-client-provisioner这个应用，利用NFS Server给Kubernetes作为持久存储的后端，并且动态提供PV。前提条件是有已经安装好的NFS服务器，并且NFS服务器与Kubernetes的Slave节点都能网络连通。
所有下文用到的文件来自于`git clone  https://github.com/kubernetes-incubator/external-storage.git`的nfs-client目录。
## nfs-client-provisioner
nfs-client-provisioner 是一个Kubernetes的简易NFS的外部provisioner，本身不提供NFS，需要现有的NFS服务器提供存储

- PV以 `${namespace}-${pvcName}-${pvName}`的命名格式提供（在NFS服务器上）
- PV回收的时候以 `archieved-${namespace}-${pvcName}-${pvName}` 的命名格式（在NFS服务器上）

## 安装部署
- 修改deployment文件并部署 `deploy/deployment.yaml`

需要修改的地方只有NFS服务器所在的IP地址（10.10.10.60），以及NFS服务器共享的路径（`/ifs/kubernetes`），两处都需要修改为你实际的NFS服务器和共享目录
```yaml
kind: Deployment
apiVersion: extensions/v1beta1
metadata:
  name: nfs-client-provisioner
spec:
  replicas: 1
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: nfs-client-provisioner
    spec:
      serviceAccountName: nfs-client-provisioner
      containers:
        - name: nfs-client-provisioner
          image: quay.io/external_storage/nfs-client-provisioner:latest
          volumeMounts:
            - name: nfs-client-root
              mountPath: /persistentvolumes
          env:
            - name: PROVISIONER_NAME
              value: fuseim.pri/ifs
            - name: NFS_SERVER
              value: 10.10.10.60
            - name: NFS_PATH
              value: /ifs/kubernetes
      volumes:
        - name: nfs-client-root
          nfs:
            server: 10.10.10.60
            path: /ifs/kubernetes
```

- 修改StorageClass文件并部署 `deploy/class.yaml`

此处可以不修改，或者修改provisioner的名字，需要与上面的deployment的PROVISIONER_NAME名字一致。
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: managed-nfs-storage
provisioner: fuseim.pri/ifs
```

##  授权

如果您的集群启用了RBAC，或者您正在运行OpenShift，则必须授权provisioner。 如果你在非默认的“default”名称空间/项目之外部署，可以编辑`deploy/auth/clusterrolebinding.yaml`或编辑`oadm policy“指令。

### 如果启用了RBAC

需要执行如下的命令来授权。
```bash
$ kubectl create -f deploy/auth/serviceaccount.yaml
serviceaccount "nfs-client-provisioner" created
$ kubectl create -f deploy/auth/clusterrole.yaml
clusterrole "nfs-client-provisioner-runner" created
$ kubectl create -f deploy/auth/clusterrolebinding.yaml
clusterrolebinding "run-nfs-client-provisioner" created
$ kubectl patch deployment nfs-client-provisioner -p '{"spec":{"template":{"spec":{"serviceAccount":"nfs-client-provisioner"}}}}'
```

##  测试
测试创建PVC
- `kubectl create -f deploy/test-claim.yaml`

测试创建POD
- `kubectl create -f deploy/test-pod.yaml`

在NFS服务器上的共享目录下的卷子目录中检查创建的NFS PV卷下是否有"SUCCESS" 文件。

删除测试POD
- `kubectl delete -f deploy/test-pod.yaml`

删除测试PVC
- `kubectl delete -f deploy/test-claim.yaml`

在NFS服务器上的共享目录下查看NFS的PV卷回收以后是否名字以archived开头。

## 我的示例

* NFS服务器配置
```bash
# cat /etc/exports 
```
```ini
/media/docker		*(no_root_squash,rw,sync,no_subtree_check)
```

* nfs-deployment.yaml示例

NFS服务器的地址是ubuntu-master,共享出来的路径是/media/docker，其他不需要修改。

```bash
# cat nfs-deployment.yaml
```

```yaml
kind: Deployment
apiVersion: extensions/v1beta1
metadata:
  name: nfs-client-provisioner
spec:
  replicas: 1
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: nfs-client-provisioner
    spec:
      serviceAccountName: nfs-client-provisioner
      containers:
        - name: nfs-client-provisioner
          image: quay.io/external_storage/nfs-client-provisioner:latest
          volumeMounts:
            - name: nfs-client-root
              mountPath: /persistentvolumes
          env:
            - name: PROVISIONER_NAME
              value: fuseim.pri/ifs
            - name: NFS_SERVER
              value: ubuntu-master
            - name: NFS_PATH
              value: /media/docker
      volumes:
        - name: nfs-client-root
          nfs:
            server: ubuntu-master
            path: /media/docker
```
* StorageClass示例

可以修改Class的名字，我的改成了default。

```bash
# cat class.yaml 
```
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: default
provisioner: fuseim.pri/ifs
```
* 查看StorageClass

```bash
# kubectl get sc
NAME             PROVISIONER               AGE
default          fuseim.pri/ifs            2d
```

* 设置这个default名字的SC为Kubernetes的默认存储后端

```bash
# kubectl patch storageclass default -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
storageclass.storage.k8s.io "default" patched
# kubectl get sc
NAME                PROVISIONER               AGE
default (default)   fuseim.pri/ifs            2d
```

* 测试创建PVC

查看pvc文件
```bash
# cat test-claim.yaml 
```
```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: test-claim
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 1Mi
```
创建PVC
```bash
# kubectl apply -f test-claim.yaml 
persistentvolumeclaim "test-claim" created
root@Ubuntu-master:~/kubernetes/nfs# kubectl get pvc|grep test
test-claim                  Bound     pvc-fe3cb938-3f15-11e8-b61d-08002795cb26   1Mi        RWX            default        10s
# kubectl get pv|grep test
pvc-fe3cb938-3f15-11e8-b61d-08002795cb26   1Mi        RWX            Delete           Bound     default/test-claim                  default                  58s
```
* 启动测试POD

POD文件如下，作用就是在test-claim的PV里touch一个SUCCESS文件。
```bash
# cat test-pod.yaml
```
```yaml
kind: Pod
apiVersion: v1
metadata:
  name: test-pod
spec:
  containers:
  - name: test-pod
    image: gcr.io/google_containers/busybox:1.24
    command:
      - "/bin/sh"
    args:
      - "-c"
      - "touch /mnt/SUCCESS && exit 0 || exit 1"
    volumeMounts:
      - name: nfs-pvc
        mountPath: "/mnt"
  restartPolicy: "Never"
  volumes:
    - name: nfs-pvc
      persistentVolumeClaim:
        claimName: test-claim
```

启动POD，一会儿POD就是completed状态，说明执行完毕。

```bash
# kubectl apply -f test-pod.yaml 
pod "test-pod" created
kubectl get pod|grep test
test-pod                                                  0/1       Completed   0          40s
```

我们去NFS共享目录查看有没有SUCCESS文件。

```bash
# cd default-test-claim-pvc-fe3cb938-3f15-11e8-b61d-08002795cb26
# ls
SUCCESS
```

说明部署正常，并且可以动态分配NFS的共享卷。
