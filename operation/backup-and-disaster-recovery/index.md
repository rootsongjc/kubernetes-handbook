---
weight: 4
title: "备份与灾难恢复：etcd 快照、Velero 与 GitOps 重建"
linktitle: 备份与灾难恢复
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: backup-and-disaster-recovery
description: "系统化讨论 Kubernetes 的备份与灾难恢复：需要保护的四层状态（etcd、持久卷数据、集群外配置、应用一致性），etcd 快照的备份与恢复流程（含 kubeadm 集群与 etcd 3.6），Velero 的资源备份、CSI 快照与数据搬运、跨集群迁移，GitOps 作为控制面“备份”的定位，以及 RPO/RTO 目标、演练与常见陷阱。"
---

> 没有被恢复演练过的备份只是一个占用存储的文件——灾难恢复的核心不是"备了没有"，而是"多久能起来、丢多少数据"。

Kubernetes 的声明式模型让很多人误以为集群"随时可以重建"，但真正的生产集群里有三样东西无法从 Git 里长出来：etcd 中由控制器与用户动态写入的状态、持久卷里的业务数据、以及只存在于集群内的凭据与证书。本文从"需要保护什么"出发，介绍控制面与数据面各自的备份手段、恢复流程与演练方法。

## 需要保护的四层状态

{{< table title="Kubernetes 集群的状态分层与保护手段" >}}

| 层 | 内容 | 来源 | 保护手段 |
|----|------|------|----------|
| 控制面状态 | 所有 API 对象：Deployment、Service、CRD 实例、Secret、RBAC、Lease、Event… | etcd | etcd 快照；Velero 资源备份 |
| 持久卷数据 | PV 中的数据库、文件、模型 | 存储后端 | 存储快照（CSI VolumeSnapshot）、文件级备份、数据库原生备份 |
| 集群外依赖 | 控制面证书与密钥、云资源（负载均衡器、IAM、DNS）、节点镜像 | 主机文件系统、云平台 | 证书目录备份；基础设施即代码（Terraform、Cluster API） |
| 期望状态 | 清单、Helm values、Kustomize 覆盖 | Git | GitOps 仓库本身即备份 |

{{< /table >}}

恢复策略的两个核心指标是 **RPO**（Recovery Point Objective，可接受的数据丢失时间窗）与 **RTO**（Recovery Time Objective，可接受的恢复耗时）。etcd 快照每 30 分钟一次意味着控制面 RPO 为 30 分钟；而对数据库这样的有状态服务，RPO 必须由其自身的 WAL 归档或流复制保证，不能指望卷快照。

## etcd 备份与恢复

etcd 是整个控制面的唯一真相来源，它的快照是最低成本、最完整的控制面备份。etcd 3.6（Kubernetes v1.34+ 由 kubeadm 部署）与 3.5 的快照格式兼容，`etcdctl snapshot save` 与 `etcdutl snapshot restore` 是标准工具（3.6 把离线操作移到了 `etcdutl`）。

### 定期快照

```bash
# 在控制面节点上执行（kubeadm 集群的证书路径）
ETCDCTL_API=3 etcdctl snapshot save /var/backups/etcd/snapshot-$(date +%Y%m%dT%H%M%S).db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt \
  --key=/etc/kubernetes/pki/etcd/healthcheck-client.key

# 校验快照完整性
etcdutl snapshot status /var/backups/etcd/snapshot-*.db --write-out=table
```

建议用 systemd timer 或 CronJob（挂载宿主机证书目录、运行在控制面节点）每 15 – 60 分钟执行，快照加密后上传到异地对象存储并保留多个版本。**同时备份 `/etc/kubernetes/pki` 目录**——没有 CA 与 Service Account 签名密钥，恢复的 etcd 中所有 ServiceAccount 令牌与节点证书都将失效。

### 恢复流程

恢复 etcd 等于把整个控制面回滚到快照时刻，所有节点上正在运行的 Pod 不受影响，但控制器会立即把现状与快照中的期望状态对齐——快照之后创建的对象会被删除、之后删除的对象会被重建。单节点 kubeadm 集群的恢复步骤：

