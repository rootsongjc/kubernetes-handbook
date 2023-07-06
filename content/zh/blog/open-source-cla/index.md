---
title: "开源社区贡献者协议 CLA 介绍"
date: 2019-04-20T15:16:09+08:00
draft: false
description: "很多从事开源人可能会注意到有些开源项目要求贡献者在提交 PR 前首先签署 CLA。"
categories: ["开源"]
tags: ["CLA","开源","开源管理","开源合规"]
type: "post"
aliases: "/posts/open-source-cla"
image: "images/banner/open-source.jpg"
---

很多从事开源人可能会注意到有些开源项目要求贡献者在提交 PR 前首先签署 CLA，只有签署了 CLA 之后 PR 才可以合并。

## 开源贡献协议简介

下面列举了开源贡献协议的一些简介：

- 开源贡献协议有 CLA（Contributor License Agreement）和 [DCO](https://developercertificate.org/)（Developer Certificate of Origin）两种；
- DCO 由 Linux Foundation 提出，是固定的简短条文（只有 4 条），旨在让贡献者保证遵守开源 license；
- CLA 是对开源 license 的法律性质补充，由法务制定；
- CLA 可以自定义，不论是个人还是企业级签署的时候都需要提供详细的信息，如姓名、公司、邮箱、地址、电话等；
- 下表中对比了 CLA 和 DCO 的特性，推荐大型跨公司开源项目使用 CLA，利用项目更加正规和长久发展；

开源社区的贡献者协议一般分为两种 CLA 和 DCO，这两种协议各有优缺点如下。

| 特性         | CLA                                                | DCO                                                        |
| ------------ | -------------------------------------------------- | ---------------------------------------------------------- |
| 社区属性     | 弱                                                 | 强                                                         |
| 签署方式     | 一次性                                             | 每次提交时在 commit 信息里追加 `Signed-off-by: email` 信息 |
| 法律责任     | 明确法律义务                                       | 无声明，用来限制提交者遵守开源 license                     |
| 是否可自定义 | 公司或组织可自行定义                               | 否                                                         |
| 使用案例     | Google、Pivotal、CNCF、阿里巴巴、Apache SkyWalking | GitLab、Chef、Harbor、TiKV                                 |
| 公司属性     | 强，可以签署公司级别的 CLA                         | 弱                                                         |

## 什么是 CLA

CLA 是 Contributor License Agreement 的缩写，CLA 可以看做是对开源软件本身采用的开源协议的补充。一般分为公司级和个人级别的 CLA，所谓公司级即某公司代表签署 CLA 后即可代表该公司所有员工都签署了该 CLA，而个人级别 CLA 只代表个人认可该 CLA。

## CLA 包含哪些内容？

因为 CLA 是每个公司或组织自定义的，在细节上可能稍有不同，不过总体都包含以下内容：

- 关于签署该 CLA 的主体和贡献的定义；
- 授予著作权给拥有该软件知识产权的公司或组织；
- 专利许可的授予；
- 签署者保证依法有权授予上述许可；
- 签署者确保所有的贡献内容均为原创作品；
- 签署者为贡献内容支持的免责描述；
- 说明贡献者提交非原创作品应该采用的方式；
- 保证在获悉任何方面不准确的事实或情况之时通知签约方；

对于主体在中国的企业，还加入了一些本地化的内容，如 [Alibaba Open Source Individual CLA](https://github.com/aliyun/cla)。

因为 CLA 分别为个人级和公司级，所以对于不同名义签署时需要提供不同的信息。签署个人级 CLA 的时候需要提供个人信息（姓名、地址、邮箱、电话等），签署公司级 CLA 还需要提供公司信息（名称、地址、联系电话、邮箱、传真等）；

## 什么是 DCO

DCO 是 Developer Certificate of Origin 的缩写，由 Linux Foundation 于 2004 年制定。DCO 最大的优点是可以减轻开发者贡献的阻碍，不用阅读冗长的 CLA 法律条文，只需要在提交的时候签署邮件地址即可。Chef 和 GitLab 已分别于 2016 年和 2017 年从 CLA 迁移到 DCO。

如 CNCF 的 Sandbox 项目 [harbor](https://github.com/goharbor/harbor) 就是使用的 DCO。

[DCO](<https://developercertificate.org/>) 目前是 1.1 版本，内容很简单，开源项目的贡献者只需要保证以下四点：

1. 该贡献全部或部分由我创建，我有权根据文件中指明的开源许可提交；要么
2. 该贡献是基于以前的工作，这些工作属于适当的开源许可，无论这些工作全部还是部分由我完成，我有权根据相同的开源许可证（除非我被允许根据不同的许可证提交）提交修改后的工作；要么
3. 该贡献由 1、2、或 3 证明的其他人直接提供给我，而我没有对其进行修改。
4. 我理解并同意该项目和贡献是公开的，并且该贡献的记录（包括我随之提交的所有个人信息，包括我的签字）将无限期保留，并且可以与本项目或涉及的开源许可证保持一致或者重新分配。

## CLA vs DCO

Kubernetes 社区中有过讨论将 Kubernetes 贡献者从 CLA 迁移到 DCO，最后 TOC 成员 Tim Hockin 觉得签署 CLA 对于贡献者只需要痛苦一次，每次提交都签署 DCO 是持续的痛苦，因此最后还是坚持使用 CLA。参考[Move from CLA to DCO #2649](https://github.com/kubernetes/community/issues/2649)。

2018 年 CNCF 对其托管的项目的 Maintainer 做了调研，从反馈来看，Maintainer 对 DCO 是存在痛点的，并希望 CNCF 投入更多的 PR 和市场力量来对抗具有全职 PR/marketing 的初创公司。

如果为了更注重个人贡献者，考虑社区属性，可以使用 DCO，这样对于开源项目的管理者来说就不用指定复杂的 CLA 了，但是对于大型项目由众多合作方的项目，建议使用 CLA。

## 阿里巴巴 CLA

阿里巴巴只提供个人级别的 CLA 签署：<https://cla-assistant.io/alibaba/weex>

CLA 内容见：<https://github.com/aliyun/cla>

阿里巴巴的 CLA 是参照 [Apache CLA](https://www.apache.org/licenses/icla.pdf) 撰写的，最后加上两条补充，协议受中国杭州的法院监管，同时提供双语版本，如中引文版本有冲突以英文版本为准。

## Google CLA

Google 的 CLA 也是仿照 Apache CLA 撰写的，Google 开源的一些列项目如 Istio、TensorFlow、Knative 等都是需要签署 [Google CLA](<https://cla.developers.google.com/clas>)。

1. 要贡献者授予 Google 以及其他软件用户贡献内容的版权以及内容背后的专利权。贡献者不要因为版权和专利权诉讼 Google 和其他软件用户。
2. 明确贡献的原创性。不要因为贡献者的不适当抄袭行为，导致 Google 和其他软件使用者被诉讼。
3. 签署公司级别 CLA 的人要能代表所在公司的所有贡献者。
4. 维护贡献者列表的不一定是跟签署该协议的是同一个人，签名者可以指定一个人来管理。

参考：[解读：Google Software Grant and Corporate Contributor License Agreement](https://docs.google.com/document/d/1FJkYaEZbKwmoEWrsbzDxdI-ytlEg73OsOcMXaF8Z01E/)

## Pivotal CLA

Pivotal 的 CLA 也是仿照 Apache CLA 撰写的，唯一增加了一点是协议受美国加州法律监管。签署个人级协议的时候需要提供姓名、邮箱、邮寄地址（可选）、国家（可选）、电话（可选），签署公司级别的 CLA 的条款了还增加了一条对于签名者必须有权利代表整个公司，要求的信息也更加详细，包括姓名、邮箱、邮寄地址、国家、电话、公司名称、GitHub 组织、头衔等。参与贡献 Pivotal 主导的 Spring 社区和 CloudFoundry 里的项目需要签署 [Pivotal CLA](<https://cla.pivotal.io/>)。

## 建议

如果你的开源项目可能会有公司间合作或者要贡献给基金会，为了防范法律风险，请直接使用 CLA；如果更看重社区内的合作，可以使用 DCO。

## 参考

- [Individual Contributor License Agreement (“Agreement”) V2.0](https://www.apache.org/licenses/icla.pdf)
- [Move from CLA to DCO #2649 - github.com](https://github.com/kubernetes/community/issues/2649)
- [Alphabet CLA Policy and Rationale - opensource.google.com](https://opensource.google.com/docs/cla/policy/)
- [The Apache Software Foundation Software Grant and Corporate Contributor License Agreement ("Agreement") - apache.org](<https://www.apache.org/licenses/cla-corporate.txt>)
- [Alibaba Open Source Individual CLA - github.com](https://github.com/aliyun/cla)
