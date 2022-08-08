---
title: "Service Mesh Overview"
date: 2021-01-22T08:27:17+08:00
draft: false
categories: ["service mesh"]
image: "/images/banner/service-mesh-banner.jpg"
description : "Deeper understanding of Istio, Chapter 1."
---

Microservices architecture is the current technology hotspot in software
development, and has been featured on various blogs, social media, and
conference presentations, with a lot of interest from both infrastructure and business system engineers. This phenomenon and fever has been going on for nearly 6 years now.

Especially in recent years, microservices architecture has gradually
developed and matured, from the initial "starburst" to the current
large-scale implementation and practice, almost becoming the preferred
architecture in distributed environments. Microservice architecture has
become a hot technology nowadays, and a lot of Internet enterprises are
doing the implementation and promotion of microservice architecture. At
the same time, there are also many traditional enterprises doing
Internet technology transformation based on microservices and
containers.

In the Internet technology transformation, there is a trend in China to
Spring Cloud and Dubbo as the representative of the microservices
development framework is very popular and popular. However, there is no "silver bullet" for software development, and applications built on
these traditional microservices frameworks are enjoying their advantages
while the pain points are becoming more and more obvious, such as.

-   Intrusive. To integrate the capabilities of the SDK, in addition to
    adding relevant dependencies, you need to add a portion of code,
    annotations or configurations to the business code to prevent
    unclear boundaries between the business layer code and the
    governance layer code.

-   High upgrade cost. Each upgrade requires the business application to
    modify the SDK version, re-run functional regression tests, and
    deploy live for each machine. This is in conflict with the rapid
    iterative development of the business for the business side, and
    most business sides are reluctant to stop and do these things that
    are less relevant to their business goals.

-   Version fragmentation is serious. Due to the high upgrade cost and
    the fact that the middleware is constantly moving forward, over
    time, it leads to inconsistent versions and uneven capabilities of
    the SDKs referenced by different services online, resulting in a
    situation where it is difficult to unify governance.

-   Middleware evolution is difficult. Due to severe version fragmentation, middleware needs to be compatible with various old versions of logic in the code as it evolves forward, and it is impossible to achieve rapid iteration because of the "shackles".

-   Spring Cloud is known as the "family" of microservices governance
    frameworks, containing dozens of components, large and small, with
    so much content that it often takes years for users to become
    familiar with the key components. If you use Spring Cloud as a
    complete governance framework, you need to understand the principles and implementation in depth, otherwise it will be very difficult to locate the problem.

-   Incomplete governance features. Unlike RPC frameworks, Spring Cloud,
    as the quintessential governance framework, is not a panacea.
    Advanced features such as protocol conversion support, multiple
    authorization mechanisms, dynamic request routing, fault injection,
    grayscale publishing, etc. are not covered. These features are often
    indispensable for large-scale enterprise implementations, so
    companies also need to invest in other human resources for
    self-research of related features, or research other components as a
    supplement.

The above lists the limitations of traditional microservices frameworks, but it does not mean that they are useless. In small and medium-sized enterprises, the adoption of traditional microservices frameworks like Spring Cloud can not only meet most of the service governance needs, but can also be used to rapidly advance microservices transformation. The limitations of traditional microservices frameworks are the inevitable stage of technology development to a certain extent, and the driving force behind the continuous development and advancement of technology. Service Mesh technology is a better solution to solve these problems at this stage.

1.1 Service Mesh Basic Concept
------------------------------

In 2019, among the many hot technology trends, cloud-native continues to
receive a lot of attention, and many developers are very enthusiastic
about the emerging technologies, and many enterprises have started to
explore the transformation and implementation of cloud-native
architecture. This year, Chinese developers have experienced a shift
from focusing on the "cloud native concept" to focusing on "cloud
native implementation practices". As a result, Service Mesh technology
is getting hotter and hotter, receiving more and more attention from
developers and gaining a large number of advocates. So, what is Service
Mesh? Why is it attracting developers\' attention? How does it differ
from traditional microservice frameworks?

