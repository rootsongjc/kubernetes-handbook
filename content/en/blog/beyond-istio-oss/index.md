---
title: "The current state and future of the Istio service mesh"
draft: true
date: 2022-07-18T12:27:49+08:00
description: "This article explains the background of Istio's birth, its position in the cloud-native technology stack, and the development direction of Istio."
categories: ["Istio"]
tags: ["eBPF","wasm","Zero Trust","Service Mesh","Istio","Hybrid Cloud"]
image: "images/banner/beyond.jpg"
---

This article reviews the development of Istio open source in the past five years and looks forward to the future direction of Istio. The main points of view in this article are as follows:

- Due to the popularity of Kubernetes, microservices, DevOps, and cloud-native architectures, the rise of service mesh technology.
- The rise of Kubernetes and programmable proxies has laid the technical groundwork for Istio's implementation.
- While eBPF can accelerate transparent traffic hijacking in Istio, it can not replace sidecars in service meshes.
- The future of Istio is to build a zero-trust network.

Next, we start this article with the background of the birth of Istio.

## The eve of the birth of Istio

Since 2013, with the explosion of the mobile Internet, enterprises have had higher requirements for the efficiency of application iteration. Application architecture has begun to shift from monolithic to microservices, and DevOps has also become popular. In the same year, with the open source of Docker, the problems of application encapsulation and isolation were solved, making it easier to schedule applications in the orchestration system. In 2014, Kubernetes and Spring Boot were open-sourced, and Spring framework development of microservice applications became popular. In the next few years, a large number of RPC middleware open source projects appeared, such as Google released gRPC 1.0 in 2016. The service framework is in full bloom. In order to save costs, increase development efficiency, and make applications more flexible, more and more enterprises are migrating to the cloud, but this is not just as simple as moving applications to the cloud. In order to use cloud computing more efficiently, a set of "cloud native" methods and concepts are also on the horizon.

## Istio Open Source Timeline

Let's briefly review the major events of Istio open source:

