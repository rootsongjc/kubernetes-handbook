---
title: "Istio 1.18 Released, Now with Ambient Mode Available"
draft: false
date: 2023-06-26T17:24:49+08:00
description: "This article introduces Istio 1.18, the latest release of the service mesh platform. It highlights the new features and improvements, such as ambient mode, which allows Istio to run on any Kubernetes cluster without requiring a dedicated control plane. It also explains how to get started with Istio 1.18 using Tetrate’s distribution and support."
categories: ["Istio"]
tags: ["Istio","Ambient Mesh"]
type: "post"
image: "images/banner/istio-1-18.jpg"
---

In June, [Istio 1.18 was released](https://istio.io/latest/news/releases/1.18.x/announcing-1.18/), marking the second release of Istio in 2023 and the first to offer official support for [ambient mode](https://tetrate.io/blog/istio-ambient-mesh-merged-to-main/). Tetrate’s Paul Merrison was one of the release managers for this version, and Tetrate’s contributions to this release included various customer-driven usability enhancements and important work in the underlying Envoy Proxy upon which Istio depends. When asked about the experience of working on Istio 1.18, Paul said “working as the lead release manager for Istio 1.18 gave me a fascinating insight into how a group of super talented people from around the world come together, organize themselves and ship software. There was a steep learning curve, but the Istio community is awesome and I was supported brilliantly. The biggest challenge was definitely learning and executing all the steps that are needed to bring a release to life, but the feeling of achievement when it finally made its way out into the world will stay with me for a while!” Istio first announced the introduction of Ambient mode in September last year, which was covered in detail by Zack in[ this blog post](https://tetrate.io/blog/ambient-mesh-what-you-need-to-know-about-this-experimental-new-deployment-model-for-istio/), where he explains the differences between ambient mode and sidecar mode.

This release introduces many [new features and changes](https://istio.io/latest/news/releases/1.18.x/announcing-1.18/change-notes/) in addition to ambient mode, including enhanced Kubernetes Gateway API support, health checks for virtual machines that are not automatically registered, support for expired metrics, enhanced `istioctl analyze`, and more. See the [release blog](https://istio.io/latest/news/releases/1.18.x/announcing-1.18/) for details. The most significant of these are the ambient mode and Gateway API enhancements, detailed below.

> “Working as the lead release manager for Istio 1.18 gave me a fascinating insight into how a group of super talented people from around the world come together, organize themselves and ship software. There was a steep learning curve, but the Istio community is awesome and I was supported brilliantly. The biggest challenge was definitely learning and executing all the steps that are needed to bring a release to life, but the feeling of achievement when it finally made its way out into the world will stay with me for a while!”
>
> Paul Merrison, Tetrate Engineering and Istio Release Manager

## What Is Ambient Mode?

Before discussing ambient mode, it is essential to understand the current “sidecar mode” used by Istio. Sidecar mode is the default data plane mode used by Istio, where each application pod comes equipped with a sidecar proxy (usually Envoy) that handles all network traffic in and out of the pod, providing Istio’s core functionality such as Zero Trust security, telemetry and traffic management. While sidecar mode is suitable for most users, ambient mode offers some advantages in specific circumstances. For more information on the differences between ambient mode and the standard sidecar mode, see[ our article on Ambient Mesh: What You Need to Know about This Experimental New Deployment Model for Istio](https://tetrate.io/blog/ambient-mesh-what-you-need-to-know-about-this-experimental-new-deployment-model-for-istio/).

## What Are the Design Goals of Ambient Mode?

- **Non-intrusive**: Ambient mode does not require injecting sidecar proxies into the application’s pods and only requires the application to be tagged to automatically join the mesh, potentially reducing the mesh’s impact on the application.
- **Efficient resource utilization**: Ambient mode can optimize resource utilization for some use cases by sharing the ztunnel proxy across the mesh. If certain L7 functionality of Istio is required, it can also be addressed by deploying Waypoints precisely for a ServiceAccount or Namespace, providing more control over resource consumption.
- **Performance parity with sidecar mode**: Ambient mode initially adopted a shared proxy model based on Envoy, but during development, issues such as complex Envoy configuration were discovered, leading the Istio community to develop its shared proxy ([ztunnel](https://tetrate.io/blog/using-geneve-tunnels-to-implement-istio-ambient-mesh-traffic-interception/)) based on Rust. In the future, ambient mode is expected to have comparable performance to traditional sidecar mode.
- **Security**: Ambient mode provides TLS support by running a shared proxy ztunnel on each node, and when users require the same security as sidecar mode, they also need to deploy one or more Waypoints in each namespace to handle L7 traffic in that namespace.

Users can use `istioctl x waypoint` for Waypoint configuration management. For example, running the `istioctl x waypoint generate` command generates a Kubernetes Gateway API resource managed by Istio.

Overall, ambient mode promises to offer additional flexibility to Istio’s deployment model which may prove helpful to some users. It should be noted that the ambient mode is still in the **alpha stage** and has yet to achieve production-level stability.

## Enhanced Kubernetes Gateway API Support

Istio 1.18 introduces several vital improvements and modifications to its Kubernetes Gateway API support:

- **Support for v1beta1**: When upgrading to the new version of Istio, Gateway API version greater than 0.6.0+ is required. Use the `istioctl x precheck `command to check for upgrade issues.
- **Gateway API automated deployment management upgrades**: All Kubernetes Gateway resources Istio manages will automatically configure Service and Deployment resources when created or updated. If the Gateway resource changes, the associated configuration will also be updated synchronously. In addition, the deployment of Gateway resources no longer depends on injection logic but has an independent creation process.
- **Removal of support for the `proxy.istio.io/config` annotation**: The ProxyConfig resource only affects the Istio-managed Gateway.
- **Fixes to Istiod handling of configuration changes**: If Service and Deployment configurations change, Istiod reprocesses them.

- **It no longer supports the Alpha version of the Gateway API by default**: It can be re-enabled by setting `PILOT_ENABLE_ALPHA_GATEWAY_API=true`.

It is worth noting that when installing ambient mode, unlike previous Istio installations, IngressGateway is no longer included by default. In future development, Istio is leaning towards using the Gateway API to manage gateways. For more information on why the Gateway API is recommended over Ingress, please read[ my previous blog article on why the Gateway API Is the unified future of ingress for Kubernetes and service mesh](https://tetrate.io/blog/why-the-gateway-api-is-the-unified-future-of-ingress-for-kubernetes-and-service-mesh/).

## Next Steps to Ambient Mesh

We’re excited that ambient mode is now available to users in an official Istio release, especially as it promises to make mesh adoption easier for all users. The [easiest way to get started with Istio’s new ambient mode is Tetrate Istio Distro](https://istio.tetratelabs.io/), Tetrate’s hardened, fully upstream Istio distribution, with [FIPS-verified builds](https://tetrate.io/blog/how-tetrate-istio-distro-became-the-first-fips-compliant-istio-distribution/) and [support available](https://tetrate.io/tetrate-istio-subscription/). It’s a great way to get started with Istio knowing you have a trusted distribution, to begin with, an expert team supporting you, and also the option to get to FIPS compliance quickly if you need to.

As you add more apps to the mesh, you’ll need a unified way to manage those deployments and coordinate the mandates of the different teams involved. That’s where Tetrate Service Bridge comes in. Learn more about how Tetrate Service Bridge makes service mesh more secure, manageable, and resilient [here](https://tetrate.io/tetrate-service-bridge/), or [contact us for a quick demo](https://tetrate.io/demo-request/).

---

*This blog was originally published at [tetrate.io](https://tetrate.io/istio-1-18-released-now-with-ambient-mode-available/).*
