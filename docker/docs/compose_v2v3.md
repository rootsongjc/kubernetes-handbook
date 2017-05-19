# Compose文件v3和v2版本的区别

Docker Compose `v3` 和 `v2` 模板文件都采用yaml格式，但是语法上存在一定差距

首先，使用`version: "3"` 或 `version: "3.1"` (Docker 1.13.1) 作为版本声明

其次，由于 Swarm mode 中网络的特殊性，Compose模板中一些声明比如 `expose` 和 `links` 会被忽略。注意：不能再使用 link 定义的网络别名来进行容器互联，可以使用服务名连接。

另外， `volumes_from` 不再支持，只能使用命名数据卷来实现容器数据的持久化和共享；

v3 中引入了 `deploy` 指令，可对Swarm mode中服务部署的进行细粒度控制，包括

- `resources`：定义  `cpu_shares`, `cpu_quota`, `cpuset`, `mem_limit`, `memswap_limit` 等容器资源控制。（v1/v2中相应指令不再支持）
- `mode`：支持 `global` 和 `replicated` (缺省) 模式的服务；
- `replicas`：定义 `replicated` 模式的服务的复本数量
- `placement`：定义服务容器的部署放置约束条件
- `update_config`：定义服务的更新方式
- `restart_policy`：定义服务的重启条件 （v1/v2中`restart`指令不再支持）
- `service`：定义服务的标签


虽然 Docker CLI 已经提供了对Docker Compose v3模板的支持。但是 Docker Compose 依然可以作为一个开发工具独立使用，并同时继续支持v1/v2/v2.1等版本已有编排模板。但是当利用 `docker-compose up` 或 `docker-compose run` 来部署v3模板时，模板中的 `deploy` 指令将被忽略

Docker CLI只支持v3模板，但是不支持模板中的 `build` 指令，只允许构建好的镜像来启动服务的容器。