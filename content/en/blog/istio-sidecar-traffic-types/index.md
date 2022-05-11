---
title: "Traffic types and iptables rules in Istio sidecar explained"
description: "This article will show you the six traffic types and their iptables rules in Istio sidecar, and take you through the whole picture in a schematic format."
date: 2022-05-07T11:18:40+08:00
draft: false
tags: ["istio","sidecar","iptables"]
categories: ["Istio"]
type: "post"
bg_image: "images/backgrounds/page-title.jpg"
image: "images/banner/istio-iptables.jpg"
---

In [a previous blog](/en/blog/sidecar-injection-iptables-and-traffic-routing/), I explained the detailed process of sidecar injection in Istio, transparent traffic interception and traffic routing using iptables, and drew a diagram of transparent traffic hijacking using the `productpage` service accessing the `reviews` service and the `reviews` service accessing the `ratings` service in the Bookinfo example. Services in the Bookinfo sammple, and a transparent traffic hijacking diagram. That schematic only shows that `reviews` pod receiving traffic and outbound routing, but there is much more than that within the sidecar.

This article will show you the six types of traffic and their iptables rules in Istio sidecar and take you through the whole picture in a schematic.

## iptables Traffic Routing in Sidecar

The following list summarizes the six types of traffic in Sidecar.

 - Remote services accessing local services: Remote Pod -> Local Pod
 - Local service accessing remote service: Local Pod -> Remote Pod
 - Prometheus crawling metrics of local services: Prometheus -> Local Pod
 - Traffic between Local Pod services: Local Pod -> Local Pod
 - Inter-process TCP traffic within Envoy
 - Sidecar to Istiod traffic

The following will explain the iptables routing rules within Sidecar for each scenario in turn.

### Type 1: Remote Pod -> Local Pod
The following are the iptables rules for remote services, applications or clients accessing the local pod IP of the data plane.

Remote Pod -> `RREREROUTING` -> `ISTIO_INBOUND` -> `ISTIO_IN_REDIRECT` -> Envoy 15006 (Inbound) -> `OUTPUT` -> **`ISTIO_OUTPUT` RULE 1** -> ` POSTROUTING` -> Local Pod

We see that the traffic only passes through the Envoy 15006 Inbound port once. The following diagram shows the scenario of the iptables rules.

![Remote Pod -> Local Pod](remote-pod-local-pod.png)

### Type 2: Local Pod -> Remote Pod

The following are the iptables rules that the local pod IP goes through to access the remote service.

Local Pod-> `OUTPUT` -> `ISTIO_OUTPUT` RULE 9 -> `ISTIO_REDIRECT` -> Envoy 15001 (Outbound) -> `OUTPUT` -> `ISTIO_OUTPUT` RULE 4 -> `POSTROUTING` -> Remote Pod

We see that the traffic only goes through Envoy 15001 Outbound port. The following diagram shows the scenario of the iptables rules.

![Local Pod -> Remote Pod](local-pod-remote-pod.png)

The traffic in both scenarios above passes through Envoy only once because only one scenario occurs in that Pod, sending or receiving requests.

### Type 3: Prometheus -> Local Pod

Prometheus traffic that grabs data plane metrics does not have to go through the Envoy proxy.

These flows pass through the following iptables rules.

Prometheus-> `RREROUTING` -> `ISTIO_INBOUND` (traffic destined for ports 15002, 15090 will go to `INPUT`) -> `INPUT` -> `OUTPUT` -> `ISTIO_OUTPUT` RULE 3 -> `POSTROUTING` -> Local Pod

The following diagram shows the scenario of the iptables rules.

![Prometheus -> Local Pod](prometheus-local-pod.png)

### Type 4: Local Pod -> Local Pod

A Pod may simultaneously have two or more services. If the Local Pod accesses a service on the current Pod, the traffic will go through Envoy 15001 and Envoy 15006 ports to reach the service port of the Local Pod.

The iptables rules for this traffic are as follows.

Local Pod-> `OUTPUT` -> **`ISTIO_OUTPUT` RULE 9** -> `ISTIO_REDIRECT` -> Envoy 15001（Outbound）-> `OUTPUT` -> **`ISTIO_OUTPUT` RULE 2** -> `ISTIO_IN_REDIRECT` -> Envoy 15006（Inbound）-> `OUTPUT` -> **`ISTIO_OUTPUT` RULE 1** -> `POSTROUTING` -> Local Pod

The following diagram shows the scenario of the iptables rules.

![Local Pod -> Local Pod](local-pod-local-pod.png)

### Type 5: Inter-process TCP traffic within Envoy

Envoy internal processes with UID and GID 1337 will communicate with each other using lo NICs and localhost domains.

The iptables rules that these flows pass through are as follows.

Envoy process（Localhost） -> `OUTPUT` -> **`ISTIO_OUTPUT` RULE 8** -> `POSTROUTING` -> Envoy process（Localhost）

The following diagram shows the scenario of the iptables rules.

![Envoy 内部的进程间 TCP 流量](envoy-internal-tcp-traffic.png)

### Type 6: Sidecar to Istiod traffic

Sidecar needs access to Istiod to synchronize its configuration so that Envoy will have traffic sent to Istiod.

The iptables rules that this traffic passes through are as follows.

Local Pod-> `OUTPUT` -> **`ISTIO_OUTPUT` RULE 4** -> `POSTROUTING`  -> Istiod

The following diagram shows the scenario of the iptables rules.

![Sidecar 到 Istiod 的流量](sidecar-istiod.png)

## Summary

All the sidecar proxies that Istio injects into the Pod or installed in the virtual machine form the data plane of the service mesh, which is also the main workload location of Istio. In my next blog, I will take you through the ports of each component in Envoy and their functions, so that we can have a more comprehensive understanding of the traffic in Istio.
