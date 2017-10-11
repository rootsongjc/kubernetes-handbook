---
title: "Kubernetes与云原生应用概览"
date: 2017-10-11T16:49:51+08:00
draft: true
tags: ["kubernetes","cloud-native","architecture"]
categories: "cloud-native"
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/banners/cloud-computing.jpg", desc: "Cloud Computing"}]
description: "从云计算和容器生态开始引出kubernetes和cloud native云原生的概念"
---

本文是我在公司内部的培训和分享的资料，去掉了其中的credential部分，分享给大家。文章深入浅出，高屋建瓴，没有深入到具体细节，而是给出了详细的说明链接可供读者参考。

## 概览

本文主要包括如下内容：

- [从云计算到微服务再到云原生计算](#从云计算到微服务再到云原生计算)
  - [云计算介绍](#云计算介绍)
  - [微服务介绍](#微服务介绍)
  - [云原生概念介绍](#云原生概念介绍)
- [Kubernetes与云原生的关系](#kubernetes与云原生的关系)
  - [12因素应用](#12因素应用)
- [管理Kubernetes集群](#管理Kubernetes集群)
  - [部署Kubernetes集群](#部署Kubernetes集群)
  - [服务发现与负载均衡](#服务发现与负载均衡)
  - [持续集成与发布](#持续集成与发布)
  - [日志收集与监控](#日志收集与监控)
  - [安全性与权限管理](#安全性与权限管理)
- [Kubernetes中的资源管理与容器设计模式](#Kubernetes中的资源管理与容器设计模式)
  - [容器的设计模式](#容器的设计模式)
  - [资源限制与配额](#资源限制与配额)
- [如何开发Kubernetes原生应用步骤介绍](#如何开发Kubernetes原生应用步骤介绍)
  - [云原生应用开发示例](#云原生应用开发示例)
  - [上线与部署流程详解](#上线与部署流程详解)
- [如何迁移到云原生应用架构](#如何迁移到云原生应用架构)
  - [迁移到云原生应用架构指南](#迁移到云原生应用架构指南)
  - [迁移案例解析](#迁移案例解析)
- [Service mesh基本原理和示例介绍](#Service-mesh基本原理和示例介绍)
  - [什么是Service mesh](#什么是Service-mesh)
  - [Service mesh使用指南](#Service-mesh使用指南)

## 从云计算到微服务再到云原生计算

下面将从云计算的发展历程引入云原生计算，请先看下图：

![云计算演进历程](https://res.cloudinary.com/jimmysong/image/upload/images/cloud-computing-evolution-road.jpg)

### 云计算介绍

云计算包含的内容十分繁杂，也有很多技术和公司牵强赴会说自己是云计算公司，说自己是做云的，实际上可能风马牛不相及。说白了，云计算就是一种配置资源的方式，根据资源配置方式的不同我们可以把云计算从宏观上分为以下三种类型：

- IaaS：这是为了想要建立自己的商业模式并进行自定义的客户，例如亚马逊的EC2、S3存储、Rackspace虚拟机等都是IaaS。
- PaaS：工具和服务的集合，对于想用它来构建自己的应用程序或者想快速得将应用程序部署到生产环境而不必关心底层硬件的用户和开发者来说是特别有用的，比如Cloud Foundry、Google App Engine、Heroku等。
- SaaS：终端用户可以直接使用的应用程序。这个就太多，我们生活中用到的很多软件都是SaaS服务，只要基于互联网来提供的服务基本都是SaaS服务，有的服务是免费的，比如Google Docs，还有更多的是根据我们购买的Plan和使用量付费，比如GitHub、各种云存储。

### 微服务介绍

微服务（Microservices）这个词比较新颖，但是其实这种架构设计理念早就有了。微服务是一种分布式架构设计理念，为了推动细粒度服务的使用，这些服务要能协同工作，每个服务都有自己的生命周期。一个微服务就是一个独立的实体，可以独立的部署在PAAS平台上，也可以作为一个独立的进程在主机中运行。服务之间通过API访问，修改一个服务不会影响其它服务。

要想了解微服务的详细内容推荐阅读《微服务设计》（Sam Newman著），我写过这本书的读书笔记 - [微服务设计读书笔记](https://jimmysong.io/posts/microservice-reading-notes/)。

### 云原生概念介绍

## Kubernetes与云原生的关系

### 12因素应用

## 管理Kubernetes集群

### 部署Kubernetes集群

### 服务发现与负载均衡

### 持续集成与发布

### 日志收集与监控

### 安全性与权限管理

## Kubernetes中的资源管理与容器设计模式

### 容器的设计模式

### 资源限制与配额

## 如何开发Kubernetes原生应用步骤介绍

### 云原生应用开发示例

### 上线与部署流程详解

## 如何迁移到云原生应用架构

### 迁移到云原生应用架构指南

### 迁移案例解析

## Service mesh基本原理和示例介绍

### 什么是Service mesh

### Service mesh使用指南