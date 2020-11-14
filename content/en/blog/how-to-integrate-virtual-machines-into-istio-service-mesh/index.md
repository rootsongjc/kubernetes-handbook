---
title: "How to Integrate Virtual Machines into Istio Service Mesh"
date: 2020-11-02T16:43:27+08:00
draft: false
categories: ["Istio"]
bg_image: "images/backgrounds/page-title.jpg"
description: "Better integration of virtual machine-based workloads into the service mesh is a major focus for the Istio team this year, and Tetrate also provides seamless multi-cloud connectivity, security and observability, including for virtual machines, through its product Tetrate Service Bridge. This article will show you why Istio needs to integrate with virtual machines and how."
type: "post"
image: "images/banner/istio-logo.jpg"
---

[Istio](https://istio.io/) is a popular service mesh to connect, secure, control, and observe services. When it was first introduced as open source in 2017, Kubernetes was winning the container orchestration battle and Istio answered the needs of organizations moving to microservices. Although Istio claims to support heterogeneous environments such as Nomad, Consul, Eureka, Cloud Foundry, Mesos, etc., in reality, it has always worked best with Kubernetes — on which its service discovery is based.

Istio was criticized for a number of issues early in its development, for the large number of components, the complexity of installation and maintenance, the difficulty of debugging, a steep learning curve due to the introduction of too many new concepts and objects (up to 50 CRDs), and the impact of Mixer components on performance. But these issues are gradually being overcome by the Istio team. As you can see from the [roadmap](https://istio.io/latest/zh/blog/2020/tradewinds-2020/) released in early 2020, Istio has come a long way.

Better integration of VM-based workloads into the mesh is a major focus for the Istio team this year. Tetrate also offers seamless multicloud connectivity, security, and observability, including for VMs, via its product [Tetrate Service Bridge](https://www.tetrate.io/tetrate-service-bridge/). This article will take you through why Istio needs to integrate with virtual machines and how you can do so.

## Why Should Istio Support Virtual Machines?

Although containers and Kubernetes are now widely used, there are still many services deployed on virtual machines and APIs outside of the Kubernetes cluster that needs to be managed by Istio mesh. It’s a huge challenge to unify the management of the brownfield environment with the greenfield.

## What Is Needed to Add VMs to the Mesh?

Before the “how,” I’ll describe *what* is needed to add virtual machines to the mesh. There are a couple of things that Istio must know when supporting virtual machine traffic: which VMs have services that should be part of the mesh, and how to reach the VMs. Each VM also needs an identity, in order to communicate securely with the rest of the mesh. These requirements could work with Kubernetes CRDs, as well as a full-blown Service Registry like Consul. And the service account based identity bootstrapping could work as a mechanism for assigning workload identities to VMs that do not have a platform identity. For VMs that do have a platform identity (like EC2, GCP, Azure, etc.), work is underway in Istio to exchange the platform identity with a Kubernetes identity for ease of setting up mTLS communication.

## How Does Istio Support Virtual Machines?

Istio’s support for virtual machines starts with its service registry mechanism. The information about services and instances in the Istio mesh comes from Istio’s service registries, which up to this point have only looked at or tracked pods. In newer versions, Istio now has resource types to track and watch VMs. The sidecars inside the mesh cannot observe and control traffic to services outside the mesh, because they do not have any information about them.

The Istio community and [Tetrate](https://www.tetrate.io/) have done a lot of [work](https://www.tetrate.io/blog/istio-bringing-vms-into-the-mesh-with-cynthia-coan/) on Istio’s support for virtual machines. The 1.6 release included the addition of WorkloadEntry, which allows you to describe a VM exactly as you would a host running in Kubernetes. In 1.7, the release started to add the foundations for bootstrapping VMs into the mesh automatically through tokens, with Istio doing the heavy lifting. Istio 1.8 will debut another abstraction called WorkloadGroup, which is similar to a Kubernetes Deployment object — but for VMs.

The following diagram shows how Istio models services in the mesh. The predominant source of information comes from a platform service registry like Kubernetes, or a system like Consul. In addition, the ServiceEntry serves as a user-defined service registry, modeling services on VMs or external services outside the organization.

![](https://tva1.sinaimg.cn/large/0081Kckwgy1gkp0fvr3orj30p30ehabc.jpg)

**Why install Istio in a virtual machine when you can just use ServiceEntry to bring in the services in the VMs?**

Using ServiceEntry, you can enable services inside the mesh to discover and access external services; and in addition, manage the traffic to those external services. In conjunction with VirtualService, you can also configure access rules for the corresponding external service — such as request timeouts, fault injection, etc. — to enable controlled access to the specified external service.

Even so, it only controls the traffic on the client-side, not access to the introduced external service to other services. That is, it cannot control the behavior of the service as the call initiator. Deploying sidecars in a virtual machine and introducing the virtual machine workload via workload selector allows the virtual machine to be managed indiscriminately, like a pod in Kubernetes.

## Future

As you can see from the [bookinfo demo](https://istio.io/latest/docs/examples/virtual-machines/bookinfo/), there is too much manual work involved in the process and it’s easy to go wrong. In the future, Istio will improve VM testing to be realistic, automate bootstrapping based on platform identity, improve DNS support and istioctl debugging, and more. You can follow the [Istio Environment Working Group](https://github.com/istio/community/blob/master/WORKING-GROUPS.md) for more details about virtual machine support.

## References

- [Virtual Machine Installation](https://istio.io/latest/docs/setup/install/virtual-machine/)
- [Virtual Machines in Single-Network Meshes](https://istio.io/latest/docs/examples/virtual-machines/single-network/)
- [Istio: Bringing VMs into the Mesh (with Cynthia Coan)](https://www.tetrate.io/blog/istio-bringing-vms-into-the-mesh-with-cynthia-coan/)
- [Bridging Traditional and Modern Workloads](https://www.tetrate.io/blog/bridging-traditional-and-modern-workloads/)

