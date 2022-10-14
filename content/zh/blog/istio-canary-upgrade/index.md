---
title: "如何不停机升级 Istio？"
description: "本文详述了使用金丝雀升级 Istio 的步骤及升级后的注意事项。"
date: 2022-10-14T11:18:40+08:00
draft: false
tags: ["istio"]
categories: ["Istio"]
type: "post"
image: "images/banner/upgrade.jpg"
---

## 开始之前

截止到撰写本文时 Istio 的最高版本为 1.15.2，1.13 版本的官方支持已经结束。请对照 [Istio 文档中的发布状态描述](https://istio.io/latest/docs/releases/supported-releases/#support-status-of-istio-releases)确定是否需要对 Istio 进行升级。

Istio 官网上给出了升级 Istio 的[几种方式](https://istio.io/latest/docs/setup/upgrade/)：

- 金丝雀升级
- 原地升级
- 使用 Helm 升级

但实际上，为了减少在升级时对网格内业务的影响，建议在升级 Istio 的时候，使用 [canary upgrade](https://istio.io/latest/docs/setup/upgrade/canary/)，它比 [in-place upgrade](https://istio.io/latest/docs/setup/upgrade/in-place/) 更加安全，而且支持回滚。使用 canary upgrade 支持跨越两个小版本，而 in-place upgrade 必须一个一个小版本的升级。不论使用哪种方式，其中 Ingress Gateway 都是 in-place upgrade 的。

[Istio 官方文档](https://istio.io/latest/docs/setup/upgrade/canary/)对升级的步骤描述的不是很详细，本文是对官方文档的一个补充，在升级完成后有两个注意事项：

- 为需要自动 sidecar 注入的 namespace 打上对应的 label；
- 删除原有的 `validatingwebhookconfiguration` 并添加新的；

下面是详细的升级步骤。

## 升级步骤

使用的是以下命令安装的 canary 版本：

```bash
# 将新版本的 revision 命名为 canary
istioctl install --set revision=canary

# 取消原先自动注入 sidecar 的 namespace 中的 label 并设置新的 label，这样该 namespace 就可以注入 canary 版本对应的 sidecar
kubectl label namespace test-ns istio-injection- istio.io/rev=canary

# 重启数据平面中的工作负载，将完成新版本的 sidecar 自动注入
kubectl rollout restart deployment -n test-ns
```

注意在升级完成后，为新的 namespace 开启 sidecar 自动注入时，需要给 namespace 打上安装 canary Istio 时候设置的 label，执行下面的命令：

```bash
kubectl label namespace new-ns istio-injection- istio.io/rev=canary
```

## Istio 升级完成后的注意事项

在升级完成后，还有一些注意事项。例如如果你已经为其他 namespace 打上了 sidecar 自动注入的 label，请一定要将它删掉，并将 label 设置为 `istio.io/rev=canary`，因为可以保证在 pod 中注入新版被 sidecar，并且连接到新版的 Istiod。

另外，你需要把最早安装 Istio 时设置的 `ValidatingWebhookConfiguration` 删掉，执行下面的命令：

```bash
kubectl delete validatingwebhookconfiguration istiod-default-validator
```

{{<callout note "关于 ValidatingWebhookConfiguration">}}

在你安装新版本的 Istio 的时候，会自动创建一个名为 `istio-validator-canary-istio-system` 的 ValidatingWebhookConfiguration，该配置的目的是在创建和更新 Istio CR 的时候，先检测所有连接的 Istiod 是否有效。关于动态准入控制的详细描述请见 [Kubernetes 文档](https://kubernetes.io/zh-cn/docs/reference/access-authn-authz/extensible-admission-controllers/)。

{{</callout>}}

因为在安装新版本 Istio 的时候，安装了新的 `istio-validator-canary-istio-system`。如果你不将旧的删除话，你在创建 Istio CR 的时候将会看到如下错误。

```
Error from server (InternalError): error when creating "samples/bookinfo/networking/bookinfo-gateway.yaml": Internal error occurred: failed calling webhook "validation.istio.io": failed to call webhook: Post "https://istiod.istio-system.svc:443/validate?timeout=10s": service "istiod" not found
```

以上内容在 Istio 的官方文档中里并没有说明，但是在 [Istio Issue-36526](https://github.com/istio/istio/issues/36526) 中有提及。

## 参考

- [动态准入控制 - kubernetes.io](https://kubernetes.io/zh-cn/docs/reference/access-authn-authz/extensible-admission-controllers/)
- [Istio Supported Releases - istio.io](https://istio.io/latest/docs/releases/supported-releases/)
- [Canary Upgrades - istio.io](https://istio.io/latest/docs/setup/upgrade/canary/)