The term Service Mesh was first coined by Buoyant, the company that
developed Linkerd, and was first used publicly on September 29,
2016.William Morgan, Buoyant CEO, defines the concept of Service Mesh as follows.

Service Mesh is an infrastructure layer that specializes in handling
service communication. Its responsibility is to perform reliable request
delivery under the complex topology of services composed of cloud-native
applications. In practice, it is a set of lightweight network proxies
deployed with application services and transparent to the application
services.

There are 4 key points in the above passage.

-   The essence: the infrastructure layer.

-   Function: Request distribution.

-   Deployment form: Web proxy.

-   Features: Transparent.

In 2017, with the introduction of Linkerd, Service Mesh entered the
vision of the domestic community and was translated into "Service
Mesh" by the domestic "technical evangelists".

The Service mesh is relatively simple in terms of overall architecture,
consisting of a bunch of user agents immediately adjacent to each
service, plus a set of task management processes. In a service mesh, the
agents are called the Data Layer or Data Plane, and the management
processes are called the Control Layer or Control Plane. The Data Plane
intercepts calls between different services and processes them; the
Control Plane not only coordinates the behavior of agents, but also
manipulates and measures the entire network by providing APIs for
operations and maintenance personnel.

Further, the Service mesh is a dedicated infrastructure layer designed
to "enable reliable, fast and secure inter-service invocation in a
microservices architecture". It is not a mesh of "services", but a
mesh of "agents" into which services can be plugged, thus abstracting
the network. In a typical service mesh, these proxies are injected into
each service deployment as a Sidecar. Instead of invoking services
directly over the network, services invoke their local Sidecar proxies,
which in turn represent service management requests, thus encapsulating
the complexity of inter-service communication. The interconnected
Sidecar agents implement a so-called data plane, which is contrasted
with the service mesh components (control plane) used to configure
agents and collect metrics.

In a nutshell, the infrastructure layer of Service Mesh is divided into
two main parts: the control plane and the data plane. The two currently popular open source service meshes, Istio and Linkerd, are actually of this construction.

Characteristics of the control plane.

-   Does not parse packets directly.

-   Communicate with agents in the control plane, issue policies and
    configurations.

-   Responsible for the visualization of web behavior.

-   APIs or command line tools are often provided that can be used for
    configuration versioning management for continuous integration and
    deployment.

Characteristics of the data plane.

-   It is usually designed with the stateless goal in mind, but in
    practice some data needs to be cached in order to improve the
    efficiency of traffic forwarding, so statelessness is also
    controversial.

-   Directly handle inbound and outbound packets, such as forwarding,
    routing, health checking, load balancing, authentication,
    authentication, monitoring data, etc.

-   Transparent to the application and can be deployed without
    perception.

So what changes have been brought about by the emergence of the Service mesh?

First, the decoupling of microservice governance and business logic.
Service mesh strips most of the functions in the SDK from the
application, disassembles them into independent processes, and deploys
them in the Sidecar model. By separating the service communication and
related control functions from the business process and sinking them to
the infrastructure layer, Service mesh makes them completely decoupled
from the business system, allowing developers to focus more on the
business itself.

Note that the word "most" is mentioned here. In the SDK, it is often
necessary to retain the protocol coding and decoding logic, and even in
some scenarios, a lightweight SDK is required to implement fine-grained
governance and monitoring policies. For example, to implement
method-level call-link tracing, the service mesh needs the business
application to implement Trace ID passing, and this part of the
implementation logic can also be realized by a lightweight SDK.
Therefore, at the code level, the Service mesh is not zero-intrusive.

Second, unified governance of heterogeneous systems. With the
development of new technologies and staff turnover, applications and
services in different languages and frameworks can appear even in the
same company. In order to unify the control of these services, the
previous practice is to develop a complete set of SDKs for each language
and framework, which is not only very costly to maintain but also brings
great challenges to the middleware team of the company. With Service
mesh, the main service governance function can be sunk to the
infrastructure, and multi-language support will be much easier. By
simply providing a very lightweight SDK, and in many cases not even a
separate SDK, it is easy to achieve unified traffic control, monitoring,
and other requirements in multiple languages and protocols.

