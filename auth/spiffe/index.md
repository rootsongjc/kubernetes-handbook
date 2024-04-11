---
weight: 47
title: SPIFFE
date: '2022-05-21T00:00:00+08:00'
type: book
---

SPIFFE，即普适安全生产身份框架（Secure Production Identity Framework for Everyone），是一套开源标准，用于在动态和异构环境中安全地进行身份识别。采用 SPIFFE 的系统无论在哪里运行，都可以轻松可靠地相互认证。

SPIFFE 开源规范的核心是——通过简单 API 定义了一个短期的加密身份文件 SVID。然后，工作负载进行认证时可以使用该身份文件，例如建立 TLS 连接或签署和验证 JWT 令牌等。

SPIFFE 已经在云原生应用中得到了大量的应用，尤其是在 Istio 和 Envoy 中。下面将向你介绍 SPIFFE 的一些基本概念。

## 工作负载

工作负载是个单一的软件，以特定的配置部署，用于单一目的；它可能包括软件的多个运行实例，所有这些实例执行相同的任务。工作负载这个术语可以包含一系列不同的软件系统定义，包括：

-   一个运行 Python 网络应用程序的网络服务器，在一个虚拟机集群上运行，前面有一个负载均衡器。
-   一个 MySQL 数据库的实例。
-   一个处理队列中项目的 worker 程序。
-   独立部署的系统的集合，它们一起工作，例如一个使用数据库服务的网络应用程序。网络应用程序和数据库也可以单独被视为工作负载。

就 SPIFFE 而言，工作负载往往比物理或虚拟节点更加细化——通常细化到节点上的单个进程。这对工作负载来说至关重要，例如，在容器编排器中托管的工作负载，几个工作负载可能在同一个节点上（但彼此隔离）。

就 SPIFFE 而言，一个工作负载也可能跨越许多节点。例如，一个可弹性扩展的网络服务器可能同时运行在许多机器上。

虽然工作负载的粒度会因环境而异，但就 SPIFFE 而言，我们**假设**工作负载之间有足够好的隔离，这样恶意的工作负载就不能窃取他人的凭证。这种隔离的稳健性和实现的机制超出了 SPIFFE 的范围。

## SPIFFE ID

SPIFFE ID 是一个字符串，可以唯一地、具体地标识一个工作负载。SPIFFE ID 也可以分配给工作负载所运行的中间系统（如一组虚拟机）。例如，`spiffe://acme.com/billing/payments` 是一个有效的 SPIFFE ID。

SPIFFE ID 是一个[统一资源标识符（URI](https://tools.ietf.org/html/rfc3986)），其格式如下：`spiffe://信任域/工作负载标识符`。

**工作负载标识符**是一个[信任域](https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/#trust-domain)内的特定工作负载的唯一标识。

[SPIFFE 规范](https://github.com/spiffe/spiffe/blob/main/standards/SPIFFE.md)详细描述了 SPIFFE ID 的格式和使用。

## 信任域

信任域对应于系统的信任根。信任域可以代表个人、组织、环境或部门，运行他们自己独立的 SPIFFE 基础设施。在同一信任域中确定的所有工作负载都会被颁发身份文件，它们可以根据信任域的根密钥进行验证。

通常建议将处于不同物理位置（如不同的数据中心或云区域）或应用不同安全实践的环境（如与生产环境相比的暂存或实验环境）的工作负载放在不同的信任域中。

## SPIFFE 可验证的身份文件（SVID）{#svid}

SVID（SPIFFE Verifiable Identity Document）是工作负载向资源或调用者证明其身份的文件。如果 SVID 是由 SPIFFE ID 的信任域内的机构签发的，则被认为是有效的。

SVID 包含一个 SPIFFE ID，代表了服务的身份。它将 SPIFFE ID 编码在一个可加密验证的文件中，目前支持两种格式：X.509 证书或 JWT 令牌。

由于令牌容易受到**重放攻击（replay attack）**，即在传输过程中获得令牌的攻击者可以使用它来冒充工作负载，因此建议尽可能使用 `X.509-SVID`。然而，在某些情况下，JWT 令牌格式是唯一的选择，例如，当你的架构在两个工作负载之间有一个 L7 代理或负载均衡器。

关于 SVID 的详细信息，请参阅 [SVID 规范](https://github.com/spiffe/spiffe/blob/main/standards/X509-SVID.md)。

## SPIFFE 工作负载 API

工作负载 API 提供以下内容。

对于`X.509`格式的身份文件（`X.509-SVID`）:

-   其身份，描述为 SPIFFE ID。
-   一个与该 ID 绑定的私钥，可用于代表工作负载签署数据。一个相应的短期 X.509 证书也将被创建，即 `X509-SVID`。这可以用来建立 TLS 或以其他方式对其他工作负载进行认证。
-   一组证书——被称为[信任包](https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/#trust-bundle)。一个工作负载用来验证另一个工作负载提出的`X.509-SVID`。

对于 JWT 格式的身份文件（JWT-SVID）：

-   其身份，描述为 SPIFFE ID
-   JWT 令牌
-   一组证书——被称为[信任包](https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/#trust-bundle)，一个工作负载用来验证其他工作负载的身份。

与 [AWS  EC2 实例元数据 API](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-metadata.html)和 [Google GCE 实例元数据 API](https://cloud.google.com/compute/docs/storing-retrieving-metadata) 类似，工作负载 API 不要求调用的工作负载对自己的身份有任何了解，也不要求调用 API 时拥有任何认证令牌。这意味着你的应用程序不需要与工作负载共同部署任何认证密钥。

然而，与这些其他 API 不同的是，Workload API 与平台无关，可以在进程级和内核级识别正在运行的服务，这使得它适合与 Kubernetes 等容器调度器一起使用。

为了最大限度地减少密钥泄露的风险，所有私钥（和相应的证书）都是短期的，经常自动轮换。工作负载可以在相应的密钥过期前从工作负载 API 请求新的密钥和信任包。

## 信任包

当使用 `X.509-SVID` 时，目标工作负载使用信任包（Trust Bundle）来验证源工作负载的身份。信任包是一个或多个证书机构（CA）根证书的集合，工作负载认为这些证书是可信的。信任包包含 X.509 和 JWT SVID 的公钥材料。

用来验证 X.509 SVID 的公钥材料是一组证书。用于验证 JWT 的公钥材料是一个原始公钥。信任包的内容是经常轮换的。工作负载在调用工作负载 API 时检索信任包。

## 参考

- [SPIFFE 官网 - spiffe.io](https://spiffe.io)
