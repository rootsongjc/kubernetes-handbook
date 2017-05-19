# Swarm应用管理

## 应用更新

继续前面的**vote**应用。

加入我们更新了vote应用的result和vote镜像代码重新构建了新镜像，修改``docker-stack.yml``文件，将其中的``sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_vote:before``和``sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_result:before``分别修改为``sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_vote:after``和``sz-pg-oam-docker-hub-001.tendcloud.com/library/examplevotingapp_result:after``，相当于要上线新版本，可以进行如下操作：

```
$docker stack deploy --compose-file docker-stack.yml vote
Updating service vote_result (id: 5bte3o8e0ta98mpp80c51ro5z)
Updating service vote_worker (id: h65a6zakqgq3dd2cfgco1t286)
Updating service vote_visualizer (id: zgiuxazk4sscyjj0ztcmvqnxf)
Updating service vote_redis (id: z4q2gnvoxtpjv7e9q4s5p1ovs)
Updating service vote_db (id: k7xzd0adhh5223fbsspouryxs)
Updating service vote_vote (id: pvvi5qqcsnaghadu0w6c82pd3)
```

再次访问投票和结果页面，会看到投票选项已经变成了JAVA、.NET。投票结果页面会显示刚才投票的结果。

官方的完整示例文档地址：https://github.com/docker/labs/blob/master/beginner/chapters/votingapp.md

## 滚动升级

创建service的时候可以指定``—update-delay``参数，可以为10m23s这样写法，表示执行update的间隔是10分钟23秒。也可以用``--update-parallelism``参数指定并发update数量。

```
$ docker service create \
  --replicas 3 \
  --name redis \
  --update-delay 10s \
  redis:3.0.6

0u6a4s31ybk7yw2wyvtikmu50
```

update service的时候需要指定镜像名。

```$ docker service update --image redis:3.0.7 redis
$ docker service update --image redis:3.0.7 redis
redis
```

滚动升级的时候也可以指定升级策略，默认是：

- 停止第一个task
- 调度update task到刚停止的那个task上
- 启动刚调度的那个task
- 如果刚调度的那个task返回RUNNING状态，则等到udpate delay时间后停止下一个task
- 如果每次update都失败，则返回FAILED

