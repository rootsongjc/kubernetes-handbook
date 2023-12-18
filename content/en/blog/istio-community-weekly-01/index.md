---
title: "Istio Community Weekly 01"
draft: false
date: 2023-12-18T10:27:49+08:00
description: "I'm excited to present the first issue of Istio Community Weekly. "
categories: ["Istio"]
tags: ["Istio","Istio Weekly"]
type: "post"
image: "images/banner/istio-weekly-01.jpg"
---

## Welcome to the First Issue of Istio Community Weekly

Hello Istio friends!

I'm excited to present the first issue of Istio Community Weekly. As a part of our energetic and creative community, I've been motivated by our collaborative spirit and the advancements in service mesh technology. This weekly series is my way of contributing back, bringing you the latest updates, discussions, and insights about Istio.

Each week, I'll bring you a mix of the newest developments in Istio, insightful community debates, pro tips, and important security news.

We all bring unique perspectives to this community, and through this weekly report, I aim to reflect our diverse viewpoints. Let's journey together through the evolving landscape of Istio, embracing its challenges and achievements and sharing our passion for open-source innovation.

I look forward to starting this journey with you and welcome your feedback and contributions. Let's grow and learn together as part of the wider Istio family.

Happy reading, and catch you in the next edition!

## Community Updates

### Transition to GitHub Discussions for Istio Community Q&A

The Istio team has announced a significant change in how community interactions and Q&A will be handled. The current forum at [discuss.istio.io](https://discuss.istio.io/) is set to be archived by December 20th, and the team is transitioning to [GitHub Discussions](https://github.com/istio/istio/discussions) for future engagements. This new platform is envisioned as a hub for users to ask questions and engage with the community. Notably, contributions in GitHub discussions will be recognized as official Istio contributions, influencing the allocation of steering contributor seats. This is a call to action for maintainers, vendors, and end users to participate actively in these discussions.

### Istio Office Hours Proposal

The Istio community is introducing a new initiative: "Istio Office Hours." This proposal aims to establish a periodic community meeting to share technical knowledge and facilitate community growth. The Office Hours are intended to help new contributors and provide a forum for current members to share insights.

Please refer to the [proposal document](https://docs.google.com/document/d/13voR8qZwG8lKI2_xtvYhN6msBHp0MAdvlDXMUqQGFEM/edit) for more detailed information and to participate in shaping this initiative.

### Kubernetes v1.29 Release: Shift from iptables to nftables and Its Impact on Istio

The recent release of [Kubernetes v1.29](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.29.md) introduces a significant shift in its networking approach. Kubernetes is now adopting nftables as an Alpha feature for the kube-proxy backend, replacing iptables. This change is due to the longstanding performance issues with iptables, which worsen with increasing rule set sizes. The development of iptables in the kernel has slowed considerably, with most activity ceasing and new features being halted.

### Why nftables?

- nftables addresses the limitations of iptables and offers better performance.
- Major distributions like RedHat and Debian are moving away from iptables. RedHat has deprecated iptables in RHEL 9 and Debian removed it from the required packages in Debian 11 (Bullseye).

### Impact on Istio

Istio, which currently relies on iptables for traffic hijacking, might need to adapt to this change by considering the use of nftables. This shift aligns with the broader move in the Linux ecosystem towards nftables.

### Administrators' Role

- To enable this feature, administrators must use the NFTablesProxyMode feature gate and run kube-proxy with the `-proxy-mode=nftables` flag.
- There might be compatibility issues as CNI plugins, NetworkPolicy implementations, and other components that currently rely on iptables will need updates to work with nftables.

This change in Kubernetes v1.29 is a forward-looking step but requires careful consideration and planning for integration with systems like Istio. It’s essential for the Istio community to stay abreast of these developments and prepare for potential adjustments in future Istio versions to maintain compatibility with Kubernetes.

## Project Updates

### ISTIO-SECURITY-2023-005: Changes to Istio CNI RBAC Permissions

### Security Vulnerability Addressed

The Istio Security Committee has identified and addressed a significant security vulnerability concerning the Istio CNI (Container Network Interface). This issue, detailed in [ISTIO-SECURITY-2023-005](https://istio.io/latest/news/security/istio-security-2023-005/), revolves around the potential misuse of the `istio-cni-repair-role` `ClusterRole`.

### The Security Risk

If a node is compromised, the existing high-level permissions of the Istio CNI could be exploited. This exploitation could escalate a local compromise to a cluster-wide security breach.

### Steps Taken

In response to this discovery, modifications have been made to the Istio CNI's RBAC (Role-Based Access Control) permissions to mitigate this risk.

For more detailed information, please visit the official security advisory at [Istio Security 2023-005](https://istio.io/latest/news/security/istio-security-2023-005/).

### New Minor Releases

Istio has released new minor patch versions to enhance security and functionality:

- Istio 1.18.6
- Istio 1.19.5
- Istio 1.20.1

These updates include various improvements and fixes, reflecting the ongoing commitment to maintaining and enhancing the Istio service mesh's security and performance.

For more details on these releases, visit [Istio's latest news](https://istio.io/latest/news/).

## Hot Topics and Discussions

### Debate on Ambient Mode Transition to Beta in Istio 1.21

A heated discussion unfolded in the recent combined working group meeting regarding the progression of Ambient mode to Beta in the upcoming Istio 1.21 release (Q124).

#### Diverging Views

- Team Solo's Stance: Advocated for delaying the 1.21 release to ensure that Ambient mode reaches Beta status within this version.
- Team Everyone Else's Argument: Opposed the delay, emphasizing that Ambient mode is not yet ready for Beta release.

#### Current Outlook

The consensus leans towards maintaining the 1.21 release schedule without including Ambient mode in Beta. The predominant view is that the Ambient mode requires further development and is unlikely to achieve Beta status in the 1.21 release.

This discussion reflects the ongoing commitment to quality and readiness in Istio's development process. The decision not to rush Ambient mode into Beta underscores the community's dedication to ensuring stability and reliability in each release.

## Istio Pro Tips

### Determining the Upstream IP Address of an Ingress Gateway

Identifying the upstream source workload is crucial when dealing with an NLB (Network Load Balancer) before the ingress gateway, particularly for TLS offloading. In cases where the `source_workload` in `istio_requests_total` is an ingress gateway, the real source workload needs to be discerned. A practical approach is to utilize HTTP headers for this purpose. XFF (X-Forwarded-For) is a standard method outlined in [Istio's documentation](https://istio.io/latest/docs/ops/configuration/traffic-management/network-topologies/), but custom solutions can also be implemented by adding a header through a virtual service.

### Envoy Version in Istio Releases

The Istio team maintains their Envoy builds, making independent decisions about patch versions. This approach ensures faster access to necessary updates rather than waiting for official Envoy releases. Further details can be found in this [GitHub discussion](https://github.com/istio/istio/discussions/48064#discussioncomment-7794044).

------

Your feedback and participation are vital to the Istio community. If you have insights, questions, or comments, please join the discussions on GitHub and help us shape the future of Istio! Looking ahead to next week, we anticipate more exciting updates and community interactions. Stay tuned!