In addition, the Service mesh has three major technical advantages over
traditional microservice frameworks.

-   Observability. Because the Service mesh is a dedicated
    infrastructure layer through which all inter-service communication
    needs to pass, it is uniquely positioned in the technology stack to
    provide uniform telemetry at the service invocation level. This
    means that all services are monitored as "black boxes". The
    service mesh captures line data such as source, destination,
    protocol, URL, status codes, latency, duration, etc. This is
    essentially the same data that web server logs can provide, but the
    service mesh captures this data for all services, not just the web
    layer of individual services. It is important to note that
    collecting data is only part of the solution to the observability
    problem in microservice applications. Storing and analyzing this
    data needs to be supplemented by mechanisms for additional
    functionality and acts as alerts or automatic instance scaling, for
    example.

-   Traffic Control. Service mesh can provide various control functions
    for services such as intelligent routing (blue-green deployment,
    canary release, A/B testing), timeout retry, meltdown, fault
    injection, traffic mirroring, etc. These are features that are not
    available in traditional microservices frameworks, but are critical
    features for the system. This is because the service mesh carries
    the communication traffic between microservices, so it is possible
    to test the robustness of the whole application by performing fault
    injection in the service mesh through rules to simulate the
    situation when some microservices fail. Since the Service mesh is
    designed to efficiently connect source request invocations to their
    optimal destination service instances, these traffic control
    features are destination-oriented. This is one of the key features
    of the Service mesh traffic control feature.

-   Security. To some extent, monolithic architecture applications are
    protected by their single address space. However, once a monolithic
    architecture application is broken down into multiple microservices,
    the network becomes a significant attack surface. More services
    means more network traffic, which means more opportunities for
    hackers to attack the information flow. And service meshs provide
    exactly the functionality and infrastructure to protect network
    calls. The benefits associated with Service mesh security are in the
    following 3 core areas: authentication of services, encryption of
    inter-service communications, and enforcement of security-related
    policies.

Service mesh has extremely powerful technical advantages and has brought great changes, and is called the "second generation of microservice architecture". However, just as there is no "silver bullet" for
software development and traditional microservice architecture has many
pain points, Service mesh also has its limitations, as follows.

-   Increased complexity. Service meshs introduce Sidecar agents and
    other components into an already complex distributed environment,
    which can greatly increase the overall chain and operational O&M
    complexity.

-   Ops needs to be more specialized. Adding a service mesh such as
    Istio to a container orchestration tool such as Kubernetes requires
    Ops staff to become experts in both technologies in order to fully
    use the capabilities of both, as well as locate problems encountered
    in the environment.

-   Delay. At the link level, service meshes are an intrusive and
    complex technique that can add significant latency to system calls.
    While this latency is on the millisecond level, it can be
    intolerable in particular business scenarios.

-   Platform Adaptation. The intrusive nature of the Service mesh forces
    developers and Ops to adapt to the platform and comply with its
    rules.

1.2 Microservices in the Post-Kubernetes Era
--------------------------------------------

Anyone who has heard of Service mesh and tried Istio probably has the
following 5 questions.

\(1\) Why should Istio bind Kubernetes?

\(2\) What is the role of Kubernetes and Service mesh respectively in
cloud-native?

\(3\) What aspects of Kubernetes does Istio extend? What problems have
been solved?

\(4\) What is the relationship between Kubernetes, xDS protocols (Envoy,
MOSN, etc.) and Istio?

\(5\) Should I use Service Mesh or not?

This section will take the reader through the inner workings of
Kubernetes, the xDS protocol, and the Istio service mesh. In addition,
this section will introduce the load balancing approach in Kubernetes,
the significance of the xDS protocol for service meshs, and why Istio is
still needed even with Kubernetes.

