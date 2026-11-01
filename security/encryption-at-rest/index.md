---
weight: 4
title: "静态数据加密：Secret 落盘保护与 KMS v2 信封加密"
linktitle: 静态数据加密
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: encryption-at-rest
description: "解析 kube-apiserver 的 EncryptionConfiguration 机制：为什么默认的 Secret 只是 base64 而非加密、aescbc/aesgcm/secretbox/kms 各提供者的取舍、KMS v2 信封加密与密钥轮换流程、配置热加载、加密状态验证，以及与 External Secrets 等外部密钥管理方案的边界。"
---

> 很多团队发现 Secret 在 etcd 里只是 base64 时都会愣一下——Kubernetes 把"是否加密落盘"这个决定留给了集群管理员，而不是替你做。

Kubernetes 的 Secret 在 API 层以 base64 编码传输，这只是序列化而非加密；若不做额外配置，它们会以明文形式写入 etcd 的数据文件。任何能读取 etcd 磁盘、快照或备份的人都能直接获取集群中的全部凭据。静态数据加密（Encryption at Rest）让 kube-apiserver 在写入 etcd 之前加密资源对象，是生产集群安全基线中必须完成的一项。

## 工作原理

kube-apiserver 通过 `--encryption-provider-config` 指向一个 `EncryptionConfiguration` 文件，文件按资源类型声明一组有序的加密提供者（provider）。写入时使用列表中**第一个**提供者加密；读取时按列表顺序逐个尝试解密，直到成功。这种设计让密钥轮换与加密迁移可以在线平滑进行。

```yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
- resources:
  - secrets
  - configmaps
  - pandas.awesome.bears.example     # CRD 也可以加密
  providers:
  - aescbc:
      keys:
      - name: key1
        secret: <base64 编码的 32 字节随机密钥>
  - identity: {}                     # 兜底读取尚未加密的旧数据
```

{{< callout warning "identity 的位置决定一切" >}}
`identity` 是"不加密"提供者。若它位于列表第一位，新写入的数据不会被加密；把它放在末尾则只用于读取历史明文数据。配置完成并完成全量重写后应把它移除，这样任何未加密数据的读取都会失败并被及时发现。
{{< /callout >}}

## 加密提供者的选择

{{< table title="EncryptionConfiguration 支持的提供者" >}}

| 提供者 | 算法 | 密钥位置 | 评估 |
|--------|------|----------|------|
| `identity` | 无 | — | 默认，不提供机密性 |
| `aescbc` | AES-CBC + PKCS#7 | 配置文件（控制面主机） | 可用但受填充预言攻击影响，官方已不推荐新部署使用 |
| `aesgcm` | AES-GCM 随机 nonce | 配置文件 | 最快，但每 20 万次写入必须轮换密钥，仅适合有自动轮换机制的场景 |
| `secretbox` | XSalsa20 + Poly1305 | 配置文件 | 现代算法，安全性强；不满足 FIPS 要求 |
| `kms` v2 | 信封加密，DEK 用 AES-GCM，KEK 由外部 KMS 托管 | KEK 在 KMS，不落控制面磁盘 | **推荐**，v1.29 GA；KMS v1 自 v1.28 弃用并默认关闭 |

{{< /table >}}

前四种提供者的密钥都明文存放在控制面主机的配置文件中，任何能登录主机的人都能解密 etcd 数据——它们只保护"etcd 备份泄露"这一种威胁。KMS v2 把密钥加密密钥（KEK）托管在云 KMS 或 HashiCorp Vault 等外部系统，API Server 只持有被 KEK 加密的数据加密密钥（DEK），从根本上分离了数据与密钥的保管责任。

## KMS v2 信封加密

KMS v2 的流程如下：API Server 启动时向 KMS 插件请求生成一个 DEK 种子并用 KEK 加密；每次写入时从种子派生新的 DEK 加密对象，密文中记录 DEK 的加密形式与 KEK 版本；读取时若本地缓存了解密后的 DEK 则直接解密，否则调用 KMS 插件解封。相比 v1 每次读写都调用 KMS，v2 的 KMS 调用次数大幅减少，并能在 KMS 短暂不可用时继续工作。

```yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
- resources:
  - secrets
  providers:
  - kms:
      apiVersion: v2
      name: cloud-kms
      endpoint: unix:///var/run/kmsplugin/socket.sock
      timeout: 3s
  - identity: {}
```

