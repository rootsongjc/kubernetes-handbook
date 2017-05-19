# Flocker 

docker Flocker

https://github.com/ClusterHQ/flocker/

文档:

https://docs.clusterhq.com/en/latest/docker-integration/

docker swarm 部署 Flocker

https://docs.clusterhq.com/en/latest/docker-integration/manual-install.html

CentOS 7 安装 flocker-cli

需要 python 2.7

yum install gcc libffi-devel git

[root@swarm-master ~]# git clone https://github.com/ClusterHQ/flocker

[root@swarm-master ~]# cd flocker

[root@swarm-master flocker]# pip install -r requirements/all.txt

[root@swarm-master flocker]# python setup.py install

[root@swarm-master flocker]# flocker-ca --version
1.14.0+1.g40433b3

 

CentOS 7 安装 flocker node 在每个节点中

[root@swarm-node-1 ~]# yum list installed clusterhq-release || yum install -y https://clusterhq-archive.s3.amazonaws.com/centos/clusterhq-release$(rpm -E %dist).noarch.rpm
[root@swarm-node-1 ~]# yum install -y clusterhq-flocker-node
[root@swarm-node-1 ~]# yum install -y clusterhq-flocker-docker-plugin

在 管理节点 与 node 节点 创建 flocker 配置目录

mkdir /etc/flocker

[root@swarm-master ~]# cd /etc/flocker

一、生成 flocker 管理服务器 证书
[root@swarm-master flocker]# flocker-ca initialize cnflocker
Created cluster.key and cluster.crt. Please keep cluster.key secret, as anyone who can access it will be able to control your cluster.

二、生成 flocker 控制节点 证书

官方 建议使用 hostname, 而不使用IP, 我这里暂时使用 IP

[root@swarm-master flocker]# flocker-ca create-control-certificate 172.16.1.25

 

拷贝 control-172.16.1.25.crt control-172.16.1.25.key cluster.crt 三个文件到 控制节点 中

注意：cluster.key 文件为 key 文件，只保存在本机，或者管理服务器 (我这里 管理服务器 与 控制节点 为同一台服务器)

[root@swarm-master flocker]# scp control-172.16.1.25.crt 172.16.1.25:/etc/flocker

[root@swarm-master flocker]# scp control-172.16.1.25.key 172.16.1.25:/etc/flocker

[root@swarm-master flocker]# scp cluster.crt 172.16.1.25:/etc/flocker

重命名 刚复制过来的 control-172.16.1.25.key control-172.16.1.25.crt

[root@swarm-master flocker]# mv control-172.16.1.25.crt control-service.crt
[root@swarm-master flocker]# mv control-172.16.1.25.key control-service.key

设置 权限

[root@swarm-master flocker]# chmod 0700 /etc/flocker
[root@swarm-master flocker]# chmod 0600 /etc/flocker/control-service.key

 

三、生成 flocker node节点 证书 ， 每个节点都必须生成一个不一样的证书

[root@swarm-master flocker]# flocker-ca create-node-certificate
Created 6cc5713a-4976-4545-bf61-3686f182ae50.crt. Copy it over to /etc/flocker/node.crt on your node machine and make sure to chmod 0600 it.

复制 6cc5713a-4976-4545-bf61-3686f182ae50.crt 6cc5713a-4976-4545-bf61-3686f182ae50.key cluster.crt 到 flocker node 节点 /etc/flocker 目录中

[root@swarm-master flocker]# scp 6cc5713a-4976-4545-bf61-3686f182ae50.crt 172.16.1.28:/etc/flocker
[root@swarm-master flocker]# scp 6cc5713a-4976-4545-bf61-3686f182ae50.key 172.16.1.28:/etc/flocker
[root@swarm-master flocker]# scp cluster.crt 172.16.1.28:/etc/flocker

登陆 node 节点 重命名 crt 与 key 文件 为 node.crt node.key

[root@swarm-node-1 flocker]# mv 6cc5713a-4976-4545-bf61-3686f182ae50.crt node.crt
[root@swarm-node-1 flocker]# mv 6cc5713a-4976-4545-bf61-3686f182ae50.key node.key

[root@swarm-node-1 flocker]# chmod 0700 /etc/flocker
[root@swarm-node-1 flocker]# chmod 0600 /etc/flocker/node.key

四、生成 Flocker Plugin for Docker 客户端 API

[root@swarm-master flocker]# flocker-ca create-api-certificate plugin
Created plugin.crt. You can now give it to your API enduser so they can access the control service API.

复制 plugin.crt plugin.key 到 flocker node 节点 /etc/flocker 目录中。
[root@swarm-master flocker]# scp plugin.crt 172.16.1.28:/etc/flocker/ 
[root@swarm-master flocker]# scp plugin.key 172.16.1.28:/etc/flocker/

 

五、 控制节点 运行 flocker Service

[root@swarm-master flocker]# systemctl enable flocker-control
[root@swarm-master flocker]# systemctl start flocker-control

六、 配置 node 节点 以及 后端存储

在每个节点 新增 配置文件

[root@swarm-node-1 flocker]# vi /etc/flocker/agent.yml

\---------------------------------------------------------------------------------------------------

"version": 1
"control-service":
"hostname": "172.16.1.25"
"port": 4524

\# The dataset key below selects and configures a dataset backend (see below: aws/openstack/etc).
\# # All nodes will be configured to use only one backend

dataset:
backend: "aws"
region: "<your region; for example, us-west-1>"
zone: "<your availability zone; for example, us-west-1a>"
access_key_id: "<AWS API key identifier>"
secret_access_key: "<Matching AWS API key>"
\---------------------------------------------------------------------------------------------------

 

dataset 为后端存储的设置选项。

后端存储支持列表: https://docs.clusterhq.com/en/latest/flocker-features/storage-backends.html#supported-backends

 

七、 node 节点 运行 flocker-agent 与 flocker-docker-plugin

[root@swarm-node-1 flocker]# systemctl enable flocker-dataset-agent
[root@swarm-node-1 flocker]# systemctl start flocker-dataset-agent
[root@swarm-node-1 flocker]# systemctl enable flocker-container-agent
[root@swarm-node-1 flocker]# systemctl start flocker-container-agent

[root@swarm-node-1 flocker]# systemctl enable flocker-docker-plugin
[root@swarm-node-1 flocker]# systemctl restart flocker-docker-plugin

八、 docker volume-driver 测试

[root@swarm-master]# docker run -v apples:/data --volume-driver flocker busybox sh -c "echo hello > /data/file.txt"

[root@swarm-master]# docker run -v apples:/data --volume-driver flocker busybox sh -c "cat /data/file.txt"

