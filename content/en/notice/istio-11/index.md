---
title: "Istio 1.1 released"
draft: false
date: 2019-03-21T23:27:49+08:00
description: "Istio 1.1 was released at 4 am on March 20th, Beijing time. This version took 8 months! The ServiceMesher community also launched the Istio Chinese documentation."
type: "notice"
link: "https://istio.io"
aliases: "/posts/istio-11"
---

The following paragraph is a release note from the Istio official blog https://istio.io/zh/blog/2019/announcing-1.1/ , which I translated.

Istio was released at 4 a.m. Beijing time today and 1 p.m. Pacific time.

Since the 1.0 release last July, we have done a lot to help people get Istio into production. We expected to release a lot of patches (six patches have been released so far!), But we are also working hard to add new features to the product.

The theme for version 1.1 is "Enterprise Ready". We are happy to see more and more companies using Istio in production, but as some big companies join in, Istio also encounters some bottlenecks.

The main areas we focus on include performance and scalability. As people gradually put Istio into production and use larger clusters to run more services with higher capacity, there may be some scaling and performance issues. Sidecar takes up too much resources and adds too much latency. The control plane (especially Pilot) consumes excessive resources.

We put a lot of effort into making the data plane and control plane more efficient. In the 1.1 performance test, we observed that sidecars typically require 0.5 vCPU to process 1000 rps. A single Pilot instance can handle 1000 services (and 2000 pods) and consumes 1.5 vCPUs and 2GB of memory. Sidecar adds 5 milliseconds at the 50th percentile and 10 milliseconds at the 99th percentile (the execution strategy will increase latency).

We have also completed the work of namespace isolation. You can use the Kubernetes namespace to enforce control boundaries to ensure that teams do not interfere with each other.

We have also improved multi-cluster functionality and usability. We listened to the community and improved the default settings for flow control and policies. We introduced a new component called Galley. Galley validates YAML configuration, reducing the possibility of configuration errors. Galley is also used in multi-cluster setups-collecting service discovery information from each Kubernetes cluster. We also support other multi-cluster topologies, including single control planes and multiple synchronous control planes, without the need for flat network support.

See the [release notes for](https://istio.io/about/notes/1.1/) more information and details .

There is more progress on this project. As we all know, Istio has many moving parts, and they take on too much work. To address this, we have recently established the [Usability Working Group (available](https://github.com/istio/community/blob/master/WORKING-GROUPS.md#working-group-meetings) at any time). A lot happened in the [community meeting](https://github.com/istio/community#community-meeting) (Thursday at 11 am) and in the working group. You can log in to [discuss.istio.io](https://discuss.istio.io/) with GitHub credentials to participate in the discussion!

Thanks to everyone who has contributed to Istio over the past few months-patching 1.0, adding features to 1.1, and extensive testing recently on 1.1. Special thanks to companies and users who work with us to install and upgrade to earlier versions to help us identify issues before they are released.

Finally, go to the latest documentation and install version 1.1! Happy meshing!

### Official website

The ServiceMesher community has been maintaining the [Chinese page of the](https://istio.io/zh) official Istio documentation since the 0.6 release of Istio . As of March 19, 2019, there have been 596 PR merges, and more than 310 documents have been maintained. Thank you for your efforts! Some documents may lag slightly behind the English version. The synchronization work is ongoing. For participation, please visit [https://github.com/servicemesher/istio-official-translation.](https://github.com/servicemesher/istio-official-translation) Istio official website has a language switch button on the right side of each page. You can always Switch between Chinese and English versions, you can also submit document modifications, report website bugs, etc.

**ServiceMesher Community Website**

The ServiceMesher community website [http://www.servicemesher.com](http://www.servicemesher.com/) covers all technical articles in the Service Mesh field and releases the latest activities in a timely manner. It is your one-stop portal to learn about Service Mesh and participate in the community.