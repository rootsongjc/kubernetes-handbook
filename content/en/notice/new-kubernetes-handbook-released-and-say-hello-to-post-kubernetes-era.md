---
title: "Kubernetes Handbook v1.4 is released"
date: 2018-09-04T10:23:23+08:00
draft: false
description: "This is an obituary post-Kubernetes era. Kubernetes handbook by Jimmy Song v1.4 is released. The next focus of cloud native is Service Mesh!"
aliase: "/posts/new-kubernetes-handbook-released-and-say-hello-to-post-kubernetes-era"
type: "notice"
link: "https://jimmysong.io/kubernetes-handbook"
---

This is a **postscript** from the post- **Kubernetes** era. Just this evening I saw a post by Bilgin Ibryam *[Microservices in a Post-Kuberentes Era](https://www.infoq.com/articles/microservices-post-kubernetes)* .

On April 9, 2017, the [Kubernetes Handbook-Kubernetes Chinese Guide / Cloud Native Application Architecture Practice Manual](https://github.com/rootsongjc/kubernetes-handbook) was first submitted. In the past 16 months, 53 contributors participated, 1,088 commits, and a total of 23,9014 Chinese characters were written. At the same time , thousands of enthusiasts have gathered in the **Kubernetes & Cloud Native combat group** .

It has been more than 4 months since the previous version was released. During this period, [Kubernetes](https://kubernetes.io/) and [Prometheus](https://prometheus.io/) graduated from CNCF respectively and have matured commercially. These two projects have basically taken shape and will not change much in the future. Kubernetes was originally developed for container orchestration. In order to solve the problem of microservice deployment, Kubernetes has gained popularity. The current **microservices** have gradually entered the **post-Kubernetes era** . Service Mesh and cloud native redefine **microservices** and distributed applications.

When this version was released, the PDF size was 108M with a total of 239,014 Chinese characters. It is recommended to [browse online](https://jimmysong.io/kubernetes-handbook/) , or clone the project and install the Gitbook command to compile it yourself.

This version has the following improvements:

- Added [Istio Service Mesh tutorial](https://jimmysong.io/kubernetes-handbook/usecases/istio-tutorial.html)
- Increased [use VirtualBox and Vagrant set up in a local cluster and distributed Kubernetes Istio Service Mesh](https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster/blob/master/README-cn.md)
- Added cloud native programming language [Ballerina](https://jimmysong.io/kubernetes-handbook/cloud-native/cloud-native-programming-language-ballerina.html) and [Pulumi](https://jimmysong.io/kubernetes-handbook/cloud-native/cloud-native-programming-language-pulumi.html) introduced
- Added [Quick Start Guide](https://jimmysong.io/kubernetes-handbook/cloud-native/cloud-native-local-quick-start.html)
- Added support for Kubernetes 1.11
- Added [enterprise-level service mesh adoption path guide](https://jimmysong.io/kubernetes-handbook/usecases/the-enterprise-path-to-service-mesh-architectures.html)
- Added [SOFAMesh chapter](https://jimmysong.io/kubernetes-handbook/usecases/sofamesh.html)
- Added vision for the [cloud-native future](https://jimmysong.io/kubernetes-handbook/cloud-native/the-future-of-cloud-native.html)
- Added [CNCF charter](https://jimmysong.io/kubernetes-handbook/cloud-native/cncf-charter.html) and participation
- Added notes for Docker image repositories
- Added [Envoy chapter](https://jimmysong.io/kubernetes-handbook/usecases/envoy.html)
- Increased [KCSP (Kubernetes certification service providers)](https://jimmysong.io/kubernetes-handbook/appendix/about-kcsp.html) and [CKA (Certified Kubernetes administrator)](https://jimmysong.io/kubernetes-handbook/appendix/about-cka-candidate.html) instructions
- Updated some configuration files, YAML and reference links
- Updated [CRI chapter](https://jimmysong.io/kubernetes-handbook/concepts/cri.html)
- Removed obsolete description
- Improved etcdctl command usage tutorial
- Fixed some typos

### Browse and download

- Browse online https://jimmysong.io/kubernetes-handbook
- To make it easy for everyone to download, I put a copy on [Weiyun](https://share.weiyun.com/5YbhTIG) , which is available in PDF (108MB), MOBI (42MB), and EPUB (53MB).

In this book, there are more practical tutorials. In order to better understand the principles of Kubernetes, I recommend studying ** In- [depth analysis of Kubernetes by Zhang Lei, produced by Geek Time](https://jimmysong.io/posts/kubernetes-tutorial-recommendation/) **.

Thank you Kubernetes for your support of this book. Thank you [Contributors](https://github.com/rootsongjc/kubernetes-handbook/graphs/contributors) . In the months before this version was released, the [ServiceMesher community](http://www.servicemesher.com/) was co-founded . As a force in the **post-Kubernetes era** , welcome to [contact me](http://www.servicemesher.com/contact) to join the community and create **cloud native New era** .

At present , the WeChat group of the **ServiceMesher community** also has thousands of members. The Kubernete Handbook will continue, but Service Mesh is already a rising star. With Kubernetes in mind, welcome to join the ServiceMesher community and follow us. The public account of the community (also the one I manage).