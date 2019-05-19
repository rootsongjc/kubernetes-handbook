---
date: "2017-03-09T10:58:42+08:00"
title: "开源镜像定义工具Packer简介"
draft: false
description: "开源镜像定义工具Packer简介。"
categories: "devops"
tags: ["packer","hashicorp"]
bigimg: [{src: "/img/banners/006tNc79ly1g22iky0n18j31i60n84qp.jpg", desc: "Photo via Unsplash"}]
---

昨天研究了下[**Vagrant**](https://github.com/mitchellh/vagrant)，感觉它的虚拟机ruby格式定义很麻烦，经人指点还有一个叫做[**packer**](https://github.com/mitchellh/packer)的东西，也是Hashicorp这家公司出品的，今天看了下。

**Packer**是一款开源轻量级的镜像定义工具，可以根据一份定义文件生成多个平台的镜像，支持的平台有：

- Amazon EC2 (AMI). Both EBS-backed and instance-store AMIs
- Azure
- DigitalOcean
- Docker
- Google Compute Engine
- OpenStack
- Parallels
- QEMU. Both KVM and Xen images.
- VirtualBox
- VMware

Packer创造的镜像也能转换成**Vagrant boxes**。

Packer的镜像创建需要一个json格式的定义文件，例如``quick-start.json``

```json
{
  "variables": {
    "access_key": "{{env `AWS_ACCESS_KEY_ID`}}",
    "secret_key": "{{env `AWS_SECRET_ACCESS_KEY`}}"
  },
  "builders": [{
    "type": "amazon-ebs",
    "access_key": "{{user `access_key`}}",
    "secret_key": "{{user `secret_key`}}",
    "region": "us-east-1",
    "source_ami": "ami-af22d9b9",
    "instance_type": "t2.micro",
    "ssh_username": "ubuntu",
    "ami_name": "packer-example {{timestamp}}"
  }]
}
```

使用``packer build quick-start.json``可以在AWS上build一个AIM镜像。

Packer的详细文档：https://www.packer.io/docs/