```bash
# 1. 停止 API Server 与 etcd（移走静态 Pod 清单）
mv /etc/kubernetes/manifests/{kube-apiserver,etcd}.yaml /tmp/

# 2. 从快照恢复到新数据目录
etcdutl snapshot restore snapshot.db \
  --name=<node-name> \
  --initial-cluster=<node-name>=https://<node-ip>:2380 \
  --initial-advertise-peer-urls=https://<node-ip>:2380 \
  --data-dir=/var/lib/etcd-restored

# 3. 替换数据目录并恢复静态 Pod
mv /var/lib/etcd /var/lib/etcd.bak && mv /var/lib/etcd-restored /var/lib/etcd
mv /tmp/{kube-apiserver,etcd}.yaml /etc/kubernetes/manifests/

# 4. 验证并重启依赖缓存的组件
kubectl get nodes
kubectl -n kube-system rollout restart deployment coredns
```

多成员 etcd 集群必须让所有成员从同一个快照恢复（每个成员使用自己的 `--name` 与完整的 `--initial-cluster`），并在全部成员恢复后同时启动，否则 Raft 日志不一致会导致集群无法形成多数派。托管控制面（EKS、GKE、AKS）不暴露 etcd，由云厂商负责其备份，用户只能通过 Velero 等 API 级工具备份。

## Velero：API 对象与卷数据的备份