KMS 插件作为静态 Pod 或 DaemonSet 运行在控制面节点，通过 Unix 套接字提供 gRPC 服务。主流实现包括 AWS `aws-encryption-provider`、Azure `kubernetes-kms`、GCP `k8s-cloudkms-plugin`、HashiCorp `vault-kubernetes-kms`，以及社区的 `trousseau`。云厂商托管集群（EKS、AKS、GKE）通常只需在集群创建时勾选"使用自定义 KMS 密钥加密 Secret"。

KMS v2 的密钥轮换也更简单：在 KMS 中轮换 KEK 后，API Server 会在下一次健康检查感知到新版本并开始用新 KEK 封装 DEK，旧 KEK 只需保留到所有数据完成重写。

## 启用与验证

启用步骤如下：

1. 生成密钥（本地提供者）或部署 KMS 插件
2. 编写 `EncryptionConfiguration`，放在所有控制面节点的相同路径
3. 为 kube-apiserver 添加 `--encryption-provider-config=/etc/kubernetes/enc/enc.yaml`（kubeadm 集群在 `ClusterConfiguration.apiServer.extraArgs` 中以 `{name, value}` 列表形式声明，并挂载对应目录）
4. 滚动重启 API Server
5. 触发全量重写，让存量数据以新提供者加密：

```bash
kubectl get secrets --all-namespaces -o json | kubectl replace -f -
```

验证时直接读取 etcd：

```bash
ETCDCTL_API=3 etcdctl \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  get /registry/secrets/default/secret1 | hexdump -C | head
```

输出应以 `k8s:enc:aescbc:v1:key1:` 或 `k8s:enc:kms:v2:cloud-kms:` 前缀开头，而非可读的 JSON。

## 密钥轮换

本地提供者轮换密钥需要三步，以保证多 API Server 实例间不出现"用新密钥加密、旧实例无法解密"的窗口：

1. 把新密钥追加到 `keys` 列表**末尾**，滚动重启所有 API Server（此时所有实例都能用新密钥解密）
2. 把新密钥移到列表**首位**，再次滚动重启（新写入开始使用新密钥）
3. 全量重写资源后，从列表中移除旧密钥

配置热加载（`--encryption-provider-config-automatic-reload=true`，随 KMS v2 在 v1.29 一同稳定）让上述步骤无需重启 API Server：修改文件后约一分钟内自动生效，并通过 `apiserver_encryption_config_controller_automatic_reload_success_total` 指标确认。

## 加密的边界

静态数据加密只保护 etcd 中的数据。以下场景需要其他手段补足：

- **传输中**：API Server 与 etcd 之间默认已使用 mTLS；kubelet 拉取 Secret 同样经 TLS
- **节点内存与 tmpfs**：Secret 挂载到 Pod 时存放在节点的 tmpfs 中，持有节点访问权限的人仍可读取——应配合 RBAC 限制 `secrets` 的 `list`/`watch`，并用节点授权器限制 kubelet 只能读取其上 Pod 引用的 Secret
- **Secret 的来源**：静态加密不解决"凭据如何进入集群"的问题。[External Secrets Operator](https://external-secrets.io/) 从 Vault、云 Secrets Manager 同步 Secret 对象，[Secrets Store CSI Driver](https://secrets-store-csi-driver.sigs.k8s.io/) 则把外部密钥直接以卷形式挂载而不创建 Secret 对象。它们与静态加密互补：前者管理生命周期，后者保护落盘
- **etcd 备份**：加密后的备份仍包含密文，恢复时需要原密钥或 KMS 可用；备份文件本身仍应加密存储

审计日志（见 [审计日志](../audit-logging)）默认以 `Metadata` 级别记录 Secret 操作，避免把 Secret 内容写入日志。

## 总结

静态数据加密把 Secret 从"etcd 里的明文"变为需要密钥才能解读的密文，而 KMS v2 更进一步把密钥的保管从控制面主机移到专用的密钥管理系统。生产集群应至少启用 `secretbox` 或 `aescbc`，有合规要求的环境应采用 KMS v2 并开启配置热加载以简化轮换。同时要清醒地认识到它只覆盖"落盘"这一环，完整的 Secret 安全还需要 RBAC、节点授权、外部密钥管理与审计共同构成。

## 参考文献

- [Encrypting Confidential Data at Rest - kubernetes.io](https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/)
- [Using a KMS provider for data encryption - kubernetes.io](https://kubernetes.io/docs/tasks/administer-cluster/kms-provider/)
- [Good practices for Kubernetes Secrets - kubernetes.io](https://kubernetes.io/docs/concepts/security/secrets-good-practices/)
- [External Secrets Operator - external-secrets.io](https://external-secrets.io/)
- [Secrets Store CSI Driver - sigs.k8s.io](https://secrets-store-csi-driver.sigs.k8s.io/)
