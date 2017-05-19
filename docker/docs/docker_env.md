# Docker环境配置

**软件环境**

- Docker1.13.1
- docker-compose 1.11.1
- centos 7.3.1611

如果在Mac上安装后docker后需要从docker hub上下载镜像，建议设置国内的mirror，能够显著增加下载成功率，提高下载速度，~~推荐[daocloud的mirror](https://www.daocloud.io/mirror#accelerator-doc)~~推荐使用阿里云的mirror，速度比较快一些。

设置方式很简单，只需要在Mac版本的docker - preferences - daemon - registry mirrors中增加一条阿里云的加速器地址即可。

**硬件环境**

| Hostname                                | IP           | Role                |
| --------------------------------------- | ------------ | ------------------- |
| sz-pg-oam-docker-test-001.tendcloud.com | 172.20.0.113 | Swarm leader/worker |
| sz-pg-oam-docker-test-002.tendcloud.com | 172.20.0.114 | Worker              |
| sz-pg-oam-docker-test-003.tendcloud.com | 172.20.0.115 | Worker              |

**网络环境**

- Swarm内置的overlay网络，不需要单独安装
- *mynet自定义网络(TBD)，目前没有在docker中使用*

**Docker配置文件修改**

修改docke让配置文件``/usr/lib/systemd/system/docker.service``

```
ExecStart=/usr/bin/dockerd --insecure-registry=sz-pg-oam-docker-hub-001.tendcloud.com -H tcp://0.0.0.0:2375 -H unix:///var/run/docker.sock
```

修改好后

```
systemctl daemon-reload
systemctl restart docker
```



