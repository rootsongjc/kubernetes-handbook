# Swarm mode路由网络

原文链接：[Use swarm mode routing mesh](https://docs.docker.com/engine/swarm/ingress/)

Swarm mode的``ingress``网络，分布于整个swarm集群，每台swarm node上都有这两个端口：

- 7946 TCP/UDP 容器网络发现
- 4789 UDP 容器ingress网络

## 服务端口发布

命令格式

```Shell
$ docker service create \
  --name <SERVICE-NAME> \
  --publish <PUBLISHED-PORT>:<TARGET-PORT> \
  <IMAGE>
```

示例

```shell
$ docker service create \
  --name my-web \
  --publish 9999:80 \
  --replicas 2 \
  nginx
```

容器内部监听端口80，发布到swarm node的端口是8080。

访问swarm mode任意一个主机的8080端口都可以访问到该serivce。即使这台主机上没有运行``my-web``service的实例，因为有swarm load balancer。如下图所示：

![service ingress image](https://docs.docker.com/engine/swarm/images/ingress-routing-mesh.png)

向已有的service添加publish port。

```Shell
docker service update --publish-add 9998:80 my-web
```

添加publish端口后似乎没有什么作用，同时

```
#docker service update --publish-rm 9999:80 my-web
Error response from daemon: rpc error: code = 2 desc = update out of sequence
```

报错。

```shell
# docker service inspect --format="{{json .Endpoint.Spec.Ports}}" my-web
[{"Protocol":"tcp","TargetPort":80,"PublishedPort":9998,"PublishMode":"ingress"},{"Protocol":"tcp","TargetPort":80,"PublishedPort":9999,"PublishMode":"ingress"}]
```

**TODO**似乎是update失败？

再``docker service inspect my-web``会发现

```
       "UpdateStatus": {
            "State": "updating",
            "StartedAt": "2017-02-23T08:00:51.948871008Z",
            "CompletedAt": "1970-01-01T00:00:00Z",
            "Message": "update in progress"
        }
```

原来的9999端口依然可以访问。

```
# docker service ps my-web
ID            NAME          IMAGE                                                     NODE                                     DESIRED STATE  CURRENT STATE            ERROR  PORTS
wbzzlq3ajyjq  my-web.1      sz-pg-oam-docker-hub-001.tendcloud.com/library/nginx:1.9  sz-pg-oam-docker-test-002.tendcloud.com  Running        Running 44 minutes ago          
4h2tcxjtgumv  my-web.2      sz-pg-oam-docker-hub-001.tendcloud.com/library/nginx:1.9                                           Running        New 39 minutes ago              
w0y1l3x94ox3   \_ my-web.2  sz-pg-oam-docker-hub-001.tendcloud.com/library/nginx:1.9  sz-pg-oam-docker-test-003.tendcloud.com  Shutdown       Shutdown 39 minutes ago     
```



## 使用外部Load Balancer

可以使用HAProxy做nginx的负载均衡。

![ingress with external load balancer image](https://docs.docker.com/engine/swarm/images/ingress-lb.png)

修改HAProxy的配置文件/etc/haproxy/haproxy.cfg

```
global
        log /dev/log    local0
        log /dev/log    local1 notice
...snip...

# Configure HAProxy to listen on port 80
frontend http_front
   bind *:80
   stats uri /haproxy?stats
   default_backend http_back

# Configure HAProxy to route requests to swarm nodes on port 8080
backend http_back
   balance roundrobin
   server node1 192.168.99.100:8080 check
   server node2 192.168.99.101:8080 check
   server node3 192.168.99.102:8080 check
```

当访问80端口时会自动LB到三台node上。