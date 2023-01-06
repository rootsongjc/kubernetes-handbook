---
title: "Istio 中的证书管理方式介绍"
description: "本文介绍了数字证书和 Istio 中的证书管理方式。"
date: 2022-12-20T09:09:40+08:00
draft: false
tags: ["Istio","安全","证书"]
categories: ["Istio"]
type: "post"
image: "images/banner/cert.jpg"
---

我在[如何理解 Istio 中的 mTLS 流量加密](/blog/understanding-the-tls-encryption-in-istio/)这篇文章中提出流量加密的关键是证书管理。我们可以使用 Istio 中内置了CA（证书授权机构）也可以使用自定义 CA 来管理网格内的证书。这篇博客将为你讲解 Istio 是如何进行证书管理的。

## 什么是证书？ {#certificates-introduction}

在介绍 Istio 的证书管理方式之前，我们先来了解一下什么是证书。若你已了解证书的作用及原理，请直接跳到 Istio 中的证书管理部分。

证书（Certificate），又称电子证书，是用于身份认证和加密通信的一种数字证明文件。在了解 Istio 的证书管理之前，我们先来了解一下什么是证书。如果你已经了解了证书，可以跳过这一节。

证书有很多类别，本文中的证书特指的是 [X.509 V3 证书](https://datatracker.ietf.org/doc/html/rfc5280)。X509 证书是一种常见的数字证书格式，用于在计算机网络中识别实体的身份。X509 是公钥基础设施（PKI）的国际标准，主要用于身份认证和信息加密，例如 TLS。X.509 证书中包含了个人、组织或计算机的身份信息和公钥。V3 是它的最新版本。它主要用于在客户端和服务器之间进行安全通信，例如在通过 HTTPS 访问网站时。x509 证书通常由 CA 颁发，该 CA 会验证实体的身份，并将这些信息编码到证书中。当客户端连接到服务器时，服务器会向客户端提供其 x509 证书，客户端会验证证书的有效性，并通过该证书来识别服务器的身份。通过这种方式，双方可以安全地进行通信，并确保数据传输的完整性和保密性。

### 哈希函数 {#hash}

谈到证书就不得不提哈希（Hash）函数，因为证书的内容会使用哈希函数进行哈希处理，然后用证书颁发者的私钥进行签名。这样，当收到一份证书时，接收者就可以使用证书颁发者的公钥来验证证书的合法性。

哈希函数是一种将任意长度的输入（也称为消息）映射为固定长度的输出的函数。这个输出也称为哈希值或消息摘要。

哈希函数有许多用途，其中一个重要的用途是密码存储。当用户在系统中设置密码时，通常不会将真实的密码直接存储在系统中。相反，会将密码进行哈希处理，并将哈希值存储在系统中。当用户登录时，系统会将用户输入的密码进行哈希处理，然后与存储的哈希值进行比较。如果两者相同，则证明用户输入的密码正确，反之则错误。

哈希函数有很多种类型，例如 MD5、SHA-1 等。这些函数都有一些共同的特点，比如输出固定长度、不可逆、散列冲突少等。

哈希函数的安全性与其输出的长度有关。一般来说，输出长度越长，哈希函数就越安全。但是，输出长度越长，哈希处理的时间就越长，因此要在安全性和效率之间进行平衡。

### 证书的作用 {#cert-works}

证书的用途广泛，凡是需要加密、认证、授权的场景都会用到它，比如：

- 在 Kubernetes 中你需要给各个组件配置证书，你可以选择[手动生成证书](https://kubernetes.io/zh-cn/docs/tasks/administer-cluster/certificates/)；
- Istio 中为实现自动 mTLS 给各个工作负载颁发的证书；
- 访问 HTTPS 网站所用到的证书等；

证书就像是由权威机构印发的名片，供使用者表明其身份，同时还可以为信息加密，保证通信的安全性和完整性。下图展示的是 TLS 通信的大概步骤，其中证书承担了证明服务器身份和加密通信的职责。

下面以一个网站的 HTTP 链接为例，颁发数字证书、验证和加密通信的过程如下图所示。

![TLS 证书颁发和校验过程](tls.svg)

详细步骤如下：

1. 服务器（网站所有者）向 CA 提交证书签名请求；
2. CA  验证服务器的身份和网站的真实性后为服务器颁发数字证书，服务器安装该证书，以便访问者能够验证网站的安全性；
3. 用户通过浏览器（客户端）向网站发送请求；
4. 服务器向客户端返回 TLS 证书；
5. 客户端向 CA 验证证书的有效性，若有效则建立连接，若无效则提示用户拒绝连接；
6. 客户端生成一对随机的公钥和私钥；
7. 客户端将并将自己的公钥发送给服务端；
8. 服务端使用客户端的公钥加密消息；
9. 服务端将加密后的数据发送给客户端；
10. 客户端使用自己的私钥解密服务端发送的数据；

至此，双方建立了一个安全的通道，并可以通过该通道进行双向加密的数据传输。

### 如何生成证书？{#how-to-generate-certificates}

你可以通过以下开源工具生成 X.509 证书：

- [Easy-RSA](https://github.com/OpenVPN/easy-rsa)：一个简单地命令行工具，由 OpenVPN 项目组维护，使用 EasyRSA 可以轻松地为 OpenVPN 网络生成安全的证书和密钥；
- [OpenSSL](https://github.com/openssl/openssl)：由个人发起于 1995 年，现由独立组织维护，只提供命令行工具；
- [CFSSL](https://github.com/cloudflare/cfssl)：由 CloudFlare 开发和维护，不仅仅是一个用于生成证书的命令行工具，还可以作为 PKI 服务器；
- [BoringSSL](https://github.com/google/boringssl)：Google 开发和维护的 OpenSSL 分支，已用于 Chrome 浏览器和安卓操作系统；

因为可能大多数人都对 OpenSSL 比较熟悉，所以下文中我们将使用 OpenSSL 来创建证书。

### 证书的组成 {#cert-component}

下面以 X.509 V3 证书为例，讲解数字证书的组成。下面是该证书的一个示例：

```
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            fc:c6:18:2e:20:bd:27:b5:6b:60:bc:47:23:6b:8b:d9
    Signature Algorithm: sha256WithRSAEncryption
        Issuer: O=cluster.local
        Validity
            Not Before: Dec 15 07:25:32 2022 GMT
            Not After : Dec 16 07:27:32 2022 GMT
        Subject:
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                RSA Public-Key: (2048 bit)
                Modulus:
                    00:eb:40:16:87:6c:17:5a:9c:b2:91:00:94:d1:31:
                    37:bb:d7:1e:e6:06:1c:a1:c1:35:64:54:82:54:af:
                    b8:4b:40:6f:e0:73:86:4e:c1:c6:75:b8:c8:30:ac:
                    69:16:e8:68:25:cb:dd:e8:53:55:ec:7a:bd:a9:d3:
                    42:44:7f:e5:f5:52:dd:99:ae:c2:1a:a2:06:1f:be:
                    1b:e6:3e:69:87:a3:fc:91:21:39:b0:a7:67:11:f2:
                    3c:55:c6:4b:04:15:1b:ff:49:14:88:c4:58:87:79:
                    96:5b:6e:00:1c:c1:e7:2c:53:0c:d1:77:dc:a8:82:
                    cc:fa:26:c1:bb:6c:df:a8:43:0c:b7:cc:f0:a2:11:
                    9b:e8:3f:8a:1d:ed:2a:ff:1f:d1:03:eb:8a:b9:98:
                    40:18:83:24:4f:14:95:a3:59:ef:67:0f:35:6d:ae:
                    91:81:b2:04:02:16:80:d1:39:bd:70:cf:0f:cb:9a:
                    81:39:d9:fe:52:a5:cf:79:4f:a3:69:d8:0d:39:6a:
                    48:24:8d:2b:88:04:fa:81:de:65:50:7d:1a:3d:cd:
                    f3:1c:42:63:29:75:a0:9b:8e:16:44:3a:89:d6:2b:
                    41:76:65:a5:2e:c8:b6:d2:89:42:5d:21:24:33:30:
                    f0:9d:0b:4d:cf:78:d5:45:2d:49:5a:55:50:98:93:
                    03:f5
                Exponent: 65537 (0x10001)
        X509v3 extensions:
            X509v3 Key Usage: critical
                Digital Signature, Key Encipherment
            X509v3 Extended Key Usage:
                TLS Web Server Authentication, TLS Web Client Authentication
            X509v3 Basic Constraints: critical
                CA:FALSE
            X509v3 Authority Key Identifier:
                keyid:BA:31:8A:9C:ED:EB:49:D2:54:09:98:D9:4C:3A:9C:42:D0:64:8D:B2

            X509v3 Subject Alternative Name: critical
                URI:spiffe://cluster.local/ns/default/sa/httpbin
    Signature Algorithm: sha256WithRSAEncryption
         90:7f:cb:6f:0b:16:cb:59:7d:f4:87:a7:5a:38:fa:0a:16:d8:
         83:0d:b1:36:77:a2:4a:fe:38:52:ab:49:e9:89:50:1a:4c:e9:
         94:07:37:7f:27:bc:2c:ce:c1:d2:33:75:5d:b6:ab:ae:cb:2e:
         71:f4:22:c0:40:15:27:02:75:c1:32:2e:83:49:73:6c:9a:ea:
         04:ef:55:2d:8d:71:30:9b:e4:30:dd:95:20:0d:7c:d2:f4:30:
         2f:07:2e:9f:53:37:e6:3d:14:c7:41:f4:09:8b:a3:76:56:c7:
         c7:92:0f:fc:17:5a:5a:32:6c:9e:87:18:2e:51:75:54:68:d8:
         01:c1:07:cc:b0:35:bf:0b:6c:62:a6:5b:23:61:35:c8:4f:7f:
         e7:1f:a0:e9:11:44:a6:17:52:4d:00:40:21:de:63:ee:02:c8:
         2b:5d:a1:7a:5d:7f:d5:d3:c1:7d:5f:00:40:e8:80:8d:cc:e9:
         8a:c6:b4:98:fe:7a:7d:37:0c:6f:4c:31:91:7a:79:30:84:cd:
         01:a7:14:f6:1b:33:8f:0f:50:1c:36:38:6b:24:da:cf:49:8a:
         5b:28:cf:27:76:e1:a5:c7:e6:d5:6e:d8:36:85:aa:1f:a5:ac:
         fa:f1:2e:a2:36:2e:25:b0:71:24:d1:3e:d5:e5:19:2b:0b:6f:
         b7:17:e4:75
```

证书中各个字段的含义如下：

- 证书版本（Version）：表示证书的版本号。
- 序列号（Serial Number）：表示证书的唯一序列号。
- 签名算法（Signature Algorithm）：表示证书的签名算法，例如 RSA、DSA 或 ECDSA 等。
- 证书颁发机构（Issuer）：表示颁发该证书的可信的第三方机构的名称。
- 有效期（Validity）：表示证书的有效期，包括证书生效日期（Not Before）和证书失效日期（Not After）。
- 使用者（Subject）：表示证书所有者的名称。
- 公钥信息（Subject Public Key Info）：表示证书所有者的公钥以及公钥的算法。
- 扩展（Extensions）：表示证书的扩展信息，包括：
  - 密钥用法扩展（Key Usage Extension）：表示证书所有者的密钥可用于哪些操作，例如数字签名、密钥加密等。
  - 扩展密钥用法扩展（Extended Key Usage Extension）：表示证书所有者的密钥可用于哪些扩展的操作，例如 TLS Web Server Authentication、TLS Web Client Authentication 等。
  - 基本约束扩展（Basic Constraints Extension）：表示证书所有者是否是证书颁发机构的下级机构，以及是否允许其作为证书颁发机构颁发其他证书。
  - 主体密钥表示扩展（Authority Key Identifier）：包含一个或多个唯一的标识符，用于表示证书颁发机构的密钥。这些标识符可以是证书颁发机构的公钥哈希值，也可以是证书颁发机构的证书序列号。该扩展用于验证证书的合法性，例如在验证证书链时，用于验证证书颁发机构是否为可信的机构。这个扩展字段是可选的，但在许多情况下都会被使用。
  - 主体替代名称扩展（Subject Alternative Name Extension）：表示证书所有者的其他名称，例如域名、IP 地址、电子邮件地址等。

### 证书信任链 {#certificate-trust-chain}

证书的验证需要通过证书信任链（Certificate Trust Chain）。证书信任链是指用于身份验证的一系列证书，它们形成一条从一个可信任的根证书颁发机构开始，逐级向下连接，直到用于验证某个特定证书的中间证书或终端证书的一种方式。证书信任链允许数字证书的可信度随着证书级别的升高而提高。

在下面的证书信任链示意图中，你可以看到四条信任链。

![证书信任链](certificate-trust-chain.svg)

证书的信任链是一个树形结构，每个 CA 都可以有一或多个子 CA，一共有三种角色：

- 根 CA：最顶层的 CA，可以颁发证书给中间 CA；
- 中间 CA：除根 CA 以外的 CA，可颁发终端证书；
- 终端实体：拥有终端证书的设备或服务；

根 CA 是数字证书的最顶级颁发机构，因此它所颁发的证书是最可信的。根证书颁发机构通常由政府机构或其他权威机构（如国际基础设施安全组织）经营和监管。常见的根 CA 包括：

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

在 Chrome 浏览器中打开一个 HTTPS 网页，你可以通过点击地址栏左侧的锁图标查看证书信息，其中包括证书信任链，例如 [https://tetrate.io](https://tetrate.io) 的证书信任链如下图：

{{<figure title="Tetrate.io 的证书信任链" src="tetrate-cert.jpg" width="60%">}}

证书信任链允许客户端（例如，Web 浏览器）在验证终端证书时，逐级向上验证每个证书，以确定它是否可信。数字证书签发的原理是 CA 将证书拥有者的公钥与身份信息绑定在一起，然后 CA 使用其专有的私钥生成正式的数字签名，用以表示这个证书是经 CA 签发的。在证书校验时使用 CA 的公钥对这个证书上的数字签字进行验证即可。

## 将 Istio 纳入 PKI 证书信任链 {#istio-pki}

在使用 Istio 之前，企业通常有自己的内部 PKI（公钥基础设施），那么如何将 Istio 纳入到 PKI 的证书信任链中呢？

我们知道 Istio 内置了证书管理功能，可以开箱即用，Istio 启动时会为 *istiod* 创建自签名证书，作为网格内所有工作负载的根证书。这样做有个问题，如果你有多网格，内置的根证书无法做到网格间互信。正确的做法是不使用 Istio 自签名证书，而是将 Istio 纳入到你的证书信任链中，将 Istio 集成到你的 PKI，为 PKI 每个网格创建一个中间证书，这样两个网格拥有了共同的信任根，就可以做到网格间互信。

通过为 Istio 网格创建中间 CA 使其纳入到企业内部 PKI 证书信任链中，如下图所示。

![为多网格创建中间 CA 使得 Istio 纳入到企业内部 PKI 证书信任链](cluster-ca.svg)

将 Istio 纳入企业内部 PKI 证书信任链后有诸多好处：

- 可以实现跨网格/集群之间的通信：有了共同的信任根，集群之间就可以互相验证身份，进而实现跨集群通信；
- 更细粒度的证书撤销：你可以撤销某个实体或中间 CA 的证书来撤销某个服务或集群的证书；
- 轻松实现证书轮换：你可以按集群/网格实现证书轮换，而不是轮换根节点证书，这样会减少停机时间，推荐您使用 [cert-manager](https://github.com/cert-manager/cert-manager) 来实现自动化的大规模 CA 证书轮换，详情请参考[在生产中大规模自动化 Istio CA 轮换](https://lib.jimmysong.io/blog/automate-istio-ca-rotation-in-production-at-scale/)；

关于将 Istio 纳入企业内部 PKI 的证书信任链的详细说明请参考[这篇博客](https://lib.jimmysong.io/blog/istio-trust/)。

## Istio 中使用自定义 CA 的步骤 {#istio-custom-ca}

默认情况下，Istio CA 会生成一个自签名的根证书和密钥，并使用它们来签署工作负载证书。为了保护根 CA 密钥，你应该使用在安全机器上离线运行的根 CA，并使用根 CA 向运行在每个集群上的 Istio CA 签发中间证书。Istio CA 可以使用管理员指定的证书和密钥来签署工作负载证书，并将管理员指定的根证书作为信任根分配给工作负载。

下图展示了 Istio 中的证书签发和挂载过程。

![Istio 中的证书签发和挂载过程](cert-process.svg)

1. Istio 向 Pod 中注入的 Envoy 代理中有两个进程——`envoy` 和 `pilot-agent`。`pilot-agent` 为 Envoy 生成私钥，通过 UNIX Domain Socekt（UDS）使用 Secret Discovery Service（SDS）向 CA 发起证书签名请求（CSR），如果你没有配置 CA 插件的话，Istio 默认向 *istiod* 发起 CSR；
2. `istiod` 内置 CA 向 `pilot-agent` 返回证书；
3. `pilot-agent` 将生成的私钥和 CA 返回的证书发送给 `envoy` 挂载；

Istio 默认使用内置于 *istiod* 中的 CA，也支持插入其他 CA，见 [Istio 文档](https://istio.io/latest/zh/docs/tasks/security/cert-management/plugin-ca-cert/)。若想使用自定义的 CA 证书和密钥为服务创建身份，你需要：

- 创建 CA 配置文件并使用它来创建自签名的 CA 根证书和密钥；
- 为服务创建私钥、签名请求配置文件；
- 为服务创建证书签名请求（CSR）；
- 使用根证书和密钥以及服务的签名请求文件为服务创建证书；

接下来，我们将以为 Bookinfo 的 productpage 服务创建和挂载证书为例详述 Istio 内置 CA 签发证书的流程。

## Istio 内置 CA 签发证书流程  {#istio-ca}

Istio 启动时将创建一个自签名的 CA 证书，然后再用该 CA 证书为网格内的服务颁发证书。下面我们手动模拟 Istio 内置 CA 签发证书的步骤：

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

   {{<callout note "关于 PEM 文件">}}

   PEM 文件是一种用于存储证书、公钥或私钥的文件。它采用 Base64 编码的 ASCII 格式，并使用特定的文件扩展名，例如 `.pem`、`.crt`、`.cer` 或 `.key`。PEM 文件通常用于存储加密密钥、数字证书和公钥基础设施（PKI）证书。

   PEM 文件的内容通常以一组特定的标头和脚本开始，例如 `-----BEGIN RSA PRIVATE KEY-----` 和 `-----END RSA PRIVATE KEY-----`。这些标头和脚本指定了文件的类型和数据的开始和结束位置。

   PEM 文件可以通过文本编辑器直接打开，但并不可读，因为它是由二进制编码格式 DER（可分辨编码规则）转化而来，要想解析它需要使用特别的工具，例如 OpenSSL。

   {{</callout>}}

4. 为工作负载创建私钥 `workload.key`：

   ```bash
   openssl genrsa -out workload.key
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

6. 基于工作负载的 CSR 配置文件 `csr.conf` 和工作负载的私钥文件 `workload.key` 创建证书签名请求 `workload.csr`：

   ```bash
   openssl req -new -key workload.key -out workload.csr -config csr.conf
   ```

7. 基于 CA 的私钥 `ca.key`、CA 的证书 `ca.pem` 和工作负载的证书签名请求创建服务器证书 `workload.pem`：

   ```bash
   openssl x509 -req -in workload.csr -CA ca.pem -CAkey ca.key \
       -CAcreateserial -out workload.pem -days 365 \
       -extensions req_ext -extfile csr.conf -sha256
   ```

   Istiod 在收到工作负载的 CSR 后将根证书 `ca.pem` 和服务证书下发给工作负载；

8. 查看工作负载中 Envoy 代理挂载的证书链：

   ```bash
   istioctl proxy-config secret deployment/productpage-v1 -o json | jq -r \
   '.dynamicActiveSecrets[0].secret.tlsCertificate.certificateChain.inlineBytes' | base64 --decode > chain.pem
   ```

   `chain.pem` 文件中保存着 `productpage` 服务的证书链，因为我们使用的 Istio 内置 CA 作为根 CA，所以该文件中只保存有一个证书，可以运行下面的命令查看：

   ```bash
   openssl x509 -noout -text -in chain.pem
   ```

9. 查看 Envoy 代理挂载的根证书：

   ```bash
   istioctl proxy-config secret deployment/productpage-v1 -o json | jq -r \
   '.dynamicActiveSecrets[1].secret.validationContext.trustedCa.inlineBytes' | base64 --decode > root.pem
   ```

   `root.pem` 即为根证书，运行下面的命令查看：

   ```bash
   openssl x509 -noout -text -in root.pem
   ```

   {{<callout note "提示">}}

   `root.pem` 中的内容与 `istiod-ca-cert` ConfigMap 中的 `root-cert.pem` 及 `istio-ca-secret` 中的 `ca-cert.pem` 是一样的，虽然现在 Envoy 已不在通过读取挂载卷来获得证书内容，但之所以保留了这些卷是为了向后兼容。

   {{</callout>}}

   证书挂载到 Envoy 代理之后，*istiod* 将负责定期替换密钥证书，以及根据需要撤销密钥证书。

## 总结 {#summary}

本文向你介绍了数字证书的作用、组成和证书信任链，以及 Istio 中内置的开箱即用的证书管理器运作的流程。但是 Istio 内置 CA 仍然有一定限制，在下一篇博客中我将向你介绍如何使用插件 SPIRE 和 cert-manager 来实现细粒度的证书管理和自动证书轮换。

## 参考 {#reference}

- [插入 CA 证书 - istio.io](https://istio.io/latest/zh/docs/tasks/security/cert-management/plugin-ca-cert/)
- [如何设置 SSL 证书 - istio.tetratelabs.io](https://istio.tetratelabs.io/zh/istio-in-practice/setting-up-ssl-certs/)
- [管理集群中的 TLS 认证 - kubernetes.io](https://kubernetes.io/zh-cn/docs/tasks/tls/managing-tls-in-a-cluster/)
- [手动生成证书 - kubernetes.io](https://kubernetes.io/zh-cn/docs/tasks/administer-cluster/certificates/)
- [将 Istio 纳入信任链：使用现有 PKI 作为信任根 - lib.jimmysong.io](https://lib.jimmysong.io/blog/istio-trust/)
- [如何使用 Hashicorp Vault 作为一种更安全的方式来存储 Istio 证书 - lib.jimmysong.io](https://lib.jimmysong.io/blog/how-to-use-hashicorp-vault-as-a-more-secure-way-to-store-istio-certificates/)
