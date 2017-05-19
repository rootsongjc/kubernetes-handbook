# Docker-compose 

docker-compose是一个使用python编写的命令行工具，用于docker应用之间的编排，可以在单主机下使用，也可以使用在docker swarm集群或docker1.12+的swarm mode下。

docker1.13以前docker-compose是一个独立的安装的命令行工具，文档如下https://docs.docker.com/compose/overview/，下面要讲的是compose file，已经在docker1.13种集成了docker的应用编排功能，可以在提供了docker-compose.yml文件的情况下使用docker stack deploy -f docker-compose.yml直接部署应用。

## Compose file 

Docker compose file到目前共有3个版本，docker1.13使用的compose file v3版本。官方文档：https://docs.docker.com/compose/compose-file/

Compose file使用[yaml](yaml.org)格式定义，默认名称为docker-compose.yml。

Dockerfile中的``CMD``，``EXPOSE``，``VOLUME``，``ENV``命令可以不必在docker-compose.yml中再定义。

### build

build命令在docker swarm mode下使用docker stack deploy命令时是无效的，只有在本地使用docker-compose命令时才会创建image。

### ARGS

假如Dockerfile中有如下两个变量``$buildno``和``$password``

```dockerfile
ARG buildno
ARG password

RUN echo "Build number: $buildno"
RUN script-requiring-password.sh "$password"
```

docker-compose.yml中可以使用args来定义这两个变量的值。

```Yaml
build:
  context: .
  args:
    buildno: 1
    password: secret

build:
  context: .
  args:
    - buildno=1
    - password=secret
```

使用docker-compose build的时候就会替换这两个变量的值。

也可以忽略这两个变量。

```
args:
  - buildno
  - password
```

### command

```
command: bundle exec thin -p 3000
```

替换Dockerfile中默认的CMD。

### deploy

Compose file v3才支持的功能，也是重点功能。

```Yaml
deploy:
  replicas: 6
  update_config:
    parallelism: 2
    delay: 10s
  restart_policy:
    condition: on-failure
```

**deploy**有如下几个子选项

- **Mode**：可以为global或replicated，global能够规定服务在每台主机一个容器。replicated可以自定义service的容器个数。
- **replicas**：使用``replicas``定义service的容器个数，只有在replicated mode下可用。
- **placement**：用来限定容器部署在哪些主机上。使用``constraints``约束。
- **Update_config**：定义service升级策略。
  - Parrallism：一次性同时升级的容器数
  - delay：两次升级之间的间隔
  - failure_action：升级失败后可以pause或continue，默认pause
  - monitor：升级后监控failure的间隔，格式(ns|us|ms|s|m|h)，默认0s
  - max_failure_ratio：可容忍的失败率
- **resources**：service的资源数量限定，包括如下几个值`cpu_shares`, `cpu_quota`,`cpuset`, `mem_limit`, `memswap_limit`, `mem_swappiness`。
  - **restart_policy**：``condition``：one、on-failure、any默认any，``delay``，``max_attempts``，``window``
  - **labels**：为service打标签


### docker-compose.yml还支持的配置有

- **devices**：devices mapping
- **depends_on**：定义service依赖关系，影响启动顺序
- **dns**：自定义DNS，可以是单条也可以为列表
- **dns_search**：自定义DNS搜索域
- **tmpfs**：挂载临时文件系统
- **entrypoint**：覆盖dockerfile中国年的entrypoint
- **env_file**：定义env的文件，可以为一个列表
- **environment**：定义环境变量
- **expose**
- **external_links**：链接外部docker-compose.yml外部启动的容器
- **extra_hosts**：添加外部hosts
- **group_add**
- **healthcheck**：检查service的健康状况
- **Image**
- **Isolation**：linux只支持default，windows还有其他选项
- **labels**：给容器打标签，建议用DNS的反向字符串定义
- **links**：链接其他service
- **logging**：日志配置，可以配置日志的driver、地址等
- **network_mode**
- **networks**：可以连接的定义网络名称，分配IP地址，设置网络别名，``LINK_LOCAL_IPS``选项可以连接外部非docker管理的IP。还可以定义的选项有driver、driver_opts、enable_ipv6、ipam、internal、labels、external等
- **pid**
- **ports**：对外暴露的端口
- **secret**：定义service可以访问的secret文件
- **security_opts**
- **stop_grace_period**
- **stop_signal**
- **sysctls**
- **ulimits**
- **userns_mode**
- **volumes**：可以定义driver、driver_opts、external、labels等


networks和volumes的子选项比较多，定义的时候请参照详细文档。