Using a service mesh is not a break with Kubernetes, but a natural fit;
the essence of Kubernetes is application lifecycle management through
declarative configuration, while the essence of a service mesh is to
provide inter-application traffic and security management, as well as
observability. If you have already built a stable microservices platform
using Kubernetes, how do you set up load balancing and traffic control
for calls between services?

The xDS protocol created by Envoy is supported by many open source
software such as Istio, Linkerd, MOSN, etc. Envoy\'s biggest contribution to Service mesh or Cloud Native is the definition of xDS.
envoy is essentially a web proxy, a modern version of proxy configured
through APIs, based on which many different usage scenarios have been
derived, such as API gateways, Sidecar agents and edge agents in service
meshs.

### 1.2.1 Important points

To get a preview of everything that follows, you can read some of the
main points listed below.

-   The essence of Kubernetes is application lifecycle management,
    specifically, the deployment and management of applications (scaling
    up and down, automatic recovery, and release).

-   Kubernetes provides a scalable and highly resilient deployment and
    management platform for microservices.

-   The Service mesh is based on transparent proxies that first
    intercept traffic to and from microservices through Sidecar proxies,
    and then manage the behavior of microservices through control plane
    configuration.

-   The Service mesh decouples traffic management from Kubernetes.
    Traffic within the Service mesh does not require the support of the
    kube-proxy component, and manages traffic between services through
    an abstraction close to the microservice application layer, enabling
    security and observability features.

-   xDS defines the protocol standard for service mesh configuration.

-   The Service mesh is a higher-level abstraction of service in
    Kubernetes, and its next step is serverless.

### 1.2.2 Kubernetes and Service Mesh

Figure 1-1 shows the service access relationship between Kubernetes
natively and Service Mesh (one Sidecar per Pod deployed in the model).

##### 1. Traffic forwarding

Each node in a Kubernetes cluster deploys a kube-proxy component, which
first communicates with the Kubernetes API Server to obtain information
about the services in the cluster, then sets up iptables rules to send
requests for a service directly to the corresponding Endpoint (a Pod
belonging to the same group of service) to the corresponding Endpoint (a
Pod belonging to the same group of services).

Figure 1-1

##### 2. Service Discovery

The Istio Service mesh can not only follow the service in Kubernetes for
service registration, but can also interface to other service discovery
systems via platform adapters in the control plane to generate data
plane configurations (using CRD declarations that are saved in etcd).
Transparent Proxy for the data plane is deployed in the form of Sidecar
containers in each Pod of application services, and these Proxies need
to request the control plane to synchronize the proxy configuration. The
reason for the transparent proxy is that the application container is
completely unaware of the presence of the proxy, and the kube-proxy
component needs to intercept traffic in the process, except that the
kube-proxy component intercepts traffic to and from the Kubernetes node,
while the Sidecar Proxy intercepts traffic to and from the Pod. Figure
1-2 shows the service discovery mechanism in Istio.

Figure 1-2

##### 3. Disadvantages of Service mesh

Since each node in Kubernetes runs numerous Pods, placing the route
forwarding functionality of the original kube-proxy approach in each Pod
leads to significant configuration distribution, synchronization, and
eventual consistency issues. A new set of abstractions must be added for
fine-grained traffic management, leading to further learning costs for
users, but the situation will slowly be mitigated as the technology
becomes more widespread.

##### 4. Advantages of Service mesh

The kube-proxy settings are all globally effective and cannot be
controlled at a granular level for each service, while the Service mesh
takes the control of traffic in Kubernetes out of the service layer by
way of Sidecar Proxy to do more scaling.

### 1.2.3 The kube-proxy component

