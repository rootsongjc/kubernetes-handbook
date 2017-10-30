# 构建私有Chart仓库

使用Chart便于封装和管理kubernetes中的应用，因此当企业内部的应用多了以后，互相依赖、部署环境复杂之后，原先的直接使用yaml文件的管理方式已经不再适应生产的需要，因此我们有必要构建自己的chart仓库。

## 什么是Chart

Chart是helm管理的应用的打包格式。它包括如下特征：

- Chart中包括一系列的yaml格式的描述文件。
- 一个Chart只用来部署单个的应用的，不应该过于复杂，不应该包含多个依赖，相当于一个微服务。

Chart有特定的目录结构，可以打包起来进行版本控制。

### Chart的组成结构

```
wordpress/
  Chart.yaml          # A YAML file containing information about the chart
  LICENSE             # OPTIONAL: A plain text file containing the license for the chart
  README.md           # OPTIONAL: A human-readable README file
  requirements.yaml   # OPTIONAL: A YAML file listing dependencies for the chart
  values.yaml         # The default configuration values for this chart
  charts/             # OPTIONAL: A directory containing any charts upon which this chart depends.
  templates/          # OPTIONAL: A directory of templates that, when combined with values,
                      # will generate valid Kubernetes manifest files.
  templates/NOTES.txt # OPTIONAL: A plain text file containing short usage notes
```

### 依赖管理

有两种方式来管理chart的依赖。

- 直接在本的chart的`charts`目录下定义
- 通过在`requirements.yaml`文件中定义依赖的chart

在每个chart的`charts`目录下可以定义依赖的子chart。子chart有如下特点：

- 无法访问父chart中的配置
- 父chart可以覆盖子chart中的配置

## Chart仓库



## 构建Monocular UI

参考 [Monocular UI](Monocular UI) 构建UI。

克隆项目到本地

```bash
git clone https://github.com/kubernetes-helm/monocular.git
```

### 依赖环境

- [Angular 2](https://angular.io/)
- [angular/cli](https://github.com/angular/angular-cli) 
- Typescript
- Sass
- [Webpack](https://webpack.github.io/)
- Bootstrap

在`monoclar/scr/ui`目录下执行以下命令安装依赖：

```bash
yarn install
npm install -g @angular/cli
npm install -g typescript
npm install -g webpack
```

## 运行

### 使用docker-compose

最简单的运行方式使用[docker-compose](https://docs.docker.com/compose/)：

```bash
docker-comopse up
```

该命令需要用到如下镜像：

- bitnami/mongodb:3
- bitnami/node:8
- quay.io/deis/go-dev:v1.5.0

会有一个很长的build过程，构建失败。

### 使用helm

首先需要已在本地安装了helm，并在kubernetes集群中安装了tiller，见[使用helm管理kubernetes应用](helm.md)。

```bash
# 需要安装nginx ingress
$ helm install stable/nginx-ingress
$ helm repo add monocular https://kubernetes-helm.github.io/monocular
$ helm install monocular/monocular
```

![Helm monocular界面](../images/helm-monocular-jimmysong.jpg)

因为nginx ingress配置问题，因为官方的chart中api与ui使用的是同样的domain name，我使用的是traefik ingress，`api`访问不到，所以加载不了chart。

## 参考

[Monocular UI]()

[Helm Chart - GitHub](https://github.com/kubernetes/helm/blob/master/docs/charts.md)