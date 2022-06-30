---
title: "如何在 Istio 中集成 SPRIRE？"
draft: false
date: 2022-06-30T18:27:49+08:00
description: "本文将带你一步一步在 Istio 中集成 SPIRE 身份认证。"
categories: ["Istio"]
tags: ["Istio","How-to","SPIRE"]
type: "post"
image: "images/banner/auth.jpg"
---

{{<callout note>}}

注意：SPIRE 支持是 Istio 1.14 的新特性，请确保安装 1.14 及以上版本的 Istio。

{{</callout>}}

## 安装 Istio

到 [GitHub](https://github.com/istio/istio/releases) 上下载 Istio 安装包，解压后，建议使用 `istioctl` 安装 Istio。

```bash
istioctl install --set profile=demo
```

如果你安装了低于 1.14 版本的 Istio，请先升级 Istio。

## 安装 SPIRE

我们使用 Istio 提供的快速安装方式：

```bash
kubectl apply -f samples/security/spire/spire-quickstart.yaml
```

这将安装以下组件：

```
namespace/spire created
csidriver.storage.k8s.io/csi.spiffe.io created
customresourcedefinition.apiextensions.k8s.io/spiffeids.spiffeid.spiffe.io created
clusterrolebinding.rbac.authorization.k8s.io/k8s-workload-registrar-role-binding created
clusterrole.rbac.authorization.k8s.io/k8s-workload-registrar-role created
configmap/k8s-workload-registrar created
serviceaccount/spire-server created
configmap/trust-bundle created
clusterrole.rbac.authorization.k8s.io/spire-server-trust-role created
clusterrolebinding.rbac.authorization.k8s.io/spire-server-trust-role-binding created
configmap/spire-server created
statefulset.apps/spire-server created
service/spire-server created
serviceaccount/spire-agent created
clusterrole.rbac.authorization.k8s.io/spire-agent-cluster-role created
clusterrolebinding.rbac.authorization.k8s.io/spire-agent-cluster-role-binding created
configmap/spire-agent created
daemonset.apps/spire-agent created
```

需要给打 patch，这是为了让所有 sidecar 和 Ingress 都可以共享  SPIRE agent 的 UNIX Domain Socket。

```yaml
istioctl install --skip-confirmation -f - <<EOF
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  namespace: istio-system
spec:
  profile: default
  meshConfig:
    trustDomain: example.org
  values:
    global:
    # This is used to customize the sidecar template
    sidecarInjectorWebhook:
      templates:
        spire: |
          spec:
            containers:
            - name: istio-proxy
              volumeMounts:
              - name: workload-socket
                mountPath: /run/secrets/workload-spiffe-uds
                readOnly: true
            volumes:
              - name: workload-socket
                csi:
                  driver: "csi.spiffe.io"
  components:
    ingressGateways:
      - name: istio-ingressgateway
        enabled: true
        label:
          istio: ingressgateway
        k8s:
          overlays:
            - apiVersion: apps/v1
              kind: Deployment
              name: istio-ingressgateway
              patches:
                - path: spec.template.spec.volumes.[name:workload-socket]
                  value:
                    name: workload-socket
                    csi:
                      driver: "csi.spiffe.io"
                - path: spec.template.spec.containers.[name:istio-proxy].volumeMounts.[name:workload-socket]
                  value:
                    name: workload-socket
                    mountPath: "/run/secrets/workload-spiffe-uds"
                    readOnly: true
EOF
```

安装好 Istio 和 SPIRE 后，我们就可以注册负载了。

## 自动注册 Kubernetes 负载

在快速安装 SPIRE 的时候，我们已经安装了 SPRIE [Kubernetes Workload Registrar](https://github.com/spiffe/spire/blob/main/support/k8s/k8s-workload-registrar/README.md)，也就是说我们已经开启自动负载注册。现在检查一下 SPIRE 是否给负载颁发了身份证明。

```bash
kubectl exec -i -t spire-server-0 -n spire -c spire-server -- /bin/sh -c "bin/spire-server entry show -socketPath /run/spire/sockets/server.sock"
```

你将看到例如下面这样的结果：

```bash
# Node

Entry ID         : 3f17c8be-1379-4b7c-9a01-90805165d59f
SPIFFE ID        : spiffe://example.org/k8s-workload-registrar/demo-cluster/node/gke-jimmy-cluster-default-pool-d5041909-3atb
Parent ID        : spiffe://example.org/spire/server
Revision         : 0
TTL              : default
Selector         : k8s_psat:agent_node_uid:cbab5123-b32f-49d0-89f2-0a7e4d2b0edd
Selector         : k8s_psat:cluster:demo-cluster

# Ingress gateway

Entry ID         : ffc76b2e-e602-4ad3-8069-993ffbf4440e
SPIFFE ID        : spiffe://example.org/ns/istio-system/sa/istio-ingressgateway-service-account
Parent ID        : spiffe://example.org/k8s-workload-registrar/demo-cluster/node/gke-jimmy-cluster-default-pool-d5041909-0ucb
Revision         : 1
TTL              : default
Selector         : k8s:node-name:gke-jimmy-cluster-default-pool-d5041909-0ucb
Selector         : k8s:ns:istio-system
Selector         : k8s:pod-uid:be32b10a-b5a4-4716-adaf-eab778f58c13
DNS name         : istio-ingressgateway-6989cbc776-87qb6
DNS name         : istio-ingressgateway.istio-system.svc

# SPIRE Server

Entry ID         : 54444848-95ec-4b4d-a7c5-902a4049c96a
SPIFFE ID        : spiffe://example.org/ns/spire/sa/spire-server
Parent ID        : spiffe://example.org/k8s-workload-registrar/demo-cluster/node/gke-jimmy-cluster-default-pool-d5041909-0ucb
Revision         : 1
TTL              : default
Selector         : k8s:node-name:gke-jimmy-cluster-default-pool-d5041909-0ucb
Selector         : k8s:ns:spire
Selector         : k8s:pod-uid:4917defc-9b5a-42d8-9b98-c0e0a48c0313
DNS name         : spire-server-0
DNS name         : spire-server.spire.svc
```

每个 node 的 parent ID 是 `spiffe://example.org/ns/spire/sa/spire-server`，而 `spiffe://example.org/ns/spire/sa/spire-server` 的 parent 是 `spiffe://example.org/k8s-workload-registrar/demo-cluster/node/gke-jimmy-cluster-default-pool-d5041909-0ucb`。

也就是说工作负载的层级是这样的：

1. SPIRE Server：`spiffe://example.org/spire/server`
2. Kubernetes 节点：`spiffe://example.org/k8s-workload-registrar/demo-cluster/node/`

3. 普通服务账户：`spiffe://example.org/{namespace}/spire/sa/{service_acount}`

SPIRE 通过标签选择器选择工作负载，为它们创建 SPIFFE ID。

工作负载的 SPIFEE ID 格式为 `spiffe://<trust.domain>/ns/<namespace>/sa/<service-account>`。

## 部署应用

下面我们部署一个应用，然后检查下 SPIRE 为该应提供的身份。

使用下面的命令部署 Istio 提供的示例应用 `sleep`：

```bash
istioctl kube-inject --filename samples/security/spire/sleep-spire.yaml | kubectl apply -f -
```

因为我们在安装 Istio 的时候打了补丁，做了 SPIRE 自动注入，然后所有 pod 都会共享 SPIRE Agent 中的 UNIX Domain Socket：`/run/secrets/workload-spiffe-uds/socket`。获取正在运行的 `sleep` pod 的 YAML，我们可以看到其中有 volume 配置如下：

```yaml
  volumes:
    - name: workload-socket
      csi:
        driver: csi.spiffe.io
```

以及 `volumeMounts` 如下：

```yaml
      volumeMounts:
        - name: workload-socket
          readOnly: true
          mountPath: /run/secrets/workload-spiffe-uds
        - name: workload-socket
          mountPath: /var/run/secrets/workload-spiffe-uds
        - name: workload-certs
          mountPath: /var/run/secrets/workload-spiffe-credentials
        - name: istiod-ca-cert
```

这都证实了 SPRIE Agent 与工作负载 pod 共享 UNIX Domain Socket。

我们再查询下 Kubernetes 集群中的 SPIRE 条目，你将可以看到 sleep 的条目已注册。

```
Entry ID         : bd4457af-c55c-4d8c-aee2-4d477a79b465
SPIFFE ID        : spiffe://example.org/ns/default/sa/sleep
Parent ID        : spiffe://example.org/k8s-workload-registrar/demo-cluster/node/gke-jimmy-cluster-default-pool-d5041909-3atb
Revision         : 1
TTL              : default
Selector         : k8s:node-name:gke-jimmy-cluster-default-pool-d5041909-3atb
Selector         : k8s:ns:default
Selector         : k8s:pod-uid:81f116ce-6538-4492-a78a-98b163b58310
DNS name         : sleep-9df96d88-tvl49
DNS name         : sleep.default.svc
```

再检查下 sleep 的 SVID。

```bash
istioctl proxy-config secret $SLEEP_POD -o json | jq -r \
'.dynamicActiveSecrets[0].secret.tlsCertificate.certificateChain.inlineBytes' | base64 --decode > chain.pem
```

上面这条命令获取 sleep pod 中 Envoy 的 secret 并解析其中的 TLS 证书，将其 base64 解码后保存到 `chain.pem` 文件中。

```bash
openssl x509 -in chain.pem -text | grep SPIRE
```

使用 OpenSSL 解析其中的发行商，将得到如下的结果。

```bash
Subject: C=US, O=SPIRE, CN=sleep-9df96d88-tvl49
```

SPIFFE 还支持联邦，你可以为 SPIRE Agent SDS 配置 bundle，还需要为 pod 增加注解 `spiffe.io/federatesWith: "<trust.domain>"`，然后 Envoy 就会向 SPRIE Server 获取 bundle 了，详细步骤请参考 [Istio 官方文档](https://istio.io/latest/docs/ops/integrations/spire/#verifying-that-identities-were-created-for-workloads)。

以上就是在 Istio 中集成 SPIRE 的全过程。

## 参考

- [SPIRE -istio.io](https://istio.io/latest/docs/ops/integrations/spire/)