[Velero](https://velero.io/)（当前 v1.18）通过 API Server 而非 etcd 工作，因此适用于托管集群，并且支持按命名空间、标签、资源类型选择性备份与恢复、跨集群/跨云迁移、以及卷数据的快照与搬运。它的架构包括集群内的 Velero 服务器、每个节点上负责文件级备份的 node-agent、以及存放备份的对象存储（`BackupStorageLocation`）与卷快照位置（`VolumeSnapshotLocation`）。

### 资源备份

```bash
# 安装（以 AWS 为例，启用 CSI 快照与 node-agent）
velero install \
  --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.14.4 \
  --bucket my-velero-backups \
  --backup-location-config region=us-west-2 \
  --snapshot-location-config region=us-west-2 \
  --use-node-agent \
  --features=EnableCSI

# 备份整个命名空间（含 PVC 的 CSI 快照并把快照数据搬运到对象存储）
velero backup create prod-$(date +%Y%m%d) \
  --include-namespaces prod \
  --snapshot-move-data \
  --ttl 720h

# 定时备份
velero schedule create prod-daily --schedule="0 2 * * *" --include-namespaces prod --snapshot-move-data --ttl 720h

# 恢复到另一个命名空间
velero restore create --from-backup prod-20261101 --namespace-mappings prod:prod-restore
```

Velero 备份时会按依赖顺序导出对象（命名空间 → CRD → PV/PVC → 其余），恢复时也按顺序重建，并自动处理 PV 与 PVC 的重新绑定。它会跳过 `status` 字段与 `nodeName` 等运行时信息，恢复的 Pod 由控制器重新调度。

### 卷数据的三种方式

{{< table title="Velero 卷数据备份方式" >}}

| 方式 | 原理 | 一致性 | 可移植性 |
|------|------|--------|----------|
| 云平台原生快照（插件） | 调用云 API 为云磁盘打快照 | 崩溃一致 | 快照留在云平台，通常只能同区/同账号恢复 |
| CSI 快照 | 通过 `VolumeSnapshot` API 调用 CSI 驱动打快照 | 崩溃一致 | 同上；配合 `--snapshot-move-data` 由数据搬运器把快照内容以 Kopia 格式上传到对象存储后即可跨集群/跨云恢复 |
| 文件系统备份（FSB） | node-agent 在 Pod 所在节点挂载卷，用 Kopia 增量上传文件 | 文件级，不保证应用一致 | 完全可移植；适合无快照能力的存储（NFS、hostPath、emptyDir） |

{{< /table >}}

Restic 上传器自 v1.15 弃用、v1.17 起禁止新建备份，现有部署应迁移到 Kopia。无论哪种方式都只能保证**崩溃一致**，数据库仍可能在恢复后需要回滚事务。Velero 的备份钩子（`pre.hook.backup.velero.io` 注解或 `Backup` 规约中的 `hooks`）可在快照前执行 `fsfreeze`、`FLUSH TABLES WITH READ LOCK` 或 `pg_start_backup`，实现应用一致的备份；对核心数据库，更可靠的做法是使用数据库 Operator（CloudNativePG、Percona、Vitess 等）自带的连续归档与时间点恢复，Velero 只负责对象与非核心数据。

### 跨集群迁移与多集群容灾

Velero 的备份存储位置可以被多个集群以只读方式共享，这让它成为集群迁移与冷备容灾的标准工具：在目标集群安装 Velero 并指向同一个桶（`--access-mode ReadOnly`），即可 `velero restore` 任意备份。配合 `--snapshot-move-data`，卷数据也随之迁移。需要注意目标集群的 StorageClass 名称、Ingress/Gateway 类与节点标签可能不同，可用 Velero 的 `change-storage-class` ConfigMap 与资源修改器（Resource Modifiers，JSON Patch 规则）在恢复时改写。

## GitOps 作为期望状态的备份

如果所有工作负载清单都在 Git 中并由 Argo CD 或 Flux 持续同步，那么重建一个集群的"期望状态"只需要让新集群指向同一个 Git 仓库。GitOps 因此常被视为控制面备份的替代——但它只覆盖第四层。以下内容不在 Git 中，重建后需要单独恢复或重新生成：

- 控制器生成的对象：PVC 绑定、Lease、证书签发请求、ServiceAccount 令牌、cert-manager 签发的证书
- 用户动态创建的对象：`kubectl create secret`、HPA 当前副本数、手工创建的 Job
- Secret：应通过 External Secrets Operator 从外部密钥管理系统同步，或用 SOPS/Sealed Secrets 加密后入库，使其也成为 Git 的一部分
- CRD 的 `status` 与由 Operator 维护的运行时状态（数据库拓扑、分片分配）

因此推荐的组合是：GitOps 负责"怎么重建期望状态"，etcd 快照负责"控制面整体回滚"，Velero 负责"选择性恢复与跨集群迁移"，数据库 Operator 负责"数据的时间点恢复"。

## 演练与常见陷阱

备份只有在恢复演练中才被证明有效。至少每季度在隔离环境中执行一次完整恢复：从对象存储下载 etcd 快照与 PKI、重建控制面、用 Velero 恢复一个关键命名空间并验证应用可用，记录实际 RTO 并与目标对比。常见陷阱包括：

- **备份与集群同区同账号**：区域级故障或账号被攻破时备份一同丢失；应跨区、跨账号复制，并开启对象锁定防篡改
- **忘记 PKI**：etcd 恢复后所有令牌失效、节点 NotReady
- **Secret 未加密即备份**：Velero 备份桶里的 Secret 是 base64 明文，桶的访问控制与服务端加密必不可少；etcd 快照若未启用 [静态数据加密](../../security/encryption-at-rest) 同样是明文
- **恢复时 Webhook 阻塞**：准入 Webhook 的后端尚未恢复时，依赖它的对象无法创建，Velero 的恢复顺序或 `failurePolicy: Ignore` 的临时调整可以解决
- **卷快照不等于应用一致**：数据库需要钩子或原生备份
- **CRD 与 Operator 版本漂移**：恢复到更新版本的集群时，旧 CRD 版本可能已不被服务，应先在目标集群部署相同版本的 Operator 再恢复实例
- **备份过期与配额**：`--ttl` 与对象存储生命周期规则需对齐，避免备份被提前清理或无限增长

## 总结

Kubernetes 的灾难恢复需要覆盖四层状态：etcd 快照加 PKI 目录是控制面的完整备份，Velero 提供 API 级的选择性备份、卷数据搬运与跨集群迁移，GitOps 仓库保存期望状态，而数据库等有状态应用的真正数据安全要靠其原生的连续归档与时间点恢复。把这些手段按 RPO/RTO 目标组合起来，并定期在隔离环境中演练完整恢复，才能让"集群可以重建"从一句口号变成可验证的事实。

## 参考文献

- [Operating etcd clusters for Kubernetes: Backing up an etcd cluster - kubernetes.io](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#backing-up-an-etcd-cluster)
- [etcd Disaster Recovery - etcd.io](https://etcd.io/docs/v3.6/op-guide/recovery/)
- [Velero Documentation - velero.io](https://velero.io/docs/)
- [Velero CSI Snapshot Data Movement - velero.io](https://velero.io/docs/v1.18/csi-snapshot-data-movement/)
- [Velero File System Backup - velero.io](https://velero.io/docs/v1.18/file-system-backup/)
- [Backup and Restore Hooks - velero.io](https://velero.io/docs/v1.18/backup-hooks/)
