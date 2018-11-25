# 使用glusterfs做持久化存储

我们复用kubernetes的三台主机做glusterfs存储。

以下步骤参考自：`https://www.xf80.com/2017/04/21/kubernetes-glusterfs/`（该网站已无法访问）

## 安装glusterfs

我们直接在物理机上使用yum安装，如果你选择在kubernetes上安装，请参考：https://github.com/gluster/gluster-kubernetes/blob/master/docs/setup-guide.md

```bash
# 先安装 gluster 源
$ yum install centos-release-gluster -y

# 安装 glusterfs 组件
$ yum install -y glusterfs glusterfs-server glusterfs-fuse glusterfs-rdma glusterfs-geo-replication glusterfs-devel

## 创建 glusterfs 目录
$ mkdir /opt/glusterd

## 修改 glusterd 目录
$ sed -i 's/var\/lib/opt/g' /etc/glusterfs/glusterd.vol

# 启动 glusterfs
$ systemctl start glusterd.service

# 设置开机启动
$ systemctl enable glusterd.service

#查看状态
$ systemctl status glusterd.service
```

## 配置 glusterfs

```Bash
# 配置 hosts

$ vi /etc/hosts
172.20.0.113   test-001.jimmysong.io 
172.20.0.114   test-002.jimmysong.io 
172.20.0.115   test-003.jimmysong.io 
```

```bash
# 开放端口
$ iptables -I INPUT -p tcp --dport 24007 -j ACCEPT

# 创建存储目录
$ mkdir /opt/gfs_data
```

```bash
# 添加节点到 集群
# 执行操作的本机不需要probe 本机
[root@test-001 ~]#
gluster peer probe test-002.jimmysong.io
gluster peer probe test-003.jimmysong.io

# 查看集群状态
$ gluster peer status
Number of Peers: 2

Hostname: test-002.jimmysong.io
Uuid: f25546cc-2011-457d-ba24-342554b51317
State: Peer in Cluster (Connected)

Hostname: test-003.jimmysong.io
Uuid: 42b6cad1-aa01-46d0-bbba-f7ec6821d66d
State: Peer in Cluster (Connected)
```

## 配置 volume

GlusterFS中的volume的模式有很多中，包括以下几种：

- **分布卷（默认模式）**：即DHT, 也叫 分布卷: 将文件已hash算法随机分布到 一台服务器节点中存储。
- **复制模式**：即AFR, 创建volume 时带 replica x 数量: 将文件复制到 replica x 个节点中。
- **条带模式**：即Striped, 创建volume 时带 stripe x 数量： 将文件切割成数据块，分别存储到 stripe x 个节点中 ( 类似raid 0 )。
- **分布式条带模式**：最少需要4台服务器才能创建。 创建volume 时 stripe 2 server = 4 个节点： 是DHT 与 Striped 的组合型。
- **分布式复制模式**：最少需要4台服务器才能创建。 创建volume 时 replica 2 server = 4 个节点：是DHT 与 AFR 的组合型。
- **条带复制卷模式**：最少需要4台服务器才能创建。 创建volume 时 stripe 2 replica 2 server = 4 个节点： 是 Striped 与 AFR 的组合型。
- **三种模式混合**： 至少需要8台 服务器才能创建。 stripe 2 replica 2 , 每4个节点 组成一个 组。

