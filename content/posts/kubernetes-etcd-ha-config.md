---
draft: false
date: "2017-04-11T15:21:39+08:00"
title: "Kubernetes安装之etcd高可用配置"
categories: "kubernetes"
tags: ["kubernetes","etcd"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/2015091401.jpg", desc: "北京夜景@西山"}]
---

## 前言

这是[和我一步步部署kubernetes集群](https://github.com/rootsongjc/follow-me-install-kubernetes-cluster)项目((fork自[opsnull](https://github.com/opsnull/follow-me-install-kubernetes-cluster)))中的一篇文章，下文是结合我[之前部署kubernetes的过程](https://jimmysong.io/tags/kubernetes/)产生的kuberentes环境，生成**kubeconfig**文件的过程。

## 创建高可用 etcd 集群

kuberntes 系统使用 etcd 存储所有数据，本文档介绍部署一个三节点高可用 etcd 集群的步骤，这三个节点复用 kubernetes master 机器，分别命名为`sz-pg-oam-docker-test-001.tendcloud.com`、`sz-pg-oam-docker-test-002.tendcloud.com`、`sz-pg-oam-docker-test-003.tendcloud.com`：

- sz-pg-oam-docker-test-001.tendcloud.com：172.20.0.113
- sz-pg-oam-docker-test-002.tendcloud.com：172.20.0.114
- sz-pg-oam-docker-test-003.tendcloud.com：172.20.0.115

## TLS 认证文件

需要为 etcd 集群创建加密通信的 TLS 证书，这里复用以前创建的 kubernetes 证书

```bash
$ cp ca.pem kubernetes-key.pem kubernetes.pem /etc/kubernetes/ssl
```

- kubernetes 证书的 `hosts` 字段列表中包含上面三台机器的 IP，否则后续证书校验会失败；

## 下载二进制文件

下载最新版本的二进制文件

```bash
$ https://github.com/coreos/etcd/releases/download/v3.1.5/etcd-v3.1.5-linux-amd64.tar.gz
$ tar -xvf etcd-v3.1.4-linux-amd64.tar.gz
$ sudo mv etcd-v3.1.4-linux-amd64/etcd* /root/local/bin
```

## 创建 etcd 的 systemd unit 文件

注意替换 `ETCD_NAME` 和 `INTERNAL_IP` 变量的值；

```bash
$ export ETCD_NAME=sz-pg-oam-docker-test-001.tendcloud.com
$ export INTERNAL_IP=172.20.0.113
$ sudo mkdir -p /var/lib/etcd /var/lib/etcd
$ cat > etcd.service <<EOF
[Unit]
Description=Etcd Server
After=network.target
After=network-online.target
Wants=network-online.target
Documentation=https://github.com/coreos

[Service]
Type=notify
WorkingDirectory=/var/lib/etcd/
EnvironmentFile=-/etc/etcd/etcd.conf
ExecStart=/root/local/bin/etcd \\
  --name ${ETCD_NAME} \\
  --cert-file=/etc/kubernetes/ssl/kubernetes.pem \\
  --key-file=/etc/kubernetes/ssl/kubernetes-key.pem \\
  --peer-cert-file=/etc/kubernetes/ssl/kubernetes.pem \\
  --peer-key-file=/etc/kubernetes/ssl/kubernetes-key.pem \\
  --trusted-ca-file=/etc/kubernetes/ssl/ca.pem \\
  --peer-trusted-ca-file=/etc/kubernetes/ssl/ca.pem \\
  --initial-advertise-peer-urls https://${INTERNAL_IP}:2380 \\
  --listen-peer-urls https://${INTERNAL_IP}:2380 \\
  --listen-client-urls https://${INTERNAL_IP}:2379,https://127.0.0.1:2379 \\
  --advertise-client-urls https://${INTERNAL_IP}:2379 \\
  --initial-cluster-token etcd-cluster-0 \\
  --initial-cluster sz-pg-oam-docker-test-001.tendcloud.com=https://172.20.0.113:2380,sz-pg-oam-docker-test-002.tendcloud.com=https://172.20.0.114:2380,sz-pg-oam-docker-test-003.tendcloud.com=https://172.20.0.115:2380 \\
  --initial-cluster-state new \\
  --data-dir=/var/lib/etcd
Restart=on-failure
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF
```

- 指定 `etcd` 的工作目录为 `/var/lib/etcd`，数据目录为 `/var/lib/etcd`，需在启动服务前创建这两个目录；
- 为了保证通信安全，需要指定 etcd 的公私钥(cert-file和key-file)、Peers 通信的公私钥和 CA 证书(peer-cert-file、peer-key-file、peer-trusted-ca-file)、客户端的CA证书（trusted-ca-file）；
- 创建 `kubernetes.pem` 证书时使用的 `kubernetes-csr.json` 文件的 `hosts` 字段**包含所有 etcd 节点的 INTERNAL_IP**，否则证书校验会出错；
- `--initial-cluster-state` 值为 `new` 时，`--name` 的参数值必须位于 `--initial-cluster` 列表中；

完整 unit 文件见：[etcd.service](./systemd/etcd.service)

## 启动 etcd 服务

```bash
$ sudo mv etcd.service /etc/systemd/system/
$ sudo systemctl daemon-reload
$ sudo systemctl enable etcd
$ sudo systemctl start etcd
$ systemctl status etcd
```

在所有的 kubernetes master 节点重复上面的步骤，直到所有机器的 etcd 服务都已启动。

## 验证服务

在任一 kubernetes master 机器上执行如下命令：

```bash
$ etcdctl \
  --ca-file=/etc/kubernetes/ssl/ca.pem \
  --cert-file=/etc/kubernetes/ssl/kubernetes.pem \
  --key-file=/etc/kubernetes/ssl/kubernetes-key.pem \
  cluster-health
2017-04-11 15:17:09.082250 I | warning: ignoring ServerName for user-provided CA for backwards compatibility is deprecated
2017-04-11 15:17:09.083681 I | warning: ignoring ServerName for user-provided CA for backwards compatibility is deprecated
member 9a2ec640d25672e5 is healthy: got healthy result from https://172.20.0.115:2379
member bc6f27ae3be34308 is healthy: got healthy result from https://172.20.0.114:2379
member e5c92ea26c4edba0 is healthy: got healthy result from https://172.20.0.113:2379
cluster is healthy
```

结果最后一行为 `cluster is healthy` 时表示集群服务正常。

