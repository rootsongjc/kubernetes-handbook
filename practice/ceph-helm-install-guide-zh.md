# 用Helm托管安装Ceph集群并提供后端存储
本文翻译自Ceph[官方文档](http://docs.ceph.com/docs/master/start/kube-helm/)，括号内的内容为注释。
## 安装
 [ceph-helm ](https://github.com/ceph/ceph-helm/)项目可让你在Kubernetes 环境以托管方式部署Ceph . 本文档假定Kubernetes 环境已经可用。

## 当前的限制
* Public网络和Cluster网络必须是同一个网络
* 如果 storage class 用户标识不是admin, 则必须在Ceph集群中手动创建用户并在Kubernetes中创建其secret
* ceph-mgr只能运行1个replica

## 安装并使用Helm
可以按照此说明[instructions](https://github.com/kubernetes/helm/blob/master/docs/install.md)安装Helm。

Helm通过从本地读取Kubernetes配置文件来查找Kubernetes集群; 确保文件已下载和且helm客户端可以访问。

Kubernetes群集必须配置并运行Tiller服务器，并且须将本地Helm客户端网络可达。查看[init](https://github.com/kubernetes/helm/blob/master/docs/helm/helm_init.md)的Helm文档获取帮助。要在本地运行Tiller并将Helm连接到它，请运行如下命令（此命令会在Kubernetes集群部署一个tiller实例）：

```bash
$ helm init
```
ceph-helm项目默认使用本地的Helm repo来存储charts。要启动本地Helm repo服务器，请运行：
```bash
$ helm serve &
$ helm repo add local http://localhost:8879/charts
```
## 添加Ceph-Helm charts到本地repo
```bash
$ git clone https://github.com/ceph/ceph-helm
$ cd ceph-helm/ceph
$ make
```
## 配置Ceph集群
创建一个包含Ceph配置的ceph-overrides.yaml文件。这个文件可能存在于任何地方，本文档默认此文件在用户的home目录中。
```bash
$ cat ~/ceph-overrides.yaml
```
```yaml
network:
  public:   172.21.0.0/20
  cluster:   172.21.0.0/20

osd_devices:
  - name: dev-sdd
    device: /dev/sdd
    zap: "1"
  - name: dev-sde
    device: /dev/sde
    zap: "1"

storageclass:
  name: ceph-rbd
  pool: rbd
  user_id: k8s
```
**注意** 如果未设置日志（journal）设备，它将与device设备同位置。另ceph-helm/ceph/ceph/values.yaml文件包含所有可配置的选项。

## 创建Ceph 集群的namespace
默认情况下，ceph-helm组件在Kubernetes的ceph namespace中运行。如果要自定义，请自定义namespace的名称，默认namespace请运行：
```bash
$ kubectl create namespace ceph
```

## 配置RBAC权限
Kubernetes> = v1.6使RBAC成为默认的admission controller。ceph-helm要为每个组件提供RBAC角色和权限：
```bash
$ kubectl create -f ~/ceph-helm/ceph/rbac.yaml
```
rbac.yaml文件假定Ceph集群将部署在ceph命名空间中。

## 给Kubelet节点打标签
需要设置以下标签才能部署Ceph集群：
```
ceph-mon=enabled
ceph-mgr=enabled
ceph-osd=enabled
ceph-osd-device-<name>=enabled
```
ceph-osd-device-标签是基于我们的ceph-overrides.yaml中定义的osd_devices名称值创建的。从我们下面的例子中，我们将得到以下两个标签：ceph-osd-device-dev-sdb和ceph-osd-device-dev-sdc。

每个 Ceph Monitor节点:
```bash
$ kubectl label node <nodename> ceph-mon=enabled ceph-mgr=enabled
```
每个 OSD node节点:
```bash
$ kubectl label node <nodename> ceph-osd=enabled ceph-osd-device-dev-sdb=enabled ceph-osd-device-dev-sdc=enabled
```
## Ceph 部署
运行helm install命令来部署Ceph：
```bash
$ helm install --name=ceph local/ceph --namespace=ceph -f ~/ceph-overrides.yaml
NAME:   ceph
LAST DEPLOYED: Wed Oct 18 22:25:06 2017
NAMESPACE: ceph
STATUS: DEPLOYED

RESOURCES:
==> v1/Secret
NAME                    TYPE    DATA  AGE
ceph-keystone-user-rgw  Opaque  7     1s

==> v1/ConfigMap
NAME              DATA  AGE
ceph-bin-clients  2     1s
ceph-bin          24    1s
ceph-etc          1     1s
ceph-templates    5     1s

==> v1/Service
NAME      CLUSTER-IP      EXTERNAL-IP  PORT(S)   AGE
ceph-mon  None            <none>       6789/TCP  1s
ceph-rgw  10.101.219.239  <none>       8088/TCP  1s

==> v1beta1/DaemonSet
NAME              DESIRED  CURRENT  READY  UP-TO-DATE  AVAILABLE  NODE-SELECTOR                                     AGE
ceph-mon          3        3        0      3           0          ceph-mon=enabled                                  1s
ceph-osd-dev-sde  3        3        0      3           0          ceph-osd-device-dev-sde=enabled,ceph-osd=enabled  1s
ceph-osd-dev-sdd  3        3        0      3           0          ceph-osd-device-dev-sdd=enabled,ceph-osd=enabled  1s

==> v1beta1/Deployment
NAME                  DESIRED  CURRENT  UP-TO-DATE  AVAILABLE  AGE
ceph-mds              1        1        1           0          1s
ceph-mgr              1        1        1           0          1s
ceph-mon-check        1        1        1           0          1s
ceph-rbd-provisioner  2        2        2           0          1s
ceph-rgw              1        1        1           0          1s

==> v1/Job
NAME                                 DESIRED  SUCCESSFUL  AGE
ceph-mgr-keyring-generator           1        0           1s
ceph-mds-keyring-generator           1        0           1s
ceph-osd-keyring-generator           1        0           1s
ceph-rgw-keyring-generator           1        0           1s
ceph-mon-keyring-generator           1        0           1s
ceph-namespace-client-key-generator  1        0           1s
ceph-storage-keys-generator          1        0           1s

==> v1/StorageClass
NAME     TYPE
ceph-rbd  ceph.com/rbd
```
helm install的输出显示了将要部署的不同类型的资源。

将使用ceph-rbd-provisioner Pod创建ceph.com/rbd类型的名为ceph-rbd的StorageClass。这允许创建PVC时自动提供RBD。第一次挂载时，RBD设备将被格式化（format）。所有RBD设备都将使用ext4文件系统。ceph.com/rbd不支持fsType选项。默认情况下，RBD将使用镜像格式2和镜像分层特性。可以在values文件中覆盖以下storageclass的默认值：

```yaml
storageclass:
  name: ceph-rbd
  pool: rbd
  user_id: k8s
  user_secret_name: pvc-ceph-client-key
  image_format: "2"
  image_features: layering
```
使用下面的命令检查所有Pod是否正常运行。这可能需要几分钟时间：

```bash
$ kubectl -n ceph get pods
NAME                                    READY     STATUS    RESTARTS   AGE
ceph-mds-3804776627-976z9               0/1       Pending   0          1m
ceph-mgr-3367933990-b368c               1/1       Running   0          1m
ceph-mon-check-1818208419-0vkb7         1/1       Running   0          1m
ceph-mon-cppdk                          3/3       Running   0          1m
ceph-mon-t4stn                          3/3       Running   0          1m
ceph-mon-vqzl0                          3/3       Running   0          1m
ceph-osd-dev-sdd-6dphp                  1/1       Running   0          1m
ceph-osd-dev-sdd-6w7ng                  1/1       Running   0          1m
ceph-osd-dev-sdd-l80vv                  1/1       Running   0          1m
ceph-osd-dev-sde-6dq6w                  1/1       Running   0          1m
ceph-osd-dev-sde-kqt0r                  1/1       Running   0          1m
ceph-osd-dev-sde-lp2pf                  1/1       Running   0          1m
ceph-rbd-provisioner-2099367036-4prvt   1/1       Running   0          1m
ceph-rbd-provisioner-2099367036-h9kw7   1/1       Running   0          1m
ceph-rgw-3375847861-4wr74               0/1       Pending   0          1m
```
**注意** 因为我们没有用ceph-rgw = enabled或ceph-mds = enabled 给节点打标签（ceph对象存储特性需要ceph-rgw，cephfs特性需要ceph-mds），因此MDS和RGW Pod都处于pending状态，一旦其他Pod都在运行状态，请用如下命令从某个MON节点检查Ceph的集群状态：
```bash
$ kubectl -n ceph exec -ti ceph-mon-cppdk -c ceph-mon -- ceph -s
cluster:
  id:     e8f9da03-c2d2-4ad3-b807-2a13d0775504
  health: HEALTH_OK

services:
  mon: 3 daemons, quorum mira115,mira110,mira109
  mgr: mira109(active)
  osd: 6 osds: 6 up, 6 in

data:
  pools:   0 pools, 0 pgs
  objects: 0 objects, 0 bytes
  usage:   644 MB used, 5555 GB / 5556 GB avail
  pgs:
```
## 配置一个POD以便从Ceph申请使用一个持久卷
为〜/ ceph-overwrite.yaml中定义的k8s用户创建一个密钥环，并将其转换为base64：
```bash
$ kubectl -n ceph exec -ti ceph-mon-cppdk -c ceph-mon -- bash
# ceph auth get-or-create-key client.k8s mon 'allow r' osd 'allow rwx pool=rbd'  | base64
QVFCLzdPaFoxeUxCRVJBQUVEVGdHcE9YU3BYMVBSdURHUEU0T0E9PQo=
# exit
```
编辑ceph namespace中存在的用户secret：
```bash
$ kubectl -n ceph edit secrets/pvc-ceph-client-key
```
将base64值复制到key位置的值并保存：:
```yaml
apiVersion: v1
data:
  key: QVFCLzdPaFoxeUxCRVJBQUVEVGdHcE9YU3BYMVBSdURHUEU0T0E9PQo=
kind: Secret
metadata:
  creationTimestamp: 2017-10-19T17:34:04Z
  name: pvc-ceph-client-key
  namespace: ceph
  resourceVersion: "8665522"
  selfLink: /api/v1/namespaces/ceph/secrets/pvc-ceph-client-key
  uid: b4085944-b4f3-11e7-add7-002590347682
type: kubernetes.io/rbd
```
我们创建一个在default namespace中使用RBD的Pod。将用户secret从ceph namespace复制到default namespace：
```bash
$ kubectl -n ceph get secrets/pvc-ceph-client-key -o json | jq '.metadata.namespace = "default"' | kubectl create -f -
secret "pvc-ceph-client-key" created
$ kubectl get secrets
NAME                  TYPE                                  DATA      AGE
default-token-r43wl   kubernetes.io/service-account-token   3         61d
pvc-ceph-client-key   kubernetes.io/rbd                     1         20s
```
创建并初始化RBD池：
```bash
$ kubectl -n ceph exec -ti ceph-mon-cppdk -c ceph-mon -- ceph osd pool create rbd 256
pool 'rbd' created
$ kubectl -n ceph exec -ti ceph-mon-cppdk -c ceph-mon -- rbd pool init rbd
```
**重要** 重要的 Kubernetes使用RBD内核模块将RBD映射到主机。Luminous需要CRUSH_TUNABLES 5（Jewel）。这些可调参数的最小内核版本是4.5。如果您的内核不支持这些可调参数，请运行ceph osd crush tunables hammer。

**重要** 由于RBD映射到主机系统上。主机需要能够解析由kube-dns服务管理的ceph-mon.ceph.svc.cluster.local名称。要获得kube-dns服务的IP地址，运行kubectl -n kube-system get svc/kube-dns。

创建一个PVC：

```bash
$ cat pvc-rbd.yaml
```
```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: ceph-pvc
spec:
  accessModes:
   - ReadWriteOnce
  resources:
    requests:
       storage: 20Gi
  storageClassName: ceph-rbd
```
```bash
$ kubectl create -f pvc-rbd.yaml
persistentvolumeclaim "ceph-pvc" created
$ kubectl get pvc
NAME       STATUS    VOLUME                                     CAPACITY   ACCESSMODES   STORAGECLASS   AGE
ceph-pvc   Bound     pvc-1c2ada50-b456-11e7-add7-002590347682   20Gi       RWO           ceph-rbd        3s
```
检查集群上是否已创建RBD：
```bash
$ kubectl -n ceph exec -ti ceph-mon-cppdk -c ceph-mon -- rbd ls
kubernetes-dynamic-pvc-1c2e9442-b456-11e7-9bd2-2a4159ce3915
$ kubectl -n ceph exec -ti ceph-mon-cppdk -c ceph-mon -- rbd info kubernetes-dynamic-pvc-1c2e9442-b456-11e7-9bd2-2a4159ce3915
rbd image 'kubernetes-dynamic-pvc-1c2e9442-b456-11e7-9bd2-2a4159ce3915':
    size 20480 MB in 5120 objects
    order 22 (4096 kB objects)
    block_name_prefix: rbd_data.10762ae8944a
    format: 2
    features: layering
    flags:
    create_timestamp: Wed Oct 18 22:45:59 2017
```
创建一个使用此PVC的Pod：
```bash
$ cat pod-with-rbd.yaml
```
```yaml
kind: Pod
apiVersion: v1
metadata:
  name: mypod
spec:
  containers:
    - name: busybox
      image: busybox
      command:
        - sleep
        - "3600"
      volumeMounts:
      - mountPath: "/mnt/rbd"
        name: vol1
  volumes:
    - name: vol1
      persistentVolumeClaim:
        claimName: ceph-pvc
```
```bash
$ kubectl create -f pod-with-rbd.yaml
pod "mypod" created
```
检查Pod：
```bash
$ kubectl get pods
NAME      READY     STATUS    RESTARTS   AGE
mypod     1/1       Running   0          17s
$ kubectl exec mypod -- mount | grep rbd
/dev/rbd0 on /mnt/rbd type ext4 (rw,relatime,stripe=1024,data=ordered)
```
## 日志

可以通过kubectl logs [-f]命令访问OSD和Monitor日志。Monitors有多个日志记录流，每个流都可以从ceph-mon Pod中的容器访问。

在ceph-mon Pod中有3个容器运行：ceph-mon，相当于物理机上的ceph-mon.hostname.log，cluster-audit-log-tailer相当于物理机上的ceph.audit.log，cluster-log-tailer相当于物理机上的ceph.log或ceph -w。每个容器都可以通过--container或-c选项访问。例如，要访问cluster-tail-log，可以运行：
```bash
$ kubectl -n ceph logs ceph-mon-cppdk -c cluster-log-tailer
```
