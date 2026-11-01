---
weight: 7
title: "软件供应链安全：镜像签名、SBOM、来源证明与准入验证"
linktitle: 供应链安全
date: 2026-11-01T00:00:00+08:00
lastmod: 2026-11-01T00:00:00+08:00
slug: supply-chain-security
description: "从威胁模型出发讲解 Kubernetes 工作负载的供应链安全：SLSA 框架与来源证明、Sigstore/Cosign 无密钥签名、SBOM 生成与漏洞扫描、镜像摘要固定与拉取策略、准入阶段的签名验证（Kyverno、Sigstore Policy Controller、Ratify）、私有仓库凭据管理，以及最小化基础镜像与运行时防护的配套实践。"
---

> 集群再安全，也挡不住一个被篡改的基础镜像——供应链安全要回答的是"运行在集群里的每一个字节从哪里来、是否被改过"。

近年来多起重大安全事件并非源于 Kubernetes 本身的漏洞，而是来自被投毒的依赖、被篡改的 CI 流水线或被劫持的镜像标签。软件供应链安全把防线前移到构建与分发环节，并在集群准入时验证工件的来源与完整性。本文介绍相关框架、工具链以及它们在 Kubernetes 中的落地方式。

## 威胁模型

从源码到运行的容器，每个环节都可能被攻击：

{{< table title="供应链各环节的威胁与对策" >}}

| 环节 | 威胁 | 对策 |
|------|------|------|
| 源码 | 恶意提交、未经审核的合并 | 分支保护、签名提交、双人审核 |
| 依赖 | 投毒的第三方库、拼写劫持包 | 锁定版本与校验和、SBOM 审计、私有代理仓库 |
| 构建 | 被攻陷的 CI 注入后门 | 隔离的构建环境、可复现构建、来源证明（provenance） |
| 分发 | 推送伪造镜像、覆盖可变标签 | 镜像签名、摘要固定、仓库访问控制 |
| 部署 | 运行未验证的镜像、过时的漏洞镜像 | 准入阶段验证签名与证明、持续漏洞扫描 |
| 运行时 | 容器逃逸、进程注入 | 最小权限 securityContext、运行时检测（Falco） |

{{< /table >}}

## SLSA 框架

SLSA（Supply-chain Levels for Software Artifacts，读作"salsa"）是 OpenSSF 维护的供应链完整性框架，当前规范为 v1.2。它把构建轨道（Build Track）分为四级：

- **L0**：无保证
- **L1**：构建过程生成来源证明（provenance），说明工件由谁、用什么源码与参数构建
- **L2**：来源证明由托管构建平台生成并签名，防止事后伪造
- **L3**：构建平台保证构建之间相互隔离，密钥对用户定义的构建步骤不可访问

