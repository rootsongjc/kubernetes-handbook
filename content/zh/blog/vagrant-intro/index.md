---
date: "2017-03-08T20:40:08+08:00"
title: "Vagrant 从使用到放弃再到掌握完全指南"
description: "我在一年内使用 Vagrant 的心路历程。"
draft: false
tags: ["vagrant"]
categories: ["其他"]
image: "images/banner/vagrant.jpg"
bg_image: "images/backgrounds/page-title.jpg"
type: "post"
aliases: "/posts/vagrant-intro"
---

## 起源

久闻**Vagrant**大名，之前经常看到有开源项目使用它作为分布式开发的环境配置。

因为今天在看[contiv](https://github.com/contiv/netplugin)正好里面使用 vagrant 搭建的开发测试环境，所以顺便了解下。它的[Vagrantfile](https://github.com/contiv/netplugin/blob/master/Vagrantfile)文件中定义了三台主机。并安装了很多依赖软件，如 consul、etcd、docker、go 等，整的比较复杂。

```bash
➜  netplugin git:(master) ✗ vagrant status
Current machine states:

netplugin-node1           running (virtualbox)
netplugin-node2           running (virtualbox)
netplugin-node3           running (virtualbox)

This environment represents multiple VMs. The VMs are all listed
above with their current state. For more information about a specific
VM, run `vagrant status NAME`.
```

Vagrant 是[hashicorp](https://www.hashicorp.com/)这家公司的产品，这家公司主要做数据中心 PAAS 和虚拟化，其名下大名鼎鼎的产品有``Consul``、``Vault``、``Nomad``、``Terraform``。他们的产品都是基于**Open Source**的[Github 地址](https://github.com/hashicorp)。

## 用途

Vagrant 是用来管理虚拟机的，如 VirtualBox、VMware、AWS 等，主要好处是可以提供一个可配置、可移植和复用的软件环境，可以使用 shell、chef、puppet 等工具部署。所以 vagrant 不能单独使用，如果你用它来管理自己的开发环境的话，必须在自己的电脑里安装了虚拟机软件，我使用的是**virtualbox**。

Vagrant 提供一个命令行工具``vagrant``，通过这个命令行工具可以直接启动一个虚拟机，当然你需要提前定义一个 Vagrantfile 文件，这有点类似 Dockerfile 之于 docker 了。

跟 docker 类比这来看 vagrant 就比较好理解了，vagrant 也是用来提供一致性环境的，vagrant 本身也提供一个镜像源，使用``vagrant init hashicorp/precise64``就可以初始化一个 Ubuntu 12.04 的镜像。

## 用法

你可以下载安装文件来安装 vagrant，也可以使用 RubyGem 安装，它是用 Ruby 开发的。

**Vagrantfile**

Vagrantfile 是用来定义 vagrant project 的，使用 ruby 语法，不过你不必了解 ruby 就可以写一个 Vagrantfile。

看个例子，选自 https://github.com/fenbox/Vagrantfile

```Ruby
# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure("2") do |config|
  # The most common configuration options are documented and commented below.
  # For a complete reference, please see the online documentation at
  # https://docs.vagrantup.com.

  # Every Vagrant development environment requires a box. You can search for
  # boxes at https://atlas.hashicorp.com/search.
  config.vm.box = "ubuntu/trusty64"

  # Disable automatic box update checking. If you disable this, then
  # boxes will only be checked for updates when the user runs
  # `vagrant box outdated`. This is not recommended.
  # config.vm.box_check_update = false

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:8080" will access port 80 on the guest machine.
  # config.vm.network "forwarded_port", guest: 80, host: 8080

  # Create a private network, which allows host-only access to the machine
  # using a specific IP.
  config.vm.network "private_network", ip: "192.168.33.10"

  # Create a public network, which generally matched to bridged network.
  # Bridged networks make the machine appear as another physical device on
  # your network.
  # config.vm.network "public_network"

  # Share an additional folder to the guest VM. The first argument is
  # the path on the host to the actual folder. The second argument is
  # the path on the guest to mount the folder. And the optional third
  # argument is a set of non-required options.
  # config.vm.synced_folder "../data", "/vagrant_data"

  # Provider-specific configuration so you can fine-tune various
  # backing providers for Vagrant. These expose provider-specific options.
  # Example for VirtualBox:
  #
  # config.vm.provider "virtualbox" do |vb|
  #   # Display the VirtualBox GUI when booting the machine
  #   vb.gui = true
  #
  #   # Customize the amount of memory on the VM:
  #   vb.memory = "1024"
  # end
  #
  # View the documentation for the provider you are using for more
  # information on available options.

  # Define a Vagrant Push strategy for pushing to Atlas. Other push strategies
  # such as FTP and Heroku are also available. See the documentation at
  # https://docs.vagrantup.com/v2/push/atlas.html for more information.
  # config.push.define "atlas" do |push|
  #   push.app = "YOUR_ATLAS_USERNAME/YOUR_APPLICATION_NAME"
  # end

  # Enable provisioning with a shell script. Additional provisioners such as
  # Puppet, Chef, Ansible, Salt, and Docker are also available. Please see the
  # documentation for more information about their specific syntax and use.
  # config.vm.provision "shell", inline: <<-SHELL
  #   apt-get update
  #   apt-get install -y apache2
  # SHELL
  config.vm.provision :shell, path: "bootstrap.sh"
end
```

**Boxes**

Vagrant 的基础镜像，相当于 docker images。可以在这些基础镜像的基础上制作自己的虚拟机镜像。

添加一个 box

```shell
$ vagrant box add hashicorp/precise64
```

在 Vagrantfile 中指定 box

```Ruby
Vagrant.configure("2") do |config|
  config.vm.box = "hashicorp/precise64"
  config.vm.box_version = "1.1.0"
end
```

**使用 ssh 进入 vagrant**

``vagrant up``后就可以用``vagrant ssh $name``进入虚拟机内，如果主机上就一个 vagrant 可以不指定名字。默认进入的用户是 vagrant。

**文件同步**

``vagrant up``后在虚拟机中会有一个``/vagrant``目录，这跟你定义``Vagrantfile``是同一级目录。

这个目录跟你宿主机上的目录文件是同步的。

**软件安装**

在 Vagrantfile 中定义要安装的软件和操作。

例如安装 apache

在与 Vagrantfile 同级的目录下创建一个``bootstrap.sh``文件。

```shell
#!/usr/bin/env bash

apt-get update
apt-get install -y apache2
if ! [ -L /var/www ]; then
  rm -rf /var/www
  ln -fs /vagrant /var/www
fi
```
然后在 Vagrantfile 中使用它。

```Ruby
Vagrant.configure("2") do |config|
  config.vm.box = "hashicorp/precise64"
  config.vm.box_version = "1.1.0"
end
```
**网络**

端口转发

```ruby
Vagrant.configure("2") do |config|
  config.vm.box = "hashicorp/precise64"
  config.vm.provision :shell, path: "bootstrap.sh"
  config.vm.network :forwarded_port, guest: 80, host: 4567
end
```

执行``vagrant reload``或者``vagrant up``可以生效。

**分享**

你自己做的 vagrant 是可以分享给别人的用的，只要你有一个 hashicorp 账号，``vagrant login``后就可以执行``vagrant share``分享，会生成一个 URL，其它人也可以访问到你的 vagrant 里的服务。

**中止**

- vagrant suspend
- Vagrant halt
- Vagrant destroy

**重构**

再次执行``vagrant up``即可。

## 分布式环境

开发分布式环境下的应用时往往需要多个虚拟机用于测试，这时候才是 vagrant 显威力的时候。

**定义多个主机**

```ruby
Vagrant.configure("2") do |config|
  config.vm.provision "shell", inline: "echo Hello"

  config.vm.define "web" do |web|
    web.vm.box = "apache"
  end

  config.vm.define "db" do |db|
    db.vm.box = "mysql"
  end
end
```

这个比较复杂，[详见 multi-machine](https://www.vagrantup.com/docs/multi-machine/)

还有一些其它功能，如 push、plugins、providers 按下不表。

## 总结

总的来说说 Vagrant 没有 Docker 好用，但是对于协同开发，用它来定义分布式开发环境还可以，ruby 的语法看着有点不习惯，好在也不复杂，如果是团队几个人开发，弄几个虚拟机大家互相拷贝一下也没那么复杂吧？

---

以上内容写于 2017 年 3 月 8 日，下面是更新。

一年前初次接触 Vagrant 感觉它很繁琐，为了创建几个隔离的环境要费好大的功夫，要直接从启动虚拟机起开始安装各种软件，跟 docker 比自然是不能比的，但是最近我又需要一个 kubernetes 的分布式开发环境：<https://github.com/rootsongjc/kubernetes-vagrant-centos-cluster>，因此又把 vagrant 捡起来了，用了也有几个月，有一点心得分享给大家。

- 首先 Vagrant 并不是那么难用，对于需要一个纯粹的隔离的从纯净的操作系统级别开始部署的分布式应用来说，用它来启动和做虚拟机配置还是比较方便的。
- Vagrantfile 中支持多种格式的脚本，我使用的是 shell，在写脚本的时候要特别注意格式，比如用`cat`或者`echo`输入文本命令内容到文件中时候一定要注意每行开头不要有空格。
- Vagrant 会把`Vagrantfile`文件所在目录下的所有文件同步复制到虚拟机中的`/vagrant`目录下，所有命令都是使用 vagrant 用户执行的。

---

更新于 2018 年 3 月 18 日