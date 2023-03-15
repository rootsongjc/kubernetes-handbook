---
title: "什么是 GENEVE 隧道？"
description: "本文介绍了 tproxy 透明代理及其使用方法。"
date: 2023-03-15T10:09:40+08:00
draft: true
tags: ["geneva","tunnel"]
categories: ["其他"]
type: "post"
image: "images/banner/tproxy.jpg"
---

Geneve（Generic Network Virtualization Encapsulation）是一种通用网络虚拟化封装协议，它用于在数据中心网络中传输虚拟机和容器流量。Geneve隧道是一种通过Geneve协议将数据包封装在另一个网络层协议中传输的方法。

Geneve隧道可以在不同的网络设备之间建立逻辑连接，以便在虚拟网络中传输数据。Geneve隧道的优点之一是可以支持大量的虚拟网络标识符（VNI），这样可以在单个物理网络中实现多个虚拟网络。

因此，Geneve隧道在网络领域中指的是一种用于在数据中心网络中传输虚拟机和容器流量的通用隧道技术。

Geneve（Generic Network Virtualization Encapsulation）隧道是一种通用网络虚拟化封装协议，它将虚拟网络中的数据包封装在另一个网络层协议中进行传输，以实现虚拟网络的隔离和扩展。其运行原理如下：

1. 数据包封装：Geneve隧道在源主机将虚拟网络中的数据包封装在Geneve协议头中。该协议头包含了虚拟网络标识符（VNI）以及其他元数据信息，用于标识数据包所属的虚拟网络以及提供网络服务质量（QoS）等功能。
2. 隧道传输：Geneve隧道协议将封装好的数据包传输到目的主机。Geneve隧道使用UDP作为底层传输协议，并通过源主机和目的主机之间的网络设备（如交换机或路由器）进行隧道传输。
3. 数据包解封装：当数据包到达目的主机时，Geneve隧道协议会将数据包从Geneve协议头中解封装出来，并将其传递给虚拟网络中的目的地。在解封装过程中，Geneve协议头中的VNI信息会被用来判断数据包的目的地，以确保数据包被正确地路由到虚拟网络中的目的地。

通过Geneve隧道的运行，虚拟机和容器之间的网络通信可以被有效地隔离和扩展，从而提高数据中心网络的可扩展性和灵活性。此外，Geneve隧道还支持多租户网络和云原生应用等场景，能够为现代数据中心提供更为强大的网络虚拟化支持。

## Geneve 隧道报文

下面是一个简单的基于 IPv4 的 Geneve 隧道报文示意图：

```
+---------------------------------------------------------+
| Ethernet Header                                        |
+---------------------------------------------------------+
| IP Header                                               |
+---------------------------------------------------------+
| UDP Header                                              |
+---------------------------------------------------------+
| Geneve Header                                           |
+---------------------------------------------------------+
| Inner Ethernet Header (VLAN Tagged)                     |
+---------------------------------------------------------+
| Inner IP Header                                         |
+---------------------------------------------------------+
| Inner Payload (Application Data)                        |
+---------------------------------------------------------+
```

在这个示意图中，Geneve隧道报文的结构如下：

1. 以太网头部（Ethernet Header）：包含源和目的MAC地址，用于在物理网络中传输数据包。
2. IP头部（IP Header）：包含源和目的IP地址，用于在IP网络中传输数据包。
3. UDP头部（UDP Header）：包含源和目的端口号，用于在UDP协议中传输数据包。
4. Geneve头部（Geneve Header）：包含VNI（Virtual Network Identifier）和其他元数据信息，用于标识数据包所属的虚拟网络和提供网络服务质量（QoS）等功能。
5. 内部以太网头部（Inner Ethernet Header）：包含源和目的MAC地址，用于在虚拟网络中传输数据包。
6. 内部IP头部（Inner IP Header）：包含源和目的IP地址，用于在虚拟网络中传输数据包。
7. 应用数据（Inner Payload）：是实际的应用层数据。

当数据包到达目的主机时，Geneve隧道协议会将数据包从Geneve协议头中解封装出来，并将其传递给虚拟网络中的目的地。在解封装过程中，Geneve协议头中的VNI信息会被用来判断数据包的目的地，以确保数据包被正确地路由到虚拟网络中的目的地。

关于 Geneve 隧道报文的详细信息请参考 [RFC 8926
Geneve: Generic Network Virtualization Encapsulation](https://www.rfc-editor.org/rfc/rfc8926#name-geneve-packet-format-over-i)。

## 参考

- [RFC 8926 Geneve: Generic Network Virtualization Encapsulation - rfc-editor.org](https://www.rfc-editor.org/rfc/rfc8926)
