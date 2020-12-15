---
title: "Istio 1.8: A Smart DNS Proxy Takes Support for Virtual Machines a Step Further"
date: 2020-11-19T16:43:27+08:00
draft: false
categories: ["Istio"]
bg_image: "images/backgrounds/page-title.jpg"
description: "WorkloadGroup is a new API object. It is intended to be used with non-Kubernetes workloads like Virtual Machines and is meant to mimic the existing sidecar injection and deployment specification model used for Kubernetes workloads to bootstrap Istio proxies."
type: "post"
image: "images/banner/istio18.jpg"
---

1.8 is the last version of Istio to be released in 2020 and it has the following major updates:

- Supports installation and upgrades using Helm 3.
- Mixer was officially removed.
- Added Istio DNS proxy to transparently intercept DNS queries from applications.
- WorkloadGroup has been added to simplify the integration of virtual machines.

WorkloadGroup is a new API object. It is intended to be used with non-Kubernetes workloads like Virtual Machines and is meant to mimic the existing sidecar injection and deployment specification model used for Kubernetes workloads to bootstrap Istio proxies.

## Installation and Upgrades

Istio starts to officially support the use of [Helm](https://istio.io/latest/docs/setup/install/helm/) v3 for installations and upgrades. In previous versions, the installation was done with the istioctl command-line tool or Operator. With version 1.8, Istio supports in-place and canary upgrades with Helm.

## Enhancing Istio’s Usability

The istioctl command-line tool has a new bug reporting feature ([istioctl bug-report](https://istio.io/latest/docs/reference/commands/istioctl/#istioctl-bug-report)), which can be used to collect debugging information and get cluster status.

The way to install the [add-on](https://istio.io/latest/blog/2020/addon-rework/) has changed: 1.7 istioctl is no longer recommended and has been removed in 1.8, to help solve the problem of add-on lagging upstream and to make it easier to maintain.

Tetrate is an enterprise service mesh company. Our flagship product, TSB, enables customers to bridge their workloads across bare metal, VMs, K8s, & cloud at the application layer and provide a resilient, feature-rich service mesh fabric powered by Istio, Envoy, and Apache SkyWalking.

Mixer, the Istio component that had been responsible for policy controls and telemetry collection, has been removed. Its functionalities are now being served by the Envoy proxies. For extensibility, service mesh experts recommend using [WebAssembly](https://istio.io/latest/blog/2020/wasm-announce/) (Wasm) to extend Envoy; and you can also try the [GetEnvoy Toolkit](https://www.getenvoy.io/reference/getenvoy_extension_toolkit_reference/), which makes it easier for developers to create Wasm extensions for Envoy. If you still want to use Mixer, you must use version 1.7 or older. Mixer continued receiving bug fixes and security fixes until Istio 1.7. Many features supported by Mixer have alternatives as specified in the [Mixer Deprecation](https://tinyurl.com/mixer-deprecation) document, including the [in-proxy extensions](https://github.com/istio/proxy/tree/master/extensions) based on the Wasm sandbox API.

## Support for Virtual Machines

Istio’s recent upgrades have steadily focused on making virtual machines first-class citizens in the mesh. [Istio 1.7 made progress to support virtual machines](https://thenewstack.io/how-to-integrate-virtual-machines-into-istio-service-mesh/) and Istio 1.8 adds a [smart DNS proxy](https://istio.io/latest/blog/2020/dns-proxy/), which is an Istio sidecar agent written in Go. The Istio agent on the sidecar will come with a cache that is dynamically programmed by Istiod DNS Proxy. DNS queries from applications are transparently intercepted and served by an Istio proxy in a pod or VM that intelligently responds to DNS query requests, enabling seamless multicluster access from virtual machines to the service mesh.

Istio 1.8 adds a [WorkloadGroup](https://istio.io/latest/docs/reference/config/networking/workload-group/), which describes a collection of workload instances. It provides a specification that the workload instances can use to bootstrap their proxies, including the metadata and identity. It is only intended to be used with non-k8s workloads like Virtual Machines, and is meant to mimic the existing sidecar injection and deployment specification model used for Kubernetes workloads to bootstrap Istio proxies. Using WorkloadGroups, Istio has started to help automate VM registration with [istioctl experimental workload group](https://istio.io/latest/docs/setup/install/virtual-machine/#create-files-to-transfer-to-the-virtual-machine).

[Tetrate](https://www.tetrate.io/), the enterprise service mesh company, uses these [VM features](https://www.tetrate.io/blog/whats-new-in-istio-1-8-dns-proxy-helps-expand-mesh-to-vms-and-multicluster/) extensively in customers’ multicluster deployments, to enable sidecars to resolve DNS for hosts exposed at ingress gateways of all the clusters in a mesh; and to access them over mutual TLS.

## Conclusion

All in all, the Istio team has kept the promise made at the beginning of the year to maintain a regular release cadence of one release every three months since the 1.1 release in 2018, with continuous optimizations in performance and user experience for a seamless experience of brownfield and greenfield apps on Istio. We look forward to more progress from Istio in 2021.