In a Kubernetes cluster, each Node runs a kube-proxy process. kube-proxy
is responsible for implementing a form of VIP (virtual IP address) for
the service. In Kubernetes v1.0, the proxy is implemented entirely in
the userspace proxy mode. In Kubernetes v1.1, the iptables proxy mode
was added, but is not the default mode of operation. From Kubernetes
v1.2 onwards, the iptables proxy mode is used by default. In Kubernetes
v1.8.0-beta.0, the IPVS proxy mode was added.

Defects of kube-proxy

First of all, if the forwarding Pod is not serving properly, then it
will not automatically try another Pod, but this problem can be solved
by liveness probes. Each Pod has a health check mechanism, and
kube-proxy will remove the corresponding forwarding rules when the Pod
has health problems. Also, nodePort-type services cannot add TLS, or
more complex message routing mechanisms.

kube-proxy implements load balancing of traffic across multiple Pod
instances in a Kubernetes service, but how do you control the traffic
between these services at a granular level, for example, by dividing the
traffic into different application versions (which are all part of the
same service, but on different deployments) by percentage, doing canary
releases (grayscale releases) and blue-green releases? The Kubernetes
community has given a method to do canary releases using Deployment,
which is essentially a way to assign different Pods to a Deployment
service by modifying the Pod\'s label.

### 1.2.4 Kubernetes Ingress and Istio Gateway

