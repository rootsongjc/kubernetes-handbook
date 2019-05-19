---
date: "2017-03-15T12:09:26+08:00"
title: "Docker 17.03-CE create plugin源码解析"
draft: false
categories: "docker"
tags: ["docker","go"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20160403050.jpg", desc: "故宫 Apr 3,2016"}]
---

继续上一篇[Docker17.03-CE插件开发的🌰](https://jimmysong.io/posts/docker-plugin-develop/)，今天来看下**docker create plugin**的源码。

**cli/command/plugin/create.go**

Docker命令行`docker plugin create`调用的，使用的是[cobra](http://github.com/spf13/cobra)，这个命令行工具开发包很好用，推荐下。

执行这两个函数

```go
func newCreateCommand(dockerCli *command.DockerCli) *cobra.Command 
//调用下面的函数，拼装成URL调用RESTful API接口
func runCreate(dockerCli *command.DockerCli, options pluginCreateOptions) error {
  ...
  if err = dockerCli.Client().PluginCreate(ctx, createCtx, createOptions); err != nil {
		return err
	}
  ...
}
```

我们再看下下面的这个文件：

```http
api/server/router/plugin/plugin_routes.go
```

```go
func (pr *pluginRouter) createPlugin(ctx context.Context, w http.ResponseWriter, r *http.Request, vars map[string]string) error {
  ...
  if err := pr.backend.CreateFromContext(ctx, r.Body, options); err != nil {
		return err
	}
  ...
}
```

**createPlugin**这个方法定义在api/server/route/plugin/backen.go的**Backend**接口中。

**PluginCreate**这个方法定义在docker/docker/client/Interface.go的**PluginAPIClient**接口中。

**docker/client/plugin_create.go**

```go
// PluginCreate creates a plugin
func (cli *Client) PluginCreate(ctx context.Context, createContext io.Reader, createOptions types.PluginCreateOptions) error {
	headers := http.Header(make(map[string][]string))
	headers.Set("Content-Type", "application/x-tar")

	query := url.Values{}
	query.Set("name", createOptions.RepoName)

	resp, err := cli.postRaw(ctx, "/plugins/create", query, createContext, headers)
	if err != nil {
		return err
	}
	ensureReaderClosed(resp)
	return err
}
```

plugin在后端接收到请求后会执行下面的方法。最终**create plugin**的实现在plugin/backend_linux.go下：

```go
// CreateFromContext creates a plugin from the given pluginDir which contains
// both the rootfs and the config.json and a repoName with optional tag.
func (pm *Manager) CreateFromContext(ctx context.Context, tarCtx io.ReadCloser, options *types.PluginCreateOptions) (err error) {}
```

至于docker create plugin时docker后台究竟做了什么，就看👆那个文件。

