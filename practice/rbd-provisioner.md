# 使用rbd-provisioner提供rbd持久化存储

rbd-provisioner为kubernetes 1.5+版本提供了类似于`kubernetes.io/rbd`的ceph rbd持久化存储动态配置实现。

一些用户会使用kubeadm来部署集群，或者将kube-controller-manager以容器的方式运行。这种方式下，kubernetes在创建使用ceph rbd pv/pvc时没任何问题，但使用dynamic provisioning自动管理存储生命周期时会报错。提示`"rbd: create volume failed, err: failed to create rbd image: executable file not found in $PATH:"`。

问题来自gcr.io提供的kube-controller-manager容器镜像未打包ceph-common组件，缺少了rbd命令，因此无法通过rbd命令为pod创建rbd image，查了github的相关文章，目前kubernetes官方在kubernetes-incubator/external-storage项目通过External Provisioners的方式来解决此类问题。

本文主要针对该问题，通过rbd-provisioner的方式，解决ceph rbd的dynamic provisioning问题。

* 参考链接[RBD Volume Provisioner for Kubernetes 1.5+](https://github.com/kubernetes-incubator/external-storage/tree/master/ceph/rbd)

## 部署rbd-provisioner

首先得在kubernetes集群中安装rbd-provisioner，github仓库链接[https://github.com/kubernetes-incubator/external-storage](https://github.com/kubernetes-incubator/external-storage)

```bash
[root@k8s01 ~]# git clone https://github.com/kubernetes-incubator/external-storage.git
[root@k8s01 ~]# cd external-storage/ceph/rbd/deploy
[root@k8s01 deploy]# NAMESPACE=kube-system
[root@k8s01 deploy]# sed -r -i "s/namespace: [^ ]+/namespace: $NAMESPACE/g" ./rbac/clusterrolebinding.yaml ./rbac/rolebinding.yaml
[root@k8s01 deploy]# kubectl -n $NAMESPACE apply -f ./rbac
```

* 根据自己需要，修改rbd-provisioner的namespace；

部署完成后检查rbd-provisioner deployment，确保已经正常部署；

```bash
[root@k8s01 ~]# kubectl describe deployments.apps -n kube-system rbd-provisioner
Name:               rbd-provisioner
Namespace:          kube-system
CreationTimestamp:  Sat, 13 Oct 2018 20:08:45 +0800
Labels:             app=rbd-provisioner
Annotations:        deployment.kubernetes.io/revision: 1
                    kubectl.kubernetes.io/last-applied-configuration:
                      {"apiVersion":"extensions/v1beta1","kind":"Deployment","metadata":{"annotations":{},"name":"rbd-provisioner","namespace":"kube-system"},"s...
Selector:           app=rbd-provisioner
Replicas:           1 desired | 1 updated | 1 total | 1 available | 0 unavailable
StrategyType:       Recreate
MinReadySeconds:    0
Pod Template:
  Labels:           app=rbd-provisioner
  Service Account:  rbd-provisioner
  Containers:
   rbd-provisioner:
    Image:      quay.io/external_storage/rbd-provisioner:latest
    Port:       <none>
    Host Port:  <none>
    Environment:
      PROVISIONER_NAME:  ceph.com/rbd
    Mounts:              <none>
  Volumes:               <none>
Conditions:
  Type           Status  Reason
  ----           ------  ------
  Available      True    MinimumReplicasAvailable
OldReplicaSets:  <none>
NewReplicaSet:   rbd-provisioner-db574c5c (1/1 replicas created)
Events:          <none>
```

## 创建storageclass

部署完rbd-provisioner，还需要创建StorageClass。创建SC前，我们还需要创建相关用户的secret；

```bash
[root@k8s01 ~]# vi secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ceph-admin-secret
  namespace: kube-system
type: "kubernetes.io/rbd"
data:
  # ceph auth get-key client.admin | base64
  key: QVFCdng4QmJKQkFsSFJBQWl1c1o0TGdOV250NlpKQ1BSMHFCa1E9PQ==
---
apiVersion: v1
kind: Secret
metadata:
  name: ceph-secret
  namespace: kube-system
type: "kubernetes.io/rbd"
data:
  # ceph auth add client.kube mon 'allow r' osd 'allow rwx pool=kube'
  # ceph auth get-key client.kube | base64
  key: QVFCTHdNRmJueFZ4TUJBQTZjd1MybEJ2Q0JUcmZhRk4yL2tJQVE9PQ==

[root@k8s01 ~]#  kubectl create -f secrets.yaml

[root@k8s01 ~]# vi secrets-default.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ceph-secret
type: "kubernetes.io/rbd"
data:
  # ceph auth add client.kube mon 'allow r' osd 'allow rwx pool=kube'
  # ceph auth get-key client.kube | base64
  key: QVFCTHdNRmJueFZ4TUJBQTZjd1MybEJ2Q0JUcmZhRk4yL2tJQVE9PQ==

[root@k8s01 ~]#  kubectl create -f secrets-default.yaml -n default
```

* 创建secret保存client.admin和client.kube用户的key，client.admin和client.kube用户的secret可以放在kube-system namespace，但如果其他namespace需要使用ceph rbd的dynamic provisioning功能的话，要在相应的namespace创建secret来保存client.kube用户key信息；

```bash
[root@k8s01 ~]# vi ceph-rbd-sc.yaml
apiVersion: storage.k8s.io/v1beta1
kind: StorageClass
metadata:
  name: ceph-rbd
  annotations:
     storageclass.beta.kubernetes.io/is-default-class: "true"
provisioner: ceph.com/rbd
parameters:
  monitors: 172.16.16.81,172.16.16.82,172.16.16.83
  adminId: admin
  adminSecretName: ceph-admin-secret
  adminSecretNamespace: kube-system
  pool: rbd
  userId: kube
  userSecretName: ceph-secret
  fsType: ext4
  imageFormat: "2"
  imageFeatures: "layering"

[root@k8s01 ~]#  kubectl create -f  ceph-rbd-sc.yaml
```

* 其他设置和普通的ceph rbd StorageClass一致，但provisioner需要设置为`ceph.com/rbd`，不是默认的`kubernetes.io/rbd`，这样rbd的请求将由rbd-provisioner来处理；
* 考虑到兼容性，建议尽量关闭rbd image feature，并且kubelet节点的ceph-common版本尽量和ceph服务器端保持一致，我的环境都使用的L版本；

## 测试ceph rbd自动分配

在kube-system和default namespace分别创建pod，通过启动一个busybox实例，将ceph rbd镜像挂载到`/usr/share/busybox`；

```bash
[root@k8s01 ~]# vi test-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: ceph-pod1
spec:
  containers:
  - name: ceph-busybox
    image: busybox
    command: ["sleep", "60000"]
    volumeMounts:
    - name: ceph-vol1
      mountPath: /usr/share/busybox
      readOnly: false
  volumes:
  - name: ceph-vol1
    persistentVolumeClaim:
      claimName: ceph-claim
---
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: ceph-claim
spec:
  accessModes:  
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi

[root@k8s01 ~]# kubectl create -f test-pod.yaml -n kube-system
pod/ceph-pod1 created
persistentvolumeclaim/ceph-claim created
[root@k8s01 ~]# kubectl create -f test-pod.yaml -n default
pod/ceph-pod1 created
persistentvolumeclaim/ceph-claim created
```

检查pv和pvc的创建状态，是否都已经创建；

```bash
[root@k8s01 ~]# kubectl get pvc
NAME         STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
ceph-claim   Bound    pvc-ee0f1c35-cef7-11e8-8484-005056a33f16   2Gi        RWO            ceph-rbd       25s
[root@k8s01 ~]# kubectl get pvc -n kube-system
NAME         STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
ceph-claim   Bound    pvc-ea377cad-cef7-11e8-8484-005056a33f16   2Gi        RWO            ceph-rbd       36s
[root@k8s01 ~]# kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                    STORAGECLASS   REASON   AGE
pvc-ea377cad-cef7-11e8-8484-005056a33f16   2Gi        RWO            Delete           Bound    kube-system/ceph-claim   ceph-rbd                40s
pvc-ee0f1c35-cef7-11e8-8484-005056a33f16   2Gi        RWO            Delete           Bound    default/ceph-claim       ceph-rbd                32s
```

在ceph服务器上，检查rbd镜像创建情况和镜像的信息；

```bash
[root@k8s01 ~]# rbd ls --pool rbd
kubernetes-dynamic-pvc-ea390cbf-cef7-11e8-aa22-0a580af40202
kubernetes-dynamic-pvc-eef5814f-cef7-11e8-aa22-0a580af40202

[root@k8s01 ~]# rbd info rbd/kubernetes-dynamic-pvc-ea390cbf-cef7-11e8-aa22-0a580af40202
rbd image 'kubernetes-dynamic-pvc-ea390cbf-cef7-11e8-aa22-0a580af40202':
    size 2048 MB in 512 objects
    order 22 (4096 kB objects)
    block_name_prefix: rbd_data.456876b8b4567
    format: 2
    features: layering
    flags:
    create_timestamp: Sat Oct 13 22:54:41 2018
[root@k8s01 ~]# rbd info rbd/kubernetes-dynamic-pvc-eef5814f-cef7-11e8-aa22-0a580af40202
rbd image 'kubernetes-dynamic-pvc-eef5814f-cef7-11e8-aa22-0a580af40202':
    size 2048 MB in 512 objects
    order 22 (4096 kB objects)
    block_name_prefix: rbd_data.ad6c6b8b4567
    format: 2
    features: layering
    flags:
    create_timestamp: Sat Oct 13 22:54:49 2018
```

检查busybox内的文件系统挂载和使用情况，确认能正常工作；

```bash
[root@k8s01 ~]# kubectl exec -it ceph-pod1 mount |grep rbd
/dev/rbd0 on /usr/share/busybox type ext4 (rw,seclabel,relatime,stripe=1024,data=ordered)
[root@k8s01 ~]# kubectl exec -it -n kube-system ceph-pod1 mount |grep rbd
/dev/rbd0 on /usr/share/busybox type ext4 (rw,seclabel,relatime,stripe=1024,data=ordered)

[root@k8s01 ~]# kubectl exec -it -n kube-system ceph-pod1 df |grep rbd
/dev/rbd0              1998672      6144   1976144   0% /usr/share/busybox
[root@k8s01 ~]# kubectl exec -it ceph-pod1 df |grep rbd
/dev/rbd0              1998672      6144   1976144   0% /usr/share/busybox
```

测试删除pod能否自动删除pv和pvc，生产环境中谨慎，设置好回收策略；

```bash
[root@k8s01 ~]# kubectl delete -f test-pod.yaml
pod "ceph-pod1" deleted
persistentvolumeclaim "ceph-claim" deleted

[root@k8s01 ~]# kubectl delete -f test-pod.yaml -n kube-system
pod "ceph-pod1" deleted
persistentvolumeclaim "ceph-claim" deleted

[root@k8s01 ~]# kubectl get pv
No resources found.
[root@k8s01 ~]# kubectl get pvc
No resources found.
[root@k8s01 ~]# kubectl get pvc -n kube-system
No resources found.
```

ceph服务器上的rbd image也已清除，自动回收成功；

```bash
[root@k8s01 ~]# rbd ls --pool rbd
```

* 确认之前创建的rbd images都已经删除；

## 总结

大部分情况下，我们无需使用rbd provisioner来提供ceph rbd的dynamic provisioning能力。经测试，在OpenShift、Rancher、SUSE CaaS以及本Handbook的二进制文件方式部署，在安装好ceph-common软件包的情况下，定义StorageClass时使用`kubernetes.io/rbd`即可正常使用ceph rbd provisioning功能。

## 参考

- [RBD Volume Provisioner for Kubernetes 1.5+](https://github.com/kubernetes-incubator/external-storage/tree/master/ceph/rbd)