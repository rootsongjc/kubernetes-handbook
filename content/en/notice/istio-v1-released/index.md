---
title: "Istio 1.0 is released"
description: "Chinese documentation is released at the same time!"
date: 2018-08-01T14:42:36+08:00
draft: false
type: "notice"
link: "https://istio.io"
aliases: "/posts/istio-v1-released"
---

Today, we are pleased to announce [Istio 1.0](https://istio.io/zh/about/notes/1.0) . It's been over a year since the original 0.1 release. Since 0.1, Istio has grown rapidly with the help of a thriving community, contributors, and users. Many companies have successfully applied Istio to production today and have gained real value through the insight and control provided by Istio. We help large businesses and fast-growing startups such as [eBay](https://www.ebay.com/) , [Auto Trader UK](https://www.autotrader.co.uk/) , [Descartes Labs](http://www.descarteslabs.com/) , [HP FitStation](https://www.fitstation.com/) , [Namely](https://www.namely.com/) , [PubNub](https://www.pubnub.com/) and [Trulia](https://www.trulia.com/) to connect, manage and protect their services from scratch with Istio. The release of this version as 1.0 recognizes that we have built a core set of features that users can rely on for their production.

## Ecosystem

Last year we saw a significant increase in the Istio ecosystem. [Envoy](https://www.envoyproxy.io/) continues its impressive growth and adds many features that are critical to a production-level service grid. [Observability providers](https://www.datadoghq.com/) like [Datadog](https://www.datadoghq.com/) , [SolarWinds](https://www.solarwinds.com/) , [Sysdig](https://sysdig.com/blog/monitor-istio/) , [Google Stackdriver,](https://cloud.google.com/stackdriver/) and [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/) have also written plugins to integrate Istio with their products. [Tigera](https://www.tigera.io/resources/using-network-policy-concert-istio-2/) , [Aporeto](https://www.aporeto.com/) , [Cilium](https://cilium.io/) and [Styra](https://styra.com/) have built extensions for our strategy implementation and network capabilities. Kiali built by [Red Hat](https://www.redhat.com/en) provides a good user experience for grid management and observability. [Cloud Foundry](https://www.cloudfoundry.org/) is building the next-generation traffic routing stack for Istio, the recently announced [Knative serverless](https://github.com/knative/docs) project is doing the same, and [Apigee has](https://apigee.com/) announced plans to use it in their API management solution. These are just a few of the projects that the community added last year.

## Features

Since the 0.8 release, we have added some important new features, and more importantly, marked many existing features as Beta to indicate that they can be used in production. This is covered in more detail in the [release notes](https://istio.io/zh/about/notes/1.0/) , but it is worth mentioning:

- Multiple Kubernetes clusters can now be [added to a single grid](https://istio.io/zh/docs/setup/kubernetes/multicluster-install) , enabling cross-cluster communication and consistent policy enforcement. Multi-cluster support is now Beta.
- The network API for fine-grained control of traffic through the grid is now Beta. Explicitly modeling ingress and egress issues with gateways allows operations personnel to [control the network topology](https://istio.io/zh/blog/2018/v1alpha3-routing/) and meet access security requirements at the edge.
- Two-way TLS can now be [launched incrementally](https://istio.io/zh/docs/tasks/security/mtls-migration) without updating all clients of the service. This is a key feature that removes the barriers to deploying Istio on existing production.
- Mixer now supports [developing out-of-process adapters](https://github.com/istio/istio/wiki/Out-Of-Process-gRPC-Adapter-Dev-Guide) . This will be the default way to extend Mixer in an upcoming release, which will make it easier to build adapters.
- Envoy now fully evaluates the [authorization policies](https://istio.io/zh/docs/concepts/security/#认证) that control service access locally , improving their performance and reliability.
- [Helm chart installation](https://istio.io/zh/docs/setup/kubernetes/helm-install/) is now the recommended installation method, with a wealth of customization options to configure Istio to your needs.
- We put a lot of effort into performance, including continuous regression testing, large-scale environmental simulation, and target repair. We are very happy with the results and will share details in the coming weeks.

## Next step

Although this is an important milestone for the project, much work remains to be done. When working with adopters, we've received a lot of important feedback about what to focus next. We've heard consistent topics about supporting hybrid clouds, installing modularity, richer network capabilities, and scalability for large-scale deployments. We have considered some feedback in the 1.0 release and we will continue to actively work on it in the coming months.

## Quick start

If you are new to Istio and want to use it for deployment, we would love to hear from you. Check out our [documentation](https://istio.io/zh/docs/) , visit our [chat forum](https://istio.rocket.chat/) or visit the [mailing list](https://groups.google.com/forum/#!forum/istio-dev) . If you want to contribute more to the project, please join our [community meeting](https://istio.io/zh/about/community) and say hello.

## At last

The Istio team is grateful to everyone who contributed to the project. Without your help, it won't have what it is today. Last year's achievements were amazing, and we look forward to achieving even greater achievements with our community members in the future.

------

[The ServiceMesher community](http://www.servicemesher.com/) is responsible for the translation and maintenance of Chinese content on Istio's official website. At present, the Chinese content is not yet synchronized with the English content. You need to manually enter the URL to switch to Chinese ( https://istio.io/zh ). There is still a lot of work to do , Welcome everyone to join and participate.