- **September 2016**: Since Envoy is an important part of Istio, Istio's open source timeline should have an Envoy part. At first, Envoy was only used as an edge proxy inside Lyft, and it was verified in large-scale production inside Lyft before Envoy was open sourced. In fact, Envoy was open sourced before it was open sourced, and it got the attention of Google engineers. At that time, Google was planning to launch an open source project of service mesh, and initially planned to use Nginx as a proxy. In 2017, Envoy donated to [CNCF](https://cncf.io/).
- **May 2017**: Istio was announced as open source by Google, IBM, and Lyft. The microservices architecture was used from the beginning. The composition of the data plane, control plane, and sidecar pattern were determined.
- **March 2018**: Kubernetes successfully became the first project to graduate from CNCF, becoming more and more "boring". The basic API has been finalized. In the second edition, CNCF officially wrote the service mesh into the cloud native first definition. The company I currently work for, [Tetrate](https://tetrate.io/), was founded by the Google Istio team.
- **July 2018**: Istio 1.0 is released, billed as "production ready".
- **March 2020**: Istio 1.5 was released, the architecture returned to a monolithic application, the release cycle was determined, a major version was released every three months, and the API became stable.
- **From 2020 to the present**: The development of Istio mainly focuses on Day 2 operation, performance optimization, and extensibility. Several open source projects in the Istio ecosystem have begun to emerge, such as [Slime](https://github.com/slime-io/slime/), [Areaki](https://github.com/aeraki-mesh/aeraki), and [Merbridge](https://github.com/merbridge/merbridge).

## Why did Istio come after Kubernetes?

The emergence mentioned here refers to the birth of the concept of "service mesh". After microservices and containerization, the increase in the use of heterogeneous languages, the surge in the number of services, and the shortened life cycle of containers are the fundamental reasons for the emergence of service meshes.

To make it possible for developers to manage traffic between services with minimal cost, Istio needs to solve three problems:

1. Transparent traffic hijacks traffic between applications, which means that developers can quickly use the capabilities brought by Istio without modifying applications.
1. Another point is the operation and maintenance level; how to inject the proxy into each application and manage these distributed sidecar proxies efficiently.
1. An efficient and scalable sidecar proxy that can be configured through an API.

The above three conditions are indispensable for the Istio service mesh, and we can see from them that these requirements are basically the requirements for the sidecar proxy. The choice of this proxy will directly affect the direction and success of the project.

In order to solve the three problems above, Istio chose:

1. Container Orchestration and Scheduling Platform: Kubernetes
1. Programable proxy: Envoy

From the figure below, we can see the transition of the service deployment architecture from Kubernetes to Istio, with many changes and constants.

![Schematic diagram of the architectural change from Kubernetes to Istio](kubernetes-to-istio.svg)

From Kubernetes to Istio, in a nutshell, the deployment architecture of the application has the following characteristics:

- Kubernetes manages the life cycle of applications, specifically, application deployment and management (scaling, automatic recovery, and release).
- Automatic sidecar injection based on Kubernetes to achieve transparent traffic interception. First, the inter-service traffic is intercepted through the sidecar proxy, and then the behavior of the microservice is managed through the control plane configuration. Nowadays, the deployment mode of service mesh has also ushered in new challenges. A sidecar is no longer necessary for Istio service mesh. The proxyless service mesh based on gRPC is also being tested.
- The service mesh decouples traffic management from Kubernetes, and the traffic inside the service mesh does not need the support of the kube-proxy component. Through the abstraction close to the microservice application layer, the traffic between services is managed to achieve security and observability functions.
- The control plane issues proxy configuration to the data plane through the xDS protocol. The proxies that have implemented xDS include [Envoy](https://envoyproxy.io/) and the open source [MOSN](https://mosn.io/).
- When a client outside the Kubernetes cluster accesses the internal services of the cluster, it was originally through Kubernetes [Ingress](https://lib.jimmysong.io/kubernetes-handbook/concepts/ingress/), but after Istio is available, it will be accessed through Gateway.

### Transparent traffic hijacking

If you are using middleware such as gRPC to develop microservices, after integrating the SDK into the program, the interceptor in the SDK will automatically intercept the traffic for you, as shown in the following figure.

![Interceptor diagram of gRPC](grpc.svg)

How to make the traffic in the Kubernetes pod go through the proxy? The answer is to inject a proxy into each application pod, share the network space with the application, and then modify the traffic path within the pod so that all traffic in and out of the pod goes through the sidecar. Its architecture is shown in the figure below.

![Diagram of transparent traffic hijacking in Istio](istio-route-iptables.svg)

From the figure, we can see that there is a very complex set of iptables traffic hijacking logic. The advantage of using iptables is that it is applicable to any Linux operating system. But this also has some side effects:

1. All services in the Istio mesh need to add a network hop when entering and leaving the pod. Although each hop may only be two or three milliseconds, as the dependencies between services and services in the mesh increase, this latency may increase significantly, which may not be suitable for service meshes for services that pursue low latency.
1. Because Istio injects a large number of sidecars into the data plane, especially when the number of services increases, the control plane needs to deliver more Envoy proxy configurations to the data plane, which will cause the data plane to occupy a lot of system memory and network resources.

How to optimize the service mesh in response to these two problems?

1. Use proxyless mode: remove the sidecar proxy and go back to the SDK.
1. Optimize the data plane: reduce the frequency and size of proxy configurations delivered to the data plane.
1. eBPF: it can be used to optimize network hijacking.

This article will explain these details in the section on performance optimization later on.

### Sidecar operation and maintenance management

Istio is built on top of Kubernetes, which can leverage Kubernetes' container orchestration and lifecycle management to automatically inject sidecars into pods through admission controllers when Kubernetes creates pods. 

In order to solve the resource consumption problem of Sidecar, some people have proposed four deployment modes for the service mesh, as shown in the following figure.

![Schematic diagram of four deployment modes of service mesh](deployment-model.svg)

The following table compares these four deployment methods in detail. Each of them has advantages and disadvantages. The specific choice depends on the current situation.

{{<table "Comparison of four deployment modes of service mesh">}}

| **Mode**                                 | **Memory overhead**                                          | **Security**                                                 | **Fault domain**                                             | **Operation and maintenance**                                |
| :--------------------------------------- | :----------------------------------------------------------- | :----------------------------------------------------------- | :----------------------------------------------------------- | :----------------------------------------------------------- |
| **Sidecar proxy**                        | The overhead is greatest because a proxy is injected per pod. | Since the sidecar must be deployed with the workload, it is possible for the workload to bypass the sidecar. | Pod-level isolation, if the proxy fails, only the workload in the Pod is affected. | A workload's sidecar can be upgraded independently without affecting other workloads. |
| **Node sharing proxy**                   | There is only one proxy on each node, shared by all workloads on that node, with low overhead. | There are security risks in the management of encrypted content and private keys. | Node-level isolation, if a version conflict, configuration conflict, or extension incompatibility occurs when a shared proxy is upgraded, it may affect all workloads on that node. | There is no need to worry about injecting sidecars.          |
| **Service Account / Node Sharing Proxy** | All workloads under the service account/identity use a shared proxy with little overhead. | Authentication and security of connections between workloads and proxy cannot be guaranteed. | The level isolation between nodes and service accounts, the fault is the same as "node sharing proxy". | Same as "node sharing proxy" mode.                           |
| **Shared remote proxy with micro-proxy** | Because injecting a micro-proxy for each pod, the overhead is relatively large. | The micro-proxy handles mTLS exclusively and is not responsible for L7 routing, which can ensure security. | When a Layer 7 policy needs to be applied, the traffic of the workload instance is redirected to the L7 proxy, and can be bypassed directly if it is not needed. The L7 proxy can run as a shared node proxy, a per-service account proxy, or a remote proxy | Same as "sidecar proxy" mode.                                |

{{</table>}}

### Programmable proxy

Zhang Xiaohui of Flomesh explained the evolution of proxy software. I will quote some of his views below to illustrate the key role of programmable proxies in Istio.

The following figure shows the evolution process of the proxy software from configuration to programmable mode, and the representative proxy software in each stage.

{{<figure title="Schematic diagram of the evolution of proxy software" width=70%" alt="image" src="proxy-evolution.svg">}}

The entire proxy evolution process is as the application moves from local and monolithic to large-scale and distributed. Below, I will briefly outline the evolution of the proxy software:

- **The era of configuration files**: almost all software has configuration files, and proxy software is more inseparable from configuration files because of its relatively complex functions. The proxy at this stage is mainly developed using the C language, including its extension module, which highlights the ability of the proxy itself. This is also the most primitive and basic form of our use of proxies, including Nginx, Apache HTTP Server, [Squid](http://www.squid-cache.org/), etc.
- **Configuration language era**: Proxies in this era are more extensible and flexible, such as dynamic data acquisition and matching logic judgment. Varnish and HAProxy are two examples of representative software.
- **The era of scripting languages**: Since the introduction of scripting languages, proxy software has become programmable. We can use scripts to add dynamic logic to proxies more easily, increasing development efficiency. The representative software is Nginx and its supported scripting languages.
- **The era of clusters**: With the popularity of cloud computing, large-scale deployment and dynamic configuration of APIs have become necessary capabilities for proxies, and with the increase in network traffic, large-scale proxy clusters have emerged as the times require. The representative proxy software of this era includes Envoy, Kong, etc.
- **Cloud-native era**: Multi-tenancy, elasticity, heterogeneous hybrid cloud, multi-cluster, security, and observability are all higher requirements for proxies in the cloud-native era. This will also be a historical opportunity for service meshes, with representative software such as Istio, Linkerd, and [Pypi](https://flomesh.io/).

## Are these all service meshes?

So, is it possible to build a service mesh with proxies? Now I will list the existing service mesh projects, and let's explore the development law and nature of service mesh together. The table below compares the current popular open source "service mesh" projects.

{{<table "Service mesh open source project comparison table">}}

| Contrast           | Istio                                                        | Linkerd                                                     | Consul Connect                                               | Traefik Mesh                                                 | Kuma                                | Open Service Mesh (OSM)                       |
| :----------------- | :----------------------------------------------------------- | :---------------------------------------------------------- | :----------------------------------------------------------- | :----------------------------------------------------------- | :---------------------------------- | :-------------------------------------------- |
| Current version   | 1.14                                                         | 2.11                                                        | 1.12                                                         | 1.4                                                          | 1.5                                 | 1.0l                                          |
| License           | Apache License 2.0                                           | Apache License 2.0                                          | Mozilla License                                              | Apache License 2.0                                           | Apache License 2.0                  | Apache License 2.0                            |
| Initiator          | Google, IBM, Lyft                                            | Buoyant                                                     | HashiCorp                                                    | Traefik Labs                                                 | Kong                                | Microsoft                                     |
| Service proxy | Envoy, which supports proxyless mode for gRPC                | [Linkerd2-proxy](https://github.com/linkerd/linkerd2-proxy) | Default is [Envoy](https://www.envoyproxy.io/) , replaceable | [Traefik Proxy](https://traefik.io/traefik/)                 | [Envoy](https://www.envoyproxy.io/) | [Envoy](https://www.envoyproxy.io/)           |
| Ingress controller | Envoy, custom Ingress, supports Kubernetes Gateway API       | no built-in                                                 | Envoy, with support for the Kubernetes Gateway API           | no built-in                                                  | Kong                                | Support Contour, Nginx, compatible with other |
| Governance         | Istio Community and Open Usage Commons, proposed to donate to CNCF | CNCF                                                        | View [Contribution Guidelines](https://github.com/hashicorp/consul/blob/master/.github/CONTRIBUTING.md) | View [Contribution Guidelines](https://github.com/traefik/mesh/blob/master/CONTRIBUTING.md) | CNCF                                | CNCF                                          |
| Comment | It is one of the most popular service mesh projects at present. | The earliest service mesh, the creator of the concept of "Service Mesh", the first service mesh project to enter CNCF, using a lightweight proxy developed with Rust. | Consul service mesh, using Envoy as a sidecar proxy. | A service mesh project launched by Traefik, using Traefik Proxy as a sidecar and supporting SMI (mentioned below). | A service mesh project launched by Kong that uses Envoy as a sidecar proxy, using Kong's own gateway as ingress. | An open source service mesh created by Microsoft, using Envoy as a sidecar, compatible with SMI (also proposed by Microsoft). |

{{< /table >}}

The open source projects in the above table are summarized below, and several projects closely related to service mesh are added, as follows:

- [Envoy](https://envoyproxy.io/): Envoy is a cloud-native proxy, frequently used as a sidecar in other Envoy-based service meshes and for building API Gateways.
- [Service Mesh Performance (SMP)](https://smp-spec.io/): Metrics that capture details of infrastructure capacity, service mesh configuration, and workload metadata to standardize service mesh values and describe the performance of any deployment.
- [Service Mesh Interface (SMI)](https://smi-spec.io/): It is not a service mesh, but a set of service mesh implementation standards. Similar to OAM, SPIFFE, CNI, CSI, etc., it defines interface standards, and the specific implementation varies. Currently, Traefik Mesh and Open Service Mesh claim to support this specification.
- [Network Service Mesh](https://networkservicemesh.io/): It's worth mentioning this project because it's often mistaken for a service mesh. In fact, it is oriented towards a three-layer network, and it can be used to connect multi-cloud/hybrid clouds without changing the CNI plug-in. It's not a "service mesh" as we define it, but a powerful complement to a service mesh (albeit a somewhat confusing name with a service mesh in it).

Looking at the so-called "service mesh" projects mentioned above, we can see that most service mesh project initiators start out as proxies, and then do the control plane. And Istio, Consul Connect, Open Service Mesh, and Kuma all use Envoy as a sidecar proxy. Only Linkerd and Traefik Mesh have launched their own proxies. And all service mesh projects support the sidecar pattern. Apart from Istio, Linkerd, and Consul Connect, which have been used in production, other service mesh projects are currently only "toys".

## Performance optimization for Istio

After Istio 1.5 had a stable architecture, the community's main focus was on optimizing Istio's performance. Below, I will give you a detailed introduction to performance optimization methods in Istio, including:

- Use the Proxyless mode.
- Use eBPF to optimize traffic hijacking.
- Optimization of control plane performance.
- Optimization of data plane performance.

### Proxyless mode

Proxyless mode is an experimental feature proposed by Istio in version 1.11-a service mesh without sidecar proxy based on gRPC and Istio. Using this pattern allows you to add gRPC services directly to Istio without injecting an Envoy proxy into the Pod. The figure below shows a comparison of sidecar mode and proxyless mode.

{{<figure title="Sidecar vs Proxyless" width="100%" alt="image" src="sidecar-to-proxyless.svg">}}

As we can see from the above figure, although proxyless mode does not use a proxy for data plane communication, it still needs an agent for initialization and communication with the control plane. First, the agent generates a bootstrap file at startup, in the same way that it generates bootstrap files for Envoy. This tells the gRPC library how to connect to Istiod, where to find certificates for data plane communication, and what metadata to send to the control plane. Next, the agent acts as an xDS proxy, connecting and authenticating with `Istiod`. Finally, the agent obtains and rotates the certificate used in the data plane communication.

> *The essence of a service mesh is not a sidecar model, nor a configuration center, or transparent traffic interception, but a standardized inter-service communication standard.*

Some people say that the proxyless model has returned to the old way of developing microservices based on SDK, and the advantages of service meshes have been lost. Can it still be called service mesh? In fact, this is also a compromise on performance—if you mainly use gRPC to develop microservices, you only need to maintain gRPC versions in different languages; that is, you can manage microservices through the control plane.

> *Envoy xDS has become the de facto standard for communication between cloud-native application services.*

### Optimizing traffic hijacking with eBPF

In the section on transparent traffic hijacking, we can see the iptables rules and paths that an inter-service traffic passes through when it reaches the destination pod, which needs to go through multiple iptables rules, such as `PREROUTING`, `ISTIO_INBOUND`, `ISTIO_IN_REDIRECT`, `OUTPUT`, `ISTIO_OUTPUT`, and so on. Suppose now that there is a service A that wants to call service B in another pod on a non-localhost through the network stack, as shown in the figure below.

![Service request path between pods not on the same host (iptables mode)](iptables-process.svg)

From the figure, we can see that there are four iptables passes in the whole calling process. Among them, the outbound (iptables2) from Envoy in Pod A and the inbound (iptables3) from eth0 in Pod B are unavoidable. So can the remaining two, iptables1 and iptables4 be optimized? Wouldn't it be possible to shorten the network path by letting the two sockets communicate directly? This requires programming through eBPF such that:

- Service A's traffic is sent directly to Envoy's inbound socket.
- After Envoy in Pod B receives the inbound traffic, it has determined that the traffic is to be sent to the local service and directly connects the outbound socket to Service B.

The transparent traffic interception network path using eBPF mode is shown in the following figure.

![Service request path between pods not on the same host (eBPF mode)](ebpf-diff-node.svg)

If service A and service B to be accessed are on the same node, the network path will be shorter.

![Network request path between the same host Pod (eBPF mode)](ebpf-same-node.svg)

Access between services in the same node completely bypasses the TCP/IP stack and becomes direct access between sockets.

{{<callout note "What is eBPF?">}}

We know that modifying the Linux kernel code is difficult, and it takes a long time for new features to be released into the kernel. eBPF is a framework that allows users to load and run custom programs within the operating system's kernel. That is, with eBPF, you can extend and change the behavior of the kernel without directly modifying the kernel. I will briefly introduce eBPF to you below.

- After the eBPF program is loaded into the kernel, it needs to pass the verification of the verifier before it can run. The verifier can prevent the eBPF program from accessing beyond its authority, ensuring the kernel's security.
- eBPF programs are attached to kernel events and are triggered when there is an entry or exit from a kernel function.
- In kernel space, eBPF programs must be written in a language that supports a compiler that generates eBPF byte code. Currently, you can write eBPF programs in C and Rust.
- The eBPF program has compatibility issues with different Linux versions.

Since the eBPF program can directly monitor and operate the Linux kernel, it has a perspective on the lowest level of the system and can play a role in traffic management, observability, and security.

{{</callout>}}

The open source project [Merbridge](https://github.com/merbridge/merbridge) uses eBPF to shorten the path of transparent traffic hijacking and optimize the performance of the service mesh. For some details on the Merbridge implementation, please refer to the [Istio blog](https://istio.io/latest/blog/2022/merbridge/) .

{{<callout warning Notice>}}
The eBPF functions used by Merbridge require a Linux kernel version ≥ 5.7.
{{</callout>}}

At first glance, eBPF seems to implement the functions of Istio at a lower level and has a greater tendency to replace sidecar. But eBPF also has many limitations that make it impossible to replace service meshes and sidecars in the foreseeable future. Removing the sidecar in favor of a proxy-per-host model would result in:

1. The explosion radius of a proxy failure is expanded to the entire node.
2. It makes the security problem more complicated because too many certificates are stored on a node. Once attacked, there will be a risk of key leakage.
3. On the host, traffic contention between Pods.

Moreover, eBPF is mainly responsible for Layer 3/4 traffic and can run together with CNI, but it is not suitable to use eBPF for Layer 7 traffic.

> *In the near future, eBPF technology will not be able to replace service meshes and sidecars.*

### Control plane performance optimization

The above two optimizations are carried out for the data plane. Let's look at the performance optimization of the control plane. You can think of a service mesh as a show, where the control plane is the director and the data plane is all the actors. The director is not involved in the show but directs the actors. If the plot of the show is simple and the duration is very short, then each actor will be allocated very few scenes, and rehearsal will be very easy; if it is a large-scale show, the number of actors is large and the plot is very complicated. To rehearse the show well, one director may not be enough. He can't direct so many actors, so we need multiple assistant directors (expanding the number of control plane instances); we also need to prepare lines and scripts for actors, if actors It is also possible to perform a series of lines and scenes in one shot (reduce the interruption of the data plane and push updates in batches), so is our rehearsal more efficient?

From the above analogy, you should be able to find the direction of control plane performance optimization, that is:

- Reduce the size of the configuration that needs to be pushed.
- Push batch proxy.
- To expand the scale of the control plane.

#### Reduce the configuration that needs to be pushed out

The easiest and most straightforward way to optimize control plane performance is to reduce the size of the configuration to be pushed. Assuming that there is workload A, if the proxy configuration related to A, that is, the configuration of the service that A needs to access, is pushed to A, instead of pushing the configuration of all services in the mesh to A, it can greatly reduce the number of services to be pushed. The size and application range of the configuration. The Sidecar resource in Istio can help us do this. The following is an example of a sidecar configuration:

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: Sidecar
metadata:
  name: default
  namespace: us-west-1
spec:
  workloadSelector:
    labels:
      app: app-a
  egress:
  - hosts:
    - "us-west-1/*"
```

We can use the `workloadSelector` field  to limit the scope of workloads that the sidecar configuration applies to, and the `egress` field is used to determine the scope of services for the workload, so that the control plane can only push the configuration of its dependent services to service A, greatly reducing the need to push to the data plane. The configuration size of the service mesh reduces the memory and network consumption of the service mesh.

#### Batch push the proxy configurations

The process of pushing the proxy configuration from the control plane Istiod to the data plane is complex. The following figure shows the process.

![Flowchart of Istiod pushing proxy configuration to the data plane](istiod-push.svg)

After an administrator configures the Istio mesh, the process for pushing proxy configuration in Istiod is as follows:

1. The event that the administrator updates the configuration will trigger the configuration synchronization of the data plane.
1. After listening to these events, Istio's `DiscoveryServer` components will not push the configuration to the data plane immediately, but will add these events to the queue and continue to merge events within a period of time. This process is called debouncing, which is to prevent frequent updates to the data plane configuration.
1. After the debouncing period, these events will be pushed to the queue.
1. To expedite push progress, Istiod will limit the number of simultaneous push requests.
1. Envoy configuration push data plane workloads are translated into events.

From the above process, we can see that the key to optimizing configuration push is the debounce period in step 2 and the current limit setting in step 4. There are several environmental variables that can help you set up control plane push:

- `PILOT_DEBOUNCE_AFTER`: The time after which the event will be added to the push queue.
- `PILOT_DEBOUNCE_MAX`: This defines the maximum amount of time an event can debounce.
- `PILOT_ENABLE_EDS_DEBOUNCE`: Specifies whether endpoint updates meet debounce rules or have priority and fall into the push queue immediately.
- `PILOT_PUSH_THROTTLE`: Controls how many push requests are processed at once.

Please refer to the [Istio documentation](https://istio.io/latest/docs/reference/commands/pilot-agent/#envvars) for the default values and specific configuration of these environment variables .

How to set these values can follow the following principles:

- If control plane resources are idle, to speed up the propagation of configuration updates, you can:
  - Shorten the debounce period and increase the number of pushes.
  - Increase the number of push requests processed simultaneously.
- If the control plane is saturated, to reduce performance bottlenecks, you can:
  - Delay the debounce cycle to reduce the number of pushes.
  - Increase the number of push requests processed simultaneously.

As for how to set the optimal solution, you need to debug it in conjunction with your observable system.

#### Scale up the control plane

If setting up debounce batch processing and sidecar cannot optimize the performance of the control plane, the final choice is to expand the scale of the control plane, including expanding the resources of a single Istiod instance and increasing the number of Istiod instances. Which expansion method is used depends on the situation:

- When the resource occupancy of a single Istiod is saturated, it is recommended that you increase the instance size of Istiod. This is usually because there are too many resources in the service mesh (Istio's custom resources, such as VirtualService, DestinationRule, etc.) that need to be processed.
- Then increase the number of instances of Istiod, which can spread the workloads to be managed by each instance.

### Data plane performance optimization

Apache SkyWalking can serve as an observability tool for Istio and can also help us analyze the performance of services in dynamic debugging and troubleshooting. Its newly launched Apache SkyWalking Rover component can use eBPF technology to accurately locate Istio's key performance issues.

On the data plane, we can increase Envoy's throughput to optimize Istio's performance by:

- Disable Zipkin tracing or reduce the sample rate.
- Simplified access log format.
- Disable Envoy's Access Log Service (ALS).

For data on the impact of the above optimizations on Envoy throughput, see Using eBPF to pinpoint key performance issues for service meshes.

## Envoy: the service mesh's leading actor

We know that the service mesh is composed of the data plane and the control plane. From the above list of service mesh open source projects, we can see that most of the service mesh open source projects are based on Envoy, and then develop their own control plane. Remember when I likened a service mesh to a gig earlier in this article? In this service mesh performance, there is no way to think that Envoy is the leading actor. The xDS protocol, invented by Envoy, has basically become a general API for service meshes. Many open source projects for service meshes use Envoy as the data plane. Shown below is the architecture diagram of Envoy.

![Envoy Architecture Diagram](envoy-arch.svg)

xDS is the core that differentiates Envoy from other proxies because its code and parsing process are very complex and it is difficult to expand. The following is a topology diagram of Istio components. From the figure, we can see that there is not only one `envoy` process but a `pilot-agent`.

{{<figure title="Istio component topology" alt="image" id="istio-components" src="istio-components.svg">}}

The role of the `pilot-agent` process is as follows:

- As `the` parent process of, responsible for the lifecycle management of Envoy.
- Receive pushes from the control plane, configure the proxy and certificates.
- Collect Envoy statistics and aggregate sidecar statistics for Prometheus to collect.
- A built-in local DNS proxy is used to resolve the internal domain name of the cluster that cannot be resolved by Kubernetes DNS.
- Health checks for Envoy and DNS proxy.

From the above functions, we can see that the `pilot-agent` process is mainly used to interact with Istiod and play a commanding and auxiliary role for Envoy. The core component of Istio is Envoy. So will Envoy "act and guide," no longer cooperate with Istio, and build its own control plane?

> *In a Sidecar container, the `pilot-agent` is like Envoy's "Sidecar".*

{{<callout note "Readers to think about">}}
Can the `pilot-agent` function be built directly into Envoy, thus eliminating the `pilot-agent`?
{{</callout>}}

## Envoy Gateway unified service mesh gateway

In Kubernetes, the first resource object used to expose services in a cluster, in addition to the service resource object, is Ingress. Using Ingress you simply open an external access point for the cluster, routing traffic to specific services via HTTP Hosts and `path`. Compared with exposing services directly to service resources , it can reduce the network access point (PEP) of the cluster and reduce the risk of the cluster being attacked by the network. The following figure shows the process of using Ingress to access services in the cluster.

![Kubernetes Ingress traffic access flow chart](ingress.svg)

Before Kubernetes, API Gateway software was widely used as edge routing. When referring to Istio, Istio's custom Gateway resources are added, which makes accessing resources in the Istio service mesh one more option, as shown in the following figure.

![Ways to access services in the Istio mesh](access-cluster.svg)

Now, to expose services in a single Istio mesh, how do I choose between `NodePort`, `LoadBalancer`, Istio Gateway, Kubernetes Ingress, and API Gateway software? If it is a multi-cluster service mesh, how do clients access services within the mesh? Our service mesh lead, Envoy, has done this well and is used in many forms:

- Istio, Kuma, and Consul Connect all use Envoy as a sidecar proxy.
- Kubernetes Ingress Controller/API Gateway: [Contour](https://github.com/projectcontour/contour), [Emissary](https://github.com/emissary-ingress/emissary), [Hango](https://github.com/hango-io/hango-gateway), [Gloo](https://github.com/solo-io/gloo).

These projects utilize Envoy to implement service meshes and API gateways, with a lot of functional overlap, proprietary features, or a lack of community diversity due to the fact that the Envoy community does not provide a control plane implementation. In order to change the status quo, the Envoy community initiated the Envoy Gateway project, which will not change the Envoy core proxy, xDS, and go-control-plane. The project aims to combine the experience of existing Envoy-based API Gateway related projects. Some Envoy-specific extensions to the Kubernetes Gateway API lower the barrier to entry for Envoy users to use gateways. Because the Envoy Gateway still issues configuration to the Envoy proxy through xDS, you can also use it to manage gateways that support xDS, such as the Istio Gateway.

The gateways we have seen now are basically used as ingress gateways in a single cluster and can do nothing for multi-cluster and multi-mesh. To cope with multiple clusters, we need to add another layer of gateways on top of Istio and a global control plane to route traffic between multiple clusters, as shown in the figure below.

![Schematic diagram of two-level gateway with multi-cluster and multi-mesh](t2-gateway.svg)

{{<callout note "A brief introduction to two-tire gateways">}}
- The Tire-1 gateway (hereinafter referred to as T1) is located at the application edge and is used in a multi-cluster environment. The same application is hosted on different clusters at the same time, and the T1 gateway routes the application's request traffic between these clusters.
- The Tire-2 gateway (hereafter referred to as T2) is located at the edge of a cluster and is used to route traffic to services within that cluster managed by the service mesh.
{{</callout>}}

Multi-cluster service mesh management is achieved by adding a layer of global control plane and APIs in addition to the Istio control plane. Deploying T1 gateways as a cluster prevents a single point of failure. To learn more about two-tier gateways, refer [to Routing Service Mesh Traffic Through Two-Tier Gateway Designs](https://lib.jimmysong.io/blog/designing-traffic-flow-via-tier1-and-tier2-ingress-gateways/) .

The configuration of the T1 gateway is as follows:

```yaml
apiVersion: gateway.tsb.tetrate.io/v2
kind: Tier1Gateway
metadata:
  name: service1-tier1
  group: demo-gw-group
  organization: demo-org
  tenant: demo-tenant
  workspace: demo-ws
spec:
  workloadSelector:
    namespace: t1
    labels:
      app: gateway-t1
      istio: ingressgateway
  externalServers:
  - name: service1
    hostname: servicea.example.com
    port: 80
    tls: {}
    clusters:
    - name: cluster1
      weight: 75
    - name: cluster2
      weight: 25 
```

This configuration exposes `servicea.example.com`  service through the T1 gateway and forwards `75%` of the traffic accessing the service to cluster1 and `25%` of the traffic to cluster2. In addition, in order to deal with the traffic, services, and security configurations in multiple clusters, Tetrate's flagship product, [Tetrate Service Bridge](https://www.tetrate.io/tetrate-service-bridge/), a series of group APIs have also been added to the [TSB documentation](https://docs.tetrate.io/service-bridge/1.4.x) for details.

## Istio open source ecosystem

Istio has been open source for more than five years, and many open source projects have emerged in the past two years, among which the more representative ones are:

- Slime (NetEase open source)
- Tencent's open source initiatives Aeraki
- Istio's official support for Wasm plugins

Their presence makes Istio more intelligent and expands the scope of Istio.

### Slime

Slime is an Istio-based smart mesh manager open-sourced by the NetEase Shufan microservices team. Slime has been implemented based on Kubernetes Operator and can be used as the CRD manager of Istio. It can define dynamic service governance policies without any customization of Istio, so as to achieve the purpose of automatically and conveniently using the high-level functions of Istio and Envoy.

In the previous control plane performance optimization, we mentioned optimizing the performance of Istio by "reducing the configuration that needs to be pushed", but Istio cannot automatically identify and cannot rely on the proxy configuration that needs to be pushed to each sidecar to optimize. Slime provides a  `lazyload` controller, which can help us implement lazy loading of configuration. Users do not need to configure the `SidecarScope` manually. Istio can load service configuration and service discovery information on demand.

The following figure shows the flow chart of updating the data plane configuration with Slime as the management plane of Istio.

![Flowchart for updating Istio data plane configuration using Slime](slime-process.svg)

The specific steps for updating the data plane configuration are as follows:

1. The Slime Operator completes the initialization of Slime components in Kubernetes according to the administrator's configuration.
2. Developers create configurations that conform to the Slime CRD specification and apply them to the Kubernetes cluster.
3. Slime queries the monitoring data of related services saved in Prometheus, converts Slime CRD to Istio CRD in combination with the configuration of the adaptive part in Slime CRD, and pushes it to Global Proxy at the same time.
4. Istio monitors the creation of Istio CRDs.
5. Istio sends the Sidecar Proxy's configuration information to the corresponding Sidecar Proxy on the data plane.

Because the first invocation of all services in the data plane passes through the Global Proxy, the Proxy can record the invocation and dependency information of all services, and update the configuration of the Sidecar resource in Istio according to the dependency information. When the routing information is redefined, the original record of the Global Proxy becomes invalid, and a new data structure is required to maintain the calling relationship of the service. Slime created a  `ServiceFence` to maintain the service invocation relationship and solve the problem of missing service information.

### Aeraki

Aeraki Mesh is a service mesh project open sourced by Tencent Cloud in March 2021. It expands support for seven-layer protocols based on Istio and focuses on solving the service governance of **non-HTTP protocols** in Istio.  It entered the CNCF sandbox in June 2022.

The following figure shows the architectural diagram of Aeraki.

{{<figure title="Aeraki Architecture Diagram" alt="image" src="aeraki-arch.svg" width="60%">}}

The process of using Aeraki to serve non-HTTP into an Istio mesh is as follows:

1. Aeraki's X2Istio component connects to the service registry, obtains the registration information of non-HTTP services, and generates a ServiceEntry to register with Istio.
2. Aeraki, as the management plane on top of Istio, obtains the ServiceEntry configuration from Istio.
3. Aeraki judges the protocol type of the service (e.g. `tcp-metaprotocol-dubbo`) through the port command, then generates the MetaProtocol Proxy Filter (compatible with EnvoyFilter) configuration, and at the same time modifies the RDS address to point it to Aeraki.
4. Istio uses the xDS protocol to deliver the configuration (LDS, CDS, EDS, etc.) to the data plane.
5. Aeraki generates routing rules based on the information in the service registry and user settings and sends them to the data plane through RDS.

The key to the whole process of accessing non-HTTP services in Istio is the **MetaProtocol Proxy**. Istio supports HTTP/HTTP2, TCP and gRPC protocols by default, and experimentally supports Mongo, MySQL and Redis protocols. To use Istio to route traffic for other protocols not only requires a lot of work to modify the Istio control plane and extend Envoy, but also a lot of duplication because different protocols share common control logic. The Envoy MetaProtocol Proxy is a general seven-layer protocol proxy implemented based on Envoy. The MetaProtocol Proxy is an extension based on the Envoy code. It implements basic capabilities such as service discovery, load balancing, RDS dynamic routing, traffic mirroring, fault injection, local/global traffic limiting, etc. for the seven-layer protocol, which greatly reduces the difficulty of third-party protocol development for Envoy.

The following figure shows the architecture diagram of MetaProtocol Proxy.

![MetaProtocol Proxy Architecture Diagram](metaprotocol-proxy.svg)

When we want to extend Istio to support other seven-layer protocols such as Kafka, Dubbo, and Thrift, we only need to implement the codec interfaces (Decode and Encode) in the above figure, and then we can quickly develop a third-party protocol plug-in based on MetaProtocol. Because MetaProtocol Proxy is an extension of Envoy, you can still develop filters for it in different languages and use `EnvoyFilter` resources to deliver configuration to the data plane.

### WasmPlugin API

WasmPlugin is an API introduced in Istio 1.12. As a proxy extension mechanism, we can use it to add custom and third-party Wasm modules to the data plane. The diagram below shows how a user can use the WasmPlugin in Istio.

![Flowchart of using WasmPlugin in Istio](wasmplugin.svg)

Specific steps are as follows:

1. Users use the Proxy-Wasm SDK (currently available in AssemblyScript, C++, Rust, Zig, and Go) to develop extensions and build them into OCI images (such as Docker images) to upload to the mirror repository.
2. The user writes the `WasmPlugin` configuration and applies it to Istio.
3. The `WasmPlugin` configuration for the workload in the configuration is selected by the Istio control plane, and the Wasm module is injected into the specified Pod.
4. The `pilot-agent` in the sidecar loads the Wasm modules from remote or local files and run them in Envoy.

## Who should use Istio?

Well, having said that, what does this have to do with you? Istio's relationship with you depends on your role.

- If you are the platform leader, after applying the service mesh, you may enhance the observability of your platform and have a unified platform to manage microservices. You will be the direct beneficiary and the main implementer of the service mesh.
- If you are an application developer, you will also benefit from a service mesh because you can be more dedicated to the business logic and not worry about other non-functional issues such as retry policies, TLS, etc..

The following diagram shows the adoption path for service meshes.

![The path to adopt service mesh](adopt.svg)

Whether to adopt a service mesh depends on your technology development stage, whether the application implements containerization and microservices, the need for multi-language, whether mTLS is required, and the acceptance of performance loss.

## Service mesh positioning in the cloud native technology stack

The development of technology is changing with each passing day. In the past two years, some new technologies have appeared, which seem to challenge the status of the service mesh. Some people claim that it can directly replace the existing service mesh of the classic sidecar model. We should not be confused by the noise of the outside world, correcting the positioning of service mesh in the cloud native technology stack.

> *Blindly promoting a technology and ignoring its applicable scenarios is hooliganism.*

The diagram below shows the cloud-native technology stack.

{{<figure title="Cloud native technology stack diagram" alt="Cloud native technology stack diagram" src="cloud-native-stack.svg" width="60%">}}

We can see that the "cloud infrastructure", "middleware", and "application" layers in the cloud native technology stack diagram all enumerate some iconic open source projects that build standards in their fields:

- In the field of cloud infrastructure, Kubernetes unifies the standards for container orchestration and application life cycle management, and the Operator mode lays the standards for extending the Kubernetes API and third-party application access.
- In the field of middleware, the service mesh assumes some or all of the responsibilities of the seven-layer network, observability, and security in the cloud native technology stack. It runs in the lower layer of the application and is almost imperceptible; Dapr (distributed application runtime) defines the capability model of cloud-native middleware. Developers can integrate Dapr's multi-language SDK into their applications and programs for the distributed capabilities provided by Dapr, without caring about the applications running on them. environment and docking back-end infrastructure. Because the Dapr runtime (Sidecar mode deployment, which contains various building blocks) is running in the same Pod as the application, it automatically connects us with the backend components;
- In the application field, OAM aims to establish an application model standard, an application through components, characteristics, policies, and workflows.

The diagram below shows how Istio is positioned for seven-tier mesh management in a cloud-native deployment.

![Istio is positioned in a seven-layer network in a cloud-native architecture](istio-role.svg)

{{<callout note "What is the relationship between Dapr and Istio?">}}

Similarities between Istio and Dapr:

- Both Istio and Dapr can use the sidecar mode deployment model.
- Both belong to middleware and can also manage communication between services.

Differences between Istio and Dapr:

- Different goals: Istio's goal is to build a zero-trust network and define inter-service communication standards, while Dapr's goal is to build a standard API for middleware capabilities.
- Different architectures: Istio = Envoy + transparent traffic hijacking + control plane; Dapr = multilingual SDK + standardized API + distributed capability components.
- However, the application of Istio is almost imperceptible to developers and mainly requires the implementation of the infrastructure operation and maintenance team, while the application of Dapr requires developers to independently choose to integrate the Dapr SDK.

{{</callout>}}

## The future of service mesh

In the above article, I introduced the development context and open source ecosystem of Istio. Next, I will introduce the future trends of Istio service mesh:
- Zero trust network
- Hybrid cloud

> *The future of service meshes lies in being the infrastructure for zero-trust networks and hybrid clouds.*

This is also the direction of Tetrate, the enterprise-level service mesh provider of the author's company. We are committed to building an application-aware network suitable for any environment and any load and providing a zero-trust hybrid cloud platform. Shown below is the architecture diagram of Tetrate's flagship product, Tetrate Service Bridge.

![TSB Architecture Diagram](tsb.svg)

Tetrate was founded by the founders of the Istio project, and TSB is based on open source Istio, Envoy, and Apache SkyWalking. We also actively contributed to the upstream community and participated in the creation of the Envoy Gateway project to simplify the use of Envoy gateways (XCP in the figure above is a gateway built with Envoy).

## Zero trust

Zero Trust is an important topic at IstioCon 2022. Istio is becoming an important part of zero trust, the most important of which is **identity-oriented control** rather than network-oriented control.

{{<callout note "What is Zero Trust?">}}

Zero Trust is a security philosophy, not a best practice that all security teams follow. The concept of zero trust was proposed to bring a more secure network to the cloud-native world. Zero trust is a theoretical state where all consumers within a network not only have no authority but also have no awareness of the surrounding network. The main challenges of zero trust are the increasingly granular authorization and time limit for user authorization.

{{</callout>}}

### Authentication

Istio 1.14 adds support for SPIRE. SPIRE (SPIFFE Runtime Environment, CNCF Incubation Project) is an implementation of SPIFFE (Secure Production Identity Framework For Everyone, CNCF Incubation Project). In Kubernetes, we use ServiceAccount to provide identity information for workloads in Pods, and its core is based on Token (using Secret resource storage) to represent workload identity. A token is a resource in a Kubernetes cluster. How to unify the identities of multiple clusters and workloads running in non-Kubernetes environments (such as virtual machines)? That's what SPIFFE is trying to solve.

The purpose of SPIFFE is to establish an open and unified workload identity standard based on the concept of zero trust, which helps to establish a fully identifiable data center network with zero trust. The core of SPIFFE is to define a short-lived encrypted identity document—SVID (SPFFE Verifiable Identity Document)—through a simple API, which is used as an identity document (based on an X.509 certificate or JWT token) for workload authentication. SPIRE can automatically rotate SVID certificates and keys according to administrator-defined policies, dynamically provide workload identities, and Istio can dynamically consume these workload identities through SPIRE.

The Kubernetes-based SPIRE architecture diagram is shown below.

![Architecture diagram of SPIRE deployed in Kubernetes](spire-with-kubernetes.svg)

Istio originally used the Citadel service in Istiod to be responsible for certificate management in the service mesh, and issued the certificate to the data plane through the xDS (to be precise, SDS API) protocol. With SPIRE, the work of certificate management is handed over to SPIRE Server. SPIRE also supports the Envoy SDS API. After we enable SPIRE in Istio, the traffic entering the workload pod will be authenticated once after being transparently intercepted into the sidecar. The purpose of authentication is to compare the identity of the workload with the environment information it runs on (node, Pod's ServiceAccount and Namespace, etc.) to prevent identity forgery. Please refer to How to Integrate SPIRE in Istio to learn how to use SPIRE for authentication in Istio.

We can deploy SPIRE in Kubernetes using the Kubernetes Workload Registrar, which automatically registers the workload in Kubernetes for us and generates an SVID. The registration machine is a Server-Agent architecture, which deploys a SPIRE Agent on each node, and the Agent communicates with the workload through a shared UNIX Domain Socket. The following diagram shows the process of using SPIRE for authentication in Istio.

{{<figure title="Schematic diagram of the SPIRE-based workload authentication process in Istio" width="40%"  src="workload-attestation.svg">}}

The steps to using SPIRE for workload authentication in Istio are as follows:

1. To obtain the SIVD, the SPIRE Agent is referred to as pilot-agent via shared UDS.
1. The SPIRE Agent asks Kubernetes (to be precise, the kubelet on the node) for load information.
1. The kubelet returns the information queried from the API server to the workload validator.
1. The validator compares the result returned by the kubelet with the identity information shared by the sidecar. If it is the same, it returns the correct SVID cache to the workload. If it is different, the authentication fails.

Please refer to the SPIRE documentation for the detailed process of registering and authenticating workloads.

### NGAC

When each workload has an accurate identity, how can the permissions of these identities be restricted? RBAC is used by default in Kubernetes for access control. As the name suggests, this access control is based on roles. Although it is relatively simple to use, there is a role explosion problem for large-scale clusters—that is, there are too many roles, and the types are not static, making it difficult to track and audit role permission models. In addition, the access rights of roles in RBAC are fixed, and there is no provision for short-term use rights, nor does it take into account attributes such as location, time, or equipment. Enterprises using RBAC have difficulty meeting complex access control requirements to meet the regulatory requirements that other organizations demand.

NGAC, or Next Generation Access Control, takes the approach of modeling access decision data as a graph. NGAC enables a systematic, policy-consistent approach to access control, granting or denying user management capabilities with a high level of granularity. NGAC was developed by NIST (National Institute of Standards and Technology) and is currently used for rights management in Tetrate Service Bridge. For more information on why you should choose NGAC over ABAC and RBAC, please refer to the blog post Why you should choose NGAC as your permission control model.

## Hybrid cloud

In practical applications, we may deploy multiple Kubernetes clusters in various environments for reasons such as load balancing; isolation of development and production environments; decoupling of data processing and data storage; cross-cloud backup and disaster recovery; and avoiding vendor lock-in. The Kubernetes community provides a "cluster federation" function that can help us create a multi-cluster architecture, such as the common Kubernetes multi-cluster architecture shown in the figure below, in which the host cluster serves as the control plane and has two member clusters, namely West and East.

![Kubernetes Cluster Federation Architecture](multicluster.svg)

Cluster federation requires that the networks between the host cluster and member clusters can communicate with each other but does not require network connectivity between member clusters. The host cluster serves as the API entry, and all resource requests from the outside world to the host cluster will be forwarded to the member clusters. The control plane of the cluster federation is deployed in the host cluster, and the "Push Reconciler" in it will propagate the identities, roles, and role bindings in the federation to all member clusters. Cluster federation simply "connects" multiple clusters together, replicating workloads among multiple clusters, and the traffic between member clusters cannot be scheduled, nor can true multi-tenancy be achieved.

Cluster federation is not enough to realize hybrid clouds. In order to realize hybrid clouds in the true sense, it is necessary to achieve interconnection between clusters and realize multi-tenancy at the same time. TSB builds a general control plane for multi-cluster management on top of Istio and then adds a management plane to manage multi-clusters, providing functions such as multi-tenancy, management configuration, and observability. Below is a diagram of the multi-tenancy and API of the Istio management plane.

![Schematic diagram of TSB's management plane built on top of Istio](tsb-management-plane.svg)

In order to manage the hybrid cloud, TSB built a management plane based on Istio, created tenant and workspace resources, and applied the gateway group, traffic group, and security group to the workloads in the corresponding cluster through selectors. For the detailed architecture of TSB, please refer to the [TSB documentation](https://docs.tetrate.io/service-bridge).

Thanks for reading.
