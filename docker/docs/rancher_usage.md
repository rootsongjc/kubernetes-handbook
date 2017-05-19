# Rancher的部署和使用

Rancher是一个企业级的容器管理平台，支持Swarm、kubernetes和rancher自研的cattle调度平台。

Rancher可以直接使用容器部署，部署起来非常简单。

在可以联网的主机里直接执行

运行ranche server

```shell
sudo docker run -d --restart=unless-stopped -p 8080:8080 rancher/server
```

运行rancher agent

```
sudo docker run -d --restart=unless-stopped -p 8080:8080 rancher/agent
```

对于无法联网的主机先将镜像下载到本地然后上传到服务器上。

```Shell
docker pull rancher/server
docker pull rancher/agent
docker image save rancher/server:latest>rancher.tar
docker image save rancher/agent:latest>rancher.tar
```

**查看镜像版本**

默认下载和使用的是latest版本的的rancher镜像，想查看具体的镜像版本，可以使用``docker inspect rancher/server|grep VERSION``命令查看server的版本，使用``docker inspect rancher/agent|grep IMAGE``查看agent版本，版本信息是做为镜像的ENV保存的，如：

```
docker inspect rancher/server|grep VERSION
"CATTLE_RANCHER_SERVER_VERSION=v1.4.1",
"CATTLE_RANCHER_COMPOSE_VERSION=v0.12.2",
"CATTLE_RANCHER_CLI_VERSION=v0.4.1",
"CATTLE_CATTLE_VERSION=v0.176.9",
"CATTLE_RANCHER_SERVER_VERSION=v1.4.1",
"CATTLE_RANCHER_COMPOSE_VERSION=v0.12.2",
"CATTLE_RANCHER_CLI_VERSION=v0.4.1",
"CATTLE_CATTLE_VERSION=v0.176.9",
```

```
docker inspect rancher/agent|grep IMAGE  
"RANCHER_AGENT_IMAGE=rancher/agent:v1.1.0"
"ENV RANCHER_AGENT_IMAGE=rancher/agent:v1.1.0"
"RANCHER_AGENT_IMAGE=rancher/agent:v1.1.0"
```

我们可以看到rancher server的版本是v1.4.1，默认rancher agent的latest版本是v1.1.0，我们这里使用v1.2.0，所有在pull rancher/agent的时候需要制定版本为v1.2.0 ``docker pull rancher/agent:v1.2.0``

更多资料参考最新版本的Rancher文档：http://docs.rancher.com/rancher/v1.4/en/

**启动Rancher**

在主机sz-pg-oam-docker-test-001.tendcloud.com上执行以下命令启动Rancher server

```Shell
$ sudo docker run -d --restart=unless-stopped -p 8080:8080 rancher/server
```

启动完成后可以在浏览器中登录该主机IP:8080看到rancher server的登陆页面，如图：

![rancher_login](../docs/imgs/rancher_login.jpg)



登录后请即使设置access control。

Server启动完成后可以向Rancher中添加主机，



