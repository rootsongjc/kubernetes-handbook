# 使用 Drone 进行持续构建与发布

[Drone](https://drone.io) 是一个用 Go 语言开发的基于容器运行的持续集成软件。

## 配置 GitHub

使用 Drone 对 GitHub 上的代码进行持续构建与发布，需要首先在 GitHub 上设置一个 OAuth，如下：

**1. 在 Github 上创建一个新的 OAtuh 应用 **

访问 [此页面](https://github.com/settings/applications/new)，创建新的 OAuth 应用。

![OAuth 注册](../images/github-oauth-register.jpg)

填写应用程序的地址，因为是在本地与行，所以我们都填 `http://localhost`。

**2. 获取 OAtuh Client ID 和 Client Secret**

在注册完成后就可以获得如下图所示的 OAuth Client ID 和 Client Secret，保存下来，我们后面要用到。

![OAuth key](../images/github-oauth-drone-key.jpg)

## 使用 docker-compose 单机运行

我们在本地环境，使用 docker-compose，按照 [Drone 官方安装文档](http://docs.drone.io/installation/) 安装配置 Drone。

我们将代码托管在 GitHub 上，需要 Drone 可以持续集成和发布 GitHub 的代码，因此需要修改 `docker-compose.yaml` 文件中的 GitHub 配置。

```yaml
version: '2'

services:
  drone-server:
    image: drone/drone:0.8

    ports:
      - 80:8000
      - 9000
    volumes:
      - /var/lib/drone:/var/lib/drone/
    restart: always
    environment:
      - DRONE_OPEN=true
      - DRONE_HOST=${DRONE_HOST}
      - DRONE_GITHUB=true
      - DRONE_GITHUB_CLIENT=${DRONE_GITHUB_CLIENT}
      - DRONE_GITHUB_SECRET=${DRONE_GITHUB_SECRET}
      - DRONE_SECRET=${DRONE_SECRET}

  drone-agent:
    image: drone/agent:0.8

    command: agent
    restart: always
    depends_on:
      - drone-server
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - DRONE_SERVER=drone-server:9000
      - DRONE_SECRET=${DRONE_SECRET}
```

- `/var/lib/drone` 是在本地挂载的目录，请确保该目录已存在，且可以被 docker 访问到，Mac 下可以在 docker 的共享目录中配置。
- `DRONE_SECRET` 可以是一个随机的字符串，要确保 `drone-server` 与 `drone-client` 的 `DRONE_SECRET` 相同。
- `DRONE_GITHUB_CLIENT` 和 `DRONE_GITHUB_SECRET` 即在前面申请的 OAuth 的 Client ID 和 Client Secret。

### 启动 Drone

使用下面的命令在本地启动 drone：

```bash
docker-compose up
```

这样是在前台启动，加上`-d` 参数就可以在后台启动。

访问 `http://localhost` 可以看到登陆画面。

![Drone 登陆界面](../images/drone-login-github.jpg)

授权后可以看到 GitHub repo 设置。

![Github 启用 repo 设置](../images/drone-github-active.jpg)

![Github 单个 repo 设置](../images/drone-github-repo-setting.jpg)

## 参考

- [harness/drone - github.com](https://github.com/harness/drone)
- [Drone 搭配 Kubernetes 升級應用程式版本 - blog.wu-boy.com](https://blog.wu-boy.com/2017/10/upgrade-kubernetes-container-using-drone/)
