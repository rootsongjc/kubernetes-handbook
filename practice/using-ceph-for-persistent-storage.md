# 使用Ceph做持久化存储创建MySQL集群

本文中用到的 yaml 文件可以在 [../manifests/mariadb-cluster](https://github.com/rootsongjc/kubernetes-handbook/blob/master/manifests/mariadb-cluster) 目录下找到。

下面我们以部署一个高可用的 MySQL 集群为例，讲解如何使用 Ceph 做数据持久化，其中使用 StorageClass 动态创建 PV，Ceph 集群我们使用 kubernetes 集群外部的已有的集群，我们没有必要重新部署了。

在 1.4 以后，kubernetes 提供了一种更加方便的动态创建 PV 的方式；也就是说使用 StoragaClass 时无需预先创建固定大小的 PV，等待使用者创建 PVC 来使用；而是直接创建 PVC 即可分配使用。

## 使用 kubernetes 集群外部的 Ceph 存储

在部署 kubernetes 之前我们就已经有了 Ceph 集群，因此我们可以直接拿来用。但是 kubernetes 的所有节点（尤其是 master 节点）上依然需要安装 ceph 客户端。

```bash
yum install -y ceph-common
```

还需要将 ceph 的配置文件 `ceph.conf` 放在所有节点的 `/etc/ceph` 目录下。

Kubernetes 使用 ceph 存储需要用到如下配置：

- Monitors: Ceph montors 列表
- Path：作为挂载的根路径，默认是 /
- User：RADOS用户名，默认是 admin
- secretFile：keyring 文件路径，默认是 /etc/ceph/user.secret，我们 Ceph 集群提供的文件是 `ceph.client.admin.keyring`，将在下面用到
- secretRef：Ceph 认证 secret 的引用，如果配置了将会覆盖 secretFile。
- readOnly：该文件系统是否只读。

## Galera Cluster介绍

Galera是一个MySQL(也支持MariaDB，Percona)的同步多主集群软件。

从用户视角看，一组Galera集群可以看作一个具有多入口的MySQL库，用户可以同时从多个IP读写这个库。目前Galera已经得到广泛应用，例如Openstack中，在集群规模不大的情况下，稳定性已经得到了实践考验。真正的multi-master，即所有节点可以同时读写数据库。

## 详细步骤

以下步骤包括创建 Ceph 的配置 和 MySQL 的配置两部分。

### 配置 Ceph

关于 Ceph 的 yaml 文件可以在 [../manifest/mariadb-cluster](https://github.com/rootsongjc/kubernetes-handbook/tree/master/manifests/mariadb-cluster) 目录下找到。

#### 1. 生成 Ceph secret

使用 Ceph 管理员提供给你的 `ceph.client.admin.keyring` 文件，我们将它放在了 `/etc/ceph` 目录下，用来生成 secret。

```bash
grep key /etc/ceph/ceph.client.admin.keyring |awk '{printf "%s", $NF}'|base64
```

将获得加密后的 key：`QVFDWDA2aFo5TG5TQnhBQVl1b0lUL2V3YlRSaEtwVEhPWkxvUlE9PQ==`，我们将在后面用到。

#### 2. 创建租户namespace

创建 `galera-namespace.yaml` 文件内容为：

```yaml
apiVersion: v1  
kind: Namespace  
metadata:  
  name: galera 
```

#### 3. 创建 Ceph secret

创建 `ceph-secret.yaml` 文件内容为：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ceph-secret
  namespace: galera
type: "kubernetes.io/rbd"  
data:
  key: QVFDWDA2aFo5TG5TQnhBQVl1b0lUL2V3YlRSaEtwVEhPWkxvUlE9PQ==
```

#### 4. 创建 StorageClass

创建 `ceph-class.yaml` 文件内容为：

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
   name: ceph-web
provisioner: kubernetes.io/rbd
parameters:
  monitors: 172.28.7.98,172.28.7.99,172.28.7.100
  adminId: admin
  adminSecretName: ceph-secret
  adminSecretNamespace: galera
  pool: rbd #此处默认是rbd池，生产上建议自己创建存储池隔离
  userId: admin
  userSecretName: ceph-secret
```

此配置请参考 kubernetes 官方文档：https://kubernetes.io/docs/concepts/storage/persistent-volumes/#ceph-rbd

### 配置 MySQL

#### 1. 创建 MySQL 配置文件

创建 `mysql-config.yaml` 文件内容为：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mysql-config-vol
  namespace: galera
  labels:
    app: mysql
data:
  mariadb.cnf: |
    [client]
    default-character-set = utf8
    [mysqld]
    character-set-server  = utf8
    collation-server      = utf8_general_ci
    # InnoDB optimizations
    innodb_log_file_size  = 64M
  galera.cnf: |
    [galera]
    user = mysql
    bind-address = 0.0.0.0
    # Optimizations
    innodb_flush_log_at_trx_commit = 0
    sync_binlog = 0
    expire_logs_days = 7
    # Required settings
    default_storage_engine = InnoDB
    binlog_format = ROW
    innodb_autoinc_lock_mode = 2
    query_cache_size = 0
    query_cache_type = 0
    # MariaDB Galera settings
    #wsrep_debug=ON
    wsrep_on=ON
    wsrep_provider=/usr/lib/galera/libgalera_smm.so
    wsrep_sst_method=rsync
    # Cluster settings (automatically updated)
    wsrep_cluster_address=gcomm://
    wsrep_cluster_name=galera
    wsrep_node_address=127.0.0.1
```

#### 2. 创建 MySQL root 用户和密码

**创建加密密码**

```bash
$ echo -n jimmysong|base64
amltbXlzb25n
```

注意：一定要用-n 去掉换行符，不然会报错。

**创建 root 用户**

```bash
$ echo -n root |base64 
cm9vdA==
```

**创建 MySQL secret**

创建 `mysql-secret.yaml` 文件内容为：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysql-secrets
  namespace: galera
  labels:
    app: mysql
data:
  # Root password: changeit run  echo -n jimmysong|base64
  root-password: amltbXlzb25n
  # Root user: root
  root-user: cm9vdA==
```

#### 3. 创建 yaml 配置文件

创建 MySQL 的 yaml 文件 `galera-mariadb.yaml` 内容为：

```yaml
apiVersion: v1
kind: Service
metadata:
  annotations:
    service.alpha.kubernetes.io/tolerate-unready-endpoints: "true"
  name: mysql
  namespace: galera
  labels:
    app: mysql
    tier: data
spec:
  ports:
  - port: 3306
    name: mysql
  clusterIP: None
  selector:
    app: mysql
---
apiVersion: apps/v1beta1
kind: StatefulSet
metadata:
  name: mysql
  namespace: galera
spec:
  serviceName: "mysql"
  replicas: 3
  template:
    metadata:
      labels:
        app: mysql
        tier: data
      annotations:
        pod.beta.kubernetes.io/init-containers: '[
          {
            "name": "galera-init",    
            "image": "harbor-001.jimmysong.io/library/k8s-galera-init:latest",
            "args": ["-service=mysql"],
            "env": [
              {
                "name": "POD_NAMESPACE",
                "valueFrom": {
                  "fieldRef": { "apiVersion": "v1", "fieldPath": "metadata.namespace" }
                }
              },
              {
                "name": "SAFE_TO_BOOTSTRAP",
                "value": "1"
              },
              {
                "name": "DEBUG",
                "value": "1"
              }
            ],
            "volumeMounts": [
              {
                "name": "config",
                "mountPath": "/etc/mysql/conf.d"
              },
              {
                "name": "data",
                "mountPath": "/var/lib/mysql"
              }
            ]
          }
        ]'
    spec:
      terminationGracePeriodSeconds: 10
      containers:
      - name: mysql
        image: harbor-001.jimmysong.io/library/mariadb:10.1
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3306
          name: mysql
        - containerPort: 4444
          name: sst
        - containerPort: 4567
          name: replication
        - containerPort: 4568
          name: ist
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secrets
              key: root-password
        - name: MYSQL_ROOT_USER
          valueFrom:
            secretKeyRef:
              name: mysql-secrets
              key: root-user
        - name: MYSQL_INITDB_SKIP_TZINFO
          value: "yes"
        livenessProbe:
          exec:
            command: ["sh", "-c", "mysql -u\"${MYSQL_ROOT_USER:-root}\" -p\"${MYSQL_ROOT_PASSWORD}\" -e 'show databases;'"]
          initialDelaySeconds: 60
          timeoutSeconds: 5
        readinessProbe:
          exec:
            command: ["sh", "-c", "mysql -u\"${MYSQL_ROOT_USER:-root}\" -p\"${MYSQL_ROOT_PASSWORD}\" -e 'show databases;'"]
          initialDelaySeconds: 20
          timeoutSeconds: 5
        volumeMounts:
        - name: config
          mountPath: /etc/mysql/conf.d
        - name: data
          mountPath: /var/lib/mysql
      volumes:
      - name: config
        configMap:
          name: mysql-config-vol
      imagePullSecrets:
        - name: "registrykey"
  volumeClaimTemplates:
  - metadata:
      name: data
      annotations:
        volume.beta.kubernetes.io/storage-class: "ceph-web" #引用ceph  class 的类
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 3Gi
```

## 部署 MySQL 集群

在 `/etc/mariadb-cluster` 目录下执行：

```bash
kubectl create -f .
```

## 验证

存在 issue，参考 [Error creating rbd image: executable file not found in $PATH#38923](https://github.com/kubernetes/kubernetes/issues/38923)

## 问题记录

如果没有安装 `ceph-common` 的话，kubernetes 在创建 PVC 的时候会有如下报错信息：

```bash
Events:
  FirstSeen	LastSeen	Count	From				SubObjectPath	Type		Reason			Message
  ---------	--------	-----	----				-------------	--------	------			-------
  1h		12s		441	{persistentvolume-controller }			Warning		ProvisioningFailed	Failed to provision volume with StorageClass "ceph-web": failed to create rbd image: executable file not found in $PATH, command output:
```

检查 `kube-controller-manager` 的日志将看到如下错误信息：

```bash
journalctl -xe -u kube-controller-manager
... rbd_util.go:364] failed to create rbd image, output
... rbd.go:317] rbd: create volume failed, err: failed to create rbd image: executable file not found in $PATH, command output:
```

这是因为 `kube-controller-manager` 主机上没有安装 `ceph-common` 的缘故。

但是安装了 `ceph-common` 之后依然有问题：

```bash
Sep  4 15:25:36 bj-xg-oam-kubernetes-001 kube-controller-manager: W0904 15:25:36.032128   13211 rbd_util.go:364] failed to create rbd image, output
Sep  4 15:25:36 bj-xg-oam-kubernetes-001 kube-controller-manager: W0904 15:25:36.032201   13211 rbd_util.go:364] failed to create rbd image, output
Sep  4 15:25:36 bj-xg-oam-kubernetes-001 kube-controller-manager: W0904 15:25:36.032252   13211 rbd_util.go:364] failed to create rbd image, output
Sep  4 15:25:36 bj-xg-oam-kubernetes-001 kube-controller-manager: E0904 15:25:36.032276   13211 rbd.go:317] rbd: create volume failed, err: failed to create rbd image: fork/exec /usr/bin/rbd: invalid argument, command output:
```

该问题尚未解决，参考 [Error creating rbd image: executable file not found in $PATH#38923](https://github.com/kubernetes/kubernetes/issues/38923)

从日志记录来看追查到  `pkg/volume/rbd/rbd.go` 的 `func (r *rbdVolumeProvisioner) Provision() (*v1.PersistentVolume, error) {` 方法对 `ceph-class.yaml` 中的参数进行了验证和处理后调用了 `pkg/volume/rbd/rdb_utils.go` 文件第 344 行 `CreateImage` 方法（kubernetes v1.6.1版本）：

```go
func (util *RBDUtil) CreateImage(p *rbdVolumeProvisioner) (r *v1.RBDVolumeSource, size int, err error) {
	var output []byte
	capacity := p.options.PVC.Spec.Resources.Requests[v1.ResourceName(v1.ResourceStorage)]
	volSizeBytes := capacity.Value()
	// convert to MB that rbd defaults on
	sz := int(volume.RoundUpSize(volSizeBytes, 1024*1024))
	volSz := fmt.Sprintf("%d", sz)
	// rbd create
	l := len(p.rbdMounter.Mon)
	// pick a mon randomly
	start := rand.Int() % l
	// iterate all monitors until create succeeds.
	for i := start; i < start+l; i++ {
		mon := p.Mon[i%l]
		glog.V(4).Infof("rbd: create %s size %s using mon %s, pool %s id %s key %s", p.rbdMounter.Image, volSz, mon, p.rbdMounter.Pool, p.rbdMounter.adminId, p.rbdMounter.adminSecret)
		output, err = p.rbdMounter.plugin.execCommand("rbd",
			[]string{"create", p.rbdMounter.Image, "--size", volSz, "--pool", p.rbdMounter.Pool, "--id", p.rbdMounter.adminId, "-m", mon, "--key=" + p.rbdMounter.adminSecret, "--image-format", "1"})
		if err == nil {
			break
		} else {
			glog.Warningf("failed to create rbd image, output %v", string(output))
		}
	}

	if err != nil {
		return nil, 0, fmt.Errorf("failed to create rbd image: %v, command output: %s", err, string(output))
	}

	return &v1.RBDVolumeSource{
		CephMonitors: p.rbdMounter.Mon,
		RBDImage:     p.rbdMounter.Image,
		RBDPool:      p.rbdMounter.Pool,
	}, sz, nil
}
```

该方法调用失败。


## 参考

- https://github.com/kubernetes/examples/blob/master/staging/volumes/cephfs/README.md

- [k8s-ceph-statefulsets-storageclass-nfs 动态卷有状态应用实践](http://blog.csdn.net/idea77/article/details/72842723)

- https://kubernetes.io/docs/concepts/storage/persistent-volumes/#ceph-rbd

- [Error creating rbd image: executable file not found in $PATH#38923](https://github.com/kubernetes/kubernetes/issues/38923)