---
date: "2017-03-17T17:52:37+08:00"
title: "Docker 17.03CE 下思科 Docker 网络插件 contiv 趟坑终极版"
draft: false
description: "本文将带领大家用正确的姿势编译和打包一个 contiv netplugin。"
categories: ["容器"]
tags: ["contiv","docker"]
type: "post"
aliases: "/posts/contiv-ultimate"
image: "images/banner/contiv.jpg"
---

前几天写的几篇[关于 Contiv 的文章](https://jimmysong.io/tags/contiv/)已经把引入坑了😂

今天这篇文章将带领大家用正确的姿势编译和打包一个**contiv netplugin**。

> 请一定要在**Linux**环境中编译。docker 中编译也会报错，最好还是搞个虚拟🐔吧，最好还有 VPN 能翻墙。

## 环境准备

我使用的是 docker17.03-CE、安装了 open vSwitch(这个包 redhat 的源里没有，需要自己的编译安装)。

## 编译

这一步是很容易失败的，有人提过[issue-779](https://github.com/contiv/netplugin/issues/779)

**具体步骤**

- 创建一个 link **/go**链接到你的 GOPATH 目录，下面编译的时候要用。
- 将源码的**vender**目录下的文件拷贝到$GOPATH/src 目录。
- 执行编译

在 netplugin 目录下执行以下命令能够编译出二进制文件。

```bash
NET_CONTAINER_BUILD=1 make build
```

在你的**/$GOPATH/bin**目录下应该会有如下几个文件：

```bash
contivk8s  github-release  godep  golint  misspell  modelgen  netcontiv  netctl  netmaster  netplugin
```

*⚠️编译过程中可能会遇到 有些包不存在或者需要翻墙下载。*

## 打包

我们将其打包为 docker plugin。

Makefile 里用于创建 plugin rootfs 的命令是：

```Makefile
host-pluginfs-create:
        @echo dev: creating a docker v2plugin rootfs ...
        sh scripts/v2plugin_rootfs.sh
```

**v2plugin_rootfs.sh**这个脚本的内容：

```Shell
#!/bin/bash
# Script to create the docker v2 plugin
# run this script from contiv/netplugin directory

echo "Creating rootfs for v2plugin ", ${CONTIV_V2PLUGIN_NAME}
cat install/v2plugin/config.template | grep -v "##" > install/v2plugin/config.json
sed -i "s%PluginName%${CONTIV_V2PLUGIN_NAME}%" install/v2plugin/config.json
cp bin/netplugin bin/netmaster bin/netctl install/v2plugin
docker build -t contivrootfs install/v2plugin
id=$(docker create contivrootfs true)
mkdir -p install/v2plugin/rootfs
sudo docker export "${id}" | sudo tar -x -C install/v2plugin/rootfs
docker rm -vf "${id}"
docker rmi contivrootfs
rm install/v2plugin/netplugin install/v2plugin/netmaster install/v2plugin/netctl
```

先把`$GOPATH/bin`下生成的

- `netplugin`

- `netmaster`

- `netctl`

- `netplugin`

这几个二进制文件拷贝到 netplugin 源码的 bin 目录下。

这里面用语创建 contivrootfs 镜像的 Dockerfile 内容：

```Dockerfile
# Docker v2plugin container with OVS / netplugin / netmaster 

FROM alpine:3.5
MAINTAINER Cisco Contiv (http://contiv.github.io/)

RUN mkdir -p /run/docker/plugins /etc/openvswitch /var/run/contiv/log \
    && echo 'http://dl-cdn.alpinelinux.org/alpine/v3.4/main' >> /etc/apk/repositories \
    && apk update && apk add openvswitch=2.5.0-r0 iptables

COPY netplugin netmaster netctl startcontiv.sh /

ENTRYPOINT ["/startcontiv.sh"]
```

执行`make host-pluginfs-create`创建 rootfs。

创建出了 rootfs 后，然后执行

```bash
docker plugin create localhost:5000/contiv/netplugin .
docker push localhost:5000/contiv/netplugin
```

> 注：我们将插件 push 到 docker registry 的镜像仓库中，当前[Harbor](www.github.com/vmware/harbor)还不支持 docker 插件的 push。

**Install plugin**

下面是编译和安装我自己生成 v2plugin 的过程。

修改**config.json**文件中的`plugin_name`字段的值为插件的名称。

```shell
$docker plugin install localhost:5000/contiv/v2plugin 
Plugin "localhost:5000/contiv/v2plugin" is requesting the following privileges:
 - network: [host]
 - mount: [/etc/openvswitch]
 - mount: [/var/log/openvswitch]
 - mount: [/var/run]
 - mount: [/lib/modules]
 - capabilities: [CAP_SYS_ADMIN CAP_NET_ADMIN CAP_SYS_MODULE]
Do you grant the above permissions? [y/N] y
latest: Pulling from contiv/v2plugin
fd87a71d9090: Download complete 
Digest: sha256:b13ad7930f771c9602acf562c2ae147482466f4d94e708692a215935663215a6
Status: Downloaded newer image for localhost:5000/contiv/v2plugin:latest
Installed plugin localhost:5000/contiv/v2plugin
```

自己 create 的插件 enable 的时候从 docker daemon 的日志中依然可以看到之前看到找不到 socket 的错误，实际上也确实是没有生成。如果直接使用`docker plugin install store/contiv/v2plugin:1.0.0-beta.3 `的方式安装插件是没有问题的。

## Docker17.03-CE 中插件机制存在的问题

Docker17.03 的插件机制是为了 docker 公司的商业化策略而实行的，所有的 docker 插件都运行在自己的 namespace 和 rootfs 中，插件接口

**Plugin backend 接口**

```Go
// Backend for Plugin
type Backend interface {
	Disable(name string, config *enginetypes.PluginDisableConfig) error
	Enable(name string, config *enginetypes.PluginEnableConfig) error
	List(filters.Args) ([]enginetypes.Plugin, error)
	Inspect(name string) (*enginetypes.Plugin, error)
	Remove(name string, config *enginetypes.PluginRmConfig) error
	Set(name string, args []string) error
	Privileges(ctx context.Context, ref reference.Named, metaHeaders http.Header, authConfig *enginetypes.AuthConfig) (enginetypes.PluginPrivileges, error)
	Pull(ctx context.Context, ref reference.Named, name string, metaHeaders http.Header, authConfig *enginetypes.AuthConfig, privileges enginetypes.PluginPrivileges, outStream io.Writer) error
	Push(ctx context.Context, name string, metaHeaders http.Header, authConfig *enginetypes.AuthConfig, outStream io.Writer) error
	Upgrade(ctx context.Context, ref reference.Named, name string, metaHeaders http.Header, authConfig *enginetypes.AuthConfig, privileges enginetypes.PluginPrivileges, outStream io.Writer) error
	CreateFromContext(ctx context.Context, tarCtx io.ReadCloser, options *enginetypes.PluginCreateOptions) error
}
```

从 Plugin 的后端接口中可以看到，没有像镜像一样的两个常用方法：

- 没有修改 plugin 名字的方法，因为没有这个方法，就无法 push plugin 到自己的镜像仓库，另外**Harbor**还是不支持`docker plugin push` [Issue-1532](https://github.com/vmware/harbor/issues/1532)。
- 没有导出 plugin 的方法，这样就只能在联网的主机上安装 docker plugin 了，对于无法联网的主机只好束手无策了。

估计 docker 官方也不会开放这两个接口吧。毕竟这是**Docker EE** 的一个重要卖点：

> **Docker EE's Certified Plugins** provide networking and volume plugins and easy to download and install containers to the Docker EE environment.

## 疑问

**为什么一定要使用 docker plugin install**

因为`docker plugin install`的时候会申请一些访问权限。

这一块在上面的步骤中可以看到。

**为什么 docker plugin 不能改名字？**

我们看下 Plugin 的结构体（在 api/types/plugin.go 中定义）：

```go
// Plugin A plugin for the Engine API
// swagger:model Plugin
type Plugin struct {

	// config
	// Required: true
	Config PluginConfig `json:"Config"`

	// True when the plugin is running. False when the plugin is not running, only installed.
	// Required: true
	Enabled bool `json:"Enabled"`

	// Id
	ID string `json:"Id,omitempty"`

	// name
	// Required: true
	Name string `json:"Name"`

	// plugin remote reference used to push/pull the plugin
	PluginReference string `json:"PluginReference,omitempty"`

	// settings
	// Required: true
	Settings PluginSettings `json:"Settings"`
}
```

注意其中有一个`PluginReference`结构体，它的方法有：

```Go
type pluginReference struct {
	name     reference.Named
	pluginID digest.Digest
}

func (r *pluginReference) References(id digest.Digest) []reference.Named {
	if r.pluginID != id {
		return nil
	}
	return []reference.Named{r.name}
}

func (r *pluginReference) ReferencesByName(ref reference.Named) []refstore.Association {
	return []refstore.Association{
		{
			Ref: r.name,
			ID:  r.pluginID,
		},
	}
}

func (r *pluginReference) Get(ref reference.Named) (digest.Digest, error) {
	if r.name.String() != ref.String() {
		return digest.Digest(""), refstore.ErrDoesNotExist
	}
	return r.pluginID, nil
}

func (r *pluginReference) AddTag(ref reference.Named, id digest.Digest, force bool) error {
	// Read only, ignore
	return nil
}
func (r *pluginReference) AddDigest(ref reference.Canonical, id digest.Digest, force bool) error {
	// Read only, ignore
	return nil
}
func (r *pluginReference) Delete(ref reference.Named) (bool, error) {
	// Read only, ignore
	return false, nil
}
```

注意其中有三个方法`AddTag`、`AddDigest`、`Delete`方法都是只读的。在`migrate/v1/migratev1.go`中有引用到了这个。

再看下**Reference**的的定义

```ini
vendor/github.com/docker/distribution/reference/reference.go
```

```Go
// Package reference provides a general type to represent any way of referencing images within the registry.
// Its main purpose is to abstract tags and digests (content-addressable hash).
//
// Grammar
//
// 	reference                       := name [ ":" tag ] [ "@" digest ]
//	name                            := [domain '/'] path-component ['/' path-component]*
//	domain                          := domain-component ['.' domain-component]* [':' port-number]
//	domain-component                := /([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])/
//	port-number                     := /[0-9]+/
//	path-component                  := alpha-numeric [separator alpha-numeric]*
// 	alpha-numeric                   := /[a-z0-9]+/
//	separator                       := /[_.]|__|[-]*/
//
//	tag                             := /[\w][\w.-]{0,127}/
//
//	digest                          := digest-algorithm ":" digest-hex
//	digest-algorithm                := digest-algorithm-component [ digest-algorithm-separator digest-algorithm-component ]
//	digest-algorithm-separator      := /[+.-_]/
//	digest-algorithm-component      := /[A-Za-z][A-Za-z0-9]*/
//	digest-hex                      := /[0-9a-fA-F]{32,}/ ; At least 128 bit digest value
//
//	identifier                      := /[a-f0-9]{64}/
//	short-identifier                := /[a-f0-9]{6,64}/
// Reference is an opaque object reference identifier that may include
// modifiers such as a hostname, name, tag, and digest.
```

修改 plugin 的名字的方法是不是还没实现？

## 解决方法

在代码存在 bug 的情况下，可以先用下面的方法暂时创建 plugin。

虽然 docker 代码里没有提供**rename plugin**的接口，但是使用**docker install**命令安装的 plugin 会存储在`/var/lib/docker/plugins/${PLUGIN_ID}`目录下。

可以在这个目录下使用**docker plugin create**命令创建你自己想要的名称的 docker plugin。

使用`docker plugin set`命令修改 plugin 中的属性：

- cluster_store
- plugin_role
- plugin_name

**插件调试**

日志地址`/run/contiv/log/`。

从非 master 节点的 netplugin 启动日志`netplugin_bootup.log`中可以看到：

```bash
V2 Plugin logs
Loading OVS
Starting OVS
Starting Netplugin 
/netplugin -debug -plugin-mode docker -vlan-if  -cluster-store etcd://172.20.0.113:2379  
Not starting netmaster as plugin role is none
```

Netplugin 启动的时候是正确的解析了**etcd**的配置了。

但是我们再看一下`netplugin.log`的日志后就会发现，启动还是失败了。

```bash
time="Mar 21 03:20:37.537954358" level=debug msg="Got link list(16): [0xc4203fe200 0xc4203fe300 0xc4203fe400 0xc4203fe500 0xc420420000 0xc420420090 0xc420420120 0xc4204201b0 0xc420420240 0xc4204202d0 0xc420420360 0xc4204203f0 0xc420420480 0xc420420510 0xc4203feb80 0xc4203fec80]"
time="Mar 21 03:20:37.538576647" level=error msg="Failed to connect to etcd. Err: client: etcd cluster is unavailable or misconfigured"
time="Mar 21 03:20:37.538599827" level=error msg="Error creating client etcd to url 127.0.0.1:2379. Err: client: etcd cluster is unavailable or misconfigured"
time="Mar 21 03:20:37.538612813" level=fatal msg="Error initializing cluster. Err: client: etcd cluster is unavailable or misconfigured"
```

`netplugin`没有正确的解析 etcd 的地址。这到底是为什么呢？bootup 的日志里不是写的解析到了吗？这个问题还得研究下源码，也许是一个 bug。
