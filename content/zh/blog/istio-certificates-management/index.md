---
title: "Istio 中是如何进行证书管理的？"
description: "本文介绍了 Istio 中的证书管理。"
date: 2022-12-13T11:09:40+08:00
draft: true
tags: ["Istio","安全","证书"]
categories: ["Istio"]
type: "post"
image: "images/banner/cert.jpg"
---

我在[如何理解 Istio 中的 mTLS 流量加密](/blog/understanding-the-tls-encryption-in-istio/)这篇文章中提出流量加密的关键是证书管理。我们可以使用 Istio 中内置了CA（证书授权机构）也可以使用自定义 CA 来管理网格内的证书。这篇博客将为你讲解如何在 Istio 中进行证书管理。

## 什么是证书？ {#certificates-introduction}

在了解 Istio 的证书管理之前，我们先来了解一下什么是证书。

证书（Certificate），又称电子证书，它的用途广泛，凡是需要加密、认证、授权的场景都会用到它，比如：

- 在 Kubernetes 中你需要给各个组件配置证书，你可以选择[手动生成证书](https://kubernetes.io/zh-cn/docs/tasks/administer-cluster/certificates/)；
- Istio 中为实现自动 mTLS 给各个工作负载颁发的证书；
- 访问 HTTPS 网站所用到的证书等；

下图展示的是 TLS 通信的大概步骤，其中证书承担了证明服务器身份和加密通信的职责。

![TLS 通信步骤](tls.svg)

证书有很多类别，本文中的证书特指的是 [X.509 V3 证书](https://datatracker.ietf.org/doc/html/rfc5280)。X509 证书是一种常见的数字证书格式，用于在计算机网络中识别实体的身份。它主要用于在客户端和服务器之间进行安全通信，例如在通过 HTTPS 访问网站时。x509 证书通常由 CA 颁发，该 CA 会验证实体的身份，并将这些信息编码到证书中。当客户端连接到服务器时，服务器会向客户端提供其 x509 证书，客户端会验证证书的有效性，并通过该证书来识别服务器的身份。通过这种方式，双方可以安全地进行通信，并确保数据传输的完整性和保密性。

### 证书信任链 {#certificate-trust-chain}

根 CA 是数字证书的最顶级颁发机构，因此它所颁发的证书是最可信的。根证书颁发机构通常由政府机构或其他权威机构（如国际基础设施安全组织（CA/Browser Forum））经营和监管。常见的根 CA 包括：

- Symantec/VeriSign
- Comodo
- DigiCert
- GlobalSign
- GoDaddy
- Entrust
- GeoTrust
- RapidSSL
- Baltimore CyberTrust Root

请注意，上述列表只是一个样例，实际上有许多其他根 CA。

证书的验证需要通过证书信任链（Certificate Trust Chain）。证书信任链是指用于身份验证的一系列证书，它们形成一条从一个可信任的根证书颁发机构开始，逐级向下连接，直到用于验证某个特定证书的中间证书或终端证书的一种方式。证书信任链允许数字证书的可信度随着证书级别的升高而提高。

例如，在下面的证书信任链示意图中，你可以看到四条信任链。

![证书信任链](certificate-trust-chain.svg)

在 Chrome 浏览器中打开一个 HTTPS 网页，你可以通过点击地址栏左侧的锁图标查看证书信息，其中包括证书信任链，例如 [https://tetrate.io](https://tetrate.io) 的证书信任链如下图：

{{<figure title="Tetrate.io 的证书信任链" src="tetrate-cert.jpg" width="60%">}}

证书的信任链是一个树形结构，每个 CA 都可以有一或多个子 CA，一共有三种角色：

- 根 CA：最顶层的 CA，可以颁发证书给中间 CA；
- 中间 CA：除根 CA 以外的 CA，可颁发终端证书；
- 终端实体：拥有终端证书的设备或服务；

证书信任链允许客户端（例如，Web 浏览器）在验证终端证书时，逐级向上验证每个证书，以确定它是否可信。数字证书签发的原理是 CA 将证书拥有者的公钥与身份信息绑定在一起，然后 CA 使用其专有的私钥生成正式的数字签名，用以表示这个证书是经 CA 签发的。在证书校验时使用 CA 的公钥对这个证书上的数字签字进行验证即可。

### 证书颁发过程 {#certificate-signing}

下面以一个网站为例，描述颁发数字证书的过程：

1. 网站所有者向证书颁发机构提交申请；
2. 证书颁发机构验证网站所有者的身份和网站的真实性；
3. 证书颁发机构生成一个数字证书并发送给网站所有者；
4. 网站所有者将证书安装在其网站上，以便访问者能够验证网站的安全性；

## 如何生成证书？{#how-to-generate-certificates}

你可以通过以下开源工具生成 X.509 证书：

- [Easy-RSA](https://github.com/OpenVPN/easy-rsa)：一个简单地命令行工具，由 OpenVPN 项目组维护，使用 EasyRSA 可以轻松地为 OpenVPN 网络生成安全的证书和密钥；
- [OpenSSL](https://github.com/openssl/openssl)：由个人发起于 1995 年，现由独立组织维护，只提供命令行工具；
- [CFSSL](https://github.com/cloudflare/cfssl)：由 CloudFlare 开发和维护，不仅仅是一个用于生成证书的命令行工具，还可以作为 PKI 服务器；
- [BoringSSL](https://github.com/google/boringssl)：Google 开发和维护的 OpenSSL 分支，已用于 Chrome 浏览器和安卓操作系统；

因为可能大多数人都对 OpenSSL 比较熟悉，所以下面我们将使用 OpenSSL 来创建证书。

### 使用 OpenSSL 创建自签名证书

所谓的自签名证书，指的是不经过 CA 颁发的证书，它是创建者自己签发的，可用于在内部网络上测试安全性，或者在其他对安全性要求不高的情况下使用。

要使用 OpenSSL 创建自签名 x509 证书，可以使用如下命令：

1. 使用 OpenSSL 和 [RSA 非对称加密算法](https://zh.wikipedia.org/wiki/RSA%E5%8A%A0%E5%AF%86%E6%BC%94%E7%AE%97%E6%B3%95)生成私钥文件 `key.pem`：

   ```bash
   openssl genrsa -out key.pem
   ```

   `key.pem` 文件为文本格式，但是不可读，你可以使用文本编辑器或 OpenSSL 来查看该文件内容。`key.pem` 文件中包括私钥的算法类型、模数、指数等信息。需要注意的是私钥中包含敏感信息，请不要随意查看和发送给别人。

   - {{<detail "使用文本编辑器查看 key.pem 文件内容">}}

   ```
   -----BEGIN RSA PRIVATE KEY-----
   MIIEogIBAAKCAQEAwcBv2v0jiSdzwKol7e+Pn/SnYkmZZOQ0GI4IBVN7MypC6x72
   L8Uq0kBJb11CQfY3MlRj4nG+2BhkwxovIwyNHMTXXvr7vqy3g69o0PpXaRQFSMgp
   Br79Udc9MdhMAIhpa7+kFGXYAuvkeUSW77oqmugND8g6XjO20aDRguOSSrvHLNZU
   gv7QtthNfYXqX3aAkKrz6epQV+/m36yKTbn1iM+7VQgTdYzsj+tWa3gZA4zzMKSy
   5IEVIjDJzXJEkWE0LAtqHaqAg3BLG5BL1hAdhghj0GH5tqTKqRjsPTYIQzFtxqTH
   JyEaxf0XRdNWpSJBMebEDvEp7MqUgepKSGmGawIDAQABAoIBACE5RHUCz2Mndrvk
   8VgZqkE9jK5X/IvGbgB/6nQvWoLtjkgPKRwL7UncaDtGfKQe+lwRCIe+BYG8vRqP
   lOGnt1LlliDdXOnXaCiWnZyoMPD90+IlIJPdkEbGZ+HyOyYkPh+R3yr4Q9BMbwM0
   dcVp4QBrJkI8jXW13HWZ5BNTvrQ9rhYbLe8dBIgIYINHJZYpBn3OyREWtgFlnU66
   pNNVmbb4bUQikP81L4E3fv25Ges9RemvCZuDB1MJDJj9fDbbDtgq1YnbnItlq4Rr
   ifoG1ksCh0xTIXZBlgJLWxyghOtcWqnUNelpcosuwocqhc3lGmay/IY0spX/ccKC
   iMilJgECgYEA+F1DSGv1yaQ892wpssI+jCU2btc1++nb+fUd7WMtIglTAGz75dBL
   iLQKMixylXN0nRN1JB7b/glzGPEZkpZncTBRU4eSXWSR2VV/Hw4KaWT4Mi5JzA2f
   CLl3Mz+FGOkesAcdN0IsWHK1AnvIiwmFFQzBlXEgwEzeex86QkjwRusCgYEAx7VZ
   Rs9Nd2YkgQnZwpZHkSBMUPSj25pqhLaewFEMu+KTjNUwjgJrvo8iVTHxnMuRorlA
   blIuna22dIntVEGcGQSG+hiBaqBYQBDlywUlFkSsF5lh/W0twMEVjIZsmxGyBHPh
   aWeudiKYFzSgwXvt5cKFvaWTtYLmaONjGNQC3oECgYBArLiaoVJt4dDmdUoefKqh
   AAe+sVgjc3CPFJ9oc80K8falQ7wMykMBJDELg7uK43fYd3qnn0mWS4unURFhtLzX
   IsfqwoEAxPGd8L+brKJVc6+WEaux8VIaiYFa3Q2hwQL2v8OB4j9+ANDWBrngSuhW
   5O18JutqaBn/YdBf9nJrZQKBgCurmVElpb/1QwhAmjC14gJ3OJj/VhGAa8iHkqFl
   V86CFlfWip6TIvJxpEVS/Y2W6krWDaPSLsVmJh7HxnEFQ9goqEdqMmqZk5K23zkM
   7/Y1oBgs/0OGq1maH1cyUe966B2XJXSCKqFEoVN5u6lzqyrx5YL6ARnQ/Qd0qcfV
   HKeBAoGAB6iB33+ROkmdde8c4nVfqdYbUGdYSYMfrKgoTc9fXo/8hRM1JXBJvI6w
   37EloyH41TCZKyDC1tySyxuguCB+Ug1l/G3veVmzqoVzHQ1dRd3FSLpi8efNS7Ew
   At2wDwyVHMeiSOX9azdbyqCt4D32sc76bXI8Mi4cjEodXk2Jwk8=
   -----END RSA PRIVATE KEY-----
   ```

   {{</detail>}}

   - {{<detail "使用 OpenSSL 查看 key.pem 文件内容">}}
   

运行下面的命令查看 `key.pem` 文件的内容：

 ```bash
 openssl rsa -text -in key.pem
 ```

 内容如下：

```
RSA Private-Key: (2048 bit)
modulus:
    00:c1:c0:6f:da:fd:23:89:27:73:c0:aa:25:ed:ef:
    8f:9f:f4:a7:62:49:99:64:e4:34:18:8e:08:05:53:
    7b:33:2a:42:eb:1e:f6:2f:c5:2a:d2:40:49:6f:5d:
    42:41:f6:37:32:54:63:e2:71:be:d8:18:64:c3:1a:
    2f:23:0c:8d:1c:c4:d7:5e:fa:fb:be:ac:b7:83:af:
    68:d0:fa:57:69:14:05:48:c8:29:06:be:fd:51:d7:
    3d:31:d8:4c:00:88:69:6b:bf:a4:14:65:d8:02:eb:
    e4:79:44:96:ef:ba:2a:9a:e8:0d:0f:c8:3a:5e:33:
    b6:d1:a0:d1:82:e3:92:4a:bb:c7:2c:d6:54:82:fe:
    d0:b6:d8:4d:7d:85:ea:5f:76:80:90:aa:f3:e9:ea:
    50:57:ef:e6:df:ac:8a:4d:b9:f5:88:cf:bb:55:08:
    13:75:8c:ec:8f:eb:56:6b:78:19:03:8c:f3:30:a4:
    b2:e4:81:15:22:30:c9:cd:72:44:91:61:34:2c:0b:
    6a:1d:aa:80:83:70:4b:1b:90:4b:d6:10:1d:86:08:
    63:d0:61:f9:b6:a4:ca:a9:18:ec:3d:36:08:43:31:
    6d:c6:a4:c7:27:21:1a:c5:fd:17:45:d3:56:a5:22:
    41:31:e6:c4:0e:f1:29:ec:ca:94:81:ea:4a:48:69:
    86:6b
publicExponent: 65537 (0x10001)
privateExponent:
    21:39:44:75:02:cf:63:27:76:bb:e4:f1:58:19:aa:
    41:3d:8c:ae:57:fc:8b:c6:6e:00:7f:ea:74:2f:5a:
    82:ed:8e:48:0f:29:1c:0b:ed:49:dc:68:3b:46:7c:
    a4:1e:fa:5c:11:08:87:be:05:81:bc:bd:1a:8f:94:
    e1:a7:b7:52:e5:96:20:dd:5c:e9:d7:68:28:96:9d:
    9c:a8:30:f0:fd:d3:e2:25:20:93:dd:90:46:c6:67:
    e1:f2:3b:26:24:3e:1f:91:df:2a:f8:43:d0:4c:6f:
    03:34:75:c5:69:e1:00:6b:26:42:3c:8d:75:b5:dc:
    75:99:e4:13:53:be:b4:3d:ae:16:1b:2d:ef:1d:04:
    88:08:60:83:47:25:96:29:06:7d:ce:c9:11:16:b6:
    01:65:9d:4e:ba:a4:d3:55:99:b6:f8:6d:44:22:90:
    ff:35:2f:81:37:7e:fd:b9:19:eb:3d:45:e9:af:09:
    9b:83:07:53:09:0c:98:fd:7c:36:db:0e:d8:2a:d5:
    89:db:9c:8b:65:ab:84:6b:89:fa:06:d6:4b:02:87:
    4c:53:21:76:41:96:02:4b:5b:1c:a0:84:eb:5c:5a:
    a9:d4:35:e9:69:72:8b:2e:c2:87:2a:85:cd:e5:1a:
    66:b2:fc:86:34:b2:95:ff:71:c2:82:88:c8:a5:26:
    01
prime1:
    00:f8:5d:43:48:6b:f5:c9:a4:3c:f7:6c:29:b2:c2:
    3e:8c:25:36:6e:d7:35:fb:e9:db:f9:f5:1d:ed:63:
    2d:22:09:53:00:6c:fb:e5:d0:4b:88:b4:0a:32:2c:
    72:95:73:74:9d:13:75:24:1e:db:fe:09:73:18:f1:
    19:92:96:67:71:30:51:53:87:92:5d:64:91:d9:55:
    7f:1f:0e:0a:69:64:f8:32:2e:49:cc:0d:9f:08:b9:
    77:33:3f:85:18:e9:1e:b0:07:1d:37:42:2c:58:72:
    b5:02:7b:c8:8b:09:85:15:0c:c1:95:71:20:c0:4c:
    de:7b:1f:3a:42:48:f0:46:eb
prime2:
    00:c7:b5:59:46:cf:4d:77:66:24:81:09:d9:c2:96:
    47:91:20:4c:50:f4:a3:db:9a:6a:84:b6:9e:c0:51:
    0c:bb:e2:93:8c:d5:30:8e:02:6b:be:8f:22:55:31:
    f1:9c:cb:91:a2:b9:40:6e:52:2e:9d:ad:b6:74:89:
    ed:54:41:9c:19:04:86:fa:18:81:6a:a0:58:40:10:
    e5:cb:05:25:16:44:ac:17:99:61:fd:6d:2d:c0:c1:
    15:8c:86:6c:9b:11:b2:04:73:e1:69:67:ae:76:22:
    98:17:34:a0:c1:7b:ed:e5:c2:85:bd:a5:93:b5:82:
    e6:68:e3:63:18:d4:02:de:81
exponent1:
    40:ac:b8:9a:a1:52:6d:e1:d0:e6:75:4a:1e:7c:aa:
    a1:00:07:be:b1:58:23:73:70:8f:14:9f:68:73:cd:
    0a:f1:f6:a5:43:bc:0c:ca:43:01:24:31:0b:83:bb:
    8a:e3:77:d8:77:7a:a7:9f:49:96:4b:8b:a7:51:11:
    61:b4:bc:d7:22:c7:ea:c2:81:00:c4:f1:9d:f0:bf:
    9b:ac:a2:55:73:af:96:11:ab:b1:f1:52:1a:89:81:
    5a:dd:0d:a1:c1:02:f6:bf:c3:81:e2:3f:7e:00:d0:
    d6:06:b9:e0:4a:e8:56:e4:ed:7c:26:eb:6a:68:19:
    ff:61:d0:5f:f6:72:6b:65
exponent2:
    2b:ab:99:51:25:a5:bf:f5:43:08:40:9a:30:b5:e2:
    02:77:38:98:ff:56:11:80:6b:c8:87:92:a1:65:57:
    ce:82:16:57:d6:8a:9e:93:22:f2:71:a4:45:52:fd:
    8d:96:ea:4a:d6:0d:a3:d2:2e:c5:66:26:1e:c7:c6:
    71:05:43:d8:28:a8:47:6a:32:6a:99:93:92:b6:df:
    39:0c:ef:f6:35:a0:18:2c:ff:43:86:ab:59:9a:1f:
    57:32:51:ef:7a:e8:1d:97:25:74:82:2a:a1:44:a1:
    53:79:bb:a9:73:ab:2a:f1:e5:82:fa:01:19:d0:fd:
    07:74:a9:c7:d5:1c:a7:81
coefficient:
    07:a8:81:df:7f:91:3a:49:9d:75:ef:1c:e2:75:5f:
    a9:d6:1b:50:67:58:49:83:1f:ac:a8:28:4d:cf:5f:
    5e:8f:fc:85:13:35:25:70:49:bc:8e:b0:df:b1:25:
    a3:21:f8:d5:30:99:2b:20:c2:d6:dc:92:cb:1b:a0:
    b8:20:7e:52:0d:65:fc:6d:ef:79:59:b3:aa:85:73:
    1d:0d:5d:45:dd:c5:48:ba:62:f1:e7:cd:4b:b1:30:
    02:dd:b0:0f:0c:95:1c:c7:a2:48:e5:fd:6b:37:5b:
    ca:a0:ad:e0:3d:f6:b1:ce:fa:6d:72:3c:32:2e:1c:
    8c:4a:1d:5e:4d:89:c2:4f
writing RSA key
-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAwcBv2v0jiSdzwKol7e+Pn/SnYkmZZOQ0GI4IBVN7MypC6x72
L8Uq0kBJb11CQfY3MlRj4nG+2BhkwxovIwyNHMTXXvr7vqy3g69o0PpXaRQFSMgp
Br79Udc9MdhMAIhpa7+kFGXYAuvkeUSW77oqmugND8g6XjO20aDRguOSSrvHLNZU
gv7QtthNfYXqX3aAkKrz6epQV+/m36yKTbn1iM+7VQgTdYzsj+tWa3gZA4zzMKSy
5IEVIjDJzXJEkWE0LAtqHaqAg3BLG5BL1hAdhghj0GH5tqTKqRjsPTYIQzFtxqTH
JyEaxf0XRdNWpSJBMebEDvEp7MqUgepKSGmGawIDAQABAoIBACE5RHUCz2Mndrvk
8VgZqkE9jK5X/IvGbgB/6nQvWoLtjkgPKRwL7UncaDtGfKQe+lwRCIe+BYG8vRqP
lOGnt1LlliDdXOnXaCiWnZyoMPD90+IlIJPdkEbGZ+HyOyYkPh+R3yr4Q9BMbwM0
dcVp4QBrJkI8jXW13HWZ5BNTvrQ9rhYbLe8dBIgIYINHJZYpBn3OyREWtgFlnU66
pNNVmbb4bUQikP81L4E3fv25Ges9RemvCZuDB1MJDJj9fDbbDtgq1YnbnItlq4Rr
ifoG1ksCh0xTIXZBlgJLWxyghOtcWqnUNelpcosuwocqhc3lGmay/IY0spX/ccKC
iMilJgECgYEA+F1DSGv1yaQ892wpssI+jCU2btc1++nb+fUd7WMtIglTAGz75dBL
iLQKMixylXN0nRN1JB7b/glzGPEZkpZncTBRU4eSXWSR2VV/Hw4KaWT4Mi5JzA2f
CLl3Mz+FGOkesAcdN0IsWHK1AnvIiwmFFQzBlXEgwEzeex86QkjwRusCgYEAx7VZ
Rs9Nd2YkgQnZwpZHkSBMUPSj25pqhLaewFEMu+KTjNUwjgJrvo8iVTHxnMuRorlA
blIuna22dIntVEGcGQSG+hiBaqBYQBDlywUlFkSsF5lh/W0twMEVjIZsmxGyBHPh
aWeudiKYFzSgwXvt5cKFvaWTtYLmaONjGNQC3oECgYBArLiaoVJt4dDmdUoefKqh
AAe+sVgjc3CPFJ9oc80K8falQ7wMykMBJDELg7uK43fYd3qnn0mWS4unURFhtLzX
IsfqwoEAxPGd8L+brKJVc6+WEaux8VIaiYFa3Q2hwQL2v8OB4j9+ANDWBrngSuhW
5O18JutqaBn/YdBf9nJrZQKBgCurmVElpb/1QwhAmjC14gJ3OJj/VhGAa8iHkqFl
V86CFlfWip6TIvJxpEVS/Y2W6krWDaPSLsVmJh7HxnEFQ9goqEdqMmqZk5K23zkM
7/Y1oBgs/0OGq1maH1cyUe966B2XJXSCKqFEoVN5u6lzqyrx5YL6ARnQ/Qd0qcfV
HKeBAoGAB6iB33+ROkmdde8c4nVfqdYbUGdYSYMfrKgoTc9fXo/8hRM1JXBJvI6w
37EloyH41TCZKyDC1tySyxuguCB+Ug1l/G3veVmzqoVzHQ1dRd3FSLpi8efNS7Ew
At2wDwyVHMeiSOX9azdbyqCt4D32sc76bXI8Mi4cjEodXk2Jwk8=
-----END RSA PRIVATE KEY-----
```

   {{</detail>}}

2. 使用私钥创建一个证书签名请求（CSR）文件 `crr.pem`，同时通过指定 `-subj` 选项来设置证书的主题信息：

   ```bash
   openssl req -new -key key.pem -out csr.pem \
   -subj "/C=US/ST=California/L=San Francisco/O=Tetrate Inc./CN=tetrate.io"
   ```

   `csr.pem` 即证书签名请求（CSR）文件，用于向 CA 申请证书，其中包含了申请人的基本信息、域名、公钥等信息。当申请人通过 CSR 文件向 CA 提交申请时，CA 会对 CSR 文件进行审核，如果审核通过，就会根据 CSR 文件中的信息为申请人生成一个数字证书。

   `csr.pem` 文件中包括证书签名请求算法类型、模数、指数和主题信息。`csr.pem` 文件为文本格式，但是不可读，你可以使用文本编辑器或 OpenSSL 来查看该文件内容。

   - {{<detail "使用文本编辑器查看 csr.pem 文件内容">}}

```
-----BEGIN CERTIFICATE REQUEST-----
MIICqzCCAZMCAQAwZjELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWEx
FjAUBgNVBAcMDVNhbiBGcmFuY2lzY28xFTATBgNVBAoMDFRldHJhdGUgSW5jLjET
MBEGA1UEAwwKdGV0cmF0ZS5pbzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
ggEBAMHAb9r9I4knc8CqJe3vj5/0p2JJmWTkNBiOCAVTezMqQuse9i/FKtJASW9d
QkH2NzJUY+JxvtgYZMMaLyMMjRzE1176+76st4OvaND6V2kUBUjIKQa+/VHXPTHY
TACIaWu/pBRl2ALr5HlElu+6KproDQ/IOl4zttGg0YLjkkq7xyzWVIL+0LbYTX2F
6l92gJCq8+nqUFfv5t+sik259YjPu1UIE3WM7I/rVmt4GQOM8zCksuSBFSIwyc1y
RJFhNCwLah2qgINwSxuQS9YQHYYIY9Bh+bakyqkY7D02CEMxbcakxychGsX9F0XT
VqUiQTHmxA7xKezKlIHqSkhphmsCAwEAAaAAMA0GCSqGSIb3DQEBCwUAA4IBAQC1
E1pcJUTzXCMY0sn6RfSRD4mYKxeubleWO3KifvbfgQGSi5Obiv4ZysqaYQHprrIT
4I3xXwra6R/VpoOGEG3HSPYjCnCv1Ij6C4yKe9GsIeFf+h6NQzs8mcSUhjWfttPc
ft+ySrGBU0Xm7ROqK2wd8d17rSJFkFJYFGSTbme8cA7Q1O60NIWzdaYimnM8bwu/
SWzcW4cNskzfUWRljqM3gW8y7enDx546NkkXimpRgGC8cU2l1L8Eq7jbryre2trL
jFFJ452+JHdakkA3InrRjdr6+Ogy2YsbxRRau1jU8v9D1B6OIj08W2q5ywRI5iDJ
UF7EPI84ctjeRBRDuxwR
-----END CERTIFICATE REQUEST-----
```
{{</detail>}}

   - {{<detail "使用 OpenSSL 查看 csr.pem 文件内容">}}

运行下面的命令查看 key.pem 文件的内容：

```bash
openssl req -text -noout -verify -in csr.pem
```

 内容如下：

```
verify OK
Certificate Request:
    Data:
        Version: 0 (0x0)
        Subject: C=US, ST=California, L=San Francisco, O=Tetrate Inc., CN=tetrate.io
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                RSA Public-Key: (2048 bit)
                Modulus:
                    00:c1:c0:6f:da:fd:23:89:27:73:c0:aa:25:ed:ef:
                    8f:9f:f4:a7:62:49:99:64:e4:34:18:8e:08:05:53:
                    7b:33:2a:42:eb:1e:f6:2f:c5:2a:d2:40:49:6f:5d:
                    42:41:f6:37:32:54:63:e2:71:be:d8:18:64:c3:1a:
                    2f:23:0c:8d:1c:c4:d7:5e:fa:fb:be:ac:b7:83:af:
                    68:d0:fa:57:69:14:05:48:c8:29:06:be:fd:51:d7:
                    3d:31:d8:4c:00:88:69:6b:bf:a4:14:65:d8:02:eb:
                    e4:79:44:96:ef:ba:2a:9a:e8:0d:0f:c8:3a:5e:33:
                    b6:d1:a0:d1:82:e3:92:4a:bb:c7:2c:d6:54:82:fe:
                    d0:b6:d8:4d:7d:85:ea:5f:76:80:90:aa:f3:e9:ea:
                    50:57:ef:e6:df:ac:8a:4d:b9:f5:88:cf:bb:55:08:
                    13:75:8c:ec:8f:eb:56:6b:78:19:03:8c:f3:30:a4:
                    b2:e4:81:15:22:30:c9:cd:72:44:91:61:34:2c:0b:
                    6a:1d:aa:80:83:70:4b:1b:90:4b:d6:10:1d:86:08:
                    63:d0:61:f9:b6:a4:ca:a9:18:ec:3d:36:08:43:31:
                    6d:c6:a4:c7:27:21:1a:c5:fd:17:45:d3:56:a5:22:
                    41:31:e6:c4:0e:f1:29:ec:ca:94:81:ea:4a:48:69:
                    86:6b
                Exponent: 65537 (0x10001)
        Attributes:
            a0:00
    Signature Algorithm: sha256WithRSAEncryption
         b5:13:5a:5c:25:44:f3:5c:23:18:d2:c9:fa:45:f4:91:0f:89:
         98:2b:17:ae:6e:57:96:3b:72:a2:7e:f6:df:81:01:92:8b:93:
         9b:8a:fe:19:ca:ca:9a:61:01:e9:ae:b2:13:e0:8d:f1:5f:0a:
         da:e9:1f:d5:a6:83:86:10:6d:c7:48:f6:23:0a:70:af:d4:88:
         fa:0b:8c:8a:7b:d1:ac:21:e1:5f:fa:1e:8d:43:3b:3c:99:c4:
         94:86:35:9f:b6:d3:dc:7e:df:b2:4a:b1:81:53:45:e6:ed:13:
         aa:2b:6c:1d:f1:dd:7b:ad:22:45:90:52:58:14:64:93:6e:67:
         bc:70:0e:d0:d4:ee:b4:34:85:b3:75:a6:22:9a:73:3c:6f:0b:
         bf:49:6c:dc:5b:87:0d:b2:4c:df:51:64:65:8e:a3:37:81:6f:
         32:ed:e9:c3:c7:9e:3a:36:49:17:8a:6a:51:80:60:bc:71:4d:
         a5:d4:bf:04:ab:b8:db:af:2a:de:da:da:cb:8c:51:49:e3:9d:
         be:24:77:5a:92:40:37:22:7a:d1:8d:da:fa:f8:e8:32:d9:8b:
         1b:c5:14:5a:bb:58:d4:f2:ff:43:d4:1e:8e:22:3d:3c:5b:6a:
         b9:cb:04:48:e6:20:c9:50:5e:c4:3c:8f:38:72:d8:de:44:14:
         43:bb:1c:11
```
{{</detail>}}

3. 使用私钥和 CSR 文件创建一个 x509 证书：

   ```bash
   openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out certificate.pem
   ```

   `certificate.pem` 即公钥文件。公钥是公开的，任何人都可以获取，但只有拥有私钥的人才可以解密经公钥加密后的信息。公钥中的信息包括版本、序列号、签名算法、颁发者、有效日期、主体信息和公钥算法等。
   
   公钥文件可以通过文本编辑器直接打开，但并不可读，因为它是由二进制编码格式 DER（可分辨编码规则）转化而来，要想解析它需要使用特别的工具。你可以使用文本编辑器或 OpenSSL 来查看该文件内容。
   
   - {{<detail "使用文本编辑器查看 certificate.pem 文件内容">}}
```
-----BEGIN CERTIFICATE-----
MIIDSDCCAjACCQCYqocIyo/SfzANBgkqhkiG9w0BAQsFADBmMQswCQYDVQQGEwJV
UzETMBEGA1UECAwKQ2FsaWZvcm5pYTEWMBQGA1UEBwwNU2FuIEZyYW5jaXNjbzEV
MBMGA1UECgwMVGV0cmF0ZSBJbmMuMRMwEQYDVQQDDAp0ZXRyYXRlLmlvMB4XDTIy
MTIxMTAxMjY1OFoXDTIzMTIxMTAxMjY1OFowZjELMAkGA1UEBhMCVVMxEzARBgNV
BAgMCkNhbGlmb3JuaWExFjAUBgNVBAcMDVNhbiBGcmFuY2lzY28xFTATBgNVBAoM
DFRldHJhdGUgSW5jLjETMBEGA1UEAwwKdGV0cmF0ZS5pbzCCASIwDQYJKoZIhvcN
AQEBBQADggEPADCCAQoCggEBAMHAb9r9I4knc8CqJe3vj5/0p2JJmWTkNBiOCAVT
ezMqQuse9i/FKtJASW9dQkH2NzJUY+JxvtgYZMMaLyMMjRzE1176+76st4OvaND6
V2kUBUjIKQa+/VHXPTHYTACIaWu/pBRl2ALr5HlElu+6KproDQ/IOl4zttGg0YLj
kkq7xyzWVIL+0LbYTX2F6l92gJCq8+nqUFfv5t+sik259YjPu1UIE3WM7I/rVmt4
GQOM8zCksuSBFSIwyc1yRJFhNCwLah2qgINwSxuQS9YQHYYIY9Bh+bakyqkY7D02
CEMxbcakxychGsX9F0XTVqUiQTHmxA7xKezKlIHqSkhphmsCAwEAATANBgkqhkiG
9w0BAQsFAAOCAQEAebKB8bScFIryRXjgtjN+rZpmZjhm+hI7tbX3IYFBCtjqirPf
1nykCjfVpkgptZ2G5DYGif3pfeANPWFKGz0otYtujFAt74qE12r5J3sMWQv/sCTa
lGfc/wasHG+YZOeJs3Mw/5wnmkJrWVBNiRMUGUPt2g05JjUiIOevuhj2vjDk2BIL
r7R44iAr2fhGX+bcmnnI/mEFTaWza8eYc7PCH8YNeSUbtbSYP5FDNe57jjICBtGt
ofEQTzOBc0dCUN2XhylHO6Wf1nIRAEgqE72NSRrRXrdvqwjfuNLuYsy+8ngEziwy
B8doqZgHFaUCgXYW25XYltmxWNBXt0nuaHWn/Q==
-----END CERTIFICATE-----
```
   {{</detail>}}

    - {{<detail "使用 OpenSSL 查看 certificate.pem 文件内容">}}

运行下面的命令查看 key.pem 文件的内容：

```bash
openssl x509  -noout -text -in certificate.pem
```

 内容如下：

```
Certificate:
    Data:
        Version: 1 (0x0)
        Serial Number:
            98:aa:87:08:ca:8f:d2:7f
    Signature Algorithm: sha256WithRSAEncryption
        Issuer: C=US, ST=California, L=San Francisco, O=Tetrate Inc., CN=tetrate.io
        Validity
            Not Before: Dec 11 01:26:58 2022 GMT
            Not After : Dec 11 01:26:58 2023 GMT
        Subject: C=US, ST=California, L=San Francisco, O=Tetrate Inc., CN=tetrate.io
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                RSA Public-Key: (2048 bit)
                Modulus:
                    00:c1:c0:6f:da:fd:23:89:27:73:c0:aa:25:ed:ef:
                    8f:9f:f4:a7:62:49:99:64:e4:34:18:8e:08:05:53:
                    7b:33:2a:42:eb:1e:f6:2f:c5:2a:d2:40:49:6f:5d:
                    42:41:f6:37:32:54:63:e2:71:be:d8:18:64:c3:1a:
                    2f:23:0c:8d:1c:c4:d7:5e:fa:fb:be:ac:b7:83:af:
                    68:d0:fa:57:69:14:05:48:c8:29:06:be:fd:51:d7:
                    3d:31:d8:4c:00:88:69:6b:bf:a4:14:65:d8:02:eb:
                    e4:79:44:96:ef:ba:2a:9a:e8:0d:0f:c8:3a:5e:33:
                    b6:d1:a0:d1:82:e3:92:4a:bb:c7:2c:d6:54:82:fe:
                    d0:b6:d8:4d:7d:85:ea:5f:76:80:90:aa:f3:e9:ea:
                    50:57:ef:e6:df:ac:8a:4d:b9:f5:88:cf:bb:55:08:
                    13:75:8c:ec:8f:eb:56:6b:78:19:03:8c:f3:30:a4:
                    b2:e4:81:15:22:30:c9:cd:72:44:91:61:34:2c:0b:
                    6a:1d:aa:80:83:70:4b:1b:90:4b:d6:10:1d:86:08:
                    63:d0:61:f9:b6:a4:ca:a9:18:ec:3d:36:08:43:31:
                    6d:c6:a4:c7:27:21:1a:c5:fd:17:45:d3:56:a5:22:
                    41:31:e6:c4:0e:f1:29:ec:ca:94:81:ea:4a:48:69:
                    86:6b
                Exponent: 65537 (0x10001)
    Signature Algorithm: sha256WithRSAEncryption
         79:b2:81:f1:b4:9c:14:8a:f2:45:78:e0:b6:33:7e:ad:9a:66:
         66:38:66:fa:12:3b:b5:b5:f7:21:81:41:0a:d8:ea:8a:b3:df:
         d6:7c:a4:0a:37:d5:a6:48:29:b5:9d:86:e4:36:06:89:fd:e9:
         7d:e0:0d:3d:61:4a:1b:3d:28:b5:8b:6e:8c:50:2d:ef:8a:84:
         d7:6a:f9:27:7b:0c:59:0b:ff:b0:24:da:94:67:dc:ff:06:ac:
         1c:6f:98:64:e7:89:b3:73:30:ff:9c:27:9a:42:6b:59:50:4d:
         89:13:14:19:43:ed:da:0d:39:26:35:22:20:e7:af:ba:18:f6:
         be:30:e4:d8:12:0b:af:b4:78:e2:20:2b:d9:f8:46:5f:e6:dc:
         9a:79:c8:fe:61:05:4d:a5:b3:6b:c7:98:73:b3:c2:1f:c6:0d:
         79:25:1b:b5:b4:98:3f:91:43:35:ee:7b:8e:32:02:06:d1:ad:
         a1:f1:10:4f:33:81:73:47:42:50:dd:97:87:29:47:3b:a5:9f:
         d6:72:11:00:48:2a:13:bd:8d:49:1a:d1:5e:b7:6f:ab:08:df:
         b8:d2:ee:62:cc:be:f2:78:04:ce:2c:32:07:c7:68:a9:98:07:
         15:a5:02:81:76:16:db:95:d8:96:d9:b1:58:d0:57:b7:49:ee:
         68:75:a7:fd

```

{{</detail>}}

{{<callout note "关于 PEM 文件">}}

PEM 文件是一种用于存储证书、公钥或私钥的文件。它采用 Base64 编码的 ASCII 格式，并使用特定的文件扩展名，例如 `.pem`、`.crt`、`.cer` 或 `.key`。PEM 文件通常用于存储加密密钥、数字证书和公钥基础设施（PKI）证书。

PEM 文件的内容通常以一组特定的标头和脚本开始，例如 `-----BEGIN RSA PRIVATE KEY-----` 和 `-----END RSA PRIVATE KEY-----`。这些标头和脚本指定了文件的类型和数据的开始和结束位置。

PEM 文件可以通过文本编辑器直接打开，但并不可读，因为它是由二进制编码格式 DER（可分辨编码规则）转化而来，要想解析它需要使用特别的工具，例如 OpenSSL。

{{</callout>}}

## 使用自定义的 CA 证书和密钥

默认情况下，Istio CA 会生成一个自签名的根证书和密钥，并使用它们来签署工作负载证书。为了保护根 CA 密钥，你应该使用在安全机器上离线运行的根 CA，并使用根 CA 向运行在每个集群上的 Istio CA 签发中间证书。Istio CA 可以使用管理员指定的证书和密钥来签署工作负载证书，并将管理员指定的根证书作为信任根分配给工作负载。

若想使用自定义的 CA 证书和密钥，你需要：

- 创建 CA 配置文件并使用它来创建自签名的 CA 根证书和密钥；

接下来，我们将模拟一下为 Bookinfo 的 productpage 服务创建和挂载证书的过程。

### 手动生成证书 {#manual-gernerate-certificates}

我们将先创建一个自签名的 CA 证书，然后再用该 CA 证书为 productpage 服务颁发证书，步骤如下：

1. 创建 CA 私钥 `ca.key`；

   ```bash
   openssl genrsa -out ca.key
   ```

2. 创建 CA 配置文件 `ca.conf`：

   ```ini
   [ req ]
   default_bits = 2048
   prompt = no
   utf8 = yes
   encrypt_key = no
   distinguished_name  = req_dn
   req_extensions = req_ext
   x509_extensions = req_ext
   
   [ req_dn ]
   O = Istio
   CN = Root CA
   
   [ req_ext ]
   subjectKeyIdentifier = hash
   basicConstraints = critical, CA:true
   keyUsage = critical, digitalSignature, nonRepudiation, keyEncipherment, keyCertSign
   ```

3. 使用 CA 私钥 `ca.key` 生成自签名证书 `ca.pem`，其中主题中包含 CA 的信息：

   ```bash
   openssl req -x509 -new -nodes -key ca.key -days 365 -out ca.pem -config ca.conf
   ```

4. 创建服务器的私钥 `server.key`：

   ```bash
   openssl genrsa -out server.key
   ```

5. 创建证书签名请求配置文件 `csr.conf`，其中包含 CA 的地址及附加信息；

   ```ini
   [ req ]
   default_bits = 2048
   prompt = no
   utf8 = yes
   encrypt_key = no
   distinguished_name  = dn
   req_extensions = req_ext
   x509_extensions = req_ext
   
   [ req_dn ]
   O = Istio
   CN = productpage
   
   [ req_ext ]
   subjectKeyIdentifier = hash
   basicConstraints = critical, CA:true
   keyUsage = critical, digitalSignature, nonRepudiation, keyEncipherment, keyCertSign
   ```

6. 基于服务器的 CSR 文件配置文件 `csr.conf` 和服务器的私钥文件 `server.key` 创建证书签名请求 `server.csr`：

   ```bash
   openssl req -new -key server.key -out server.csr -config csr.conf
   ```

7. 基于 CA 的私钥 `ca.key`、CA 的证书 `ca.pem` 和服务器的证书签名请求创建服务器证书 `server.pem`：

   ```bash
   openssl x509 -req -in server.csr -CA ca.pem -CAkey ca.key \
       -CAcreateserial -out server.pem -days 365 \
       -extensions req_ext -extfile csr.conf -sha256
   ```

8. 查看证书签名请求：

   ```bash
   openssl req -noout -text -in ./server.csr
   ```

9. 查看证书：

   ```bash
   openssl x509 -noout -text -in ./server.pem
   ```

### 为服务挂载证书

问题：查看工作负载的证书链

Istio 网格的根证书位于 `istio-system` 命名空间中，存储在名称为 `istio-ca-root-cert` 的 ConfigMap，证书名称为 `root-cert.pem`。

```bash
kubectl -n istio-system get secret istio-ca-secret -o yaml
```



为 `default` 命名空间开启严格的 mTLS。

```bash
kubectl apply -n default -f - <<EOF
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
spec:
  mtls:
    mode: STRICT
EOF
```

```bash
kubectl exec "$(kubectl get pod -l app=sleep -o jsonpath={.items..metadata.name})" -c istio-proxy -- openssl s_client -showcerts -connect httpbin.default:8000 > httpbin-proxy-cert.txt
```

解析证书

```bash
gsed -n '/-----BEGIN CERTIFICATE-----/{:start /-----END CERTIFICATE-----/!{N;b start};/.*/p}' httpbin-proxy-cert.txt > certs.pem
gawk 'BEGIN {counter=0;} /BEGIN CERT/{counter++} { print > "proxy-cert-" counter ".pem"}' < certs.pem
```

校验

```bash
```



### 使用 cert-manager 生成证书



## Istio 如何管理证书

Istio 为工作负载配置证书的流程：

- 工作负载启动时，向 Pod 中注入的 Envoy 代理会使用 ConfigMap 在挂载根 CA 证书；
- Istiod 根据该工作负载的 Service Account 生成 SVID（SPIFFE密钥证书对）；
- Istiod 通过 SDS API 向工作负载分发 SVID 到 Envoy 代理中并挂载到 `/var/run/secrets/workload-spiffe-credentials`；
- Istiod 负责定期替换密钥证书，以及根据需要撤销密钥证书；

插入 SPIRE 的图片

SVID 的组成

查看证书

```bash
istioctl proxy-config secret $POD_NAME -o json | jq -r \
'.dynamicActiveSecrets[0].secret.tlsCertificate.certificateChain.inlineBytes' | base64 --decode > chain.pem
```



## 问题：根 CA 证书过期了怎么办？

如果您的 Istio 根证书已过期，您需要重新生成新的根证书并将其用于您的 Istio 部署。这通常需要您重新配置并重新部署 Istio。具体步骤可能会有所不同，具体取决于您如何初始化 Istio 和您部署 Istio 的方式。

通常情况下，您可以按照以下步骤来更新 Istio 的根证书：

1. 在 Istio 控制面板中，找到用于管理证书的选项。

1. 使用适当的命令生成新的根证书。例如，如果您使用的是 Istioctl，您可以使用以下命令生成新的根证书：

   ```bash
   istioctl x certificate generate --ca-certificate-output-file=<output_file_path>
   ```

1. 将新生成的根证书安装到 Istio 的控制平面中。例如，如果您使用的是 Istioctl，您可以使用以下命令安装新的根证书：

   ```
   istioctl x certificate install --ca-certificate-file=<output_file_path>
   ```

1. 重新部署 Istio，使用新的根证书。这可能需要重新配置 Istio 和重新安装 Istio。具体步骤取决于您如何部署 Istio。io9

希望这些信息能够帮助您处理 Istio 中过期的根证书。

## 参考 {#reference}

- [插入 CA 证书 - istio.io](https://istio.io/latest/zh/docs/tasks/security/cert-management/plugin-ca-cert/)
- [如何设置 SSL 证书 - istio.tetratelabs.io](https://istio.tetratelabs.io/zh/istio-in-practice/setting-up-ssl-certs/)
- [管理集群中的 TLS 认证 - kubernetes.io](https://kubernetes.io/zh-cn/docs/tasks/tls/managing-tls-in-a-cluster/)
- [手动生成证书 - kubernetes.io](https://kubernetes.io/zh-cn/docs/tasks/administer-cluster/certificates/)
