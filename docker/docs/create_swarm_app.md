# 创建docker swarm应用

下面以docker官网上的创建[vote投票](https://docs.docker.com/engine/getstarted-voting-app/)示例来说明如何创建一个docker swarm的应用。

在进行如下步骤时，你需要保证已经部署并正常运行着一个docker swarm集群。

在这个应用中你将学到

- 通过创建``docker-stack.yml``和使用``docker stack deploy``命令来部署应用
- 使用``visualizer``来查看应用的运行时
- 更新``docker-stack.yml``和``vote``镜像重新部署和发布**vote** 应用
- 使用Compose Version 3

![vote-app-diagram](imgs/vote-app-diagram.png)

## 需要使用到的images

| Service   | 描述                                       | Base image                               |
| --------- | ---------------------------------------- | ---------------------------------------- |
| vote      | Presents the voting interface via port `5000`. Viewable at `:5000` | Based on a Python image, `dockersamples/examplevotingapp_vote` |
| result    | Displays the voting results via port 5001. Viewable at `:5001` | Based on a Node.js image, `dockersamples/examplevotingapp_result` |
| visulizer | A web app that shows a map of the deployment of the various services across the available nodes via port `8080`. Viewable at `:8080` | Based on a Node.js image, `dockersamples/visualizer` |
| redis     | Collects raw voting data and stores it in a key/value queue | Based on a `redis` image, `redis:alpine` |
| db        | A PostgreSQL service which provides permanent storage on a host volume | Based on a `postgres` image, `postgres:9.4` |
| worker    | A background service that transfers votes from the queue to permanent storage | Based on a .NET image, `dockersamples/examplevotingapp_worker` |

**用到的镜像有：**

- dockersamples/examplevotingapp_vote:before
- dockersamples/examplevotingapp_worker
- dockersamples/examplevotingapp_result:before
- dockersamples/visualizer:stable
- postgres:9.4
- redis:alpine

我们将这些images同步到我们的私有镜像仓库sz-pg-oam-docker-hub-001.tendcloud.com中。

镜像名称分别为：

- sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_vote:before
- sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_worker
- sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_result:before
- sz-pg-oam-docker-hub-001.tendcloud.com/library/visualizer:stable
- sz-pg-oam-docker-hub-001.tendcloud.com/library/postgres:9.4
- sz-pg-oam-docker-hub-001.tendcloud.com/library/redis:alpine

## 使用V3版本的compose文件##

[v3版本的compose与v2版本的区别](compose_v2v3.md)

docker-stack.yml配置

```Yaml
version: "3"
services:

  redis:
    image: sz-pg-oam-docker-hub-001.tendcloud.com/library/redis:alpine
    ports:
      - "6379"
    networks:
      - frontend
    deploy:
      replicas: 2
      update_config:
        parallelism: 2
        delay: 10s
      restart_policy:
        condition: on-failure
  db:
    image: sz-pg-oam-docker-hub-001.tendcloud.com/library/postgres:9.4
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - backend
    deploy:
      placement:
        constraints: [node.role == manager]
  vote:
    image: sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_vote:before
    ports:
      - 5000:80
    networks:
      - frontend
    depends_on:
      - redis
    deploy:
      replicas: 2
      update_config:
        parallelism: 2
      restart_policy:
        condition: on-failure
  result:
    image: sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_result:before
    ports:
      - 5001:80
    networks:
      - backend
    depends_on:
      - db
    deploy:
      replicas: 2
      update_config:
        parallelism: 2
        delay: 10s
      restart_policy:
        condition: on-failure

  worker:
    image: sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_worker
    networks:
      - frontend
      - backend
    deploy:
      mode: replicated
      replicas: 1
      labels: [APP=VOTING]
      restart_policy:
        condition: on-failure
        delay: 10s
        max_attempts: 3
        window: 120s

  visualizer:
    image: sz-pg-oam-docker-hub-001.tendcloud.com/library/visualizer:stable
    ports:
      - "8080:8080"
    stop_grace_period: 1m30s
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
    deploy:
      placement:
        constraints: [node.role == manager]

networks:
  frontend:
  backend:

volumes:
  db-data:
```

## 部署##

使用docker stack deploy命令部署vote应用。

```
$docker stack deploy -c docker-stack.yml vote
Creating network vote_backend
Creating network vote_frontend
Creating network vote_default
Creating service vote_db
Creating service vote_vote
Creating service vote_result
Creating service vote_worker
Creating service vote_visualizer
Creating service vote_redis
```

使用``docker stack deploy``部署的应用中的images必须是已经在镜像仓库中存在的，而不能像之前的docker-compose up一样，可以通过本地构建镜像后启动。

使用``docker stack service vote``查看应用状态

```
$docker stack services vote
ID            NAME             MODE        REPLICAS  IMAGE
5bte3o8e0ta9  vote_result      replicated  2/2       sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_result:before
h65a6zakqgq3  vote_worker      replicated  1/1       sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_worker:latest
k7xzd0adhh52  vote_db          replicated  1/1       sz-pg-oam-docker-hub-001.tendcloud.com/library/postgres:9.4
pvvi5qqcsnag  vote_vote        replicated  2/2       sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_vote:before
z4q2gnvoxtpj  vote_redis       replicated  2/2       sz-pg-oam-docker-hub-001.tendcloud.com/library/redis:alpine
zgiuxazk4ssc  vote_visualizer  replicated  1/1       sz-pg-oam-docker-hub-001.tendcloud.com/library/visualizer:stable
```

使用``docker stack ls``和``docker stack ps vote``查看stack的状态

```
$docker stack ls
NAME  SERVICES
vote  6
$docker stack ps vote
ID            NAME               IMAGE                                                                          NODE                                     DESIRED STATE  CURRENT STATE          ERROR                      PORTS
tcyy62bs26sp  vote_worker.1      sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_worker:latest  sz-pg-oam-docker-test-003.tendcloud.com  Running        Running 4 minutes ago                             
tfa84y1yz00j  vote_redis.1       sz-pg-oam-docker-hub-001.tendcloud.com/library/redis:alpine                    sz-pg-oam-docker-test-002.tendcloud.com  Running        Running 5 minutes ago                             
4yrp8e2pucnu  vote_visualizer.1  sz-pg-oam-docker-hub-001.tendcloud.com/library/visualizer:stable               sz-pg-oam-docker-test-001.tendcloud.com  Running        Running 5 minutes ago                             
zv4dan0n9zo3  vote_worker.1      sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_worker:latest  sz-pg-oam-docker-test-003.tendcloud.com  Shutdown       Failed 4 minutes ago   "task: non-zero exit (1)"  
mhbf683hiugr  vote_result.1      sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_result:before  sz-pg-oam-docker-test-001.tendcloud.com  Running        Running 5 minutes ago                             
slf6je49r4v1  vote_vote.1        sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_vote:before    sz-pg-oam-docker-test-002.tendcloud.com  Running        Running 5 minutes ago                             
mqypecrgriyq  vote_db.1          sz-pg-oam-docker-hub-001.tendcloud.com/library/postgres:9.4                    sz-pg-oam-docker-test-001.tendcloud.com  Running        Running 4 minutes ago                             
6n7856nsvavn  vote_redis.2       sz-pg-oam-docker-hub-001.tendcloud.com/library/redis:alpine                    sz-pg-oam-docker-test-003.tendcloud.com  Running        Running 5 minutes ago                             
pcrfnm20jf0r  vote_result.2      sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_result:before  sz-pg-oam-docker-test-002.tendcloud.com  Running        Running 4 minutes ago                             
ydxurw1jnft6  vote_vote.2        sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_vote:before    sz-pg-oam-docker-test-003.tendcloud.com  Running        Running 5 minutes ago   
```

## 检查##

当vote应用成功部署后，在浏览器中访问visualizer所部属到的主机的8080端口http://sz-pg-oam-docker-hub-001.tendcloud.com:8080可以看到如下画面：

![visualizer.jpg](imgs/visualizer.jpg)

Visualizer用于显示服务和主机的状态。

**投票界面**

在浏览器中访问``examplevotingapp_vote``所部属到的主机的5000端口http://sz-pg-oam-docker-hub-001.tendcloud.com:5000可以看到如下画面：

![vote_web](imgs/vote_web.jpg)

给猫投一票。![cat](imgs/cat.jpg)

**结果界面**

在浏览器中访问``examplevotingapp_result``所部属到的主机的5001端口http://sz-pg-oam-docker-hub-001.tendcloud.com:5001可以看到如下画面.

![vote_result](imgs/vote_result.jpg)



##总结##

至此整个应用已经完整的部署在docker上了，并验证正常运行。

怎么样，是用docker来部署一个应用是不是很简单？

其实后期的维护、升级、扩展都很简单，后面会详细的说明。