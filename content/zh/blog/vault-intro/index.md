---
date: "2020-06-15T10:40:08+08:00"
title: "Vault简介"
description: "关于 Vault 的一切。"
draft: true
tags: ["vault"]
categories: ["其他"]
image: "images/banner/vagrant.jpg"
bg_image: "images/backgrounds/page-title.jpg"
type: "post"
aliases: "/posts/vagrant-intro"
---

## 前言

前些日子 Hashicorp 公司宣布禁止在中国使用 Vault。

## 安装试用

下载地址：https://www.vaultproject.io/downloads

## 令牌的属性

Vault 的认证机制是建立在令牌之上的，令牌具有如下属性：

- 一组关联的策略
- 有效期
- 是否强制更新
- 最大使用次数

## Secret 类型

Value 支持以下 Secret 类型：

- Key-Value： 简单的静态键值对
- 动态生成的凭据：由 Vault 根据客户端请求生成
- 加密密钥：用于使用客户端数据执行加密功能

### Key-Value（键值存储）Secret 类型

Vault 支持三种 Key-Value 机密：

- 非版本化键值对，其中更新替换现有值
- 版本化键值对，可保持可配置数量的旧版本
- Cubbyhole，一种特殊类型的非版本化密钥对，其值的范围限定为给定的访问令牌

### 动态 Secret 类型

Vault 支持多种类型的动态机密，包括以下几种：

- 数据库凭证
- SSH 密钥对
- X.509 证书
- AWS 凭证
- Google Cloud 服务帐户
- Active Directory 帐户

## 参考

- [Hashicorp Vault 介绍和使用说明 - blog.csdn.net](https://blog.csdn.net/peterwanghao/article/details/83181932)