来源证明采用 [in-toto Attestation](https://github.com/in-toto/attestation) 格式，GitHub Actions 的 `slsa-github-generator` 与 `actions/attest-build-provenance`、GitLab 的 Runner 证明、Tekton Chains 都可以为容器镜像自动生成 SLSA L3 级别的证明并与镜像一同存入 OCI 仓库。

## 镜像签名与 Sigstore

[Sigstore](https://www.sigstore.dev/) 是 OpenSSF 下的签名基础设施，由三部分组成：Cosign（签名与验证 CLI/库）、Fulcio（基于 OIDC 身份签发短期证书的 CA）、Rekor（不可篡改的透明日志）。它最大的贡献是**无密钥签名**：CI 流水线用自己的 OIDC 身份（如 GitHub Actions 的工作流身份）向 Fulcio 申请一张 10 分钟有效的证书签名，签名记录写入 Rekor，验证方据此确认"该镜像由某仓库某工作流构建"，而无需管理长期私钥。

```bash
# CI 中无密钥签名（自动使用环境中的 OIDC 令牌）
cosign sign --yes registry.example.com/app@sha256:abc123...

# 附加 SBOM 与 SLSA 证明
cosign attest --yes --type cyclonedx --predicate sbom.cdx.json registry.example.com/app@sha256:abc123...
cosign attest --yes --type slsaprovenance --predicate provenance.json registry.example.com/app@sha256:abc123...

# 验证：限定签名者身份与 OIDC 颁发者
cosign verify registry.example.com/app@sha256:abc123... \
  --certificate-identity-regexp '^https://github.com/example-org/app/\.github/workflows/release\.yml@refs/tags/v.*' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

签名与证明以 OCI 工件形式存储在镜像同一仓库中（Cosign 3.x 默认使用 OCI 1.1 的 referrers API，旧仓库退回 `sha256-<digest>.sig` 标签约定），随镜像一起复制与镜像。有合规要求不允许依赖公共 Rekor/Fulcio 的组织，可自托管 Sigstore 实例或使用 KMS 托管的长期密钥进行签名。

## SBOM 与漏洞扫描

软件物料清单（SBOM，Software Bill of Materials）列出镜像中包含的全部软件包及版本，是漏洞响应（"我们哪些镜像含有这个 CVE"）与许可证合规的基础。两种主流格式为 [SPDX](https://spdx.dev/) 与 [CycloneDX](https://cyclonedx.org/)，[Syft](https://github.com/anchore/syft) 与 [Trivy](https://github.com/aquasecurity/trivy) 都能从镜像生成任一格式：

```bash
syft registry.example.com/app:1.0 -o cyclonedx-json > sbom.cdx.json
trivy image --format spdx-json --output sbom.spdx.json registry.example.com/app:1.0
trivy sbom sbom.cdx.json      # 基于 SBOM 扫描漏洞，无需再次拉取镜像
```

集群内的持续扫描由 Trivy Operator、Harbor 内置扫描器或云厂商的仓库扫描完成，结果以 `VulnerabilityReport` 等 CRD 暴露，可接入 Prometheus 告警。需要注意扫描结果只是漏洞是否"存在于镜像中"，是否"可被利用"还需结合 VEX（Vulnerability Exploitability eXchange）声明过滤误报——Trivy 与 Chainguard 等发行方已支持消费 OpenVEX 文档。

## 镜像引用与拉取的安全

签名验证的前提是引用不可变的工件。镜像标签（`app:1.0`、`app:latest`）可以被覆盖，而摘要（`app@sha256:...`）唯一标识镜像内容。生产部署应**固定摘要**，可由 CI 在渲染清单时替换，也可由准入控制器（Kyverno 的 `mutateDigest`）自动把标签解析为摘要写回 Pod 规约。`imagePullPolicy: Always` 对摘要引用不会重复下载，只会校验本地镜像的摘要是否匹配，因此固定摘要后开启它几乎没有额外成本。

多租户节点上还存在镜像凭据复用问题：节点上已拉取的私有镜像默认可被同节点任何 Pod 直接使用，即使该 Pod 没有拉取凭据。kubelet 的 `imagePullCredentialsVerificationPolicy`（`KubeletEnsureSecretPulledImages`，v1.35 Beta 默认开启）会记录拉取镜像时使用的凭据，要求后续 Pod 必须持有能够通过仓库校验的凭据才能复用本地镜像。相关细节见 [镜像管理](../../pod/image-management)。

## 准入阶段的验证

供应链策略最终要在集群入口强制执行，否则只是"建议"。三种主流方案都基于准入 Webhook：

{{< table title="准入阶段的镜像验证方案" >}}

| 方案 | 特点 |
|------|------|
| [Kyverno `verifyImages`](https://kyverno.io/docs/policy-types/cluster-policy/verify-images/) | 与通用策略引擎一体，支持 Cosign/Notary 签名、in-toto 证明（SBOM、SLSA）的内容断言，可同时把标签改写为摘要 |
| [Sigstore Policy Controller](https://github.com/sigstore/policy-controller) | Sigstore 官方实现，`ClusterImagePolicy` CRD 专注于签名与证明验证，支持无密钥身份匹配 |
| [Ratify](https://ratify.dev/) | CNCF 沙箱项目，作为 Gatekeeper/OPA 的外部数据提供者验证签名（Notation、Cosign）与 SBOM/漏洞报告，Azure 生态常用 |

{{< /table >}}

下面的 Kyverno 策略要求 `prod` 命名空间中所有镜像由指定 GitHub 工作流无密钥签名，且附带 SLSA 来源证明：

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-supply-chain
spec:
  validationFailureAction: Enforce
  webhookTimeoutSeconds: 30
  rules:
  - name: require-signature-and-provenance
    match:
      any:
      - resources:
          kinds: [Pod]
          namespaces: [prod]
    verifyImages:
    - imageReferences: ["registry.example.com/*"]
      mutateDigest: true                 # 把标签改写为验证通过的摘要
      required: true
      attestors:
      - entries:
        - keyless:
            subjectRegExp: "^https://github.com/example-org/.*/\\.github/workflows/release\\.yml@refs/tags/v.*"
            issuer: https://token.actions.githubusercontent.com
            rekor:
              url: https://rekor.sigstore.dev
      attestations:
      - type: https://slsa.dev/provenance/v1
        attestors:
        - entries:
          - keyless:
              subjectRegExp: "^https://github.com/example-org/.*"
              issuer: https://token.actions.githubusercontent.com
        conditions:
        - all:
          - key: "{{ buildDefinition.buildType }}"
            operator: Equals
            value: "https://actions.github.io/buildtypes/workflow/v1"
```

Kubernetes 原生的 ValidatingAdmissionPolicy 不能访问仓库，因此无法直接验证签名，但可以作为第一道低成本的防线：拒绝未固定摘要的镜像、限制镜像仓库前缀、禁止 `latest` 标签，再把需要网络调用的签名验证交给上述 Webhook。

## 私有仓库凭据

拉取私有镜像的凭据传统上以 `kubernetes.io/dockerconfigjson` 类型的 Secret 存放，并通过 `imagePullSecrets` 或 ServiceAccount 关联。长期静态凭据存在泄露风险，推荐替代方案是 kubelet 的**镜像凭据提供者**（Image Credential Provider）插件：kubelet 在拉取镜像前调用插件获取短期令牌，云厂商（ECR、ACR、GAR）均提供实现。v1.34 Beta 的 `KubeletServiceAccountTokenForCredentialProviders` 进一步允许插件使用 Pod 所属 ServiceAccount 的令牌向仓库换取凭据，实现"每个工作负载只能拉自己有权访问的镜像"，无需在集群中存放任何仓库密码。

## 基础镜像与构建实践

供应链安全的最后一环是减少攻击面本身：

- **最小化基础镜像**：Distroless、Chainguard Images、Alpine 或 `scratch` 去掉 shell 与包管理器，漏洞数量通常比完整发行版镜像少一到两个数量级
- **多阶段构建**：编译工具链只存在于构建阶段，运行镜像只包含二进制与运行时依赖
- **可复现构建**：固定基础镜像摘要、依赖锁文件与构建时间戳（`SOURCE_DATE_EPOCH`），使任何人都能重新构建出相同摘要以验证来源证明
- **非 root 用户**：在 Dockerfile 中 `USER 10001`，配合 [安全上下文](../security-context) 的 `runAsNonRoot`
- **镜像仓库治理**：使用 Harbor 等支持签名策略、漏洞门禁与不可变标签的仓库；为基础镜像与第三方镜像建立内部"黄金镜像"流程，禁止直接从公共仓库拉取

## 总结

Kubernetes 的供应链安全是一条从源码到准入的证据链：SLSA 定义了构建过程应达到的保证级别，Sigstore 让签名与来源证明无需长期密钥即可大规模推广，SBOM 与漏洞扫描使"镜像里有什么"可查询，镜像摘要固定与准入验证把这些证据在集群入口变成强制约束，而短期凭据提供者与最小化镜像从源头缩小攻击面。实施顺序上建议先固定摘要并在准入拒绝未知仓库，再引入签名与来源证明验证，最后以 SBOM 驱动的持续扫描闭环。

## 参考文献

- [SLSA Specification - slsa.dev](https://slsa.dev/)
- [Sigstore - sigstore.dev](https://www.sigstore.dev/)
- [Cosign Documentation - docs.sigstore.dev](https://docs.sigstore.dev/cosign/)
- [in-toto Attestation Framework - github.com](https://github.com/in-toto/attestation)
- [Kyverno Image Verification - kyverno.io](https://kyverno.io/docs/policy-types/cluster-policy/verify-images/)
- [Sigstore Policy Controller - github.com](https://github.com/sigstore/policy-controller)
- [Ratify - ratify.dev](https://ratify.dev/)
- [Syft - github.com](https://github.com/anchore/syft)
- [Trivy - github.com](https://github.com/aquasecurity/trivy)
- [Images - kubernetes.io](https://kubernetes.io/docs/concepts/containers/images/)
- [Chainguard Images - chainguard.dev](https://www.chainguard.dev/)
