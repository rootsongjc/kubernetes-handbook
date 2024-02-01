---
title: "Understanding IPTables"
description: "This article will give you a brief introduction to iptables, its tables and the order of execution."
date: 2022-05-12T12:18:40+08:00
draft: false
tags: ["iptables"]
categories: ["Istio"]
type: "post"
image: "images/banner/iptables.jpg"
aliases: "/en/blog/uderstanding-iptables"
---

iptables is an important feature in the Linux kernel and has a wide range of applications. iptables is used by default in Istio for transparent traffic hijacking. Understanding iptables is very important for us to understand how Istio works. This article will give you a brief introduction to iptbles.

## iptables introduction

iptables is a management tool for netfilter, the firewall software in the Linux kernel. netfilter is located in the user space and is part of netfilter. netfilter is located in the kernel space and has not only network address conversion, but also packet content modification and packet filtering firewall functions.

Before learning about iptables for Init container initialization, let's go over iptables and rule configuration.

The following figure shows the iptables call chain.

![iptables 调用链](iptables.jpg)

### iptables

The iptables version used in the Init container is v1.6.0 and contains 5 tables.

1. RAW is used to configure packets. Packets in RAW are not tracked by the system.
2. The filter is the default table used to house all firewall-related operations.
3. NAT is used for network address translation (e.g., port forwarding).
4. Mangle is used for modifications to specific packets (refer to corrupted packets).
5. Security is used to force access to control network rules.

Note: In this example, only the NAT table is used.

The chain types in the different tables are as follows.

| Rule name   | raw  | filter | nat  | mangle | security |
| ----------- | ---- | ------ | ---- | ------ | -------- |
| PREROUTING  | ✓    |        | ✓    | ✓      |          |
| INPUT       |      | ✓      |      | ✓      | ✓        |
| OUTPUT      | ✓    | ✓      | ✓    | ✓      | ✓        |
| POSTROUTING |      |        | ✓    | ✓      |          |
| FORWARD     |      | ✓      |      | ✓      | ✓        |

### Understand iptables rules

View the default iptables rules in the `istio-proxy` container, the default view is the rules in the filter table.

```bash
$ iptables -L -v
Chain INPUT (policy ACCEPT 350K packets, 63M bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain OUTPUT (policy ACCEPT 18M packets, 1916M bytes)
 pkts bytes target     prot opt in     out     source               destination
```

We see three default chains, INPUT, FORWARD, and OUTPUT, with the first line of output in each chain indicating the chain name (INPUT/FORWARD/OUTPUT in this case), followed by the default policy (ACCEPT).

The following is a proposed structure diagram of iptables, where traffic passes through the INPUT chain and then enters the upper protocol stack, such as:

![iptables chains](iptables-chains.jpg)

Multiple rules can be added to each chain and the rules are executed in order from front to back. Let's look at the table header definition of the rule.

- **PKTS**: Number of matched messages processed
- **bytes**: cumulative packet size processed (bytes)
- **Target**: If the message matches the rule, the specified target is executed.
- **PROT**: Protocols such as TDP, UDP, ICMP, and ALL.
- **opt**: Rarely used, this column is used to display IP options.
- **IN**: Inbound network interface.
- **OUT**: Outbound network interface.
- **source**: the source IP address or subnet of the traffic, the latter being anywhere.
- **destination**: the destination IP address or subnet of the traffic, or anywhere.

There is also a column without a header, shown at the end, which represents the options of the rule, and is used as an extended match condition for the rule to complement the configuration in the previous columns. prot, opt, in, out, source and destination and the column without a header shown after destination together form the match rule. TARGET is executed when traffic matches these rules.

**Types supported by TARGET**

Target types include ACCEPT, REJECT, DROP, LOG, SNAT, MASQUERADE, DNAT, REDIRECT, RETURN or jump to other rules, etc. You can determine where the telegram is going by executing only one rule in a chain that matches in order, except for the RETURN type, which is similar to the return statement in programming languages, which returns to its call point and continues to execute the next rule.

From the output, you can see that the Init container does not create any rules in the default link of iptables, but instead creates a new link.

## Summary

With the above brief introduction to iptables, you have understood how iptables works, the rule chain and its execution order.