The kube-proxy can only route traffic inside the Kubernetes cluster,
while the Pods of the Kubernetes cluster are located in the network
created by CNI and cannot be communicated with directly outside the
cluster, so Ingress, a resource object, is created in Kubernetes and
driven by an Ingress Controller located at a Kubernetes edge node (there
can be many such Ingress must be docked to various Ingress Controllers,
such as Nginx Ingress Controller and Traefik, in order to be used. HTTP
traffic and is simple to use, but it can only match routed traffic to a
limited number of fields such as service, port, HTTP path, etc. This
makes it impossible to route TCP traffic such as MySQL, Redis, and
various private RPCs. To directly route north-south traffic, one can
only use the service\'s LoadBalancer or NodePort, the former requiring
cloud vendor support and the latter requiring additional port
management. Some Ingress Controllers support exposing TCP and UDP
services, but only using services to do so; Ingress itself does not
support this, for example, Nginx Ingress Controller, where the ports
exposed by the service are configured by creating a ConfigMap.

Istio Gateway functions similarly to Kubernetes Ingress in that it is
responsible for managing north-south traffic to and from the
cluster.Istio Gateway can be thought of as a load balancer for the
network, used to carry connections to and from the edge of the mesh.The
Istio Gateway specification describes a set of open ports and the
protocols used by those ports, the The Istio Gateway specification
describes a set of open ports and the protocols used for these ports,
the SNI configuration for load balancing, etc. The Gateway resource in
Istio is a CRD extension that also reuses the Sidecar proxy
functionality, see the official Istio website for detailed
configuration.

### 1.2.5 xDS protocol

Figure 1-3 shows the control plane of Service Mesh, which readers may
have seen when learning about Service Mesh. Each square represents an
instance of a service, for example, a Pod in Kubernetes (which contains
a Sidecar agent). xDS protocol controls the specific behavior of all
traffic in the Istio Service Mesh, i.e., the squares in Figure 1-3 are
linked together.

Figure 1-3

xDS protocol is proposed by Envoy, in Envoy v2 version of the API of the
most original xDS protocol refers to CDS (Cluster Discovery Service),
EDS (Endpoint Discovery Service), LDS (Listener Discovery Service ) and
RDS (Route Discovery Service), later in Envoy v3 version of the xDS
protocol developed Scoped Route Discovery Service (SRDS), Virtual Host
Discovery Service (VHDS), Secret Discovery Service (SDS), Runtime
Discovery Service (RTDS).

The following is an understanding of the xDS protocol through the
communication of the two services, as shown in Figure 1-4.

Figure 1-4

The arrows in Figure 1-4 are not the paths or routes that traffic takes
once it enters the Proxy, nor are they the actual order, but a virtual
kind of xDS interface processing order. In fact, there are
cross-references between the various xDS protocols.

Agents that support the xDS protocol can dynamically discover resources
by querying files or managing servers. Broadly speaking, these discovery
services and their corresponding APIs are called xDS. Envoy obtains
resources by way of subscription (Subscription), and there are three
types of subscription.

-   File subscription: monitors the files under the specified path. The
    easiest way to discover dynamic resources is to save them in a file
    and configure the path in the path parameter in the configSource.

-   gRPC streaming subscription: Each xDS API can be individually
    configured with an ApiConfigSource pointing to the cluster address
    of the corresponding upstream management server.

-   Polling REST-JSON polling subscriptions: A single xDS API can
    perform synchronous (long) polling of REST endpoints.

Istio uses gRPC streaming subscription to configure Sidecar Proxy for
all data planes. the following summarizes the key points about the xDS
protocol.

-   CDS, EDS, LDS, and RDS are the most basic xDS protocols and can all
    be updated independently.

-   All Discovery Services can connect to different management services,
    which means that there can be more than one server managing xDS.

-   Envoy has made a series of expansions to the original xDS protocol,
    adding APIs such as SDS (Key Discovery Service), ADS (Aggregate
    Discovery Service), HDS (Health Discovery Service), MS (Metric
    Service), and RLS (Rate Limiting Service).

-   In order to ensure data consistency, if the original xDS API is used
    directly, it needs to be updated in the order of CDS → EDS → LDS →
    RDS. This follows the Make-Before-Break principle in electrical
    engineering, i.e., a new connection is established before the
    original one is disconnected, and is applied in routing to prevent
    traffic from being dropped due to the inability to discover the
    upstream cluster when a new routing rule is set, similar to a
    circuit break.

-   CDS is used to set which services are available in the service mesh.

-   EDS is used to set which instances (Endpoint) belong to these
    services (Cluster).

-   LDS is used to set the ports listening on the instance to configure
    the routes.

-   The RDS is the final routing relationship between services and
    should be guaranteed to update the RDS last.

### 1.2.6 Envoy

Envoy is the default Sidecar in the Istio service mesh, and Istio has
extended its control plane in accordance with Envoy\'s xDS protocol on
top of Envoy. Before explaining the Envoy xDS protocol, you need to
familiarize yourself with the basic terms of Envoy. The following lists
the basic terms in Envoy and their data structure analysis.

-   Downstream (downstream): downstream hosts connect to Envoy, send
    requests and receive responses, i.e. the hosts that send the
    requests.

-   Upstream: The upstream host receives connections and requests from
    Envoy and returns a response, i.e., the host receiving the request.

-   Listener (listener): listeners are named network addresses (for
    example, ports, UNIX Domain Socket, etc.), and downstream clients
    can connect to these listeners. envoy exposes one or more listeners
    for downstream hosts to connect to.

-   Cluster (Cluster): Cluster is a group of logically identical
    upstream hosts to which Envoy is connected.Envoy discovers the
    members of a cluster through service discovery and can determine the
    health status of cluster members through proactive health
    checks.Envoy decides which member of the cluster to route requests
    to through a load balancing policy.

Envoy can set multiple Listener, and each Listener can set filterchain
(filter chain), and the filter is scalable, so that it is easier to
manipulate the traffic, for example, set encryption, private RPC, etc.

The xDS protocol was proposed by Envoy and is currently the default
Sidecar proxy in Istio. However, as long as the xDS protocol is
implemented, it can theoretically be used as a Sidecar proxy in Istio,
for example, MOSN, which is open source by Ant Group.

### 1.2.7 Istio Service Mesh

Istio is a very feature-rich Service Mesh implementation that includes
the following features.

-   Traffic management: This is the most basic feature of Istio.

-   Policy control: The Mixer component and various adapters enable
    policy control such as access control system, telemetry capture,
    quota management and billing.

-   Observability: Achieved through Mixer.

-   Secure authentication: Key and certificate management through
    Citadel components.

The following CRDs are defined in Istio to help users with traffic
management.

-   Gateway: Describes a load balancer that runs at the edge of the
    network to receive incoming or outgoing HTTP / TCP connections.

-   VirtualService: can actually connect Kubernetes services to the
    Istio Gateway and can perform additional operations, such as
    defining a set of traffic routing rules to be applied when a host is
    addressed.

-   DestinationRule: Determines the access policy for the traffic after
    routing. Simply put, it defines how traffic is routed. Among these
    policies you can define load balancing configurations, connection
    pool sizes and external detection (for identifying and expelling
    unhealthy hosts in the load balancing pool) configurations.

-   EnvoyFilter: Describes filters for proxy services that customize the
    proxy configuration generated by Istio Pilot. Beginner users
    generally rarely use this configuration.

-   ServiceEntry: By default, services in the Istio Service mesh are
    unable to discover services outside of the mesh. serviceEntry
    enables additional entries to be added to the service registry
    within Istio, allowing services in the service mesh to access and
    route to those services that have been manually added.

1.3 What is Istio
-----------------

Istio, an open source Service Mesh implementation, has been in the
limelight since its launch and has become a highly sought-after product by vendors and developers. The official Istio documentation defines it as "a fully open source service mesh built transparently into existing distributed applications. It is also a platform with API interfaces that can integrate with any logging, telemetry, and policy system. Istio's diverse features enable you to run distributed microservice architectures successfully and efficiently, and provide a unified approach to protecting, connecting, and monitoring microservices."

As you can see from the official definition, Istio provides a complete
solution to manage and monitor microservice applications using a unified
approach. At the same time, it has features for managing traffic,
enforcing access policies, collecting data, and more, all of which are
transparent to the application and can be implemented with little to no
modification to business code.

With Istio, users can virtually eliminate the need to use other
microservices frameworks and implement features such as service
governance on their own. Just delegate the network layer to Istio, and
it will do this set of functions for you. Simply put, Istio is a service
mesh that provides service governance functionality.

### 1.3.1 Why use Istio

Service Mesh is a service governance technology whose core function is
to control traffic. From this point of view, Service Mesh and existing
service governance products overlap in terms of functionality. If an
enterprise is using microservice applications that already have very
good service governance capabilities, it is not necessary to introduce
Service Mesh; however, if the enterprise is using systems that do not
have good governance capabilities, or if there are pain points in the
system architecture that can be solved by Service Mesh, then Service
Mesh is the best choice.

Compared to public library-based service governance products, the most
important feature of Service Mesh is its transparency to applications.
Not only can users seamlessly connect their microservice applications to
the mesh, but they do not need to modify the business logic. Istio
currently provides the following four important features.

-   Automatic load balancing for HTTP, gRPC, WebSocket and TCP traffic.

-   Fine-grained control of traffic behavior through rich routing rules,
    retries, failover and failover injection

-   Provides sophisticated observability aspects, including automated
    metrics, logging and tracking of all mesh-controlled traffic.

-   Provides authentication and authorization policies to enable secure
    inter-service communication in a cluster.

### 1.3.2 Istio\'s platform support

Istio is platform independent and is designed to run in a variety of
environments, including cross-cloud, on-premise, Kubernetes, and more.
The platforms currently supported by Istio are.

1. Services deployed in a Kubernetes cluster.
2. Services registered in Consul.
3. Services running in a separate virtual machine.

1.4 Summary of this chapter
---------------------------

This chapter introduces the basic concepts of Service Mesh and gives the reader an initial understanding of Istio. As a typical distributed system, larger microservices are increasingly in need of service governance, network communication, etc. Service Mesh plays such a role, giving microservice applications the ability to control traffic and other aspects in a way that is transparent to business logic.

Containerization and Kubernetes-based container orchestration have become the mainstream application deployment and management method in the industry, which also gives Service Mesh a better underlying support. With the continuous development of Service Mesh technology, Service Mesh will likely become the preferred technology solution for enterprise microservices and cloud transformation.
