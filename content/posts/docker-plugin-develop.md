---
date: "2017-03-15T13:57:26+08:00"
title: "Docker17.03-CE插件开发案例"
draft: false
categories: "docker"
tags: ["docker","go"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20161016022.jpg", desc: "杭州吴山步道旁的墙壁 Oct 16,2016"}]
---

> 当你看到这篇文章时，如果你也正在进行docker1.13+版本下的plugin开发，恭喜你也入坑了，如果你趟出坑，麻烦告诉你的方法，感恩不尽🙏

看了文章后你可能会觉得，官网上的可能是个假🌰。**虽然官网上的文档写的有点不对，不过你使用docker-ssh-volume的开源代码自己去构建plugin的还是可以成功的！**

### Docker plugin开发文档

首先docker官方给出了一个[docker legacy plugin文档](https://docs.docker.com/engine/extend/legacy_plugins/)，这篇文章基本就是告诉你docker目前支持哪些插件，罗列了一系列连接，不过对不起，这些不是docker官方插件，有问题去找它们的开发者去吧😂

**Docker plugin貌似开始使用了新的v2 plugin了，legacy版本的plugin可以能在后期被废弃。**

从docker的源码**plugin/store.go**中可以看到：

```Go
/* allowV1PluginsFallback determines daemon's support for V1 plugins.
 * When the time comes to remove support for V1 plugins, flipping
 * this bool is all that will be needed.
 */
const allowV1PluginsFallback bool = true

/* defaultAPIVersion is the version of the plugin API for volume, network,
   IPAM and authz. This is a very stable API. When we update this API, then
   pluginType should include a version. e.g. "networkdriver/2.0".
*/
const defaultAPIVersion string = "1.0"
```

> 随着docker公司是的战略调整，推出了docker-CE和docker-EE之后，未来有些插件就可能要收费了，v2版本的插件都是在docker store中下载了，而这种插件在创建的时候都是打包成docker image，如果不开放源码的话，你即使pull下来插件也无法修改和导出的，**docker plugin目前没有导出接口**。

真正要开发一个docker plugin还是得看[docker plugin API](https://docs.docker.com/engine/extend/plugin_api/)，这篇文档告诉我们：

#### 插件发现

当你开发好一个插件**docker engine**怎么才能发现它们呢？有三种方式：

```markdown
- **.sock**，linux下放在/run/docker/plugins目录下，或该目录下的子目录比如[flocker](https://github.com/ClusterHQ/flocker)插件的`.sock`文件放在`/run/docker/plugins/flocker/flocker.sock`下
- **.spec**，比如**convoy**插件在`/etc/docker/plugins/convoy.spec `定义，内容为`unix:///var/run/convoy/convoy.sock`
- **.json**，比如**infinit**插件在`/usr/lib/docker/plugins/infinit.json `定义，内容为`{"Addr":"https://infinit.sh","Name":"infinit"}`
```

文章中的其它部分**貌似都过时**了，新的插件不是作为**systemd**进程运行的，而是完全通过**docker plugin**命令来管理的。

当你使用**docker plugin enable <plugin_name>**来激活了插件后，理应在`/run/docker/plugins`目录下生成插件的`.sock`文件，但是现在只有一个以runc ID命名的目录，这个问题下面有详细的叙述过程，你也可以跳过，直接看[issue-31723](https://github.com/docker/docker/issues/31723)

[docker plugin管理](https://docs.docker.com/engine/extend/)

### 创建sshfs volume plugin

[官方示例文档](https://github.com/docker/docker/blob/17.03.x/docs/extend/index.md#developing-a-plugin)（这个文档有问题）[docker-issue29886](https://github.com/docker/docker/issues/29886)

官方以开发一个**sshfs**的volume plugin为例。

执行`docker plugin create`命令的目录下必须包含以下内容：

- **config.json**文件，里面是插件的配置信息，[plugin config参考文档](https://github.com/docker/docker/blob/17.03.x/docs/extend/config.md)
- **rootfs**目录，插件镜像解压后的目录。v2版本的docker plugin都是以docker镜像的方式包装的。



```bash
$ git clone https://github.com/vieux/docker-volume-sshfs
$ cd docker-volume-sshfs
$ go get github.com/docker/go-plugins-helpers/volume
$ go build -o docker-volume-sshfs main.go  
$ docker build -t rootfsimage .
$ id=$(docker create rootfsimage true) # id was cd851ce43a403 when the image was created
$ sudo mkdir -p myplugin/rootfs
$ sudo docker export "$id" | sudo tar -x -C myplugin/rootfs
$ docker rm -vf "$id"
$ docker rmi rootfsimage
```

我们可以看到**sshfs**的Dockerfile是这样的：

```Dockerfile
FROM alpine

RUN apk update && apk add sshfs

RUN mkdir -p /run/docker/plugins /mnt/state /mnt/volumes

COPY docker-volume-sshfs docker-volume-sshfs

CMD ["docker-volume-sshfs"]
```

实际上是编译好的可执行文件复制到alpine linux容器中运行。

编译rootfsimage镜像的过程。

```bash
docker build -t rootfsimage .
Sending build context to Docker daemon 11.71 MB
Step 1/5 : FROM alpine
 ---> 4a415e366388
Step 2/5 : RUN apk update && apk add sshfs
 ---> Running in 1551ecc1c847
fetch http://dl-cdn.alpinelinux.org/alpine/v3.5/main/x86_64/APKINDEX.tar.gz
fetch http://dl-cdn.alpinelinux.org/alpine/v3.5/community/x86_64/APKINDEX.tar.gz
v3.5.2-2-ge626ce8c3c [http://dl-cdn.alpinelinux.org/alpine/v3.5/main]
v3.5.1-71-gc7bb9a04f0 [http://dl-cdn.alpinelinux.org/alpine/v3.5/community]
OK: 7959 distinct packages available
(1/10) Installing openssh-client (7.4_p1-r0)
(2/10) Installing fuse (2.9.7-r0)
(3/10) Installing libffi (3.2.1-r2)
(4/10) Installing libintl (0.19.8.1-r0)
(5/10) Installing libuuid (2.28.2-r1)
(6/10) Installing libblkid (2.28.2-r1)
(7/10) Installing libmount (2.28.2-r1)
(8/10) Installing pcre (8.39-r0)
(9/10) Installing glib (2.50.2-r0)
(10/10) Installing sshfs (2.8-r0)
Executing busybox-1.25.1-r0.trigger
Executing glib-2.50.2-r0.trigger
OK: 11 MiB in 21 packages
 ---> 1a73c501f431
Removing intermediate container 1551ecc1c847
Step 3/5 : RUN mkdir -p /run/docker/plugins /mnt/state /mnt/volumes
 ---> Running in 032af3b2595a
 ---> 30c7e8463e96
Removing intermediate container 032af3b2595a
Step 4/5 : COPY docker-volume-sshfs docker-volume-sshfs
 ---> a924c6fcc1e4
Removing intermediate container ffc5e3c97707
Step 5/5 : CMD docker-volume-sshfs
 ---> Running in 0dc938fe4f4e
 ---> 0fd2e3d94860
Removing intermediate container 0dc938fe4f4e
Successfully built 0fd2e3d94860
```

编写``config.json``文档

```Json
{
    "description": "sshFS plugin for Docker",
    "documentation": "https://docs.docker.com/engine/extend/plugins/",
    "entrypoint": [
        "/docker-volume-sshfs"
    ],
    "env": [
        {
            "name": "DEBUG",
            "settable": [
                "value"
            ],
            "value": "0"
        }
    ],
    "interface": {
        "socket": "sshfs.sock",
        "types": [
            "docker.volumedriver/1.0"
        ]
    },
    "linux": {
        "capabilities": [
            "CAP_SYS_ADMIN"
        ],
        "devices": [
            {
                "path": "/dev/fuse"
            }
        ]
    },
    "mounts": [
        {
            "destination": "/mnt/state",
            "options": [
                "rbind"
            ],
            "source": "/var/lib/docker/plugins/",
            "type": "bind"
        }
    ],
    "network": {
        "type": "host"
    },
    "propagatedmount": "/mnt/volumes"
}
```

该插件使用host网络类型，使用/run/docker/plugins/sshfs.sock接口与docker engine通信。

**注意官网上的这个文档有问题，config.json与代码里的不符，尤其是Entrypoint的二进制文件的位置不对。**

> 注意**socket**配置的地址不要写详细地址，默认会在/run/docker/plugins目录下生成socket文件。

**创建plugin**

使用``docker plugin create <plugin_name> /path/to/plugin/data/``命令创建插件。

具体到sshfs插件，在myplugin目录下使用如下命令创建插件：

```bash
docker plugin create jimmmysong/sshfs:latest .
```

现在就可以看到刚创建的插件了

```bash
docker plugin ls
ID                  NAME                 DESCRIPTION               ENABLED
8aa1f6098fca        jimmysong/sshfs:latest   sshFS plugin for Docker   true
```

**push plugin**

先登录你的docker hub账户，然后使用``docker plugin push jimmysong/sshfs:latest``即可以推送docker plugin到docker hub中。

目前推送到**harbor**镜像仓库有问题，报错信息：

```bash
c08c951b53b7: Preparing 
denied: requested access to the resource is denied
```

已给harbor提[issue-1532](https://github.com/vmware/harbor/issues/1532)

**plugin的使用**

有发现了个问题[docker issue-31723](https://github.com/docker/docker/issues/31723)，使用plugin创建volume的时候居然找不到`sshfs.sock`文件！😢刚开始手动创建plugin的时候测试了下是正常的，不知道为啥弄到这台测试机器上出问题了。

### 关于docker plugin enable失败的问题

当docker  plugin创建成功并enable的时候docker并没有报错，这与docker plugin的**activate**机制有关，只有当你最终使用该plugin的时候才会激活它。

使用**sshfs**插件创建volume。

```shell
docker volume create -d jimmysong/sshfs --name sshvolume -o sshcmd=1.2.3.4:/remote -o password=password
```

报错如下：

```bash
Error response from daemon: create sshvolume: Post http://%2Frun%2Fdocker%2Fplugins%2F8f7b8f931b38a4ef53d0e4f8d738e26e8f10ef8bd26c8244f4b8dcc7276b685f%2Fsshfs.sock/VolumeDriver.Create: dial unix /run/docker/plugins/8f7b8f931b38a4ef53d0e4f8d738e26e8f10ef8bd26c8244f4b8dcc7276b685f/sshfs.sock: connect: no such file or directory
```

Docker daemon在enable这个插件的时候会寻找这个**.sock**文件，然后在自己的plugindb中注册它，相关代码在这个文件里：

```http
https://github.com/docker/docker/blob/17.03.x/plugin/manager_linux.go
```

相关代码片段：

``` Go
func (pm *Manager) enable(p *v2.Plugin, c *controller, force bool) error {
	...
	return pm.pluginPostStart(p, c)
}

func (pm *Manager) pluginPostStart(p *v2.Plugin, c *controller) error {
    //这里需要获取.sock文件的地址 
    //pm.conifg.ExecRoot就是/run/docker/plugins
    //p.GetID()返回的就是很长的那串plugin ID
	sockAddr := filepath.Join(pm.config.ExecRoot, p.GetID(), p.GetSocket())
	client, err := plugins.NewClientWithTimeout("unix://"+sockAddr, nil, c.timeoutInSecs)
	if err != nil {
		c.restart = false
		shutdownPlugin(p, c, pm.containerdClient)
		return errors.WithStack(err)
	}

	p.SetPClient(client)

	maxRetries := 3
	var retries int
	for {
		time.Sleep(3 * time.Second)
		retries++

		if retries > maxRetries {
			logrus.Debugf("error net dialing plugin: %v", err)
			c.restart = false
			shutdownPlugin(p, c, pm.containerdClient)
			return err
		}

		// net dial into the unix socket to see if someone's listening.
		conn, err := net.Dial("unix", sockAddr)
		if err == nil {
			conn.Close()
			break
		}
	}
	pm.config.Store.SetState(p, true)
	pm.config.Store.CallHandler(p)

	return pm.save(p)
}
```

注意这段代码里的**sockAddr := filepath.Join(pm.config.ExecRoot, p.GetID(), p.GetSocket())**，我在上面添加了注释。

这个**.sock**文件应该有docker plugin来生成，具体怎样生成的呢？还以**docker-volume-ssh**这个插件为例。

整个项目就一个**main.go**文件，里面最后一行生成了**/run/docker/plugins/sshfs.sock**这个sock。

```
logrus.Error(h.ServeUnix(socketAddress, 0))
```

这行代码调用**docker/go-plugin-helpers/sdk/handler.go**中的:

```Go
// ServeUnix makes the handler to listen for requests in a unix socket.
// It also creates the socket file on the right directory for docker to read.
func (h Handler) ServeUnix(addr string, gid int) error {
	l, spec, err := newUnixListener(addr, gid)
	if err != nil {
		return err
	}
	if spec != "" {
		defer os.Remove(spec)
	}
	return h.Serve(l)
}

// Serve sets up the handler to serve requests on the passed in listener
func (h Handler) Serve(l net.Listener) error {
	server := http.Server{
		Addr:    l.Addr().String(),
		Handler: h.mux,
	}
	return server.Serve(l)
}
```

```Go
//unix_listener_unsupoorted.go
func newUnixListener(pluginName string, gid int) (net.Listener, string, error) {
	return nil, "", errOnlySupportedOnLinuxAndFreeBSD
}
```

看了上面这这些，你看出socket文件是怎么创建的吗？

这又是一个[issue-19](https://github.com/vieux/docker-volume-sshfs/issues/19)

如果你修改**config.json**文件，将其中的**interfaces - socket**指定为`/run/docker/plugins/sshfs.sock`然后创建plugin，则能成功生成socket文件，但是当你enable它的时候又会报错

```
Error response from daemon: Unix socket path "/run/docker/plugins/ac34f7b246ac6c029023b1ebd48e166eadcdd2c9d0cc682cadca0336951d72f7/run/docker/plugins/sshfs.sock" is too long
```

从docker daemon的日志里可以看到详细报错：

```bash
Mar 13 17:15:20 sz-pg-oam-docker-test-001.tendcloud.com dockerd[51757]: time="2017-03-13T17:15:20+08:00" level=info msg="standard_init_linux.go:178: exec user process caused \"no such file or directory\"" plugin=ac34f7b246ac6c029023b1ebd48e166eadcdd2c9d0cc682cadca0336951d72f7
Mar 13 17:15:20 sz-pg-oam-docker-test-001.tendcloud.com dockerd[51757]: time="2017-03-13T17:15:20.321277088+08:00" level=error msg="Sending SIGTERM to plugin failed with error: rpc error: code = 2 desc = no such process"
Mar 13 17:15:20 sz-pg-oam-docker-test-001.tendcloud.com dockerd[51757]: time="2017-03-13T17:15:20.321488680+08:00" level=error msg="Handler for POST /v1.26/plugins/sshfs/enable returned error: Unix socket path \"/run/docker/plugins/ac34f7b246ac6c029023b1ebd48e166eadcdd2c9d0cc682cadca0336951d72f7/run/docker/plugins/sshfs.sock\" is too long\ngithub.com/docker/docker/plugin.(*Manager).pluginPostStart\n\t/root/rpmbuild/BUILD/docker-engine/.gopath/src/github.com/docker/docker/plugin/manager_linux.go:84\ngithub.com/docker/docker/plugin.(*Manager).enable\n\t/root/rpmbuild/BUILD/docker-
```

正好验证了上面的**enable**代码，docker默认是到`/run/docker/plugins`目录下找**sshfs.sock**这个文件的。

我在docker daemon中发现一个很诡异的错误，

```bash
Mar 13 17:29:41 sz-pg-oam-docker-test-001.tendcloud.com dockerd[51757]: time="2017-03-13T17:29:41+08:00" level=info msg="standard_init_linux.go:178: exec user process caused \"no such file or directory\"" plugin=85760810b4850009fc965f5c20d8534dc9aba085340a2ac0b4b9167a6fef7d53
```

我查看了下

```http
github.com/libnetwork/vendor/github.com/opencontainers/run/libcontainer/standard_init_linux.go
```

文件，这个那个文件只有114行，见[ standard_init_linux.go](https://github.com/docker/libnetwork/blob/master/vendor/github.com/opencontainers/runc/libcontainer/standard_init_linux.go)

但是在**opencontainers**的github项目里才有那么多行，见 [standard_init_linux.go](https://github.com/opencontainers/runc/blob/master/libcontainer/standard_init_linux.go)

这个报错前后的函数是：

```Go
// PR_SET_NO_NEW_PRIVS isn't exposed in Golang so we define it ourselves copying the value
// the kernel
const PR_SET_NO_NEW_PRIVS = 0x26

func (l *linuxStandardInit) Init() error {
	if !l.config.Config.NoNewKeyring {
		ringname, keepperms, newperms := l.getSessionRingParams()

		// do not inherit the parent's session keyring
		sessKeyId, err := keys.JoinSessionKeyring(ringname)
		if err != nil {
			return err
		}
		// make session keyring searcheable
		if err := keys.ModKeyringPerm(sessKeyId, keepperms, newperms); err != nil {
			return err
		}
	}

...
	}
	if l.config.Config.Seccomp != nil && l.config.NoNewPrivileges {
         //下面这行是第178行
		if err := seccomp.InitSeccomp(l.config.Config.Seccomp); err != nil {
			return newSystemErrorWithCause(err, "init seccomp")
		}
	}
	// close the statedir fd before exec because the kernel resets dumpable in the wrong order
	// https://github.com/torvalds/linux/blob/v4.9/fs/exec.c#L1290-L1318
	syscall.Close(l.stateDirFD)
	if err := syscall.Exec(name, l.config.Args[0:], os.Environ()); err != nil {
		return newSystemErrorWithCause(err, "exec user process")
	}
	return nil
}
```

## ~~结论~~

~~到此了问题还没解决。~~

~~问题的关键是执行**docker create plugin**之后**.sock**文件创建到哪里去了？为什么在**config.json**指定成`/run/docker/plugins/sshfs.sock`就可以在指定的目录下创建出.sock文件，说明**创建socket的定义和get socket时寻找的路径不一样**，创建socket时就是固定在/run/docker/plugins目录下创建，而enable plugin的时候，Get socket的时候还要加上docker plugin的ID，可是按照官网的配置在本地create plugin后并没有在/run/docker/plugins目录下生成插件的socket文件，直到enable插件的时候才会生成以plugin ID命名的目录，但是socket文件没有！☹️~~



## 问题解决

之所以出现上面的那些问题，是因为create docker plugin的时候有问题，也就是那个二进制文件有问题，我在**Mac**上build的image，而且还没有用**Dockerfile.dev**这个专门用来搭建二进制文件编译环境的Dockerfile来创建golang的编译环境，虽然docker plugin是创建成功了，但是当docker plugin enable的时候，这个热紧张文件不能正确的运行，所以就没能生成**sshfs.sock**文件。

> 请在Linux环境下使用**make all**命令来创建plugin。