这几种模式的示例图参考：[CentOS7安装GlusterFS](http://www.cnblogs.com/jicki/p/5801712.html)。

因为我们只有三台主机，在此我们使用默认的**分布卷模式**。**请勿在生产环境上使用该模式，容易导致数据丢失。**

```bash
# 创建分布卷
$ gluster volume create k8s-volume transport tcp test-001.jimmysong.io:/opt/gfs_data test-002.jimmysong.io:/opt/gfs_data test-003.jimmysong.io:/opt/gfs_data force

# 查看volume状态
$ gluster volume info
Volume Name: k8s-volume
Type: Distribute
Volume ID: 9a3b0710-4565-4eb7-abae-1d5c8ed625ac
Status: Created
Snapshot Count: 0
Number of Bricks: 3
Transport-type: tcp
Bricks:
Brick1: test-001.jimmysong.io:/opt/gfs_data
Brick2: test-002.jimmysong.io:/opt/gfs_data
Brick3: test-003.jimmysong.io:/opt/gfs_data
Options Reconfigured:
transport.address-family: inet
nfs.disable: on

# 启动 分布卷
$ gluster volume start k8s-volume
```

## Glusterfs调优

```bash
# 开启 指定 volume 的配额
$ gluster volume quota k8s-volume enable

# 限制 指定 volume 的配额
$ gluster volume quota k8s-volume limit-usage / 1TB

# 设置 cache 大小, 默认32MB
$ gluster volume set k8s-volume performance.cache-size 4GB

# 设置 io 线程, 太大会导致进程崩溃
$ gluster volume set k8s-volume performance.io-thread-count 16

# 设置 网络检测时间, 默认42s
$ gluster volume set k8s-volume network.ping-timeout 10

# 设置 写缓冲区的大小, 默认1M
$ gluster volume set k8s-volume performance.write-behind-window-size 1024MB
```

## Kubernetes中配置glusterfs

以下用到的所有yaml和json配置文件可以在[../manifests/glusterfs](https://github.com/rootsongjc/kubernetes-handbook/blob/master/manifests/glusterfs)中找到。注意替换其中私有镜像地址为你自己的镜像地址。


## kubernetes安装客户端

```bash
# 在所有 k8s node 中安装 glusterfs 客户端

$ yum install -y glusterfs glusterfs-fuse

# 配置 hosts

$ vi /etc/hosts

172.20.0.113   test-001.jimmysong.io
172.20.0.114   test-002.jimmysong.io
172.20.0.115   test-003.jimmysong.io
```

因为我们glusterfs跟kubernetes集群复用主机，因为此这一步可以省去。

## 配置 endpoints

```bash
$ curl -O https://raw.githubusercontent.com/kubernetes/examples/master/staging/volumes/glusterfs/glusterfs-endpoints.json

# 修改 endpoints.json ，配置 glusters 集群节点ip
# 每一个 addresses 为一个 ip 组

    {
      "addresses": [
        {
          "ip": "172.22.0.113"
        }
      ],
      "ports": [
        {
          "port": 1990
        }
      ]
    },

# 导入 glusterfs-endpoints.json

$ kubectl apply -f glusterfs-endpoints.json

# 查看 endpoints 信息
$ kubectl get ep
```

## 配置 service

```bash
$ curl -O https://raw.githubusercontent.com/kubernetes/examples/master/staging/volumes/glusterfs/glusterfs-service.json

# service.json 里面查找的是 enpointes 的名称与端口，端口默认配置为 1，我改成了1990

# 导入 glusterfs-service.json
$ kubectl apply -f glusterfs-service.json

# 查看 service 信息
$ kubectl get svc
```

## 创建测试 pod

```bash
$ curl -O https://raw.githubusercontent.com/kubernetes/examples/master/staging/volumes/glusterfs/glusterfs-pod.json

# 编辑 glusterfs-pod.json
# 修改 volumes  下的 path 为上面创建的 volume 名称

"path": "k8s-volume"

# 导入 glusterfs-pod.json
$ kubectl apply -f glusterfs-pod.json

# 查看 pods 状态
$ kubectl get pods               
NAME                             READY     STATUS    RESTARTS   AGE
glusterfs                        1/1       Running   0          1m

# 查看 pods 所在 node
$ kubectl describe pods/glusterfs

# 登陆 node 物理机，使用 df 可查看挂载目录
$ df -h
172.20.0.113:k8s-volume 1073741824        0 1073741824   0% 172.20.0.113:k8s-volume  1.0T     0  1.0T   0% /var/lib/kubelet/pods/3de9fc69-30b7-11e7-bfbd-8af1e3a7c5bd/volumes/kubernetes.io~glusterfs/glusterfsvol
```

## 配置PersistentVolume

PersistentVolume（PV）和 PersistentVolumeClaim（PVC）是kubernetes提供的两种API资源，用于抽象存储细节。管理员关注于如何通过pv提供存储功能而无需关注用户如何使用，同样的用户只需要挂载PVC到容器中而不需要关注存储卷采用何种技术实现。

PVC和PV的关系跟pod和node关系类似，前者消耗后者的资源。PVC可以向PV申请指定大小的存储资源并设置访问模式。

**PV属性 **

- storage容量 
- 读写属性：分别为ReadWriteOnce：单个节点读写； ReadOnlyMany：多节点只读 ； ReadWriteMany：多节点读写

```bash
$ cat glusterfs-pv.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: gluster-dev-volume
spec:
  capacity:
    storage: 8Gi
  accessModes:
    - ReadWriteMany
  glusterfs:
    endpoints: "glusterfs-cluster"
    path: "k8s-volume"
    readOnly: false

# 导入PV
$ kubectl apply -f glusterfs-pv.yaml

# 查看 pv
$ kubectl get pv
NAME                 CAPACITY   ACCESSMODES   RECLAIMPOLICY   STATUS      CLAIM     STORAGECLASS   REASON    AGE
gluster-dev-volume   8Gi        RWX           Retain          Available                                      3s
```

PVC属性

- 访问属性与PV相同
- 容量：向PV申请的容量 <= PV总容量

## 配置PVC

```Bash
$ cat glusterfs-pvc.yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: glusterfs-nginx
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 8Gi

# 导入 pvc
$ kubectl apply -f glusterfs-pvc.yaml

# 查看 pvc

$ kubectl get pv
NAME              STATUS    VOLUME               CAPACITY   ACCESSMODES   STORAGECLASS   AGE
glusterfs-nginx   Bound     gluster-dev-volume   8Gi        RWX                          4s
```

## 创建 nginx deployment 挂载 volume

```Bash
$ vi nginx-deployment.yaml
apiVersion: extensions/v1beta1 
kind: Deployment 
metadata: 
  name: nginx-dm
spec: 
  replicas: 2
  template: 
    metadata: 
      labels: 
        name: nginx 
    spec: 
      containers: 
        - name: nginx 
          image: nginx:alpine 
          imagePullPolicy: IfNotPresent
          ports: 
            - containerPort: 80
          volumeMounts:
            - name: gluster-dev-volume
              mountPath: "/usr/share/nginx/html"
      volumes:
      - name: gluster-dev-volume
        persistentVolumeClaim:
          claimName: glusterfs-nginx

# 导入 deployment
$ kubectl apply -f nginx-deployment.yaml 

# 查看 deployment
$ kubectl get pods |grep nginx-dm
nginx-dm-3698525684-g0mvt       1/1       Running   0          6s
nginx-dm-3698525684-hbzq1       1/1       Running   0          6s

# 查看 挂载
$ kubectl exec -it nginx-dm-3698525684-g0mvt -- df -h|grep k8s-volume
172.20.0.113:k8s-volume         1.0T     0  1.0T   0% /usr/share/nginx/html

# 创建文件 测试
$ kubectl exec -it nginx-dm-3698525684-g0mvt -- touch /usr/share/nginx/html/index.html

$ kubectl exec -it nginx-dm-3698525684-g0mvt -- ls -lt /usr/share/nginx/html/index.html
-rw-r--r-- 1 root root 0 May  4 11:36 /usr/share/nginx/html/index.html

# 验证 glusterfs
# 因为我们使用分布卷，所以可以看到某个节点中有文件
[root@test-001 ~] ls /opt/gfs_data/
[root@test-002 ~] ls /opt/gfs_data/
index.html
[root@test-003 ~] ls /opt/gfs_data/
```

## 参考

- [CentOS 7 安装 GlusterFS](http://www.cnblogs.com/jicki/p/5801712.html)
