## Aggregated API Server

Aggregated（聚合的）API  server是为了将原来的API server这个巨石（monolithic）应用给拆分成，为了方便用户开发自己的API server集成进来，而不用直接修改kubernetes官方仓库的代码，这样一来也能将API server解耦，方便用户使用实验特性。这些API server可以跟core API server无缝衔接，试用kubectl也可以管理它们。

### 架构

我们需要创建一个新的组件，名为`kube-aggregator`，它需要负责以下几件事：

- 提供用于注册API server的API
- 汇总所有的API server信息
- 代理所有的客户端到API server的请求

**注意**：这里说的API server是一组“API Server”，而不是说我们安装集群时候的那个API server，而且这组API server是可以横向扩展的。

关于聚合的API server的更多信息请参考：[Aggregated API Server](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/api-machinery/aggregated-api-servers.md)

### 安装配置聚合的API server

**编译**

下载kubernetes的源码到`$GOPATH/src/k8s.io/`目录，在`$GOPATH/src/k8s.io/kubernetes/staging/src/k8s.io/kube-aggregator`目录下编译生成Linux add64的二进制文件：

```bash
GOOS=linux GOARCH=amd64 go build
```

将在当前目录下生成`kube-aggregator`二进制文件。

**配置**

将该二进制文件上传到kubernetes的node节点上。

TBD